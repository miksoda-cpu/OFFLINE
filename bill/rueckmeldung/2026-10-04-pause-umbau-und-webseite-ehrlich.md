# Rückmeldung: Pause bekommt einen Raum, Startseite ehrlich – ausgeliefert mit 0.4.2

**Von:** Code (lokale Session) · **Datum:** 2026-10-04 · **Aufträge:** `bill/erledigt/2026-10-04-pause-umbau.md` (Nr. 2026-10-04-06), `bill/erledigt/2026-10-04-webseite-ehrlich.md` (Nr. 2026-10-04-09) · **Branch:** `pause-umbau` · **Tag:** `v0.4.2`

**Bildschirmfotos der Desktop-App am Mac:** Mik hat den Zugriff der Bildschirmsteuerung auf die Test-App „OFFLINE Fototest“ (Stand 0.4.1) abgelehnt. Ich habe nicht noch einmal gefragt. Es fehlen deshalb weiterhin die Mac-Bilder seit 0.3.3 (Antwortfeld, Lumi-Knöpfe, Heft, Vorhaben, Pause) und die Mac-Bilder dieses Auftrags. Stattdessen gibt es das Web bei 360 px und 1280 px. Die Oberfläche ist dieselbe Datei wie in der Desktop-App. Sobald Mik den Zugriff erlaubt, hole ich die Mac-Bilder nach.

