# Auftrag: Pause-Inhalte und Kleinigkeiten aus 0.7.0

- **Nr.:** 2026-10-07-17 (im Original 16; die 16 ist schon Teil B)
- **Version:** 0.7.1
- **Beilage:** `OFFLINE - Home/pause-inhalte/` (die Inhalte der Pause-Session, geprüft am 07.10., dazu das korrigierte Lumisch-Wörterbuch)
- Starte erst, wenn Mik dir das Zitat gibt.

## 1. Neue Inhalte für Pause

| Datei | Was | In der App |
|---|---|---|
| `OFFLINE-Pause-Fehler-Geschichten.json` | 60 Geschichten, 12 je Stufe | ersetzt die 15 alten, „Der eingebaute Fehler“ bekommt 5 Stufen |
| `OFFLINE-Pause-Lumisch-Aufgaben.json` | 100 Aufgaben, 20 je Stufe | ins Paket `lumisch`, Bauart des bestehenden Lumisch-Quiz, 5 Stufen |
| `OFFLINE-Pause-Ruhe-Varianten.json` | je 30 Varianten „Der Tag rückwärts“ und „Atemfenster“ | statt des festen Texts, ohne Wiederholung einen Monat lang |
| `OFFLINE-Pause-Neue-Formen.json` | drei neue Formen: Kaffeehaus-Logik, Kopfnuss, Ein Gedanke am Fluss, je 25 Aufgaben | auf bestehenden Bauarten (Auswahl, Zahleneingabe, Text ohne Wertung) |

- **Fünf Stufen je Form** mit den Wörtern leicht, gemütlich, mit Biss, knifflig, Knackpunkt. Die Abbildung der bestehenden Stufen steht in `OFFLINE-Pause-Stufen.md`, Abschnitt 8.2.
- **Erwachsene (ab 14) starten auf Stufe 3 von 5.** Pilz auf 5 von 10.
- **Höherstellen nur als Einladung,** nach `OFFLINE-Pause-Stufen.md`, Abschnitt 3: ein Satz, drei Knöpfe, höchstens einmal am Tag, von 4 auf 5 nur mit Ja. Das ersetzt das stille Hochstellen über 85 Prozent. Abstieg leise, Untergrenze Stufe 2.
- **Das Feld `intern.trainiert`** wird nie angezeigt.

## 2. Lumi aus

Ist die Lumi aus, gilt:

- Aufgaben und Geschichten mit `nur_mit_lumi: true` werden nicht gezogen. Die Form Lumisch fällt ganz weg.
- `lumisch_nur_mit_lumi: true`: Lumisch-Satz und Übersetzung entfallen.
- `ohne_lumi` und `ende_ohne_lumi`: Dieser Text ersetzt den normalen.
- Ein Test prüft, dass bei ausgeschalteter Lumi kein Lumisch und kein „Lumi“ in Pause erscheint.

## 3. Keine Zahlen über Leistung

- **Zeitgefühl:** keine Abweichung in Minuten. Die echte Uhrzeit und ein Wort: „fast auf den Punkt“, „ein Stück zu früh“, „ein Stück zu spät“.
- **Mitnehmen:** Wo eine Leistungszahl steht („drei von drei Pilzen“), wird daraus ein Satz ohne Zahl.

## 4. Wörterbuch

`OFFLINE-Lumisch-Woerterbuch.md` ist korrigiert: „tel3“ statt „zel3“ bei „tel“, und „Wir wissen, dass wir nichts wissen“ bei „nesap sap“ und „Sokrates“. Übernimm das ins Paket `lumisch`.

## 5. Kleinigkeiten aus den Bildern zu 0.7.0

1. **Lücke unter dem Lumi-Bild:** Auf „Heute“ und auf der Lumi-Seite steht zwischen Bild und „Pip liegt“ eine große leere Fläche. Weg damit.
2. **„alle 90 s“:** im Kästchen Tipps und in den Einstellungen „alle 90 Sekunden“ schreiben.
3. **RIS:** In der Bibliothek beim Pro-Paket „Rechtsinformationssystem (RIS)“ beim ersten Vorkommen.

## 6. Offene Abkürzungen (Naturheilkunde, intern)

Bill entscheidet nach `abkuerzungen-offen.md`:

- **PI neben NNRTI** (Wechselwirkungen, Zeile 51): „Proteasehemmer (PI)“; NNRTI ebenso ausschreiben: „nicht-nukleosidische Reverse-Transkriptase-Hemmer (NNRTI)“.
- **„Bayer-PI“** (Zeile 226): „Fachinformation des Herstellers Bayer“.
- **DGAM und ÖGC** (TCM, Zeilen 146 und 178): Die Namen sind nicht belegt. Ersetze „ÖÄK/DGAM/ÖGC“ durch „der Österreichischen Ärztekammer (ÖÄK) und ärztlicher Fachgesellschaften“. Danach aus der Liste `OFFEN` streichen.

## Fertig, wenn

- Alle Tests und die Windows-Probe sind grün.
- Bilder bei 360 px, hell und dunkel: je ein Happen Fehler-Geschichte (Stufe 3), Kaffeehaus-Logik, Kopfnuss, Gedanke am Fluss, Lumisch (Stufe 3), Zeitgefühl-Ende, die Einladung zum Höherstellen, Pause mit Lumi aus, Heute und Lumi-Seite ohne Lücke.
- „Was ist neu“: „Pause hat jetzt fünf Stufen und drei neue Formen: Kaffeehaus-Logik, Kopfnuss und Ein Gedanke am Fluss.“
