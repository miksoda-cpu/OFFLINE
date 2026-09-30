// node --test web/tag.test.mjs – Tagesseite und Vorratskammer: Freischaltung, Datumswechsel, Zeitzone, Zeitumstellung,
// leerer Vorrat, Vorratstiefe, Schluss, gelernte Schicht. Läuft zusätzlich unter fremden Zeitzonen (Unterprozess).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { datumVon, tageZwischen, plusTage, tagNummer, kartenFuer, vorratTage, bereichTrifft, bereichVorbei, vorzuladen, tagesKarten, schlussErreicht, textkarteFuer, lernen, SCHLUSS, PLAN_STANDARD } from "./tag.js";
import { tageInhaltFehler } from "../paket-kit/tage-format.mjs";

const r = (datum, id = datum) => ({ art: "raetsel", id: `r-${id}`, frage: "?", loesung: "!" });
const nachDatum = { id: "tage-2026-10", bereich: { von: "2026-10-01", bis: "2026-10-03" }, tage: ["2026-10-01", "2026-10-02", "2026-10-03"].map((d) => ({ datum: d, karten: [r(d)] })) };
const nachNummer = { id: "kurs", bereich: { von_tag: 1, bis_tag: 2 }, tage: [{ tag: 1, karten: [{ art: "text", id: "t1", text: "Tag eins" }] }, { tag: 2, karten: [{ art: "text", id: "t2", text: "Tag zwei" }] }] };

test("Freischaltung: nur der Tag selbst, nach Datum und nach Tagnummer", () => {
  assert.deepEqual(kartenFuer([nachDatum], "2026-10-02", "2026-09-30").map((k) => k.id), ["r-2026-10-02"]);
  assert.deepEqual(kartenFuer([nachDatum], "2026-10-04", "2026-09-30"), []);
  // Tagnummer: Tag 1 ist der Starttag des Geräts
  assert.deepEqual(kartenFuer([nachNummer], "2026-11-05", "2026-11-05").map((k) => k.id), ["t1"]);
  assert.deepEqual(kartenFuer([nachNummer], "2026-11-06", "2026-11-05").map((k) => k.id), ["t2"]);
  assert.equal(tagNummer("2026-11-05", "2026-11-05"), 1);
});

test("Datumswechsel: um Mitternacht ist der nächste Tag frei, eine Minute davor nicht", () => {
  const vor = new Date(2026, 9, 1, 23, 59).getTime(), nach = new Date(2026, 9, 2, 0, 1).getTime();
  assert.equal(datumVon(vor), "2026-10-01");
  assert.equal(datumVon(nach), "2026-10-02");
  assert.deepEqual(kartenFuer([nachDatum], datumVon(nach), "2026-10-01").map((k) => k.id), ["r-2026-10-02"]);
});

test("Uhrumstellung: Kalendertage, nie 24 Stunden (Ende Sommerzeit 25.10.2026, Beginn 29.03.2026)", () => {
  assert.equal(tageZwischen("2026-10-24", "2026-10-26"), 2);
  assert.equal(plusTage("2026-10-24", 1), "2026-10-25");
  assert.equal(plusTage("2026-10-25", 1), "2026-10-26");
  assert.equal(plusTage("2026-03-28", 2), "2026-03-30");
  assert.equal(tageZwischen("2026-03-28", "2026-03-30"), 2);
  assert.equal(tagNummer("2026-10-20", "2026-10-30"), 11);
  assert.equal(plusTage("2026-12-31", 1), "2027-01-01");
  assert.equal(plusTage("2028-02-28", 1), "2028-02-29");
});

test("Zeitzonen: Wien, Auckland, New York, Samoa (+13) – derselbe Augenblick, jeweils das eigene Kalenderdatum", () => {
  const ms = Date.UTC(2026, 9, 25, 0, 30); // 25.10.2026 00:30 UTC
  const erwartet = { "Europe/Vienna": "2026-10-25", "Pacific/Auckland": "2026-10-25", "America/New_York": "2026-10-24", "Pacific/Apia": "2026-10-25", "Pacific/Honolulu": "2026-10-24" };
  for (const [tz, datum] of Object.entries(erwartet)) {
    const aus = execFileSync(process.execPath, ["--input-type=module", "-e", `import { datumVon, plusTage, tageZwischen } from ${JSON.stringify(new URL("./tag.js", import.meta.url).href)}; const d = datumVon(${ms}); console.log(JSON.stringify([d, plusTage(d, 1), tageZwischen(d, plusTage(d, 30))]));`], { env: { ...process.env, TZ: tz } }).toString();
    const [d, morgen, dreissig] = JSON.parse(aus);
    assert.equal(d, datum, tz);
    assert.equal(tageZwischen(d, morgen), 1, tz);
    assert.equal(dreissig, 30, tz);
  }
});

