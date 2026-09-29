# Rückmeldung: Skin „Flechte“ als Paket, App mit schlichtem Grundaussehen

**Von:** Code (lokale Session) · **Datum:** 2026-09-29 · **Auftrag:** `bill/erledigt/2026-09-29-flechte-als-paket.md` · **Commits:** `1af2b92` (Paketart), `8705e8f` (App und Paket), `e6c05c4` (Korrekturen nach dem App-Durchlauf)

## Ergebnis
1. **Paketart: eigene Art `skin`** (von mir entschieden). Begründung:
   - Ein Skin hat eigene Regeln, die `inhalt` nicht kennt: nur Stil, Schriften, Bilder, Lizenzen und Herkunft unter `inhalt/skin/`, Einstieg `skin.css`, höchstens 20 MB, Pflichtangabe `ki_generiert`.
   - Die App behandelt ihn eigens: Es ist höchstens einer aktiv, und die Notfallseiten schalten ihn ab.
   - Als `inhalt` mit Kategorie `aussehen` könnte sich jedes Inhaltspaket als Skin ausgeben, und die Regeln hingen an einer Kategorie statt an der Art.
   - **Signatur:** Paket- oder Redaktionsschlüssel, beide dürfen. Der Redaktionsschlüssel darf weiterhin keine gewöhnlichen Pakete signieren.
   - Pflichtenheft, neuer Abschnitt 5a in `docs/PAKET-KIT.md`; die Kopie im Kit ist mitgezogen.
2. **CSS-Sicherheit:** Die Regeln gelten für jede `.css` außerhalb von Modul-Oberflächen, nicht nur in Skins.
   - Verboten: `@import`, `url()` außerhalb des Pakets (Schema, `//`, `/` am Anfang, `..`; erlaubt sind nur `data:image/…` und `data:font/…`), `expression()`, `javascript:`, `behavior:`/`-moz-binding` sowie Backslash-Escapes, weil man damit das Verbotene tarnen könnte.
   - Prüfprogramm, Werkzeug und Rust-Kern prüfen gleich. Das Prüfprogramm listet alle Gründe auf, der Kern nennt den ersten.
3. **Grundaussehen:** Das Markup trägt zusätzlich Klassen mit `of-`, die bisherigen bleiben, also sieht die App ohne Skin genau aus wie vorher.
   - Der Umbau war mechanisch: rund 350 Stellen in `app.js`, `app.html` und `wesen.js`, also nicht größer als gedacht.
   - **Schnittstelle für Skins:** `of-app` am `<body>`, `of-karte`, `of-btn` mit Varianten, `of-plakette`, `of-input`/`of-select`/`of-textarea`, `of-seitenleiste`, `of-inhalt`, `of-seitenkopf` und weitere, dazu die Grundwerte der App (`--bg`, `--surface`, `--text`, `--accent` …). Beschrieben in 5a.4.
   - Die Österreich-Flagge im Logo bleibt rot-weiß-rot, sie hing vorher an der Akzentfarbe.
4. **Notfallseiten** zeigen immer das Grundaussehen: Die App schaltet die Skin-Stile auf `#notfall` ab.
5. **Bedienung wie bei Modulen:** Katalogkarte, Vorschau-Slider, grüner Schieber „laden“, danach Schalter aktiv/inaktiv und „löschen“ mit getipptem Wort. Es gibt keinen Knopf „Öffnen“. Es ist höchstens ein Skin aktiv (`app/src-tauri/src/skin.rs`).
   - **Laden der CSS:** Der Kern prüft die CSS noch einmal und schreibt relative `url()` auf den lokalen Dateiserver um.
   - **Sicherheitsregel des Fensters:** Sie lässt jetzt Schriften von 127.0.0.1 zu (`font-src`).
