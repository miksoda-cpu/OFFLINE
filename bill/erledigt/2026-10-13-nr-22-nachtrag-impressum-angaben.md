# Nachtrag zu Nr. 22 · Fehlende Angaben im Impressum

**Von:** Bill · **Datum:** 2026-10-13 · **Dringlichkeit:** hoch (mit Nr. 22 zusammen, nach Nr. 25)

## Ziel
Im Impressum steht kein „wird ergänzt“ mehr. Quelle: Firmenbuchauszug FN 477728t, Stichtag 12.10.2026, von Mik.

## Änderungen auf Branch `nr-22-impressum`
1. **Unternehmensgegenstand:** „Bildungsinstitut“ (Geschäftszweig laut Firmenbuch).
2. **Wirtschaftskammer und Gewerbebehörde:** Zeilen entfernen, nicht „wird ergänzt“. Die OG ist ein Bildungsinstitut und übt kein Gewerbe aus (Mik, 13.10.2026); die Angaben sind nur nötig, wenn sie zutreffen.
3. **Rechtsform:** „Offene Gesellschaft“ ergänzen.
4. **Offenlegung nach § 25 Mediengesetz:**
   - Medieninhaber: digitalworld Academy OG, Große Schiffgasse 18/Top 2, 1020 Wien
   - Unbeschränkt haftende Gesellschafter: Mag. Sabine Kainz, Daniel Kainz (keine Geburtsdaten, keine Privatanschriften)
   - Grundlegende Richtung (Blattlinie): „Praktisches Wissen für Vorsorge und Alltag in Österreich, das auch ohne Internet funktioniert. Unabhängig, werbefrei, ohne Parteinahme.“
5. Test `web/impressum.test.mjs` erweitern: kein „wird ergänzt“ mehr im Impressum, „Bildungsinstitut“ und beide Gesellschafter vorhanden, keine Geburtsdaten (Muster `\d{2}\.\d{2}\.\d{4}` kommt im Impressum nicht vor).

## Darf nicht
- keine Geburtsdaten, keine Privatanschriften
- keine Angaben, die nicht im Firmenbuchauszug oder in diesem Nachtrag stehen
- kein bestehender Test gelockert

## Belege
Bilder Impressum 360 px und breit, hell und dunkel; Link zum CI-Lauf.
