# Rückmeldung: Nr. 26 · Hilfe-Blatt bleibt offen, vier Barrierefreiheits-Mängel behoben

**Von:** Code (Nachtlauf) · **Datum:** 2026-10-15 · **Auftrag:** `bill/erledigt/2026-10-14-nr-26-hilfe-blatt-und-barrierefreiheit.md` · **Branch:** `nr-26-blatt-barrierefrei`
**Commits:** `db9c186` (Arbeit), `6cd9cdc` (Referenzbilder der Karte, Bilder)

## Ergebnis
| Prüfung | Lauf | Ergebnis |
|---|---|---|
| `tests.yml` | [38660569060](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38660569060) | grün, mit leerer Ausnahmeliste und dem neuen Test „Blatt bleibt beim Neuzeichnen offen“ |
| `tests.yml`, erster Lauf | [38660119856](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38660119856) | neuer Test und Barrierefreiheit grün; Bildvergleich rot nur bei `karte` (gewollt, siehe unten) |
| Windows-Probe ohne 1,5-s-Wartetrick | [38660149026](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38660149026) (`db9c186`), [38660613112](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38660613112) (`6cd9cdc`) | grün |

Lokal: 198 Web-Tests und 54 Werkzeug-Tests grün; axe-core ohne Ausnahmen: 0 Befunde (22 Seiten × 2 Breiten × 2 Farben).

Abnahme: Ausnahmeliste leer – JA. Blatt bleibt offen bei Neuzeichnen (Test) – JA. Referenzbilder nur, wo sich sichtbar etwas ändert – JA (nur `karte`). Kein Test gelockert oder gelöscht – JA. Keine neue Netzwerkverbindung – JA. Keine Lumi-Inhalte verändert – JA.

## Erklärung
1. **Blatt bleibt offen.** `render()` in `web/app.js` schloss jedes Blatt bei jedem Neuzeichnen. Jetzt nur, wenn die Seite wechselt (`render.seite !== location.hash`). Das Blatt hängt am `body`, nicht in `#main`, deshalb bleiben Bildlauf und Fokus beim Neuzeichnen unberührt.
2. **Test, der ohne die Änderung fehlschlägt:** `werkzeug/blatt.test.mjs` öffnet das Hilfe-Blatt auf Vorsorge, scrollt 120 px, setzt den Fokus hinein, löst das Neuzeichnen aus und verlangt danach offen, gleiche Stelle, Fokus im Blatt. Ohne die Änderung: `offen: false`. Zweiter Fall: ein Seitenwechsel schließt das Blatt weiterhin. Läuft in `tests.yml` im Job „Bildvergleich und Barrierefreiheit“.
3. **Fortschrittsbalken mit Namen:** neue Funktion `fortschrittsbalken()` in `web/szenarien.js`, Name nach dem Muster „<Bereich>: 3 von 12 erledigt“, „<Szenario>: 2 von 6 vorbereitet“, „Bereit: 40 von 100“. Auch die Balken in `app.js` ohne Rolle (Bereit, Vorsorge-Kopf, Speicher, Downloads, App-Update) haben jetzt Rolle und Namen. Die Breite bleibt gleich.
4. **Quellenzeile der Karte:** eigene Fläche in `--surface`, Text in `--text`, Links unterstrichen (`web/styles.css`). Das ändert die Karte sichtbar, deshalb dort neue Referenzbilder aus Lauf 38660119856; das Differenzbild zeigt nur die Quellenzeile.
5. **Hilfe-Blatt per Tastatur:** `tabindex="0"` am scrollbaren Inhalt (`web/blatt.js`). Mit Tastatur fokussiert zeigt er einen Fokusrahmen.
6. **Probe:** Der 1,5-s-Wartetrick in `werkzeug/app-probe.mjs` ist entfernt, die Windows-Probe öffnet das Hilfe-Blatt auf „Updates & Abo“ direkt.

## Bilder
`bill/rueckmeldung/bilder/2026-10-15-nr-26/`: `hilfe-blatt-{360,1280}-{hell,dunkel}.jpg` (Vorsorge, Blatt nach einem Neuzeichnen, Fokus im Inhalt; lokal mit Chromium aufgenommen) und `karte-{360,1280}-{hell,dunkel}.jpg` (Quellenzeile unten; aus dem CI-Lauf).

## Abweichungen
Keine im Umfang. Zusätzlich zu den Balken mit `role="progressbar"` bekamen die Balken in `app.js` ohne Rolle eine, weil der Auftrag „jeder Fortschrittsbalken“ sagt.

## Nicht gemacht
Die MapLibre-Quellenzeile der Desktop-Karte ist nicht angefasst; axe prüft nur die Web-Version.

## Fragen an Bill
Keine.
