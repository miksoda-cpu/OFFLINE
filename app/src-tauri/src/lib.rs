//! OFFLINE Desktop – Tauri-Hülle um den Kern. Die Oberfläche ist dieselbe wie im Web-Prototyp (`web/`).
//! Alles, was Pakete prüft, lädt oder auf die Platte schreibt, läuft hier in Rust; die Oberfläche ruft nur Befehle auf.

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use offline_kern::abo::{self, Einstellungen, Verbindung, Zustand as AboZustand};
use offline_kern::lokalserver::Lokalserver;
use offline_kern::{aufraeumen, datum, download, einspielen, paket::datei_pfad, paket_pruefen, Auftrag, Einspielergebnis, Fortschritt, Katalog, Manifest, OeffentlicherSchluessel};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};

/// Die öffentlichen Schlüssel werden beim Bauen in die App eingebettet – so verlangt es die Spezifikation.
const SCHLUESSEL_JSON: &str = include_str!("../../../schluessel/oeffentlich.json");

#[derive(Serialize, Deserialize, Default, Clone)]
struct Abo {
    einstellungen: Einstellungen,
    zustand: AboZustand,
    /// abweichender Speicherort (z. B. externe Platte); None = Standard-Datenordner
    speicherort: Option<PathBuf>,
}

struct Zustand {
    datenordner: PathBuf,
    schluessel: Vec<OeffentlicherSchluessel>,
    abo: Mutex<Abo>,
    /// verhindert zwei gleichzeitige Einspiel-/Ladevorgänge
    sperre: Mutex<()>,
    abbruch: Arc<AtomicBool>,
    laeuft: Arc<AtomicBool>,
    /// was die Oberfläche zuletzt gemeldet hat: online?, getaktet?, Zeitzonenversatz in Minuten (UTC → lokal)
    verbindung: Mutex<(bool, Option<bool>, i64)>,
    /// lokaler Dateiserver über dem Paketordner (Karten, Medien)
    lokal: Mutex<Option<Lokalserver>>,
    /// laufender kiwix-serve (Wikipedia & Co.)
    kiwix: Mutex<Option<Kiwix>>,
}

struct Kiwix {
    kind: std::process::Child,
    port: u16,
    zims: Vec<PathBuf>,
}

impl Drop for Kiwix {
    fn drop(&mut self) {
        let _ = self.kind.kill();
        let _ = self.kind.wait();
    }
}

/// Pfad des mitgelieferten Programms: liegt neben der ausführbaren Datei der App.
fn sidecar(name: &str) -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let ordner = exe.parent()?;
    let kandidaten = if cfg!(windows) { vec![format!("{name}.exe")] } else { vec![name.to_string()] };
    kandidaten.into_iter().map(|k| ordner.join(k)).find(|p| p.exists())
}

fn freier_port() -> u16 {
    std::net::TcpListener::bind("127.0.0.1:0").and_then(|l| l.local_addr()).map(|a| a.port()).unwrap_or(8181)
}

/// Alle ZIM-Dateien der installierten Pakete.
fn zim_dateien(wurzel: &Path) -> Vec<PathBuf> {
    let mut aus = Vec::new();
    let Ok(e) = std::fs::read_dir(wurzel) else { return aus };
    for d in e.flatten() {
        let name = d.file_name().to_string_lossy().to_string();
        if name.ends_with(".neu") || name.ends_with(".alt") { continue; }
        let Ok(m) = std::fs::read(d.path().join("paket.json")).and_then(|b| serde_json::from_slice::<Manifest>(&b).map_err(std::io::Error::other)) else { continue };
        if m.art != "zim" { continue; }
        for f in &m.dateien {
            if f.pfad.ends_with(".zim") { aus.push(datei_pfad(&d.path(), &f.pfad)); }
        }
    }
    aus.sort();
    aus
}

