# Rückmeldung: Lumisch auf geprüftem Stand, Hinweis im Lumi-Buch – ausgeliefert mit 0.5.3

**Von:** Code (lokale Session) · **Datum:** 2026-10-05 · **Auftrag:** `bill/erledigt/2026-10-05-lumisch-und-buchhinweis.md` (Nr. 2026-10-05-03) · **Branch:** `lumisch` · **Tag:** `v0.5.3`

## Ergebnis
- **App 0.5.3 ist ausgeliefert** (`app/latest.json`, 05.10.2026, 11:22 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux sind abrufbar (HTTP 200).
- **Web-Version 0.5.3 live** (geprüft).
- **Katalog** (erstellt 05.10.2026, 11:12 UTC, Signatur geprüft):

  | Paket | Version | app_min | sha256 des Manifests |
  |---|---|---|---|
  | pause | 2026.10.05 | 0.4.0 | `37745865b02879d1001e48cc14bb773079e8deb958c34db36d5aa81032e735b4` |
  | lumi-buch | 2026.10.05.1 | 0.5.0 | `fb622f2a5b795947b2576f634ed9b3631f43a37a548f1fc28fa2eb71696c798c` |

  - Die Web-Kopien stimmen mit beiden Prüfsummen überein (nach dem Neubau bei Vercel; kurz davor lieferte die Seite noch den alten Stand).
  - **Reiter „Inhalte“ unter Was ist neu:** `pause` zeigt „Lumisch: 401 Wörter, ein paar neue Namen. Alle Wörter sind geprüft, Eis heißt jetzt kiv.“, das Buch „Die Titelseite sagt nur noch: Eine erfundene Geschichte.“
  - **Ältere Apps:** Die Apps 0.4.x laden das neue Pause-Paket auch (`app_min` 0.4.0), übergehen das neue Feld `hinweis` und zeigen die neuen Wörter.
  - **Die Übernahme alter Spielstände (`kir` gilt als `kiv`) hat erst 0.5.3.** In älteren Apps gilt `kiv` als noch nicht gelernt; das betrifft nur Tag 6. Wer auf 0.5.3 geht, ist wieder vollständig.

## 1. Lumisch im Paket `pause`
- **Quelle:** Die Beilage liegt unverändert in `pakete/pause/quelle/OFFLINE-Lumisch-Woerterbuch-2026-10-05.md`. `node pakete/pause/lumisch-umwandeln.mjs` liest sie und schreibt Plan und Wörterbuch neu in `inhalt/pause.json`; der Rest des Pakets bleibt.
- **Plan:** genau Abschnitt 8.
  - Tag 3: `pelu` = „Essen“, „Beim nächsten Essen sagst du pelu.“
  - Tag 6: `kiv`, „Was ist heute kiv? Der Kühlschrank, das Fenster?“
  - Tag 7: „Wiederholungstag: zan, mo, pelu, tiv, orr, kiv, pim.“
  - Tag 21 hat jetzt den Wortlaut der Beilage: „Schreib einen eigenen Satz …“ statt „Bilde …“.
- **Wörterbuch:** alle 401 Wörter aus Abschnitt 6, je mit Gruppe (Überschrift ohne die Klammer, etwa „Farben“, „Denken: Wissen, Wahrheit, Sprache“), Deutsch und Hinweis.
  - Neue Wörter zeigen ihren Hinweis im Happen.
  - **Ein Beispiel** gibt es nur aus den Beispielsätzen der Beilage (Abschnitt 4): der erste Satz, in dem das Wort vorkommt. Das sind 37 Wörter.
  - Die Hinweise sind wörtlich übernommen, nur ohne die Klammern „(Bis 05.10.2026: …)“; sonst stünden die alten Wörter wieder im Paket.
  - **Reihenfolge für neue Wörter nach Tag 21:**
    - zuerst die fünf Gruppen „Unten“, dann „Wie etwas ist“, „Farben“, „Gefühle und Gedanken“
    - danach „Kleine Wörter“, „Zahlen“ und die vier Gruppen „Oben“
    - am Ende die fünf Philosophie-Gruppen und zuletzt „Zahl und Quant“
    - Meine Entscheidung: wo „Kleine Wörter“, „Zahlen“ und „Oben“ stehen; der Auftrag legt nur Anfang und Ende fest.
  - Auch die Ablenkwörter der Abfrage kommen jetzt aus allen 401 Wörtern.
- **Ersetzte Wörter:**
  - Die zehn alten Wörter stehen nur noch an einer Stelle, der Zuordnung `LUMISCH_ALT` in `web/pause.js`; ohne sie könnte die App alte Spielstände nicht lesen.
  - Ein Test sucht sie in allen Dateien von App und Paketen, auch in den Tests. Die Tests holen die alten Wörter selbst aus dieser Zuordnung.
  - Nicht durchsucht werden die Beilage und die Kartenbibliothek: Dort steht „mumu“ als Teil von Programmcode, nicht als Lumisch.
  - „lim“ ist als Zahlzeichen „-“ im Hinweis eingetragen.
- **Wer `kir` gelernt hat:**
  - Im Spiel-Log gilt `kir` als `kiv`. Für die Wiederholung zählt das Wort als gelernt; war es zuletzt falsch, kommt `kiv` zur Wiederholung dran.
  - Die Karte „Neu heißt es kiv. Gleiches Eis, anderer Klang.“ erscheint einmal oben im nächsten Lumisch-Happen, danach nie wieder (gemerkt am Gerät).
  - Für die anderen neun Wörter gilt dasselbe mit „Neu heißt es …“. Gelernt haben kann sie aber noch niemand, weil sie weder im Plan noch unter den neuen Wörtern bis heute vorkamen.
  - Im Browser mit einem nachgestellten Spielstand geprüft: Die Karte steht beim ersten Mal da, beim zweiten nicht mehr.
- **Tests** (`web/pause.test.mjs`, drei neue):
  - Das Paket stimmt mit der Beilage überein: 401 Wörter, Wort und Deutsch gleich, keine Doppelten, keines der alten Wörter, Plan der Tage 3, 6 und 7, Reihenfolge der Gruppen.
  - Kein altes Wort steht irgendwo.
  - Wer `kir` gelernt hat, verliert nichts; die Karte kommt genau einmal.
  - Das Kit prüft jetzt auch die Länge des Hinweises.

## 2. Hinweis im Lumi-Buch
- `hinweis` ist jetzt „Eine erfundene Geschichte.“ und sonst nichts.
- Der Text der Kapitel ist unverändert, auch die Kapitel 9 und 11.
- Neue Ausgabe `lumi-buch` 2026.10.05.1.

## 3. Zur Kenntnis
Ich baue nichts für „Info und Hilfe“ auf den sieben Seiten, bis deine Texte kommen. Notfall bleibt ohne.

## Bild
`bilder/2026-10-05-lumisch-neu-heisst-es-kiv-360.jpg`: Lumisch-Happen Tag 7 mit der Karte „Neu heißt es kiv. Gleiches Eis, anderer Klang.“ und der Abfrage „Was heißt pelu?“ (Essen).

## Geprüft
- **Tests:**
  - Web: 94 von 94. Neu sind drei Lumisch-Tests.
  - Werkzeug und Kit: 33 von 33. `pause` und `lumi-buch` ohne Fehler.
- **CI (Lauf `37299689798`):** Die Tests laufen grün unter Linux, macOS und Windows, dazu Kern und Modul-Sandbox.
- **Windows-Probe (`37299689227`):** grün beim ersten Lauf, 48 von 48 Angriffe blockiert, „Updates & Abo“ in Ordnung. Danach kam nur ein Bild dazu.
- **Release-Build `37301440005`:** alle vier Plattformen und das Veröffentlichen sind grün.

## Vorrat
Der Vorrat reicht bis 31. Jänner 2027, 118 Tage ab heute. Die 45-Tage-Grenze wird am 17. Dezember erreicht.
