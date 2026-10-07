# Auftrag: Spielpaket 1 (Tatham-Rätsel und 2048 in Pause)

- **Nr.:** 2026-10-07-14
- **Priorität:** als Nächstes, sobald Mik die Reihenfolge bestätigt (Vorschlag Bill: Pause-Ausbau, erledigt mit 0.6.4, dann Spielpaket 1, dann die Lumi-Seite). Starte erst, wenn Mik dir das Zitat gibt.
- **Grundlage:** `claude/OFFLINE-Spiele-Open-Source-Mesh.md`, Abschnitt „Entscheidung Bill (06.10.2026)“, im Projekt. Bill legt eine Kopie nach „OFFLINE - Home“, wenn du sie nicht lesen kannst.

## Was genau

1. **Modul `spiele-1`** (Art `modul`, Sandbox), Bereich `pause`.
   - Enthalten sind 6 bis 8 Rätsel aus Simon Tathams „Portable Puzzle Collection“ (Lizenz MIT) und 2048 von Gabriele Cirulli (Lizenz MIT).
   - Vorschlag für die Tatham-Auswahl:
     - Bridges
     - Net
     - Loopy
     - Light Up
     - Pattern
     - Solo (Sudoku)
     - Mines (Minesweeper)
     - Towers
   - Du entscheidest nach Größe und Bedienbarkeit am Handy.
   - Die Tatham-Rätsel kommen aus dem offiziellen Web-Build (Emscripten/WebAssembly).
2. **Tagesrätsel für alle gleich:** Ein Startwert aus Datum und Spiel. Alle Geräte bekommen am selben Tag dasselbe Rätsel, auch ohne Netz.
3. **In Pause:**
   - Jedes Spiel ist eine Happen-Form mit Stufen.
   - Bei Tatham sind die Stufen die eingebauten Schwierigkeiten (leicht bis schwer, wo es sie gibt), mit derselben Regel zum Nachstellen wie die anderen Formen.
   - Ab 14 startet jedes Spiel auf Stufe 2.
4. **Design:**
   - Der Rahmen gehört der App, die Farben kommen aus dem Skin.
   - Hintergrund und Farbpalette der Tatham-Rätsel geben wir vor, die Formen bleiben.
   - 2048 bekommt ein eigenes Stylesheet in unserem Stil.
   - Keine Töne, keine Effekte beim Gewinnen, das Wort „Training“ kommt nicht vor.
5. **Lizenzen:** Die Copyright-Hinweise beider Projekte stehen gesammelt im Bereich „Über“ und im Paket.
6. **Nicht dabei:**
   - Tetris und Pac-Man (geschützte Namen und Aussehen).
   - Ranking über das Mesh (kommt mit Mesh-Stufe 1).
   - Schach (kommt mit Mesh-Stufe 3).

## Zuerst eine Probe

Bevor du alles baust, lieferst du Bilder bei 360 px, hell und dunkel: ein Tatham-Rätsel und 2048. Die Bilder kommen nach „OFFLINE - Home/spiele-probe/“. Bill gibt frei, dann baust du weiter.

## Fertig, wenn

- Jedes Spiel lässt sich in Pause öffnen, spielen und beenden.
- Ein Test prüft: Am selben Datum gibt es auf zwei Geräten dasselbe Rätsel.
- Das Paket ist kleiner als 5 MB, sonst fragst du vorher.
- Alle Tests und die Windows-Probe sind grün.
- „Was ist neu“: „Neu in Pause: Rätsel zum Knobeln, von leicht bis schwer.“
