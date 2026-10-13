# werkzeug – Prüfstufen Bildvergleich und Barrierefreiheit

Seit Auftrag Nr. 21 (13.10.2026) laufen in `tests.yml` (Job „Bildvergleich und Barrierefreiheit“) zwei Prüfungen gegen die Web-App. Beide nehmen dieselben MVP-Seiten (`seiten.mjs`): Heute, Bereit, Notfall (mit Radio), Vorsorge (mit Grundvorsorge und Haushalt), die zwölf Szenario-Karten, Karte, Bibliothek, Pause, Tresor, Einstellungen („Updates & Abo“) und das Hilfe-Blatt. Je 360 px und 1280 px, hell und dunkel. Lumi ist aus, Datum (14.10.2026, 10:00 Wien) und Zufall sind fest, Bewegung ist abgeschaltet, fremde Adressen sind gesperrt. Gesteuert wird Headless-Chrome über das DevTools-Protokoll, ohne npm-Abhängigkeit (`browser.mjs`).

## Bildvergleich

```
node werkzeug/bildvergleich.mjs --chrome                    # vergleichen (CI)
node werkzeug/bildvergleich.mjs --chrome --referenz-setzen  # Referenz neu setzen, nur von Hand, im CI gesperrt
  --nur heute,notfall   --aus <ordner>   --anker <ordner>   # Auswahl, Ausgabeordner, JPG-Satz 480 px
```

- Referenzbilder: `referenz/<seite>-<breite>-<hell|dunkel>.png`, volle Seitenhöhe (höchstens 8.000 px). Sie stammen aus der CI (Ubuntu, Google Chrome), weil die Schriften der Systeme verschieden sind.
- Toleranz: `referenz/toleranz.json`. Ein Pixel weicht ab, wenn ein Farbkanal um mehr als `schwelle` abweicht; die Seite fällt durch, wenn mehr als `anteil` der Pixel abweichen oder die Größe nicht stimmt. Standard: Schwelle 16, Anteil 0. Eine Ausnahme je Seite braucht einen `grund`.
- Bei Abweichung: Aufnahme und Differenzbild (Referenz blass, Abweichung rot) im Ausgabeordner, in der CI als Artefakt `bildvergleich-<commit>`.
- Ändert sich eine Seite gewollt, wird die Referenz von Hand neu gesetzt und das neue Bild mit dem Auftrag abgegeben.
- PNG lesen, schreiben und vergleichen: `png.mjs` (nur `node:zlib`).

## Barrierefreiheit

```
node werkzeug/barrierefrei.mjs --chrome   [--nur <seite>] [--aus <ordner>]
```

- axe-core 4.13.0 (MPL-2.0) liegt als einzelne Datei mit Lizenz in `axe/` und wird nur in die geprüfte Seite gegeben, nie in die App.
- Regeln WCAG 2.0 und 2.1, Stufe A und AA. Befunde „serious“ und „critical“ lassen die Prüfung fehlschlagen, „moderate“ und „minor“ werden gelistet.
- Ausnahmen: `barrierefrei-ausnahmen.json`, je Eintrag Regel, optional Seite und Ziel, und ein Grund. Leer ist besser; nicht mehr gebrauchte Ausnahmen meldet das Werkzeug.

Tests ohne Browser: `node --test werkzeug/bildvergleich.test.mjs`.
