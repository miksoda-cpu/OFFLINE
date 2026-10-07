# Pause – Happen für zwischendurch (Stufe 1, App 0.4.0; eigener Raum seit 0.4.2)

Umsetzung der Aufträge `bill/erledigt/2026-10-04-pause-stufe1.md` und `bill/erledigt/2026-10-04-pause-umbau.md` (Bedienung neu, 0.4.2). Quellen: `bill/eingang/2026-10-04-pause-quellen/` (Pause-Konzept, Übungskatalog Abschnitt 7, Trainingsmodell Abschnitte 4 und 8, Prinzip Milde Zugkraft, Lumisch-Wörterbuch).

## Was es ist

Wer Pause einschaltet, bekommt beim Öffnen der App eine Einladung zu einem **Happen** (30 Sekunden bis 3 Minuten): Einladung in einem Satz → eine Sache → Gelingen → ein Satz zum Mitnehmen → Ende. Unterhaltung zuerst; die App wirbt nirgends mit Gehirntraining. Aussagen zur Wirkung stehen nur in „Deine Linie“, mit den erlaubten Sätzen aus dem Trainingsmodell.

## Bausteine

| Teil | Datei | Was |
|---|---|---|
| Startwerte | `web/pause-werte.js` | alle Zahlen an einer Stelle (Mischung, Zone, Kennenlernen, Appetit, Rückfragen, Pilz, Log) |
| Logik | `web/pause.js` | Einstellungen, Spiel-Log, Linie, Zone, Dirigent, wann ein Happen fällig ist, Rückfragen, Auffrischung, Rückspiegel |
| Spiele | `web/pause-happen.js` | der Fokus-Bildschirm (`happenFokus`) und die acht Formen |
| Einbau | `web/app.js` (Abschnitt „Pause“) | Raum `#pause`, Happen `#happen`, Einladung auf Heute, Seite „Deine Linie“ (`#linie`), Rückspiegel-Karte, Spiel-Log über die Brücke |
| Inhalte | Paket `pause` (`pakete/pause/`, `inhalt/pause.json`, Format `paket-kit/pause-format.mjs`) | Formen mit Selbstbeschreibung, 15 Geschichten, Lumisch in 21 Tagen, Texte |
| Tests | `web/pause.test.mjs` | Verhalten, Format, Brücke |

## Der Raum „Pause“ (`#pause`, seit 0.4.2)

In der Seitenleiste direkt unter „Heute“, am Handy in der unteren Leiste (dafür liegt die Bibliothek unter „Mehr“; die Leiste behält fünf Plätze). Übersicht und Bibliothek › Module verweisen hierher.

- **Pause aus:** zwei Sätze, was Pause ist, und fünf Knöpfe fürs Alter (unter 14, 14–29, 30–49, 50–64, 65+). Ein Tipp schaltet ein, lädt bei Bedarf das Paket `pause` und startet sofort den ersten Happen. **Unter 14** zeigt den Hinweis; Pause bleibt aus, bis es den Kinder-Modus gibt. Standard ist aus.
- **Pause an:** oben der Vorschlag des Dirigenten mit „Spielen“ (bleibt stehen, bis sich Log, Ausschlüsse, Alter oder die Stunde ändern), darunter **alle gebauten Formen** als Liste mit Dauer oder Stand („Tag 5 von 21“), jede frei wählbar (`raumFormen`). Wartende Formen erscheinen nicht. Was gerade nicht geht, steht grau mit Grund da: „Der Tag rückwärts“ „ab 18 Uhr“, „Was kommt als Nächstes?“ nur mit Roman der Woche, die Türsteherfrage nur nach einem Tag mit Rätsel. Morgen-Formen (Zeitgefühl) darf man selbst auch später wählen; vorgeschlagen werden sie nur morgens. Unten „Deine Linie“ und die Einstellungen (Alter, Appetit, Vertraut ↔ Neues, ausschalten).

