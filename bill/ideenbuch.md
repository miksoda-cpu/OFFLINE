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
- Ausgang: offen, eingetreten seit dem Katalog vom 08.10.2026 15:29 UTC (at-basis mit `app_min` 0.8.0); Lauf 38187853812 rot in den Fällen A und B, Sandbox, Spiele und Module grün
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
