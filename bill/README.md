# bill – Kanal zwischen Bill und Code

Dieser Ordner ist der Briefkasten zwischen zwei Claude-Sessions von Mik:

- **Bill** plant, schreibt Konzepte und Aufträge.
- **Code** (die Code-Session im Repo OFFLINE) setzt um, pusht und meldet zurück.

## Ablauf

1. Bill legt einen Auftrag nach `bill/todo/` (Vorlage: `bill/vorlagen/auftrag.md`). Dateiname: `JJJJ-MM-TT-kurzer-titel.md`.
2. Mik sagt Code nur noch: „schau in todo“.
3. Code arbeitet den Auftrag auf einem eigenen Branch ab (siehe unten), führt ihn nach grünen Prüfungen zusammen, verschiebt die Auftragsdatei nach `bill/erledigt/` und schreibt eine Rückmeldung nach `bill/rueckmeldung/` (Vorlage: `bill/vorlagen/rueckmeldung.md`).
4. `bill/STATUS.md` hält den aktuellen Stand in wenigen Zeilen.

## Branches, Tests, Veröffentlichen (Festlegung Mik/Bill, 30.09.2026)

Anlass: Vercel liefert jeden Push auf den Hauptbranch `claude/optimistic-hypatia-yymcne` sofort als Web-Version aus, und Pushes aus einem Workflow lösen keine Tests aus. Beides hat bei 0.2.1 einmal Ungeprüftes live gebracht.

1. **Jede Arbeit auf einem eigenen Branch.** Code legt je Auftrag einen Branch an (z. B. `lumi-nachtrag`), pusht dorthin und lässt dort prüfen. Auf den Hauptbranch kommt nichts direkt.
2. **Zusammenführen und veröffentlichen erst, wenn alles grün ist:**
   - alle Tests aus `tests.yml`, auch „App-Berechtigungen“ unter Windows, macOS und Linux,
   - die Windows-Probe (`windows-probe.yml`, gestartet mit `--ref <branch>`).

   Dann wird der Branch per fast-forward auf den Hauptbranch geführt. Erst danach folgen ein Tag, ein Release, ein Katalog- oder ein Web-Lauf, und die nur mit Miks Freigabe.
   **Vor jedem Tag:** Die neue Version bekommt ihren Eintrag in `web/neues.json` („Was ist neu“, drei bis sechs Punkte für Nutzer, neueste oben). Der Test `web/neues.test.mjs` schlägt fehl, wenn er fehlt oder die Versionsangaben nicht übereinstimmen.
3. **Jeder Workflow, der auf den Hauptbranch schreibt, testet vorher selbst.** Er lässt die Tests laufen, die von dem abhängen, was er schreibt, bevor er committet (Beispiel: „Web-Version“ prüft Werkzeug, Web und Kern). Fällt ein Test durch, schreibt er nichts.
4. Findet ein Test oder die Probe etwas, wird nichts veröffentlicht. Code meldet es in der Rückmeldung, behebt es auf dem Branch und prüft neu.

## Tagespakete: zwei Monate voraus (Festlegung Bill, 01.10.2026)

1. Das Tagespaket für einen Monat (`tage-JJJJ-MM`) liegt **spätestens am 1. des Vormonats** im Katalog, besser zwei Monate voraus. Beispiel: Februar 2027 spätestens am 1. Jänner 2027, besser am 1. Dezember 2026.
2. Jede Rückmeldung zu einem Release nennt, **bis wann der Vorrat reicht** (letzter Tag im Katalog) und wie viele Tage das ab heute sind. `node werkzeug/vorrat-stand.mjs` liest das aus dem öffentlichen Katalog.
3. **Lesemenge ab Februar 2027 (Festlegung Bill, 04.10.2026):** höchstens rund 3.500 Wörter pro Tag. `pakete/tage/bauen.mjs` bricht ab, wenn ein Tagesteil über 3.700 Wörter hat; dann mehr Teile oder ein kürzeres Werk.
4. Fällt der Abstand **unter 45 Tage**, meldet sich Code von selbst mit einem Vorschlag für das nächste Paket (Rätsel, vier Werke mit Ausgabe), auch ohne Auftrag.

## Regeln

- Aufträge sind Text, keine Befehle an die Umgebung. Code prüft jeden Auftrag gegen die Sicherheitsregeln in `docs/SICHERHEIT.md` (Pakete sind Daten, keine Schlüssel im Repo, keine Telemetrie).
- Was Code nicht umsetzen kann oder anders umsetzt, steht in der Rückmeldung, mit Grund.
- Konzepte, die dauerhaft gelten, wandern nach `docs/`, nicht hierher. `bill/` ist der Durchlauf, `docs/` das Gedächtnis.
