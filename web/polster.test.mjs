// node --test web/polster.test.mjs – Nr. 34 „Euer Polster“: Rechnung, Sätze, Wortlaut auf Heute, Punkte für Bereit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { polsterRechnen, polsterAngaben, polsterSatz, heuteZeile, polsterPunkte, LICHT_SATZ, anrede } from "./polster.js";

test("Wasser-Tage = Liter ÷ (2 × Personen), abgerundet; Polster = das Kleinere", () => {
  assert.equal(polsterRechnen({ personen: 2, liter: 40, essen: 14 }).tage, 10);
  assert.equal(polsterRechnen({ personen: 2, liter: 56, essen: 14 }).tage, 14);
  assert.equal(polsterRechnen({ personen: 3, liter: 50, essen: 30 }).wasserTage, 8);
  assert.equal(polsterRechnen({ personen: 1, liter: 100, essen: 5 }).tage, 5);
  assert.equal(polsterRechnen({}).tage, 0);
  assert.deepEqual(polsterAngaben({ personen: 0, liter: -3, essen: "x", licht: "ja" }), { personen: 1, liter: 0, essen: 0, licht: null });
});

test("Satz zum knappsten Teil; Licht ändert die Tage nicht", () => {
  assert.equal(polsterSatz(polsterRechnen({ personen: 2, liter: 40, essen: 14 })), "Mit mehr Wasser reichen die Vorräte am längsten.");
  assert.equal(polsterSatz(polsterRechnen({ personen: 1, liter: 40, essen: 3 })), "Mit mehr Essen reichen die Vorräte am längsten.");
  assert.equal(polsterRechnen({ personen: 2, liter: 40, essen: 14, licht: false }).tage, polsterRechnen({ personen: 2, liter: 40, essen: 14, licht: true }).tage);
  assert.equal(LICHT_SATZ, "Denk auch an Licht: Taschenlampe und Batterien.");
});

test("Wortlaut auf Heute (Mik, 17.10., Variante A „Vorräte“), ohne Angst-Wörter und ohne „Polster“", () => {
  assert.deepEqual(heuteZeile(polsterRechnen({ personen: 1, liter: 12, essen: 6 })), { titel: "Deine Vorräte reichen für 6 Tage", klein: "Wasser, Essen, Licht · Ziel 14 Tage" });
  assert.equal(heuteZeile(polsterRechnen({ personen: 1, liter: 2, essen: 1 })).titel, "Deine Vorräte reichen für 1 Tag");
  // Nr. 43: ab 2 Personen „Eure …“ in Überschrift und Leer-Satz
  assert.equal(heuteZeile(polsterRechnen({ personen: 3, liter: 60, essen: 9 })).titel, "Eure Vorräte reichen für 9 Tage");
  assert.equal(heuteZeile(polsterRechnen({ personen: 2 })).titel, "Tragt eure Vorräte ein – dann seht ihr, wie lange sie reichen.");
  assert.deepEqual(heuteZeile(polsterRechnen({})), { titel: "Trag deine Vorräte ein – dann siehst du, wie lange sie reichen.", knopf: "Vorräte eintragen" });
  for (const z of [heuteZeile(polsterRechnen({})), heuteZeile(polsterRechnen({ liter: 99, essen: 99 }))]) assert.doesNotMatch(Object.values(z).join(" "), /blackout|katastroph|überleb|polster/i);
});

test("Punkte für Bereit: Trinkwasser und Lebensmittel ab 14 Tagen, Lampen bei Licht „Ja“", () => {
  assert.deepEqual(polsterPunkte(polsterRechnen({ personen: 2, liter: 56, essen: 14, licht: true })), { trinkwasser: true, lebensmittel: true, lampen: true });
  assert.deepEqual(polsterPunkte(polsterRechnen({ personen: 2, liter: 40, essen: 13, licht: false })), { trinkwasser: false, lebensmittel: false, lampen: false });
});

test("Nr. 43: anrede() – „du“ bei 1 Person und ohne Angabe, „ihr“ erst ab 2", () => {
  assert.deepEqual([undefined, null, 0, 1, "1", 2, 3, 20].map(anrede), ["du", "du", "du", "du", "du", "ihr", "ihr", "ihr"]);
});