test("Vorrat: jeder kommende Tag mit Inhalt; leer ist 0, kein Fehler", () => {
  assert.equal(vorratTage([nachDatum], "2026-10-01", "2026-10-01"), 3);
  assert.equal(vorratTage([nachDatum], "2026-10-03", "2026-10-01"), 1);
  assert.equal(vorratTage([nachDatum], "2026-10-04", "2026-10-01"), 0);
  assert.equal(vorratTage([], "2026-10-04", "2026-10-01"), 0);
  assert.equal(vorratTage([nachDatum], "2026-09-30", "2026-09-30"), 3, "heute noch nichts, ab morgen drei Tage");
  const luecke = { ...nachDatum, tage: nachDatum.tage.filter((t) => t.datum !== "2026-10-02") };
  assert.equal(vorratTage([luecke], "2026-10-01", "2026-10-01"), 2);
  assert.equal(vorratTage([nachNummer], "2026-11-05", "2026-11-05"), 2);
});

test("Vorratstiefe 7/30/90: welche Tagespakete geladen, welche weggeräumt werden", () => {
  const e = (id, von, bis, version = "2026.09.30") => ({ id, art: "tage", status: "verfuegbar", version, tage: { von, bis } });
  const katalog = { pakete: [e("tage-2026-10", "2026-10-01", "2026-10-31"), e("tage-2026-11", "2026-11-01", "2026-11-30"), e("tage-2026-12", "2026-12-01", "2026-12-31"), { id: "wir", art: "inhalt", status: "verfuegbar" }] };
  const ids = (t, heute = "2026-10-20", inst = []) => vorzuladen(katalog, inst, heute, t, "2026-10-01").map((x) => x.id);
  assert.deepEqual(ids(7), ["tage-2026-10"]);
  assert.deepEqual(ids(30), ["tage-2026-10", "tage-2026-11"]);
  assert.deepEqual(ids(90), ["tage-2026-10", "tage-2026-11", "tage-2026-12"]);
  assert.deepEqual(ids(30, "2026-10-20", [{ id: "tage-2026-10", version: "2026.09.30" }]), ["tage-2026-11"], "schon da");
  assert.deepEqual(ids(30, "2026-10-20", [{ id: "tage-2026-10", version: "2026.09.01" }]), ["tage-2026-10", "tage-2026-11"], "neuere Ausgabe");
  assert.equal(bereichTrifft({ von_tag: 1, bis_tag: 60 }, "2026-10-05", 7, "2026-10-01"), true);
  assert.equal(bereichTrifft({ von_tag: 1, bis_tag: 3 }, "2026-10-05", 7, "2026-10-01"), false);
  assert.equal(bereichVorbei({ von: "2026-10-01", bis: "2026-10-31" }, "2026-11-07", "2026-10-01"), false);
  assert.equal(bereichVorbei({ von: "2026-10-01", bis: "2026-10-31" }, "2026-11-08", "2026-10-01"), true);
});

