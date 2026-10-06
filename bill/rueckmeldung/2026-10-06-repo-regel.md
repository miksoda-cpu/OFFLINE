# Rückmeldung: Regel für das öffentliche Repo (Nr. 13)

**Von:** Code (lokale Session) · **Datum:** 2026-10-06 · **Auftrag:** `bill/erledigt/2026-10-06-repo-regel-verschluesseln.md` (Nr. 2026-10-06-13) · **Branch:** `repo-regel`

## Ergebnis
- **Bestandsaufnahme:**
  - 609 Dateien im Repo, davon 273 Inhaltsdateien. Die Liste je Datei steht unten.
  - Dazu kommen 73 Aufträge und Rückmeldungen in `bill/` und 16 Dateien in `docs/`. Sie sind Text der Redaktion; ich habe sie auf wörtliche Auszüge geprüft.
- **Verfahren:**
  - Jede Inhaltsdatei habe ich per SHA-256 mit dem signierten öffentlichen Katalog verglichen, 76 sind byte-gleich.
  - Bei den Quellen habe ich alle vier Umwandler neu laufen lassen. Lumi-Buch, Tage, Tipps und Pause ergeben genau die veröffentlichten Pakete, ohne eine einzige Abweichung.
- **Nicht freigegeben, jetzt verschlüsselt:** 48 Dateien.
  - **Skin Flechte:** 37 Dateien Inhalt (Bilder, Schriften, CSS, Texte) und der Prüfbericht. Das Paket ist nicht veröffentlicht. Die `LIESMICH.md` bleibt offen; sie beschreibt nur und zitiert keinen Inhalt.
  - **Lumisch-Wörterbuch** (`pakete/pause/quelle/`): Die Abschnitte 1 bis 5 stehen in keinem Paket: Gedanke, Grammatik in 25 Regeln, Beispielsätze, Redewendungen, „Gedanken der Philosophen“. Ins Paket kam nur das Wörterbuch selbst.
  - **Aussprache-Quelle** (`pakete/pause/quelle/`): Umschrift und Lautschrift sind ausgeliefert. Die Gruppennamen mit den Philosophen („Sein und Werden (Heraklit, …)“) sind es nicht.
  - **Eingang `2026-10-04-pause-quellen/`:** deine fünf Konzepte (Pause, Milde Zugkraft, Trainingsmodell, Übungskatalog, älteres Wörterbuch). Davon ist nichts als Text ausgeliefert.
  - **Eingang `2026-09-29-bill/material/`:** das Rohmaterial der Tipps. Darin stehen Tipps, die gestrichen oder umformuliert wurden und so nie ausgeliefert sind.
- **Schon verschlüsselt** waren 22 Dateien (Naturheilkunde, Bilder).
- **Offen bleiben dürfen** 200 Inhaltsdateien, alle freigegeben. Dazu kommen 3 Beschreibungen ohne Auszug. Eine Datei, die nicht freigegeben ist, liegt nicht mehr im Klartext im Repo.
- **Regel 4 (`bill/`), fünf wörtliche Auszüge gefunden.** Es sind Zitate von Tipps, die so nie ausgeliefert wurden:
  - der alte Treffpunkt-Tipp (in deinem Auftrag vom 30.09. und in der Rückmeldung vom 30.09.),
  - zwei Tipps in der Tabelle vom 30.09.,
  - der alte Radio-Tipp vom 01.10.

  Der Wortlaut steht jetzt in der verschlüsselten Beilage `bill/beilagen/verschluesselt/2026-10-06-auszuege.md`, im Klartext steht „Wortlaut in Beilage A1“ bis „A5“.

  In `docs/WESEN.md` standen zwei Beispiel-Tipps in alter Fassung. Ich habe sie durch die ausgelieferten ersetzt.
- **Geschichte:** Ich habe keinen alten Commit angefasst. Die Regel gilt ab diesem Commit.

