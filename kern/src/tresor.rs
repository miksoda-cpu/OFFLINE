//! Tresor: verschlüsselter Bereich für Notfallmappe, Passwörter, Ausweisscans.
//!
//! Grundsatz: Der Tresor verlässt das Gerät nie unverschlüsselt, und wir haben keinen Schlüssel.
//!
//! Aufbau von `<datenordner>/tresor/`:
//!   tresor.json         Kopf: Argon2-Parameter, Salz, der zweimal verpackte Tresorschlüssel
//!   notizen/<id>.bin    je Notiz: 24 Byte Nonce + XChaCha20-Poly1305-Chiffrat (AAD = Notiz-Id)
//!   anhaenge/<id>.bin   je Anhang genauso (AAD = Anhang-Id)
//!
//! Zwei Schlüsselebenen: Ein zufälliger Tresorschlüssel (DEK, 256 Bit) verschlüsselt den Inhalt. Er liegt zweimal
//! verpackt im Kopf – einmal mit dem Schlüssel aus dem Passwort (Argon2id), einmal mit dem Schlüssel aus dem
//! Wiederherstellungscode. Ein Passwortwechsel packt nur den DEK neu, nicht den Inhalt.
//!
//! Der Schlüssel im Arbeitsspeicher ist `Zeroizing` – beim Sperren wird er überschrieben.

use crate::Fehler;
use argon2::{Algorithm, Argon2, Params, Version};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use chacha20poly1305::aead::{Aead, KeyInit, Payload};
use chacha20poly1305::{XChaCha20Poly1305, XNonce};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use zeroize::Zeroizing;

pub const FORMAT: u32 = 1;
/// Argon2id-Voreinstellung: ca. 0,3–0,8 s auf einem schwachen Laptop. Wird im Kopf gespeichert, damit man sie später erhöhen kann.
pub const ARGON_M_KIB: u32 = 64 * 1024;
pub const ARGON_T: u32 = 3;
pub const ARGON_P: u32 = 1;

/// Der Tresorschlüssel im Arbeitsspeicher – wird beim Verwerfen überschrieben.
pub type Schluessel = Zeroizing<[u8; 32]>;

/// Alphabet für den Wiederherstellungscode: 32 Zeichen ohne I, L, O, U (nicht zu verwechseln, auf Papier schreibbar).
const ALPHABET: &[u8; 32] = b"ABCDEFGHJKMNPQRSTVWXYZ0123456789";
const CODE_GRUPPEN: usize = 6;
const CODE_GRUPPE_LAENGE: usize = 5;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Kdf {
    pub algorithmus: String,
    pub m_kib: u32,
    pub t: u32,
    pub p: u32,
    pub salz: String,
}

/// Ein mit einem Schlüssel verpackter Wert (Nonce + Chiffrat), Base64.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Umschlag {
    pub nonce: String,
    pub chiffrat: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Kopf {
    pub format: u32,
    pub erstellt: String,
    pub kdf: Kdf,
    pub salz_wiederherstellung: String,
    pub umschlag_passwort: Umschlag,
    pub umschlag_wiederherstellung: Umschlag,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default, PartialEq)]
pub struct Anhang {
    pub id: String,
    pub name: String,
    pub typ: String,
    pub groesse: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default, PartialEq)]
pub struct Notiz {
    pub id: String,
    pub titel: String,
    pub text: String,
    /// Reihenfolge in der Liste (Notfallmappe: 1–10), sonst 0
    #[serde(default)]
    pub reihe: u32,
    pub geaendert: String,
    #[serde(default)]
    pub anhaenge: Vec<Anhang>,
}

pub fn ordner(datenordner: &Path) -> PathBuf {
    datenordner.join("tresor")
}

pub fn existiert(datenordner: &Path) -> bool {
    ordner(datenordner).join("tresor.json").exists()
}

fn zufall(n: usize) -> Vec<u8> {
    let mut b = vec![0u8; n];
    rand::thread_rng().fill_bytes(&mut b);
    b
}

/// Zufällige Kennung für Notizen und Anhänge (128 Bit, hex).
pub fn neue_id() -> String {
    hex::encode(zufall(16))
}

/// Erzeugt einen Wiederherstellungscode: 6 Gruppen zu 5 Zeichen, z. B. `K7MQ2-R9XTA-…` (150 Bit).
fn neuer_code() -> String {
    let z = zufall(CODE_GRUPPEN * CODE_GRUPPE_LAENGE);
    z.chunks(CODE_GRUPPE_LAENGE)
        .map(|g| g.iter().map(|b| ALPHABET[(*b as usize) % 32] as char).collect::<String>())
        .collect::<Vec<_>>()
        .join("-")
}

