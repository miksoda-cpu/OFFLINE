//! Update-Dienst: Katalog laden, Paket in Teilen laden (fortsetzbar), prüfen, einspielen.
//!
//! Ablauf (docs/PAKETFORMAT.md, Abschnitt 6):
//!   Katalog → Signatur + Rollback-Schutz
//!   Manifest → Hash gegen Katalog, Signatur, Struktur
//!   Delta gegen installierte Version → unveränderte Dateien werden verknüpft/kopiert, nicht geladen
//!   Teile laden mit Range-Anfragen, jedes Teil sofort gegen seine Prüfsumme; Abbruch → beim nächsten Mal weiter
//!   Staging vollständig → `einspielen::abschliessen` (erneute Vollprüfung, atomarer Tausch)

use crate::delta::delta;
use crate::einspielen::{abschliessen, installierte_version, staging_ordner, version_zulaessig, Einspielergebnis};
use crate::hash::{hash_datei, sha256_hex};
use crate::katalog::{katalog_pruefen, KatalogEintrag, KatalogGeprueft};
use crate::manifest::{manifest_pruefen_struktur, Datei, Manifest};
use crate::paket::datei_pfad;
use crate::schluessel::{pruefe_signatur, OeffentlicherSchluessel, Signatur};
use crate::Fehler;
use sha2::{Digest, Sha256};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

const VERSUCHE: u32 = 3;
const ZEITLIMIT: Duration = Duration::from_secs(60);

#[derive(Debug, Clone, serde::Serialize)]
pub struct Fortschritt {
    pub id: String,
    pub version: String,
    pub datei: String,
    pub geladen: u64,
    pub gesamt: u64,
}

pub struct Auftrag<'a> {
    pub bekannte: &'a [OeffentlicherSchluessel],
    pub heute: &'a str,
    pub jetzt_iso: &'a str,
    pub abbruch: Arc<AtomicBool>,
    pub fortschritt: &'a mut dyn FnMut(Fortschritt),
}

fn client() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(20))
        .timeout_read(ZEITLIMIT)
        .user_agent(concat!("OFFLINE/", env!("CARGO_PKG_VERSION")))
        .build()
}

fn hole(agent: &ureq::Agent, url: &str) -> Result<Vec<u8>, Fehler> {
    let antwort = agent.get(url).call().map_err(|e| Fehler(format!("Laden von {url}: {}", kurz(&e))))?;
    let mut bytes = Vec::new();
    antwort.into_reader().take(64 * 1024 * 1024).read_to_end(&mut bytes)?;
    Ok(bytes)
}

fn kurz(e: &ureq::Error) -> String {
    match e {
        ureq::Error::Status(code, _) => format!("HTTP {code}"),
        ureq::Error::Transport(t) => t.kind().to_string(),
    }
}

/// Katalog vom Server holen und prüfen. `zuletzt_erstellt` ist das `erstellt` des zuletzt akzeptierten Katalogs.
pub fn katalog_laden(url: &str, bekannte: &[OeffentlicherSchluessel], heute: &str, jetzt_iso: &str, zuletzt_erstellt: Option<&str>) -> Result<(KatalogGeprueft, Vec<u8>), Fehler> {
    let agent = client();
    let bytes = hole(&agent, url)?;
    let sig_url = url.strip_suffix(".json").map(|u| format!("{u}.sig")).unwrap_or_else(|| format!("{url}.sig"));
    let sig: Signatur = serde_json::from_slice(&hole(&agent, &sig_url)?).map_err(|_| Fehler("katalog.sig unlesbar".into()))?;
    let g = katalog_pruefen(&bytes, &sig, bekannte, heute, jetzt_iso, zuletzt_erstellt)?;
    Ok((g, bytes))
}

/// Paketordner-URL aus Katalogbasis und Eintrag.
pub fn paket_url(basis: &str, eintrag: &KatalogEintrag) -> String {
    let b = basis.trim_end_matches('/');
    let p = eintrag.pfad.trim_matches('/');
    format!("{b}/{p}/")
}

