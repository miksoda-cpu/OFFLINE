//! Vorschau-Slideshow eines Pakets (PAKET-KIT.md Abschnitt 3): fünf Folien, Bilder zusammen höchstens 200 kB.
//! Die Paketseite zeigt sie vor dem Laden. Jedes Bild ist über eine Signatur gedeckt: aus dem Katalog über die
//! Prüfsummen im signierten Katalogeintrag, aus einem Ordner über das signierte Manifest des Pakets.

use crate::hash::sha256_hex;
use crate::katalog::KatalogEintrag;
use crate::paket::{datei_pfad, paket_pruefen};
use crate::schluessel::OeffentlicherSchluessel;
use crate::Fehler;
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use serde::{Deserialize, Serialize};
use std::path::Path;

pub const GRENZE: u64 = 200 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Folie {
    pub nr: u32,
    pub rolle: String,
    pub bild: String,
    pub titel: String,
    pub text: String,
    pub alt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct VorschauDatei {
    pub pfad: String,
    pub groesse: u64,
    pub sha256: String,
}

/// So steht die Vorschau im Katalogeintrag (gebaut von werkzeug/paket-lib.mjs, katalogBauen).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Vorschau {
    pub folien: Vec<Folie>,
    pub dateien: Vec<VorschauDatei>,
}

/// Eine Folie mit ihrem Bild als data:-Adresse – so geht sie an die Oberfläche (als <img>, nie als Dokument).
#[derive(Debug, Clone, Serialize)]
pub struct FolieMitBild {
    #[serde(flatten)]
    pub folie: Folie,
    pub bild_daten: String,
}

fn bild_name_ok(b: &str) -> bool {
    !b.is_empty() && b.len() <= 40 && b.bytes().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || matches!(c, b'.' | b'-' | b'_')) && !b.starts_with('.')
}

fn mime(name: &str) -> Option<&'static str> {
    match name.rsplit('.').next()? {
        "svg" => Some("image/svg+xml"),
        "webp" => Some("image/webp"),
        "png" => Some("image/png"),
        "jpg" | "jpeg" => Some("image/jpeg"),
        _ => None,
    }
}

fn data_url(name: &str, bytes: &[u8]) -> Result<String, Fehler> {
    let m = mime(name).ok_or_else(|| Fehler(format!("Vorschau: Bildformat nicht erlaubt ({name})")))?;
    Ok(format!("data:{m};base64,{}", B64.encode(bytes)))
}

fn folien_pruefen(folien: &[Folie]) -> Result<(), Fehler> {
    if folien.len() != 5 {
        return Err(Fehler(format!("Vorschau: genau 5 Folien verlangt, gefunden {}", folien.len())));
    }
    if let Some(f) = folien.iter().find(|f| !bild_name_ok(&f.bild)) {
        return Err(Fehler(format!("Vorschau: Bildname unzulässig ({})", f.bild)));
    }
    Ok(())
}

/// Vorschau eines Paketordners (installiert, auf dem Stick, lokale Quelle). Prüft das Paket vorher vollständig.
pub fn aus_ordner(ordner: &Path, bekannte: &[OeffentlicherSchluessel], heute: &str) -> Result<Vec<FolieMitBild>, Fehler> {
    let g = paket_pruefen(ordner, bekannte, heute)?;
    let im_manifest = |p: &str| g.manifest.dateien.iter().any(|d| d.pfad == p);
    if !im_manifest("inhalt/vorschau/folien.json") {
        return Ok(vec![]);
    }
    #[derive(Deserialize)]
    struct F {
        folien: Vec<Folie>,
    }
    let f: F = serde_json::from_slice(&std::fs::read(datei_pfad(ordner, "inhalt/vorschau/folien.json"))?)
        .map_err(|_| Fehler("Vorschau: folien.json unlesbar".into()))?;
    folien_pruefen(&f.folien)?;
    let mut summe = 0u64;
    let mut aus = Vec::new();
    for folie in f.folien {
        let pfad = format!("inhalt/vorschau/{}", folie.bild);
        if !im_manifest(&pfad) {
            return Err(Fehler(format!("Vorschau: {pfad} fehlt im Manifest")));
        }
        let bytes = std::fs::read(datei_pfad(ordner, &pfad))?;
        summe += bytes.len() as u64;
        if summe > GRENZE {
            return Err(Fehler("Vorschau: Bilder zusammen über 200 kB".into()));
        }
        aus.push(FolieMitBild { bild_daten: data_url(&folie.bild, &bytes)?, folie });
    }
    Ok(aus)
}

/// Vorschau eines Katalogeintrags: Bilder vom Server, jedes gegen Größe und Prüfsumme im signierten Katalog.
/// `holen(url)` lädt eine Adresse (in der App: HTTP; in Tests: aus einem Ordner).
pub fn aus_katalog(basis: &str, eintrag: &KatalogEintrag, holen: &dyn Fn(&str) -> Result<Vec<u8>, Fehler>) -> Result<Vec<FolieMitBild>, Fehler> {
    let Some(v) = &eintrag.vorschau else { return Ok(vec![]) };
    folien_pruefen(&v.folien)?;
    if v.dateien.iter().map(|d| d.groesse).sum::<u64>() > GRENZE {
        return Err(Fehler("Vorschau: Bilder zusammen über 200 kB".into()));
    }
    let url = crate::download::paket_url(basis, eintrag);
    let mut aus = Vec::new();
    for folie in &v.folien {
        let pfad = format!("inhalt/vorschau/{}", folie.bild);
        let d = v.dateien.iter().find(|d| d.pfad == pfad).ok_or_else(|| Fehler(format!("Vorschau: {pfad} fehlt im Katalog")))?;
        let bytes = holen(&format!("{url}{pfad}"))?;
        if bytes.len() as u64 != d.groesse || sha256_hex(&bytes) != d.sha256 {
            return Err(Fehler(format!("Vorschau: {pfad} passt nicht zum Katalog (Prüfsumme)")));
        }
        aus.push(FolieMitBild { bild_daten: data_url(&folie.bild, &bytes)?, folie: folie.clone() });
    }
    Ok(aus)
}
