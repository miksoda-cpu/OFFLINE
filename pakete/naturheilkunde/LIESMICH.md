# Naturheilkunde (in Prüfung)

## Was

Das Naturheilkunde-Modul als Datenpaket: elf Inhaltsdateien (Teil 0 Waldfunde und Beschwerde-Suche bis Teil 10 Lehre der Tradition) in `inhalt/naturheilkunde.json`. Jeder Eintrag (Pflanzenkarte, Warnkarte, Droge, Überlieferung) und jedes Kapitel trägt seinen Text wörtlich als Markdown; dazu Felder für Ort (`handbuch` / `suche_und_karte`), Belegbarkeit (fünf Stufen), Marken (psychoaktiv, abtreibend, giftig), Prüfstatus `in_pruefung`, die Erste-Hilfe-Karte, die Wechselwirkungstabelle mit Sperren und die Indizes aus Teil 0.

## Für wen

Noch für niemanden zur Anwendung: Entwurf, fachlich nicht geprüft. Gedacht als offenes Nachschlagewerk ohne Passwort für den Fall, dass die gewohnte Medizin fehlt (Konzept `OFFLINE-Naturheilkunde-Modul-Konzept.md`). `alter_ab` 18, solange psychoaktive und abtreibend wirkende Pflanzen nicht geprüft beschrieben sind (Vorschlag, Mik entscheidet).

## Wie funktioniert es

Nur Daten. Gebaut aus `quelle/OFFLINE-Naturheilkunde-Inhalt-0 … 10-*.md` (unverändert kopiert) mit `node pakete/naturheilkunde/naturheilkunde-umwandeln.mjs`; der Umwandler schreibt auch `unzugeordnet.md` (was er nicht sicher zuordnen konnte). Kein Text wird umgeschrieben; alle abgeleiteten Felder stammen aus Zeilen der Quelle. Noch kein Eintrag ist für „Suche und Karte“ freigegeben.

## Wie geprüft

Test `web/naturheilkunde.test.mjs` (alle elf Teile, eindeutige Kennungen, nur erlaubte Werte, Prüfstatus überall `in_pruefung`, gesperrte Wechselwirkungen, Erste-Hilfe-Karte mit 01 406 43 43 und 144, jede Zeile der Quelle steht in einem Text, Paket gleich frischem Lauf). Format mit dem Kit `paket-kit/pruefen.mjs`. Fachlich: nicht geprüft.

## Offene Punkte

Fachprüfung (Pharmazie, Botanik, VIZ) und KI-Prüfung Stufe 1; Belegbarkeit bei gemischten Angaben und die Marken laut `unzugeordnet.md` gegenlesen; App-Anzeige für dieses Format fehlt noch (kein Auftrag an Code); `aenderungen` fehlt bewusst bis zur ersten Veröffentlichung; Vorschaufolie 2 ist noch kein echter Bildschirm.
