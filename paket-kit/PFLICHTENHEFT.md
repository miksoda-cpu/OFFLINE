# OFFLINE – Pflichtenheft für Pakete

*Paket-Kit, Version 1 · Stand 29.09.2026, mit Nachtrag (Abnahme, Quellen-`id`, Notrufhinweis) und Prüfprogramm im Repo · gilt für neue Pakete und für jedes Update*

**Maßgeblich ist diese Fassung.** `paket-kit/PFLICHTENHEFT.md` ist die Kopie für Herausgeber, die ohne das Repo arbeiten. Weichen beide ab, gilt dieses Dokument. Die Kopie ist wortgleich und wird bei jeder Änderung mitgezogen; `werkzeug/test.mjs` prüft das.

Dieses Heft sagt, was ein Paket enthalten muss, damit es in OFFLINE eingebaut werden kann. Wer ein Paket liefert (Redaktion, Entwickler, später Herausgeber am Marktplatz), füllt die Vorlage aus und lässt das Prüfprogramm laufen. Erst wenn das Prüfprogramm keinen Fehler meldet, geht das Paket an den Einbau. Der Einbau prüft noch einmal mit demselben Programm, baut das Paket mit `werkzeug/paket.mjs bauen`, signiert es und nimmt es in den Katalog.

Das technische Format des fertigen, signierten Pakets steht in `docs/PAKETFORMAT.md`. Dieses Heft beschreibt die Stufe davor: den **Quellordner**, den man abgibt.

```mermaid
flowchart LR
  A["Vorlage ausfüllen<br/>paket.quelle.json<br/>inhalt/ · vorschau/"] --> B["node pruefen.mjs<br/>&lt;ordner&gt;"]
  B -->|Fehler| A
  B -->|grün| C["Abgabe<br/>Ordner + Prüfbericht"]
  C --> D["Redaktion<br/>manuelle Punkte"]
  D --> E["Einbau<br/>pruefen · bauen ·<br/>signieren · Katalog"]
  E --> F["Update<br/>gleicher Weg,<br/>pruefen --vorher"]
```

## 1. Was man abgibt

```
<id>/
├── paket.quelle.json        Angaben zum Paket (Pflicht)
├── LIESMICH.md              für die Redaktion: was, warum, wie geprüft (Pflicht)
└── inhalt/                  alles, was in die App kommt (Pflicht)
    ├── vorschau/            die Slideshow für die Paketseite (Pflicht)
    │   ├── folien.json
    │   ├── 1.svg … 5.svg    (oder .webp / .png)
    ├── …                    Inhalte (Texte, Daten, Bilder)
    └── modul/               nur bei art = "modul": die Oberfläche
        └── index.html
```

Alles unter `inhalt/` wird signiert und ausgeliefert. Alles außerhalb bleibt bei der Redaktion.

## 2. `paket.quelle.json`

| Feld | Pflicht | Regel |
|---|---|---|
| `id` | ja | `[a-z0-9-]{2,40}`, bleibt über alle Versionen gleich |
| `titel` | ja | höchstens 60 Zeichen |
| `beschreibung` | ja | ein bis zwei Sätze, höchstens 240 Zeichen |
| `art` | ja | `inhalt`, `zim`, `karte`, `modell`, `kurs`, `software` oder neu `modul` (Paket mit eigener Oberfläche, siehe 5) |
| `sprache` | ja | BCP-47, meist `de-AT` |
| `lizenz` | ja | z. B. `CC BY-SA 4.0`, `gemeinfrei`, `eigene Rechte` |
| `herausgeber` | ja | wer verantwortet den Inhalt |
| `quellen` | ja | Liste mit `id`, `name` und `url` (url darf leer sein, wenn es keine gibt). `id` ist kurz, `[a-z0-9-]`, eindeutig im Paket und geht unverändert in `paket.json` über. Schritte und Einträge in den Inhalten verweisen mit `quelle: "<id>"` auf sie, damit die Schlüssel nicht nur im Bauskript stehen |
| `pro` | ja | `true` oder `false` |
| `preis` | ja | `gratis`, `pro` oder `kauf` |
| `pruefstatus` | ja | `redaktion`, `herausgeber` oder `community` |
| `app_min` | ja | kleinste App-Version, z. B. `0.1.0` |
| `aenderungen` | ja | was neu ist, in einem Satz für „Was ist neu?" |
| `alter_ab` | ja | ab welchem Alter das Paket im Kinder-Modus sichtbar ist: `0` für alle, `6`, `10`, `14`, `18` |
| `kategorie` | ja | eine der Gruppen der Paketseite: `ernstfall`, `wissen`, `jeden-tag`, `du-und-die-deinen`, `unterwegs`, `verbindung`, `miteinander`, `aussehen` |
| `braucht_netz` | ja | `false`. Ein Paket, das Netz braucht, ist kein OFFLINE-Paket. Ausnahme nur mit Begründung im LIESMICH |
| `abnahme` | ja | `keine`, oder wer fachlich abgenommen hat bzw. abnehmen muss (`Feuerwehr`, `Rettung`, …) und der Stand (`angefragt`, `erteilt am …`). Dieses Feld führt. Ein Feld `fachlich_abgenommen` in einzelnen Inhalten (etwa im Guide-Format) zeigt höchstens den Stand je Inhalt an und ersetzt `abnahme` nie |
| `datenversion` | bei `modul` | ganze Zahl, beginnt bei 1. Erhöhen, wenn sich das Format gespeicherter Nutzerdaten ändert (siehe 7) |

