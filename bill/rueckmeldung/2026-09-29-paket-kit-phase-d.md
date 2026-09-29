# Rückmeldung: Paket-Kit-Werkzeug, Phase D (Bedienung)

**Von:** Code (lokale Session) · **Datum:** 2026-09-29 · **Auftrag:** `bill/todo/2026-09-29-paket-kit-werkzeug.md` · **Commit:** `d93be58`

## Ergebnis (Miks Vorgabe, Punkt für Punkt)
- **Katalogeintrag:** Titel, Beschreibung, Vorschau-Slider mit den fünf Folien aus `inhalt/vorschau/`.
  - Die Bilder werden vor dem Laden gezeigt und sind immer über eine Signatur gedeckt: aus dem Katalog gegen die Prüfsummen im signierten Katalogeintrag (neu: `vorschau` im Eintrag, `kern/src/vorschau.rs`), aus einem Ordner über das signierte Manifest.
  - Ohne Netz zeigt die Karte die Folientexte aus dem Katalog. Blättern mit ‹ ›, mit Bildbeschreibung zum Vorlesen.
- **Grüner Schieber „laden“:**
  - Erscheint nur, wenn `darfLaden()` ja sagt. Heute sagt es für alle ja; Kauf oder Abo kommen an genau diese Stelle (`web/app.js`).
  - Umlegen lädt das Modul, über den Katalog oder aus der lokalen Quelle.
- **Nach dem Laden:** An die Stelle des Schiebers treten der Schalter aktiv/inaktiv, „Öffnen“ und „löschen“.
- **Inaktiv:** Das Modul wird nicht geladen und läuft nicht. „Öffnen“ ist gesperrt, und ein offener Modulserver wird gestoppt. Der Paketordner bleibt, also bleibt der Speicherplatz belegt.
- **Löschen in zwei Schritten:**
  - Knopf, dann das Wort „löschen“ tippen. „Endgültig löschen“ ist erst danach frei, und der Kern prüft das Wort noch einmal.
  - Die App fragt, was mit den gespeicherten Daten passiert: behalten (Standard, dann sind sie bei einer Neuinstallation wieder da) oder mitlöschen.
- **Handy zuerst:** Alle Knöpfe, Schieber und Felder der Modulkarte sind mindestens 44 px hoch. Bei schmaler Breite (unter 420 px) stehen die Steuerelemente untereinander.
- **Lokale Quelle** (neu): Ein Ordner mit signierten, noch nicht veröffentlichten Modulen erscheint als Katalogkarte, markiert mit „lokal, nicht veröffentlicht“. Geladen wird wie vom Stick, mit voller Prüfung im Kern. Damit brauchte es keinen eigenen Katalogschlüssel auf dem Mac, und der Rollback-Schutz des echten Katalogs bleibt unberührt.
- **Modulansicht:** eigene Fläche neben `<main>`, damit ein Neuzeichnen der App den Rahmen nicht neu lädt. Kopf mit „Zurück“ und dem Hinweis „Sandbox · ohne Netz“. `wesen.sagen` erscheint als Zeile über dem Modul, nur wenn das Wesen eingeschaltet ist.
- **Drucken:** Die App übernimmt nie das HTML des Moduls. Sie baut einen bereinigten Textbaum (nur einfache Elemente, nur Klassen) und druckt ihn über den Druckbefehl des Fensters.
- **Absicherung:** `alles-bauen.sh` überspringt Module. Sie kommen erst nach Miks Freigabe als fertig signierter Ordner in den öffentlichen Katalog.

## Geprüft
- `node --test werkzeug/test.mjs`: 28 von 28 (neu: Katalogeintrag mit Slideshow und Prüfsummen).
- `cargo test` im Kern: 33 von 33. Neu ist die Vorschau aus Ordner und Katalog, von Node gebaut und vom Kern gelesen; ein ausgetauschtes Bild wird abgelehnt.
- In der Desktop-App am Mac bedient: siehe Rückmeldung Phase E.

## Hinweis
Die Daten der Module liegen unter `<Datenordner>/module/<id>.json`. Das Schließfach (verschlüsselte Sicherung) gibt es noch nicht; sobald es kommt, gehört dieser Ordner hinein (Pflichtenheft 5.3).
