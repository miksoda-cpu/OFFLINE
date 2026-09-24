//! Einspielen eines Pakets: Staging, vollständige Prüfung, atomarer Tausch.
//!
//! Zustände auf der Platte unter `wurzel/`:
//!   `<id>-<version>/`       installiert und vollständig
//!   `<id>-<version>.neu/`   Staging – darf jederzeit gelöscht werden (ein Download setzt dort fort)
//!   `<id>-<alt>.alt/`       Vorgänger während des Tauschs – wird nach Erfolg gelöscht
//!
//! Bricht der Strom mitten drin ab, räumt `aufraeumen()` beim nächsten Start auf.

use crate::manifest::version_vergleich;
use crate::paket::{datei_pfad, paket_pruefen};
use crate::schluessel::OeffentlicherSchluessel;
use crate::Fehler;
use std::cmp::Ordering;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
pub struct Einspielergebnis {
    pub id: String,
    pub version: String,
    pub ordner: PathBuf,
    pub ersetzt: Option<String>,
    pub kopiert_bytes: u64,
}

/// Welche Version eines Pakets ist installiert? Liest `<wurzel>/<id>-*/paket.json` (ohne Signaturprüfung – nur zum Nachsehen).
pub fn installierte_version(wurzel: &Path, id: &str) -> Option<(String, PathBuf)> {
    let mut beste: Option<(String, PathBuf)> = None;
    for e in std::fs::read_dir(wurzel).ok()?.flatten() {
        let name = e.file_name().to_string_lossy().to_string();
        let Some(rest) = name.strip_prefix(&format!("{id}-")) else { continue };
        if rest.ends_with(".neu") || rest.ends_with(".alt") || !e.path().join("paket.json").exists() {
            continue;
        }
        if beste.as_ref().map_or(true, |(v, _)| version_vergleich(rest, v) == Ordering::Greater) {
            beste = Some((rest.to_string(), e.path()));
        }
    }
    beste
}

/// Darf diese Version über die installierte? Gleiche Version → nein; ältere nur mit `downgrade_erlaubt`.
pub fn version_zulaessig(wurzel: &Path, id: &str, version: &str, downgrade_erlaubt: bool) -> Result<Option<(String, PathBuf)>, Fehler> {
    let bisher = installierte_version(wurzel, id);
    if let Some((v, _)) = &bisher {
        match version_vergleich(version, v) {
            Ordering::Equal => return Err(Fehler(format!("{id} {v} ist bereits installiert"))),
            Ordering::Less if !downgrade_erlaubt => return Err(Fehler(format!("{id} {v} ist neuer als {version} – kein Downgrade ohne Bestätigung"))),
            _ => {}
        }
    }
    Ok(bisher)
}

pub fn staging_ordner(wurzel: &Path, id: &str, version: &str) -> PathBuf {
    wurzel.join(format!("{id}-{version}.neu"))
}

/// Kopiert ein geprüftes Paket von `quelle` (USB-Stick, Download-Ordner) nach `wurzel/<id>-<version>/`.
/// Reihenfolge: Quelle prüfen → nach Staging kopieren → Staging erneut prüfen → Tausch.
pub fn einspielen(quelle: &Path, wurzel: &Path, bekannte: &[OeffentlicherSchluessel], heute: &str, downgrade_erlaubt: bool) -> Result<Einspielergebnis, Fehler> {
    let g = paket_pruefen(quelle, bekannte, heute)?;
    let m = &g.manifest;
    version_zulaessig(wurzel, &m.id, &m.version, downgrade_erlaubt)?;

    std::fs::create_dir_all(wurzel)?;
    let staging = staging_ordner(wurzel, &m.id, &m.version);
    if staging.exists() {
        std::fs::remove_dir_all(&staging)?;
    }
    std::fs::create_dir_all(&staging)?;

    let mut kopiert = 0u64;
    for d in &m.dateien {
        let von = datei_pfad(quelle, &d.pfad);
        let nach = datei_pfad(&staging, &d.pfad);
        if let Some(eltern) = nach.parent() {
            std::fs::create_dir_all(eltern)?;
        }
        kopiert += std::fs::copy(&von, &nach)?;
    }
    std::fs::write(staging.join("paket.json"), &g.manifest_bytes)?;
    std::fs::copy(quelle.join("paket.sig"), staging.join("paket.sig"))?;

    let mut e = abschliessen(&staging, wurzel, bekannte, heute, downgrade_erlaubt)?;
    e.kopiert_bytes = kopiert;
    Ok(e)
}

