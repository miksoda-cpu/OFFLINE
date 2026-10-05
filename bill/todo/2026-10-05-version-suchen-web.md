# Auftrag: „Nach neuer Version suchen“ auch am iPad und iPhone

- Nr.: 2026-10-05-06
- Priorität (Mik, 05.10.): hoch. Zusammen mit 0.5.4.
- Mik: „Ich kann nicht mehr nach der aktuellen Version suchen und updaten! Der Block ‚App 0.5.2 · Die App holt sich neue Versionen selbst … Nach neuer Version suchen‘ ist gut. Im iPad ist er nicht.“

## Befund (Bill, Stand 131efad)

- `appUpdateZeile()` steht in `web/app.js` nur bei `desktop ? appUpdateZeile() : ""`. In der Web-Version am iPad und iPhone, auch als Symbol am Home-Bildschirm, gibt es keine Zeile mit Version und keinen Knopf.
- Der Service Worker lädt mit „Netz zuerst“. Eine iOS-Web-App bleibt aber oft lange offen und lädt nicht neu. Der Nutzer sieht also eine alte Version und kann nichts tun.

## Was genau

1. **Die Zeile gibt es überall.** Am iPad, iPhone und im Browser steht unter „Stand“ dieselbe Zeile wie am Desktop:
   „App 0.5.x · Die App holt sich neue Versionen selbst.“ und der Knopf „Nach neuer Version suchen“.
2. **Was der Knopf im Web tut:**
   - Er fragt die aktuelle Versionsnummer vom Server ab, ohne Cache (zum Beispiel eine kleine `version.json`, die der Web-Workflow mit schreibt).
   - Ist sie gleich: „Du hast die neueste Version (0.5.x).“
   - Ist sie neuer: „Version 0.5.y ist da.“ und der Knopf „Jetzt laden“. Der lädt den Service Worker neu (`registration.update()`, dann neu laden, wenn der neue aktiv ist). Daten im Gerät bleiben.
   - Ohne Netz: „Gerade kein Internet. Die App läuft weiter mit 0.5.x.“
3. **Von selbst:** Beim Öffnen der App, höchstens einmal am Tag und nur mit Netz, prüft die Web-Version still. Ist eine neue Version da, steht der rote Punkt bei „Updates & Abo“ wie bei „Was ist neu“, und die Zeile zeigt „Version 0.5.y ist da“. Kein Fenster, keine Unterbrechung.
4. **Versionsnummer auch im Web anzeigen**, damit Mik und Nutzer sehen, was läuft.
5. **Info und Hilfe** bekommt eine Frage dazu (Schlüssel `updates`, nach „Was ist ein Update?“):
   „Wie bekomme ich die neue App-Version?“ – „Tippe auf ‚Nach neuer Version suchen‘. Ist eine neue Version da, tippe auf ‚Jetzt laden‘. Deine Daten bleiben auf dem Gerät.“

## Fertig, wenn
- Am iPad (Safari und Home-Bildschirm) und am iPhone stehen Version und Knopf. Eine ältere Web-Version erkennt die neuere und lädt sie mit einem Tipp.
- Ein Test deckt die drei Fälle ab: gleich, neuer, ohne Netz.
- Bilder bei 360 Pixel und am iPad-Format (1024 × 768): Zeile mit „Version … ist da“ und „Jetzt laden“.
- Alle Tests auf drei Systemen und die Windows-Probe sind grün. Freigabe mit 0.5.4.
