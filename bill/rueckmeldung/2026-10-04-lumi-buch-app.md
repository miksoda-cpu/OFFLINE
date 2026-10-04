# Rückmeldung: Das Lumi-Buch in der App – ausgeliefert mit 0.5.0

**Von:** Code (lokale Session) · **Datum:** 2026-10-04 · **Auftrag:** `bill/erledigt/2026-10-04-lumi-buch-app.md` (Nr. 2026-10-04-07) · **Branch:** `lumi-buch` · **Tag:** `v0.5.0`

## Ergebnis
__ERGEBNIS__

## Was gebaut ist
1. **Paket `lumi-buch`** (Art `inhalt`, `app_min` 0.5.0):
   - Band 1 mit zwölf Kapiteln und 127 Absätzen `b1-KK-PP` liegt ganz auf dem Gerät.
   - Die Titelseite trägt „Eine erfundene Geschichte. Die Quantenwelt in den Kapiteln 9 bis 12 ist ein Bild, keine Physik.“ (aus dem Vorspann der Vorlage).
   - Gebaut aus der Vorlage mit `pakete/lumi-buch/buch-umwandeln.mjs`. Die Zeilen `Tipps: …` sind Redaktion und fallen weg.
   - Format: `paket-kit/buch-format.mjs`, beschrieben in `PAKET-KIT.md` 5e.
   - Band 2 kann als eigenes Paket mit `band: 2` folgen; die Nummern tragen den Band schon (`b2-…`).
   - Die App holt das Paket bei der Erstinstallation und bei bestehenden Nutzern still nach.
2. **Feld `buch` im Paket `wir`:** bei allen 175 Tipps aus deiner Zuordnung, sonst ist `tipps.json` unverändert. Es ist eine neue `wir`-Ausgabe.
3. **„Aus dem Lumi-Buch“:**
   - Ein zarter Textlink neben dem Sortenknopf unter jedem Satz der eingeschalteten, benannten Lumi (Sprechblase und Meldung).
   - Er öffnet den Absatz in einer ruhigen Leseansicht: Serif, viel Rand, oben ✕ und „Das Lumi-Buch · Kapitel 1: Der Fluss“, unten „Zurück“.
   - Erst das Öffnen schaltet frei. Das Anzeigen des Tipps allein schaltet nichts frei (Test).
   - Bei Textkarten gibt es den Link nicht. Bei „Tipps aus“ gibt es ihn nicht, und auch ein früher geöffneter Link schaltet dann nichts mehr frei.
   - Am schmalen Handy steht der Link unter „Mach ich“, weil die Sprechblase dort nur gut 200 px breit ist.
4. **Das Buch** (`#buch`):
   - Erreichbar über die Übersicht (Zeile „Das Lumi-Buch · Band 1 · 25 % lesbar“ unter den Lumi-Einstellungen) und über die Bibliothek („Lesen“ an der Paketkarte).
   - Oben „Band 1 · N % lesbar“ ohne Balken, abgerundet, damit 100 % erst dasteht, wenn alles lesbar ist.
   - Die Kapitel stehen in Reihenfolge. Fehlende Absätze sind eine stille Lücke mit Haarlinie: „Dieses Stück hat dir deine Lumi noch nicht erzählt.“
   - Meine Entscheidung: Mehrere fehlende Absätze hintereinander sind eine Lücke, sonst stünde der Satz am Anfang über 100-mal untereinander.
   - Vorlesen geht wie beim Roman der Woche: Kapitelname, dann die lesbaren Absätze, die Lücken werden übersprungen.
   - Ist noch nichts lesbar, steht ein Satz, wo der Link zu finden ist. Es gibt keine Liste fehlender Tipps und keinen Hinweis aufs schnellere Freischalten (Test gegen „nur noch“, „schneller“, Serien und Zählungen).
5. **Bestehende Nutzer:**
   - Was schon im Log steht, gilt nicht als gelesen.
   - Jeder Logeintrag (Übersicht › „Alles, was … gesagt hat“) hat denselben Link. Damit lässt sich nachlesen; auch das schaltet erst beim Öffnen frei.
