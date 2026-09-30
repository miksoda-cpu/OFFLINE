// node --test web/wesen.test.mjs – Lumi: drei Stufen (Standard Textkarten), kein „ich“ ohne Namen, Übergang, Nachtschlaf,
// Mimik nach der Tafel, Wortschatz der Tipp-Bedingungen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { lumiEinstellungenLaden, einladungFaellig, mimikZustand, passtBedingung, tippPool, ohneIch, TEXTE, DARSTELLUNG, nachtsSchlaf, schlafenszeit, abendMerken, Wesen } from "./wesen.js";
import { MIMIK } from "./lumi/mimik.js";

const TAG = 86400000;
const tipps = JSON.parse(await readFile(new URL("../pakete/wir/inhalt/tipps.json", import.meta.url), "utf8")).tipps;
const k = (x = {}) => ({ ansicht: "start", score: 50, verfallen: false, jetzt: Date.parse("2026-09-30T10:00:00"), einstellung: { digital: false }, benannt: false, positionen: {}, ...x });

test("Frisch installiert: aus mit Textkarten, ohne Namen", () => {
  const e = lumiEinstellungenLaden(null);
  assert.equal(e.darstellung, "karten");
  assert.equal(e.name, "");
  assert.deepEqual(Object.keys(DARSTELLUNG), ["karten", "wesen", "aus"]);
});

test("Übergang: benannt behält die Figur; „aus“ (Standard in 0.2.0) und „Nur Tipps“ werden Textkarten", () => {
  const susi = lumiEinstellungenLaden({ darstellung: "wesen", name: "Susi", fell: "moos" });
  assert.deepEqual([susi.darstellung, susi.name, susi.fell, susi.version], ["wesen", "Susi", "moos", 3]);
  assert.equal(lumiEinstellungenLaden({ darstellung: "tipps", name: "Horst" }).darstellung, "karten", "0.1.x Nur Tipps");
  for (const alt of [{ darstellung: "wesen", name: "Das Wesen" }, { darstellung: "wesen", name: "  " }, { darstellung: "tipps" }]) {
    const e = lumiEinstellungenLaden(alt);
    assert.deepEqual([e.darstellung, e.name], ["karten", ""], JSON.stringify(alt));
  }
  // 0.2.0 (version 2)
  assert.equal(lumiEinstellungenLaden({ version: 2, darstellung: "aus", name: "" }).darstellung, "karten");
  assert.equal(lumiEinstellungenLaden({ version: 2, darstellung: "tipps", name: "" }).darstellung, "karten");
  assert.equal(lumiEinstellungenLaden({ version: 2, darstellung: "wesen", name: "Betty" }).darstellung, "wesen");
  // Version 3 bleibt, wie sie ist; Unbekanntes wird Textkarten
  assert.equal(lumiEinstellungenLaden({ version: 3, darstellung: "aus" }).darstellung, "aus");
  assert.equal(lumiEinstellungenLaden({ version: 3, darstellung: "quatsch" }).darstellung, "karten");
});

test("Einladungskarte: nur bei Textkarten, frühestens nach einer Woche, nie nach „Nein, danke“", () => {
  const e = lumiEinstellungenLaden(null);
  const start = { erstStart: "2026-09-01T10:00:00Z", karte: "offen" };
  assert.equal(einladungFaellig(start, e, Date.parse("2026-09-05T10:00:00Z")), false, "vor einer Woche");
  assert.equal(einladungFaellig(start, e, Date.parse("2026-09-08T10:00:00Z")), true);
  assert.equal(einladungFaellig({ ...start, karte: "nein" }, e, Date.parse("2026-10-08T10:00:00Z")), false, "nie wieder");
  assert.equal(einladungFaellig(start, { ...e, darstellung: "wesen" }, Date.parse("2026-09-08T10:00:00Z")), false);
  assert.equal(einladungFaellig(start, { ...e, darstellung: "aus" }, Date.parse("2026-09-08T10:00:00Z")), false, "Tipps aus: ganz still");
});

