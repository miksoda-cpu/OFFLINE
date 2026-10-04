# Stand

Aktualisiert: 2026-10-04, Code (Release 0.4.2); vorher 2026-09-29, Bill (Ergänzungen Code: Material in `bill/eingang/2026-09-29-bill/`, Paket-Kit in `paket-kit/`)

## Kanal
Bill schreibt Aufträge nach `bill/todo/`, Code meldet nach `bill/rueckmeldung/`, erledigte Aufträge liegen in `bill/erledigt/`. Nur Code ändert die App. Prioritäten setzt Mik. Das Protokoll steht im Projekt („OFFLINE-Bill-Zentrale").

## App (laut Code)
Desktop **0.4.2 veröffentlicht** (04.10.2026, Tag `v0.4.2`; 0.3.3 bis 0.4.1 am selben Tag): Pause mit eigenem Raum (`#pause`, Einladung auf Heute statt Fenster, Happen als Fokus-Bildschirm, zarte Werte `--z-*`), Startseite ohne KI-Versprechen und mit „kommt“, Startseite mit vier Preisstufen, Pause-Nachtrag (Rückspiegel ohne Zählung, Lumisch ab Tag 22), ⏸ Pause Stufe 1 (Happen, Dirigent ohne KI, Deine Linie, Spiel-Log, `offline.spiel`), Lumi-Knöpfe je Sorte, Bewertung, Heft (Log mit Stern), Vorhaben in Vorsorge, eine Lumi-Stimme; Antwortfeld beim Tagesrätsel (Paketfeld `antworten`), Tipps nach Grundsatz (Bedingungswort `funktion`), „Was ist neu“ (Quelle `web/neues.json`, Test auf den Eintrag der aktuellen Version), Tagesseite mit Vorratskammer (Tagespakete tage-2026-10 bis tage-2027-01, Vorrat bis 31.01.2027), Module, Bereit v2 mit Übergang, die Lumi mit drei Stufen (Standard Textkarten) und Nachtschlaf, Skins, app_min. Web-Version wird per Workflow „Web-Version“ aus den veröffentlichten Paketen gebaut. Katalog: at-basis 2026.09.29.1 (Sirenen-Korrektur), wir 2026.10.04.2 (175 Tipps, 16 mit `ziel`, 20 warten auf eine Funktion), pause 2026.10.04.1, Wichteln 2026.10.04 (meldet ins Spiel-Log), Wichteln 2026.09.29 (Modul, Redaktionsschlüssel), wikivoyage-de. Läuft: Rust-Kern, Signatur und Delta-Updates, kiwix-serve, Wikivoyage, Österreich-Basis, Offline-Karte, Tresor v1, Bibliothek, Werkzeuge, Bereit-Anzeige, das Wesen.

## Im Repo, noch nicht veröffentlicht
- Paket-Kit und Module (Auftrag `2026-09-29-paket-kit-werkzeug`, Phasen A–E): `pruefen.mjs` in den Tests, Module mit Redaktionsschlüssel, Sandbox und `window.offline`, Bedienung in der Bibliothek, Version 0.2.0. Wichteln ist seit 29.09. im öffentlichen Katalog (Freigabe Mik, Windows-Probe grün).
- Redaktionsschlüssel `d9b62d1755ba3744` (nur Module), privat nur auf Miks Mac.

## Beschlossen, noch nicht im Repo
- Paket „wir“ mit 180 Tipps (`bill/eingang/…/pakete/wir/`), Repo hat 53; Formatangleich nötig, siehe Rückmeldung `2026-09-29-material-uebergabe`
- Kinder-Modus ab 6, Tagesseite mit Vorratskammer, Roman der Woche, Einstellungen in drei Schichten, „Wohin"
- Gesamtkonzept: Projektdokument „OFFLINE-Gesamtkonzept" (Fassung 6), noch nicht in `docs/`

- Bereit Version 2 nach Gesamtkonzept Kapitel 4 (Auftrag `2026-09-29-bereit-v2`), mit Übertragung aus Version 1.
- Lumi standardmäßig aus, Startablauf mit Namen, Foto-Ansicht, 176 Tipps im Paket `wir` (Quelle, nicht gebaut) (Auftrag `2026-09-29-lumi-einbau`).
- Skins als Paketart, Grundaussehen mit `of`-Klassen, Flechte gebaut in der lokalen Redaktionsablage, **nicht veröffentlicht** (Auftrag `2026-09-29-flechte-als-paket`).

## Offen bei Code (wartet)
- CI `tests.yml` läuft seit 29.09. bei jedem Push (Werkzeug, Kit, Bereit, Lumi, Kern, Sandbox-Probe).
- Sandbox-Probe in der App: Windows grün (Windows-Probe, 42/42); Linux in der App noch offen (Berechtigungstest läuft auf Linux).

## Offen bei Mik
Sieben Konzeptfragen (Gesamtkonzept Kap. 10), Priorität für den nächsten Auftrag.

## Extern wartend
Anwalt (23 Fragen), Lizenzanfragen an Institutionen, ärztliche Prüfung der Guides.

## Aufträge
Erledigt: `2026-09-29-paket-kit-pflichtenheft-und-status` (Rückmeldung vom 29.09.), Antwort von Bill vom 29.09. (Rückmeldung `2026-09-29-antwort-bill`), Freigabe Module (Rückmeldung `2026-09-29-freigabe-module`), Abgleich (Rückmeldung `2026-09-29-abgleich`; Sirenen-Text in der Quelle von at-basis korrigiert, noch nicht gebaut)., `2026-09-29-paket-kit-werkzeug` (Rückmeldungen Phase A–E), `2026-09-29-bereit-v2`, `2026-09-29-lumi-einbau`, `2026-09-29-flechte-als-paket`, `2026-09-29-release-wichteln` (Rückmeldung vom 30.09.), `2026-09-29-lumi-nachtrag` und Web-Version (Rückmeldung `2026-09-30-web-version-und-lumi-nachtrag`), `2026-09-30-tagesseite-vorratskammer` (Rückmeldung vom 30.09.), `2026-09-30-dezember-und-tippfix` und `2026-09-30-was-ist-neu` (Rückmeldung `2026-09-30-dezember-tippfix-was-ist-neu`). `2026-10-01-tipps-und-jaenner` (Rückmeldung vom 01.10.). `2026-10-01-raetsel-eingabe` (Rückmeldung vom 04.10.), `2026-10-04-lumi-knoepfe` mit Nachtrag (Rückmeldung vom 04.10.), `2026-10-04-pause-stufe1` und `2026-10-04-wir-drei-tipps` (Rückmeldung vom 04.10.). `2026-10-04-preise-webseite` und `2026-10-04-pause-nachtrag` (Rückmeldung vom 04.10.). `2026-10-04-pause-umbau` und `2026-10-04-webseite-ehrlich` (Rückmeldung vom 04.10., 0.4.2). In Arbeit: `2026-10-04-stil-zart-app` (0.4.3), danach `2026-10-04-lumi-buch-app` (0.5.0). Offen: Entscheidung Bill zu „Für bis zu 5 Personen“, Bezahlstufen und Anmeldesatz auf der Startseite; Wortprüfung Lumisch (eigene Session); Bildschirmfotos der Desktop-App am Mac (Zugriff auf die Test-App am 04.10. abgelehnt, Bilder aus der Web-Version); Lumi-Buch folgt, wenn das erste Kapitel steht. Als Nächstes nötig: Tagespaket Februar 2027, spätestens 01.01.2027 (Regel „zwei Monate voraus“, 45-Tage-Grenze am 17.12.).
