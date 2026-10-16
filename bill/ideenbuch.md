# Ideenbuch

Jeder Ansatz mit Kill-Kriterium und Ausgang, die verworfenen zuerst. Code liest dieses Buch vor jedem Auftrag, Bill vor jedem neuen Auftrag. Ein verworfener Ansatz kommt nur zurück, wenn sich seine Voraussetzung geändert hat; dann wird die Änderung hier eingetragen.

Nur Ansätze, keine unveröffentlichten Inhalte (Regel Nr. 13, `docs/INTERN.md`). Festlegung vom 10.10.2026, siehe `bill/README.md`.

## Lehren

Wird bei jeder Faltung neu geschrieben, höchstens zwanzig Zeilen. Nur dieser Block gehört zur Startlektüre; die Einträge darunter werden gezielt aufgeschlagen, wenn ein Ansatz wiederkommt. Stand: Faltung 12.10.2026.

- Jede Arbeit auf eigenem Branch, zusammenführen erst nach grüner Prüferkette (seit 0.2.1, Festlegung 30.09.).
- Fremde Programmteile gehören in die App, nicht ins Netz. Vor jedem Store-Build die Verbindungen gegen die Datenschutz-Angaben prüfen (seit 0.7.2).
- Große Downloads: Fortschritt je 64-MB-Teil ist offen, nicht gelöst (Auftrag Nr. 19).

## Vorlage

```markdown
### JJJJ-MM-TT · Auftrag <Nr. oder Datei> · <Ansatz in wenigen Worten>
- Idee: …
- Kill-Kriterium: woran man erkennt, dass es nicht trägt
- Ausgang: übernommen | verworfen | offen, mit Grund
- Lehre: was der nächste Versuch anders macht
```

## Einträge

### 2026-10-16 · Auftrag Nr. 37 · Unveröffentlichter Klartext nur über die .gitignore des eigenen Branches geschützt
- Idee: Die Klartext-Datei der Akku-Karten (Nr. 36) liegt lokal neben der verschlüsselten Fassung; die Zeile im Block „Klartext-Wache“ steht nur auf dem Branch des Auftrags
- Kill-Kriterium: Auf einem anderen Branch nimmt `git add -A` die Datei mit, und die Wache sieht sie nicht, weil dort die Zeile fehlt
- Ausgang: verworfen, eingetreten mit `0759dc6` (Nr. 37), auf dem Hauptbranch und öffentlich; entfernt mit `827d76e`, die Historie bleibt (Entscheidung bei Mik)
- Lehre: Neue Klartext-Pfade sofort auch in `.git/info/exclude` eintragen (gilt für alle Branches) und die `.gitignore`-Zeile zuerst auf den Hauptbranch bringen. Vor jedem Commit `git status` lesen statt blind `git add -A`. Seit 16.10. schützt die Wache den Klartext zu jeder verschlüsselten Datei auch dann, wenn diese nur auf einem noch nicht zusammengeführten Branch oder nur auf der Platte liegt (Test mit genau diesem Fall)

### 2026-10-15 · Release 0.9.0 · Referenzbilder erst nach dem Katalog- oder Web-Lauf neu setzen
- Idee: Ein Auftrag, der den Katalog oder `web.yml` ändert, wird zusammengeführt und veröffentlicht; die Referenzbilder bleiben, wie sie sind
- Kill-Kriterium: Der Bildvergleich ist auf dem Hauptbranch rot, obwohl jede Änderung gewollt ist
- Ausgang: verworfen, eingetreten mit 0.9.0: Nach `web.yml` lud die Web-Version die Naturheilkunde von selbst, 16 Bilder wichen ab
- Lehre: Ändert ein Auftrag den Katalog oder `web.yml`, werden die Referenzbilder im selben Schritt neu gesetzt

### 2026-10-15 · Auftrag Nr. 29 · Ergänzte Fassung außerhalb des Auftragsordners
- Idee: Bill legt eine ergänzte Fassung eines Auftrags an einen anderen Ort als „OFFLINE - Home/auftraege/“
- Kill-Kriterium: Code baut eine ältere Fassung, weil die neue nie ankam
- Ausgang: verworfen, eingetreten bei Nr. 29: Schritte 4 und 5 der Seite „Haben andere auch kein Netz?“ fehlten bis zur Nachbesserung
- Lehre: Code baut nur, was im Auftragsordner oder im Postfach steht. Bill legt Ergänzungen immer dort ab

