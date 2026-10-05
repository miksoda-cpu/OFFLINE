# Änderungen

## 0.5.5 · 05.10.2026 · Nach neuer Version suchen im Web, Hilfetexte richtiggestellt

- **Nach neuer Version suchen am iPad, iPhone und im Browser** (Auftrag 2026-10-05-06): Die Zeile „App 0.5.x · …“ mit dem Knopf steht jetzt auch in der Web-Version (`webUpdateZeile`). Der Knopf fragt `/version.json` ab (`cache: "no-store"`, Zeitstempel in der Adresse; der Service Worker lässt die Datei durch und speichert sie nie). Drei Fälle (`webVersionPruefen` in `web/neuigkeiten.js`): gleich „Du hast die neueste Version (0.5.x).“, neuer „Version 0.5.y ist da.“ mit „Jetzt laden“ (`registration.update()`, warten bis der neue Worker aktiv ist, neu laden; Daten bleiben), ohne Netz „Gerade kein Internet. Die App läuft weiter mit 0.5.x.“ Beim Öffnen und beim Zurückkehren in die App prüft die Web-Version still, höchstens einmal am Tag und nur mit Netz; ist eine neue Version da, steht der rote Punkt bei „Updates & Abo“. `web/version.json` muss gleich `APP_VERSION` sein (Test). Service Worker `offline-v23`.
- **Hilfetexte** (Auftrag 2026-10-05-07): 14 Antworten Wort für Wort ersetzt, zwei Fragen neu (pause-linie 7 „Was sagt Pause über die Wirkung?“ ohne Wirkversprechen, lumi-buch 6 „Wie öffne ich das Buch?“). Bei Updates die Frage „Wie bekomme ich die neue App-Version?“. Tests lesen beide Aufträge.

## 0.5.4 · 05.10.2026 · Moduldaten beim Sperren, Info und Hilfe überall, Lumisch 500, drei Buch-Absätze

- **Fehler behoben (Datenverlust seit 0.2.0):** `tresor_sperren` löschte `<Datenordner>/module` mit dem Speicher jedes Moduls und `zustand.json`. Jedes Sperren (Zeit, Minimieren, Beenden) nahm Spielstände und Listen und schaltete Module ab. Die Zeile kam mit der Sandbox (2436fc8); gemeint war nur, offene Modulserver zu stoppen. Jetzt `sperren(&Zustand)`: Schlüssel weg, Modulserver stoppen, Moduldaten bleiben. Rust-Test `tresor_sperren_behaelt_moduldaten` (in der CI). Die Moduldaten waren nie verschlüsselt und nie an den Tresor gebunden.
- **Info und Hilfe** (Auftrag 2026-10-05-04): Bills Texte Wort für Wort in `web/hilfe.js` für Tresor (nur Desktop), Bibliothek, Bereit, Deine Linie, Lumi, Werkzeuge, Lumi-Buch; als letzte Zeile der Seite (zentral in `render()`), bei Bereit und Lumi am Ende ihres Abschnitts in der Übersicht. Notfall ohne. Test gegen den Auftrag.
- **Paket `pause` 2026.10.05.1** (Nachtrag 2026-10-05-05): Lumisch mit 500 Wörtern; neue Gruppen, Nachträge in ihrer Stammgruppe hinten angereiht; Reihenfolge: Unten (mit Pilzsorten und Höhlenstimmungen), Wie etwas ist, Farben, Gefühle, Oben: Strom, Notfall, Familie, Kleine Wörter, Zahlen, Lange Zahlen, Gespräch, Zeit, Oben, Philosophie, Zahl und Quant. `tep` nach je drei Ziffern.
- **Paket `lumi-buch` 2026.10.05.2:** b1-09-01, b1-11-01 und b1-11-05 neu gefasst (Session „die lumis“), Wort für Wort aus `quelle/neufassung-2026-10-05.json`; Nummern, Zuordnung, Hinweis bleiben.

## 0.5.3 · 05.10.2026 · Lumisch auf geprüftem Stand, Hinweis im Lumi-Buch