## Wann eine Einladung kommt

- Beim Öffnen der App steht oben auf **Heute** eine Karte (Eisblau): Name der Form, Dauer, „Spielen“, „Andere Pause“ (in den Raum), „später“. Sie lässt sich zur Seite wischen. **Kein Fenster** über der Tagesseite (bis 0.4.1 legte sich ein Dialog über Bereit und Rätsel).
- Höchstens eine Einladung je Öffnen; ein Öffnen innerhalb von 10 Minuten nach dem letzten zählt nicht.
- **Appetit** (wenig, mittel, viel) = Einladungen je Tag: 1, 3 oder 6. Im Raum kann man immer spielen; „Noch einen“ zählt nicht dazu.
- **Nie im Notfall-Bereich.** Nichts startet von allein.
- Nach dem **Tagesschluss** (Uhrzeit aus dem Tagesplan) nur noch „Der Tag rückwärts“, einmal – und nie vor 18 Uhr.
- **Mein Tag** (seit 0.5.6, `web/meintag.js`): „Der Tag rückwärts“ ab zwei Stunden vor der Schluss-Zeit, nie vor 18 Uhr; Morgen-Formen von „Aufstehen“ bis 12 Uhr.
- **Uhrzeit** (`web/pause-werte.js`): „Der Tag rückwärts“ ab `abendAb` (18 Uhr), Zeitgefühl als Vorschlag bis `morgenBis` (12 Uhr), das Atemfenster nie als erster Vorschlag des Tages (`nichtAlsErstes`; ein abgebrochener Happen zählt nicht).

## Der Happen (`#happen`, Fokus-Bildschirm)

Füllt den Inhaltsbereich, am Handy den ganzen Schirm, auf einem Hauch Eisblau. Oben ✕, drei feine Striche als Fortschritt und der Name der Form; darunter die Einladung als Satz, dann die Aufgabe; unten genau ein Hauptknopf. ✕, Escape und Zurück im Browser schließen; ein laufender Happen zählt dann als abgebrochen. Danach geht es dorthin zurück, wo man herkam (Heute oder Raum). **Ende:** der Satz zum Mitnehmen, „Mehr davon · Passt · Nicht mehr“ in einer Reihe, gelegentlich die Schwierigkeit oder eine Rückfrage, dann „Noch einen“ (Hauptknopf) und „Zurück zu Heute“ bzw. „Zurück zur Pause“. Die Lumi meldet sich im Happen nicht dazwischen.

**Eingaben:** Wo nichts gespeichert wird („Der Tag rückwärts“), gibt es kein Textfeld, nur „Ich hab's“. Wo eine Antwort geprüft wird (Lumisch-Wiederholung, Türsteherfrage), ist das Feld einzeilig; die Vermutung zum Roman ebenso.

## Aussehen: zart (`--z-*` in `web/styles.css`)

Hauptknopf: helles Rot (`--accent-soft`) mit roter Schrift, 12,5 px, Gewicht 500, 6 × 11 px, Rundung 6, ohne Rand, Schatten oder Leuchten, je Bildschirm genau einer. Nebenwege: grauer Text mit Haarlinie. Wahl- und Bewertungsfelder: 1 px Haarlinie, dunkle Schrift, keine Füllung. Karten weiß ohne Rand mit kaum sichtbarem Schatten, Pause-Karte und Happen auf `--eis` (Lumi-Farben). Überschriften in leichter Serif (300–400), Text 400, höchstens 500. Tippflächen bleiben mindestens 44 px. Alle Werte sind Variablen (hell und dunkel), damit die App mit 0.4.3 folgen kann.

## Formen in 0.4.0

