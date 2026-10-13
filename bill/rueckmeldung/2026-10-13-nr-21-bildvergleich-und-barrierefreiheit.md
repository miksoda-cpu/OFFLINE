# Rückmeldung: Nr. 21 · Bildvergleich und Barrierefreiheit als Prüfstufen

**Von:** Code (Nachtlauf) · **Datum:** 2026-10-13 · **Auftrag:** `bill/erledigt/2026-10-10-nr-21-bildvergleich-und-barrierefreiheit.md` · **Commit:** `3cab872` (Code), Branch `nr-21-bildvergleich`

## Ergebnis
- Neuer Job in `tests.yml`: „Bildvergleich und Barrierefreiheit (Web-App, Headless-Chrome)“, läuft bei jedem Push. Bei Fehlschlag kommen Aufnahmen, Differenzbilder und die Berichte als Artefakt `bildvergleich-<commit>` (14 Tage).
- `werkzeug/bildvergleich.mjs --chrome`: 22 MVP-Seiten (Heute, Bereit, Notfall mit Radio, Vorsorge mit Grundvorsorge und Haushalt, zwölf Szenario-Karten, Karte, Bibliothek, Pause, Tresor, Einstellungen = „Updates & Abo“, Hilfe-Blatt) × 360/1280 px × hell/dunkel = 88 Aufnahmen über die volle Seitenhöhe. Lumi aus, Datum fest (14.10.2026), Zufall fest, keine Bewegung, fremde Adressen gesperrt.
- Referenzbilder in `werkzeug/referenz/` (18 MB), aus der CI selbst (Ubuntu, Chrome 154). Toleranz in `referenz/toleranz.json`, Standard: Schwelle 16, Anteil 0, also kein abweichendes Pixel. Neu setzen nur mit `--referenz-setzen`, das mit `CI` gesetzt abbricht.
- `werkzeug/barrierefrei.mjs --chrome`: axe-core 4.13.0 (MPL-2.0, `werkzeug/axe/` mit Lizenz), WCAG 2.0/2.1 A und AA, dieselben Seiten und Varianten. „serious“ und „critical“ lassen fehlschlagen; Ausnahmen mit Grund in `werkzeug/barrierefrei-ausnahmen.json`.
- Ohne npm-Abhängigkeit: Chrome über das DevTools-Protokoll mit dem WebSocket aus Node 22 (`browser.mjs`), PNG lesen, schreiben, vergleichen mit `node:zlib` (`png.mjs`). Beschreibung in `werkzeug/README.md`.
- Bildsatz für den Anker: 88 JPG, 480 px breit, in `bill/rueckmeldung/bilder/2026-10-anker-mvp/` (`<seite>-<breite>-<hell|dunkel>.jpg`), aus demselben CI-Lauf wie die Referenz.

## Abweichungen
- Keine Barrierefreiheits-Korrektur in der App, auch nicht die trivialen (Name für Fortschrittsbalken, `tabindex` im Hilfe-Blatt): Jede ändert die App, und App-Änderungen können erst zusammengeführt werden, wenn die Windows-Probe wieder grün ist. Alle Befunde stehen deshalb mit Grund in der Ausnahmeliste.
- Die Wegwerf-Branches `wegwerf-nr21-abstand` und `wegwerf-nr21-alt` konnte der Nachtlauf nicht löschen (Löschen im Push wird mit HTTP 403 abgelehnt). Sie liegen noch auf GitHub und können gelöscht werden.
- Radio, Grundvorsorge, Haushalt und Einstellungen haben keine eigene Adresse; sie sind in den Aufnahmen der Seiten enthalten, auf denen sie stehen.

## Nicht gemacht
- Desktop-App, Handy: laut Auftrag nicht dabei.
- Die Referenzbilder gelten erst nach Miks Urteil über den Anker-Satz als abgenommen.

