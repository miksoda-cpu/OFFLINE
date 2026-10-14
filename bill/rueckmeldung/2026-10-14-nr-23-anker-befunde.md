# Rückmeldung: Nr. 23 · Befunde aus Miks Anker-Bewertung

**Von:** Code (Nachtlauf) · **Datum:** 2026-10-14 · **Auftrag:** `bill/erledigt/2026-10-11-nr-23-anker-befunde.md` · **Commit:** `90bd19e` (App), `03a1cc7` (Referenzbilder), Kandidaten `fd286be` (a), `00d4ca2` (b), `6541dbc` (c)

## Ergebnis
1. **Vorschau lesbar:** Im Vorschau-Fenster ist das Bild ein Knopf. Antippen zeigt es in voller Größe (ein Bildpunkt je Pixel), in beide Richtungen verschiebbar; noch einmal Antippen passt es wieder ein, Blättern setzt zurück. Darunter steht „Zum Vergrößern aufs Bild tippen.“ (14 px). Gilt für alle Pakete und Module mit Vorschau (`web/app.js`, `vorschauBildHtml`; `web/styles.css`).
2. **Alter als Empfehlung:** Die Frage „Bist du mindestens 18?“ und die gespeicherte Antwort sind weg. Pakete und Module mit `alter_ab` zeigen unter der Beschreibung „Empfohlen ab … Jahren“ und laden ohne Frage. `alter_ab` bleibt im Paketformat.
3. **Satz am Tagesende, drei Kandidaten** (nicht zusammengeführt, Mik wählt):
   - `tagesende-a`: „Genug für heute. Morgen geht es hier weiter.“
   - `tagesende-b`: „Schluss für heute. Was du im Ernstfall brauchst, liegt bereit.“
   - `tagesende-c`: „Für heute ist Ruhe. Der nächste Tag liegt schon im Vorrat.“
   Jeder gilt in beiden Lagen (alles erledigt oder Uhrzeit erreicht), weil der Satz in allen Lagen gleich ist. Jeder Branch ändert `web/tag.js` (`SCHLUSS`), die Hilfe zu „Mein Tag“ (`web/hilfe.js`) und den Kommentar in `web/app.js`.
4. **Bereit mit Farbcode:** Jede Zeile (Inhalte, Dinge, Menschen, Können) hat einen Punkt, eine farbige Zahl und einen schmalen Balken in der Farbe ihres Stands: unter einem Drittel rot (`--accent`), bis zwei Drittel gelb (`--warn`), darüber grün (`--ok`), in jeder Breite; für Vorleseprogramme zusätzlich in Worten („noch wenig“, „zur Hälfte“, „gut“). Rechnung: `quelleStand` in `web/bereit.js`.

## Abweichungen
- Punkt 1, Weg „Antippen zum Vergrößern“ statt Ausschnitt: Ein fester Ausschnitt hätte bei breiten Bildern (800 × 600) wieder nur einen Teil gezeigt. Die Kärtchen-Bilder in der Bibliothek (Titelbild, 16 : 9) sind unverändert; ihre Titelseiten sind Grafiken mit kleiner Schrift, kein Bildschirmfoto.
- Punkt 3, `web/meintag.test.mjs` auf den Kandidaten-Branches: Der Test vergleicht die Hilfe zu „Mein Tag“ Wort für Wort mit dem Auftrag vom 05.10. (Log, unveränderlich). Er bekommt dort genau eine Ersetzung „Das war dein Tag.“ → neuer erster Satz, sonst bleibt er Wort für Wort. Ohne das wäre der Auftrag (Hilfe mit ersetzen) nicht umsetzbar gewesen.
- Der Test zur Altersfrage in `web/startreife.test.mjs` prüft jetzt das Gegenteil (keine Frage, Empfehlung), wie im Auftrag vorgesehen.

## Nicht gemacht
- Zusammenführen des Tagesende-Satzes: wartet auf Miks Wahl. Für den Gewinner fehlt noch die Windows-Probe (die Kandidaten berühren die App); `tests.yml` ist auf allen drei grün.
- Der Tipp im Lumi-Paket `wir` („Um Punkt Schluss sagt die App: Das war dein Tag.“) bleibt, weil Lumi-Inhalte nicht verändert werden dürfen. Nach Miks Wahl passt er nicht mehr zum Satz.

## Geprüft
- `node --test web/*.test.mjs` grün; neuer Test `web/anker.test.mjs` (in `tests.yml`) schlägt ohne die Änderung fehl (gegen den Hauptbranch geprüft), ebenso der neue Tagesende-Test auf jedem Kandidaten.
- CI `tests.yml`: [roter Lauf auf `90bd19e`](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38490317639) – nur Bildvergleich, genau die acht Aufnahmen von Bereit und Bibliothek, wo sich etwas ändern sollte; Referenz aus dessen Artefakt gesetzt, dann [grün auf `03a1cc7`](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38491053594). Barrierefreiheit (axe-core) ohne neuen Befund.
- Windows-Probe: [Lauf 38491156702](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38491156702) – grün; danach per fast-forward auf den Hauptbranch (`03a1cc7`).
- Kandidaten `tests.yml`: [a](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38491162410), [b](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38491165436), [c](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38491167866) – alle drei grün.
- Darf nicht: keine Lumi-Inhalte verändert, kein anderer Test gelockert oder gelöscht, keine neue Netzwerkverbindung (kein neuer Netzaufruf im Diff; Bildvergleich und Aufnahmen sperren fremde Adressen).

Bilder in `bill/rueckmeldung/bilder/2026-10-14-nr-23/` (Web-App, Chromium, 360 px und 1280 px, hell und dunkel):
- Bereit: `vorher-bereit-*`, `nachher-bereit-*`
- Alter: `nachher-karte-lumi-philosophie-nach-laden-*` (geladen ohne Frage, „Empfohlen ab 18 Jahren“); vorher: `2026-10-08-version-0-7-2/vorschau-04-altersfrage-*`
- Vorschau: `vorher-vorschau-eingepasst-360-hell.jpg`, `nachher-vorschau-eingepasst-*`, `nachher-vorschau-gross-*` (Pause, Seite 2)
- Tagesende (Heute um 22:30): `vorher-heute-tagesende-360-*`, `kandidat-a-…`, `kandidat-b-…`, `kandidat-c-heute-tagesende-*`

## Warum das Ziel erfüllt ist
1. In voller Größe ist der Text im Bildschirmfoto so groß wie in der App selbst, auf 360 px lesbar (`nachher-vorschau-gross-360-*`).
2. Es gibt keine Ja/Nein-Hürde mehr, die niemand prüft; die Empfehlung steht sichtbar beim Paket.
3. Drei kurze Sätze ohne Floskel, die zur Lage am Abend passen (aufhören dürfen, vorbereitet sein, Vorrat für morgen), mit Bildern.
4. Bereit zeigt den Stand jeder Quelle in jeder Breite mit Farbe; Kontrast der Zahl ≥ 4,5 : 1, von Punkt und Balken ≥ 3 : 1, hell und dunkel (im Test gerechnet).

## Fragen an Bill
- Welcher Kandidat für den Tagesende-Satz (Mik)? Danach Windows-Probe auf dem Gewinner, Zusammenführen, und der Tipp im Paket `wir` braucht mit der nächsten Ausgabe den neuen Wortlaut.