| Form | Trainingsart | Grundlage | Zone |
|---|---|---|---|
| Wo war der Pilz? | Tempo | Lumi-Welt, neun Felder; Blitzdauer je Stufe (800 ms bis 150 ms), außen erst ab Stufe 3 | 10 Stufen; Auffrischung nach 11 und 35 Monaten vorgemerkt |
| Der eingebaute Fehler | Kraft, Tempo | 15 Geschichten von unten, je ein Satz widerspricht der Geschichte selbst | 3 Stufen |
| Lumisch | Kraft, Beweglichkeit | Tag 1–21 ein Wort nach dem Plan, dazu eine Abfrage mit 3 bis 4 Möglichkeiten. Ab Tag 22 (seit 0.4.1, `lumischHeute`): an zwei von drei Tagen eine Wiederholung aus dem Kopf (zuletzt Falsches zuerst), an jedem dritten ein neues Wort aus dem Wörterbuch nach Gruppen (Welt, Haus, Menschen, Tun …), mit Beispielsatz. Seit 0.5.3 das ganze geprüfte Wörterbuch (seit 0.5.4 500 Wörter, Nachträge in ihrer Stammgruppe; Wortprüfung vom 05.10.2026, je mit Gruppe, Deutsch, Hinweis, Beispiel nur wo die Beilage eines hat); neue Wörter nach Gruppen: Unten, Wie etwas ist, Farben, Gefühle, Strom und Notfall, Gespräch und Zeit, die Philosophie und „Zahl und Quant“ zuletzt. In langen Zahlen wird nach je drei Ziffern tep gesprochen (die App liest heute keine Zahlen auf Lumisch vor). Seit 0.5.6 zum Anhören: jedes Wort trägt `umschrift` und `ipa`; der Knopf neben dem Wort spricht die Umschrift mit einer deutschen Stimme (de-AT zuerst, Tempo 0,8, `web/stimme.js`). Die Weiche `STIMME_KANN_IPA` ist aus, weil keine Sprachausgabe im Browser Lautschrift liest. Ersetzte Wörter (`LUMISCH_ALT` in `web/pause.js`) gelten im Spiel-Log als die neuen; wer eines gelernt hat, sieht einmal „Neu heißt es kiv. Gleiches Eis, anderer Klang.“ | 3 Stufen |
| Was kommt als Nächstes? | Kraft | Roman der Woche: gestern das Ende zeigen, Vermutung (auch nur im Kopf), nach dem Lesen auflösen | – |
| Türsteherfrage | Kraft | das Tagesrätsel von gestern (mit Antwortfeld) oder der Autor des Romans | – |
| Der Tag rückwärts | Kraft | ab 18 Uhr: drei Fragen vom Abend zum Morgen, je „Ich hab's“, nichts wird gespeichert, ruhigerer Hintergrund | – |
| Zeitgefühl | Beweglichkeit | morgens: Uhrzeit schätzen; Toleranz 30, 20, 10 Minuten je Stufe | 3 Stufen |
| Atemfenster | Ausdauer | vier geführte Atemzüge (4 s ein, 6 s aus), Hintergrund etwas dunkler, bei „weniger Bewegung“ ohne Animation; nie der erste Vorschlag des Tages | – |

**Warten auf eine Funktion** (im Paket mit `bedingung.funktion`, nicht gebaut): Sonnengruß-Kette (`bilderfolge`), Wo liegt es? und Nachbar-Namen (`tresor-fragen`), Rezept nur einmal (`kochbuch`), Weg im Kopf (`karte-offline`), Frag jemanden (`tagebuch`). Das Tagesrätsel bleibt ein eigenes Paket und meldet sein Ergebnis ins Spiel-Log (`quelle: "raetsel"`). Wichteln meldet eine ausgeloste Runde über `offline.spiel.melden`.

## Fünf Stufen, neue Inhalte, Lumi aus (seit 0.7.1)

