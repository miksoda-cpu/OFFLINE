//! Dieselben Fälle wie werkzeug/test.mjs – plus Abgleich gegen das echte Paket und Einspielen mit Tausch.

use offline_kern::*;
use std::path::{Path, PathBuf};
use std::process::Command;

fn wurzel() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("..")
}

fn bekannte() -> Vec<OeffentlicherSchluessel> {
    schluessel_laden(&wurzel().join("schluessel/oeffentlich.json")).unwrap()
}

/// Das echte Paket aus web/pakete – wenn es existiert (es wird vom Werkzeug gebaut).
fn echtes_paket() -> Option<PathBuf> {
    std::fs::read_dir(wurzel().join("web/pakete")).ok()?.flatten().map(|e| e.path()).find(|p| p.join("paket.json").exists())
}

const HEUTE: &str = "2026-09-24";

fn temp(name: &str) -> PathBuf {
    let p = std::env::temp_dir().join(format!("offline-kern-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&p);
    std::fs::create_dir_all(&p).unwrap();
    p
}

fn kopiere(von: &Path, nach: &Path) {
    std::fs::create_dir_all(nach).unwrap();
    for e in std::fs::read_dir(von).unwrap().flatten() {
        let z = nach.join(e.file_name());
        if e.path().is_dir() { kopiere(&e.path(), &z) } else { std::fs::copy(e.path(), z).unwrap(); }
    }
}

#[test]
fn echtes_paket_wird_akzeptiert_und_stimmt_mit_node_ueberein() {
    let Some(p) = echtes_paket() else { eprintln!("kein gebautes Paket – übersprungen"); return };
    let g = paket_pruefen(&p, &bekannte(), HEUTE).expect("echtes Paket muss gültig sein");
    assert_eq!(g.manifest.id, "at-basis");
    assert_eq!(g.manifest.dateien.len(), 5);
    // Node-Werkzeug muss zum selben Ergebnis kommen
    let aus = Command::new("node").arg(wurzel().join("werkzeug/paket.mjs")).arg("pruefen").arg(&p).output().unwrap();
    assert!(aus.status.success(), "node: {}", String::from_utf8_lossy(&aus.stderr));
    assert!(String::from_utf8_lossy(&aus.stdout).contains(&format!("Schlüssel {}", g.schluessel)));
}

#[test]
fn manipulationen_fallen_auf() {
    let Some(p) = echtes_paket() else { return };
    let t = temp("manip");
    kopiere(&p, &t);
    let b = bekannte();

    // Datei verändert
    std::fs::write(t.join("inhalt/notrufe.json"), b"{}").unwrap();
    let e = paket_pruefen(&t, &b, HEUTE).unwrap_err().0;
    assert!(e.starts_with("Größe falsch: inhalt/notrufe.json"), "{e}");
    kopiere(&p, &t);

    // gleiche Größe, anderer Inhalt
    let orig = std::fs::read(t.join("inhalt/notrufe.json")).unwrap();
    let mut kaputt = orig.clone();
    kaputt[10] ^= 0x01;
    std::fs::write(t.join("inhalt/notrufe.json"), &kaputt).unwrap();
    assert_eq!(paket_pruefen(&t, &b, HEUTE).unwrap_err().0, "Prüfsumme falsch: inhalt/notrufe.json");
    std::fs::write(t.join("inhalt/notrufe.json"), &orig).unwrap();

    // Manifest um ein Leerzeichen verändert
    let mut m = std::fs::read(t.join("paket.json")).unwrap();
    m.push(b' ');
    std::fs::write(t.join("paket.json"), &m).unwrap();
    assert_eq!(paket_pruefen(&t, &b, HEUTE).unwrap_err().0, "Signatur: Signatur passt nicht zum Inhalt");
    kopiere(&p, &t);

    // Datei fehlt
    std::fs::remove_file(t.join("inhalt/sirenen.json")).unwrap();
    assert_eq!(paket_pruefen(&t, &b, HEUTE).unwrap_err().0, "Datei fehlt: inhalt/sirenen.json");
    kopiere(&p, &t);

    // Schlüssel abgelaufen / unbekannt / falscher Zweck
    let mut abgelaufen = b.clone();
    abgelaufen[0].gueltig_bis = Some("2020-01-01".into());
    assert!(paket_pruefen(&t, &abgelaufen, HEUTE).unwrap_err().0.contains("abgelaufen"));
    assert!(paket_pruefen(&t, &[], HEUTE).unwrap_err().0.contains("Unbekannter Schlüssel"));
    let mut nur_katalog = b.clone();
    nur_katalog[0].zweck = vec!["katalog".into()];
    assert!(paket_pruefen(&t, &nur_katalog, HEUTE).unwrap_err().0.contains("nicht für pakete"));
}

#[test]
fn katalog_gegen_node_gebaut() {
    let k = wurzel().join("web/katalog");
    if !k.join("katalog.json").exists() { return }
    let bytes = std::fs::read(k.join("katalog.json")).unwrap();
    let sig: Signatur = serde_json::from_slice(&std::fs::read(k.join("katalog.sig")).unwrap()).unwrap();
    let g = katalog_pruefen(&bytes, &sig, &bekannte(), HEUTE, "2026-09-24T12:00:00Z", None).unwrap();
    assert!(!g.veraltet);
    assert!(g.katalog.pakete.iter().any(|p| p.id == "at-basis" && p.status == "verfuegbar"));
    // Rollback
    let e = katalog_pruefen(&bytes, &sig, &bekannte(), HEUTE, "2026-09-24T12:00:00Z", Some("2099-01-01T00:00:00Z")).unwrap_err();
    assert!(e.0.contains("Rollback"));
    // abgelaufen
    assert!(katalog_pruefen(&bytes, &sig, &bekannte(), HEUTE, "2099-01-01T00:00:00Z", None).unwrap().veraltet);
    // manipuliert
    let mut m = bytes.clone();
    m.push(b' ');
    assert!(katalog_pruefen(&m, &sig, &bekannte(), HEUTE, "2026-09-24T12:00:00Z", None).is_err());
}

#[test]
fn teil_pruefsummen_wie_node() {
    let t = temp("teile");
    let daten: Vec<u8> = (0..2_500_000u32).map(|i| (i.wrapping_mul(7) & 0xff) as u8).collect();
    std::fs::write(t.join("gross.bin"), &daten).unwrap();
    let h = hash::hash_datei(&t.join("gross.bin"), 1_000_000).unwrap();
    assert_eq!(h.groesse, 2_500_000);
    assert_eq!(h.sha256, hash::sha256_hex(&daten));
    assert_eq!(h.teile.len(), 3);
    assert_eq!(h.teile[0], hash::sha256_hex(&daten[..1_000_000]));
    assert_eq!(h.teile[2], hash::sha256_hex(&daten[2_000_000..]));
}

fn m(version: &str, dateien: Vec<Datei>) -> Manifest {
    let groesse = dateien.iter().map(|d| d.groesse).sum();
    Manifest {
        format: 1, id: "x".into(), version: version.into(), titel: "t".into(), beschreibung: "b".into(), art: "inhalt".into(),
        sprache: "de-AT".into(), lizenz: "l".into(), herausgeber: "h".into(), pro: false, app_min: "0.1.0".into(),
        erstellt: "2026-01-01T00:00:00Z".into(), aenderungen: String::new(), quellen: vec![], dateien, groesse,
    }
}
fn d(pfad: &str, sha: &str, groesse: u64) -> Datei {
    Datei { pfad: pfad.into(), sha256: sha.into(), groesse, teilgroesse: None, teile: None }
}

#[test]
fn delta_wie_node() {
    let gross = |sha: &str, teile: &[&str]| Datei { pfad: "inhalt/gross".into(), sha256: sha.into(), groesse: 250, teilgroesse: Some(100), teile: Some(teile.iter().map(|s| s.to_string()).collect()) };
    let alt = m("2026.01.01", vec![d("inhalt/a", "aa", 10), d("inhalt/b", "bb", 10), d("inhalt/weg", "ww", 10), gross("g1", &["t1", "t2", "t3"])]);
    let neu = m("2026.01.02", vec![d("inhalt/a", "aa", 10), d("inhalt/b", "b2", 10), d("inhalt/neu", "nn", 5), gross("g2", &["t1", "X", "t3"])]);
    let dl = delta(Some(&alt), &neu);
    assert_eq!(dl.laden.iter().map(|l| l.pfad.as_str()).collect::<Vec<_>>(), ["inhalt/b", "inhalt/neu", "inhalt/gross"]);
    assert_eq!(dl.laden[2].teile, vec![1]);
    assert_eq!(dl.bytes, 10 + 5 + 100);
    assert_eq!(dl.loeschen, vec!["inhalt/weg"]);
    let neu2 = m("2026.01.02", vec![gross("g3", &["t1", "t2", "Y"])]);
    assert_eq!(delta(Some(&alt), &neu2).bytes, 50, "letztes Teil ist kürzer");
    assert_eq!(delta(None, &neu).bytes, neu.groesse, "Neuinstallation lädt alles");
}

#[test]
fn einspielen_mit_tausch_und_aufraeumen() {
    let Some(p) = echtes_paket() else { return };
    let b = bekannte();
    let wurzel = temp("install");

    let e = einspielen(&p, &wurzel, &b, HEUTE, false).unwrap();
    assert_eq!(e.ersetzt, None);
    assert!(wurzel.join("at-basis-2026.09.24/paket.json").exists());
    assert!(!wurzel.join("at-basis-2026.09.24.neu").exists());
    assert!(paket_pruefen(&e.ordner, &b, HEUTE).is_ok());

    // Nochmal dieselbe Version → abgelehnt
    assert!(einspielen(&p, &wurzel, &b, HEUTE, false).unwrap_err().0.contains("bereits installiert"));

    // Beschädigte Quelle → kein Tausch, alter Stand bleibt unangetastet
    let kaputt = temp("kaputt");
    kopiere(&p, &kaputt);
    std::fs::write(kaputt.join("inhalt/notrufe.json"), b"x").unwrap();
    assert!(einspielen(&kaputt, &wurzel, &b, HEUTE, true).is_err());
    assert!(paket_pruefen(&wurzel.join("at-basis-2026.09.24"), &b, HEUTE).is_ok());

    // Halber Zustand nach „Stromausfall“: .alt vorhanden, Hauptordner weg → wiederherstellen
    std::fs::rename(wurzel.join("at-basis-2026.09.24"), wurzel.join("at-basis-2026.09.24.alt")).unwrap();
    std::fs::create_dir_all(wurzel.join("at-basis-2026.09.25.neu")).unwrap();
    let meld = aufraeumen(&wurzel).unwrap();
    assert_eq!(meld.len(), 2, "{meld:?}");
    assert!(wurzel.join("at-basis-2026.09.24/paket.json").exists());
    assert!(!wurzel.join("at-basis-2026.09.25.neu").exists());
    assert_eq!(einspielen::installierte_version(&wurzel, "at-basis").unwrap().0, "2026.09.24");
}
