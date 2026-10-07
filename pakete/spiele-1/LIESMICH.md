# Paket `spiele-1`: Rätsel zum Knobeln (Modul im Bereich Pause)

Auftrag 2026-10-07-14 (Spielpaket 1), Freigabe Bill 07.10.2026.

## Was

Sieben Spiele als Happen-Formen in Pause: Lichter (Light Up), Netz (Net), Muster (Pattern), Brücken (Bridges), Minen (Mines),
Sudoku (Solo) und 2048. Je drei Stufen; ab 14 beginnt jedes auf Stufe 2. Keine Töne, keine Effekte beim Gewinnen.

## Für wen

Für alle, die Pause eingeschaltet haben (ab 14 Jahren), in der Desktop-App.

## Wie es läuft

- **Art `modul`, Bereich `pause`:** Die App liest `inhalt/pause-formen.json` (Format: `paket-kit/pause-format.mjs`,
  `pauseFormenFehler`) und zeigt jedes Spiel als Form im Raum Pause. Im Happen öffnet sie das Modul in der Sandbox,
  mit Spiel, Stufe, Datum, Nummer des Spiels am Tag und den Farben des Skins in der Adresse. Das Modul meldet das Ende über
  `offline.spiel.melden`; die App schreibt es als Happen ins Spiel-Log und stellt die Stufe nach (Zone wie bei den anderen Formen).
- **Nur Desktop-App:** Der Web-Prototyp nimmt keine Module an (SICHERHEIT.md).
- **Tagesrätsel:** Der Startwert ist `Datum-Spiel-sStufe` (ab dem zweiten Spiel am Tag mit `-n`). Alle Geräte bekommen damit
  dasselbe Rätsel, auch ohne Netz. Bei Minen hängt die Lage der Minen zusätzlich vom ersten Tipp ab (so baut Tatham das Spiel:
  das erste Feld ist nie eine Mine).
- **WebAssembly (`"wasm": true`):** Die Tatham-Rätsel brauchen es. Die Sandbox erlaubt es nur, wenn das Modul es anmeldet und
  mit einem Schlüssel mit Zweck `wasm` signiert ist (vorerst nur der Redaktionsschlüssel). Das WebAssembly liegt als Skript im
  Paket (`tatham/<name>.wasm.js`), weil die Sandbox kein Netz hat (`connect-src 'none'`).

## Bau

1. `pakete/spiele-1/tatham-bauen.sh <arbeitsordner>` holt Tathams Quelltext (fester Stand), wendet
   `quelle/tatham-offline.patch` an und baut die sechs Rätsel mit Emscripten. Der Patch: Status des Spiels abfragbar
   (`game_status`), Spiel-ID und WebAssembly von der Seite, Umschalter für die zweite Taste, Farben aus dem Skin, keine
   Einstellungen im Browser, keine Links hinaus.
2. `node pakete/spiele-1/bauen.mjs <arbeitsordner>/bau` übernimmt sie nach `inhalt/modul/tatham/` und prüft Verbotsliste und Größe.
3. Signiert wird nur auf Miks Mac mit dem Redaktionsschlüssel: `node werkzeug/paket.mjs bauen pakete/spiele-1 ~/.offline/redaktion/pakete offline-redaktion`.
   Zur Freigabe kommt der gebaute Ordner nach `redaktion/freigegeben/`.

2048: Spiellogik von Gabriele Cirulli unverändert (`inhalt/modul/2048/`), Aussehen, Eingabe und Speicher in `spiel.js`
(nichts wird gespeichert, auch kein Bestwert; die Punkte sind nur während der Runde zu sehen).

## Wie geprüft

- `node paket-kit/pruefen.mjs pakete/spiele-1` (Verbotsliste, WebAssembly angemeldet, Formen, Größe unter 2 MB).
- Alle sieben Spiele in WebKit über den echten Modulserver gespielt (CSP der Sandbox mit und ohne WebAssembly-Freigabe),
  hell und dunkel, bei 360 px; Ende und Meldung geprüft.
- Tests: `web/spiele.test.mjs` (Tagesrätsel gleich auf zwei Geräten, Formen, Einbau in Pause), `kern` (WebAssembly nur mit
  Anmeldung und Schlüssel-Zweck), Sandbox-Probe (Angriff „WebAssembly ohne Anmeldung“).

## Offene Punkte

- Minen: Fahne mit langem Druck (450 ms) oder mit dem Umschalter, seit dem Nachtrag zu 0.6.5.

- Schleife (Loopy) und Türme (Towers) kommen später.

## Lizenzen

Beide MIT. Hinweise gesammelt in `inhalt/lizenzen.txt` und in der App unter „Über · Lizenzen fremder Teile“.
