//! Kommandozeile des Kerns – zum Testen und für Skripte. Die Desktop-App ruft dieselben Funktionen direkt auf.

use offline_kern::{aufraeumen, datum, delta, download, einspielen, paket_pruefen, schluessel_laden, Auftrag, Manifest};
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::path::{Path, PathBuf};

fn schluessel() -> Result<Vec<offline_kern::OeffentlicherSchluessel>, offline_kern::Fehler> {
    let pfad = std::env::var("OFFLINE_SCHLUESSEL_DATEI")
        .map(PathBuf::from)
        .unwrap_or_else(|_| Path::new(env!("CARGO_MANIFEST_DIR")).join("../schluessel/oeffentlich.json"));
    schluessel_laden(&pfad)
}

fn mb(n: u64) -> String {
    if n < 1_000_000 { format!("{:.1} kB", n as f64 / 1e3) } else if n < 1_000_000_000 { format!("{:.1} MB", n as f64 / 1e6) } else { format!("{:.2} GB", n as f64 / 1e9) }
}

fn lauf() -> Result<(), offline_kern::Fehler> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let heute = datum::heute();
    match args.first().map(String::as_str) {
        Some("pruefen") => {
            let ordner = args.get(1).ok_or(offline_kern::Fehler("Verwendung: pruefen <paketordner>".into()))?;
            let g = paket_pruefen(Path::new(ordner), &schluessel()?, &heute)?;
            println!("OK: {} {} – {} Dateien, Schlüssel {}", g.manifest.id, g.manifest.version, g.manifest.dateien.len(), g.schluessel);
        }
        Some("delta") => {
            let (alt, neu) = (args.get(1), args.get(2));
            let (Some(alt), Some(neu)) = (alt, neu) else { return Err(offline_kern::Fehler("Verwendung: delta <alt/paket.json|-> <neu/paket.json>".into())) };
            let a: Option<Manifest> = if alt == "-" { None } else { Some(serde_json::from_slice(&std::fs::read(alt)?)?) };
            let n: Manifest = serde_json::from_slice(&std::fs::read(neu)?)?;
            let d = delta(a.as_ref(), &n);
            for l in &d.laden {
                println!("  laden   {}  {}{}", l.pfad, mb(l.bytes), if l.teile.is_empty() { String::new() } else { format!(" ({} Teile)", l.teile.len()) });
            }
            for l in &d.loeschen {
                println!("  löschen {l}");
            }
            println!("Zu laden: {} von {} ({} %)", mb(d.bytes), mb(d.gesamt), 100 * d.bytes / d.gesamt.max(1));
        }
        Some("einspielen") => {
            let (Some(quelle), Some(wurzel)) = (args.get(1), args.get(2)) else { return Err(offline_kern::Fehler("Verwendung: einspielen <paketordner> <installationsordner> [--downgrade]".into())) };
            let downgrade = args.iter().any(|a| a == "--downgrade");
            let e = einspielen(Path::new(quelle), Path::new(wurzel), &schluessel()?, &heute, downgrade)?;
            println!("Eingespielt: {} {} → {} ({} kopiert{})", e.id, e.version, e.ordner.display(), mb(e.kopiert_bytes), e.ersetzt.map(|v| format!(", ersetzt {v}")).unwrap_or_default());
        }
        Some("katalog") => {
            let url = args.get(1).ok_or(offline_kern::Fehler("Verwendung: katalog <katalog-url>".into()))?;
            let (g, _) = download::katalog_laden(url, &schluessel()?, &heute, &datum::jetzt_iso(), None)?;
            println!("Katalog vom {} (Schlüssel {}){}", g.katalog.erstellt, g.schluessel, if g.veraltet { " – VERALTET" } else { "" });
            for p in &g.katalog.pakete {
                println!("  {:14} {:12} {:>10}  {}  {}", p.id, p.version, mb(p.groesse), p.status, p.titel);
            }
        }
        Some("laden") => {
            let (Some(url), Some(id), Some(wurzel)) = (args.get(1), args.get(2), args.get(3)) else { return Err(offline_kern::Fehler("Verwendung: laden <katalog-url> <paket-id> <installationsordner>".into())) };
            let bekannte = schluessel()?;
            let (g, _) = download::katalog_laden(url, &bekannte, &heute, &datum::jetzt_iso(), None)?;
            let eintrag = g.katalog.pakete.iter().find(|p| &p.id == id).ok_or(offline_kern::Fehler(format!("{id} nicht im Katalog")))?;
            let mut zuletzt = 0u64;
            let mut melde = |f: offline_kern::Fortschritt| {
                if f.geladen - zuletzt >= 1_000_000 || f.geladen == f.gesamt { eprintln!("  {} {} / {}", f.datei, mb(f.geladen), mb(f.gesamt)); zuletzt = f.geladen; }
            };
            let mut a = Auftrag { bekannte: &bekannte, heute: &heute, jetzt_iso: &datum::jetzt_iso(), abbruch: Arc::new(AtomicBool::new(false)), fortschritt: &mut melde };
            let e = download::paket_laden(&g.katalog.basis, eintrag, Path::new(wurzel), &mut a)?;
            println!("Geladen und eingespielt: {} {} → {} ({} geladen{})", e.id, e.version, e.ordner.display(), mb(e.kopiert_bytes), e.ersetzt.map(|v| format!(", ersetzt {v}")).unwrap_or_default());
        }
        Some("modul-probe") => {
            // Für werkzeug/sandbox-probe.mjs: ein Modul über den echten Modulserver ausliefern, eingebettet von der Prüfseite.
            let (Some(ordner), Some(bruecke), Some(einbetten)) = (args.get(1), args.get(2), args.get(3)) else {
                return Err(offline_kern::Fehler("Verwendung: modul-probe <modulordner> <bruecke.js> <erlaubter-einbetter>".into()));
            };
            let js = std::fs::read_to_string(bruecke)?.replace("__OFFLINE_INFO__", r#"{"version":"probe","alter":null}"#);
            let srv = offline_kern::modulserver::Modulserver::starten_mit(PathBuf::from(ordner), format!("<script>{js}</script>"), einbetten)?;
            println!("{}", srv.url());
            // läuft, bis stdin geschlossen wird
            let _ = std::io::Read::read_to_end(&mut std::io::stdin(), &mut Vec::new());
        }
        Some("aufraeumen") => {
            let wurzel = args.get(1).ok_or(offline_kern::Fehler("Verwendung: aufraeumen <installationsordner>".into()))?;
            for m in aufraeumen(Path::new(wurzel))? {
                println!("{m}");
            }
        }
        _ => println!("offline-kern\n\n  pruefen <paketordner>\n  delta <alt/paket.json|-> <neu/paket.json>\n  einspielen <paketordner> <installationsordner> [--downgrade]\n  katalog <katalog-url>\n  laden <katalog-url> <paket-id> <installationsordner>\n  aufraeumen <installationsordner>\n  modul-probe <modulordner> <bruecke.js> <erlaubter-einbetter>"),
    }
    Ok(())
}

fn main() {
    if let Err(e) = lauf() {
        eprintln!("FEHLER: {e}");
        std::process::exit(1);
    }
}