- **Paket `pause` 2026.10.05** (Auftrag 2026-10-05-03): Lumisch aus der Beilage der Wortprüfung vom 05.10.2026 (`pakete/pause/quelle/`, übernommen mit `pakete/pause/lumisch-umwandeln.mjs`). Plan nach Abschnitt 8 (Tag 3 `pelu` = Essen, Tag 6 `kiv`, Tag 7 Wiederholung mit kiv). Wörterbuch mit allen 401 Wörtern, je Gruppe, Deutsch, Hinweis, Beispiel nur aus den Beispielsätzen der Beilage; Reihenfolge für neue Wörter: Unten, Wie etwas ist, Farben, Gefühle, …, die Philosophie-Gruppen und „Zahl und Quant“ zuletzt. Kit prüft `hinweis`.
- **Ersetzte Wörter** (kir, kirzan, kirmulo, kirtem, nik, tisunik, kus, kon, pipi, mumu → kiv, kivzan, kivmulo, kivtem, lim, tisulim, pur, kopu, tirli, muvo): nur noch in der Zuordnung `LUMISCH_ALT` (`web/pause.js`). Im Spiel-Log gelten alte Wörter als die neuen; wer eines gelernt hat, sieht einmal „Neu heißt es kiv. Gleiches Eis, anderer Klang.“ (`lumischUmbenannt`). Neue Wörter zeigen ihren Hinweis.
- **Tests:** Paket gegen Beilage (401, keine Doppelten, kein altes Wort, Plan), kein ersetztes Wort in App, Paketen und Tests, `kir`-Lernende verlieren nichts und sehen die Karte genau einmal.
- **Paket `lumi-buch` 2026.10.05.1:** `hinweis` nur noch „Eine erfundene Geschichte.“ (Mik, 05.10.: die Quantenwelt ist in der Welt der Lumis wirklich). Text der Kapitel unverändert.

## 0.5.2 · 05.10.2026 · Seite „Updates & Abo“ aufgeräumt

- **Neue Reihenfolge** (Auftrag 2026-10-05-updates-seite): Stand (ein Satz, „Jetzt prüfen“, verfügbare Updates, am Desktop die App-Version mit „Nach neuer Version suchen“) · Was ist neu · Einstellungen (zugeklappt, mit Zeile zum aktuellen Stand; Wie oft?, Update-Abo, Nur im WLAN, Zeitfenster, am Desktop Speicherort) · Werkzeuge (Offline-Bereitschaft, Als App installieren) · Info und Hilfe · Daten löschen (abgesetzt mit Haarlinie, doppelt gesichert wie bisher). Signatur- und Schlüsseldetails und der lange Satz am Ende sind weg; die Meldung nach „Jetzt prüfen“ ist kurz.
- **Was ist neu** in einem Block: Reiter App (`web/neues.json`) und Inhalte (Änderungen im Katalog), je drei Einträge, „Alle anzeigen“ im Blatt.
- **Roter Punkt** am Block, am Reiter und am Menüpunkt „Updates & Abo“, solange etwas nicht angesehen ist (`web/neuigkeiten.js`); weg nach dem Ansehen des Reiters. Keine Zahl, kein Abzeichen. Wer neu ist, bekommt keinen Punkt für alte Paketänderungen.
- **Das Blatt** (`web/blatt.js`): am Handy von unten, ab 821 px als Fenster in der Mitte, eigener Bildlauf (`overscroll-behavior: contain`), ✕, Escape und die Zurück-Taste schließen. Seite dahinter gesperrt.
- **Info und Hilfe** (`web/hilfe.js`): Bills zehn Fragen nach ASD-STE100, als Blatt. Muster für weitere Seiten.
- Tests `web/neuigkeiten.test.mjs` (in der CI), Windows-Probe prüft die Seite und das Blatt.

## 0.5.1 · 05.10.2026 · Nacharbeiten zu 0.4.2 bis 0.5.0

