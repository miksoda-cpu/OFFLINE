// „Was die Lumis denken“ (Auftrag 2026-10-06-12, App 0.6.2): 15 Gedanken mit allen Feldern und Bild, jedes Lumisch-Wort
// im Wörterbuch (Eigennamen ausgenommen), Text wörtlich aus der Beilage, Seiten in der verlangten Reihenfolge.
// Solange das Paket nicht freigegeben ist, liegt der Inhalt nur verschlüsselt im Repo; ohne Klartext werden die Inhaltstests
// übersprungen (die CI entschlüsselt).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { seitenListe, inhaltHtml, seiteHtml, vorleseTeile, PAKET } from "./gedanken.js";
import { gedankenFehler, lumischWoerter, FELDER } from "../paket-kit/gedanken-format.mjs";

const url = (p) => new URL(p, import.meta.url);
const lies = (p) => readFile(url(p), "utf8");
const DATEI = url("../pakete/lumi-philosophie/inhalt/gedanken.json");
const QUELLE = url("../pakete/lumi-philosophie/quelle/texte.md");
const MIT = existsSync(DATEI) ? {} : { skip: "Inhalt nur verschlüsselt im Repo" };
const d = existsSync(DATEI) ? JSON.parse(await readFile(DATEI, "utf8")) : null;

test("15 Gedanken, jeder mit allen Feldern und einem Bild im Paket", MIT, async () => {
  assert.equal(d.gedanken.length, 15);
  const bilder = (await readdir(url("../pakete/lumi-philosophie/inhalt/bilder/"))).map((f) => `bilder/${f}`);
  assert.deepEqual(gedankenFehler(d, bilder), []);
  for (const g of d.gedanken) {
    for (const k of FELDER) assert.ok(String(g[k] ?? "").trim(), `${g.nr}: ${k}`);
    assert.ok(bilder.includes(g.bild), `${g.nr}: ${g.bild}`);
  }
  assert.deepEqual(d.gedanken.map((g) => g.nr), Array.from({ length: 15 }, (_, i) => i + 1));
  assert.equal(d.gedanken[0].wer, "Sokrates"); assert.equal(d.gedanken[9].lumisch, "Sisyphos kik.");
  assert.deepEqual(d.gedanken.slice(12).map((g) => g.wer), ["Die Lumis", "Die Lumis", "Die Lumis"], "zwölf Philosophen, drei Lumis");
});

test("Kein Lumisch-Wort fehlt im Wörterbuch (Eigennamen wie „Sisyphos“ ausgenommen)", MIT, async () => {
  const wb = new Set(JSON.parse(await lies("../pakete/pause/inhalt/pause.json")).lumisch.woerterbuch.map((w) => w.wort));
  const eigen = new Set();
  for (const g of d.gedanken) {
    const { woerter, eigennamen } = lumischWoerter(g.lumisch);
    assert.ok(woerter.length, `${g.nr}: kein Wort`);
    for (const w of woerter) assert.ok(wb.has(w), `${g.nr}: „${w}“ fehlt im Wörterbuch`);
    eigennamen.forEach((e) => eigen.add(e));
  }
  assert.deepEqual([...eigen], ["Sisyphos"]);
  assert.deepEqual(lumischWoerter("Sisyphos kik."), { woerter: ["kik"], eigennamen: ["Sisyphos"] });
});

test("Kein Text umgeschrieben: gedanken.json ist genau die Beilage", { skip: existsSync(QUELLE) && d ? false : "Beilage nur verschlüsselt im Repo" }, async () => {
  const { umwandeln, KOPF } = await import("../pakete/lumi-philosophie/gedanken-umwandeln.mjs");
  const u = umwandeln(await readFile(QUELLE, "utf8"));
  assert.deepEqual(d, { format: 1, ...KOPF, ...u });
  const md = await readFile(QUELLE, "utf8");
  for (const g of d.gedanken) { assert.ok(md.includes(g.text), `${g.nr}: Text wörtlich`); assert.ok(md.includes(`**Umschrift:** ${g.umschrift}`), `${g.nr}: Umschrift`); }
  assert.ok(!d.einleitung && !d.schluss, "die Beilage hat keine Einleitung und keinen Schluss");
});

