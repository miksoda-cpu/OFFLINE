# OFFLINE

**Wissen, das nicht ausfällt.** Offline-Wissen und Werkzeuge für Österreich, auf Deutsch, auf jedem PC und Mac.

Ein Projekt von The Digioneer und der digitalworld Academy. Inspiriert von [Project N.O.M.A.D.](https://github.com/Crosstalk-Solutions/project-nomad) (Apache 2.0), eigenständig umgesetzt.

## Inhalt dieses Repos

| Ordner | Was |
|---|---|
| [`docs/KONZEPT.md`](docs/KONZEPT.md) | Konzept: Architektur, Offline-Installer, Update-Abo, Inhalte und Lizenzen, Frei/Pro, Fahrplan |
| [`web/`](web/) | Web-Prototyp (PWA): Startseite + App-Oberfläche. Funktioniert nach dem ersten Besuch auch offline im Browser. Wird auf Vercel ausgeliefert. |

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
