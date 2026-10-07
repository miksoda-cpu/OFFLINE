//! Manifest `paket.json`: Struktur, Pfadregeln, Versionsvergleich.

use serde::{Deserialize, Serialize};
use std::cmp::Ordering;

pub const FORMAT: u32 = 1;
pub const TEILE_AB: u64 = 256 * 1024 * 1024;
pub const ARTEN: [&str; 9] = ["inhalt", "zim", "karte", "modell", "kurs", "software", "modul", "skin", "tage"];
/// Tagesinhalte (Vorratskammer): nur Daten in inhalt/tage.json, dazu Herkunft und Lizenz als .md/.txt.
pub const TAGE_DATEI: &str = "inhalt/tage.json";
pub const TAGE_GRENZE: u64 = 20 * 1024 * 1024;
const TAGE_ENDUNGEN: [&str; 3] = [".json", ".md", ".txt"];

/// Bereich eines Tagespakets: nach Datum (von/bis, JJJJ-MM-TT) oder nach Tagnummer (Tag 1 = erster Tag auf dem Gerät).
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct TageBereich {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub von: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bis: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub von_tag: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bis_tag: Option<u32>,
}

impl TageBereich {
    /// Genau eine der beiden Formen, in sich stimmig.
    pub fn gueltig(&self) -> bool {
        let datum = |s: &Option<String>| s.as_deref().is_some_and(|d| d.len() == 10 && d.as_bytes()[4] == b'-' && d.as_bytes()[7] == b'-' && d.bytes().enumerate().all(|(i, b)| i == 4 || i == 7 || b.is_ascii_digit()));
        match (&self.von, &self.bis, self.von_tag, self.bis_tag) {
            (Some(_), Some(_), None, None) => datum(&self.von) && datum(&self.bis) && self.von <= self.bis,
            (None, None, Some(a), Some(b)) => a >= 1 && a <= b,
            _ => false,
        }
    }
}
/// Module (SICHERHEIT.md, Abschnitt Module): Oberfläche nur unter `inhalt/modul/`, höchstens 2 MB,
/// nur mit dem Redaktionsschlüssel (Zweck „module“) signiert und mit `pruefstatus: redaktion`.
pub const MODUL_ORDNER: &str = "inhalt/modul/";
pub const MODUL_GRENZE: u64 = 2 * 1024 * 1024;
/// Bereiche, in denen die App ein Modul selbst einbindet (0.6.5).
pub const BEREICHE: [&str; 1] = ["pause"];
const SKRIPT_ENDUNGEN: [&str; 2] = [".js", ".mjs"];
const SEITEN_ENDUNGEN: [&str; 4] = [".html", ".htm", ".xhtml", ".svg"];
/// Skins (Aussehen): nur Stil, Schriften, Bilder, Lizenzen, Herkunft – unter `inhalt/skin/`, Einstieg `skin.css`, höchstens 20 MB.
pub const SKIN_ORDNER: &str = "inhalt/skin/";
pub const SKIN_GRENZE: u64 = 20 * 1024 * 1024;
const SKIN_ENDUNGEN: [&str; 10] = [".css", ".woff2", ".woff", ".webp", ".png", ".jpg", ".svg", ".md", ".txt", ".json"];

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

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub preis: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pruefstatus: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub kategorie: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub alter_ab: Option<u32>,
    /// Kurzer Hinweis unter der Beschreibung (0.6.2), z. B. „Die Lumis sind erfunden, die Philosophen nicht.“
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hinweis: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub abnahme: Option<String>,
    /// Bilder oder andere Inhalte sind mit KI erzeugt (Anzeige auf der Katalogkarte).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ki_generiert: Option<bool>,
    /// Nur bei Tagesinhalten: welche Tage das Paket abdeckt.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tage: Option<TageBereich>,
    /// Nur bei Modulen: Formatversion der gespeicherten Nutzerdaten, ab 1.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub datenversion: Option<u32>,
    /// Nur bei Modulen (0.6.5): wo die App das Modul zeigt, heute nur „pause“ (Spiele als Happen-Formen).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub bereich: Option<String>,
    /// Nur bei Modulen (0.6.5): das Modul führt WebAssembly aus. Erlaubt nur mit einem Schlüssel mit Zweck „wasm“
    /// (modulserver::wasm_erlaubt); ohne Anmeldung sperrt die Sandbox WebAssembly.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub wasm: Option<bool>,
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

fn endung(p: &str) -> String {
    match (p.rfind('.'), p.rfind('/')) {
        (Some(i), Some(s)) if i > s => p[i..].to_ascii_lowercase(),
        (Some(i), None) => p[i..].to_ascii_lowercase(),
        _ => String::new(),
    }
}

