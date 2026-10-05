// node --test web/buch.test.mjs – Das Lumi-Buch (Auftrag 2026-10-04-lumi-buch-app): Zuordnung vollständig, Freischalten nur
// durch Öffnen, Prozent und Lücken, Link nur bei der benannten Lumi, keine Zählung und kein Druck.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { freiLaden, freischalten, anteil, buchMitLuecken, linkErlaubt, vorleseTeile, absaetze, absatz, wartendeAbsaetze, mitSchluss, LUECKE, LUECKE_WARTET, LINK_TEXT } from "./buch.js";
import { buchFehler, zuordnungFehler, absatzIds } from "../paket-kit/buch-format.mjs";
import { tippsFehler } from "../paket-kit/tipps-format.mjs";
import { tippKnoepfeHtml, FUNKTIONEN } from "./wesen.js";

const json = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), "utf8"));
const buch = await json("../pakete/lumi-buch/inhalt/buch.json");
const tipps = (await json("../pakete/wir/inhalt/tipps.json")).tipps;
const zuordnung = await json("../pakete/lumi-buch/quelle/OFFLINE-Lumi-Buch-Zuordnung.json");

test("Paket lumi-buch: Format, 12 Kapitel, 127 Absätze, Titelseite mit „Eine erfundene Geschichte“", () => {
  assert.deepEqual(buchFehler(buch), []);
  assert.equal(buch.kapitel.length, 12);
  assert.equal(absatzIds(buch).length, 127);
  assert.match(buch.hinweis, /^Eine erfundene Geschichte/);
  for (const a of absaetze(buch)) assert.doesNotMatch(a.text, /Tipps:|`/, `${a.id}: keine Redaktionszeile im Text`);
});

test("Zuordnung: alle 175 Tipps zeigen auf einen vorhandenen Absatz, jeder Absatz hat mindestens einen Tipp", () => {
  assert.equal(tipps.length, 175);
  assert.equal(tipps.filter((t) => t.buch).length, 175, "jeder Tipp hat buch");
  assert.deepEqual(zuordnungFehler(buch, tipps), []);
  assert.deepEqual(tippsFehler({ tipps }), []);
  for (const t of tipps) assert.equal(t.buch, zuordnung[t.id], `${t.id} wie in der Zuordnung von Bill`);
});

test("Freischalten: nur vorhandene Absätze, jeder einmal; Anteil abgerundet, 100 % erst bei allen", () => {
  let f = freiLaden(null);
  assert.equal(anteil(buch, f), 0);
  f = freischalten(f, buch, "b1-01-03", Date.parse("2026-10-05T10:00:00Z"));
  f = freischalten(f, buch, "b1-01-03");
  f = freischalten(f, buch, "b9-99-99");
  assert.deepEqual(f.absaetze, ["b1-01-03"]);
  assert.equal(f.seit, "2026-10-05T10:00:00.000Z");
  assert.equal(anteil(buch, f), 0, "1 von 127 ist abgerundet 0 %");
  for (const id of absatzIds(buch).slice(0, 30)) f = freischalten(f, buch, id);
  assert.equal(anteil(buch, f), Math.floor((30 / 127) * 100)); // 23 %
  const alle = absatzIds(buch).reduce((x, id) => freischalten(x, buch, id), freiLaden(null));
  assert.equal(anteil(buch, alle), 100);
  assert.equal(anteil(buch, { absaetze: absatzIds(buch).slice(1) }), 99, "einer fehlt: noch nicht 100");
});

test("Buch mit Lücken: Kapitel in Reihenfolge, fehlende Absätze hintereinander sind eine stille Lücke", () => {
  const f = { absaetze: ["b1-01-02", "b1-01-05", "b1-12-06"] };
  const k = buchMitLuecken(buch, f);
  assert.deepEqual(k.map((x) => x.nr), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.deepEqual(k[0].teile.map((t) => t.art === "absatz" ? t.id : "·"), ["·", "b1-01-02", "·", "b1-01-05", "·"]);
  assert.deepEqual(k[1].teile, [{ art: "luecke" }], "Kapitel ohne Lesbares: eine Lücke");
  assert.equal(k[11].teile.at(-1).id, "b1-12-06");
  assert.equal(LUECKE, "Dieses Stück hat dir deine Lumi noch nicht erzählt.");
  const v = vorleseTeile(buch, f);
  assert.equal(v[0], "Kapitel 1: Der Fluss"); assert.equal(v.length, 2 + 2 + 1, "nur lesbare Kapitel und Absätze, keine Lücken");
});

test("Link „Aus dem Lumi-Buch“: nur benannte Lumi mit Figur, nicht bei Textkarten, nicht bei „Tipps aus“", () => {
  const t = tipps.find((x) => x.buch);
  const lumi = { darstellung: "wesen", name: "Susi", takt: "normal" };
  assert.equal(linkErlaubt(t, lumi, buch), true);
  assert.equal(linkErlaubt(t, { ...lumi, name: "" }, buch), false, "ohne Namen nicht");
  assert.equal(linkErlaubt(t, { ...lumi, darstellung: "karten" }, buch), false, "Textkarten nicht");
  assert.equal(linkErlaubt(t, { ...lumi, takt: "aus" }, buch), false, "Tipps aus: das Buch wächst nicht");
  assert.equal(linkErlaubt(t, lumi, null), false, "ohne Paket nicht");
  assert.equal(linkErlaubt({ ...t, buch: undefined }, lumi, buch), false);
  const mit = tippKnoepfeHtml(t, { ort: "blase", buch: true }), ohne = tippKnoepfeHtml(t, { ort: "blase" });
  assert.ok(mit.includes(LINK_TEXT) && mit.includes(`data-lumi-buch="${t.buch}"`)); assert.ok(!ohne.includes(LINK_TEXT));
  assert.match(mit, /class="z-neben lumi-buch-link"/, "zarter Textlink, kein Knopf");
});

test("Milde Zugkraft: keine Zahlen außer dem Anteil, kein Druck in den Texten", async () => {
  const quelle = await readFile(new URL("./buch.js", import.meta.url), "utf8") + await readFile(new URL("./app.js", import.meta.url), "utf8");
  const teil = quelle.slice(quelle.indexOf("// ---------- Das Lumi-Buch"), quelle.indexOf("// ---------- Das Lumi-Buch ende")).replace(/^\s*\/\/.*$/gm, "");
  assert.ok(teil.length > 200, "Abschnitt in app.js gefunden");
  assert.doesNotMatch(teil, /nur noch|noch \$\{|fehlen noch|schneller|Tage(n)? in Folge|Serie/, "kein Hinweis aufs schnellere Freischalten, keine Zählung");
  assert.match(teil, /% lesbar/);
});

test("0.5.1: Absätze, die heute niemand erreichen kann, aus den Bedingungen berechnet, mit eigener Lücke", async () => {
  const w = wartendeAbsaetze(tipps, FUNKTIONEN);
  // erwartet: genau die Absätze, deren Tipps alle auf eine fehlende Funktion warten (Stand 0.5.1: zwölf)
  const je = {}; for (const t of tipps) (je[t.buch] ??= []).push(t);
  const soll = Object.keys(je).filter((id) => je[id].every((t) => t.bedingung?.funktion && !FUNKTIONEN.has(t.bedingung.funktion))).sort();
  assert.deepEqual([...w].sort(), soll);
  assert.equal(w.size, 12);
  assert.ok(w.has("b1-12-06") && !w.has("b1-05-09"), "b1-05-09 hängt an app-004 (Funktion „gelernt“ gibt es)");
  // nicht fest im Code: mit der fehlenden Funktion wird der Absatz erreichbar
  const funktion = je["b1-01-12"][0].bedingung.funktion;
  assert.ok(!wartendeAbsaetze(tipps, new Set([...FUNKTIONEN, funktion])).has("b1-01-12"));
  const quelle = await readFile(new URL("./buch.js", import.meta.url), "utf8") + await readFile(new URL("./app.js", import.meta.url), "utf8");
  assert.doesNotMatch(quelle, /"b1-(01-12|02-08|10-07)"/, "keine feste Liste im Code");
  // zwei Arten von Lücken
  const k = buchMitLuecken(buch, { absaetze: ["b1-01-11"] }, w);
  assert.deepEqual(k[0].teile.map((t) => t.art), ["luecke", "absatz", "wartet"]);
  assert.equal(LUECKE_WARTET, "Dieses Stück erzählt sie, sobald OFFLINE so weit ist.");
  assert.deepEqual(buchMitLuecken(buch, null)[0].teile, [{ art: "luecke" }], "ohne Liste wie bisher");
});

test("0.5.1: Schlussstück b1-12-06 wird frei, sobald die anderen fünf Absätze von Kapitel 12 gelesen sind; neuer Satz", () => {
  const k12 = buch.kapitel.at(-1).absaetze.map((a) => a.id);
  assert.deepEqual(k12, ["b1-12-01", "b1-12-02", "b1-12-03", "b1-12-04", "b1-12-05", "b1-12-06"]);
  let f = freiLaden(null);
  for (const id of k12.slice(0, 4)) f = freischalten(f, buch, id);
  assert.ok(!f.absaetze.includes("b1-12-06"), "vier von fünf reichen nicht");
  f = freischalten(f, buch, "b1-12-05");
  assert.ok(f.absaetze.includes("b1-12-06"), "nach dem fünften kommt das Schlussstück");
  assert.ok(mitSchluss({ absaetze: k12.slice(0, 5) }, buch).absaetze.includes("b1-12-06"), "auch für schon gelesene Stände");
  assert.match(absatz(buch, "b1-12-06").text, /Die Tagesseite ist immer der Anfang\. Wenn man weiter will, geht man ein Stück weiter, und dann kommt das Wissen\./);
  assert.doesNotMatch(absatz(buch, "b1-12-06").text, /wischt/);
});

test("0.5.4: drei Absätze in Kapitel 9 und 11 Wort für Wort neu, Nummern und Zuordnung gleich, Freigeschaltetes bleibt", async () => {
  const neu = await json("../pakete/lumi-buch/quelle/neufassung-2026-10-05.json");
  assert.deepEqual(Object.keys(neu).sort(), ["b1-09-01", "b1-11-01", "b1-11-05"]);
  for (const [id, text] of Object.entries(neu)) assert.equal(absatz(buch, id).text, text, id);
  assert.equal(buch.hinweis, "Eine erfundene Geschichte.");
  assert.equal(absatzIds(buch).length, 127);
  const f = freischalten(freiLaden(null), buch, "b1-11-01");
  assert.ok(buchMitLuecken(buch, f)[10].teile.some((t) => t.id === "b1-11-01" && t.text === neu["b1-11-01"]), "wer ihn freigeschaltet hat, liest den neuen Text");
});
