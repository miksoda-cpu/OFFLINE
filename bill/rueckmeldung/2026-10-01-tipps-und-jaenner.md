# Rückmeldung: Tipps nach Grundsatz, Tagespaket Jänner, Regel „zwei Monate voraus“ – ausgeliefert mit 0.3.2

**Von:** Code (lokale Session) · **Datum:** 2026-10-01 · **Auftrag:** `bill/erledigt/2026-10-01-tipps-und-jaenner.md` · **Branch:** `jaenner` · **Tag:** `v0.3.2`

## Ergebnis
- **App 0.3.2 ist ausgeliefert** (`app/latest.json`, 01.10.2026, 20:13 UTC). Die Updater-Dateien für macOS (Apple Silicon und Intel), Windows und Linux sind abrufbar (HTTP 200).
- **Web-Version 0.3.2** mit „Was ist neu“, den bereinigten Tipps und dem Jänner. Die gespiegelten Manifeste stimmen mit dem Katalog überein.
- **Katalog** (erstellt 01.10.2026, 20:01 UTC, Signatur geprüft). Neu sind `tage-2027-01` und `wir`, alle anderen Einträge sind unverändert:

| Paket | Version | Bereich | app_min | sha256 des Manifests |
|---|---|---|---|---|
| tage-2027-01 | 2026.10.01 | 01.01. bis 31.01.2027 | 0.3.0 | `d9d952e8449032ba996c3779c80ddd6a0381067fb892e5fb3e9d41289112c341` |
| wir | 2026.10.01 (vorher 2026.09.30) | – | 0.2.0 | `0efc640dcf53cd9cbf10cdd419a8ec8abc8ef4908c3adf4dad429ea7997a9bf8` |

- **Vorrat:** reicht bis **31. Jänner 2027**, 122 Tage ab heute (`werkzeug/vorrat-stand.mjs`). Februar muss spätestens am 1. Jänner oben sein, besser am 1. Dezember. Die 45-Tage-Grenze wird am 17. Dezember erreicht.
- **Ältere Apps (0.2.0 bis 0.3.1)** bekommen das neue `wir` auch. Sie kennen `funktion` nicht und lassen diese 19 Tipps weg, so wie gewollt.

## 1. Tipps nach dem Grundsatz
Grundsatz: Ein Tipp behauptet nie etwas, das die App nicht weiß, und nennt keine Funktion, die es nicht gibt. Paket `wir` hat jetzt 175 Tipps. Gebaut wird es mit `pakete/wir/tipps-umwandeln.mjs` (Tabellen `KORREKTUR`, `WEG`, `FUNKTION`).

**Wie entschieden:**

| Tipp | jetzt |
|---|---|
| `laune-006` | „Ob es intelligentes Leben da draußen gibt? Wer im Blackout dreimal die Kühlschranktür aufmacht, um zu sehen, ob der Strom noch weg ist, ist jedenfalls gründlich. Ich enthalte mich.“ |
| `laune-015` | „Ein Häkchen bei Bereit dauert eine Sekunde. Ich sage es nur. Ich meine es nicht böse. Ich meine es nie böse.“ |
| `alltag-039` | „Über 80. Du bist ruhig, ich bin ruhig. Jetzt ist die Zeit für die Nachbarin, die vielleicht noch nicht so weit ist.“ |
| `alltag-004` | „Ein Nachbar, den du im Notfall fragen kannst, und ich bin ruhiger. Man muss ihn nicht mögen. Man muss wissen, wo er wohnt.“ Die App kennt eine Bereit-Position „Nachbar“, nicht zwei. |
| `laune-010` | gestrichen |
| `alltag-001`, `alltag-003`, `alltag-014` | Die Punktzahl heißt jetzt „hebt deine Bereit-Zahl“. |
| `app-005` | „Der Vorrat unten auf der Tagesseite zeigt, wie viele Tage Rätsel und Kapitel schon da sind. Wie weit die App vorlädt, stellst du im Tagesplan ein. Ohne Netz geht es weiter, bis er leer ist.“ |
| `app-010` | „Der Sparmodus im Tagesplan lässt mich auf der Tagesseite weg. Dann ist es dort ruhiger. Ein Haken, und ich bin wieder da.“ |
| `app-020` | „Das Kapitel des Tages liest dir die App vor. Der Knopf „Vorlesen“ steht oben in der Leseansicht.“ |

**Neues Bedingungswort `funktion`:**
- `web/wesen.js` hat die Liste `FUNKTIONEN`, also das, was diese App-Version kann:
  - Tagesseite, Tagesplan, Vorrat, Vorlesen, Sparmodus, Schluss
  - Tresor, Notfallmappe, Bereit
  - Bibliothek, Karte, Werkzeuge, Radio
  - Module, Skins, Updates, Was ist neu, Lumi
- Ein Tipp mit `funktion` kommt erst, wenn alle genannten Funktionen in der Liste stehen. Kommt eine Funktion dazu, genügt ein Eintrag in die Liste, und ihre Tipps erscheinen.
- Ältere Apps kennen das Wort nicht und lassen diese Tipps weg.
- Deine Liste, alle mit `funktion`:

