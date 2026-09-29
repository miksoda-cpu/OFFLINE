# Rückmeldung: Paket-Kit-Werkzeug, Phase B (Kern)

**Von:** Code (lokale Session) · **Datum:** 2026-09-29 · **Auftrag:** `bill/todo/2026-09-29-paket-kit-werkzeug.md` · **Commit:** `3fc9101`

## Ergebnis
- **`art = modul` wird angenommen,** im Werkzeug (`werkzeug/kern.mjs`, `paket-lib.mjs`) und im Rust-Kern (`manifest.rs`, `schluessel.rs`, `paket.rs`) mit denselben Regeln und Meldungen:
  - **Schlüssel:** Module nur mit einem Schlüssel mit Zweck `module`, der nicht zugleich `katalog` hat. Mit dem Katalog- oder Paketschlüssel signierte Module werden abgelehnt. Umgekehrt signiert der Redaktionsschlüssel keine gewöhnlichen Pakete.
  - `pruefstatus: redaktion`, `datenversion` ab 1 und `inhalt/modul/index.html` sind Pflicht.
  - **Skript-Grenze:** `.js`/`.mjs` sind nur unter `inhalt/modul/` erlaubt. Seiten (`.html`, `.htm`, `.xhtml`, `.svg`) außerhalb werden beim Prüfen gelesen und abgelehnt, wenn sie `<script`, ` on…=` oder `javascript:` enthalten. Für alle anderen Paketarten gilt: gar kein Code (Grundsatz 2).
  - Die Oberfläche unter `inhalt/modul/` hat zusammen höchstens 2 MB.
- **Wo der Kern prüft:** Die Regeln gelten nicht nur beim Einspielen, sondern schon am Manifest, bevor eine Datei geladen wird: beim Download (`download.rs`) und bei der Suche auf dem Stick (App, `suche`). Dafür gibt es die gemeinsame Funktion `manifest_signiert_pruefen` bzw. `manifestSigniertPruefen`.
- **Redaktionsschlüssel angelegt** (Miks Entscheidung: nur auf seinem Mac):
  - `d9b62d1755ba3744`, Zweck `module`.
  - Privat unter `~/.offline/schluessel/offline-redaktion.key` (Rechte 600), **nicht** im Repo und nicht in GitHub. Der öffentliche Teil steht in `schluessel/oeffentlich.json`.
  - Eine Sicherungskopie auf einem weggesperrten Stick muss Mik selbst anlegen.
- **Kommandozeile:** `schluessel erzeugen <name> --zweck=module` (verweigert `module` zusammen mit `katalog`). `bauen` nimmt bei Modulen von selbst `offline-redaktion`.
- **Doku:** `docs/PAKETFORMAT.md` 2.4 (Module) und Abschnitt 4 (Zwecke), `docs/SICHERHEIT.md` (Einspiel-Tabelle, „Umgesetzt“).

## Geprüft
- `node --test werkzeug/test.mjs`: 24 von 24. Davon 7 neu für Module: Wichteln gültig, Katalogschlüssel abgelehnt, Redaktionsschlüssel ohne Pakete, Pflichtangaben, vier Skriptformen, 2 MB, Prüfung schon am Manifest.
- `cargo test` im Kern: 30 von 30. Neu sind `kern/tests/module.rs` mit denselben Fällen plus Einspielen, und eine **Gegenprobe**: Node baut Wichteln aus dem Paket-Kit, der Rust-Kern nimmt es an. Dazu kommt ein Unit-Test zur Skript-Erkennung.
- `cargo check` der Desktop-App ist grün.

## Hinweise
- Rust ist jetzt auf Miks Mac installiert (rustup, `~/.cargo`). Für lokale Builds liegt in `app/src-tauri/binaries/` ein Platzhalter statt `kiwix-serve`. Er wird von git ignoriert; die ZIM-Bibliothek läuft deshalb nur im CI-Build.
- Der Web-Prototyp prüft Pakete nur mit Zweck `pakete` und nimmt deshalb keine Module an. Das ist gewollt, weil Module nur am Desktop laufen.
- `.github/workflows/tests.yml` wartet weiter auf das Recht `workflow` (siehe Phase A).

## Fragen an Bill
Keine. Weiter mit Phase C.
