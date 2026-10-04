# Auftrag: Pause, Stufe 1 (Happen am Gerät, ohne KI, ohne Netz)

- Nr.: 2026-10-04-02
- Priorität (von Mik): nach `2026-10-04-lumi-knoepfe` (0.3.4). Mik hat am 04.10. entschieden: erst Pause, dann Naturheilkunde, dann Gesundheit.
- Status: offen
- Quelle: Projektdokumente `OFFLINE-Modul-Pause-Konzept.md`, `OFFLINE-Gehirntraining-Uebungskatalog.md` (Abschnitt 7), `OFFLINE-Gehirn-Fitness-Trainingsmodell.md` (Zonen, Abschnitt 8), `OFFLINE-Prinzip-Milde-Zugkraft.md`. Bill legt sie dir in den Ordner OFFLINE - Home.

## Ziel
Wer Pause einschaltet, bekommt beim Öffnen der App einen kurzen „Happen“ (30 Sekunden bis 3 Minuten). Der Happen endet immer freundlich und lässt sich bewerten, und die App lernt daraus sichtbar, was als Nächstes kommt. Unterhaltung zuerst, das Training ist nur die Wirkung. Die App wirbt nirgends mit Gehirntraining.

## Grundsatzentscheidung (Mik, 04.10., Frage M2)
Pause ist eine **Funktion im Kern**, die der Nutzer wie ein Modul unter Einstellungen → Module ein- und ausschaltet, genau wie die Lumi. **Standard ist aus.** Die Sandbox-Regeln für Pakete der Art `modul` bleiben unverändert. Spiele, die als Sandbox-Modul laufen (Wichteln, später Schach), melden ihre Ergebnisse nur über die neue Brückenfunktion aus Punkt 4.

## Was genau

**1. Der Happen**
- **Ablauf:** Einladung in einem Satz → eine Sache, auf die man sich konzentriert → Gelingen → ein Satz zum Mitnehmen („Heute: drei von drei Pilzen“) → Ende.
- **Kein Falsch-Ton, keine rote Zahl.** Falsches führt zu „Schau, so war's“.
- **Jederzeit überspringbar**, ohne Folgen.
- **„Noch einen?“** muss man selbst tippen. Nichts startet von allein.
- **Wann:** Der Happen erscheint beim Öffnen der App über der Tagesseite, höchstens einmal je Öffnen. Ein Öffnen innerhalb von 10 Minuten nach dem letzten zählt nicht als neues.
- **Tagesschluss:** Den setzt der Nutzer wie bisher. Danach gibt es keine Happen mehr, höchstens „Der Tag rückwärts“.
- **Regler „Appetit“** (wenig, mittel, viel): bestimmt, wie oft am Tag ein Happen angeboten wird. Ein festes Tageslimit hat die Pause darüber hinaus nicht.

**2. Happen-Formen der ersten Version**
Ausgangspunkt sind die zwölf Übungen aus Abschnitt 7 des Katalogs. Baue nur die Formen, deren Grundlage es in der App schon gibt. Was eine fehlende Funktion braucht, bekommt die Bedingung `offen` wie bei den Tipps und wird nicht gebaut. Mindestens dabei sein sollen:
- **Wo war der Pilz?** Tempo, Schwierigkeit passt sich an. Die Auffrischung nach etwa 11 und 35 Monaten ist als Datum im Plan vorgemerkt.
- **Der eingebaute Fehler:** eine kurze Geschichte von unten, in der ein Satz nicht stimmt.
- **Lumisch:** ein Wort pro Tag. Das Wörterbuch liegt im Projekt (`OFFLINE-Lumisch-Woerterbuch.md`), Bill legt es in den Ordner.
- **Was kommt als Nächstes?** zum Roman der Woche.
- **Türsteherfrage** aus dem, was der Nutzer in der App gelesen hat (Roman, Tagesrätsel).
- **Der Tag rückwärts** als Abend-Happen.
- **Das Tagesrätsel** bleibt sein eigenes Paket, meldet sein Ergebnis aber in das Spiel-Log.

Die Inhalte der Formen (Geschichten, Fragen, Wörter) kommen als **Daten im neuen Paket `pause`** (Art `inhalt`), nicht als Code. Jede Form beschreibt sich selbst: Trainingsart, Dauer, Altersband, Zonen-Parameter.

