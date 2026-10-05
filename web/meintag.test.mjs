// „Mein Tag“ (0.5.6, Auftrag 2026-10-05-10): eine Uhr für Tagesschluss, Lumi-Schlaf und Pause.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { meinTag, schlussVorbei, schlaeftJetzt, abendAb, morgenAb, schlussNachAlter, schlussNachStufe, vorschlag, vorschlagText, vorschlagAntwort, SCHLUSS_ZEITEN, AUFSTEHEN_ZEITEN, ARTEN, zeitText } from "./meintag.js";
import { schlussErreicht, PLAN_STANDARD } from "./tag.js";
import { nachtsSchlaf } from "./wesen.js";
import { verfuegbar, raumFormen } from "./pause.js";
import { HILFE } from "./hilfe.js";

const um = (h, m = 0) => new Date(2026, 9, 5, h, m).getTime();
const karte = [{ id: "a", art: "raetsel" }];
const formAbend = { id: "rueckwaerts", tageszeit: "abend", alter: ["J", "M1", "M2", "A"] };
const formMorgen = { id: "morgen", tageszeit: "morgen", alter: ["J", "M1", "M2", "A"] };

test("Zeiten: Schluss 19:00 bis 24:00 und Aufstehen 5:00 bis 9:00 in halben Stunden, drei Knöpfe", () => {
  assert.equal(SCHLUSS_ZEITEN.length, 11); assert.equal(zeitText(SCHLUSS_ZEITEN[0]), "19:00"); assert.equal(zeitText(SCHLUSS_ZEITEN.at(-1)), "24:00");
  assert.equal(AUFSTEHEN_ZEITEN.length, 9); assert.equal(zeitText(AUFSTEHEN_ZEITEN[0]), "5:00"); assert.equal(zeitText(AUFSTEHEN_ZEITEN.at(-1)), "9:00");
  assert.deepEqual(ARTEN.map((a) => [a.titel, zeitText(a.schluss), zeitText(a.aufstehen)]), [["Morgenmensch", "21:30", "6:00"], ["Dazwischen", "22:30", "7:00"], ["Nachtmensch", "23:30", "8:00"]]);
});

test("Startwert nach Alter, Übernahme der alten vollen Stunde und von „keine Uhrzeit“", () => {
  assert.equal(zeitText(schlussNachAlter(8)), "19:30"); assert.equal(zeitText(schlussNachAlter(12)), "20:30");
  assert.equal(zeitText(schlussNachAlter(16)), "21:30"); assert.equal(zeitText(schlussNachAlter(40)), "22:30");
  assert.equal(zeitText(schlussNachStufe("kind")), "19:30"); assert.equal(zeitText(schlussNachStufe("A")), "22:30");
  assert.deepEqual(meinTag(null, null), { schluss: 22 * 60 + 30, aufstehen: 7 * 60 }, "neu ohne Alter: Dazwischen");
  assert.equal(meinTag(null, "kind").schluss, 19 * 60 + 30, "neu mit Alter: Startwert");
  assert.equal(meinTag({ schlussUm: 22 }, "kind").schluss, 22 * 60, "wer 22 Uhr hatte, behält 22:00");
  assert.equal(meinTag({ schlussUm: null }, "A").schluss, null, "wer keine Uhrzeit hatte, behält keine");
  assert.equal(meinTag({ schluss: 19 * 60 + 30, schlussUm: 22 }).schluss, 19 * 60 + 30, "neues Feld geht vor");
  assert.equal(meinTag({ schluss: 1234 }).schluss, 22 * 60 + 30, "Unsinn wird Standard");
});

test("Eine Uhr: 22:30 – Tagesschluss, Lumi-Schlaf, Pause-Abend und -Morgen", () => {
  const tag = { schluss: 22 * 60 + 30, aufstehen: 7 * 60 }, plan = { ...PLAN_STANDARD, ...tag };
  assert.equal(schlussErreicht({ karten: karte, jetzt: um(22, 29), plan }), null);
  assert.equal(schlussErreicht({ karten: karte, jetzt: um(22, 30), plan }), "uhrzeit");
  assert.equal(schlussVorbei(um(22, 30), tag), true); assert.equal(schlussVorbei(um(22, 0), tag), false);
  assert.equal(nachtsSchlaf(um(22, 29), {}, tag), false); assert.equal(nachtsSchlaf(um(22, 30), {}, tag), true);
  assert.equal(nachtsSchlaf(um(6, 59), {}, tag), true); assert.equal(nachtsSchlaf(um(7, 0), {}, tag), false);
  const k = (h, m) => ({ jetzt: um(h, m), tag, funktionen: new Set() });
  assert.equal(abendAb(tag), 20 * 60 + 30);
  assert.equal(verfuegbar(formAbend, k(20, 29)), false); assert.equal(verfuegbar(formAbend, k(20, 30)), true, "zwei Stunden vor Schluss");
  assert.equal(verfuegbar(formMorgen, k(6, 59)), false); assert.equal(verfuegbar(formMorgen, k(7, 0)), true, "ab Aufstehen");
  assert.equal(verfuegbar(formMorgen, k(12, 0)), false, "bis 12 Uhr");
});

