//! Paketordner prüfen: Signatur → Struktur → Pfade → Größen und Prüfsummen.

use crate::hash::hash_datei;
use crate::manifest::{manifest_pruefen_struktur, Manifest};
use crate::schluessel::{pruefe_signatur, OeffentlicherSchluessel, Signatur};
use crate::Fehler;
use std::path::{Path, PathBuf};

#[derive(Debug)]
pub struct Geprueft {
    pub manifest: Manifest,
    pub manifest_bytes: Vec<u8>,
    pub schluessel: String,
}

/// Pfad einer Manifest-Datei im Ordner – nur nach `pfad_gueltig`, sonst könnte `..` ausbrechen.
pub fn datei_pfad(ordner: &Path, pfad: &str) -> PathBuf {
    let mut p = ordner.to_path_buf();
    for t in pfad.split('/') {
        p.push(t);
    }
    p
}

/// Liest Manifest und Signatur, prüft alles. Gibt den ersten Fehler zurück – beim Einspielen zählt nur ja oder nein.
pub fn paket_pruefen(ordner: &Path, bekannte: &[OeffentlicherSchluessel], heute: &str) -> Result<Geprueft, Fehler> {
    let bytes = std::fs::read(ordner.join("paket.json")).map_err(|_| Fehler("paket.json fehlt".into()))?;
    let sig: Signatur = std::fs::read(ordner.join("paket.sig"))
        .ok()
        .and_then(|b| serde_json::from_slice(&b).ok())
        .ok_or_else(|| Fehler("paket.sig fehlt oder unlesbar".into()))?;
    let schluessel = pruefe_signatur(&bytes, &sig, bekannte, "pakete", heute).map_err(|e| Fehler(format!("Signatur: {e}")))?;
    let m: Manifest = serde_json::from_slice(&bytes).map_err(|_| Fehler("paket.json ist kein gültiges JSON".into()))?;
    let fehler = manifest_pruefen_struktur(&m);
    if let Some(f) = fehler.first() {
        return Err(Fehler(f.clone()));
    }
    for d in &m.dateien {
        let p = datei_pfad(ordner, &d.pfad);
        let st = std::fs::metadata(&p).map_err(|_| Fehler(format!("Datei fehlt: {}", d.pfad)))?;
        if st.len() != d.groesse {
            return Err(Fehler(format!("Größe falsch: {} ({} statt {})", d.pfad, st.len(), d.groesse)));
        }
        let h = hash_datei(&p, d.teilgroesse.unwrap_or(0))?;
        if h.sha256 != d.sha256 {
            return Err(Fehler(format!("Prüfsumme falsch: {}", d.pfad)));
        }
        if let Some(teile) = &d.teile {
            if teile.iter().zip(h.teile.iter()).any(|(a, b)| a != b) {
                return Err(Fehler(format!("Teil-Prüfsumme falsch: {}", d.pfad)));
            }
        }
    }
    Ok(Geprueft { manifest: m, manifest_bytes: bytes, schluessel })
}
