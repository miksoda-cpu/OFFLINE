# Rückmeldung: Paket-Kit-Werkzeug, Phase C (Sandbox und `window.offline`)

**Von:** Code (lokale Session) · **Datum:** 2026-09-29 · **Auftrag:** `bill/todo/2026-09-29-paket-kit-werkzeug.md` · **Commit:** `2436fc8`

## Ergebnis
- **Eigener Server je Modul** (`kern/src/modulserver.rs`):
  - Adresse auf 127.0.0.1 mit zufälligem Port und geheimem Pfad (128 Bit). Wurzel ist nur `inhalt/modul/`.
  - Jede Antwort trägt eine CSP: `default-src 'none'`, Quellen nur vom eigenen Pfad, `connect-src 'none'`, keine Formulare, Rahmen oder Worker, kein `eval`, `frame-ancestors` nur die App, `webrtc 'block'`. Dazu `sandbox allow-scripts` im Antwortkopf, damit die Sandbox auch gilt, wenn jemand die Adresse direkt öffnet. Kein CORS.
- **Lücke geschlossen:** Der allgemeine lokale Dateiserver (Karten, Medien) hatte weder CSP noch Sandbox und hätte auch `inhalt/modul/` ausgeliefert. Ein Modul hätte seinen Rahmen dorthin umleiten und ohne Netzsperre weiterlaufen können. Er verweigert das jetzt (403), mit Test.
- **Brücke:**
  - `web/modul-bruecke.js` wird als erstes Skript eingefügt und ist eingefroren. Der Umfang entspricht genau Abschnitt 5: `speicher.lesen/schreiben`, `vorlesen`, `drucken`, `wesen.sagen`, `alter()`, `version`.
  - Die Gegenseite `web/modul-host.js` nimmt nur Nachrichten genau dieses Rahmens mit Herkunft `null` an. Erlaubt sind nur diese Aufrufe, Schlüssel nach fester Regel, höchstens 256 kB je Nachricht und 50 je Sekunde. Alles andere wird verworfen, mit Grund, wenn eine id da ist. Welches Modul spricht, setzt die App selbst; ein Modul-Feld in der Nachricht wird ignoriert.
  - `drucken` übernimmt nie das HTML des Moduls, sondern baut einen bereinigten Textbaum ohne Skripte, Links, Bilder und Stile.
- **App** (`app/src-tauri/src/module.rs`):
  - Befehle `modul_oeffnen` (prüft das Paket erneut, nur Art `modul`, nur wenn aktiv), `modul_schliessen`, `modul_speicher_lesen/schreiben` (je Modul `<Datenordner>/module/<id>.json`, höchstens 1 MB, nur solange das Modul offen ist), `module_stand`, `modul_aktiv_setzen`, `modul_loeschen` (verlangt das Wort „löschen“ und fragt nach den Daten).
  - `modul_test_oeffnen` gibt es nur in Entwickler-Builds, für das bösartige Testmodul.
- **WebRTC:** Das bösartige Modul hat in Chromium über WebRTC einen STUN-Server im Internet erreicht. Die CSP deckt WebRTC nicht ab. Gegenmittel:
  - Die Brücke entfernt `RTCPeerConnection`, bevor das Modul läuft. Über Unterrahmen holt es niemand zurück, weil sie in der Sandbox fremd sind; das ist mitgetestet.
  - Dazu kommen `webrtc 'block'` in der CSP und `RTCPeerConnection` auf der Verbotsliste (Pflichtenheft 5.2 ergänzt).

## Geprüft
- **Bösartiges Testmodul** `werkzeug/testmodule/boese`: 37 Angriffe.
  - Netz auf allen Wegen: fetch, XHR, WebSocket, EventSource, Beacon, Bild, Skript, Stylesheet, iframe, Worker, WebRTC auch über Unterrahmen.
  - Code nachladen: `eval`, `new Function`.
  - App und Tauri: `parent`, `__TAURI__`, IPC über `ipc://` und `http://ipc.localhost`, die Kanäle von WebView2 und WebKit.
  - Tresor über die Brücke, localStorage, indexedDB, Cookies, Service Worker.
  - Fremder Speicher über `../` und über ein Modul-Feld, unbekannter Aufruf, 300-kB-Nachricht, Flut mit 300 Aufrufen.
  - Fenster und Rechte: `window.open`, `top.location`, Zwischenablage, Standort.