test("Standard zeigt Textkarten: nur App, Alltag, Wissen (Digital angekreuzt), nichts, worin die Lumi von sich erzählt", () => {
  const karten = lumiEinstellungenLaden(null);
  for (const benannt of [false, true]) {
    const pool = tippPool(tipps, { ...karten, name: benannt ? "Susi" : "" }, k({ benannt }));
    assert.ok(pool.length > 40, `${pool.length} Karten`);
    for (const t of pool) {
      assert.ok(["app", "alltag", "wissen"].includes(t.sorte), `${t.id} Sorte ${t.sorte}`);
      assert.ok(ohneIch(t.text) && !t.bedingung?.benannt, `${t.id} erzählt von sich`);
    }
  }
  const mitDigital = tippPool(tipps, { ...karten, sorten: { ...karten.sorten, digital: true } }, k({ einstellung: { digital: true } }));
  assert.ok(mitDigital.some((t) => t.sorte === "digital"), "Digital, wenn angekreuzt");
  assert.equal(tippPool([{ id: "x", sorte: "alltag", text: "Ich zeig dir was." }], karten, k({ benannt: true })).length, 0);
});

test("„Tipps aus“ zeigt nichts – egal was passt", () => {
  const aus = { ...lumiEinstellungenLaden(null), darstellung: "aus" };
  assert.equal(tippPool(tipps, aus, k({ benannt: true })).length, 0);
  assert.equal(tippPool(tipps, { ...aus, name: "Susi" }, k({ benannt: true, einstellung: { digital: true } })).length, 0);
});

test("Lumi mit Tipps: alle Sorten; von sich erzählt sie nur mit Namen", () => {
  const an = { ...lumiEinstellungenLaden(null), darstellung: "wesen" };
  const ohne = tippPool(tipps, an, k());
  const mit = tippPool(tipps, { ...an, name: "Susi" }, k({ benannt: true }));
  assert.ok(ohne.some((t) => t.sorte === "weisheit") && ohne.every((t) => ohneIch(t.text)));
  assert.ok(mit.some((t) => !ohneIch(t.text)), "mit Namen kommen Ich-Tipps");
});

test("Nachts schläft sie: 22 bis 6 Uhr, solange nichts gelernt ist; gelernt aus den Abenden", () => {
  const um = (h, m = 0) => new Date(2026, 9, 1, h, m).getTime();
  assert.equal(nachtsSchlaf(um(21, 59), {}), false);
  assert.equal(nachtsSchlaf(um(22, 0), {}), true);
  assert.equal(nachtsSchlaf(um(3, 0), {}), true);
  assert.equal(nachtsSchlaf(um(6, 0), {}), false);
  assert.equal(nachtsSchlaf(um(12, 0), {}), false);
  // Wer jeden Abend bis 23:30 da ist, dessen Lumi schläft ab 0:00
  const g = {};
  for (let t = 1; t <= 10; t++) assert.equal(abendMerken(g, new Date(2026, 8, t, 23, 30).getTime()), true);
  assert.equal(abendMerken(g, new Date(2026, 8, 10, 20, 0).getTime()), false, "früher am selben Abend ändert nichts");
  assert.equal(abendMerken(g, new Date(2026, 8, 11, 14, 0).getTime()), false, "tagsüber zählt nicht");
  assert.equal(schlafenszeit(g), 0);
  assert.equal(nachtsSchlaf(um(23, 45), g), false);
  assert.equal(nachtsSchlaf(um(0, 15), g), true);
  // Grenzen: frühestens 21 Uhr, spätestens 1 Uhr; höchstens 14 Abende
  const frueh = {}; for (let t = 1; t <= 8; t++) abendMerken(frueh, new Date(2026, 8, t, 18, 5).getTime());
  assert.equal(schlafenszeit(frueh), 21 * 60);
  const spaet = {}; for (let t = 1; t <= 20; t++) abendMerken(spaet, new Date(2026, 8, t, 2, 50).getTime());
  assert.equal(schlafenszeit(spaet), 60);
  assert.equal(Object.keys(spaet.abende).length, 14);
});

