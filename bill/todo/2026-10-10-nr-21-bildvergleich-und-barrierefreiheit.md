# Auftrag: Nr. 21 · Bildvergleich und Barrierefreiheit als Prüfstufen

**Von:** Bill · **Datum:** 2026-10-10 · **Dringlichkeit:** normal

## Ziel
Zwei neue Prüfstufen in `tests.yml`: Ein Bildvergleich der Web-App gegen Referenzbilder, der feine Layout-Änderungen findet, und eine Barrierefreiheitsprüfung mit axe-core über die Hauptseiten. Fertig ist es, wenn beide bei jedem Push laufen, bei einer absichtlich eingebauten Abweichung fehlschlagen und auf dem heutigen Stand grün sind (oder mit einer begründeten Ausnahmeliste).

## Hintergrund
Festlegung vom 10.10.2026 in `bill/README.md` (Abnahme, Held-out, Ideenbuch, Kandidaten). Bildmodelle übersehen feine Layout-Änderungen; Bilder in Rückmeldungen beschreiben, entscheiden aber nicht. Der Kontrasttest (`web/stil.test.mjs`) prüft Farbwerte, nicht die gerenderte Seite. Diese beiden Stufen fehlen in der Prüferkette.

## Umfang
- Bildvergleich: Headless-Chrome wie in `werkzeug/sandbox-probe.mjs`, Seiten aus `web/app.html` (mindestens Heute, Bereit, Notfall, Vorsorge, Bibliothek, Pause, Einstellungen), je 360 px und 1280 px, hell und dunkel. Referenzbilder unter `werkzeug/referenz/`. Toleranz je Seite einstellbar, Standard sehr eng. Bei Abweichung ein Differenzbild als Artefakt des CI-Laufs.
- Referenz neu setzen nur mit einem eigenen Kommando (`--referenz-setzen`), nie automatisch im CI.
- Barrierefreiheit: axe-core in denselben Seiten, Regeln WCAG 2.1 AA. Befunde mit Stufe „serious“ und „critical“ lassen den Test fehlschlagen. Bestehende Befunde, die nicht sofort behebbar sind, kommen in eine Ausnahmeliste mit Grund je Eintrag.
- Nicht dazu: Desktop-App über tauri-driver, Handy, Behebung der gefundenen Befunde (nur auflisten, außer sie sind trivial).

## Dateien und Inhalte
Keine Inhalte. Gemeinfreie oder freie Werkzeuge: axe-core (MPL-2.0) als einzelne Datei mit Lizenz neben dem Werkzeug, analog zu Leaflet.

## Abnahme
Kommandos (Exit-Code 0, auf dem Auftragsbranch):
- `node werkzeug/bildvergleich.mjs --chrome` (Name frei, im README des Werkzeugs dokumentiert)
- `node werkzeug/barrierefrei.mjs --chrome`
- `tests.yml` grün mit beiden neuen Schritten
- Gegenprobe: ein Commit auf einem Wegwerf-Branch, der einen Abstand um 2 px ändert, lässt den Bildvergleich fehlschlagen; ein Bild ohne Alternativtext lässt die Barrierefreiheit fehlschlagen. Beide Läufe in der Rückmeldung verlinkt, der Wegwerf-Branch danach gelöscht

Muss (JA/NEIN):
- [ ] beide Stufen laufen bei jedem Push in `tests.yml`
- [ ] Differenzbild als CI-Artefakt bei Abweichung
- [ ] Ausnahmeliste mit Grund je Eintrag, leer ist besser

Darf nicht (JA/NEIN):
- [ ] kein bestehender Test gelockert oder gelöscht
- [ ] keine npm-Abhängigkeit im Werkzeug (`werkzeug/` bleibt ohne Abhängigkeiten)
- [ ] keine Änderung an der App, außer triviale Barrierefreiheits-Korrekturen mit eigenem Test
- [ ] Referenzbilder werden im CI nie überschrieben

Belege:
- Rückmeldung mit Commit und Links zu den CI-Läufen (grün und beide Gegenproben rot)
- Liste aller axe-Befunde mit Stufe und Seite
- Erklärung in höchstens zehn Zeilen, warum die Stufen das Ziel erfüllen

Kandidaten: 1

## Offene Fragen
Code entscheidet selbst über Dateinamen, Toleranzwerte und die Art, Bilder ohne Abhängigkeit zu vergleichen (etwa im Browser über Canvas). Fragen nur, wenn eine Abhängigkeit unvermeidbar scheint.
