# OFFLINE – Sicherheit und Bedrohungsmodell

Stand: 28. September 2026 · Status: Entwurf 1, aus der Frage „Wie stellen wir sicher, dass ein Paket die App nicht kaputt macht, und wie groß ist das Manipulationsrisiko?“

## Grundsätze

1. **Drei Schichten.** Der Motor (Rust-Kern) ist das einzige Teil, das schreibt, prüft, lädt und verschlüsselt. Die Hülle (Oberfläche) zeigt an und reicht Befehle weiter. Pakete sind reine Daten.
2. **Pakete enthalten keinen Code, außer Module in der Sandbox.** Erlaubt: JSON-Texte, ZIM-Archive, PMTiles-Karten, KI-Modelle. Kein Skript, keine Erweiterung, keine Oberfläche. Einzige Ausnahme sind Pakete der Art `modul` unter den Bedingungen im Abschnitt „Module“.
3. **Ausfall vor Fälschung.** Jede Prüfung ist so gebaut, dass ein Angreifer im schlimmsten Fall etwas verhindern, aber nichts unterschieben kann.
4. **Wir haben keinen Schlüssel zum Tresor.** Was verschlüsselt ist, bleibt es auch für uns.

## Module (`art = "modul"`)

*Gilt seit 29.09.2026, von Mik freigegeben (`bill/erledigt/2026-09-29-freigabe-module-bill-an-code.md`). Hintergrund: `docs/PAKET-KIT.md` Abschnitt 5, Rückmeldung `bill/rueckmeldung/2026-09-29-paket-kit-pflichtenheft.md`. Die Sandbox und `window.offline` sind noch nicht gebaut; bis dahin installiert die App keine Module.*

Ein Modul ist ein Paket mit eigener Oberfläche (`inhalt/modul/index.html`). Das ist Code im Paketkanal. Erlaubt ist es nur, wenn alle drei Bedingungen gelten:

1. **Harte Sandbox in der App:** iframe mit `sandbox` ohne `allow-same-origin`, eigene Content-Security-Policy ohne Netz, kein Zugriff auf Kern, Tresor, Dateien oder die Oberfläche der App. Alles läuft nur über `window.offline` per Nachrichten, und jede Nachricht wird von der App geprüft.
2. **Eigener Schlüssel und Prüfstatus:** Module werden nur mit einem Herausgeber-Schlüssel der Redaktion signiert, nie mit dem Katalogschlüssel, und tragen `pruefstatus: redaktion`. Community-Module gibt es nicht, bis Format 2 mit Herausgebersignaturen steht.
3. **Prüfprogramm beim Einbau Pflicht:** `paket-kit/pruefen.mjs` läuft beim Einbau, nicht nur bei der Abgabe, mit der Verbotsliste aus `docs/PAKET-KIT.md` Abschnitt 5. Zusätzlich lehnt der Rust-Kern beim Installieren jedes `modul`-Paket ab, dessen Dateien außerhalb von `inhalt/modul/` Skripte enthalten.

**Umgesetzt (Phase B, 29.09.2026):** Werkzeug (`werkzeug/kern.mjs`, `paket-lib.mjs`) und Rust-Kern (`kern/src/manifest.rs`, `schluessel.rs`, `paket.rs`) prüfen Bedingung 2 und 3 gleich; Tests in `werkzeug/test.mjs` und `kern/tests/module.rs`. Der Redaktionsschlüssel `d9b62d1755ba3744` (Zweck `module`) liegt privat nur auf Miks Mac unter `~/.offline/schluessel/offline-redaktion.key`, nicht in GitHub; eine Sicherungskopie gehört auf einen weggesperrten Stick. Der Web-Prototyp nimmt keine Module an.

