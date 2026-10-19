# Status-Log

Log nach der Festlegung vom 11.10.2026 (Stand und Log, `bill/README.md`): Hier landet, was bei einer Faltung aus `bill/STATUS.md` herausfällt. Einträge werden nie geändert oder gelöscht, neueste oben. Wird am Sessionstart nicht gelesen, nur gezielt aufgeschlagen.


## 2026-10-19 · Stand vor der Faltung vom 19.10.2026

Unverändert übernommen; Überschriften eine Ebene tiefer. Herausgefallen sind die Einzelzeilen zu den abgenommenen Aufträgen Nr. 21 bis 37 (stehen in den Aufträgen, Rückmeldungen und `docs/CHANGELOG.md`); der neue Stand ergänzt Nr. 38 bis 42 und 0.9.3/0.9.4 aus Git-Log und CHANGELOG.

## Stand

Neu geschrieben bei der Faltung am 12.10.2026 (Code, Nachtlauf). Der vorige Stand liegt unverändert in `bill/status-log.md`, Änderungen je Version in `docs/CHANGELOG.md`. Wird bei jeder Faltung von Grund auf neu geschrieben.

### Kanal
Bill schreibt Aufträge nach `bill/todo/`, Code meldet nach `bill/rueckmeldung/`, Erledigtes liegt in `bill/erledigt/`. Nur Code ändert die App, Prioritäten setzt Mik. Festlegungen: `bill/README.md`.

### App
- **Veröffentlicht:** Desktop 0.9.2 (16.10.2026, Tag `v0.9.2`, Euer Polster) und Web-Version; zuvor 0.9.1 (16.10.). 0.9.1: neue Startseite (online/offline, vier Fragen, Hilfe nach Dauer), Suche, „Über OFFLINE“, Roman der Woche auf „Spiele“. MVP-Inhalt: Land wählen (Österreich voll; Deutschland, Schweiz mit Notrufnummern), zwölf Szenarien, Grundvorsorge (74 Punkte, sechs Bereiche), Radio je Bundesland, Sirenen, Notrufe, Naturheilkunde (erste Fassung), Karte (online), Bereit, Einstellungen, Spiele (`spiele-1`, nur Desktop). Unter „Bald“: Wikipedia, Wikivoyage, Offline-Karte, Lumi-Update, Tresor.
- **Katalog** (15.10.2026): at-basis 2026.10.08, heilkunde-grundstock 2026.10.15, spiele-1 2026.10.07.1, Wichteln, wikivoyage-de (ab 0.9.0 nicht mehr ladbar); Lumi-Pakete liegen dort, ab 0.9.0 nur für Nutzer, die sie schon haben.
- **Läuft:** Rust-Kern, Signatur, Delta-Updates, kiwix-serve, Store-Build ohne Updater und internen Kanal.
- **Vorrat Tagespakete:** bis 31.01.2027. Februar 2027 spätestens 01.01.2027; die 45-Tage-Grenze fällt am 17.12.2026.

### Im Repo, nicht veröffentlicht
Skin Flechte und die internen Pakete `naturheilkunde`, `naturheilkunde-bilder` liegen nur verschlüsselt im Repo (`"freigegeben": false`, `docs/INTERN.md`). Klartext-Wache vor Commit und Push.

### Beschlossen, noch nicht gebaut
Kinder-Modus ab 6, Einstellungen in drei Schichten, „Wohin“, Mesh, Handy (Android, iOS), Schließfach. Gesamtkonzept als Projektdokument „OFFLINE-Gesamtkonzept“, nicht in `docs/`.

