# Änderungen

## 0.2.0 · 29.09.2026 · Module

- **Module (`art = "modul"`)**: Pakete mit eigener Oberfläche, freigegeben von Mik mit drei Bedingungen (`docs/SICHERHEIT.md`, Abschnitt Module).
  - Kern und Werkzeug nehmen Module nur mit dem Redaktionsschlüssel (Zweck `module`) und `pruefstatus: redaktion` an; Code nur unter `inhalt/modul/`, Oberfläche höchstens 2 MB.
  - Jedes Modul läuft über einen eigenen Server (127.0.0.1, geheimer Pfad, CSP ohne Netz, `sandbox allow-scripts`) in einem iframe ohne eigene Herkunft und spricht nur über `window.offline`. Die App prüft jede Nachricht.
  - Bösartiges Testmodul mit 37 Angriffen: in der Desktop-App (macOS), in Chromium und in WebKit alle blockiert.
- **Bibliothek**: Katalogkarte für Module mit Vorschau-Slider (Bilder gegen Prüfsummen), grünem Schieber „laden“, Schalter aktiv/inaktiv, „Öffnen“ und „löschen“ (Wort „löschen“ tippen, Frage nach den Daten). Neue „Lokale Quelle“ für noch nicht veröffentlichte Module.
- **Paket-Kit**: `paket-kit/pruefen.mjs` in den Tests; Nachtrag (Quellen-`id`, Notrufhinweis) umgesetzt; `bauen` übernimmt Kategorie, Alter, Preis und Prüfstatus ins Manifest und prüft Module immer.
- **Katalog**: Einträge tragen Kategorie, Alter, Preis, Prüfstatus und die Vorschau-Slideshow.
- **Sicherheit**: Der allgemeine lokale Dateiserver liefert keine Modul-Oberflächen mehr aus.