**Umgesetzt (Phase C, 29.09.2026), Bedingung 1:**
- Jedes geöffnete Modul hat einen eigenen Server (`kern/src/modulserver.rs`) auf 127.0.0.1, zufälliger Port, geheimer Pfad, Wurzel nur `inhalt/modul/`. Jede Antwort trägt `Content-Security-Policy: default-src 'none'` mit Quellen nur vom eigenen Pfad, `connect-src 'none'`, `form-action 'none'`, `frame-src 'none'`, `worker-src 'none'`, kein `unsafe-eval`, `frame-ancestors` nur die App, `webrtc 'block'` und `sandbox allow-scripts`. Kein CORS.
- Der allgemeine lokale Dateiserver (Karten, Medien) liefert nichts unter `inhalt/modul/` aus, sonst könnte ein Modul seinen Rahmen dorthin umleiten und die Netzsperre umgehen.
- Der iframe hat `sandbox="allow-scripts"` ohne `allow-same-origin`, `allow=""` und `referrerpolicy="no-referrer"`.
- `window.offline` (`web/modul-bruecke.js`) wird als erstes Skript eingefügt und spricht nur per `postMessage`. Die Gegenseite (`web/modul-host.js`) nimmt nur Nachrichten genau dieses Rahmens mit Herkunft `null` an, nur die sechs Aufrufe aus `PAKET-KIT.md` Abschnitt 5, höchstens 256 kB je Nachricht und 50 je Sekunde. Welches Modul spricht, setzt die App selbst. Speicher je Modul liegt in `<Datenordner>/module/<id>.json`, höchstens 1 MB.
- **WebRTC** geht an jeder CSP vorbei (STUN über UDP ins Internet, in Chromium nachgewiesen). Gegenmittel: Die Brücke entfernt `RTCPeerConnection` vor dem Modul; aus Unterrahmen holt es niemand zurück, weil sie in der Sandbox fremd sind. Dazu `webrtc 'block'` in der CSP und `RTCPeerConnection` auf der Verbotsliste des Prüfprogramms.
- **Probe:** `werkzeug/testmodule/boese` versucht 42 Ausbrüche (seit 29.09. abends; vorher 37) (Netz auf allen Wegen, Code nachladen, App/Tauri/Tresor, fremder Speicher, unbekannte Aufrufe, Überflutung, Fenster, Navigation, Berechtigungen). `node werkzeug/sandbox-probe.mjs [--chrome]` fährt es über den echten Modulserver gegen eine Prüfseite mit der CSP des Hauptfensters. Ergebnis 29.09.2026: **Desktop-App 0.2.0 unter macOS (WKWebView, Entwickler-Build, „Sandbox-Probe“) 37 von 37 blockiert**, Chromium 154 (Engine von WebView2) 37 von 37, WebKit/Safari 26 (Engine von WKWebView und WebKitGTK) 35 von 35. Windows und Linux in der App selbst: noch offen. Berichte in `werkzeug/testmodule/bericht-*.json`.

**Windows (WebView2), Befund der Windows-Probe 29.09.2026, und drei Sicherungen:** WebView2 legt Tauris Schnittstellen auch in Unterrahmen an, also im Modulrahmen: `__TAURI_INTERNALS__` (mit `invoke`), `window.ipc` und `chrome.webview`. Unter macOS und Linux gibt es das nicht. Vier echte Aufrufe aus dem Modul (App-Info, Tresor, Webseite öffnen, Ordnerdialog) kamen nie an. Trotzdem gilt:
1. **Die Brücke räumt ab**, bevor Modulcode läuft: `chrome.webview`, `window.ipc` und die `__TAURI*`-Namen, soweit Tauri es zulässt. `__TAURI_INTERNALS__` und seine Funktionen legt Tauri unveränderlich an (`defineProperty` ohne `configurable`), das Objekt bleibt deshalb sichtbar, hat aber keinen Weg mehr zur App. Die CSP des Modulservers sperrt den zweiten Weg (`fetch` an `ipc://` bzw. `http://ipc.localhost`, `connect-src 'none'`).
2. **Die Probe zählt Benutzbarkeit, nicht Sichtbarkeit:** „Tauri-Objekt benutzbar“ ist gelungen, wenn ein Aufruf über `__TAURI_INTERNALS__` Erfolg hat; „Tauri-Rohkanal“, wenn `window.ipc.postMessage` noch da ist; dazu die vier echten Aufrufe. 42 Versuche.
3. **Der Kern lehnt jeden Befehl von fremder Herkunft ab.** Alle 64 App-Befehle stehen im App-Manifest (`app/src-tauri/build.rs`, Satz `app-befehle` in `permissions/app.toml`) und damit unter Tauris Berechtigungsliste. Vergeben wird der Satz nur in `capabilities/default.json`: Fenster `main`, ohne `remote`, also nur bei lokaler Herkunft (`tauri://localhost`, unter Windows `http://tauri.localhost`). Der Modulserver `http://127.0.0.1:…` ist für Tauri fremd und bekommt keinen Befehl, auch keine Plugin-Befehle (Dialog, Opener, Ereignisse). Test `berechtigungen` in `app/src-tauri/src/lib.rs`: echte IPC-Anfragen durch Tauris Prüfung, lokal erlaubt, Modulserver und andere Adressen für elf Befehle abgelehnt; wacht außerdem, dass Befehlsliste, Manifest und Berechtigungssatz übereinstimmen und keine Capability `remote` bekommt. Gegenprobe: Mit `remote` für 127.0.0.1 fällt der Test durch. Läuft in der CI unter Windows, macOS und Linux (`tests.yml`, Job „App-Berechtigungen“).