/// Lädt ein Paket aus dem Katalog in den Staging-Ordner und spielt es ein. Fortsetzbar: Was schon im Staging liegt
/// und stimmt, wird nicht noch einmal geladen.
pub fn paket_laden(basis: &str, eintrag: &KatalogEintrag, wurzel: &Path, a: &mut Auftrag) -> Result<Einspielergebnis, Fehler> {
    if eintrag.status != "verfuegbar" {
        return Err(Fehler(format!("{} ist noch nicht verfügbar", eintrag.id)));
    }
    let agent = client();
    let url = paket_url(basis, eintrag);

    // Manifest: Hash gegen Katalog, Signatur, Struktur, Identität
    let manifest_bytes = hole(&agent, &format!("{url}paket.json"))?;
    if sha256_hex(&manifest_bytes) != eintrag.sha256_manifest {
        return Err(Fehler("Manifest passt nicht zum Katalog (Prüfsumme)".into()));
    }
    let sig_bytes = hole(&agent, &format!("{url}paket.sig"))?;
    let sig: Signatur = serde_json::from_slice(&sig_bytes).map_err(|_| Fehler("paket.sig unlesbar".into()))?;
    pruefe_signatur(&manifest_bytes, &sig, a.bekannte, "pakete", a.heute).map_err(|e| Fehler(format!("Paket: {e}")))?;
    let m: Manifest = serde_json::from_slice(&manifest_bytes).map_err(|_| Fehler("paket.json ist kein gültiges JSON".into()))?;
    if let Some(f) = manifest_pruefen_struktur(&m).first() {
        return Err(Fehler(format!("Manifest ungültig: {f}")));
    }
    if m.id != eintrag.id || m.version != eintrag.version {
        return Err(Fehler("Manifest gehört zu einem anderen Paket".into()));
    }
    let bisher = version_zulaessig(wurzel, &m.id, &m.version, false)?;

    // Delta gegen den installierten Stand
    let alt: Option<Manifest> = bisher.as_ref().and_then(|(_, p)| std::fs::read(p.join("paket.json")).ok()).and_then(|b| serde_json::from_slice(&b).ok());
    let d = delta(alt.as_ref(), &m);
    let gesamt = d.bytes;
    let mut geladen = 0u64;

    std::fs::create_dir_all(wurzel)?;
    let staging = staging_ordner(wurzel, &m.id, &m.version);
    std::fs::create_dir_all(&staging)?;
    // Manifest zuerst ins Staging – daran erkennt aufraeumen(), dass hier ein Download fortsetzt
    std::fs::write(staging.join("paket.json"), &manifest_bytes)?;
    std::fs::write(staging.join("paket.sig"), &sig_bytes)?;

    let alt_ordner = bisher.as_ref().map(|(_, p)| p.clone());
    for datei in &m.dateien {
        if a.abbruch.load(Ordering::Relaxed) {
            return Err(Fehler("Abgebrochen – wird beim nächsten Mal fortgesetzt".into()));
        }
        let ziel = datei_pfad(&staging, &datei.pfad);
        if let Some(eltern) = ziel.parent() {
            std::fs::create_dir_all(eltern)?;
        }
        let laden = d.laden.iter().find(|l| l.pfad == datei.pfad);
        match laden {
            None => {
                // unverändert: aus dem installierten Ordner übernehmen (Hardlink, sonst Kopie)
                let quelle = datei_pfad(alt_ordner.as_ref().expect("unverändert nur mit Vorgänger"), &datei.pfad);
                if !stimmt_ganz(&ziel, datei) {
                    let _ = std::fs::remove_file(&ziel);
                    if std::fs::hard_link(&quelle, &ziel).is_err() {
                        std::fs::copy(&quelle, &ziel)?;
                    }
                }
            }
            Some(_) => {
                // Vorgängerdatei (für unveränderte Teile), falls vorhanden
                let vorgaenger = alt.as_ref().and_then(|am| am.dateien.iter().find(|x| x.pfad == datei.pfad)).and_then(|ad| alt_ordner.as_ref().map(|o| (datei_pfad(o, &ad.pfad), ad.clone())));
                lade_datei(&agent, &url, datei, &ziel, vorgaenger.as_ref(), a, &m, &mut geladen, gesamt)?;
            }
        }
    }
    let mut e = abschliessen(&staging, wurzel, a.bekannte, a.heute, false)?;
    e.kopiert_bytes = geladen;
    Ok(e)
}

fn stimmt_ganz(pfad: &Path, d: &Datei) -> bool {
    match std::fs::metadata(pfad) {
        Ok(st) if st.len() == d.groesse => hash_datei(pfad, 0).map(|h| h.sha256 == d.sha256).unwrap_or(false),
        _ => false,
    }
}