- **Prüfseite** `node werkzeug/sandbox-probe.mjs [--chrome]`: echter Modulserver des Kerns, echte Gegenseite, dieselbe CSP wie das Hauptfenster.

| Engine | steht für | Ergebnis |
|---|---|---|
| Chromium 154 (Headless-Chrome) | WebView2 unter Windows | 37 von 37 blockiert |
| WebKit, Safari 26 (macOS) | WKWebView unter macOS, WebKitGTK unter Linux | 35 von 35 blockiert (Lauf vor den zwei Kanal-Tests) |

- `node --test werkzeug/test.mjs`: 27 von 27. Neu:
  - Prüfung der Gegenseite mit 14 Ablehnungsfällen.
  - Die Brücke ist gültig und hat genau einen Platzhalter.
  - Das bösartige Modul scheitert schon am Prüfprogramm (9 Treffer der Verbotsliste), und `bauen` verweigert es.
- `cargo test`: Kern 32 von 32 (neu: Modulserver mit CSP, Token, Ausbrüchen, Einfügen der Brücke; lokaler Server verweigert Modul-Oberflächen). App 2 von 2 (Schlüsselregel, Brücke bleibt ein Skript).

## Durchsetzung auf den drei Systemen (Frage aus dem Auftrag)
- **Stand:** Beide Engines setzen Sandbox und CSP gleich durch, bis auf eine Ausnahme: WebRTC wird von keiner CSP erfasst. Das ist mit der Brücke gelöst, und in beiden Engines geprüft.
- **Tauri-Eigenheiten:**
  - Unter Windows läuft die App unter `http(s)://tauri.localhost`, unter macOS und Linux unter `tauri://localhost`. Beides steht in `frame-ancestors`.
  - Die Tauri-IPC und die Kanäle `chrome.webview` und `webkit.messageHandlers` sind im Modulrahmen nicht erreichbar (geprüft in beiden Engines).
  - WebKitGTK hat WebRTC ohnehin standardmäßig aus.
- **Noch offen:** Die Probe in der fertigen Desktop-App selbst. Unter macOS mache ich sie in Phase D/E mit `modul_test_oeffnen` im Entwickler-Build. Windows und Linux kann ich hier nicht selbst bedienen. Die Prüfseite ist dafür gebaut, und der CI-Job `sandbox` in `tests.yml` fährt sie gegen Chrome auf Linux; er wartet noch auf das Recht `workflow`.
- **Kein Haltepunkt:** Nach dem jetzigen Stand setzt keine Webview die Sandbox unsicher durch. Sollte die Probe in der App unter macOS etwas anderes zeigen, halte ich an und melde es.
- **Handy (später):** iOS-Apps nutzen WKWebView, also dieselbe Engine wie die Safari-Probe. Die Store-Regel (App Store Review 4.7) erlaubt HTML5-Mini-Apps in einer Web-Ansicht, wenn sie den Zweck der App nicht ändern und nur Schnittstellen nutzen, die die App ausdrücklich freigibt. Das passt zu „ein Modul kann nur, was `window.offline` anbietet“. Wie weit Module mit Kauf oder Abo in diese Regel fallen, gehört zur Anwaltsliste.

## Restrisiken, bewusst
- **DNS-Vorabauflösung** (`<link rel=dns-prefetch>`) lässt sich von innen nicht messen und wird von der CSP nicht in jeder Engine erfasst. Eine Adresse im Modul wäre allerdings schon für das Prüfprogramm ein Fehler („externe Adresse in src/href“).
- Die Verbotsliste ist ein Textabgleich. Wer verschleiert (`window["fe"+"tch"]`), besteht sie, scheitert dann aber an der Sandbox. Dafür gibt es die zweite Schicht.

## Fragen an Bill
Keine. Weiter mit Phase D.
