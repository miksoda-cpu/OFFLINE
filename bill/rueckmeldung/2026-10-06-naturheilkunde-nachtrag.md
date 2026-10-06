# Rückmeldung: Nachtrag zu 0.6.0 und 0.6.1 (Tafel-Sichtprüfung, Klartext-Wache, Schlüsselwechsel)

**Von:** Code (lokale Session) · **Datum:** 2026-10-06 · **Auftrag:** `bill/erledigt/2026-10-06-naturheilkunde-nachtrag.md` · **Branch:** `nachtrag-0-6-2`

Danke für die Bestätigungen: Die Erste-Hilfe-Karte bleibt auf den Unterseiten eine aufklappbare Zeile, und bei den Tafeln entscheidet die Kategorie.

**Keine neue App-Version.** Am Code der App hat sich nichts geändert. Neu sind nur das Bilderpaket im internen Kanal, Werkzeuge, Tests und die Doku. Ein Update für alle hätte nur Lärm gemacht. Es gibt deshalb keinen Tag, kein `desktop.yml`, kein `web.yml` und keinen Eintrag in „Was ist neu“.

## 1. Kontaktbögen aller Tafeln
- **Ich habe alle 98 Tafeln angesehen**, in deiner Reihenfolge:
  - zuerst die 29 Tafeln zu den Einträgen aus Teil 1 (zu 26 Einträgen; manche Karten haben zwei Arten),
  - dann 56 auf den übrigen Warnkarten und in „Ich finde …“,
  - dann die 13 übrigen.
- Die Frage war jedes Mal: Zeigt die Tafel die genannte Art?
- **Verworfen: 1 Tafel.** Die Haselwurz-Tafel (Thomé, „Illustration elaïosome Asarum europaeum“) zeigt nur den Samen als Ausschnitt, nicht die Pflanze.
  - Sie steht in `sichtpruefung.json`, wie die Fotos; der Grund im Bericht ist „Sichtprüfung: …“.
  - Die drei Haselwurz-Einträge zeigen jetzt die zwei schon geprüften Fotos. Köhler hat keine Haselwurz-Tafel auf Commons.
- **Sechs passen, mit Hinweis.** Ich habe sie behalten, du entscheidest:
  - Bei vier Tafeln steht der alte Name derselben Art: Pestwurz, Trauben-Eiche, Stiel-Eiche, Blutwurz.
  - Die Silber-Weide ist als Dotterweide gezeichnet, eine Form der Silber-Weide.
  - Auf der Ehrenpreis-Tafel steht zusätzlich der Breitblättrige Ehrenpreis, beschriftet.
- **Neu im Werkzeug:** Die Sichtprüfung gilt auch beim Laden (`nachSicht`). Was dort verworfen ist, kommt nie ins Paket, auch wenn die Auswahl älter ist. Ein Test prüft das.
- **Zahlen danach:**
  - 209 Bilder, davon 97 Tafeln und 112 Fotos, zusammen 28,8 MB.
  - 139 Einträge mit Tafel, vorher 142.
  - In Teil 1 haben 25 von 46 Einträgen eine Tafel.
- **Bei Mik** in „OFFLINE - Home/naturheilkunde-rueckmeldung/“:
  - im Ordner `kontaktboegen-tafeln/`: 13 Bögen mit Urteil je Bild (grün passt, gelb Hinweis, rot verworfen) und ein `LIESMICH.md`,
  - eine Ebene höher der neue `bilder-bericht.md`.
  - Nicht im Repo, weil die Bögen Inhalte zeigen.
- **Interner Kanal:** Workflow `37420540316` lief grün, die Kennung ist unverändert.
  - **Im Workflow:** Inhaltstests 23 von 23, Bilder 209 von 209 geladen, Bildtests 9 von 9.
  - **Live:** Beide Pakete stehen auf 2026.10.06. Ich habe den Katalog über die Vercel-Adresse entschlüsselt: 209 Bildnachweise, davon 97 Tafeln, keine Haselwurz-Tafel, zwei Haselwurz-Fotos.
  - Freigeschaltete Geräte holen das beim nächsten Start oder bei „Jetzt prüfen“.