/// Code normalisieren: Groß, ohne Bindestriche und Leerzeichen, 0/O und 1/I/L nachsichtig.
pub fn code_normalisieren(code: &str) -> String {
    code.chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .map(|c| c.to_ascii_uppercase())
        .map(|c| match c { 'O' => '0', 'I' | 'L' => '1', 'U' => 'V', c => c })
        .collect()
}

fn schluessel_aus_passwort(passwort: &str, kdf: &Kdf) -> Result<Schluessel, Fehler> {
    if kdf.algorithmus != "argon2id" {
        return Err(Fehler(format!("Unbekanntes Verfahren: {}", kdf.algorithmus)));
    }
    let salz = B64.decode(&kdf.salz).map_err(|_| Fehler("Kopf beschädigt (Salz)".into()))?;
    let params = Params::new(kdf.m_kib, kdf.t, kdf.p, Some(32)).map_err(|e| Fehler(format!("Argon2-Parameter: {e}")))?;
    let a = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut k = Zeroizing::new([0u8; 32]);
    a.hash_password_into(passwort.as_bytes(), &salz, k.as_mut()).map_err(|e| Fehler(format!("Argon2: {e}")))?;
    Ok(k)
}

/// Der Code ist bereits zufällig (150 Bit) – ein einfacher Hash mit Salz genügt, Argon2 wäre hier ohne Nutzen.
fn schluessel_aus_code(code: &str, salz_b64: &str) -> Result<Schluessel, Fehler> {
    let salz = B64.decode(salz_b64).map_err(|_| Fehler("Kopf beschädigt (Salz)".into()))?;
    let mut h = Sha256::new();
    h.update(b"offline-tresor-wiederherstellung-v1");
    h.update(&salz);
    h.update(code_normalisieren(code).as_bytes());
    let mut k = Zeroizing::new([0u8; 32]);
    k.copy_from_slice(&h.finalize());
    Ok(k)
}

fn verschluesseln(schluessel: &Schluessel, klartext: &[u8], aad: &[u8]) -> Result<Vec<u8>, Fehler> {
    let c = XChaCha20Poly1305::new(chacha20poly1305::Key::from_slice(schluessel.as_ref()));
    let nonce = zufall(24);
    let chiffrat = c.encrypt(XNonce::from_slice(&nonce), Payload { msg: klartext, aad }).map_err(|_| Fehler("Verschlüsseln fehlgeschlagen".into()))?;
    let mut aus = nonce;
    aus.extend_from_slice(&chiffrat);
    Ok(aus)
}

fn entschluesseln(schluessel: &Schluessel, daten: &[u8], aad: &[u8]) -> Result<Zeroizing<Vec<u8>>, Fehler> {
    if daten.len() < 24 + 16 {
        return Err(Fehler("Datei beschädigt oder manipuliert".into()));
    }
    let c = XChaCha20Poly1305::new(chacha20poly1305::Key::from_slice(schluessel.as_ref()));
    c.decrypt(XNonce::from_slice(&daten[..24]), Payload { msg: &daten[24..], aad })
        .map(Zeroizing::new)
        .map_err(|_| Fehler("Datei beschädigt oder manipuliert – oder falscher Schlüssel".into()))
}

fn umschlag(schluessel: &Schluessel, dek: &Schluessel) -> Result<Umschlag, Fehler> {
    let d = verschluesseln(schluessel, dek.as_ref(), b"offline-tresor-dek")?;
    Ok(Umschlag { nonce: B64.encode(&d[..24]), chiffrat: B64.encode(&d[24..]) })
}

fn umschlag_oeffnen(schluessel: &Schluessel, u: &Umschlag) -> Result<Schluessel, Fehler> {
    let mut d = B64.decode(&u.nonce).map_err(|_| Fehler("Kopf beschädigt".into()))?;
    d.extend(B64.decode(&u.chiffrat).map_err(|_| Fehler("Kopf beschädigt".into()))?);
    let dek = entschluesseln(schluessel, &d, b"offline-tresor-dek").map_err(|_| Fehler("Passwort oder Code falsch".into()))?;
    if dek.len() != 32 {
        return Err(Fehler("Kopf beschädigt".into()));
    }
    let mut k = Zeroizing::new([0u8; 32]);
    k.copy_from_slice(&dek);
    Ok(k)
}

