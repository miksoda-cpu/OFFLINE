// Auftrag Nr. 20 (0.8.0): zwölf Szenarien, Grundvorsorge in sechs Bereichen, Radio je Bundesland, Sirenen zum Anhören.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { passt, punkteFuer, zusaetze, fortschritt, szenarioFortschritt, checksUebertragen, verweisZiel, exportText, TEILE } from "./szenarien.js";
import { POSITIONEN, datumFuer } from "./bereit.js";

const url = (p) => new URL(p, import.meta.url);
const lies = (p) => readFile(url(p), "utf8");
const json = async (p) => JSON.parse(await lies(p));
const I = "../pakete/at-basis/inhalt/";
const reihe = (await json(`${I}szenarien.json`)).reihenfolge;
const karten = Object.fromEntries(await Promise.all(reihe.map(async (id) => [id, await json(`${I}szenarien/${id}.json`)])));
const grund = await json(`${I}grundvorsorge.json`), radio = await json(`${I}radio.json`), sirenen = await json(`${I}sirenen.json`);
const alt = await json(`${I}alt/vorsorge-0.7.json`);
const HAUSHALT_KEYS = ["alle", "kinder", "aeltere", "pflege", "behinderung", "tiere", "haus", "miete", "keller"];

test("Inhalte: zwölf Karten in Bills Reihenfolge, alle Teile da, Verweise führen irgendwohin", async () => {
  assert.deepEqual(reihe, ["hochwasser", "starkregen", "wildbach", "hitze", "hagel", "schnee-eis", "lawine", "erdbeben", "waldbrand", "kernkraftwerk", "krankheiten", "blackout"]);
  assert.deepEqual((await readdir(url(`${I}szenarien/`))).filter((f) => f.endsWith(".json")).sort(), reihe.map((id) => `${id}.json`).sort());
  for (const [id, k] of Object.entries(karten)) {
    assert.equal(k.id, id);
    for (const [teil] of TEILE) assert.ok(k[teil]?.length, `${id}: ${teil}`);
    assert.ok(k.merksaetze.length && k.checkliste_spezifisch.length && k.quellen.length, id);
    for (const z of Object.keys(k.zusatz)) assert.ok(HAUSHALT_KEYS.includes(z), `${id}: zusatz ${z}`);
    for (const v of k.verweise) assert.ok(verweisZiel(v, grund, karten), `${id}: Verweis ${v} führt nirgends hin`);
  }
  assert.ok(!(await readdir(url(I))).includes("blackout.json") && !(await readdir(url(I))).includes("vorsorge.json"), "ersetzt");
});

test("Verweise wie im Auftrag: Karten, Grundvorsorge, Hausapotheke, Radio, Notrufe", () => {
  for (const v of ["blackout", "hochwasser", "starkregen", "wildbach"]) assert.equal(verweisZiel(v, grund, karten).hash, `#szenario-${v}`);
  for (const v of ["notfall-rucksack", "grundvorsorge", "vorrat"]) assert.equal(verweisZiel(v, grund, karten).hash, "#vorsorge");
  assert.equal(verweisZiel("notfall-rucksack", grund, karten).anker, "gv-notfall-rucksack");
  assert.deepEqual(verweisZiel("hausapotheke", grund, karten), { hash: "#vorsorge", anker: "gv-gesundheit-hygiene", name: grund.bereiche.find((b) => b.id === "gesundheit-hygiene").titel });
  assert.equal(verweisZiel("radio", grund, karten).anker, "radio");
  assert.equal(verweisZiel("notrufe", grund, karten).anker, "notrufe");
});

test("Grundvorsorge: sechs Bereiche, 74 Punkte mit eindeutiger id, alle 20 alten Punkte wortgleich enthalten", () => {
  assert.deepEqual(grund.bereiche.map((b) => b.id), ["wasser-essen", "licht-strom-info", "gesundheit-hygiene", "dokumente-geld", "notfallplan", "notfall-rucksack"]);
  const punkte = grund.bereiche.flatMap((b) => b.punkte);
  assert.equal(punkte.length, 74); assert.equal(new Set(punkte.map((p) => p.id)).size, 74);
  for (const p of punkte) for (const f of p.fuer) assert.ok(HAUSHALT_KEYS.includes(f), `${p.id}: ${f}`);
  const texte = new Set(punkte.map((p) => p.text));
  for (const g of alt.gruppen) for (const t of g.punkte) assert.ok(texte.has(t), t);
});

