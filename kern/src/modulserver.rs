//! Server für genau ein Modul (SICHERHEIT.md, Abschnitt Module, Bedingung 1).
//!
//! Jedes geöffnete Modul bekommt einen eigenen Server auf 127.0.0.1 mit zufälligem Port und einem
//! geheimen Pfad `/<token>/`. Wurzel ist nur `inhalt/modul/` dieses Pakets. Jede Antwort trägt eine
//! Content-Security-Policy ohne Netz und die Anweisung `sandbox allow-scripts` – die Sandbox gilt damit
//! auch dann, wenn jemand die Adresse direkt in einem Browser öffnet. In `index.html` wird vor allem
//! anderen die Brücke `window.offline` eingefügt (`einschub`), die die App mitgibt.
//!
//! Nur GET/HEAD, nur lesend, keine Pfad-Ausbrüche, keine Verzeichnisse, kein CORS.

use crate::lokalserver::{sicherer_pfad, typ};
use crate::manifest::Manifest;
use crate::schluessel::OeffentlicherSchluessel;
use std::io::{BufRead, BufReader, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

/// Wer das Modul einbetten darf: nur die App selbst (macOS/Linux `tauri://localhost`, Windows `http(s)://tauri.localhost`).
pub const APP_URSPRUENGE: &str = "tauri://localhost http://tauri.localhost https://tauri.localhost";

pub struct Modulserver {
    pub port: u16,
    pub token: String,
    stop: Arc<AtomicBool>,
}

struct Konfig {
    wurzel: PathBuf,
    token: String,
    csp: String,
    einschub: String,
}

/// Darf dieses Modul WebAssembly ausführen (seit 0.6.5, SICHERHEIT.md, Abschnitt Module)? Nur wenn es das im Manifest
/// anmeldet (`"wasm": true`) und mit einem Schlüssel signiert ist, der den Zweck „wasm“ hat. Den hat vorerst nur der
/// Redaktionsschlüssel, also nur Pakete des eigenen Herausgebers. Das WebAssembly liegt im Paket; Netz gibt es weiter keins.
pub fn wasm_erlaubt(m: &Manifest, signiert_mit: Option<&OeffentlicherSchluessel>) -> bool {
    m.art == "modul" && m.wasm == Some(true) && signiert_mit.is_some_and(|s| s.zweck.iter().any(|z| z == "wasm"))
}

/// Die Content-Security-Policy eines Moduls. Quellen nur vom eigenen Pfad, kein Netz, keine Formulare,
/// keine Rahmen, keine Worker, kein eval. `unsafe-inline`, weil Module eine einzige HTML-Datei sein dürfen.
/// Mit `wasm` (nur nach `wasm_erlaubt`) kommt genau `'wasm-unsafe-eval'` dazu: WebAssembly übersetzen, sonst nichts.
pub fn csp(port: u16, token: &str, einbetten: &str, wasm: bool) -> String {
    let selbst = format!("http://127.0.0.1:{port}/{token}/");
    let wasm = if wasm { " 'wasm-unsafe-eval'" } else { "" };
    format!(
        "default-src 'none'; script-src 'unsafe-inline'{wasm} {selbst}; style-src 'unsafe-inline' {selbst}; img-src {selbst} data: blob:; \
         font-src {selbst} data:; media-src {selbst} data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'; \
         frame-src 'none'; child-src 'none'; worker-src 'none'; object-src 'none'; manifest-src 'none'; \
         frame-ancestors {einbetten}; webrtc 'block'; sandbox allow-scripts"
    )
}

/// Fügt `einschub` direkt nach dem öffnenden `<head …>` ein; fehlt `<head>`, nach `<!doctype …>`, sonst ganz vorn.
pub fn einfuegen(html: &str, einschub: &str) -> String {
    let klein = html.to_ascii_lowercase();
    let nach = |start: usize| klein[start..].find('>').map(|i| start + i + 1);
    let stelle = klein
        .find("<head")
        .filter(|&i| klein[i + 5..].starts_with(|c: char| c == '>' || c.is_whitespace()))
        .and_then(nach)
        .or_else(|| klein.find("<!doctype").and_then(nach))
        .unwrap_or(0);
    format!("{}{}{}", &html[..stelle], einschub, &html[stelle..])
}

fn zufalls_token() -> String {
    use rand::RngCore;
    let mut b = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut b);
    hex::encode(b)
}

impl Modulserver {
    /// Startet den Server für `wurzel` (= `<paket>/inhalt/modul`) und liefert sofort zurück.
    /// `wasm`: Ergebnis von `wasm_erlaubt` für dieses Modul.
    pub fn starten(wurzel: PathBuf, einschub: String, wasm: bool) -> std::io::Result<Modulserver> {
        Self::starten_mit(wurzel, einschub, APP_URSPRUENGE, wasm)
    }

