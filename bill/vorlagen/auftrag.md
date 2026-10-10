# Auftrag: <kurzer Titel>

**Von:** Bill · **Datum:** JJJJ-MM-TT · **Dringlichkeit:** normal | hoch

## Ziel
Was am Ende da sein soll, in zwei bis drei Sätzen. Woran erkennt man, dass es fertig ist?

## Hintergrund
Warum. Verweise auf `docs/…`, frühere Rückmeldungen oder Chats.

## Umfang
- Was dazugehört
- Was ausdrücklich nicht dazugehört

## Dateien und Inhalte
Wenn der Auftrag Inhalte mitbringt (Tipps, Texte, Daten): hier vollständig oder als Pfad im Repo.

## Abnahme
Steht fest, bevor Code beginnt (Festlegung Mik/Bill, 10.10.2026).

Kommandos (Exit-Code 0, auf dem Auftragsbranch):
- `node --test …` (bestehende Tests, die das Gebiet berühren)
- neuer Test, der ohne die Änderung fehlschlägt
- `tests.yml` grün, Windows-Probe grün (`gh workflow run windows-probe.yml --ref <branch>`), wenn die App berührt ist

Muss (JA/NEIN):
- [ ] …
- [ ] …

Darf nicht (JA/NEIN, mindestens zwei):
- [ ] kein bestehender Test gelockert oder gelöscht
- [ ] keine neue Netzwerkverbindung, kein Code in Paketen
- [ ] …

Belege:
- Rückmeldung mit Commit und Links zu den CI-Läufen
- Bilder 360 px und breit, hell und dunkel, wenn etwas sichtbar wird
- Erklärung in höchstens zehn Zeilen, warum das Ziel erfüllt ist

Kandidaten: 1 | 3 (drei Varianten auf eigenen Branches, Mik wählt)

## Offene Fragen
Was Code selbst entscheiden darf, und was er fragen soll.
