// node --test web/vorrat.test.mjs – Nr. 42 Vorratsliste: Rechnung, Ablauf, Einkaufsliste, Übernahme aus Nr. 34.
import { test } from "node:test";
import assert from "node:assert/strict";
import { vorratRechnen, eintragAngaben, ablaufDatum, abgelaufen, ablaufend, einkaufsliste, ausPolster, literVorschlag, mahlzeitenVorschlag, EINHEITEN } from "./vorrat.js";
import { vorlage, formularHtml, GLAESER_HINWEIS } from "./vorrat-ansicht.js";
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

// Nr. 45 (Mik 19.10.2026): Eingekochtes in Gläsern
test("Nr. 45: Einheit „Gläser“; Vorlage Eingekochtes = 6 Mahlzeiten, Ablauf in 12 Monaten; Marmelade 0 Mahlzeiten", () => {
  assert.ok(EINHEITEN.includes("Gläser"));
  assert.equal(mahlzeitenVorschlag(6, "Gläser"), 6, "1 Mahlzeit je Glas wie bei Dosen");
  const alle = Array.from({ length: 20 }, (_, i) => vorlage(i, "2026-10-19")).filter((v) => v.produkt);
  const ein = alle.find((v) => v.produkt === "Eingekochtes"), mar = alle.find((v) => v.produkt === "Marmelade");
  assert.deepEqual(ein, { produkt: "Eingekochtes", menge: 6, einheit: "Gläser", art: "essen", ablauf: "2027-10" });
  assert.equal(eintragAngaben(ein).mahlzeiten, 6);
  assert.equal(mar.ablauf, "2027-10"); assert.equal(eintragAngaben(mar).mahlzeiten, 0, "Marmelade zählt nicht zum Essen");
  assert.equal(vorlage(alle.indexOf(ein), "2026-12-05").ablauf, "2027-12", "über den Jahreswechsel");
  // Reihenfolge: gleich nach „Dosen“
  const namen = alle.map((v) => v.produkt);
  assert.deepEqual(namen.slice(namen.indexOf("Bohnen"), namen.indexOf("Bohnen") + 3), ["Bohnen", "Eingekochtes", "Marmelade"]);
  // Bestehende Einträge bleiben: Rechnung mit Gläsern wie mit Dosen
  assert.equal(vorratRechnen([e({ produkt: "Eingekochtes", menge: 6, einheit: "Gläser", art: "essen" })], 1, HEUTE).mahlzeiten, 6);
});
test("Nr. 45: Hinweis wortgleich und nur bei der Einheit „Gläser“; ohne Einkochzeiten oder Temperaturen", () => {
  assert.equal(GLAESER_HINWEIS, "Selbst Eingekochtes hält etwa ein Jahr – kühl, dunkel und trocken gelagert. Ist der Deckel lose oder gewölbt, der Inhalt trüb oder riecht er komisch: nicht essen. Gewölbte Gläser ungeöffnet wegwerfen. Gemüse und Fleisch vor dem Essen noch einmal ganz durchkochen.");
  assert.ok(formularHtml({ einheit: "Gläser", art: "essen" }).includes(GLAESER_HINWEIS));
  for (const einheit of ["Stück", "Dosen", "Packungen"]) assert.ok(!formularHtml({ einheit, art: "essen" }).includes("Eingekochtes hält"), einheit);
  assert.doesNotMatch(GLAESER_HINWEIS, /°|Minuten|Grad|\d/, "keine Zahlen außer „etwa ein Jahr“");
});
