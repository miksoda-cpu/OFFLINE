# Rückmeldung: Antwortfeld beim Tagesrätsel, Lesemenge ab Februar, Wichteln lokal in der Probe – ausgeliefert mit 0.3.3

**Von:** Code (lokale Session) · **Datum:** 2026-10-04 · **Auftrag:** `bill/erledigt/2026-10-01-raetsel-eingabe.md` · **Branch:** `raetsel-eingabe` · **Tag:** `v0.3.3`

## Ergebnis
- **App 0.3.3 ist ausgeliefert** (`app/latest.json`, 04.10.2026, 10:43 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux sind abrufbar (HTTP 200).
- **Web-Version 0.3.3** mit Antwortfeld und den neuen Monatspaketen. Die gespiegelten Manifeste stimmen mit dem Katalog überein.
- **Katalog** (erstellt 04.10.2026, 09:55 UTC, Signatur geprüft). Neu sind die vier Tagespakete, `wir` und alle anderen Einträge sind unverändert:

| Paket | Version | Bereich | app_min | sha256 des Manifests |
|---|---|---|---|---|
| tage-2026-10 | 2026.10.04 | 01.10. bis 31.10.2026 | 0.3.0 | `09284ceb06935b9a510cc4811995c55b3895ab55f220559cf92280eed346ac6b` |
| tage-2026-11 | 2026.10.04 | 01.11. bis 30.11.2026 | 0.3.0 | `365d0f40b7d76036c259a83c0ce1d967be81bd7bfe2f542dec3d6eee39b72543` |
| tage-2026-12 | 2026.10.04 | 01.12. bis 31.12.2026 | 0.3.0 | `1a8807e68e3592545304694225d78d638396c10ed112d61d4b78ed6e5a17b93f` |
| tage-2027-01 | 2026.10.04 | 01.01. bis 31.01.2027 | 0.3.0 | `17875ea716de13f454b176866183d80e84b7f50a4b7ebb44f1813815860424bc` |

- **Deine sieben Tipps** sind abgenommen. Daran war nichts mehr zu tun, sie stecken seit 0.3.2 im Paket `wir`.

## 1. Antwortfeld
- **Auf der Rätselkarte:** Feld „Deine Antwort“ (beschriftet) mit dem Knopf „Prüfen“. Enter prüft auch. „Hinweis“ und „Lösung zeigen“ bleiben wie bisher.
- **Richtig:** „Richtig!“ mit Lösung und Erklärung, und die Karte ist erledigt. Die Bestätigung bleibt sichtbar, auch wenn damit der Tag fertig ist; sie steht dann über „Das war dein Tag“.
- **Falsch:** „Noch nicht. Magst du einen Hinweis?“, das Feld bleibt ausgewählt für einen neuen Versuch. Es gibt keine Zählung, keine Punkte und keine Serien. Auch die ganze Lösung als Satz eingetippt gilt als richtig.
- **Erklärrätsel** haben kein Feld, das sind 12 von 123:
  - `r-005` Lichtschalter, `r-008` Krüge, `r-016` Kisten
  - `r-018` drei Brote, `r-030` zwei Brüder, `r-037` Sirene
  - `r-039` Fuchs/Gans/Getreide, `r-046` Getränke, `r-057` Münzen
  - `r-104` Geschenke, `r-113` Sanduhren, `r-141` Schneefiguren
- **Prüfung lokal, ohne Netz** (`antwortRichtig` in `web/tag.js`):
  - Groß- und Kleinschreibung, Leer- und Satzzeichen spielen keine Rolle.
  - ä/ae, ö/oe, ü/ue und ß/ss gelten gleich.
  - Ziffer und Zahlwort gelten gleich, bis 9999, auch zusammengesetzt: „sechsundfünfzig“, „dreitausendsechshundert“.
  - Füllwörter am Anfang zählen nicht („die“, „ein“, „um“, „er hat“ …).
  - **Eine Erweiterung über deinen Auftrag hinaus:** Ist die gültige Antwort eine reine Zahl, darf ein Wort folgen. „12 Runden“ und „drei Grad“ gelten also; „120“ statt „12“ bleibt falsch.
- **Paketfeld `antworten`:** optional, wenn vorhanden eine nicht leere Liste von Texten (höchstens 20, je höchstens 120 Zeichen).
  - Der Kit-Prüfer kennt es, dazu `PAKETFORMAT.md`, `PAKET-KIT.md` und die Kopie im Kit.
  - 111 Rätsel von Oktober bis Jänner haben es jetzt.
  - Die Varianten sind großzügig: Synonyme wie Zündholz und Streichholz, Kamm, Säge oder Reißverschluss, Schi oder Ski, Versprechen oder Schweigen, Uhrzeiten wie „8:20“, „8 Uhr 20“, „20 nach 8“, und „dreiviertel 6“ für 5:45.
- **Neue Ausgaben** von `tage-2026-10` bis `tage-2027-01`:
  - Der Wortlaut der Rätsel ist unverändert, das ist gegen den alten Stand geprüft.
  - Die App lädt eine neuere Version eines installierten Monats von selbst nach.
  - Ältere Apps übergehen das Feld, weil weder der Prüfer noch der Kern unbekannte Felder ablehnen.

## 2. Lesemenge ab Februar
- `pakete/tage/bauen.mjs` bricht ab, wenn ein Tagesteil ab 1. Februar 2027 mehr als 3.700 Wörter hat. Das Ziel ist rund 3.500; die 200 Wörter Spielraum sind das „rund“.
- Die Regel steht in `bill/README.md`, Abschnitt „Tagespakete“.

## 3. Windows-Probe
- **Wichteln aus lokaler Quelle:** Seit Wichteln im Katalog steht, zeigt die Bibliothek nur noch die Katalogkarte, und „laden“ holte es aus dem Netz. Daher kam die Zeitüberschreitung im Lauf vom 01.10.
  - Jetzt spielt die Probe den Ordner `redaktion/freigegeben/wichteln-…` auf demselben Weg ein wie „Ordner wählen“ oder ein Datenträger.
  - Der Kern prüft dabei Signatur, Redaktionsschlüssel und jede Datei, ganz ohne Netz.
- **Dabei gefunden:** Die „Sandbox-Probe gegen Edge“ brach im ersten Lauf ab, obwohl der Bericht da war und alle 42 Angriffe blockiert waren.
  - Ursache war eine Abbruchuhr, die erst beim Schließen des Servers stoppte. Hält Edge eine Verbindung offen, passiert das nie.
  - Jetzt stoppt der Bericht die Uhr selbst. Behoben in `werkzeug/sandbox-probe.mjs`, lokal gegengeprüft: Ende nach 12 Sekunden.

## Geprüft
- **Tests:**
  - Web: 49 von 49. Neu sind die Vergleichsregeln, die Antwortlisten aller 123 Rätsel und das Feld `antworten` im Kit-Prüfer.
  - Getestet sind Groß- und Kleinschreibung, Ziffer und Zahlwort, Umlaute und ß, Füllwörter, Zahl mit Wort, falsche und leere Antworten.
  - Je Rätsel: Jede Variante passt zu sich selbst, keine Liste nimmt alles an, Erklärrätsel haben kein Feld.
- **CI (Lauf `37192780180`):** Die Tests laufen grün unter Linux, macOS und Windows (App-Berechtigungen), dazu Kern, Werkzeug, Kit und Modul-Sandbox.
- **Windows-Probe: grün erst im dritten Lauf (`37192779967`, Commit `ee3f9d6`, das ist auch der Stand von `v0.3.3`).** Beide Fehlschläge davor kamen aus der Prüfumgebung, nicht aus der App:
  1. **Lauf `37189554134`:** Die Sandbox-Probe gegen Edge brach trotz 42 von 42 abgewehrten Angriffen ab. Grund war die Abbruchuhr, behoben.
  2. **Lauf `37190533109`:** Wichteln aus der lokalen Quelle wurde abgelehnt. Ohne `.gitattributes` setzt der Windows-Checkout CRLF-Zeilenenden, dann stimmen die Prüfsummen nicht mehr, und der Kern lehnt zu Recht ab.
     - Jetzt sind `redaktion/freigegeben`, `web/pakete` und `web/katalog` von der Umwandlung ausgenommen.
     - Die Probe meldet eine Ablehnung künftig mit Grund.
  - Im grünen Lauf: Update von 0.1.8 auf 0.3.3, „Was ist neu“ mit 0.3.3 oben, 42 von 42 Angriffen blockiert. Wichteln kam in beiden Durchgängen aus der lokalen Quelle und wurde gespielt, gesperrt und gelöscht.
- **Release-Build `37195730172`:** alle vier Plattformen und das Veröffentlichen sind grün.
- **Durchlauf:** Die Test-App ist gebaut und gestartet. Die Bildschirmsteuerung war am Mac aber nicht verfügbar: Die Aufnahme schlug fehl, und die Freigabe für die Vollbildsteuerung kam nicht. Deshalb habe ich mit demselben Code in der Web-Version geprüft, mit den echten, signierten Paketen, bei 360 px:
  - Das Rätsel vom 4.10. (PALME) zeigt das Feld „Deine Antwort“.
  - „Birne“ mit Enter ergibt „Noch nicht. Magst du einen Hinweis?“, das Feld bleibt ausgewählt.
  - „palme“ mit „Prüfen“ ergibt „Richtig! PALME“ mit Erklärung, und die Karte ist erledigt.
  - Danach die Textkarte als gelesen markiert: Das gelöste Rätsel steht über „Das war dein Tag. Bis morgen.“
  - Nichts läuft seitlich über, Feld und Knopf sind 49 px hoch.
  - Den Durchlauf in der Desktop-App hole ich nach, wenn du am Mac die Vollbildsteuerung freigibst.

## Vorrat
Der Vorrat reicht bis **31. Jänner 2027**, 119 Tage ab heute (`werkzeug/vorrat-stand.mjs`). Februar muss spätestens am 1. Jänner oben sein, besser am 1. Dezember. Die 45-Tage-Grenze wird am 17. Dezember erreicht. Ab Februar gilt die Wortgrenze.
