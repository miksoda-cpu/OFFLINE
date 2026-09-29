// node --test web/bereit.test.mjs – Bereit Version 2 (die elf Fälle aus dem Bereit-Patch, angepasst, plus Übertragung von Version 1)
import { test } from "node:test";
import assert from "node:assert/strict";
import { berechne, positionWert, stufe, uebertragen, naechsterSchritt, POSITIONEN, QUELLEN, V1_ZUORDNUNG } from "./bereit.js";

const JETZT = Date.parse("2026-09-29T12:00:00Z");
const vor = (monate) => new Date(JETZT - monate * 30.44 * 86400000).toISOString();
const GERAET_VOLL = (datum) => ({ paketErstellt: datum, arten: ["inhalt", "zim", "karte"], notfallmappe: true });
const alles = (datum) => {
  const checks = {}, bestaetigt = {};
  for (const p of POSITIONEN) { if (p.check) checks[p.check] = true; if (!p.auto) bestaetigt[p.id] = datum; }
  return { checks, bestaetigt, geraet: GERAET_VOLL(datum) };
};

test("Gewichte der Quellen ergeben 100 und stehen wie in Kapitel 4", () => {
  assert.equal(QUELLEN.reduce((s, q) => s + q.gewicht, 0), 100);
  assert.deepEqual(QUELLEN.map((q) => [q.id, q.gewicht]), [["inhalte", 20], ["dinge", 35], ["menschen", 25], ["koennen", 20]]);
});

test("Fristen aus Kapitel 4: Wasser 12, Batterien 24, Kontakte 6 (Treffpunkt 12), Können 12", () => {
  const f = (id) => POSITIONEN.find((p) => p.id === id).verfall;
  assert.equal(f("c-0-0"), 12);
  assert.equal(f("c-1-1"), 24);
  for (const id of ["familie", "c-3-3", "nachbar"]) assert.equal(f(id), 6, id);
  for (const id of ["c-3-2", "anlaufstelle"]) assert.equal(f(id), 12, id);
  for (const id of ["kocher", "radio", "probeabend"]) assert.equal(f(id), 12, id);
});

test("leeres Gerät ist 0 und liegt", () => {
  const r = berechne({}, JETZT);
  assert.equal(r.wert, 0);
  assert.equal(stufe(r.wert), "liegt");
  assert.equal(r.faellig.length, 0);
});

test("nur das Österreich-Paket: ein Teil der Inhalte", () => {
  const r = berechne({ geraet: { paketErstellt: vor(1), arten: ["inhalt"] } }, JETZT);
  assert.equal(r.wert, 12); // Paket (2) + aktuell (1) von 5 Gewichtseinheiten → 3/5 · 20
});

test("alles frisch bestätigt ist 100, baut, und fragt nicht nach dem Probeabend", () => {
  const r = berechne(alles(vor(0)), JETZT);
  assert.equal(r.wert, 100);
  assert.equal(stufe(r.wert), "baut");
  assert.equal(r.hinweis, null);
});

test("über 95 ohne Probeabend in drei Monaten: verdächtig gut", () => {
  const d = alles(vor(0)); d.bestaetigt.probeabend = vor(5);
  const r = berechne(d, JETZT);
  assert.ok(r.wert > 95);
  assert.match(r.hinweis, /verdächtig gut/);
  assert.match(naechsterSchritt(r).text, /verdächtig gut/);
});

test("Häkchen ohne Bestätigungsdatum zählt nicht, Datum ohne Häkchen auch nicht", () => {
  assert.equal(berechne({ checks: { "0-0": true } }, JETZT).wert, 0);
  assert.equal(berechne({ bestaetigt: { "c-0-0": vor(0) } }, JETZT).wert, 0);
});

test("Verfall: voll bis Ablauf, dann langsam auf null über drei Monate", () => {
  const wasser = POSITIONEN.find((p) => p.id === "c-0-0");
  assert.equal(positionWert(wasser, vor(11), JETZT).wert, 1);
  const halb = positionWert(wasser, vor(13.5), JETZT);
  assert.equal(halb.stand, "faellig");
  assert.ok(halb.wert > 0.45 && halb.wert < 0.55);
  assert.equal(positionWert(wasser, vor(16), JETZT).wert, 0);
});

test("Menschen: Treffpunkt und Anlaufstelle 12 Monate, Familiengruppe, Nummern und Nachbar 6 (Festlegung Bill 29.09.)", () => {
  const frist = Object.fromEntries(POSITIONEN.filter((p) => p.quelle === "menschen" && p.verfall).map((p) => [p.id, p.verfall]));
  assert.deepEqual(frist, { familie: 6, "c-3-2": 12, "c-3-3": 6, nachbar: 6, anlaufstelle: 12 });
  const treffpunkt = POSITIONEN.find((p) => p.id === "c-3-2");
  assert.equal(positionWert(treffpunkt, vor(11), JETZT).wert, 1, "nach 11 Monaten noch voll");
  assert.equal(positionWert(treffpunkt, vor(13.5), JETZT).stand, "faellig");
});