/// kiwix-serve (neu) starten, wenn sich die ZIM-Liste geändert hat. Ohne ZIMs läuft nichts.
fn kiwix_abgleichen(z: &Zustand) -> Result<Option<u16>, String> {
    let zims = zim_dateien(&z.wurzel());
    let mut k = z.kiwix.lock().map_err(|_| "kiwix gesperrt")?;
    if let Some(l) = k.as_ref() {
        if l.zims == zims { return Ok(Some(l.port)); }
    }
    *k = None; // stoppt den alten (Drop)
    if zims.is_empty() { return Ok(None); }
    let prog = sidecar("kiwix-serve").ok_or("kiwix-serve ist in dieser Installation nicht enthalten")?;
    let port = freier_port();
    let mut cmd = std::process::Command::new(prog);
    cmd.arg("--address").arg("127.0.0.1").arg("--port").arg(port.to_string()).arg("--nolibrarybutton").args(&zims)
        .stdin(std::process::Stdio::null()).stdout(std::process::Stdio::null()).stderr(std::process::Stdio::null());
    #[cfg(windows)]
    { use std::os::windows::process::CommandExt; cmd.creation_flags(0x0800_0000); } // CREATE_NO_WINDOW
    let kind = cmd.spawn().map_err(|e| format!("kiwix-serve startet nicht: {e}"))?;
    // kurz warten, bis der Port antwortet
    for _ in 0..40 {
        if std::net::TcpStream::connect(("127.0.0.1", port)).is_ok() { break; }
        std::thread::sleep(Duration::from_millis(100));
    }
    *k = Some(Kiwix { kind, port, zims });
    Ok(Some(port))
}

impl Zustand {
    fn wurzel(&self) -> PathBuf {
        self.abo.lock().map(|a| a.speicherort.clone()).ok().flatten().unwrap_or_else(|| self.datenordner.join("pakete"))
    }
    fn abo_datei(&self) -> PathBuf {
        self.datenordner.join("abo.json")
    }
    fn abo_speichern(&self) {
        if let Ok(a) = self.abo.lock() {
            if let Ok(t) = serde_json::to_vec_pretty(&*a) {
                let _ = std::fs::write(self.abo_datei(), t);
            }
        }
    }
}

#[derive(Serialize)]
struct Paket {
    manifest: Manifest,
    /// Textdateien des Pakets (nur art "inhalt"); Pfad → Inhalt
    inhalt: BTreeMap<String, String>,
    ordner: String,
    schluessel: String,
}

#[derive(Serialize)]
struct Fund {
    pfad: String,
    id: String,
    version: String,
    titel: String,
    groesse: u64,
}

#[derive(Deserialize)]
struct Uebertragung {
    pfad: String,
    /// base64
    daten: String,
}

#[derive(Serialize)]
struct KatalogAntwort {
    katalog: Katalog,
    schluessel: String,
    veraltet: bool,
    geladen: String,
}

#[derive(Serialize, Clone)]
struct AboErgebnis {
    zeitpunkt: String,
    ausgeloest: String,
    aktualisiert: Vec<Einspielergebnis>,
    fehler: Vec<String>,
}

fn schluessel_laden() -> Vec<OeffentlicherSchluessel> {
    #[derive(Deserialize)]
    struct L { schluessel: Vec<OeffentlicherSchluessel> }
    serde_json::from_str::<L>(SCHLUESSEL_JSON).expect("eingebettete Schlüsselliste ist gültig").schluessel
}

fn paket_aus_ordner(ordner: &Path, schluessel: &[OeffentlicherSchluessel]) -> Result<Paket, String> {
    let g = paket_pruefen(ordner, schluessel, &datum::heute()).map_err(|e| e.0)?;
    let mut inhalt = BTreeMap::new();
    if g.manifest.art == "inhalt" {
        for d in &g.manifest.dateien {
            if let Ok(t) = std::fs::read_to_string(datei_pfad(ordner, &d.pfad)) {
                inhalt.insert(d.pfad.clone(), t);
            }
        }
    }
    Ok(Paket { manifest: g.manifest, inhalt, ordner: ordner.display().to_string(), schluessel: g.schluessel })
}