Ebenfalls aus der Windows-Probe: 0.1.x registrierte unter Windows einen Service Worker (`web/sw.js`, nur für den Web-Prototyp gedacht), der nach dem Update die neue Seite nicht laden ließ. Seit 0.2.0 löscht der Kern ihn vor dem ersten Laden, und die Desktop-App registriert keinen mehr.

**Ein Modul kann nur, was `window.offline` anbietet.** Braucht ein Modul mehr (zum Beispiel Internet), gibt es zwei Wege: eine neue, kleine und geprüfte Funktion in `window.offline` per App-Update, die dann alle Module nutzen dürfen, oder das ganze Modul wird als festes Feature in die App eingebaut. Beides braucht Miks Freigabe. Ein Modul kann sich nichts selbst erlauben.

## Was ein Paket beim Einspielen durchläuft

| Schritt | Prüfung | Bei Fehler |
|---|---|---|
| 1 | Signatur gegen die eingebauten öffentlichen Schlüssel (Zweck, Gültigkeitsfenster); der Zweck muss zur Paketart passen (Module nur `module`, alles andere `pakete`) | Abbruch, nichts gelesen |
| 2 | Struktur: Pflichtfelder, Kennung, Kalenderversion, bekannte Paketart, Mindestversion der App | Abbruch |
| 3 | Pfade: nur unter `inhalt/`, kein `..`, kein absoluter Pfad, keine Steuerzeichen; Code (`.js`, Skripte in Seiten) nur in Modulen unter `inhalt/modul/`, Modul-Oberfläche höchstens 2 MB; CSS ohne `@import`, ohne `url()` nach außen, ohne `expression()` und Escapes; Skins nur unter `inhalt/skin/`, höchstens 20 MB | Abbruch |
| 4 | Größe und SHA-256 jeder Datei, bei großen Dateien jedes Teilstücks | Abbruch, Teilstück wird neu geladen |
| 5 | Staging in `<id>-<version>.neu/`, dort erneute Vollprüfung, dann atomarer Tausch; der alte Stand bleibt als `.alt` bis zum Abschluss | halber Zustand wird beim nächsten Start aufgeräumt |
| 6 | Beim Start jedes installierte Paket erneut prüfen | beschädigtes Paket erscheint nicht, die anderen laufen |
| Katalog | Signatur, `erstellt` darf nie kleiner werden (Rollback-Sperre), Ablaufdatum | Katalog abgelehnt, Installiertes läuft weiter |

Was ein sauber signiertes, aber inhaltlich kaputtes Paket bewirkt: Ein unlesbares JSON liefert der Hülle „nichts“, sie zeigt den Ersatztext. Texte werden beim Anzeigen entschärft (kein eingeschmuggeltes HTML). ZIM-Seiten rendert kiwix-serve in einem eigenen Rahmen ohne Zugriff auf die App. Karten liest MapLibre nur als Kacheln.

