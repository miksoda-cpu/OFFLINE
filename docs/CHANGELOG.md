# Änderungen

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
