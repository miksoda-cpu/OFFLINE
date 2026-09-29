# OFFLINE – Skin „Flechte“ (Version 1, 24.09.2026)

Ablage im Repo: `web/skin/`. Alles liegt lokal, nichts wird aus dem Netz geladen.

## Einbinden

```html
<link rel="stylesheet" href="skin/skin.css">
<body class="of-app"> … </body>
```

Icons stehen in `icons.svg` (Lucide). Entweder die Datei einmal in die Seite einfügen und `<use href="#i-download"/>` nutzen, oder direkt verweisen: `<svg class="of-icon"><use href="skin/icons.svg#i-download"/></svg>`.

`vorschau.html` im Browser öffnen, dort sind alle Bausteine mit echtem Markup zu sehen.

## Bausteine

| Bereich | Klassen |
|---|---|
| Schrift | `of-h1` `of-h2` `of-h3` `of-lead` `of-text` `of-klein` `of-marke` `of-mono` `of-link` |
| Knöpfe | `of-btn` + `--primaer` `--notfall` `--leise` `--pro` · Größe `--klein` `--gross` `--voll` `--rund` · `aria-busy="true"` für Laden |
| Eingaben | `of-feld` `of-label` `of-hilfe` `of-fehler` `of-input` `of-select` `of-textarea` `of-suche` `of-wahl` `of-schalter` |
| Karten | `of-karte` + `--hebt` `--klick`, `of-karte__kopf` `of-karte__fuss` |
| Rückmeldung | `of-hinweis` + `--erfolg` `--warnung` `--notfall`, `of-plakette` + `--offline` `--update` `--pro` `--warnung` `--notfall`, `of-balken` (Wert über `--wert:62%`), `of-meldung`, `of-dialog` |
| Navigation | `of-kopf` `of-leiste` (`aria-current="page"`), `of-reiter` (`aria-selected`), `of-liste` |
| Tresor | `of-tresor` `of-tresor__schloss` `of-pin` |
| Leer | `of-leer` mit `flechten/03-dorf.webp` |
| Flechten | Behälter `of-bewachsen`, Bild `of-flechte` + `--ol` `--or` `--ul` `--ur` `--rand-unten` `--rand-rechts` `--tupfer` `--leise` |

## Hell und dunkel

Folgt der Systemeinstellung. Mit `data-theme="light"` oder `data-theme="dark"` am `<html>` lässt sich das erzwingen.

## Bilder

| Datei | Einsatz |
|---|---|
| `01-riesenrad` | Ecke oben links, groß |
| `02-felder` | unterer Rand |
| `03-dorf` | leere Ansichten |
| `04-rosette` | kleiner Akzent |
| `05-fassade` | rechter Rand |
| `ecke-ol/or/ul/ur` | kleine Ecken |
| `tupfer-*` | frei in der Fläche verstreut, am besten mit `--leise` |

Alle Bilder sind KI-generiert (Meta Muse Image über OpenRouter). Modell, Datum, Prompt, Erzeuger und Prüfsumme je Bild stehen in `herkunft.md`. Die Beschreibungen stehen im Projekt unter `OFFLINE-Flechtenbilder-Prompts.md`.

## Lizenzen

- Bilder: KI-generiert, Herkunft je Bild in `herkunft.md`

- Alegreya: SIL Open Font License 1.1 (`fonts/ofl-alegreya.txt`)
- Atkinson Hyperlegible Next und Mono: SIL Open Font License 1.1 (`fonts/ofl-atkinson-*.txt`)
- Lucide Icons: ISC-Lizenz (`lizenz-lucide.txt`)
