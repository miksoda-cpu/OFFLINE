//! Update-Dienst gegen einen lokalen Testserver: Teile, Fortsetzung, Abbruch, Delta, Manipulation, Rollback.

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use ed25519_dalek::{Signer, SigningKey};
use offline_kern::abo::*;
use offline_kern::*;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

// ---------- Testserver mit Range-Unterstützung ----------

#[derive(Default)]
struct Plan {
    /// Anfragen (Pfad, Range-Header)
    anfragen: Vec<(String, Option<String>)>,
    /// Pfad-Teil → einmal nach so vielen Bytes die Verbindung kappen
    abbruch_einmal: Option<(String, usize)>,
    /// Pfad-Teil → ein Byte im Bereich ab diesem Offset verfälschen
    kaputt: Option<(String, u64)>,
}

fn server(dir: PathBuf, plan: Arc<Mutex<Plan>>) -> String {
    let l = TcpListener::bind("127.0.0.1:0").unwrap();
    let adresse = format!("http://{}", l.local_addr().unwrap());
    std::thread::spawn(move || {
        for s in l.incoming().flatten() {
            let (dir, plan) = (dir.clone(), plan.clone());
            std::thread::spawn(move || bediene(s, &dir, &plan));
        }
    });
    adresse
}

fn bediene(mut s: TcpStream, dir: &Path, plan: &Mutex<Plan>) {
    let mut r = BufReader::new(s.try_clone().unwrap());
    let mut zeile = String::new();
    if r.read_line(&mut zeile).is_err() || zeile.is_empty() { return }
    let pfad = zeile.split_whitespace().nth(1).unwrap_or("/").to_string();
    let mut range = None;
    loop {
        let mut h = String::new();
        if r.read_line(&mut h).is_err() || h.trim().is_empty() { break }
        if let Some(v) = h.to_ascii_lowercase().strip_prefix("range:") { range = Some(v.trim().to_string()); }
    }
    let datei = dir.join(pfad.trim_start_matches('/').replace("%20", " "));
    let Ok(mut inhalt) = std::fs::read(&datei) else {
        let _ = s.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
        return;
    };
    let mut p = plan.lock().unwrap();
    p.anfragen.push((pfad.clone(), range.clone()));
    let (status, von, bis) = match range.as_deref().and_then(|r| r.strip_prefix("bytes=")) {
        Some(r) => {
            let (a, b) = r.split_once('-').unwrap();
            let a: u64 = a.parse().unwrap();
            let b: u64 = if b.is_empty() { inhalt.len() as u64 - 1 } else { b.parse().unwrap() };
            (206, a, b)
        }
        None => (200, 0, inhalt.len() as u64 - 1),
    };
    if let Some((teil, off)) = &p.kaputt {
        if pfad.contains(teil.as_str()) && (*off as usize) < inhalt.len() { inhalt[*off as usize] ^= 0xff; }
    }
    let mut koerper = inhalt[von as usize..=bis as usize].to_vec();
    let mut kappen = false;
    if let Some((teil, n)) = p.abbruch_einmal.clone() {
        if pfad.contains(teil.as_str()) { koerper.truncate(n); kappen = true; p.abbruch_einmal = None; }
    }
    drop(p);
    let kopf = if status == 206 {
        format!("HTTP/1.1 206 Partial Content\r\nContent-Range: bytes {von}-{bis}/{}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", inhalt.len(), bis - von + 1)
    } else {
        format!("HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", inhalt.len())
    };
    let _ = s.write_all(kopf.as_bytes());
    let _ = s.write_all(&koerper);
    if !kappen { let _ = s.flush(); }
    // Verbindung fällt beim Drop
}

// ---------- Paket + Katalog bauen (wie das Werkzeug, aber im Test) ----------

struct Schluessel { signing: SigningKey, liste: Vec<OeffentlicherSchluessel> }

