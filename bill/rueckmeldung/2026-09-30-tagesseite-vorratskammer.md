# Rückmeldung: Tagesseite mit Vorratskammer, ausgeliefert mit 0.3.0

**Von:** Code (lokale Session) · **Datum:** 2026-09-30 · **Auftrag:** `bill/erledigt/2026-09-30-tagesseite-vorratskammer.md` · **Branch:** `tagesseite` (zusammengeführt, gelöscht) · **Tag:** `v0.3.0`

## Ergebnis
- **App 0.3.0 ist ausgeliefert** (`app/latest.json`, 30.09.2026, 12:19 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux sind abrufbar.
- **Web-Version 0.3.0** mit Tagesseite und denselben Tagespaketen, gespiegelt über den Workflow „Web-Version“.
- **Katalog** (erstellt 30.09.2026, 12:12 UTC, Signatur geprüft). Neu sind nur die Tagespakete, `at-basis` und `wir` sind unverändert:

| Paket | Version | Bereich | app_min | sha256 des Manifests |
|---|---|---|---|---|
| tage-2026-10 | 2026.09.30 | 01.10. bis 31.10.2026 | 0.3.0 | `28c450cd7421736cee3793d27652a30c101c0e62ebdcdb2aa9d79eb5874aea6a` |
| tage-2026-11 | 2026.09.30 | 01.11. bis 30.11.2026 | 0.3.0 | `1756f58680ff29c60516213104d6498d56f9797326ed831c5c2eac2848607ca0` |

## Umgesetzt
1. **Vorratskammer**
   - **Paketart `tage`:** nur Daten. Der Bereich steht im Manifest, nach Datum oder nach Tagnummer. Inhalt ist `inhalt/tage.json`, dazu Herkunft als `.md`. Keine Bilder, kein Code, höchstens 20 MB, `app_min` 0.3.0.
   - **Geprüft wird an drei Stellen:** im Werkzeug, im Kit (`paket-kit/tage-format.mjs`, Prüfprogramm) und im Rust-Kern.
   - **Laden:** Die App holt aus dem Katalog, was die Vorratstiefe verlangt (7, 30 oder 90 Tage, Standard 30), und schaltet jeden Tag einen frei. Monate, deren letzter Tag mehr als eine Woche vorbei ist, räumt sie weg.
   - **Ohne Netz:** Der Rhythmus läuft weiter, bis der Vorrat leer ist.
   - **Zählung:** in Kalendertagen des Geräts, nie in 24-Stunden-Schritten.
   - **Dokumentation:** `PAKETFORMAT.md` 2.5, `PAKET-KIT.md` 5b (Kopie im Kit), `SICHERHEIT.md`.
2. **Tagesseite als Startbildschirm („Heute“)**
   - Oben stehen die Bereit-Zahl und die Lumi (Figur nur bei „Lumi mit Tipps“), darunter die Karten des Tages, unten „Vorrat: noch N Tage“.
   - Jede Karte lässt sich erledigen oder weglegen. Danach kommt der feste Satz „Das war dein Tag. Bis morgen.“, spätestens zur eingestellten Uhrzeit.
   - Dazu gibt es den Knopf „Heute noch einmal ansehen“ und keinen Feed.
   - Die bisherige Startseite heißt jetzt „Übersicht“.
   - Wechselt das Datum bei offener App, schaltet die Seite von selbst um.
3. **Karten**
   - **Tagesrätsel:** mit Hinweis, Lösung und Erklärung.
   - **Roman der Woche:** jeden Montag ein neues Werk in sieben Tagesteilen, mit Leseansicht und Vorlesen.
   - **Die Lumi (eingeschaltet) oder die Textkarte des Tages (Standard):** ein Tipp, fest für den ganzen Tag. Es gelten dieselben Regeln wie für die Tipps, bei „Tipps aus“ gibt es keine Karte.
   - **Lektion:** als Karte vorgesehen, im Tagesplan ausgegraut („kommt später“).
4. **Tagesplan** (Übersicht)
   - **Einstellungen:** welche Karten, Schluss (spätestens 20, 21, 22 oder 23 Uhr oder ohne Uhrzeit, Standard 22), Vorratstiefe, Sparmodus.
   - **Gelernte Schicht:** Wird eine Karte eine Woche lang jeden Tag weggelegt, blendet die App sie aus. Die Tagesseite sagt es in einem Satz und bietet „Rückgängig“ an. Nach dem ersten Zurücknehmen ist eine Woche Ruhe, nach dem zweiten gilt die Karte als fest eingestellt.
5. **Blackout und Sparmodus:** Die Tagesseite ist in jeder Lage gleich. Einen Sparmodus gab es bisher nicht, deshalb gibt es jetzt einen Schalter im Tagesplan: Er blendet die Lumi-Figur aus, die Karten haben ohnehin keine Bilder.
6. **Handy zuerst:** Bei 360 px läuft nichts seitlich über, alle Knöpfe sind mindestens 44 px hoch (gemessen 49 px). Die Web-Version hat die Tagesseite ebenfalls.

## Inhalte
- **61 Tagesrätsel**, eigene Texte: 44 einfach, 17 mittel (Logik, Zahlen, Wort, Alltag).
  - Bekannte Denkaufgaben wie die drei Lichtschalter oder Fuchs, Gans und Getreide sind neu erzählt.
  - Jede Lösung habe ich nachgerechnet. Ein eigener Entwurf ging nicht auf und ist gestrichen.
  - Sie reichen vom 1. Oktober bis 30. November 2026, ein Rätsel pro Tag.
- **Roman der Woche, Vorschlag und gebaut.** Alle vier Autoren sind vor 1956 gestorben, alle Texte stammen von Wikisource im Stand „fertig“, transkribiert nach einem Druck des 19. Jahrhunderts mit Scans. Es sind keine Übersetzungen und keine neuen Bearbeitungen.

| Woche ab | Werk | Autor | gestorben | Vorlage |
|---|---|---|---|---|
| Mo 5.10. | Kleider machen Leute | Gottfried Keller | 1890 | Die Leute von Seldwyla, Bd. 3, Göschen, Stuttgart 1874 |
| Mo 12.10. | Die Judenbuche | Annette von Droste-Hülshoff | 1848 | Morgenblatt für gebildete Leser 1842, Nr. 96–111 (Erstausgabe), Cotta |
| Mo 19.10. | Aus dem Leben eines Taugenichts | Joseph von Eichendorff | 1857 | Vereinsbuchhandlung, Berlin 1826 |
| Mo 26.10. | Der Schimmelreiter | Theodor Storm | 1888 | Gebrüder Paetel, Berlin 1888 |

  - **Teilung:** Der Wortlaut ist unverändert. Weggelassen sind Seitenzahlen, Titelseiten, Nachspann und die Anmerkungen von Wikisource. Die Teile sind möglichst gleich lang, der Taugenichts ist kapitelweise geteilt.
  - **Herkunft:** Wikisource-Version und Scans je Werk stehen in `inhalt/herkunft.md`.
  - **Werkzeuge:** `werkzeug/wikisource-holen.mjs` holt die Texte, `pakete/tage/bauen.mjs` baut die Monatspakete daraus.
- **Nicht aufgenommen:** Stifters „Bergkristall“ liegt auf Wikisource nicht als eigene Seite vor, eine geprüfte Ausgabe hatte ich damit nicht. Weitere Titel mit unklarer Ausgabe gab es nicht.

## Geprüft
- **Tests**
  - `web/tag.test.mjs`, 10 Fälle:
    - Freischaltung nach Datum und nach Tagnummer, Datumswechsel um Mitternacht.
    - Beide Uhrumstellungen 2026 und der Schalttag.
    - Fünf Zeitzonen (Wien, Auckland, New York, Samoa, Honolulu) in Unterprozessen.
    - Vorrat, auch leer; Vorratstiefe 7, 30 und 90; Aufräumen.
    - Schluss erledigt, Schluss nach Uhrzeit, Textkarte des Tages, gelernte Schicht.
    - Die gebauten Pakete: 61 Tage, 28 Kapitel, jedes Werk beginnt an einem Montag.
  - Alle Node-Tests: 72 von 72.
  - Rust-Kern: neuer Test für die Paketart `tage`.
- **CI:** Die Tests laufen grün unter Linux, macOS und Windows (App-Berechtigungen).
- **Windows-Probe (Lauf `36712471193`):** grün.
  - Nach dem Update von 0.1.8 ist die Tagesseite der Startbildschirm.
  - Bereit steigt von 51 auf 56.
  - Die Sandbox hält 42 von 42 Angriffen ab.
  - Wichteln läuft vollständig, die Einladung kommt nach einer Woche.
- **Test-App (macOS, frische Kennung `at.digioneer.offline.tagtest`):**
  - Frisch installiert „Vorrat: leer“. Die Tagespakete kamen von einem eingehängten Plattenabbild („Datenträger durchsuchen“), geprüft mit Signatur und Prüfsummen. Danach am 30.09. „Vorrat: noch 61 Tage“.
  - **1.10.:** Rätsel und Textkarte, Lösung, erledigt, gelesen, dann „Das war dein Tag. Bis morgen.“
  - **30.10.:** Einladung der Lumi, Schimmelreiter Teil 5, Leseansicht.
  - **29.11.:** „noch 2 Tage“.
  - **1.12.:** „Vorrat: leer“ mit Hinweis, kein Fehler. Der Oktober ist weggeräumt, der November bleibt bis eine Woche nach seinem Ende.
- **Beim Durchlauf gefunden und behoben:**
  - Die Leseansicht übernahm die Scrollposition der Tagesseite.
  - Bei leerem Vorrat fehlte der Hinweis, wenn noch eine Textkarte da war.
  - Die Vorratszählung war anfangs „lückenlos ab heute“ und zeigte am 30.09. „leer“, obwohl ab morgen 61 Tage bereitlagen.
  - In der Windows-Probe eine Klick-Wettlaufsituation, bereinigt im Testskript.

## Hinweise und offene Punkte
- **Netz aus:** In der Test-App nicht wirklich abgeschaltet, das wäre eine Systemeinstellung.
  - Belegt ist der Punkt trotzdem: Die Tagesseite liest nur, was auf dem Gerät liegt, die Pakete kamen dort ohne Katalog vom Datenträger, und der Rhythmus hängt nur am Kalenderdatum (Tests).
  - Ohne Netz sagt die Vorratszeile „ohne Netz geht es weiter“ bzw. bei leerem Vorrat „Sobald du wieder online bist …“.
- **Der Vorrat reicht bis 30. November 2026.** Für Dezember braucht es ein Paket `tage-2026-12`: Rätsel und vier weitere Romanwochen, dafür wäre Advent ein naheliegendes Thema.
  - Baukasten und Werkzeuge stehen, der Aufwand ist Redaktion.
  - Ohne neues Paket zeigen die Geräte ab 1. Dezember „Vorrat: leer“ mit Hinweis.
- **Inhaltsfehler im Paket `wir` (nicht Teil dieses Auftrags):** Der Tipp `alltag-020` („Der Treffpunkt im Tresor ist eingetragen. Weiß deine Familie ihn auch? …“) hat keine Bedingung. Er erscheint deshalb auch, wenn gar kein Treffpunkt eingetragen ist. Vorschlag: umformulieren oder an eine Bestätigung des Treffpunkts binden.
- **Apps bis 0.2.1** sehen die Tagespakete im Katalog als „Braucht App 0.3.0“ und laden sie nicht.
- **Entwickler-Build:** Das vorgestellte Datum greift erst nach dem ersten Neuzeichnen. Das betrifft nur die Testleiste, nicht die ausgelieferte App.
