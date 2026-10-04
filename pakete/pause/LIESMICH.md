# Pause · Happen für zwischendurch

## Was

Die Inhalte für Pause (App ab 0.4.0): acht Formen von Happen mit Selbstbeschreibung (Trainingsart, Dauer, Altersband, Tageszeit, Zone), 15 kurze Geschichten von unten mit je einem falschen Satz, Lumisch in 21 Tagen und danach (Wiederholung an zwei von drei Tagen, ein neues Wort an jedem dritten) mit einem Wörterbuch aus den Plan-Wörtern und den Wörtern der Beispielsätze und die Texte für Zeitgefühl, Atemfenster und den Tag rückwärts. Fünf weitere Formen aus dem Übungskatalog stehen mit `bedingung.funktion` darin und warten auf ihre Funktion.

## Für wen

Ab 14 Jahren. Unter 14 bietet die App Pause nicht an, bis es den Kinder-Modus gibt.

## Wie funktioniert es

Nur Daten (`inhalt/pause.json`, Format `paket-kit/pause-format.mjs`). Die Spiele und der Dirigent sind Teil der App (`web/pause.js`, `web/pause-happen.js`). Pause ist standardmäßig aus; wer sie einschaltet, lädt dieses Paket.

## Wie geprüft

Jede Geschichte auf genau einen Satz geprüft, der der Geschichte selbst widerspricht. Lumisch gegen das Wörterbuch (Abschnitt 8, Lumisch in 21 Tagen). Format mit dem Kit geprüft.

## Offene Punkte

Folie 2 ist ein echtes Bild der Web-Version bei 360 Pixel. Die Lumisch-Wörter sind auf zufällige Ähnlichkeit mit echten Wörtern noch nicht geprüft (Wörterbuch, Abschnitt 10).
