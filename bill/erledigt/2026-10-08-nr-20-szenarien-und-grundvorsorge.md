# Auftrag Nr. 20 – Zwölf Szenarien, Grundvorsorge, Radio

**Von:** Bill · **Datum:** 08.10.2026 · **Version:** 0.8.0 · MVP-Fokus Punkt 1 (Inhalts-Gleichstand)

## Inhalte (fertig, liegen in `szenarien/`)
- 12 Szenario-Karten als JSON: hochwasser, starkregen, wildbach, hitze, hagel, schnee-eis, lawine, erdbeben, waldbrand, kernkraftwerk, krankheiten, blackout (ersetzt `blackout.json` in `at-basis`)
- `grundvorsorge.json`: sechs Bereiche (wasser-essen, licht-strom-info, gesundheit-hygiene, dokumente-geld, notfallplan, notfall-rucksack), 74 Punkte, je Punkt `fuer` (alle, kinder, aeltere, pflege, behinderung, tiere, haus, miete, keller). Alle 20 bisherigen Punkte sind enthalten; ersetzt `vorsorge.json`, bestehende Häkchen müssen erhalten bleiben (Abgleich über den Text).
- `radio.json`: Ö3, Ö1 und Regionalradio je Bundesland
- Format der Karten: siehe Abschnitt 5 in der Lückenliste (Projekt, Lückenliste). Jede .md daneben ist nur zum Lesen.

## Einbau
1. Alles ins Paket `at-basis` (Länder-Paket), neue Ausgabe. Kein Text in den Code.
2. **Notfall** und **Vorsorge** zeigen die zwölf Szenarien als Kacheln. Je Karte fünf aufklappbare Teile: Gefahren verstehen · Jetzt vorsorgen · Richtig reagieren · Danach · Informiert bleiben; dazu Merksätze, „Für dich zusätzlich“ (nur die Zusätze, die zum Haushalt passen), szenariospezifische Checkliste, Quellen ganz unten klein.
3. **Haushalt und Wohnsituation** einmal einstellen (Vorsorge, oben): Kinder, Ältere, Pflege, Behinderung, Tiere; Haus, Miete, Keller. Nur lokal gespeichert. Filtert Grundvorsorge und Zusätze. Ohne Angabe: alles zeigen.
4. **Grundvorsorge** in den sechs Bereichen statt der einen Liste, mit Fortschritt je Bereich und je Szenario, Lesezeichen (Merkliste), „Liste exportieren“ (Text oder Druck) und „zurücksetzen“ (zwei Schritte). Bereit rechnet mit der neuen Liste weiter.
5. **Radio:** Auf Notfall „Wie du informiert bleibst“ mit den Frequenzen des eingestellten Bundeslands.
6. **Sirenen zum Anhören:** die drei Signale und die Probe als kurze Tondateien im Paket (selbst erzeugt, kein Download).
7. **Verweise** in den Karten: `blackout`, `hochwasser`, `starkregen`, `wildbach` → Karten; `notfall-rucksack`, `grundvorsorge`, `vorrat` → Grundvorsorge; `hausapotheke` → Bereich gesundheit-hygiene; `radio` → Radio; `notrufe` → Notrufe.
8. Notfallseiten bleiben im Grundaussehen, ohne Skin.

## Regeln
- Inhalte nicht umschreiben. Was nicht passt, als Rückfrage an Bill.
- Der Name der staatlichen Zivilschutz-App kommt nirgends vor (Test: Suche über alle Texte).
- Abkürzungen beim ersten Vorkommen ausgeschrieben (bestehende Regel).

## Nicht in diesem Auftrag
Notfallplan ohne Tresor, bis zu fünf Orte, Wetterwarnungen – folgen getrennt.

## Release
Tests, Windows-Probe, Rundgang nach `rundgang/0.8.0/`, dazu je eine Szenario-Karte hell/dunkel/360 px und die Vorsorge mit Haushalt-Filter.
