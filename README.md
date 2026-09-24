# OFFLINE

**Wissen, das nicht ausfällt.** Offline-Wissen und Werkzeuge für Österreich, auf Deutsch, auf jedem PC und Mac.

Ein Projekt von The Digioneer und der digitalworld Academy. Inspiriert von [Project N.O.M.A.D.](https://github.com/Crosstalk-Solutions/project-nomad) (Apache 2.0), eigenständig umgesetzt.

## Inhalt dieses Repos

| Ordner | Was |
|---|---|
| [`docs/KONZEPT.md`](docs/KONZEPT.md) | Konzept: Architektur, Offline-Installer, Update-Abo, Inhalte und Lizenzen, Frei/Pro, Fahrplan |
| [`docs/PAKETFORMAT.md`](docs/PAKETFORMAT.md) | Paketformat: signierte Manifeste, Katalog, Delta-Updates, Schlüssel |
| [`werkzeug/`](werkzeug/) | Paketwerkzeug (Node, keine Abhängigkeiten): Schlüssel, bauen, prüfen, delta, katalog – mit Tests |
| [`app/`](app/) | Desktop-App (Tauri 2): Hülle um den Kern, Oberfläche aus `web/`. Installer baut [GitHub Actions](.github/workflows/desktop.yml), Anleitung in [`docs/DESKTOP.md`](docs/DESKTOP.md) |
| [`kern/`](kern/) | Rust-Kern der Desktop-App: Signatur, Prüfsummen, Delta, atomares Einspielen – gleiche Tests wie das Werkzeug (`cargo test`) |
| [`pakete/`](pakete/) | Quellen der Inhaltspakete (Österreich-Paket) |
| [`schluessel/`](schluessel/) | Öffentliche Signaturschlüssel (derzeit Entwicklungsschlüssel) |
| [`docs/GHOST-SETUP.md`](docs/GHOST-SETUP.md) | Anmeldung für das Gratis-Paket, Newsletter und Pro-Stufe über Ghost |
| [`web/`](web/) | Web-Prototyp (PWA): Startseite + App-Oberfläche. Funktioniert nach dem ersten Besuch auch offline im Browser. Wird auf Vercel ausgeliefert. |

## Pakete bauen

```bash
node werkzeug/paket.mjs schluessel erzeugen offline-dev   # einmal je Rechner; privater Schlüssel landet in ~/.offline/
./werkzeug/alles-bauen.sh                                 # Pakete → web/pakete, Katalog → web/katalog
node --test werkzeug/test.mjs
```

Die Ordner `web/pakete`, `web/katalog`, `web/schluessel` und `web/paket-kern.js` werden vom Build erzeugt und sind eingecheckt, damit Vercel ohne Build-Schritt auskommt. Nach Inhaltsänderungen neu bauen und mit einchecken.

## Web-Prototyp lokal starten

Keine Abhängigkeiten, kein Build:

```bash
cd web
python3 -m http.server 8080
# → http://localhost:8080
```

## Deployment

Vercel-Projekt `offline`, Root Directory `web/`, ohne Build-Schritt. Jeder Push erzeugt eine neue Vorschau.

## Lizenz

Noch festzulegen (geplant: Apache 2.0 für die Software; eigene Inhalte separat lizenziert).