| Tipp | wartet auf |
|---|---|
| `app-002` | Wischen |
| `app-003` | Knopf „Was ist los?“ |
| `app-006` | Briefe, die sich öffnen |
| `app-014` | Kalender |
| `app-015` | „Wohin“ |
| `app-016` | Tagebuch |
| `app-017` | Schließfach |
| `app-018` | Schließfach und Tagebuch |
| `app-019` | Kontrast-Skin |
| `app-024` | Familiennachricht |
| `app-026` | Offline-Stunde |
| `app-028` | Mesh |
| `app-029` | Fernschach und Mesh |
| `app-033` | „Wohin“ |
| `alltag-023` | Zettel drucken |

**Selbst gefunden und nach demselben Grundsatz behandelt.** Der neue Test hat sie aufgedeckt, bitte gegenlesen:

| Tipp | Problem | jetzt |
|---|---|---|
| `app-004` | „Unter Einstellungen steht ‚gelernt‘“: Diese Ansicht gibt es nicht. | wartet auf `gelernt` |
| `app-013` | „Die Karte deiner Region lädst du einmal …“: Kartenpakete sind im Katalog erst „geplant“. | wartet auf `karte-offline` |
| `app-031` | „Am ersten Jänner kommen neue Bücher in die Bibliothek“: Ein solches Paket gibt es nicht. | wartet auf `neujahr-buecher` |
| `digital-030` | „Frag noch einmal. Mich zum Beispiel.“: Die Lumi kann keine Fragen beantworten. | wartet auf `fragen` |
| `laune-002` | „Du hast mich geweckt.“: Die App weiß nicht, ob jemand sie geweckt hat. | „Wenn du mich weckst, sag ich nichts Kluges. Nur damit du es weißt.“ |
| `laune-007` | „Du wischst schnell heute.“: Das misst die App nicht. | „Wer schnell wischt, dem rede ich langsamer. Einer von uns muss.“ |
| `app-025` | Wortlaut in Beilage A5: Man trägt sie selbst ein. | „Unter Werkzeuge trägst du die Frequenz deines Radiosenders ein. Schreib sie trotzdem auf Papier. Papier braucht keinen Akku.“ |

Insgesamt warten damit 19 Tipps auf eine Funktion.

**Test** (`web/wesen.test.mjs`):
- Zu jeder Funktion gibt es ein Erkennungsmuster für den Tipptext.
- Jeder Tipp, der eine Funktion nennt, findet sie in `FUNKTIONEN` oder hat eine `funktion`-Bedingung.
- Jede `funktion`-Bedingung nennt eine bekannte Funktion.
- Die 15 Tipps aus deiner Liste kommen heute nicht.
- Keine alten Punktzahlen mehr.
- Gegenprobe: Solange `app-018` und `app-029` nur eine ihrer zwei Funktionen als Bedingung hatten, schlug der Test fehl.
- Eine neue Funktion in einem neuen Tipp braucht ein Muster im Test. Das steht als Hinweis im Test.

## 2. Tagespaket Jänner 2027 (`tage-2027-01`)
- **31 neue Rätsel** (`r-132` bis `r-162`), 22 leicht und 9 mittel. Keine Frage und keine Lösung aus Oktober bis Dezember wiederholt sich, maschinell geprüft und als Test festgeschrieben. Jede Lösung ist nachgerechnet.
  - Winter und Jahresanfang: Eiszapfen, Rodelhang, Sternsinger am 6. Jänner, Neujahrskonzert, Schi, Fasching, Turmuhr.
- **1. bis 3. Jänner nur Rätsel**, denn der erste Montag ist der 4. Jänner.
- **Vier Lesewochen.** Alle Werke sind deutsch im Original, die Autoren vor 1956 gestorben, die Texte auf Wikisource im Stand „fertig“ mit Scans der Vorlage:

| Woche ab | Werk | Autor († Jahr) | Vorlage | Wörter pro Tag |
|---|---|---|---|---|
| Mo 4.1. | Der Condor | Adalbert Stifter († 1868) | Studien, Bd. 1, 6. Auflage, Heckenast, Pest 1864 (Studienfassung) | 700 bis 1.300 |
| Mo 11.1. | Mozart auf der Reise nach Prag | Eduard Mörike († 1875) | Gesammelte Schriften, 2. Band, Göschen, Stuttgart 1878 | 2.750 bis 2.900 |
| Mo 18.1. | Die schwarze Spinne | Jeremias Gotthelf († 1854) | Bilder und Sagen aus der Schweiz, 1. Band, Jent & Gaßmann, Solothurn 1842 (Erstausgabe) | 4.200 bis 4.400 |
| Mo 25.1. | Unterm Birnbaum | Theodor Fontane († 1898) | Die Gartenlaube 1885, Heft 33 bis 41, Ernst Keil, Leipzig (Erstdruck) | 4.000 bis 5.200, kapitelweise |

  - **Stifter:** Der Österreicher eröffnet das Jahr, und der Condor ist die kürzeste Woche.
  - **Gotthelf und Fontane** sind so lang wie der Schimmelreiter im Oktober. Ist dir das für den Winter zu viel, kann ich eine kürzere Woche einsetzen.
  - **Winterstoffe:** Echte Winterstoffe mit geprüfter Ausgabe gab es kaum, die gewünschten fehlen alle. Gewählt habe ich deshalb nach Abwechslung: Österreich, Musik, Sage, Kriminalfall.