fn lokale_hhmm(versatz_min: i64) -> String {
    let s = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0) + versatz_min * 60;
    let rest = s.rem_euclid(86_400);
    format!("{:02}:{:02}", rest / 3600, (rest % 3600) / 60)
}

fn unix_jetzt() -> i64 {
    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0)
}

// ---------- Befehle: Pakete ----------

#[derive(Serialize)]
struct AppInfo { version: &'static str, tauri: &'static str, system: &'static str, arch: &'static str }

/// Version und Plattform der App – für die Statuszeile.
#[tauri::command]
fn app_info() -> AppInfo {
    let system = match std::env::consts::OS { "macos" => "macOS", "windows" => "Windows", "linux" => "Linux", s => s };
    let arch = match std::env::consts::ARCH { "aarch64" => "Apple Silicon", "x86_64" => "x86_64", a => a };
    AppInfo { version: env!("CARGO_PKG_VERSION"), tauri: tauri::VERSION, system, arch }
}

#[tauri::command]
fn datenordner(z: State<Zustand>) -> String {
    z.wurzel().display().to_string()
}

/// Alle installierten Pakete – jedes wird beim Lesen erneut geprüft. Ein beschädigtes Paket taucht nicht auf.
#[tauri::command]
fn installierte(z: State<Zustand>) -> Vec<Paket> {
    let mut aus = Vec::new();
    let Ok(eintraege) = std::fs::read_dir(z.wurzel()) else { return aus };
    for e in eintraege.flatten() {
        let name = e.file_name().to_string_lossy().to_string();
        if name.ends_with(".neu") || name.ends_with(".alt") || !e.path().join("paket.json").exists() {
            continue;
        }
        if let Ok(p) = paket_aus_ordner(&e.path(), &z.schluessel) {
            aus.push(p);
        }
    }
    aus.sort_by(|a, b| a.manifest.id.cmp(&b.manifest.id));
    aus
}

#[tauri::command]
fn paket_lesen(z: State<Zustand>, id: String) -> Result<Paket, String> {
    let (_, ordner) = einspielen::installierte_version(&z.wurzel(), &id).ok_or("nicht installiert")?;
    paket_aus_ordner(&ordner, &z.schluessel)
}

/// Einspielen aus einem Ordner (USB-Stick, Download-Ordner).
#[tauri::command]
fn einspielen_ordner(z: State<Zustand>, pfad: String, downgrade: bool) -> Result<Einspielergebnis, String> {
    let _s = z.sperre.try_lock().map_err(|_| "Ein anderer Vorgang läuft")?;
    einspielen::einspielen(Path::new(&pfad), &z.wurzel(), &z.schluessel, &datum::heute(), downgrade).map_err(|e| e.0)
}

