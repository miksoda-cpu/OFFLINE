# Rückmeldung: Tagespaket Dezember, Tipp-Korrektur, „Was ist neu“ – ausgeliefert mit 0.3.1

**Von:** Code (lokale Session) · **Datum:** 2026-09-30 · **Aufträge:** `bill/erledigt/2026-09-30-dezember-und-tippfix.md`, `bill/erledigt/2026-09-30-was-ist-neu.md` · **Branch:** `dezember` · **Tag:** `v0.3.1`

## Ergebnis
- **App 0.3.1 ist ausgeliefert** (`app/latest.json`, 30.09.2026, 17:35 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux sind abrufbar (HTTP 200).
- **Web-Version 0.3.1** mit „Was ist neu“ und dem Dezemberpaket, gespiegelt über den Workflow „Web-Version“. Die gespiegelten Manifeste stimmen mit dem Katalog überein.
- **Katalog** (erstellt 30.09.2026, 17:04 UTC, Signatur geprüft). Neu sind `tage-2026-12` und `wir`, alle anderen Einträge sind unverändert:

| Paket | Version | Bereich | app_min | sha256 des Manifests |
|---|---|---|---|---|
| tage-2026-12 | 2026.09.30 | 01.12. bis 31.12.2026 | 0.3.0 | `f26aea1467b3f6571f3b173e6c7d65e6167006a77c6c1e7c7e5f22aff2dffb40` |
| wir | 2026.09.30 (vorher 2026.09.29.1) | – | 0.2.0 | `05bb4ce84f7c313ed2ba278e5e5f7e7562626e1ad08d685d7f1b4a5498110e92` |

  - `tage-2026-10` (`28c450cd…aea6a`) und `tage-2026-11` (`1756f586…07ca0`) sind unverändert.
  - Hochgeladen wurden die Pakete in zwei Läufen von „Inhaltspakete“ mit `nur=tage-2026-12` und `nur=wir`, wie im Auftrag nur das Dezemberpaket.

## 1. Tagespaket Dezember 2026 (`tage-2026-12`)
- **31 neue Rätsel** (`r-101` bis `r-131`), eigene Texte, Lösungen nachgerechnet.
  - Maschinell geprüft: keine Frage und keine Lösung aus Oktober oder November wiederholt sich.
  - Advent- und Winterstoffe (Adventkranz, Kipferl, Sternsinger, Sanduhr für Tee, Silvesterglocke).
  - Vom 24. bis 31. Dezember nur leichte Rätsel.
- **Vier Lesewochen im Advent,** alle deutsch im Original, alle auf Wikisource im Stand „fertig“, mit Scans. Herkunft je Text in `inhalt/herkunft.md`:

| Woche ab | Werk | Autor († Jahr) | Vorlage | Tage |
|---|---|---|---|---|
| Mo 7.12. | Das kalte Herz (beide Abteilungen) | Wilhelm Hauff († 1827) | W. Hauffs Werke Bd. IV, hrsg. von Max Mendheim, Bibliographisches Institut, Leipzig/Wien 1891–1909 | 7 |
| Mo 14.12. | Immensee (mit dem Weihnachtsabend im Kapitel „Da stand das Kind am Wege“) | Theodor Storm († 1888) | Sommergeschichten und Lieder, Duncker, Berlin 1851 | 7, kapitelweise |
| Mo 21.12. | Wintermärchen, eines pro Tag: Die drei Männlein im Walde, Frau Holle, Schneeweißchen und Rosenroth, Die Sternthaler (24.12.), Die Wichtelmänner, Das Hirtenbüblein, Der goldene Schlüssel | Brüder Grimm († 1859 und 1863) | Kinder- und Haus-Märchen, 7. Auflage (Ausgabe letzter Hand), Dieterich, Göttingen 1857 | 7 |
| Mo 28.12. | Kalendergeschichten: Kannitverstan, Unverhoftes Wiedersehen, Der kluge Richter, Allgemeine Betrachtung über das Weltgebäude | Johann Peter Hebel († 1826) | Schatzkästlein des rheinischen Hausfreundes, Cotta, Tübingen 1811 | 4 (28. bis 31.12.) |

  - **Ab 24. Dezember kurz:** 301, 1.064, 314, 167, 849, 763, 448 und 282 Wörter. Davor im Advent 1.100 bis 2.300 Wörter pro Tag.
  - **Hauff:** Die Ausgabe hat einen Herausgeber. Der Schutz einer wissenschaftlichen Ausgabe endet 25 Jahre nach Erscheinen, spätestens 1934, sie ist also frei. Die Rahmenhandlung des „Wirtshauses im Spessart“ auf den Wikisource-Seiten ist abgeschnitten, es bleibt nur das Märchen.
  - **1. bis 6. Dezember** haben nur Rätsel, weil die Woche des 30. November schon zum veröffentlichten Novemberpaket gehört.
  - **Silvester endet am 31.12. mit der Hebel-Sammlung.** Eine Woche, die über den Jahreswechsel liefe, würde ins Jännerpaket reichen.
- **Nicht aufgenommen, weil keine geprüfte Ausgabe:**
  - Stifter „Bergkristall“, Storm „Unter dem Tannenbaum“ und E. T. A. Hoffmann „Nußknacker und Mausekönig“: Auf Wikisource stehen sie nur als Verweis auf Scans, nicht als fertige Transkription.
  - Rosegger: Weihnachtsgeschichten finden sich auf Wikisource keine.
  - **Deutsches Textarchiv:** Es hätte „Bunte Steine“ von 1853 wissenschaftlich transkribiert. Die Seite verlangt aber einen Browser-Nachweis per Skript (Bot-Sperre), den ich nicht umgehe.
  - Wer „Bergkristall“ im Paket will, kann den Text dort von Hand holen. Er steht dann unter CC BY-SA mit Nennung des DTA.
- **Werkzeuge:**
  - `werkzeug/wikisource-holen.mjs` kann jetzt Sammelbände (Kopf „Navigation2“) und Fußnoten. Bei Drosselung durch Wikisource wartet es höflich.
  - `pakete/tage/bauen.mjs` kann Werke aus mehreren Seiten und Sammlungen mit einem Text pro Tag. Oktober und November bleiben bytegleich, verglichen gegen den veröffentlichten Stand.

## 2. Tipp `alltag-020` und die Durchsicht aller 176 Tipps
- **`alltag-020`** heißt jetzt „Euer Treffpunkt steht. Weiß ihn wirklich die ganze Familie? Frag heute Abend. Ohne Anlass.“ Er kommt nur noch, wenn der Treffpunkt in der Bereit-Anzeige bestätigt ist. Die App kennt den Treffpunkt als Bestätigung, nicht als Eintrag im Tresor, deshalb steht im Text kein Tresor mehr.
- **Vier weitere Tipps behaupten einen Zustand, den die App kennt.** Sie kommen jetzt nur noch, wenn er stimmt (`pakete/wir/tipps-umwandeln.mjs`, Tabelle `ZUSTAND`):
  - `alltag-001` „Dein Wasser ist neun Monate alt.“: nur, wenn das Wasser seit mindestens neun Monaten bestätigt ist.
  - `alltag-002` „Du hast noch keinen Treffpunkt eingetragen.“: nur, wenn der Treffpunkt noch nie bestätigt wurde. Dafür gibt es das neue Bedingungswort `offen`. Ältere Apps kennen es nicht und lassen den Tipp deshalb weg.
  - `alltag-026` „Dein Score fällt gerade, weil das Wasser abläuft.“: nur, wenn etwas verfallen ist und das Wasser älter als zwölf Monate ist.
  - `alltag-028` „Der Probeabend war vor sechs Monaten.“: nur, wenn er vor mindestens sechs Monaten bestätigt wurde.
- **Zustand behauptet, den die App nicht kennen kann.** Unverändert, Vorschlag für Bill:

| Tipp | Text (Anfang) | Vorschlag |
|---|---|---|
| `laune-006` | „Du hast heute dreimal die Kühlschranktür aufgemacht …“ | allgemein formulieren („Wer im Blackout dreimal die Kühlschranktür aufmacht …“) |
| `laune-010` | Wortlaut in Beilage A2 | nur nach einer Namensänderung; die App merkt sich frühere Namen nicht, sonst streichen |
| `laune-015` | „Du hast heute noch nichts bestätigt.“ | Die App weiß das nicht je Tag; umformulieren oder eine Bedingung „heute nichts bestätigt“ bauen |
| `alltag-039` | „… die Nachbarin, die noch bei sieben ist.“ | behauptet den Stand einer Nachbarin; allgemein formulieren |
| `alltag-004` | Wortlaut in Beilage A3 | liest sich als Tatsache; als Wunsch formulieren („Wenn zwei Nachbarn eingetragen sind …“) |

- **Punktzahlen aus der alten Bereit-Rechnung stimmen seit 0.2.0 nicht mehr:** `alltag-001` („acht Punkte“), `alltag-003` („zehn Punkte“), `alltag-014` („Fünf Punkte“). Vorschlag: Die Punkte streichen oder durch „hebt deine Zahl“ ersetzen.
- **Funktionen, die es in der App (noch) nicht gibt:**
  - `app-002` Wischen nach links
  - `app-003` Knopf „Was ist los?“
  - `app-006` Briefe, die sich öffnen
  - `app-014` Kalender
  - `app-015` und `app-033` „Wohin“
  - `app-016` Tagebuch
  - `app-017` und `app-018` Schließfach
  - `app-019` Kontrast-Skin (nicht veröffentlicht)
  - `app-024` Familiennachricht
  - `app-026` Offline-Stunde
  - `app-028` und `app-029` Mesh-Puls, Fernschach
  - `alltag-023` Zettel für die Stiegentür drucken

  Nicht mehr genau stimmen:
  - `app-005`: Der Vorrat steht unten, und die App lädt nach Vorratstiefe, nicht „unter sieben“.
  - `app-010`: Der Sparmodus blendet nur Bilder der Tagesseite aus, einen Vorschlag im Blackout gibt es nicht.
  - `app-020`: Vorlesen gibt es beim Kapitel, nicht bei jedem Text.

  Vorschlag: Diese Tipps mit einer Bedingung ausblenden, bis die Funktion da ist, oder umformulieren. Die Entscheidung liegt bei Bill, ich habe hier nichts geändert.
- Paket `wir` 2026.09.30 mit den Korrekturen: `aenderungen` „Korrektur: Der Tipp zum Treffpunkt kommt nur noch, wenn ein Treffpunkt ausgemacht ist. …“

## 3. „Was ist neu“
- **Knopf:** unten in der Box „App-Update“ („Updates & Abo“). In der Web-Version gibt es dafür eine kleine Box „App-Update“ mit der Versionsnummer.
- **Seite:** „Was ist neu“ mit 0.3.1, 0.3.0, 0.2.1, 0.2.0 und den ersten Versionen 0.1.x zusammengefasst. Neueste oben, Datum, drei bis sechs Punkte in Alltagssprache.
- **Quelle:** `web/neues.json`, kommt mit der App und ist ohne Netz lesbar. In der Web-Version ist sie im Offline-Speicher. `docs/CHANGELOG.md` bleibt die technische Fassung.
- **Kein Aufdrängen:** Nichts geht von selbst auf. Ein roter Punkt am Knopf bleibt, bis man die Seite zur aktuellen Version geöffnet hat.
- **Fester Schritt:**
  - `bill/README.md` hat im Ablauf den Schritt „Vor jedem Tag: Eintrag in `web/neues.json`“.
  - Der Test `web/neues.test.mjs` schlägt fehl, wenn der Eintrag zur aktuellen Version fehlt oder die drei Versionsangaben (App, Tauri, Cargo) nicht übereinstimmen. Die Gegenprobe ist gemacht.
  - Er prüft außerdem Sprache: keine Dateinamen, keine Wörter aus der Werkstatt.
- Die Karte mit den Paketänderungen auf „Updates & Abo“ hieß bisher auch „Was ist neu?“. Sie heißt jetzt „Neu in den Paketen“.

## Geprüft
- **Tests:**
  - Werkzeug und Paket-Kit: 33 von 33.
  - Web: 43 von 43. Neu sind `web/neues.test.mjs`, der Dezember-Fall in `web/tag.test.mjs` (31 Rätsel ohne Wiederholung, Werke beginnen am Montag, ab 24.12. leicht und höchstens 1.100 Wörter) und der Fall für Zustands-Tipps und `offen` in `web/wesen.test.mjs`.
  - Rust-Kern ist grün.
- **CI (Lauf `36719383442`):** Die Tests laufen grün unter Linux, macOS und Windows (App-Berechtigungen).
- **Windows-Probe (Lauf `36719388988`):** grün.
  - Update von 0.1.8 auf 0.3.1.
  - Die Sandbox hält 42 von 42 Angriffen ab.
  - Wichteln und Tagesseite laufen.
  - Neu geprüft: Die Seite „Was ist neu“ zeigt „Version 0.3.1“ oben.
- **Release-Build `36751613646`:** alle vier Plattformen und das Veröffentlichen sind grün.
- **Test-App (macOS):** Der Knopf „Was ist neu“ steht in der Box App-Update. Die Seite zeigt „Du hast Version 0.3.1“ und alle Einträge.
- **Web bei 360 px:** Der Knopf ist 44 px hoch. Der Punkt ist da und verschwindet nach dem Öffnen. Nichts läuft seitlich über.

## Hinweise
- Die offenen Tipps aus Abschnitt 2 brauchen eine Entscheidung von Bill: umformulieren, an eine Bedingung binden oder streichen.
- **Jänner:** Das nächste Tagespaket `tage-2027-01` sollte bis Ende November oben sein. Sonst lädt eine App mit 30 Tagen Vorrat ab 2. Dezember nicht mehr voll vor. Der Baukasten ist fertig.
