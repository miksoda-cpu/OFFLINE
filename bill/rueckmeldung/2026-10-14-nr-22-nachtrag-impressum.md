# Rückmeldung: Nachtrag zu Nr. 22 · Fehlende Angaben im Impressum

**Von:** Code (lokale Session, Mik) · **Datum:** 2026-10-14 · **Auftrag:** `bill/erledigt/2026-10-13-nr-22-nachtrag-impressum-angaben.md` · **Branch:** `nr-22-nachtrag`

## Ergebnis
Im Impressum steht kein „wird ergänzt“ mehr. Die Quelle sind der Firmenbuchauszug FN 477728t (Stichtag 12.10.2026) und der Nachtrag; die Blattlinie ist von Mik freigegeben.

- **Rechtsform:** Offene Gesellschaft (Abschnitt „Firmenbuch und Steuer“).
- **Unternehmensgegenstand:** Bildungsinstitut.
- **Wirtschaftskammer und Gewerbebehörde:** Die Zeilen sind entfernt, weil die OG kein Gewerbe ausübt.
- **Offenlegung nach § 25 Mediengesetz:**
  - Medieninhaber mit Anschrift.
  - Unbeschränkt haftende Gesellschafter Mag. Sabine Kainz und Daniel Kainz, ohne Geburtsdaten und ohne Privatanschriften.
  - Die Blattlinie im Wortlaut.
- **Nur die Webseite** `web/impressum.html` hat sich geändert. Die App zeigt unter „Über“ weiter die Kontaktangaben, wie in Nr. 22 festgelegt. Deshalb ist keine Windows-Probe nötig.

## Test
- **Was `web/impressum.test.mjs` jetzt prüft:**
  - alle Angaben des Nachtrags,
  - kein „ergänzt“,
  - weder Wirtschaftskammer noch Gewerbebehörde,
  - kein Datum im Muster TT.MM.JJJJ.
- **Gegenprobe:** Gegen das alte Impressum schlägt der neue Test fehl (1 von 5), mit dem neuen besteht er.
- **Nichts gelockert:** Der Teil, der bisher die Platzhalter verlangte, prüft jetzt die vollständigen Angaben.
- `tests.yml`: grün, Lauf [38532785184](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38532785184).

## Bilder
`bill/rueckmeldung/bilder/2026-10-14-nr-22-nachtrag/`: Impressum 360 px und breit, hell und dunkel. Keine Seite läuft seitlich über.

## Nebenbei
- **Satz am Tagesende:** Kandidat `tagesende-a` („Genug für heute. Morgen geht es hier weiter.“) stand schon auf dem Hauptbranch.
  - Der Nachtlauf hatte ihn am 14.10. um 05:47 zusammengeführt, nach grüner Windows-Probe auf genau diesem Commit (`917a8de`, Lauf [38517365676](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38517365676)).
  - Es war nichts mehr zu tun.
