# Auftrag: Der zarte Stil für die ganze App

- Nr.: 2026-10-04-08
- Priorität (von Mik): direkt nach dem Pause-Umbau als 0.4.3. Mik hat am 04.10. Ja gesagt.
- Vorbild: Artefakt „Pause neu gedacht“, Fassung 4, und Punkt 8 im Auftrag `2026-10-04-pause-umbau` (dort zuerst gebaut)

## Ziel
Die ganze App wirkt so leicht wie die neue Pause: leichte Schrift, Haarlinien statt Rahmen, viel Luft, je Bildschirm ein zarter Hauptknopf.

## Was genau
1. Die Stilwerte aus dem Pause-Umbau werden zur Grundlage von `web/styles.css`, nicht nur für Pause: Knöpfe, Karten, Abstände, Schriftgewichte, Haarlinien.
2. **Knöpfe in der ganzen App:**
   - Der Hauptknopf ist das zarte hellrote Feld. Nebenknöpfe sind Textlinks oder Haarlinien-Felder.
   - Das betrifft unter anderem Tagesrätsel (Prüfen, Hinweis, Lösung zeigen), Lumi-Knöpfe und Bewertung, Vorsorge (Bestätigen), Bibliothek und Module (Schieber bleiben, werden aber feiner), Einstellungen.
3. **Karten** weiß ohne Rand mit kaum sichtbarem Schatten. Gruppen werden durch Luft und Haarlinien getrennt. Keine dunklen Blöcke außer dem Nachtmodus.
4. **Schrift:** Überschriften leicht (300 bis 400), Text 400, nirgends schwerer als 600. Die Bereit-Zahl als große, leichte Ziffer.
5. **Notfall-Bereich bleibt deutlich.** Notrufnummern und der Notfall-Knopf dürfen kräftig bleiben. Zart heißt nicht schwer lesbar, wenn es darauf ankommt.
6. **Kontrast:** Alle Texte mindestens 4,5 : 1, auch die grauen Nebenlinks, in hell und dunkel.
7. **Skins:** Der Skin Flechte bekommt die gleichen Grundwerte, seine Farben bleiben.

## Fertig, wenn
- Es gibt Bildschirmfotos vorher und nachher von Heute, Übersicht, Vorsorge, Bibliothek, Notfall und Einstellungen, je einmal am Handy (360 Pixel) und einmal am Mac.
- Die Kontrastprüfung läuft als Test und ist grün.
- Alle Tests und die Windows-Probe sind grün. Dann Freigabe als 0.4.3 mit „Was ist neu“.

## Hinweise
- **Darfst du selbst entscheiden:** genaue Werte innerhalb der Vorgabe.
- **Frag vorher:** wenn eine Stelle durch den zarten Stil schlechter bedienbar würde, zum Beispiel im Kinder-Modus oder bei großer Schrift. Dann ein Bildschirmfoto, ich entscheide.
