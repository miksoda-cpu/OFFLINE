//! Katalog: signierte Liste aller Pakete, mit Rollback-Schutz und Ablauf.

use crate::manifest::FORMAT;
use crate::schluessel::{pruefe_signatur, OeffentlicherSchluessel, Signatur};
use crate::Fehler;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct KatalogEintrag {
    pub id: String,
    #[serde(default)]
    pub version: String,
    pub titel: String,
    #[serde(default)]
    pub beschreibung: String,
    pub art: String,
    pub pro: bool,
    pub groesse: u64,
    #[serde(default)]
    pub app_min: String,
    #[serde(default)]
    pub erstellt: String,
    #[serde(default)]
    pub aenderungen: String,
    #[serde(default)]
    pub pfad: String,
    #[serde(default)]
    pub sha256_manifest: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Katalog {
    pub format: u32,
    pub erstellt: String,
    pub gueltig_bis: String,
    pub basis: String,
    pub pakete: Vec<KatalogEintrag>,
}

#[derive(Debug)]
pub struct KatalogGeprueft {
    pub katalog: Katalog,
    pub schluessel: String,
    pub veraltet: bool,
}

/// `zuletzt_erstellt`: `erstellt` des zuletzt akzeptierten Katalogs – ein älterer wird abgelehnt.
pub fn katalog_pruefen(bytes: &[u8], sig: &Signatur, bekannte: &[OeffentlicherSchluessel], heute: &str, jetzt_iso: &str, zuletzt_erstellt: Option<&str>) -> Result<KatalogGeprueft, Fehler> {
    let schluessel = pruefe_signatur(bytes, sig, bekannte, "katalog", heute).map_err(|e| Fehler(format!("Signatur: {e}")))?;
    let k: Katalog = serde_json::from_slice(bytes).map_err(|_| Fehler("Katalog ist kein gültiges JSON".into()))?;
    if k.format != FORMAT {
        return Err(Fehler(format!("Katalogformat {} unbekannt", k.format)));
    }
    if let Some(z) = zuletzt_erstellt {
        if k.erstellt.as_str() < z {
            return Err(Fehler("Katalog ist älter als der zuletzt gesehene (Rollback?)".into()));
        }
    }
    let veraltet = k.gueltig_bis.as_str() < jetzt_iso;
    Ok(KatalogGeprueft { katalog: k, schluessel, veraltet })
}
