# Auftrag: Nr. 24 · Wikipedia und Wikivoyage als Module, Nachtrag zu 0.8.0

**Von:** Bill · **Datum:** 2026-10-11 · **Dringlichkeit:** normal

## Ziel
Wikivoyage und Wikipedia lassen sich in der Bibliothek als Module einschalten, laden und offline lesen, am Desktop. Dazu drei Kleinigkeiten aus 0.8.0. Fertig ist es, wenn ein frisch installierter Desktop ohne Zutun nur das Nötige hat, ein Klick Wikivoyage lädt und ein Artikel danach im Flugmodus aufgeht.

## Hintergrund
MVP-Fokus Punkt 2 (Festlegung MVP, `bill/README.md`): „Wikipedia und Wikivoyage sind ladbare Module in der Bibliothek, nicht Teil des Installers.“ Dieser Auftrag wurde am 08.10. als „Nr. 21“ in Miks Ordner gelegt, kam aber nie im Repo an; die Nummer 21 ist inzwischen vergeben. Die Rückfragen aus der Rückmeldung 0.8.0 (`bill/rueckmeldung/2026-10-08-version-0-8-0.md`) beantwortet Abschnitt A.

## Umfang

### A. Nachtrag zu 0.8.0
1. **Österreich-Basis kommt von selbst.** Bei einer bestehenden Installation (Web, vorige Ausgabe auf dem Gerät) stand nach dem Update auf 0.8.0 „Die neue Vorsorge kommt mit dem nächsten Österreich-Paket“ und der Knopf „Österreich-Paket aktualisieren“. Die Österreich-Basis ist „immer an“: eine neue Ausgabe wird beim nächsten Start mit Netz still geladen, wie die Tage-Pakete. Der Knopf bleibt nur als Notlösung ohne Netz.
2. **Doppelte Klammer bei „USB-Stick)“** beheben (Abkürzungsregel).
3. **Antworten auf die Rückfragen 0.8.0** (keine Arbeit, nur zur Kenntnis): Bereit zählt vorerst nur die 20 alten Punkte. Die Sirenentöne bleiben; Mik hört sie einmal gegen die Hörbeispiele ab. Die Haushalt-Wörter passen.

### B. Wissen-Module (Desktop)
1. In der Bibliothek, Bereich „Wissen“, als Module mit Vorschau-Fenster:
   - Wikivoyage Deutsch
   - Wikipedia Deutsch kompakt (Einleitungen, ohne Bilder)
   - Wikipedia Deutsch ohne Bilder
   - „Wikipedia komplett mit Bildern“ bleibt unter „Bald“, nicht im MVP.
   Größen aus den aktuellen Dateien, nicht aus dieser Liste.
2. **Nicht im Installer.** Einschalten, Platz prüfen (klare Meldung, wie viel fehlt), laden mit Fortschritt in Prozent und Restzeit, Pause, Fortsetzen nach Abbruch oder Neustart, Prüfsumme, danach offline da. Löschen in zwei Schritten.
3. **Quelle:** ZIM-Dateien von Kiwix (CC BY-SA, Namensnennung unter „Über“), gespiegelt auf Hetzner (`offline-pakete`), im signierten Katalog mit Prüfsumme. Die App lädt nur vom eigenen Bucket. Aktualisierung höchstens alle drei Monate.
4. **Suche:** Die Suche der App findet Treffer in geladenen Modulen; Artikel öffnen sich in der App und funktionieren ohne Netz.
5. **Web-Version:** zeigt die Module mit dem Hinweis „Gibt es in der Desktop-App“, kein Download im Browser.
6. **Handy:** nicht in diesem Auftrag, aber so bauen, dass dieselben Katalogeinträge dort gelten.
7. **Gigabyte-Test am Mac** aus der Startreife, mit genau diesen Downloads.

Nicht dazu: Lumi, Handy, neue Inhalte.

## Abnahme
Kommandos (Exit-Code 0, auf dem Auftragsbranch):
- neuer Test, der ohne die Änderung fehlschlägt: (a) eine neuere Ausgabe der Österreich-Basis im Katalog wird beim Start ohne Knopfdruck geladen; (b) „USB-Stick“ ergibt genau ein Klammerpaar; (c) ein Wissen-Modul durchläuft laden, abbrechen, fortsetzen, Prüfsumme, löschen gegen einen kleinen Test-ZIM
- `node --test web/*.test.mjs`, Kern-Tests, `tests.yml` grün
- Windows-Probe grün (`gh workflow run windows-probe.yml --ref <branch>`)

Muss (JA/NEIN):
- [ ] Österreich-Basis aktualisiert sich still, im Rundgang „langjähriger Benutzer“ belegt
- [ ] drei Wissen-Module ladbar, „komplett“ unter „Bald“
- [ ] Fortschritt, Pause, Fortsetzen nach Neustart, Platzprüfung, Löschen in zwei Schritten
- [ ] Artikel öffnet im Flugmodus, Suche findet ihn
- [ ] Gigabyte-Test am Mac mit Zahlen (Dauer, Größe, Abbruch und Fortsetzen)

Darf nicht (JA/NEIN):
- [ ] kein bestehender Test gelockert oder gelöscht
- [ ] keine Netzwerkverbindung außer zum eigenen Bucket; nichts von download.kiwix.org zur Laufzeit
- [ ] die Module nicht im Installer und nicht in der Web-Version herunterladbar
- [ ] Prüfliste aus dem Anker eingehalten (lesbar auf 360 px, Fortschritt mit Farbe, keine Floskel)

Belege:
- Rückmeldung mit Commit und Links zu den CI-Läufen
- Bilder 360 px und breit, hell und dunkel: Bibliothek „Wissen“, Laden mit Fortschritt, „Platz fehlt“, Artikel offline, Österreich-Basis nach stillem Update
- Erklärung in höchstens zehn Zeilen

Kandidaten: 1

## Offene Fragen
Code entscheidet Ablage, Teilgrößen und Prüfsummenweg. Fragen nur, wenn der Spiegel auf Hetzner Kosten über dem bisherigen Rahmen verursacht (das ist Miks Entscheidung).
