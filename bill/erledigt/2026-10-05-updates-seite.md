# Auftrag: Seite „Updates & Abo“ aufräumen

- Nr.: 2026-10-05-02
- Priorität: zusammen mit `2026-10-05-version-0-5-1` oder direkt danach (0.5.2)
- Quelle: Mik 05.10.2026 (lange Liste, zwei „Neu“-Stellen, „Wie oft?“ zu weit oben, Info-Text am Ende). Bills Vorschlag dazu.

## Neue Reihenfolge der Seite
1. **Stand:** ein Satz („Alles aktuell. Katalog vom 04.10.2026.“) und „Jetzt prüfen“. Die Details zu Signatur und Schlüssel wandern in „Info und Hilfe“.
2. **Was ist neu** (ein Block statt zwei):
   - zwei Reiter: **App** (bisheriger Knopf „Was ist neu“, Quelle `web/neues.json`) und **Inhalte** (bisher „Neu in den Paketen“)
   - auf der Seite stehen nur die drei neuesten Einträge, darunter „Alle anzeigen“
   - „Alle anzeigen“ öffnet ein Blatt: am Handy von unten, am Desktop als Fenster in der Mitte. Es hat einen eigenen Bildlauf, den man mit dem Finger wischt, und ein ✕. Kein Bildlauf-Kasten mitten in der Seite, denn verschachtelte Bildläufe fangen am Handy den Finger.
   - **Punkt für Ungelesenes:** Ein kleiner roter Punkt am Block, am Reiter und am Menüpunkt „Updates & Abo“, solange etwas Neues nicht angesehen ist. Nach dem Ansehen verschwindet er. Keinen grünen Punkt, keine Zahl, kein Abzeichen auf dem App-Symbol (Prinzip „Milde Zugkraft“: kein Zug durch Zähler).
3. **Einstellungen** (zugeklappt, öffnet beim Tippen): Wie oft?, Update-Abo aktiv, Nur im WLAN, Zeitfenster. Darüber eine Zeile mit dem aktuellen Stand, zum Beispiel „Wöchentlich · nur im WLAN“.
4. **Werkzeuge:** Offline-Bereitschaft prüfen, Als App installieren.
5. **Info und Hilfe:** eine Zeile. Sie öffnet ein Blatt wie bei „Alle anzeigen“ mit dem Text unten.
6. **Daten löschen** ganz am Ende, deutlich abgesetzt mit Haarlinie und Abstand: „Alles zurücksetzen“ und „Restlos löschen & deinstallieren“, wie bisher doppelt gesichert. Der Erklärsatz kommt in „Info und Hilfe“.

## Text für „Info und Hilfe“
Geschrieben nach den Regeln von ASD-STE100 auf Deutsch: kurze Sätze, aktive Form, eine Aussage pro Satz, immer dasselbe Wort für dieselbe Sache.

**Was ist ein Update?**
Ein Update bringt neue Inhalte oder eine neue App-Version. Die App lädt nur, was sich geändert hat. Das spart Zeit und Daten.

**Wann lädt die App?**
Die App lädt nur, wenn du online bist. Unter „Wie oft?“ stellst du ein, wie oft sie prüft. „Manuell“ heißt: Die App prüft nur, wenn du „Jetzt prüfen“ tippst.

**Was ist das Update-Abo?**
Das Update-Abo prüft regelmäßig, ob es neue Inhalte gibt. Du kannst es pausieren. Deine Einstellungen bleiben dabei erhalten.

**Was heißt „Nur im WLAN“?**
Die App lädt dann nicht über das Handynetz. Die App lädt auch nicht über einen Handy-Hotspot.

**Was ist das Zeitfenster?**
Im Zeitfenster darf die App laden. Wähle eine Zeit, in der du das Gerät nicht brauchst, zum Beispiel nachts.

**Wie sicher ist ein Update?**
Jedes Paket hat eine Signatur. Die App prüft die Signatur vor dem Laden. Die App prüft auch jede Datei. Erst dann ersetzt die App den alten Stand. Stimmt etwas nicht, behält die App den alten Stand.

**Was zeigt „Was ist neu“?**
Der Reiter „App“ zeigt, was sich an der App geändert hat. Der Reiter „Inhalte“ zeigt, was sich in den Paketen geändert hat. Ein roter Punkt zeigt: Hier gibt es etwas, das du noch nicht gesehen hast.

**Was prüft „Offline-Bereitschaft“?**
Die App prüft, ob alles für die Nutzung ohne Internet am Gerät ist.

**Was tun „Zurücksetzen“ und „Restlos löschen“?**
„Alles zurücksetzen“ löscht alle Daten und lädt die App neu. „Restlos löschen“ löscht alle Daten und die Offline-Kopie. Beide Schritte fragen zweimal nach. Gelöschte Daten kann niemand wiederherstellen, auch wir nicht.

**Woher kommen die Daten?**
Die Pakete kommen von unserem Server. Die App sendet nur die Versionen deiner Pakete. Bei Pro sendet sie auch deinen Lizenzschlüssel. Die App sendet keine Inhalte und keine Notizen.

## Muster für andere Seiten
„Info und Hilfe“ als letzte Zeile mit Blatt ist das Muster für jede Seite mit Erklärtext, zuerst auf „Updates & Abo“. Für weitere Seiten listest du in der Rückmeldung auf, wo es sinnvoll wäre. Bill liefert die Texte.

## Fertig, wenn
- Die Seite hat die neue Reihenfolge. „Wie oft?“ ist zugeklappt unter „Einstellungen“.
- Der rote Punkt erscheint bei Neuem und verschwindet nach dem Ansehen. Ein Test prüft beides.
- Die Blätter lassen sich am Handy bei 360 Pixel mit dem Finger rollen, haben ein ✕ und schließen mit der Zurück-Taste.
- Die Texte sind in „Info und Hilfe“, und der lange Satz am Ende der Seite ist weg.
- Alle Tests und die Windows-Probe sind grün. Freigabe mit „Was ist neu“.