/// Eine Datei laden – in Teilen, wenn das Manifest Teile hat; sonst am Stück mit Fortsetzung ab Dateiende.
#[allow(clippy::too_many_arguments)]
fn lade_datei(agent: &ureq::Agent, url: &str, d: &Datei, ziel: &Path, vorgaenger: Option<&(std::path::PathBuf, Datei)>, a: &mut Auftrag, m: &Manifest, geladen: &mut u64, gesamt: u64) -> Result<(), Fehler> {
    let quelle = format!("{url}{}", d.pfad.split('/').map(urlencode).collect::<Vec<_>>().join("/"));
    let mut datei = std::fs::OpenOptions::new().read(true).write(true).create(true).truncate(false).open(ziel)?;
    let melde = |a: &mut Auftrag, geladen: u64| (a.fortschritt)(Fortschritt { id: m.id.clone(), version: m.version.clone(), datei: d.pfad.clone(), geladen, gesamt });

    match (&d.teile, d.teilgroesse) {
        (Some(teile), Some(tg)) => {
            let vorhanden = datei.metadata()?.len();
            for (i, soll) in teile.iter().enumerate() {
                if a.abbruch.load(Ordering::Relaxed) {
                    return Err(Fehler("Abgebrochen – wird beim nächsten Mal fortgesetzt".into()));
                }
                let von = i as u64 * tg;
                let bis = (von + tg).min(d.groesse); // exklusiv
                let laenge = bis - von;
                // Teil schon da und richtig? Dann überspringen.
                if vorhanden >= bis && teil_hash(&mut datei, von, laenge)? == *soll {
                    *geladen += laenge;
                    melde(a, *geladen);
                    continue;
                }
                // Teil unverändert gegenüber dem installierten Stand? Dann von dort kopieren statt laden.
                if let Some((alt_pfad, alt_d)) = vorgaenger {
                    let gleich = alt_d.teilgroesse == Some(tg) && alt_d.teile.as_ref().and_then(|t| t.get(i)) == Some(soll);
                    if gleich {
                        if let Ok(mut alt_datei) = std::fs::File::open(alt_pfad) {
                            if let Ok(bytes) = bereich_lesen(&mut alt_datei, von, laenge) {
                                if sha256_hex(&bytes) == *soll {
                                    datei.seek(SeekFrom::Start(von))?;
                                    datei.write_all(&bytes)?;
                                    continue;
                                }
                            }
                        }
                    }
                }
                let mut ok = false;
                for versuch in 1..=VERSUCHE {
                    match lade_bereich(agent, &quelle, von, bis - 1, laenge) {
                        Ok(bytes) if sha256_hex(&bytes) == *soll => {
                            datei.seek(SeekFrom::Start(von))?;
                            datei.write_all(&bytes)?;
                            ok = true;
                            break;
                        }
                        Ok(_) => {
                            if versuch == VERSUCHE {
                                return Err(Fehler(format!("Teil {} von {} passt nicht zur Prüfsumme", i + 1, d.pfad)));
                            }
                        }
                        Err(e) => {
                            if versuch == VERSUCHE {
                                return Err(e);
                            }
                            std::thread::sleep(Duration::from_millis(500 * versuch as u64));
                        }
                    }
                }
                debug_assert!(ok);
                *geladen += laenge;
                melde(a, *geladen);
            }
            datei.set_len(d.groesse)?;
        }
        _ => {
            // am Stück, Fortsetzung ab Dateiende; Prüfung erst am Ende
            let mut vorhanden = datei.metadata()?.len();
            if vorhanden > d.groesse {
                datei.set_len(0)?;
                vorhanden = 0;
            }
            if vorhanden == d.groesse && stimmt_ganz(ziel, d) {
                *geladen += d.groesse;
                melde(a, *geladen);
                return Ok(());
            }
            for versuch in 1..=VERSUCHE {
                if vorhanden < d.groesse {
                    match stream_bereich(agent, &quelle, vorhanden, d.groesse - 1, &mut datei, a, m, d, geladen, gesamt) {
                        Ok(()) => {}
                        Err(e) if versuch < VERSUCHE => {
                            let _ = e;
                            vorhanden = datei.metadata()?.len().min(d.groesse);
                            std::thread::sleep(Duration::from_millis(500 * versuch as u64));
                            continue;
                        }
                        Err(e) => return Err(e),
                    }
                }
                datei.flush()?;
                if stimmt_ganz(ziel, d) {
                    return Ok(());
                }
                // falsch → von vorn
                datei.set_len(0)?;
                vorhanden = 0;
                *geladen = geladen.saturating_sub(d.groesse);
            }
            return Err(Fehler(format!("Prüfsumme falsch nach {VERSUCHE} Versuchen: {}", d.pfad)));
        }
    }
    Ok(())
}

