# Rückmeldung: Release 0.2.0, Wichteln und `wir` im Katalog

**Von:** Code (lokale Session) · **Datum:** 2026-09-30 · **Auftrag:** `bill/erledigt/2026-09-29-release-wichteln.md` · **Tag:** `v0.2.0` auf `1a8c304`

## Ergebnis
- **App 0.2.0 ist ausgeliefert.** `app/latest.json` steht auf 0.2.0 (veröffentlicht 30.09.2026, 10:09 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux liegen unter `app/0.2.0/` und sind abrufbar. Dazu gibt es einen GitHub-Release-Entwurf mit 17 Dateien.
- **Katalog** (erstellt 29.09.2026, 16:10 UTC, signiert mit `1504cefc5d5d7e11`). Jedes Manifest ist nachgeladen und gegen die Katalog-Prüfsumme und die eigene Signatur geprüft:

| Paket | Version | Art | app_min | sha256 des Manifests | Signatur |
|---|---|---|---|---|---|
| at-basis | 2026.09.29.1 | inhalt | 0.1.0 | `7647f176312eb0658a494819003e5ea3b53f87318de70ca40b9bd866baa5406d` | 1504cefc5d5d7e11 |
| wichteln | 2026.09.29 | modul | 0.2.0 | `18f396dee8d0960f831a985dd7723abd1302cc6f2bd7ff603bdff7df2c1afb1b` | d9b62d1755ba3744 (Redaktion) |
| wir | 2026.09.29.1 | inhalt | 0.2.0 | `b79f0c2db642663ae726d8c7abd53f3107f39c60c3f370590c9b36441ffb4099` | 1504cefc5d5d7e11 |
| wikivoyage-de | 2026.09.24 | zim | 0.1.0 | `b62ea3486628609932a41540cb18b8ca389a856208c3161ea82a37c03d9cf91f` | 1504cefc5d5d7e11 (unverändert) |

  - `wir` hat 176 Tipps. `at-basis` trägt den korrigierten Sirenen-Text, `aenderungen`: „Sirenen: Hinweis zum Blackout korrigiert. Viele Sirenen brauchen Strom.“
  - Wichteln hat fünf Vorschau-Folien im Katalog.
  - **Flechte ist nicht dabei**, sie bleibt in der lokalen Redaktionsablage.
- **Bereit:** Treffpunkt und Anlaufstelle gelten 12 Monate, Familiengruppe, Nummern und Nachbar 6 (`bereit.js`, Tests, `WESEN.md`).

## Windows-Probe
Neuer Workflow „Windows-Probe“ (nur auf Knopfdruck). Er baut 0.1.8 aus dem Quellstand und die neue Version, beide als Entwickler-Build mit Debug-Anschluss, und bedient die echte App unter WebView2 per msedgedriver.

Letzter Lauf `36698665496`: **grün.**
- **Sandbox-Probe gegen Edge 153:** 42 von 42 Angriffen blockiert.
- **Update 0.1.8 → 0.2.0 mit benanntem Wesen („Betty“):** Bereit **51 → 56** (Sockel 51), auch im ersten Bild. Checkliste mit 14 Häkchen erhalten, Bestätigungen für Wasser, Radio und Probeabend mit altem Datum übernommen, Betty bleibt an, kein Service Worker mehr.
- **Update 0.1.8 → 0.2.0 ohne Namen:** Bereit 51 → 56, die Lumi ist aus, am ersten Tag keine Einladung, nach einer Woche die Einladung.
- **In der App, nach dem Update und bei frischer Installation:**
  - Sandbox-Probe: **42 von 42 blockiert**.
  - Wichteln aus der lokalen Quelle: laden (Signatur und Redaktionsschlüssel geprüft), spielen (Runde über `window.offline` gespeichert), inaktiv, löschen.
- **Berechtigungstest** (siehe unten): grün unter Windows, macOS und Linux.

## Was die Probe gefunden hat (alles behoben, vor der Veröffentlichung)
1. **Nach dem Update startete die App unter Windows nicht.** Das Fenster zeigte eine Fehlerseite.
   - Ursache: 0.1.x hat unter Windows (`http://tauri.localhost`) den Service Worker des Web-Prototyps registriert, und der ließ die neue Seite nicht laden. Unter macOS gibt es das nicht.
   - Behoben: Der Kern löscht den Worker, bevor das Fenster lädt. Das Fenster entsteht deshalb erst im Setup (`"create": false`). Die Desktop-App registriert keinen Worker mehr und meldet alte ab. Alle übrigen Daten bleiben.
   - **Ohne die Probe wäre jedes Windows-Update mit einer leeren Fehlerseite geendet.**
2. **Tauri-Schnittstellen im Modulrahmen unter Windows.** WebView2 legt `__TAURI_INTERNALS__`, `window.ipc` und `chrome.webview` auch in Unterrahmen an. Vier echte Aufrufe (App-Info, Tresor, Webseite öffnen, Ordnerdialog) kamen nie an. Nach deiner Entscheidung gibt es drei Sicherungen:
   - **Die Brücke räumt ab:** `chrome.webview` und die `__TAURI*`-Namen, soweit Tauri es zulässt. `__TAURI_INTERNALS__` und `window.ipc` legen Tauri und wry unlöschbar an, beide haben aber keinen Weg mehr zur App. `window.ipc.postMessage` wirft einen Fehler.
   - **Die Probe zählt Benutzbarkeit:** „Tauri-Objekt benutzbar“ und „Tauri-Rohkanal“ gelten nur als gelungen, wenn ein Aufruf durchgeht. Es sind jetzt 42 Versuche statt 37.
   - **Der Kern lehnt fremde Herkunft ab:**
     - Alle 64 App-Befehle stehen im App-Manifest (`build.rs`, Satz `app-befehle`). Vergeben wird er nur in `capabilities/default.json`: Fenster `main`, ohne `remote`.
     - Test `berechtigungen`: echte IPC-Anfragen durch Tauris Prüfung. Die eigene Herkunft darf, der Modulserver und andere Adressen bekommen keinen der elf geprüften Befehle, auch keine Plugin-Befehle.
     - Gegenprobe: Mit `remote` für 127.0.0.1 fällt der Test durch.
     - Der Test läuft in der CI auf drei Systemen. Unter Windows brauchen Tauri-Tests ein eingebettetes Manifest, das `build.rs` jetzt selbst einbindet (inhaltlich Tauris Vorgabe).
   - Alles steht in `SICHERHEIT.md`.
3. **Release über Tag:** Der erste Tag scheiterte, weil das Token keinen GitHub-Release anlegen durfte. `desktop.yml` hat jetzt `contents: write`, der Tag ist neu gesetzt.

## Weitere Änderungen in diesem Auftrag
- **Übergang Bereit** (abgenommen): Beim ersten Start von 0.2.0 wird der Wert nach Version 1 als Sockel gemerkt. Er gilt drei Monate und klingt dann über drei Monate aus. Solange er trägt, zeigt die Übersicht „Aus der Vorversion übernommen … (jetzt X)“.
- **`app_min`** (abgenommen): Ab 0.2.0 beachten Katalog, Abo und Erstinstallation den Wert („Braucht App …“). Module und Skins brauchen mindestens 0.2.0 (Werkzeug, Kit, Pflichtenheft). Wichteln ist dafür mit `app_min` 0.2.0 neu signiert worden, noch vor der Veröffentlichung.
- **„Inhaltspakete“** (nur auf Knopfdruck):
  - Neue Auswahl `textpakete`, gebaut mit dem Paketschlüssel der CI, Version wählbar.
  - Neuer Schalter `redaktion`: prüft und lädt `redaktion/freigegeben/` hoch, aber nur Pakete mit Redaktionsschlüssel.
  - Der Katalog übernimmt die Folien gespiegelter Module, die neueste Version bestimmt ein Versionsvergleich.
- **Paketwerkzeug:** nimmt `OFFLINE_VERSION`, etwa für eine zweite Ausgabe am selben Tag (`2026.09.29.1`).

## Hinweise
- **Apps mit 0.1.8** kennen `app_min` nicht.
  - Wer das Abo an hat, bekommt das neue `wir` schon vor dem App-Update. Dann zeigen sechs Tipps mit neuen Bedingungen (Wochentag, Stunde, Zeitumstellung) sich zur falschen Zeit. Das ist harmlos und endet mit dem Update.
  - Wichteln erscheint in 0.1.8 als Karte, das Einspielen lehnt der alte Kern aber ab (unbekannte Art).
- **Web-Prototyp:** Er hat noch die alten gebauten Textpakete in `web/pakete/`. Die neuen sind mit dem Schlüssel der CI signiert, der nicht auf diesem Mac liegt. Neu bauen geht mit `alles-bauen.sh`, sobald ein Paketschlüssel lokal verfügbar ist.
- Die Windows-Probe baut Entwickler-Builds mit Debug-Anschluss, nur für die Probe. Ausgeliefert wird der normale Build aus `desktop.yml`.
