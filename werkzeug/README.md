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

## Eingefrorener Katalog für die Windows-Probe

`probe-katalog/` (Nr. 25) hält einen festen, schon veröffentlichten Stand: den signierten Web-Katalog vom 08.10.2026, 03:39 UTC (Commit `db393f1`), und die beiden Pakete daraus, die die alte App 0.1.8 früher selbst geladen hat (`at-basis` 2026.09.29.1 und `wir` 2026.10.04.4).

- **Warum:** Der Update-Test installiert 0.1.8, füllt sie mit Daten und installiert dann die neue Version darüber. Seit dem Katalog vom 08.10. 15:29 UTC verlangt `at-basis` die App 0.8.0. Gegen den Live-Katalog bekommt 0.1.8 also zu Recht kein Paket mehr, und der Test hätte nichts zu vergleichen.
- **Wie:** Die Probe liefert den Katalog lokal aus und trägt seine Adresse in die `abo.json` der alten App ein. Die Pakete spielt sie ein wie vom Stick (der Kern prüft Signatur und jede Datei), weil die Adresse im Katalog die alten Ausgaben nicht mehr liefert. Die neue App bekommt danach wieder den Live-Katalog.
- **Nichts neu signiert:** Katalog und Pakete sind Bytes von damals. `probe-katalog.test.mjs` prüft die Signatur, das `app_min` von `at-basis` gegen 0.1.8 und dass jeder Paketordner per Prüfsumme zum Katalog gehört.
- **Erneuern**, wenn
  - der Schlüssel `1504cefc5d5d7e11` aus `schluessel/oeffentlich.json` verschwindet,
  - oder die alte App im Update-Test eine andere Version wird.
  - Der Ablauf `gueltig_bis` (06.01.2027) zwingt nicht dazu: Ein abgelaufener Katalog gilt nur als „veraltet“, nicht als ungültig.
- **Zweiter Weg:** Daneben prüft die Probe den Weg heutiger Nutzer, 0.8.0 (Tag `v0.8.0`) → neu, gegen den Live-Katalog.

## Rundgang vor dem Release (`werkzeug/rundgang/`)
Seit Nr. 24 im Repo; vorher lag der Rundgang im Sitzungsordner und ging verloren. Nur Node 22 und Chrome, kein Playwright.

    node werkzeug/rundgang/rundgang.mjs --aus "../OFFLINE - Home/rundgang/<version>"

- Alle Seiten (die MVP-Seiten aus `seiten.mjs` und Lumi, Heft, Buch, Gedanken, Linie, Was ist neu, Werkzeuge, Notizen, Hilfe-Blatt, Seitenleiste, Vorschau einer „Bald“-Karte), je **frisches Gerät** und **langjähriger Benutzer**, hell und dunkel, 360 px und 1280 px.
- Der langjährige Benutzer startet mit der Österreich-Basis 2026.09.29.1 aus `probe-katalog/` und Daten wie nach Monaten (Häkchen, Bereit-Bestätigungen, Lumi „Fini“ mit Figur, Heft, Vorhaben, Pause an, Spiel-Log, Haushalt). Dann bekommt er den heutigen Katalog: Die neue Österreich-Basis muss ohne Knopfdruck kommen (Bild `vorsorge-nach-update-…`).
- Prüft je Seite: kein Fehler im Browser, nichts läuft seitlich über, kein abgeschnittener Text, keine fremde Adresse. Echte Uhrzeit. Bericht in `bericht.json`, Exit 1 bei einem Befund.
- Schalter: `--breiten 360,1280 --farben hell,dunkel --profile frisch,langzeit --nur seite[,seite]`.
