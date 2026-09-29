# Rückmeldung: Paket-Kit-Werkzeug, Phase E (Wichteln) und Abschluss

**Von:** Code (lokale Session) · **Datum:** 2026-09-29 · **Auftrag:** `bill/erledigt/2026-09-29-paket-kit-werkzeug.md` · **Commits:** A `d8386e4`, B `3fc9101`, C `2436fc8`, D `d93be58`, E siehe unten

## Ergebnis: der ganze Weg mit Wichteln
1. **Prüfen:** `node paket-kit/pruefen.mjs paket-kit/beispiel/wichteln` meldet keine Fehler.
2. **Bauen und signieren:** `node werkzeug/paket.mjs bauen paket-kit/beispiel/wichteln ~/.offline/redaktion/pakete` baut `wichteln-2026.09.29` mit 7 Dateien und 51,8 kB, signiert mit dem Redaktionsschlüssel `d9b62d1755ba3744`. `paket.mjs pruefen` bestätigt das.
   - Absichtlich **nicht** nach `pakete/`, denn von dort trägt `alles-bauen.sh` in den öffentlichen Katalog. Das Skript überspringt Module jetzt ohnehin.
3. **Lokal anbieten:** In der Bibliothek, Karte „Lokale Quelle“, den Ordner `~/.offline/redaktion/pakete` wählen. Wichteln erscheint als Katalogkarte mit „lokal, nicht veröffentlicht“, Vorschau-Slider (5 Folien, Bilder geprüft) und grünem Schieber.
4. **Laden:** Schieber umlegen. Der Kern prüft Signatur, Redaktionsschlüssel, Art und jede Datei und spielt ein. Die Karte zeigt jetzt „aktiv“, „Öffnen“ und „löschen“.
5. **Spielen:**
   - „Öffnen“ zeigt Wichteln in der Sandbox mit dem Hinweis „Sandbox · ohne Netz“.
   - Eine Runde angelegt und ausgelost. Das Wesen sagte über `offline.wesen.sagen`: „Ausgelost. Ich weiß auch nicht, wer wen hat. Ich habe weggeschaut.“
   - Die Runde liegt getrennt in `<Datenordner>/module/wichteln.json`.
   - „Zettel drucken“ öffnet den macOS-Druckdialog. Die Vorschau zeigt nur die bereinigten Zettel (vier Stück mit Falzlinie), nicht die App.
6. **Ausschalten:** Schalter auf „inaktiv“. „Öffnen“ ist gesperrt, `zustand.json` sagt `aktiv: false`, der Paketordner bleibt.
7. **Löschen:** „löschen“ geklickt, das Wort getippt, „mitlöschen“ gewählt, bestätigt. Paketordner und `wichteln.json` sind weg, die Karte zeigt wieder den grünen Schieber. Beim nächsten Öffnen nach erneutem Laden stand dort „Noch keine Runde“; die Daten waren also wirklich weg.

**Sandbox-Probe in der echten Desktop-App** (macOS, WKWebView, Entwickler-Build über „Sandbox-Probe …“): **37 von 37 Angriffen blockiert.** Der Bericht liegt in `werkzeug/testmodule/bericht-tauri-macos.json`. Damit ist die offene Probe aus Phase C für macOS erledigt.

**Nicht hochgeladen,** nicht auf Hetzner, nicht im öffentlichen Katalog. Wichteln liegt nur in Miks lokaler Redaktionsablage.

## Geprüft
- `node --test werkzeug/test.mjs` 28/28, `cargo test` Kern 33/33, App 2/2, `cargo check` der App grün.
- **Getestet in einer Kopie:** Die App lief als Entwickler-Build „OFFLINE Test“ mit eigener Kennung `at.digioneer.offline.dev`, also mit eigenem Datenordner. Miks installierte OFFLINE-App und ihre Daten sind unberührt.
- **Version 0.2.0** (Tauri-Konfiguration, `Cargo.toml`, Web). Changelog neu in `docs/CHANGELOG.md`, Zeile in der README.

## Abweichungen
- **Bildschirmfotos:** Ich habe den Ablauf in der App bedient und jeden Schritt am Bildschirm gesehen, konnte die Bilder aber nicht als Dateien ablegen. Dem Terminal fehlt die macOS-Berechtigung „Bildschirmaufnahme“, und das Steuerwerkzeug speichert keine Dateien. Statt Bildern gibt es oben die Schritte mit den nachgeprüften Dateien auf der Platte und den Probenbericht als JSON. Wenn Bill Bilder braucht, reicht es, wenn Mik in „OFFLINE Test“ die fünf Schritte mit ⇧⌘4 fotografiert, oder er gibt dem Terminal die Berechtigung, dann mache ich sie.
- **„Lokal im Katalog“:** umgesetzt als lokale Quelle neben dem Katalog und nicht als lokal signierter zweiter Katalog, Begründung in Phase D. Der Weg über den öffentlichen Katalog ist gebaut und getestet (Vorschau mit Prüfsummen, Download und Prüfung im Kern) und wird nach Miks Freigabe genutzt.
- **Beobachtung beim Drucken:** Beim ersten Versuch erschien kein Druckdialog, beim zweiten mit dem Fenster vorne schon. Der Befehl meldet in beiden Fällen Erfolg. Vermutlich öffnet macOS das Druckblatt nur am vorderen Fenster, und das ist im normalen Gebrauch immer so.

## Offen
- `.github/workflows/tests.yml` wartet auf das Recht `workflow`: `gh auth refresh -h github.com -s workflow`. Dann laufen Werkzeug, Kit, Kern und die Sandbox-Probe gegen Chrome bei jedem Push.
- Sandbox-Probe in der App unter Windows und Linux: Die Prüfseite zeigt, dass die Engines es halten; in der App selbst kann ich es erst auf einem solchen Gerät prüfen.
- Freigabe von Wichteln für den öffentlichen Katalog: Mik. Dann den fertig signierten Ordner hochladen und den Katalog neu bauen.
- Die Sicherungskopie des Redaktionsschlüssels auf einem Stick legt Mik selbst an.

## Fragen an Bill
Keine.
