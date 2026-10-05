# Auftrag: Bilder für die Naturheilkunde

- Nr.: 2026-10-05-11
- Gehört zu: `2026-10-05-naturheilkunde-intern.md` (0.6.0). Erst wenn der Textteil steht, gern als 0.6.1. Wenn es klein bleibt, auch in 0.6.0.
- Beilage: `naturheilkunde/OFFLINE-Naturheilkunde-Bilder.md`. Das ist eine **Startliste** der Session „Gesundheitsmodul im Tresor“. Sie konnte Commons nicht direkt lesen und hatte ein Suchbudget.
  - 53 Tafeln gefunden, 37 Fotos als Kandidaten.
  - Lizenz und Urheber sind **nirgends gelesen**.
  - „kein freies Bild gefunden“ heißt nur, dass eine Suche nichts fand. Behandle es wie „nicht gesucht“.
- Gilt weiter: Der Bereich bleibt intern, bis Mik ihn freigibt.

## Ziel

Jeder Eintrag in der Naturheilkunde bekommt, wo es geht, eine **alte Pflanzentafel**. Pilze, Flechten und Moose sowie gefährliche Doppelgänger bekommen dazu ein **freies Foto**. Es gibt keine KI-Bilder von Pflanzen oder Pilzen, nirgends.

## 1. Skript `bilder-holen.mjs`

Läuft beim Paketbau mit Netz, nicht in der App.

1. **Tafeln suchen:** für jeden Eintrag mit `wiss_name`, auch unter den Synonymen aus dem Eintrag. Gesucht wird in diesen Commons-Kategorien:
   - „Köhler's Medizinal-Pflanzen“ (1887)
   - „Flora von Deutschland, Österreich und der Schweiz“ von Thomé (1885)

   Die Startliste nimmst du als Vorschlag. Die Kategorie entscheidet.
2. **Fotos suchen:** nur für Pilze, Flechten und Moose und für die Doppelgänger, die in den Warnkarten stehen. Je Art höchstens zwei.
3. **Lizenz prüfen** mit der Commons-API (`imageinfo`, `extmetadata`):
   - **Zulässig:** gemeinfrei (Public Domain), CC0, CC BY und CC BY-SA.
   - **Verworfen:** alles andere, auch NC und ND, ohne Ausnahme.
   - Bei Tafeln muss das Dateiblatt Werk und Jahr bestätigen.
4. **Nachweis festhalten:** Urheber, Lizenz mit Version, Link zur Datei und Werk bzw. Jahr kommen in `bildnachweise.json`. Ohne vollständigen Nachweis wird das Bild nicht genommen.
5. **Bilder verkleinern:** WebP, längste Seite 1200 Pixel. Ränder der Tafeln bleiben, nichts wird retuschiert.
6. **Bericht `bilder-bericht.md`:**
   - je Art: Tafel ja/nein und Foto ja/nein;
   - die Liste ohne Bild;
   - verworfene Dateien mit Grund;
   - die Gesamtgröße.
7. **Wikimedia-Regeln einhalten:** eigener User-Agent mit Kontakt, langsam abfragen, Bot-Sperren nie umgehen. Wenn Commons blockt, brichst du ab und meldest es.

## 2. Paket `naturheilkunde-bilder` (Art `inhalt`)

- Ein eigenes Paket, damit der Text klein bleibt. Ohne das Bilderpaket funktioniert alles weiter, nur ohne Bilder.
- Es ist intern wie das Hauptpaket: nicht im öffentlichen Katalog, nicht in `web/pakete/`.

## 3. In der App

- **Eintrag:** Die Tafel steht oben, das Foto darunter, wenn es eines gibt. Ein Tipp auf das Bild vergrößert es.
- **Bildzeile** unter jedem Bild, klein:
  - bei Tafeln: „Tafel: Köhler, Medizinal-Pflanzen, 1887 · gemeinfrei“;
  - bei Fotos: „Foto: <Urheber> · <Lizenz>“.
- **Warnkarten und „Ich finde …“:** Der giftige Doppelgänger steht mit seinem Bild **zuerst** und hat einen roten Rand. Darunter steht der Satz: „Ein Bild reicht zum Bestimmen nicht. Im Zweifel nicht essen.“
- **Handbuch:** Am Ende kommt das Kapitel „Bildnachweise“ mit allen Bildern und ihren vollständigen Angaben, erzeugt aus `bildnachweise.json`.

## 4. Tests

- Kein Bild ohne Eintrag in `bildnachweise.json`.
- Keine Lizenz außer gemeinfrei, CC0, CC BY oder CC BY-SA.
- Der Doppelgänger steht in „Ich finde …“ immer vor der essbaren Art.
- Das Paket ist im öffentlichen Katalog und in `web/pakete/` nicht vorhanden.

## Fertig, wenn

- `bilder-bericht.md` liegt in der Rückmeldung, mit der Zahl der Arten mit Tafel, mit Foto und ohne Bild und mit der Paketgröße.
- Bilder bei 360 Pixel liegen bei:
  - ein Eintrag mit Tafel;
  - die Warnkarte Bärlauch mit Maiglöckchen und Herbstzeitlose;
  - „Ich finde …“ mit einem Pilz-Doppelgänger;
  - das Kapitel „Bildnachweise“.
- Alle Tests und die Windows-Probe sind grün.

## Hinweise

- **Darfst du selbst entscheiden:** die Suchlogik, Synonyme, die Bildgröße bis 1600 Pixel und welches von mehreren gültigen Fotos genommen wird (das schärfste mit dem Merkmal im Bild).
- **Frag vorher:** wenn das Bilderpaket größer als 150 MB wird oder wenn mehr als die Hälfte der Giftpflanzen aus Teil 1 ohne Tafel bleibt.
