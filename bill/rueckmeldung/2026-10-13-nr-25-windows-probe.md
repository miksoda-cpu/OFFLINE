# Rückmeldung: Nr. 25 · Windows-Probe wieder grün, ohne sie zu lockern

**Von:** Code (lokale Session, Mik) · **Datum:** 2026-10-13 · **Auftrag:** `bill/erledigt/2026-10-13-nr-25-windows-probe-reparieren.md`
**Commits:** `540885b`, `decddad`, `e3b1f6e`, `b35a58c` (Probe repariert), `ba19345` (Einträge unter den installierten Apps). Danach Nr. 22: `e240e57`, `44b76c0`, `f6c7136`.

## Ergebnis
Die Windows-Probe ist auf dem Hauptbranch grün und prüft mehr als vor dem 08.10. Nr. 22 ist zusammengeführt, mit grüner Probe auf genau dem Commit, der jetzt auf dem Hauptbranch steht.

| Lauf | Stand | Ergebnis |
|---|---|---|
| [38187853812](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38187853812) | vorher (Nr. 22, 12.10.) | rot: 0.1.8 bekommt kein Österreich-Paket |
| [38380247193](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38380247193) | Auftragsbranch, 1. Versuch | rot: Signatur der eingefrorenen Pakete unter Windows falsch (Zeilenenden) |
| [38384951349](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38384951349), [38388627760](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38388627760) | Auftragsbranch | rot: Hilfe-Blatt auf „Updates & Abo“ mit 0 Fragen (siehe Befund) |
| [38392011195](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38392011195) | Auftragsbranch | **grün**, 229 Prüfungen, keine gescheitert |
| [38395019644](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38395019644) | Hauptbranch `b35a58c` | rot: 0.1.8 startete im Fall B mit einer Fehlerseite der WebView, vor jeder Prüfung |
| [38398484336](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38398484336) | Hauptbranch `b35a58c`, unverändert erneut | **grün** |
| [38398659335](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38398659335) | mit Prüfung der installierten Apps | **grün** |
| [38398663299](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38398663299) | Nr. 22 auf dem Hauptbranch, `f6c7136` (heute Hauptbranch) | **grün** |

`tests.yml`: grün auf allen Ständen; zuletzt [38398659457](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38398659457) für `f6c7136`.

## Erklärung
1. **Eingefrorener Stand im Repo:** In `werkzeug/probe-katalog/` liegt der signierte Web-Katalog vom 08.10.2026, 03:39 UTC (Commit `db393f1`), dazu `at-basis` 2026.09.29.1 und `wir` 2026.10.04.4, Byte für Byte von damals. Nichts ist neu signiert.
   - Ein Hetzner-Katalog von vor 15:29 war nirgends mehr aufzutreiben. Der Speicher wird überschrieben, und die App hebt Kataloge nicht auf.
2. **0.1.8 gegen den eingefrorenen Katalog:** Die Probe liefert den Katalog lokal aus und trägt ihn in die `abo.json` von 0.1.8 ein. Die beiden Pakete spielt sie ein wie vom Stick.
   - **Warum vom Stick:** Die Adresse im Katalog (Web-Version) liefert die alten Ausgaben nicht mehr.
   - **Prüfung:** Der Kern prüft dabei Signatur und jede Datei.
   - Die neue App bekommt danach wieder den Live-Katalog.
3. **Fälle A und B:** dieselben Vergleiche wie im grünen Lauf 37799895206 (Häkchen, Bereit-Wert, Bestätigungen, Name, Einladung). Grün.
4. **Neu, Fälle D und E:** der Weg 0.8.0 (Tag `v0.8.0`) → neu, mit und ohne Namen, gegen den Live-Katalog. Grün.
5. **Neu, zusätzliche Prüfung:** Nach dem Update gibt es genau einen Eintrag „OFFLINE“ unter den installierten Apps (Fälle A und D).
6. **Test** `werkzeug/probe-katalog.test.mjs`: Der Katalog ist gültig signiert, `at-basis` darin erfüllt 0.1.8, jeder Paketordner gehört per Prüfsumme dazu. Ohne die Änderung fehlen die Dateien und der Test schlägt fehl.
7. **Dokumentation:** `werkzeug/README.md` erklärt, warum es den Stand gibt und wann er erneuert wird (wenn der Schlüssel `1504cefc5d5d7e11` wegfällt oder die alte App eine andere wird; der Ablauf am 06.01.2027 zwingt nicht dazu).

