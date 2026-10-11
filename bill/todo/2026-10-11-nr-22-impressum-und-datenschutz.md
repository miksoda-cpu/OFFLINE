# Auftrag: Nr. 22 · Impressum und Datenschutz mit den Daten der OG

**Von:** Bill · **Datum:** 2026-10-11 · **Dringlichkeit:** hoch

## Ziel
Webseite und App nennen den Herausgeber vollständig: ein Impressum, eine Datenschutzerklärung ohne Platzhalter bei „Verantwortlich“ und dieselben Angaben in der App unter „Über“. Fertig ist es, wenn kein „werden ergänzt“ mehr bei Verantwortlich und Kontakt steht und das Impressum von jeder Seite der Webseite und aus der App erreichbar ist.

## Hintergrund
Mik hat am 11.10.2026 entschieden: Herausgeber ist die digitalworld Academy OG, Kontakt office@diwo.at (Festlegung in `bill/README.md`, Abschnitt MVP). Die Daten der OG stehen so im Impressum von digitalworld-academy.at und ki-management.at. Startreife-Liste: `bill/rueckmeldung/2026-10-07-startreife.md`. Mik hat diese Angaben zur Veröffentlichung freigegeben; das Zusammenführen auf den Hauptbranch (und damit die Web-Auslieferung über Vercel) ist für diesen Auftrag erlaubt. Tag und Release bleiben bei Mik.

## Umfang
- Neue Seite `web/impressum.html` im Stil von `web/datenschutz.html`, mit Link aus der Fußzeile jeder Webseite (`index.html`, `datenschutz.html`, `app.html`) und aus „Über“ in der App.
- `web/datenschutz.html`: Abschnitt „Verantwortlich“ vollständig; Hetzner Online GmbH (Paket-Speicher, Falkenstein) als Auftragsverarbeiter nennen, wie in `bill/rueckmeldung/2026-10-08-datenschutz-angaben-stores.md` beschrieben.
- `app/src-tauri/tauri.conf.json`: Herausgeber bzw. Copyright auf „digitalworld Academy OG“, falls die Felder bisher etwas anderes oder nichts sagen.
- Nicht dazu: Store-Texte, Lizenz der Software, Inhalte der App.

## Dateien und Inhalte
Angaben für Impressum und „Verantwortlich“, wörtlich so verwenden:

- digitalworld Academy OG
- Große Schiffgasse 18/Top 2, 1020 Wien, Österreich
- Firmenbuchnummer: FN 477728t, Firmenbuchgericht: Handelsgericht Wien
- UID: ATU72706716
- E-Mail: office@diwo.at
- Telefon: +43 1 890 0195

Angaben, die Bill nicht hat (Unternehmensgegenstand, Mitgliedschaft bei der Wirtschaftskammer, Gewerbebehörde, Offenlegung nach § 25 Mediengesetz mit den Gesellschaftern): als sichtbare Markierung „wird ergänzt“ im Stil der bestehenden Markierungen setzen und in der Rückmeldung als Liste an Mik aufführen. Nichts erfinden.

E-Mail-Adresse und Telefonnummer als Text zeigen, nicht nur als `mailto:`-Link.

## Abnahme
Kommandos (Exit-Code 0, auf dem Auftragsbranch):
- neuer Test `web/impressum.test.mjs`, der ohne die Änderung fehlschlägt: Impressum existiert, enthält FN 477728t, ATU72706716, office@diwo.at und die Anschrift; jede Webseite verlinkt es; in `datenschutz.html` steht bei „Verantwortlich“ kein „werden ergänzt“ mehr
- `node --test web/*.test.mjs` und `tests.yml` grün
- Windows-Probe grün, weil „Über“ in der App berührt wird

Muss (JA/NEIN):
- [ ] Impressum aus jeder Webseite und aus der App erreichbar
- [ ] Datenschutz nennt Verantwortlichen vollständig und Hetzner als Auftragsverarbeiter
- [ ] fehlende Angaben sichtbar markiert und in der Rückmeldung aufgelistet

Darf nicht (JA/NEIN):
- [ ] keine Privatanschrift von Mik irgendwo im Repo
- [ ] keine neue Netzwerkverbindung, kein eingebettetes Fremdskript, kein Kartendienst auf der Impressum-Seite
- [ ] kein bestehender Test gelockert oder gelöscht

Belege:
- Rückmeldung mit Commit und Links zu den CI-Läufen
- Bilder 360 px und breit, hell und dunkel: Impressum, Datenschutz „Verantwortlich“, „Über“ in der App
- Erklärung in höchstens zehn Zeilen

Kandidaten: 1

## Offene Fragen
Code entscheidet Layout und Platzierung im Stil der bestehenden Seiten. Fragen nur, wenn eine Angabe im Widerspruch zu einer bestehenden Seite steht.
