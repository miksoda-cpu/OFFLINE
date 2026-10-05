// Naturheilkunde-Bilder (0.6.1, Auftrag 2026-10-05-11): Lizenzen, Nachweise, Doppelgänger zuerst, nur intern.
// Die Inhaltstests brauchen den Klartext (lokal, im Workflow „Interner Kanal“); ohne ihn werden sie übersprungen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { lizenzPruefen, binomen, tafelBestaetigt, KATEGORIEN } from "../pakete/naturheilkunde-bilder/bilder-holen.mjs";
import { bilderIndex, eintragBilder, giftigeArt, bildZeile, naturHtml, findeErgebnis, istWarnung, BILD_SATZ, ERLAUBTE_LIZENZ } from "./natur.js";

const lies = (p) => readFile(new URL(p, import.meta.url), "utf8");
const TEXT = new URL("../pakete/naturheilkunde/inhalt/naturheilkunde.json", import.meta.url);
const NACHWEISE = new URL("../pakete/naturheilkunde-bilder/inhalt/bildnachweise.json", import.meta.url);
const DA = existsSync(TEXT) && existsSync(NACHWEISE);
const MIT = DA ? {} : { skip: "Inhalt nur verschlüsselt im Repo" };
const d = DA ? JSON.parse(await readFile(TEXT, "utf8")) : null;
const n = DA ? JSON.parse(await readFile(NACHWEISE, "utf8")) : null;

test("Lizenzen: nur gemeinfrei, CC0, CC BY, CC BY-SA – NC, ND und alles andere ohne Ausnahme verworfen", () => {
  for (const [l, soll] of [["Public domain", "gemeinfrei"], ["PD-old-100", "gemeinfrei"], ["CC0", "CC0"], ["CC BY 4.0", "CC BY 4.0"], ["CC BY-SA 3.0", "CC BY-SA 3.0"], ["CC BY-SA 2.5", "CC BY-SA 2.5"]]) assert.equal(lizenzPruefen(l).lizenz, soll, l);
  for (const l of ["CC BY-NC 4.0", "CC BY-NC-SA 3.0", "CC BY-ND 2.0", "CC BY-NC-ND 4.0", "GFDL", "GPL", "Copyrighted", "", "Attribution only"]) assert.equal(lizenzPruefen(l).ok, false, l);
  for (const l of ["gemeinfrei", "CC0", "CC BY 4.0", "CC BY-SA 3.0", "CC BY", "CC BY-SA"]) assert.match(l, ERLAUBTE_LIZENZ);
  for (const l of ["CC BY-NC 4.0", "GFDL", "CC BY-ND"]) assert.doesNotMatch(l, ERLAUBTE_LIZENZ);
});

test("Namen und Tafeln: Binomen auch abgekürzt; Tafel nur aus der Kategorie des Werks, Jahr und Urheber mit Herkunft", () => {
  assert.deepEqual(binomen("Betula pendula; B. pubescens"), ["Betula pendula", "Betula pubescens"]);
  assert.deepEqual(binomen("Sambucus nigra ↔ S. ebulus ↔ S. racemosa"), ["Sambucus nigra", "Sambucus ebulus", "Sambucus racemosa"]);
  assert.deepEqual(binomen("Sphagnum spp."), []);
  const thome = { titel: "File:Illustration Taxus baccata0.jpg", datum: "", urheber: "", kategorien: ["Thomé, Flora von Deutschland"] };
  assert.deepEqual(tafelBestaetigt(thome, KATEGORIEN.thome), { ok: true, jahr: 1885, jahr_laut: "Kategorie", urheber: "Otto Wilhelm Thomé", urheber_laut: "Werk" });
  const koehler = { titel: "File:Aconitum napellus - Köhler–s Medizinal-Pflanzen-151.jpg", datum: "1897", urheber: "Franz Eugen Köhler, Köhler's Medizinal-Pflanzen", kategorien: ["Köhlers Medizinal-Pflanzen"] };
  assert.equal(tafelBestaetigt(koehler, KATEGORIEN.koehler).jahr, 1897);
  assert.equal(tafelBestaetigt({ ...koehler, kategorien: ["Aconitum napellus"] }, KATEGORIEN.koehler).ok, false, "nicht in der Kategorie");
  assert.equal(tafelBestaetigt({ ...koehler, datum: "2015" }, KATEGORIEN.koehler).ok, false, "Jahr passt nicht");
});

test("Bildzeile wie im Auftrag; Bilder ohne Nachweis oder mit fremder Lizenz fallen weg", () => {
  assert.equal(bildZeile({ typ: "tafel", werk: "Köhler, Medizinal-Pflanzen", jahr: 1887, lizenz: "gemeinfrei" }), "Tafel: Köhler, Medizinal-Pflanzen, 1887 · gemeinfrei");
  assert.equal(bildZeile({ typ: "foto", urheber: "H. Krisp", lizenz: "CC BY 3.0" }), "Foto: H. Krisp · CC BY 3.0");
  const bi = bilderIndex({ bilder: [
    { datei: "bilder/a.webp", eintraege: ["x"], urheber: "A", quelle: "https://commons.wikimedia.org/wiki/File:A.jpg", lizenz: "CC BY-SA 4.0" },
    { datei: "bilder/b.webp", eintraege: ["x"], urheber: "B", quelle: "https://commons.wikimedia.org/wiki/File:B.jpg", lizenz: "CC BY-NC 4.0" },
    { datei: "bilder/c.webp", eintraege: ["x"], urheber: "", quelle: "https://commons.wikimedia.org/wiki/File:C.jpg", lizenz: "CC0" },
  ] });
  assert.deepEqual(bi.alle.map((b) => b.datei), ["bilder/a.webp"]);
});