test("Häkchen bleiben: alte Schlüssel über den Text auf die neuen ids, Bereit zählt vorher und nachher gleich", () => {
  const vorher = { "0-0": true, "1-0": true, "3-2": true, "3-4": false, fremd: true };
  const { checks, geaendert } = checksUebertragen(vorher, alt, grund);
  assert.ok(geaendert);
  assert.deepEqual(checks, { trinkwasser: true, radio: true, treffpunkt: true, fremd: true });
  assert.deepEqual(checksUebertragen(checks, alt, grund), { checks, geaendert: false }, "zweimal = einmal");
  // jede Bereit-Position zeigt auf einen Punkt der Grundvorsorge, ihre id bleibt (Bestätigungen bleiben gültig)
  const ids = new Set(grund.bereiche.flatMap((b) => b.punkte.map((p) => p.id)));
  const mitCheck = POSITIONEN.filter((p) => p.check);
  assert.equal(mitCheck.length, 20);
  for (const p of mitCheck) { assert.ok(ids.has(p.check), p.check); assert.equal(p.id, `c-${p.alt}`); }
  // Solange das neue Paket noch nicht da ist, zählt der alte Schlüssel weiter
  const pos = POSITIONEN.find((p) => p.id === "c-0-0"), am = "2026-10-01T10:00:00.000Z";
  assert.equal(datumFuer(pos, { checks: { "0-0": true }, bestaetigt: { "c-0-0": am } }), am);
  assert.equal(datumFuer(pos, { checks: { trinkwasser: true }, bestaetigt: { "c-0-0": am } }), am);
});

test("Haushalt: ohne Angabe alles; „alle“ immer; sonst nur, was passt – auch bei „Für dich zusätzlich“", () => {
  assert.equal(passt(["kinder"], []), true);
  assert.equal(passt(["alle"], ["miete"]), true);
  assert.equal(passt(["haus", "keller"], ["miete"]), false);
  assert.equal(passt(["haus", "keller"], ["miete", "keller"]), true);
  const alle = grund.bereiche.flatMap((b) => punkteFuer(b, [])).length;
  const miete = grund.bereiche.flatMap((b) => punkteFuer(b, ["miete"])).length;
  assert.equal(alle, 74); assert.ok(miete < alle && miete >= 35, String(miete));
  const hw = karten.hochwasser;
  assert.deepEqual(zusaetze(hw, ["tiere", "miete"]).map((z) => z.key), ["tiere"], "Miete hat bei Hochwasser keinen Zusatz");
  assert.deepEqual(zusaetze(hw, []).map((z) => z.key), Object.keys(hw.zusatz).filter((k) => hw.zusatz[k].length));
});

test("Fortschritt je Bereich und je Szenario; Export als Text mit Häkchen und Merkliste", () => {
  const b = grund.bereiche[0];
  assert.deepEqual(fortschritt(b.punkte, { [b.punkte[0].id]: true }), { erledigt: 1, gesamt: b.punkte.length });
  const hw = karten.hochwasser;
  assert.deepEqual(szenarioFortschritt(hw, [hw.checkliste_spezifisch[0], "gibt es nicht"]), { erledigt: 1, gesamt: hw.checkliste_spezifisch.length });
  const t = exportText(grund, { trinkwasser: true }, ["miete"], ["lebensmittel"]);
  assert.match(t, /^OFFLINE – Grundvorsorge\n/);
  assert.ok(t.includes(`[x] ${b.punkte[0].text}`) && t.includes(`[ ] ${b.punkte[1].text}  ★`));
  for (const x of grund.bereiche) assert.ok(t.includes(`${x.titel} (`), x.titel);
});