## Die Wache für alle Pakete
`werkzeug/klartext-wache.mjs` stoppt Commit und Push jetzt auch, wenn
- **ein Paket gekennzeichnet ist:** Es trägt in `paket.quelle.json` `"freigegeben": false`, oder es ist intern. Dann ist alles darin geschützt, außer `paket.quelle.json`, Code und den Dateien unter `"offen"`. Ein neues Paket ist so geschützt, bevor jemand an die `.gitignore` denkt. Gekennzeichnet sind heute die Naturheilkunde, ihre Bilder und Flechte.
- **zu einer Datei eine verschlüsselte Fassung im Repo liegt** (`…/verschluesselt/x` → `…/x`): Dann darf der Klartext nie hinein, gleich wo.
- **eine Datei Text aus unveröffentlichten Quellen enthält.**
  - Geprüft werden die Ordner `quelle/`, alles Verschlüsselte unter `bill/` und die Texte geschützter Pakete.
  - Was schon in der letzten veröffentlichten App-Version steht (Tag `v0.6.1`), zählt nicht. Bewusst nicht der Arbeitsstand: Was jemand gerade hineinkopiert, darf sich nicht selbst freisprechen.
  - Die Wache meldet die Zeile der Fundstelle.

**Die Test-Commits.** Alle vier hat die Wache gestoppt (Exit 1):
1. `git add -f` auf `pakete/flechte/inhalt/skin/skin.css`,
2. ein neues Paket mit `"freigegeben": false` und einer Inhaltsdatei, ohne Eintrag in der `.gitignore`,
3. ein Satz aus der Lumisch-Grammatik in einer neuen Datei unter `docs/`,
4. ein Satz aus deinem Konzept „Milde Zugkraft“ am Ende einer Rückmeldung.

**Verfahren:** wie bei der Naturheilkunde, mit dem Kanal-Schlüssel. Neu ist `intern.mjs einlagern <wurzel> <pfad…>`. Es legt `<wurzel>/<pfad>` verschlüsselt unter `<wurzel>/verschluesselt/<pfad>` ab. Die Wurzel ist ein Paket, eine Lieferung im Eingang oder `bill/beilagen`.

**CI:** `tests.yml` entschlüsselt vor den Tests alles mit dem Kanal-Schlüssel aus den Secrets. So prüfen die Tests weiter das Lumisch-Wörterbuch gegen das Paket, die Flechte auf Kontrast und die Wache mit Fingerabdrücken. Ohne Schlüssel (Pull-Request von außen) werden diese Tests übersprungen.

`inhalte.yml` überspringt Pakete mit `"freigegeben": false`.

**Freigabe-Schritt:** Der neue Abschnitt in `docs/INTERN.md` heißt „Regel fürs öffentliche Repo“. Der Abschnitt „Freigeben“ beschreibt jetzt Schritt für Schritt, wie ein Inhalt in den offenen Teil wechselt:
1. Klartext holen,
2. Kennzeichnung löschen,
3. `.gitignore` bereinigen,
4. verschlüsselte Fassung entfernen und Klartext aufnehmen,
5. prüfen,
6. veröffentlichen.

Das geschieht erst auf Miks Wort, im selben Zug wie die Veröffentlichung.

## Tests
- Werkzeug: 42 von 42 (neu: Spiegel, Kennzeichnung, Freigegebenes abziehen, Regeln im Repo, `einlagern`).
- Web: 140 von 140.
- **Frischer Klon ohne Schlüssel:** 162 bestanden, 20 übersprungen, 0 Fehler.
- **Frischer Klon mit Schlüssel, wie die CI:** 179 bestanden, 3 übersprungen, 0 Fehler. Die 3 brauchen die Bilder von Commons.
- CI und Windows-Probe: grün.
  - Der erste Lauf war rot: Die CI holte keine Tags, also fehlte der Wache der Stand von v0.6.1, und sie meldete auch Veröffentlichtes. Jetzt holt der Checkout die Tags, und ohne Tag gibt die Wache einen deutlichen Hinweis.
  - Im zweiten Lauf (`37448204839`) hat die CI entschlüsselt: Werkzeug 42 von 42, Web 137 bestanden, 3 übersprungen (die Bilder).
  - Windows-Probe: grün, auf dem ersten und dem letzten Stand (`37446666030`, `37448495044`).

