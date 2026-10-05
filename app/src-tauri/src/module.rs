//! Module (`art = "modul"`) in der Desktop-App: öffnen in der Sandbox, Speicher je Modul, aktiv/inaktiv, löschen.
//! SICHERHEIT.md, Abschnitt Module. Die Oberfläche (web/modul-host.js) prüft jede Nachricht des Moduls, bevor sie
//! einen dieser Befehle aufruft; die Modul-Id setzt immer die Oberfläche, nie das Modul.

use super::{paket_aus_ordner, Zustand};
use offline_kern::{einspielen, modulserver::Modulserver, paket::datei_pfad};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;
use std::path::PathBuf;
use tauri::{AppHandle, State};

/// Die Brücke `window.offline`, die in jedes Modul eingefügt wird.
const BRUECKE: &str = include_str!("../../../web/modul-bruecke.js");
/// Höchstens so viele Bytes speichert ein Modul (alle Schlüssel zusammen, als JSON).
pub const SPEICHER_GRENZE: usize = 1024 * 1024;

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct ModulZustand {
    pub aktiv: bool,
}

fn ordner(z: &Zustand) -> PathBuf {
    z.datenordner.join("module")
}
fn daten_datei(z: &Zustand, id: &str) -> PathBuf {
    ordner(z).join(format!("{id}.json"))
}
fn zustand_datei(z: &Zustand) -> PathBuf {
    ordner(z).join("zustand.json")
}

fn id_ok(id: &str) -> Result<(), String> {
    if offline_kern::manifest::id_gueltig(id) { Ok(()) } else { Err("Modul-Id ungültig".into()) }
}

/// Gleiche Regel wie in web/modul-host.js.
fn schluessel_ok(k: &str) -> Result<(), String> {
    let ok = !k.is_empty()
        && k.len() <= 64
        && !k.contains("..")
        && k.bytes().all(|b| b.is_ascii_alphanumeric() || matches!(b, b'_' | b'.' | b'-'))
        && !k.starts_with('.');
    if ok { Ok(()) } else { Err("Schlüssel ungültig (a–z, 0–9, _ . -, höchstens 64)".into()) }
}

fn schreiben_atomar(ziel: &PathBuf, bytes: &[u8]) -> Result<(), String> {
    std::fs::create_dir_all(ziel.parent().unwrap()).map_err(|e| e.to_string())?;
    let tmp = ziel.with_extension("json.neu");
    std::fs::write(&tmp, bytes).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, ziel).map_err(|e| e.to_string())
}

fn zustaende(z: &Zustand) -> BTreeMap<String, ModulZustand> {
    std::fs::read(zustand_datei(z)).ok().and_then(|b| serde_json::from_slice(&b).ok()).unwrap_or_default()
}

/// Neu geladene Module sind aktiv, bis man sie ausschaltet.
fn ist_aktiv(z: &Zustand, id: &str) -> bool {
    zustaende(z).get(id).map_or(true, |m| m.aktiv)
}

fn einschub(version: &str) -> String {
    let info = serde_json::json!({ "version": version, "alter": Value::Null });
    format!("<script>{}</script>", BRUECKE.replace("__OFFLINE_INFO__", &info.to_string()))
}

/// Installiertes Modul: Ordner, erneut vollständig geprüft (Signatur, Schlüssel passt zur Art, Prüfsummen).
fn modul_ordner(z: &Zustand, id: &str) -> Result<PathBuf, String> {
    id_ok(id)?;
    let (_, ordner) = einspielen::installierte_version(&z.wurzel(), id).ok_or("Modul ist nicht installiert")?;
    let p = paket_aus_ordner(&ordner, &z.schluessel)?;
    if p.manifest.art != "modul" {
        return Err("Dieses Paket ist kein Modul".into());
    }
    Ok(ordner)
}

/// Startet den Modulserver und gibt die Adresse für den iframe zurück. Ein bereits laufender Server des Moduls wird ersetzt.
#[tauri::command]
pub fn modul_oeffnen(app: AppHandle, z: State<Zustand>, id: String) -> Result<String, String> {
    let ordner = modul_ordner(&z, &id)?;
    if !ist_aktiv(&z, &id) {
        return Err("Das Modul ist ausgeschaltet.".into());
    }
    let srv = Modulserver::starten(datei_pfad(&ordner, "inhalt/modul"), einschub(&app.package_info().version.to_string())).map_err(|e| e.to_string())?;
    let url = srv.url();
    z.module.lock().map_err(|_| "gesperrt")?.insert(id, srv);
    Ok(url)
}

