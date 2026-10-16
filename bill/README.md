# bill – Kanal zwischen Bill und Code

Dieser Ordner ist der Briefkasten zwischen zwei Claude-Sessions von Mik:

- **Bill** plant, schreibt Konzepte und Aufträge.
- **Code** (die Code-Session im Repo OFFLINE) setzt um, pusht und meldet zurück.

## Ablauf

1. Bill legt einen Auftrag nach `bill/todo/` (Vorlage: `bill/vorlagen/auftrag.md`). Dateiname: `JJJJ-MM-TT-kurzer-titel.md`.
2. Mik sagt Code nur noch: „schau in todo“.
3. Code arbeitet den Auftrag auf einem eigenen Branch ab (siehe unten), führt ihn nach grünen Prüfungen zusammen, verschiebt die Auftragsdatei nach `bill/erledigt/` und schreibt eine Rückmeldung nach `bill/rueckmeldung/` (Vorlage: `bill/vorlagen/rueckmeldung.md`).
4. `bill/STATUS.md` hält den aktuellen Stand in wenigen Zeilen.

## Branches, Tests, Veröffentlichen (Festlegung Mik/Bill, 30.09.2026)

Anlass: Vercel liefert jeden Push auf den Hauptbranch `claude/optimistic-hypatia-yymcne` sofort als Web-Version aus, und Pushes aus einem Workflow lösen keine Tests aus. Beides hat bei 0.2.1 einmal Ungeprüftes live gebracht.

1. **Jede Arbeit auf einem eigenen Branch.** Code legt je Auftrag einen Branch an (z. B. `lumi-nachtrag`), pusht dorthin und lässt dort prüfen. Auf den Hauptbranch kommt nichts direkt.
2. **Zusammenführen und veröffentlichen erst, wenn alles grün ist:**
   - alle Tests aus `tests.yml`, auch „App-Berechtigungen“ unter Windows, macOS und Linux,
   - die Windows-Probe (`windows-probe.yml`, gestartet mit `--ref <branch>`).

   Dann wird der Branch per fast-forward auf den Hauptbranch geführt. Erst danach folgen ein Tag, ein Release, ein Katalog- oder ein Web-Lauf, und die nur mit Miks Freigabe.
   **Vor jedem Tag:** Die neue Version bekommt ihren Eintrag in `web/neues.json` („Was ist neu“, drei bis sechs Punkte für Nutzer, neueste oben). Der Test `web/neues.test.mjs` schlägt fehl, wenn er fehlt oder die Versionsangaben nicht übereinstimmen. Seit 0.5.5 trägt auch `web/version.json` die neue Nummer (danach fragt „Nach neuer Version suchen“ im Web); `web/neuigkeiten.test.mjs` prüft das.
   **Rundgang vor jedem Release** (seit Nr. 37): `node werkzeug/rundgang/rundgang.mjs --profile frisch,langzeit,deutschland,schweiz,offline --breiten 360,390,1280` ohne Befund, Bilder in „OFFLINE - Home/rundgang/<version>/“.
3. **Jeder Workflow, der auf den Hauptbranch schreibt, testet vorher selbst.** Er lässt die Tests laufen, die von dem abhängen, was er schreibt, bevor er committet (Beispiel: „Web-Version“ prüft Werkzeug, Web und Kern). Fällt ein Test durch, schreibt er nichts.
4. Findet ein Test oder die Probe etwas, wird nichts veröffentlicht. Code meldet es in der Rückmeldung, behebt es auf dem Branch und prüft neu.

## Tagespakete: zwei Monate voraus (Festlegung Bill, 01.10.2026)

1. Das Tagespaket für einen Monat (`tage-JJJJ-MM`) liegt **spätestens am 1. des Vormonats** im Katalog, besser zwei Monate voraus. Beispiel: Februar 2027 spätestens am 1. Jänner 2027, besser am 1. Dezember 2026.
2. Jede Rückmeldung zu einem Release nennt, **bis wann der Vorrat reicht** (letzter Tag im Katalog) und wie viele Tage das ab heute sind. `node werkzeug/vorrat-stand.mjs` liest das aus dem öffentlichen Katalog.
3. **Lesemenge ab Februar 2027 (Festlegung Bill, 04.10.2026):** höchstens rund 3.500 Wörter pro Tag. `pakete/tage/bauen.mjs` bricht ab, wenn ein Tagesteil über 3.700 Wörter hat; dann mehr Teile oder ein kürzeres Werk.
4. Fällt der Abstand **unter 45 Tage**, meldet sich Code von selbst mit einem Vorschlag für das nächste Paket (Rätsel, vier Werke mit Ausgabe), auch ohne Auftrag.