Auftrag 2026-10-07-17, Grundlage `OFFLINE-Pause-Stufen.md` der Pause-Session (Abschnitte 2, 3 und 9).
- **Fünf Stufen je Form**, in der App nur als Wörter: leicht, gemütlich, mit Biss, knifflig, Knackpunkt (`WERTE.stufenWoerter`). Der Pilz behält zehn Stufen, je zwei sind ein Wort. Ab 14 beginnt jede Form auf „mit Biss“ (`zone.start`: 3 von 5, Pilz 5 von 10). In „Deine Linie“ stellt man die Stufe mit einem Wort, nie mit einer Zahl.
- **Höherstellen nur als Einladung** am Ende eines Happens: „Das ging dir leicht von der Hand. Magst du es kniffliger?“ mit „Ja, probier’s“, „Noch nicht“ und „So lassen“. Fällig nach fünf gelungenen Happen derselben Form (höchstens ein Tipp) oder zweimal „Zu leicht“; höchstens einmal am Tag, zwischen zwei Aufstiegen drei Tage und drei Happen, „So lassen“ ruht 30 Tage. Abstieg leise nach zweimal „Zu schwer“ oder drei Happen ohne Gelingen, nicht unter Stufe 2.
- **Neue Inhalte:** Geschichten für den eingebauten Fehler auf fünf Stufen, je 30 Varianten für den Tag rückwärts und das Atemfenster (einen Monat lang keine zweimal), Lumisch-Aufgaben in fünf Stufen (Paket `lumisch`), drei neue Formen: **Kaffeehaus-Logik** (Auswahl, dann die Erklärung), **Kopfnuss** (eine Zahl eintippen, ein Tipp auf Wunsch, zwei Versuche, dann der Weg), **Ein Gedanke am Fluss** (drei Schritte zum Nachdenken, kein Richtig und Falsch, nichts gespeichert).
- **Lumi aus** (ohne Figur, also auch „Aus mit Textkarten“): keine Form Lumisch, keine Geschichte mit der Lumi, bei den Ruhe-Varianten und beim Gedanken am Fluss kein Lumisch-Satz und, wo vorhanden, der Ersatztext.
- **Keine Zahlen über Leistung:** Zeitgefühl zeigt die echte Uhrzeit und ein Wort („Fast auf den Punkt.“, „Ein Stück zu früh.“, „Ein Stück zu spät.“), Toleranz je Stufe 30, 20, 10, 5, 2 Minuten. Der Pilz endet mit einem Satz ohne Zahl, der Rückspiegel ohne Millisekunden. Das Feld `intern.trainiert` der Inhalte zeigt die App nie.

## Spiele aus Modulen (seit 0.6.5, Spielpaket 1)

Ein Modul mit `"bereich": "pause"` bringt eigene Formen mit (`inhalt/pause-formen.json`, Format `pauseFormenFehler` in `paket-kit/pause-format.mjs`). Das erste ist `spiele-1`, „Rätsel zum Knobeln“: Lichter, Netz, Muster, Brücken, Minen, Sudoku (Simon Tatham, MIT) und 2048 (Gabriele Cirulli, MIT). Nur in der Desktop-App, weil der Web-Prototyp keine Module annimmt.