#[tauri::command]
pub fn modul_schliessen(z: State<Zustand>, id: String) {
    if let Ok(mut m) = z.module.lock() {
        m.remove(&id); // Drop stoppt den Server
    }
}

fn laeuft(z: &Zustand, id: &str) -> Result<(), String> {
    if z.module.lock().map_err(|_| "gesperrt")?.contains_key(id) { Ok(()) } else { Err("Modul ist nicht geöffnet".into()) }
}

fn daten_lesen(z: &Zustand, id: &str) -> BTreeMap<String, Value> {
    std::fs::read(daten_datei(z, id)).ok().and_then(|b| serde_json::from_slice(&b).ok()).unwrap_or_default()
}

#[tauri::command]
pub fn modul_speicher_lesen(z: State<Zustand>, id: String, schluessel: String) -> Result<Value, String> {
    id_ok(&id)?;
    schluessel_ok(&schluessel)?;
    laeuft(&z, &id)?;
    Ok(daten_lesen(&z, &id).remove(&schluessel).unwrap_or(Value::Null))
}

#[tauri::command]
pub fn modul_speicher_schreiben(z: State<Zustand>, id: String, schluessel: String, wert: Value) -> Result<(), String> {
    id_ok(&id)?;
    schluessel_ok(&schluessel)?;
    laeuft(&z, &id)?;
    let mut d = daten_lesen(&z, &id);
    if wert.is_null() { d.remove(&schluessel); } else { d.insert(schluessel, wert); }
    let bytes = serde_json::to_vec(&d).map_err(|e| e.to_string())?;
    if bytes.len() > SPEICHER_GRENZE {
        return Err("Der Speicher dieses Moduls ist voll (1 MB).".into());
    }
    schreiben_atomar(&daten_datei(&z, &id), &bytes)
}

/// Aktiv/inaktiv je installiertem Modul, dazu, ob es gespeicherte Daten hat.
#[derive(Serialize)]
pub struct ModulStand {
    aktiv: bool,
    daten_bytes: u64,
}

#[tauri::command]
pub fn module_stand(z: State<Zustand>) -> BTreeMap<String, ModulStand> {
    let zs = zustaende(&z);
    let mut aus = BTreeMap::new();
    for p in super::installierte(z.clone()) {
        if p.manifest.art != "modul" { continue; }
        let id = p.manifest.id.clone();
        let daten_bytes = std::fs::metadata(daten_datei(&z, &id)).map(|m| m.len()).unwrap_or(0);
        aus.insert(id.clone(), ModulStand { aktiv: zs.get(&id).map_or(true, |m| m.aktiv), daten_bytes });
    }
    aus
}

/// Inaktiv: Das Modul wird nicht geladen und läuft nicht (ein offener Server wird gestoppt). Der Speicherplatz bleibt belegt.
#[tauri::command]
pub fn modul_aktiv_setzen(z: State<Zustand>, id: String, aktiv: bool) -> Result<(), String> {
    modul_ordner(&z, &id)?;
    if !aktiv {
        if let Ok(mut m) = z.module.lock() { m.remove(&id); }
    }
    let mut zs = zustaende(&z);
    zs.insert(id, ModulZustand { aktiv });
    schreiben_atomar(&zustand_datei(&z), &serde_json::to_vec_pretty(&zs).map_err(|e| e.to_string())?)
}

