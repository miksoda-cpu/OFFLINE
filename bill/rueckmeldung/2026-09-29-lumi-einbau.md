# Rückmeldung: Die Lumi, standardmäßig aus, mit Namen, Bildern und Tipps

**Von:** Code (lokale Session) · **Datum:** 2026-09-29 · **Auftrag:** `bill/erledigt/2026-09-29-lumi-einbau.md` · **Commits:** `437b92f`, Korrektur `72775a4`

**Stand:** gebaut und getestet, im Web-Prototyp vollständig durchgespielt und in der Test-App ergänzt (Nachtrag unten).

## Ergebnis, Punkt für Punkt
1. **Standard aus:** Drei Darstellungen, Lumi mit Tipps, nur Tipps, aus (Standard).
   - **Übergang:** Wer in 0.1.x einen eigenen Namen vergeben hatte, behält Name und Darstellung. Alle anderen sind nach dem Update aus.
   - **Einladung:** einmal nach einer Woche die dunkle Karte mit zwei Lichtern. Nach „Nein, danke“ kommt sie nie wieder.
   - **Solange sie aus ist:** ganz still, keine Tipps.
2. **Startablauf** mit den Texten aus `OFFLINE-Lumi-Startablauf.md`:
   - Einladung, dann „Oh. Hier oben ist es hell.“ und „Wie soll sie heißen?“ mit *Namen geben* / *Später*. „Später“ lässt sie namenlos, auf ihrer Karte bleibt der Knopf *Namen geben*.
   - Erster Satz mit Namen: „Susi. Das bin ich …“.
   - Ausschalten mit Rückfrage („Susi geht schlafen …“ *Ausschalten* / *Doch nicht*).
   - Wiedereinschalten: kurz schlafen, dann „Da bist du ja. Ich hab geschlafen.“
   - **Kein „ich“ ohne Namen:** Tipps mit ich/mir/mich/mein tragen `benannt`. Zusätzlich filtert die App jeden Text, der von sich spricht, solange kein Name vergeben ist. Das gilt auch für Laute beim Anstupsen und für `wesen.sagen` aus Modulen: Wichteln sagt „Ich weiß auch nicht …“ und schweigt deshalb, bis die Lumi einen Namen hat.
3. **Bilder:** die elf Zustände aus `bilder/frei/` als Foto-Ansicht (`web/lumi/`, 1,3 MB, mit der App, nicht aus einem Paket).
   - **Vorrang** nach der Mimik-Tafel (`mimikZustand`). „Noch ohne Namen“ ersetzt Ruhe, Freude und Müde.
   - **Antennenlicht** als Ebene über den Spitzen aus `lumi-mimik.json`: Helligkeit nach Bereit, Fest voll, Schläft aus, Unruhig flackert, Müde halb.
   - **Kopfneigung** als Drehung um den Halsansatz (−10° bis +7°).
   - **Pixel-Sprite** bleibt als „Figur: Pixel (sparsam)“.
   - **Zuordnung zu den Wesen-Zuständen:** Liegt → Müde, Sitzt/Wandert → Ruhe, Baut → Freude.
4. **KI-Kennzeichnung:** Der Satz „Die Bilder der Lumi sind mit KI erzeugt“ steht bei der Einladung, in den Einstellungen (an und aus) und beim Einschalten. Die Herkunft steht in `docs/LUMI-BILDER.md`: Referenz Muse Image, Zustände Gemini 3 Pro Image, Freistellung rembg, Prüfsummen aller Dateien.
5. **Tipps:** **176** im Paket `wir`, nicht 180. Vier Tipps hängen am Profil (alltag-033 bis -036: insulin, kind, hund, stockwerk) und sind wie beauftragt weggelassen.
   - **Format angeglichen:** Sorten klein, Bedingungen als Daten (Wortschatz erweitert um `wochentag`, `stunde`, `tag`, Monatslisten, `alter` einer Bereit-Bestätigung und `zeitumstellung_in_tagen`). 38 Tipps sprechen von sich und kommen erst mit Namen.
   - Unbekannte Wörter in einer Bedingung lassen den Tipp jetzt weg, statt ihn immer zu zeigen.
   - **Werkzeug:** `pakete/wir/tipps-umwandeln.mjs` baut den Bestand aus dem Material neu.
   - `app-001` ist korrigiert: „Der Tresor ist das kleine Schloss links in der Seitenleiste.“
   - **„Hörner“, „Arktis“, „das Wesen“:** Kein Tipptext enthält eines dieser Wörter, es gab nichts umzuschreiben. Nur die Beschreibung des Pakets hieß noch „Das Wesen“; sie heißt jetzt „Wir · die Lumi und ihre Tipps“.
   - `app_min` ist 0.2.0, weil ältere Apps den neuen Wortschatz nicht kennen.
