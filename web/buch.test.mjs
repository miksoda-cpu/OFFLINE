// node --test web/buch.test.mjs – Das Lumi-Buch (Auftrag 2026-10-04-lumi-buch-app): Zuordnung vollständig, Freischalten nur
// durch Öffnen, Prozent und Lücken, Link nur bei der benannten Lumi, keine Zählung und kein Druck.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { freiLaden, freischalten, anteil, buchMitLuecken, linkErlaubt, vorleseTeile, absaetze, LUECKE, LINK_TEXT } from "./buch.js";
import { buchFehler, zuordnungFehler, absatzIds } from "../paket-kit/buch-format.mjs";
import { tippsFehler } from "../paket-kit/tipps-format.mjs";
import { tippKnoepfeHtml } from "./wesen.js";

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