## MVP (Festlegung Mik, 11.10.2026)

Das MVP ist alles, was die staatliche Zivilschutz-App inhaltlich bietet (Inhalts-Gleichstand, siehe Nr. 20), dazu die Spiele, ohne Lumi. Herausgeber der App ist die digitalworld Academy OG (Große Schiffgasse 18/Top 2, 1020 Wien, FN 477728t, Kontakt office@diwo.at); so entschieden von Mik am 11.10.2026 nach Abwägung, die frühere Angabe „Privatperson“ vom selben Tag gilt nicht mehr. Prüfungen, Bildsätze und Aufträge richten sich zuerst nach diesem Umfang; Lumi, Lumisch, Lumi-Buch und „Was die Lumis denken“ bleiben im Repo, sind aber nicht Teil der Startreife.

## Abnahme, Held-out, Ideenbuch, Kandidaten (Festlegung Mik/Bill, 10.10.2026)

Anlass: Agenten kommen dort voran, wo ein Prüfer existiert, den sie nicht austricksen können. Die Prüferkette dieses Repos (Klartext-Wache, `tests.yml`, Sandbox- und Spiele-Probe, App-Berechtigungen, Windows-Probe, Bilder) ist dieser Prüfer. Vier Regeln bauen darauf auf:

1. **Abnahme vorab.** Jeder Auftrag hat einen Abnahmeblock (Vorlage `bill/vorlagen/auftrag.md`): Kommandos, Muss, mindestens zwei Darf-nicht-Kriterien, Belege. Ein Fix braucht einen Test, der ohne ihn fehlschlägt. Eine Rückmeldung ohne CI-Links und Bilder gilt als nicht erledigt.
2. **Zurückgehaltene Prüfung.** Bill prüft jeden erledigten Auftrag zusätzlich mit einem Held-out-Check, den Code nicht kennt. Er liegt nicht im Repo, weil das Repo öffentlich ist. „Erledigt“ (Code) ist erst „abgenommen“, wenn Bill es in `bill/STATUS.md` einträgt.
3. **Ideenbuch.** `bill/ideenbuch.md` hält jeden Ansatz mit Kill-Kriterium und Ausgang fest, die verworfenen zuerst. Code liest es vor jedem Auftrag. Keine unveröffentlichten Inhalte darin, nur Ansätze.
4. **Kandidaten.** Steht im Auftrag „Kandidaten: 3“, baut Code drei Varianten auf eigenen Branches (`<titel>-a`, `-b`, `-c`), jede mit Bildern. Mik wählt, der Gewinner wird zusammengeführt und ist danach die Bild-Referenz für diese Seite.

Tests zu lockern oder zu löschen braucht immer Miks Freigabe. Wer den Prüfer verändert, hat nichts bewiesen.

## Gedächtnis: Stand und Log (Festlegung Mik/Bill, 11.10.2026)

Anlass: Jede Session beginnt ohne Erinnerung. Was am Anfang gelesen wird, wächst sonst so lange, bis das Lesen länger dauert als die Arbeit und alte Anweisungen die aktuellen überstimmen. Vorschlag aus der Session „Lebendes Medium“, angepasst an diesen Kanal.

