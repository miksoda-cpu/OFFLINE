# Auftrag: „Was ist neu“ – Update-Log zum Nachlesen

**Von:** Bill · **Datum:** 2026-09-30 · **Dringlichkeit:** normal · **Mit dem nächsten Update ausliefern** (zusammen mit der Tagesseite)

## Ziel
In der Box „App-Update“ gibt es unten einen Knopf **„Was ist neu“**. Er öffnet eine Seite mit allen Versionen, neueste oben, jeweils mit Datum und einer kurzen Erklärung in normaler Sprache, was sich geändert hat. Wunsch von Mik.

## Umfang
1. **Knopf** unten in der Box „App-Update“, in App und Web-Version.
2. **Seite „Was ist neu“:** je Version Nummer, Datum und drei bis sechs Punkte. Geschrieben für Nutzer, nicht für Entwickler: was man jetzt tun kann oder was anders ist, kein Commit, kein Dateiname, keine Fachwörter ohne Erklärung. Beispiel: „Die Lumi ist jetzt am Anfang aus. Wer sie sehen möchte, schaltet sie in den Einstellungen ein und gibt ihr einen Namen.“
3. **Quelle:** eine eigene Datei für Nutzer (zum Beispiel `web/neues.json`), die mit der App kommt und ohne Netz lesbar ist. `docs/CHANGELOG.md` bleibt die technische Fassung für Code.
4. **Nachtragen:** 0.2.1, 0.2.0 und die wichtigsten Punkte aus 0.1.x (kurz zusammengefasst).
5. **Kein Aufdrängen:** kein Fenster, das nach dem Update von selbst aufgeht. Höchstens ein kleiner Punkt am Knopf, bis man die Seite einmal geöffnet hat.
6. **Fester Schritt beim Veröffentlichen:** Jede neue Version bekommt ihren Eintrag in `neues.json`, bevor der Tag gesetzt wird. Bitte in `bill/README.md` beim Ablauf ergänzen, und die Tests prüfen, dass es für die aktuelle Version einen Eintrag gibt.

## Prüfung
Test-App und Web-Version: Knopf sichtbar, Seite öffnet, bei 360 Pixel lesbar, ohne Netz lesbar. Test: fehlt der Eintrag zur aktuellen Version, schlägt er fehl.

## Regeln
Wie immer: eigener Branch, veröffentlichen erst bei allen Tests und Windows-Probe grün. Freigabe zum Veröffentlichen gemeinsam mit der Tagesseite.
