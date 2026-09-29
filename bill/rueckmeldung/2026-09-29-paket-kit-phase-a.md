# Rückmeldung: Paket-Kit-Werkzeug, Phase A (Werkzeug)

**Von:** Code (lokale Session) · **Datum:** 2026-09-29 · **Auftrag:** `bill/todo/2026-09-29-paket-kit-werkzeug.md` · **Commit:** `d8386e4`

## Ergebnis
- **`paket-kit/pruefen.mjs` ist jetzt auch ein Modul** (`pruefeQuellordner(ordner, { vorher, bericht })`). Auf der Kommandozeile verhält es sich wie bisher, neu ist `--kein-bericht`. `werkzeug/paket-lib.mjs` und `werkzeug/test.mjs` nutzen es direkt.
- **Nachtrag umgesetzt:**
  - `quellen[].id` ist Pflicht, `[a-z0-9-]` und eindeutig. Jeder Wert `quelle` in den Inhalts-JSONs muss eine `id` treffen, sonst ist das ein Fehler.
  - Notrufhinweis: Das Feld `notruf: { frage: "Ist jemand in Gefahr?", nummer: "144" }` ist Pflicht bei Anleitungen mit `typ` `guide` oder `nachschlage-guide` in Paketen der Kategorie `ernstfall` und bei jedem Inhalt mit `notfall: true`. Fehlt es, ist das ein Fehler. Die Erkennungsregel steht jetzt in `docs/PAKET-KIT.md` Regel 4.5.
- **Zusätzlich aus `SICHERHEIT.md`:**
  - Skripte (`.js`, `.mjs`, `<script>`, `on…=`, `javascript:`) sind nur bei `art = modul` und nur unter `inhalt/modul/` erlaubt, sonst ist das ein Fehler.
  - Module brauchen `pruefstatus: redaktion`.
- **`werkzeug/paket.mjs bauen`:** Übernimmt `preis`, `pruefstatus`, `kategorie`, `alter_ab`, `abnahme` und bei Modulen `datenversion` ins Manifest. Das Format bleibt 1, weil Kern und Web-Client unbekannte Felder ignorieren. Der Katalog trägt `preis`, `pruefstatus`, `kategorie` und `alter_ab` mit. Module laufen beim Bauen immer durch das Prüfprogramm und werden bei Fehlern nicht gebaut; mit `--pruefen` gilt das für jedes Paket. Die Felder stehen in `docs/PAKETFORMAT.md` 2.1.
- **Beispiel und Vorlage:** Wichteln hat `quellen[0].id = "eigen"`, die Vorlage ein leeres `id`-Feld. Der Prüfbericht von Wichteln ist neu erzeugt und grün.
- **`at-basis`:** `kategorie: ernstfall`, `alter_ab: 0`. **`wir`:** `kategorie: miteinander`, `alter_ab: 0`. Beide nur in der Quelle, nicht gebaut.
- **`paket-kit/PFLICHTENHEFT.md` ist jetzt wortgleich mit `docs/PAKET-KIT.md`.** Das Ablaufdiagramm aus der Kit-Fassung ist dabei nach `docs/` gewandert. Ein Test hält beide gleich.

## Geprüft
- `node --test werkzeug/test.mjs`: 17 von 17 grün (Node 24). 9 davon sind neu:
  - Wichteln grün, und die Vorlage meldet nur „fehlt“.
  - `quellen`-id, Quellenverweise, Notrufhinweis (drei Fälle), Code außerhalb von Modulen, Update mit `--vorher`.
  - Der ganze Weg aus Abschnitt 9 (prüfen, ablegen, bauen, Manifest-Felder, Katalog) und `bauen --pruefen` mit Fehler.
  - Pflichtenheft wortgleich.

## Abweichungen
- **CI:** Die neue Datei `.github/workflows/tests.yml` (Node-Tests, Kit gegen Beispiel und Vorlage, `cargo test` bei jedem Push) konnte ich **nicht pushen**. Dem GitHub-Zugang auf Miks Mac fehlt das Recht `workflow`. Sie liegt fertig im Arbeitsordner. Bis dahin laufen die neuen Tests in der CI nur im Job „Kern-Tests“ von `desktop.yml`, und der startet nur bei Tags oder von Hand. Mik kann das Recht mit `gh auth refresh -h github.com -s workflow` ergänzen, dann pushe ich die Datei nach.
- Die Test-Abnahme von Abschnitt 9 läuft mit einem Testschlüssel in einem Temp-Ordner. `alles-bauen.sh` lokal braucht den Entwicklungsschlüssel, und der liegt nicht auf diesem Mac.

## Nicht gemacht
- `art = modul` ist im Paketformat (`werkzeug/kern.mjs`, Rust-Kern) noch nicht erlaubt. Das kommt in Phase B zusammen mit der Schlüsselregel, damit es nie ohne sie gilt.
- `at-basis` und `wir` bestehen das Kit noch nicht: Es fehlen LIESMICH, Slideshow und Quellen-`id`. Das ist kein Teil dieses Auftrags.

## Fragen an Bill
Keine. Vor Phase B frage ich Mik nach dem Ablageort des Redaktionsschlüssels und nach der Rust-Werkzeugkette auf dem Mac.
