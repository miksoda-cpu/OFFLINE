# Rückmeldung: Pause, Stufe 1 – und drei Tipps – ausgeliefert mit 0.4.0

**Von:** Code (lokale Session) · **Datum:** 2026-10-04 · **Aufträge:** `bill/erledigt/2026-10-04-pause-stufe1.md` (Nr. 2026-10-04-02), `bill/erledigt/2026-10-04-wir-drei-tipps.md` (Nr. 2026-10-04-03) · **Branch:** `pause` · **Tag:** `v0.4.0`

## Ergebnis
- **App 0.4.0 ist ausgeliefert** (`app/latest.json`, 04.10.2026, 13:16 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux sind abrufbar (HTTP 200).
- **Web-Version 0.4.0.** Pause lässt sich dort live einschalten, lädt das signierte Paket und zeigt einen Happen.
- **Katalog** (erstellt 04.10.2026, 13:06 UTC, Signatur geprüft). Neu sind drei Einträge, die anderen sind unverändert:

| Paket | Version | app_min | sha256 des Manifests |
|---|---|---|---|
| pause (neu) | 2026.10.04 | 0.4.0 | `f9faf5b0ee2d32abb5afec02699afa7bf85e5e1a1c34e727493f1d1ea6a71360` |
| wichteln | 2026.10.04 | 0.2.0 | `aa1fea36c551fb73323f7f246d8714db080d2f38107a33da6e8a305bb3e63b6f` |
| wir | 2026.10.04.2 | 0.2.0 | `0b42ee29e1f05dc1fabd6d27b393f67933dc02136b0d72a88befe83cfabcbad7` |

- **Vorrat:** reicht bis 31. Jänner 2027, 119 Tage ab heute. Die 45-Tage-Grenze wird am 17. Dezember erreicht.

## 1. Pause in der App
Ausführlich in `docs/PAUSE.md`. Die Quellen liegen in `bill/eingang/2026-10-04-pause-quellen/`.

- **Ein- und ausschalten** wie die Lumi: Übersicht › ⏸ Pause, dazu eine eingebaute Karte unter Bibliothek › Module. Standard ist aus.
  - Beim Einschalten fragt die App nach dem Lebensabschnitt. Unter 14 kommt der Satz „Pause gibt es ab 14 Jahren“, und der Knopf bleibt gesperrt.
  - Ein Profil mit Alter gibt es in der App noch nicht; daher diese eine Frage.
  - Der Name steht in Menüs mit großem P und mit dem Symbol ⏸.
- **Der Happen** erscheint als Rahmen über der Tagesseite, höchstens einmal je Öffnen.
  - Ein Öffnen innerhalb von 10 Minuten nach dem letzten zählt nicht. Im Notfall-Bereich kommt nie ein Happen, auch kein Zählen.
  - Appetit: wenig, mittel oder viel, das heißt 1, 3 oder 6 Angebote am Tag. „Noch einen?“ tippt man selbst.
  - Nach dem Tagesschluss (Uhrzeit aus dem Tagesplan) kommt nur noch „Der Tag rückwärts“, einmal.
  - „Nicht jetzt“ ist immer da, ohne Folgen. Escape schließt ebenfalls.
- **Ablauf:**
  1. Einladung in einem Satz.
  2. Die Sache selbst.
  3. Bei Falschem „Schau, so war's“, nie rot.
  4. Ein Satz zum Mitnehmen, etwa „Heute: alle drei Pilze gefunden.“
  5. Mehr davon · Passt · Nicht mehr; bei jedem fünften Happen zusätzlich Zu leicht · Genau richtig · Zu schwer; höchstens eine Rückfrage.
  6. „Noch einen?“ oder „Fertig“.
- **Lumi:** Mit Figur freut sich die Lumi nach einem Happen kurz mit.

## 2. Formen
Gebaut sind acht Formen, die sechs verlangten und zwei weitere, die ohne neue Funktion gingen:

| Form | Trainingsart | Was |
|---|---|---|
| Wo war der Pilz? | Tempo | neun Felder, Blitzdauer je Stufe von 800 bis 150 ms, außen erst ab Stufe 3. Die Auffrischung nach 11 und 35 Monaten ist ab dem ersten Spiel als Datum vorgemerkt und steht in „Deine Linie“. |
| Der eingebaute Fehler | Kraft, Tempo | 15 Geschichten von unten, je ein Satz widerspricht der Geschichte selbst |
| Lumisch | Kraft, Beweglichkeit | ein Wort am Tag nach dem 21-Tage-Plan aus dem Wörterbuch, dazu eine Abfrage |
| Was kommt als Nächstes? | Kraft | Roman der Woche: Ende von gestern, Vermutung (auch nur im Kopf), nach dem Lesen Auflösung |
| Türsteherfrage | Kraft | das Tagesrätsel von gestern mit Antwortfeld, sonst der Autor des Romans |
| Der Tag rückwärts | Kraft | Abend: drei Fragen, nichts wird gespeichert, der Rahmen wird dunkel |
| Zeitgefühl (zusätzlich) | Beweglichkeit | morgens die Uhrzeit schätzen |
| Atemfenster (zusätzlich) | Ausdauer | vier geführte Atemzüge, bei „weniger Bewegung“ ohne Animation |

- **Warten auf eine Funktion** (im Paket mit `bedingung.funktion`, nicht gebaut):

  | Form | wartet auf |
  |---|---|
  | Sonnengruß-Kette | `bilderfolge` |
  | Wo liegt es? / Nachbar-Namen | `tresor-fragen` (der Tresor ist verschlüsselt) |
  | Rezept nur einmal | `kochbuch` |
  | Weg im Kopf | `karte-offline` |
  | Frag jemanden | `tagebuch` |

  Du hattest „Bedingung `offen` wie bei den Tipps“ geschrieben. Bei den Tipps heißt das Wort für fehlende Funktionen `funktion` (`offen` meint dort eine nie bestätigte Bereit-Position); ich habe es einheitlich gehalten.
- **Kein Mikro, keine Kamera, keine Sensoren** in irgendeiner Form, daher keine Rückfrage nötig.
- **Tagesrätsel:** Es bleibt sein Paket und meldet beim Erledigen ins Spiel-Log, ob es gelöst oder aufgedeckt wurde.

## 3. Dirigent
`web/pause.js`; alle Startwerte stehen in `web/pause-werte.js`.

- **Reihenfolge der Auswahl:**
  1. Nur verfügbare, nicht abgelehnte Formen, nie zweimal dieselbe hintereinander.
  2. Ist eine Auffrischung fällig, kommt sie zuerst.
  3. Im Kennenlernen (21 Tage) das am wenigsten Gespielte.
  4. Danach 65 % Vertrautes, 25 % Verwandtes, 10 % Neues; der Regler „Vertraut ↔ Neues“ verschiebt bis zu 15 Punkte.
  5. Innerhalb der Gruppe nach Gewicht, Lebensabschnitt, Wochenausgleich (Arten, die diese Woche fehlen, ×1,5, nur in nicht abgelehnten Formen) und den Antworten auf Rückfragen.
- **Zone 2:** Über 85 % Treffer in den letzten drei Happen einer Form wird es eine Stufe schwerer, unter 75 % leichter.
- **Rückfragen:** im Kennenlernen höchstens eine am Tag, danach höchstens eine je Woche; jede nur einmal. „Schneller oder ruhiger“ wirkt sofort, getestet: Nach „ruhiger“ kam das Atemfenster.

## 4. Brücke `spiel.melden` / `spiel.liste`
- **Genau zwei neue Aufrufe,** sonst nichts. Geprüft in `web/modul-host.js`:
  - feste Trainingsarten,
  - flache Werte, höchstens 12 Felder und 1 kB,
  - kein Feld für das Modul, denn welches Modul meldet, setzt die App,
  - höchstens 10 Meldungen je Minute.
  - `spiel.liste` nimmt keine Daten und gibt nur die eigenen Einträge zurück.
- **Sechs neue Angriffe im Testmodul,** insgesamt 48: Meldung unter fremdem Modul, fremde Einträge lesen, übergroßes Ergebnis, verschachtelte Werte, unbekannte Trainingsart, Flut von 30 Meldungen. Lokal gegen Chromium: 48 von 48 blockiert, bei der Flut wurden 9 von 30 angenommen.
- **Wichteln 2026.10.04** meldet eine ausgeloste Runde, aber nur, wenn die App `offline.spiel` kennt. `app_min` bleibt deshalb 0.2.0. Gebaut mit dem Redaktionsschlüssel auf dem Mac; der Schlüssel bleibt dort.
- **Kit:** Der Prüfer gibt einen Hinweis, wenn ein Modul `offline.spiel` ohne `app_min` 0.4.0 und ohne vorherige Prüfung benutzt. Beschrieben in `PAKET-KIT.md` Abschnitt 5 (Tabelle) und 5d, mit Kopie im Kit; dazu `SICHERHEIT.md`.

## 5. „Deine Linie“ und Rückspiegel
- **Ort, meine Entscheidung:** eigene Seite `#linie`, erreichbar aus Übersicht › Pause.
- **Inhalt:**
  - Balken für das Gemochte, ausgeschlossene Formen mit „Zurückholen“.
  - Stufe je Form mit „leichter“ und „schwerer“, dazu ein Wort zur Zone. Erst nach drei Happen steht dort ein Urteil, vorher „wird noch eingestellt“.
  - Wochensatz („Ich achte darauf, dass …“), vorgemerkte Auffrischung, die gegebenen Antworten, die Einstellungen.
  - Nach dem Kennenlernen „So sehe ich dich“.
  - Die Info zur Wirkung, nur mit den erlaubten Sätzen aus Abschnitt 8.
  - „Linie zurücksetzen“ (die Auffrischungstermine bleiben) und „Spiel-Log löschen“.
- **Rückspiegel:** höchstens einmal im Monat, frühestens nach einem Monat Pause, als ruhige Karte auf der Tagesseite und in Worten. Zum Beispiel: „Vor einem Monat blitzte der Pilz noch 660 Millisekunden lang. Heute findest du ihn schon nach 450.“

## 6. Milde Zugkraft: die fünf Prüffragen
Für jede Form erfüllt, die Tabelle steht in `docs/PAUSE.md`. Kurz:

- **Ende:** Jede Form hat ein festes Ende (Runden, eine Geschichte, ein Wort, drei Fragen, vier Atemzüge).
- **Leben:** Es gibt einen Satz zum Mitnehmen, teils eine Aufgabe für draußen.
- **Ruhige Stunde:** Die Happen sind kurz und freiwillig, mit „Nicht jetzt“ ohne Folgen.
- **Ohne Hebel:** keine Punkte, keine Serien, kein Push, keine Ranglisten, kein Rot, „Weiß ich nicht mehr“ ist ein Knopf.
- **Sichtbar:** Alles Gelernte steht in „Deine Linie“ und lässt sich zurücksetzen.

Ein Grenzfall zum Gegenlesen: Der Rückspiegel nennt einmal im Monat auch, an wie vielen Tagen man eine Pause hatte („Schön, dass du dir die Zeit nimmst“), aber nur, wenn es nichts anderes zu sagen gibt. Wenn dir das zu sehr nach Kennzahl klingt, nehme ich den Satz heraus.

## 7. Drei Tipps (Auftrag 2026-10-04-03)
- **`app-011`:** „Die Pakete in der Bibliothek liegen ganz auf deinem Gerät. Kein Netz nötig, nie. Deshalb sind sie groß.“ Das Ziel bleibt `bibliothek`.
- **`app-012`** wartet auf `wikipedia-varianten`; das Ziel bleibt.
- **`app-030`** wartet auf `export` und hat kein Ziel.
- **Der Test** kennt beide Funktionswörter.
- **Doku:** `docs/WESEN.md` hat jetzt eine Tabelle aller 20 wartenden Tipps.
- **`buch`** bleibt leer.

## Geprüft
- **Tests:**
  - Web: 68 von 68. `web/pause.test.mjs` hat 12 neue Fälle:
    - Einstellungen und unter 14.
    - Wann ein Happen kommt: Öffnen, 10 Minuten, Appetit, Notfall, Tagesschluss.
    - Verfügbarkeit.
    - Dirigent: Mischung, Regler, „Nicht mehr“, keine Wiederholung, Kennenlernen.
    - Linie, Zone, Rückfragen, Auffrischung, Rückspiegel, Spiel-Log.
    - Brücke `spiel.melden` / `spiel.liste`.
    - Paketformat, darunter „kein Werbesatz für Gehirntraining“ und „höchstens 3 Minuten“.
  - Dazu die drei Tipps in `web/wesen.test.mjs`.
  - Werkzeug und Kit: 33 von 33.
- **CI (Lauf `37203622179`):** Die Tests laufen grün unter Linux, macOS und Windows (App-Berechtigungen), dazu Kern und Modul-Sandbox.
- **Windows-Probe (`37203621794`, Commit `9bfde66` = `v0.4.0`):** grün beim ersten Lauf.
  - Sandbox gegen Edge 48 von 48, in der App selbst 48 von 48, beide Durchgänge.
  - Wichteln 2026.10.04 aus der lokalen Quelle: geladen, gespielt, und „meldet ins Spiel-Log“, eine neue Prüfung.
  - Update von 0.1.8 auf 0.4.0, „Was ist neu“ mit 0.4.0 oben.
- **Release-Build `37204481695`:** alle vier Plattformen und das Veröffentlichen sind grün.
- **Im Browser bei 360 px** (lokal, Pause-Daten direkt geladen):
  - Unter 14 bleibt der Knopf gesperrt, mit Hinweis; „30 bis 49“ schaltet ein.
  - Lumisch, Tag 1: falsche Wahl ergibt „Schau, so war's“, danach Mitnehmen, Bewertung und Rückfrage.
  - Nach „ruhiger“ kommt das Atemfenster; dabei wird der Rahmen dunkel.
  - Türsteherfrage mit dem Rätsel von gestern, Pilz (3 Runden, im Log 660 ms auf Stufe 3), eingebauter Fehler, „Der Tag rückwärts“ nach Schluss.
  - Im Notfall-Bereich kein Happen. „Fertig“ schließt, „Nicht jetzt“ ist nach dem Ende weg.
  - Kein seitliches Überlaufen, alle Knöpfe 44 bis 49 px.
  - „Deine Linie“ zeigt Balken, Stufen, Wochensatz, Auffrischung (4. September 2027 und 2029) und die Antworten.
- **Live (Web 0.4.0):** Pause eingeschaltet, das signierte Paket wurde geladen, ein Happen erschien, „Nicht jetzt“ schließt.
- **Dabei korrigiert:**
  - „Heute: null von drei Pilzen“ ist jetzt ein freundlicher Satz.
  - Die Pilz-Felder sind vor „Los“ gesperrt.
  - Lumisch sagt nicht mehr „Neues Wort“ für das Wort des Tages.
  - Die Zone steht erst nach drei Happen.
  - „Mehr davon“ hebt keine wartenden Formen.
- **„Was kommt als Nächstes?“** habe ich im Browser nicht gespielt, weil am Prüftag (Sonntag, 4.10.) kein Roman lief; Auswahl und Bedingung sind getestet.

## Offen
- **Folie 2 im Paket `pause`** ist eine Skizze; ein echtes Bild aus der App folgt.
- **Sehbehinderung beim Pilz:** Er ist ein Sehspiel. Die Felder sind beschriftet, das Blitzen ersetzt ein Bildschirmleser nicht; wer nicht sieht, schließt die Form mit „Nicht mehr“ aus.
- **Lumisch-Wörter** sind auf Ähnlichkeit mit echten Wörtern noch nicht geprüft (Wörterbuch, Abschnitt 10).
- **Nach 21 Tagen Lumisch** bleibt der Plan bei Tag 21 („dein Satz“). Wiederholungsrunden wären der nächste Schritt.
- **Desktop-Test-App:** Die Steuerung am Mac war wieder nicht verfügbar; geprüft habe ich in der Web-Version.
