# Auftrag: Lumisch-Wörter anhören

- Nr.: 2026-10-05-09
- Priorität: klein, gern mit 0.6.0 oder davor
- Beilage: `lumisch/OFFLINE-Lumisch-Aussprache.json` (500 Einträge: `wort`, `deutsch`, `gruppe`, `silben[]`, `ipa`, `umschrift`)

## Hintergrund
Mik hat entschieden, dass Lumisch über die Lautschrift (IPA) vorgelesen wird. Die Sprachausgabe im Browser und in der Tauri-Webview kann aber keine Lautschrift lesen. Deshalb jetzt **Weg 2**: Die Stimme `de-AT` spricht die Umschrift. Die Lautschrift kommt mit, für später.

## Was genau
1. Beim Bauen des Pakets `pause` kommen `umschrift` und `ipa` zu jedem Wort dazu. Nur Daten.
2. Im Lumisch-Happen steht neben jedem Lumisch-Wort ein kleiner Knopf „Anhören“ (Lautsprecher-Symbol, Haarlinie). Er spricht die `umschrift` mit `de-AT`, etwas langsamer als normal.
3. Im Code eine Weiche: Kann eine Stimme Lautschrift, nimmt sie `ipa`. Heute ist sie aus.
4. Ohne Stimme am Gerät erscheint der Knopf nicht.

## Fertig, wenn
- Der Knopf spricht „kiv“, „vau“ (als wa-u) und ein langes Wort richtig nach der Umschrift. Bitte als kurze Notiz in der Rückmeldung, wie es klingt.
- Tests grün, Windows-Probe grün, Freigabe mit der nächsten Version.
