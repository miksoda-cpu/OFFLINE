//! Lokaler Dateiserver (nur 127.0.0.1) mit Bereichsanfragen – damit Kartenviewer und Oberfläche
//! große Paketdateien (PMTiles, Medien) stückweise lesen können. Nur GET/HEAD, nur unter der Wurzel, nur lesend.
//!
//! Std-only, ein Thread je Verbindung. Für einen einzelnen Rechner völlig ausreichend.

use std::io::{BufRead, BufReader, Read, Seek, SeekFrom, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

pub struct Lokalserver {
    pub port: u16,
    stop: Arc<AtomicBool>,
}

impl Lokalserver {
    /// Startet den Server auf einem freien Port und liefert sofort zurück.
    pub fn starten(wurzel: PathBuf) -> std::io::Result<Lokalserver> {
        let l = TcpListener::bind("127.0.0.1:0")?;
        let port = l.local_addr()?.port();
        let stop = Arc::new(AtomicBool::new(false));
        let s = stop.clone();
        std::thread::spawn(move || {
            for v in l.incoming() {
                if s.load(Ordering::Relaxed) {
                    break;
                }
                let Ok(v) = v else { continue };
                let w = wurzel.clone();
                std::thread::spawn(move || bediene(v, &w));
            }
        });
        Ok(Lokalserver { port, stop })
    }

    pub fn stoppen(&self) {
        self.stop.store(true, Ordering::Relaxed);
        // Verbindung anstoßen, damit die Schleife aufwacht
        let _ = TcpStream::connect(("127.0.0.1", self.port));
    }

    pub fn url(&self) -> String {
        format!("http://127.0.0.1:{}/", self.port)
    }
}

fn typ(p: &Path) -> &'static str {
    match p.extension().and_then(|e| e.to_str()).map(|e| e.to_ascii_lowercase()).as_deref() {
        Some("html") => "text/html; charset=utf-8",
        Some("js") | Some("mjs") => "text/javascript; charset=utf-8",
        Some("css") => "text/css; charset=utf-8",
        Some("json") => "application/json; charset=utf-8",
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("svg") => "image/svg+xml",
        Some("webp") => "image/webp",
        Some("pbf") => "application/x-protobuf",
        Some("pmtiles") => "application/octet-stream",
        Some("zim") => "application/octet-stream",
        Some("txt") | Some("md") => "text/plain; charset=utf-8",
        _ => "application/octet-stream",
    }
}

/// Prozent-Dekodierung des Pfads; `..` und absolute Pfade werden abgewiesen.
fn sicherer_pfad(wurzel: &Path, roh: &str) -> Option<PathBuf> {
    let ohne_query = roh.split('?').next().unwrap_or("");
    let mut bytes = Vec::new();
    let b = ohne_query.as_bytes();
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() + 0 && i + 2 <= b.len() - 1 {
            if let Ok(v) = u8::from_str_radix(std::str::from_utf8(&b[i + 1..i + 3]).ok()?, 16) {
                bytes.push(v);
                i += 3;
                continue;
            }
        }
        bytes.push(b[i]);
        i += 1;
    }
    let s = String::from_utf8(bytes).ok()?;
    let rel = Path::new(s.trim_start_matches('/'));
    if rel.components().any(|c| !matches!(c, Component::Normal(_))) {
        return None;
    }
    Some(wurzel.join(rel))
}

fn antwort_kopf(s: &mut TcpStream, status: &str, extra: &str, laenge: u64) -> std::io::Result<()> {
    write!(s, "HTTP/1.1 {status}\r\nAccept-Ranges: bytes\r\nAccess-Control-Allow-Origin: *\r\nCache-Control: no-cache\r\nConnection: close\r\nContent-Length: {laenge}\r\n{extra}\r\n")
}

