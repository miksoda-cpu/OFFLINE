# Nr. 28 · Nachbesserung nach Bills verdeckter Prüfung (15.10.2026)

**Ergebnis:** noch nicht abgenommen. Zwei Punkte, dann zusammenführen.

1. **Deutschland zeigt auf „Bereit“ österreichische Nummern und Sender.** Mit `offline:land = "de"` steht auf Bereit in der Kachel Notfall „112 · 122 · 133 · 144, Sirenen“ und im Punkt Radio „… Sender des Österreichischen Rundfunks (ORF) gefunden / Ö3 oder Radio Wien einstellen“. Auf Vorsorge steht „Radio mit Batterie oder Kurbel – im Krisenfall informiert der ORF“. Nr. 28 verlangt: keine österreichische Nummer bei Deutschland oder Schweiz. Bitte:
   - Bereit-Kachel Notfall zeigt die Nummern des gewählten Landes (Deutschland 112 · 110 · 116 117, Schweiz 112 · 117 · 118 · 144 · 145), „Sirenen“ nur bei Österreich.
   - Radio-Punkte in Bereit und Vorsorge für Deutschland und Schweiz neutral: „Radio mit Batterie oder Kurbel – im Krisenfall informiert dein öffentlich-rechtlicher Sender“ und „Radio getestet und einen Sender für Krisenfälle gefunden“.
   - Den Test `land.test.mjs` um Bereit und Vorsorge erweitern (Deutschland und Schweiz: keine 122, 133, 141, Ö1, Ö3, ORF, Radio Wien, Heulton).
2. **Auf den Hauptbranch bringen:** Der Branch `nr-28-version-0-9-0` beginnt vor Nr. 26 (z. B. ist `werkzeug/barrierefrei-ausnahmen.json` dort noch voll, auf dem Hauptbranch leer). Vor dem Zusammenführen auf den aktuellen Hauptbranch neu aufsetzen, Prüferkette erneut grün (tests.yml, Windows-Probe, Rundgang 360/390/1280).

Bestanden ohne Befund: Länderfrage auch ohne Internet; Länderfrage als Auswahlgruppe mit Namen, „kommen später“ nicht wählbar; keine neue Netzwerkadresse; geänderte Tests ersetzen die alten gleich streng (Vorschau ohne Blättern, Tresor unter „Bald“); Version 0.9.0 in App, Cargo und Web gleich; Naturheilkunde-Paket bleibt bis zum Katalog-Lauf verschlüsselt.

Danach: zusammenführen (Web ist damit live), dann Katalog-Lauf nur für `heilkunde-grundstock` und Tag/Release 0.9.0 nach Miks Freigabe vom 14.10.