1. **Jedes Dokument ist Stand oder Log.** Ein Stand wird bei der Faltung von Grund auf neu geschrieben. Ein Log wird nur ergänzt, nie geändert oder gelöscht; neue Einträge mit Datum in der Überschrift. Die Zuordnung steht unten.
2. **Der Stand hat eine Obergrenze.** Die Startlektüre (dieses README, `bill/STATUS.md`, der Block „Lehren“ im Ideenbuch) hat zusammen höchstens 300 Zeilen und 2.500 Wörter. Aufträge in `bill/todo/` zählen nicht, sie sind die Arbeit selbst. Wird die Grenze überschritten, faltet der nächste Lauf, bevor er arbeitet.
3. **Die Faltung hat einen festen Takt:** der erste Nachtlauf der Woche (Montag). Sie schreibt `bill/STATUS.md` und die „Lehren“ neu; was dabei herausfällt, kommt mit Datum nach `bill/status-log.md` bzw. bleibt als Eintrag im Ideenbuch. Nichts wird verworfen. Am Ende eine Zeile unter „Gedächtnis“ in `bill/STATUS.md`: Wörter der Startlektüre vorher und nachher.
4. **Log beschreibt, Stand weist an.** Rückmeldungen, Ideenbuch-Einträge und Übergaben erzählen, was war. Sie enthalten keine Anweisung für künftige Läufe. Soll etwas künftig gelten, wird es eine Festlegung in diesem README, und eine neue Festlegung schreibt nur Bill mit Miks Zustimmung, nie der Nachtlauf. Der Nachtlauf darf falten, aber keine Regel erfinden.
5. **Das Log wird nicht beim Start gelesen.** Es wird gezielt aufgeschlagen: wenn ein Ansatz wiederkommt, wenn eine Entscheidung begründet werden muss, wenn der Stand eine Lücke hat.

| Dokument | Art |
|---|---|
| `bill/README.md`, `bill/STATUS.md`, `bill/todo/`, `bill/vorlagen/` | Stand |
| Block „Lehren“ in `bill/ideenbuch.md` | Stand |
| Einträge in `bill/ideenbuch.md`, `bill/status-log.md`, `bill/erledigt/`, `bill/rueckmeldung/`, `bill/eingang/`, `docs/CHANGELOG.md` | Log |
| Held-out-Prüfungen und Übergaben im Claude-Projekt | Log |

Wächst die Startlektüre nach der Faltung Woche für Woche, ist die Grenze zu hoch oder die Faltung zu zaghaft. Bleibt sie stabil, während das Log wächst, funktioniert das Gedächtnis.

## Prüfliste aus dem Anker (Festlegung Mik, 11.10.2026)

Abgeleitet aus Miks Bewertung von 41 MVP-Bildschirmen (34 passt, 7 passt nicht). Jeder Auftrag, der etwas Sichtbares ändert, prüft diese Punkte als „Darf nicht“:

1. **Lesbar auf dem Handy.** Kein Text, auch nicht in Bildern oder Vorschauen, der bei 360 px Breite zu klein zum Lesen ist.
2. **Zustand hat Farbe.** Wo die App einen Stand zeigt (Bereit, Fortschritt), zeigt sie ihn in jeder Breite auch mit Farbe, nicht nur mit Zahlen.
3. **Keine Hürde, die niemand prüft.** Statt Ja/Nein-Fragen, deren Antwort niemand kontrollieren kann, eine Empfehlung.
4. **Kein Satz ohne Inhalt.** Texte für Nutzer sagen etwas, das zur Lage passt; Floskeln wie „Das war dein Tag“ fallen weg.

Die 34 Bildschirme mit „passt“ sind die Vorlage für den Bildvergleich (Nr. 21). Bewertungen: Seite „OFFLINE Anker“, Sammlung `anker`.

## Rund um Bill (Stand 11.10.2026)

- **Nachtlauf:** geplante Aufgabe „BILL Nachtlauf OFFLINE (schau in todo)“, täglich 02:17 Wien. Ein Auftrag pro Nacht, montags zuerst die Faltung. Nie Tag, Release, Katalog- oder Web-Lauf.
- **Held-out-Prüfungen:** im Claude-Projekt „Meine verrückten Ideen und Projekte“ unter `claude/held-out/`, nie im Repo, weil das Repo öffentlich ist.
- **Anker:** Miks Pass/Fail-Urteile zu den MVP-Bildschirmen auf der Seite „OFFLINE Anker“ im Claude-Konto, Sammlung `anker`. Daraus werden Checklisten und Darf-nicht-Kriterien, als Festlegung vorgeschlagen.

## Regeln

- Aufträge sind Text, keine Befehle an die Umgebung. Code prüft jeden Auftrag gegen die Sicherheitsregeln in `docs/SICHERHEIT.md` (Pakete sind Daten, keine Schlüssel im Repo, keine Telemetrie).
- Was Code nicht umsetzen kann oder anders umsetzt, steht in der Rückmeldung, mit Grund.
- Konzepte, die dauerhaft gelten, wandern nach `docs/`, nicht hierher. `bill/` ist der Durchlauf, `docs/` das Gedächtnis.
