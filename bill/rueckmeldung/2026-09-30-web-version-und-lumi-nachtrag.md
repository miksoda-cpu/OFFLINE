# Rückmeldung: Web-Version per Workflow und Lumi-Nachtrag, ausgeliefert mit 0.2.1

**Von:** Code (lokale Session) · **Datum:** 2026-09-30 · **Aufträge:** Mik im Chat, 30.09. (Web-Version), `bill/erledigt/2026-09-29-lumi-nachtrag.md` · **Tag:** `v0.2.1` auf `b71560f`

## Ergebnis
- **App 0.2.1 ist ausgeliefert.** `app/latest.json` steht auf 0.2.1 (30.09.2026, 11:06 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux sind abrufbar.
- **Web-Version** (Vercel): liefert 0.2.1 mit den Textkarten und den Paketen `at-basis` und `wir` 2026.09.29.1.
- **Katalog:** unverändert seit dem Release 0.2.0 (at-basis und wir 2026.09.29.1, Wichteln 2026.09.29).

## 1. Web-Version per Workflow
- **Neuer Workflow „Web-Version“** (`.github/workflows/web.yml`, nur auf Knopfdruck):
  - `werkzeug/web-spiegeln.mjs` holt die veröffentlichten Textpakete aus dem öffentlichen Katalog nach `web/pakete/`, bytegleich. Geprüft werden die Katalog-Signatur, jede Manifest-Signatur und jede Datei.
  - Danach signiert der Workflow den Web-Katalog mit dem Paketschlüssel aus den Secrets (`OFFLINE_SIGNIERSCHLUESSEL`, Schlüssel `1504cefc5d5d7e11`), lässt die Tests laufen und committet.
  - **Der Schlüssel kommt auf keinen Rechner.**
- **Vorteil:** Web-Version und App haben dieselben Pakete, niemand baut sie zweimal.
- **Zweimal hat das nicht nach Regel geklappt:**
  - Vercel liefert jeden Push auf den Hauptbranch sofort aus. Der erste Lauf war deshalb live, bevor Tests und Windows-Probe gelaufen waren. Inhaltlich waren es dieselben, schon öffentlichen Pakete.
  - Der Commit des Workflows hat keine Tests ausgelöst, und ein Kern-Test (Prüfpaket aus `web/pakete`) wurde rot.
  - **Behoben:**
    - Der Kern-Test verfälscht jetzt den Schlüssel, der das Prüfpaket tatsächlich signiert hat.
    - Der Workflow testet vor dem Commit.
    - Neue Arbeit entsteht auf einem eigenen Branch und kommt erst nach grünen Tests und grüner Windows-Probe auf den Hauptbranch. So lief es beim Lumi-Nachtrag.

## 2. Lumi-Nachtrag
1. **Drei Stufen:**
   - **Aus mit Textkarten** (Standard): keine Figur, neutrale Karte unten rechts, nur App, Alltag und Wissen, dazu Digital, wenn angekreuzt.
   - **Lumi mit Tipps**
   - **Tipps aus:** ganz still, nur die Bereit-Zahl, keine Einladung.

   Von sich erzählt sie (ich/mir/mein oder Bedingung `benannt`) nur eingeschaltet und mit Namen, nie auf Textkarten. „Lumi ausschalten“ führt zu den Textkarten zurück.
   - **Übergang** (Einstellungen `version: 3`): Aus 0.2.0 werden „aus“ (dort Standard) und „Nur Tipps“ zu Textkarten, die Figur bleibt, wer sie hatte. Aus 0.1.x behält die Figur, wer einen Namen vergeben hat, alle anderen bekommen Textkarten.
2. **Einladungskarte:** nach einer Woche, nur bei Textkarten. „Nicht mehr zeigen“ war schon da, denn „Nein, danke“ heißt laut Startablauf „nie wieder“. Am Text habe ich nichts geändert.
3. **Nachts schläft sie:** Mit Figur geht sie zur Schlafenszeit in „Schläft“, auch bei offener App, und gibt keine Tipps. Ein Stups weckt sie für eine Minute, danach schläft sie wieder ein.
   - Ohne Gelerntes schläft sie von 22 bis 6 Uhr.
   - Gelernt wird je Abend die letzte Eingabe zwischen 18 und 3 Uhr. Daraus ergibt sich die Schlafenszeit: Median der letzten 14 Abende plus 30 Minuten, frühestens 21, spätestens 1 Uhr, ab 7 Abenden.
4. `docs/WESEN.md` (Abschnitt B, Nachtrag 0.2.1; die offene Frage in A als entschieden vermerkt), CHANGELOG, Version 0.2.1.

## Geprüft
- **Tests:** `web/wesen.test.mjs` 12 von 12, alle Node-Tests 62 von 62.
  - Neu: Standard zeigt nur Textkarten ohne Ich-Tipps (auch mit Namen), „Tipps aus“ zeigt nichts, Übergang aus 0.1.x, 0.2.0 und 0.2.1.
  - Neu: Einladung nur bei Textkarten.
  - Neu: Nachtschlaf mit Grenzen und Lernen, Stups weckt für eine Minute, ohne Figur schläft niemand.
- **CI:** Tests grün (Kern, Werkzeug, Sandbox in Chrome, App-Berechtigungen unter Windows, macOS und Linux).
- **Windows-Probe (Lauf `36704970712`):** grün.
  - Update 0.1.8 → 0.2.1 mit „Betty“ und ohne Namen: Bereit 51 → 56, Daten erhalten, Betty an, ohne Namen keine Figur, Einladung nach einer Woche.
  - Sandbox 42 von 42 blockiert.
  - Wichteln: laden, spielen, inaktiv, löschen, nach dem Update und bei frischer Installation.
- **Web-Prototyp, Durchlauf:**
  - Frisch installiert „Aus mit Textkarten“, keine Figur. Die erste Karte kam neutral („Wissen: Festnetz läuft heute meist übers Internet …“).
  - „Tipps aus“: 15 Sekunden lang keine Karte, Hinweis „Ganz still“.
  - „Lumi mit Tipps“: Figur und Namensfrage.

## Hinweise
- Der Nachtschlaf ist im Web-Prototyp nicht live durchgespielt, dafür müsste es Nacht sein. Abgedeckt ist er über den Test mit festgesetzter Uhrzeit.
- Wer die Figur nachts sehen will, stupst sie an. Das ist gewollt: „auch bei offener App“.
