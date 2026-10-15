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
- Nr. 24 erledigt und zusammengeführt (14.10., Rückmeldung), live in der Web-Version: Österreich-Basis aktualisiert sich still, eine Klammer bei „USB-Stick“, unter „Bald“ Wikipedia, Wikivoyage, Karte und „Das Lumi-Update“ als Vorschau, nicht ladbar (Abschnitt B entfällt fürs MVP). Rundgang liegt in `werkzeug/rundgang/`.
- Nr. 27 erledigt und zusammengeführt (14.10., Rückmeldung), live in der Web-Version: Lumi im MVP nur als Vorschau. Ohne Namen keine Figur, Lumi-Seite, Einladung und Tipps (`wir` steht mit unter „Das Lumi-Update“); mit Namen alles wie bisher.
- Nr. 22 Nachtrag erledigt (14.10.): Impressum vollständig nach dem Firmenbuchauszug (Rechtsform, Unternehmensgegenstand Bildungsinstitut, Offenlegung nach § 25 Mediengesetz mit Gesellschaftern und Blattlinie), kein „wird ergänzt“ mehr; Wirtschaftskammer und Gewerbebehörde entfallen.
- Nr. 26 erledigt und zusammengeführt (15.10., Rückmeldung) nach grüner Windows-Probe ohne Wartetrick: Ein offenes Blatt bleibt beim Neuzeichnen offen, Fortschrittsbalken haben Namen, Quellenzeile der Karte mit Kontrast und unterstrichenen Links, Hilfe-Blatt per Tastatur erreichbar; `werkzeug/barrierefrei-ausnahmen.json` ist leer. Wartet auf Bills Held-out.
- Nr. 23 erledigt und zusammengeführt (14.10., Rückmeldung und Nachtrag), jeweils nach grüner Windows-Probe: Vorschau-Bild zum Vergrößern antippen, „Empfohlen ab …“ statt Altersfrage, Bereit mit Farbcode je Quelle; Referenzbilder von Bereit und Bibliothek neu gesetzt. Satz am Tagesende nach Miks Wahl (Kandidat a): „Genug für heute. Morgen geht es hier weiter.“ Der Lumi-Tipp in `wir` nennt noch den alten Satz (nächste Ausgabe des Pakets).
- Nr. 25 erledigt (13.10., Rückmeldung): Windows-Probe grün auf dem Hauptbranch, ohne Lockerung. Die alte App 0.1.8 läuft gegen einen eingefrorenen, signierten Katalog (`werkzeug/probe-katalog/`), dazu der Weg 0.8.0 → neu und genau ein Eintrag unter den installierten Apps. Der Befund am offenen Blatt ist mit Nr. 26 behoben.
- Nr. 21 von Bill abgenommen (13.10.): Bildvergleich und Barrierefreiheit (axe-core) laufen in `tests.yml`; ihre vier Ausnahmen sind seit Nr. 26 behoben.
- Nr. 22 Impressum und Datenschutz zusammengeführt (13.10.) nach grüner Windows-Probe; das Hersteller-Feld lässt das Update unter Windows sauber (ein Eintrag, gleicher Ort, Daten bleiben). Die Web-Version zeigt das Impressum seit dem Zusammenführen (Vercel baut den Hauptbranch selbst).
- Rückfragen zu 0.8.0 (Nr. 20) beantwortet in Nr. 24: Bereit zählt vorerst nur die 20 alten Punkte; Mik hört die Sirenentöne einmal gegen die Hörbeispiele ab; Haushalt-Wörter passen.
- Große Downloads: Fortschritt und Abbruch nur je 64-MB-Teil (Ideenbuch, offen).
- `bereich`/`pflicht` in at-basis, wir, lumi-buch, lumi-philosophie, pause erst mit der nächsten Ausgabe.
- Sandbox-Probe in der App unter Linux offen.
- Hilfe-Sätze: 14 passen nicht genau zum Code (vor allem „Pause ist Training für den Kopf“), wartet auf Bills Wortlaut.

## Offen bei Mik
- **Startreife:** D-U-N-S-Nummer für die digitalworld Academy OG, dann Apple Developer Program und Google Play als Firma, Azure Artifact Signing für Windows; Auftragsverarbeitung mit Hetzner im diwo-Konto. Liste: `bill/rueckmeldung/2026-10-07-startreife.md`.
- **Anker:** 42 MVP-Bildschirme bewerten; dazu der Bildsatz aus Nr. 21 (88 JPG, `bill/rueckmeldung/bilder/2026-10-anker-mvp/`), erst danach gelten die Referenzbilder als abgenommen.
- **GitHub:** Wegwerf-Branches `wegwerf-nr21-abstand` und `wegwerf-nr21-alt` löschen (der Nachtlauf darf nicht löschen, HTTP 403).

## Extern wartend
Anwalt (35 Fragen, Haftung einer Notfall-App), Lizenzanfragen an Institutionen, ärztliche Prüfung der Guides.

## Gedächtnis
Wörter der Startlektüre (README, dieser Stand, Lehren; Grenze 2.500), eine Zeile je Faltung:
- 11.10.2026 · vorher 2.401 (damals ganzes Ideenbuch) · nachher 1.691, obwohl das README um die Festlegung „Stand und Log“ gewachsen ist
- 12.10.2026 · vorher 1.904 · nachher 1.824 (Nachtlauf; README unverändert, Stand gestrafft)
