# Pause – Happen für zwischendurch (Stufe 1, App 0.4.0)

Umsetzung des Auftrags `bill/erledigt/2026-10-04-pause-stufe1.md`. Quellen: `bill/eingang/2026-10-04-pause-quellen/` (Pause-Konzept, Übungskatalog Abschnitt 7, Trainingsmodell Abschnitte 4 und 8, Prinzip Milde Zugkraft, Lumisch-Wörterbuch).

## Was es ist

Wer Pause einschaltet, bekommt beim Öffnen der App einen **Happen** (30 Sekunden bis 3 Minuten): Einladung in einem Satz → eine Sache → Gelingen → ein Satz zum Mitnehmen → Ende. Unterhaltung zuerst; die App wirbt nirgends mit Gehirntraining. Aussagen zur Wirkung stehen nur in „Deine Linie“, mit den erlaubten Sätzen aus dem Trainingsmodell.

## Bausteine

| Teil | Datei | Was |
|---|---|---|
| Startwerte | `web/pause-werte.js` | alle Zahlen an einer Stelle (Mischung, Zone, Kennenlernen, Appetit, Rückfragen, Pilz, Log) |
| Logik | `web/pause.js` | Einstellungen, Spiel-Log, Linie, Zone, Dirigent, wann ein Happen fällig ist, Rückfragen, Auffrischung, Rückspiegel |
| Spiele | `web/pause-happen.js` | der Rahmen (Dialog) und die acht Formen |
| Einbau | `web/app.js` (Abschnitt „Pause“) | Happen beim Öffnen, Übersicht › Pause, Bibliothek, Seite „Deine Linie“ (`#linie`), Rückspiegel-Karte, Spiel-Log über die Brücke |
| Inhalte | Paket `pause` (`pakete/pause/`, `inhalt/pause.json`, Format `paket-kit/pause-format.mjs`) | Formen mit Selbstbeschreibung, 15 Geschichten, Lumisch in 21 Tagen, Texte |
| Tests | `web/pause.test.mjs` | Verhalten, Format, Brücke |

## Einschalten

Eine Funktion im Kern, die man wie ein Modul ein- und ausschaltet: **Übersicht › ⏸ Pause** (und als eingebaute Karte in **Bibliothek › Module**). Standard ist aus. Beim Einschalten fragt die App nach dem Lebensabschnitt (14–29, 30–49, 50–64, 65+). **Unter 14** bietet sie Pause nicht an, bis es den Kinder-Modus gibt. Danach lädt sie das Paket `pause`.

## Wann ein Happen kommt

- Beim Öffnen der App über der Tagesseite, höchstens einmal je Öffnen. Ein Öffnen innerhalb von 10 Minuten nach dem letzten zählt nicht.
- **Appetit** (wenig, mittel, viel) = Angebote je Tag: 1, 3 oder 6. „Noch einen?“ muss man selbst tippen und zählt nicht dazu. Kein weiteres Tageslimit.
- **Nie im Notfall-Bereich.** Nichts startet von allein außer dem einen Angebot beim Öffnen.
- Nach dem **Tagesschluss** (Uhrzeit aus dem Tagesplan) nur noch „Der Tag rückwärts“, einmal.
- „Nicht jetzt“ ist immer da, ohne Folgen; das Log merkt sich nur „abgebrochen“.

## Formen in 0.4.0

| Form | Trainingsart | Grundlage | Zone |
|---|---|---|---|
| Wo war der Pilz? | Tempo | Lumi-Welt, neun Felder; Blitzdauer je Stufe (800 ms bis 150 ms), außen erst ab Stufe 3 | 10 Stufen; Auffrischung nach 11 und 35 Monaten vorgemerkt |
| Der eingebaute Fehler | Kraft, Tempo | 15 Geschichten von unten, je ein Satz widerspricht der Geschichte selbst | 3 Stufen |
| Lumisch | Kraft, Beweglichkeit | ein Wort am Tag nach dem 21-Tage-Plan, dazu eine Abfrage mit 3 bis 4 Möglichkeiten | 3 Stufen |
| Was kommt als Nächstes? | Kraft | Roman der Woche: gestern das Ende zeigen, Vermutung (auch nur im Kopf), nach dem Lesen auflösen | – |
| Türsteherfrage | Kraft | das Tagesrätsel von gestern (mit Antwortfeld) oder der Autor des Romans | – |
| Der Tag rückwärts | Kraft | Abend: drei Fragen vom Abend zum Morgen, nichts wird gespeichert, der Rahmen wird dunkel | – |
| Zeitgefühl | Beweglichkeit | morgens: Uhrzeit schätzen; Toleranz 30, 20, 10 Minuten je Stufe | 3 Stufen |
| Atemfenster | Ausdauer | vier geführte Atemzüge (4 s ein, 6 s aus), Rahmen dunkler, bei „weniger Bewegung“ ohne Animation | – |

**Warten auf eine Funktion** (im Paket mit `bedingung.funktion`, nicht gebaut): Sonnengruß-Kette (`bilderfolge`), Wo liegt es? und Nachbar-Namen (`tresor-fragen`), Rezept nur einmal (`kochbuch`), Weg im Kopf (`karte-offline`), Frag jemanden (`tagebuch`). Das Tagesrätsel bleibt ein eigenes Paket und meldet sein Ergebnis ins Spiel-Log (`quelle: "raetsel"`). Wichteln meldet eine ausgeloste Runde über `offline.spiel.melden`.

