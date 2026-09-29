# Rückmeldung: Antwort von Bill vom 29.09., Paket-Kit in den Stamm

**Von:** Code (lokale Session) · **Datum:** 2026-09-29 · **Auftrag:** `bill/erledigt/2026-09-29-antwort-bill-an-code.md` und Miks Anweisung vom 29.09.

## Ergebnis
- `paket-kit/` liegt jetzt im Repo-Stamm, **inhaltlich unverändert** aus `bill/eingang/2026-09-29-bill/material/paket-kit/` verschoben (`git mv`, keine Doppelung). Zeile in der README-Tabelle.
- Bills Antwort liegt als `bill/erledigt/2026-09-29-antwort-bill-an-code.md` ab.
- `docs/SICHERHEIT.md`: die drei Bedingungen für Module als eigener Abschnitt *Entwurf, gilt erst nach Miks Freigabe*. Grundsatz 2 („Pakete enthalten nie Code“) bleibt bis dahin unverändert.
- `bill/STATUS.md`: Die Zeile über fehlende Dateien ist angepasst. Die Dateien sind da, das Einhängen wartet auf Miks Priorität. Die Pfade zu Wichteln zeigen jetzt auf `paket-kit/beispiel/wichteln/`.

## Tipps gezählt
Wie in der Rückmeldung `2026-09-29-material-uebergabe`: Paket `wir` 2026.09.29 im Repo hat **53** Tipps, das Material hat **180**.

## Abweichungen
- `paket-kit/PFLICHTENHEFT.md` und `docs/PAKET-KIT.md` sind nicht wortgleich. Die Kit-Fassung hat zusätzlich ein Ablaufdiagramm (Mermaid) und nennt das Repo `miksoda-cpu/OFFLINE`. Sonst sind sie gleich. Weil der Ordner unverändert bleiben sollte, habe ich nichts angeglichen. Vorschlag: `docs/PAKET-KIT.md` ist maßgeblich, und die Kit-Fassung ist die Kopie für Herausgeber, die ohne das Repo arbeiten.

## Nicht gemacht
- Kein `window.offline`, keine Sandbox, kein Einbau von Wichteln. Das wartet auf Miks Antwort auf Frage 11 und die Priorität.
- `pruefen.mjs` ist nicht in `werkzeug/test.mjs` eingehängt und läuft nicht in CI.
- Die 180 Tipps sind nicht übernommen. Sie liegen weiter in `bill/eingang/2026-09-29-bill/material/pakete/wir/`, Formatangleich siehe `2026-09-29-material-uebergabe`.
- `kategorie` und `alter_ab` für `at-basis` und `wir` kommen beim nächsten Bau dazu, wie besprochen.

## Geprüft
- `node paket-kit/pruefen.mjs` gegen eine Kopie von `paket-kit/beispiel/wichteln` aus dem Repo-Stamm (Node 24): keine Fehler. Der eingecheckte Prüfbericht ist nicht überschrieben.

## Fragen an Bill
Keine.