- **Einbau:** `pauseDaten()` hängt die Formen aktiver Module an die Formen des Pakets `pause` (`modulFormen` in `web/pause.js`). Sie stehen im Raum, in „Deine Linie“ und beim Dirigenten wie jede andere Form (Gruppe `raetsel` bzw. `spiel`).
- **Im Happen:** `modulHappen` (`web/pause-happen.js`) öffnet das Modul im Rahmen des Happens in der Sandbox. In der Adresse stehen Spiel, Stufe, Datum, das wievielte Spiel heute (`spielNummerHeute`) und die Farben des Skins. Am Ende meldet das Modul über `offline.spiel.melden` „gelöst“ oder „offen“; der Happen schreibt es mit `quelle: "pause"` ins Spiel-Log (nichts doppelt) und zeigt den Satz aus dem Paket. Die Lumi bleibt still. ✕ schließt Happen und Rahmen.
- **Stufen:** je drei. Tatham: die eingebauten Schwierigkeiten in Handygröße (Lichter 7 × 7 leicht/mittel/schwer, Netz 5 × 5/7 × 7/9 × 9, Muster 5 × 5/10 × 10/15 × 15, Brücken 7 × 7 leicht/mittel/schwer, Minen 9 × 9 mit 10 oder 35, 16 × 16 mit 40, Sudoku leicht/mittel/schwer). 2048: Ziel 512, 1024, 2048. Ab 14 Stufe 2. Gelöst zählt als Treffer (1 von 1), „Auflösen“, „Aufhören“ und verloren als 0; die Zone stellt nach wie bei den anderen Formen.
- **Tagesrätsel:** Startwert aus Datum, Spiel, Stufe und Nummer des Spiels am Tag. Das erste Spiel des Tages ist für alle gleich, auch ohne Netz (`werkzeug/spiele-probe.mjs`). Bei Minen hängt die Lage zusätzlich vom ersten Tipp ab.
- **Bedienung am Handy:** Umschalter für die zweite Taste („Punkt setzen“, „Rechtsherum“, „Leer markieren“, „Fahne setzen“; bei Minen setzt auch ein langer Druck die Fahne), Ziffernleiste für Sudoku, Wischen und Pfeiltasten bei 2048. Zurück, Von vorn, Auflösen bzw. Aufhören.
- **Ohne Hebel:** keine Töne, keine Effekte beim Gewinnen, das Wort „Training“ kommt nicht vor. Die Punkte von 2048 sind nur während der Runde zu sehen, werden nicht gespeichert und nicht verglichen.
- **Aus der Bibliothek geöffnet** (ohne Rahmen der App): Auswahl der Spiele, darüber Name und Anleitung des gewählten Spiels; die Farben des Skins gibt die App auch hier mit.
- **Dauer:** Rätsel dürfen länger dauern als die Happen der App (bis 15 Minuten); der Raum zeigt die Dauer.

## Der Dirigent (Regeln, ohne KI, ohne Netz)

1. Nur Formen, die verfügbar sind (Funktion da, Altersband, Tageszeit, was sie braucht) und nicht mit „Nicht mehr“ ausgeschlossen. Nie zweimal dieselbe hintereinander, wenn es anders geht.
2. Ist eine **Auffrischung** fällig (Pilz nach etwa 11 und 35 Monaten ab dem ersten Spiel), kommt sie.
3. **Kennenlernen** (die ersten 21 Tage): das am wenigsten Gespielte, viel Abwechslung.
4. Danach **Mischung**: rund 65 % Vertrautes (mindestens zweimal gespielt, gemocht), 25 % Verwandtes (gleiche Trainingsart), 10 % Neues; der Regler „Vertraut ↔ Neues“ verschiebt bis zu 15 Prozentpunkte.
5. Innerhalb der Gruppe nach Gewicht (Bewertungen), Tendenz des Lebensabschnitts (Faktor je Art oder Gruppe), **Wochenausgleich** (Arten, die diese Woche fehlen, ×1,5 – nur in Formen, die nicht abgelehnt sind) und den Antworten auf Rückfragen.
- **Zone 2:** liegt die Trefferquote der letzten drei Happen einer Form über 85 %, eine Stufe schwerer, unter 75 % leichter. „Zu leicht · Genau richtig · Zu schwer“ (höchstens bei jedem fünften Happen) stellt direkt.
- **Rückfragen:** höchstens eine am Tag im Kennenlernen, danach eine je Woche; drei Fragen (schneller/ruhiger, Wörter/Zahlen, Tageszeit), jede nur einmal, überspringbar.

## Deine Linie (`#linie`)