test("Nachts: Zustand „Schläft“, ein Stups weckt sie kurz, dann schläft sie wieder", () => {
  const speicher = new Map();
  const sp = { get: (k, d) => (speicher.has(k) ? speicher.get(k) : d), set: (k, v) => speicher.set(k, v) };
  globalThis.addEventListener ??= () => {};
  globalThis.document ??= { getElementById: () => null, hidden: false };
  const w = new Wesen({ speicher: sp, tipps: () => tipps });
  w.einstellen("name", "Susi"); w.e.darstellung = "wesen"; w.namensfrage = false;
  const nacht = new Date(2026, 9, 1, 23, 0).getTime(), tag = new Date(2026, 9, 1, 11, 0).getTime();
  const echt = Date.now;
  try {
    Date.now = () => tag; w.setScore({ wert: 60, verfallen: [], positionen: [] });
    assert.equal(w.zustand, "wandert");
    Date.now = () => nacht; w.zustandBerechnen();
    assert.equal(w.zustand, "schlaeft");
    assert.equal(mimikZustand({ zustand: w.zustand, benannt: true, spricht: true }), "schlaeft");
    w.anstupsen();
    assert.notEqual(w.zustand, "schlaeft", "kurz wach");
    Date.now = () => nacht + 61000; w.zustandBerechnen();
    assert.equal(w.zustand, "schlaeft", "nach einer Minute wieder eingeschlafen");
    w.e.darstellung = "karten"; w.zustandBerechnen();
    assert.notEqual(w.zustand, "schlaeft", "ohne Figur schläft niemand");
  } finally { Date.now = echt; }
});

test("Kein „ich“ ohne Namen: in den Tipps, im Pool und in den Texten vor der Namensgabe", () => {
  for (const t of tipps) if (!ohneIch(t.text)) assert.equal(t.bedingung?.benannt, true, `${t.id} spricht von sich ohne „benannt“`);
  const an = { ...lumiEinstellungenLaden(null), darstellung: "wesen", sorten: { app: true, alltag: true, wissen: true, weisheit: true, laune: true, heute: true, digital: true } };
  for (const t of tippPool(tipps, an, k({ einstellung: { digital: true } }))) assert.ok(ohneIch(t.text), t.id);
  // auch ein Paket ohne „benannt“ kommt ohne Namen nicht durch
  assert.equal(tippPool([{ id: "x", sorte: "laune", text: "Ich bin da." }], an, k()).length, 0);
  for (const t of [TEXTE.einladungTitel, TEXTE.einladungFrage, TEXTE.einladungHinweis, TEXTE.beschreibung, TEXTE.ersterSatz, TEXTE.namensfrage, TEXTE.ausschalten(""), TEXTE.wiederDaOhneNamen, TEXTE.ki]) {
    assert.ok(ohneIch(t), t);
  }
  assert.ok(!ohneIch(TEXTE.mitNamen("Susi")) && !ohneIch(TEXTE.wiederDa), "mit Namen darf sie");
  assert.ok(ohneIch("Hier oben ist es hell. Micha kommt.") && !ohneIch("Das ist meins? Nein: mein Licht."), "Wortgrenzen");
});

test("Tipp-Bestand: 176 Tipps, Sorten klein, nur bekannter Wortschatz, app-001 korrigiert", () => {
  assert.equal(tipps.length, 176);
  assert.equal(new Set(tipps.map((t) => t.id)).size, 176);
  for (const t of tipps) assert.match(t.sorte, /^(app|alltag|wissen|weisheit|laune|heute|digital)$/, t.id);
  const an = { ...lumiEinstellungenLaden(null), darstellung: "wesen" };
  // jede Bedingung ist lesbar: mit passendem Kontext kommt jeder Tipp irgendwann
  for (const t of tipps) assert.ok(!/profil/.test(JSON.stringify(t.bedingung ?? {})), t.id);
  assert.match(tipps.find((t) => t.id === "app-001").text, /links in der Seitenleiste/);
  assert.ok(!tipps.some((t) => /Hörner|Arktis|[Dd]as Wesen/.test(t.text)));
  assert.ok(tippPool(tipps, an, k()).length > 0);
});