test("Tagesseite: Karten nach Tagesplan, die Lumi oder die Textkarte, Schluss mit festem Satz", () => {
  const karten = [r("x"), { art: "kapitel", id: "k1" }];
  const tipp = { id: "app-001", text: "Tipp", sorte: "app" };
  assert.deepEqual(tagesKarten({ karten, lumi: "karten", textkarte: tipp }).map((k) => k.art), ["raetsel", "kapitel", "text"]);
  assert.deepEqual(tagesKarten({ karten, lumi: "wesen", textkarte: tipp }).map((k) => k.art), ["raetsel", "kapitel", "lumi"]);
  assert.deepEqual(tagesKarten({ karten, lumi: "aus", textkarte: tipp }).map((k) => k.art), ["raetsel", "kapitel"], "Tipps aus: keine Karte");
  assert.deepEqual(tagesKarten({ karten, plan: { karten: { raetsel: false, kapitel: true, lumi: false } } }).map((k) => k.art), ["kapitel"]);
  const tk = tagesKarten({ karten, lumi: "karten", textkarte: tipp });
  const jetzt = new Date(2026, 9, 1, 12).getTime();
  assert.equal(schlussErreicht({ karten: tk, zustand: { "r-x": "erledigt" }, jetzt }), null);
  assert.equal(schlussErreicht({ karten: tk, zustand: { "r-x": "erledigt", k1: "weg", "lumi-app-001": "erledigt" }, jetzt }), "erledigt");
  assert.equal(schlussErreicht({ karten: tk, zustand: {}, jetzt: new Date(2026, 9, 1, 22).getTime() }), "uhrzeit");
  assert.equal(schlussErreicht({ karten: tk, zustand: {}, jetzt: new Date(2026, 9, 1, 22).getTime(), plan: { ...PLAN_STANDARD, schlussUm: null } }), null, "Schluss nur, wenn erledigt");
  assert.equal(SCHLUSS, "Das war dein Tag. Bis morgen.");
});

test("Textkarte des Tages: fest für den Tag, am nächsten Tag meist eine andere", () => {
  const pool = Array.from({ length: 40 }, (_, i) => ({ id: `t-${i}`, text: `${i}` }));
  assert.equal(textkarteFuer(pool, "2026-10-01").id, textkarteFuer([...pool].reverse(), "2026-10-01").id);
  const woche = new Set(Array.from({ length: 7 }, (_, i) => textkarteFuer(pool, plusTage("2026-10-01", i)).id));
  assert.ok(woche.size >= 5, `${woche.size} verschiedene`);
  assert.equal(textkarteFuer([], "2026-10-01"), null);
});

test("Gelernte Schicht: eine Woche weggelegt → ausblenden, begründet; eingefroren bleibt sie", () => {
  const verlauf = {};
  for (let i = 1; i <= 7; i++) verlauf[plusTage("2026-10-20", -i)] = { raetsel: "weg", kapitel: "erledigt" };
  const v = lernen(verlauf, "2026-10-20", PLAN_STANDARD);
  assert.equal(v.art, "raetsel");
  assert.match(v.text, /seit einer Woche/);
  assert.doesNotMatch(v.text, /\bich\b/i);
  assert.equal(lernen(verlauf, "2026-10-20", PLAN_STANDARD, { eingefroren: { raetsel: true } }), null);
  verlauf[plusTage("2026-10-20", -3)].raetsel = "erledigt";
  assert.equal(lernen(verlauf, "2026-10-20", PLAN_STANDARD), null);
});

test("Die gebauten Pakete: 61 Tage mit Rätsel ab 1.10.2026, vier Werke zu je sieben Teilen ab Montag", async () => {
  const pakete = [];
  for (const m of ["2026-10", "2026-11"]) {
    const q = JSON.parse(await readFile(new URL(`../pakete/tage-${m}/paket.quelle.json`, import.meta.url), "utf8"));
    const inhalt = JSON.parse(await readFile(new URL(`../pakete/tage-${m}/inhalt/tage.json`, import.meta.url), "utf8"));
    assert.deepEqual(tageInhaltFehler(inhalt, q.tage), [], m);
    pakete.push({ id: q.id, bereich: q.tage, tage: inhalt.tage });
  }
  assert.equal(vorratTage(pakete, "2026-10-01", "2026-10-01"), 61);
  const kapitel = pakete.flatMap((p) => p.tage).flatMap((t) => t.karten.filter((k) => k.art === "kapitel").map((k) => ({ ...k, datum: t.datum })));
  assert.equal(kapitel.length, 28);
  for (const k of kapitel.filter((k) => k.teil === 1)) assert.equal(new Date(k.datum + "T12:00:00Z").getUTCDay(), 1, `${k.werk} beginnt an einem Montag`);
  assert.deepEqual([...new Set(kapitel.map((k) => k.werk))], ["Kleider machen Leute", "Die Judenbuche", "Aus dem Leben eines Taugenichts", "Der Schimmelreiter"]);
});
