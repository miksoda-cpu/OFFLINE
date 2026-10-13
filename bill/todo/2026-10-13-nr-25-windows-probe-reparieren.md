# Auftrag: Nr. 25 · Windows-Probe wieder grün, ohne sie zu lockern

**Von:** Bill · **Datum:** 2026-10-13 · **Dringlichkeit:** hoch (vor allen anderen Aufträgen in todo)

## Ziel
Die Windows-Probe ist auf dem Hauptbranch wieder grün und prüft danach mindestens so viel wie vor dem 08.10.2026, dazu den Weg, den echte Nutzer heute gehen: von 0.8.0 auf die neue Version. Fertig ist es, wenn die Probe auf dem Hauptbranch grün ist und Nr. 22 danach zusammengeführt werden kann.

## Hintergrund
Rückmeldung Nr. 22 vom 12.10.: Der Update-Test installiert 0.1.8 und lässt sie gegen den öffentlichen Katalog laufen. Seit dem Katalog vom 08.10. 15:29 UTC verlangt at-basis `app_min` 0.8.0; 0.1.8 darf das Paket zu Recht nicht laden, der Test wartet vergeblich. Die Probe ist damit auf jedem Branch rot und blockiert jedes Zusammenführen, das die App berührt (Nr. 22, 23, 24, die vier Barrierefreiheits-Ausnahmen aus Nr. 21).

Das Verhalten der App ist richtig, der Prüfer hängt an einer Annahme, die nicht mehr gilt („der Live-Katalog passt zu jeder alten Version“). Bill entscheidet (Stufe Gelb, Begründung im Bericht an Mik): Der Prüfer wird repariert, nicht gelockert.

## Umfang
1. **Eingefrorener Katalog für die alte App.** Die alte App (0.1.8) läuft im Update-Test gegen einen festen, signierten Katalogstand, den sie laden darf (z. B. der letzte Stand vor dem 08.10. 15:29, als Datei im Repo unter `werkzeug/probe-katalog/` oder aus dem Bucket nach Prüfsumme). Sie füllt ihre Daten wie bisher. Die neue App darüber nutzt den aktuellen Katalog. Alle bisherigen Vergleiche (Häkchen, Bereit-Wert, Name, Fälle A und B) bleiben unverändert.
2. **Zweiter Update-Weg 0.8.0 → neu** (verschärft): dieselbe Probe zusätzlich mit 0.8.0 (Tag `v0.8.0`) als alter App, gegen den aktuellen Katalog. Das ist der Weg, den heutige Nutzer gehen.
3. **Hersteller-Feld prüfen:** Der Update-Test zeigt, ob das neue Feld `publisher` aus Nr. 22 (Registry-Pfad des NSIS-Installers) ein Update über eine bestehende Installation sauber erlaubt. Dafür Nr. 22 nach grüner Probe auf dem Hauptbranch einmal gegen die Probe laufen lassen und das Ergebnis in die Rückmeldung schreiben.
4. Kurzer Abschnitt in `werkzeug/README.md`: warum es einen eingefrorenen Katalog gibt und wann er erneuert wird.

Nicht dazu: Änderungen an der App, am öffentlichen Katalog oder an `app_min`.

## Abnahme
Kommandos (Exit-Code 0):
- neuer Test, der ohne die Änderung fehlschlägt: der eingefrorene Katalog ist gültig signiert und at-basis darin hat ein `app_min`, das 0.1.8 erfüllt
- `tests.yml` grün
- Windows-Probe grün auf dem Auftragsbranch und danach auf dem Hauptbranch (`gh workflow run windows-probe.yml --ref <branch>`)

Muss (JA/NEIN):
- [ ] Fälle A und B mit 0.1.8 grün, mit denselben Vergleichen wie im letzten grünen Lauf 37799895206
- [ ] neuer Weg 0.8.0 → neu grün
- [ ] Nr. 22 danach zusammengeführt (eigener Commit), Probe auch dafür grün, Ergebnis zum Feld `publisher` in der Rückmeldung

Darf nicht (JA/NEIN):
- [ ] keine Prüfung, kein Vergleich und kein Fall entfernt, keine Wartezeit verlängert, kein `continue-on-error`, kein Überspringen
- [ ] kein privater Schlüssel im Repo; der eingefrorene Katalog ist ein bereits veröffentlichter, signierter Stand
- [ ] keine Änderung an App-Code oder öffentlichem Katalog

Belege:
- Rückmeldung mit Commits und Links zu allen Probe-Läufen (rot vorher, grün nachher, Hauptbranch, Nr. 22)
- Erklärung in höchstens zehn Zeilen

Kandidaten: 1

## Offene Fragen
Code wählt, ob der eingefrorene Katalog im Repo oder per Prüfsumme aus dem Bucket kommt. Fragen nur, wenn die Reparatur nicht ohne Lockerung geht; dann nicht zusammenführen, sondern Ansatz ins Ideenbuch und Rückmeldung.
