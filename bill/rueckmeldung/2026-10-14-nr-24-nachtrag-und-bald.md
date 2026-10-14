# Rückmeldung: Nr. 24 · Abschnitt A, „Bald“ in der Bibliothek, Rundgang im Repo

**Von:** Code (lokale Session, Mik) · **Datum:** 2026-10-14 · **Auftrag:** `bill/erledigt/2026-10-11-nr-24-wissen-module-und-nachtrag-0-8-0.md` · **Branch:** `nr-24-nachtrag`
**Commits:** `da77680` (Arbeit), `d0c6f8e` (Referenzbilder)

## Umfang nach Mik (14.10.)
- **Abschnitt A:** erledigt.
- **Abschnitt B:** entfällt für das MVP.
- **Statt der Wissen-Module:** Wikipedia, Wikivoyage, Karte und Lumi stehen in der Bibliothek unter „Bald“, als Vorschau mit Bildern und einem Satz, nicht ladbar.
- **Lumi (Miks Antwort auf meine Rückfrage):** Die Lumi ist im Wesentlichen Unterhaltung. Sie kommt später als eigenes Update, in der Grundversion wird sie nur angekündigt. Mit dem Artwork ist Mik noch nicht ganz zufrieden.
- **Wikivoyage:** Am Desktop war es bisher ladbar. Ab jetzt steht es nur noch unter „Bald“ (Mik).

## Ergebnis
| Prüfung | Lauf | Ergebnis |
|---|---|---|
| `tests.yml` | [38592516782](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38592516782) | grün |
| Windows-Probe | [38592513408](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38592513408) | grün (auf dem ersten Commit auch [38591898209](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38591898209)) |
| `tests.yml`, erster Lauf | [38591898993](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38591898993) | rot: Bildvergleich, gewollt (siehe unten) |
| Rundgang | lokal, `werkzeug/rundgang/rundgang.mjs` | 788 Prüfungen, keine gescheitert |

- **Lokal:** 218 Web-Tests, 54 Werkzeug-Tests.
- **Rundgang:** frisches Gerät und langjähriger Benutzer, hell und dunkel, 360 px und 1280 px. Die 260 Bilder liegen in „OFFLINE - Home/rundgang/nr-24/“.

## Erklärung
1. **Österreich-Basis kommt von selbst.** Beim Start mit Netz lädt die App eine neuere, passende Ausgabe ohne Knopfdruck, unabhängig vom Abo, wie die Tage-Pakete (`stilleUpdates` in `web/pakete.js`). Der Knopf auf Vorsorge bleibt nur als Notlösung.
2. **Eine Klammer bei „USB-Stick)“.** Endet eine Klammer mit der Abkürzung, kommt die Erklärung mit Strichpunkt hinein: „(auch als Kopie auf USB-Stick; USB: Universal Serial Bus)“.
3. **„Bald“.** Vier Karten mit je zwei Bildern (schlicht gezeichnet, ohne fremde Bilder), einem Satz und der Plakette „Bald“. In der Vorschau steht unten „Kommt mit einem späteren Update. Noch nicht zum Laden.“ statt „laden“. Die Liste steht in `web/bald.js`, die Bilder in `web/bald/` (`werkzeug/bald-bilder.mjs`).
4. **Nicht ladbar heißt:**
   - nicht unter „Neu“,
   - kein Knopf, auch nicht über einen Umweg,
   - das Lumi-Buch kommt nicht mehr beim ersten Start,
   - Lumisch kommt nicht mehr still mit Pause.
   Was schon auf einem Gerät liegt, bleibt unter „Auf deinem Gerät“. Die Ankündigung lebt in der App, nicht im Katalog: Sie gilt ohne neu signierten Katalog, und ältere Apps bleiben unberührt.
5. **Rundgang im Repo:** `werkzeug/rundgang/` braucht nur Node und Chrome, kein Playwright mehr; Beschreibung in `werkzeug/README.md`.
   - **Langjähriger Benutzer:** Er beginnt mit der Österreich-Basis 2026.09.29.1 aus dem eingefrorenen Katalog. Danach muss die neue Ausgabe von selbst kommen; geprüft wurde 2026.09.29.1 → 2026.10.08, mit Häkchen und Lumi-Namen danach.

## Abnahme
- **Neue Tests, die ohne die Änderung fehlschlagen:**
  - `web/bibliothek-bald.test.mjs`: (a) stilles Update und „Bald“
  - `web/abkuerzungen.test.mjs`: (b) genau ein Klammerpaar; ohne die Änderung geprüft: 1 Test rot
  - (c) Wissen-Modul: entfällt mit Abschnitt B
- **Kein Test gelockert:** Drei bestehende Tests prüfen Stellen im Code wörtlich. Die neuen Bedingungen sind so eingefügt, dass diese Stellen unverändert bleiben.
- **`tests.yml` nimmt jetzt auch `web/impressum.test.mjs` mit:** Der Test aus Nr. 22 lief lokal, stand aber nicht in der Liste. Das war mein Versäumnis.
- **Netz:** keine neue Verbindung. Die Bilder liegen in der App und im Offline-Speicher (Service Worker `offline-v36`).

## Bildvergleich
- **Abweichungen:** alle 12 Bilder von Bereit, Vorsorge und Bibliothek. Geprüft habe ich, dass jede nur dort liegt, wo es gewollt ist:
  - Bibliothek: die „Bald“-Karten
  - Bereit: das Lumi-Buch fehlt unter „Installiert“ (7 → 6 Pakete), weil es beim ersten Start nicht mehr kommt
  - Vorsorge: der USB-Satz mit einer Klammer
- **Referenzen:** von Hand aus Lauf 38591898993 neu gesetzt.

## Bilder
In `bill/rueckmeldung/bilder/2026-10-14-nr-24/`, je 360 px und 1280 px, hell und dunkel:
- Bibliothek mit „Bald“
- Vorschau „Das Lumi-Update“
- Vorsorge des langjährigen Benutzers nach dem stillen Update

## Offen
- **Grundversion ohne Lumi:** Miks Ziel geht über die Bibliothek hinaus. Die Lumi soll in der Grundversion nur angekündigt werden; Figur auf Heute, Lumi-Seite und Lumi-Tipps sind noch da. Das braucht einen eigenen Auftrag (Ideenbuch).
- **Nicht mehr unter „Bald“:** „Österreich-Paket Pro“ und „Rechtsinformationssystem (RIS)“. Mik hat nur die vier genannt; zurückholen ist ein Eintrag in `web/bald.js`.
- **„Was ist neu“:** Ein Eintrag kommt mit der nächsten Desktop-Version.
- **Live:** Die Web-Version zeigt alles, sobald der Branch zusammengeführt ist (Vercel). Das Zusammenführen wartet auf Miks Wort.