fn kopf_lesen(datenordner: &Path) -> Result<Kopf, Fehler> {
    let bytes = std::fs::read(ordner(datenordner).join("tresor.json")).map_err(|_| Fehler("Kein Tresor angelegt".into()))?;
    let k: Kopf = serde_json::from_slice(&bytes)?;
    if k.format != FORMAT {
        return Err(Fehler(format!("Tresor-Format {} wird von dieser App nicht verstanden", k.format)));
    }
    Ok(k)
}

fn kopf_schreiben(datenordner: &Path, kopf: &Kopf) -> Result<(), Fehler> {
    let o = ordner(datenordner);
    std::fs::create_dir_all(o.join("notizen"))?;
    std::fs::create_dir_all(o.join("anhaenge"))?;
    let tmp = o.join("tresor.json.tmp");
    std::fs::write(&tmp, serde_json::to_vec_pretty(kopf)?)?;
    std::fs::rename(tmp, o.join("tresor.json"))?;
    Ok(())
}

/// Tresor anlegen. Gibt den Wiederherstellungscode zurück – er wird nur jetzt angezeigt – und den offenen Schlüssel.
pub fn anlegen(datenordner: &Path, passwort: &str, jetzt_iso: &str) -> Result<(String, Schluessel), Fehler> {
    if existiert(datenordner) {
        return Err(Fehler("Es gibt schon einen Tresor".into()));
    }
    if passwort.chars().count() < 8 {
        return Err(Fehler("Das Passwort braucht mindestens 8 Zeichen".into()));
    }
    let kdf = Kdf { algorithmus: "argon2id".into(), m_kib: ARGON_M_KIB, t: ARGON_T, p: ARGON_P, salz: B64.encode(zufall(16)) };
    let salz_w = B64.encode(zufall(16));
    let code = neuer_code();
    let mut dek = Zeroizing::new([0u8; 32]);
    rand::thread_rng().fill_bytes(dek.as_mut());
    let kek = schluessel_aus_passwort(passwort, &kdf)?;
    let wk = schluessel_aus_code(&code, &salz_w)?;
    let kopf = Kopf {
        format: FORMAT,
        erstellt: jetzt_iso.into(),
        umschlag_passwort: umschlag(&kek, &dek)?,
        umschlag_wiederherstellung: umschlag(&wk, &dek)?,
        kdf,
        salz_wiederherstellung: salz_w,
    };
    kopf_schreiben(datenordner, &kopf)?;
    Ok((code, dek))
}

/// Mit Passwort öffnen. Falsches Passwort → Fehler, ohne Unterschied zu „beschädigt“ (kein Orakel).
pub fn oeffnen(datenordner: &Path, passwort: &str) -> Result<Schluessel, Fehler> {
    let kopf = kopf_lesen(datenordner)?;
    let kek = schluessel_aus_passwort(passwort, &kopf.kdf)?;
    umschlag_oeffnen(&kek, &kopf.umschlag_passwort)
}

/// Mit Wiederherstellungscode öffnen.
pub fn oeffnen_mit_code(datenordner: &Path, code: &str) -> Result<Schluessel, Fehler> {
    let kopf = kopf_lesen(datenordner)?;
    let wk = schluessel_aus_code(code, &kopf.salz_wiederherstellung)?;
    umschlag_oeffnen(&wk, &kopf.umschlag_wiederherstellung)
}

/// Passwort ändern: nur der Tresorschlüssel wird neu verpackt, der Inhalt bleibt. Braucht den offenen Schlüssel.
pub fn passwort_aendern(datenordner: &Path, schluessel: &Schluessel, neues_passwort: &str) -> Result<(), Fehler> {
    if neues_passwort.chars().count() < 8 {
        return Err(Fehler("Das Passwort braucht mindestens 8 Zeichen".into()));
    }
    let mut kopf = kopf_lesen(datenordner)?;
    kopf.kdf.salz = B64.encode(zufall(16));
    kopf.kdf.m_kib = ARGON_M_KIB;
    kopf.kdf.t = ARGON_T;
    kopf.kdf.p = ARGON_P;
    let kek = schluessel_aus_passwort(neues_passwort, &kopf.kdf)?;
    kopf.umschlag_passwort = umschlag(&kek, schluessel)?;
    kopf_schreiben(datenordner, &kopf)
}

/// Neuen Wiederherstellungscode ausstellen (der alte gilt danach nicht mehr).
pub fn code_erneuern(datenordner: &Path, schluessel: &Schluessel) -> Result<String, Fehler> {
    let mut kopf = kopf_lesen(datenordner)?;
    let code = neuer_code();
    kopf.salz_wiederherstellung = B64.encode(zufall(16));
    let wk = schluessel_aus_code(&code, &kopf.salz_wiederherstellung)?;
    kopf.umschlag_wiederherstellung = umschlag(&wk, schluessel)?;
    kopf_schreiben(datenordner, &kopf)?;
    Ok(code)
}

