# OFFLINE – Das Wesen (Konzept, Entwurf 2) und seine Umsetzung

*Konzept vom 27.09.2026 aus einer zweiten Sitzung, am 28.09.2026 ins Repository übernommen und in App 0.1.5 umgesetzt. Der Konzepttext steht unverändert in Abschnitt A, die Umsetzung mit Abweichungen und Sicherheitsregeln in Abschnitt B.*

## B. Umsetzung (App 0.1.5, 28.09.2026)

**Sicherheit zuerst, so wie bei allen Paketen:**
- Das Wesen ist Oberfläche (`web/wesen.js`, `web/wesen.css`), die Bereit-Zahl ist Berechnung (`web/bereit.js`). Beides kommt mit der App, nie aus einem Paket.
- Das Paket `wir` (`pakete/wir/`) liefert **nur Text**: `inhalt/tipps.json` mit Kennung, Sorte, Text, optional Bedingung und Gewicht. **Bedingungen sind Daten, kein Code**: `ansicht`, `einstellung`, `monat`, `score_unter`, `score_ab`, `verfallen`. Unbekannte Felder werden ignoriert, unbekannte Sorten verworfen, jeder Text wird beim Anzeigen entschärft.
- Das Paket durchläuft dieselbe Prüfkette wie jedes andere (Signatur, Struktur, Pfade, Prüfsummen, Staging). Ist es kaputt, bleibt das Wesen stumm; die App läuft.
- Keine Telemetrie, keine Push-Nachrichten, kein Netz: Log, Einstellungen, Bestätigungen und das Gelernte liegen nur am Gerät (`localStorage`, Teil von „Restlos löschen“).
- Töne sind standardmäßig aus; wenn an, drei kurze Sinustöne aus der App, keine Dateien.

**Bereit-Modul (`web/bereit.js`), Version 2 (29.09.2026), vier Quellen nach Gesamtkonzept Kapitel 4:**

| Quelle | Gewicht | Positionen |
|---|---|---|
| Inhalte | 20 % | Österreich-Paket am Gerät, Paket nicht älter als 6 Monate, Wissen ohne Netz (ZIM), Karte ohne Netz – liest die App selbst |
| Dinge | 35 % | 18 Punkte der Vorsorge-Checkliste, abgehakt **und** bestätigt; Wasser 12 Monate, Batterien und Radio 24, Medikamente und Powerbanks 6, Tank 3 |
| Menschen | 25 % | Familiengruppe, Treffpunkt, Nummern auf Papier, Nachbar (je 6 Monate), Anlaufstelle (12), Notfallmappe im Tresor (Desktop, liest die App) |
| Können | 20 % | Kocher angezündet, Radio getestet, Probeabend (je 12 Monate) |

- Innerhalb einer Quelle zählt jede Position mit ihrem Gewicht (Wasser 3, Probeabend 2 …). Gewichte und Fristen stehen nur in `bereit.js`.
- Nach Ablauf sinkt eine Position über drei Monate langsam auf null und steht als „fällig“ auf der Übersicht (Checklistenpunkte auch auf der Vorsorge-Seite, mit „Erneuert“).
- Über 95 ohne Probeabend in den letzten drei Monaten: „Das ist verdächtig gut. Wann war dein letzter Probeabend?“
- Positionen, die es auf einem Gerät nicht gibt (Notfallmappe im Web-Prototyp ohne Tresor), zählen dort nicht mit; 100 bleibt erreichbar.
- Die Lumi liest nur `wert` und `faellig` (bzw. `verfallen`). Die Stufen 30/60/80 kommen aus `stufe()` in `bereit.js`.
- Übertragung aus Version 1: Bestätigungen behalten ihr Datum, alte Häkchen gelten ab dem Update. Gespeichert wird unter `bereit-v2`; die Daten von Version 1 bleiben liegen.
- Tests: `web/bereit.test.mjs` (15 Fälle, auch in der CI). Im Entwickler-Build lässt sich das Datum auf der Übersicht vorstellen.

