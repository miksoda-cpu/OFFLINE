# Auftrag: Ein Tagesende für alles

- Nr.: 2026-10-05-10
- Priorität (Mik, 05.10.): mittel, nach Naturheilkunde 0.6.0 oder davor, wenn es klein bleibt.
- Mik: „Vielleicht sollte ein Tag enden je nach Alter, bzw. auch in den Einstellungen. Ich gehe jeden Tag um 22:30 ins Bett. Kinder womöglich früher, und Leute, die Morgenmenschen sind, auch früher.“

## Heute (Stand 0.5.5)

Zwei Uhren, die nichts voneinander wissen:
- **Tagesplan › Schluss:** 20, 21, 22, 23 Uhr oder „keine Uhrzeit“, nur volle Stunden. Steuert Tagesschluss und Pause.
- **Lumi › Nachtruhe:** zuerst 22 bis 6 Uhr, danach selbst gelernt aus der letzten Eingabe am Abend.

## Was genau

1. **Eine Einstellung „Mein Tag“** (im Tagesplan, auch unter Lumi verlinkt):
   - **Schluss um:** in halben Stunden von 19:00 bis 24:00, dazu „keine Uhrzeit“.
   - **Aufstehen um:** in halben Stunden von 5:00 bis 9:00.
   - Darüber drei Knöpfe als schneller Weg: **Morgenmensch** (Schluss 21:30, Aufstehen 6:00), **Dazwischen** (22:30 / 7:00), **Nachtmensch** (23:30 / 8:00). Danach kann man die Zeiten einzeln verschieben.
2. **Vorbelegung nach Alter**, wenn ein Alter bekannt ist (heute aus Pause, später aus dem Kinder-Modus):
   - unter 10: Schluss 19:30
   - 10 bis 13: 20:30
   - 14 bis 17: 21:30
   - ab 18: 22:30
   - Das ist nur der Startwert. Die App sagt nicht, wann jemand schlafen soll.
3. **Alles hängt an dieser einen Uhr:**
   - Tagesschluss („Das war dein Tag. Bis morgen.“) zur Schluss-Zeit.
   - Lumi schläft von „Schluss“ bis „Aufstehen“. Antippen weckt sie wie bisher für eine Minute.
   - „Der Tag rückwärts“ in Pause kommt ab zwei Stunden vor Schluss, nie vor 18 Uhr.
   - Die Morgen-Formen in Pause gelten von „Aufstehen“ bis 12 Uhr.
4. **Gelernt, aber nur als Vorschlag:** Die Lumi merkt sich weiter die letzte Eingabe am Abend. Weicht sie über zwei Wochen um mehr als 45 Minuten ab, fragt die App **einmal**: „Du bist meist bis 23:15 wach. Schluss auf 23:00 verschieben?“ mit „Ja“ und „Nein, passt so“. Nach zweimal „Nein“ fragt sie nie wieder (Zwei-mal-zurück-Regel).
5. **Übernahme:** Wer heute 22 Uhr eingestellt hat, behält 22:00. Wer keine Uhrzeit hat, behält keine; die Lumi schläft dann nach der gelernten Zeit wie bisher.
6. **Info und Hilfe** im Tagesplan (Schlüssel `tagesplan`):
   - „Was ist ‚Mein Tag‘?“ – „Hier stellst du ein, wann dein Tag endet und wann er beginnt. Zur Schluss-Zeit sagt die App: ‚Das war dein Tag.‘ Die Lumi schläft bis zum Aufstehen.“
   - „Warum schlägt die App eine Zeit vor?“ – „Die App merkt sich, wann du abends zuletzt etwas tust. Sie fragt höchstens zweimal. Du entscheidest.“

## Fertig, wenn
- Eine Einstellung steuert Tagesschluss, Lumi-Schlaf und Pause. Ein Test prüft 22:30, 19:30 und „keine Uhrzeit“.
- Die Vorschlagsfrage kommt höchstens zweimal, ein Test deckt das ab.
- Bilder bei 360 Pixel: „Mein Tag“ mit den drei Knöpfen.
- Alle Tests auf drei Systemen und die Windows-Probe grün, Freigabe mit „Was ist neu“: „Dein Tag endet, wann du willst, auf die halbe Stunde genau.“
