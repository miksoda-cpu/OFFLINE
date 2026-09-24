//! Kommandozeile des Kerns – zum Testen und für Skripte. Die Desktop-App ruft dieselben Funktionen direkt auf.

use offline_kern::{aufraeumen, datum, delta, einspielen, paket_pruefen, schluessel_laden, Manifest};
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
        Some("aufraeumen") => {
            let wurzel = args.get(1).ok_or(offline_kern::Fehler("Verwendung: aufraeumen <installationsordner>".into()))?;
            for m in aufraeumen(Path::new(wurzel))? {
                println!("{m}");
            }
        }
        _ => println!("offline-kern\n\n  pruefen <paketordner>\n  delta <alt/paket.json|-> <neu/paket.json>\n  einspielen <paketordner> <installationsordner> [--downgrade]\n  aufraeumen <installationsordner>"),
    }
    Ok(())
}

fn main() {
    if let Err(e) = lauf() {
        eprintln!("FEHLER: {e}");
        std::process::exit(1);
    }
}
