# OFFLINE Desktop – Bauen und Ausliefern

Stand: 24. September 2026 · Status: Phase 4 erledigt (Wikivoyage 1,3 GB über Hetzner geladen und in der App gelesen), App-Update über den Knopf, Tresor (4b) in 0.1.3

## Aufbau

```
app/
├── package.json          nur das Tauri-Kommandozeilenwerkzeug
└── src-tauri/
    ├── Cargo.toml        Tauri 2 + offline-kern
    ├── tauri.conf.json   Fenster, Bundles, CSP; Oberfläche = ../../web
    ├── capabilities/     was die Oberfläche darf (Kernbefehle, Ordnerdialog, Links öffnen)
    ├── icons/            erzeugt aus web/icon.svg
    └── src/lib.rs        Befehle: installierte, paket_lesen, einspielen_ordner, einspielen_bytes,
                          entfernen, stick_suchen, datenordner, aufraeumen_start
kern/                     Rust-Kern (Paketformat), eigenständig testbar
web/                      dieselbe Oberfläche wie der Web-Prototyp
```

Die Oberfläche merkt beim Start, ob sie in Tauri läuft (`window.__TAURI__`). Im Browser prüft und speichert `paket-client.js` selbst; in der App übernimmt `paket-client-tauri.js` und reicht alles an den Rust-Kern weiter. **Nichts, was auf die Platte geschrieben wird, wurde nicht vom Kern geprüft.**

Die öffentlichen Signaturschlüssel werden beim Bauen aus `schluessel/oeffentlich.json` in die App eingebettet. Ein neuer Schlüssel braucht also ein App-Update – genau wie in der Spezifikation vorgesehen.

Datenordner der App (dort liegen die Pakete):

| System | Ordner |
|---|---|
| Windows | `%APPDATA%\at.digioneer.offline\pakete` |
| macOS | `~/Library/Application Support/at.digioneer.offline/pakete` |
| Linux | `~/.local/share/at.digioneer.offline/pakete` |

**Speicherort ändern:** Updates & Abo → „Speicherort → Ordner wählen …“. Die App legt dort `OFFLINE-Pakete/` an und liest ab dann nur von dort. Bereits installierte Pakete bleiben am alten Ort (verschieben von Hand oder neu laden). Merkt sich die App in `abo.json` neben dem Paketordner.

## Update-Dienst (Phase 3)

Der Kern (`kern/src/download.rs`, `kern/src/abo.rs`) lädt Pakete selbst – die Oberfläche zeigt nur an:

- **Katalog** vom Update-Server: Signatur, Rollback-Schutz (`erstellt` darf nie kleiner werden), Ablauf.
- **Paket in Teilen:** Range-Anfragen je Teil, jedes Teil sofort gegen seine Prüfsumme; bei Verbindungsabbruch bis zu 3 Versuche. Dateien ohne Teile werden ab dem Dateiende fortgesetzt und am Ende geprüft.
- **Fortsetzbar:** Was im Staging-Ordner `<id>-<version>.neu/` schon stimmt, wird nicht noch einmal geladen – nach Abbruch, Absturz oder Stromausfall geht es dort weiter.
- **Delta:** Unveränderte Dateien und unveränderte Teile großer Dateien kommen aus der installierten Version (Hardlink oder Kopie), nicht aus dem Netz.
- **Atomarer Tausch** wie beim USB-Import; der alte Stand bleibt bis zur vollständigen Prüfung.
- **Hintergrund-Abo:** Jede Minute prüft die App, ob nach Intervall (täglich/wöchentlich/monatlich), Zeitfenster (auch über Mitternacht) und Verbindung eine Prüfung fällig ist. Dann werden alle installierten Pakete auf den Katalogstand gebracht; das Ergebnis erscheint unter Updates & Abo.
- **„Nur im WLAN“:** Ob eine Verbindung getaktet ist, weiß die App nur, wenn das System es meldet (Browser-`saveData`); unbekannt zählt nicht als getaktet. Eine echte Abfrage je Betriebssystem ist offen.
- Einstellungen und Zustand liegen in `abo.json` (Katalog-URL, Intervall, Fenster, letzte Prüfung, zuletzt gesehener Katalog).

Kommandozeile zum Testen ohne App: `offline-kern katalog <url>` und `offline-kern laden <url> <id> <ordner>`.

## Inhalte anzeigen (Phase 4)

