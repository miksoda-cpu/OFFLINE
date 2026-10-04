# Auftrag: Lumi-Sätze führen irgendwohin (Knöpfe je Sorte, Bewertung, Heft)

- Nr.: 2026-10-04-01
- Priorität (von Mik): nach 0.3.3, als nächster Auftrag
- Status: offen
- Quelle: Bill, Gespräch mit Mik am 04.10.2026 (Screenshot Web-App 0.3.3: Karte „Lumi sagt“ endet mit „Gelesen / Weglegen“, man kann nichts damit tun)

## Ziel
Jeder Satz der Lumi (Sprechblase, Karte „… sagt“, Textkarte) bietet eine passende Handlung an und lässt sich mit einem Tipp bewerten. Die Sackgasse „Gelesen / Weglegen“ fällt weg.

## Was genau

**1. Knöpfe je Sorte** (Sorten aus `pakete/wir/inhalt/tipps.json`)

| Sorte | erster Knopf | Wirkung |
|---|---|---|
| `app` | **Zeig mir** | springt an die Stelle in der App (`ziel`) |
| `alltag` | **Mach ich** | legt den Satz als eigenen Punkt „Vorhaben“ in Vorsorge ab, abhakbar |
| `wissen` | **Merken** | kommt ins Heft „Was Lumi gesagt hat“ |
| `digital` | **Zeig mir**, wenn `ziel` gesetzt, sonst **Merken** | wie oben |
| `weisheit`, `laune` | kein eigener Knopf in dieser Version | nur Bewertung (später: „Aus dem Lumi-Buch“, siehe 4) |

- „Mach ich“ ändert **Bereit nicht**. Bereit v2 zählt nur, was die App prüfen kann (Grundsatz: ein Tipp behauptet nie etwas, das die App nicht weiß). Ein Vorhaben ist eine Erinnerung des Nutzers, keine Prüfung.
- Das Heft „Was Lumi gesagt hat“: Liste der gemerkten Sätze mit Datum, ohne Netz durchsuchbar, einzeln löschbar. Wo es in der Navigation sitzt (Notizen oder Lumi-Einstellungen), entscheidest du.

**2. Bewertung statt „Gelesen / Weglegen“**
- Unter jedem Satz: **Mehr davon · Passt · Nicht mehr**. Jeder Knopf schließt die Karte. Das ✕ bleibt und schließt ohne Bewertung.
- „Mehr davon“ hebt das Gewicht der Sorte. „Nicht mehr“ nimmt diesen einen Satz dauerhaft aus dem Pool und senkt das Gewicht der Sorte leicht. „Passt“ ändert nichts außer dem Merken, dass gelesen.
- Sichtbar und rückgängig: In den Lumi-Einstellungen ein Abschnitt „Was Lumi gelernt hat“ mit den Gewichten je Sorte in einfachen Balken, den ausgeschlossenen Sätzen (zurückholbar) und „Zurücksetzen“. Gleiches Muster wie „Deine Linie“ im Pause-Konzept.
- Keine Zählung, keine Serien, nichts verlässt das Gerät.

**3. Neue Felder im Paket `wir` (Paket-Kit, `pruefen.mjs`, Doku)**
- `ziel` (optional): Route der App, z. B. `tresor`, `vorsorge`, `karte`. `pruefen.mjs` prüft gegen die Liste der bekannten Routen.
- `buch` (optional, jetzt nur reserviert): Nummer eines Absatzes im künftigen „Lumi-Buch“ (Form `b1-03-07`). In dieser Version wird das Feld angenommen und ignoriert.
- `ziel` für die 33 `app`-Tipps und die passenden `digital`-Tipps nachtragen. Wo ein Ziel nicht eindeutig ist, lieber keins setzen; dann erscheint nur die Bewertung.

**4. Vorbereitung Lumi-Buch (nur Struktur, kein Inhalt)**
Mik hat entschieden: Nach jedem Satz der Lumi kann man auf Wunsch einen Absatz aus „Das Lumi-Buch, Band 1“ lesen; gelesene Absätze werden im Buch freigeschaltet, das Buch zeigt den Prozentanteil. Der Text entsteht gerade in einer eigenen Session. **In diesem Auftrag nichts davon bauen**, nur das Feld `buch` reservieren und die Kartenansicht so anlegen, dass ein zweiter Knopf später Platz hat. Der Bauauftrag folgt, wenn das erste Kapitel steht.

**5. Zwei Fehler aus dem Screenshot**
- **Die Lumi spricht zweimal gleichzeitig:** oben Sprechblase (WISSEN), unten Karte „Lumi sagt“. Regel: Es ist immer nur eine Stimme der Lumi sichtbar. Ist die Figur an, spricht sie in der Sprechblase (auch der Satz des Tages); die Karte unten gibt es nur im Modus Textkarten.
- **Tipp vor der Namensgabe:** Solange die Lumi keinen Namen hat, zeigt sie nur die Frage „Wie soll sie heißen?“ und keinen Tipp. Nach „Später“ darf sie Sätze ohne „ich“ sagen, wie bisher.

## Fertig, wenn
- Alle fünf Sorten zeigen den richtigen Knopf, „Zeig mir“ landet an der richtigen Stelle, „Mach ich“ erscheint in Vorsorge, „Merken“ im Heft.
- Bewertung wirkt auf die Auswahl, ist in den Einstellungen sichtbar und zurücksetzbar.
- `pruefen.mjs` kennt `ziel` und `buch`, Tests dafür grün.
- Nur eine Lumi-Stimme gleichzeitig; vor dem Namen kein Tipp.
- Alle Tests auf Linux, macOS und Windows plus Windows-Probe grün. Dann Freigabe durch dich selbst als **0.3.4**, Eintrag in `web/neues.json`, CHANGELOG, Rückmeldung nach `bill/rueckmeldung/`.

## Hinweise
- Gilt weiter: eigene Branch, Veröffentlichung nur bei allen Tests grün, kein Push-Hinweis, keine Streaks.
- Prinzip „Milde Zugkraft“ (Projekt): jede Karte hat ein Ende, Zug durch Nutzen, nicht durch Druck.
- Darfst du selbst entscheiden: Ort des Hefts, Gewichtungsformel, genaue Texte der Knöpfe innerhalb der Vorgaben, welche Tipps ein `ziel` bekommen.
- Frag vorher: wenn ein Tipp ohne `ziel` nur durch eine neue Funktion sinnvoll würde (dann ins Feld `offen` statt bauen).
