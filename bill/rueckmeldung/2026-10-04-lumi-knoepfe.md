# Rückmeldung: Lumi-Sätze führen irgendwohin – ausgeliefert mit 0.3.4

**Von:** Code (lokale Session) · **Datum:** 2026-10-04 · **Aufträge:** `bill/erledigt/2026-10-04-lumi-knoepfe.md` (Nr. 2026-10-04-01) und Nachtrag `bill/erledigt/2026-10-04-lumi-knoepfe-nachtrag.md` (01a) · **Branches:** `lumi-knoepfe`, `lumi-nachtrag` · **Tag:** `v0.3.4`

## Ergebnis
- **App 0.3.4 ist ausgeliefert** (`app/latest.json`, 04.10.2026, 12:22 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux sind abrufbar (HTTP 200).
- **Web-Version 0.3.4.** Die gespiegelte Kopie von `wir` stimmt mit dem Katalog überein.
- **Katalog** (erstellt 04.10.2026, 12:13 UTC, Signatur geprüft). Neu ist nur `wir`, die Tagespakete sind unverändert:

| Paket | Version | app_min | sha256 des Manifests |
|---|---|---|---|
| wir | 2026.10.04.1 | 0.2.0 | `568b9207b97c68d57760acd82a812c44a72b4878b385b97adaf8d051d6223ebd` |

  - Vor dem Nachtrag war schon `wir` 2026.10.04 oben, mit Zielen, aber noch dem alten `weisheit-002`. Die Ausgabe .1 ersetzt sie; Apps holen die neuere Version von selbst.
  - Ältere Apps übergehen `ziel` und `buch`.

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
- **Das Heft ist das Log mit dem Filter „gemerkt“, nach deinem Nachtrag.** „Merken“ setzt den Stern im bestehenden Log (`wesen-log`), es gibt keinen zweiten Speicher.
  - Steht ein Satz noch nicht im Log, kommt er hinein. Das betrifft die Textkarte des Tages, die bisher nicht ins Log ging.
  - Beim Kürzen des Logs auf 500 Einträge fällt Gemerktes nie heraus.
  - Im Verlauf gibt es zusätzlich den Filter „Gemerkt (Heft)“. Früher gesetzte Sterne stehen automatisch im Heft.
- **Ort des Hefts, meine Entscheidung:** eine eigene Seite „Was Lumi gesagt hat“ (`#heft`), erreichbar aus Übersicht › Lumi und über „Steht im Heft“.
  - Mit Datum (wann sie den Satz gesagt hat), ohne Netz durchsuchbar.
  - Jeder Satz lässt sich einzeln herausnehmen, das entfernt den Stern.
  - Den Verlauf habe ich in „Alles, was Lumi gesagt hat“ umbenannt, damit er nicht wie das Heft heißt.

## 2. Bewertung
- **Unter jedem Satz:** *Mehr davon · Passt · Nicht mehr*. Jede Bewertung schließt den Satz, auf der Tagesseite gilt die Karte dann als erledigt.
- **Das ✕ bleibt** und schließt ohne Bewertung. Auf der Tagesseite zählt das als „weggelegt“, so lernt die bestehende gelernte Schicht weiter.
- **Formel, meine Entscheidung:** Jede Sorte beginnt mit Gewicht 1.
  - „Mehr davon“ multipliziert mit 1,3, höchstens bis 3.
  - „Nicht mehr“ multipliziert mit 0,85, mindestens bis 0,4, und nimmt den Satz dauerhaft aus dem Pool.
  - **Keine Sorte fällt auf null** (Nachtrag; ein Test bewertet jede Sorte hundertmal mit „Nicht mehr“). Ganz abschalten geht nur in den Einstellungen.
  - Einen Grenzfall gibt es: Wer jeden einzelnen Satz einer Sorte mit „Nicht mehr“ bewertet, hört von ihr nichts mehr, obwohl ihr Gewicht bei 0,4 bleibt. Mit „Zurückholen“ ist das umkehrbar.
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
- **`buch`** wird angenommen und geprüft, die App verwendet es noch nicht. Bei Textkarten wird es auch später nie ausgewertet, das steht im Code (Nachtrag, Punkt 4).
- **`weisheit-002`** heißt jetzt so, wie Mik es formuliert hat: „Wir kennen unten keine Kriege. Nicht, weil wir besser sind. Wir haben aufgehört, haben zu wollen, was ein anderer hat.“

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
- **Tests:**
  - Web: 55 von 55. Neu getestet:
    - Knöpfe je Sorte.
    - Ziele: dieselbe Liste in App und Kit, jedes Ziel existiert in der App.
    - Bewertung mit Grenzen, keine Sorte auf null; Wirkung auf die Auswahl (Wissen nach sechsmal „Mehr davon“ deutlich öfter), Ausschluss, Zurückholen, Zurücksetzen.
    - Heft als Log mit Stern: kein zweiter Speicher, Gemerktes bleibt beim Kürzen.
    - Eine Stimme, kein Tipp vor dem Namen, „Später“ nach Neustart.
  - Werkzeug und Kit: 33 von 33, der Kit-Prüfer kennt `ziel` und `buch`.
- **CI (Lauf `37200698529`):** Die Tests laufen grün unter Linux, macOS und Windows (App-Berechtigungen), dazu Kern und Modul-Sandbox.
- **Windows-Probe (`37200698654`, Commit `8e5b8f8` = `v0.3.4`):** grün.
  - Update von 0.1.8 auf 0.3.4, „Was ist neu“ mit 0.3.4 oben, 42 von 42 Angriffen blockiert. Wichteln aus der lokalen Quelle geladen, gespielt, gesperrt und gelöscht.
  - **Ein Lauf davor (`37198971146`) war rot, wieder ein Wettlauf im Prüfaufbau, nicht in der App:** Die frisch aktualisierte App lädt im Hintergrund die Tagespakete. Solange sperrt der Kern weitere Vorgänge („Ein anderer Vorgang läuft“), und so scheiterten Einspielen und Löschen von Wichteln.
  - Jetzt wartet die Probe in diesem Fall und versucht es erneut, höchstens zwei Minuten, mit Grund im Bericht.
- **Release-Build `37201390554`:** alle vier Plattformen und das Veröffentlichen sind grün.
- **Im Browser bei 360 px** (lokal mit dem Code, danach live):
  - Textkarte mit „Merken“: danach „Steht im Heft“, und das Heft zeigt den Satz mit Datum.
  - „Mehr davon“ schließt die Karte, das Gewicht von Wissen steigt auf 1,3.
  - Meldung mit „Mach ich“: ergibt ein Vorhaben in Vorsorge. Abhaken lässt Bereit bei 12.
  - „Nicht mehr“: Der Satz erscheint unter „Was Lumi gelernt hat“ mit „Zurückholen“, die Balken stimmen.
  - Figur ohne Namen: nur Frage und Begrüßung, kein Tipp, keine Karte. Nach „Später“ kommen Sätze ohne „ich“ in der Sprechblase, mit Knöpfen von 44 px.
  - Live mit `wir` 2026.10.04.1: „Zeig mir“ bei `app-001` führt in den Tresor, bei `app-005` in die Übersicht mit aufgeklapptem Tagesplan.
  - Den Durchlauf in der Desktop-Test-App habe ich diesmal nicht gemacht; die Steuerung am Mac war schon bei 0.3.3 nicht verfügbar.

## Offen
- **Keine Tipps, die erst durch eine neue Funktion sinnvoll würden.** Die App-Tipps ohne Ziel sind entweder schon mit `funktion` geparkt oder ohne eindeutige Stelle. Gebaut habe ich dafür nichts.
- **`app-030` („Alles hier ist exportierbar. Offene Formate …“):** Nach eurem Grundsatz behauptet er eine Funktion, die es nicht für „alles“ gibt. Vorschlag: `funktion: "export"` setzen oder genauer formulieren. Ich habe es nicht geändert.
- **`app-011` und `app-012` nennen Pakete, die im Katalog noch „geplant“ sind** (Wikipedia ohne Bilder) bzw. eine Kategorie „Wissen“, die in der Bibliothek so nicht heißt. Bitte gegenlesen.

## Vorrat
Der Vorrat reicht bis **31. Jänner 2027**, 119 Tage ab heute (`werkzeug/vorrat-stand.mjs`). Die 45-Tage-Grenze wird am 17. Dezember erreicht, Februar kommt rechtzeitig vorher.