/// Darf eine Datei an diesem Pfad Code enthalten? Nur in Modulen und nur unter `inhalt/modul/`.
pub fn code_erlaubt(art: &str, pfad: &str) -> bool {
    art == "modul" && pfad.starts_with(MODUL_ORDNER)
}

/// Muss der Inhalt dieser Datei auf Skripte durchsucht werden (Seite außerhalb der Modul-Oberfläche)?
pub fn braucht_skript_pruefung(art: &str, pfad: &str) -> bool {
    SEITEN_ENDUNGEN.contains(&endung(pfad).as_str()) && !code_erlaubt(art, pfad)
}

/// Steht in einer Seite (HTML/SVG) Code? Wie `seiteHatSkript` in werkzeug/kern.mjs:
/// `<script` als Wort, ein Ereignis-Attribut ` on…=`, oder `javascript:` – ohne Rücksicht auf Groß/klein.
pub fn seite_hat_skript(text: &str) -> bool {
    let t = text.to_lowercase();
    if t.contains("javascript:") {
        return true;
    }
    let b: Vec<char> = t.chars().collect();
    for (i, _) in t.match_indices("<script") {
        let danach = t[i + 7..].chars().next();
        if danach.map_or(true, |c| !(c.is_alphanumeric() || c == '_')) {
            return true;
        }
    }
    // Ereignis-Attribut: Leerraum, "on", mindestens ein Buchstabe a–z, optional Leerraum, "="
    let mut i = 0;
    while i + 2 < b.len() {
        if b[i].is_whitespace() && b[i + 1] == 'o' && b[i + 2] == 'n' {
            let mut j = i + 3;
            let start = j;
            while j < b.len() && b[j].is_ascii_lowercase() {
                j += 1;
            }
            if j > start {
                while j < b.len() && b[j].is_whitespace() {
                    j += 1;
                }
                if j < b.len() && b[j] == '=' {
                    return true;
                }
            }
        }
        i += 1;
    }
    false
}

/// Muss der Inhalt dieser Datei als CSS geprüft werden? Jede `.css` außerhalb einer Modul-Oberfläche.
pub fn braucht_css_pruefung(art: &str, pfad: &str) -> bool {
    endung(pfad) == ".css" && !code_erlaubt(art, pfad)
}