### Offen bei Code
- Nr. 37 Rundgang Schweiz und ohne Netz: erledigt 16.10., zusammengeführt (Werkzeug, App unverändert), 4200 Prüfungen ohne Befund.
- Nr. 35: **0.9.2 veröffentlicht (16.10.2026, Tag `v0.9.2`)**, Mik freigegeben. Nr. 36 Akku-Karten: freigegeben und zusammengeführt, at-basis 2026.10.16 im Katalog (Katalog-Lauf nur dieses Paket), Web live; Desktop zeigt die Karten erst mit der nächsten App-Version (Darstellung ist App-Code). Vorrat bis 31.01.2027.
- Klartext-Vorfall 0759dc6 (16.10.): Datei entfernt, Wache geschärft (78fcd71), Historie bleibt (Mik/Bill).
- Nr. 34 Euer Polster: **abgenommen 16.10.** (Bill, verdeckt geprüft), mit Nachbesserung (gewählte Licht-Taste gefüllt), zusammengeführt, Web live (`offline-v41`). Desktop erst mit 0.9.2 nach Miks Wort.
- Nr. 32 (0.9.1 mit Nachtrag Roman auf Spiele) und Nr. 33 (Ideenbuch): **abgenommen 16.10.** (Bill, verdeckt geprüft), zusammengeführt, **0.9.1 veröffentlicht (16.10.2026, Tag `v0.9.1`)**, ohne Katalog-Lauf. Desktop hat damit Nr. 29–31.
- Nr. 29 Heute neu (Entwurf C) mit Nachbesserung: **abgenommen 15.10.** (Bill, live geprüft), zusammengeführt `eaf4204`, Web live (`offline-v38`); Desktop seit 0.9.1.
- Nr. 30 Suche mit Nachbesserung: **abgenommen 15.10.** (Bill, live ohne Netz geprüft), zusammengeführt `52edfb1`, Web live (`offline-v39`); Desktop seit 0.9.1.
- Nr. 31 Über OFFLINE: **abgenommen 15.10.** (Bill, verdeckt geprüft), zusammengeführt, Web live. Desktop seit 0.9.1.
- Nr. 28 mit Nachtrag 1 und 2 und Nachbesserung erledigt: **0.9.0 veröffentlicht (15.10.2026, Tag `v0.9.0`)**. Land wählen (DACH), Naturheilkunde erste Fassung (`heilkunde-grundstock` 2026.10.15 im Katalog), Einstellungen, Tresor/Lumi/Wikipedia/Wikivoyage/Karte unter „Bald“; Deutschland und Schweiz ohne österreichische Nummern und Sender. Nebenbei: „Tresor“ und „Updates & Abo“ fehlten seit 0.7.1 im Menü.
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

### Offen bei Mik
- **Startreife:** D-U-N-S-Nummer für die digitalworld Academy OG, dann Apple Developer Program und Google Play als Firma, Azure Artifact Signing für Windows; Auftragsverarbeitung mit Hetzner im diwo-Konto. Liste: `bill/rueckmeldung/2026-10-07-startreife.md`.
- **Anker:** 42 MVP-Bildschirme bewerten; dazu der Bildsatz aus Nr. 21 (88 JPG, `bill/rueckmeldung/bilder/2026-10-anker-mvp/`), erst danach gelten die Referenzbilder als abgenommen.
- **GitHub:** Wegwerf-Branches `wegwerf-nr21-abstand` und `wegwerf-nr21-alt` löschen (der Nachtlauf darf nicht löschen, HTTP 403).

### Extern wartend
Anwalt (35 Fragen, Haftung einer Notfall-App), Lizenzanfragen an Institutionen, ärztliche Prüfung der Guides.

### Gedächtnis
Wörter der Startlektüre (README, dieser Stand, Lehren; Grenze 2.500), eine Zeile je Faltung:
- 11.10.2026 · vorher 2.401 (damals ganzes Ideenbuch) · nachher 1.691, obwohl das README um die Festlegung „Stand und Log“ gewachsen ist
- 12.10.2026 · vorher 1.904 · nachher 1.824 (Nachtlauf; README unverändert, Stand gestrafft)

## 2026-10-12 · Stand vor der Faltung vom 12.10.2026

Unverändert übernommen; Überschriften eine Ebene tiefer. Herausgefallen ist nichts Inhaltliches: die Beschreibungen der Aufträge Nr. 21 bis 24 stehen nur noch in den Aufträgen selbst, die Einleitung ist kürzer.

## Stand

Neu geschrieben bei der Faltung am 11.10.2026 (Bill). Der vorige Stand mit der ganzen Release-Kette liegt unverändert in `bill/status-log.md`; die Änderungen je Version stehen in `docs/CHANGELOG.md`. Dieses Dokument wird bei jeder Faltung von Grund auf neu geschrieben, nicht fortgeschrieben.