test("Kein Bild ohne Nachweis, keine fremde Lizenz, keine Datei ohne Bild (mit Klartext)", MIT, async () => {
  const dateien = (await readdir(new URL("../pakete/naturheilkunde-bilder/inhalt/bilder/", import.meta.url))).filter((f) => f.endsWith(".webp"));
  const nach = new Set(n.bilder.map((b) => b.datei));
  for (const f of dateien) assert.ok(nach.has(`bilder/${f}`), `${f} ohne Eintrag in bildnachweise.json`);
  assert.equal(dateien.length, n.bilder.length);
  for (const b of n.bilder) {
    assert.match(b.lizenz, ERLAUBTE_LIZENZ, b.id); assert.ok(b.urheber && b.quelle?.startsWith("https://commons.wikimedia.org/"), b.id);
    if (b.typ === "tafel") assert.ok(b.werk && b.jahr >= 1880 && b.jahr <= 1914, `${b.id}: Werk und Jahr`);
    assert.ok(b.eintraege.length && b.eintraege.every((id) => d.eintraege.some((e) => e.id === id)), `${b.id}: Einträge`);
  }
});

test("„Ich finde …“ und Warnkarten: giftiger Doppelgänger mit Bild zuerst, roter Rand, der Satz darunter (mit Klartext)", MIT, () => {
  const bi = bilderIndex(n);
  let geprueft = 0;
  for (const w of d.waldfunde_index) {
    const r = findeErgebnis(d, w.merkmal);
    const html = naturHtml(d, { weg: "finde", merkmal: w.merkmal }, bi);
    if (!r.doppelgaenger.length) continue;
    const erstesGift = html.indexOf("natur-link--warn"), essbar = r.kandidaten.find((e) => !istWarnung(e));
    if (essbar) assert.ok(erstesGift < html.indexOf(`data-natur-eintrag="${essbar.id}"`), `${w.merkmal}: Doppelgänger vor ${essbar.name}`);
    if (r.doppelgaenger.some((e) => eintragBilder(d, e, bi).length)) { assert.match(html, /natur-bild--gift/); assert.ok(html.includes(BILD_SATZ)); geprueft++; }
  }
  assert.ok(geprueft >= 3, "mindestens drei Fundmerkmale mit Doppelgänger-Bild");
  // Warnkarte Bärlauch ↔ Herbstzeitlose: Herbstzeitlose (giftig) zuerst, rot; Bärlauch nicht rot
  const karte = d.eintraege.find((e) => e.id === "t1-3-1-baerlauch-herbstzeitlose");
  const b = eintragBilder(d, karte, bi);
  if (b.some((x) => x.art === "Colchicum autumnale") && b.some((x) => x.art === "Allium ursinum")) {
    assert.equal(b[0].art, "Colchicum autumnale"); assert.equal(b[0].gift, true);
    assert.equal(b.find((x) => x.art === "Allium ursinum").gift, false);
  }
  assert.equal(giftigeArt(d, "Allium ursinum"), false); assert.equal(giftigeArt(d, "Colchicum autumnale"), true);
});

test("Bildnachweise als Kapitel im Handbuch (mit Klartext)", MIT, () => {
  const bi = bilderIndex(n);
  assert.match(naturHtml(d, { weg: "handbuch" }, bi), /data-natur-weg="bildnachweise">Bildnachweise/);
  const html = naturHtml(d, { weg: "bildnachweise" }, bi);
  for (const b of bi.alle.slice(0, 20)) { assert.ok(html.includes(decodeURI(b.quelle).replace(/&/g, "&amp;").replace(/'/g, "&#39;")), b.id); }
  assert.match(html, /natur-erste-hilfe/);
});

test("Ohne Bilderpaket geht alles weiter; Bilderpaket nur intern", async () => {
  const q = JSON.parse(await lies("../pakete/naturheilkunde-bilder/paket.quelle.json"));
  assert.equal(q.kanal, "intern");
  assert.ok(!(await readdir(new URL("./pakete/", import.meta.url))).some((x) => x.startsWith("naturheilkunde")));
  assert.doesNotMatch(await lies("./katalog/katalog.json"), /naturheilkunde/);
  const ign = (await lies("../.gitignore")).split("\n");
  for (const z of ["pakete/naturheilkunde-bilder/inhalt/", "pakete/naturheilkunde-bilder/auswahl.json"]) assert.ok(ign.includes(z), z);
  assert.ok(existsSync(new URL("../pakete/naturheilkunde-bilder/verschluesselt/auswahl.json", import.meta.url)), "Auswahl verschlüsselt im Repo");
  const app = await lies("./app.js");
  assert.ok(app.includes("naturHtml(d, state.natur, naturBilder())")); assert.ok(app.includes("const p = installiertesPaket(NATUR_BILDER); if (!p) return null;"));
  const yml = await lies("../.github/workflows/intern.yml");
  assert.ok(yml.includes('node "$b" laden'));
});

test("Im Bereich Naturheilkunde schweigt die Lumi wie im Notfall", async () => {
  const { STILL } = await import("./wesen.js");
  assert.deepEqual(STILL, ["notfall", "natur"]);
  const w = await lies("./wesen.js");
  assert.ok(w.includes("STILL.includes(this.ansichtName)") && w.includes("STILL.includes(name)"));
});
