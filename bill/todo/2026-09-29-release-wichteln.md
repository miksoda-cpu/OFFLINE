# Auftrag: Release 0.2.x mit Bereit v2 und Lumi, Wichteln in den öffentlichen Katalog

**Von:** Bill · **Datum:** 2026-09-29 · **Dringlichkeit:** normal

## Ziel
Die Desktop-App mit Paket-Kit, Bereit v2 und Lumi ist für alle veröffentlicht, das Paket `wir` mit 176 Tipps und Wichteln liegen im öffentlichen Katalog. Fertig, wenn eine bestehende Installation über den Updater auf die neue Version kommt, die Bereit-Zahl übernommen ist und Wichteln im Katalog erscheint.

## Freigaben von Mik
- Wichteln veröffentlichen: ja, jetzt, für die Adventzeit (Lagebild, Frage 18). Bedingung aus der Empfehlung: vorher ein Durchlauf unter Windows.
- Flechte: **nicht** veröffentlichen, bleibt lokal.

## Festlegung von Bill
Dein Vorschlag zur Bereit-Anzeige wird übernommen: Treffpunkt und Anlaufstelle verfallen nach 12 Monaten, Telefonnummern und Familiengruppe weiter nach 6. Bitte in `bereit.js`, Tests und `WESEN.md` nachziehen.

## Umfang
1. **Windows-Probe:** Die Sandbox-Probe und ein Durchlauf von Wichteln (laden, spielen, inaktiv, löschen) auf einem Windows-Runner in der CI mit WebView2 bzw. Edge. Wenn ein echter Durchlauf in der App dort nicht geht, mindestens die Sandbox-Probe gegen Edge, und in der Rückmeldung sagen, was ungeprüft bleibt. Schlägt etwas fehl: anhalten und melden.
2. **Version** hochzählen, CHANGELOG, Tag, Installer über den bestehenden Workflow bauen und signieren wie bisher.
3. **Update-Test:** Eine Installation 0.1.8 mit Daten (Checkliste, Bestätigungen, benanntes Wesen) auf die neue Version heben. Die Bereit-Zahl darf nicht fallen, ein benanntes Wesen bleibt an, alle anderen sehen die Lumi erst nach der Einladung.
4. **Paket `wir`** mit 176 Tipps bauen, signieren, hochladen.
5. **Wichteln** mit dem Redaktionsschlüssel signiert hochladen und in den Katalog nehmen.
6. **Korrektur Sirenen-Text:** `at-basis` mit dem korrigierten `sirenen.json` neu bauen und hochladen, `aenderungen` wie in deiner Rückmeldung vorgeschlagen.

**Nicht dabei:** Flechte, Handy.

## Prüfung
Rückmeldung mit: Windows-Ergebnis, Version und Tag, Update-Test (Zahlen vorher und nachher), Katalog-Einträge mit Prüfsummen.

## Offene Fragen
Wenn die Windows-Probe etwas findet, keine Veröffentlichung, erst melden.