/// Einspielen von Dateien, die die Oberfläche geladen hat (Fallback für kleine Textpakete).
#[tauri::command]
fn einspielen_bytes(z: State<Zustand>, dateien: Vec<Uebertragung>, downgrade: bool) -> Result<Einspielergebnis, String> {
    let _s = z.sperre.try_lock().map_err(|_| "Ein anderer Vorgang läuft")?;
    let wurzel = z.wurzel();
    let tmp = wurzel.join(format!(".eingang-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&tmp);
    let ergebnis = (|| {
        for d in &dateien {
            let ok = d.pfad == "paket.json" || d.pfad == "paket.sig" || offline_kern::pfad_gueltig(&d.pfad);
            if !ok {
                return Err(format!("Pfad unzulässig: {}", d.pfad));
            }
            let ziel = datei_pfad(&tmp, &d.pfad);
            if let Some(eltern) = ziel.parent() {
                std::fs::create_dir_all(eltern).map_err(|e| e.to_string())?;
            }
            let bytes = B64.decode(&d.daten).map_err(|_| format!("Daten nicht lesbar: {}", d.pfad))?;
            std::fs::write(&ziel, bytes).map_err(|e| e.to_string())?;
        }
        einspielen::einspielen(&tmp, &wurzel, &z.schluessel, &datum::heute(), downgrade).map_err(|e| e.0)
    })();
    let _ = std::fs::remove_dir_all(&tmp);
    ergebnis
}

#[tauri::command]
fn entfernen(z: State<Zustand>, id: String) -> Result<(), String> {
    let _s = z.sperre.try_lock().map_err(|_| "Ein anderer Vorgang läuft")?;
    let (_, ordner) = einspielen::installierte_version(&z.wurzel(), &id).ok_or("nicht installiert")?;
    std::fs::remove_dir_all(ordner).map_err(|e| e.to_string())
}

/// Sucht auf eingehängten Datenträgern nach Paketordnern (bis zwei Ebenen tief).
#[tauri::command]
fn stick_suchen(z: State<Zustand>) -> Vec<Fund> {
    let mut wurzeln: Vec<PathBuf> = Vec::new();
    #[cfg(target_os = "windows")]
    for b in b'D'..=b'Z' {
        let p = PathBuf::from(format!("{}:\\", b as char));
        if p.exists() { wurzeln.push(p); }
    }
    #[cfg(target_os = "macos")]
    wurzeln.push(PathBuf::from("/Volumes"));
    #[cfg(target_os = "linux")]
    for basis in ["/media", "/run/media", "/mnt"] {
        if let Ok(e) = std::fs::read_dir(basis) {
            for d in e.flatten() {
                if d.path().join("paket.json").exists() || std::fs::read_dir(d.path()).map(|x| x.count() > 0).unwrap_or(false) {
                    wurzeln.push(d.path());
                }
            }
        }
    }
    let mut funde = Vec::new();
    for w in wurzeln {
        suche(&w, 2, &z.schluessel, &mut funde);
    }
    funde
}

fn suche(ordner: &Path, tiefe: u8, schluessel: &[OeffentlicherSchluessel], funde: &mut Vec<Fund>) {
    if ordner.join("paket.json").exists() {
        if let Ok(bytes) = std::fs::read(ordner.join("paket.json")) {
            let sig = std::fs::read(ordner.join("paket.sig")).ok().and_then(|b| serde_json::from_slice(&b).ok());
            if let Some(sig) = sig {
                if offline_kern::pruefe_signatur(&bytes, &sig, schluessel, "pakete", &datum::heute()).is_ok() {
                    if let Ok(m) = serde_json::from_slice::<Manifest>(&bytes) {
                        funde.push(Fund { pfad: ordner.display().to_string(), id: m.id, version: m.version, titel: m.titel, groesse: m.groesse });
                    }
                }
            }
        }
        return;
    }
    if tiefe == 0 { return; }
    let Ok(e) = std::fs::read_dir(ordner) else { return };
    for d in e.flatten() {
        let name = d.file_name().to_string_lossy().to_string();
        if name.starts_with('.') || name == "System Volume Information" { continue; }
        if d.path().is_dir() {
            suche(&d.path(), tiefe - 1, schluessel, funde);
        }
    }
}

// ---------- Befehle: Update-Dienst ----------

#[tauri::command]
fn abo_lesen(z: State<Zustand>) -> Abo {
    z.abo.lock().map(|a| a.clone()).unwrap_or_default()
}

#[tauri::command]
fn abo_schreiben(z: State<Zustand>, einstellungen: Einstellungen) -> Abo {
    if let Ok(mut a) = z.abo.lock() {
        a.einstellungen = einstellungen;
    }
    z.abo_speichern();
    abo_lesen(z)
}

/// Die Oberfläche meldet, was der Browser über die Verbindung weiß (navigator.onLine) und die Zeitzone.
#[tauri::command]
fn verbindung_melden(z: State<Zustand>, online: bool, getaktet: Option<bool>, versatz_min: i64) {
    if let Ok(mut v) = z.verbindung.lock() {
        *v = (online, getaktet, versatz_min);
    }
}

/// Speicherort für Pakete ändern (z. B. externe Platte). Bereits installierte Pakete bleiben am alten Ort;
/// die App liest ab jetzt nur den neuen. Rückgabe: der wirksame Ordner.
#[tauri::command]
fn speicherort_setzen(z: State<Zustand>, pfad: Option<String>) -> Result<String, String> {
    let _s = z.sperre.try_lock().map_err(|_| "Ein anderer Vorgang läuft")?;
    let neu = match pfad {
        Some(p) => {
            let p = PathBuf::from(p).join("OFFLINE-Pakete");
            std::fs::create_dir_all(&p).map_err(|e| format!("Ordner nicht anlegbar: {e}"))?;
            let probe = p.join(".schreibprobe");
            std::fs::write(&probe, b"ok").map_err(|e| format!("Ordner nicht beschreibbar: {e}"))?;
            let _ = std::fs::remove_file(probe);
            Some(p)
        }
        None => None,
    };
    if let Ok(mut a) = z.abo.lock() {
        a.speicherort = neu;
    }
    z.abo_speichern();
    let wurzel = z.wurzel();
    if let Ok(mut l) = z.lokal.lock() {
        if let Some(alt) = l.take() { alt.stoppen(); }
        *l = Lokalserver::starten(wurzel.clone()).ok();
    }
    *z.kiwix.lock().map_err(|_| "gesperrt")? = None;
    Ok(wurzel.display().to_string())
}

fn katalog_holen(z: &Zustand) -> Result<KatalogAntwort, String> {
    let (url, zuletzt) = z.abo.lock().map(|a| (a.einstellungen.katalog_url.clone(), a.zustand.katalog_erstellt.clone())).map_err(|_| "Zustand gesperrt")?;
    let (g, _) = download::katalog_laden(&url, &z.schluessel, &datum::heute(), &datum::jetzt_iso(), zuletzt.as_deref()).map_err(|e| e.0)?;
    if let Ok(mut a) = z.abo.lock() {
        a.zustand.katalog_erstellt = Some(g.katalog.erstellt.clone());
    }
    z.abo_speichern();
    Ok(KatalogAntwort { katalog: g.katalog, schluessel: g.schluessel, veraltet: g.veraltet, geladen: datum::jetzt_iso() })
}

/// Katalog vom Update-Server holen – Signatur und Rollback-Schutz im Kern.
#[tauri::command]
async fn katalog_laden(app: AppHandle) -> Result<KatalogAntwort, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let z = app.state::<Zustand>();
        katalog_holen(&z)
    })
    .await
    .map_err(|e| e.to_string())?
}

