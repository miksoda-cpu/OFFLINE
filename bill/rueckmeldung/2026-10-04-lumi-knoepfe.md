# Rückmeldung: Lumi-Sätze führen irgendwohin – ausgeliefert mit 0.3.4

**Von:** Code (lokale Session) · **Datum:** 2026-10-04 · **Auftrag:** `bill/erledigt/2026-10-04-lumi-knoepfe.md` (Nr. 2026-10-04-01) · **Branch:** `lumi-knoepfe` · **Tag:** `v0.3.4`

## Ergebnis
@@ERGEBNIS@@

## 1. Knöpfe je Sorte
Unter jedem Satz der Lumi gibt es Knöpfe, an allen drei Stellen, an denen sie spricht: Sprechblase der Figur, eingeblendete Meldung im Modus Textkarten, Textkarte des Tages.

| Sorte | erster Knopf | Wirkung |
|---|---|---|
| `app` | **Zeig mir**, nur mit `ziel` | springt an die Stelle; Abschnitte der Übersicht werden aufgeklappt |
| `alltag` | **Mach ich** | wird ein Vorhaben in Vorsorge (eigener Abschnitt oben, abhakbar, löschbar). Danach steht dort „Steht in Vorsorge unter Vorhaben“ als Link |
| `wissen` | **Merken** | kommt ins Heft. Danach steht „Steht im Heft“ als Link |
| `digital` | **Zeig mir** mit `ziel`, sonst **Merken** | wie oben |
| `weisheit`, `laune` | keiner | nur Bewertung |

- **„Mach ich“ ändert Bereit nicht.** Die Vorhaben liegen getrennt von der Checkliste (`vorhaben`). Geprüft: Abhaken lässt die Zahl unverändert.
- **Ein zweiter Knopf hat Platz** (`.lumi-aktionen`), später „Aus dem Lumi-Buch“.
- **Ort des Hefts, meine Entscheidung:** eine eigene Seite „Was Lumi gesagt hat“ (`#heft`), erreichbar aus Übersicht › Lumi und über „Steht im Heft“.
  - Mit Datum, ohne Netz durchsuchbar, jeder Satz einzeln löschbar.
  - Der Stern im bisherigen Verlauf ist jetzt dasselbe wie Merken. Früher gesetzte Sterne stehen beim ersten Start im Heft.
  - Den Verlauf habe ich in „Alles, was Lumi gesagt hat“ umbenannt, damit er nicht wie das Heft heißt.

## 2. Bewertung
- **Unter jedem Satz:** *Mehr davon · Passt · Nicht mehr*. Jede Bewertung schließt den Satz, auf der Tagesseite gilt die Karte dann als erledigt.
- **Das ✕ bleibt** und schließt ohne Bewertung. Auf der Tagesseite zählt das als „weggelegt“, so lernt die bestehende gelernte Schicht weiter.
- **Formel, meine Entscheidung:** Jede Sorte beginnt mit Gewicht 1.
  - „Mehr davon“ multipliziert mit 1,3, höchstens bis 3.
  - „Nicht mehr“ multipliziert mit 0,85, mindestens bis 0,4, und nimmt den Satz dauerhaft aus dem Pool.
  - „Passt“ merkt nur, dass der Satz gelesen wurde.
  - Das Gewicht wirkt bei der Wahl der Sorte. Laune bleibt zusätzlich halb so oft wie bisher.
- **„Was Lumi gelernt hat“** in Übersicht › Lumi, bei Figur und bei Textkarten:
  - Ein Balken je Sorte mit „seltener“, „normal“ oder „öfter“.
  - Die ausgeschlossenen Sätze mit „Zurückholen“, dazu „Zurücksetzen“.
  - Keine Zählung, keine Serien, alles bleibt am Gerät.
- **Der Satz des Tages bleibt den Tag über derselbe,** auch wenn man ihn mit „Nicht mehr“ bewertet. Sonst stünde nach dem Schließen sofort ein neuer da.