## 3. Die Slideshow `inhalt/vorschau/`

Jedes Paket hat genau **fünf Folien, immer in derselben Reihenfolge**, damit man Pakete vergleichen kann:

| Nr. | `rolle` | zeigt |
|---|---|---|
| 1 | `wofuer` | die Lage, für die das Paket gemacht ist, mit einem Satz |
| 2 | `aussehen` | einen echten Bildschirm aus dem Paket |
| 3 | `inhalt` | was drin ist, höchstens sechs Punkte |
| 4 | `platz` | Größe, Gerät (Handy / Laptop), ob mit KI |
| 5 | `herkunft` | Herausgeber, Quellen, Prüfstatus, Lizenz |

`folien.json`:

```json
{ "folien": [
  { "nr": 1, "rolle": "wofuer", "bild": "1.svg", "titel": "…", "text": "…", "alt": "…" }
] }
```

Regeln: Titel höchstens 50 Zeichen, Text höchstens 160, `alt` (Bildbeschreibung zum Vorlesen) Pflicht. Alle fünf Bilder zusammen höchstens 200 kB. Keine Schrift als Bild ohne dieselbe Aussage im Text.

## 4. Regeln für alle Inhalte

1. **Kein Netz.** Kein Inhalt lädt etwas nach. Keine Links auf Bilder, Schriften oder Skripte im Internet. Links zum Weiterlesen in Texten sind erlaubt, die App zeigt sie als „braucht Netz".
2. **Erlaubte Dateitypen:** `.json .md .txt .html .css .js .svg .png .webp .jpg .mp3 .ogg .pdf .zim .pmtiles .gguf`. Alles andere nur mit Begründung. **Code nur in Modulen:** `.js` und Skripte in `.html`/`.svg` (`<script>`, `on…=`-Attribute, `javascript:`) sind nur bei `art = "modul"` und nur unter `inhalt/modul/` erlaubt (`docs/SICHERHEIT.md`, Grundsatz 2).
3. **Pfade:** nur Kleinbuchstaben, Ziffern, `-`, `_`, `.`, `/`. Keine Leerzeichen, kein `..`, keine versteckten Dateien, keine Verknüpfungen.
4. **Sprache:** kurze Sätze, ein Gedanke pro Satz, österreichische Begriffe (Jänner, Rettung 144). Keine Werbung, keine Floskeln.
5. **Notfallinhalte:** Jede Anleitung für den Ernstfall beginnt mit „Ist jemand in Gefahr?" und der Notrufnummer. Dieser Notrufhinweis ist ein Pflichtfeld jeder Notfallanleitung; fehlt er, ist das ein Fehler, kein Hinweis. Sie ist fester Text, keine KI. Ohne Abnahme bleibt sie im Status `angefragt` und die App zeigt das an.
   - **Feld:** `"notruf": { "frage": "Ist jemand in Gefahr?", "nummer": "144" }` auf oberster Ebene der Anleitung. `frage` wörtlich so, `nummer` drei bis fünf Ziffern.
   - **Als Notfallanleitung gilt** (so erkennt es das Prüfprogramm): jede JSON-Datei mit `"typ": "guide"` oder `"nachschlage-guide"` in einem Paket der Kategorie `ernstfall`, und jede JSON-Datei mit `"notfall": true`, egal in welcher Kategorie. Anleitungen, die das Programm so nicht erkennt, prüft die Redaktion.
6. **Barrierefreiheit:** Jeder Text muss vorlesbar sein (kein Text nur in Bildern). Kontrast bei eigener Gestaltung mindestens 4,5 : 1.
7. **Kinder:** Pakete mit `alter_ab` unter 18 enthalten keine Kontaktmöglichkeit zu Fremden und keine Links nach außen.
8. **Quellen und Lizenz** stehen vollständig in `paket.quelle.json`. Was nicht gemeinfrei, offen lizenziert oder eigenes Werk ist, kommt nicht hinein.

## 5. Zusätzlich für `art = "modul"`

Ein Modul ist ein Paket mit eigener Oberfläche, etwa Wichteln, ein Rätsel oder ein Spiel. Es läuft in der App in einem abgeschlossenen Bereich (Sandbox) ohne Netz.