fn testschluessel() -> Schluessel {
    let signing = SigningKey::from_bytes(&[7u8; 32]);
    let roh = signing.verifying_key().to_bytes();
    let id = offline_kern::schluessel::schluessel_id(&roh);
    let liste = vec![OeffentlicherSchluessel { id, algorithmus: "ed25519".into(), oeffentlich: B64.encode(roh), zweck: vec!["pakete".into(), "katalog".into()], gueltig_ab: None, gueltig_bis: None, bezeichnung: "Test".into() }];
    Schluessel { signing, liste }
}

fn signatur(k: &Schluessel, bytes: &[u8]) -> String {
    let s = k.signing.sign(bytes);
    serde_json::to_string(&Signatur { algorithmus: "ed25519".into(), schluessel: k.liste[0].id.clone(), signatur: B64.encode(s.to_bytes()) }).unwrap()
}

/// Baut `<server>/<id>-<version>/` mit einer kleinen und einer großen (geteilten) Datei.
fn paket_bauen(server_dir: &Path, k: &Schluessel, version: &str, klein: &[u8], gross: &[u8], teilgroesse: u64) -> (PathBuf, String) {
    let ordner = server_dir.join(format!("test-{version}"));
    std::fs::create_dir_all(ordner.join("inhalt/tief")).unwrap();
    std::fs::write(ordner.join("inhalt/klein.json"), klein).unwrap();
    std::fs::write(ordner.join("inhalt/tief/gross.bin"), gross).unwrap();
    let hk = hash::hash_datei(&ordner.join("inhalt/klein.json"), 0).unwrap();
    let hg = hash::hash_datei(&ordner.join("inhalt/tief/gross.bin"), teilgroesse).unwrap();
    let m = Manifest {
        format: 1, id: "test".into(), version: version.into(), titel: "Test".into(), beschreibung: "b".into(), art: "zim".into(),
        sprache: "de-AT".into(), lizenz: "CC0".into(), herausgeber: "t".into(), pro: false, app_min: "0.1.0".into(),
        erstellt: format!("{}T00:00:00Z", version.replace('.', "-")), aenderungen: String::new(), quellen: vec![],
        dateien: vec![
            Datei { pfad: "inhalt/klein.json".into(), groesse: hk.groesse, sha256: hk.sha256, teilgroesse: None, teile: None },
            Datei { pfad: "inhalt/tief/gross.bin".into(), groesse: hg.groesse, sha256: hg.sha256, teilgroesse: Some(teilgroesse), teile: Some(hg.teile) },
        ],
        groesse: hk.groesse + hg.groesse,
    };
    let bytes = serde_json::to_vec_pretty(&m).unwrap();
    std::fs::write(ordner.join("paket.json"), &bytes).unwrap();
    std::fs::write(ordner.join("paket.sig"), signatur(k, &bytes)).unwrap();
    (ordner, hash::sha256_hex(&bytes))
}

fn katalog_bauen(server_dir: &Path, k: &Schluessel, adresse: &str, version: &str, sha: &str, erstellt: &str) -> KatalogEintrag {
    let e = KatalogEintrag { id: "test".into(), version: version.into(), titel: "Test".into(), beschreibung: "b".into(), art: "zim".into(), pro: false, groesse: 0, app_min: "0.1.0".into(), erstellt: erstellt.into(), aenderungen: String::new(), pfad: format!("test-{version}/"), sha256_manifest: sha.into(), status: "verfuegbar".into() };
    let kat = Katalog { format: 1, erstellt: erstellt.into(), gueltig_bis: "2099-01-01T00:00:00Z".into(), basis: format!("{adresse}/"), pakete: vec![e.clone()] };
    let bytes = serde_json::to_vec_pretty(&kat).unwrap();
    std::fs::create_dir_all(server_dir.join("katalog")).unwrap();
    std::fs::write(server_dir.join("katalog/katalog.json"), &bytes).unwrap();
    std::fs::write(server_dir.join("katalog/katalog.sig"), signatur(k, &bytes)).unwrap();
    e
}

