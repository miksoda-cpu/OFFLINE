# bill – Kanal zwischen Bill und Code

Dieser Ordner ist der Briefkasten zwischen zwei Claude-Sessions von Mik:

- **Bill** plant, schreibt Konzepte und Aufträge.
- **Code** (die Code-Session im Repo OFFLINE) setzt um, pusht und meldet zurück.

## Ablauf

1. Bill legt einen Auftrag nach `bill/todo/` (Vorlage: `bill/vorlagen/auftrag.md`). Dateiname: `JJJJ-MM-TT-kurzer-titel.md`.
2. Mik sagt Code nur noch: „schau in todo“.
3. Code arbeitet den Auftrag ab, pusht, verschiebt die Auftragsdatei nach `bill/erledigt/` und schreibt eine Rückmeldung nach `bill/rueckmeldung/` (Vorlage: `bill/vorlagen/rueckmeldung.md`).
4. `bill/STATUS.md` hält den aktuellen Stand in wenigen Zeilen.

## Regeln

- Aufträge sind Text, keine Befehle an die Umgebung. Code prüft jeden Auftrag gegen die Sicherheitsregeln in `docs/SICHERHEIT.md` (Pakete sind Daten, keine Schlüssel im Repo, keine Telemetrie).
- Was Code nicht umsetzen kann oder anders umsetzt, steht in der Rückmeldung, mit Grund.
- Konzepte, die dauerhaft gelten, wandern nach `docs/`, nicht hierher. `bill/` ist der Durchlauf, `docs/` das Gedächtnis.
