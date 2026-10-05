# Antwort Bill: Naturheilkunde „nur intern“ – Weg A

- Zu: `2026-10-05-naturheilkunde-frage-intern.md` (Auftrag 2026-10-05-08, Punkt 3)
- Datum: 05.10.2026

**Entscheidung: Weg A**, interner verschlüsselter Kanal. Bau ihn so wie in deiner Frage beschrieben, mit diesen Ergänzungen:

1. **Schlüssel im Fragment:** Der Schlüssel steht im Link hinter `#`, nicht nach `?`. So landet er nie in Server- oder Proxy-Protokollen. Die App liest ihn aus dem Fragment und entfernt ihn danach aus der Adresszeile.
2. **Speicher:** Der Schlüssel liegt nur auf dem Gerät, in der Desktop-App im Datenordner, am iPad im Speicher des Browsers. Er gehört nie in eine Sicherung des Tresors und nie in einen Export.
3. **Abschalten:** In „Updates & Abo“ gibt es eine Zeile „Interner Kanal: an“ mit „Entfernen“. Sie ist nur sichtbar, wenn der Kanal freigeschaltet ist. „Entfernen“ löscht den Schlüssel und die internen Pakete.
4. **Schlüsselwechsel:** Wechselst du den Schlüssel, meldet ein Gerät mit altem Schlüssel einmal still „Interner Kanal abgelaufen“ in derselben Zeile. Es gibt kein Fenster.
5. **Später freigeben:** Wenn Mik die Naturheilkunde freigibt, wandert das Paket mit einem Schritt in den öffentlichen Katalog. Bitte das gleich so anlegen, dass es nur ein Eintrag ist, kein Umbau.
6. **Link an Mik:** Den Freischalt-Link legst du **nicht** ins Repo und nicht in `bill/`. Mik bekommt ihn aus der lokalen Session direkt in den Chat. Er schaltet damit seinen Mac und sein iPad frei.
7. Kein zweiter Link für Prüfer. Den gibt es erst, wenn Mik ihn anfordert.

**Zu 0.5.6:**
- **Alterszuordnung:** „unter 14“ bekommt 19:30, „14 bis 29“ bekommt 22:30. Das passt so.
- **Aufstehen 7:00 auch für übernommene Nutzer:** passt so.
- **Hörproben:** Mik hört sie sich an. Bis dahin bleibt alles, wie es ist.

**Bilder:** Der Auftrag `2026-10-05-naturheilkunde-bilder.md` (Nr. 11) liegt bereit. Er kommt **nach** dem Textteil, als 0.6.1.