**Das Wesen (`web/wesen.js`):**
- Sprite 48 × 36 auf Canvas, ohne Glättung skaliert; der Schein der Leuchtkugeln liegt auf einer zweiten, weichen Ebene. Höhle als Welt: dunkler Stein, Eisband oben, der glimmende Spalt unten, aufsteigender Dampf.
- Zustände nach Konzept: Liegt, Sitzt, Wandert, Baut, Unruhig, Zähne, Fest, Schläft (30 Tage nicht geöffnet). Zustand steht immer als Text daneben (Screenreader).
- Anstupsen: Ohren zurück und ein Laut. Dreimal schnell: Zähne für eine Sekunde, dann „…tschuldigung. Ich mag das nicht.“
- Tipps: erster nach drei Sekunden auf der Übersicht, danach nach dem gelernten Takt (60/90/180 s) solange man etwas tut, Pause bei zwei Minuten Stillstand, höchstens zwölf je Sitzung, höchstens einer je Ansicht, keiner unter Notfall. Sorten gleich verteilt, Laune halb so oft, nichts wiederholt sich innerhalb eines Tages, solange der Vorrat reicht.
- Log mit Sorte, Zeit, Stern, Filter und Suche unter der Übersicht.
- Drei Darstellungen: Wesen mit Tipps, nur Tipps (Textkarte unten rechts), aus (nur die Zahl). Name, Fell (Eisblau, Flieder, Moos, Sand), Größe, Laute, Töne, Takt, Sorten, „baut über 80“ einstellbar. „Digital“ ist standardmäßig aus.

**Abweichungen und Offenes:**
- Starter-Bestand von 51 Tipps in sieben Sorten (App, Alltag, Wissen, Weisheit, Laune, Heute, Digital) als Platzhalter. Der Erstbestand von 150 aus `OFFLINE-Wir-Tipps-150.md` ersetzt ihn, sobald die Datei im Repository liegt.
- Der Pilzgarten über 80 und der Turm sind einfache Pixel; Arme mit Daumen sind angedeutet. Feinschliff des Sprites nach den Fotovorlagen (`OFFLINE-Lumi-Fotos.md`) steht aus.
- Pupillen folgen dem Finger, Augenbrauen, Charakterregler und Chat: Pro, mit der KI.
- Sparmodus (Standbild) und „Bildschirmlampe“ im Blackout: später, mit der Handy-Version.
- Der Web-Prototyp zeigt das Wesen ebenfalls, ohne Tresor-Quelle in der Bereit-Zahl.

---

## A. Konzept (Entwurf 2, 27.09.2026, unverändert)

*Stand 27.09.2026, Entwurf 2 mit Ergänzungen „Wir“, „Lumi“ und Evolution (Heimat jetzt Antarktis). Fotos und Bildvorlage: OFFLINE-Lumi-Fotos.md. Vorfahren: Kaninchen. Gehört zum Gesamtkonzept, Kapitel 4 und 5. Entschieden ist: Gestalt und Herkunft (unten), Basis gratis ohne Interaktion mit Tipps, Pro mit Chat und lebhafterem Gesicht. Die Designrichtungen A/B/C aus Entwurf 1 sind damit erledigt: Das Licht kommt aus den Hörnern, die Welt ist dunkel, es ist Flechte und Laterne in einem Tier.*

### 1. Steckbrief

