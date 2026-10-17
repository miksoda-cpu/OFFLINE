// node --test web/haushalt.test.mjs – Nr. 40 „Dein Haushalt“: Übernahme der alten Haken, Merkmale für die Filter, Zusammenfassung.
import { test } from "node:test";
import assert from "node:assert/strict";
import { haushaltAngaben, haushaltAusAlt, merkmale, zusammenfassung, haushaltAendern } from "./haushalt.js";
import { passt } from "./szenarien.js";

test("Alte Haken werden übernommen: Ja mit Anzahl 1, Wohnen bleibt, Merkmale gleich wie vorher", () => {
  const h = haushaltAusAlt(["kinder", "tiere", "miete"], 3);
  assert.deepEqual(h, { personen: 3, gruppen: { kinder: 1 }, tiere: { an: true, arten: {} }, wohnen: { form: "wohnung", besitz: "miete", keller: null, stock: null }, eingestellt: true });
  assert.deepEqual(merkmale(h), ["kinder", "tiere", "wohnung", "miete"], "die bisherigen Merkmale bleiben, dazu „wohnung“");
  assert.deepEqual(merkmale(haushaltAusAlt([], null)), [], "nichts eingestellt: die App zeigt alles");
});

test("Eingestellt ohne Haustiere: Tier-Punkte passen nicht mehr; mit Hund schon", () => {
  let h = haushaltAendern(haushaltAngaben({}), "kinder", true);
  const tierPunkt = ["tiere"];
  assert.equal(passt(tierPunkt, merkmale(h)), false);
  h = haushaltAendern(haushaltAendern(h, "tiere", true), "tier-hund", true);
  assert.deepEqual(merkmale(h), ["kinder", "tiere", "tier-hund"]);
  assert.equal(passt(tierPunkt, merkmale(h)), true);
  // Nur „eingestellt“, sonst nichts: nur noch, was für alle gilt
  const leer = haushaltAendern(haushaltAendern(haushaltAngaben({}), "kinder", true), "kinder", false);
  assert.deepEqual(merkmale(leer), ["eingestellt"]); assert.equal(passt(tierPunkt, merkmale(leer)), false); assert.equal(passt(["alle"], merkmale(leer)), true);
  // Die Personenzahl allein filtert nichts
  assert.deepEqual(merkmale(haushaltAendern(haushaltAngaben({}), "personen", 3)), []);
});

test("Babys zählen auch als Kinder; Zusammenfassung in Alltagsdeutsch", () => {
  let h = haushaltAendern(haushaltAngaben({ personen: 3 }), "babys", true);
  h = haushaltAendern(haushaltAendern(h, "tiere", true), "tier-hund", 2);
  assert.deepEqual(merkmale(h), ["babys", "kinder", "tiere", "tier-hund"]);
  assert.equal(zusammenfassung(h), "3 Personen, Babys, 2 Hunde");
});

test("Nachtrag: Wohnen als vier Fragen; alte Haken übernommen, Widersprüchliches nicht geraten", () => {
  assert.deepEqual(haushaltAusAlt(["haus"]).wohnen, { form: "haus", besitz: "eigentum", keller: null, stock: null });
  assert.deepEqual(haushaltAusAlt(["miete"]).wohnen, { form: "wohnung", besitz: "miete", keller: null, stock: null });
  assert.deepEqual(haushaltAusAlt(["keller"]).wohnen, { form: null, besitz: null, keller: true, stock: null }, "Keller ohne Wohnform: Wohnform leer");
  assert.deepEqual(haushaltAusAlt(["haus", "miete"]).wohnen, { form: null, besitz: null, keller: null, stock: null }, "beides: nicht raten");
  assert.deepEqual(merkmale(haushaltAusAlt(["haus", "keller"])), ["haus", "eigentum", "keller"]);
  let h = haushaltAendern(haushaltAngaben({}), "wohnen-form", "wohnung");
  h = haushaltAendern(haushaltAendern(h, "wohnen-stock", 5), "wohnen-keller", "nein");
  assert.deepEqual(h.wohnen, { form: "wohnung", besitz: null, keller: false, stock: 5 });
  assert.deepEqual(merkmale(h), ["wohnung", "stock-hoch"]);
  assert.equal(zusammenfassung(h), "Wohnung im 5. Stock");
  assert.equal(haushaltAendern(h, "wohnen-form", "haus").wohnen.stock, null, "Stock nur bei Wohnung");
});
