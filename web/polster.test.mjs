// node --test web/polster.test.mjs – Nr. 34 „Euer Polster“: Rechnung, Sätze, Wortlaut auf Heute, Punkte für Bereit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { polsterRechnen, polsterAngaben, polsterSatz, heuteZeile, polsterPunkte, LICHT_SATZ } from "./polster.js";

test("Wasser-Tage = Liter ÷ (2 × Personen), abgerundet; Polster = das Kleinere", () => {
  assert.equal(polsterRechnen({ personen: 2, liter: 40, essen: 14 }).tage, 10);
  assert.equal(polsterRechnen({ personen: 2, liter: 56, essen: 14 }).tage, 14);
  assert.equal(polsterRechnen({ personen: 3, liter: 50, essen: 30 }).wasserTage, 8);
  assert.equal(polsterRechnen({ personen: 1, liter: 100, essen: 5 }).tage, 5);
  assert.equal(polsterRechnen({}).tage, 0);
  assert.deepEqual(polsterAngaben({ personen: 0, liter: -3, essen: "x", licht: "ja" }), { personen: 1, liter: 0, essen: 0, licht: null });
});

test("Satz zum knappsten Teil; Licht ändert die Tage nicht", () => {
  assert.equal(polsterSatz(polsterRechnen({ personen: 2, liter: 40, essen: 14 })), "Mehr Wasser bringt euer Polster am weitesten.");
  assert.equal(polsterSatz(polsterRechnen({ personen: 1, liter: 40, essen: 3 })), "Mehr Essen bringt euer Polster am weitesten.");
  assert.equal(polsterRechnen({ personen: 2, liter: 40, essen: 14, licht: false }).tage, polsterRechnen({ personen: 2, liter: 40, essen: 14, licht: true }).tage);
  assert.equal(LICHT_SATZ, "Denk auch an Licht: Taschenlampe und Batterien.");
});

test("Wortlaut auf Heute (Mik, 16.10.), ohne Angst-Wörter", () => {
  assert.deepEqual(heuteZeile(polsterRechnen({ personen: 1, liter: 12, essen: 6 })), { titel: "Euer Polster: 6 Tage", klein: "Wasser, Essen, Licht · Ziel 14 Tage" });
  assert.equal(heuteZeile(polsterRechnen({ personen: 1, liter: 2, essen: 1 })).titel, "Euer Polster: 1 Tag");
  assert.deepEqual(heuteZeile(polsterRechnen({})), { titel: "Euer Polster wächst mit jedem Vorrat.", knopf: "Ersten Vorrat eintragen" });
  for (const z of [heuteZeile(polsterRechnen({})), heuteZeile(polsterRechnen({ liter: 99, essen: 99 }))]) assert.doesNotMatch(Object.values(z).join(" "), /blackout|katastroph|überleb/i);
});

test("Punkte für Bereit: Trinkwasser und Lebensmittel ab 14 Tagen, Lampen bei Licht „Ja“", () => {
  assert.deepEqual(polsterPunkte(polsterRechnen({ personen: 2, liter: 56, essen: 14, licht: true })), { trinkwasser: true, lebensmittel: true, lampen: true });
  assert.deepEqual(polsterPunkte(polsterRechnen({ personen: 2, liter: 40, essen: 13, licht: false })), { trinkwasser: false, lebensmittel: false, lampen: false });
});