### 2026-10-15 · Auftrag Nr. 30 · Gerätespeicher setzen und sofort neu laden (Browser-Test)
- Idee: Ein Test schreibt einen Wert in den Gerätespeicher der alten Seite und lädt gleich danach neu
- Kill-Kriterium: Der Wert kommt in der neuen Seite nicht an, der Test wackelt in der CI
- Ausgang: verworfen, eingetreten in Lauf 38782989487 (vorher zweimal grün)
- Lehre: Werte für die neue Seite setzt der Test im neuen Dokument selbst, bevor die App startet (`Page.addScriptToEvaluateOnNewDocument` mit Bedingung auf die Adresse)

### 2026-10-15 · Auftrag Nr. 30 · Neuer Knopf in der Kopfzeile in voller Tippgröße
- Idee: Die Lupe als 44-px-Knopf in die Kopfzeile setzen
- Kill-Kriterium: Die Kopfzeile wird höher und alle Seiten verrutschen im Bildvergleich
- Ausgang: verworfen, die Kopfzeile wurde bei 360 px 57 px höher; jetzt sitzt der Knopf mit negativem Rand, die Tippfläche bleibt 44 px
- Lehre: Neue Knöpfe in festen Leisten mit negativem Rand einsetzen und vor dem Bildvergleich die Höhe der Leiste messen

### 2026-10-14 · Auftrag Nr. 24 · Lumi nur angekündigt, nicht ladbar (Mik)
- Idee: Für den Start im App Store steht die Lumi nur als „Das Lumi-Update“ unter „Bald“; die Lumi-Pakete werden weder per Knopf noch still geladen, wer sie hat, behält sie
- Kill-Kriterium: Eine Seite der App setzt ein Lumi-Paket voraus und zeigt ohne es einen Fehler oder eine leere Seite
- Ausgang: übernommen für die Pakete (Rundgang: Lumi, Buch, Gedanken ohne Paket gehen auf, ohne Fehler). Offen: Miks Ziel geht weiter, die Grundversion soll die Lumi nur anteasern (Figur, Lumi-Seite, Lumi-Tipps). Umgesetzt mit Nr. 27 (Mik, 14.10.): ohne Namen keine Figur, Seite, Einladung, Tipps
- Lehre: Ankündigungen leben in der App (`web/bald.js`), nicht im Katalog; so gilt es sofort, ohne neu signierten Katalog, und alte Apps bleiben unberührt

### 2026-10-14 · Auftrag Nr. 23 · Vorschau lesbar durch festen Ausschnitt
- Idee: Im Vorschau-Fenster statt des ganzen Bildschirmfotos nur einen Ausschnitt in Lesegröße zeigen
- Kill-Kriterium: Ein Ausschnitt verliert bei einem der vorhandenen Bildformate den Teil, um den es geht
- Ausgang: verworfen vor dem Bauen. Die Vorschauen sind hoch (Pause 450 × 1000, Wichteln 390 × 780) und breit (Spielpaket, Lumisch 800 × 600); ein fester Ausschnitt hätte je nach Format oben, unten oder seitlich abgeschnitten. Übernommen: Antippen zeigt das Bild in voller Größe zum Verschieben
- Lehre: Eine Lösung für „zu klein“ lässt den Menschen wählen, welchen Teil er lesen will

### 2026-10-14 · Auftrag Nr. 23 · Großes Vorschaubild im zentrierenden Rahmen
- Idee: In voller Größe bleibt das Bild im vorhandenen Rahmen (`display: grid; place-items: center`), nur mit `display: block` und `overflow: auto` darüber
- Kill-Kriterium: Ein Teil des Bildes ist nicht erreichbar
- Ausgang: verworfen nach der ersten lokalen Aufnahme. Chromium zentriert mit `place-items` auch im Block-Layout; das breite Bild ragte links 65 px aus dem Rahmen, dorthin lässt sich nicht scrollen. Übernommen: `place-items: normal` im großen Zustand, der Test in `web/anker.test.mjs` hält es fest
- Lehre: Eine Aufnahme des neuen Zustands vor dem Push fand den Fehler, den die Textprüfung übersah

### 2026-10-13 · Auftrag Nr. 25 · Eingefrorener Katalog für die alte App im Update-Test
- Idee: 0.1.8 läuft gegen einen festen, schon veröffentlichten signierten Stand (Web-Katalog 08.10. 03:39 UTC mit at-basis und wir), lokal ausgeliefert; die Pakete werden wie vom Stick eingespielt, weil die Adresse im Katalog die alten Ausgaben nicht mehr liefert
- Kill-Kriterium: Der Kern von 0.1.8 lehnt den Stand ab (Signatur, Schlüssel) oder ein bisheriger Vergleich muss dafür fallen
- Ausgang: übernommen. Erster Lauf rot, weil der Windows-Checkout CRLF setzte; `.gitattributes` behebt das. Danach grün in allen Fällen
- Lehre: Was signiert im Repo liegt, braucht `-text` in `.gitattributes`, sonst stimmt die Signatur nur auf dem Mac

