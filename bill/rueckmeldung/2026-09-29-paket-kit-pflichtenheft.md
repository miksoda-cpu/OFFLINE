# Rückmeldung: Paket-Kit-Pflichtenheft ins Repo, Stand ersetzen

**Von:** Code · **Datum:** 2026-09-29 · **Auftrag:** `bill/erledigt/2026-09-29-paket-kit-pflichtenheft-und-status.md`

## Ergebnis
- `docs/PAKET-KIT.md` angelegt, Wortlaut aus dem Auftrag. Zeile in der README-Tabelle.
- `bill/STATUS.md` durch Bills Fassung ersetzt; der Auftrag ist dort als erledigt eingetragen.
- Auftrag nach `bill/erledigt/` verschoben.

## Abweichungen
Keine am Inhalt. Eine Anmerkung zur Regel unten.

## Nicht gemacht
- `pruefen.mjs`, Vorlage für den Quellordner, Modul-Sandbox und `window.offline`: laut Auftrag nicht Teil davon. Ich habe die Dateien nicht; sie liegen in der Session, die sie gebaut hat. Mik entscheidet, ob er sie dort abholt oder ich das Prüfprogramm nach Abschnitt 8 neu schreibe. Beides ist machbar, das Prüfprogramm ist etwa ein Tag Arbeit, die Sandbox mehr (siehe unten).

## Geprüft
- Markdown gelesen, Tabellen in Ordnung. Keine Code-Änderung, keine Tests nötig.

## Anmerkung an Bill und Mik: `art = "modul"` bricht eine Sicherheitsregel
Bis heute galt, festgehalten in `docs/SICHERHEIT.md` und `docs/KONZEPT.md` 3b: **Pakete enthalten nie Code.** Ein Modul mit `index.html` und Skripten ist Code im Paketkanal. Das ist die Angriffsstelle, die wir bewusst zugemacht haben, und es berührt die Store-Regel (Apple erlaubt nachgeladenes JavaScript nur in einer Web-Ansicht und nur, wenn es den Zweck der App nicht ändert).

Ich halte Module trotzdem für machbar, wenn drei Dinge gelten, und die möchte ich vor dem Bau bestätigt haben:
1. **Harte Sandbox in der App:** iframe mit `sandbox` ohne `allow-same-origin`, eigene Content-Security-Policy ohne Netz, kein Zugriff auf Kern, Tresor, Dateien oder die Oberfläche der App. Alles läuft nur über `window.offline` per Nachrichten, und jede Nachricht wird von der App geprüft.
2. **Eigener Schlüssel und Prüfstatus:** Module werden nur mit einem Herausgeber-Schlüssel der Redaktion signiert, nie mit dem Katalogschlüssel, und tragen `pruefstatus: redaktion`. Community-Module gibt es nicht, bis Format 2 mit Herausgebersignaturen steht.
3. **Das Prüfprogramm ist Pflicht beim Einbau,** nicht nur bei der Abgabe, mit der Verbotsliste aus Abschnitt 5. Zusätzlich lehnt der Rust-Kern beim Installieren jedes `modul`-Paket ab, dessen Dateien außerhalb von `inhalt/modul/` Skripte enthalten.

Wenn das so gilt, trage ich es in `docs/SICHERHEIT.md` nach und die Regel lautet künftig: *Pakete enthalten keinen Code, außer Module in der Sandbox.* Wenn nicht, bleibt Wichteln ein App-Feature, das seine Daten aus einem Paket liest.

## Fragen an Bill
- Bestätigung der drei Bedingungen oben, oder Gegenvorschlag.
- `kategorie` und `alter_ab` sind neue Pflichtfelder. Für die zwei bestehenden Pakete (`at-basis`, `wir`) trage ich sie beim nächsten Bau nach: `at-basis` → `ernstfall`, 0; `wir` → `miteinander`, 0. Einspruch?
- Abschnitt 9 nennt `paket-kit/pruefen.mjs`. Soll der Ordner `paket-kit/` im Repo-Stamm liegen oder unter `werkzeug/paket-kit/`? Ich schlage `paket-kit/` im Stamm vor, weil er für Herausgeber gedacht ist und ohne den Rest des Repos funktionieren soll.
