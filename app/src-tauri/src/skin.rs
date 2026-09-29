//! Skins (`art = "skin"`): höchstens einer ist aktiv. Die App holt seine CSS über diesen Befehl, geprüft wie beim
//! Einspielen, und schreibt relative url() auf den lokalen Dateiserver um (Schriften, Bilder im Paket). Skins enthalten
//! keinen Code; Notfallseiten schaltet die Oberfläche auf das Grundaussehen zurück (web/app.js).

use super::{paket_aus_ordner, Zustand};
use offline_kern::{einspielen, manifest::css_fehler, paket::datei_pfad};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

#[derive(Serialize, Deserialize, Default)]
struct SkinZustand {
    aktiv: Option<String>,
}

fn datei(z: &Zustand) -> PathBuf {
    z.datenordner.join("skins.json")
}
fn lesen(z: &Zustand) -> SkinZustand {
    std::fs::read(datei(z)).ok().and_then(|b| serde_json::from_slice(&b).ok()).unwrap_or_default()
}
fn schreiben(z: &Zustand, s: &SkinZustand) -> Result<(), String> {
    std::fs::write(datei(z), serde_json::to_vec_pretty(s).map_err(|e| e.to_string())?).map_err(|e| e.to_string())
}

/// Installierter Skin: Ordner, vollständig geprüft, und wirklich `art = "skin"`.
fn skin_ordner(z: &Zustand, id: &str) -> Result<PathBuf, String> {
    if !offline_kern::manifest::id_gueltig(id) {
        return Err("Skin-Id ungültig".into());
    }
    let (_, ordner) = einspielen::installierte_version(&z.wurzel(), id).ok_or("Skin ist nicht installiert")?;
    let p = paket_aus_ordner(&ordner, &z.schluessel)?;
    if p.manifest.art != "skin" {
        return Err("Dieses Paket ist kein Skin".into());
    }
    Ok(ordner)
}

/// Welcher Skin ist aktiv? Ein gelöschter oder beschädigter zählt nicht.
#[tauri::command]
pub fn skin_stand(z: State<Zustand>) -> Option<String> {
    lesen(&z).aktiv.filter(|id| skin_ordner(&z, id).is_ok())
}

/// Einen Skin aktiv schalten (alle anderen sind damit aus) oder mit `None` zum Grundaussehen zurück.
#[tauri::command]
pub fn skin_aktivieren(z: State<Zustand>, id: Option<String>) -> Result<(), String> {
    if let Some(id) = &id {
        skin_ordner(&z, id)?;
    }
    schreiben(&z, &SkinZustand { aktiv: id })
}

#[derive(Serialize)]
pub struct SkinCss {
    id: String,
    css: String,
}

/// CSS des aktiven Skins mit Adressen auf den lokalen Dateiserver. Wird vor der Auslieferung noch einmal geprüft.
#[tauri::command]
pub fn skin_css(z: State<Zustand>) -> Result<Option<SkinCss>, String> {
    let Some(id) = skin_stand(z.clone()) else { return Ok(None) };
    let ordner = skin_ordner(&z, &id)?;
    let css = std::fs::read_to_string(datei_pfad(&ordner, "inhalt/skin/skin.css")).map_err(|e| e.to_string())?;
    if let Some(grund) = css_fehler(&css) {
        return Err(format!("Skin-CSS abgelehnt: {grund}"));
    }
    let basis = z.lokal.lock().map_err(|_| "gesperrt")?.as_ref().map(|l| l.url()).ok_or("Lokaler Server läuft nicht")?;
    let paket = ordner.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    Ok(Some(SkinCss { id, css: urls_umschreiben(&css, &format!("{basis}{paket}/inhalt/skin/")) }))
}

/// `url(fonts/a.woff2)` → `url("http://127.0.0.1:…/<paket>/inhalt/skin/fonts/a.woff2")`. data:-Adressen bleiben.
/// Nur nach `css_fehler`: dort ist schon sichergestellt, dass jede url() relativ und im Paket ist.
pub fn urls_umschreiben(css: &str, basis: &str) -> String {
    let mut aus = String::with_capacity(css.len() + 256);
    let mut rest = css;
    while let Some(i) = rest.to_lowercase().find("url(") {
        aus.push_str(&rest[..i + 4]);
        let nach = &rest[i + 4..];
        let ende = nach.find(')').unwrap_or(nach.len());
        let ziel = nach[..ende].trim().trim_matches(|c| c == '"' || c == '\'').trim();
        if ziel.to_lowercase().starts_with("data:") {
            aus.push_str(&nach[..ende]);
        } else {
            let pfad: String = ziel.split('/').map(|t| t.replace('%', "%25").replace(' ', "%20").replace('"', "%22")).collect::<Vec<_>>().join("/");
            aus.push('"');
            aus.push_str(basis);
            aus.push_str(&pfad);
            aus.push('"');
        }
        rest = &nach[ende..];
    }
    aus.push_str(rest);
    aus
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adressen_werden_auf_den_lokalen_server_gelegt() {
        let css = r#"@font-face{src:url("fonts/a.woff2")} .x{background:url( flechten/03-dorf.webp )} .y{background:url(data:image/png;base64,AA)}"#;
        let neu = urls_umschreiben(css, "http://127.0.0.1:5000/flechte-1/inhalt/skin/");
        assert!(neu.contains(r#"url("http://127.0.0.1:5000/flechte-1/inhalt/skin/fonts/a.woff2")"#), "{neu}");
        assert!(neu.contains(r#"url("http://127.0.0.1:5000/flechte-1/inhalt/skin/flechten/03-dorf.webp")"#), "{neu}");
        assert!(neu.contains("url(data:image/png;base64,AA)"));
    }
}

#[cfg(test)]
mod pruefung_echte_css {
    #[test]
    fn flechte_css_bleibt_bis_auf_adressen_gleich() {
        let css = std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/../../pakete/flechte/inhalt/skin/skin.css")).unwrap();
        let neu = super::urls_umschreiben(&css, "http://127.0.0.1:1/p/inhalt/skin/");
        let zurueck = neu.replace("http://127.0.0.1:1/p/inhalt/skin/", "");
        let ohne = |s: &str| s.replace('"', "").replace('\'', "").replace(' ', "");
        if ohne(&zurueck) != ohne(&css) {
            let a = ohne(&css); let b = ohne(&zurueck);
            let i = a.chars().zip(b.chars()).position(|(x, y)| x != y).unwrap_or(0);
            panic!("Abweichung bei {i}: …{}… gegen …{}…", &a.chars().skip(i.saturating_sub(40)).take(80).collect::<String>(), &b.chars().skip(i.saturating_sub(40)).take(80).collect::<String>());
        }
    }
}