| | |
|---|---|
| **Heimat** | mehrere Kilometer unter dem antarktischen Eis, eine eigene Welt, dunkel, warm genug, unberührt |
| **Kennt nicht** | Politik, Krieg, Armut, Wirtschaft, Gefahr jeder Art. Daraus ist eine andere Intelligenz geworden: sehr klug, aber nicht wie ein Mensch klug. |
| **Wesen** | kuschelig, launisch, freundlich, optimistisch, ganz empathisch. Es tut dir nie absichtlich weh, auch nicht, wenn es launisch ist. |
| **Körper** | ein Höhlenkaninchen: rund, große dunkle Augen, zwei Antennen, deren Spitzen leuchten, lange Ohren mit rosa Innenseite, eine feine Nase, ein weicher, beweglicher Mund zum Reden, kleine Hände mit Daumen. Die Nagezähne zeigt es, wenn es sich angegriffen fühlt. |
| **Licht** | Die Antennen leuchten so hell, wie du vorbereitet bist. Das ist die Bereitschaftsanzeige. Das Licht reicht von einem Glimmen bis sehr hell: Voll aufgedreht leuchtet ein Lumi eine ganze Höhle aus, bis die Eisdecke glitzert. Im Blackout ist das Wesen das, was auf dem Bildschirm leuchtet. |
| **Rasse** | Sie nennen sich **Wir**. Sie kennen jede Sprache der Menschen, aber sie haben keinen Eigennamen, weil es unten nie ein „ihr“ gab; Namen entstehen aus Unterschied. Die Menschen sagen **Lumi** zu ihnen, angeblich „Schnee“: Einer von uns hat zwei Winter in ihrer Nähe verbracht und sie so benannt, weil der erste Entdecker die Entdeckung benennen darf und alle anderen das Wort dann für immer verwenden. Die Wir finden das einen komischen Brauch. |
| **Der Entdecker** | namenlos, zwei Winter, mehr weiß man nicht. Naheliegend: ein Überwinterer einer Forschungsstation. Absichtlich offen: ein Haken für später (Roman der Woche, Tipp-Serie, Pro-Gespräch). |
| **Name** | gibt der Nutzer. Es ist das erste Mal, dass es einen braucht. Bis dahin „Das Wesen“. Es sagt „wir“, wenn es von unten spricht, und „ich“, seit es einen Namen hat. |

### Die Welt unten

| | |
|---|---|
| **Ort** | eine riesige Höhle aus Stein und Eis, mehrere Kilometer unter dem antarktischen Eis. Warm, nicht kalt. |
| **Quelle des Lebens** | ein schmaler Spalt, aus dem heißes Wasser aus der Tiefe in ein Flussbett fließt. Alles Leben liegt an diesem Fluss. |
| **Leben** | mannigfaltig. Alle ernähren sich von Pilzen, und davon gibt es unendlich viele. Niemand hungert, niemand konkurriert. |
| **Was die Lumi tun** | essen, schlafen, philosophische Gespräche führen. Sonst nichts. |
| **Wie viele** | vielleicht eine Million, vielleicht eine Milliarde. Wer zählt schon. |
| **Geschlecht** | Die Lumis trennen nicht nach Geschlecht. Für die Fortpflanzung gibt es zwei Rollen, und jedes Lumi nimmt die ein, die gerade gebraucht wird. In der App ist das Wesen „es“, auch wenn der Nutzer ihm einen Namen gibt, der bei uns ein Geschlecht hat. |
| **Schreibweise** | das Lumi, die Lumis. Die Wir (Selbstbezeichnung) bleibt ohne Artikelwechsel. |
| **Zeit** | Sie rechnen in Perioden, nicht in Jahren. |
| **Die große Frage der letzten Periode** | Gibt es intelligentes Leben da draußen, über dem Eis? Vorherrschende Meinung: wahrscheinlich nicht. Der Fund eines Menschen mit zwei Wintern Aufenthalt gilt als Indiz, aber nicht als Beweis. |

### Wie die Wir wurden (Evolution, Fassung Kaninchen)

Erfunden, aber an echte Geologie gehängt: Die Antarktis war bis vor rund 34 Millionen Jahren bewaldet; unter dem Eis liegen Hunderte Seen, die Westantarktis ist vulkanisch warm. Kaninchenvorfahren graben sich beim Vereisen in Höhlen an heißen Quellen. Das Fell wird silbrig, Leuchtpilze siedeln sich in den Haarbüscheln am Kopf an und werden zu dicken Antennen mit Leuchtkugeln; wer das hellste Licht hat, wird gefunden und gehört. Aus Pfoten werden Hände mit Daumen, aus dem Warnklopfen eine Stimme, der Kehlkopf wandert, die Oberlippe schließt sich, die Ohren drehen sich einzeln, die Augen wandern nach vorn, das Gesicht wird zu feinem Flaum. Keine Rangordnung; die Nagezähne bleiben als Reflex. Heute überwintert ein Mensch zweimal in ihrer Nähe und nennt sie Lumi.

