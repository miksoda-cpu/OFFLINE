//! OFFLINE-Kern: Paketformat Version 1 in Rust.
//! Verhält sich exakt wie `werkzeug/paket-lib.mjs`; die Testfälle in `werkzeug/test.mjs` gelten auch hier.
//! Spezifikation: docs/PAKETFORMAT.md

pub mod abo;
pub mod datum;
pub mod download;
pub mod delta;
pub mod einspielen;
pub mod hash;
pub mod katalog;
pub mod lokalserver;
pub mod manifest;
pub mod paket;
pub mod schluessel;
pub mod tresor;

pub use delta::{delta, Delta};
pub use download::{katalog_laden, paket_laden, Auftrag, Fortschritt};
pub use einspielen::{abschliessen, aufraeumen, aufraeumen_staging, einspielen, Einspielergebnis};
pub use katalog::{katalog_pruefen, Katalog, KatalogEintrag};
pub use manifest::{manifest_pruefen_struktur, pfad_gueltig, version_vergleich, Datei, Manifest, FORMAT};
pub use paket::{paket_pruefen, Geprueft};
pub use schluessel::{pruefe_signatur, schluessel_laden, OeffentlicherSchluessel, Signatur};

/// Alle Fehler des Kerns, als Klartext für die Oberfläche.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Fehler(pub String);

impl std::fmt::Display for Fehler {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}
impl std::error::Error for Fehler {}
impl From<std::io::Error> for Fehler {
    fn from(e: std::io::Error) -> Self {
        Fehler(format!("Dateizugriff: {e}"))
    }
}
impl From<serde_json::Error> for Fehler {
    fn from(e: serde_json::Error) -> Self {
        Fehler(format!("JSON: {e}"))
    }
}
