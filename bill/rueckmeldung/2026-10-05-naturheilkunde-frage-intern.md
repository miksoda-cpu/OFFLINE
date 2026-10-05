# Frage vor dem Bau: Naturheilkunde „nur intern“ – zwei Wege

**Von:** Code (lokale Session) · **Datum:** 2026-10-05 · **Auftrag:** `bill/todo/2026-10-05-naturheilkunde-intern.md` (Nr. 2026-10-05-08), Punkt 3 „Frag vorher“

Bis du antwortest, baue ich den Umwandler, die Prüfregeln und die Oberfläche. Die braucht jeder Weg. Ausgeliefert wird nichts.

## Was für beide Wege gleich ist
- **Kein öffentlicher Katalog, keine Web-Kopie:**
  - Das Paket `naturheilkunde` steht nie in `katalog.json` und nie in `web/pakete/`.
  - Ein Test prüft beides.
  - Der Workflow „Web-Version“ spiegelt nur, was im öffentlichen Katalog steht.
- **Nicht im Menü:** Der Bereich erscheint erst, wenn das Paket auf dem Gerät installiert ist. Ohne Paket gibt es keinen Menüpunkt, keine leere Seite und keinen Hinweis. Ein Test prüft das.
- **Signiert:** Das Paket ist signiert wie alle anderen; die App prüft die Signatur vor dem Einspielen.
- **Auf beiden Geräten:** Mik nutzt es in der Desktop-App und am iPad (dort die Web-Version, Paket im Speicher des Browsers).

## Weg A: Interner Kanal mit Schlüssel (meine Empfehlung)
- **Ein zweiter, kleiner Katalog** liegt auf demselben Server unter `intern/`.
  - Er enthält nur interne Pakete.
  - Er ist signiert wie der öffentliche Katalog.
- **Verschlüsselt:** Die Pakete darin sind mit AES-256 verschlüsselt. Wer die Adresse kennt, sieht nur Datensalat.
- **Freischalten, einmal je Gerät:** Mik öffnet einen Link, den nur er bekommt.
  - Am iPad öffnet er ihn in Safari oder in der Home-Bildschirm-App.
  - In der Desktop-App fügt er ihn in ein verstecktes Feld ein, erreichbar über siebenmal Tippen auf die Versionsnummer.
  - Der Link enthält den Kanal-Schlüssel. Die App merkt ihn sich nur auf diesem Gerät.
- **Ohne Schlüssel** fragt die App den internen Katalog nie ab. Für alle anderen gibt es ihn also nicht.
- **Updates kommen von selbst:** Für eine neue Fassung nach der Prüfung lade ich nur hoch. Mik muss nichts tun.
- **Aufwand:** etwa ein halber Tag mehr als Weg B. Der Schlüssel liegt wie der Paketschlüssel nur in den GitHub-Secrets und im Link für Mik, nie im Repo.
- **Risiko:** Wer den Link bekommt, hat Zugang. Den Schlüssel kann ich wechseln; alte Links funktionieren dann nicht mehr.

## Weg B: Einspielen per Datei
- **Eine Datei:** Ich baue die Datei `naturheilkunde-<version>.offline`, ein signiertes Paket in einer einzigen Datei.
- **Weitergabe:** Mik bekommt sie per AirDrop oder iCloud Drive.
- **Einspielen:**
  - Am Desktop über das schon vorhandene „Vom USB-Stick oder Ordner einspielen“.
  - Am iPad über einen neuen Knopf „Paket aus Datei einspielen“ in der Bibliothek. Diesen Knopf sehen alle. Er ist allgemein gehalten und verrät nichts über Naturheilkunde.
- **Aufwand:** etwas kleiner als Weg A. Nichts liegt auf dem Server.
- **Nachteil:**
  - Jede neue Fassung, zum Beispiel nach der Apotheken-Prüfung, muss Mik wieder von Hand einspielen, auf jedem Gerät.
  - Am iPad gibt es dafür einen Knopf, den alle sehen; er ist allerdings neutral beschriftet.

## Meine Empfehlung
**Weg A:**
- Er erfüllt „kein anderer Nutzer sieht etwas, auch nicht leer, auch nicht im Menü“ vollständig, auch ohne sichtbaren Knopf.
- Der Kanal bleibt brauchbar, wenn später weitere interne Inhalte dazukommen, etwa für die Apotheke zur Prüfung: ein zweiter Link für die Prüferin oder den Prüfer.

**Bitte antworte mit A oder B** (oder einem dritten Weg). Bis dahin liefere ich 0.5.6 mit „Tagesende“ und „Lumisch anhören“ aus; die Naturheilkunde kommt danach als 0.6.0.