## 2. Klartext-Wache vor jedem Commit und Push
- **Was sie tut:** `werkzeug/klartext-wache.mjs` bricht ab, wenn
  - eine Datei aus dem neuen Block „Klartext-Wache“ der `.gitignore` vorgemerkt ist. Das gilt auch mit `git add -f`, und auch für Schlüssel (`*.key`).
  - eine Datei in `verschluesselt/` nach Klartext aussieht statt nach Chiffrat.
  - eine Datei Text aus den Quellen enthält. Geprüft wird jedes Stück ab 40 Zeichen aus `pakete/*/quelle/`. Das geht auch in JSON und mitten im Code. So wäre der Vorfall vom 05.10. aufgefallen, auch ohne `.gitignore`.
- **Wo sie läuft:**
  - als Hook `pre-commit` (vorgemerkte Dateien) und `pre-push` (jede Datei in den Commits, die hinausgehen), in `.githooks/`, eingeschaltet mit `git config core.hooksPath .githooks`,
  - bei jedem Push in der CI: `werkzeug/klartext-wache.test.mjs` prüft das ganze Repo auf allen drei Systemen. Die CI hat keine Quellen, prüft also die Pfade und `verschluesselt/`.
- **Echt ausprobiert, fünf Fälle:**
  - Diese drei hat der Hook beim Commit gestoppt:
    - `git add -f` auf `unzugeordnet.md`,
    - ein Stück Quelltext in einer neuen Datei unter `docs/`,
    - eine Klartext-Datei in `verschluesselt/`.
  - Einen Commit mit `--no-verify` hat der Push-Hook danach gestoppt.
  - Beim ersten echten Commit hat die Wache ihre eigene Freigabeliste angehalten. Die Regel ist jetzt angepasst: Die Liste darf genau ihre Einträge enthalten.
- **Freigaben:** Kurze Wendungen, die bewusst öffentlich sind, stehen mit Grund in `werkzeug/klartext-wache-erlaubt.json`. Ein Test verlangt einen Grund und höchstens 160 Zeichen je Wendung. Heute sind es zwei:
  - ein zitierter Redaktionssatz in der Rückmeldung zu 0.6.0,
  - ein Redaktionsvermerk als Testfall.
  Inhalt kommt dort nie hinein.

## 3. Schlüsselwechsel Schritt für Schritt
- **`docs/INTERN.md`** hat jetzt den Abschnitt „Schlüssel wechseln“ in 12 Schritten:
  - wann wechseln,
  - neuen Schlüssel nur in eine Datei erzeugen,
  - Kennungen notieren,
  - den Inhalt im Repo umschlüsseln,
  - prüfen,
  - Commit und CI,
  - das Secret aus der Datei setzen,
  - den Workflow starten,
  - live prüfen: neue Kennung 200, alte 403 oder 404,
  - die Schlüsseldatei tauschen,
  - den neuen Link an Mik im Chat,
  - aufräumen.
- Kein Schritt zeigt den Schlüssel im Terminal, als Argument oder im Log.
- Dazu gibt es zwei neue Befehle in `werkzeug/intern.mjs`:
  - **`umschluesseln`:** alter Schlüssel zu neuem, je Paket alles oder nichts. Passt der alte Schlüssel bei einer Datei nicht, bleibt alles unverändert.
  - **`auffrischen`:** verschlüsselt nach einer Inhaltsänderung genau die Dateien neu, die schon in `verschluesselt/` liegen.
- Ein Test prüft beides und dass die Doku die Schritte enthält.
- Einen echten Wechsel habe ich nicht gemacht; dafür gab es keinen Anlass.

## Tests
- Web: 140 von 140 (vorher 138; neu: Sichtprüfung beim Laden, Schlüsselwechsel).
- Werkzeug: 39 von 39 (33 Paketformat, 6 Klartext-Wache).
- CI auf drei Systemen grün, Windows-Probe grün.

## Offen
- **Bei Mik:**
  - **Schlüsseldatei:** Der Kanal-Schlüssel liegt bisher nur in meinem Sitzungsordner. Die Doku rechnet mit `~/.offline/schluessel/offline-intern-kanal.key`, mit Rechten 600. Ich durfte die Datei dort nicht selbst anlegen; Mik legt sie an oder gibt mir das Wort dafür. Ohne diese Datei geht nach dem Ende der Sitzung kein Schlüsselwechsel mit Umschlüsseln mehr. Dann bleibt nur der Neubau aus deinen Beilagen.
  - **Commit `2725532`:** Ob er über den GitHub-Support entfernt wird, ist weiter Miks Entscheidung.
- **Bei dir:** Die Sechs mit Hinweis behalten oder verwerfen? Meine Empfehlung: behalten.
