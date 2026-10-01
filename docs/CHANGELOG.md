# Änderungen

## 0.3.2 · 01.10.2026 · Tipps nach Grundsatz, Jänner

- **Tipps** (Paket `wir`, 175 Tipps): Grundsatz „ein Tipp behauptet nie etwas, das die App nicht weiß, und nennt keine Funktion, die es nicht gibt“. Neues Bedingungswort `funktion` mit der Liste `FUNKTIONEN` in `web/wesen.js`; 19 Tipps warten auf ihre Funktion (ältere Apps lassen sie weg). Zustandsbehauptungen umformuliert, alte Punktzahlen durch „hebt deine Bereit-Zahl“ ersetzt, `app-005`, `app-010`, `app-020` an den Stand angepasst, `laune-010` gestrichen. Test: Jeder Tipp, der eine Funktion nennt, findet sie in der App oder hat eine `funktion`-Bedingung.
- **Tagespaket Jänner 2027** (`tage-2027-01`): 31 neue Rätsel; Stifter „Der Condor“, Mörike „Mozart auf der Reise nach Prag“, Gotthelf „Die schwarze Spinne“, Fontane „Unterm Birnbaum“. Holwerkzeug: Kapitelseiten mit `{{Navigation}}`, Gartenlauben-Fortsetzungen, Gedichte mit Schrift-Auszeichnung.
- **Regel „zwei Monate voraus“** in `bill/README.md`, Werkzeug `werkzeug/vorrat-stand.mjs`.

## 0.3.1 · 30.09.2026 · Was ist neu, Dezember, Tippfix

- **„Was ist neu“:** Knopf unten in der Box „App-Update“ (App und Web), eigene Seite mit allen Versionen in Alltagssprache aus `web/neues.json` (kommt mit der App, ohne Netz lesbar). Kein Fenster nach dem Update, nur ein Punkt am Knopf, bis man die Seite zur aktuellen Version geöffnet hat. Die Paket-Karte auf „Updates & Abo“ heißt jetzt „Neu in den Paketen“. Test `web/neues.test.mjs`: Eintrag für die aktuelle Version und gleiche Versionsangaben in `app.js`, `tauri.conf.json`, `Cargo.toml`.
- **Tagespaket Dezember 2026** (`tage-2026-12`): 31 neue Rätsel, Advent mit Hauff („Das kalte Herz“), Storm („Immensee“), Wintermärchen der Brüder Grimm, Kalendergeschichten von Hebel; ab 24. Dezember kurz und leicht. Baukasten für Werke aus mehreren Seiten und Sammlungen.
- **Tipps:** `alltag-020` neu formuliert und nur bei bestätigtem Treffpunkt; vier weitere Zustands-Tipps an Bedingungen gebunden; neues Bedingungswort `offen` (Bereit-Position noch nie bestätigt).

## 0.3.0 · 30.09.2026 · Tagesseite mit Vorratskammer

- **Tagesseite** als Startbildschirm („Heute“): oben Bereit und die Lumi, darunter die Karten des Tages, unten der Vorrat. Endlich: Sind alle Karten erledigt oder weggelegt, oder ist es 22 Uhr, kommt „Das war dein Tag. Bis morgen.“ Keine Feeds, kein endloses Scrollen. Die bisherige Startseite heißt „Übersicht“.
- **Karten:** Tagesrätsel (Hinweis, Lösung, Erklärung), Roman der Woche (jeden Montag ein neues Werk, sieben Tagesteile, Leseansicht mit Vorlesen), die Lumi oder die Textkarte des Tages (je nach Stufe; bei „Tipps aus“ keine). Die Lektion ist vorgesehen, noch ohne Inhalte.
- **Vorratskammer:** neue Paketart `tage` (nur Daten, signiert, aus dem Katalog). Die App lädt 7, 30 oder 90 Tage voraus, schaltet jeden Tag einen frei und räumt alte Monate weg. Ohne Netz läuft der Rhythmus weiter, bis der Vorrat leer ist. Gerechnet wird nach Kalendertagen des Geräts, Zeitzone und Zeitumstellung verschieben keinen Tag.
- **Tagesplan** unter „Übersicht“: welche Karten, Schluss (20 bis 23 Uhr oder ohne Uhrzeit), Vorratstiefe, Sparmodus (Tagesseite ohne Bilder). Gelernt: Wird eine Karte eine Woche lang jeden Tag weggelegt, blendet die App sie aus, sagt warum und lässt es zurücknehmen; zweimal zurückgenommen gilt als fest eingestellt.
- **Inhalte:** 61 eigene Tagesrätsel ab 1. Oktober 2026; Roman der Woche im Oktober: Keller, Droste-Hülshoff, Eichendorff, Storm (gemeinfrei, Wikisource).

