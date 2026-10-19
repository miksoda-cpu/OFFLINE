# Stand

Neu geschrieben bei der Faltung am 19.10.2026 (Code, Nachtlauf). Der vorige Stand liegt unverändert in `bill/status-log.md`, Änderungen je Version in `docs/CHANGELOG.md`. Wird bei jeder Faltung von Grund auf neu geschrieben.

## Kanal
Bill schreibt Aufträge nach `bill/todo/`, Code meldet nach `bill/rueckmeldung/`, Erledigtes liegt in `bill/erledigt/`. Nur Code ändert die App, Prioritäten setzt Mik. Festlegungen: `bill/README.md`.

## App
- **Neueste Version:** 0.9.4 (17.10.2026, Tag `v0.9.4`): Dein Haushalt (Nr. 40), Menü neu geordnet und „Polster“ heißt „Vorräte“ (Nr. 41), Vorräte als Liste mit Ablaufdatum, Stern = Einkaufsliste (Nr. 42). Davor 0.9.3 (17.10., Tag `v0.9.3`): Sirenen hörbar (Nr. 38), Bereit erklärt (Nr. 39), Akku-Karten in der App (Nr. 36). Auf GitHub stehen die Releases v0.9.1 bis v0.9.4 als Entwurf (Abfrage 19.10.).
- **Web-Version** folgt dem Hauptbranch (Vercel), Service Worker `offline-v53`.
- **MVP-Inhalt:** Land wählen (Österreich voll; Deutschland, Schweiz mit Notrufnummern), zwölf Szenarien, Grundvorsorge (74 Punkte, sechs Bereiche), Vorräte, Radio mit eigenen Frequenzen auf Notfall, Sirenen, Notrufe, Naturheilkunde (erste Fassung), Karte (online), Bereit, Suche, Einstellungen mit Haushalt, „Über OFFLINE“, Spiele (`spiele-1`, nur Desktop). Unter „Bald“: Wikipedia, Wikivoyage, Offline-Karte, Lumi-Update, Tresor.
- **Katalog:** at-basis 2026.10.16, heilkunde-grundstock 2026.10.15, spiele-1 2026.10.07.1, Wichteln, wikivoyage-de (ab 0.9.0 nicht ladbar), Lumi-Pakete (ab 0.9.0 nur für Nutzer, die sie haben).
- **Läuft:** Rust-Kern, Signatur, Delta-Updates, kiwix-serve, Store-Build ohne Updater und internen Kanal.
- **Vorrat Tagespakete:** bis 31.01.2027 (104 Tage am 19.10.). Februar 2027 spätestens 01.01.2027; die 45-Tage-Grenze fällt am 17.12.2026.

## Im Repo, nicht veröffentlicht
Skin Flechte und die internen Pakete `naturheilkunde`, `naturheilkunde-bilder` nur verschlüsselt (`"freigegeben": false`, `docs/INTERN.md`). Klartext-Wache vor Commit und Push; seit 16.10. schützt sie Klartext zu jeder verschlüsselten Datei, auch aus anderen Branches.

## Beschlossen, noch nicht gebaut
Kinder-Modus ab 6, Einstellungen in drei Schichten, „Wohin“, Mesh, Handy (Android, iOS), Schließfach. Gesamtkonzept als Projektdokument „OFFLINE-Gesamtkonzept“, nicht in `docs/`.

## Aufträge
- **todo:** leer (19.10.).
- **Abgenommen (Bill):** Nr. 21, 29 bis 34.
- **Erledigt und zusammengeführt, Abnahme nicht vermerkt:** Nr. 22 bis 28, 35 bis 42. Zu Nr. 38 bis 42 liegen weder Auftrag noch Rückmeldung in `bill/`; Stand nach Git-Log und CHANGELOG.
- **Offen bei Code:** Fortschritt und Abbruch großer Downloads nur je 64-MB-Teil (Ideenbuch, Nr. 19). `bereich`/`pflicht` in at-basis, wir, lumi-buch, lumi-philosophie erst mit der nächsten Ausgabe. Lumi-Tipp in `wir` nennt noch den alten Tagesend-Satz. Sandbox-Probe in der App unter Linux. 14 Hilfe-Sätze passen nicht genau zum Code, wartet auf Bills Wortlaut.
- Klartext-Vorfall 0759dc6 (16.10.): Datei entfernt, Wache geschärft (78fcd71), Historie bleibt (Mik/Bill).

## Offen bei Mik
- **Startreife:** D-U-N-S-Nummer für die digitalworld Academy OG, dann Apple Developer Program und Google Play als Firma, Azure Artifact Signing für Windows; Auftragsverarbeitung mit Hetzner im diwo-Konto. Liste: `bill/rueckmeldung/2026-10-07-startreife.md`.
- **Anker:** 42 MVP-Bildschirme bewerten, dazu der Bildsatz aus Nr. 21 (`bill/rueckmeldung/bilder/2026-10-anker-mvp/`); erst danach gelten die Referenzbilder als abgenommen.
- **GitHub:** Wegwerf-Branches `wegwerf-nr21-abstand` und `wegwerf-nr21-alt` löschen (Nachtlauf darf nicht löschen, HTTP 403).

## Extern wartend
Anwalt (35 Fragen, Haftung einer Notfall-App), Lizenzanfragen an Institutionen, ärztliche Prüfung der Guides.

## Gedächtnis
Wörter der Startlektüre (README, dieser Stand, Lehren; Grenze 2.500), eine Zeile je Faltung:
- 11.10.2026 · vorher 2.401 (damals ganzes Ideenbuch) · nachher 1.691, obwohl das README um die Festlegung „Stand und Log“ gewachsen ist
- 12.10.2026 · vorher 1.904 · nachher 1.824 (Nachtlauf; README unverändert, Stand gestrafft)
- 19.10.2026 · vorher 2.459 · nachher 2.192 (Nachtlauf; README unverändert, Stand neu, Lehren aus den Ideenbuch-Einträgen auf 15 Punkte)