/// Ist dieses CSS sicher? Wie `cssFehler` in werkzeug/kern.mjs: kein @import, keine url() außerhalb des Pakets,
/// kein expression(), kein javascript:/behavior:/-moz-binding, keine Escapes. Gibt den Grund zurück.
pub fn css_fehler(text: &str) -> Option<String> {
    if text.contains('\\') {
        return Some("Escape-Zeichen (\\) in CSS".into());
    }
    let t = text.to_lowercase();
    if t.contains("@import") {
        return Some("@import".into());
    }
    let ohne_leer: String = t.chars().filter(|c| !c.is_whitespace()).collect();
    if ohne_leer.contains("expression(") {
        return Some("expression()".into());
    }
    if t.contains("javascript:") || t.contains("vbscript:") {
        return Some("javascript:".into());
    }
    if ohne_leer.contains("behavior:") || t.contains("-moz-binding") {
        return Some("behavior/-moz-binding".into());
    }
    if ohne_leer.contains("image-set(\"") || ohne_leer.contains("image-set('") {
        return Some("image-set() mit Adresse ohne url()".into());
    }
    let mut rest = text;
    while let Some(i) = rest.to_lowercase().find("url(") {
        let nach = &rest[i + 4..];
        let ende = nach.find(')').unwrap_or(nach.len());
        let ziel = nach[..ende].trim().trim_matches(|c| c == '"' || c == '\'').trim();
        let klein = ziel.to_lowercase();
        let data_ok = klein.starts_with("data:image/") || klein.starts_with("data:font/");
        let schema = ziel.find(':').map_or(false, |p| p > 0 && ziel[..p].chars().all(|c| c.is_ascii_alphanumeric() || "+.-".contains(c)) && ziel.as_bytes()[0].is_ascii_alphabetic());
        let raus = ziel.is_empty() || ziel.starts_with('/') || ziel.split(|c| c == '/' || c == '?' || c == '#').any(|t| t == "..");
        if !data_ok && (schema || raus) {
            return Some(format!("url() außerhalb des Pakets: {}", ziel.chars().take(60).collect::<String>()));
        }
        rest = &nach[ende.min(nach.len())..];
    }
    None
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
        if SKRIPT_ENDUNGEN.contains(&endung(&d.pfad).as_str()) && !code_erlaubt(&m.art, &d.pfad) {
            f.push(if m.art == "modul" { format!("Skript außerhalb von inhalt/modul/: {}", d.pfad) } else { format!("Pakete enthalten keinen Code: {}", d.pfad) });
        }
        summe = summe.saturating_add(d.groesse);
    }
    if m.groesse != summe {
        f.push(format!("groesse ({}) ist nicht die Summe der Dateien ({summe})", m.groesse));
    }
    if m.art == "skin" {
        if !m.dateien.iter().any(|d| d.pfad == format!("{SKIN_ORDNER}skin.css")) {
            f.push("Skin ohne inhalt/skin/skin.css".into());
        }
        for d in &m.dateien {
            if !d.pfad.starts_with(SKIN_ORDNER) && !d.pfad.starts_with("inhalt/vorschau/") {
                f.push(format!("Skin: Datei außerhalb von inhalt/skin/: {}", d.pfad));
            } else if d.pfad.starts_with(SKIN_ORDNER) && !SKIN_ENDUNGEN.contains(&endung(&d.pfad).as_str()) {
                f.push(format!("Skin: Dateityp nicht erlaubt: {}", d.pfad));
            }
        }
        if summe > SKIN_GRENZE {
            f.push(format!("Skin zu groß ({summe} Bytes, höchstens {SKIN_GRENZE})"));
        }
    }
    if m.art == "tage" {
        if !m.tage.as_ref().is_some_and(|t| t.gueltig()) {
            f.push("Tagesinhalte brauchen tage (von/bis als Datum oder von_tag/bis_tag)".into());
        }
        if !m.dateien.iter().any(|d| d.pfad == TAGE_DATEI) {
            f.push("Tagesinhalte ohne inhalt/tage.json".into());
        }
        for d in &m.dateien {
            if !TAGE_ENDUNGEN.contains(&endung(&d.pfad).as_str()) {
                f.push(format!("Tagesinhalte: Dateityp nicht erlaubt: {}", d.pfad));
            }
        }
        if summe > TAGE_GRENZE {
            f.push(format!("Tagesinhalte zu groß ({summe} Bytes, höchstens {TAGE_GRENZE})"));
        }
    }
    if m.art != "modul" && (m.bereich.is_some() || m.wasm.is_some()) {
        f.push("bereich und wasm gibt es nur bei Modulen".into());
    }
    if m.art == "modul" {
        if let Some(b) = &m.bereich {
            if !BEREICHE.contains(&b.as_str()) {
                f.push(format!("bereich ungültig ({})", BEREICHE.join(", ")));
            }
        }
        if m.pruefstatus.as_deref() != Some("redaktion") {
            f.push("Module nur mit pruefstatus redaktion".into());
        }
        if !m.datenversion.map_or(false, |v| v >= 1) {
            f.push("Module brauchen datenversion (ganze Zahl ab 1)".into());
        }
        if !m.dateien.iter().any(|d| d.pfad == format!("{MODUL_ORDNER}index.html")) {
            f.push("Modul ohne inhalt/modul/index.html".into());
        }
        let oberflaeche: u64 = m.dateien.iter().filter(|d| code_erlaubt("modul", &d.pfad)).map(|d| d.groesse).sum();
        if oberflaeche > MODUL_GRENZE {
            f.push(format!("Modul-Oberfläche zu groß ({oberflaeche} Bytes, höchstens {MODUL_GRENZE})"));
        }
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
    fn skripte_in_seiten() {
        for ja in ["<script>1</script>", "<SCRIPT src=a>", "<img src=x onerror=\"x()\">", "<a href=\"JavaScript:x()\">", "<p\n onclick = 1>", "<script\n>"] {
            assert!(seite_hat_skript(ja), "{ja:?}");
        }
        for nein in ["<p>harmlos</p>", "<svg><text>on the road = gut</text></svg>", "<scripture>", "Konstruktion=1", "<p>on=</p>"] {
            assert!(!seite_hat_skript(nein), "{nein:?}");
        }
    }

    #[test]
    fn css_regeln_wie_im_werkzeug() {
        assert_eq!(css_fehler("a{b:url(fonts/x.woff2)} c{d:url('flechten/03-dorf.webp')}"), None);
        assert_eq!(css_fehler("a{b:url(\"data:image/png;base64,AA\")}"), None);
        for (css, grund) in [("@import url(x.css);", "@import"), ("a{b:url(https://x/y.png)}", "url()"), ("a{b:url(//x/y)}", "url()"), ("a{b:url(/abs)}", "url()"),
            ("a{b:url(../x)}", "url()"), ("a{b:url(data:text/html,x)}", "url()"), ("a{width:expression (1)}", "expression"), ("a{b:u\\72l(x)}", "Escape"),
            ("a{behavior: url(x.htc)}", "behavior"), ("a{background:image-set('https://x' 1x)}", "image-set")] {
            let f = css_fehler(css).unwrap_or_default();
            assert!(f.contains(grund), "{css}: {f}");
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