## 0.2.1 · 30.09.2026 · Lumi-Nachtrag

- **Drei Stufen der Lumi:** Standard „aus mit Textkarten“ (keine Figur, neutrale Tipps aus App, Alltag, Wissen, Digital wenn angekreuzt, nichts, worin die Lumi von sich erzählt), „Lumi mit Tipps“, „Tipps aus“ (ganz still). Aus 0.2.0 werden „aus“ und „Nur Tipps“ zu Textkarten, die Figur bleibt, wer sie hatte.
- **Nachts schläft sie:** zur gelernten Schlafenszeit (sonst 22 bis 6 Uhr), auch bei offener App; ein Stups weckt sie für eine Minute.
- **Web-Version** wird per Workflow aus den veröffentlichten Paketen gebaut, der Paketschlüssel bleibt in GitHub.

## 0.2.0 · 29.09.2026 · Module, Bereit v2, die Lumi

- **Bereit, Version 2** (`docs/WESEN.md`): vier Quellen (Inhalte 20, Dinge 35, Menschen 25, Können 20), Verfall je Position mit drei Monaten Ausklang. Treffpunkt und Anlaufstelle gelten 12 Monate, Familiengruppe, Nummern und Nachbar 6.
  - Beim Update werden Bestätigungen mit Datum übernommen. Weil Version 2 neue Punkte zählt, gilt der alte Wert drei Monate als Untergrenze und klingt dann aus: Die Zahl fällt beim Update nicht.
- **Die Lumi**: standardmäßig aus, Einladung nach einer Woche, Startablauf mit Namen, Foto-Ansicht mit elf Zuständen (KI-generiert, gekennzeichnet). Wer in 0.1.x einen Namen vergeben hatte, behält die Figur. Kein „ich“ ohne Namen.
- **Skins** als eigene Paketart (nur Stil, geprüftes CSS), Grundaussehen mit `of-`-Klassen; Notfallseiten immer im Grundaussehen.
- **`app_min`** wird beachtet: Pakete für eine neuere App bleiben sichtbar („Braucht App …“), werden aber weder geladen noch vom Abo aktualisiert. Module und Skins brauchen mindestens 0.2.0.
- **Module (`art = "modul"`)**: Pakete mit eigener Oberfläche, freigegeben von Mik mit drei Bedingungen (`docs/SICHERHEIT.md`, Abschnitt Module).
  - Kern und Werkzeug nehmen Module nur mit dem Redaktionsschlüssel (Zweck `module`) und `pruefstatus: redaktion` an; Code nur unter `inhalt/modul/`, Oberfläche höchstens 2 MB.
  - Jedes Modul läuft über einen eigenen Server (127.0.0.1, geheimer Pfad, CSP ohne Netz, `sandbox allow-scripts`) in einem iframe ohne eigene Herkunft und spricht nur über `window.offline`. Die App prüft jede Nachricht.
  - Bösartiges Testmodul mit 37 Angriffen: in der Desktop-App (macOS), in Chromium und in WebKit alle blockiert.
- **Bibliothek**: Katalogkarte für Module mit Vorschau-Slider (Bilder gegen Prüfsummen), grünem Schieber „laden“, Schalter aktiv/inaktiv, „Öffnen“ und „löschen“ (Wort „löschen“ tippen, Frage nach den Daten). Neue „Lokale Quelle“ für noch nicht veröffentlichte Module.
- **Paket-Kit**: `paket-kit/pruefen.mjs` in den Tests; Nachtrag (Quellen-`id`, Notrufhinweis) umgesetzt; `bauen` übernimmt Kategorie, Alter, Preis und Prüfstatus ins Manifest und prüft Module immer.
- **Katalog**: Einträge tragen Kategorie, Alter, Preis, Prüfstatus und die Vorschau-Slideshow.
- **Sicherheit**: Der allgemeine lokale Dateiserver liefert keine Modul-Oberflächen mehr aus.
