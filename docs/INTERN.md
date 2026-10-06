# Interner Kanal

Stand: 06.10.2026 · Auftrag 2026-10-05-08, Weg A, mit Bills Ergänzungen 1–7 · Nachtrag 2026-10-06: Klartext-Wache, Schlüsselwechsel · Auftrag 2026-10-06-13: Regel fürs öffentliche Repo, Freigeben

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
  - Der Schlüssel steht nie im Repo, nie in `bill/` und nie in einem Log. Lokal liegt er in `~/.offline/schluessel/offline-intern-kanal.key`, außerhalb des Repos.
- **Freischalten:** Der Link `https://offline-liart.vercel.app/app.html#kanal=<schlüssel>` geht nur an Mik, aus der lokalen Session in den Chat.
  - Am iPad öffnet er den Link in Safari.
  - In der Desktop-App tippt er siebenmal auf „App 0.x.y“ in „Updates & Abo“ und fügt den Link ein.
  - Die App merkt den Schlüssel nur auf dem Gerät: Desktop `<Datenordner>/intern-kanal.json`, Web im Speicher des Browsers. Nie im Tresor, nie in einer Sicherung.
- **Abgleich:** Still beim Start und bei „Jetzt prüfen“; neuere Pakete spielt die App ein. Die Prüfung ist dieselbe wie beim öffentlichen Katalog: Signatur, Manifest-Prüfsumme, jede Datei.
- **Abschalten:** „Entfernen“ in der Zeile „Interner Kanal: an“ löscht den Schlüssel und die Pakete des Kanals.

## Inhalte im öffentlichen Repo
Das Repo ist öffentlich. Quellen, Paketinhalt und Bericht interner Pakete liegen deshalb nur verschlüsselt in `pakete/<id>/verschluesselt/`, mit demselben Kanal-Schlüssel. Der Klartext liegt nur lokal; `.gitignore` hält ihn fern. Der Workflow „Interner Kanal“ entschlüsselt, prüft (`web/naturheilkunde.test.mjs`, `web/intern.test.mjs`) und baut. Die Tests bei jedem Push laufen ohne Secret und überspringen die Inhaltstests.

Nach einer Änderung am Inhalt lokal neu verschlüsseln. Der Befehl verschlüsselt jede Datei, die schon in `verschluesselt/` liegt, neu aus dem Klartext daneben. Er liest den Schlüssel aus der Datei, er erscheint nicht im Terminal:

    OFFLINE_INTERN_SCHLUESSEL=$(cat ~/.offline/schluessel/offline-intern-kanal.key) node werkzeug/intern.mjs auffrischen pakete/naturheilkunde

Eine neue Datei kommt einmal mit `verschluesseln <ordner> <ziel>` hinein, danach reicht `auffrischen`.

Bilder und Berichte mit Inhalten gehen nicht nach `bill/`, sondern lokal an Bill (Ordner „OFFLINE - Home“).

## Regel fürs öffentliche Repo
Stand 06.10.2026 · Auftrag 2026-10-06-13 · Entscheidung Mik: Das Repo bleibt öffentlich, verschlüsselt wird so viel wie nötig.

1. **Der Code der App bleibt offen.** Die Sicherheit hängt an den Schlüsseln, nicht an verstecktem Code. Private Schlüssel kommen nie ins Repo.
2. **Was nicht freigegeben ist, liegt nur verschlüsselt.** Freigegeben heißt: Es steht in einer veröffentlichten App-Version oder im öffentlichen Katalog. Das gilt für Inhalte, Entwürfe, Bilder und Berichte mit Inhaltsauszügen. Verschlüsselt wird mit dem Kanal-Schlüssel, wie bei der Naturheilkunde.
3. **Was freigegeben ist, liegt offen.** Jeder Nutzer lädt es ohnehin herunter.
4. **`bill/` zählt mit.** Aufträge und Rückmeldungen enthalten keine wörtlichen Auszüge aus Unveröffentlichtem. Der Auszug kommt in eine verschlüsselte Beilage unter `bill/beilagen/`, im Klartext steht nur der Verweis („Beilage A1“).
5. **Die Geschichte bleibt.** Alte Commits werden nicht umgeschrieben; die Regel gilt ab dem 06.10.2026.

