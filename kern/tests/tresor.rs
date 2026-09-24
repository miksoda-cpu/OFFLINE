use offline_kern::tresor::*;
use std::path::PathBuf;

fn temp() -> PathBuf {
    let p = std::env::temp_dir().join(format!("offline-tresor-{}-{}", std::process::id(), neue_id()));
    std::fs::create_dir_all(&p).unwrap();
    p
}

const JETZT: &str = "2026-09-24T18:00:00Z";

#[test]
fn anlegen_oeffnen_falsches_passwort_wiederherstellung() {
    let d = temp();
    assert!(!existiert(&d));
    let (code, k) = anlegen(&d, "sehr-geheim-1", JETZT).unwrap();
    assert!(existiert(&d));
    assert_eq!(code.len(), 6 * 5 + 5, "6 Gruppen zu 5 Zeichen mit Bindestrichen: {code}");
    assert!(anlegen(&d, "x", JETZT).is_err(), "kein zweiter Tresor");

    let k2 = oeffnen(&d, "sehr-geheim-1").unwrap();
    assert_eq!(k.as_ref(), k2.as_ref());
    assert!(oeffnen(&d, "sehr-geheim-2").is_err());
    assert!(oeffnen(&d, "").is_err());

    // Wiederherstellung: auch klein geschrieben, ohne Bindestriche, mit O statt 0
    let k3 = oeffnen_mit_code(&d, &code.to_lowercase().replace('-', " ").replace('0', "O")).unwrap();
    assert_eq!(k.as_ref(), k3.as_ref());
    assert!(oeffnen_mit_code(&d, "AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA").is_err());
}

#[test]
fn zu_kurzes_passwort() {
    let d = temp();
    assert!(anlegen(&d, "kurz", JETZT).is_err());
    assert!(!existiert(&d));
}

#[test]
fn notizen_und_anhaenge() {
    let d = temp();
    let (_, k) = anlegen(&d, "sehr-geheim-1", JETZT).unwrap();
    assert!(notizen_lesen(&d, &k).unwrap().is_empty());
    let mut n = Notiz { id: neue_id(), titel: "Zugänge".into(), text: "WLAN: 1234".into(), reihe: 7, geaendert: JETZT.into(), anhaenge: vec![] };
    notiz_schreiben(&d, &k, &n).unwrap();
    let a_id = neue_id();
    anhang_schreiben(&d, &k, &a_id, b"%PDF-1.4 scan").unwrap();
    n.anhaenge.push(Anhang { id: a_id.clone(), name: "pass.pdf".into(), typ: "application/pdf".into(), groesse: 13 });
    notiz_schreiben(&d, &k, &n).unwrap();

    let gelesen = notizen_lesen(&d, &k).unwrap();
    assert_eq!(gelesen, vec![n.clone()]);
    assert_eq!(anhang_lesen(&d, &k, &a_id).unwrap().as_slice(), b"%PDF-1.4 scan");

    // Auf der Platte steht nichts im Klartext
    for f in ["notizen", "anhaenge"] {
        for e in std::fs::read_dir(ordner(&d).join(f)).unwrap().flatten() {
            let bytes = std::fs::read(e.path()).unwrap();
            assert!(!bytes.windows(4).any(|w| w == b"WLAN" || w == b"%PDF"), "Klartext auf der Platte in {f}");
        }
    }

    // Falscher Schlüssel liest nichts
    let falsch = oeffnen(&d, "anderes-passwort").err().unwrap();
    assert!(falsch.0.contains("falsch"), "{falsch}");

    notiz_loeschen(&d, &n.id).unwrap();
    anhang_loeschen(&d, &a_id).unwrap();
    assert!(notizen_lesen(&d, &k).unwrap().is_empty());
    assert!(anhang_lesen(&d, &k, &a_id).is_err());
    assert!(notiz_loeschen(&d, "../tresor.json").is_err(), "keine Pfadspiele über die Kennung");
}