- **Lokaler Dateiserver** (`kern/src/lokalserver.rs`): nur 127.0.0.1, zufälliger Port, nur lesend, nur unter dem Paketordner, mit Bereichsanfragen. Darüber liest der Kartenviewer PMTiles-Dateien stückweise. Kein Zugriff von außen, keine Pfad-Ausbrüche (getestet).
- **kiwix-serve** wird als mitgeliefertes Programm ausgeliefert (`app/src-tauri/binaries/`, holt der Build-Workflow von download.kiwix.org). Die App startet es bei Bedarf mit allen ZIM-Dateien der installierten `zim`-Pakete auf 127.0.0.1 und öffnet die Bibliothek in einem eigenen Fenster („Bibliothek → Öffnen“). Ändern sich die Pakete, wird es neu gestartet; beim Beenden der App endet es.
- **Offline-Karte** (`web/karte.js`, MapLibre GL + PMTiles + Protomaps-Basemap-Stil aus `web/lib/`): sobald ein `karte`-Paket mit einer `.pmtiles`-Datei installiert ist, zeigt die Karten-Seite diese statt der Online-Karte. Erwarteter Paketinhalt: `inhalt/karte.pmtiles`, `inhalt/fonts/<Schrift>/<Bereich>.pbf` (Beschriftungen), optional `inhalt/sprites/`. Ohne Schriften werden nur Flächen und Linien gezeichnet.
- **Restlos löschen** gibt es auch in der App (Updates & Abo → Werkzeuge): Wort eintippen + Bestätigung, dann sind Pakete und Einstellungen weg; das Programm selbst deinstalliert man über das Betriebssystem.

Was noch fehlt: die **echten Pakete** (Wikivoyage/Wikipedia als ZIM, Österreich-Karte als PMTiles). Sie sind Gigabyte groß und müssen an einem Ort liegen, der Bereichsanfragen erlaubt und Datenverkehr günstig abgibt – siehe Konzept, Abschnitt „Update-Server“.

## Was die App in Phase 2 kann

- Startet, räumt halbe Zustände auf (`.neu`, `.alt`), liest alle installierten Pakete und prüft jedes erneut.
- **Vom USB-Stick einspielen:** „Datenträger durchsuchen“ findet signierte Paketordner auf eingehängten Laufwerken (Windows D: bis Z:, macOS /Volumes, Linux /media, /run/media, /mnt), „Ordner wählen …“ öffnet den Systemdialog. Einspielen = prüfen → Staging → erneut prüfen → atomarer Tausch.
- Pakete aller Größen aus dem Katalog laden – über den Update-Dienst des Kerns (siehe oben).
- Zeigt die Inhalte des Österreich-Pakets, Karte (online), Notizen, Abo-Einstellungen.

Noch nicht: kiwix-serve und Kartendatei als mitgelieferte Programme (Phase 4), Lizenzschlüssel für Pro-Pakete (Phase 5), Abfrage getakteter Verbindungen je Betriebssystem.

## Tresor (Phase 4b)

Verschlüsselter Bereich unter `<Datenordner>/tresor/` (nicht im Paketordner, also nicht auf der externen Platte). Kern: `kern/src/tresor.rs`, Befehle `tresor_*` in `lib.rs`, Sperrzeit in `abo.json` (`tresor_sperre_min`). Der Schlüssel lebt nur im Arbeitsspeicher der App; ein Wächter-Thread sperrt nach Ablauf. Einzelheiten und Stand: [TRESOR.md](TRESOR.md).

## App-Update (die App holt sich neue Versionen selbst)

Unter **Updates & Abo → App-Update → „Nach neuer Version suchen“** fragt die App die Datei `app/latest.json` am Hetzner-Speicher. Gibt es eine neuere Version, lädt sie diese, prüft die Signatur (Tauri-Updater, eigener minisign-Schlüssel, unabhängig vom Paketschlüssel) und tauscht sich aus; danach „Jetzt neu starten“. Windows startet den Installer selbst und beendet die App.

**Eine neue Version veröffentlichen:**
1. Version an drei Stellen erhöhen: `app/src-tauri/tauri.conf.json`, `app/src-tauri/Cargo.toml`, `APP_VERSION` in `web/app.js`.
2. Committen, pushen. Dann Actions → Desktop-App → „Run workflow“ → Häkchen „Veröffentlichen“ → Run (oder ein Tag `v0.1.2`).
3. Der Workflow baut alle vier Installer, signiert die Updater-Dateien mit dem Secret `TAURI_SIGNING_PRIVATE_KEY`, lädt alles nach `app/<version>/` im Bucket und schreibt `app/latest.json`. Ab dann finden installierte Apps die neue Version.