**Wo was liegt:**
- Verschlüsselt liegt jede Datei unter `<wurzel>/verschluesselt/<pfad>`, der Klartext daneben unter `<wurzel>/<pfad>`. Er ist nur lokal vorhanden und steht im Block „Klartext-Wache“ der `.gitignore`.
- Die Wurzel ist das Paket (`pakete/<id>`), eine Lieferung im Eingang (`bill/eingang/<lieferung>`) oder `bill/beilagen`.
- Ein Paket, das noch nicht freigegeben ist, trägt in `paket.quelle.json` die Kennzeichnung `"freigegeben": false`. Interne Pakete (`"kanal": "intern"`) gelten ebenso.
  - Unter `"offen"` stehen die Dateien, die trotzdem offen liegen dürfen, etwa `LIESMICH.md` ohne Inhaltsauszug.
  - `inhalte.yml` baut ein solches Paket nie in den öffentlichen Katalog.
- Die CI (`tests.yml`) entschlüsselt alles Verschlüsselte mit dem Kanal-Schlüssel. Nur so prüfen die Inhaltstests auch das Unveröffentlichte. Ohne den Schlüssel, etwa bei einem Pull-Request von außen, werden diese Tests übersprungen.

**Unveröffentlichtes ablegen** (ein neues Paket, eine Beilage, Material von Bill):

    OFFLINE_INTERN_SCHLUESSEL=$(cat ~/.offline/schluessel/offline-intern-kanal.key) node werkzeug/intern.mjs einlagern <wurzel> <pfad…>
    git rm -r --cached <pfad…>          # falls schon im Index

Danach die Pfade in den Block der `.gitignore` schreiben. Bei einem Paket kommt `"freigegeben": false` in die `paket.quelle.json`.

Ändert sich der Inhalt, verschlüsselt `auffrischen <wurzel>` neu.

## Klartext-Wache
Seit dem Nachtrag vom 06.10.2026, Anlass war der Klartext-Commit `2725532` vom 05.10.2026. Vor jedem Commit und jedem Push prüft `werkzeug/klartext-wache.mjs` und bricht ab, wenn
- eine geschützte Datei vorgemerkt ist, auch mit `git add -f`. Geschützt sind:
  - der Block „Klartext-Wache“ der `.gitignore` und jeder Schlüssel (`*.key`),
  - der Klartext zu jeder Datei, die verschlüsselt im Repo liegt,
  - jedes Paket mit `"freigegeben": false` oder `"kanal": "intern"`, außer `paket.quelle.json`, Code und den Dateien unter `"offen"`. Ein neues Paket ist damit geschützt, bevor jemand an die `.gitignore` denkt.
- eine Datei in `verschluesselt/` nicht nach Chiffrat aussieht,
- eine Datei Text aus unveröffentlichten Quellen enthält.
  - Die Quellen sind die Ordner `quelle/`, alles Verschlüsselte unter `bill/` und die `.md` im Inhalt geschützter Pakete.
  - Geprüft wird jedes Stück ab 40 Zeichen. Was schon in der letzten veröffentlichten App-Version steht (Tag `v…`), zählt nicht.
  - Die Fundstelle wird mit Zeilennummer gemeldet.

Einschalten, einmal je Klon:

    git config core.hooksPath .githooks

In der CI prüft der Test `werkzeug/klartext-wache.test.mjs` bei jedem Push das ganze Repo. Dort ist der Klartext entschlüsselt, also prüft er auch die Fingerabdrücke.

