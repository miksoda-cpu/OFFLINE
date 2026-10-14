# Auftrag: Nr. 26 · Hilfe-Blatt bleibt offen, vier Barrierefreiheits-Mängel behoben

**Von:** Bill · **Datum:** 2026-10-14 · **Dringlichkeit:** normal

## Ziel
Ein geöffnetes Hilfe-Blatt schließt sich nicht mehr von selbst, wenn die App im Hintergrund neu zeichnet. Die vier Ausnahmen in `werkzeug/barrierefrei-ausnahmen.json` sind behoben und aus der Liste entfernt. Fertig ist es, wenn die Ausnahmeliste leer ist und die Windows-Probe das Hilfe-Blatt ohne Wartetrick öffnen kann.

## Hintergrund
- Ideenbuch-Eintrag aus Nr. 25 (13.10.): Neuzeichnen von „Updates & Abo“ (Abo-Stand, Tagespakete im Hintergrund) schließt ein offenes Blatt. Die Probe wartet deshalb 1,5 s Ruhe ab.
- Rückmeldung Nr. 21: `aria-progressbar-name` (alle Fortschrittsbalken), `color-contrast` und `link-in-text-block` (Leaflet-Quellenzeile, Karte, dunkel), `scrollable-region-focusable` (Hilfe-Blatt).

## Umfang
1. Offenes Blatt (Hilfe und jedes andere `blatt`) übersteht ein Neuzeichnen der Seite darunter: offen, gleiche Scrollposition, Fokus bleibt im Blatt.
2. Jeder Fortschrittsbalken bekommt einen Namen, der sagt, wovon er den Stand zeigt (z. B. „Grundvorsorge: 12 von 74“).
3. Leaflet-Quellenzeile: Kontrast mindestens 4,5 : 1 hell und dunkel, Links unterstrichen.
4. Scrollbarer Inhalt des Hilfe-Blatts mit der Tastatur erreichbar (`tabindex="0"` oder gleichwertig).
5. Die vier Einträge aus `werkzeug/barrierefrei-ausnahmen.json` entfernen. Den Wartetrick in `werkzeug/app-probe.mjs` (1,5 s Ruhe) entfernen, sobald 1. wirkt.

## Abnahme
Kommandos:
- neuer Test, der ohne die Änderung fehlschlägt: Blatt öffnen, Neuzeichnen auslösen, Blatt ist noch offen
- `tests.yml` grün mit leerer Ausnahmeliste
- Windows-Probe grün ohne den 1,5-s-Wartetrick

Muss (JA/NEIN):
- [ ] Ausnahmeliste leer
- [ ] Blatt bleibt offen bei Neuzeichnen (Test)
- [ ] Referenzbilder nur dort neu gesetzt, wo sich sichtbar etwas ändert, mit Begründung je Seite

Darf nicht (JA/NEIN):
- [ ] kein bestehender Test gelockert oder gelöscht
- [ ] keine neue Netzwerkverbindung
- [ ] keine Lumi-Inhalte verändert

Belege: Rückmeldung mit Commits, CI-Links, Bildern der Karte (Quellenzeile) und des Hilfe-Blatts, 360 px und breit, hell und dunkel.

Kandidaten: 1
