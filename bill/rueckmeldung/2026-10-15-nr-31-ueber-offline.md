# Rückmeldung: Nr. 31 · „Über OFFLINE“: wer dahintersteht und wer bezahlt

**Von:** Code (lokale Session, Mik) · **Datum:** 2026-10-15 · **Auftrag:** `bill/todo/2026-10-15-nr-31-ueber-offline.md` · **Branch:** `nr-31-ueber-offline`
**Commit:** `84527d9`

## Ergebnis
- **Prüferkette auf `84527d9`:** `tests.yml` [38789680070](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38789680070) grün, Windows-Probe [38789700263](https://github.com/miksoda-cpu/OFFLINE/actions/runs/38789700263) grün.
- **Rundgang** (Einstellungen und Länderfrage, 390 px und 1280 px): ohne Befund.

## Erklärung
1. **„Über OFFLINE“** steht ganz oben unter „Einstellungen“, vor Land, Alter und Bundesland. Der Text ist wortgleich zu Miks Freigabe vom 15.10.
2. **Darunter der Satz:** „Die App spielt von selbst keine Töne. Sirenen hörst du nur, wenn du auf ‚Anhören‘ tippst.“
3. **Speicher:** „Auf diesem Gerät: Pakete 1,8 MB“ ist die Summe der geladenen Pakete, wie auf Bereit. Im Browser kommt dazu, was der Browser für die Seite belegt: „App und Pakete im Browser zusammen 3,1 MB“ (`navigator.storage.estimate`, keine Anfrage nach außen).
   - **Abweichung vom Auftrag:** „Updates & Abo“ berechnet keinen Speicher; berechnet wird er nur auf Bereit.
   - **Desktop:** Die Größe des App-Programms selbst kennt die Desktop-App nicht. Dort steht nur die Summe der Pakete.
4. **Absender-Knopf:** „Von der digitalworld Academy OG, Wien.“ auf der Länderfrage führt jetzt zu „Über OFFLINE“ (`#einstellungen`).
   - **Vor der Wahl:** Die Einstellungen sind schon vor der Wahl erreichbar, alle anderen Seiten zeigen weiter die Frage.
   - **Rückweg:** Solange das Land nicht gewählt ist, steht dort zusätzlich „‹ Zurück zur Länderfrage“.
   - **Impressum:** eigener Knopf in „Über OFFLINE“.

## Abnahme
- **Neuer Test:** `werkzeug/ueber.test.mjs`.
  - **Geprüft:** Der Abschnitt steht ganz oben, Text und Töne-Satz sind wortgleich, Speicher und Impressum-Knopf sind da. Der Absender führt von der Länderfrage dorthin, „Zurück“ führt zur Frage. Nach der Wahl fehlt der Zurück-Knopf.
  - **Ohne die Änderung rot**, weil es den Abschnitt nicht gibt.
- **Geändert:** eine Prüfung aus Nr. 28 (`werkzeug/land.test.mjs`). Sie verlangte, dass der Absender direkt zum Impressum führt; jetzt verlangt sie `#einstellungen`, wie Nr. 31 es will. Gleich streng.
- **Darf nicht:** Test gelockert NEIN · neue Verbindung NEIN.

## Bilder
`bill/rueckmeldung/bilder/2026-10-15-nr-31/`: „Über OFFLINE“, 390 px hell und dunkel, dazu 1280 px.
