// node --test web/haushalt.test.mjs – Nr. 40 „Dein Haushalt“: Übernahme der alten Haken, Merkmale für die Filter, Zusammenfassung.
import { test } from "node:test";
import assert from "node:assert/strict";
import { haushaltAngaben, haushaltAusAlt, merkmale, zusammenfassung, haushaltAendern, tierText } from "./haushalt.js";
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

test("Nr. 44: Tier-Punkte nie ohne gewählte Tiere, auch nicht, wenn nichts eingestellt ist; je Tierart nur bei dieser Art", () => {
  assert.equal(passt(["tier"], []), false); assert.equal(passt(["tier-hund"], []), false);
  let h = haushaltAendern(haushaltAendern(haushaltAngaben({}), "tiere", true), "tier-hund", 2);
  h = haushaltAendern(h, "tier-katze", 1);
  const m = merkmale(h);
  assert.equal(passt(["tier"], m), true); assert.equal(passt(["tier-hund"], m), true); assert.equal(passt(["tier-katze"], m), true);
  assert.equal(passt(["tier-vogel"], m), false); assert.equal(passt(["tier-andere"], m), false);
  assert.equal(passt(["tier"], merkmale(haushaltAendern(haushaltAngaben({}), "kinder", true))), false, "Kinder, keine Tiere");
  // bisherige Punkte für Tiere (mit „tiere“) verhalten sich wie vorher
  assert.equal(passt(["tiere"], []), true); assert.equal(passt(["tiere", "behinderung"], ["behinderung"]), true);
});

test("Nr. 44: Anzahl im Text – {anzahl} je Tierart, {tiere} alle gewählten, sonst allgemein", () => {
  let h = haushaltAendern(haushaltAendern(haushaltAngaben({}), "tiere", true), "tier-hund", 2);
  h = haushaltAendern(h, "tier-katze", 1);
  assert.equal(tierText("Futter für 14 Tage für {tiere}", ["tier"], h), "Futter für 14 Tage für 2 Hunde und 1 Katze");
  assert.equal(tierText("Wasser für {anzahl}: etwa 50–60 ml je kg Körpergewicht und Tag", ["tier-hund"], h), "Wasser für 2 Hunde: etwa 50–60 ml je kg Körpergewicht und Tag");
  assert.equal(tierText("Wasser für {anzahl}: frisch und frei verfügbar", ["tier-katze"], h), "Wasser für 1 Katze: frisch und frei verfügbar");
  const drei = haushaltAendern(haushaltAendern(h, "tier-vogel", 3), "tier-reptilien", 1);
  assert.equal(tierText("Futter für 14 Tage für {tiere}", ["tier"], drei), "Futter für 14 Tage für 2 Hunde, 1 Katze, 3 Vögel und 1 Reptil");
  assert.equal(tierText("Futter für 14 Tage für {tiere}", ["tier"], haushaltAendern(haushaltAngaben({}), "tiere", true)), "Futter für 14 Tage für deine Tiere", "Tiere an, keine Art gewählt");
  assert.equal(tierText("Kotbeutel", ["tier-hund"], h), "Kotbeutel");
});
