#!/usr/bin/env bash
# Spielpaket 1: Simon Tathams Rätsel aus dem Quelltext bauen (Auftrag 2026-10-07-14).
#
#   pakete/spiele-1/tatham-bauen.sh <arbeitsordner>
#
# Warum ein eigener Build und nicht der fertige Web-Build von der Seite des Autors: Der fertige Build meldet nicht, wann ein
# Rätsel gelöst ist (Pause braucht das für Ende und Stufe), lädt sein WebAssembly über das Netz und speichert Einstellungen
# im Browser. Der Patch quelle/tatham-offline.patch ändert genau das, an vier Dateien, und sonst nichts:
#   - emcc.c, emscripten.cmake: game_status() (gelöst, verloren, läuft) für die Seite abfragbar
#   - emccpre.js: Spiel-ID und WebAssembly gibt die Seite vor; zweite Taste per Umschalter; keine Links hinaus
#   - emcclib.js: Farben aus dem Skin; keine Einstellungen im Browser
# Braucht: git, Python 3, Emscripten (emsdk, gebaut mit emcc 6.0.11) und CMake (4.4). bauen.mjs prüft die Stellen, die es
# im Programm ändert; ändert sich Emscripten, bricht es laut ab. Danach: node pakete/spiele-1/bauen.mjs <arbeitsordner>/bau
set -euo pipefail
QUELLE_COMMIT=616da16f25da428ccda805536209095bd062676e   # git.tartarus.org/simon/puzzles, 22.09.2026
SPIELE="lightup net pattern bridges mines solo"
HIER="$(cd "$(dirname "$0")" && pwd)"
ARBEIT="${1:?Arbeitsordner angeben}"
mkdir -p "$ARBEIT" && cd "$ARBEIT"
[ -d puzzles ] || git clone -q https://git.tartarus.org/simon/puzzles.git
cd puzzles && git checkout -q "$QUELLE_COMMIT" && git checkout -q -- . && git apply "$HIER/quelle/tatham-offline.patch" && cd ..
rm -rf bau && mkdir bau && cd bau
emcmake cmake ../puzzles -DCMAKE_BUILD_TYPE=Release -DMIN_FIREFOX_VERSION=79 -DMIN_CHROME_VERSION=85 -DMIN_SAFARI_VERSION=150000 >/dev/null
for s in $SPIELE; do make -j8 "$s" >/dev/null; done
ls -l *.js *.wasm
