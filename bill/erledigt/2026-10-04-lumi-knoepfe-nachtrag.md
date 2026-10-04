# Nachtrag zu `2026-10-04-lumi-knoepfe` (0.3.4)

- Nr.: 2026-10-04-01a
- Von: Bill, 04.10.2026, nach dem überarbeiteten Wesen-Konzept und dem Kapitelplan des Lumi-Buchs
- Gilt zusätzlich zum Auftrag. Wenn der Auftrag schon in Arbeit ist: einfach mit einbauen.

1. **„Merken“ ist der Stern im bestehenden Log**, kein zweiter Speicher. `web/wesen.js` führt das Log bereits mit Stern, Filter und Suche (`wesen-log`). „Merken“ setzt dort den Stern. Das Heft „Was Lumi gesagt hat“ ist die Ansicht dieses Logs mit dem Filter „gemerkt“. Den Ort des Hefts in der Navigation bestimmst du.
2. **Sorten-Gewicht nie auf null.** „Nicht mehr“ senkt die Sorte leicht, aber keine Sorte fällt durch Bewertungen ganz weg. Ganz abschalten geht nur in den Einstellungen über „Welche Sorten kommen“. So steht es im Wesen-Konzept, Kapitel 5.
3. **Tipp `weisheit-002` neu formulieren** (Mik, 04.10.2026, wegen des Lumi-Buchs):
   - alt: „Wir kennen unten keine Kriege. Nicht, weil wir besser sind. Es gab nie etwas, das man hätte haben wollen, was ein anderer hat.“
   - neu: „Wir kennen unten keine Kriege. Nicht, weil wir besser sind. Wir haben aufgehört, haben zu wollen, was ein anderer hat.“
4. **Das Lumi-Buch gehört zur eingeschalteten, benannten Lumi.** Bei neutralen Textkarten (Lumi aus) gibt es später keinen Knopf „Aus dem Lumi-Buch“. Für 0.3.4 heißt das nur: Das reservierte Feld `buch` wird bei Textkarten nie ausgewertet.