fn id_pruefen(id: &str) -> Result<(), Fehler> {
    if id.len() != 32 || !id.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err(Fehler("Ungültige Kennung".into()));
    }
    Ok(())
}

pub fn notiz_schreiben(datenordner: &Path, schluessel: &Schluessel, notiz: &Notiz) -> Result<(), Fehler> {
    id_pruefen(&notiz.id)?;
    let klar = Zeroizing::new(serde_json::to_vec(notiz)?);
    let daten = verschluesseln(schluessel, &klar, notiz.id.as_bytes())?;
    let o = ordner(datenordner).join("notizen");
    std::fs::create_dir_all(&o)?;
    let tmp = o.join(format!("{}.tmp", notiz.id));
    std::fs::write(&tmp, daten)?;
    std::fs::rename(tmp, o.join(format!("{}.bin", notiz.id)))?;
    Ok(())
}

/// Alle Notizen lesen (entschlüsselt nur im Arbeitsspeicher). Eine manipulierte Datei fällt auf und bricht ab.
pub fn notizen_lesen(datenordner: &Path, schluessel: &Schluessel) -> Result<Vec<Notiz>, Fehler> {
    let o = ordner(datenordner).join("notizen");
    let mut aus = Vec::new();
    let Ok(rd) = std::fs::read_dir(&o) else { return Ok(aus) };
    for e in rd.flatten() {
        let name = e.file_name().to_string_lossy().to_string();
        let Some(id) = name.strip_suffix(".bin") else { continue };
        let daten = std::fs::read(e.path())?;
        let klar = entschluesseln(schluessel, &daten, id.as_bytes()).map_err(|e| Fehler(format!("Notiz {id}: {e}")))?;
        let n: Notiz = serde_json::from_slice(&klar)?;
        if n.id != id {
            return Err(Fehler(format!("Notiz {id}: Kennung passt nicht")));
        }
        aus.push(n);
    }
    aus.sort_by(|a, b| a.reihe.cmp(&b.reihe).then(b.geaendert.cmp(&a.geaendert)));
    Ok(aus)
}

pub fn notiz_loeschen(datenordner: &Path, id: &str) -> Result<(), Fehler> {
    id_pruefen(id)?;
    let p = ordner(datenordner).join("notizen").join(format!("{id}.bin"));
    if p.exists() {
        std::fs::remove_file(p)?;
    }
    Ok(())
}

pub fn anhang_schreiben(datenordner: &Path, schluessel: &Schluessel, id: &str, bytes: &[u8]) -> Result<(), Fehler> {
    id_pruefen(id)?;
    let daten = verschluesseln(schluessel, bytes, id.as_bytes())?;
    let o = ordner(datenordner).join("anhaenge");
    std::fs::create_dir_all(&o)?;
    let tmp = o.join(format!("{id}.tmp"));
    std::fs::write(&tmp, daten)?;
    std::fs::rename(tmp, o.join(format!("{id}.bin")))?;
    Ok(())
}

pub fn anhang_lesen(datenordner: &Path, schluessel: &Schluessel, id: &str) -> Result<Zeroizing<Vec<u8>>, Fehler> {
    id_pruefen(id)?;
    let daten = std::fs::read(ordner(datenordner).join("anhaenge").join(format!("{id}.bin"))).map_err(|_| Fehler("Anhang fehlt".into()))?;
    entschluesseln(schluessel, &daten, id.as_bytes())
}

pub fn anhang_loeschen(datenordner: &Path, id: &str) -> Result<(), Fehler> {
    id_pruefen(id)?;
    let p = ordner(datenordner).join("anhaenge").join(format!("{id}.bin"));
    if p.exists() {
        std::fs::remove_file(p)?;
    }
    Ok(())
}

/// Sicherung: der ganze Tresor-Ordner (nur Verschlüsseltes) in einen Zielordner kopieren, z. B. auf einen USB-Stick.
pub fn sichern(datenordner: &Path, ziel: &Path) -> Result<u64, Fehler> {
    if !existiert(datenordner) {
        return Err(Fehler("Kein Tresor angelegt".into()));
    }
    kopiere_ordner(&ordner(datenordner), ziel)
}

