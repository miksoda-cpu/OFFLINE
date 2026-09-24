# OFFLINE – Gestaltung

Stand: 24. September 2026 · Entscheidung aus der Abstimmung mit der zweiten Sitzung

## Das Bild: die Stadt, die sich die Natur zurückholt

Das Leitmotiv sind überwucherte Städte. Es passt zum Namen und zur Sache, mit drei Einschränkungen:

1. **Hoffnung statt Untergang.** Graue Ruinen machen Angst, eine Vorsorge-App soll beruhigen. Das Bild ist die Stadt, die sich die Natur zurückholt, und die Menschen darin kommen gut zurecht: Morgenlicht, Efeu am Riesenrad, Gemüsebeete am Ring. Richtung Solarpunk, nicht Endzeit.
2. **Keine Anspielung auf Filme.** Die Stimmung dürfen wir aufgreifen, die Motive sind eigene und am besten aus Wien und den Bundesländern. Kein geschütztes Material, keine erkennbaren Szenen aus „Planet der Affen“ oder ähnlichem.
3. **Bilder für den Auftritt, Ruhe für die Bedienung.** Die Szenerie gehört auf den Startbildschirm, die Website und die Paketcover. Die Arbeitsflächen bleiben ruhig und kontrastreich. Wer im Blackout eine Anleitung sucht, braucht Lesbarkeit, keine Kulisse.

## Regeln für die Bedienfläche

- **Dunkler Modus in echtem Schwarz** (`#000`), spart am Handy mit OLED Akku. Flächen darüber in sehr dunklem Grau, Text hell, Kontrast mindestens 7:1 für Fließtext.
- **Heller Modus** warm und papierähnlich (bleibt wie im Prototyp).
- **Kein Bild hinter Text.** Bilder nur als Cover auf Karten und als Startbild, nie als Hintergrund einer Leseansicht.
- **Große Schrift, große Ziele.** Mindestens 16 px, Tastenflächen ab 44 px, weil die App auch mit kalten Fingern und im Halbdunkel bedient wird.
- **Regal statt Liste.** Pakete erscheinen als Karten mit Cover, Titel, Herausgeber, Lizenz, Größe, Preis (gratis, Pro, Kauf) und Prüfstatus. Der Herausgeber ist immer sichtbar.
- **Farben tragen Bedeutung:** Rot nur für Notruf und Gefahr, Grün für „bereit, offline verfügbar“, Bernstein für „Update verfügbar“ und „getaktete Verbindung“.

## Paketcover

Jedes Paket darf in `inhalt/cover.jpg` (3:2, höchstens 1600 px breit, unter 300 KB) ein Cover mitbringen. Fehlt es, zeigt die App ein Motiv je Paketart (`inhalt`, `zim`, `karte`, `modell`, `kurs`). Cover von Herausgebern unterliegen denselben Regeln wie die eigenen: eigene Motive, keine Ruinen, keine Filmzitate.

## Offen

- Bildquelle: eigene Generierung (Nano Banana über den Skill `bild-news`) oder Auftrag an eine Illustratorin. Motive: Riesenrad mit Efeu, Ringstraße mit Beeten, Donaukanal, ein Bergdorf mit Solardächern, je ein Motiv je Bundesland.
- Wort- und Bildmarke „OFFLINE“ (das Icon in `web/icon.svg` ist ein Platzhalter).
