# Rückmeldung: Der zarte Stil für die ganze App – ausgeliefert mit 0.4.3

**Von:** Code (lokale Session) · **Datum:** 2026-10-04 · **Auftrag:** `bill/erledigt/2026-10-04-stil-zart-app.md` (Nr. 2026-10-04-08) · **Branch:** `stil-zart` · **Tag:** `v0.4.3`

## Ergebnis
- **App 0.4.3 ist ausgeliefert** (`app/latest.json`, 04.10.2026, 20:56 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux sind abrufbar (HTTP 200).
- **Web-Version 0.4.3 live** (geprüft): `APP_VERSION` 0.4.3, der zarte Stil steht in `styles.css`.
- **Katalog unverändert.** Flechte 2026.10.04 liegt nur in der lokalen Redaktionsablage und ist nicht veröffentlicht.

## Was sich geändert hat
Die Werte aus dem Pause-Umbau (`--z-*`, `--eis*` in `web/styles.css`) sind die Grundlage der ganzen App. Sie gelten unter `.of-app`, also in der App. Die Startseite `index.html` bleibt, wie sie ist (meine Entscheidung, der Auftrag nennt nur die App).

- **Knöpfe:**
  - Der Hauptknopf (`.btn-primary`) ist das zarte hellrote Feld mit roter Schrift, 12,5 px, Gewicht 500, ohne Schatten.
  - Jeder andere Knopf (`.btn`) ist ein Haarlinien-Feld mit dunkler Schrift.
  - Die Tippfläche ist überall 44 px hoch, auch bei 24 px Grundschrift (gemessen).
  - **Je Bildschirm ein Hauptknopf:** Ich habe alle Seiten gezählt. Drei Stellen hatten viele rote Knöpfe untereinander, sie sind jetzt Nebenknöpfe: „Bestätigen“ je Zeile in Übersicht › Menschen und Können, „Installieren“ je Paket in der Bibliothek, „Offline-Bereitschaft prüfen“ neben „Jetzt prüfen“.
  - **Tagesrätsel:** Prüfen, Hinweis und Lösung zeigen folgen von selbst. Hinweis und Lösung stehen jetzt mit einer Haarlinie links statt in einem Kasten.
  - **Lumi:** Knöpfe und Bewertung sind Haarlinien-Felder. Die Einladung ist ein Eisblau-Feld statt eines dunklen Blocks; nur die kleine Höhle mit den zwei Lichtern bleibt dunkel, sonst sähe man die Lichter nicht.
  - **Bibliothek und Module:** Filter und die Wahl „Wie oft?“ sind Haarlinien, das Gewählte hellrot. Die Schieber sind feiner (40 × 22 statt 52 × 30), die Tippfläche bleibt 44 px.
- **Karten:** weiß ohne Rand, kaum sichtbarer Schatten, Rundung 16. Die Bühne auf Heute ebenso. Fortschrittsbalken sind 4 px dünn.
- **Schrift:**
  - Überschriften in leichter Serif: h1 300, h2 und h3 400.
  - Fett ist höchstens 600.
  - Die Bereit-Zahl ist groß und leicht (Serif 300, 4,2 rem auf Heute).
  - Nirgends schwerer als 600, außer den Notrufnummern.
- **Notfall bleibt deutlich:**
  - Die Nummern sind rot, groß und 800 wie bisher.
  - Die Notfall-Karten behalten eine sichtbare Kante.
  - Ihre Überschriften stehen in der Grundschrift mit 600 statt in der leichten Serif.
- **Kontrast 4,5 : 1** hell und dunkel, als Test `web/stil.test.mjs` (läuft jetzt in der CI). Geprüft werden:
  - jede Textfarbe auf ihren Flächen (Grund, Karte, Eisblau, Hellrot, Grün, Gelb)
  - die Untertitel auf allen fünf Kachelfarben
  - die Lumi-Sorte
  - der Skin Flechte
  - Dazu prüft der Test die Schriftgewichte und die Knopfwerte. Ich habe ihn auch mit einem absichtlich zu schweren Wert laufen lassen: Er schlägt dann an.
- **Dabei korrigiert, weil unter 4,5 : 1:**
  - Kachel-Untertitel: 4,2 bis 4,5 : 1. Die Deckkraft steigt von 62 auf 74 %.
  - Lumi-Sorte („ALLTAG“, „APP“): Orange #d06a1f auf Weiß hatte 3,6 : 1. Jetzt ist es ein dunkleres Orange `--lumi-ton` #a3500f mit 5,8 : 1; im Dunkeln #f0a060.
- **Skin Flechte:** Er bekommt dieselben Grundwerte, seine Farben bleiben:
  - Die meisten zarten Werte erbt er schon über die App-Brücke.
  - Im Skin selbst: Hauptknopf zart in Moos, Nebenknöpfe mit Haarlinie, Karten ohne Rand, Titel 500 statt 700 (Alegreya liegt nur in 500 und 700 bei, leichter geht es ohne neue Schriftdatei nicht), Plaketten und Leiste 500.
  - Vier Farben lagen unter 4,5 : 1 und sind etwas dunkler (im Dunkeln heller):

    | Farbe | vorher | nachher |
    |---|---|---|
    | dritte Schriftfarbe, hell | #7A8779 (3,2 : 1) | #5D675C |
    | dritte Schriftfarbe, dunkel | #7E8B7D | #8A978A |
    | Mohn | #B8392A | #B13728 |
    | Hahnenfuß | #9A6A07 | #8B5F06 |
    | Ziegel | #A5532F | #9B4E2C |

  - Die Kit-Prüfung ist ohne Fehler.
  - Neu gebaut als `flechte 2026.10.04` in der lokalen Redaktionsablage, signiert mit dem Redaktionsschlüssel. **Nicht veröffentlicht**, wie bisher.
- **Große Schrift** (Frag vorher: Wird etwas schlechter bedienbar?):
  - Ich habe die App mit 24 statt 16 px Grundschrift durchgesehen. Durch den zarten Stil wird nichts schlechter bedienbar: Alle Knöpfe bleiben 44 px hoch, die Felder wachsen mit.
  - Einen Kinder-Modus gibt es noch nicht, also auch dort nichts.
  - Behoben, unabhängig vom Stil: Bei großer Schrift liefen die Kacheln der Übersicht und das Zeitfenster bei Updates über den Rand. Die Raster schrumpfen jetzt mit, das Zeitfenster bricht um.
  - Noch offen, schon vor 0.4.3 so: In Werkzeuge läuft die Radio-Zeile („MHz“) bei 24 px über, auf Notfall um 24 px außerhalb des Inhalts. Bei normaler Schrift ist alles in Ordnung (360 px, kein seitlicher Bildlauf).
- Text in der Bibliothek: Die eingebaute Pause-Karte sagte noch „beim Öffnen der App“, jetzt „mit eigenem Raum direkt unter ‚Heute‘“.

## Bilder vorher und nachher
**Mac:** Die Bildschirmsteuerung für die Test-App wurde heute abgelehnt. Deshalb stammen alle Bilder aus der Web-Version, die dieselben Dateien wie die Desktop-App nutzt: Handy 360 px und breit 1280 px (statt Mac).

Je Seite gibt es vier Bilder (360 vorher, 360 nachher, breit vorher, breit nachher):
- `bilder/2026-10-04-stil-zart-heute-…`
- `…-uebersicht-…`
- `…-vorsorge-…`
- `…-bibliothek-…`
- `…-notfall-…`
- `…-einstellungen-…` (Updates & Abo; eine eigene Seite „Einstellungen“ gibt es nicht)

Dabei fällt auf:
- Auf „Heute vorher“ steht noch die Pause-Karte, nachher nicht. Das liegt nicht am Stil: Die Einladung kommt nur einmal je Öffnen.
- Die Lumi-Meldung auf „Vorsorge vorher“ zeigt die alten, schweren Knöpfe, „Übersicht nachher“ die neuen.

## Geprüft
- **Tests:**
  - Web: 78 von 78. Neu ist `web/stil.test.mjs` mit fünf Tests: Kontrast hell und dunkel, Kacheln, Flechte, Schriftgewichte, Knöpfe.
  - Werkzeug und Kit: 33 von 33. Flechte ohne Fehler.
- **CI (Lauf `37232597406`):** Die Tests laufen grün unter Linux, macOS und Windows, dazu Kern und Modul-Sandbox.
- **Windows-Probe (`37232597475`, Commit = `v0.4.3`):** grün beim ersten Lauf, 48 von 48 Angriffe blockiert, „Raum Pause“ in Ordnung.
- **Release-Build `37233343102`:** alle vier Plattformen und das Veröffentlichen sind grün.
- **Im Browser:**
  - Sechs Seiten bei 360 und 1280 px, dazu Heute im Dunkeln.
  - Je Bildschirm höchstens ein Hauptknopf, gezählt auf 14 Seiten. Updates hat nur noch „Jetzt prüfen“, die Bibliothek nur noch dort, wo ein einzelnes Update ansteht.
  - Bei 24 px Grundschrift: alle Knöpfe 44 px hoch. Zum seitlichen Überlauf siehe oben.

## Vorrat
Der Vorrat reicht bis 31. Jänner 2027, 119 Tage ab heute. Die 45-Tage-Grenze wird am 17. Dezember erreicht.
