# Was die Lumis denken

## Was

Fünfzehn Gedanken, zwölf von Philosophen der Menschen und drei von den Lumis (Auftrag `bill/erledigt/2026-10-06-lumi-philosophie.md`, Nr. 2026-10-06-12). Zu jedem Gedanken gehören ein Aquarell, der Satz auf Lumisch, die Übersetzung Wort für Wort, die Übersetzung auf Deutsch und ein kurzer Text im „Wir“ der Lumis. In der Bibliothek steht darunter: „Die Lumis sind erfunden, die Philosophen nicht.“

## Für wen

Für Erwachsene (`alter_ab` 18). Das Paket erscheint nicht in Inhalten für Kinder und liefert keine Tipps.

## Wie funktioniert es

Nur Daten: `inhalt/gedanken.json` (Format `paket-kit/gedanken-format.mjs`) und `inhalt/bilder/01.webp` bis `15.webp`. Gebaut aus `quelle/texte.md` und `quelle/bilder/` mit `node pakete/lumi-philosophie/gedanken-umwandeln.mjs`; kein Text wird umgeschrieben. Die App (ab 0.6.2, `web/gedanken.js`) zeigt ein Inhaltsverzeichnis und je Gedanke eine Seite: Bild, Name, Titel, Lumisch-Satz groß mit Lautsprecher-Knopf (spricht die Umschrift wie im Lumisch-Happen), Wort für Wort, Deutsch, Text. Vorlesen wie beim Lumi-Buch.

## Wie geprüft

Format mit dem Kit; Test `web/gedanken.test.mjs`: 15 Gedanken, jeder mit allen Feldern und einem Bild, jedes Lumisch-Wort im Wörterbuch des Pakets `pause` (Eigennamen wie „Sisyphos“ ausgenommen), Text wörtlich wie in der Beilage.

## Offene Punkte

Die Aquarelle kommen aus der Beilage der Session „die lumis“. Ob sie KI-generiert sind, steht dort nicht; das Feld `ki_generiert` bleibt deshalb leer, bis Bill es sagt.