- **Nicht aufgenommen, weil auf Wikisource keine fertige Transkription vorliegt:**
  - Grillparzer, „Der arme Spielmann“
  - E. T. A. Hoffmann, „Das Fräulein von Scuderi“
  - Kleist, „Michael Kohlhaas“
  - Storm, „Die Regentrude“
  - Ebner-Eschenbach, „Krambambuli“
  - Bergkristall und die übrigen Titel vom Dezember bleiben draußen, wie beschlossen. Bot-Sperren habe ich keine umgangen.
- **Holwerkzeug** (`werkzeug/wikisource-holen.mjs`) kann jetzt:
  - Kapitelseiten mit `{{Navigation}}`, die Textdaten kommen dabei von der Werkseite.
  - Fortsetzungsromane der Gartenlaube, mit dem Heft als Vorlage.
  - Gedichte mit Schriftauszeichnung (Mörikes Schlusslied).
  - Den Bearbeitungsstand in Groß- und Kleinschreibung.
  - Ohne leere Absätze und Klammerreste.
- **Die veröffentlichten Monate Oktober bis Dezember sind bytegleich geblieben.**

## 3. Regel „zwei Monate voraus“
- **Steht in `bill/README.md`:**
  - Spätestens am 1. des Vormonats im Katalog, besser zwei Monate voraus.
  - Jede Release-Rückmeldung nennt, bis wann der Vorrat reicht.
  - Unter 45 Tagen meldet sich Code von selbst mit einem Vorschlag.
- **Neues Werkzeug `node werkzeug/vorrat-stand.mjs`:** Es prüft die Signatur des öffentlichen Katalogs, sucht die lückenlose Kette der Tagespakete ab heute und nennt den letzten Tag. Unter 45 Tagen gibt es einen Hinweis aus.
- Ich habe mir die Regel auch für künftige Sessions gemerkt.
- Stand heute: Der Vorrat reicht bis 31. Jänner 2027, das sind 122 Tage. Die 45-Tage-Grenze wird am 17. Dezember 2026 erreicht. Vorher meldet sich Code mit einem Vorschlag für Februar.

## Geprüft
- **Tests:**
  - Web: 46 von 46. Neu sind der Funktionstest, der Test gegen alte Punktzahlen und Behauptungen ohne Wissen sowie der Jänner-Test (31 Rätsel ohne Wiederholung von Frage oder Lösung, vier Werke ab Montag, 28 Kapitel, keine leeren Absätze und keine Titelzeilen).
  - Werkzeug, Paket-Kit und Rust-Kern sind grün. Die Kit-Prüfung für `tage-2027-01` lief mit Exit 0.
- **CI (Lauf `36911176198`):** Die Tests laufen grün unter Linux, macOS und Windows (App-Berechtigungen), dazu die Modul-Sandbox.
- **Windows-Probe:**
  - **Erster Lauf `36911173315`: rot.**
    - Update von 0.1.8 auf 0.3.2, Tagesseite, „Was ist neu“ mit 0.3.2 oben und 42 von 42 abgewehrten Angriffen waren grün.
    - Gescheitert ist „Wichteln geladen“ an einer Zeitüberschreitung nach 60 Sekunden. Die Probe lädt Wichteln aus dem Online-Katalog.
    - Im selben Lauf lieferte der externe kiwix-Download mehrmals 404, das spricht für Netzprobleme im Runner.
    - Meine Änderungen berühren das Laden von Modulen nicht.
  - **Zweiter Lauf `36915338062` auf demselben Commit `2dc76ba`: grün.** Erst danach habe ich zusammengeführt und veröffentlicht.
  - Kommt die Zeitüberschreitung wieder, baue ich für die Probe eine lokale Quelle für Wichteln ein, damit sie nicht am Netz hängt.
- **Release-Build `36918650741`:** alle vier Plattformen und das Veröffentlichen sind grün.

## Offen
- **Von Mik, am 01.10. beim Ausprobieren:** „ich konnte beim tagesrätzel keine zahl eingeben!“
  - Das Rätsel hat seit 0.3.0 kein Eingabefeld, sondern nur „Hinweis“ und „Lösung zeigen“, so stand es im Auftrag zur Tagesseite.
  - Mik fragt dich, ob ein Antwortfeld kommen soll. Ich habe nichts gebaut.
  - **Mein Vorschlag:** ein Feld „Deine Antwort“. Bei Zahlen und Ein-Wort-Lösungen sagt die App „Richtig“ oder „Noch nicht“. Bei Lösungen in Sätzen steht die eigene Antwort beim Aufdecken neben der Lösung.
  - Dafür bräuchte jedes Rätsel ein optionales Feld `antwort` mit den gültigen Kurzformen, zum Beispiel `["8:20", "20 nach 8"]`. Ältere Pakete bleiben gültig und zeigen dann nur den Vergleich.
