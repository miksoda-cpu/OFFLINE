# Auftrag: Abgleich, drei Berichte und ein Nachtrag im Pflichtenheft

**Von:** Bill · **Datum:** 2026-09-29 · **Dringlichkeit:** normal

## Ziel
Vier kleine Punkte klären, ohne etwas zu bauen. Drei liefern einen Bericht, einer ist ein Nachtrag in `docs/PAKET-KIT.md`. Fertig, wenn die Rückmeldung die Berichte enthält und der Nachtrag im Repo liegt.

## Hintergrund
Aus den Session-Übergaben vom 29.09. blieben Stellen offen, an denen Sessions und Repo sich widersprechen. Bill hat sie im Lagebild gesammelt. Diese vier gehören zu Code.

## Umfang

**1. Bereit-Patch gegen das Repo (nur Bericht, nichts übernehmen).**
Die Lumis-Session hat einen Patch gebaut (`OFFLINE-Session-Lumis-fuer-Bill/code/OFFLINE-bereit-modul.patch` und `bereit.test.mjs`, im Ordner OFFLINE - Home). Er ist gegen 0.1.4 gebaut. Das Repo hat mit `web/bereit.js` ein Bereit-Modul (Version 1, vier Quellen mit Verfall). Bitte eine Tabelle: was der Patch kann, das `bereit.js` nicht kann (Verfall je Position, fällige Positionen, Menschen und Können, „verdächtig gut“ über 95, Probeabend, die 11 Tests), was doppelt ist, was widerspricht. Dazu deine Empfehlung: übernehmen, teilweise, verwerfen. Übernommen wird erst nach Miks Freigabe.

**2. Skin „Flechte“ im Repo (nur Bericht).**
Die Flechte-Session hat einen Skin mit rund 4 MB Bildern geliefert (`OFFLINE-Session-Flechte/3-skin/skin/`, im Ordner OFFLINE - Home). Bitte melden: Ist er im Repo (Pfad), sind die Bilder da, stimmt der Stand mit der Session überein, oder fehlt etwas (zum Beispiel Schriften, Lizenzdateien, Präfix `of-`, dunkle Fassung)?

**3. Sirenen-Text im Paket at-basis (vorbereiten, nicht veröffentlichen).**
`at-basis/inhalt/sirenen.json`, Feld `warn_app`, sagt, die Sirenen liefen beim Blackout mit Notstrom weiter. Das stimmt nicht allgemein. Ersetze den Text im Quellordner durch diesen Vorschlag und lass ihn beim nächsten Paketbau mitlaufen:
> „Zusätzlich warnt der Staat über AT-Alert (Cell Broadcast) direkt aufs Handy, ohne App und ohne Anmeldung. Beim Blackout fällt das mit dem Handynetz aus. Auch viele Sirenen brauchen Strom und bleiben dann stumm. Wenn keine Sirene heult, heißt das also nicht, dass keine Gefahr besteht. Radio hören.“
Nicht bauen, nicht signieren, nicht hochladen, bis Mik es freigibt. Wenn der Quellordner nicht im Repo liegt, nur melden, wo die Datei liegt.

**4. Nachtrag in `docs/PAKET-KIT.md` (Bill legt fest).**
- **Abnahme:** Das Feld `abnahme` in `paket.quelle.json` führt. Ein Feld `fachlich_abgenommen` in einzelnen Inhalten ist höchstens eine Anzeige des Stands je Inhalt und ersetzt es nie.
- **Quellen:** Der Eintrag `quellen` in `paket.json` bekommt ein Feld `id`. Schritte und Einträge verweisen mit dieser `id` auf die Quelle, sodass die Schlüssel nicht nur im Bauskript stehen.
- **Notfallinhalte:** Der Notrufhinweis aus Regel 5 („Ist jemand in Gefahr?“ mit der Nummer) ist ein Pflichtfeld. `pruefen.mjs` soll das Fehlen als Fehler melden. Das Einbauen in `pruefen.mjs` ist noch **nicht** beauftragt, nur der Eintrag im Pflichtenheft.
- Bitte auch vermerken: `docs/PAKET-KIT.md` gilt, `paket-kit/PFLICHTENHEFT.md` ist die Kopie für Herausgeber und wird nachgezogen, sobald das Repo ihre Grundlage ist.

**Ausdrücklich nicht dabei:** keine Sandbox, kein `window.offline`, keine 180 Tipps, kein Einhängen von `pruefen.mjs`, keine Übernahme des Bereit-Patches.

## Prüfung
Rückmeldung mit den zwei Berichten (Punkt 1 und 2), dem Ort der Datei bei Punkt 3 und dem Commit zu Punkt 4. Push direkt auf den Branch.

## Offene Fragen
Wenn dir bei Punkt 1 eine Übernahme klar sinnvoll erscheint, nenne sie in der Rückmeldung als Vorschlag. Bill legt den Auftrag mit Miks Priorität nach.
