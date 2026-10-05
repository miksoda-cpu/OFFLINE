# Auftrag: „Info und Hilfe“ auf sieben weiteren Seiten, und ein Fehler beim Tresor

- Nr.: 2026-10-05-04
- Priorität: **Teil 1 zuerst**, er ist ein Fehler mit Datenverlust. Teil 2 als 0.5.4, oder zusammen mit 0.5.3, wenn das noch offen ist.
- Quelle: deine Rückmeldung zu 0.5.2. Die Fakten in den Texten hat Bill am Code geprüft (Stand d5369db).

## Teil 1: Sperren des Tresors löscht die Daten der Module

`tresor_sperren` in `app/src-tauri/src/lib.rs` (etwa Zeile 286) führt `remove_dir_all(datenordner/module)` aus. In diesem Ordner liegen laut `module.rs` der Speicher jedes Moduls (`<id>.json`) und `zustand.json` (aktiv oder inaktiv).

**Folge:** Der Tresor sperrt nach 5 Minuten ohne Eingabe, beim Minimieren und beim Beenden. Bei jedem dieser Fälle verliert der Nutzer alle Spielstände und Listen seiner Module, zum Beispiel beim Wichteln. Außerdem schaltet sich jedes Modul ab. Laut Commit 2436fc8 kam die Zeile mit der Sandbox dazu. Vermutlich war ein anderer Ordner gemeint, etwa entpackte Oberflächen oder Modulserver.

- Klär, was die Zeile tun sollte. Behalte nur diesen Teil.
- Die Daten der Module und `zustand.json` bleiben beim Sperren unverändert. Die Modulserver dürfen beim Sperren stoppen.
- Ein Test: Modul aktiv, Speicher schreiben, Tresor sperren, Speicher lesen. Der Wert ist noch da, das Modul ist noch aktiv.
- Wenn die Daten der Module bewusst an den Tresor gebunden sein sollten (verschlüsselt), schreib das in die Rückmeldung, bevor du etwas änderst. Dann entscheide ich.
- In „Was ist neu“ ein Satz: „Module behalten ihre Daten jetzt auch, wenn der Tresor sperrt.“

## Teil 2: Texte für „Info und Hilfe“

Gleiches Muster wie bei „Updates & Abo“: Die letzte Zeile der Seite heißt „Info und Hilfe“ und öffnet das Blatt. Die Texte kommen als neue Schlüssel in `web/hilfe.js`, Wort für Wort. Notfall bleibt ohne Hilfe-Zeile.

Wenn ein Satz nicht zum Code passt, ändere nicht den Satz. Schreib die Stelle in die Rückmeldung, ich passe den Text an.

### tresor (nur Desktop-App)

1. **Was ist der Tresor?** Der Tresor ist ein verschlüsselter Bereich auf diesem Gerät. Hier liegen Notizen, Fotos und Dateien, die niemand sonst sehen soll. Den Tresor gibt es nur in der Desktop-App.
2. **Wie sicher ist der Tresor?** Die App verschlüsselt jeden Eintrag mit XChaCha20-Poly1305. Den Schlüssel schützt dein Passwort mit Argon2id. Ohne Passwort oder Wiederherstellungscode kann niemand den Inhalt lesen, auch wir nicht.
3. **Was ist die Notfallmappe?** Die Notfallmappe ist eine Vorlage mit zehn Abschnitten: Personen, Nummern, Treffpunkte, Dokumente, Versicherungen, Geld, Zugänge, Haus, Tiere und Radio. Trag nur ein, was du im Notfall brauchst. Trag keine vollständigen Kartennummern ein.
4. **Was ist der Wiederherstellungscode?** Der Code hat sechs Gruppen zu je fünf Zeichen. Die App zeigt ihn nur einmal. Schreib ihn auf Papier und leg ihn an einen sicheren Ort. Mit dem Code öffnest du den Tresor, wenn du das Passwort vergisst.
5. **Was passiert, wenn ich das Passwort vergesse?** Öffne den Tresor mit dem Wiederherstellungscode. Setz danach ein neues Passwort. Wenn du Passwort und Code verlierst, kann niemand den Inhalt wiederherstellen.
6. **Wann sperrt der Tresor?** Der Tresor sperrt nach einer Zeit ohne Eingabe. Du wählst 1, 5 oder 15 Minuten. Er sperrt auch, wenn du die App minimierst oder beendest. Du kannst ihn jederzeit selbst sperren.
7. **Wie sichere ich den Tresor?** Tippe auf „Sicherung“. Die App kopiert den verschlüsselten Tresor, zum Beispiel auf einen USB-Stick. Beim Zurückspielen ersetzt die Sicherung den Tresor. Danach gilt das Passwort der Sicherung.
8. **Verlässt etwas das Gerät?** Nein. Der Tresor hat keine Verbindung zum Internet.

### bibliothek