fn temp(name: &str) -> PathBuf {
    let p = std::env::temp_dir().join(format!("offline-dl-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&p);
    std::fs::create_dir_all(&p).unwrap();
    p
}

fn daten(n: usize, seed: u32) -> Vec<u8> {
    (0..n as u32).map(|i| (i.wrapping_mul(2654435761).wrapping_add(seed.wrapping_mul(0x9E37_79B9)) >> 3) as u8).collect()
}

const HEUTE: &str = "2026-09-24";
const JETZT: &str = "2026-09-24T12:00:00Z";

fn auftrag<'a>(k: &'a Schluessel, abbruch: Arc<AtomicBool>, f: &'a mut dyn FnMut(Fortschritt)) -> Auftrag<'a> {
    Auftrag { bekannte: &k.liste, heute: HEUTE, jetzt_iso: JETZT, abbruch, fortschritt: f }
}

#[test]
fn laden_fortsetzen_delta_und_manipulation() {
    let k = testschluessel();
    let srv = temp("srv");
    let wurzel = temp("wurzel");
    let plan = Arc::new(Mutex::new(Plan::default()));
    let adresse = server(srv.clone(), plan.clone());

    let gross1 = daten(250_000, 1);
    let (_, sha1) = paket_bauen(&srv, &k, "2026.09.01", b"{\"v\":1}", &gross1, 100_000);
    let e1 = katalog_bauen(&srv, &k, &adresse, "2026.09.01", &sha1, "2026-09-01T00:00:00Z");

    // 1) Katalog laden + Rollback-Schutz
    let (g, _) = katalog_laden(&format!("{adresse}/katalog/katalog.json"), &k.liste, HEUTE, JETZT, None).unwrap();
    assert_eq!(g.katalog.pakete[0].id, "test");
    assert!(katalog_laden(&format!("{adresse}/katalog/katalog.json"), &k.liste, HEUTE, JETZT, Some("2026-09-02T00:00:00Z")).unwrap_err().0.contains("Rollback"));

    // 2) Erster Download: nach dem ersten Teil abbrechen
    let abbruch = Arc::new(AtomicBool::new(false));
    let ab = abbruch.clone();
    let mut nach_erstem_teil = move |f: Fortschritt| { if f.datei.ends_with("gross.bin") && f.geladen >= 100_000 { ab.store(true, Ordering::Relaxed); } };
    let mut a = auftrag(&k, abbruch.clone(), &mut nach_erstem_teil);
    let err = paket_laden(&g.katalog.basis, &e1, &wurzel, &mut a).unwrap_err();
    assert!(err.0.contains("Abgebrochen"), "{err}");
    assert!(wurzel.join("test-2026.09.01.neu/paket.json").exists(), "Staging bleibt liegen");
    let bisher = plan.lock().unwrap().anfragen.len();

    // 3) Fortsetzen: Teil 0 darf nicht noch einmal angefragt werden; Teil 1 bricht einmal ab und wird wiederholt
    plan.lock().unwrap().abbruch_einmal = Some(("gross.bin".into(), 10));
    let mut meldungen = Vec::new();
    let mut sammle = |f: Fortschritt| meldungen.push(f.geladen);
    let mut a = auftrag(&k, Arc::new(AtomicBool::new(false)), &mut sammle);
    let e = paket_laden(&g.katalog.basis, &e1, &wurzel, &mut a).unwrap();
    assert_eq!(e.version, "2026.09.01");
    assert_eq!(e.ersetzt, None);
    assert!(wurzel.join("test-2026.09.01/inhalt/tief/gross.bin").exists());
    assert!(!wurzel.join("test-2026.09.01.neu").exists());
    let anfragen: Vec<_> = plan.lock().unwrap().anfragen[bisher..].iter().filter(|(p, _)| p.contains("gross.bin")).map(|(_, r)| r.clone().unwrap()).collect();
    assert!(!anfragen.contains(&"bytes=0-99999".to_string()), "Teil 0 wurde neu geladen: {anfragen:?}");
    assert_eq!(anfragen.iter().filter(|r| *r == "bytes=100000-199999").count(), 2, "Teil 1 einmal wiederholt: {anfragen:?}");
    assert_eq!(*meldungen.last().unwrap(), 250_000 + 7, "Fortschritt endet bei der Gesamtgröße");
    assert!(paket_pruefen(&wurzel.join("test-2026.09.01"), &k.liste, HEUTE).is_ok());

    // 4) Version 2: nur klein.json und das letzte Teil der großen Datei ändern sich → Delta lädt nur die
    let mut gross2 = gross1.clone();
    gross2[240_000] ^= 0x55;
    let (_, sha2) = paket_bauen(&srv, &k, "2026.09.02", b"{\"v\":2}", &gross2, 100_000);
    let e2 = katalog_bauen(&srv, &k, &adresse, "2026.09.02", &sha2, "2026-09-02T00:00:00Z");
    let bisher = plan.lock().unwrap().anfragen.len();
    let mut nichts = |_: Fortschritt| {};
    let mut a = auftrag(&k, Arc::new(AtomicBool::new(false)), &mut nichts);
    let e = paket_laden(&adresse, &e2, &wurzel, &mut a).unwrap();
    assert_eq!(e.ersetzt.as_deref(), Some("2026.09.01"));
    assert_eq!(e.kopiert_bytes, 7 + 50_000, "nur klein.json und das kurze letzte Teil");
    let anfragen: Vec<_> = plan.lock().unwrap().anfragen[bisher..].iter().map(|(p, r)| format!("{p} {r:?}")).collect();
    assert!(anfragen.iter().any(|x| x.contains("gross.bin") && x.contains("bytes=200000-249999")), "{anfragen:?}");
    assert!(!anfragen.iter().any(|x| x.contains("bytes=0-99999")), "{anfragen:?}");
    assert!(!wurzel.join("test-2026.09.01").exists() && !wurzel.join("test-2026.09.01.alt").exists());
    assert!(paket_pruefen(&wurzel.join("test-2026.09.02"), &k.liste, HEUTE).is_ok());
    assert!(paket_laden(&adresse, &e2, &wurzel, &mut a).unwrap_err().0.contains("bereits installiert"));

    // 5) Manipulierte Bytes vom Server → nach 3 Versuchen abgelehnt, installierter Stand bleibt
    let (_, sha3) = paket_bauen(&srv, &k, "2026.09.03", b"{\"v\":3}", &daten(250_000, 3), 100_000);
    let e3 = katalog_bauen(&srv, &k, &adresse, "2026.09.03", &sha3, "2026-09-03T00:00:00Z");
    plan.lock().unwrap().kaputt = Some(("gross.bin".into(), 100_005));
    let err = paket_laden(&adresse, &e3, &wurzel, &mut a).unwrap_err();
    assert!(err.0.contains("passt nicht zur Prüfsumme"), "{err}");
    assert!(paket_pruefen(&wurzel.join("test-2026.09.02"), &k.liste, HEUTE).is_ok());
    plan.lock().unwrap().kaputt = None;

    // 6) Manifest passt nicht zum Katalog
    let falsch = KatalogEintrag { sha256_manifest: "0".repeat(64), ..e3.clone() };
    assert!(paket_laden(&adresse, &falsch, &wurzel, &mut a).unwrap_err().0.contains("Prüfsumme"));
}

#[test]
fn abo_faelligkeit_mit_zustand() {
    let e = Einstellungen { intervall: Intervall::Taeglich, fenster: true, von: "22:00".into(), bis: "05:00".into(), ..Default::default() };
    let z = Zustand { letzte_pruefung: Some(100), ..Default::default() };
    let on = Verbindung { online: true, getaktet: Some(false) };
    assert!(!faellig(&e, &z, on, 100 + 3600, "23:00"));
    assert!(faellig(&e, &z, on, 100 + 90_000, "23:00"));
    assert!(!faellig(&e, &z, on, 100 + 90_000, "12:00"));
    assert!(faellig(&e, &z, on, 100 + 90_000, "01:00"));
}
