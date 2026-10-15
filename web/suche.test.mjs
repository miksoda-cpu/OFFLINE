// Nr. 30: Regeln der Suche (suche.js) ohne Browser
import { test } from "node:test";
import assert from "node:assert/strict";
import { norm, begriffe, indexBauen, suchen, hervorheben, zeile } from "./suche.js";

const idx = indexBauen([
  { rang: 2, bereich: "Vorsorge", titel: "Kerzen und Teelichter", text: "Für einen Blackout.", ziel: {} },
  { rang: 1, bereich: "Szenario Blackout · Jetzt vorsorgen", titel: "Licht ohne Strom", text: "Taschenlampe statt Kerze, wegen Brandgefahr.", ziel: {} },
  { rang: 3, bereich: "Naturheilkunde", titel: "Kümmel", text: "Für den Bauch.", ziel: {} },
]);

test("ab zwei Buchstaben, ohne Groß/Klein, ä = ae, Wortanfänge, alle Wörter", () => {
  assert.equal(norm("Größe Übel Äpfel"), "groesse uebel aepfel");
  assert.deepEqual(begriffe("a Kerze  kerze"), ["kerze"]);
  assert.deepEqual(suchen(idx, "kerze").map((e) => e.titel), ["Licht ohne Strom", "Kerzen und Teelichter"], "Rang vor Reihenfolge; Kerze findet Kerzen");
  assert.deepEqual(suchen(idx, "KUEMMEL").map((e) => e.titel), ["Kümmel"]);
  assert.deepEqual(suchen(idx, "kerze strom").map((e) => e.titel), ["Licht ohne Strom"], "alle Wörter müssen vorkommen");
  assert.deepEqual(suchen(idx, "erze"), [], "nur Wortanfänge");
  assert.deepEqual(suchen(idx, "k"), []);
});

test("Hervorheben und eine Zeile Text", () => {
  assert.equal(hervorheben("Kerzen <und> Licht", "kerze"), "<b>Kerzen</b> &lt;und&gt; Licht");
  const z = zeile("Wort ".repeat(40) + "Kerze am Ende und noch etwas Text danach", "kerze", 60);
  assert.ok(z.startsWith("… ") && z.includes("<b>Kerze</b>"), z);
});

test("Antwortzeit: 3000 Einträge unter 150 ms", () => {
  const gross = indexBauen(Array.from({ length: 3000 }, (_, i) => ({ rang: i % 7, bereich: "B", titel: `Eintrag ${i}`, text: "Wasser für zwei Wochen, Kerzen, Taschenlampe, Batterien, Radio mit Kurbel. ".repeat(3), ziel: {} })));
  const t0 = performance.now(); const r = suchen(gross, "wasser kurbel"); const ms = performance.now() - t0;
  assert.equal(r.length, 60); assert.ok(ms < 150, `${ms.toFixed(1)} ms`);
});
