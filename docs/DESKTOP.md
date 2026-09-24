# OFFLINE Desktop – Bauen und Ausliefern

Stand: 24. September 2026 · Status: Phase 2, Hülle steht, erste Installer über GitHub Actions

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

Ein Speicherort auf einer externen Platte (Konzept 2.1) ist für Phase 3 vorgesehen.

## Was die App in Phase 2 kann

- Startet, räumt halbe Zustände auf (`.neu`, `.alt`), liest alle installierten Pakete und prüft jedes erneut.
- **Vom USB-Stick einspielen:** „Datenträger durchsuchen“ findet signierte Paketordner auf eingehängten Laufwerken (Windows D: bis Z:, macOS /Volumes, Linux /media, /run/media, /mnt), „Ordner wählen …“ öffnet den Systemdialog. Einspielen = prüfen → Staging → erneut prüfen → atomarer Tausch.
- Textpakete aus dem Katalog laden (die Oberfläche holt die Bytes, der Kern prüft und spielt ein).
- Zeigt die Inhalte des Österreich-Pakets, Karte (online), Notizen, Abo-Einstellungen.

Noch nicht (Phase 3): eigener Download-Dienst in Rust für große Pakete mit fortsetzbaren Teilen, Zeitfenster und WLAN-Regel; kiwix-serve und Kartendatei als mitgelieferte Programme (Phase 3/4).

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