/// Löschen in zwei Schritten: Die Oberfläche verlangt das getippte Wort „löschen“ und reicht es hier durch.
/// `daten`: auch die gespeicherten Daten des Moduls löschen (sonst bleiben sie für eine spätere Neuinstallation).
#[tauri::command]
pub fn modul_loeschen(z: State<Zustand>, id: String, bestaetigung: String, daten: bool) -> Result<(), String> {
    if bestaetigung.trim().to_lowercase() != "löschen" {
        return Err("Zum Löschen das Wort „löschen“ eintippen.".into());
    }
    id_ok(&id)?;
    let _s = z.sperre.try_lock().map_err(|_| "Ein anderer Vorgang läuft")?;
    let (_, paket) = einspielen::installierte_version(&z.wurzel(), &id).ok_or("Modul ist nicht installiert")?;
    if let Ok(mut m) = z.module.lock() { m.remove(&id); }
    std::fs::remove_dir_all(paket).map_err(|e| e.to_string())?;
    let mut zs = zustaende(&z);
    if zs.remove(&id).is_some() {
        let _ = schreiben_atomar(&zustand_datei(&z), &serde_json::to_vec_pretty(&zs).unwrap_or_default());
    }
    if daten {
        let _ = std::fs::remove_file(daten_datei(&z, &id));
    }
    Ok(())
}

// ---------- Vorschau und lokale Quelle ----------

use offline_kern::vorschau::{self, FolieMitBild};