6. `docs/WESEN.md`: Abschnitt A ist Entwurf 3 aus der Session, Abschnitt B beschreibt die Umsetzung in 0.2.0.

## Durchlauf (Web-Prototyp, Chromium; Test-App folgt)

| Schritt | Ergebnis |
|---|---|
| frisch installiert | keine Figur, keine Karte, „Lumi · aus“, keine Tipps |
| eine Woche vorgestellt | Karte „Unter dem Eis wohnt jemand.“ |
| *Ja, zeig sie mir* | Bild Sprechen, „Oh. Hier oben ist es hell.“, Namensfrage |
| *Später* | ohne Namen („Lumi“), Knopf *Namen geben* |
| Name „Susi“ | „Susi. Das bin ich. Das war neu. Ich mag es.“, danach Müde (Bereit 12) |
| dreimal angestupst | Zähne, „grrr“, dann „…tschuldigung. Ich mag das nicht.“ |
| Bestätigung „Nachbar“ | Freude |
| Probeabend | Fest, Licht voll |
| Bestätigung verfallen, Bereit 58 | Unruhig, Licht flackert |
| alles gültig, Bereit 61 | Ruhe |
| *Lumi ausschalten* → *Doch nicht* → *Ausschalten* | Rückfrage mit Namen, danach aus und still |
| *Lumi zeigen* | Schläft, dann „Da bist du ja. Ich hab geschlafen.“, Name bleibt Susi |
| 360 px Breite | Bühne passt, kein seitlicher Überlauf, Knöpfe 44 px |

**Noch live zu sehen:** „Nachdenken“ (vor einem Weisheitstipp) und „Zuhören“ (Fokus im Namensfeld). Der Browser-Bereich gilt als verborgen, dort zeigt die Lumi absichtlich keine Tipps. Beides ist über den Test der Mimik-Tafel abgedeckt; in der Test-App schaue ich es mir an.

## Geprüft
- `node --test web/wesen.test.mjs`: 8 von 8, auch in der CI.
  - Frisch ist aus; Übergang für Bestand (benannt bleibt an, alle anderen aus).
  - Die Karte kommt erst nach einer Woche und nie nach „Nein“.
  - Keine Tipps, wenn sie aus ist.
  - Kein „ich“ ohne Namen: jeder Tipp, der Pool und alle Texte vor der Namensgabe.
  - Tippbestand, Wortschatz und Mimik-Vorrang.
- Dazu Bereit 15 von 15 und Werkzeug 28 von 28. Die CI ist für alle bisherigen Commits grün.

## Hinweise
- **Bestand im Paket:** Das Paket `wir` ist nur in der Quelle geändert, nicht gebaut und nicht veröffentlicht. Bis es neu gebaut ist, zeigt die App die 53 alten Tipps; die mit „ich“ sind dort bereits über `benannt` geregelt.
- **Handy:** Die Foto-Ansicht funktioniert bei 360 px. Die Bühne ist 240 px breit (Einstellung „Größe“), darunter ist Platz für die Sprechblase. Unter 360 px schrumpft sie mit.

## Nachtrag: Durchlauf in der Test-App (macOS, Entwickler-Build, frische Kopie `at.digioneer.offline.lumitest`)

| Schritt | Ergebnis |
|---|---|
| frische Installation | keine Figur, keine Karte, keine Tipps |
| Datum +7 Monate (Testleiste) | dunkle Karte mit zwei Lichtern, Texte und KI-Satz wie vorgesehen |
| *Ja, zeig sie mir* | Bild Sprechen, „Oh. Hier oben ist es hell.“, Namensfeld mit Fokus |
| Satz vorbei, Feld im Fokus | **Zuhören** (Kopf geneigt, aufmerksam) |
| *Später* | „noch ohne Namen“, Knopf *Namen geben* |
| Name „Susi“ | „Susi. Das bin ich. Das war neu. Ich mag es.“ |
| erster Tipp | Tipp der Sorte App, Bild Sprechen |
| dreimal angestupst | **Zähne**, „grrr“, dann „…tschuldigung. Ich mag das nicht.“ |

**Gefunden und behoben** (`72775a4`): Vor einem Weisheitstipp soll die Lumi 1,2 Sekunden nachdenken. Der Code rief sich danach selbst wieder auf und blieb im Bild **Nachdenken** hängen; der Tipp kam nie. Jetzt denkt sie einmal nach und zeigt den Tipp. Im Browser war das nicht aufgefallen, weil dort keine Tipps kommen, solange die Seite als verborgen gilt.

Freude, Fest, Unruhig, Aus mit Rückfrage und Wiedereinschalten habe ich im Web-Prototyp geprüft (Tabelle oben). In der App habe ich aufgehört, als Mik den Mac wieder benutzte; derselbe Code, kein Unterschied zu erwarten.
