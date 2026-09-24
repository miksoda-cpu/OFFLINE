# OFFLINE Desktop – Bauen und Ausliefern

Stand: 24. September 2026 · Status: Phase 3, Update-Dienst im Kern, Installer über GitHub Actions

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

## Was die App in Phase 2 kann

- Startet, räumt halbe Zustände auf (`.neu`, `.alt`), liest alle installierten Pakete und prüft jedes erneut.
- **Vom USB-Stick einspielen:** „Datenträger durchsuchen“ findet signierte Paketordner auf eingehängten Laufwerken (Windows D: bis Z:, macOS /Volumes, Linux /media, /run/media, /mnt), „Ordner wählen …“ öffnet den Systemdialog. Einspielen = prüfen → Staging → erneut prüfen → atomarer Tausch.
- Pakete aller Größen aus dem Katalog laden – über den Update-Dienst des Kerns (siehe oben).
- Zeigt die Inhalte des Österreich-Pakets, Karte (online), Notizen, Abo-Einstellungen.

Noch nicht: kiwix-serve und Kartendatei als mitgelieferte Programme (Phase 4), Lizenzschlüssel für Pro-Pakete (Phase 5), Abfrage getakteter Verbindungen je Betriebssystem.

## Installer bauen – GitHub Actions

Der Workflow `.github/workflows/desktop.yml` baut bei jedem Push auf den Entwicklungsbranch (wenn sich `app/`, `kern/`, `web/` oder `schluessel/` ändern) und auf Knopfdruck:

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

## Signieren (vor dem ersten öffentlichen Download)

Ohne Code-Signing warnen Windows („Unbekannter Herausgeber“) und macOS („kann nicht geöffnet werden“, Gatekeeper). Für die interne Erprobung ist das hinnehmbar; für den Start braucht es:
- **Windows:** ein OV- oder EV-Code-Signing-Zertifikat (Azure Trusted Signing ist die günstigste Variante für Firmen in der EU) – Zertifikat als GitHub-Secret, Tauri signiert beim Bauen.
- **macOS:** Apple Developer Program (99 $/Jahr), Developer ID Application-Zertifikat und Notarisierung – Secrets `APPLE_CERTIFICATE`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` im Workflow.
- **Linux:** keine Pflicht.

Das ist getrennt vom Paket-Signaturschlüssel (Ed25519): Der eine sagt „diese App ist von uns“, der andere „dieses Paket ist von uns“.