test("Seite: Bild, Name, Titel, Lumisch groß mit Lautsprecher, Wort für Wort, Deutsch, Text; Blättern und Inhalt", MIT, () => {
  const html = seiteHtml(d, 0);
  const reihe = ['data-gedanke-bild="bilder/01.webp"', "Sokrates", "Was wir nicht wissen", "nu sap nesap.", 'data-hoeren="nu sap ne sap."', "wir wissen Nichtwissen", "Wir wissen, dass wir nichts wissen.", "Bei den Menschen gilt der Satz"];
  let pos = 0;
  for (const s of reihe) { const p = html.indexOf(s, pos); assert.ok(p >= pos, `${s} kommt in der Reihenfolge`); pos = p + s.length; }
  assert.match(html, /data-gedanke="1">Alles fließt →/); assert.doesNotMatch(html, /data-gedanke="-1"/);
  assert.match(html, /href="#gedanken">Inhalt/);
  assert.match(seiteHtml(d, 9), /data-hoeren="Sisyphos kik\."/, "spricht die Umschrift");
  assert.match(seiteHtml(d, 14), /data-gedanke="13">← Der Tod/); assert.doesNotMatch(seiteHtml(d, 14), /→<\/button>/);
  const toc = inhaltHtml(d);
  assert.equal((toc.match(/data-gedanke="/g) ?? []).length, 15);
  for (const g of d.gedanken) assert.ok(toc.includes(g.titel.replace(/&/g, "&amp;")), g.titel);
  assert.match(toc, /Fünfzehn Gedanken, für Erwachsene/); assert.match(toc, /Die Lumis sind erfunden, die Philosophen nicht\./);
  assert.deepEqual(vorleseTeile(d, 0).slice(0, 2), ["Was wir nicht wissen. Sokrates.", "Wir wissen, dass wir nichts wissen."]);
});

test("Einleitung und Schluss werden eigene Seiten, wenn das Paket sie hat", () => {
  const mini = { titel: "T", untertitel: "U", hinweis: "H erfunden", einleitung: "Am Anfang.", schluss: "Am Ende.", gedanken: [{ nr: 1, wer: "W", titel: "G", lumisch: "nu", wort_fuer_wort: "wir", umschrift: "nu", deutsch: "wir", bild: "bilder/01.webp", text: "Text." }] };
  assert.deepEqual(seitenListe(mini).map((s) => s.art), ["einleitung", "gedanke", "schluss"]);
  assert.match(seiteHtml(mini, 0), /Am Anfang\./); assert.match(seiteHtml(mini, 2), /data-gedanke="1">← G/);
  assert.deepEqual(seitenListe({ ...mini, einleitung: undefined, schluss: undefined }).map((s) => s.art), ["gedanke"]);
  assert.ok(gedankenFehler({ ...mini, format: 1, gedanken: [{ ...mini.gedanken[0], lumisch: "" }] }).some((f) => /lumisch fehlt/.test(f)));
  assert.ok(gedankenFehler({ ...mini, format: 1, hinweis: "kein Hinweis" }).some((f) => /hinweis/.test(f)));
});

test("Für Erwachsene, öffentlich mit der nächsten Version; keine Tipps, nicht für Kinder", async () => {
  const q = JSON.parse(await lies("../pakete/lumi-philosophie/paket.quelle.json"));
  assert.equal(q.id, PAKET); assert.equal(q.art, "inhalt"); assert.equal(q.alter_ab, 18);
  assert.equal(q.titel, "Was die Lumis denken"); assert.equal(q.beschreibung, "Fünfzehn Gedanken, für Erwachsene.");
  assert.equal(q.hinweis, "Die Lumis sind erfunden, die Philosophen nicht.");
  assert.equal(q.app_min, "0.6.2"); assert.equal(q.pro, false); assert.ok(!q.kanal, "nicht intern");
  assert.ok(!existsSync(url("../pakete/lumi-philosophie/inhalt/tipps.json")), "keine Tipps, also auch keine der Sorte „Kind“");
  const wir = JSON.parse(await lies("../pakete/wir/inhalt/tipps.json"));
  assert.ok(!JSON.stringify(wir).includes("lumi-philosophie") && !JSON.stringify(wir).includes("#gedanke"), "kein Tipp zeigt auf das Paket");
});

test("Paket klein: unter 10 MB, Bilder höchstens 1200 Pixel", MIT, async () => {
  let summe = 0;
  for (const f of await readdir(url("../pakete/lumi-philosophie/inhalt/bilder/"))) summe += (await stat(url(`../pakete/lumi-philosophie/inhalt/bilder/${f}`))).size;
  assert.ok(summe < 10e6, `${summe} Byte`);
  const b = await readFile(url("../pakete/lumi-philosophie/inhalt/bilder/01.webp"));
  // WebP (VP8 verlustbehaftet): Breite und Höhe stehen ab Byte 26 als 14-Bit-Werte
  assert.equal(b.toString("ascii", 12, 16), "VP8 ");
  const breite = b.readUInt16LE(26) & 0x3fff, hoehe = b.readUInt16LE(28) & 0x3fff;
  assert.ok(Math.max(breite, hoehe) <= 1200, `${breite} × ${hoehe}`);
});

test("App: Lesen aus der Bibliothek, Hinweis auf der Karte, Bilder im Cache-Speicher, Lautsprecher spricht", async () => {
  const app = await lies("./app.js"), client = await lies("./paket-client.js");
  assert.ok(app.includes('p.id === GEDANKEN_PAKET ? `<a class="btn btn-sm of-btn of-btn--klein" href="#gedanken">Lesen</a> `'));
  assert.ok(app.includes("p.hinweis ? `<p class=\"muted of-klein pkg-hinweis\">${esc(p.hinweis)}</p>`"));
  assert.ok(app.includes("gedanken() {") && app.includes("gedanke() {") && app.includes("gedankenNachZeichnen()"));
  assert.ok(app.includes("lumischSprechen(b.dataset.hoeren)"));
  assert.ok(client.includes("if (bild) neueBilder.push([datei.pfad, bytes])") && client.includes("c.put(bildSchluessel(eintrag.id, pfad)"));
  const lib = await lies("../werkzeug/paket-lib.mjs");
  assert.equal((lib.match(/"alter_ab", "hinweis"/g) ?? []).length, 2, "hinweis wandert ins Manifest und in den Katalog");
});