1. **Was zeigt die Bibliothek?** Die Bibliothek zeigt alle Pakete: Inhalte, Karten, Bücher, Module und mehr. Bei jedem Paket stehen Größe und Version. „Installiert“ heißt: Das Paket liegt auf diesem Gerät und geht ohne Internet.
2. **Was passiert beim Installieren?** Die App lädt das Paket und prüft jede Datei. Erst dann ersetzt sie den alten Stand. Bricht der Download ab, macht die App beim nächsten Mal dort weiter.
3. **Was ist die Signatur?** Wir signieren jeden Katalog und jedes Paket. Die App prüft die Signatur vor dem Installieren. Stimmt die Signatur nicht, installiert die App nichts.
4. **Wo liegen die Pakete?** Die Pakete liegen im Datenordner der App. In der Desktop-App kannst du einen anderen Ordner wählen, zum Beispiel eine externe Platte.
5. **Was tut „Entfernen“?** „Entfernen“ löscht das Paket von diesem Gerät. Deine Notizen und dein Tresor bleiben. Du kannst das Paket später wieder installieren.
6. **Was ist ein Modul?** Ein Modul ist ein Paket mit eigener Oberfläche, zum Beispiel ein Spiel. Ein Modul läuft abgeschlossen. Es hat keinen Zugang zum Internet und keinen Zugang zu deinem Tresor. Es speichert höchstens 1 MB eigene Daten.
7. **Warum kann ich ein Paket nicht laden?** Manche Pakete brauchen eine neuere App. Dann steht dort „braucht die App … oder neuer“. Aktualisiere zuerst die App. Manche Pakete gehen nur in der Desktop-App oder nur mit Pro.
8. **Kann ich Pakete ohne Internet einspielen?** Ja, in der Desktop-App. Tippe auf „Einspielen“ und wähle einen USB-Stick oder Ordner. Die App prüft die Signatur auch dann.

### bereit

1. **Was zeigt die Bereit-Zahl?** Die Zahl zeigt, wie gut du auf einen Notfall vorbereitet bist. Sie geht von 0 bis 100. Über 80 heißt: gut vorbereitet.
2. **Woraus entsteht die Zahl?** Die Zahl hat vier Teile: Inhalte (20), Dinge (35), Menschen (25) und Können (20). Jeder Punkt in der Liste zählt zu einem Teil.
3. **Warum sinkt die Zahl?** Vorräte und Absprachen verfallen. Jeder Punkt hat eine Frist, zum Beispiel 12 Monate für Wasser und 6 Monate für Powerbanks. Nach der Frist sinkt der Punkt in drei Monaten auf null.
4. **Was heißt „Bestätigen“?** „Bestätigen“ heißt: Ich habe das heute geprüft. Die App speichert das Datum. Die Frist beginnt neu.
5. **Was zählt die App von selbst?** Österreich-Paket, Wissen, Karte und Notfallmappe zählt die App von selbst. Alles andere bestätigst du.
6. **Warum steht „verdächtig gut“ da?** Über 95 fragt die App nach deinem letzten Probeabend. Ein Probeabend ist ein Abend ohne Strom. Er zeigt, was wirklich fehlt.
7. **Wer sieht meine Zahl?** Nur du. Die Zahl bleibt auf diesem Gerät.

### pause-linie

1. **Was ist „Deine Linie“?** „Deine Linie“ zeigt, wie Pause dich kennt: was du magst, wie schwer es sein soll und was diese Woche war.
2. **Wie wählt Pause einen Happen?** Pause wählt meist etwas Vertrautes, manchmal etwas Ähnliches und selten etwas Neues. Morgen-Happen kommen bis 12 Uhr. Abend-Happen kommen ab 18 Uhr. Dieselbe Form kommt nie zweimal hintereinander.
3. **Was tun „Mehr davon“, „Passt“ und „Nicht mehr“?** „Mehr davon“ bringt diese Form öfter. „Passt“ ändert nichts. „Nicht mehr“ nimmt die Form heraus. Du kannst sie unter „Nicht mehr“ zurückholen.
4. **Wie oft kommt ein Happen?** Das bestimmt dein Appetit: wenig, mittel oder viel. Öffnest du die App innerhalb von 10 Minuten wieder, kommt kein neuer Happen. Im Notfall-Bereich kommt nie ein Happen.
5. **Wie stellt Pause die Schwierigkeit ein?** Pause schaut auf deine Treffer. Bei sehr vielen Treffern wird es schwerer. Bei wenigen Treffern wird es leichter. Du kannst die Stufe auch selbst ändern.
6. **Was ist der Rückspiegel?** Einmal im Monat zeigt Pause, was sich verändert hat. Pause zählt dabei keine Tage und keine Besuche.
7. **Was bewirkt Pause?** Pause ist Training für den Kopf in kleinen Stücken. Pause ersetzt keine ärztliche Behandlung.
8. **Wo liegen meine Daten?** Alles bleibt auf diesem Gerät. „Linie zurücksetzen“ und „Spiel-Log löschen“ löschen deine Daten.

