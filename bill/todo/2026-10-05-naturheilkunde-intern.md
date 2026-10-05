# Auftrag: Naturheilkunde Stufe 1, nur intern

- Nr.: 2026-10-05-08
- Priorität (Mik, 05.10.): als Nächstes, als 0.6.0. Großer Auftrag, gern in Schritten mit Zwischenmeldung.
- Beilagen im Ordner `naturheilkunde/`: Konzept, Inhalt Teil 0 bis 10, Korrekturliste der Inhalts-Session. **Diese Fassungen gelten.**
- Entscheidung Mik und Bill: Die Technik wird jetzt gebaut. Die Inhalte bleiben **intern**, bis eine Apothekerin oder ein Apotheker geprüft hat. Kein öffentlicher Katalog, keine Web-Kopie, kein „Was ist neu“ für Nutzer.

## Ziel

Ein Nachschlagewerk „Naturheilkunde“: offen, ohne Passwort, ohne Daten über den Nutzer. Mik kann es in seiner Version lesen und durchsuchen. Für alle anderen ist es unsichtbar.

## 1. Paket `naturheilkunde` (Art `inhalt`)

- Ein Umwandler (wie `tipps-umwandeln.mjs`) baut aus den Beilagen strukturierte Daten. Kein Text wird umgeschrieben.
- **Einträge** (Pflanzen, Pilze, Warnkarten, Drogen, Überlieferungen) mit diesen Feldern, soweit die Quelle sie hat:
  - `id`, `name`, `wiss_name`, `teil`, `abschnitt`
  - `ort`: `handbuch` oder `suche_und_karte`, so wie die Zeile „Ort“ im Eintrag steht
  - `belegbarkeit`: `belegt`, `traditionell`, `ueberliefert_nicht_geprueft`, `unklar`, `warnung`
  - `pruefstatus`: heute überall `in_pruefung`
  - `warnung` (Text), `verwechslung`, `quellen[]`, `text` (Markdown des Eintrags)
- **Kapitel** für alles, was kein Eintrag ist (Lehre der Tradition, Fehler alter Bücher, Naturschutz, Sammelregeln …), als Lesetext.
- **Teil 6, Wechselwirkungen:** Zeilen mit dem Block „Sperre“ bekommen `gesperrt: true`. Sie stehen nur im Handbuch.
- Was der Umwandler nicht sicher zuordnen kann, kommt in einen Bericht `unzugeordnet.md`, nicht geraten in ein Feld. Den Bericht bekomme ich mit der Rückmeldung.
- Der Text bleibt Markdown. Tabellen und Listen müssen in der App lesbar sein.

## 2. Oberfläche (Kern-Funktion)

- **Oben auf jeder Seite des Bereichs, immer:** die einheitliche **Erste-Hilfe-Karte** aus Teil 1 (VIZ 01 406 43 43, 144, kein Erbrechen, Trinken nur nach Anweisung der VIZ). Ein Tipp auf die Nummer ruft an, wo das Gerät das kann.
- **Darunter ein ruhiger Streifen:** „In Prüfung. Noch nicht fachlich geprüft. Nicht zur Anwendung.“
- **Drei Wege hinein:**
  1. **Beschwerde-Suche** (Husten, Magen, Schlaf, kleine Wunden, Halsweh, Durchfall … aus Teil 0). Mitbeschwerden sind antippbar und verfeinern die Suche.
  2. **„Ich finde …“**: Suche nach Aussehen (Wuchsform, Blatt, Blüte, Frucht, Geruch, Farbe). **Giftige Doppelgänger stehen immer zuerst.** Kein Foto, keine Bestimmung per Kamera.
  3. **Anwendung:** Tee, äußerlich, kauen.
- **Regel für Suche und Karten:** Als **Mittel** erscheint nur, was `ort = suche_und_karte` **und** `pruefstatus = fachlich_geprueft` hat. Das ist heute nichts. Die Suche zeigt deshalb ehrlich: „Dazu ist noch nichts fachlich geprüft.“ und darunter die passenden **Warnkarten** und den Link ins Handbuch.
- **Psychoaktives, Abtreibendes, Giftiges** erscheint in Suche und Karten nie als Mittel, nur als Warnung. Das gilt auch nach der Prüfung, die Regel steht im Code, nicht nur in den Daten.
- **Handbuch:** alle Teile 0 bis 10 als Lesekapitel mit Inhaltsverzeichnis und Volltextsuche ohne Netz. Jeder Eintrag zeigt Belegbarkeit, Ort und Prüfstatus als kleine Plakette.
- **Vorlesen** wie beim Lumi-Buch.
- Zarter Stil wie im Rest der App, „Info und Hilfe“ als letzte Zeile (Texte schreibe ich nach deinen Bildern).

## 3. Nur intern sichtbar

- Das Paket kommt **nicht** in den öffentlichen Katalog und nicht in die Web-Version.
- Mik braucht es in seiner Desktop-App und am iPad. **Frag vorher:** Schlag mir zwei Wege vor (zum Beispiel ein interner Katalog-Kanal, der nur mit einem Schlüssel auf Miks Geräten sichtbar ist, oder Einspielen per Datei). Bedingung: Kein anderer Nutzer sieht den Bereich, auch nicht leer, auch nicht im Menü.
- Der Bereich ist im Menü nur da, wenn das Paket installiert ist.

## 4. Tests

- Der Umwandler liest alle Teile ohne Absturz. Die Zahl der Einträge je Teil steht im Bericht.
- Kein Eintrag mit `pruefstatus ≠ fachlich_geprueft` erscheint in der Suche als Mittel.
- Kein Eintrag mit der Markierung psychoaktiv, abtreibend oder giftig erscheint je als Mittel, auch nicht mit einem gefälschten Prüfstatus.
- Gesperrte Zeilen aus Teil 6 erscheinen nirgends außer im Handbuch.
- Die Erste-Hilfe-Karte steht auf jeder Seite des Bereichs.
- Das Paket ist im öffentlichen Katalog und in `web/pakete/` nicht vorhanden.

## Fertig, wenn
- Mik kann die Naturheilkunde in seiner Desktop-App und am iPad öffnen, lesen und durchsuchen.
- Bilder bei 360 Pixel: Startseite des Bereichs, Beschwerde-Suche „Husten“, „Ich finde …“ mit Doppelgänger oben, ein Eintrag im Handbuch.
- Rückmeldung mit `unzugeordnet.md` und der Zahl der Einträge je Teil.
- Alle Tests auf drei Systemen und die Windows-Probe grün, dann Freigabe als 0.6.0. In „Was ist neu“ für alle steht nur, was alle betrifft.

## Hinweise
- **Darfst du selbst entscheiden:** Aufbau der Daten im Detail, Aufteilung in mehrere Pakete, Reihenfolge der Schritte.
- **Frag vorher:** der Weg „nur intern“ (Punkt 3); wenn der Umwandler mehr als ein Viertel eines Teils nicht zuordnen kann.
