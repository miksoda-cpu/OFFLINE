//! Öffentliche Schlüssel und Signaturprüfung (Ed25519).

use crate::Fehler;
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use ed25519_dalek::{Signature as DalekSignatur, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct OeffentlicherSchluessel {
    pub id: String,
    pub algorithmus: String,
    /// roher Schlüssel, 32 Bytes, base64
    pub oeffentlich: String,
    pub zweck: Vec<String>,
    #[serde(default)]
    pub gueltig_ab: Option<String>,
    #[serde(default)]
    pub gueltig_bis: Option<String>,
    #[serde(default)]
    pub bezeichnung: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Signatur {
    pub algorithmus: String,
    pub schluessel: String,
    /// 64 Bytes, base64
    pub signatur: String,
}

#[derive(Deserialize)]
struct Schluesselliste {
    format: u32,
    schluessel: Vec<OeffentlicherSchluessel>,
}

/// Liest `schluessel/oeffentlich.json`.
pub fn schluessel_laden(pfad: &Path) -> Result<Vec<OeffentlicherSchluessel>, Fehler> {
    let liste: Schluesselliste = serde_json::from_slice(&std::fs::read(pfad)?)?;
    if liste.format != 1 {
        return Err(Fehler(format!("Schlüsselliste: Format {} unbekannt", liste.format)));
    }
    Ok(liste.schluessel)
}

/// Kennung eines Schlüssels: erste 8 Bytes von SHA-256 über den rohen Schlüssel, hex.
pub fn schluessel_id(roh: &[u8]) -> String {
    hex::encode(&Sha256::digest(roh)[..8])
}

/// Prüft `sig` über `bytes` gegen die bekannten Schlüssel. Gibt die Schlüssel-ID zurück.
/// `heute` ist "JJJJ-MM-TT" und dient dem Gültigkeitsfenster.
pub fn pruefe_signatur(bytes: &[u8], sig: &Signatur, bekannte: &[OeffentlicherSchluessel], zweck: &str, heute: &str) -> Result<String, Fehler> {
    pruefe_signatur_zwecke(bytes, sig, bekannte, &[zweck], heute).map(|s| s.id)
}

/// Passt der Schlüssel, mit dem signiert wurde, zur Paketart? Wie `schluesselPasstZurArt` in werkzeug/kern.mjs.
/// Module brauchen einen Schlüssel mit Zweck „module“, der nicht zugleich den Katalog signiert;
/// alle anderen Pakete brauchen Zweck „pakete“.
pub fn schluessel_passt_zur_art(art: &str, s: &OeffentlicherSchluessel) -> Result<(), Fehler> {
    let hat = |z: &str| s.zweck.iter().any(|x| x == z);
    if art == "skin" {
        // Skins enthalten keinen Code; signieren darf der Paketschlüssel oder der Redaktionsschlüssel.
        return if hat("pakete") || hat("module") { Ok(()) } else { Err(Fehler(format!("Schlüssel {} nicht für Skins freigegeben", s.id))) };
    }
    if art == "modul" {
        if !hat("module") {
            return Err(Fehler(format!("Module nur mit dem Redaktionsschlüssel (Schlüssel {} hat nicht den Zweck module)", s.id)));
        }
        if hat("katalog") {
            return Err(Fehler(format!("Module nie mit einem Katalogschlüssel (Schlüssel {})", s.id)));
        }
        return Ok(());
    }
    if hat("pakete") { Ok(()) } else { Err(Fehler(format!("Schlüssel {} nicht für pakete freigegeben", s.id))) }
}

/// Wie `pruefe_signatur`, aber der Schlüssel muss nur einen der `zwecke` haben. Gibt den Schlüssel zurück.
pub fn pruefe_signatur_zwecke(bytes: &[u8], sig: &Signatur, bekannte: &[OeffentlicherSchluessel], zwecke: &[&str], heute: &str) -> Result<OeffentlicherSchluessel, Fehler> {
    if sig.algorithmus != "ed25519" {
        return Err(Fehler("Signatur fehlt oder unbekanntes Verfahren".into()));
    }
    let s = bekannte
        .iter()
        .find(|k| k.id == sig.schluessel)
        .ok_or_else(|| Fehler(format!("Unbekannter Schlüssel {}", sig.schluessel)))?;
    if s.algorithmus != "ed25519" {
        return Err(Fehler(format!("Schlüssel {} hat ein unbekanntes Verfahren", s.id)));
    }
    if !zwecke.iter().any(|z| s.zweck.iter().any(|x| x == z)) {
        return Err(Fehler(format!("Schlüssel {} nicht für {} freigegeben", s.id, zwecke.join(" oder "))));
    }
    if let Some(ab) = &s.gueltig_ab {
        if heute < ab.as_str() {
            return Err(Fehler(format!("Schlüssel {} noch nicht gültig", s.id)));
        }
    }
    if let Some(bis) = &s.gueltig_bis {
        if heute > bis.as_str() {
            return Err(Fehler(format!("Schlüssel {} abgelaufen", s.id)));
        }
    }
    let roh = B64.decode(&s.oeffentlich).map_err(|_| Fehler("Öffentlicher Schlüssel nicht lesbar".into()))?;
    let roh: [u8; 32] = roh.try_into().map_err(|_| Fehler("Öffentlicher Schlüssel hat falsche Länge".into()))?;
    if schluessel_id(&roh) != s.id {
        return Err(Fehler(format!("Schlüssel {}: Kennung passt nicht zum Schlüssel", s.id)));
    }
    let vk = VerifyingKey::from_bytes(&roh).map_err(|_| Fehler("Öffentlicher Schlüssel ungültig".into()))?;
    let sb = B64.decode(&sig.signatur).map_err(|_| Fehler("Signatur nicht lesbar".into()))?;
    let sb: [u8; 64] = sb.try_into().map_err(|_| Fehler("Signatur hat falsche Länge".into()))?;
    vk.verify(bytes, &DalekSignatur::from_bytes(&sb))
        .map_err(|_| Fehler("Signatur passt nicht zum Inhalt".into()))?;
    Ok(s.clone())
}