test("fällige Positionen werden genannt, älteste zuerst, ohne die automatischen", () => {
  const d = alles(vor(0));
  d.bestaetigt["c-0-0"] = vor(13); // Wasser, 12 Monate
  d.bestaetigt["c-2-1"] = vor(8);  // Medikamente, 6 Monate
  d.geraet.paketErstellt = vor(9);  // Paket veraltet, aber automatisch
  const r = berechne(d, JETZT);
  assert.deepEqual(r.faellig.map((p) => p.id), ["c-2-1", "c-0-0"]);
  assert.deepEqual(r.verfallen, r.faellig, "die Lumi liest dieselbe Liste");
  assert.ok(r.wert < 100 && r.wert > 80);
});

test("Stufen an 30, 60, 80", () => {
  assert.deepEqual([29, 30, 59, 60, 79, 80].map(stufe), ["liegt", "sitzt", "sitzt", "wandert", "wandert", "baut"]);
});

test("jede Checklisten-Position hat eine eindeutige Zuordnung", () => {
  const ids = POSITIONEN.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  const checks = POSITIONEN.filter((p) => p.check).map((p) => p.check);
  assert.equal(new Set(checks).size, 20);
});

test("Web-Prototyp ohne Tresor: Notfallmappe zählt nicht, 100 bleibt erreichbar", () => {
  const d = alles(vor(0)); delete d.geraet.notfallmappe;
  const r = berechne(d, JETZT);
  assert.equal(r.wert, 100);
  assert.ok(!r.positionen.some((p) => p.id === "notfallmappe"));
});

// ---------- Übertragung von Version 1 ----------

test("Übertragung: Bestätigungen aus Version 1 behalten ihr Datum, alte Häkchen gelten ab heute", () => {
  const v1 = { wasser: vor(2), licht: vor(3), medikamente: vor(1), radio: vor(4), probeabend: vor(5) };
  const b = uebertragen({ checks: { "0-0": true, "1-1": true, "2-1": true, "3-2": true, "1-0": false }, bestaetigungenV1: v1 }, {}, JETZT);
  assert.equal(b["c-0-0"], v1.wasser);
  assert.equal(b["c-1-1"], v1.licht);
  assert.equal(b["c-2-1"], v1.medikamente);
  assert.equal(b.radio, v1.radio);
  assert.equal(b.probeabend, v1.probeabend);
  assert.equal(b["c-3-2"], new Date(JETZT).toISOString(), "Häkchen ohne Datum: ab heute");
  assert.equal(b["c-1-0"], undefined, "nicht abgehakt bleibt offen");
});

test("Übertragung: niemand verliert beim Update eine gültige Bestätigung", () => {
  // Was in Version 1 gültig war (Wasser 6, Licht 12, Medikamente 6, Radio 12, Probeabend 12 Monate), ist in Version 2 gut.
  const v1 = { wasser: vor(5), licht: vor(11), medikamente: vor(5), radio: vor(11), probeabend: vor(11) };
  const checks = { "0-0": true, "1-1": true, "2-1": true };
  const bestaetigt = uebertragen({ checks, bestaetigungenV1: v1 }, {}, JETZT);
  const r = berechne({ checks, bestaetigt }, JETZT);
  for (const id of Object.values(V1_ZUORDNUNG)) assert.equal(r.positionen.find((p) => p.id === id).stand, "gut", id);
});

test("Übertragung überschreibt nichts, was Version 2 schon hat", () => {
  const b = uebertragen({ checks: { "0-0": true }, bestaetigungenV1: { wasser: vor(10) } }, { "c-0-0": vor(1) }, JETZT);
  assert.equal(b["c-0-0"], vor(1));
});

test("Übergang: der Wert aus Version 1 ist drei Monate lang Untergrenze, dann klingt er über drei Monate aus", async () => {
  const { sockelWert, wertV1 } = await import("./bereit.js");
  const alle = Object.fromEntries(["wasser", "licht", "medikamente", "radio", "probeabend"].map((k) => [k, vor(1)]));
  const v1 = wertV1({ erledigt: 20, gesamt: 20, notfallmappe: true, arten: ["inhalt", "zim", "karte"], bestaetigungenV1: alle }, JETZT);
  assert.equal(v1, 100);
  const checks = {}; for (let g = 0; g < 4; g++) for (let p = 0; p < 5; p++) checks[`${g}-${p}`] = true;
  const daten = { checks, bestaetigt: uebertragen({ checks, bestaetigungenV1: alle }, {}, JETZT), geraet: { paketErstellt: vor(0), arten: ["inhalt", "zim", "karte"], notfallmappe: true } };
  const ohne = berechne(daten, JETZT);
  assert.ok(ohne.wert < 100, "ohne Sockel fiele die Zahl (neue Positionen in Version 2)");
  const mit = berechne({ ...daten, sockel: { wert: v1, am: new Date(JETZT).toISOString() } }, JETZT);
  assert.equal(mit.wert, 100); assert.equal(mit.sockel, true); assert.equal(mit.eigen, ohne.wert);
  const am = new Date(JETZT).toISOString(), M = 30.44 * 86400000;
  assert.equal(sockelWert({ wert: 80, am }, JETZT + 2.9 * M), 80);
  assert.equal(sockelWert({ wert: 80, am }, JETZT + 4.5 * M), 40);
  assert.equal(sockelWert({ wert: 80, am }, JETZT + 6.1 * M), 0);
  assert.equal(sockelWert(null, JETZT), 0);
  // Wer mehr hat als der Sockel, sieht die eigene Zahl
  assert.equal(berechne({ ...daten, sockel: { wert: 10, am } }, JETZT).sockel, false);
});