## Befunde axe-core (alle „serious“, keiner „critical“; 65 Stellen, alle mit Ausnahme)
- `aria-progressbar-name`, Fortschrittsbalken ohne Namen: Vorsorge (18), Notfall (12), alle zwölf Szenario-Karten (je 1), Hilfe (18, die Balken der Seite unter dem Blatt)
- `color-contrast`: Karte, Quellenzeile von Leaflet im dunklen Aussehen (2)
- `link-in-text-block`: Karte, dieselbe Quellenzeile, Links nur durch Farbe erkennbar (2)
- `scrollable-region-focusable`: Hilfe, scrollbarer Inhalt des Blatts nicht per Tastatur erreichbar (1)

## Geprüft
- `node --test werkzeug/bildvergleich.test.mjs`: 9 von 9 grün (PNG, Verschiebung um 2 px, Größe, Schwelle, Ausnahmeliste, Referenzen passend zur Seitenliste, Sperre im CI); ohne die Änderung fehlt das Modul, alle rot.
- Grün mit Referenz, ohne Abweichung in einem neuen Runner: https://github.com/miksoda-cpu/OFFLINE/actions/runs/38328327983 (danach Lauf für `3cab872`, siehe STATUS)
- Gegenprobe Abstand: `.tag-karten` 2 px mehr Abstand oben, rot genau bei den vier Heute-Aufnahmen (Höhe 1685 → 1687 px), alle anderen 84 gleich: https://github.com/miksoda-cpu/OFFLINE/actions/runs/38328337783 · Differenzbild: `bill/rueckmeldung/bilder/2026-10-13-nr-21/gegenprobe-heute-360-hell-differenz.png`
- Gegenprobe Alternativtext: Bild ohne `alt` in der Kopfleiste, Barrierefreiheit rot mit 22 offenen `image-alt` (critical): https://github.com/miksoda-cpu/OFFLINE/actions/runs/38328345400
- Erster Lauf ohne Referenz (lieferte die Referenzbilder): https://github.com/miksoda-cpu/OFFLINE/actions/runs/38327507367
- Windows-Probe nicht gestartet: Der Auftrag ändert nur `werkzeug/`, `tests.yml` und `bill/`, nicht die App.
- Darf nicht: kein Test gelockert oder gelöscht; `werkzeug/` ohne npm-Abhängigkeit; keine Änderung an der App; die CI schreibt nie in `werkzeug/referenz/`.

## Erklärung
Der Bildvergleich findet feine Layout-Änderungen, weil er Pixel zählt statt Bilder zu beschreiben: 2 px Abstand an einer Stelle machten genau die vier betroffenen Aufnahmen rot. Er bleibt ohne Änderung grün, weil Datum, Zufall, Lumi, Bewegung und Netz festgelegt sind; das zeigt der zweite Lauf auf einem anderen Runner, der kein einziges Pixel abwich. Die Barrierefreiheit prüft die gerenderte Seite in beiden Farben und schlug bei einem Bild ohne Alternativtext an. Was heute schon auffällt, steht mit Grund in der Ausnahmeliste, damit neue Befunde sofort rot werden.

## Fragen an Bill
- Die vier Ausnahmen sind kleine App-Korrekturen. Sinnvoll als eigener Auftrag, sobald die Windows-Probe wieder grün ist; dann fallen die Ausnahmen weg.
- Ändert ein Auftrag eine Seite gewollt, muss jemand die Referenz von Hand neu setzen. Die Referenz entsteht in der CI-Umgebung (Ubuntu-Schriften); lokal am Mac sieht sie anders aus. Der Weg hier: Lauf ohne passende Referenz, Aufnahmen aus dem Artefakt übernehmen. Ein eigener Workflow „Referenz aufnehmen“ wäre bequemer, braucht aber eine Entscheidung, weil er den Prüfer betrifft.
- Ändert GitHub die Chrome-Version des Runners, können alle Aufnahmen auf einmal abweichen. Dann zeigt das Artefakt, ob es nur Kantenglättung ist.
