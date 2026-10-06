# Auftrag: Regel für das öffentliche Repo

- **Nr.:** 2026-10-06-13
- **Priorität:** mittel, gern vor oder mit der Lumi-Philosophie.
- **Entscheidung Mik (06.10.):**
  - Das Repo bleibt öffentlich.
  - Verschlüsselt wird so viel wie nötig.

## Die Regel

1. **Der Code der App bleibt offen.**
   - Die Sicherheit hängt an den Schlüsseln, nicht an verstecktem Code.
   - Private Schlüssel kommen nie ins Repo. Das gilt weiter.
2. **Was noch nicht freigegeben ist, liegt nur verschlüsselt.**
   - Freigegeben heißt: Es steht in einer veröffentlichten App-Version oder im öffentlichen Katalog.
   - Das gilt für Inhalte, Entwürfe, Bilder und Berichte mit Inhaltsauszügen.
   - Verschlüsselt wird mit dem Verfahren, das du für die Naturheilkunde gebaut hast.
3. **Was freigegeben ist, darf offen liegen.**
   - Jeder Nutzer lädt es ohnehin herunter.
   - Verschlüsseln brächte hier nichts, es macht nur den Bau schwerer.
4. **`bill/` zählt mit.**
   - Aufträge und Rückmeldungen dürfen keine wörtlichen Auszüge aus Inhalten enthalten, die noch nicht freigegeben sind.
   - Wo das nötig ist, kommt der Auszug in eine verschlüsselte Beilage.
   - Im Klartext steht nur der Verweis.
5. **Die Geschichte bleibt, wie sie ist.**
   - Kein Umschreiben alter Commits.
   - Die Regel gilt ab jetzt.

## Was genau

1. **Bestandsaufnahme:**
   - Liste aller Inhaltsdateien im Repo, die im Klartext liegen.
   - Je Datei: freigegeben ja oder nein.
   - Die Liste kommt in die Rückmeldung.
2. **Verschlüsseln:**
   - Alles, was nicht freigegeben ist, wird verschlüsselt.
   - Der Klartext bleibt lokal und steht in `.gitignore`.
3. **Klartext-Wache erweitern:**
   - Sie erkennt künftig auch unveröffentlichte Inhalte anderer Pakete, nicht nur die Naturheilkunde.
   - Ein Weg dafür ist eine Kennzeichnung in der Paketquelle, zum Beispiel `"freigegeben": false`.
4. **Freigabe-Schritt in `docs/INTERN.md`:**
   - Beschreibe, wie ein Inhalt beim Freigeben vom verschlüsselten in den offenen Teil wechselt.

## Fertig, wenn

- Die Liste liegt in der Rückmeldung.
- Kein unveröffentlichter Inhalt liegt im Klartext im Repo.
- Die Wache stoppt einen Test-Commit mit einem unveröffentlichten Inhalt.
- Alle Tests sind grün.
