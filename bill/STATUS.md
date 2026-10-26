# Stand

Neu geschrieben bei der Faltung am 26.10.2026 (Code, Nachtlauf). Der vorige Stand liegt unverändert in `bill/status-log.md`, Änderungen je Version in `docs/CHANGELOG.md`. Wird bei jeder Faltung von Grund auf neu geschrieben.

## Kanal
Bill schreibt Aufträge nach `bill/todo/`, Code meldet nach `bill/rueckmeldung/`, Erledigtes liegt in `bill/erledigt/`. Nur Code ändert die App, Prioritäten setzt Mik. Festlegungen: `bill/README.md`. Die Aufträge Nr. 38 bis 48 liefen über das Postfach; im Repo liegen dazu keine Auftrags- oder Rückmeldungsdateien, nur Commits und Bilder unter `bill/rueckmeldung/bilder/`.

## App
- **Veröffentlicht:** Desktop 0.9.5 (19.10.2026, Tag `v0.9.5`) und Web-Version. Inhalt: Land wählen (Österreich voll; Deutschland, Schweiz mit Notrufnummern), Startseite online/offline mit Hilfe nach Dauer, Suche, zwölf Szenarien, Grundvorsorge mit Haustieren (Bereich nur mit gewählten Tieren), Vorräte als Liste mit Ablaufdatum und Einkaufsliste, „Dein Haushalt“ in den Einstellungen, Radio mit eigenen Frequenzen auf Notfall, Sirenen hörbar, Notrufe, Akku-Karten, Bereit mit Aufschlüsselung, Naturheilkunde (erste Fassung), Karte (online), „Über OFFLINE“, Impressum, Spiele (`spiele-1`, nur Desktop) mit Roman der Woche. Die App sagt „du“. Unter „Bald“: Wikipedia, Wikivoyage, Offline-Karte, Lumi-Update, Tresor.
- **Auf dem Hauptbranch, noch nicht in einer Desktop-Version** (Web baut den Hauptbranch selbst): Nr. 45 Eingekochtes in den Vorräten, Nr. 47 „Hab ich“ / „Brauch ich“ statt Kästchen in der Grundvorsorge, Hinweis „Auf die Einkaufsliste gesetzt“.
- **Katalog:** at-basis 2026.10.19 (`app_min` 0.9.5), heilkunde-grundstock 2026.10.15, spiele-1 2026.10.07.1, Wichteln, Tagespakete bis Jänner 2027; Lumi-Pakete nur für Nutzer, die sie schon haben. Die Windows-Probe gibt 0.8.0 at-basis 2026.10.16 eingefroren.
- **Läuft:** Rust-Kern, Signatur, Delta-Updates, kiwix-serve, Store-Build ohne Updater und internen Kanal.
- **Vorrat Tagespakete:** bis 31.01.2027, am 26.10. noch 97 Tage. Februar 2027 spätestens 01.01.2027; die 45-Tage-Grenze fällt am 17.12.2026.

## Im Repo, nicht veröffentlicht
Skin Flechte und die internen Pakete `naturheilkunde`, `naturheilkunde-bilder` liegen nur verschlüsselt im Repo (`"freigegeben": false`, `docs/INTERN.md`). Klartext-Wache vor Commit und Push; seit 16.10. schützt sie den Klartext auch zu verschlüsselten Dateien anderer Branches.

## Beschlossen, noch nicht gebaut
Kinder-Modus ab 6, Einstellungen in drei Schichten, „Wohin“, Mesh, Handy (Android, iOS), Schließfach. Gesamtkonzept als Projektdokument „OFFLINE-Gesamtkonzept“, nicht in `docs/`.

## Offen bei Code
- `bill/todo/` ist leer (26.10.).
- Nr. 48 „Blau für aktiv/gewählt, Rot nur für Warnung und Alarm“ (Mik 20.10.): auf Branch `nr-48-blau` mit Referenzbildern (Lauf 39410511283), nicht zusammengeführt.
- Abnahme durch Bill für Nr. 26 und Nr. 38 bis 47 ist im Repo nicht vermerkt.
- Große Downloads: Fortschritt und Abbruch nur je 64-MB-Teil (Ideenbuch, offen).
- `bereich`/`pflicht` in wir, lumi-buch, lumi-philosophie, pause erst mit der nächsten Ausgabe dieser Pakete; der Lumi-Tipp in `wir` nennt noch den alten Satz am Tagesende.
- Sandbox-Probe in der App unter Linux offen.
- Hilfe-Sätze: 14 passen nicht genau zum Code (vor allem „Pause ist Training für den Kopf“), wartet auf Bills Wortlaut.
- Parkmodus im Postfach (Stop-Hook) weckt die Session nicht verlässlich (Ideenbuch 19.10., Ursache offen).

## Offen bei Mik
- **Startreife:** D-U-N-S-Nummer für die digitalworld Academy OG, dann Apple Developer Program und Google Play als Firma, Azure Artifact Signing für Windows; Auftragsverarbeitung mit Hetzner im diwo-Konto. Liste: `bill/rueckmeldung/2026-10-07-startreife.md`.
- **Anker:** 42 MVP-Bildschirme bewerten; dazu der Bildsatz aus Nr. 21 (`bill/rueckmeldung/bilder/2026-10-anker-mvp/`), erst danach gelten die Referenzbilder als abgenommen.
- **Nr. 48:** Entscheidung, ob `nr-48-blau` zusammengeführt wird.
- **Desktop-Version** mit Nr. 45 und 47 (Tag und Release nur mit Miks Freigabe).
- **GitHub:** Wegwerf-Branches `wegwerf-nr21-abstand` und `wegwerf-nr21-alt` löschen (der Nachtlauf darf nicht löschen).
- Klartext-Vorfall 0759dc6 (16.10.): Datei entfernt, Historie bleibt, Entscheidung bei Mik.

## Extern wartend
Anwalt (35 Fragen, Haftung einer Notfall-App), Lizenzanfragen an Institutionen, ärztliche Prüfung der Guides.

## Gedächtnis
Wörter der Startlektüre (README, dieser Stand, Lehren; Grenze 2.500), eine Zeile je Faltung:
- 11.10.2026 · vorher 2.401 (damals ganzes Ideenbuch) · nachher 1.691, obwohl das README um die Festlegung „Stand und Log“ gewachsen ist
- 12.10.2026 · vorher 1.904 · nachher 1.824 (Nachtlauf; README unverändert, Stand gestrafft)
- 26.10.2026 · vorher 2.459 · nachher 2.251 (Nachtlauf; README unverändert, Stand mit Nr. 38–48 neu, Lehren aus den Ideenbuch-Einträgen ergänzt)