### lumi

1. **Was ist die Lumi?** Die Lumi ist eine Begleiterin aus einer Höhle unter dem Eis. Sie gibt dir Tipps. Sie ist eine erfundene Figur.
2. **Welche Arten gibt es?** Es gibt drei Arten. „Aus mit Textkarten“ zeigt Tipps als Karte. „Lumi mit Tipps“ zeigt die Lumi mit Tipps. „Tipps aus“ zeigt nur die Bereit-Zahl.
3. **Wann sagt die Lumi „ich“?** Die Lumi sagt erst „ich“, wenn du ihr einen Namen gibst. Ohne Namen sagt sie „wir“.
4. **Wie oft kommt ein Tipp?** Du wählst normal, seltener oder aus. Liest du die Tipps, kommen sie etwas öfter. Wischst du sie weg, kommen sie seltener. Pro Sitzung kommen höchstens 12 Tipps.
5. **Was tun „Mehr davon“, „Passt“ und „Nicht mehr“?** „Mehr davon“ bringt diese Sorte öfter. „Passt“ ändert nichts. „Nicht mehr“ bringt diese Sorte seltener, und dieser Satz kommt nicht wieder. Keine Sorte verschwindet ganz. Unter „Was Lumi gelernt hat“ siehst und änderst du das.
6. **Wann schläft die Lumi?** Zuerst von 22 bis 6 Uhr. Danach lernt sie deine Schlafenszeit. Ein Tipp auf die Lumi weckt sie kurz.
7. **Was macht „Merken“?** „Merken“ legt einen Satz in das Heft „Was Lumi gesagt hat“. Gemerkte Sätze bleiben. Du kannst jeden Satz einzeln löschen.
8. **Was tut die Lumi nie?** Die Lumi schickt keine Nachrichten. Sie bettelt nicht. Sie stirbt nicht. Im Notfall-Bereich schweigt sie.
9. **Wo liegen die Daten der Lumi?** Alles bleibt auf diesem Gerät.

### werkzeuge

1. **Was sind die Werkzeuge?** Die Werkzeuge sind kleine Helfer ohne Internet: Radio, Sonne und Mond, Einheiten und Vorrat.
2. **Woher kommen die Radio-Frequenzen?** Du trägst die Frequenzen für dein Bundesland selbst ein. Die App speichert sie auf diesem Gerät. Im Stromausfall hörst du die Lage im Radio, mit Batterie oder Kurbel.
3. **Wie rechnet „Sonne und Mond“?** Die App rechnet ohne Internet. Sie nimmt die Landeshauptstadt deines Bundeslandes. Sie nimmt nicht deinen Standort. Die Zeiten stimmen auf etwa zwei Minuten.
4. **Was rechnet der Vorrat?** Der Vorrat rechnet Wasser und Essen für deinen Haushalt. Er nimmt 2 Liter Wasser pro Person und Tag. Er speichert nichts.
5. **Was rechnen die Einheiten?** Länge, Gewicht, Volumen, Fläche und Temperatur. Dazu kommen Kochmaße.

### lumi-buch

1. **Was ist das Lumi-Buch?** Das Lumi-Buch erzählt, wie die Lumis gelernt haben, gut zusammenzuleben. Es ist eine erfundene Geschichte.
2. **Wie wird ein Stück lesbar?** Unter einem Satz deiner Lumi steht „Aus dem Lumi-Buch“. Tippe darauf. Dann ist dieses Stück im Buch lesbar.
3. **Warum gibt es Lücken?** Manche Stücke hat dir deine Lumi noch nicht erzählt. Manche Stücke kommen erst mit einer neuen Funktion der App. Beide Arten von Lücken siehst du im Buch.
4. **Was zeigt die Prozentzahl?** Die Zahl zeigt, wie viel vom Buch du lesen kannst. 100 % gibt es erst, wenn alle Stücke lesbar sind.
5. **Was ist das Schlussstück?** Das letzte Stück öffnet sich, wenn du den Rest des letzten Kapitels gelesen hast.
6. **Warum sehe ich das Buch nicht?** Das Buch braucht eine eingeschaltete Lumi mit Namen.

## Fertig, wenn
- Teil 1: Der Test ist grün, die Module behalten ihre Daten.
- Teil 2: Alle sieben Seiten haben die Zeile „Info und Hilfe“ als letzte Zeile, das Blatt zeigt den Text Wort für Wort. „Tresor“ nur in der Desktop-App.
- Bilder bei 360 Pixel: Tresor und Lumi-Buch mit offenem Blatt.
- Alle Tests auf drei Systemen und die Windows-Probe sind grün. Dann Freigabe mit „Was ist neu“ und Rückmeldung.
