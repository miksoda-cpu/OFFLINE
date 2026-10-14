# Rückmeldung: Nr. 27 · Lumi im MVP nur als Vorschau

**Von:** Code (lokale Session, Mik) · **Datum:** 2026-10-14 · **Auftrag:** `bill/erledigt/2026-10-14-nr-27-lumi-im-mvp-nur-als-vorschau.md` (von Mik im Chat) · **Branch:** `nr-27-lumi-vorschau`
**Commits:** `416b606` (Arbeit), `b15063b` (Referenzbilder)

## Ergebnis
| Prüfung | Lauf | Ergebnis |
|---|---|---|
| `tests.yml` | [38602281286](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38602281286) | grün, mit dem neuen Test „Lumi im MVP nur als Vorschau“ |
| `tests.yml`, erster Lauf | [38601414091](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38601414091) | neuer Test grün; Bildvergleich rot, gewollt (siehe unten) |
| Windows-Probe | [38601413252](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38601413252) (`416b606`), [38602291268](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38602291268) (`b15063b`) | grün |
| Rundgang | lokal, `werkzeug/rundgang/rundgang.mjs` | 788 Prüfungen, keine gescheitert; Bilder in „OFFLINE - Home/rundgang/nr-27/“ |

Lokal: 219 Web-Tests, Werkzeug-Tests grün.

## Erklärung
1. **Ohne Lumi-Namen nur Vorschau.** `web/wesen.js` bekommt `nurVorschau`: Ohne Namen verhält sich die Lumi wie „aus“, also keine Figur, keine Einladung, keine Namensfrage und keine Tipps. Gespeichert bleibt die eigene Einstellung, nichts wird umgestellt. Mit dem Lumi-Update kommt sie unverändert zurück.
2. **Keine Lumi-Seite.** Im Menü steht „Lumi“ nicht mehr, auf Bereit fehlt die Lumi-Zeile. `#lumi` und `#heft` führen nach Heute.
3. **Lumi-Tipps:** Das Paket `wir` enthält nur die Tipps der Lumi. Es kommt nicht mehr beim ersten Start und steht mit unter „Das Lumi-Update“ (nicht ladbar). Die Karte „Das Lumi-Update“ unter „Bald“ bleibt.
4. **Mit Namen alles wie bisher:** Figur, Lumi-Seite, Menüpunkt, Tipps und Einstellungen bleiben. Wer `wir` schon hat, behält es und bekommt dessen Aktualisierungen.
5. **Nichts gelöscht:** Lumi-Inhalte, Texte und Pakete sind unverändert, es gibt keine neue Verbindung.

## Tests
- **Neu, `werkzeug/lumi-vorschau.test.mjs`:** Web-App in Headless-Chrome, im CI-Job des Bildvergleichs.
  - **Frisches Gerät:** kein Lumi-Element auf Heute, im Menü und auf Bereit, auch nicht neun Tage nach dem ersten Start, wenn die Einladung früher fällig war. `#lumi` führt nach Heute, die gespeicherte Darstellung bleibt.
  - **Lumi mit Namen:** Figur, Menüpunkt, Lumi-Seite.
  - **Ohne die Änderung geprüft: rot.** Auf Heute standen Einladung und Tipp-Karte.
- **Neu, in `web/wesen.test.mjs`:** Vorschau ohne Namen, eigene Darstellung bleibt gespeichert, mit Namen alles an.
- **Geändert, eine Prüfung der Windows-Probe:** Sie verlangte „Einladung nach einer Woche“ für eine Lumi ohne Namen. Das widerspricht dem Auftrag.
  - Jetzt verlangt sie, genauso streng, „Nach einer Woche keine Einladung, keine Lumi“: keine Einladung, kein Menüpunkt, keine Figur.
  - Geprüft wird erst, wenn das verschobene Testdatum gilt (Entwickler-Leiste da).
  - Ich zähle das nicht als Lockerung, aber es ist eine bestehende Prüfung, deshalb steht es hier.
- **Aus Nr. 24 angepasst, `web/bibliothek-bald.test.mjs`:** Liste der nicht ladbaren Pakete um `wir` ergänzt, Erststart-Zeile auf die neue Bedingung.

## Bildvergleich
- **Abweichungen:** 48 Bilder. Geprüft habe ich, dass jede nur dort liegt, wo es gewollt ist:
  - **1280 px, alle Seiten:** nur das Menü (x 14–224, y 202–632), weil „Lumi“ fehlt.
  - **Bereit:** Die Lumi-Zeile fehlt, unter „Installiert“ fehlt `wir` (6 → 5 Pakete).
  - **Bibliothek:** `wir` fehlt unter „Auf deinem Gerät“.
- **Referenzen:** von Hand aus Lauf 38601414091 neu gesetzt.

## Bilder
- **Im Repo:** `bill/rueckmeldung/bilder/2026-10-14-nr-27/`, Heute für ein frisches Gerät und für den Langzeitbenutzer (Lumi „Fini“), je 360 px und 1280 px, hell und dunkel.
- **Alle Seiten:** „OFFLINE - Home/rundgang/nr-27/“.

## Hinweis
- **Langzeitbenutzer im Rundgang ohne Tipps:** Er bekommt seinen Namen erst nach dem ersten Start und hat deshalb kein `wir`. Auf Heute steht darum keine Tipp-Karte. Echte Nutzer mit Namen haben `wir` schon.
- **Live:** Zusammengeführt am 14.10. nach Miks Wort; die Web-Version zeigt es seitdem (Vercel). Die Desktop-App bekommt es mit der nächsten Version.
