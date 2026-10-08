//! Gigabyte-Test (0.7.2, Startreife): ein großes Paket aus dem echten Katalog laden, mittendrin abbrechen, fortsetzen,
//! prüfen und einspielen – derselbe Weg wie in der App (offline_kern::download::paket_laden).
//!
//!   cargo run --release --example gigabyte -- <zielordner> [paket-id] [abbruch-nach-mb]
//!
//! Standard: wikivoyage-de, Abbruch nach 300 MB. Schreibt Zeiten, Durchsatz und Ergebnis auf die Konsole.
//! Für den Speicherbedarf mit `/usr/bin/time -l` starten (maximum resident set size).
use offline_kern::download::{katalog_laden, paket_laden, Auftrag};
use offline_kern::katalog::KatalogEintrag;
use offline_kern::{datum, schluessel::OeffentlicherSchluessel};
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;

const KATALOG: &str = "https://offline-pakete.fsn1.your-objectstorage.com/katalog/katalog.json";

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let ziel = PathBuf::from(args.first().expect("Zielordner fehlt"));
    let id = args.get(1).cloned().unwrap_or_else(|| "wikivoyage-de".into());
    let abbruch_mb: u64 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(300);

    #[derive(serde::Deserialize)]
    struct L { schluessel: Vec<OeffentlicherSchluessel> }
    let bekannte = serde_json::from_str::<L>(include_str!("../../schluessel/oeffentlich.json")).expect("Schlüsselliste").schluessel;
    let (heute, jetzt) = (datum::heute(), datum::jetzt_iso());

    let (k, _) = katalog_laden(KATALOG, &bekannte, &heute, &jetzt, None).expect("Katalog");
    println!("Katalog geprüft (Schlüssel {}), erstellt {}", k.schluessel, k.katalog.erstellt);
    let e: KatalogEintrag = k.katalog.pakete.iter().find(|p| p.id == id).expect("Paket nicht im Katalog").clone();
    println!("{} {} · {:.2} GB", e.id, e.version, e.groesse as f64 / 1e9);

    let lauf = |abbrechen_bei: Option<u64>| {
        let abbruch = Arc::new(AtomicBool::new(false));
        let a2 = abbruch.clone();
        let start = Instant::now();
        let mut letzte = 0u64;
        let mut f = |p: offline_kern::download::Fortschritt| {
            if p.geladen / 100_000_000 > letzte / 100_000_000 {
                println!("  {:>6.0} MB von {:.0} MB · {:.1} MB/s", p.geladen as f64 / 1e6, p.gesamt as f64 / 1e6, p.geladen as f64 / 1e6 / start.elapsed().as_secs_f64());
            }
            letzte = p.geladen;
            if abbrechen_bei.is_some_and(|g| p.geladen >= g) { a2.store(true, Ordering::Relaxed); }
        };
        let mut auftrag = Auftrag { bekannte: &bekannte, heute: &heute, jetzt_iso: &jetzt, abbruch, fortschritt: &mut f };
        let r = paket_laden(&k.katalog.basis, &e, &ziel, &mut auftrag);
        (r, start.elapsed())
    };

    println!("1. Laden, Abbruch nach {abbruch_mb} MB");
    let (r, t) = lauf(Some(abbruch_mb * 1_000_000));
    println!("   Ergebnis nach {:.0} s: {}", t.as_secs_f64(), match &r { Ok(_) => "fertig (Abbruch kam zu spät)".to_string(), Err(e) => format!("abgebrochen – {}", e.0) });

    println!("2. Fortsetzen bis zum Ende");
    let (r, t) = lauf(None);
    match r {
        Ok(x) => println!("   Fertig nach {:.0} s: {} {} in {} (aus Vorhandenem übernommen: {:.0} MB)", t.as_secs_f64(), x.id, x.version, x.ordner.display(), x.kopiert_bytes as f64 / 1e6),
        Err(e) => { println!("   FEHLER: {}", e.0); std::process::exit(1); }
    }

    println!("3. Noch einmal laden (schon installiert, gleiche Version)");
    let (r, t) = lauf(None);
    println!("   nach {:.1} s: {}", t.as_secs_f64(), match r { Ok(x) => format!("ok, {} kopiert", x.kopiert_bytes), Err(e) => e.0 });
}