### Kanal
Bill schreibt Aufträge nach `bill/todo/`, Code meldet nach `bill/rueckmeldung/`, erledigte Aufträge liegen in `bill/erledigt/`. Nur Code ändert die App. Prioritäten setzt Mik. Arbeitsweise und Festlegungen: `bill/README.md`.

### App
- **Veröffentlicht:** Desktop 0.8.0 (08.10.2026, Tag `v0.8.0`) und die Web-Version. Inhalt fürs MVP: zwölf Szenarien auf Notfall und Vorsorge, Grundvorsorge in sechs Bereichen (74 Punkte, Haushalt-Filter), Radio je Bundesland, Sirenen zum Anhören, Notrufe, Offline-Karte, Bibliothek mit Wikivoyage, Tresor, Bereit, Spiele (`spiele-1`, nur Desktop).
- **Katalog:** at-basis 2026.10.08, spiele-1 2026.10.07.1, Wichteln, wikivoyage-de; dazu die Lumi-Pakete (nicht im MVP).
- **Läuft:** Rust-Kern, Signatur und Delta-Updates, kiwix-serve, Store-Build ohne Updater und internen Kanal.
- **Vorrat Tagespakete:** bis 31.01.2027. Tagespaket Februar 2027 spätestens 01.01.2027; die 45-Tage-Grenze fällt am 17.12.2026.

### Im Repo, nicht veröffentlicht
- Skin Flechte, nur verschlüsselt (`"freigegeben": false`).
- Intern, nur über den internen Kanal: `naturheilkunde`, `naturheilkunde-bilder`.
- Unveröffentlichtes liegt nur verschlüsselt im Repo (Regel Nr. 13, `docs/INTERN.md`); Klartext-Wache vor Commit und Push.

### Beschlossen, noch nicht gebaut
Kinder-Modus ab 6, Einstellungen in drei Schichten, „Wohin“, Mesh, Handy (Android und iOS), Schließfach. Gesamtkonzept als Projektdokument „OFFLINE-Gesamtkonzept“, noch nicht in `docs/`.

### Offen bei Code
- **Nr. 24** Wikipedia und Wikivoyage als Module (Desktop, nicht im Installer), Nachtrag zu 0.8.0: Österreich-Basis lädt still nach, doppelte Klammer bei USB (`bill/todo/`).
- **Nr. 23** Befunde aus Miks Anker-Bewertung: Vorschau-Bilder lesbar, Altersfrage wird Empfehlung, drei Kandidaten für den Satz am Tagesende, Farbcode in Bereit breit (`bill/todo/`).
- **Nr. 22** Impressum und Datenschutz mit den Daten der OG (`bill/todo/`).
- **Nr. 21** Bildvergleich und Barrierefreiheit, nur MVP-Seiten, mit Anker-Bildsatz (`bill/todo/`).
- **Rückfragen zu 0.8.0** (Nr. 20): Bereit zählt nur die 20 alten Punkte; Sirenentöne nachgebildet (prüfen); Haushalt-Wörter; doppelte Klammer bei USB.
- **Große Downloads:** Fortschritt und Abbruch nur je 64-MB-Teil (Ideenbuch, offen).
- **Bereich in bestehenden Paketen:** at-basis, wir, lumi-buch, lumi-philosophie, pause tragen `bereich`/`pflicht` erst mit ihrer nächsten Ausgabe.
- **Sandbox-Probe in der App unter Linux** offen; Windows grün.
- **Hilfe-Sätze:** 14 Sätze passen nicht genau zum Code, vor allem „Pause ist Training für den Kopf“; wartet auf Bills Wortlaut.

### Offen bei Mik
- **Startreife:** D-U-N-S-Nummer für die digitalworld Academy OG beantragen (Herausgeber seit 11.10.), dann Apple Developer Program und Google Play als Firma, Azure Artifact Signing für Windows; Auftragsverarbeitung mit Hetzner im bestehenden diwo-Konto. Liste: `bill/rueckmeldung/2026-10-07-startreife.md`.
- **Anker:** 42 MVP-Bildschirme bewerten.

### Extern wartend
Anwalt (35 Fragen, dazu Haftung bei einer Notfall-App), Lizenzanfragen an Institutionen, ärztliche Prüfung der Guides.

