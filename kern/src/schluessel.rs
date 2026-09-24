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
    if !s.zweck.iter().any(|z| z == zweck) {
        return Err(Fehler(format!("Schlüssel {} nicht für {zweck} freigegeben", s.id)));
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
    Ok(s.id.clone())
}
