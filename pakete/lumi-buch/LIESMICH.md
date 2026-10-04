# Das Lumi-Buch · Band 1

## Was

Die Geschichte der Lumi von unter dem Eis: zwölf Kapitel, 127 Absätze (Auftrag `bill/erledigt/2026-10-04-lumi-buch-app.md`). Jeder Absatz trägt eine Nummer `b1-KK-PP`; auf sie zeigt das Feld `buch` der 175 Tipps im Paket `wir`. Auf der Titelseite steht „Eine erfundene Geschichte“.

## Für wen

Für alle. Das Buch gehört zur eingeschalteten, benannten Lumi: Unter ihren Sätzen steht „Aus dem Lumi-Buch“. Bei Textkarten oder „Tipps aus“ gibt es den Link nicht, und das Buch wächst nicht.

## Wie funktioniert es

Nur Daten (`inhalt/buch.json`, Format `paket-kit/buch-format.mjs`). Das ganze Buch liegt auf dem Gerät; lesbar wird ein Absatz erst, wenn man ihn unter einem Satz öffnet (`web/buch.js`, App ab 0.5.0). Gebaut aus `quelle/OFFLINE-Lumi-Buch-Band1.md` mit `node pakete/lumi-buch/buch-umwandeln.mjs`; die Zuordnung `quelle/OFFLINE-Lumi-Buch-Zuordnung.json` fließt mit `node pakete/wir/tipps-umwandeln.mjs` in das Paket `wir`. Band 2 kommt später als eigenes Paket mit `band: 2`.

## Wie geprüft

Format mit dem Kit; alle 175 Tipps zeigen auf einen vorhandenen Absatz, jeder Absatz hat mindestens einen Tipp (Test `web/buch.test.mjs`, Kit `pruefen.mjs`). Text gegen die Vorlage: unverändert, keine Tippfehler gefunden.

## Offene Punkte

Anwaltsfrage 35 (bis dahin der Hinweis „Eine erfundene Geschichte“). Absatz b1-12-06 sagt „Wenn man weiter will, wischt man nach links, und dann kommt das Wissen“ – eine Wischgeste gibt es in der App nicht (gemeldet, nicht geändert).