    /// Wie `starten`, mit eigener Liste für `frame-ancestors` (Tests, Prüfseite).
    pub fn starten_mit(wurzel: PathBuf, einschub: String, einbetten: &str, wasm: bool) -> std::io::Result<Modulserver> {
        let l = TcpListener::bind("127.0.0.1:0")?;
        let port = l.local_addr()?.port();
        let token = zufalls_token();
        let k = Arc::new(Konfig { wurzel, csp: csp(port, &token, einbetten, wasm), token: token.clone(), einschub });
        let stop = Arc::new(AtomicBool::new(false));
        let s = stop.clone();
        std::thread::spawn(move || {
            for v in l.incoming() {
                if s.load(Ordering::Relaxed) {
                    break;
                }
                let Ok(v) = v else { continue };
                let k = k.clone();
                std::thread::spawn(move || bediene(v, &k));
            }
        });
        Ok(Modulserver { port, token, stop })
    }

    /// Adresse der Startseite, so wie sie in den iframe kommt.
    pub fn url(&self) -> String {
        format!("http://127.0.0.1:{}/{}/index.html", self.port, self.token)
    }

    pub fn stoppen(&self) {
        self.stop.store(true, Ordering::Relaxed);
        let _ = TcpStream::connect(("127.0.0.1", self.port));
    }
}

impl Drop for Modulserver {
    fn drop(&mut self) {
        self.stoppen();
    }
}

fn antworten(s: &mut TcpStream, status: &str, k: &Konfig, typ: &str, body: &[u8], head: bool) {
    let _ = write!(
        s,
        "HTTP/1.1 {status}\r\nContent-Type: {typ}\r\nContent-Length: {}\r\nContent-Security-Policy: {}\r\n\
         X-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n",
        body.len(),
        k.csp
    );
    if !head {
        let _ = s.write_all(body);
    }
    let _ = s.flush();
}