6. **KI-Kennzeichnung** auf der Karte: „Bilder KI-generiert, Herkunft im Paket“, gesteuert über `ki_generiert`.
7. **Flechte** als Quelle unter `pakete/flechte/`:
   - Dateinamen klein nach Regel 4.3: `herkunft.md`, `lizenz-lucide.txt`, `fonts/ofl-*.txt`.
   - `vorschau.html` weggelassen, weil Skins kein HTML enthalten.
   - Am Ende von `skin.css` ein Abschnitt „App-Brücke“: legt die Grundwerte der App auf die Flechten-Farben, Karten fließen wie im Grundaussehen, Flechten nur an freien Rändern und auf schmalen Bildschirmen gar nicht.
   - Slideshow mit fünf Folien; Folie 2 ist ein echter Bildschirm der Übersicht mit Flechte.
   - Gebaut mit dem Redaktionsschlüssel in `~/.offline/redaktion/pakete/flechte-2026.09.29`: 37 Dateien, 4,2 MB. **Nicht veröffentlicht.** `alles-bauen.sh` überspringt Skins wie Module.
8. `docs/PAKETE-IDEEN.md`: „fertig“ ist ersetzt durch „als Paket gebaut, lokal geprüft, nicht veröffentlicht“.

## Durchlauf in der Test-App (macOS)

| Schritt | Ergebnis |
|---|---|
| Lokale Quelle | Karte „Flechte · Aussehen“ mit Skin-Schild, „lokal, nicht veröffentlicht“, KI-Hinweis, Slider |
| laden | installiert, zunächst inaktiv, Schalter und „löschen“, kein „Öffnen“ |
| aktiv | Flechte auf Übersicht, Vorsorge, Werkzeuge, Bibliothek: Moosgrün, Serifen für Titel, Flechte oben rechts und in der Seitenleiste |
| Notfall | Grundaussehen: rote Nummern, weiße Karten, Systemschrift |
| inaktiv | sofort wieder Grundaussehen |
| löschen | Wort getippt, Paket weg, Karte wieder mit „laden“ |
| neu laden, aktiv | wie oben |

**Beim Durchlauf gefunden und behoben** (`e6c05c4`):
- `.of-karte` ist in der Flechte-CSS ein Raster. Dadurch wurden die Knöpfe in App-Karten zu breiten Balken. Die Brücke setzt Karten jetzt auf `display: block`.
- Die Kopfleiste fürs Handy erschien am Desktop. Sie heißt jetzt `of-kopfleiste`, die der Skin nicht umbaut.

**Dunkel und 360 px:** geprüft im Browser-Bereich mit derselben CSS. „Waldnacht“ greift, die Tab-Leiste unten ist in Moosgrün, es gibt keinen seitlichen Überlauf. Dabei fiel auf, dass auf schmalen Bildschirmen die Eckflechte über dem Untertitel lag; sie ist dort jetzt weg.

**Test-Skin mit verbotenem CSS:** `werkzeug/testmodule/boeser-skin` scheitert am Prüfprogramm (`@import`, `url()` nach außen, `expression`). Dieselben Fälle scheitern am Kern, in Node (`werkzeug/test.mjs`) und in Rust (`kern/tests/module.rs`).

## Geprüft
- `node --test werkzeug/test.mjs web/*.test.mjs`: 55 von 55. Neu sind 4 Tests zu Skins: gültig mit beiden Schlüsseln, sechs Formen verbotenen CSS, Ordner und Typen, der Test-Skin am Prüfprogramm.
- `cargo test`: Kern 37 von 37 (neu: CSS-Regeln und drei Skin-Tests), App 4 von 4 (neu: Umschreiben der Adressen, auch gegen die echte Flechte-CSS).

## Offene Punkte
- **Folie 2** ist im Web-Prototyp aufgenommen (Headless-Chrome), weil ich in dem Moment keinen Bildschirmzugriff hatte. Die Oberfläche ist dieselbe wie in der Desktop-App; das Band „Prototyp“ ist abgeschnitten.
- **Rechtsfrage zu KI-Bildern:** steht in `herkunft.md` (Frage an den Anwalt vorgeschlagen).
- **Dunkel in der Desktop-App selbst** habe ich nicht umgeschaltet: Dafür müsste ich die Systemeinstellung ändern, und das tue ich nicht.