### Gedächtnis
Wörter der Startlektüre (README, dieser Stand, Lehren im Ideenbuch; Grenze 2.500), eine Zeile je Faltung:
- 11.10.2026 · vorher 2.401 (damals ganzes Ideenbuch) · nachher 1.691, obwohl das README um die Festlegung „Stand und Log“ gewachsen ist

## 2026-10-11 · Stand vor der ersten Faltung

Unverändert übernommen; Überschriften eine Ebene tiefer.

### Stand (bis 08.10.2026)

Aktualisiert: 2026-10-08, Code (Release 0.8.0: zwölf Szenarien, Grundvorsorge, Radio, Sirenen zum Anhören); davor 2026-10-08 (Release 0.7.2); davor 2026-10-07 (Release 0.7.1); davor 2026-10-07 (Release 0.7.0); davor 2026-10-07 (Release 0.6.5); davor 2026-10-07 (Release 0.6.4); davor 2026-10-06 (Release 0.6.3; Lumi-Bestandsaufnahme); davor 2026-10-06 (Release 0.6.2, Was die Lumis denken); davor 2026-10-06 (Regel fürs öffentliche Repo, Nr. 13); davor 2026-10-06 (Nachtrag: Tafel-Sichtprüfung, Klartext-Wache, Schlüsselwechsel); 2026-10-05, Code (Release 0.6.1); vorher 2026-09-29, Bill (Ergänzungen Code: Material in `bill/eingang/2026-09-29-bill/`, Paket-Kit in `paket-kit/`)