Erreichbar aus dem Raum „Pause“. Zeigt in Balken, was gemocht wird, die ausgeschlossenen Formen (Zurückholen), die Stufe je Form mit „leichter“/„schwerer“, den Wochensatz („Ich achte darauf, dass …“), die vorgemerkten Auffrischungen, die Antworten, die Einstellungen (Alter, Appetit, Vertraut ↔ Neues), „So sehe ich dich“ nach dem Kennenlernen, die Info zur Wirkung (nur die erlaubten Sätze) und „Linie zurücksetzen“ / „Spiel-Log löschen“. Der **Rückspiegel** kommt höchstens einmal im Monat als ruhige Karte auf der Tagesseite, in Worten, ohne Punkte. Er spricht nur über **Fortschritt** (Pilz, Lumisch). Gibt es keinen, nennt er höchstens die Lieblingsformen des Monats ohne Zahl („Diesen Monat warst du am liebsten beim Pilz und beim Atemfenster.“, Feld `beim` je Form); sonst kommt keine Karte. Er zählt nie Tage oder Besuche (seit 0.4.1, Test in `web/pause.test.mjs`).

## Milde Zugkraft: die fünf Prüffragen je Form

| Form | Ende | Leben | Ruhige Stunde | Ohne Hebel | Sichtbar |
|---|---|---|---|---|---|
| Pilz | 3 bis 5 Runden, dann Satz und Ende | Mitnehmen; Tempo üben ohne Versprechen | ja: kurz, freiwillig | kein Falsch-Ton, „Schau, so war's“, keine Punkte | Stufe und Zone in „Deine Linie“ |
| Eingebauter Fehler | eine Geschichte | Lesen und Hinhören | ja | Auflösung freundlich, nie rot | Gewicht, Stufe |
| Lumisch | ein Wort am Tag, eine Frage | Aufgabe für draußen („sag zan, wenn …“) | ja | kein Verlust, wenn man aussetzt | Gewicht, Stufe |
| Was kommt als Nächstes? | eine Vermutung oder eine Auflösung | lädt zum Lesen ein | ja | kein Richtig/Falsch | Gewicht |
| Türsteherfrage | eine Frage | Abrufen statt Nachschauen | ja | „Weiß ich nicht mehr“ ist ein Knopf | Gewicht |
| Tag rückwärts | drei Fragen | ruhiger Abend, nichts gespeichert | ja | einziger Happen nach Schluss, einmal, nie vor 18 Uhr | Gewicht |
| Zeitgefühl | eine Schätzung | Gefühl für die Zeit (Bunker) | ja | Abweichung nur leise | Stufe |
| Atemfenster | vier Atemzüge | Ruhe | ja | keine Wertung | Gewicht |

Für alle gilt: keine Serien, kein Push, keine Ranglisten, keine Optimierung auf Nutzungszeit, Bewertungen privat, Spiel-Log nur am Gerät.

## Bedienbarkeit

Der Happen ist ein Bereich (`role="region"`) mit Überschrift (Name der Form); der Fokus springt auf den Hauptknopf bzw. das erste Bedienelement, Escape = ✕. Alle Knöpfe mindestens 44 px hoch (die sichtbare Fläche ist kleiner), bei 360 px kein seitliches Überlaufen und der Hauptknopf ohne Scrollen erreichbar (geprüft für alle gebauten Formen bei 360 × 740 und 360 × 640). Texte sind Text (vorlesbar). Der Pilz ist ein Sehspiel; die Felder sind beschriftet („oben links“ …), das Blitzen selbst kann ein Bildschirmleser nicht ersetzen – wer nicht sieht, schließt die Form mit „Nicht mehr“ aus. Beim Öffnen des Happens eine ruhige Einblendung (0,22 s), bei „weniger Bewegung“ keine.

## Grenzen von Stufe 1

Kein KI-Planer, kein Netz (Stufe 2 nach Anwaltsfrage 34), kein Kopf-Fitnesstest, kein Gruppenmodus. Der Happen-Vorrat ist das Paket; ohne Paket kommt kein Happen. Die Zahlen in `web/pause-werte.js` sind Annahmen für die Testphase.
