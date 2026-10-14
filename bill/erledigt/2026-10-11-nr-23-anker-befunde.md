# Auftrag: Nr. 23 · Befunde aus Miks Anker-Bewertung

**Von:** Bill · **Datum:** 2026-10-11 · **Dringlichkeit:** normal

## Ziel
Die vier Stellen, die Mik am 11.10.2026 im Anker mit „passt nicht“ bewertet hat, sind behoben. Für den Satz am Tagesende gibt es drei Kandidaten, aus denen Mik wählt.

## Hintergrund
Mik hat 41 von 42 MVP-Bildschirmen bewertet: 34 passt, 7 passt nicht. Daraus ist die Festlegung „Prüfliste aus dem Anker“ in `bill/README.md` entstanden. Seine Begründungen, wörtlich:
- Vorschau-Fenster, Seite 2 (Bilder `2026-10-08-version-0-7-2/vorschau-03-*`): „Schrift zu klein. Nicht lesbar“, „Screenshot nicht lesbar“.
- Altersfrage (`vorschau-04-altersfrage-*`): „Wer soll das überprüfen? Die Eltern nicht. Wir nicht. Eher als Empfehlung statt als ja/nein“.
- Heute am Tagesende (`2026-10-04-stil-zart-heute-*`): „Das war dein Tag – das ist nicht sehr sinnvoll, überarbeite, was hier besser herpasst“.
- Übersicht/Bereit breit (`2026-10-04-stil-zart-uebersicht-breit-nachher.jpg`): „Farbcode fehlt“.

## Umfang
1. **Vorschau-Bilder lesbar:** In den Vorschauen der Bibliothek darf kein Bildschirmfoto so verkleinert sein, dass Text darin auf dem Handy unlesbar wird. Weg frei: Ausschnitt statt ganzer Bildschirm, oder Antippen zum Vergrößern. Gilt für alle Pakete, nicht nur „Was die Lumis denken“.
2. **Altersfrage wird Empfehlung:** Statt „Bist du mindestens 18? Ja/Nein“ ein Hinweis „Empfohlen ab 18“ beim Paket, Laden ohne Frage. `alter_ab` bleibt im Paketformat. Der Test zur Sperre nach Alter wird an das neue Verhalten angepasst; das ist keine Lockerung, sondern Miks Entscheidung (siehe Festlegung).
3. **Satz am Tagesende:** „Das war dein Tag. Bis morgen.“ (`web/tag.js`, `SCHLUSS`, und `web/hilfe.js`) ersetzen. **Kandidaten: 3.** Drei Varianten auf eigenen Branches (`tagesende-a/-b/-c`), jede mit Bild Heute am Tagesende, 360 px, hell und dunkel. Der Satz soll dem Menschen am Abend etwas geben, das zur App passt (vorbereitet sein, Ruhe, morgen geht es weiter), kurz, ohne Floskel. Nicht zusammenführen; Mik wählt, dann führt Bill den Gewinner zusammen.
4. **Farbcode in Bereit, breite Ansicht:** Die Zeilen Inhalte, Dinge, Menschen, Können zeigen ihren Zustand mit Farbe, wie in der Handy-Ansicht oder mit Ampelfarben aus dem bestehenden Stil. Kontrast 4,5 : 1 bleibt.

Nicht dazu: Lumi (nicht im MVP), andere Seiten.

## Abnahme
Kommandos (Exit-Code 0, auf dem Auftragsbranch):
- je Punkt ein Test, der ohne die Änderung fehlschlägt (Punkt 3 erst nach Miks Wahl)
- `node --test web/*.test.mjs`, `tests.yml` grün, Windows-Probe grün

Muss (JA/NEIN):
- [ ] Vorschau-Text auf 360 px lesbar (Bild in der Rückmeldung)
- [ ] keine Ja/Nein-Altersfrage mehr, Hinweis „Empfohlen ab …“ sichtbar
- [ ] drei Kandidaten für den Tagesende-Satz mit Bildern
- [ ] Bereit breit mit Farbcode, hell und dunkel

Darf nicht (JA/NEIN):
- [ ] keine Lumi-Inhalte verändert
- [ ] kein anderer bestehender Test gelockert oder gelöscht
- [ ] keine neue Netzwerkverbindung

Belege:
- Rückmeldung mit Commit, CI-Links und Bildern vorher/nachher, 360 px und breit, hell und dunkel
- Erklärung in höchstens zehn Zeilen

Kandidaten: 3 (nur Punkt 3), sonst 1

## Offene Fragen
Keine. Code entscheidet den Weg für Punkt 1 und die Farben für Punkt 4 im bestehenden Stil.
