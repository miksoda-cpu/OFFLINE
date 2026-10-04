# Auftrag: Pause bekommt einen eigenen Raum (Bedienung neu)

- Nr.: 2026-10-04-06
- Priorität (von Mik): hoch. Mik am 04.10. nach dem Test von 0.4.0: „Die Bedienung von Pause und Happen ist grottenschlecht.“
- Als 0.4.2, zusammen mit `2026-10-04-webseite-ehrlich`. (Der Pause-Nachtrag ist schon in 0.4.1 ausgeliefert. Den Fehler mit dem verdeckten Rahmen hat 0.4.1 behoben; mit dem Umbau gibt es den Rahmen über der Tagesseite ohnehin nicht mehr.)
- Bildvorlage: Artefakt „Pause neu gedacht“ (Bill). Der Inhalt steht unten vollständig, das Artefakt ist nur zum Anschauen.

## Befund aus 0.4.0 (Web-App bei 390 und 1280 Pixel Breite, Bill)
1. Pause steckt unter Übersicht in einer aufklappbaren Zeile und ist kaum zu finden.
2. Nach der Wahl des Alters klappt der Bereich zu, der Knopf „Pause einschalten“ verschwindet. Das ist ein Fehler.
3. Der Happen legt sich beim Öffnen als Fenster über die Tagesseite und verdeckt Bereit und Rätsel.
4. Um 14:30 kam „Der Tag rückwärts“ mit der Frage „Was war heute Abend?“.
5. „Weiter“ steht klein links, „Nicht jetzt“ groß und weiß rechts unten. Der Ausweg wirkt wichtiger als das Spiel.
6. Es gibt keinen Ort, an dem man die Spiele sieht und sich eines aussucht.

## Was genau
1. **Eigener Raum „Pause“** (Route `#pause`):
   - In der Seitenleiste direkt unter „Heute“. Am Handy kommt er in die untere Leiste, dafür wandert „Bibliothek“ unter „Mehr“.
   - Aufbau: oben der Vorschlag des Dirigenten als große Karte mit einem Knopf „Spielen“. Darunter alle gebauten Formen als Kacheln mit Dauer oder Stand (zum Beispiel „Tag 5 von 21“). Jede Kachel ist frei wählbar. Ganz unten „Deine Linie“ und die Einstellungen.
   - Wartende Formen erscheinen nicht.
2. **Einschalten in einem Schritt:**
   - Wer den Raum zum ersten Mal öffnet und Pause noch aus hat, sieht zwei Sätze, was Pause ist, und fünf große Knöpfe für das Alter.
   - Ein Tipp schaltet ein und startet sofort den ersten Happen. Bei „unter 14“ erscheint der Hinweis wie bisher.
   - Die Zeile unter Übersicht entfällt oder wird zu einem Link in den Raum.
3. **Kein Fenster mehr über der Tagesseite:**
   - Statt des Overlays steht beim Öffnen oben auf „Heute“ eine dunkle Pause-Karte: Name der Form, Dauer, „Spielen“, „Andere Pause“ (öffnet den Raum).
   - Sie ist wegwischbar und erscheint nach den bisherigen Regeln höchstens einmal je Öffnen, mit Appetit und 10-Minuten-Grenze.
4. **Happen als Fokus-Bildschirm:**
   - Ein Happen füllt den Inhaltsbereich (am Handy den ganzen Schirm).
   - Oben: ✕ zum Schließen, Fortschritt als Punkte, Name der Form. In der Mitte die Aufgabe. Unten genau ein Hauptknopf.
   - „Nicht jetzt“ als eigener großer Knopf entfällt, das ✕ übernimmt.
   - Nach dem Schließen geht es dorthin zurück, wo man herkam (Heute oder Raum).
5. **Ende:** Mitnehmen-Satz, die drei Bewertungsknöpfe nebeneinander, darunter „Noch einen“ (Hauptknopf) und „Zurück“. Die gelegentliche Schwierigkeitsfrage bleibt.
6. **Passt zur Uhrzeit:**
   - „Der Tag rückwärts“ erst ab 18 Uhr.
   - Das Atemfenster ist nicht der erste Vorschlag des Tages.
   - Die Zeitgrenzen kommen in `web/pause-werte.js`.
7. **Kurze Eingaben:**
   - Wo nichts gespeichert wird („Der Tag rückwärts“), gibt es kein Textfeld, sondern „Ich hab's“ als Knopf.
   - Wo eine Antwort geprüft wird, bleibt das Feld klein und einzeilig.

8. **Zart statt laut** (Mik, 04.10.: „Buttons filigraner“, „noch immer zu groß“, „müssen viel zarter werden, nicht nur kleiner“). Vorbild ist das Artefakt „Pause neu gedacht“, Fassung 4.
   - **Hauptknopf:** ein zartes Feld in hellem Rot (`--accent-soft`) mit roter Schrift, Schrift rund 12,5 Pixel in Gewicht 500, Innenabstand etwa 6 × 11 Pixel, Rundung 6 Pixel. Kein Rand, kein Schatten, kein Leuchten. Je Bildschirm genau einer.
   - **Nebenwege** („später“, „Zurück zu Heute“, „Deine Linie“) sind grauer Text mit einer haarfeinen Unterstreichung.
   - **Bewertung:** drei kleine Felder mit Haarlinie (1 Pixel, sehr helle Linienfarbe), dunkle Schrift, keine Füllung.
   - **Flächen:** keine dunklen Blöcke mehr. Die Pause-Karte und der Happen liegen auf einem Hauch Eisblau (Farben der Lumi aus dem Wesen-Konzept), normale Karten auf Weiß ohne Rand mit kaum sichtbarem Schatten.
   - **Trennung durch Haarlinien und Luft**, nicht durch Rahmen. Die Spiele im Raum stehen als Liste mit Haarlinien, nicht als Kachelkästen.
   - **Schrift leicht:** Überschriften in einer leichten Serif (Gewicht 300 bis 400), Text in 400, Hervorhebungen höchstens 500. Kein Fett über 600.
   - **Symbole als feine Linien** (✕ mit 1,2 Pixel Strich), Fortschritt als drei dünne Striche.
   - **Tippfläche** trotzdem mindestens 44 Pixel hoch, unsichtbar über Innenabstand.
   - Alle Werte als Variablen, damit die ganze App später mit einer Änderung folgen kann. Mik entscheidet das nach dem Bildschirmfoto.

## Fertig, wenn
- Ein neuer Nutzer findet Pause von Heute aus mit einem Tipp und hat nach zwei weiteren Tipps einen Happen vor sich.
- Auf der Tagesseite erscheint kein Fenster mehr, nur die Karte.
- Jede gebaute Form lässt sich im Raum wählen.
- Bei 360 Pixel Breite hat kein Happen einen seitlichen Bildlauf, und der Hauptknopf ist ohne Scrollen erreichbar.
- Rückmeldung mit Bildschirmfotos: Heute mit Karte, Raum, ein Happen in der Mitte, Ende. Je einmal am Handy (360 Pixel) und einmal am Mac in der Desktop-App, wenn die Bildschirmsteuerung geht.
- Alle Tests auf drei Systemen und die Windows-Probe grün, dann Freigabe als 0.4.2 mit „Was ist neu“.

## Hinweise
- **Darfst du selbst entscheiden:** genaue Abstände, Kachelgröße, Animation beim Öffnen des Fokus-Bildschirms (ruhig, mit `prefers-reduced-motion`).
- **Frag vorher:** wenn die untere Leiste am Handy durch Pause zu voll wird. Dann zwei Varianten als Bildschirmfoto, ich entscheide.