- **`wir` still nachladen** (Auftrag 2026-10-05-01): Fehlt `buch` in den installierten Tipps, holt die App beim Start einmal die neuere Ausgabe aus dem Katalog. Bestehende Nutzer sehen „Aus dem Lumi-Buch“ sofort.
- **Absätze, die heute niemand erreichen kann:** `wartendeAbsaetze` in `web/buch.js` berechnet sie aus den Bedingungen der Tipps (alle Tipps eines Absatzes warten auf eine Funktion, die `FUNKTIONEN` nicht hat). Stand 0.5.1: zwölf. Ihre Lücken sagen „Dieses Stück erzählt sie, sobald OFFLINE so weit ist.“ Test gegen eine feste Liste im Code.
- **Schlussstück** `b1-12-06` wird frei, sobald die anderen fünf Absätze von Kapitel 12 gelesen sind (`mitSchluss`, auch für schon gelesene Stände).
- **Paket `lumi-buch` 2026.10.05:** ein Satz in `b1-12-06` nach Bills Entscheidung („geht man ein Stück weiter“ statt der Wischgeste), als `KORREKTUR` im Umwandler; die Vorlage bleibt.
- **Startseite:** „Für bis zu 5 Personen in einem Haushalt“; unter den Preiskarten „Pro und Pro+ kann man buchen, sobald die App erscheint. Bis dahin ist alles gratis.“; der Anmeldesatz trägt „Bald“ wie die Karte daneben. Test in `web/neues.test.mjs`.
- **Große Schrift:** `.switch`-Zeilen (Radio in Werkzeuge) brechen um, lange Wörter in den Notrufkarten werden getrennt. Bei 16, 20 und 24 px auf zwölf Seiten kein seitlicher Bildlauf.
- **`bill/STATUS.md`** aufgeräumt.

## 0.5.0 · 04.10.2026 · Das Lumi-Buch

- **Paket `lumi-buch`** (neu, Art `inhalt`, `app_min` 0.5.0, Auftrag 2026-10-04-lumi-buch-app): Band 1, zwölf Kapitel, 127 Absätze `b1-KK-PP`, Titelseite mit „Eine erfundene Geschichte“ (Anwaltsfrage 35). Gebaut aus der freigegebenen Vorlage mit `pakete/lumi-buch/buch-umwandeln.mjs`, Format `paket-kit/buch-format.mjs`; Band 2 kann als eigenes Paket mit `band: 2` folgen. Wird bei der Erstinstallation und still bei bestehenden Nutzern geladen.
- **Paket `wir`:** Feld `buch` bei allen 175 Tipps aus der Zuordnung von Bill (`pakete/lumi-buch/quelle/OFFLINE-Lumi-Buch-Zuordnung.json`), sonst unverändert.
- **„Aus dem Lumi-Buch“** (`web/buch.js`, `tippKnoepfeHtml` mit `buch`): zarter Textlink unter jedem Satz der eingeschalteten, benannten Lumi und an jedem Logeintrag; nicht bei Textkarten, nicht bei „Tipps aus“. Öffnet den Absatz in einer ruhigen Leseansicht (`#absatz`, Serif, Kapitelname, nur ✕ und „Zurück“). Erst das Öffnen schaltet frei (`lumi-buch-frei` am Gerät); Logeinträge aus der Zeit davor gelten nicht als gelesen.
- **Das Buch** (`#buch`, aus Übersicht und Bibliothek): „Band 1 · N % lesbar“ ohne Balken, Kapitel in Reihenfolge, fehlende Absätze als stille Lücke „Dieses Stück hat dir deine Lumi noch nicht erzählt.“ (mehrere hintereinander als eine), Vorlesen wie beim Roman. Keine Liste fehlender Tipps, kein Hinweis aufs schnellere Freischalten.
- **Kit:** `pruefen.mjs` kennt `inhalt/buch.json` und prüft beim Paket `wir`, dass jede `buch`-Nummer im Buch daneben existiert, beim Buch, dass jeder Absatz einen Tipp hat. Test `web/buch.test.mjs` (in der CI): alle 175 Tipps zeigen auf einen vorhandenen Absatz, jeder Absatz hat mindestens einen Tipp, Freischalten, Prozent, Lücken, Link-Regeln, kein Druck.

## 0.4.3 · 04.10.2026 · Zart für die ganze App

