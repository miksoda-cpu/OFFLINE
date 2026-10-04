# Auftrag: Das Lumi-Buch in der App

- Nr.: 2026-10-04-07
- Priorität (von Mik): nach 0.4.2 (Pause-Umbau) und 0.4.3 (zarter Stil), als 0.5.0
- Quelle: Entscheidung Mik 04.10.2026. Band 1 ist geschrieben und von Mik gelesen und freigegeben.
- Dateien im Ordner `lumi-buch/`:
  - `OFFLINE-Lumi-Buch-Band1.md` (12 Kapitel, 127 Absätze)
  - `OFFLINE-Lumi-Buch-Zuordnung.json` (175 Tipps, je einer Absatznummer zugeordnet; gegen `tipps.json` geprüft, vollständig)
  - `OFFLINE-Lumi-Buch-Zuordnung.md`

## Ziel
Nach jedem Satz der Lumi kann man auf Wunsch den passenden Absatz aus „Das Lumi-Buch, Band 1“ lesen. Ein gelesener Absatz ist ab dann im Buch freigeschaltet. Das Buch lässt sich jederzeit öffnen, zeigt aber nur die freigeschalteten Absätze, mit Lücken und dem Anteil in Prozent.

## Was genau
1. **Paket `lumi-buch`** (Art `inhalt`):
   - Das ganze Buch liegt von Anfang an auf dem Gerät, freigeschaltet wird lokal.
   - Absätze mit Nummer `b1-KK-PP`, Kapiteltitel, Titelseite.
   - Auf der Titelseite steht der Hinweis „Eine erfundene Geschichte“ (Anwaltsfrage 35 ist offen, bis dahin so).
   - Band 2 soll später als eigenes Paket dazukommen können.
2. **Feld `buch` im Paket `wir`:** aus der Zuordnung füllen, neue `wir`-Ausgabe. Mehrere Tipps können auf denselben Absatz zeigen.
3. **Knopf „Aus dem Lumi-Buch“:**
   - Unter jedem Satz der eingeschalteten, benannten Lumi, als zarter Textlink neben dem Sortenknopf.
   - Er öffnet den Absatz in einer ruhigen Leseansicht mit Kapitelname.
   - Erst das Öffnen schaltet den Absatz frei. Das bloße Anzeigen des Tipps reicht nicht.
   - Bei Textkarten (Lumi aus) gibt es den Knopf nicht. Bei „Tipps aus“ wächst das Buch nicht.
4. **Das Buch als Bereich:**
   - Erreichbar über die Lumi-Einstellungen und die Bibliothek.
   - Oben „Band 1 · 23 % lesbar“, ohne Balken, der nach Wettbewerb aussieht.
   - Kapitel in der richtigen Reihenfolge. Fehlende Absätze stehen als stille Lücke mit dem Satz „Dieses Stück hat dir deine Lumi noch nicht erzählt.“
   - Keine Liste, welche Tipps fehlen, und kein Hinweis darauf, wie man schneller freischaltet.
   - Vorlesen geht wie beim Roman der Woche.
5. **Bestehende Nutzer:** Absätze zu Tipps, die schon im Log stehen, gelten noch nicht als gelesen. Wer will, kann sie über das Log nachholen: Jeder Logeintrag bekommt den gleichen Link „Aus dem Lumi-Buch“.
6. **Stil:** zart, nach der Vorgabe aus 0.4.3 (Leseansicht mit Serifenschrift, viel Rand, keine Knöpfe außer ✕ und „Zurück“).

## Fertig, wenn
- Ein Satz der Lumi führt mit einem Tipp zu seinem Absatz, und dieser erscheint danach im Buch.
- Das Buch zeigt Prozent und Lücken richtig. Ein Test prüft, dass alle 175 Tipps auf einen vorhandenen Absatz zeigen und jeder Absatz mindestens einen Tipp hat.
- `pruefen.mjs` kennt das Paket `lumi-buch` und prüft, dass jede `buch`-Nummer im Buch existiert.
- Bei 360 Pixel Breite ist alles gut lesbar, Vorlesen funktioniert.
- Alle Tests auf drei Systemen und die Windows-Probe sind grün. Dann Freigabe als 0.5.0 mit „Was ist neu“ und Rückmeldung mit Bildschirmfotos (Satz mit Link, Leseansicht, Buch mit Lücken).

## Hinweise
- **Der Text ist fertig.** Kleine Tippfehler darfst du korrigieren und listest sie in der Rückmeldung. Inhaltlich änderst du nichts, sondern meldest es.
- **Prinzip „Milde Zugkraft“:** Das Buch lockt durch Neugier, nicht durch Druck. Keine Zählung von Tagen, keine Hinweise wie „nur noch 3 Absätze“.