## 3. Paket `wir`, Kit
- **Neu im Kit:** `paket-kit/tipps-format.mjs` mit `ZIELE`, `SORTEN` und `tippsFehler`.
  - `pruefen.mjs` prüft jede `inhalt/tipps.json`: id, Sorte, Text, Gewicht, Bedingung, `ziel` gegen die Liste, `buch` in der Form `b1-03-07`.
  - Die Doku steht in `PAKET-KIT.md` Abschnitt 5c (mit Kopie im Kit). Ein Test prüft, dass die App dieselbe Liste führt und jedes Ziel in der App existiert.
- **Ziele (16 Tipps):** Nur wo eindeutig. Tipps, die auf eine Funktion warten, bekommen keins.
  - `app-001`, `app-007` → Tresor
  - `app-004` → Lumi-Einstellungen
  - `app-005`, `app-010`, `app-023` → Tagesplan
  - `app-008`, `app-021`, `app-022` → Tagesseite
  - `app-009` → Verlauf der Lumi
  - `app-011`, `app-012`, `app-027` → Bibliothek
  - `app-020` → Leseansicht
  - `app-025` → Werkzeuge
  - `digital-001` → Updates
- **Ohne Ziel bleiben** 18 App-Tipps, die meisten warten auf ihre Funktion; `app-030` „Alles hier ist exportierbar“ hat keine eindeutige Stelle. Alle anderen Digital-Tipps bekommen „Merken“.
- **Nebenbei wahr geworden:** `app-004` („Unter Einstellungen steht ‚gelernt‘ …“) kommt jetzt, weil es „Was Lumi gelernt hat“ gibt. Neue Einträge in `FUNKTIONEN`: `gelernt`, `heft`, `vorhaben`.
- **`buch`** wird angenommen und geprüft, die App verwendet es noch nicht.

## 4. Lumi-Buch
Gebaut ist nur die Struktur: das reservierte Feld und Platz für einen zweiten Knopf. Inhalt gibt es noch keinen.

## 5. Die zwei Fehler
- **Zwei Stimmen gleichzeitig:**
  - Mit Figur spricht der Satz des Tages jetzt in der Sprechblase, eine Karte „Lumi sagt“ gibt es nicht mehr. Die Karte unten gibt es nur bei Textkarten.
  - Ein offener Satz wird nicht durch einen neuen ersetzt.
  - Bei Textkarten erscheint auf der Tagesseite keine Meldung, dort spricht die Karte.
- **Tipp vor der Namensgabe:** Solange die Frage „Wie soll sie heißen?“ offen ist, kommt kein Tipp, nur der Begrüßungssatz.
  - Nach „Später“ kommen Sätze ohne „ich“, wie bisher.
  - „Später“ gilt jetzt auch nach einem Neustart. Bisher kam die Frage bei jedem Start wieder, und mit der neuen Regel hätte sie damit jedes Mal alle Tipps blockiert. Der Knopf „Namen geben“ bleibt sichtbar.

## Geprüft
@@GEPRUEFT@@

## Offen
- **Keine Tipps, die erst durch eine neue Funktion sinnvoll würden.** Die App-Tipps ohne Ziel sind entweder schon mit `funktion` geparkt oder ohne eindeutige Stelle. Gebaut habe ich dafür nichts.
- **`app-030` („Alles hier ist exportierbar. Offene Formate …“):** Nach eurem Grundsatz behauptet er eine Funktion, die es nicht für „alles“ gibt. Vorschlag: `funktion: "export"` setzen oder genauer formulieren. Ich habe es nicht geändert.
- **`app-011` und `app-012` nennen Pakete, die im Katalog noch „geplant“ sind** (Wikipedia ohne Bilder) bzw. eine Kategorie „Wissen“, die in der Bibliothek so nicht heißt. Bitte gegenlesen.

## Vorrat
@@VORRAT@@
