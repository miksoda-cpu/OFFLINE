#!/usr/bin/env bash
# Baut alle Pakete, den Katalog und kopiert, was der Web-Prototyp braucht.
set -euo pipefail
cd "$(dirname "$0")/.."
DATUM="${OFFLINE_VERSION:-$(date -u +%Y.%m.%d)}"

rm -rf web/pakete && mkdir -p web/pakete web/katalog web/schluessel
ORDNER=()
for q in pakete/*/; do
  [ -f "$q/paket.quelle.json" ] || continue
  # Module und Skins baut und signiert nur die Redaktion mit ihrem Schlüssel (SICHERHEIT.md, Module); in den öffentlichen
  # Katalog kommen sie erst nach Miks Freigabe, als fertig signierter Ordner.
  if grep -qE '"art": *"(modul|skin)"' "$q/paket.quelle.json"; then echo "Übersprungen (Modul/Skin, baut die Redaktion): $q"; continue; fi
  out=$(node werkzeug/paket.mjs bauen "$q" web/pakete)
  echo "$out"
  ORDNER+=("$(echo "$out" | head -1 | sed 's/.*→ //')")
done
node werkzeug/paket.mjs katalog web/katalog "${ORDNER[@]}" --geplant=pakete/geplant.json
cp schluessel/oeffentlich.json web/schluessel/oeffentlich.json
cp werkzeug/kern.mjs web/paket-kern.js
for o in "${ORDNER[@]}"; do node werkzeug/paket.mjs pruefen "$o"; done