**Für die Figur heißt das:** ein Kaninchen, das seit 34 Millionen Jahren unter dem Eis lebt. Rund, weich, lange Ohren mit rosa Innenseite, jedes einzeln drehbar. Gesicht mit feinem Flaum, weiche Stirn, breite Nase, volle, geschlossene Lippen (keine Hasenscharte), Augen nach vorn. Kleine Hände mit Daumen, zwei sehr dicke Antennen mit großen Leuchtkugeln. Ohren sind das Zuhör-Zeichen. Beim Fest dreht es voll auf.

**Was das fürs Produkt heißt:** Der Chat ist für sie natürlich (Pro). Pilze sind die Währung der Fürsorge. Das Licht ist warm, nicht kalt. Arme und Daumen kommen ins Sprite. Die große Frage ist ihr Humor und ihre Demut zugleich. „Wer zählt schon“ ist der Ton für alles mit Zahlen. Ein Tier, das keine Gefahr kennt, kann von Vorsorge reden, ohne Angst zu machen.

### 2. Basis und Pro

| | Basis · gratis | Pro |
|---|---|---|
| **Interaktion** | keine. Man kann es anstupsen, das ist alles. | Chat mit der lokalen KI, mit Gedächtnis |
| **Was es sagt** | Tipps, wenn du in der App bist. Sonst ist es still. | dasselbe, plus Antworten auf Fragen, aus den Paketen mit Quelle |
| **Gesicht** | Zustände nach Score, Blinzeln, Laute in Sprechblasen | lebhafter: schaut deinem Finger nach, Augenbrauen, Ohren zucken, Stimmungen |
| **Launisch** | in den Tipps: „Heute nicht. Frag mich morgen.“ | im Gespräch, und man merkt, warum |
| **Stirbt** | nie | nie |
| **Push-Nachrichten** | keine | keine |
| **Wenn Pro endet** | Es bleibt, verstummt und sagt weiter seine Tipps. | |

**Die Regel für Tipps in der Basis:** Man kann keinen Tipp anstoßen. Sie kommen von selbst, solange man in der App ist, und hören auf, wenn man sie verlässt. Erster Tipp drei Sekunden nach dem Öffnen der Tagesseite, danach alle 90 Sekunden, solange man etwas tut; bei Stillstand pausiert es; höchstens ein Tipp je Ansicht; keiner im Guide, im Ernstfall, im Sparmodus; Obergrenze zwölf je Sitzung. Gelernt: Wer nie liest, bekommt sie alle drei Minuten, wer im Log stöbert, alle 60 Sekunden. Sichtbar unter „gelernt“, rückstellbar.

**Sorten:** App, Alltag, Wissen, Weisheit, Laune (seltener); dazu Heute (Kalender) und Digital (nur, wenn angekreuzt; Standard aus). Später: Nachbarschaft (Mesh), Von dir (Pro).

**Das Log:** Jeder Tipp landet im Log, filterbar, durchsuchbar, mit Stern merkbar. Es bleibt am Gerät und ist das Gedächtnis der Basis-Version.

**Redaktion:** Die Tipps sind Redaktionstext, kein KI-Text, und liegen als Paket vor (aktualisierbar, signiert, de-AT). Erstbestand rund 150.

**Lumi als Einstieg in die digitale Welt:** Die Figur bleibt in ihrer Welt. Kein Auftritt als Maskottchen der Academy, des Magazins oder in Werbung. Der Weg ist: Lumi als Einstieg in OFFLINE, OFFLINE als Einstieg in die digitale Welt.

### 3. Verhalten