## Ergebnis
- **App 0.4.2 ist ausgeliefert** (`app/latest.json`, 04.10.2026, 20:30 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux sind abrufbar (HTTP 200).
- **Web-Version 0.4.2 live** (geprüft): `APP_VERSION` 0.4.2, `happenFokus` ist da, auf der Startseite steht der Satz über den Karten, „lokale KI“ kommt nicht mehr vor.
- **Katalog unverändert:** Kein Paket hat sich geändert. Das Paket `pause` bleibt 2026.10.04.1 (`b61724f2…`), denn der Umbau steckt ganz in der App.

## 1. Pause bekommt einen Raum
- **Raum `#pause`:**
  - In der Seitenleiste direkt unter „Heute“.
  - Am Handy in der unteren Leiste statt „Bibliothek“; die Bibliothek liegt unter „Mehr“.
  - Die Leiste hat weiter fünf Plätze (Heute, Pause, Notfall, Vorsorge, Mehr). Sie wird also nicht voller, deshalb habe ich keine zwei Varianten gemacht.
- **Aufbau des Raums:**
  - Oben „Jetzt passt“ mit dem Vorschlag des Dirigenten und „Spielen“. Der Vorschlag bleibt stehen, bis sich etwas ändert, und springt nicht bei jedem Neuzeichnen.
  - Darunter „Alle Spiele“ als Liste mit Haarlinien. Jede gebaute Form steht da, mit Dauer („eine Minute“, „40 Sekunden“) oder Stand („Tag 1 von 21“). Jede ist frei wählbar.
  - Unten „Deine Linie“ und „Einstellungen“ (Alter, Appetit, Vertraut ↔ Neues, Pause ausschalten).
  - Wartende Formen erscheinen nicht.
- **Was gerade nicht geht,** steht grau mit Grund da und ist nicht tippbar. Meine Entscheidung, weil diese Formen sonst nicht funktionieren:
  - „Der Tag rückwärts“: „ab 18 Uhr“.
  - „Was kommt als Nächstes?“: „wenn du im Roman der Woche liest“.
  - Türsteherfrage: „nach einem Tag mit Rätsel“.
  - Das Zeitgefühl darf man selbst auch nachmittags wählen; vorgeschlagen wird es nur morgens.
- **Einschalten in einem Schritt:**
  - Zwei Sätze und fünf große Altersknöpfe.
  - Ein Tipp schaltet ein, lädt bei Bedarf das Paket und startet sofort den ersten Happen.
  - „Unter 14“ zeigt den Hinweis wie bisher.
  - Die Zeile unter Übersicht ist jetzt ein Link in den Raum, ebenso die Karte in Bibliothek › Module. Damit ist auch der Fehler weg, dass der Bereich nach der Altersauswahl zuklappte.
- **Kein Fenster mehr über Heute:**
  - Beim Öffnen steht oben auf Heute eine Karte auf Eisblau (zart statt dunkel, nach Punkt 8) mit Name, Dauer, „Spielen“, „Andere Pause“ (öffnet den Raum) und „später“.
  - Sie lässt sich zur Seite wischen.
  - Die Regeln sind dieselben: höchstens einmal je Öffnen, Appetit, 10 Minuten, nie im Notfall.
  - Die Karte von gestern verschwindet am nächsten Tag.
- **Happen als Fokus-Bildschirm** (Route `#happen`):
  - Füllt den Inhaltsbereich, am Handy den ganzen Schirm.
  - Oben ✕, drei feine Striche als Fortschritt und der Name der Form. Darunter die Einladung als Satz in leichter Serif, dann die Aufgabe. Unten genau ein Hauptknopf.
  - „Nicht jetzt“ gibt es nicht mehr.
  - ✕, Escape und „Zurück“ im Browser schließen; ein laufender Happen zählt dann als abgebrochen.
  - Danach geht es dorthin zurück, wo man herkam (Heute oder Raum).
  - Meine Entscheidungen: Die Lumi meldet sich im Happen nicht mit einer Sprechblase dazwischen. Beim Öffnen gibt es eine ruhige Einblendung von 0,22 Sekunden, bei „weniger Bewegung“ keine.
- **Ende:**
  - Der Satz zum Mitnehmen, „Mehr davon · Passt · Nicht mehr“ in einer Reihe.
  - Die Schwierigkeitsfrage bei jedem fünften Happen und die Rückfrage bleiben.
  - Dann „Noch einen“ (Hauptknopf) und „Zurück zu Heute“ bzw. „Zurück zur Pause“.
- **Uhrzeit:**
  - „Der Tag rückwärts“ kommt nie vor 18 Uhr, auch nicht nach einem früheren Tagesschluss. Bis 0.4.1 öffnete ein geschlossener Tag den Abend vorzeitig; das war vermutlich dein 14:30-Fall.
  - Das Atemfenster ist nie der erste Vorschlag des Tages; ein abgebrochener Happen zählt dabei nicht. Gibt es nur das Atemfenster, kommt es trotzdem.
  - Beides steht in `web/pause-werte.js` (`abendAb`, `nichtAlsErstes`).
- **Kurze Eingaben:**
  - „Der Tag rückwärts“ hat kein Textfeld mehr, nur „Ich hab's“, dazu „Nur im Kopf. Nichts wird aufgeschrieben.“
  - Antwortfelder (Lumisch-Wiederholung, Türsteherfrage) sind einzeilig.
  - Die Vermutung zum Roman ist auch einzeilig (bis 200 Zeichen), weil sie gespeichert und später gezeigt wird.
- **Zart (Punkt 8),** alle Werte als Variablen in `web/styles.css` (`--z-*`, `--eis*`, hell und dunkel):
  - Hauptknopf: helles Rot mit roter Schrift, 12,5 px, 500, 6 × 11, Rundung 6, ohne Rand, Schatten oder Leuchten.
  - Nebenwege: grauer Text mit Haarlinie.
  - Wahl- und Bewertungsfelder: 1 px Haarlinie, dunkle Schrift, keine Füllung.
  - Überschriften in einer leichten Serif.
  - ✕ als feine Linie (1,2 px).
  - Die Tippflächen sind trotzdem 44 px hoch: Die sichtbare Fläche ist kleiner als die tippbare.
  - Schrift, meine Entscheidung: OFFLINE lädt keine Schriften aus dem Netz. Die Serif ist deshalb die des Geräts (Iowan Old Style oder Charter am Mac, sonst Palatino oder Georgia), nicht die Fraunces aus dem Artefakt.
  - Gilt vorerst nur für Pause; die ganze App folgt mit 0.4.3.
- **Bilder** (Web bei 360 px, hell):
  - `bilder/2026-10-04-pause-umbau-1-heute-360.jpg`: Heute mit Karte
  - `bilder/2026-10-04-pause-umbau-2-raum-360.jpg`: Raum
  - `bilder/2026-10-04-pause-umbau-3-happen-360.jpg`: Happen in der Mitte, Der eingebaute Fehler
  - `bilder/2026-10-04-pause-umbau-4-ende-360.jpg`: Ende
  - `bilder/2026-10-04-pause-umbau-5-happen-breit.jpg`: Happen bei 1280 px, Ersatz für das Mac-Bild

**Fertig-wenn, geprüft im Browser:**
- **Von Heute zum Happen:** ein Tipp auf „Pause“, dann ein Tipp aufs Alter, und der Happen läuft. Ist Pause schon an, genügt ein Tipp auf „Spielen“.
- **Kein Fenster mehr** (`role="dialog"` kommt nicht vor), nur die Karte.
- **Wählbar:** alle sieben gebauten Formen; was nicht geht, mit Grund.
- **360 px:**
  - Bei 360 × 740 und 360 × 640 hat kein Happen einen seitlichen Bildlauf.
  - Der Hauptknopf ist bei allen Formen ohne Scrollen sichtbar: Pilz, Fehler, Lumisch, Türsteher, Tag rückwärts, Zeitgefühl. Das Atemfenster hat absichtlich keinen Knopf, es läuft geführt.

## 2. Startseite verspricht nur, was die App kann
Umgesetzt wie entschieden; die Preise sind unverändert:
1. **Startbild:** „Jeden Tag eine Seite mit Rätsel, Roman und Lumi, dazu Notfall, Vorsorge, ein Tresor für deine Unterlagen und Pause für zwischendurch – auf deinem PC oder Mac, ohne Internet. …“
   - Seitenbeschreibung und Vorschautext für Teilen ebenso: kein KI-Assistent, keine „lokale KI“, keine Wikipedia oder Karten mehr.
2. **Bibliothek:** „Wikivoyage auf Deutsch. Wikipedia und Wiktionary kommen.“
3. **Karten:** Text bleibt, Überschrift mit „kommt“.
4. **Österreich-Paket:** „… Behördenwege. Nach Bundesland“ mit „kommt“.
5. **Gratis-Karte:** „Wikivoyage, Österreich-Paket Grundversion“, darunter grau „Wikipedia und Karte kommen“.
6. **Pro-Karte:** „Österreich-Paket nach Bundesland“ und „RIS-Gesetzesauszug, wöchentlich“ mit „kommt“.
7. **Satz über den Karten** (fett): „Was mit ‚kommt‘ markiert ist, bauen wir gerade. Du zahlst für das, was es gibt.“

**Bei der Durchsicht der ganzen Seite zusätzlich markiert oder geändert:**
- **Abschnitt „Hol dir das Gratis-Paket“:** Die Liste sagte „Karte Österreich und Wikipedia auf Deutsch“. Jetzt steht dort „Wikivoyage auf Deutsch“ und darunter „Karte Österreich und Wikipedia auf Deutsch“ mit „kommt“.
- **Gemeinde-Karte:** „Zentral verwaltete Updates“ gibt es nicht und hat jetzt „kommt“.
- **Fußzeile:** „Wikipedia-Inhalte: CC BY-SA 4.0“ heißt jetzt „Wikivoyage- und Wikipedia-Inhalte: CC BY-SA 4.0“.

**Alle elf „kommt“ auf der Seite:**
- „Was drin ist“: Österreich-Paket nach Bundesland, Karten, KI-Assistent
- Gratis-Abschnitt: Karte Österreich und Wikipedia auf Deutsch
- Gratis-Karte: Schließfach 500 MB
- Pro: nach Bundesland, RIS, Schließfach 50 GB
- Pro+: Schließfach 500 GB, Kinder-Modus am Elternkonto
- Gemeinde: zentral verwaltete Updates

**Geprüft und gelassen:**
- „Installieren ohne Internet“ vom USB-Stick, Update-Abo mit WLAN und Zeitfenster, „nur, was sich geändert hat“, geprüft und signiert.
- Lumi mit Tipps, Blackout- und Krisenvorsorge, keine Telemetrie.
- „Eigene Inhalte der Gemeinde“: Das Paket-Kit gibt es, wir signieren die Pakete.
- „Ansprechperson und Schulung“ ist eine Leistung, keine App-Funktion.

**Bitte entscheiden, nicht geändert:**
- **„Für bis zu 5 Personen“ (Pro+):** Konten für mehrere Personen gibt es in der App noch nicht. Es ist aber eher eine Lizenzbedingung als eine Funktion.
- **Die Bezahlstufen insgesamt:** Eine Zahlung ist nicht eingebaut. Das Update-Abo, das Pro verspricht, haben heute alle.
- **Gratis-Abschnitt:** Der Satz „Melde dich … an. Du bekommst eine Mail …“ steht neben der Karte „Bald – Die Anmeldung öffnet in Kürze“. Er ist so als Zukunft erkennbar, aber nicht mit „kommt“ markiert.

**Test:** `web/neues.test.mjs` prüft jetzt die Startseite:
- Startbild und Seitenbeschreibung ohne KI, Wikipedia und Karte.
- Alle „kommt“ an den genannten Stellen und der Satz über den Karten.
- Die Preise sind unverändert.

**Bilder:**
- `bilder/2026-10-04-webseite-ehrlich-1-start-360.jpg`: Startbild, 360 px
- `bilder/2026-10-04-webseite-ehrlich-2-drin-360.jpg`: „Was drin ist“, 360 px, kein seitlicher Bildlauf
- `bilder/2026-10-04-webseite-ehrlich-3-preise-1280.jpg`: Preise mit Satz und „kommt“, 1280 px

## Dabei gefunden und behoben
- **Lumi-Test hing von der Uhrzeit ab:** Der Test „Eine Stimme und kein Tipp vor dem Namen“ schlug ab 22 Uhr Ortszeit fehl, weil die Lumi dann schläft. Er hält die Nachtruhe jetzt fest.
- **Windows-Probe:** prüft jetzt in der echten App, dass der Raum „Pause“ erreichbar ist, in der Navigation an zweiter Stelle steht und kein Fenster zeigt.

## Geprüft
- **Tests:**
  - Web: 73 von 73. Neu sind Uhrzeit (Tag rückwärts, Atemfenster), Raum (alle gebauten Formen, Gründe, Dauer in Worten) und Startseite.
  - Werkzeug und Kit: 33 von 33.
- **CI (Lauf `37230915548`):** Die Tests laufen grün unter Linux, macOS und Windows, dazu Kern und Modul-Sandbox.
- **Windows-Probe (`37230915922`, Commit `6f5bfd1` = `v0.4.2`):** grün beim ersten Lauf.
  - 48 von 48 Angriffe blockiert.
  - „Raum Pause – Navigation start,pause, 5 Altersknöpfe“.
- **Release-Build `37231768255`:** alle vier Plattformen und das Veröffentlichen sind grün.
- **Im Browser (Web bei 360 × 740, 360 × 640 und 1280):**
  - Einschalten mit einem Tipp, und der Happen startet.
  - ✕ führt zurück in den Raum und zählt im Spiel-Log als „abgebrochen“.
  - Die Karte entsteht beim Öffnen und nicht als Fenster. „später“ und Wischen nehmen sie weg; „Spielen“ öffnet den Happen und ✕ führt zurück zu Heute.
  - Alle Formen ohne seitlichen Bildlauf, der Hauptknopf ist sichtbar.

## Vorrat
Der Vorrat reicht bis 31. Jänner 2027, 119 Tage ab heute. Die 45-Tage-Grenze wird am 17. Dezember erreicht.