**3. Dirigent (Regeln, ohne KI)**
- **Eingänge:** Alter (Lebensabschnitt Jung 14–29, Mittel 1 30–49, Mittel 2 50–64, Alt 65+), Spiel-Log (welche Form, wie oft, abgebrochen), Trefferquote, Bewertungen, Tageszeit.
- **Startmischung:** rund zwei Drittel Vertrautes, ein Viertel Verwandtes, ein Zehntel Überraschung. Ein Regler „Vertraut ↔ Neues“ verschiebt das.
- **Zone 2** als Ziel: 75 bis 85 Prozent Treffer. Alle Zahlen sind Startwerte und müssen in einer Datei leicht änderbar sein.
- **Ausgleich über die Woche:** Über die Woche sollen die Trainingsarten vorkommen, aber nur in Formen, die der Nutzer nicht abgelehnt hat.
- **Kennenlernphase** etwa 2 bis 3 Wochen mit viel Abwechslung. Höchstens eine Rückfrage pro Tag, kurz und überspringbar („Lieber schneller oder ruhiger?“). Danach höchstens eine pro Woche.
- **Unter 14** gilt der Kinder-Modus. Solange der nicht gebaut ist, bietet die App Pause unter 14 nicht an.

**4. Neue Brückenfunktionen für `window.offline`**
- `spiel.melden({ id, art, ergebnis, dauer })` schreibt in das Spiel-Log am Gerät.
- `spiel.liste()` gibt dem Modul die eigenen Einträge zurück, nie die anderer Module.
- Die Brücke prüft wie bisher Herkunft, Größe und erlaubte Werte. Dazu kommen neue Angriffstests (fremde id, übergroße Daten, zu viele Meldungen pro Minute). Die Sandbox-Probe muss danach mehr als 42 von 42 Angriffen blockieren.
- Wichteln meldet als Beispiel ein abgeschlossenes Spiel.
- Paket-Kit, `pruefen.mjs` und `docs/PAKET-KIT.md` beschreiben die beiden neuen Funktionen.

**5. Bewertung und „Deine Linie“**
- **Nach jedem Happen:** Mehr davon · Passt · Nicht mehr, wie bei den Lumi-Sätzen in 0.3.4. Bei jedem fünften Happen höchstens zusätzlich: Zu leicht · Genau richtig · Zu schwer.
- **„Nicht mehr“** nimmt die Form heraus, bis der Nutzer sie zurückholt.
- **Seite „Deine Linie“** in einfachen Balken: was gemocht wird, welche Zone, welche Formen ausgeschlossen sind. Jede Annahme ist dort änderbar und zurücksetzbar. Dort und nur dort steht auch eine kurze Info zur Wirkung, mit den erlaubten Sätzen aus Abschnitt 8 des Trainingsmodells, zum Beispiel: „Spiele werden besser durch Übung. Ob sich das auf den Alltag überträgt, ist offen.“
- **Rückspiegel** einmal im Monat als ruhige Karte in Worten („Vor drei Monaten …“), ohne Punkte.

**6. Was ausdrücklich nicht dabei ist**
- **Kein KI-Planer, kein Netz.** Das kommt erst in Stufe 2, nach Anwaltsfrage 34.
- **Keine Streaks, kein Push, keine Ranglisten**, keine Optimierung auf Nutzungszeit.
- **Kein Kopf-Fitnesstest** und kein Gruppenmodus. Beides kommt in einer späteren Stufe.

## Fertig, wenn
- Pause lässt sich unter Einstellungen → Module ein- und ausschalten und ist standardmäßig aus.
- Beim Öffnen erscheint ein Happen. Er lässt sich überspringen, bewerten und um „Noch einen?“ verlängern.
- Mindestens die sechs Formen aus Punkt 2 laufen, das Tagesrätsel meldet ins Log, und Wichteln meldet über `spiel.melden`.
- „Deine Linie“ zeigt, was gelernt wurde, und lässt alles zurücksetzen.
- Die Prüffragen der milden Zugkraft sind für jede Form erfüllt: Ende, Leben, ruhige Stunde, ohne Hebel, sichtbar. Schreib das kurz in die Rückmeldung.
- Bei 360 Pixel Breite bedienbar, Knöpfe mindestens 44 Pixel, alles vorlesbar.
- Alle Tests auf Linux, macOS und Windows plus die Windows-Probe mit den neuen Angriffstests sind grün. Dann gibst du selbst **0.4.0** frei, mit Eintrag in `web/neues.json`, CHANGELOG und Rückmeldung nach `bill/rueckmeldung/`.

## Hinweise
- **Darfst du selbst entscheiden:** Aufbau des Dirigenten, Dateiformat des Pakets `pause`, welche weiteren Formen aus den zwölf schon gehen, genaue Texte innerhalb der Vorgaben, wo „Deine Linie“ in der Navigation sitzt.
- **Frag vorher:** wenn eine Form Mikro, Kamera oder andere Sensoren bräuchte, wenn die Brücke mehr als die zwei neuen Funktionen bräuchte, oder wenn der Happen beim Öffnen etwas Wichtiges verdeckt (zum Beispiel im Notfall-Bereich). Im Notfall-Bereich erscheint nie ein Happen.
- Der Name „Pause“ ist entschieden. Schreib ihn in Menüs mit großem P und mit Symbol, damit er nicht mit einer gewöhnlichen Pause verwechselt wird.