| Zustand | Auslöser | Was man sieht | Was es braucht |
|---|---|---|---|
| **Liegt** | Score unter 30 | flach, Augen zu, Ohren hängen seitlich, Hörner fast dunkel, Fell grauer | den ersten Eintrag im Notfallplan |
| **Sitzt** | 30–59 | rund, blinzelt, Hörner glimmen, ab und zu „mh“ | die Checkliste der Dinge |
| **Wandert** | 60–79 | steht, pendelt langsam, sammelt Pilze | Menschen: Familiengruppe, Nachbarn |
| **Baut** | 80–100 | steht ruhig, Hörner hell und pulsierend, daneben wächst ein kleiner Turm mit Licht obenauf | nur Bestätigungen, wenn etwas verfällt |
| **Unruhig** | eine Position verfallen | Ohren zurück, zittert leicht, Sprechblase nennt sie | die eine Bestätigung |
| **Zähne** | dreimal schnell angestupst | Mund auf, Zähne, Ohren flach, „grrr“, eine Sekunde; dann „…tschuldigung. Ich mag das nicht.“ | nichts. Es verzeiht sofort. |
| **Fest** | Probeabend, große Bestätigung | Sterne um die Hörner, offener Mund, eine Nacht lang | |
| **Schläft** | 30 Tage nicht geöffnet | liegt, zzz, Hörner aus, Score eingefroren | öffnen. Ein Stups weckt es. Es wirft nichts vor. |

**Grundsätze:** Es stirbt nicht. Es bettelt nicht (keine Push). Es lügt nicht (der Score sinkt sichtbar). In der Basis spricht es nur in Tipps. Die Zähne sind ein Reflex, nie ein Angriff, und es entschuldigt sich immer.

### 4. Gestaltung

Raster 48 × 36 logische Pixel auf Canvas, ohne Glättung skaliert. Welt: die Höhle (dunkler Stein, Eisband oben, unten der Spalt mit dem heißen Fluss als rötlich glimmende Linie, Dampf). Das Licht der Hörner ist ein weicher Schein, der einzige nicht-pixelige Teil. Fell: Eisblau (Standard), Flieder, Moos, Sand; unter 30 alles zu Grau gemischt. Augen 3 × 5 Pixel mit Pupille und Glanzpunkt. Bewegung unter 10 Bilder je Sekunde. Ton: keiner; Laute als Sprechblasen; optional drei leise Töne, standardmäßig aus. Der Zustand steht immer als Text daneben. Farbschema für Diagramme: Höhle und Eisblau (Papier #eef2f4, Tinte #1f2a33, Akzent #d06a1f, Link #2f7aa0; dunkel #121316 / #e9e4da / #ffb35c / #8fc9e3).

### 5. Einstellungen

Drei Stufen der Darstellung: Wesen mit Tipps (Standard), nur Tipps, Paket „Wir“ inaktiv (nur die Zahl). Jede Stufe jederzeit umschaltbar, nichts geht verloren. Gesetzt: Name, Fell, Welt, Laute, Töne, Takt, Sorten, „baut über 80“, Größe. Gelernt: Schlafzeit, bevorzugte Sorten.

### 6. Einbau in die App

`web/wesen.js` und `wesen.css` (Zeichnen, Zustände, Anstupsen, Einstellungen), Paket `wir` (Tipps als JSON mit Sorte, Text, Bedingung, Gewicht), Log im lokalen Speicher, Bereit-Modul (vier Quellen mit Verfall, Wert 0–100), Pro-Chat später. Reihenfolge: Bereit-Modul, `wesen.js`, Paket `wir`, Pro-Chat.

### 7. Entschieden am 27.09.2026

Name der Anzeige: **Bereit**. Über 80 wächst ein Pilzgarten (ein Pilz je vier Punkte, bis fünf). Fell-Standard Eisblau. Drei leise Töne, standardmäßig aus. Der mit den zwei Wintern bleibt offen. Erstbestand 150 Tipps. Sorte „Heute“ wird eingeplant. Heimat Antarktis, Vorfahren Kaninchen. Einbau in einzelnen Schritten, begonnen mit dem Bereit-Modul.