### Kanal
Bill schreibt Aufträge nach `bill/todo/`, Code meldet nach `bill/rueckmeldung/`, erledigte Aufträge liegen in `bill/erledigt/`. Nur Code ändert die App. Prioritäten setzt Mik. Das Protokoll steht im Projekt („OFFLINE-Bill-Zentrale").

### App (laut Code)
Desktop **0.8.0 veröffentlicht** (08.10.2026, Tag `v0.8.0`): zwölf Szenario-Karten auf Notfall und Vorsorge, Grundvorsorge in sechs Bereichen (74 Punkte, Haushalt-Filter, Merkliste, Export, Drucken, Zurücksetzen; alte Häkchen übernommen), Radio je Bundesland, Sirenen zum Anhören. Davor 0.7.2 (08.10.2026): Vorschau in der Bibliothek als großes Fenster, „Übersicht“ heißt „Bereit“, 60 Pause-Geschichten, Lumisch ohne Figur bei selbst geladenem Paket, Altersfrage für Pakete ab 18, Store-Build (ohne Updater und internen Kanal), ehrliche Beschreibung, Leaflet lokal. Davor 0.7.1 (07.10.2026): Pause mit fünf Stufen als Wörter (Start „mit Biss“, Höherstellen nur als Einladung, leiser Abstieg), neue Inhalte (55 Fehler-Geschichten, je 30 Ruhe-Varianten, Kaffeehaus-Logik, Kopfnuss, Gedanke am Fluss, 100 Lumisch-Aufgaben), Lumi aus heißt ohne Lumisch, keine Zahlen über Leistung; Miks Fehler aus 0.7.0 (alle Tage-Pakete kommen von selbst, Bereit-Karte mit einer Zahl, Tagesrätsel erledigt, Heft, Lumi-Buch, Seitenleiste ohne KI). Davor 0.7.0 (07.10.2026): Lumi-Seite (`#lumi`, unter „Mehr“; Figur, Satz des Tages, Menü, Kästchen; auf Heute klein), Bibliothek als Laden (Neu · Bald · Auf deinem Gerät, an/aus für alle Pakete, Österreich-Basis und Tage „immer an“), `bereich` statt `kategorie` (mit `app_min` 0.7.0), Lumisch als eigenes Paket, Nachtrag Spielpaket (langer Druck bei Minen). Davor 0.6.5 (07.10.2026): Rätsel zum Knobeln in Pause (Modul `spiele-1`: Lichter, Netz, Muster, Brücken, Minen, Sudoku, 2048; Tagesrätsel für alle gleich; nur Desktop), WebAssembly in der Sandbox nur mit Anmeldung und Redaktionsschlüssel (Zweck `wasm`), Lizenzen unter „Über“, Abkürzungen zweiter Teil (eine Klammer, Überschriften mit ganzem Wort, Webseite). Davor 0.6.4 (07.10.2026): Pause fordert mehr (Startstufe 2, Lumisch in drei Stufen, Fehler bis Stufe 2), Lumi still im Happen, Abkürzungen beim ersten Vorkommen ausgeschrieben (`web/abkuerzungen.js`). Davor 0.6.3 (06.10.2026): interner Kanal in der Mac-App behoben (`sha256Hex`), Lumi schweigt auf den Leseseiten. Davor 0.6.2 (06.10.2026): „Was die Lumis denken“ (Paket `lumi-philosophie`, fünfzehn Gedanken für Erwachsene, Lumisch zum Anhören, Katalogfeld `hinweis`). Davor 0.6.1 (05.10.2026; 0.5.1 bis 0.6.0 am selben Tag, 0.3.3 bis 0.5.0 am 04.10.): Bilder für die Naturheilkunde (nur intern, 210 von Commons, Lizenz geprüft, Fotos per Sichtprüfung), interner Kanal (verschlüsselt, nur mit Freischalt-Link, `docs/INTERN.md`), Naturheilkunde nur intern (Bereich nur mit installiertem Paket), „Mein Tag“ (eine Uhr für Tagesschluss, Lumi-Schlaf und Pause, auf die halbe Stunde, Vorschlag höchstens zweimal), Lumisch anhören (Umschrift mit deutscher Stimme), „Nach neuer Version suchen“ auch im Web (iPad, iPhone, Browser; `web/version.json`, „Jetzt laden“ über den Service Worker, stille Prüfung einmal am Tag mit rotem Punkt), 14 Hilfetexte richtiggestellt (pause-linie 7 ohne Wirkversprechen), Moduldaten bleiben beim Sperren des Tresors (Fehler seit 0.2.0 behoben), Info und Hilfe auf acht Seiten, Lumisch mit 500 geprüften Wörtern (kir → kiv übernommen), Seite „Updates & Abo“ aufgeräumt (Was ist neu mit Reitern und rotem Punkt, Blatt, Info und Hilfe), `wir` wird still nachgeladen, zwei Arten von Buch-Lücken, Schlussstück; das Lumi-Buch (Paket `lumi-buch` 2026.10.05, Link „Aus dem Lumi-Buch“, Buch mit Lücken und Vorlesen), zarter Stil für die ganze App (ein Hauptknopf je Bildschirm, Kontrasttest 4,5 : 1 hell, dunkel und Flechte), Pause mit eigenem Raum (`#pause`, Einladung auf Heute statt Fenster, Happen als Fokus-Bildschirm, zarte Werte `--z-*`), Startseite ohne KI-Versprechen und mit „kommt“, Startseite mit vier Preisstufen, Pause-Nachtrag (Rückspiegel ohne Zählung, Lumisch ab Tag 22), ⏸ Pause Stufe 1 (Happen, Dirigent ohne KI, Deine Linie, Spiel-Log, `offline.spiel`), Lumi-Knöpfe je Sorte, Bewertung, Heft (Log mit Stern), Vorhaben in Vorsorge, eine Lumi-Stimme; Antwortfeld beim Tagesrätsel (Paketfeld `antworten`), Tipps nach Grundsatz (Bedingungswort `funktion`), „Was ist neu“ (Quelle `web/neues.json`, Test auf den Eintrag der aktuellen Version), Tagesseite mit Vorratskammer (Tagespakete tage-2026-10 bis tage-2027-01, Vorrat bis 31.01.2027), Module, Bereit v2 mit Übergang, die Lumi mit drei Stufen (Standard Textkarten) und Nachtschlaf, Skins, app_min. Web-Version wird per Workflow „Web-Version“ aus den veröffentlichten Paketen gebaut. Katalog: at-basis 2026.10.08 (Szenarien, Grundvorsorge, Radio, Sirenen; app_min 0.8.0), lumi-philosophie 2026.10.06.1 (Was die Lumis denken, ab 18, Aquarelle KI-generiert), wir 2026.10.04.4 (175 Tipps, alle mit `buch`, 16 mit `ziel`, 20 warten auf eine Funktion), lumi-buch 2026.10.05.2 (Band 1), pause 2026.10.08 (60 Geschichten, app_min 0.7.1), spiele-1 2026.10.07.1 (Modul, Bereich Pause, Redaktionsschlüssel, 1,6 MB), lumisch 2026.10.07.1 (100 Aufgaben, app_min 0.7.1), Wichteln 2026.10.04 (meldet ins Spiel-Log), Wichteln 2026.09.29 (Modul, Redaktionsschlüssel), wikivoyage-de. Läuft: Rust-Kern, Signatur und Delta-Updates, kiwix-serve, Wikivoyage, Österreich-Basis, Offline-Karte, Tresor v1, Bibliothek, Werkzeuge, Bereit-Anzeige, das Wesen.

### Im Repo, noch nicht veröffentlicht
- Skin Flechte (2026.10.04, zarte Grundwerte) nur in der lokalen Redaktionsablage, **nicht veröffentlicht**; im Repo seit 06.10. nur verschlüsselt (`"freigegeben": false`).
- **Regel fürs öffentliche Repo** (Nr. 13, 06.10.): Unveröffentlichtes nur verschlüsselt (`<wurzel>/verschluesselt/`), Kennzeichnung `"freigegeben": false`, Auszüge in `bill/beilagen/`; Freigeben Schritt für Schritt in `docs/INTERN.md`.
- Redaktionsschlüssel `d9b62d1755ba3744` (nur Module und Skins), privat nur auf Miks Mac.

Intern (nur über den internen Kanal, im Repo nur verschlüsselt): Pakete `naturheilkunde` (Abkürzungen PI, Bayer, ÖÄK nach Bills Entscheidung, neue Ausgabe 07.10.) und `naturheilkunde-bilder` 2026.10.06 (209 Bilder, 28,8 MB; alle Tafeln per Sichtprüfung, Haselwurz-Tafel verworfen). Klartext-Wache vor Commit und Push (`werkzeug/klartext-wache.mjs`, `.githooks/`), Schlüsselwechsel in `docs/INTERN.md`.

Alles andere im Repo ist veröffentlicht: Tagesseite mit Roman der Woche und Vorratskammer (seit 0.3.0), Bereit Version 2, die Lumi mit Paket `wir` (175 Tipps), Pause, Paket-Kit und Module (Wichteln im Katalog), das Lumi-Buch.

### Beschlossen, noch nicht im Repo
- Kinder-Modus ab 6
- Einstellungen in drei Schichten
- „Wohin“
- Mesh
- Handy (App für Android und iOS)
- Schließfach (verschlüsselte Sicherung, auf der Startseite mit „kommt“)
- Gesamtkonzept: Projektdokument „OFFLINE-Gesamtkonzept“ (Fassung 6), noch nicht in `docs/`

### Offen bei Code (wartet)
- **Rundgang vor jedem Release** (Regel Bill 07.10.): frisches Gerät und langjähriger Benutzer, Bilder in „OFFLINE - Home/rundgang/<version>/“.
- **Rückfragen zu 0.8.0** (Nr. 20): Bereit zählt weiter nur die 20 alten Punkte; Sirenentöne nachgebildet (prüfen); Haushalt-Wörter; doppelte Klammer bei USB.
- **Startreife Teil 1** (Nr. 19) erledigt mit 0.7.2; offen bei Mik: D-U-N-S, Konten, Anschrift für Impressum, Hetzner-Betriebsprotokolle und Auftragsverarbeitung. Gefunden: Fortschritt und Abbruch bei großen Downloads nur je 64-MB-Teil (Vorschlag für 0.7.3).
- **Startreife** (Nr. 18, 07.10.): Liste in `bill/rueckmeldung/2026-10-07-startreife.md`. Zuerst D-U-N-S-Nummer und Konten (Mik), Signaturen für Mac und Windows, dann die Handys (Kiwix im Kern).
- **Bereich in bestehenden Paketen:** at-basis, wir, lumi-buch, lumi-philosophie, pause tragen `bereich`/`pflicht` erst mit ihrer nächsten Ausgabe (`app_min` 0.7.0); bis dahin ordnet die App sie selbst zu.
- CI `tests.yml` läuft seit 29.09. bei jedem Push (Werkzeug, Kit, Bereit, Lumi, Kern, Sandbox-Probe).
- Sandbox-Probe in der App: Windows grün (Windows-Probe 07.10., 49 von 49 Angriffen blockiert, dazu Spiele-Probe unter Edge); Linux in der App noch offen (Berechtigungstest läuft auf Linux).

### Offen bei Mik
Gesamtkonzept: alle Fragen entschieden (Fassung 9, 05.10.). Neue Fragen stehen im Lagebild.

### Extern wartend
Anwalt (35 Fragen), Lizenzanfragen an Institutionen, ärztliche Prüfung der Guides.

### Aufträge
Erledigt: `2026-09-29-paket-kit-pflichtenheft-und-status` (Rückmeldung vom 29.09.), Antwort von Bill vom 29.09. (Rückmeldung `2026-09-29-antwort-bill`), Freigabe Module (Rückmeldung `2026-09-29-freigabe-module`), Abgleich (Rückmeldung `2026-09-29-abgleich`; Sirenen-Text korrigiert, ausgeliefert mit at-basis 2026.09.29.1),, `2026-09-29-paket-kit-werkzeug` (Rückmeldungen Phase A–E), `2026-09-29-bereit-v2`, `2026-09-29-lumi-einbau`, `2026-09-29-flechte-als-paket`, `2026-09-29-release-wichteln` (Rückmeldung vom 30.09.), `2026-09-29-lumi-nachtrag` und Web-Version (Rückmeldung `2026-09-30-web-version-und-lumi-nachtrag`), `2026-09-30-tagesseite-vorratskammer` (Rückmeldung vom 30.09.), `2026-09-30-dezember-und-tippfix` und `2026-09-30-was-ist-neu` (Rückmeldung `2026-09-30-dezember-tippfix-was-ist-neu`). `2026-10-01-tipps-und-jaenner` (Rückmeldung vom 01.10.). `2026-10-01-raetsel-eingabe` (Rückmeldung vom 04.10.), `2026-10-04-lumi-knoepfe` mit Nachtrag (Rückmeldung vom 04.10.), `2026-10-04-pause-stufe1` und `2026-10-04-wir-drei-tipps` (Rückmeldung vom 04.10.). `2026-10-04-preise-webseite` und `2026-10-04-pause-nachtrag` (Rückmeldung vom 04.10.). `2026-10-04-pause-umbau` und `2026-10-04-webseite-ehrlich` (Rückmeldung vom 04.10., 0.4.2). `2026-10-04-stil-zart-app` (Rückmeldung vom 04.10., 0.4.3; Flechte 2026.10.04 nur lokal). `2026-10-04-lumi-buch-app` (Rückmeldung vom 04.10., 0.5.0). `2026-10-05-version-0-5-1` (Rückmeldung vom 05.10., 0.5.1). `2026-10-05-updates-seite` (Rückmeldung vom 05.10., 0.5.2). `2026-10-05-lumisch-und-buchhinweis` (Rückmeldung vom 05.10., 0.5.3). `2026-10-05-info-und-hilfe` und `2026-10-05-nachtrag-lumisch-500-und-buch` (Rückmeldung `2026-10-05-version-0-5-4`, 0.5.4). `2026-10-06-naturheilkunde-nachtrag` (Rückmeldung vom 06.10., ohne App-Version). `2026-10-06-repo-regel-verschluesseln` (Nr. 13, Rückmeldung `2026-10-06-repo-regel`, ohne App-Version). `2026-10-06-lumi-philosophie` (Nr. 12, Rückmeldung `2026-10-06-version-0-6-2`, 0.6.2). `2026-10-06-intern-webkit-und-lumi` (Rückmeldungen `2026-10-06-version-0-6-3` und `lumi-bestand`). `2026-10-07-pause-ausbau-und-abkuerzungen` (Rückmeldung `2026-10-07-version-0-6-4`). Wartet auf Bill: Anpassung von 14 Hilfe-Sätzen, die nicht genau zum Code passen, vor allem „Pause ist Training für den Kopf“ (Regel „kein Gehirntraining“). Bildschirmfotos: Web-Bilder reichen (Bill, 05.10.). Als Nächstes nötig: Tagespaket Februar 2027, spätestens 01.01.2027 (Regel „zwei Monate voraus“, 45-Tage-Grenze am 17.12.).