/// Sicherung zurückspielen: ersetzt den Tresor. Nur, wenn im Ziel keiner offen ist – das prüft die App.
pub fn zurueckspielen(datenordner: &Path, quelle: &Path) -> Result<u64, Fehler> {
    if !quelle.join("tresor.json").exists() {
        return Err(Fehler("Im gewählten Ordner liegt keine Tresor-Sicherung (tresor.json fehlt)".into()));
    }
    let bytes = std::fs::read(quelle.join("tresor.json"))?;
    let k: Kopf = serde_json::from_slice(&bytes).map_err(|_| Fehler("Sicherung beschädigt".into()))?;
    if k.format != FORMAT {
        return Err(Fehler("Sicherung hat ein unbekanntes Format".into()));
    }
    let ziel = ordner(datenordner);
    let alt = datenordner.join("tresor.alt");
    if alt.exists() {
        std::fs::remove_dir_all(&alt)?;
    }
    if ziel.exists() {
        std::fs::rename(&ziel, &alt)?;
    }
    match kopiere_ordner(quelle, &ziel) {
        Ok(n) => {
            if alt.exists() {
                let _ = std::fs::remove_dir_all(&alt);
            }
            Ok(n)
        }
        Err(e) => {
            let _ = std::fs::remove_dir_all(&ziel);
            if alt.exists() {
                let _ = std::fs::rename(&alt, &ziel);
            }
            Err(e)
        }
    }
}

fn kopiere_ordner(von: &Path, nach: &Path) -> Result<u64, Fehler> {
    std::fs::create_dir_all(nach)?;
    let mut n = 0;
    for e in std::fs::read_dir(von)?.flatten() {
        let p = e.path();
        let name = e.file_name();
        if p.is_dir() {
            n += kopiere_ordner(&p, &nach.join(name))?;
        } else if p.extension().map(|x| x == "tmp").unwrap_or(false) {
            continue;
        } else {
            n += std::fs::copy(&p, nach.join(name))?;
        }
    }
    Ok(n)
}

/// Die Vorlage „Notfallmappe“: zehn Notizen mit Überschriften und leeren Feldern.
pub fn notfallmappe(jetzt_iso: &str) -> Vec<Notiz> {
    let felder: [(&str, &str); 10] = [
        ("Personen im Haushalt", "Name:\nGeburtsdatum:\nBlutgruppe:\nAllergien:\nMedikamente (mit Dosierung):\nHausarzt / Hausärztin:\n\n(für jede Person wiederholen)"),
        ("Wichtige Nummern", "Euro-Notruf: 112\nRettung: 144\nFeuerwehr: 122\nPolizei: 133\nBergrettung: 140\nÄrztenotdienst: 141\nGesundheitsberatung: 1450\nVergiftungsinformationszentrale: 01 406 43 43\n\nNachbarn:\nFamilie außerhalb:\nArbeitgeber:\nSchule / Kindergarten:"),
        ("Treffpunkte", "Treffpunkt, wenn niemand erreichbar ist:\nErsatztreffpunkt:\nWer holt die Kinder ab:"),
        ("Dokumente (Scans)", "Reisepass, Personalausweis, Führerschein, E-Card, Meldezettel, Geburtsurkunden, Heiratsurkunde, Impfpass\n\nScans als Anhang zu dieser Notiz hinzufügen."),
        ("Versicherungen", "Haushalt – Polizzennummer / Schadenhotline:\nEigenheim:\nKfz:\nUnfall:\nLeben:"),
        ("Geld", "Bank und Kundennummer:\nSperrnotruf Karten: 0800 204 8800 (Österreich)\nBargeldvorrat – wo:\n\nKeine vollständigen Kartennummern hier ablegen."),
        ("Zugänge", "ID Austria:\nE-Mail:\nBank (Login):\nRouter / WLAN:\nHandy-PIN / PUK:"),
        ("Haus", "Hauptwasserhahn:\nSicherungskasten:\nGashaupthahn:\nSchlüssel bei:\nRauchfangkehrer:\nInstallateur:\nElektriker:"),
        ("Tiere", "Tierarzt / Tierärztin:\nFutter:\nChipnummer:"),
        ("Radio", "ORF-Frequenzen der eigenen Region (Ö3, Ö2-Landesstudio):\n\nIm Krisenfall sendet der ORF auf allen Kanälen – ein Batterieradio in die Lade legen."),
    ];
    felder
        .iter()
        .enumerate()
        .map(|(i, (titel, text))| Notiz { id: neue_id(), titel: titel.to_string(), text: text.to_string(), reihe: (i + 1) as u32, geaendert: jetzt_iso.into(), anhaenge: vec![] })
        .collect()
}
