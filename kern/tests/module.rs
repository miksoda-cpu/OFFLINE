//! Module (`art = "modul"`): dieselben Fälle wie der Abschnitt „Module“ in werkzeug/test.mjs.
//! SICHERHEIT.md, Abschnitt Module: nur Redaktionsschlüssel, pruefstatus redaktion, Code nur unter inhalt/modul/, höchstens 2 MB.

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use ed25519_dalek::{Signer, SigningKey};
use offline_kern::*;
use std::path::{Path, PathBuf};
use std::process::Command;

const HEUTE: &str = "2026-09-29";

struct Schluessel {
    signing: SigningKey,
    eintrag: OeffentlicherSchluessel,
}

fn schluessel(saat: u8, zweck: &[&str]) -> Schluessel {
    let signing = SigningKey::from_bytes(&[saat; 32]);
    let roh = signing.verifying_key().to_bytes();
    let eintrag = OeffentlicherSchluessel {
        id: schluessel::schluessel_id(&roh),
        algorithmus: "ed25519".into(),
        oeffentlich: B64.encode(roh),
        zweck: zweck.iter().map(|z| z.to_string()).collect(),
        gueltig_ab: None,
        gueltig_bis: None,
        bezeichnung: "Test".into(),
    };
    Schluessel { signing, eintrag }
}

