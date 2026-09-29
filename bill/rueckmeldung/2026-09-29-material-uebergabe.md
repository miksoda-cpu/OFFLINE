# Rückmeldung: Übergabe „Bill an Code“ (ZIP vom 29.09.)

**Von:** Code · **Datum:** 2026-09-29 · **Auftrag:** `LIES-MICH.md` der Übergabe

## Ergebnis
- Punkt 1 (Pflichtenheft, README, STATUS) war schon erledigt, siehe Rückmeldung `2026-09-29-paket-kit-pflichtenheft.md`.
- Das Material liegt **unverändert** unter `bill/eingang/2026-09-29-bill/material/`: Paket-Kit (`pruefen.mjs`, Vorlage, Pflichtenheft, Beispiel Wichteln mit Prüfbericht) und das Paket „wir“ mit 180 Tipps samt `tipps_bauen.py`. Nichts davon ist gebaut, eingebunden oder in `pakete/` bzw. `paket-kit/` übernommen. Das wartet auf Miks Priorität.

## Tipps gezählt
| | Tipps |
|---|---|
| Repo, Paket `wir` 2026.09.29 | 53 |
| Material, `tipps.json` Version 0.2.0 | 180 |

Sorten im Material: Alltag 39, App 33, Wissen 32, Weisheit 30, Digital 30, Laune 16. Keine doppelten IDs.

## Hinweise für den Einbau der 180 Tipps (Aufwand: klein, aber nötig)
Das Format weicht von dem ab, was die App heute liest (`docs/WESEN.md`, Abschnitt B, und `pakete/wir/inhalt/tipps.json` im Repo):
1. **Sorten** sind im Material großgeschrieben (`Alltag`), die App erwartet Kleinbuchstaben (`alltag`). Einfache Umschreibung.
2. **Bedingungen** sind im Material Ausdrücke als Text (`einstellung.digital`, `monat>=6&monat<=8`, `profil.insulin`, `wochentag=sa&stunde=11`, `wasser_alter_monate>12`). Die App liest Bedingungen als Objekt mit festem Wortschatz (`ansicht`, `einstellung`, `monat`, `score_unter`, `score_ab`, `verfallen`, `benannt`). Zwei Wege: (a) die 45 Bedingungen beim Bau ins Objektformat übersetzen, dabei fallen Bedingungen weg, die die App nicht kennt (`profil.*`, `wochentag`, `stunde`, `tag`, `kalender.*`, `wasser_alter_monate`); oder (b) der Wortschatz der App wird erweitert, das ist ein kleines App-Update und passt zur Regel „Wortschatz vorausschauend breit“. Ich empfehle (b) für `wochentag`, `stunde`, `tag` und die Verfallsalter je Bestätigung, und (a) für `profil.*`, weil es das Profil in der App noch nicht gibt.
3. **Sorte `heute`** (Kalender, saisonal) gibt es im Material nicht, dafür `Digital` als optionale Sorte. Passt zur App.
4. **Sieben Texte** sind länger als 160 Zeichen (Blase scrollt dann). Kein Fehler, nur Hinweis.
5. Inhaltlich fiel mir eine Stelle auf: `app-001` sagt „Tresor hinter dem Schloss oben rechts“, in der App ist er links in der Seitenleiste. Bitte beim Redigat prüfen.

## Nicht gemacht
- Kein Bau, kein Einbau, keine Modul-Sandbox, kein `window.offline`. Die Sicherheitsbedingungen für Module aus der Rückmeldung `2026-09-29-paket-kit-pflichtenheft.md` bleiben offen, Entscheidung bei Mik.

## Geprüft
- ZIP entpackt, 21 Dateien, Struktur wie in `LIES-MICH.md` beschrieben. `PRUEFBERICHT.md` des Beispiels meldet keine Fehler.
