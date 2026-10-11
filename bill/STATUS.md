# Stand

Neu geschrieben bei der Faltung am 11.10.2026 (Bill). Der vorige Stand mit der ganzen Release-Kette liegt unverändert in `bill/status-log.md`; die Änderungen je Version stehen in `docs/CHANGELOG.md`. Dieses Dokument wird bei jeder Faltung von Grund auf neu geschrieben, nicht fortgeschrieben.

## Kanal
Bill schreibt Aufträge nach `bill/todo/`, Code meldet nach `bill/rueckmeldung/`, erledigte Aufträge liegen in `bill/erledigt/`. Nur Code ändert die App. Prioritäten setzt Mik. Arbeitsweise und Festlegungen: `bill/README.md`.

## App
- **Veröffentlicht:** Desktop 0.8.0 (08.10.2026, Tag `v0.8.0`) und die Web-Version. Inhalt fürs MVP: zwölf Szenarien auf Notfall und Vorsorge, Grundvorsorge in sechs Bereichen (74 Punkte, Haushalt-Filter), Radio je Bundesland, Sirenen zum Anhören, Notrufe, Offline-Karte, Bibliothek mit Wikivoyage, Tresor, Bereit, Spiele (`spiele-1`, nur Desktop).
- **Katalog:** at-basis 2026.10.08, spiele-1 2026.10.07.1, Wichteln, wikivoyage-de; dazu die Lumi-Pakete (nicht im MVP).
- **Läuft:** Rust-Kern, Signatur und Delta-Updates, kiwix-serve, Store-Build ohne Updater und internen Kanal.
- **Vorrat Tagespakete:** bis 31.01.2027. Tagespaket Februar 2027 spätestens 01.01.2027; die 45-Tage-Grenze fällt am 17.12.2026.

## Im Repo, nicht veröffentlicht
- Skin Flechte, nur verschlüsselt (`"freigegeben": false`).
- Intern, nur über den internen Kanal: `naturheilkunde`, `naturheilkunde-bilder`.
- Unveröffentlichtes liegt nur verschlüsselt im Repo (Regel Nr. 13, `docs/INTERN.md`); Klartext-Wache vor Commit und Push.

## Beschlossen, noch nicht gebaut
Kinder-Modus ab 6, Einstellungen in drei Schichten, „Wohin“, Mesh, Handy (Android und iOS), Schließfach. Gesamtkonzept als Projektdokument „OFFLINE-Gesamtkonzept“, noch nicht in `docs/`.

## Offen bei Code
- **Nr. 24** Wikipedia und Wikivoyage als Module (Desktop, nicht im Installer), Nachtrag zu 0.8.0: Österreich-Basis lädt still nach, doppelte Klammer bei USB (`bill/todo/`).
- **Nr. 23** Befunde aus Miks Anker-Bewertung: Vorschau-Bilder lesbar, Altersfrage wird Empfehlung, drei Kandidaten für den Satz am Tagesende, Farbcode in Bereit breit (`bill/todo/`).
- **Nr. 22** Impressum und Datenschutz mit den Daten der OG (`bill/todo/`).
- **Nr. 21** Bildvergleich und Barrierefreiheit, nur MVP-Seiten, mit Anker-Bildsatz (`bill/todo/`).
- **Rückfragen zu 0.8.0** (Nr. 20): Bereit zählt nur die 20 alten Punkte; Sirenentöne nachgebildet (prüfen); Haushalt-Wörter; doppelte Klammer bei USB.
- **Große Downloads:** Fortschritt und Abbruch nur je 64-MB-Teil (Ideenbuch, offen).
- **Bereich in bestehenden Paketen:** at-basis, wir, lumi-buch, lumi-philosophie, pause tragen `bereich`/`pflicht` erst mit ihrer nächsten Ausgabe.
- **Sandbox-Probe in der App unter Linux** offen; Windows grün.
- **Hilfe-Sätze:** 14 Sätze passen nicht genau zum Code, vor allem „Pause ist Training für den Kopf“; wartet auf Bills Wortlaut.

## Offen bei Mik
- **Startreife:** D-U-N-S-Nummer für die digitalworld Academy OG beantragen (Herausgeber seit 11.10.), dann Apple Developer Program und Google Play als Firma, Azure Artifact Signing für Windows; Auftragsverarbeitung mit Hetzner im bestehenden diwo-Konto. Liste: `bill/rueckmeldung/2026-10-07-startreife.md`.
- **Anker:** 42 MVP-Bildschirme bewerten.

## Extern wartend
Anwalt (35 Fragen, dazu Haftung bei einer Notfall-App), Lizenzanfragen an Institutionen, ärztliche Prüfung der Guides.

## Gedächtnis
Wörter der Startlektüre (README, dieser Stand, Lehren im Ideenbuch; Grenze 2.500), eine Zeile je Faltung:
- 11.10.2026 · vorher 2.401 (damals ganzes Ideenbuch) · nachher 1.691, obwohl das README um die Festlegung „Stand und Log“ gewachsen ist