test("Eine Uhr: 19:30 – der Abend in Pause trotzdem nie vor 18 Uhr", () => {
  const tag = { schluss: 19 * 60 + 30, aufstehen: 6 * 60 + 30 }, plan = { ...PLAN_STANDARD, ...tag };
  assert.equal(schlussErreicht({ karten: karte, jetzt: um(19, 30), plan }), "uhrzeit");
  assert.equal(nachtsSchlaf(um(19, 30), {}, tag), true); assert.equal(nachtsSchlaf(um(6, 30), {}, tag), false);
  assert.equal(abendAb(tag), 18 * 60, "nie vor 18 Uhr");
  assert.equal(verfuegbar(formAbend, { jetzt: um(17, 59), tag }), false); assert.equal(verfuegbar(formAbend, { jetzt: um(18, 0), tag }), true);
  const r = raumFormen({ formen: [formAbend], einstellungen: { an: true, alter: "A" }, jetzt: um(12, 0), kontext: { tag, funktionen: new Set() }, log: [] });
  assert.equal(r[0].stand, "ab 18 Uhr");
  const r2 = raumFormen({ formen: [formAbend], einstellungen: { an: true, alter: "A" }, jetzt: um(12, 0), kontext: { tag: { schluss: 22 * 60 + 30, aufstehen: 420 }, funktionen: new Set() }, log: [] });
  assert.equal(r2[0].stand, "ab 20:30 Uhr");
});

test("Eine Uhr: keine Uhrzeit – kein Tagesschluss nach Zeit, Lumi schläft nach der gelernten Zeit bis Aufstehen", () => {
  const tag = { schluss: null, aufstehen: 7 * 60 }, plan = { ...PLAN_STANDARD, ...tag };
  assert.equal(schlussErreicht({ karten: karte, jetzt: um(23, 50), plan }), null);
  assert.equal(schlussVorbei(um(23, 50), tag), false);
  assert.equal(nachtsSchlaf(um(21, 59), {}, tag), false); assert.equal(nachtsSchlaf(um(22, 0), {}, tag), true, "ungelernt: 22 Uhr wie bisher");
  const g = { abende: Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`2026-09-0${i + 1}`, 11 * 60 + 30])) }; // 23:30 → schläft ab 0:00
  assert.equal(nachtsSchlaf(um(23, 45), g, tag), false); assert.equal(nachtsSchlaf(um(0, 15), g, tag), true);
  assert.equal(abendAb(tag), 18 * 60);
  assert.equal(schlaeftJetzt(um(6, 59), tag, 22 * 60), true); assert.equal(schlaeftJetzt(um(7, 0), tag, 22 * 60), false);
  assert.equal(morgenAb(tag), 7 * 60);
});

test("Vorschlag: einmal fragen bei mehr als 45 Minuten Abweichung über zwei Wochen, nach zweimal „Nein“ nie wieder", () => {
  const tag = { schluss: 22 * 60, aufstehen: 7 * 60 };
  const abende = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`2026-10-${String(i + 1).padStart(2, "0")}`, 11 * 60 + 15])); // 23:15
  const heute = "2026-10-14";
  const v = vorschlag({ abende, tag, frage: {}, heute });
  assert.deepEqual(v, { wach: 23 * 60 + 15, neu: 23 * 60 });
  assert.equal(vorschlagText(v), "Du bist meist bis 23:15 wach. Schluss auf 23:00 verschieben?");
  assert.equal(vorschlag({ abende, tag: { ...tag, schluss: 22 * 60 + 30 }, heute }), null, "45 Minuten: keine Frage");
  assert.equal(vorschlag({ abende: Object.fromEntries(Object.entries(abende).slice(0, 9)), tag, heute }), null, "zu wenige Abende");
  assert.equal(vorschlag({ abende, tag: { ...tag, schluss: null }, heute }), null, "ohne Uhrzeit keine Frage");
  // Nein, Nein → nie wieder; dazwischen 14 Tage Ruhe
  let f = vorschlagAntwort({}, false, heute);
  assert.equal(vorschlag({ abende, tag, frage: f, heute: "2026-10-20" }), null, "nicht gleich wieder");
  const spaeter = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`2026-10-${String(i + 15).padStart(2, "0")}`, 11 * 60 + 15]));
  assert.ok(vorschlag({ abende: spaeter, tag, frage: f, heute: "2026-10-28" }), "nach zwei Wochen ein zweites Mal");
  f = vorschlagAntwort(f, false, "2026-10-28");
  assert.equal(f.nein, 2);
  assert.equal(vorschlag({ abende: spaeter, tag, frage: { ...f, zuletzt: "2025-01-01" }, heute: "2026-10-28" }), null, "nach zweimal Nein nie wieder");
  // spät nach Mitternacht
  const nachts = Object.fromEntries(Object.keys(abende).map((d) => [d, 13 * 60 + 10])); // 1:10
  assert.equal(vorschlag({ abende: nachts, tag, heute }).neu, 24 * 60, "höchstens 24:00");
});

test("Info und Hilfe im Tagesplan, Wort für Wort aus dem Auftrag; Oberfläche mit drei Knöpfen", async () => {
  const t = await readFile(new URL("../bill/erledigt/2026-10-05-tagesende.md", import.meta.url), "utf8").catch(() => readFile(new URL("../bill/todo/2026-10-05-tagesende.md", import.meta.url), "utf8"));
  const soll = [...t.matchAll(/^\s+- „(.+?)“ – „(.+)“$/gm)].map((m) => [m[1], m[2]].map((x) => x.replace(/‚/g, "„").replace(/‘/g, "“")));
  assert.equal(soll.length, 2); assert.deepEqual(HILFE.tagesplan, soll);
  const app = await readFile(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /data-mein-tag-art=/); assert.match(app, /data-tagesplan="schluss"/); assert.match(app, /data-tagesplan="aufstehen"/);
  assert.match(app, /hilfeZeile\("tagesplan", "bereit-hilfe"\)/); assert.match(app, /data-anker="tagesplan">Mein Tag ändern/);
  assert.doesNotMatch(app, /data-tagesplan="schlussUm"/);
});