fn bediene(mut s: TcpStream, wurzel: &Path) {
    let _ = s.set_read_timeout(Some(std::time::Duration::from_secs(10)));
    let mut r = BufReader::new(match s.try_clone() { Ok(c) => c, Err(_) => return });
    let mut zeile = String::new();
    if r.read_line(&mut zeile).is_err() || zeile.is_empty() {
        return;
    }
    let mut teile = zeile.split_whitespace();
    let (methode, pfad) = (teile.next().unwrap_or(""), teile.next().unwrap_or("/"));
    let mut range: Option<(u64, Option<u64>)> = None;
    loop {
        let mut h = String::new();
        if r.read_line(&mut h).is_err() || h.trim().is_empty() {
            break;
        }
        if let Some(v) = h.to_ascii_lowercase().strip_prefix("range:") {
            if let Some(b) = v.trim().strip_prefix("bytes=") {
                if let Some((a, e)) = b.split_once('-') {
                    let von = a.trim().parse::<u64>().ok();
                    let bis = e.trim().parse::<u64>().ok();
                    if let Some(von) = von {
                        range = Some((von, bis));
                    }
                }
            }
        }
    }
    if methode != "GET" && methode != "HEAD" {
        let _ = antwort_kopf(&mut s, "405 Method Not Allowed", "", 0);
        return;
    }
    let Some(datei) = sicherer_pfad(wurzel, pfad) else {
        let _ = antwort_kopf(&mut s, "403 Forbidden", "", 0);
        return;
    };
    let datei = if datei.is_dir() { datei.join("index.html") } else { datei };
    let Ok(mut f) = std::fs::File::open(&datei) else {
        let _ = antwort_kopf(&mut s, "404 Not Found", "", 0);
        return;
    };
    let gesamt = f.metadata().map(|m| m.len()).unwrap_or(0);
    let ct = format!("Content-Type: {}\r\n", typ(&datei));
    let (status, von, bis) = match range {
        Some((von, bis)) if gesamt > 0 => {
            let bis = bis.unwrap_or(gesamt - 1).min(gesamt - 1);
            if von > bis {
                let _ = antwort_kopf(&mut s, "416 Range Not Satisfiable", &format!("Content-Range: bytes */{gesamt}\r\n"), 0);
                return;
            }
            ("206 Partial Content", von, bis)
        }
        _ => ("200 OK", 0, gesamt.saturating_sub(1)),
    };
    let laenge = if gesamt == 0 { 0 } else { bis - von + 1 };
    let extra = if status.starts_with("206") { format!("{ct}Content-Range: bytes {von}-{bis}/{gesamt}\r\n") } else { ct };
    if antwort_kopf(&mut s, status, &extra, laenge).is_err() || methode == "HEAD" {
        return;
    }
    if f.seek(SeekFrom::Start(von)).is_err() {
        return;
    }
    let mut rest = laenge;
    let mut puffer = vec![0u8; 256 * 1024];
    while rest > 0 {
        let k = rest.min(puffer.len() as u64) as usize;
        let Ok(n) = f.read(&mut puffer[..k]) else { break };
        if n == 0 || s.write_all(&puffer[..n]).is_err() {
            break;
        }
        rest -= n as u64;
    }
    let _ = s.flush();
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Read;

    fn hole(port: u16, pfad: &str, range: Option<&str>) -> (String, Vec<u8>) {
        let mut c = TcpStream::connect(("127.0.0.1", port)).unwrap();
        let r = range.map(|r| format!("Range: {r}\r\n")).unwrap_or_default();
        write!(c, "GET {pfad} HTTP/1.1\r\nHost: x\r\n{r}\r\n").unwrap();
        let mut alles = Vec::new();
        c.read_to_end(&mut alles).unwrap();
        let idx = alles.windows(4).position(|w| w == b"\r\n\r\n").unwrap();
        (String::from_utf8_lossy(&alles[..idx]).to_string(), alles[idx + 4..].to_vec())
    }

    #[test]
    fn bereiche_und_sicherheit() {
        let dir = std::env::temp_dir().join(format!("offline-srv-{}", std::process::id()));
        std::fs::create_dir_all(dir.join("k")).unwrap();
        let daten: Vec<u8> = (0..100_000u32).map(|i| (i % 251) as u8).collect();
        std::fs::write(dir.join("k/karte.pmtiles"), &daten).unwrap();
        std::fs::write(dir.join("k/ö ü.txt"), b"umlaut").unwrap();
        let srv = Lokalserver::starten(dir.clone()).unwrap();

        let (kopf, body) = hole(srv.port, "/k/karte.pmtiles", None);
        assert!(kopf.starts_with("HTTP/1.1 200"), "{kopf}");
        assert!(kopf.contains("Accept-Ranges: bytes"));
        assert_eq!(body, daten);

        let (kopf, body) = hole(srv.port, "/k/karte.pmtiles", Some("bytes=1000-1999"));
        assert!(kopf.starts_with("HTTP/1.1 206"), "{kopf}");
        assert!(kopf.contains("Content-Range: bytes 1000-1999/100000"));
        assert_eq!(body, &daten[1000..2000]);

        let (kopf, body) = hole(srv.port, "/k/karte.pmtiles", Some("bytes=99990-"));
        assert!(kopf.starts_with("HTTP/1.1 206"));
        assert_eq!(body.len(), 10);

        let (kopf, _) = hole(srv.port, "/k/karte.pmtiles", Some("bytes=200000-300000"));
        assert!(kopf.starts_with("HTTP/1.1 416"), "{kopf}");

        let (kopf, body) = hole(srv.port, "/k/%C3%B6%20%C3%BC.txt", None);
        assert!(kopf.starts_with("HTTP/1.1 200"), "{kopf}");
        assert_eq!(body, b"umlaut");

        let (kopf, _) = hole(srv.port, "/../etc/passwd", None);
        assert!(kopf.starts_with("HTTP/1.1 403"), "{kopf}");
        let (kopf, _) = hole(srv.port, "/k/%2e%2e/%2e%2e/etc/passwd", None);
        assert!(kopf.starts_with("HTTP/1.1 403"), "{kopf}");
        let (kopf, _) = hole(srv.port, "/gibtsnicht", None);
        assert!(kopf.starts_with("HTTP/1.1 404"));

        srv.stoppen();
        let _ = std::fs::remove_dir_all(dir);
    }
}
