# Stand

Neu geschrieben bei der Faltung am 23.11.2026 (Code, Nachtlauf). Der vorige Stand liegt unverändert in `bill/status-log.md`, Änderungen je Version in `docs/CHANGELOG.md`. Wird bei jeder Faltung von Grund auf neu geschrieben.

## Kanal
Aufträge in `bill/todo/`, Rückmeldungen in `bill/rueckmeldung/`, Erledigtes in `bill/erledigt/`; Festlegungen in `bill/README.md`. Nur Code ändert die App, Prioritäten setzt Mik. Nr. 38 bis 48, die Arbeiten vom 14.11. und 0.9.6 liefen über das Postfach bzw. Miks Session; im Repo liegen dazu Commits und Bilder unter `bill/rueckmeldung/bilder/`.

## App
- **Desktop 0.9.6:** Tag `v0.9.6` am 17.11.2026 auf dem Hauptbranch (fast-forward von `nr-0-9-6`, Tests grün, Lauf 44077549348), Desktop-App gebaut (Lauf 44077849838). Das GitHub-Release steht als Entwurf, nicht veröffentlicht. Neu gegenüber 0.9.5: Eingekochtes in den Vorräten (Nr. 45), „Hab ich“ / „Brauch ich“ (Nr. 47), Blau für aktiv/gewählt, Rot nur für Warnung und Alarm (Nr. 48); Mac-App signiert und notarisiert, sobald die fünf Apple-Secrets da sind, sonst Ad-hoc.
- **Zuletzt veröffentlicht:** Desktop 0.9.5 (19.10.2026) und die Web-Version, die den Hauptbranch selbst baut. Umfang: MVP nach Festlegung 11.10. (AT voll, DE/CH mit Notrufen; zwölf Szenarien, Grundvorsorge, Vorräte mit Einkaufsliste, Radio, Sirenen, Notrufe, Akku, Bereit, Naturheilkunde, Karte online, Impressum, Spiele nur Desktop). Unter „Bald“: Wikipedia, Wikivoyage, Offline-Karte, Lumi-Update, Tresor.
- **Katalog:** at-basis 2026.10.19 (`app_min` 0.9.5), heilkunde-grundstock 2026.10.15, spiele-1 2026.10.07.1, Wichteln, Tagespakete bis Jänner 2027; Lumi-Pakete nur für Nutzer, die sie haben. Die Windows-Probe prüft gegen eingefrorenes 0.8.0 / at-basis 2026.10.16.
- **Läuft:** Rust-Kern, Signatur, Delta-Updates, kiwix-serve, Store-Build ohne Updater und internen Kanal.
- **Vorrat Tagespakete:** bis 31.01.2027, am 23.11. noch 69 Tage. Februar 2027 spätestens am 01.01.2027 im Katalog; die 45-Tage-Grenze fällt am 17.12.2026.

## Im Repo, nicht veröffentlicht
Skin Flechte und die internen Pakete `naturheilkunde`, `naturheilkunde-bilder` liegen nur verschlüsselt im Repo (`"freigegeben": false`, `docs/INTERN.md`). Die Klartext-Wache läuft vor Commit und Push, auch für Klartext zu verschlüsselten Dateien anderer Branches.

## Beschlossen, noch nicht gebaut
Kinder-Modus ab 6, Einstellungen in drei Schichten, „Wohin“, Mesh, Handy (Android, iOS), Schließfach. Gesamtkonzept im Projektdokument „OFFLINE-Gesamtkonzept“, nicht in `docs/`.

## Offen bei Code
- `bill/todo/` leer (23.11.); letzter Auftrag vom 26.10.
- Prüferkette auf dem Hauptbranch grün (zuletzt Lauf 44077549348, 17.11.).
- Tagesrätsel auf „Spiele“ erscheint beim ersten Start erst nach dem nächsten Neuzeichnen (Befund 02.11., Vorschlag in `bill/rueckmeldung/2026-11-09-faltung.md`, kein Auftrag).
- Abnahme durch Bill für Nr. 26 und Nr. 38 bis 48 ist im Repo nicht vermerkt.
- Große Downloads: Fortschritt und Abbruch nur je 64-MB-Teil.
- `bereich`/`pflicht` in wir, lumi-buch, lumi-philosophie, pause erst mit der nächsten Ausgabe dieser Pakete; der Lumi-Tipp in `wir` nennt noch den alten Satz am Tagesende.
- Sandbox-Probe in der App unter Linux offen.
- Hilfe-Sätze: 14 passen nicht genau zum Code (vor allem „Pause ist Training für den Kopf“), wartet auf Bills Wortlaut.
- Parkmodus im Postfach (Stop-Hook) weckt die Session nicht verlässlich (Ursache offen).

## Offen bei Mik
- **Release 0.9.6:** Entwurf auf GitHub veröffentlichen (nur mit Miks Freigabe); ob der Rundgang nach Festlegung 30.09. dafür gelaufen ist, ist im Repo nicht vermerkt.
- **Startreife:** D-U-N-S-Nummer für die digitalworld Academy OG, dann Apple Developer Program (danach die fünf Apple-Secrets) und Google Play als Firma, Azure Artifact Signing für Windows; Auftragsverarbeitung mit Hetzner im diwo-Konto. Liste: `bill/rueckmeldung/2026-10-07-startreife.md`.
- **Anker:** 42 MVP-Bildschirme bewerten, dazu der Bildsatz aus Nr. 21 (`bill/rueckmeldung/bilder/2026-10-anker-mvp/`); erst danach gelten die Referenzbilder als abgenommen.
- **GitHub:** überholte Branches löschen (der Nachtlauf löscht nicht), u. a. `wegwerf-nr21-abstand`, `wegwerf-nr21-alt`, `faltung-2026-11-09`, `faltung-2026-11-16`, `nr-0-9-6`, `rel-0-9-6`.
- Klartext-Vorfall 0759dc6 (16.10.): Datei entfernt, Historie bleibt, Entscheidung bei Mik.

## Extern wartend
Anwalt (35 Fragen, Haftung einer Notfall-App), Lizenzanfragen an Institutionen, ärztliche Prüfung der Guides.

## Gedächtnis
Wörter der Startlektüre (README, dieser Stand, Lehren; Grenze 2.500), eine Zeile je Faltung; ältere Zeilen stehen in den Einträgen vom 16.11. und 23.11. in `bill/status-log.md`.
- 16.11.2026 · vorher 2.303 · nachher 2.336 (Nachtlauf; README unverändert; Stand mit den Arbeiten vom 14.11. neu, 0.9.6 vorbereitet, Prüferkette wieder grün; ältere Gedächtnis-Zeilen ins Status-Log; Lehren verdichtet; Faltung vom 09.11. mitgenommen)
- 23.11.2026 · vorher 2.336 · nachher 2.325 (Nachtlauf; README unverändert; Stand neu mit Tag `v0.9.6` und Release-Entwurf, Vorrat neu gemessen, Liste der überholten Branches ergänzt; Lehren gestrafft)