## Der Dirigent (Regeln, ohne KI, ohne Netz)

1. Nur Formen, die verfügbar sind (Funktion da, Altersband, Tageszeit, was sie braucht) und nicht mit „Nicht mehr“ ausgeschlossen. Nie zweimal dieselbe hintereinander, wenn es anders geht.
2. Ist eine **Auffrischung** fällig (Pilz nach etwa 11 und 35 Monaten ab dem ersten Spiel), kommt sie.
3. **Kennenlernen** (die ersten 21 Tage): das am wenigsten Gespielte, viel Abwechslung.
4. Danach **Mischung**: rund 65 % Vertrautes (mindestens zweimal gespielt, gemocht), 25 % Verwandtes (gleiche Trainingsart), 10 % Neues; der Regler „Vertraut ↔ Neues“ verschiebt bis zu 15 Prozentpunkte.
5. Innerhalb der Gruppe nach Gewicht (Bewertungen), Tendenz des Lebensabschnitts (Faktor je Art oder Gruppe), **Wochenausgleich** (Arten, die diese Woche fehlen, ×1,5 – nur in Formen, die nicht abgelehnt sind) und den Antworten auf Rückfragen.
- **Zone 2:** liegt die Trefferquote der letzten drei Happen einer Form über 85 %, eine Stufe schwerer, unter 75 % leichter. „Zu leicht · Genau richtig · Zu schwer“ (höchstens bei jedem fünften Happen) stellt direkt.
- **Rückfragen:** höchstens eine am Tag im Kennenlernen, danach eine je Woche; drei Fragen (schneller/ruhiger, Wörter/Zahlen, Tageszeit), jede nur einmal, überspringbar.

## Deine Linie (`#linie`)

Erreichbar aus Übersicht › Pause. Zeigt in Balken, was gemocht wird, die ausgeschlossenen Formen (Zurückholen), die Stufe je Form mit „leichter“/„schwerer“, den Wochensatz („Ich achte darauf, dass …“), die vorgemerkten Auffrischungen, die Antworten, die Einstellungen (Alter, Appetit, Vertraut ↔ Neues), „So sehe ich dich“ nach dem Kennenlernen, die Info zur Wirkung (nur die erlaubten Sätze) und „Linie zurücksetzen“ / „Spiel-Log löschen“. Der **Rückspiegel** kommt höchstens einmal im Monat als ruhige Karte auf der Tagesseite, in Worten, ohne Punkte.

## Milde Zugkraft: die fünf Prüffragen je Form

| Form | Ende | Leben | Ruhige Stunde | Ohne Hebel | Sichtbar |
|---|---|---|---|---|---|
| Pilz | 3 bis 5 Runden, dann Satz und Ende | Mitnehmen; Tempo üben ohne Versprechen | ja: kurz, freiwillig | kein Falsch-Ton, „Schau, so war's“, keine Punkte | Stufe und Zone in „Deine Linie“ |
| Eingebauter Fehler | eine Geschichte | Lesen und Hinhören | ja | Auflösung freundlich, nie rot | Gewicht, Stufe |
| Lumisch | ein Wort am Tag, eine Frage | Aufgabe für draußen („sag zan, wenn …“) | ja | kein Verlust, wenn man aussetzt | Gewicht, Stufe |
| Was kommt als Nächstes? | eine Vermutung oder eine Auflösung | lädt zum Lesen ein | ja | kein Richtig/Falsch | Gewicht |
| Türsteherfrage | eine Frage | Abrufen statt Nachschauen | ja | „Weiß ich nicht mehr“ ist ein Knopf | Gewicht |
| Tag rückwärts | drei Fragen | ruhiger Abend, nichts gespeichert | ja | einziger Happen nach Schluss, einmal | Gewicht |
| Zeitgefühl | eine Schätzung | Gefühl für die Zeit (Bunker) | ja | Abweichung nur leise | Stufe |
| Atemfenster | vier Atemzüge | Ruhe | ja | keine Wertung | Gewicht |

Für alle gilt: keine Serien, kein Push, keine Ranglisten, keine Optimierung auf Nutzungszeit, Bewertungen privat, Spiel-Log nur am Gerät.

## Bedienbarkeit

Dialog mit `role="dialog"` und `aria-modal`, Fokus auf das erste Bedienelement, Escape = „Nicht jetzt“. Alle Knöpfe mindestens 44 px, bei 360 px kein seitliches Überlaufen. Texte sind Text (vorlesbar). Der Pilz ist ein Sehspiel; die Felder sind beschriftet („oben links“ …), das Blitzen selbst kann ein Bildschirmleser nicht ersetzen – wer nicht sieht, schließt die Form mit „Nicht mehr“ aus.

## Grenzen von Stufe 1

Kein KI-Planer, kein Netz (Stufe 2 nach Anwaltsfrage 34), kein Kopf-Fitnesstest, kein Gruppenmodus. Der Happen-Vorrat ist das Paket; ohne Paket kommt kein Happen. Die Zahlen in `web/pause-werte.js` sind Annahmen für die Testphase.
