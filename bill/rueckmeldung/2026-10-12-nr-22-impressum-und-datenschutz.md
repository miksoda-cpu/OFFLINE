# Rückmeldung: Nr. 22 · Impressum und Datenschutz mit den Daten der OG (rot, nicht zusammengeführt)

**Von:** Code (Nachtlauf) · **Datum:** 2026-10-12 · **Auftrag:** `bill/todo/2026-10-11-nr-22-impressum-und-datenschutz.md` (bleibt in todo) · **Commit:** `963c015` (Code), Branch `nr-22-impressum`

## Ergebnis
Gebaut und mit `tests.yml` grün auf Branch `nr-22-impressum`, aber **nicht** auf den Hauptbranch geführt und nicht im Web: Die Windows-Probe ist rot, aus einem Grund außerhalb dieses Auftrags (siehe Geprüft).

- Neue Seite `web/impressum.html` im Stil von `datenschutz.html`: Herausgeber und Medieninhaber, Anschrift, FN 477728t, Handelsgericht Wien, UID ATU72706716, E-Mail und Telefon als Text. Kein Skript, kein Bild, keine fremde Adresse.
- Verlinkt aus `index.html` (Fußzeile), `datenschutz.html` (neben „Zurück“) und `app.html` (Prototyp-Leiste der Web-Version); im Service Worker gespeichert (`offline-v35`).
- `datenschutz.html`: „Verantwortlich“ vollständig ohne Platzhalter; neuer Abschnitt „Paket-Speicher der App“ mit Hetzner Online GmbH, Falkenstein, als Auftragsverarbeiter (nach der Rückmeldung vom 08.10.).
- App, „Über“ heißt jetzt „Über · Impressum und Lizenzen“ und zeigt dieselben Angaben als Text, auf Desktop, Store-Build und Web.
- `tauri.conf.json`: `publisher` „digitalworld Academy OG“, `copyright` „© 2026 digitalworld Academy OG“ (beide Felder gab es vorher nicht).

## Abweichungen
- In der App ist das Impressum kein Link auf `impressum.html`, sondern steht direkt unter „Über“: Ein Link würde das Hauptfenster der Desktop-App von `app.html` wegführen, ohne Weg zurück.

## Nicht gemacht
Sichtbar mit „wird ergänzt“ markiert, Mik muss liefern:
- Unternehmensgegenstand
- Mitgliedschaft bei der Wirtschaftskammer (Fachgruppe)
- Gewerbebehörde
- Offenlegung nach § 25 Mediengesetz: Gesellschafter und Blattlinie

Unverändert gelassen (außerhalb des Umfangs): Im Datenschutz bleibt bei Ghost und Vercel „Standorte und Anbieter werden ergänzt“, und die Kartenkacheln von basemap.at sind dort noch nicht genannt. Der Vertrag zur Auftragsverarbeitung mit Hetzner steht als „wird geschlossen“, weil er laut Startreife-Liste noch bei Mik liegt.

## Geprüft
- Neuer Test `web/impressum.test.mjs` (5 Tests), ohne die Änderung 5 von 5 rot; danach `node --test web/*.test.mjs` 188 von 188 grün.
- Tests: https://github.com/miksoda-cpu/OFFLINE/actions/runs/38187851711 (Code-Commit), davor https://github.com/miksoda-cpu/OFFLINE/actions/runs/38187705053
- Windows-Probe: **rot**, https://github.com/miksoda-cpu/OFFLINE/actions/runs/38187853812
  - Sandbox-Probe (49 von 49 blockiert), Spiele-Probe, Module und Wichteln in der neuen App: bestanden.
  - Rot ist der Update-Test: Die alte App 0.1.8 wartet drei Minuten vergeblich auf „Österreich-Paket installiert“ (Fälle A und B), danach fehlen beim Vergleich mit der neuen App Häkchen und Bereit-Wert.
  - Ursache: Der öffentliche Katalog (erstellt 08.10.2026 15:29 UTC) verlangt für at-basis 2026.10.08 `app_min` 0.8.0. Die alte App 0.1.8 darf das Paket nicht mehr laden. Der letzte grüne Lauf (37799895206) endete um 15:27, zwei Minuten vor diesem Katalog.
  - Damit wäre die Probe auf jedem Branch rot, auch auf dem Hauptbranch. Sie zu ändern (etwa die alte App gegen einen eingefrorenen Katalog laufen lassen) ist eine Änderung am Prüfer und gehört nicht in diesen Auftrag.
  - Nicht prüfbar, solange die Probe so scheitert: ob das neue Feld `publisher` das Update unter Windows ändert (Tauri trägt es im NSIS-Installer als Hersteller in den Registry-Pfad ein; bisher stand dort der Teil aus der Kennung, `digioneer`). Genau das prüft der Update-Test.
- Darf nicht: keine Privatanschrift (nur Firmenanschrift der OG), keine neue Verbindung, kein Fremdskript, keine Karte; kein Test gelockert oder gelöscht.
- Prüfliste aus dem Anker: lesbar bei 360 px (Angaben untereinander), kein Zustand betroffen, keine Hürde, keine Floskel.
- Bilder in `bill/rueckmeldung/bilder/2026-10-12-nr-22/`: Impressum, Datenschutz „Verantwortlich“, App „Über“, je 360 px und breit, hell und dunkel (Web-Version im Browser).

## Erklärung
Inhaltlich ist das Ziel auf dem Branch erfüllt, ausgeliefert ist es nicht: Bei „Verantwortlich“ und im Impressum steht kein Platzhalter mehr bei Herausgeber und Kontakt. Das Impressum ist von allen drei Webseiten verlinkt und in der App unter „Über“ zu lesen, mit denselben Angaben, was der Test vergleicht. Hetzner ist als Auftragsverarbeiter genannt. Was Bill nicht hatte, ist markiert statt erfunden.

## Fragen an Bill
- Die Windows-Probe braucht für die alte App einen Katalog, den 0.1.8 noch laden kann. Das ist eine Änderung am Prüfer und braucht Miks Freigabe; bis dahin kann kein Auftrag, der die App berührt, zusammengeführt werden.
- Soll der Datenschutz auch die Kartenkacheln (basemap.at) nennen? Das wäre ein eigener kleiner Auftrag.

## Gedächtnis (Faltung 12.10.)
Montag, also vor dem Auftrag gefaltet: Startlektüre 1.904 Wörter vorher, 1.824 nachher. Das README ist mit 1.355 Wörtern der größte Teil; die Faltung darf es nicht kürzen.