#[test]
fn manipulation_faellt_auf() {
    let d = temp();
    let (_, k) = anlegen(&d, "sehr-geheim-1", JETZT).unwrap();
    let n = Notiz { id: neue_id(), titel: "Geld".into(), text: "Bargeld im Buch".into(), reihe: 6, geaendert: JETZT.into(), anhaenge: vec![] };
    notiz_schreiben(&d, &k, &n).unwrap();
    let p = ordner(&d).join("notizen").join(format!("{}.bin", n.id));
    let mut bytes = std::fs::read(&p).unwrap();
    let i = bytes.len() - 20;
    bytes[i] ^= 0x01;
    std::fs::write(&p, &bytes).unwrap();
    let e = notizen_lesen(&d, &k).err().expect("manipulierte Notiz muss abgelehnt werden");
    assert!(e.0.contains("manipuliert"), "{e}");

    // Notiz unter fremder Kennung abgelegt (Datei umbenannt) → Kennung passt nicht zur AAD
    std::fs::write(&p, &{ let mut b = bytes.clone(); b[i] ^= 0x01; b }).unwrap();
    std::fs::rename(&p, ordner(&d).join("notizen").join(format!("{}.bin", neue_id()))).unwrap();
    assert!(notizen_lesen(&d, &k).is_err());
}

#[test]
fn passwort_aendern_und_code_erneuern() {
    let d = temp();
    let (code, k) = anlegen(&d, "sehr-geheim-1", JETZT).unwrap();
    let n = Notiz { id: neue_id(), titel: "Haus".into(), text: "Hauptwasserhahn im Keller".into(), reihe: 8, geaendert: JETZT.into(), anhaenge: vec![] };
    notiz_schreiben(&d, &k, &n).unwrap();

    passwort_aendern(&d, &k, "neues-passwort-9").unwrap();
    assert!(oeffnen(&d, "sehr-geheim-1").is_err());
    let k2 = oeffnen(&d, "neues-passwort-9").unwrap();
    assert_eq!(notizen_lesen(&d, &k2).unwrap()[0].text, "Hauptwasserhahn im Keller");
    // Der alte Code gilt weiter (nur das Passwort wurde getauscht)
    assert!(oeffnen_mit_code(&d, &code).is_ok());

    let code2 = code_erneuern(&d, &k2).unwrap();
    assert_ne!(code, code2);
    assert!(oeffnen_mit_code(&d, &code).is_err());
    assert!(oeffnen_mit_code(&d, &code2).is_ok());
    assert!(passwort_aendern(&d, &k2, "kurz").is_err());
}

#[test]
fn sichern_und_zurueckspielen() {
    let d = temp();
    let (_, k) = anlegen(&d, "sehr-geheim-1", JETZT).unwrap();
    let n = Notiz { id: neue_id(), titel: "Tiere".into(), text: "Chip 9876".into(), reihe: 9, geaendert: JETZT.into(), anhaenge: vec![] };
    notiz_schreiben(&d, &k, &n).unwrap();
    let stick = temp().join("OFFLINE-Tresor-Sicherung");
    let bytes = sichern(&d, &stick).unwrap();
    assert!(bytes > 0);
    assert!(stick.join("tresor.json").exists());

    // Tresor auf einem anderen Gerät wiederherstellen
    let d2 = temp();
    zurueckspielen(&d2, &stick).unwrap();
    let k2 = oeffnen(&d2, "sehr-geheim-1").unwrap();
    assert_eq!(notizen_lesen(&d2, &k2).unwrap(), vec![n]);
    assert!(zurueckspielen(&d2, &temp()).is_err(), "Ordner ohne tresor.json wird abgelehnt");
    assert!(existiert(&d2), "fehlgeschlagenes Zurückspielen lässt den alten Tresor stehen");
}

#[test]
fn notfallmappe_vorlage() {
    let m = notfallmappe(JETZT);
    assert_eq!(m.len(), 10);
    assert_eq!(m[0].reihe, 1);
    assert!(m[1].text.contains("144"));
    assert_eq!(m.iter().map(|n| n.id.clone()).collect::<std::collections::HashSet<_>>().len(), 10);
}