## Hinweis
Die Regel gilt ab jetzt. Was vor dem 06.10. offen im Repo lag, steht weiter in der Geschichte, etwa Flechte, das Wörterbuch und deine Konzepte; so wolltest du es (Regel 5).

## Anhang: Inhaltsdateien je Datei
Stand vor diesem Auftrag (Commit `c319a85`). „ja“ heißt freigegeben. Die Spalte nennt den Beleg, bei „nein“ den Grund.

| Datei | freigegeben |
|---|---|
| `bill/eingang/2026-09-29-bill/LIES-MICH.md` | ja – Lieferschein ohne Inhalt |
| `bill/eingang/2026-09-29-bill/material/pakete/wir/inhalt/tipps.json` | nein – Rohmaterial mit nie ausgelieferten Tipps → verschlüsselt |
| `bill/eingang/2026-09-29-bill/material/pakete/wir/paket.quelle.json` | nein – Rohmaterial mit nie ausgelieferten Tipps → verschlüsselt |
| `bill/eingang/2026-09-29-bill/material/pakete/wir/tipps_bauen.py` | nein – Rohmaterial mit nie ausgelieferten Tipps → verschlüsselt |
| `bill/eingang/2026-10-04-pause-quellen/OFFLINE-Gehirn-Fitness-Trainingsmodell.md` | nein – Konzept, nicht als Text ausgeliefert → verschlüsselt |
| `bill/eingang/2026-10-04-pause-quellen/OFFLINE-Gehirntraining-Uebungskatalog.md` | nein – Konzept, nicht als Text ausgeliefert → verschlüsselt |
| `bill/eingang/2026-10-04-pause-quellen/OFFLINE-Lumisch-Woerterbuch.md` | nein – Konzept, nicht als Text ausgeliefert → verschlüsselt |
| `bill/eingang/2026-10-04-pause-quellen/OFFLINE-Modul-Pause-Konzept.md` | nein – Konzept, nicht als Text ausgeliefert → verschlüsselt |
| `bill/eingang/2026-10-04-pause-quellen/OFFLINE-Prinzip-Milde-Zugkraft.md` | nein – Konzept, nicht als Text ausgeliefert → verschlüsselt |
| `bill/eingang/2026-10-05-naturheilkunde-antwort-intern.md` | ja – Auftrag ohne Auszug (Wache geprüft) |
| `bill/rueckmeldung/bilder/2026-10-04-lumi-buch-1-satz-mit-link-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-lumi-buch-2-leseansicht-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-lumi-buch-3-buch-titel-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-lumi-buch-4-buch-mit-luecke-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-pause-umbau-1-heute-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-pause-umbau-2-raum-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-pause-umbau-3-happen-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-pause-umbau-4-ende-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-pause-umbau-5-happen-breit.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-preise-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-preise-breit.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-bibliothek-360-nachher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-bibliothek-360-vorher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-bibliothek-breit-nachher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-bibliothek-breit-vorher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-einstellungen-360-nachher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-einstellungen-360-vorher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-einstellungen-breit-nachher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-einstellungen-breit-vorher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-heute-360-nachher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-heute-360-vorher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-heute-breit-nachher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-heute-breit-vorher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-notfall-360-nachher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-notfall-360-vorher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-notfall-breit-nachher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-notfall-breit-vorher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-uebersicht-360-nachher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-uebersicht-360-vorher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-uebersicht-breit-nachher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-uebersicht-breit-vorher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-vorsorge-360-nachher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-vorsorge-360-vorher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-vorsorge-breit-nachher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-stil-zart-vorsorge-breit-vorher.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-webseite-ehrlich-1-start-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-webseite-ehrlich-2-drin-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-04-webseite-ehrlich-3-preise-1280.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-0-5-1-buch-zwei-luecken-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-0-5-1-preise-1280.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-hilfe-lumi-buch-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-hilfe-tresor-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-lumisch-neu-heisst-es-kiv-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-mein-tag-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-updates-1-oben-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-updates-2-unten-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-updates-3-blatt-alle-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-updates-4-hilfe-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-updates-5-oben-breit.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-updates-6-unten-breit.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-updates-7-hilfe-breit.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-version-ist-da-360.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/bilder/2026-10-05-version-ist-da-ipad-1024.jpg` | ja – Bildschirmfoto einer veröffentlichten Version |
| `bill/rueckmeldung/hoerproben/2026-10-05-lumisch-kiv.m4a` | ja – Wort aus pause 2026.10.05.2 |
| `bill/rueckmeldung/hoerproben/2026-10-05-lumisch-talzanpera.m4a` | ja – Wort aus pause 2026.10.05.2 |
| `bill/rueckmeldung/hoerproben/2026-10-05-lumisch-vau.m4a` | ja – Wort aus pause 2026.10.05.2 |
| `paket-kit/beispiel/wichteln/LIESMICH.md` | ja – Beschreibung des veröffentlichten Moduls wichteln |
| `paket-kit/beispiel/wichteln/PRUEFBERICHT.md` | ja – Beschreibung des veröffentlichten Moduls wichteln |
| `paket-kit/beispiel/wichteln/inhalt/modul/index.html` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `paket-kit/beispiel/wichteln/inhalt/vorschau/1.svg` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `paket-kit/beispiel/wichteln/inhalt/vorschau/2.webp` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `paket-kit/beispiel/wichteln/inhalt/vorschau/3.svg` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `paket-kit/beispiel/wichteln/inhalt/vorschau/4.svg` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `paket-kit/beispiel/wichteln/inhalt/vorschau/5.svg` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `paket-kit/beispiel/wichteln/inhalt/vorschau/folien.json` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `pakete/at-basis/inhalt/blackout.json` | ja – im Katalog (at-basis 2026.09.29.1, gleiche Prüfsumme) |
| `pakete/at-basis/inhalt/bundeslaender.json` | ja – im Katalog (at-basis 2026.09.29.1, gleiche Prüfsumme) |
| `pakete/at-basis/inhalt/notrufe.json` | ja – im Katalog (at-basis 2026.09.29.1, gleiche Prüfsumme) |
| `pakete/at-basis/inhalt/sirenen.json` | ja – im Katalog (at-basis 2026.09.29.1, gleiche Prüfsumme) |
| `pakete/at-basis/inhalt/vorsorge.json` | ja – im Katalog (at-basis 2026.09.29.1, gleiche Prüfsumme) |
| `pakete/flechte/LIESMICH.md` | offen – Beschreibung ohne Inhaltsauszug (unter "offen") |
| `pakete/flechte/PRUEFBERICHT.md` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/01-riesenrad.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/02-felder.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/03-dorf.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/04-rosette.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/05-fassade.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/ecke-ol.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/ecke-or.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/ecke-ul.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/ecke-ur.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/tupfer-bank.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/tupfer-bienen.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/tupfer-brunnen.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/tupfer-rad.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/tupfer-tram.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/flechten/tupfer-ziege.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/fonts/alegreya-500-italic.woff2` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/fonts/alegreya-500.woff2` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/fonts/alegreya-700.woff2` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/fonts/atkinson-400-italic.woff2` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/fonts/atkinson-400.woff2` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/fonts/atkinson-600.woff2` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/fonts/atkinson-700.woff2` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/fonts/atkinson-mono-400.woff2` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/fonts/ofl-alegreya.txt` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/fonts/ofl-atkinson-mono.txt` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/fonts/ofl-atkinson-next.txt` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/herkunft.md` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/icons.svg` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/liesmich.md` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/lizenz-lucide.txt` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/skin/skin.css` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/vorschau/1.svg` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/vorschau/2.webp` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/vorschau/3.svg` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/vorschau/4.svg` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/vorschau/5.svg` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/flechte/inhalt/vorschau/folien.json` | nein – Skin nicht veröffentlicht → verschlüsselt |
| `pakete/lumi-buch/LIESMICH.md` | ja – Beschreibung eines veröffentlichten Pakets |
| `pakete/lumi-buch/inhalt/buch.json` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/lumi-buch/inhalt/vorschau/1.svg` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/lumi-buch/inhalt/vorschau/2.jpg` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/lumi-buch/inhalt/vorschau/3.svg` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/lumi-buch/inhalt/vorschau/4.svg` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/lumi-buch/inhalt/vorschau/5.svg` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/lumi-buch/inhalt/vorschau/folien.json` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/lumi-buch/quelle/OFFLINE-Lumi-Buch-Band1.md` | ja – Neubau ergibt lumi-buch 2026.10.05.2 bzw. wir 2026.10.04.4 (Feld buch) |
| `pakete/lumi-buch/quelle/OFFLINE-Lumi-Buch-Zuordnung.json` | ja – Neubau ergibt lumi-buch 2026.10.05.2 bzw. wir 2026.10.04.4 (Feld buch) |
| `pakete/lumi-buch/quelle/OFFLINE-Lumi-Buch-Zuordnung.md` | ja – Neubau ergibt lumi-buch 2026.10.05.2 bzw. wir 2026.10.04.4 (Feld buch) |
| `pakete/lumi-buch/quelle/neufassung-2026-10-05.json` | ja – Neubau ergibt lumi-buch 2026.10.05.2 bzw. wir 2026.10.04.4 (Feld buch) |
| `pakete/naturheilkunde-bilder/sichtpruefung.json` | offen – nur Commons-Dateinamen mit Grund (unter "offen") |
| `pakete/naturheilkunde-bilder/verschluesselt/auswahl.json` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde-bilder/verschluesselt/bilder-bericht.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde-bilder/verschluesselt/verworfen.json` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/LIESMICH.md` | offen – Beschreibung ohne Inhaltsauszug (unter "offen") |
| `pakete/naturheilkunde/verschluesselt/inhalt/naturheilkunde.json` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/inhalt/vorschau/1.svg` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/inhalt/vorschau/2.svg` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/inhalt/vorschau/3.svg` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/inhalt/vorschau/4.svg` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/inhalt/vorschau/5.svg` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/inhalt/vorschau/folien.json` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/quelle/OFFLINE-Naturheilkunde-Inhalt-0-Waldfunde-Beschwerden.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/quelle/OFFLINE-Naturheilkunde-Inhalt-1-Gift-und-Sicherheit.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/quelle/OFFLINE-Naturheilkunde-Inhalt-10-Lehre-der-Tradition.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/quelle/OFFLINE-Naturheilkunde-Inhalt-2-Baeume-Straeucher.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/quelle/OFFLINE-Naturheilkunde-Inhalt-3-Krautschicht.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/quelle/OFFLINE-Naturheilkunde-Inhalt-4-Beeren-Flechten-Wunden-Hygiene.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/quelle/OFFLINE-Naturheilkunde-Inhalt-5-Aussereuropaeisch.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/quelle/OFFLINE-Naturheilkunde-Inhalt-6-Wechselwirkungen.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/quelle/OFFLINE-Naturheilkunde-Inhalt-7-TCM.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/quelle/OFFLINE-Naturheilkunde-Inhalt-8-Schamanismus-Volksmedizin.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/quelle/OFFLINE-Naturheilkunde-Inhalt-9-Alte-Kraeuterbuecher.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/naturheilkunde/verschluesselt/unzugeordnet.md` | schon verschlüsselt (seit 0.6.0/0.6.1) |
| `pakete/pause/LIESMICH.md` | ja – Beschreibung eines veröffentlichten Pakets |
| `pakete/pause/inhalt/pause.json` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/pause/inhalt/vorschau/1.svg` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/pause/inhalt/vorschau/2.jpg` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/pause/inhalt/vorschau/3.svg` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/pause/inhalt/vorschau/4.svg` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/pause/inhalt/vorschau/5.svg` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/pause/inhalt/vorschau/folien.json` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `pakete/pause/quelle/OFFLINE-Lumisch-Aussprache.json` | nein – Gruppennamen mit Philosophen nicht im Paket → verschlüsselt |
| `pakete/pause/quelle/OFFLINE-Lumisch-Woerterbuch-2026-10-05.md` | nein – Abschnitte 1–5 (Gedanke, Grammatik, Beispielsätze, Redewendungen, Philosophen) nicht im Paket → verschlüsselt |
| `pakete/tage-2026-10/LIESMICH.md` | ja – Beschreibung eines veröffentlichten Pakets |
| `pakete/tage-2026-10/inhalt/herkunft.md` | ja – im Katalog (tage-2026-10 2026.10.04, gleiche Prüfsumme) |
| `pakete/tage-2026-10/inhalt/tage.json` | ja – im Katalog (tage-2026-10 2026.10.04, gleiche Prüfsumme) |
| `pakete/tage-2026-11/LIESMICH.md` | ja – Beschreibung eines veröffentlichten Pakets |
| `pakete/tage-2026-11/inhalt/herkunft.md` | ja – im Katalog (tage-2026-11 2026.10.04, gleiche Prüfsumme) |
| `pakete/tage-2026-11/inhalt/tage.json` | ja – im Katalog (tage-2026-11 2026.10.04, gleiche Prüfsumme) |
| `pakete/tage-2026-12/LIESMICH.md` | ja – Beschreibung eines veröffentlichten Pakets |
| `pakete/tage-2026-12/inhalt/herkunft.md` | ja – im Katalog (tage-2026-12 2026.10.04, gleiche Prüfsumme) |
| `pakete/tage-2026-12/inhalt/tage.json` | ja – im Katalog (tage-2026-12 2026.10.04, gleiche Prüfsumme) |
| `pakete/tage-2027-01/LIESMICH.md` | ja – Beschreibung eines veröffentlichten Pakets |
| `pakete/tage-2027-01/inhalt/herkunft.md` | ja – im Katalog (tage-2027-01 2026.10.04, gleiche Prüfsumme) |
| `pakete/tage-2027-01/inhalt/tage.json` | ja – im Katalog (tage-2027-01 2026.10.04, gleiche Prüfsumme) |
| `pakete/tage/quelle/raetsel-01.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/raetsel-12.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/raetsel.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-01/fontane-birnbaum.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-01/gotthelf-spinne.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-01/moerike-mozart.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-01/stifter-condor-1.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-01/stifter-condor-2.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-01/stifter-condor-3.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-01/stifter-condor-4.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/grimm-drei-maennlein.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/grimm-frau-holle.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/grimm-goldener-schluessel.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/grimm-hirtenbueblein.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/grimm-schneeweisschen.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/grimm-sternthaler.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/grimm-wichtelmaenner.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/hauff-kalte-herz-1.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/hauff-kalte-herz-2.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/hebel-kannitverstan.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/hebel-kluger-richter.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/hebel-unverhoftes-wiedersehen.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/hebel-weltgebaeude.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane-12/storm-immensee.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane/der-schimmelreiter.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane/die-judenbuche.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane/kleider-machen-leute.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/tage/quelle/romane/taugenichts.json` | ja – gemeinfrei (Wikisource) bzw. alle Rätsel ausgeliefert; Neubau = Katalog |
| `pakete/wir/inhalt/tipps.json` | ja – im Katalog (wir 2026.10.04.4, gleiche Prüfsumme) |
| `redaktion/freigegeben/wichteln-2026.10.04/inhalt/modul/index.html` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `redaktion/freigegeben/wichteln-2026.10.04/inhalt/vorschau/1.svg` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `redaktion/freigegeben/wichteln-2026.10.04/inhalt/vorschau/2.webp` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `redaktion/freigegeben/wichteln-2026.10.04/inhalt/vorschau/3.svg` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `redaktion/freigegeben/wichteln-2026.10.04/inhalt/vorschau/4.svg` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `redaktion/freigegeben/wichteln-2026.10.04/inhalt/vorschau/5.svg` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `redaktion/freigegeben/wichteln-2026.10.04/inhalt/vorschau/folien.json` | ja – im Katalog (wichteln 2026.10.04, gleiche Prüfsumme) |
| `redaktion/freigegeben/wichteln-2026.10.04/paket.json` | ja – wichteln 2026.10.04 im Katalog (gleiche Prüfsumme) |
| `redaktion/freigegeben/wichteln-2026.10.04/paket.sig` | ja – wichteln 2026.10.04 im Katalog (gleiche Prüfsumme) |
| `web/katalog/katalog.json` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/katalog/katalog.sig` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/lumi/antennen-licht.webp` | ja – in der App seit 0.x, unverändert seit v0.6.1 |
| `web/lumi/lumi-fest.webp` | ja – in der App seit 0.x, unverändert seit v0.6.1 |
| `web/lumi/lumi-freude.webp` | ja – in der App seit 0.x, unverändert seit v0.6.1 |
| `web/lumi/lumi-muede.webp` | ja – in der App seit 0.x, unverändert seit v0.6.1 |
| `web/lumi/lumi-nachdenken.webp` | ja – in der App seit 0.x, unverändert seit v0.6.1 |
| `web/lumi/lumi-noch-ohne-namen.webp` | ja – in der App seit 0.x, unverändert seit v0.6.1 |
| `web/lumi/lumi-ruhe.webp` | ja – in der App seit 0.x, unverändert seit v0.6.1 |
| `web/lumi/lumi-schlaeft.webp` | ja – in der App seit 0.x, unverändert seit v0.6.1 |
| `web/lumi/lumi-sprechen.webp` | ja – in der App seit 0.x, unverändert seit v0.6.1 |
| `web/lumi/lumi-unruhig.webp` | ja – in der App seit 0.x, unverändert seit v0.6.1 |
| `web/lumi/lumi-zaehne.webp` | ja – in der App seit 0.x, unverändert seit v0.6.1 |
| `web/lumi/lumi-zuhoeren.webp` | ja – in der App seit 0.x, unverändert seit v0.6.1 |
| `web/pakete/at-basis-2026.09.29.1/inhalt/blackout.json` | ja – im Katalog (at-basis 2026.09.29.1, gleiche Prüfsumme) |
| `web/pakete/at-basis-2026.09.29.1/inhalt/bundeslaender.json` | ja – im Katalog (at-basis 2026.09.29.1, gleiche Prüfsumme) |
| `web/pakete/at-basis-2026.09.29.1/inhalt/notrufe.json` | ja – im Katalog (at-basis 2026.09.29.1, gleiche Prüfsumme) |
| `web/pakete/at-basis-2026.09.29.1/inhalt/sirenen.json` | ja – im Katalog (at-basis 2026.09.29.1, gleiche Prüfsumme) |
| `web/pakete/at-basis-2026.09.29.1/inhalt/vorsorge.json` | ja – im Katalog (at-basis 2026.09.29.1, gleiche Prüfsumme) |
| `web/pakete/at-basis-2026.09.29.1/paket.json` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/at-basis-2026.09.29.1/paket.sig` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/lumi-buch-2026.10.05.2/inhalt/buch.json` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/lumi-buch-2026.10.05.2/inhalt/vorschau/1.svg` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/lumi-buch-2026.10.05.2/inhalt/vorschau/2.jpg` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/lumi-buch-2026.10.05.2/inhalt/vorschau/3.svg` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/lumi-buch-2026.10.05.2/inhalt/vorschau/4.svg` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/lumi-buch-2026.10.05.2/inhalt/vorschau/5.svg` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/lumi-buch-2026.10.05.2/inhalt/vorschau/folien.json` | ja – im Katalog (lumi-buch 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/lumi-buch-2026.10.05.2/paket.json` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/lumi-buch-2026.10.05.2/paket.sig` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/pause-2026.10.05.2/inhalt/pause.json` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/pause-2026.10.05.2/inhalt/vorschau/1.svg` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/pause-2026.10.05.2/inhalt/vorschau/2.jpg` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/pause-2026.10.05.2/inhalt/vorschau/3.svg` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/pause-2026.10.05.2/inhalt/vorschau/4.svg` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/pause-2026.10.05.2/inhalt/vorschau/5.svg` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/pause-2026.10.05.2/inhalt/vorschau/folien.json` | ja – im Katalog (pause 2026.10.05.2, gleiche Prüfsumme) |
| `web/pakete/pause-2026.10.05.2/paket.json` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/pause-2026.10.05.2/paket.sig` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/tage-2026-10-2026.10.04/inhalt/herkunft.md` | ja – im Katalog (tage-2026-10 2026.10.04, gleiche Prüfsumme) |
| `web/pakete/tage-2026-10-2026.10.04/inhalt/tage.json` | ja – im Katalog (tage-2026-10 2026.10.04, gleiche Prüfsumme) |
| `web/pakete/tage-2026-10-2026.10.04/paket.json` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/tage-2026-10-2026.10.04/paket.sig` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/tage-2026-11-2026.10.04/inhalt/herkunft.md` | ja – im Katalog (tage-2026-11 2026.10.04, gleiche Prüfsumme) |
| `web/pakete/tage-2026-11-2026.10.04/inhalt/tage.json` | ja – im Katalog (tage-2026-11 2026.10.04, gleiche Prüfsumme) |
| `web/pakete/tage-2026-11-2026.10.04/paket.json` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/tage-2026-11-2026.10.04/paket.sig` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/tage-2026-12-2026.10.04/inhalt/herkunft.md` | ja – im Katalog (tage-2026-12 2026.10.04, gleiche Prüfsumme) |
| `web/pakete/tage-2026-12-2026.10.04/inhalt/tage.json` | ja – im Katalog (tage-2026-12 2026.10.04, gleiche Prüfsumme) |
| `web/pakete/tage-2026-12-2026.10.04/paket.json` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/tage-2026-12-2026.10.04/paket.sig` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/tage-2027-01-2026.10.04/inhalt/herkunft.md` | ja – im Katalog (tage-2027-01 2026.10.04, gleiche Prüfsumme) |
| `web/pakete/tage-2027-01-2026.10.04/inhalt/tage.json` | ja – im Katalog (tage-2027-01 2026.10.04, gleiche Prüfsumme) |
| `web/pakete/tage-2027-01-2026.10.04/paket.json` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/tage-2027-01-2026.10.04/paket.sig` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/wir-2026.10.04.4/inhalt/tipps.json` | ja – im Katalog (wir 2026.10.04.4, gleiche Prüfsumme) |
| `web/pakete/wir-2026.10.04.4/paket.json` | ja – Web-Version live (gleiche Prüfsumme) |
| `web/pakete/wir-2026.10.04.4/paket.sig` | ja – Web-Version live (gleiche Prüfsumme) |
