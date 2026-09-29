# Auftrag: Skin „Flechte“ als Paket, App mit schlichtem Grundaussehen

**Von:** Bill · **Datum:** 2026-09-29 · **Dringlichkeit:** normal

## Ziel
Die App hat ein schlichtes Grundaussehen, das ohne Paket vollständig ist. Der Skin „Flechte“ kommt als Paket der Kategorie „aussehen“ und wird wie ein Modul geladen, ein- und ausgeschaltet und gelöscht. Fertig, wenn Flechte in der Test-App aus der lokalen Quelle geladen, aktiviert, deaktiviert und gelöscht werden kann.

## Hintergrund
- Mik, Frage 13: „Paket, App behält ein schlichtes Grundaussehen“.
- Material im Ordner OFFLINE - Home: `OFFLINE-Session-Flechte2/3-skin/skin/` mit `HERKUNFT.md` (15 Bilder, Prüfsummen von Bill nachgerechnet, alle stimmen), Schriften und Lizenzen, `skin.css`, `vorschau.html`.
- Regeln aus der Tresor/Skin-Session: Skins enthalten kein JavaScript, Notfallseiten ignorieren den Skin, Obergrenze rund 20 MB.

## Umfang
1. **Paketart für Skins:** Schlag vor, ob Skins eine eigene Art (`skin`) bekommen oder `inhalt` mit Kategorie `aussehen` sind. Ein Skin enthält nur CSS, Schriften, Bilder, Lizenzen, Herkunft. Das Prüfprogramm und der Kern lehnen Skripte in Skins ab, wie bei allen Nicht-Modulen. Ergänze `docs/PAKET-KIT.md`.
2. **CSS-Sicherheit:** Kein `@import` von außen, keine `url()` außerhalb des Pakets, kein `expression`. Prüfprogramm und Kern prüfen das.
3. **Grundaussehen:** Markup der App auf Klassen umstellen, die ein Skin bedienen kann (die Flechte-Session nutzt das Präfix `of-`). Das Grundaussehen der App bleibt schlicht und ohne Bilder.
4. **Notfallseiten** zeigen immer das Grundaussehen, auch wenn Flechte aktiv ist.
5. **Bedienung** wie bei Modulen: Katalogkarte, Vorschau, Schieber, aktiv/inaktiv, löschen. Es kann höchstens ein Skin aktiv sein.
6. **KI-Kennzeichnung** auf der Katalogkarte: „Bilder KI-generiert, Herkunft im Paket“.
7. Flechte mit dem Redaktionsschlüssel bauen und in die lokale Quelle legen. **Nicht veröffentlichen.**
8. `docs/PAKETE-IDEEN.md` korrigieren (dort heißt der Skin „fertig“).

## Prüfung
Test-App: Flechte laden, aktiv (alle Hauptseiten ansehen, hell und dunkel, 360 Pixel), Notfallseite öffnen (Grundaussehen), inaktiv, löschen. Ein Test-Skin mit verbotenem CSS muss am Prüfprogramm und am Kern scheitern.

## Offene Fragen
Punkt 1 darfst du selbst entscheiden, begründe es in der Rückmeldung. Wenn die Umstellung des Markups größer wird als gedacht, melde dich nach dem Umbau des Grundaussehens, bevor du Flechte einbaust.