test("Radio je Bundesland (alle neun), Sirenen zum Anhören als Tondateien im Paket", async () => {
  const laender = (await json(`${I}bundeslaender.json`)).laender.map((l) => l.name).sort();
  assert.deepEqual(radio.bundeslaender.map((b) => b.land).sort(), laender);
  for (const b of radio.bundeslaender) for (const n of ["Ö3", "Ö1"]) assert.ok(b.sender.some((s) => s.name === n), `${b.land}: ${n}`);
  const toene = [...sirenen.signale.map((s) => s.ton), sirenen.probe_ton];
  assert.deepEqual(toene, ["sirenen/warnung.m4a", "sirenen/alarm.m4a", "sirenen/entwarnung.m4a", "sirenen/probe.m4a"]);
  for (const t of toene) { const g = (await stat(url(`${I}${t}`))).size; assert.ok(g > 5000 && g < 80000, `${t}: ${g} Bytes`); }
  assert.match(await lies("../kern/src/lokalserver.rs"), /Some\("m4a"\) => "audio\/mp4"/);
  assert.match(await lies("../app/src-tauri/tauri.conf.json"), /media-src 'self' blob: data: http:\/\/127\.0\.0\.1:\*;/);
  assert.match(await lies("./paket-client.js"), /BINAER = \/\\\.\(webp\|png\|jpe\?g\|gif\|m4a\)\$\/i/);
});

test("Der Name der staatlichen Zivilschutz-App kommt nirgends vor (Prüfung über einen Fingerabdruck, der Name steht hier nicht)", async () => {
  const VERBOTEN = "b34656bbf026cee1dac189b38de250e3c142e454cdf44cfaf4256a352df2c128";
  const texte = [JSON.stringify(karten), JSON.stringify(grund), JSON.stringify(radio), JSON.stringify(sirenen), await lies("./app.js"), await lies("./szenarien.js"), await lies("./hilfe.js"), await lies("./neues.json"), await lies("./index.html"), await lies("../pakete/at-basis/paket.quelle.json")];
  for (const t of texte) for (const w of t.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) assert.notEqual(createHash("sha256").update(w).digest("hex"), VERBOTEN, "Name gefunden");
});

test("Kein Inhalt im Code; Notfallseiten ohne Skin; Seiten bauen aus dem Paket", async () => {
  const app = await lies("./app.js"), modul = await lies("./szenarien.js");
  for (const k of Object.values(karten)) for (const m of k.merksaetze) assert.ok(!app.includes(m) && !modul.includes(m), m);
  for (const p of grund.bereiche.flatMap((b) => b.punkte)) assert.ok(!app.includes(p.detail) && !modul.includes(p.detail), p.id);
  assert.ok(app.includes('const notfallSeite = route === "notfall" || route.startsWith("szenario-");'));
  assert.ok(app.includes('if (route.startsWith("szenario-")) { state.szenario = route.slice(9); route = "szenario"; }'));
  assert.ok(app.includes("kachelnHtml(karten, szReihe(), state.szChecks)"), "Kacheln auf Notfall und Vorsorge");
  assert.equal((app.match(/kachelnHtml\(karten, szReihe\(\), state\.szChecks\)/g) ?? []).length, 2);
  assert.ok(app.includes("radioHtml(radio, state.bundesland, laender)"));
  assert.match(await lies("../app/src-tauri/src/lib.rs"), /fn text_speichern\(pfad: String, inhalt: String\)/);
  // Häkchen zeichnen die Seite neu: aufgeklappte Teile (Karte, Erklärungen) bleiben offen
  assert.ok(app.includes('const offen = render.seite === location.hash ? [...main.querySelectorAll("details[open][id]")].map((d) => d.id) : [];'));
  assert.ok(modul.includes('<details class="gv-detail" id="gvd-') && modul.includes('id="sz-${id}"'));
  const q = await json("../pakete/at-basis/paket.quelle.json");
  assert.equal(q.app_min, "0.8.0");
});
