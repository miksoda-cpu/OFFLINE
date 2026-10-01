# Auftrag: Tipps bereinigen, Tagespaket Jänner, Regel „zwei Monate voraus“

**Von:** Bill · **Datum:** 2026-10-01 · **Dringlichkeit:** normal

## 1. Tipps: Bill entscheidet die offene Liste aus deiner Rückmeldung vom 30.09.
Grundsatz ab jetzt: **Ein Tipp behauptet nie etwas, das die App nicht weiß, und nennt keine Funktion, die es nicht gibt.**

- **Zustand, den die App nicht kennt:** wie von dir vorgeschlagen umformulieren: `laune-006`, `laune-015`, `alltag-039`, `alltag-004`. `laune-010` (Namensänderung) streichen.
- **Alte Punktzahlen:** `alltag-001`, `alltag-003`, `alltag-014`: Zahl ersetzen durch „hebt deine Bereit-Zahl“.
- **Funktionen, die es noch nicht gibt:** nicht löschen, sondern ein neues Bedingungswort `funktion` einführen (zum Beispiel `funktion: "wohin"`). Die App kennt die Liste ihrer vorhandenen Funktionen und zeigt den Tipp erst, wenn es die Funktion gibt. Betrifft `app-002`, `app-003`, `app-006`, `app-014`, `app-015`, `app-016`, `app-017`, `app-018`, `app-019`, `app-024`, `app-026`, `app-028`, `app-029`, `app-033`, `alltag-023`. Ältere Apps kennen das Wort nicht und lassen die Tipps weg, wie bei `offen`.
- **Ungenau:** `app-005`, `app-010`, `app-020` an den heutigen Stand anpassen.
- Ein Test prüft künftig: Jeder Tipp, der eine Funktion nennt, hat eine `funktion`-Bedingung oder die Funktion ist in der Liste.

## 2. Tagespaket Jänner 2027
Wie Dezember: 31 neue Rätsel, vier Lesewochen gemeinfrei, deutschsprachig im Original, nur mit geprüfter Ausgabe auf Wikisource. Gern Winterstoffe, sonst freie Wahl. Bergkristall und die anderen ohne geprüfte Ausgabe bleiben draußen. Keine Bot-Sperren umgehen.

## 3. Regel „zwei Monate voraus“
In `bill/README.md` festschreiben: Das Tagespaket für einen Monat liegt spätestens am 1. des Vormonats im Katalog, besser zwei Monate voraus. Die Rückmeldung zu jedem Release nennt, bis wann der Vorrat reicht. Wenn der Abstand unter 45 Tage fällt, meldest du dich von selbst mit einem Vorschlag für das nächste Paket.

## Regeln
Eigener Branch, veröffentlichen erst bei allen Tests auf drei Systemen und Windows-Probe grün. Freigabe zum Veröffentlichen erteilt für App-Update, `wir` und `tage-2027-01`. „Was ist neu“ bekommt den Eintrag.