fn urlencode(t: &str) -> String {
    let mut s = String::new();
    for b in t.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => s.push(b as char),
            _ => s.push_str(&format!("%{b:02X}")),
        }
    }
    s
}

fn bereich_lesen(datei: &mut std::fs::File, von: u64, laenge: u64) -> Result<Vec<u8>, Fehler> {
    datei.seek(SeekFrom::Start(von))?;
    let mut bytes = vec![0u8; laenge as usize];
    datei.read_exact(&mut bytes)?;
    Ok(bytes)
}

fn teil_hash(datei: &mut std::fs::File, von: u64, laenge: u64) -> Result<String, Fehler> {
    datei.seek(SeekFrom::Start(von))?;
    let mut h = Sha256::new();
    let mut rest = laenge;
    let mut puffer = vec![0u8; 1024 * 1024];
    while rest > 0 {
        let k = rest.min(puffer.len() as u64) as usize;
        let n = datei.read(&mut puffer[..k])?;
        if n == 0 {
            break;
        }
        h.update(&puffer[..n]);
        rest -= n as u64;
    }
    Ok(hex::encode(h.finalize()))
}

/// Bereich `von..=bis` laden; der Server muss 206 liefern (sonst wäre es die ganze Datei – wird abgelehnt).
fn lade_bereich(agent: &ureq::Agent, url: &str, von: u64, bis: u64, laenge: u64) -> Result<Vec<u8>, Fehler> {
    let antwort = agent.get(url).set("Range", &format!("bytes={von}-{bis}")).call().map_err(|e| Fehler(format!("Laden von {url}: {}", kurz(&e))))?;
    if antwort.status() != 206 && !(von == 0 && antwort.status() == 200) {
        return Err(Fehler(format!("Server unterstützt keine Bereichsanfragen (HTTP {})", antwort.status())));
    }
    let mut bytes = Vec::with_capacity(laenge as usize);
    antwort.into_reader().take(laenge).read_to_end(&mut bytes)?;
    if bytes.len() as u64 != laenge {
        return Err(Fehler("Verbindung abgebrochen".into()));
    }
    Ok(bytes)
}

/// Bereich streamend an das Dateiende hängen (für Dateien ohne Teile), mit Fortschrittsmeldungen.
#[allow(clippy::too_many_arguments)]
fn stream_bereich(agent: &ureq::Agent, url: &str, von: u64, bis: u64, datei: &mut std::fs::File, a: &mut Auftrag, m: &Manifest, d: &Datei, geladen: &mut u64, gesamt: u64) -> Result<(), Fehler> {
    let antwort = agent.get(url).set("Range", &format!("bytes={von}-{bis}")).call().map_err(|e| Fehler(format!("Laden von {url}: {}", kurz(&e))))?;
    let (start, status) = (von, antwort.status());
    if status == 200 {
        datei.set_len(0)?;
        *geladen = geladen.saturating_sub(start);
    } else if status != 206 {
        return Err(Fehler(format!("Server unterstützt keine Bereichsanfragen (HTTP {status})")));
    }
    datei.seek(SeekFrom::End(0))?;
    let mut leser = antwort.into_reader();
    let mut puffer = vec![0u8; 1024 * 1024];
    loop {
        if a.abbruch.load(Ordering::Relaxed) {
            datei.flush()?;
            return Err(Fehler("Abgebrochen – wird beim nächsten Mal fortgesetzt".into()));
        }
        let n = leser.read(&mut puffer)?;
        if n == 0 {
            break;
        }
        datei.write_all(&puffer[..n])?;
        *geladen += n as u64;
        (a.fortschritt)(Fortschritt { id: m.id.clone(), version: m.version.clone(), datei: d.pfad.clone(), geladen: *geladen, gesamt });
    }
    datei.flush()?;
    if datei.metadata()?.len() < d.groesse {
        return Err(Fehler("Verbindung abgebrochen".into()));
    }
    Ok(())
}

/// Für die Oberfläche: Was würde ein Update laden? (ohne Netz, nur Manifest vs. installiert)
pub fn update_umfang(wurzel: &Path, neu: &Manifest) -> (u64, u64) {
    let alt: Option<Manifest> = installierte_version(wurzel, &neu.id)
        .and_then(|(_, p)| std::fs::read(p.join("paket.json")).ok())
        .and_then(|b| serde_json::from_slice(&b).ok());
    let d = delta(alt.as_ref(), neu);
    (d.bytes, d.gesamt)
}
