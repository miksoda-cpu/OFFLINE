# Rückmeldung: Preise auf der Webseite und Pause-Nachtrag – ausgeliefert mit 0.4.1

**Von:** Code (lokale Session) · **Datum:** 2026-10-04 · **Aufträge:** `bill/erledigt/2026-10-04-preise-webseite.md` (Nr. 2026-10-04-04), `bill/erledigt/2026-10-04-pause-nachtrag.md` (Nr. 2026-10-04-05) · **Branch:** `preise-pause` · **Tag:** `v0.4.1`

**Doppelt angekommen:** `2026-10-04-wir-drei-tipps.md` und `2026-10-04-pause-stufe1.md` lagen noch einmal im Ordner. Sie sind wortgleich mit den Aufträgen, die mit 0.4.0 erledigt wurden, daher nichts Neues.

## Ergebnis
- **App 0.4.1 ist ausgeliefert** (`app/latest.json`, 04.10.2026, 19:33 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux sind abrufbar (HTTP 200).
- **Web-Version 0.4.1 mit der neuen Startseite.** Live geprüft: 7,90 €, 19,90 € und ab 590 € stehen auf der Seite, „Kurse“ kommt nicht mehr vor.
- **Katalog** (erstellt 04.10.2026, 19:23 UTC, Signatur geprüft). Neu ist nur `pause`:

| Paket | Version | app_min | sha256 des Manifests |
|---|---|---|---|
| pause | 2026.10.04.1 | 0.4.0 | `b61724f2909af8efd0bf44b8504e5297b2957abc0b22bbfbe6c60a7b816fbc9e` |

  Die Web-Kopie stimmt mit dieser Prüfsumme überein. Apps 0.4.0 übergehen die neuen Felder (`beim`, `woerterbuch`).

## 1. Preise auf der Startseite (`web/index.html`)
- **Überschrift** „Gratis, Pro und Pro+“, darunter der Satz zum Schließfach. Der bestehende Satz „Die Software ist frei …“ bleibt.
- **Vier Karten** mit den beschlossenen Preisen und Inhalten. Pro ist hervorgehoben.
  - Anordnung, meine Entscheidung: bei 360 px untereinander, ab 640 px zwei mal zwei, ab 1100 px vier nebeneinander.
  - Der Zusatz „/ Monat · oder … / Jahr“ steht in einer eigenen Zeile unter dem Preis, sonst brach er mitten im Text um.
- **„kommt“** steht bei Schließfach (alle drei Größen), Kinder-Modus am Elternkonto und der Kachel KI-Assistent.
- **Kurse raus:** Die Kachel „Kurse“ ist ersetzt durch „Die Lumi“ mit deinem Satz, der Punkt bei Pro ist weg.
- **Kleinigkeiten, meine Entscheidung:**
  - Die strukturierten Daten für Suchmaschinen (`offers`) nennen jetzt Gratis, Pro und Pro+.
  - Das Prototyp-Band sagt „Stand 04.10.2026 · Inhalte sind Entwürfe“, die Preise sind beschlossen.
- **Mitgezogen:**
  - `docs/GHOST-SETUP.md`: Stufen Pro und Pro+ Familie mit Preisen, Werbesatz ohne Kurse.
  - `docs/KONZEPT.md`: Preistabelle mit vier Spalten; Kurse stehen dort als „vorerst nicht in OFFLINE (Entscheidung Mik, 27.09.)“ und sind aus der Funktionsliste und zwei weiteren Stellen gestrichen.
  - `web/datenschutz.html`: Der Lizenzschlüssel gilt für Pro und Pro+.
- **Keine Zahlung eingebaut,** die Anmeldung bleibt, wie sie ist.
- **Bilder:**
  - `bill/rueckmeldung/bilder/2026-10-04-preise-360.jpg` (360 px, Karten untereinander, kein seitlicher Bildlauf)
  - `bill/rueckmeldung/bilder/2026-10-04-preise-breit.jpg` (1280 px, vier nebeneinander)

**Weitere Versprechen, die die App nicht hält.** Nicht geändert, bitte entscheiden:

| Stelle | Text | Stand |
|---|---|---|
| Startbild (Hero) | „… Notfallwissen und ein KI-Assistent – auf deinem PC oder Mac“ | einen KI-Assistenten gibt es noch nicht (die Kachel hat jetzt „kommt“, der Satz oben nicht) |
| Seitenbeschreibung (`<meta>`, für Suchmaschinen und Teilen) | „… Notfallwissen und lokale KI …“, „… und lokale KI auf jedem PC und Mac“ | wie oben |
| Kachel Bibliothek | „Wikipedia, Wikivoyage und Wiktionary auf Deutsch, von kompakt bis komplett“ | verfügbar ist nur Wikivoyage; Wikipedia (drei Größen) ist im Katalog „geplant“, Wiktionary gibt es nicht |
| Kachel Karten | „Ganz Österreich bis zur Straße …“ | das Kartenpaket `karte-at` ist „geplant“; offline gibt es noch keine Karte |
| Kachel Österreich-Paket | „… Behördenwege – nach Bundesland“ | „nach Bundesland“ (`at-pro`) ist „geplant“ |
| Abschnitt Gratis-Paket | „Karte Österreich und Wikipedia auf Deutsch“ | beides noch nicht ladbar |
| Preiskarten (laut Beschluss) | Gratis „Wikipedia, Karte Österreich“, Pro „Österreich-Paket nach Bundesland“, „RIS-Gesetzesauszug wöchentlich“ | ebenfalls noch nicht da; ich habe sie wie beschlossen ohne „kommt“ gelassen |

Geprüft und in Ordnung: Installieren ohne Internet vom USB-Stick (gibt es), Update-Abo täglich, wöchentlich oder monatlich, im WLAN und zur festgelegten Zeit (Schalter „Nur im WLAN“ und Zeitfenster gibt es), keine Telemetrie.

## 2. Pause-Nachtrag
- **Rückspiegel ohne Zählung:** Der Satz „an X Tagen“ ist weg.
  - Er spricht nur über Fortschritt (Pilz, Lumisch).
  - Gibt es keinen, nennt er höchstens die Lieblingsformen des Monats ohne Zahl. Gemeint sind Formen, die mindestens zweimal gespielt und nicht abgelehnt wurden. Beispiel: „Diesen Monat warst du am liebsten beim Pilz und beim Atemfenster.“
  - Sonst kommt keine Karte.
  - Jede Form hat dafür im Paket eine kurze Wendung (`beim`).
  - Der Test prüft sechs verschiedene Verläufe gegen jede Nennung von Tagen, Malen oder Besuchen.
- **Lumisch nach Tag 21:** Der Tag zählt die früheren Tage mit Lumisch. Am selben Tag bleibt es dasselbe.
  - Ab Tag 22 an zwei von drei Tagen eine Wiederholung aus dem Kopf, ins Antwortfeld, mit „Weiß ich nicht mehr“. Bevorzugt wird das zuletzt falsch beantwortete Wort, sonst das am längsten nicht gefragte.
  - An jedem dritten Tag ein neues Wort mit Gruppe und Beispielsatz, danach eine kurze Abfrage.
  - Der Test spielt Tag 1 bis 40 durch: Plan bis 21, ab 22 die Folge Wiederholung, Wiederholung, neues Wort; sechs neue Wörter ohne Doppelte; das an Tag 25 falsche Wort kommt an Tag 26 wieder.
- **Wörterbuch im Paket:** vorerst nur die 20 Wörter des Plans (Tag 21 ist „dein Satz“) und 17 Wörter aus den Beispielsätzen, je mit Gruppe und Beispiel.
  - Die Reihenfolge der neuen Wörter: Welt, Haus, Menschen, Tun, Wie etwas ist, Gefühle, Kleine Wörter.
  - Auch die Ablenkwörter der Abfrage stammen jetzt nur noch daraus. In 0.4.0 waren einige andere dabei (Pinguin, Fisch …), die die Wortprüfung noch nicht hatten.
  - Weggelassen habe ich den Laut „mh“ und den Namen „Susi“.
- **Folie 2:** Die Bildschirmsteuerung am Mac geht weiterhin nicht, der eingebaute Browser aber schon. Folie 2 ist deshalb jetzt ein echtes Bild der Web-Version bei 360 px mit dem Happen „Wo war der Pilz?“.
- **Dabei gefunden und behoben:** Am Handy lagen Kopfleiste und untere Leiste über dem Happen-Rahmen, oben war der Kopf des Dialogs verdeckt. Das war ein Fehler in 0.4.0. Der Rahmen liegt jetzt über beiden.

## Geprüft
- **Tests:**
  - Web: 70 von 70. Neu sind der Rückspiegel ohne Zählung (sechs Verläufe), Lumisch Tag 1 bis 40 und die Antwortvarianten.
  - Werkzeug und Kit: 33 von 33. Die Kit-Prüfung von `pause` ist ohne Fehler.
- **CI (Lauf `37227070148`):** Die Tests laufen grün unter Linux, macOS und Windows (App-Berechtigungen), dazu Kern und Modul-Sandbox.
- **Windows-Probe (`37227070328`, Commit `809cf73` = `v0.4.1`):** grün beim ersten Lauf, 48 von 48 Angriffe blockiert, Wichteln meldet ins Spiel-Log.
- **Release-Build `37228090139`:** alle vier Plattformen und das Veröffentlichen sind grün.
- **Startseite im Browser:**
  - Bei 360 px laufen vier Karten untereinander, kein seitlicher Bildlauf (Seitenbreite 360).
  - Bei 1280 px stehen vier Karten nebeneinander.
  - „kommt“ steht an sechs Stellen.
- **Pause im Browser:** Rahmen über Kopf- und Tableiste geprüft (oberstes Element am Rand des Dialogs ist der Dialog selbst); Bild für Folie 2 aufgenommen.

## Vorrat
Der Vorrat reicht bis 31. Jänner 2027, 119 Tage ab heute. Die 45-Tage-Grenze wird am 17. Dezember erreicht.
