# Stand

Neu geschrieben bei der Faltung am 12.10.2026 (Code, Nachtlauf). Der vorige Stand liegt unverändert in `bill/status-log.md`, Änderungen je Version in `docs/CHANGELOG.md`. Wird bei jeder Faltung von Grund auf neu geschrieben.

## Kanal
Bill schreibt Aufträge nach `bill/todo/`, Code meldet nach `bill/rueckmeldung/`, Erledigtes liegt in `bill/erledigt/`. Nur Code ändert die App, Prioritäten setzt Mik. Festlegungen: `bill/README.md`.

## App
- **Veröffentlicht:** Desktop 0.8.0 (08.10.2026, Tag `v0.8.0`) und Web-Version. MVP-Inhalt: zwölf Szenarien, Grundvorsorge (74 Punkte, sechs Bereiche), Radio je Bundesland, Sirenen, Notrufe, Offline-Karte, Bibliothek mit Wikivoyage, Tresor, Bereit, Spiele (`spiele-1`, nur Desktop).
- **Katalog:** at-basis 2026.10.08, spiele-1 2026.10.07.1, Wichteln, wikivoyage-de; Lumi-Pakete liegen dort, gehören nicht zum MVP.
- **Läuft:** Rust-Kern, Signatur, Delta-Updates, kiwix-serve, Store-Build ohne Updater und internen Kanal.
- **Vorrat Tagespakete:** bis 31.01.2027. Februar 2027 spätestens 01.01.2027; die 45-Tage-Grenze fällt am 17.12.2026.

## Im Repo, nicht veröffentlicht
Skin Flechte und die internen Pakete `naturheilkunde`, `naturheilkunde-bilder` liegen nur verschlüsselt im Repo (`"freigegeben": false`, `docs/INTERN.md`). Klartext-Wache vor Commit und Push.

## Beschlossen, noch nicht gebaut
Kinder-Modus ab 6, Einstellungen in drei Schichten, „Wohin“, Mesh, Handy (Android, iOS), Schließfach. Gesamtkonzept als Projektdokument „OFFLINE-Gesamtkonzept“, nicht in `docs/`.

## Offen bei Code
- Aufträge in `bill/todo/`: Nr. 21 Bildvergleich und Barrierefreiheit, Nr. 22 Impressum und Datenschutz (hoch), Nr. 23 Anker-Befunde, Nr. 24 Wissen-Module und Nachtrag 0.8.0.
- Rückfragen zu 0.8.0 (Nr. 20): Bereit zählt nur die 20 alten Punkte; Sirenentöne nachgebildet (prüfen); Haushalt-Wörter; doppelte Klammer bei USB (Teil von Nr. 24).
- Große Downloads: Fortschritt und Abbruch nur je 64-MB-Teil (Ideenbuch, offen).
- `bereich`/`pflicht` in at-basis, wir, lumi-buch, lumi-philosophie, pause erst mit der nächsten Ausgabe.
- Sandbox-Probe in der App unter Linux offen; Windows grün.
- Hilfe-Sätze: 14 passen nicht genau zum Code (vor allem „Pause ist Training für den Kopf“), wartet auf Bills Wortlaut.

## Offen bei Mik
- **Startreife:** D-U-N-S-Nummer für die digitalworld Academy OG, dann Apple Developer Program und Google Play als Firma, Azure Artifact Signing für Windows; Auftragsverarbeitung mit Hetzner im diwo-Konto. Liste: `bill/rueckmeldung/2026-10-07-startreife.md`.
- **Anker:** 42 MVP-Bildschirme bewerten.

## Extern wartend
Anwalt (35 Fragen, Haftung einer Notfall-App), Lizenzanfragen an Institutionen, ärztliche Prüfung der Guides.

## Gedächtnis
Wörter der Startlektüre (README, dieser Stand, Lehren; Grenze 2.500), eine Zeile je Faltung:
- 11.10.2026 · vorher 2.401 (damals ganzes Ideenbuch) · nachher 1.691, obwohl das README um die Festlegung „Stand und Log“ gewachsen ist
- 12.10.2026 · vorher 1.904 · nachher 1.824 (Nachtlauf; README unverändert, Stand gestrafft)
