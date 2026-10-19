// node --test web/vorrat.test.mjs – Nr. 42 Vorratsliste: Rechnung, Ablauf, Einkaufsliste, Übernahme aus Nr. 34.
import { test } from "node:test";
import assert from "node:assert/strict";
import { vorratRechnen, eintragAngaben, ablaufDatum, abgelaufen, ablaufend, einkaufsliste, ausPolster, literVorschlag, mahlzeitenVorschlag } from "./vorrat.js";
import { polsterSatz } from "./polster.js";

const HEUTE = "2026-10-17";
const e = (x) => eintragAngaben(x);

test("2 Personen, 40 l, 42 Mahlzeiten → 7 Tage Essen, 10 Tage Wasser → reichen für 7 Tage, Satz zum Essen", () => {
  const r = vorratRechnen([e({ produkt: "Wasser", menge: 40, einheit: "Liter", art: "wasser" }), e({ produkt: "Nudeln", menge: 21, einheit: "Packungen", art: "essen" })], 2, HEUTE);
  assert.equal(r.mahlzeiten, 42); assert.equal(r.essenTage, 7); assert.equal(r.wasserTage, 10); assert.equal(r.tage, 7);
  assert.equal(polsterSatz(r), "Mit mehr Essen reichen die Vorräte am längsten.");
});

test("Abgelaufenes zählt nicht mit; Monat/Jahr gilt bis Monatsende", () => {
  assert.equal(ablaufDatum("2026-10"), "2026-10-31"); assert.equal(ablaufDatum("2026-02"), "2026-02-28"); assert.equal(ablaufDatum(""), null);
  const alt = e({ produkt: "Wasser alt", menge: 20, einheit: "Liter", art: "wasser", ablauf: "2026-09" }), neu = e({ produkt: "Wasser", menge: 8, einheit: "Liter", art: "wasser", ablauf: "2027-06" });
  assert.equal(abgelaufen(alt, HEUTE), true); assert.equal(abgelaufen(neu, HEUTE), false);
  assert.equal(vorratRechnen([alt, neu], 1, HEUTE).liter, 8);
  assert.equal(vorratRechnen([e({ produkt: "Kerzen", menge: 1, art: "licht", ablauf: "2026-01" })], 1, HEUTE).licht, null, "abgelaufenes Licht zählt nicht");
});

test("Bald ablaufend (30 Tage) und Einkaufsliste: Abgelaufenes, bald Ablaufendes, was bis 14 Tage fehlt", () => {
  const liste = [e({ produkt: "Bohnen", menge: 6, einheit: "Dosen", art: "essen", ablauf: "2026-10-29" }), e({ produkt: "Milch", menge: 2, einheit: "Liter", art: "essen", ablauf: "2026-10-10" }), e({ produkt: "Reis", menge: 2, einheit: "kg", art: "essen", ablauf: "2028-01" })];
  assert.deepEqual(ablaufend(liste, HEUTE).map((x) => [x.e.produkt, x.t]), [["Milch", -7], ["Bohnen", 12]]);
  const k = einkaufsliste(liste, 1, HEUTE).map((x) => x.text);
  assert.deepEqual(k, ["2 Liter Milch (abgelaufen)", "6 Dosen Bohnen (läuft in 12 Tagen ab)", "noch 28 Liter Wasser", "Essen für noch 28 Mahlzeiten", "Taschenlampe und Batterien"]);
});

test("Übernahme aus Nr. 34: drei Sammel-Einträge, gleiche Tage wie vorher", () => {
  const a = ausPolster({ liter: 40, essen: 14, licht: true }, 2);
  assert.deepEqual(a.map((x) => x.produkt), ["Wasser (bisherige Angabe)", "Essen für 14 Tage (bisherige Angabe)", "Licht (bisherige Angabe)"]);
  const r = vorratRechnen(a, 2, HEUTE);
  assert.deepEqual([r.wasserTage, r.essenTage, r.licht], [10, 14, true]);
  assert.deepEqual(ausPolster({}, 1), []);
});

test("Vorschläge aus Menge und Einheit", () => {
  assert.equal(literVorschlag(6, "Flaschen"), 9); assert.equal(literVorschlag(10, "Liter"), 10);
  assert.equal(mahlzeitenVorschlag(6, "Dosen"), 6); assert.equal(mahlzeitenVorschlag(2, "kg"), 8);
  assert.equal(e({ produkt: "Wasser", menge: 6, einheit: "Flaschen", art: "wasser" }).liter, 9);
  assert.equal(e({ produkt: "Wasser", menge: 6, einheit: "Flaschen", art: "wasser", liter: 12 }).liter, 12, "änderbar");
});
