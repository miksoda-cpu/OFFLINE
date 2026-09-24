//! SHA-256 über Dateien, am Stück und in Teilen – streamend, nie die ganze Datei im Speicher.

use crate::Fehler;
use sha2::{Digest, Sha256};
use std::io::Read;
use std::path::Path;

pub struct DateiHash {
    pub sha256: String,
    pub groesse: u64,
    pub teile: Vec<String>,
}

pub fn sha256_hex(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

/// `teilgroesse` 0 = keine Teile.
pub fn hash_datei(pfad: &Path, teilgroesse: u64) -> Result<DateiHash, Fehler> {
    let mut datei = std::fs::File::open(pfad)?;
    let mut ganz = Sha256::new();
    let mut teil = Sha256::new();
    let mut teile = Vec::new();
    let mut im_teil: u64 = 0;
    let mut groesse: u64 = 0;
    let mut puffer = vec![0u8; 4 * 1024 * 1024];
    loop {
        let n = datei.read(&mut puffer)?;
        if n == 0 {
            break;
        }
        let buf = &puffer[..n];
        ganz.update(buf);
        groesse += n as u64;
        if teilgroesse == 0 {
            continue;
        }
        let mut off = 0usize;
        while off < buf.len() {
            let rest = (teilgroesse - im_teil) as usize;
            let k = rest.min(buf.len() - off);
            teil.update(&buf[off..off + k]);
            off += k;
            im_teil += k as u64;
            if im_teil == teilgroesse {
                teile.push(hex::encode(teil.finalize_reset()));
                im_teil = 0;
            }
        }
    }
    if teilgroesse > 0 && im_teil > 0 {
        teile.push(hex::encode(teil.finalize()));
    }
    Ok(DateiHash { sha256: hex::encode(ganz.finalize()), groesse, teile })
}