fn paket_holen(app: &AppHandle, z: &Zustand, id: &str) -> Result<Einspielergebnis, String> {
    let k = katalog_holen(z)?;
    let eintrag = k.katalog.pakete.iter().find(|p| p.id == id).ok_or_else(|| format!("{id} ist nicht im Katalog"))?.clone();
    z.abbruch.store(false, Ordering::Relaxed);
    let app2 = app.clone();
    let mut melde = move |f: Fortschritt| { let _ = app2.emit("download-fortschritt", &f); };
    let mut a = Auftrag { bekannte: &z.schluessel, heute: &datum::heute(), jetzt_iso: &datum::jetzt_iso(), abbruch: z.abbruch.clone(), fortschritt: &mut melde };
    let e = download::paket_laden(&k.katalog.basis, &eintrag, &z.wurzel(), &mut a).map_err(|e| e.0)?;
    let _ = app.emit("download-fertig", &e);
    Ok(e)
}

/// Paket aus dem Katalog laden – in Teilen, fortsetzbar, geprüft, atomar eingespielt. Fortschritt per Ereignis.
#[tauri::command]
async fn paket_laden(app: AppHandle, id: String) -> Result<Einspielergebnis, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let z = app.state::<Zustand>();
        let _s = z.sperre.try_lock().map_err(|_| "Ein anderer Vorgang läuft")?;
        z.laeuft.store(true, Ordering::Relaxed);
        let r = paket_holen(&app, &z, &id);
        z.laeuft.store(false, Ordering::Relaxed);
        r
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
fn download_abbrechen(z: State<Zustand>) {
    z.abbruch.store(true, Ordering::Relaxed);
}

