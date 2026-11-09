# Stand

Neu geschrieben bei der Faltung am 09.11.2026 (Code, Nachtlauf). Der vorige Stand liegt unverändert in `bill/status-log.md`, Änderungen je Version in `docs/CHANGELOG.md`. Wird bei jeder Faltung von Grund auf neu geschrieben.

## Kanal
Aufträge in `bill/todo/`, Rückmeldungen in `bill/rueckmeldung/`, Erledigtes in `bill/erledigt/`; Festlegungen in `bill/README.md`. Nur Code ändert die App, Prioritäten setzt Mik. Nr. 38 bis 48 liefen über das Postfach; im Repo liegen dazu nur Commits und Bilder unter `bill/rueckmeldung/bilder/`.

## App
- **Veröffentlicht:** Desktop 0.9.5 (19.10.2026, Tag `v0.9.5`) und Web-Version. Umfang: MVP nach Festlegung 11.10. (AT voll, DE/CH mit Notrufen; zwölf Szenarien, Grundvorsorge, Vorräte mit Einkaufsliste, Radio, Sirenen, Notrufe, Akku, Bereit, Naturheilkunde, Karte online, Impressum, Spiele nur Desktop). Unter „Bald“: Wikipedia, Wikivoyage, Offline-Karte, Lumi-Update, Tresor.
- **Auf dem Hauptbranch, in keiner Desktop-Version** (Web baut den Hauptbranch selbst): Nr. 45 Eingekochtes in den Vorräten, Nr. 47 „Hab ich“ / „Brauch ich“ in der Grundvorsorge.
- **Katalog:** at-basis 2026.10.19 (`app_min` 0.9.5), heilkunde-grundstock 2026.10.15, spiele-1 2026.10.07.1, Wichteln, Tagespakete bis Jänner 2027; Lumi-Pakete nur für Nutzer, die sie haben. Die Windows-Probe prüft gegen eingefrorenes 0.8.0 / at-basis 2026.10.16.
- **Läuft:** Rust-Kern, Signatur, Delta-Updates, kiwix-serve, Store-Build ohne Updater und internen Kanal.
- **Vorrat Tagespakete:** bis 31.01.2027, am 09.11. noch 83 Tage. Februar 2027 spätestens am 01.01.2027 im Katalog; die 45-Tage-Grenze fällt am 17.12.2026.

## Im Repo, nicht veröffentlicht
Skin Flechte und die internen Pakete `naturheilkunde`, `naturheilkunde-bilder` liegen nur verschlüsselt im Repo (`"freigegeben": false`, `docs/INTERN.md`). Die Klartext-Wache läuft vor Commit und Push, auch für Klartext zu verschlüsselten Dateien anderer Branches.

## Beschlossen, noch nicht gebaut
Kinder-Modus ab 6, Einstellungen in drei Schichten, „Wohin“, Mesh, Handy (Android, iOS), Schließfach. Gesamtkonzept im Projektdokument „OFFLINE-Gesamtkonzept“, nicht in `docs/`.

## Offen bei Code
- `bill/todo/` leer (09.11.); letzter Auftrag vom 26.10.
- **Prüferkette rot seit 08.11., auf jedem Branch:** `werkzeug/heute-neu.test.mjs` und `werkzeug/roman-spiele.test.mjs` warten beim Start fest auf `tage-2026-10`; die App räumt den Oktober seit dem 08.11. ab (`bereichVorbei`: mehr als 7 Tage nach Monatsende) und holt ihn nicht mehr. Vier Tests im Schritt „Lumi im MVP … (Nr. 28)“ laufen in die Zeitüberschreitung (Lauf 42544931150). Solange das so ist, kann kein Branch zusammengeführt werden. Dazu die Lücke aus `bill/rueckmeldung/2026-11-02-faltung.md`: Tagesrätsel auf „Spiele“ erst nach dem nächsten Neuzeichnen. Vorschlag in `bill/rueckmeldung/2026-11-09-faltung.md`, noch kein Auftrag.
- Nr. 48 „Blau für aktiv/gewählt, Rot nur für Warnung und Alarm“ (Mik 20.10.): Branch `nr-48-blau` mit Referenzbildern (Lauf 39410511283), nicht zusammengeführt; geht nicht mehr per fast-forward, vor dem Zusammenführen auf den Hauptbranch setzen und neu prüfen.
- Abnahme durch Bill für Nr. 26 und Nr. 38 bis 47 ist im Repo nicht vermerkt.
- Große Downloads: Fortschritt und Abbruch nur je 64-MB-Teil.
- `bereich`/`pflicht` in wir, lumi-buch, lumi-philosophie, pause erst mit der nächsten Ausgabe dieser Pakete; der Lumi-Tipp in `wir` nennt noch den alten Satz am Tagesende.
- Sandbox-Probe in der App unter Linux offen.
- Hilfe-Sätze: 14 passen nicht genau zum Code (vor allem „Pause ist Training für den Kopf“), wartet auf Bills Wortlaut.
- Parkmodus im Postfach (Stop-Hook) weckt die Session nicht verlässlich (Ursache offen).

## Offen bei Mik
- **Startreife:** D-U-N-S-Nummer für die digitalworld Academy OG, dann Apple Developer Program und Google Play als Firma, Azure Artifact Signing für Windows; Auftragsverarbeitung mit Hetzner im diwo-Konto. Liste: `bill/rueckmeldung/2026-10-07-startreife.md`.
- **Anker:** 42 MVP-Bildschirme bewerten, dazu der Bildsatz aus Nr. 21 (`bill/rueckmeldung/bilder/2026-10-anker-mvp/`); erst danach gelten die Referenzbilder als abgenommen.
- **Nr. 48:** Entscheidung, ob `nr-48-blau` zusammengeführt wird.
- **Desktop-Version** mit Nr. 45 und 47 (Tag und Release nur mit Miks Freigabe).
- **GitHub:** Wegwerf-Branches `wegwerf-nr21-abstand` und `wegwerf-nr21-alt` löschen (der Nachtlauf löscht nicht).
- Klartext-Vorfall 0759dc6 (16.10.): Datei entfernt, Historie bleibt, Entscheidung bei Mik.

## Extern wartend
Anwalt (35 Fragen, Haftung einer Notfall-App), Lizenzanfragen an Institutionen, ärztliche Prüfung der Guides.

## Gedächtnis
Wörter der Startlektüre (README, dieser Stand, Lehren; Grenze 2.500), eine Zeile je Faltung:
- 11.10.2026 · vorher 2.401 (damals ganzes Ideenbuch) · nachher 1.691, obwohl das README um die Festlegung „Stand und Log“ gewachsen ist
- 12.10.2026 · vorher 1.904 · nachher 1.824 (Nachtlauf; README unverändert, Stand gestrafft)
- 26.10.2026 · vorher 2.459 · nachher 2.251 (Nachtlauf; README unverändert, Stand mit Nr. 38–48 neu, Lehren aus den Ideenbuch-Einträgen ergänzt)
- 02.11.2026 · vorher 2.253 · nachher 2.274 (Nachtlauf; README unverändert, seit 26.10. nichts Neues; Stand gestrafft, Nr. 48 ohne fast-forward vermerkt, Vorrat neu gemessen)
- 09.11.2026 · vorher 2.303 · nachher 2.321 (Nachtlauf; README unverändert, seit 02.11. nichts Neues; Stand gestrafft, Vorrat neu gemessen, Lehren um den Tagesrätsel-Befund ergänzt; Faltung nicht zusammengeführt, weil die Prüferkette rot ist)