- **Grundlage** (Auftrag 2026-10-04-stil-zart-app): die Werte aus dem Pause-Umbau (`--z-*`, `--eis*`) gelten in der ganzen App (`.of-app`), die Startseite bleibt. Hauptknopf `.btn-primary` als zartes hellrotes Feld ohne Schatten (12,5 px, 500), Nebenknopf `.btn` als Haarlinien-Feld, Tippfläche 44 px. Karten weiß ohne Rand mit kaum sichtbarem Schatten (Bühne Heute ebenso). Überschriften in leichter Serif (h1 300, h2 und h3 400), `strong` 600, nichts schwerer als 600 außer den Notrufnummern; Bereit-Zahl groß und leicht (300). Fortschrittsbalken 4 px, Segment-Wahl und Filter als Haarlinien mit hellrotem Gewählt, Schieber feiner (40 × 22), Hinweis und Lösung beim Rätsel mit Haarlinie statt Kasten, Lumi-Einladung auf Eisblau statt dunkel.
- **Je Bildschirm ein Hauptknopf:** „Bestätigen“ in Übersicht, „Installieren“ je Paket und „Offline-Bereitschaft prüfen“ sind Nebenknöpfe.
- **Notfall bleibt deutlich:** Nummern 800 und rot, Karten mit sichtbarer Kante, Überschriften in der Grundschrift 600.
- **Kontrast 4,5 : 1** hell und dunkel, als Test (`web/stil.test.mjs`, in der CI): Textfarben auf ihren Flächen, Kachel-Untertitel (Deckkraft .62 → .74), Lumi-Sorte (`--lumi-ton` statt #d06a1f), Skin Flechte. Dazu prüft der Test die Schriftgewichte und die Knopfwerte.
- **Skin Flechte** (lokal, nicht veröffentlicht): gleiche Grundwerte (Knöpfe zart in Moos, Karten ohne Rand, Titel 500 – Alegreya liegt nur in 500 und 700 bei), vier Farben etwas dunkler bzw. heller für 4,5 : 1 (`tinte-3` hell und dunkel, Mohn, Hahnenfuß, Ziegel).
- **Große Schrift:** Kacheln und Raster (`minmax(0, 1fr)`, `min(260px, 100%)`) und das Zeitfenster brechen um statt überzulaufen.

## 0.4.2 · 04.10.2026 · Pause bekommt einen Raum, Startseite ehrlich

- **Raum „Pause“** (`#pause`, Auftrag 2026-10-04-pause-umbau): in der Seitenleiste unter „Heute“, am Handy in der Tableiste statt „Bibliothek“ (die liegt unter „Mehr“; weiter fünf Plätze). Oben der Vorschlag des Dirigenten (bleibt stehen, bis sich etwas ändert), darunter alle gebauten Formen als Haarlinien-Liste mit Dauer bzw. Stand (`raumFormen`, `dauerText` in `web/pause.js`); wartende Formen fehlen, was gerade nicht geht, steht mit Grund da („ab 18 Uhr“). Unten „Deine Linie“ und die Einstellungen. Übersicht und Bibliothek verweisen in den Raum.
- **Einschalten in einem Schritt:** zwei Sätze und fünf Altersknöpfe; ein Tipp schaltet ein, lädt bei Bedarf das Paket und startet den ersten Happen. „Unter 14“ zeigt den Hinweis.
- **Kein Fenster über Heute:** `happenRahmen` ist weg. Beim Öffnen (gleiche Regeln: einmal je Öffnen, Appetit, 10 Minuten, nie im Notfall) steht oben auf Heute eine Eisblau-Karte mit Name, Dauer, „Spielen“, „Andere Pause“ und „später“; wegwischbar.
- **Fokus-Bildschirm** (`happenFokus` in `web/pause-happen.js`, Route `#happen`): füllt den Inhaltsbereich, am Handy den ganzen Schirm; oben ✕, drei feine Striche, Name der Form; genau ein Hauptknopf. ✕, Escape und Zurück im Browser zählen als abgebrochen und führen dorthin zurück, wo man herkam. Ende: Mitnehmen-Satz, drei Bewertungsfelder in einer Reihe, „Noch einen“ und „Zurück zu Heute“/„Zurück zur Pause“; Schwierigkeitsfrage und Rückfrage bleiben. Die Lumi meldet sich im Happen nicht dazwischen.
- **Uhrzeit:** „Der Tag rückwärts“ nie vor 18 Uhr, auch nicht nach einem früheren Tagesschluss (war der Fehler um 14:30). Das Atemfenster ist nie der erste Vorschlag des Tages (`WERTE.nichtAlsErstes`). Tests dazu.
- **Kurze Eingaben:** „Der Tag rückwärts“ ohne Textfeld, mit „Ich hab's“; Vermutung beim Roman einzeilig; Antwortfelder einzeilig.
- **Zart** (Punkt 8): Variablen `--z-*`, `--eis*` in `web/styles.css` (hell und dunkel); Hauptknopf helles Rot mit roter Schrift (12,5 px, 500, 6 × 11, Rundung 6), Nebenwege grauer Text mit Haarlinie, Wahl- und Bewertungsfelder mit Haarlinie, Überschriften in leichter Serif, ✕ mit 1,2 px Strich; Tippflächen bleiben 44 px. Gilt vorerst für Pause; die App folgt mit 0.4.3.
- **Startseite** (Auftrag 2026-10-04-webseite-ehrlich): Startbild und Seitenbeschreibung ohne KI-Assistent und „lokale KI“, stattdessen Tagesseite, Notfall, Vorsorge, Tresor, Lumi, Pause. Bibliothek „Wikivoyage auf Deutsch. Wikipedia und Wiktionary kommen.“; „kommt“ bei Karten, Österreich-Paket nach Bundesland, Gratis-Liste (Karte und Wikipedia), Pro (Bundesland, RIS), Gemeinde (zentral verwaltete Updates); Gratis-Karte „Wikivoyage, Österreich-Paket Grundversion“ mit „Wikipedia und Karte kommen“; Satz über den Preiskarten.

## 0.4.1 · 04.10.2026 · Preise, Pause-Nachtrag

- **Startseite:** vier Stufen nach Miks Beschluss vom 04.10. (Gratis 0 €, Pro 7,90 €/Monat oder 79 €/Jahr, Pro+ Familie 19,90 €/Monat oder 199 €/Jahr, Gemeinde · Schule · Betrieb ab 590 €/Jahr), Satz zum Schließfach, Kurse raus (Kachel „Die Lumi“ statt „Kurse“), „kommt“ bei Schließfach, Kinder-Modus und KI-Assistent. Untereinander bei 360 px, zwei mal zwei ab 640 px, vier nebeneinander ab 1100 px. `docs/KONZEPT.md`, `docs/GHOST-SETUP.md`, `web/datenschutz.html` (Lizenzschlüssel für Pro und Pro+) nachgezogen. Keine Zahlung eingebaut.
- **Pause, Rückspiegel:** keine Tageszählung mehr; nur Fortschritt, sonst Lieblingsformen in Worten ohne Zahl, sonst keine Karte. Test gegen jede Zählung.
- **Pause, Lumisch ab Tag 22:** Wiederholung an zwei von drei Tagen (aus dem Kopf, zuletzt Falsches zuerst), neues Wort an jedem dritten aus dem Wörterbuch nach Gruppen (`lumischHeute`); Wörterbuch im Paket `pause` vorerst nur mit Plan- und Beispielsatz-Wörtern (37), auch die Ablenkwörter. Test Tag 1 bis 40.
- **Pause, Rahmen:** liegt jetzt über Kopf- und Tableiste (am Handy verdeckten sie in 0.4.0 den Dialog). Folie 2 im Paket ist ein echtes Bild.

## 0.4.0 · 04.10.2026 · Pause, Stufe 1

- **⏸ Pause** (`docs/PAUSE.md`): Happen beim Öffnen (30 s bis 3 min), höchstens einmal je Öffnen, 10-Minuten-Regel, Appetit 1/3/6 Angebote je Tag, nie im Notfall, nach dem Tagesschluss nur „Der Tag rückwärts“. Ein- und ausschalten in Übersicht › Pause und Bibliothek › Module, standardmäßig aus, unter 14 nicht angeboten.
- **Acht Formen** (`web/pause-happen.js`): Wo war der Pilz? (Tempo, Zone, Auffrischung nach 11 und 35 Monaten vorgemerkt), Der eingebaute Fehler, Lumisch, Was kommt als Nächstes?, Türsteherfrage, Der Tag rückwärts, Zeitgefühl, Atemfenster; fünf weitere warten mit `bedingung.funktion`. Kein Falsch-Ton, „Schau, so war's“.
- **Dirigent ohne KI** (`web/pause.js`, Startwerte `web/pause-werte.js`): Mischung Vertraut/Verwandt/Neu mit Regler, Gewicht, Lebensabschnitt, Wochenausgleich, Zone 2 (75–85 %), Kennenlernen 21 Tage, Rückfragen höchstens einmal am Tag bzw. je Woche.
- **Bewertung und „Deine Linie“** (`#linie`): Mehr davon · Passt · Nicht mehr, bei jedem fünften Happen Zu leicht · Genau richtig · Zu schwer; Balken, Ausschlüsse mit Zurückholen, Stufen, Wochensatz, Auffrischung, Info zur Wirkung (nur erlaubte Sätze), Zurücksetzen. Rückspiegel einmal im Monat in Worten.
- **Spiel-Log am Gerät:** Pause, Tagesrätsel und Module (`offline.spiel.melden` / `.liste`, geprüft in `web/modul-host.js`: feste Arten, flache Werte, 1 kB, kein Modul-Feld, 10 je Minute; Liste nur eigene Einträge). Testmodul mit sechs neuen Angriffen (48). Wichteln 2026.10.04 meldet eine ausgeloste Runde.
- **Paket `pause`** (neu, `app_min` 0.4.0) mit Format im Kit (`paket-kit/pause-format.mjs`, `pruefen.mjs`, `PAKET-KIT.md` 5d).
- **Paket `wir`:** `app-011` ohne die Kategorie „Wissen“, `app-012` wartet auf `wikipedia-varianten`, `app-030` auf `export`; Liste der wartenden Tipps in `docs/WESEN.md`.

## 0.3.4 · 04.10.2026 · Lumi-Sätze führen irgendwohin

- **Knöpfe je Sorte** unter jedem Satz der Lumi (Sprechblase, Meldung, Textkarte): App „Zeig mir“ (mit `ziel`), Alltag „Mach ich“ (Vorhaben in Vorsorge, ändert Bereit nicht), Wissen „Merken“ (Heft), Digital „Zeig mir“ oder „Merken“; Weisheit und Laune nur Bewertung (`tippAktion`, `tippKnoepfeHtml` in `web/wesen.js`).
- **Bewertung** „Mehr davon · Passt · Nicht mehr“ statt „Gelesen / Weglegen“, ✕ schließt ohne Bewertung. Gewicht je Sorte (×1,3 bis 3, ×0,85 bis 0,4), „Nicht mehr“ nimmt den Satz aus dem Pool; keine Sorte fällt auf null. „Was Lumi gelernt hat“ in Übersicht › Lumi mit Balken, Zurückholen, Zurücksetzen.
- **Heft „Was Lumi gesagt hat“** (`#heft`): Ansicht des Logs mit dem Filter „gemerkt“ – „Merken“ setzt den Stern im Log, kein zweiter Speicher; mit Datum, durchsuchbar, einzeln herausnehmbar; Gemerktes bleibt beim Kürzen des Logs.
- **Fehler behoben:** Mit Figur sprach die Lumi zweimal (Sprechblase und Karte „Lumi sagt“) – jetzt spricht der Satz des Tages in der Sprechblase, die Karte gibt es nur bei Textkarten. Vor der Namensgabe kam ein Tipp – jetzt nur die Frage; „Später“ gilt auch nach einem Neustart.
- **Paket `wir` 2026.10.04:** Felder `ziel` (16 Tipps) und `buch` (reserviert), geprüft vom Kit (`paket-kit/tipps-format.mjs`, `pruefen.mjs`); `app-004` kommt jetzt (Funktion „gelernt“); `weisheit-002` neu formuliert (Mik).

## 0.3.3 · 04.10.2026 · Antwortfeld beim Tagesrätsel

- **Antwortfeld:** Rätsel mit eindeutiger Kurzantwort haben ein Feld „Deine Antwort“ mit „Prüfen“ (Enter prüft). Verglichen wird lokal (`antwortRichtig` in `web/tag.js`): Groß/klein, Leer- und Satzzeichen, ä/ae, ö/oe, ü/ue, ß/ss, Ziffer und Zahlwort bis 9999, Füllwörter vorn; bei einer reinen Zahl darf ein Wort folgen („12 Runden“). Richtig: Bestätigung mit Erklärung, Karte erledigt, bleibt sichtbar auch über dem Tagesschluss. Falsch: „Noch nicht. Magst du einen Hinweis?“ Keine Zählung, keine Punkte.
- **Pakete:** Feld `antworten` (optional, nicht leere Liste von Texten; Kit-Prüfer, `PAKETFORMAT.md`, `PAKET-KIT.md`). 111 der 123 Rätsel von Oktober bis Jänner haben es, 12 Erklärrätsel nicht; neue Ausgaben von `tage-2026-10` bis `tage-2027-01`. Ältere Apps übergehen das Feld.
- **Baukasten:** ab Februar 2027 höchstens rund 3.500 Wörter pro Tagesteil (Abbruch über 3.700).
- **Windows-Probe:** Wichteln kommt aus der lokalen Quelle (Ordner-Weg, ohne Netz).

## 0.3.2 · 01.10.2026 · Tipps nach Grundsatz, Jänner

- **Tipps** (Paket `wir`, 175 Tipps): Grundsatz „ein Tipp behauptet nie etwas, das die App nicht weiß, und nennt keine Funktion, die es nicht gibt“. Neues Bedingungswort `funktion` mit der Liste `FUNKTIONEN` in `web/wesen.js`; 19 Tipps warten auf ihre Funktion (ältere Apps lassen sie weg). Zustandsbehauptungen umformuliert, alte Punktzahlen durch „hebt deine Bereit-Zahl“ ersetzt, `app-005`, `app-010`, `app-020` an den Stand angepasst, `laune-010` gestrichen. Test: Jeder Tipp, der eine Funktion nennt, findet sie in der App oder hat eine `funktion`-Bedingung.
- **Tagespaket Jänner 2027** (`tage-2027-01`): 31 neue Rätsel; Stifter „Der Condor“, Mörike „Mozart auf der Reise nach Prag“, Gotthelf „Die schwarze Spinne“, Fontane „Unterm Birnbaum“. Holwerkzeug: Kapitelseiten mit `{{Navigation}}`, Gartenlauben-Fortsetzungen, Gedichte mit Schrift-Auszeichnung.
- **Regel „zwei Monate voraus“** in `bill/README.md`, Werkzeug `werkzeug/vorrat-stand.mjs`.

## 0.3.1 · 30.09.2026 · Was ist neu, Dezember, Tippfix

- **„Was ist neu“:** Knopf unten in der Box „App-Update“ (App und Web), eigene Seite mit allen Versionen in Alltagssprache aus `web/neues.json` (kommt mit der App, ohne Netz lesbar). Kein Fenster nach dem Update, nur ein Punkt am Knopf, bis man die Seite zur aktuellen Version geöffnet hat. Die Paket-Karte auf „Updates & Abo“ heißt jetzt „Neu in den Paketen“. Test `web/neues.test.mjs`: Eintrag für die aktuelle Version und gleiche Versionsangaben in `app.js`, `tauri.conf.json`, `Cargo.toml`.
- **Tagespaket Dezember 2026** (`tage-2026-12`): 31 neue Rätsel, Advent mit Hauff („Das kalte Herz“), Storm („Immensee“), Wintermärchen der Brüder Grimm, Kalendergeschichten von Hebel; ab 24. Dezember kurz und leicht. Baukasten für Werke aus mehreren Seiten und Sammlungen.
- **Tipps:** `alltag-020` neu formuliert und nur bei bestätigtem Treffpunkt; vier weitere Zustands-Tipps an Bedingungen gebunden; neues Bedingungswort `offen` (Bereit-Position noch nie bestätigt).

## 0.3.0 · 30.09.2026 · Tagesseite mit Vorratskammer

- **Tagesseite** als Startbildschirm („Heute“): oben Bereit und die Lumi, darunter die Karten des Tages, unten der Vorrat. Endlich: Sind alle Karten erledigt oder weggelegt, oder ist es 22 Uhr, kommt „Das war dein Tag. Bis morgen.“ Keine Feeds, kein endloses Scrollen. Die bisherige Startseite heißt „Übersicht“.
- **Karten:** Tagesrätsel (Hinweis, Lösung, Erklärung), Roman der Woche (jeden Montag ein neues Werk, sieben Tagesteile, Leseansicht mit Vorlesen), die Lumi oder die Textkarte des Tages (je nach Stufe; bei „Tipps aus“ keine). Die Lektion ist vorgesehen, noch ohne Inhalte.
- **Vorratskammer:** neue Paketart `tage` (nur Daten, signiert, aus dem Katalog). Die App lädt 7, 30 oder 90 Tage voraus, schaltet jeden Tag einen frei und räumt alte Monate weg. Ohne Netz läuft der Rhythmus weiter, bis der Vorrat leer ist. Gerechnet wird nach Kalendertagen des Geräts, Zeitzone und Zeitumstellung verschieben keinen Tag.
- **Tagesplan** unter „Übersicht“: welche Karten, Schluss (20 bis 23 Uhr oder ohne Uhrzeit), Vorratstiefe, Sparmodus (Tagesseite ohne Bilder). Gelernt: Wird eine Karte eine Woche lang jeden Tag weggelegt, blendet die App sie aus, sagt warum und lässt es zurücknehmen; zweimal zurückgenommen gilt als fest eingestellt.
- **Inhalte:** 61 eigene Tagesrätsel ab 1. Oktober 2026; Roman der Woche im Oktober: Keller, Droste-Hülshoff, Eichendorff, Storm (gemeinfrei, Wikisource).

## 0.2.1 · 30.09.2026 · Lumi-Nachtrag

- **Drei Stufen der Lumi:** Standard „aus mit Textkarten“ (keine Figur, neutrale Tipps aus App, Alltag, Wissen, Digital wenn angekreuzt, nichts, worin die Lumi von sich erzählt), „Lumi mit Tipps“, „Tipps aus“ (ganz still). Aus 0.2.0 werden „aus“ und „Nur Tipps“ zu Textkarten, die Figur bleibt, wer sie hatte.
- **Nachts schläft sie:** zur gelernten Schlafenszeit (sonst 22 bis 6 Uhr), auch bei offener App; ein Stups weckt sie für eine Minute.
- **Web-Version** wird per Workflow aus den veröffentlichten Paketen gebaut, der Paketschlüssel bleibt in GitHub.

## 0.2.0 · 29.09.2026 · Module, Bereit v2, die Lumi

- **Bereit, Version 2** (`docs/WESEN.md`): vier Quellen (Inhalte 20, Dinge 35, Menschen 25, Können 20), Verfall je Position mit drei Monaten Ausklang. Treffpunkt und Anlaufstelle gelten 12 Monate, Familiengruppe, Nummern und Nachbar 6.
  - Beim Update werden Bestätigungen mit Datum übernommen. Weil Version 2 neue Punkte zählt, gilt der alte Wert drei Monate als Untergrenze und klingt dann aus: Die Zahl fällt beim Update nicht.
- **Die Lumi**: standardmäßig aus, Einladung nach einer Woche, Startablauf mit Namen, Foto-Ansicht mit elf Zuständen (KI-generiert, gekennzeichnet). Wer in 0.1.x einen Namen vergeben hatte, behält die Figur. Kein „ich“ ohne Namen.
- **Skins** als eigene Paketart (nur Stil, geprüftes CSS), Grundaussehen mit `of-`-Klassen; Notfallseiten immer im Grundaussehen.
- **`app_min`** wird beachtet: Pakete für eine neuere App bleiben sichtbar („Braucht App …“), werden aber weder geladen noch vom Abo aktualisiert. Module und Skins brauchen mindestens 0.2.0.
- **Module (`art = "modul"`)**: Pakete mit eigener Oberfläche, freigegeben von Mik mit drei Bedingungen (`docs/SICHERHEIT.md`, Abschnitt Module).
  - Kern und Werkzeug nehmen Module nur mit dem Redaktionsschlüssel (Zweck `module`) und `pruefstatus: redaktion` an; Code nur unter `inhalt/modul/`, Oberfläche höchstens 2 MB.
  - Jedes Modul läuft über einen eigenen Server (127.0.0.1, geheimer Pfad, CSP ohne Netz, `sandbox allow-scripts`) in einem iframe ohne eigene Herkunft und spricht nur über `window.offline`. Die App prüft jede Nachricht.
  - Bösartiges Testmodul mit 37 Angriffen: in der Desktop-App (macOS), in Chromium und in WebKit alle blockiert.
- **Bibliothek**: Katalogkarte für Module mit Vorschau-Slider (Bilder gegen Prüfsummen), grünem Schieber „laden“, Schalter aktiv/inaktiv, „Öffnen“ und „löschen“ (Wort „löschen“ tippen, Frage nach den Daten). Neue „Lokale Quelle“ für noch nicht veröffentlichte Module.
- **Paket-Kit**: `paket-kit/pruefen.mjs` in den Tests; Nachtrag (Quellen-`id`, Notrufhinweis) umgesetzt; `bauen` übernimmt Kategorie, Alter, Preis und Prüfstatus ins Manifest und prüft Module immer.
- **Katalog**: Einträge tragen Kategorie, Alter, Preis, Prüfstatus und die Vorschau-Slideshow.
- **Sicherheit**: Der allgemeine lokale Dateiserver liefert keine Modul-Oberflächen mehr aus.