fn bediene(mut s: TcpStream, k: &Konfig) {
    let _ = s.set_read_timeout(Some(std::time::Duration::from_secs(10)));
    let mut r = BufReader::new(match s.try_clone() {
        Ok(c) => c,
        Err(_) => return,
    });
    let mut zeile = String::new();
    if r.read_line(&mut zeile).is_err() || zeile.is_empty() {
        return;
    }
    loop {
        let mut h = String::new();
        if r.read_line(&mut h).is_err() || h.trim().is_empty() {
            break;
        }
    }
    let mut teile = zeile.split_whitespace();
    let (methode, pfad) = (teile.next().unwrap_or(""), teile.next().unwrap_or("/"));
    let head = methode == "HEAD";
    if methode != "GET" && !head {
        return antworten(&mut s, "405 Method Not Allowed", k, "text/plain", b"", head);
    }
    // Nur unter dem geheimen Pfad. Alles andere sieht aus, als gäbe es nichts.
    let Some(rest) = pfad.strip_prefix('/').and_then(|p| p.strip_prefix(k.token.as_str())).and_then(|p| p.strip_prefix('/')) else {
        return antworten(&mut s, "404 Not Found", k, "text/plain", b"", head);
    };
    let rest = if rest.is_empty() || rest.starts_with('?') { "index.html" } else { rest };
    let Some(datei) = sicherer_pfad(&k.wurzel, rest) else {
        return antworten(&mut s, "403 Forbidden", k, "text/plain", b"", head);
    };
    if !datei.is_file() {
        return antworten(&mut s, "404 Not Found", k, "text/plain", b"", head);
    }
    let Ok(inhalt) = std::fs::read(&datei) else {
        return antworten(&mut s, "404 Not Found", k, "text/plain", b"", head);
    };
    if datei == k.wurzel.join("index.html") {
        let html = einfuegen(&String::from_utf8_lossy(&inhalt), &k.einschub);
        return antworten(&mut s, "200 OK", k, typ(&datei), html.as_bytes(), head);
    }
    antworten(&mut s, "200 OK", k, typ(Path::new(&datei)), &inhalt, head);
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Read;

    fn hole(port: u16, pfad: &str) -> (String, String) {
        let mut c = TcpStream::connect(("127.0.0.1", port)).unwrap();
        write!(c, "GET {pfad} HTTP/1.1\r\nHost: x\r\n\r\n").unwrap();
        let mut alles = Vec::new();
        c.read_to_end(&mut alles).unwrap();
        let t = String::from_utf8_lossy(&alles).to_string();
        let (k, b) = t.split_once("\r\n\r\n").unwrap();
        (k.to_string(), b.to_string())
    }

    #[test]
    fn einfuegen_nach_head() {
        assert_eq!(einfuegen("<!doctype html><html><head><title>x</title>", "[B]"), "<!doctype html><html><head>[B]<title>x</title>");
        assert_eq!(einfuegen("<HTML><HEAD lang=de>x", "[B]"), "<HTML><HEAD lang=de>[B]x");
        assert_eq!(einfuegen("<!DOCTYPE html><header>x</header>", "[B]"), "<!DOCTYPE html>[B]<header>x</header>");
        assert_eq!(einfuegen("<p>x</p>", "[B]"), "[B]<p>x</p>");
    }

    /// WebAssembly (0.6.5): nur mit Anmeldung im Manifest und Schlüssel mit Zweck „wasm“; dann kommt genau
    /// 'wasm-unsafe-eval' dazu, Netz, eval und alles andere bleiben gesperrt.
    #[test]
    fn webassembly_nur_mit_anmeldung_und_eigenem_schluessel() {
        let ohne = csp(1, "t", "x", false);
        let mit = csp(1, "t", "x", true);
        assert!(!ohne.contains("wasm"), "{ohne}");
        assert!(mit.contains("script-src 'unsafe-inline' 'wasm-unsafe-eval' http://127.0.0.1:1/t/;"), "{mit}");
        assert_eq!(mit.replace(" 'wasm-unsafe-eval'", ""), ohne, "sonst gleich");
        assert!(!mit.contains("'unsafe-eval'") && mit.contains("connect-src 'none'"));

        let schluessel = |zweck: &[&str]| OeffentlicherSchluessel { id: "k".into(), algorithmus: "ed25519".into(), oeffentlich: String::new(), zweck: zweck.iter().map(|z| z.to_string()).collect(), gueltig_ab: Some("2026-01-01".into()), gueltig_bis: None, bezeichnung: String::new() };
        let modul = |wasm: Option<bool>| Manifest { art: "modul".into(), wasm, ..Default::default() };
        let eigen = schluessel(&["module", "wasm"]);
        assert!(wasm_erlaubt(&modul(Some(true)), Some(&eigen)));
        assert!(!wasm_erlaubt(&modul(None), Some(&eigen)), "nicht angemeldet");
        assert!(!wasm_erlaubt(&modul(Some(false)), Some(&eigen)));
        assert!(!wasm_erlaubt(&modul(Some(true)), Some(&schluessel(&["module"]))), "Schlüssel ohne Zweck wasm (Herausgeber von außen)");
        assert!(!wasm_erlaubt(&modul(Some(true)), None), "Schlüssel unbekannt");
        assert!(!wasm_erlaubt(&Manifest { art: "inhalt".into(), wasm: Some(true), ..Default::default() }, Some(&eigen)), "nur Module");
    }

    #[test]
    fn nur_eigener_pfad_mit_csp_und_bruecke() {
        let dir = std::env::temp_dir().join(format!("offline-modulsrv-{}", std::process::id()));
        std::fs::create_dir_all(dir.join("modul/bilder")).unwrap();
        std::fs::write(dir.join("modul/index.html"), "<!doctype html><head><title>M</title></head><body>hi</body>").unwrap();
        std::fs::write(dir.join("modul/app.js"), "1").unwrap();
        std::fs::write(dir.join("geheim.json"), "{\"tresor\":1}").unwrap();
        let srv = Modulserver::starten(dir.join("modul"), "<script>/*BRUECKE*/</script>".into(), false).unwrap();
        let t = srv.token.clone();
        assert_eq!(t.len(), 32);

        let (kopf, body) = hole(srv.port, &format!("/{t}/index.html"));
        assert!(kopf.starts_with("HTTP/1.1 200"), "{kopf}");
        assert!(body.contains("<head><script>/*BRUECKE*/</script><title>M</title>"), "{body}");
        let csp = kopf.lines().find(|l| l.starts_with("Content-Security-Policy: ")).expect("CSP fehlt");
        for muss in ["default-src 'none'", "connect-src 'none'", "webrtc 'block'", "form-action 'none'", "frame-src 'none'", "worker-src 'none'", "sandbox allow-scripts", "frame-ancestors tauri://localhost"] {
            assert!(csp.contains(muss), "{muss} fehlt in {csp}");
        }
        assert!(!csp.contains("unsafe-eval") && !csp.contains("allow-same-origin"), "ohne Anmeldung auch kein WebAssembly");
        assert!(!kopf.contains("Access-Control-Allow-Origin"), "kein CORS");
        assert!(kopf.contains("X-Content-Type-Options: nosniff"));

        // Wurzelpfad liefert ebenfalls die Startseite mit Brücke
        assert!(hole(srv.port, &format!("/{t}/")).1.contains("BRUECKE"));
        // andere Dateien unverändert, ohne Brücke
        assert_eq!(hole(srv.port, &format!("/{t}/app.js")).1, "1");

        // ohne oder mit falschem Token: nichts
        assert!(hole(srv.port, "/index.html").0.starts_with("HTTP/1.1 404"));
        assert!(hole(srv.port, "/00000000000000000000000000000000/index.html").0.starts_with("HTTP/1.1 404"));
        // kein Ausbruch aus inhalt/modul/, auch nicht verschlüsselt
        assert!(hole(srv.port, &format!("/{t}/../geheim.json")).0.starts_with("HTTP/1.1 403"));
        assert!(hole(srv.port, &format!("/{t}/%2e%2e/geheim.json")).0.starts_with("HTTP/1.1 403"));
        // Verzeichnisse werden nicht aufgelistet
        assert!(hole(srv.port, &format!("/{t}/bilder")).0.starts_with("HTTP/1.1 404"));
        srv.stoppen();
        let _ = std::fs::remove_dir_all(dir);
    }
}