Kurze Wendungen, die bewusst öffentlich sind, stehen mit Grund in `werkzeug/klartext-wache-erlaubt.json`, etwa ein Testfall oder ein zitierter Redaktionssatz. Inhalt kommt dort nie hinein.

Ein neuer Ordner mit Unveröffentlichtem gehört in den Block der `.gitignore`, seine Quellen in einen Ordner `quelle/`.

## Schlüssel wechseln
Wann:
- Der Link ist an jemand Falschen gegangen.
- Ein Gerät mit Kanal ist verloren.
- Es besteht der Verdacht, dass jemand den Schlüssel kennt.

Danach öffnet der alte Link nichts mehr.

Schlüssel erscheinen in keinem Schritt im Terminal, in keinem Argument und in keinem Log.

**Was du brauchst:**
- `gh` ist angemeldet.
- Das Repo liegt sauber auf dem Hauptzweig `claude/optimistic-hypatia-yymcne`.
- Der alte Schlüssel liegt in `~/.offline/schluessel/offline-intern-kanal.key`, außerhalb des Repos, mit Rechten 600.

Ohne den alten Schlüssel lässt sich der Inhalt im Repo nicht mehr öffnen. Dann wandelst du ihn aus Bills Beilagen neu um (`pakete/naturheilkunde/naturheilkunde-umwandeln.mjs`) und checkst ihn mit `verschluesseln` neu ein. Schritt 4 entfällt dann.

1. **Zweig anlegen:** `git switch -c kanal-schluessel`
2. **Neuen Schlüssel erzeugen, nur in eine Datei:**

       (umask 077; node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("base64url"))' > ~/.offline/schluessel/offline-intern-kanal.neu.key)

3. **Kennungen notieren.** Die alte verschwindet vom Server, die neue kommt dazu:

       OFFLINE_INTERN_SCHLUESSEL=$(cat ~/.offline/schluessel/offline-intern-kanal.key) node werkzeug/intern.mjs kennung
       OFFLINE_INTERN_SCHLUESSEL=$(cat ~/.offline/schluessel/offline-intern-kanal.neu.key) node werkzeug/intern.mjs kennung

4. **Inhalt im Repo umschlüsseln.** Je Paket alles oder nichts: Passt der alte Schlüssel bei einer Datei nicht, bleibt das Paket unverändert.

       for v in $(git ls-files "*/verschluesselt/*" | sed "s#/verschluesselt/.*#/verschluesselt#" | sort -u); do OFFLINE_INTERN_SCHLUESSEL_ALT=$(cat ~/.offline/schluessel/offline-intern-kanal.key) OFFLINE_INTERN_SCHLUESSEL=$(cat ~/.offline/schluessel/offline-intern-kanal.neu.key) node werkzeug/intern.mjs umschluesseln "$v"; done

5. **Prüfen.** Zuerst muss sich alles mit dem neuen Schlüssel öffnen lassen:

       for v in $(git ls-files "*/verschluesselt/*" | sed "s#/verschluesselt/.*#/verschluesselt#" | sort -u); do OFFLINE_INTERN_SCHLUESSEL=$(cat ~/.offline/schluessel/offline-intern-kanal.neu.key) node werkzeug/intern.mjs entschluesseln "$v" "$(mktemp -d)" > /dev/null && echo "ok $v"; done

   Danach die Wache und die Tests:

       node werkzeug/klartext-wache.mjs alle && node --test werkzeug/klartext-wache.test.mjs web/intern.test.mjs

6. **Committen und pushen.** Die Hooks prüfen mit. Wenn die CI grün ist, auf den Hauptzweig vorspulen. Ab hier passt der Inhalt im Repo nur noch zum neuen Schlüssel, deshalb Schritt 7 und 8 gleich danach.
7. **Secret setzen.** Der Wert kommt aus der Datei über die Eingabe, nicht als Argument:

       gh secret set OFFLINE_INTERN_SCHLUESSEL < ~/.offline/schluessel/offline-intern-kanal.neu.key

