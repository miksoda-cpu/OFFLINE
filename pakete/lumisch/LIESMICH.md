# Lumisch · die Sprache der Lumis

## Was

Lumisch als eigenes Paket im Bereich Lumi (App ab 0.7.0, Bill 07.10.2026, Frage 4): Plan für 21 Tage, Abfragewörter und das geprüfte Wörterbuch mit 500 Wörtern, je mit Umschrift und Lautschrift. Nur Daten (`inhalt/lumisch.json`, Format `lumischFehler` in `paket-kit/pause-format.mjs`).

## Für wen

Ab 14 Jahren, wie Pause.

## Wie funktioniert es

Die App nimmt Lumisch ab 0.7.0 nur aus diesem Paket. Ist es an, kommen die Lumisch-Happen in Pause, und auf der Lumi-Seite steht sein Kästchen. Wer Pause hat, bekommt es einmal still dazu. Im Paket `pause` bleibt Lumisch für Apps vor 0.7.0 stehen.

## Wie geprüft

`node pakete/lumisch/aus-pause.mjs` übernimmt den Inhalt unverändert aus `pakete/pause/inhalt/pause.json` (Wortprüfung vom 05.10.2026). Ein Test vergleicht beide (`web/lumi-seite.test.mjs`). Format mit dem Kit geprüft. Folie 2 ist ein echtes Bild der Web-Version bei 360 Pixel.

## Offene Punkte

Ändert sich Lumisch, zuerst `pause.json` (Quelle der Umwandlung), dann `aus-pause.mjs` laufen lassen.