1. **Einstieg:** `inhalt/modul/index.html`. Alles, was es braucht, liegt in `inhalt/modul/`. Keine Bibliotheken aus dem Internet; wer eine braucht, legt sie als Datei dazu, mit Lizenz.
2. **Verboten** (das Prüfprogramm sucht danach): `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `eval`, `new Function`, `importScripts`, externe `src=`/`href=`, `<iframe>`, `window.open`.
3. **Schnittstelle zur App:** Das Modul spricht nur über `window.offline` mit der App.

| Aufruf | Was |
|---|---|
| `offline.speicher.lesen(schluessel)` / `.schreiben(schluessel, wert)` | Daten des Moduls speichern, nur für dieses Modul, am Gerät, im Schließfach mitgesichert |
| `offline.vorlesen(text)` | Text vorlesen lassen |
| `offline.drucken(html)` | Druckansicht öffnen (Karten, Zettel) |
| `offline.wesen.sagen(text)` | das Wesen sagt einen Satz (nur, wenn das Paket „Wir" aktiv ist) |
| `offline.alter()` | Altersstufe im Kinder-Modus oder `null` |
| `offline.version` | App-Version |

Für die Entwicklung im Browser bringt das Modul einen **Ersatz** mit (`if (!window.offline) window.offline = …` mit `localStorage`), damit man es ohne App testen kann. `localStorage` direkt zu verwenden ist sonst nicht erlaubt.

4. **Größe:** Oberfläche höchstens 2 MB.
5. **Handy zuerst:** muss bei 360 Pixel Breite bedienbar sein, Knöpfe mindestens 44 Pixel hoch.

## 6. `LIESMICH.md`

Für die Redaktion, nicht für Nutzer. Pflichtabschnitte: **Was** (zwei Sätze) · **Für wen** · **Wie geprüft** (was hat man selbst ausprobiert, auf welchen Geräten) · **Offene Punkte** · bei Updates: **Was hat sich geändert**.

## 7. Updates

Ein Update ist derselbe Weg mit einem Zusatz: `node pruefen.mjs <neu> --vorher <alt>`.

1. `id` bleibt gleich.
2. `aenderungen` ist neu geschrieben und sagt, was sich für den Nutzer ändert.
3. Entfernte Dateien werden gelistet. Die Redaktion bestätigt, dass nichts wegfällt, worauf sich Nutzer verlassen.
4. Bei Modulen: Hat sich das Format gespeicherter Daten geändert, wird `datenversion` erhöht **und** `inhalt/modul/migration.js` liegt bei. Das Modul muss Daten der Vorversion lesen können. Nutzerdaten gehen bei einem Update nie verloren.
5. `alter_ab` darf bei einem Update nicht sinken, ohne dass die Redaktion es freigibt.

## 8. Was das Prüfprogramm prüft, und was ein Mensch prüft

| Das Programm (`pruefen.mjs`) | Die Redaktion |
|---|---|
| alle Pflichtfelder, Formate, erlaubte Werte | stimmt der Inhalt, ist die Sprache gut |
| Slideshow: fünf Folien, Rollen, Längen, Größe | sind die Folien ehrlich (echter Bildschirm auf Folie 2) |
| Dateitypen, Pfade, Größen | passen Lizenz und Quellen wirklich |
| verbotene Aufrufe und externe Adressen | fachliche Abnahme bei Notfallinhalten |
| Netz- und Kinderregeln, soweit maschinell erkennbar | Kinderregeln im Sinn, nicht nur im Buchstaben |
| Notrufhinweis in Notfallanleitungen fehlt → Fehler (Regel 4.5) | stimmt die Nummer für die Lage |
| `quellen[].id` vorhanden und eindeutig, jeder Verweis `quelle` in den Inhalten trifft eine `id` | stimmt die Quelle für die Aussage |
| Code nur in Modulen unter `inhalt/modul/`; Module nur mit `pruefstatus: redaktion` | |
| Update: id, aenderungen, entfernte Dateien, datenversion + Migration | Update: fällt etwas weg, worauf Nutzer bauen |

Das Programm schreibt einen **Prüfbericht** (`PRUEFBERICHT.md`) in den Ordner. Er hat drei Teile: Fehler (muss behoben werden), Hinweise (sollte man ansehen), Für die Redaktion (Liste der manuellen Punkte zum Abhaken). Der Bericht wird mit abgegeben.

## 9. Abgabe

Ordner (oder ZIP davon) mit grünem Prüfbericht an die Redaktion. Einbau durch Code:

```
node paket-kit/pruefen.mjs <ordner>                    # noch einmal prüfen
cp -r <ordner> pakete/<id>                             # Quelle ablegen
node werkzeug/paket.mjs bauen pakete/<id> <ziel> --pruefen   # prüfen, bauen und signieren
./werkzeug/alles-bauen.sh                              # Katalog neu
```

Bei Modulen prüft `bauen` immer, auch ohne `--pruefen`: Ein Modul mit Fehlern im Prüfbericht wird nicht gebaut (`docs/SICHERHEIT.md`, Module, Bedingung 3). Der Test „Weg aus Abschnitt 9“ in `werkzeug/test.mjs` spielt diesen Ablauf bei jedem Lauf durch.