## Angriffsorte und Gegenmittel

### A. Auf dem Weg zum Gerät (Server, Download, USB-Stick)
- **Abgedeckt:** Signatur, Prüfsummen, Rollback-Sperre, Bereichs-Downloads mit Prüfung je Teil. Ein gehackter Speicher kann Pakete löschen oder Alte hinlegen, aber keine gefälschten einschleusen.
- **Offen:** Speicherplatzprüfung vor dem Download (ein 42-GB-Paket darf die Platte nicht vollschreiben).

### B. Der Signaturschlüssel
- **Heute:** Erprobungsschlüssel `offline-ci` liegt als GitHub-Secret; wer das GitHub-Konto übernimmt, kann echte Pakete signieren.
- **Vor dem Start (Checkliste in HETZNER-SETUP.md):** Produktionsschlüssel offline erzeugen, zwei Kopien an zwei Orten; Redaktionspakete auf einem Rechner ohne Dauer-Netz signieren; Erprobungsschlüssel mit `gueltig_bis` beenden.
- **Geplant:** getrennter Schlüssel für den Katalog, damit Paket und Katalog von zwei Stellen kommen müssen. Rückzugsliste im Katalog für kompromittierte Schlüssel (Format 2). Updater-Schlüssel (`TAURI_SIGNING_PRIVATE_KEY`) ebenso offline sichern, ohne ihn gibt es keine App-Updates mehr.

### C. Werkstatt (Code, Build, Installer)
- **Abgedeckt:** öffentlicher Quelltext (Apache 2.0), Builds nur auf Knopfdruck, Tests im Kern und im Werkzeug bei jedem Lauf, App-Updates signiert mit eigenem Schlüssel.
- **Offen:** Code-Signing der Installer (Apple Developer ID + Notarisierung, Windows-Zertifikat), sonst kann ein manipuliertes DMG unter unserem Namen verteilt werden. Reproduzierbare Builds, damit Dritte den Installer aus dem Quelltext nachrechnen können.

### D. Der Inhalt (das größte Risiko)
Keine Kryptografie schützt vor einer falschen Notrufnummer, die sauber signiert durch die Redaktion ging. Gegenmittel sind redaktionell:
- Quellenpflicht: jede Angabe mit Verweis auf die amtliche Stelle (`quellen` im Manifest).
- Vier-Augen-Prinzip vor jeder Signatur eines Redaktionspakets.
- Herausgeber, Datum, Lizenz und Prüfstatus sichtbar auf jeder Paketkarte.
- Öffentliches Verzeichnis aller je signierten Pakete mit Prüfsummen (Transparenz), damit nichts still ausgetauscht werden kann.
- Marktplatz (Ebene 3) nur mit Freigabe vor Veröffentlichung; Herausgeber dürfen nur ihre eigenen Kennungen liefern.

### E. Das Gerät selbst
- Tresor: Argon2id, XChaCha20-Poly1305, Schlüssel nur im Arbeitsspeicher, Sperre nach Zeit und beim Minimieren, nichts Entschlüsseltes auf der Platte. Details: TRESOR.md.
- **Nicht in unserer Hand:** Schadsoftware auf dem Gerät, jemand, der beim Entsperren zusieht, verlorenes Passwort samt Code.

## Nächste Schritte am Kern
- [ ] Speicherplatzprüfung vor dem Download
- [ ] Getrennter Katalogschlüssel (Zweck `katalog`), Paketschlüssel nur für Pakete
- [ ] Öffentliches Paketverzeichnis (Liste aller signierten Manifeste mit Hash, auf der Website)
- [ ] Ein Paket, das beim Start dreimal als beschädigt erkannt wird, wird in `.kaputt/` verschoben statt still ausgeblendet
- [ ] Anleitung „Offline signieren mit dem Produktionsschlüssel“ für die Redaktion
