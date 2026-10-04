# Auftrag: Pause, Nachtrag nach 0.4.0

- Nr.: 2026-10-04-05
- Priorität: klein, nach `2026-10-04-preise-webseite`, gern zusammen als 0.4.1
- Quelle: Codes Rückmeldung zu 0.4.0, Entscheidungen Bill

## 1. Rückspiegel ohne Tageszählung
Der Satz „Im letzten Monat hattest du an X Tagen eine Pause …“ fällt weg. Er zählt Nutzung, und das ist genau die Kennzahl, die wir nach dem Prinzip „Milde Zugkraft“ nicht zeigen.
- Der Rückspiegel spricht nur über **Fortschritt**, also Pilz und Lumisch wie jetzt, später weitere Formen.
- Gibt es keinen Fortschritt, nennt er höchstens die **Lieblingsformen des Monats in Worten, ohne Zahl**, zum Beispiel: „Diesen Monat warst du am liebsten beim Pilz und beim Atemfenster.“
- Wenn es auch das nicht gibt, kommt keine Karte.
- Ein Test stellt sicher, dass kein Rückspiegel-Satz eine Anzahl von Tagen oder Besuchen nennt.

## 2. Lumisch nach Tag 21
Statt stehenzubleiben:
- **Ab Tag 22** kommt an zwei von drei Tagen ein **Wiederholungs-Happen**: ein schon gelerntes Wort, aus dem Kopf abrufen. Bevorzugt werden die Wörter, die zuletzt falsch waren.
- **An jedem dritten Tag** kommt **ein neues Wort** aus dem Wörterbuch, nach Gruppen geordnet (Welt, Essen, Haus, Tun …).
- Das Wörterbuch kommt als Daten ins Paket `pause`. Die Quelle ist `pause-quellen/OFFLINE-Lumisch-Woerterbuch.md`, 209 Wörter mit Gruppe und Beispiel.
- **Vorerst nur die 21 Wörter des Plans und die Wörter aus den Beispielsätzen.** Der Rest des Wörterbuchs folgt erst, wenn die Prüfung auf Ähnlichkeit mit echten Wörtern durch ist. Die macht eine eigene Session, nicht du.

## 3. Folie 2 im Paket `pause`
Die Skizze darf bleiben, bis die Bildschirmsteuerung am Mac wieder geht. Danach ersetzt du sie durch ein echtes Bildschirmfoto der Web-Version, bei 360 Pixel Breite, mit einem Happen auf dem Bildschirm.

## 4. Bestätigt
Die Bedingung `funktion` statt `offen` für wartende Formen ist richtig, das war ein Fehler in meinem Auftrag.

## Fertig, wenn
- Ein Test belegt, dass der Rückspiegel keine Zählung enthält.
- Lumisch läuft über Tag 21 hinaus, und ein Test deckt Tag 22 bis 40 ab.
- Die neue `pause`-Ausgabe ist signiert im Katalog, alle Tests und die Windows-Probe sind grün. Freigabe als 0.4.1 mit Eintrag in `web/neues.json` und Rückmeldung.