Ohne das Secret laufen die Builds weiter (mit Warnung), erzeugen aber keine Updater-Dateien; der Tag-Lauf bricht dann im Schritt „Veröffentlichen“ ab.

Der private Updater-Schlüssel liegt **nicht** im Repository. Der öffentliche steht in `tauri.conf.json` unter `plugins.updater.pubkey`. Geht der private verloren, können installierte Apps keine Updates mehr annehmen – dann hilft nur ein neuer Schlüssel und eine manuelle Neuinstallation bei allen. Zwei Kopien an zwei Orten.

## Installer bauen – GitHub Actions

Der Workflow `.github/workflows/desktop.yml` baut auf Knopfdruck (Actions → Desktop-App → Run workflow) und bei Tags `v*` – seit 24.09.2026 nicht mehr bei jedem Push: Das Repository ist privat, und GitHub rechnet macOS-Minuten zehnfach auf das Monatskontingent (2.000 Minuten im Free-Plan) an; ein voller Lauf kostet rund 130 Minuten. Abhilfe, wenn das Kontingent aufgebraucht ist: Repository öffentlich stellen (Apache 2.0 ist ohnehin der Plan; öffentliche Repositories haben kein Minutenlimit) oder unter Settings → Billing das Ausgabenlimit erhöhen.

| System | Ergebnis |
|---|---|
| Windows | `.msi` und `.exe` (NSIS) |
| macOS Apple Silicon | `.dmg` |
| macOS Intel | `.dmg` |
| Linux | `.AppImage`, `.deb` |

**So kommst du an die Installer:**
1. Im Repository auf **Actions** → Workflow **Desktop-App** → neuester Lauf.
2. Unten unter **Artifacts** liegt je System ein Archiv (`OFFLINE-Windows`, `OFFLINE-macOS Apple Silicon`, …).
3. Ein Tag `v0.1.0` erzeugt zusätzlich einen **Release-Entwurf** mit allen Installern.

Falls Actions im Repository noch nicht laufen: **Settings → Actions → General → „Allow all actions“** und unter „Workflow permissions“ **„Read and write“** (für Release-Entwürfe).

## Lokal bauen

Voraussetzungen: Rust (rustup), Node 22, und je System die Tauri-Voraussetzungen (https://tauri.app/start/prerequisites/ – unter Linux `libwebkit2gtk-4.1-dev`, unter Windows die Build Tools, unter macOS Xcode Command Line Tools).

```bash
cd app && npm install
npm run tauri dev      # startet die App mit der Oberfläche aus ../web
npm run tauri build    # Installer unter src-tauri/target/release/bundle/
```

**macOS ohne Entwicklerzertifikat:** Der Workflow signiert das Bundle nach dem Bauen ad-hoc – zuerst die mitgelieferten Programme (`kiwix-serve`), dann das Hauptprogramm, dann das Bundle – prüft es mit `codesign --verify --deep --strict` und baut daraus das `.dmg`. Ein gezipptes `.app` aus dem Build-Ordner startet auf Apple Silicon sonst nicht („Killed: 9“, Signatur passt nicht mehr zu den Ressourcen). Immer das `.dmg` verwenden.

## Signieren (vor dem ersten öffentlichen Download)

Ohne Code-Signing warnen Windows („Unbekannter Herausgeber“) und macOS („kann nicht geöffnet werden“, Gatekeeper). Für die interne Erprobung ist das hinnehmbar; für den Start braucht es:
- **Windows:** ein OV- oder EV-Code-Signing-Zertifikat (Azure Trusted Signing ist die günstigste Variante für Firmen in der EU) – Zertifikat als GitHub-Secret, Tauri signiert beim Bauen.
- **macOS:** Apple Developer Program (99 $/Jahr), Developer ID Application-Zertifikat und Notarisierung – Secrets `APPLE_CERTIFICATE`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` im Workflow.
- **Linux:** keine Pflicht.

Das ist getrennt vom Paket-Signaturschlüssel (Ed25519): Der eine sagt „diese App ist von uns“, der andere „dieses Paket ist von uns“.