/// Letzter Schritt für jedes Staging (Kopie vom Stick oder Download): erneut vollständig prüfen, dann atomar tauschen.
/// Schlägt die Prüfung fehl, wird das Staging gelöscht und der installierte Stand bleibt unangetastet.
pub fn abschliessen(staging: &Path, wurzel: &Path, bekannte: &[OeffentlicherSchluessel], heute: &str, downgrade_erlaubt: bool) -> Result<Einspielergebnis, Fehler> {
    let g = match paket_pruefen(staging, bekannte, heute) {
        Ok(g) => g,
        Err(e) => {
            let _ = std::fs::remove_dir_all(staging);
            return Err(Fehler(format!("Kopie fehlerhaft, Einspielen abgebrochen: {e}")));
        }
    };
    let m = &g.manifest;
    let bisher = version_zulaessig(wurzel, &m.id, &m.version, downgrade_erlaubt)?;
    let ziel = wurzel.join(format!("{}-{}", m.id, m.version));

    // Atomarer Tausch: alt → .alt, neu → Platz, .alt löschen.
    let alt = bisher.as_ref().map(|(v, p)| (v.clone(), p.clone(), wurzel.join(format!("{}-{}.alt", m.id, v))));
    if let Some((_, p, a)) = &alt {
        if a.exists() {
            std::fs::remove_dir_all(a)?;
        }
        std::fs::rename(p, a)?;
    }
    if ziel.exists() {
        std::fs::remove_dir_all(&ziel)?;
    }
    if let Err(e) = std::fs::rename(staging, &ziel) {
        if let Some((_, p, a)) = &alt {
            let _ = std::fs::rename(a, p);
        }
        return Err(e.into());
    }
    if let Some((_, _, a)) = &alt {
        let _ = std::fs::remove_dir_all(a);
    }
    Ok(Einspielergebnis { id: m.id.clone(), version: m.version.clone(), ordner: ziel, ersetzt: bisher.map(|(v, _)| v), kopiert_bytes: 0 })
}

/// Beim Start: halbe Zustände auflösen. `.alt` zurückbenennen, wenn kein Hauptordner da ist, sonst weg.
/// `.neu` bleibt liegen – ein Download setzt dort fort; `aufraeumen_staging` räumt verwaiste weg.
pub fn aufraeumen(wurzel: &Path) -> Result<Vec<String>, Fehler> {
    let mut meldungen = Vec::new();
    let Ok(eintraege) = std::fs::read_dir(wurzel) else { return Ok(meldungen) };
    for e in eintraege.flatten() {
        let name = e.file_name().to_string_lossy().to_string();
        if let Some(basis) = name.strip_suffix(".alt") {
            let (id, _) = basis.rsplit_once('-').unwrap_or((basis, ""));
            if installierte_version(wurzel, id).is_none() {
                std::fs::rename(e.path(), wurzel.join(basis))?;
                meldungen.push(format!("Vorgänger wiederhergestellt: {basis}"));
            } else {
                std::fs::remove_dir_all(e.path())?;
                meldungen.push(format!("Alter Stand entfernt: {basis}"));
            }
        } else if let Some(basis) = name.strip_suffix(".neu") {
            // Staging ohne Manifest ist nichts wert; mit Manifest darf ein Download fortsetzen
            if !e.path().join("paket.json").exists() {
                std::fs::remove_dir_all(e.path())?;
                meldungen.push(format!("Unvollständiges Staging entfernt: {basis}"));
            }
        }
    }
    Ok(meldungen)
}

/// Alle Staging-Ordner löschen (z. B. „Downloads verwerfen“).
pub fn aufraeumen_staging(wurzel: &Path) -> Result<usize, Fehler> {
    let mut n = 0;
    let Ok(eintraege) = std::fs::read_dir(wurzel) else { return Ok(0) };
    for e in eintraege.flatten() {
        if e.file_name().to_string_lossy().ends_with(".neu") {
            std::fs::remove_dir_all(e.path())?;
            n += 1;
        }
    }
    Ok(n)
}
