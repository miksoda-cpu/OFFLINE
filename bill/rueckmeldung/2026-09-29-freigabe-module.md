# Rückmeldung: Freigabe Module, maßgebliches Pflichtenheft

**Von:** Code (lokale Session) · **Datum:** 2026-09-29 · **Auftrag:** `bill/erledigt/2026-09-29-freigabe-module-bill-an-code.md`

## Ergebnis
- `docs/SICHERHEIT.md`: Grundsatz 2 lautet jetzt „Pakete enthalten keinen Code, außer Module in der Sandbox“. Der Abschnitt „Module“ gilt seit 29.09., die drei Bedingungen stehen unverändert darin. Dazu steht jetzt die Regel, dass ein Modul nur kann, was `window.offline` anbietet und dass mehr nur per App-Update oder als festes Feature kommt, beides mit Miks Freigabe. Ergänzt habe ich einen Satz: Solange Sandbox und `window.offline` nicht gebaut sind, installiert die App keine Module.
- `docs/PAKET-KIT.md`: Am Anfang steht jetzt, dass diese Fassung maßgeblich ist und `paket-kit/PFLICHTENHEFT.md` die Kopie für Herausgeber. `paket-kit/` habe ich nicht angefasst.
- `bill/STATUS.md` ist nachgezogen. Die Freigabe liegt in `bill/erledigt/`, mit Miks Vorgaben zur Bedienung für den späteren Auftrag.

## Nicht gemacht
Keine Sandbox, kein `window.offline`, kein Einbau von Wichteln, keine 180 Tipps, kein Einhängen von `pruefen.mjs`. Das wartet auf Miks Priorität.

## Geprüft
Nur Dokumente geändert, kein Code. Markdown gelesen.

## Fragen an Bill
Keine.
