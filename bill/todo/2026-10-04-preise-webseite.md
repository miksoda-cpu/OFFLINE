# Auftrag: neue Preise und vier Stufen auf der Webseite

- Nr.: 2026-10-04-04
- Priorität (von Mik): klein, gern vor oder parallel zu Pause 0.4.0
- Quelle: Entscheidung Mik am 04.10.2026 im Gespräch mit Bill. Kalkulation im Projekt: `OFFLINE-Preise-Kalkulation.md`

## Ziel
Die Startseite (`web/index.html`) zeigt die beschlossenen Preise in vier Stufen. Sie verspricht nichts, was die App noch nicht kann.

## Beschlossen (Mik, 04.10.2026)

| Stufe | Preis | Inhalt |
|---|---|---|
| **Gratis** | 0 € | Anmeldung mit Name und E-Mail · App und Offline-Installer · Wikipedia, Karte Österreich · Österreich-Paket Grundversion · Lumi mit Tipps · Schließfach 500 MB (kommt) · Updates von Hand |
| **Pro** | **7,90 € / Monat oder 79 € / Jahr** | Update-Abo mit Delta-Updates · Österreich-Paket nach Bundesland · Blackout- und Krisenvorsorge komplett · RIS-Gesetzesauszug wöchentlich · Schließfach 50 GB (kommt) |
| **Pro+ Familie** | **19,90 € / Monat oder 199 € / Jahr** | alles aus Pro · für bis zu 5 Personen · Schließfach 500 GB (kommt) · Kinder-Modus am Elternkonto (kommt) |
| **Gemeinde · Schule · Betrieb** | **ab 590 € / Jahr und Standort** | alles aus Pro, für viele Geräte · eigene Inhalte der Gemeinde · zentral verwaltete Updates · Ansprechperson und Schulung |

## Was genau
1. **Preisabschnitt:**
   - Überschrift „Gratis, Pro und Pro+“.
   - Vier Karten. Bei 360 Pixel Breite stehen sie untereinander, auf breiten Schirmen nebeneinander oder zwei mal zwei.
   - Pro bleibt hervorgehoben.
2. **Satz zum Schließfach** unter der Überschrift:
   - „Offline leben, aber nie ohne Sicherung: Das Schließfach ist der einzige Ort außerhalb deines Geräts. Verschlüsselt wird bei dir, wir sehen nur Bytes.“
   - Der bestehende Satz „Die Software ist frei. Bezahlt wird, was wir laufend leisten …“ bleibt.
3. **Kurse raus:**
   - Die Kachel „Kurse“ unter „Was drin ist“ und der Punkt bei Pro fallen weg. Mik hat am 27.09. entschieden: Kurse der Academy vorerst nicht in OFFLINE.
   - An die Stelle der Kachel kommt „Die Lumi“: „Eine Begleiterin aus einer Höhle unter dem Eis. Sie gibt Tipps, wenn du willst, und schweigt, wenn nicht.“
4. **Ehrlichkeit:**
   - Was es noch nicht gibt, trägt „kommt“: Schließfach, Kinder-Modus und die Kachel „KI-Assistent“.
   - Grundsatz wie bei den Tipps: Die Seite behauptet nichts, was die App nicht kann.
5. **Mitziehen:**
   - `docs/GHOST-SETUP.md`: Ghost-Stufe und Werbesatz auf die neuen Preise, ohne Kurse.
   - `docs/KONZEPT.md`: Preistabelle mit vier Spalten, Kurse-Zeile streichen oder als „vorerst nicht“ markieren.
   - `web/datenschutz.html` prüfen: Der Lizenzschlüssel gilt für Pro und Pro+.
6. **Keine Zahlung einbauen.** Es gibt noch keinen Shop. Die Seite zeigt nur die Preise, die Anmeldung für Gratis bleibt wie sie ist.

## Fertig, wenn
- Die Seite zeigt vier Stufen mit den Preisen oben und hat bei 360 Pixel Breite keinen seitlichen Bildlauf.
- Kurse kommen nirgends mehr vor, alles Fehlende ist mit „kommt“ markiert.
- Die Tests sind grün und die Web-Version ist ausgeliefert. Für die Startseite allein braucht es keinen App-Tag. Wenn sie mit einer App-Version zusammen ausgeliefert wird, kommt ein Satz in `web/neues.json`.
- Die Rückmeldung mit Bildschirmfoto bei 360 Pixel und auf breitem Schirm liegt in `bill/rueckmeldung/`.

## Hinweise
- **Darfst du selbst entscheiden:** Anordnung der Karten, Wortlaut der Punkte innerhalb der Liste oben.
- **Frag vorher:** wenn du an anderer Stelle der Seite weitere Versprechen findest, die die App nicht hält. Dann zuerst auflisten, nicht selbst umschreiben.