## Hersteller-Feld `publisher` (Nr. 22)
Der Update-Test mit Nr. 22 ([38398663299](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38398663299)) zeigt, dass das Update über eine bestehende Installation sauber bleibt, obwohl sich der Hersteller von „digioneer“ (Teil der Kennung) zu „digitalworld Academy OG“ ändert:
- **Ort:** Die neue Version landet am selben Ort, `AppData\Local\OFFLINE\offline-app.exe`.
- **Daten:** Alle Vergleiche bestehen, in allen vier Update-Fällen.
- **Installierte Apps:** Unter den installierten Apps bleibt genau ein Eintrag, `HKCU\…\Uninstall\OFFLINE`. Es gibt keinen verwaisten Eintrag der alten Version, ob von 0.1.8 oder von 0.8.0 aus.

## Was am Prüfer geändert ist, und warum das keine Lockerung ist
- **Keine Prüfung entfernt:** Kein Vergleich und kein Fall ist weg, keine Wartezeit verlängert, kein `continue-on-error`, nichts übersprungen. Dazu kamen die Fälle D und E und die Prüfung der installierten Apps.
- **Lumi-Buch:** Die Prüfung erwartete noch „x % lesbar“. Seit 0.7.1 (Miks Fehler 5) heißt es „noch nichts aufgeschlagen“ beziehungsweise „x % aufgeschlagen“; die Prüfung erwartet jetzt diesen Wortlaut, genauso streng.
- **„Updates & Abo“:** Das Hilfe-Blatt öffnet die Probe jetzt erst, wenn der Abo-Stand da ist und die Seite 1,5 Sekunden nicht neu gezeichnet wurde, innerhalb der bisherigen 15 Sekunden. Geprüft wird dasselbe: alle 11 Fragen, und „Zurück“ schließt.

## Befund an der App (nicht behoben, Nr. 25 verbietet App-Änderungen)
- **Was passiert:** Ein offenes Blatt („Info und Hilfe“) schließt sich von selbst, sobald die App die Seite im Hintergrund neu zeichnet. `render()` ruft `blattWeg()`.
- **Auslöser auf „Updates & Abo“:**
  - der Abo-Stand, der kurz nach dem Öffnen aus dem Kern kommt,
  - Tagespakete, die im Hintergrund ankommen.
- **Für Nutzer heißt das:** Wer die Hilfe gleich nach dem Öffnen der Seite aufmacht, sieht sie wieder verschwinden.
- **Vorschlag für einen eigenen Auftrag:** Neuzeichnen aus dem Hintergrund lässt ein offenes Blatt stehen. Im Ideenbuch eingetragen.

## Nebenbei
- **Fall B auf dem Hauptbranch (38395019644):** 0.1.8 zeigte einmal beim Start eine Fehlerseite der WebView, bevor irgendetwas geprüft wurde.
  - Der unveränderte zweite Lauf war grün.
  - Wiederholt sich das, braucht der Start der alten App eine eigene Untersuchung; die Probe kennt den Fall schon (Meldung „App geladen“ mit allen Zielen).
- **Nr. 22, Bildvergleich (Nr. 21):** Die gewollten Änderungen ließen alle 88 Referenzbilder abweichen: „Impressum“ im Prototyp-Banner und „Über · Impressum und Lizenzen“ auf Einstellungen.
  - Geprüft habe ich: Jede Abweichung liegt nur dort.
  - Die Referenzen sind von Hand aus dem CI-Lauf 38395066586 neu gesetzt (`f6c7136`).
- **Nr. 22 ist jetzt auf dem Hauptbranch:** Die Web-Version zeigt das Impressum seit dem Zusammenführen live (Vercel baut den Hauptbranch selbst, geprüft: `impressum.html` antwortet mit 200). Einen neuen App-Tag gibt es nicht.