fn temp(name: &str) -> PathBuf {
    let p = std::env::temp_dir().join(format!("offline-modul-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&p);
    std::fs::create_dir_all(&p).unwrap();
    p
}

/// Baut ein Paket von Hand – so, wie ein Angreifer es liefern könnte – und signiert es mit `k`.
fn roh(name: &str, dateien: &[(&str, &[u8])], art: &str, pruefstatus: Option<&str>, datenversion: Option<u32>, k: &Schluessel) -> PathBuf {
    let ordner = temp(name);
    let mut liste = Vec::new();
    for (p, inhalt) in dateien {
        let ziel = paket::datei_pfad(&ordner, &format!("inhalt/{p}"));
        std::fs::create_dir_all(ziel.parent().unwrap()).unwrap();
        std::fs::write(&ziel, inhalt).unwrap();
        let h = hash::hash_datei(&ziel, 0).unwrap();
        liste.push(Datei { pfad: format!("inhalt/{p}"), groesse: h.groesse, sha256: h.sha256, teilgroesse: None, teile: None });
    }
    let m = Manifest {
        format: 1, id: "roh".into(), version: "2026.09.29".into(), titel: "Roh".into(), beschreibung: "Roh".into(), art: art.into(),
        sprache: "de-AT".into(), lizenz: "CC0".into(), herausgeber: "Test".into(), app_min: "0.1.0".into(), erstellt: "2026-09-29T00:00:00Z".into(),
        pruefstatus: pruefstatus.map(Into::into), datenversion, groesse: liste.iter().map(|d| d.groesse).sum(), dateien: liste,
        ..Default::default()
    };
    let bytes = serde_json::to_vec_pretty(&m).unwrap();
    std::fs::write(ordner.join("paket.json"), &bytes).unwrap();
    let sig = Signatur { algorithmus: "ed25519".into(), schluessel: k.eintrag.id.clone(), signatur: B64.encode(k.signing.sign(&bytes).to_bytes()) };
    std::fs::write(ordner.join("paket.sig"), serde_json::to_vec(&sig).unwrap()).unwrap();
    ordner
}

const OBERFLAECHE: (&str, &[u8]) = ("modul/index.html", b"<script>offline.version</script>");

fn fehler(ordner: &Path, bekannte: &[OeffentlicherSchluessel]) -> String {
    paket_pruefen(ordner, bekannte, HEUTE).map(|_| String::from("ok")).unwrap_or_else(|e| e.0)
}

#[test]
fn modul_mit_redaktionsschluessel_ist_gueltig() {
    let r = schluessel(1, &["module"]);
    let o = roh("gut", &[OBERFLAECHE, ("modul/app.js", b"1"), ("daten.json", b"{}")], "modul", Some("redaktion"), Some(1), &r);
    let g = paket_pruefen(&o, &[r.eintrag.clone()], HEUTE).expect("gültiges Modul");
    assert_eq!(g.manifest.art, "modul");
    assert_eq!(g.manifest.datenversion, Some(1));
}

#[test]
fn modul_mit_katalogschluessel_wird_abgelehnt() {
    let k = schluessel(2, &["pakete", "katalog"]);
    let r = schluessel(1, &["module"]);
    let o = roh("katalog", &[OBERFLAECHE], "modul", Some("redaktion"), Some(1), &k);
    assert!(fehler(&o, &[k.eintrag.clone(), r.eintrag.clone()]).contains("Module nur mit dem Redaktionsschlüssel"));
    let beides = schluessel(3, &["module", "katalog", "pakete"]);
    let o = roh("beides", &[OBERFLAECHE], "modul", Some("redaktion"), Some(1), &beides);
    assert!(fehler(&o, &[beides.eintrag.clone()]).contains("nie mit einem Katalogschlüssel"));
}

#[test]
fn redaktionsschluessel_signiert_keine_gewoehnlichen_pakete() {
    let r = schluessel(1, &["module"]);
    let o = roh("inhalt", &[("a.json", b"{}")], "inhalt", None, None, &r);
    assert!(fehler(&o, &[r.eintrag.clone()]).contains("nicht für pakete freigegeben"));
}

#[test]
fn modul_pflichtangaben() {
    let r = schluessel(1, &["module"]);
    let b = [r.eintrag.clone()];
    assert!(fehler(&roh("p1", &[OBERFLAECHE], "modul", Some("community"), Some(1), &r), &b).contains("pruefstatus redaktion"));
    assert!(fehler(&roh("p2", &[OBERFLAECHE], "modul", None, Some(1), &r), &b).contains("pruefstatus redaktion"));
    assert!(fehler(&roh("p3", &[OBERFLAECHE], "modul", Some("redaktion"), None, &r), &b).contains("datenversion"));
    assert!(fehler(&roh("p4", &[("modul/app.html", b"<p>x</p>")], "modul", Some("redaktion"), Some(1), &r), &b).contains("ohne inhalt/modul/index.html"));
}

#[test]
fn skripte_ausserhalb_von_modul_werden_abgelehnt() {
    let r = schluessel(1, &["module"]);
    let k = schluessel(2, &["pakete", "katalog"]);
    let b = [r.eintrag.clone(), k.eintrag.clone()];
    let o = roh("js", &[OBERFLAECHE, ("daten/helfer.js", b"1")], "modul", Some("redaktion"), Some(1), &r);
    assert_eq!(fehler(&o, &b), "Skript außerhalb von inhalt/modul/: inhalt/daten/helfer.js");
    for (i, seite) in ["<script>alert(1)</script>", "<img src=x onerror=\"x()\">", "<a href=\"javascript:x()\">", "<svg><SCRIPT>1</SCRIPT></svg>"].iter().enumerate() {
        let o = roh(&format!("seite{i}"), &[OBERFLAECHE, ("seite.html", seite.as_bytes())], "modul", Some("redaktion"), Some(1), &r);
        assert_eq!(fehler(&o, &b), "Skript in einer Seite außerhalb von inhalt/modul/: inhalt/seite.html", "{seite}");
    }
    // gewöhnliche Pakete: überhaupt kein Code
    assert_eq!(fehler(&roh("inhalt-js", &[("a.js", b"1")], "inhalt", None, None, &k), &b), "Pakete enthalten keinen Code: inhalt/a.js");
    assert_eq!(fehler(&roh("inhalt-html", &[("a.html", b"<p onclick=\"x()\">")], "inhalt", None, None, &k), &b), "Skript in einer Seite außerhalb von inhalt/modul/: inhalt/a.html");
    assert_eq!(fehler(&roh("text", &[("a.html", b"<p>harmlos</p>"), ("b.svg", b"<svg><text>on the road = gut</text></svg>")], "inhalt", None, None, &k), &b), "ok");
}

#[test]
fn modul_oberflaeche_hoechstens_2_mb() {
    let r = schluessel(1, &["module"]);
    let gross = vec![b'x'; 2 * 1024 * 1024];
    let o = roh("gross", &[OBERFLAECHE, ("modul/bild.svg", &gross)], "modul", Some("redaktion"), Some(1), &r);
    assert!(fehler(&o, &[r.eintrag.clone()]).contains("Modul-Oberfläche zu groß"));
}

#[test]
fn einspielen_lehnt_modul_mit_falschem_schluessel_ab_und_nimmt_das_richtige() {
    let r = schluessel(1, &["module"]);
    let k = schluessel(2, &["pakete", "katalog"]);
    let b = [r.eintrag.clone(), k.eintrag.clone()];
    let wurzel = temp("wurzel");
    let falsch = roh("falsch", &[OBERFLAECHE], "modul", Some("redaktion"), Some(1), &k);
    assert!(einspielen(&falsch, &wurzel, &b, HEUTE, false).is_err());
    assert!(!wurzel.join("roh-2026.09.29").exists(), "nichts eingespielt");
    let gut = roh("richtig", &[OBERFLAECHE], "modul", Some("redaktion"), Some(1), &r);
    einspielen(&gut, &wurzel, &b, HEUTE, false).expect("Modul mit Redaktionsschlüssel");
    assert!(wurzel.join("roh-2026.09.29/inhalt/modul/index.html").exists());
}

/// Gegenprobe: Das Node-Werkzeug baut Wichteln aus dem Paket-Kit mit einem Redaktionsschlüssel, der Rust-Kern nimmt es an.
#[test]
fn wichteln_von_node_gebaut_nimmt_der_kern_an() {
    let wurzel = Path::new(env!("CARGO_MANIFEST_DIR")).join("..");
    let t = temp("wichteln-node");
    let skript = r#"
      import { schluesselErzeugen, privatAusPem, paketBauen } from "./werkzeug/paket-lib.mjs";
      import { writeFile } from "node:fs/promises";
      const [ziel] = process.argv.slice(1);
      const k = schluesselErzeugen("Redaktion Test", ["module"]);
      const { ziel: ordner } = await paketBauen("paket-kit/beispiel/wichteln", ziel, privatAusPem(k.privatPem));
      await writeFile(ziel + "/schluessel.json", JSON.stringify({ format: 1, schluessel: [k.oeffentlich] }));
      console.log(ordner);
    "#;
    let aus = Command::new("node").current_dir(&wurzel).args(["--input-type=module", "-e", skript]).arg(&t).output().expect("node");
    assert!(aus.status.success(), "node: {}", String::from_utf8_lossy(&aus.stderr));
    let ordner = PathBuf::from(String::from_utf8_lossy(&aus.stdout).trim());
    let bekannte = schluessel_laden(&t.join("schluessel.json")).unwrap();
    let heute = datum::heute();
    let g = paket_pruefen(&ordner, &bekannte, &heute).expect("Wichteln muss gültig sein");
    assert_eq!((g.manifest.id.as_str(), g.manifest.art.as_str(), g.manifest.pruefstatus.as_deref()), ("wichteln", "modul", Some("redaktion")));
}

/// Vorschau: Node baut Wichteln und einen Katalog, der Kern liest die Folien aus dem Ordner und über den Katalog
/// (jedes Bild gegen die Prüfsumme im Katalog). Ein ausgetauschtes Bild fällt auf.
#[test]
fn vorschau_aus_ordner_und_katalog() {
    let wurzel = Path::new(env!("CARGO_MANIFEST_DIR")).join("..");
    let t = temp("vorschau-node");
    let skript = r#"
      import { schluesselErzeugen, privatAusPem, paketBauen, katalogBauen } from "./werkzeug/paket-lib.mjs";
      import { writeFile } from "node:fs/promises";
      const [ziel] = process.argv.slice(1);
      const r = schluesselErzeugen("Redaktion Test", ["module"]);
      const k = schluesselErzeugen("Katalog Test");
      const { ziel: ordner } = await paketBauen("paket-kit/beispiel/wichteln", ziel, privatAusPem(r.privatPem));
      const { bytes } = await katalogBauen([ordner], { basis: ziel + "/", bekannte: [r.oeffentlich, k.oeffentlich], privat: privatAusPem(k.privatPem) });
      await writeFile(ziel + "/schluessel.json", JSON.stringify({ format: 1, schluessel: [r.oeffentlich, k.oeffentlich] }));
      await writeFile(ziel + "/katalog.json", bytes);
      console.log(ordner);
    "#;
    let aus = Command::new("node").current_dir(&wurzel).args(["--input-type=module", "-e", skript]).arg(&t).output().expect("node");
    assert!(aus.status.success(), "node: {}", String::from_utf8_lossy(&aus.stderr));
    let ordner = PathBuf::from(String::from_utf8_lossy(&aus.stdout).trim());
    let bekannte = schluessel_laden(&t.join("schluessel.json")).unwrap();
    let heute = datum::heute();

    let f = vorschau::aus_ordner(&ordner, &bekannte, &heute).expect("Vorschau aus dem Ordner");
    assert_eq!(f.iter().map(|x| x.folie.rolle.as_str()).collect::<Vec<_>>(), ["wofuer", "aussehen", "inhalt", "platz", "herkunft"]);
    assert!(f[0].bild_daten.starts_with("data:image/svg+xml;base64,"));
    assert!(f[1].bild_daten.starts_with("data:image/webp;base64,"));

    let katalog: Katalog = serde_json::from_slice(&std::fs::read(t.join("katalog.json")).unwrap()).unwrap();
    let e = &katalog.pakete[0];
    let lesen = |url: &str| std::fs::read(url).map_err(|e| Fehler(e.to_string()));
    let f2 = vorschau::aus_katalog(&katalog.basis, e, &lesen).expect("Vorschau über den Katalog");
    assert_eq!(f2.len(), 5);
    assert_eq!(f2[2].bild_daten, f[2].bild_daten);

    // Bild auf dem „Server“ ausgetauscht → abgelehnt
    std::fs::write(ordner.join("inhalt/vorschau/3.svg"), b"<svg xmlns='http://www.w3.org/2000/svg'/>").unwrap();
    let fehler = vorschau::aus_katalog(&katalog.basis, e, &lesen).unwrap_err().0;
    assert!(fehler.contains("inhalt/vorschau/3.svg passt nicht zum Katalog"), "{fehler}");
    // und aus dem Ordner schon an der Paketprüfung
    assert!(vorschau::aus_ordner(&ordner, &bekannte, &heute).is_err());
}

// ---------- Skins (art = "skin"): nur Stil, CSS geprüft, Paket- oder Redaktionsschlüssel ----------

const SKIN_CSS: (&str, &[u8]) = ("skin/skin.css", b".of-app{--of-moos:#3f6b34} @font-face{font-family:A;src:url(\"fonts/a.woff2\")}");

#[test]
fn skin_mit_paket_oder_redaktionsschluessel_ist_gueltig() {
    let r = schluessel(1, &["module"]);
    let k = schluessel(2, &["pakete", "katalog"]);
    let b = [r.eintrag.clone(), k.eintrag.clone()];
    for (i, s) in [&r, &k].iter().enumerate() {
        let o = roh(&format!("skin-gut{i}"), &[SKIN_CSS, ("skin/fonts/a.woff2", b"x"), ("skin/flechten/dorf.webp", b"x")], "skin", None, None, s);
        assert_eq!(fehler(&o, &b), "ok");
    }
    let nur_katalog = schluessel(3, &["katalog"]);
    let o = roh("skin-katalog", &[SKIN_CSS], "skin", None, None, &nur_katalog);
    assert!(fehler(&o, &[nur_katalog.eintrag.clone()]).contains("nicht für pakete oder module freigegeben"));
}

#[test]
fn skin_mit_verbotenem_css_scheitert_am_kern() {
    let r = schluessel(1, &["module"]);
    let b = [r.eintrag.clone()];
    for (i, css) in ["@import url(https://x/y.css);", ".a{background:url(https://x/y.png)}", ".a{background:url(../../wir/x)}", ".a{width:expression(alert(1))}", ".a{b:u\\72l(x)}"].iter().enumerate() {
        let o = roh(&format!("skin-boese{i}"), &[("skin/skin.css", css.as_bytes())], "skin", None, None, &r);
        assert!(fehler(&o, &b).starts_with("CSS nicht erlaubt"), "{css}: {}", fehler(&o, &b));
    }
}

#[test]
fn skin_nur_unter_inhalt_skin_und_ohne_code() {
    let r = schluessel(1, &["module"]);
    let b = [r.eintrag.clone()];
    assert!(fehler(&roh("skin-a", &[("skin/stil.css", b"a{}")], "skin", None, None, &r), &b).contains("ohne inhalt/skin/skin.css"));
    assert!(fehler(&roh("skin-b", &[SKIN_CSS, ("daten.json", b"{}")], "skin", None, None, &r), &b).contains("außerhalb von inhalt/skin/"));
    assert!(fehler(&roh("skin-c", &[SKIN_CSS, ("skin/x.js", b"1")], "skin", None, None, &r), &b).contains("Pakete enthalten keinen Code"));
    assert!(fehler(&roh("skin-d", &[SKIN_CSS, ("skin/icons.svg", b"<svg><script>1</script></svg>")], "skin", None, None, &r), &b).contains("Skript in einer Seite"));
}
