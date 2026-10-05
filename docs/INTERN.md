# Interner Kanal

Stand: 05.10.2026 (0.6.0) · Auftrag 2026-10-05-08, Weg A, mit Bills Ergänzungen 1–7

Pakete, die nur auf freigeschalteten Geräten erscheinen, etwa die Naturheilkunde vor der fachlichen Prüfung. Für alle anderen gibt es sie nicht: kein Menüpunkt, keine leere Seite, keine Zeile in „Updates & Abo“.

## So funktioniert es
- **Paket intern machen:** In `pakete/<id>/paket.quelle.json` steht `"kanal": "intern"`. Dann baut `inhalte.yml` (textpakete) das Paket nicht.
- **Hochladen:** Workflow „Interner Kanal“ (`gh workflow run intern.yml`). Er tut der Reihe nach:
  - Er baut alle internen Pakete und signiert sie mit dem Paketschlüssel der CI.
  - Er baut einen eigenen Katalog und signiert ihn.
  - Er verschlüsselt jede Datei mit AES-256-GCM.
  - Er lädt alles nach `intern/<kennung>/` hoch und löscht andere Kennungen.
- **Schlüssel:**
  - Secret `OFFLINE_INTERN_SCHLUESSEL` (32 Byte, base64url).
  - Die Kennung ist SHA-256 über „offline-intern:“ und den Schlüssel, die ersten 16 Hex-Zeichen.
  - Der Schlüssel steht nie im Repo, nie in `bill/` und nie in einem Log.
- **Freischalten:** Der Link `https://offline-liart.vercel.app/app.html#kanal=<schlüssel>` geht nur an Mik, aus der lokalen Session in den Chat.
  - Am iPad öffnet er den Link in Safari.
  - In der Desktop-App tippt er siebenmal auf „App 0.x.y“ in „Updates & Abo“ und fügt den Link ein.
  - Die App merkt den Schlüssel nur auf dem Gerät: Desktop `<Datenordner>/intern-kanal.json`, Web im Speicher des Browsers. Nie im Tresor, nie in einer Sicherung.
- **Abgleich:** Still beim Start und bei „Jetzt prüfen“; neuere Pakete spielt die App ein. Die Prüfung ist dieselbe wie beim öffentlichen Katalog: Signatur, Manifest-Prüfsumme, jede Datei.
- **Abschalten:** „Entfernen“ in der Zeile „Interner Kanal: an“ löscht den Schlüssel und die Pakete des Kanals.

## Inhalte im öffentlichen Repo
Das Repo ist öffentlich. Quellen, Paketinhalt und Bericht interner Pakete liegen deshalb nur verschlüsselt in `pakete/<id>/verschluesselt/`, mit demselben Kanal-Schlüssel. Der Klartext liegt nur lokal; `.gitignore` hält ihn fern. Der Workflow „Interner Kanal“ entschlüsselt, prüft (`web/naturheilkunde.test.mjs`, `web/intern.test.mjs`) und baut. Die Tests bei jedem Push laufen ohne Secret und überspringen die Inhaltstests.

Nach einer Änderung am Inhalt lokal neu verschlüsseln. Der Befehl liest den Schlüssel aus der Datei, er erscheint nicht im Terminal:

    OFFLINE_INTERN_SCHLUESSEL=$(cat <schlüsseldatei>) node werkzeug/intern.mjs verschluesseln <klartext-ordner> pakete/naturheilkunde/verschluesselt

Bilder und Berichte mit Inhalten gehen nicht nach `bill/`, sondern lokal an Bill (Ordner „OFFLINE - Home“).

## Schlüssel wechseln
1. Neuen Schlüssel erzeugen: `node -e 'console.log(require("crypto").randomBytes(32).toString("base64url"))'`. Der Befehl gibt ihn nur im eigenen Terminal aus.
2. Ins Secret setzen: `gh secret set OFFLINE_INTERN_SCHLUESSEL`, Wert über die Eingabe, nicht als Argument.
3. Den Inhalt im Repo mit dem neuen Schlüssel neu verschlüsseln (siehe oben) und committen.
4. Workflow „Interner Kanal“ laufen lassen. Die alte Kennung wird gelöscht. Geräte mit altem Schlüssel zeigen still „Interner Kanal abgelaufen“.
5. Neuen Link an Mik, direkt im Chat.

## Freigeben
Wenn Mik ein internes Paket freigibt:
1. In `paket.quelle.json` die Zeile `"kanal": "intern"` löschen.
2. `inhalte.yml` mit `nur=<id>` laufen lassen, danach `web.yml`.

Mehr ist nicht nötig. Der Test `web/intern.test.mjs` prüft, dass die Naturheilkunde bis dahin weder im öffentlichen Katalog noch in `web/pakete/` liegt.
