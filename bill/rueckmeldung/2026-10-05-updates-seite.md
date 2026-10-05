# Rückmeldung: Seite „Updates & Abo“ aufgeräumt – ausgeliefert mit 0.5.2

**Von:** Code (lokale Session) · **Datum:** 2026-10-05 · **Auftrag:** `bill/erledigt/2026-10-05-updates-seite.md` (Nr. 2026-10-05-02) · **Branch:** `updates-seite` · **Tag:** `v0.5.2`

**Doppelt angekommen:** `2026-10-05-version-0-5-1.md` lag noch einmal im Ordner. Er ist wortgleich mit dem Auftrag, der heute früh als 0.5.1 ausgeliefert wurde, daher nichts Neues. Die Updates-Seite kommt, wie Mik danach geschrieben hat, als eigene 0.5.2.

## Ergebnis
- **App 0.5.2 ist ausgeliefert** (`app/latest.json`, 05.10.2026, 10:03 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux sind abrufbar (HTTP 200).
- **Web-Version 0.5.2 live** (geprüft): `APP_VERSION` 0.5.2, `blatt.js` ist da.
- **Katalog unverändert:** Kein Paket hat sich geändert.

## Die Seite
1. **Stand:**
   - Ein Satz, zum Beispiel „Alles aktuell. Katalog vom 05.10.2026.“ oder „1 Update verfügbar. Katalog vom 05.10.2026.“, darunter „Jetzt prüfen“ (der Hauptknopf der Seite).
   - Verfügbare Updates stehen als Zeilen mit „Aktualisieren“ darunter.
   - Am Desktop steht hier auch die App-Version mit „Nach neuer Version suchen“ (vorher eine eigene Karte).
   - Nach „Jetzt prüfen“ steht nur noch „Geprüft“ mit demselben kurzen Satz; Signatur und Schlüssel nennt die Seite nicht mehr.
2. **Was ist neu:**
   - Ein Block mit den Reitern **App** (Quelle `web/neues.json`) und **Inhalte** (Änderungen im Katalog, neueste zuerst).
   - Auf der Seite stehen je drei Einträge, „Alle anzeigen“ öffnet das Blatt.
   - Die eigene Seite „Was ist neu“ (`#neues`) gibt es weiter; sie ist nur nicht mehr verlinkt.
3. **Einstellungen:**
   - Zugeklappt; ein Tipp öffnet sie. Daneben eine Zeile mit dem Stand, zum Beispiel „Wöchentlich · nur im WLAN · 02:00–05:00 Uhr“ oder „Update-Abo pausiert“.
   - Darin: Wie oft?, Update-Abo aktiv, Nur im WLAN, Zeitfenster.
   - Meine Entscheidung: Am Desktop gehören auch der Speicherort und der Stand des Hintergrund-Abos hierher (vorher eigene Karte bzw. im Stand).
   - Die Erklärsätze unter den Schaltern sind weg, sie stehen jetzt in „Info und Hilfe“.
4. **Werkzeuge:** Offline-Bereitschaft prüfen, Als App installieren. Im Browser; in der Desktop-App gibt es beides nicht, dort fällt der Abschnitt weg.
5. **Info und Hilfe:** eine Zeile, sie öffnet ein Blatt mit deinen zehn Fragen, Wort für Wort (`web/hilfe.js`).
6. **Daten löschen:**
   - Ganz am Ende, mit Haarlinie und viel Abstand abgesetzt.
   - „Alles zurücksetzen“ (nur im Browser) und „Restlos löschen & deinstallieren“, doppelt gesichert wie bisher: Rückfrage und „LÖSCHEN“ eintippen.
   - Der lange Satz am Ende („So läuft ein Update …“) und der Erklärsatz zum Löschen sind weg.

## Roter Punkt
- Er steht am Block „Was ist neu“, am Reiter und am Menüpunkt „Updates & Abo“, solange etwas nicht angesehen ist. Am Handy steht der Menüpunkt unter „Mehr“.
- Keine Zahl, kein Abzeichen, nichts am App-Symbol.
- **Angesehen** heißt: Der Reiter war auf der Seite offen. Beim Öffnen der Seite ist das der Reiter „App“; „Inhalte“ zählt, sobald man ihn antippt.
- **App:** Der Punkt kommt mit jeder neuen Version.
- **Inhalte:** Der Punkt kommt, sobald im Katalog eine Paketänderung neuer ist als die zuletzt angesehene.
  - Meine Entscheidung: Wer die App neu hat, bekommt keinen Punkt für Änderungen, die es beim ersten Start schon gab.
- Der Test `web/neuigkeiten.test.mjs` prüft das Erscheinen und das Verschwinden für beide Reiter, dazu Reihenfolge, Hilfetexte und Blatt.
  - Im Browser: Punkt im Menü und am Block, nach dem Reiter „Inhalte“ überall weg.

## Das Blatt
- Am Handy kommt es von unten (bis 88 % der Höhe), ab 821 px Breite als Fenster in der Mitte (640 px).
- Es hat einen eigenen Bildlauf: Der Inhalt rollt, die Seite dahinter bleibt stehen und ist gesperrt. `overscroll-behavior: contain` verhindert, dass das Wischen am Ende auf die Seite überspringt.
- **Schließen:** ✕, Escape, ein Tipp daneben und die Zurück-Taste. Die Zurück-Taste schließt nur das Blatt, die Seite bleibt.
- Geprüft bei 360 px:
  - Das Blatt rollt (300 px gerollt, Seite unverändert).
  - Zurück und ✕ schließen es, man bleibt auf `#updates`.
  - Bei 24 px Grundschrift gibt es keinen seitlichen Bildlauf, und alle Tippflächen sind 44 px hoch.
- Fingerwischen konnte ich im Browser nur mit dem Mausrad nachstellen, das Verhalten dahinter ist dasselbe.
- `web/blatt.js` ist allgemein gebaut und kann auf anderen Seiten wiederverwendet werden.

## Wo „Info und Hilfe“ noch sinnvoll wäre
Für jede dieser Seiten bräuchte es deine Texte:
- **Tresor:** was verschlüsselt wird, Wiederherstellungscode, Sperren nach Zeit, was beim Vergessen des Passworts passiert.
- **Bibliothek:** was „installiert“ heißt, Größe und Speicherort, Signatur, was Module dürfen und was nicht (Sandbox).
- **Übersicht › Bereit:** wie die Zahl entsteht, warum Dinge verfallen, was „Bestätigen“ bedeutet.
- **Pause › Deine Linie:** wie der Dirigent wählt, was „Mehr davon / Nicht mehr“ bewirken, was zur Wirkung gesagt werden darf.
- **Lumi-Einstellungen:** Textkarten oder Lumi, Name, Takt, Nachtruhe, was die Lumi lernt und was nicht.
- **Werkzeuge:** Radio-Frequenzen, Sonne und Mond ohne Netz.
- **Das Lumi-Buch:** wie Stücke lesbar werden und die zwei Arten von Lücken.

Notfall würde ich bewusst ohne Hilfe-Zeile lassen, dort soll nichts zwischen Nutzer und Nummer stehen.

## Bilder (Web, 360 px und 1280 px)
- `bilder/2026-10-05-updates-1-oben-360.jpg`: Stand mit „Jetzt prüfen“ und einem Update, darunter „Was ist neu“ mit Punkt am Block und am Reiter „Inhalte“.
- `bilder/2026-10-05-updates-2-unten-360.jpg`: Einstellungen zugeklappt mit Stand-Zeile, Werkzeuge, Info und Hilfe, Daten löschen.
- `bilder/2026-10-05-updates-3-blatt-alle-360.jpg`: Blatt „Was ist neu · App“ von unten, gerollt.
- `bilder/2026-10-05-updates-4-hilfe-360.jpg`: Blatt „Info und Hilfe“.
- `bilder/2026-10-05-updates-5-oben-breit.jpg`: breite Ansicht oben, Punkt am Menüpunkt „Updates & Abo“.
- `bilder/2026-10-05-updates-6-unten-breit.jpg`: breite Ansicht unten.
- `bilder/2026-10-05-updates-7-hilfe-breit.jpg`: „Info und Hilfe“ als Fenster in der Mitte.

## Geprüft
- **Tests:**
  - Web: 91 von 91. Neu ist `web/neuigkeiten.test.mjs` mit fünf Tests: Punkt App, Punkt Inhalte, Reihenfolge, Hilfetexte, Blatt.
  - Werkzeug und Kit: 33 von 33.
- **CI (Lauf `37291314868`):** Die Tests laufen grün unter Linux, macOS und Windows, dazu Kern und Modul-Sandbox.
- **Windows-Probe (`37291314759`, Commit = `v0.5.2`):** grün beim ersten Lauf, 48 von 48 Angriffe blockiert.
  - Neu ist die Prüfung „Updates & Abo – Reihenfolge richtig, Einstellungen zu, Blatt 10 Fragen, Zurück schließt“ in der echten Desktop-App.
- **Release-Build `37292776885`:** alle vier Plattformen und das Veröffentlichen sind grün.

## Vorrat
Der Vorrat reicht bis 31. Jänner 2027, 118 Tage ab heute. Die 45-Tage-Grenze wird am 17. Dezember erreicht.
