//! OFFLINE Desktop – Tauri-Hülle um den Kern. Die Oberfläche ist dieselbe wie im Web-Prototyp (`web/`).
//! Alles, was Pakete prüft oder auf die Platte schreibt, läuft hier in Rust; die Oberfläche ruft nur Befehle auf.

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use offline_kern::{aufraeumen, datum, einspielen, paket::datei_pfad, paket_pruefen, Einspielergebnis, Manifest, OeffentlicherSchluessel};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

/// Die öffentlichen Schlüssel werden beim Bauen in die App eingebettet – so verlangt es die Spezifikation.
const SCHLUESSEL_JSON: &str = include_str!("../../../schluessel/oeffentlich.json");

struct Zustand {
    wurzel: PathBuf,
    schluessel: Vec<OeffentlicherSchluessel>,
    /// verhindert zwei gleichzeitige Einspielvorgänge
    sperre: Mutex<()>,
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

// ---------- Befehle ----------

#[tauri::command]
fn datenordner(z: State<Zustand>) -> String {
    z.wurzel.display().to_string()
}

/// Alle installierten Pakete – jedes wird beim Lesen erneut geprüft. Ein beschädigtes Paket taucht nicht auf.
#[tauri::command]
fn installierte(z: State<Zustand>) -> Vec<Paket> {
    let mut aus = Vec::new();
    let Ok(eintraege) = std::fs::read_dir(&z.wurzel) else { return aus };
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
    let (_, ordner) = offline_kern::einspielen::installierte_version(&z.wurzel, &id).ok_or("nicht installiert")?;
    paket_aus_ordner(&ordner, &z.schluessel)
}

/// Einspielen aus einem Ordner (USB-Stick, Download-Ordner).
#[tauri::command]
fn einspielen_ordner(z: State<Zustand>, pfad: String, downgrade: bool) -> Result<Einspielergebnis, String> {
    let _s = z.sperre.lock().map_err(|_| "Ein anderer Vorgang läuft")?;
    einspielen(Path::new(&pfad), &z.wurzel, &z.schluessel, &datum::heute(), downgrade).map_err(|e| e.0)
}

/// Einspielen von Dateien, die die Oberfläche geladen hat (Katalog-Download kleiner Textpakete).
/// Die Bytes landen erst in einem Zwischenordner; geprüft wird ausschließlich vom Kern.
#[tauri::command]
fn einspielen_bytes(z: State<Zustand>, dateien: Vec<Uebertragung>, downgrade: bool) -> Result<Einspielergebnis, String> {
    let _s = z.sperre.lock().map_err(|_| "Ein anderer Vorgang läuft")?;
    let tmp = z.wurzel.join(format!(".eingang-{}", std::process::id()));
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
        einspielen(&tmp, &z.wurzel, &z.schluessel, &datum::heute(), downgrade).map_err(|e| e.0)
    })();
    let _ = std::fs::remove_dir_all(&tmp);
    ergebnis
}

#[tauri::command]
fn entfernen(z: State<Zustand>, id: String) -> Result<(), String> {
    let _s = z.sperre.lock().map_err(|_| "Ein anderer Vorgang läuft")?;
    let (_, ordner) = offline_kern::einspielen::installierte_version(&z.wurzel, &id).ok_or("nicht installiert")?;
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
                // /media/<benutzer>/<stick> oder /media/<stick>
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
        // Nur Manifest + Signatur prüfen – die Dateien werden beim Einspielen gehasht.
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

#[tauri::command]
fn aufraeumen_start(z: State<Zustand>) -> Vec<String> {
    aufraeumen(&z.wurzel).unwrap_or_default()
}

pub fn start() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app: &mut tauri::App| {
            let wurzel = app.path().app_data_dir().expect("Datenordner").join("pakete");
            std::fs::create_dir_all(&wurzel)?;
            for m in aufraeumen(&wurzel).unwrap_or_default() {
                eprintln!("Aufräumen: {m}");
            }
            app.manage(Zustand { wurzel, schluessel: schluessel_laden(), sperre: Mutex::new(()) });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            datenordner, installierte, paket_lesen, einspielen_ordner, einspielen_bytes, entfernen, stick_suchen, aufraeumen_start
        ])
        .run(tauri::generate_context!())
        .expect("OFFLINE konnte nicht starten");
}

#[allow(dead_code)]
fn _typen(_: &AppHandle) {}