6. **Stil:** zart nach 0.4.3. Leseansicht und Buch in der Serif, nur ✕ und „Zurück“ bzw. „Vorlesen“ und „Zurück“ als Textlinks.

## Prüfungen, die du verlangt hast
- **Test `web/buch.test.mjs`** (in der CI):
  - Alle 175 Tipps zeigen auf einen vorhandenen Absatz, und jeder der 127 Absätze hat mindestens einen Tipp.
  - Jeder Tipp trägt genau die Nummer aus deiner Zuordnung.
  - Dazu Freischalten, Prozent, Lücken, Vorlesen, die Regeln für den Link und kein Druck.
- **Kit:**
  - `pruefen.mjs` kennt `inhalt/buch.json` (Format, Reihenfolge, Titelseite, `app_min`).
  - Beim Paket `wir` prüft es, dass jede `buch`-Nummer im Buch daneben existiert; beim Buch, dass jeder Absatz einen Tipp hat.
  - `lumi-buch`: keine Fehler.
  - `wir` zeigt dieselben sechs Fehler wie vorher (Quellen-IDs, `braucht_netz`, `abnahme`, LIESMICH, Vorschau). Sie betreffen die Paketbeschreibung, nicht die Tipps.
- **Abgleich der Dateien:** Zuordnung (175), Buch (127 Absätze, 12 Kapitel) und die Zeilen `Tipps: …` im Buch stimmen überein, es gibt keinen Widerspruch.
  - `tipps-2026-10-04.json` weicht bei zwei Tipps vom Paket ab: `app-011` (dort noch „unter ‚Wissen‘“) und `weisheit-002` (dort die Fassung vor Miks Änderung).
  - Maßgeblich ist das Paket. Beide Tipps zeigen auf denselben Absatz, die Zuordnung ist davon nicht betroffen.

## Text
- **Tippfehler:** Ich habe keine gefunden und nichts geändert.
  - Geprüft habe ich doppelte Wörter, Leerzeichen und Anführungszeichen.
  - Zwei Fundstellen sind richtiges Deutsch: „der der Menschen“ in b1-05-06 und „wenn sie sie nie gebraucht hat“ in b1-08-08.
- **Inhaltlich gemeldet, nicht geändert:**
  - b1-12-06: „Die Tagesseite ist immer der Anfang. Wenn man weiter will, wischt man nach links, und dann kommt das Wissen.“
  - Eine Wischgeste gibt es in der App nicht. „Das Wissen“ ist die Bibliothek bzw. die Übersicht, erreichbar über die Leiste.
  - Vorschlag zur Entscheidung: „… tippt man auf die Bibliothek, und dann kommt das Wissen.“

## Bilder (Web bei 360 px)
- `bilder/2026-10-04-lumi-buch-1-satz-mit-link-360.jpg`: Satz der Lumi „Dein Wasser ist neun Monate alt …“ mit „Mach ich“ und „Aus dem Lumi-Buch“.
- `bilder/2026-10-04-lumi-buch-2-leseansicht-360.jpg`: Leseansicht b1-01-03 „Das Wasser im Fluss war nie alt …“.
- `bilder/2026-10-04-lumi-buch-3-buch-titel-360.jpg`: Titelseite mit „Band 1 · 25 % lesbar“ und dem Hinweis.
- `bilder/2026-10-04-lumi-buch-4-buch-mit-luecke-360.jpg`: Buch mit Lücke zwischen zwei lesbaren Absätzen.

Folie 2 der Paket-Vorschau ist das Bild der Leseansicht. Die Mac-Bilder fehlen, weil die Bildschirmsteuerung abgelehnt wurde (siehe Rückmeldung 0.4.2).

## Geprüft
__GEPRUEFT__

## Vorrat
Der Vorrat reicht bis 31. Jänner 2027, 119 Tage ab heute. Die 45-Tage-Grenze wird am 17. Dezember erreicht.