/// Alle installierten Pakete auf den Katalogstand bringen. `ausgeloest`: "manuell" oder "abo".
fn updates_ausfuehren(app: &AppHandle, z: &Zustand, ausgeloest: &str) -> AboErgebnis {
    let mut erg = AboErgebnis { zeitpunkt: datum::jetzt_iso(), ausgeloest: ausgeloest.into(), aktualisiert: vec![], fehler: vec![] };
    let k = match katalog_holen(z) {
        Ok(k) => k,
        Err(e) => { erg.fehler.push(e); return erg; }
    };
    let wurzel = z.wurzel();
    for e in &k.katalog.pakete {
        if e.status != "verfuegbar" { continue; }
        let Some((v, _)) = einspielen::installierte_version(&wurzel, &e.id) else { continue };
        if offline_kern::version_vergleich(&e.version, &v) != std::cmp::Ordering::Greater { continue; }
        match paket_holen(app, z, &e.id) {
            Ok(r) => erg.aktualisiert.push(r),
            Err(f) => erg.fehler.push(format!("{}: {f}", e.titel)),
        }
    }
    if let Ok(mut a) = z.abo.lock() {
        a.zustand.letzte_pruefung = Some(unix_jetzt());
        a.zustand.letzter_fehler = erg.fehler.first().cloned();
    }
    z.abo_speichern();
    let _ = app.emit("abo-ergebnis", &erg);
    erg
}

/// „Jetzt prüfen“: Katalog laden und alle installierten Pakete aktualisieren.
#[tauri::command]
async fn updates_jetzt(app: AppHandle) -> Result<AboErgebnis, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let z = app.state::<Zustand>();
        let _s = z.sperre.try_lock().map_err(|_| "Ein anderer Vorgang läuft")?;
        z.laeuft.store(true, Ordering::Relaxed);
        let r = updates_ausfuehren(&app, &z, "manuell");
        z.laeuft.store(false, Ordering::Relaxed);
        Ok(r)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Warum das Abo gerade nicht prüft (oder null = jetzt fällig) – für die Anzeige.
#[tauri::command]
fn abo_status(z: State<Zustand>) -> Option<String> {
    let (online, getaktet, versatz) = z.verbindung.lock().map(|v| *v).unwrap_or((false, None, 0));
    let a = z.abo.lock().ok()?;
    abo::warum_nicht(&a.einstellungen, &a.zustand, Verbindung { online, getaktet }, unix_jetzt(), &lokale_hhmm(versatz)).map(String::from)
}

// ---------- Befehle: Inhalte anzeigen ----------

/// URL des lokalen Dateiservers (Wurzel = Paketordner), z. B. für PMTiles-Karten.
#[tauri::command]
fn lokal_url(z: State<Zustand>) -> Option<String> {
    z.lokal.lock().ok()?.as_ref().map(|l| l.url())
}

/// URL von kiwix-serve – startet ihn bei Bedarf. None, wenn kein ZIM-Paket installiert ist.
#[tauri::command]
fn kiwix_url(z: State<Zustand>) -> Result<Option<String>, String> {
    Ok(kiwix_abgleichen(&z)?.map(|p| format!("http://127.0.0.1:{p}/")))
}

/// Eigenes Fenster für Inhalte (kiwix-serve-Seiten). Nur lokale Adressen.
#[tauri::command]
fn fenster_oeffnen(app: AppHandle, url: String, titel: String) -> Result<(), String> {
    if !url.starts_with("http://127.0.0.1:") { return Err("Nur lokale Adressen".into()); }
    let label = format!("inhalt-{}", url.bytes().fold(0u32, |h, b| h.wrapping_mul(31).wrapping_add(b as u32)));
    if let Some(w) = app.get_webview_window(&label) { let _ = w.set_focus(); return Ok(()); }
    let u: tauri::Url = url.parse().map_err(|_| "Adresse ungültig")?;
    tauri::WebviewWindowBuilder::new(&app, label, tauri::WebviewUrl::External(u))
        .title(titel).inner_size(1100.0, 780.0).build().map_err(|e| e.to_string())?;
    Ok(())
}