test("Wortschatz: Wochentag, Stunde, Tag, Monatsliste, Alter einer Bestätigung, Zeitumstellung, Unbekanntes", () => {
  const sa = Date.parse("2026-10-03T11:30:00"); // Samstag
  assert.ok(passtBedingung({ wochentag: 6, stunde: 11 }, k({ jetzt: sa })));
  assert.ok(!passtBedingung({ wochentag: 6, stunde: 11 }, k({ jetzt: sa + 3600000 })));
  assert.ok(passtBedingung({ tag: 1, monat: 1 }, k({ jetzt: Date.parse("2027-01-01T09:00:00") })));
  assert.ok(passtBedingung({ monat: [6, 7, 8] }, k({ jetzt: Date.parse("2026-07-10T09:00:00") })));
  assert.ok(!passtBedingung({ monat: [6, 7, 8] }, k({ jetzt: Date.parse("2026-09-10T09:00:00") })));
  const jetzt = Date.parse("2026-09-30T10:00:00");
  assert.ok(passtBedingung({ alter: { position: "c-0-0", ab_monate: 12 } }, k({ jetzt, positionen: { "c-0-0": "2025-08-01T00:00:00Z" } })));
  assert.ok(!passtBedingung({ alter: { position: "c-0-0", ab_monate: 12 } }, k({ jetzt, positionen: { "c-0-0": "2026-08-01T00:00:00Z" } })));
  assert.ok(!passtBedingung({ alter: { position: "c-0-0", ab_monate: 12 } }, k({ jetzt })), "nie bestätigt: kein Alter");
  assert.ok(passtBedingung({ zeitumstellung_in_tagen: 7 }, k({ jetzt: Date.parse("2026-10-20T10:00:00") })), "25.10.2026 ist Zeitumstellung");
  assert.ok(!passtBedingung({ zeitumstellung_in_tagen: 7 }, k({ jetzt: Date.parse("2026-10-01T10:00:00") })));
  assert.ok(!passtBedingung({ profil: "insulin" }, k()), "unbekanntes Wort: Tipp kommt nicht");
});

test("Mimik nach der Tafel: Vorrang und „Noch ohne Namen“", () => {
  const m = (x) => mimikZustand({ benannt: true, zustand: "sitzt", ...x });
  assert.equal(m({}), "ruhe");
  assert.equal(m({ zustand: "liegt" }), "muede");
  assert.equal(m({ zustand: "baut" }), "freude");
  assert.equal(m({ freude: true }), "freude");
  assert.equal(m({ zustand: "fest", freude: true }), "fest");
  assert.equal(m({ zustand: "fest", spricht: true }), "sprechen");
  assert.equal(m({ spricht: true, hoertZu: true, denkt: true }), "sprechen");
  assert.equal(m({ hoertZu: true, denkt: true }), "zuhoeren");
  assert.equal(m({ zustand: "unruhig", spricht: true }), "unruhig");
  assert.equal(m({ zustand: "zaehne" }), "zaehne");
  assert.equal(m({ zustand: "schlaeft", spricht: true }), "schlaeft");
  assert.equal(m({ benannt: false }), "noch-ohne-namen");
  assert.equal(m({ benannt: false, zustand: "liegt" }), "noch-ohne-namen");
  assert.equal(m({ benannt: false, spricht: true }), "sprechen");
  // zu jedem Zustand gibt es ein Bild und zwei Antennenspitzen
  for (const z of ["ruhe", "muede", "freude", "fest", "sprechen", "zuhoeren", "nachdenken", "unruhig", "zaehne", "schlaeft", "noch-ohne-namen"]) {
    assert.ok(MIMIK[z]?.bild && MIMIK[z].antennen.length === 2, z);
  }
});