8. **Workflow „Interner Kanal“ laufen lassen.** Gab es heute schon eine Ausgabe, eine Version mitgeben (`-f version=JJJJ.MM.TT.2`).

       gh workflow run intern.yml --ref claude/optimistic-hypatia-yymcne
       gh run watch

   Er lädt nach `intern/<neue Kennung>/` und löscht alle anderen Kennungen.
9. **Live prüfen.** Die neue Kennung muss 200 liefern, die alte 403 oder 404:

       curl -s -o /dev/null -w "%{http_code}\n" https://offline-liart.vercel.app/intern/<neue Kennung>/katalog/katalog.json
       curl -s -o /dev/null -w "%{http_code}\n" https://offline-liart.vercel.app/intern/<alte Kennung>/katalog/katalog.json

10. **Schlüsseldatei tauschen:**

        mv ~/.offline/schluessel/offline-intern-kanal.neu.key ~/.offline/schluessel/offline-intern-kanal.key

11. **Neuen Link an Mik, direkt im Chat:** `https://offline-liart.vercel.app/app.html#kanal=<neuer Schlüssel>`. Der Link kommt nie ins Repo, nie nach `bill/` und in keine Datei außer der Schlüsseldatei.
    - **iPad:** den Link in Safari öffnen.
    - **Mac:** in „Updates & Abo“ siebenmal auf „App 0.x.y“ tippen und den Link einfügen.
    - Geräte mit dem alten Schlüssel zeigen still „Interner Kanal abgelaufen“. Das bleibt so, bis jemand den neuen Link öffnet oder den Kanal entfernt.
12. **Aufräumen:**
    - den Zweig `kanal-schluessel` löschen,
    - den Wechsel in `bill/STATUS.md` vermerken, nur mit Datum und neuer Kennung, nie mit dem Schlüssel.

## Freigeben
Erst wenn Mik das Wort gibt. Dann wechselt der Inhalt vom verschlüsselten in den offenen Teil, im selben Zug wie die Veröffentlichung:

1. **Klartext holen:** Liegt er nicht lokal, aus dem Repo entschlüsseln:

       OFFLINE_INTERN_SCHLUESSEL=$(cat ~/.offline/schluessel/offline-intern-kanal.key) node werkzeug/intern.mjs entschluesseln <wurzel>/verschluesselt <wurzel>

2. **Kennzeichnung löschen:** In `paket.quelle.json` die Zeilen `"freigegeben": false` und `"offen"` löschen. Bei einem internen Paket auch `"kanal": "intern"`.
3. **`.gitignore`:** Die Zeilen des Pakets aus dem Block „Klartext-Wache“ löschen.
4. **Verschlüsselte Fassung entfernen und Klartext aufnehmen:**

       git rm -r <wurzel>/verschluesselt/<pfad…>
       git add <wurzel>/<pfad…>

   Nur das, was freigegeben wird. Eine Quelle, die mehr enthält als das Paket, bleibt verschlüsselt. Ein Beispiel ist das Lumisch-Wörterbuch mit Grammatik und Philosophen-Sätzen.
5. **Prüfen:**

       node werkzeug/klartext-wache.mjs vorgemerkt
       node --test werkzeug/klartext-wache.test.mjs

   Der Test „Die Regeln im Repo“ zählt die gekennzeichneten Pakete und muss angepasst werden.
6. **Veröffentlichen:**
   - Textpakete: `inhalte.yml` mit `nur=<id>`, danach `web.yml`.
   - Module und Skins: über die Redaktionsablage (`redaktion/README.md`).

   Erst danach gilt der Inhalt als freigegeben.
7. **Auszüge in `bill/beilagen/`,** die jetzt freigegeben sind, dürfen wieder in den Klartext. Die Beilage kann bleiben.

Der Test `web/intern.test.mjs` prüft, dass die Naturheilkunde bis dahin weder im öffentlichen Katalog noch in `web/pakete/` liegt.
