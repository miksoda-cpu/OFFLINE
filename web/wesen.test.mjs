// node --test web/wesen.test.mjs – Lumi: Standard aus, kein „ich“ ohne Namen, keine Tipps wenn aus, Übergang für Bestand,
// Mimik nach der Tafel, Wortschatz der Tipp-Bedingungen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { lumiEinstellungenLaden, einladungFaellig, mimikZustand, passtBedingung, tippPool, ohneIch, TEXTE } from "./wesen.js";
import { MIMIK } from "./lumi/mimik.js";

const TAG = 86400000;
const tipps = JSON.parse(await readFile(new URL("../pakete/wir/inhalt/tipps.json", import.meta.url), "utf8")).tipps;
const k = (x = {}) => ({ ansicht: "start", score: 50, verfallen: false, jetzt: Date.parse("2026-09-30T10:00:00"), einstellung: { digital: false }, benannt: false, positionen: {}, ...x });

test("Frisch installiert: Lumi ist aus, ohne Namen", () => {
  const e = lumiEinstellungenLaden(null);
  assert.equal(e.darstellung, "aus");
  assert.equal(e.name, "");
});

test("Übergang für Bestand: benannt bleibt an, alle anderen sind aus", () => {
  const susi = lumiEinstellungenLaden({ darstellung: "wesen", name: "Susi", fell: "moos" });
  assert.deepEqual([susi.darstellung, susi.name, susi.fell, susi.version], ["wesen", "Susi", "moos", 2]);
  const nurTipps = lumiEinstellungenLaden({ darstellung: "tipps", name: "Horst" });
  assert.equal(nurTipps.darstellung, "tipps", "die eigene Wahl bleibt");
  for (const alt of [{ darstellung: "wesen", name: "Das Wesen" }, { darstellung: "wesen", name: "  " }, { darstellung: "tipps" }]) {
    const e = lumiEinstellungenLaden(alt);
    assert.deepEqual([e.darstellung, e.name], ["aus", ""], JSON.stringify(alt));
  }
  // Version 2 bleibt, wie sie ist
  assert.equal(lumiEinstellungenLaden({ version: 2, darstellung: "aus", name: "Max" }).darstellung, "aus");
});

test("Einladungskarte: nur wenn aus, frühestens nach einer Woche, nie nach „Nein, danke“", () => {
  const aus = lumiEinstellungenLaden(null);
  const start = { erstStart: new Date(0).toISOString(), karte: "offen" };
  assert.equal(einladungFaellig(start, aus, 6 * TAG), false);
  assert.equal(einladungFaellig(start, aus, 7 * TAG), true);
  assert.equal(einladungFaellig({ ...start, karte: "nein" }, aus, 30 * TAG), false);
  assert.equal(einladungFaellig(start, { ...aus, darstellung: "wesen" }, 30 * TAG), false);
});

test("Keine Tipps, solange die Lumi aus ist – egal was passt", () => {
  const aus = lumiEinstellungenLaden(null);
  assert.equal(tippPool(tipps, aus, k({ benannt: true })).length, 0);
  assert.ok(tippPool(tipps, { ...aus, darstellung: "tipps" }, k()).length > 50, "nur Tipps: es kommen welche");
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