/// Vorschau eines Katalogeintrags: Bilder vom Server, jedes gegen die Prüfsumme im zuletzt geprüften Katalog.
#[tauri::command]
pub async fn vorschau_katalog(app: AppHandle, id: String) -> Result<Vec<FolieMitBild>, String> {
    use tauri::Manager;
    tauri::async_runtime::spawn_blocking(move || {
        let z = app.state::<Zustand>();
        let k = z.letzter_katalog.lock().map_err(|_| "gesperrt")?.clone().ok_or("Katalog noch nicht geprüft")?;
        let e = k.pakete.iter().find(|p| p.id == id).ok_or("nicht im Katalog")?;
        vorschau::aus_katalog(&k.basis, e, &offline_kern::download::datei_holen).map_err(|e| e.0)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Vorschau eines Paketordners (lokale Quelle, Stick) – das Paket wird dabei vollständig geprüft.
#[tauri::command]
pub fn vorschau_ordner(z: State<Zustand>, pfad: String) -> Result<Vec<FolieMitBild>, String> {
    vorschau::aus_ordner(std::path::Path::new(&pfad), &z.schluessel, &offline_kern::datum::heute()).map_err(|e| e.0)
}

/// Vorschau eines installierten Pakets.
#[tauri::command]
pub fn vorschau_installiert(z: State<Zustand>, id: String) -> Result<Vec<FolieMitBild>, String> {
    id_ok(&id)?;
    let (_, ordner) = einspielen::installierte_version(&z.wurzel(), &id).ok_or("nicht installiert")?;
    vorschau::aus_ordner(&ordner, &z.schluessel, &offline_kern::datum::heute()).map_err(|e| e.0)
}

/// Ein Paket in einer lokalen Quelle – so, wie die Paketseite es als Katalogkarte zeigt.
#[derive(Serialize)]
pub struct LokalesPaket {
    pfad: String,
    id: String,
    version: String,
    titel: String,
    beschreibung: String,
    art: String,
    groesse: u64,
    alter_ab: Option<u32>,
    kategorie: Option<String>,
    ki_generiert: Option<bool>,
}

/// Signierte Pakete in einem Ordner (bis zwei Ebenen tief), z. B. die Redaktionsablage mit noch nicht
/// veröffentlichten Modulen. Nur Pakete, deren Signatur und Schlüssel zur Art passen; geladen wird wie vom Stick.
#[tauri::command]
pub fn lokale_pakete(z: State<Zustand>, pfad: String) -> Vec<LokalesPaket> {
    fn suche(o: &std::path::Path, tiefe: u8, z: &Zustand, aus: &mut Vec<LokalesPaket>) {
        if let (Ok(bytes), Some(sig)) = (std::fs::read(o.join("paket.json")), std::fs::read(o.join("paket.sig")).ok().and_then(|b| serde_json::from_slice(&b).ok())) {
            if let Ok((m, _)) = offline_kern::manifest_signiert_pruefen(&bytes, &sig, &z.schluessel, &offline_kern::datum::heute()) {
                aus.push(LokalesPaket { pfad: o.display().to_string(), id: m.id, version: m.version, titel: m.titel, beschreibung: m.beschreibung, art: m.art, groesse: m.groesse, alter_ab: m.alter_ab, kategorie: m.kategorie, ki_generiert: m.ki_generiert });
            }
            return;
        }
        if tiefe == 0 { return; }
        let Ok(e) = std::fs::read_dir(o) else { return };
        for e in e.flatten() {
            if e.path().is_dir() && !e.file_name().to_string_lossy().starts_with('.') { suche(&e.path(), tiefe - 1, z, aus); }
        }
    }
    let mut aus = Vec::new();
    suche(std::path::Path::new(&pfad), 2, &z, &mut aus);
    aus.sort_by(|a, b| a.id.cmp(&b.id).then(b.version.cmp(&a.version)));
    aus.dedup_by(|a, b| a.id == b.id); // je Paket die neueste Version
    aus
}

/// Nur in Entwickler-Builds: einen beliebigen Ordner als Modul öffnen, ohne Signatur – für das bösartige Testmodul
/// (werkzeug/testmodule/boese). In einer ausgelieferten App gibt es diesen Weg nicht.
#[tauri::command]
pub fn modul_test_oeffnen(app: AppHandle, z: State<Zustand>, pfad: String) -> Result<String, String> {
    if !cfg!(debug_assertions) {
        return Err("Nur in Entwickler-Builds.".into());
    }
    let srv = Modulserver::starten(PathBuf::from(pfad), einschub(&app.package_info().version.to_string())).map_err(|e| e.to_string())?;
    let url = srv.url();
    z.module.lock().map_err(|_| "gesperrt")?.insert("modul-test".into(), srv);
    Ok(url)
}

/// Druckansicht des Hauptfensters (Druck aus einem Modul: die Oberfläche hat den Text vorher bereinigt).
#[tauri::command]
pub fn drucken(fenster: tauri::WebviewWindow) -> Result<(), String> {
    fenster.print().map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Auftrag 2026-10-05-04: Sperren des Tresors darf die Daten der Module und ihren Aktiv-Stand nicht löschen.
    #[test]
    fn tresor_sperren_behaelt_moduldaten() {
        let dir = std::env::temp_dir().join(format!("offline-sperren-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        let z = Zustand::fuer_test(dir.clone());
        // Modul aktiv, Speicher schreiben
        let mut zs = BTreeMap::new();
        zs.insert("wichteln".to_string(), ModulZustand { aktiv: true });
        schreiben_atomar(&zustand_datei(&z), &serde_json::to_vec(&zs).unwrap()).unwrap();
        let mut d = BTreeMap::new();
        d.insert("runden".to_string(), serde_json::json!([1, 2, 3]));
        schreiben_atomar(&daten_datei(&z, "wichteln"), &serde_json::to_vec(&d).unwrap()).unwrap();
        // Tresor sperren
        super::super::sperren(&z);
        // Speicher lesen: der Wert ist noch da, das Modul ist noch aktiv
        assert_eq!(daten_lesen(&z, "wichteln").get("runden"), Some(&serde_json::json!([1, 2, 3])), "Speicher des Moduls nach dem Sperren");
        assert!(zustaende(&z).get("wichteln").map(|m| m.aktiv) == Some(true), "Modul nach dem Sperren noch aktiv");
        assert!(ist_aktiv(&z, "wichteln"));
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn schluessel_regel_wie_in_der_oberflaeche() {
        for ok in ["runden", "a", "a.b-c_d", "A9"] { assert!(schluessel_ok(ok).is_ok(), "{ok}"); }
        for nein in ["", "..", "a..b", ".x", "a/b", "a b", "ä", &"x".repeat(65)] { assert!(schluessel_ok(nein).is_err(), "{nein:?}"); }
    }

    #[test]
    fn bruecke_wird_eingesetzt_und_bleibt_ein_skript() {
        let e = einschub("0.2.0");
        assert!(e.starts_with("<script>") && e.ends_with("</script>"));
        assert!(e.contains(r#"{"alter":null,"version":"0.2.0"}"#) || e.contains(r#"{"version":"0.2.0","alter":null}"#), "{e}");
        assert!(!e.contains("__OFFLINE_INFO__"));
        assert_eq!(e.matches("</script").count(), 1, "kein vorzeitiges Ende des Skripts");
    }
}
