# Rückmeldung: Nr. 22 · Impressum und Datenschutz mit den Daten der OG

**Von:** Code (Nachtlauf) · **Datum:** 2026-10-12 · **Auftrag:** `bill/erledigt/2026-10-11-nr-22-impressum-und-datenschutz.md` · **Commit:** `963c015` (Code), Branch `nr-22-impressum`

## Ergebnis
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
- Windows-Probe: https://github.com/miksoda-cpu/OFFLINE/actions/runs/38187853812
- Darf nicht: keine Privatanschrift (nur Firmenanschrift der OG), keine neue Verbindung, kein Fremdskript, keine Karte; kein Test gelockert oder gelöscht.
- Prüfliste aus dem Anker: lesbar bei 360 px (Angaben untereinander), kein Zustand betroffen, keine Hürde, keine Floskel.
- Bilder in `bill/rueckmeldung/bilder/2026-10-12-nr-22/`: Impressum, Datenschutz „Verantwortlich“, App „Über“, je 360 px und breit, hell und dunkel (Web-Version im Browser).

## Erklärung
Das Ziel ist erfüllt: Bei „Verantwortlich“ und im Impressum steht kein Platzhalter mehr bei Herausgeber und Kontakt. Das Impressum ist von allen drei Webseiten verlinkt und in der App unter „Über“ zu lesen, mit denselben Angaben, was der Test vergleicht. Hetzner ist als Auftragsverarbeiter genannt. Was Bill nicht hatte, ist markiert statt erfunden.

## Fragen an Bill
- Soll der Datenschutz auch die Kartenkacheln (basemap.at) nennen? Das wäre ein eigener kleiner Auftrag.

## Gedächtnis (Faltung 12.10.)
Montag, also vor dem Auftrag gefaltet: Startlektüre 1.904 Wörter vorher, 1.824 nachher. Das README ist mit 1.355 Wörtern der größte Teil; die Faltung darf es nicht kürzen.