### 2026-10-13 · Auftrag Nr. 25 · Offenes Blatt schließt sich beim Neuzeichnen aus dem Hintergrund
- Idee: In der App lässt ein Neuzeichnen, das nicht vom Menschen kommt (Abo-Stand aus dem Kern, Pakete im Hintergrund), ein offenes Blatt stehen
- Kill-Kriterium: Das Blatt zeigt danach veraltete Angaben
- Ausgang: offen, Befund aus der Windows-Probe (Läufe 38384951349, 38388627760). Die Probe wartet bis dahin, bis die Seite ruhig ist; die App ist nicht geändert (Nr. 25 verbietet es)
- Lehre: Ein Prüfer, der „zufällig“ rot wird, zeigt oft einen echten Fehler in der App

### 2026-10-13 · Auftrag Nr. 21 · Referenzbilder lokal aufnehmen
- Idee: Die Referenzbilder des Bildvergleichs im Arbeitsrechner aufnehmen (Chromium 141) und ins Repo legen
- Kill-Kriterium: Die Aufnahme in der CI weicht ohne Änderung an der App ab
- Ausgang: verworfen vor dem ersten Push. Die Web-App nutzt Systemschriften; lokal war die Tageskarte bei 360 px 44 px zu breit, in der CI (Chrome 154, Ubuntu) nicht. Übernommen: Referenz aus dem Artefakt eines CI-Laufs ohne Referenz; der zweite Lauf auf einem anderen Runner wich um kein Pixel ab
- Lehre: Bilder, die als Prüfer dienen, entstehen dort, wo geprüft wird

### 2026-10-13 · Auftrag Nr. 21 · Wegwerf-Branches nach der Gegenprobe löschen
- Idee: Die Branches der Gegenproben nach dem Lauf per `git push --delete` entfernen
- Kill-Kriterium: Der Push wird abgelehnt
- Ausgang: gescheitert, HTTP 403 aus der Umgebung des Nachtlaufs; die Branches bleiben auf GitHub

### 2026-10-12 · Auftrag Nr. 22 · Update-Test der Windows-Probe gegen den öffentlichen Katalog
- Idee: Die Windows-Probe installiert die alte App 0.1.8, lässt sie das Österreich-Paket aus dem öffentlichen Katalog laden und vergleicht danach mit der neuen App
- Kill-Kriterium: Die alte App kann das Paket aus dem öffentlichen Katalog nicht mehr laden
- Ausgang: verworfen am 13.10.2026, eingetreten seit dem Katalog vom 08.10.2026 15:29 UTC (at-basis mit `app_min` 0.8.0); Lauf 38187853812 rot in den Fällen A und B. Ersetzt durch den eingefrorenen Katalog (Nr. 25)
- Lehre: Der Update-Test hängt an einem Katalog, der sich ohne Änderung im Repo ändert

### 2026-10-08 · Auftrag Nr. 19 · Fortschritt bei großen Downloads je 64-MB-Teil
- Idee: Fortschritt und Abbruch je 64-MB-Teil eines Pakets
- Kill-Kriterium: Der Balken steht bei langsamer Leitung länger still, als ein Mensch ohne Sorge wartet
- Ausgang: offen, gefunden bei Startreife Teil 1, Vorschlag für 0.7.3
- Lehre: noch keine

### 2026-10-08 · Release 0.7.2 · Kartenprogramm (Leaflet) von cdnjs laden
- Idee: Leaflet bei jedem Start der Online-Karte von cdnjs (Cloudflare) holen
- Kill-Kriterium: jede Verbindung, die nicht Paket-Speicher oder Kartenkacheln ist
- Ausgang: verworfen, Leaflet liegt seit 0.7.2 in der App
- Lehre: Fremde Programmteile gehören in die App, nicht ins Netz. Vor jedem Store-Build die Verbindungen gegen die Datenschutz-Angaben prüfen

### 2026-09-30 · Release 0.2.1 · Direkt auf den Hauptbranch pushen
- Idee: Änderungen direkt auf `claude/optimistic-hypatia-yymcne` pushen
- Kill-Kriterium: etwas Ungeprüftes wird ausgeliefert
- Ausgang: verworfen, Vercel lieferte jeden Push sofort aus, und Pushes aus einem Workflow lösten keine Tests aus
- Lehre: eigener Branch je Auftrag, zusammenführen erst nach grüner Prüferkette (Festlegung 30.09.2026)
