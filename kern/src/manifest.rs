//! Manifest `paket.json`: Struktur, Pfadregeln, Versionsvergleich.

use serde::{Deserialize, Serialize};
use std::cmp::Ordering;

pub const FORMAT: u32 = 1;
pub const TEILE_AB: u64 = 256 * 1024 * 1024;
pub const ARTEN: [&str; 6] = ["inhalt", "zim", "karte", "modell", "kurs", "software"];

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Quelle {
    pub name: String,
    #[serde(default)]
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Datei {
    pub pfad: String,
    pub groesse: u64,
    pub sha256: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub teilgroesse: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub teile: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Manifest {
    pub format: u32,
    pub id: String,
    pub version: String,
    pub titel: String,
    pub beschreibung: String,
    pub art: String,
    pub sprache: String,
    pub lizenz: String,
    pub herausgeber: String,
    pub pro: bool,
    pub app_min: String,
    pub erstellt: String,
    #[serde(default)]
    pub aenderungen: String,
    #[serde(default)]
    pub quellen: Vec<Quelle>,
    pub dateien: Vec<Datei>,
    pub groesse: u64,
}

pub fn id_gueltig(id: &str) -> bool {
    (2..=40).contains(&id.len()) && id.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
}

pub fn version_gueltig(v: &str) -> bool {
    let t: Vec<&str> = v.split('.').collect();
    if t.len() != 3 && t.len() != 4 {
        return false;
    }
    let ziffern = |s: &str, n: usize| s.len() == n && s.bytes().all(|b| b.is_ascii_digit());
    ziffern(t[0], 4) && ziffern(t[1], 2) && ziffern(t[2], 2) && t.get(3).map_or(true, |n| !n.is_empty() && n.bytes().all(|b| b.is_ascii_digit()))
}

fn hex64(s: &str) -> bool {
    s.len() == 64 && s.bytes().all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f'))
}

/// Nur relative Pfade unter `inhalt/`, keine Ausbrüche, keine Steuerzeichen, kein Backslash, kein Laufwerk.
pub fn pfad_gueltig(p: &str) -> bool {
    if !p.starts_with("inhalt/") || p.ends_with('/') {
        return false;
    }
    if p.contains('\\') || p.chars().any(|c| (c as u32) < 0x20) {
        return false;
    }
    if p.len() >= 2 && p.as_bytes()[1] == b':' && p.as_bytes()[0].is_ascii_alphabetic() {
        return false;
    }
    p.split('/').all(|t| !t.is_empty() && t != "." && t != "..")
}

/// Kalenderversionen numerisch je Teil vergleichen. Fehlende Teile zählen als 0.
pub fn version_vergleich(a: &str, b: &str) -> Ordering {
    let pa: Vec<u64> = a.split('.').map(|t| t.parse().unwrap_or(0)).collect();
    let pb: Vec<u64> = b.split('.').map(|t| t.parse().unwrap_or(0)).collect();
    for i in 0..pa.len().max(pb.len()) {
        let x = pa.get(i).copied().unwrap_or(0);
        let y = pb.get(i).copied().unwrap_or(0);
        if x != y {
            return x.cmp(&y);
        }
    }
    Ordering::Equal
}

/// Strukturprüfung – gleiche Meldungen wie im Node-Werkzeug.
pub fn manifest_pruefen_struktur(m: &Manifest) -> Vec<String> {
    let mut f = Vec::new();
    if m.format != FORMAT {
        f.push(format!("format {} wird nicht unterstützt (erwartet {FORMAT})", m.format));
    }
    if !id_gueltig(&m.id) {
        f.push("id ungültig".into());
    }
    if !version_gueltig(&m.version) {
        f.push("version ungültig (JJJJ.MM.TT oder JJJJ.MM.TT.N)".into());
    }
    for (k, v) in [("titel", &m.titel), ("beschreibung", &m.beschreibung), ("sprache", &m.sprache), ("lizenz", &m.lizenz), ("herausgeber", &m.herausgeber), ("app_min", &m.app_min), ("erstellt", &m.erstellt)] {
        if v.is_empty() {
            f.push(format!("{k} fehlt"));
        }
    }
    if !ARTEN.contains(&m.art.as_str()) {
        f.push(format!("art ungültig ({})", ARTEN.join(", ")));
    }
    if m.dateien.is_empty() {
        f.push("dateien fehlt oder leer".into());
        return f;
    }
    let mut gesehen = std::collections::HashSet::new();
    let mut summe: u64 = 0;
    for d in &m.dateien {
        if !pfad_gueltig(&d.pfad) {
            f.push(format!("Pfad unzulässig: {:?}", d.pfad));
        }
        if !gesehen.insert(d.pfad.as_str()) {
            f.push(format!("Pfad doppelt: {}", d.pfad));
        }
        if !hex64(&d.sha256) {
            f.push(format!("sha256 ungültig: {}", d.pfad));
        }
        if d.groesse >= TEILE_AB && d.teile.is_none() {
            f.push(format!("Datei über 256 MB braucht Teile: {}", d.pfad));
        }
        if let Some(teile) = &d.teile {
            match d.teilgroesse {
                Some(tg) if tg > 0 => {
                    if teile.len() as u64 != d.groesse.div_ceil(tg) {
                        f.push(format!("Anzahl Teile passt nicht zur Größe: {}", d.pfad));
                    }
                }
                _ => f.push(format!("teilgroesse ungültig: {}", d.pfad)),
            }
            if !teile.iter().all(|t| hex64(t)) {
                f.push(format!("Teil-Prüfsumme ungültig: {}", d.pfad));
            }
        }
        summe = summe.saturating_add(d.groesse);
    }
    if m.groesse != summe {
        f.push(format!("groesse ({}) ist nicht die Summe der Dateien ({summe})", m.groesse));
    }
    f
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pfade() {
        for ok in ["inhalt/a.json", "inhalt/ordner/b.zim", "inhalt/ä ö.txt"] {
            assert!(pfad_gueltig(ok), "{ok}");
        }
        for schlecht in ["a.json", "/inhalt/a", "inhalt/../x", "inhalt/./x", "inhalt//x", "inhalt\\x", "inhalt/", "C:inhalt/x", "inhalt/a\nb", ""] {
            assert!(!pfad_gueltig(schlecht), "{schlecht:?}");
        }
    }

    #[test]
    fn versionen() {
        assert_eq!(version_vergleich("2026.09.24", "2026.09.24"), Ordering::Equal);
        assert_eq!(version_vergleich("2026.09.24", "2026.09.24.1"), Ordering::Less);
        assert_eq!(version_vergleich("2026.10.01", "2026.09.30"), Ordering::Greater);
        assert_eq!(version_vergleich("2026.09.24.2", "2026.09.24.10"), Ordering::Less);
        assert!(version_gueltig("2026.09.24") && version_gueltig("2026.09.24.3"));
        assert!(!version_gueltig("1.2") && !version_gueltig("2026.9.24") && !version_gueltig("2026.09.24."));
    }
}