/// Alle Daten der App löschen (Pakete, Einstellungen). Die Oberfläche sichert das doppelt ab.
#[tauri::command]
fn alles_loeschen(z: State<Zustand>, bestaetigung: String) -> Result<String, String> {
    if bestaetigung.trim().to_uppercase() != "LÖSCHEN" { return Err("Bestätigung fehlt".into()); }
    let _s = z.sperre.try_lock().map_err(|_| "Ein anderer Vorgang läuft")?;
    *z.kiwix.lock().map_err(|_| "gesperrt")? = None;
    let wurzel = z.wurzel();
    let _ = std::fs::remove_dir_all(&wurzel);
    let _ = std::fs::remove_dir_all(z.datenordner.join("pakete"));
    let _ = std::fs::remove_file(z.abo_datei());
    if let Ok(mut a) = z.abo.lock() { *a = Abo::default(); }
    let anleitung = if cfg!(target_os = "windows") { "Einstellungen → Apps → OFFLINE → Deinstallieren." }
        else if cfg!(target_os = "macos") { "OFFLINE aus dem Ordner „Programme“ in den Papierkorb ziehen." }
        else { "Paket „offline“ mit dem Paketmanager entfernen oder die AppImage-Datei löschen." };
    Ok(anleitung.into())
}

#[tauri::command]
fn aufraeumen_start(z: State<Zustand>) -> Vec<String> {
    aufraeumen(&z.wurzel()).unwrap_or_default()
}

/// Hintergrund: jede Minute prüfen, ob das Abo fällig ist.
fn abo_schleife(app: AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(60));
        let z = app.state::<Zustand>();
        if z.laeuft.load(Ordering::Relaxed) { continue; }
        let faellig = {
            let (online, getaktet, versatz) = z.verbindung.lock().map(|v| *v).unwrap_or((false, None, 0));
            z.abo.lock().map(|a| abo::faellig(&a.einstellungen, &a.zustand, Verbindung { online, getaktet }, unix_jetzt(), &lokale_hhmm(versatz))).unwrap_or(false)
        };
        if !faellig { continue; }
        let Ok(_s) = z.sperre.try_lock() else { continue };
        z.laeuft.store(true, Ordering::Relaxed);
        updates_ausfuehren(&app, &z, "abo");
        z.laeuft.store(false, Ordering::Relaxed);
    });
}

pub fn start() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app: &mut tauri::App| {
            let datenordner = app.path().app_data_dir().expect("Datenordner");
            std::fs::create_dir_all(&datenordner)?;
            let abo: Abo = std::fs::read(datenordner.join("abo.json")).ok().and_then(|b| serde_json::from_slice(&b).ok()).unwrap_or_default();
            let z = Zustand {
                datenordner,
                schluessel: schluessel_laden(),
                abo: Mutex::new(abo),
                sperre: Mutex::new(()),
                abbruch: Arc::new(AtomicBool::new(false)),
                laeuft: Arc::new(AtomicBool::new(false)),
                verbindung: Mutex::new((false, None, 0)),
                lokal: Mutex::new(None),
                kiwix: Mutex::new(None),
            };
            let wurzel = z.wurzel();
            std::fs::create_dir_all(&wurzel)?;
            for m in aufraeumen(&wurzel).unwrap_or_default() {
                eprintln!("Aufräumen: {m}");
            }
            match Lokalserver::starten(wurzel.clone()) {
                Ok(l) => { if let Ok(mut s) = z.lokal.lock() { *s = Some(l); } }
                Err(e) => eprintln!("Lokaler Server startet nicht: {e}"),
            }
            app.manage(z);
            abo_schleife(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            datenordner, installierte, paket_lesen, einspielen_ordner, einspielen_bytes, entfernen, stick_suchen, aufraeumen_start,
            abo_lesen, abo_schreiben, verbindung_melden, speicherort_setzen, katalog_laden, paket_laden, download_abbrechen, updates_jetzt, abo_status,
            lokal_url, kiwix_url, fenster_oeffnen, alles_loeschen, app_info
        ])
        .run(tauri::generate_context!())
        .expect("OFFLINE konnte nicht starten");
}
