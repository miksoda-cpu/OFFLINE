// Tests für Pause (Auftrag 2026-10-04-pause-stufe1): Einstellungen, wann ein Happen kommt, Dirigent, Linie, Zone,
// Rückfragen, Auffrischung, Rückspiegel, Paketformat und die Brücke spiel.melden / spiel.liste.
//   node --test web/pause.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { WERTE, einstellungenLaden, angeboten, happenFaellig, waehle, linieLaden, bewerten, zurueckholen, schwierigkeit, zoneAnpassen, verfuegbar,
  rueckfrageFaellig, rueckfrageBeantworten, auffrischungFaellig, auffrischungTermine, rueckspiegel, lumischHeute, lumischAntworten, soSeheIchDich, wochenSatz, logDazu, imKennenlernen, gewichtVon, stufeVon, tagVon, raumFormen, dauerText, LUMISCH_ALT, lumischUmbenannt } from "./pause.js";
import { pilzMs } from "./pause-happen.js";
import { pruefeNachricht, pruefeSpielMeldung, GRENZEN } from "./modul-host.js";
import { pauseFehler, GEBAUT } from "../paket-kit/pause-format.mjs";
import { FUNKTIONEN } from "./wesen.js";

const daten = JSON.parse(await readFile(new URL("../pakete/pause/inhalt/pause.json", import.meta.url), "utf8"));
const formen = daten.formen;
const T = (s) => Date.parse(s); // lokale Zeit
const an = { an: true, alter: "M1", appetit: "mittel", neuigkeit: 0, seit: "2026-09-01" };
const k = (x = {}) => ({ funktionen: FUNKTIONEN, abend: false, hat: { roman: true, gestern: true }, ...x });
const folge = (...werte) => { let i = 0; return () => werte[i++ % werte.length]; };

test("Einstellungen: standardmäßig aus, unter 14 nie an, Werte bleiben im Rahmen", () => {
  assert.equal(einstellungenLaden(null).an, false);
  assert.equal(einstellungenLaden({ an: true, alter: "kind" }).an, false, "unter 14 kein Pause");
  assert.equal(einstellungenLaden({ an: true }).an, false, "ohne Alter nicht an");
  assert.equal(einstellungenLaden(an).an, true);
  assert.equal(angeboten("kind"), false); assert.equal(angeboten("A"), true);
  const e = einstellungenLaden({ ...an, appetit: "riesig", neuigkeit: 9 });
  assert.equal(e.appetit, "mittel"); assert.equal(e.neuigkeit, 1);
});

test("Happen beim Öffnen: höchstens einmal je Öffnen, 10 Minuten zählen nicht, Appetit begrenzt, nie im Notfall, nach Schluss nur einmal abends", () => {
  let o = null; const t0 = T("2026-10-05T09:00:00");
  let r = happenFaellig({ einstellungen: an, jetzt: t0, oeffnen: o, route: "start", schluss: false });
  assert.equal(r.faellig, true); o = r.oeffnen;
  r = happenFaellig({ einstellungen: an, jetzt: t0 + 5 * 60000, oeffnen: o, route: "start", schluss: false });
  assert.equal(r.faellig, false, "innerhalb von 10 Minuten kein neues Öffnen"); o = r.oeffnen;
  r = happenFaellig({ einstellungen: an, jetzt: t0 + 30 * 60000, oeffnen: o, route: "notfall", schluss: false });
  assert.equal(r.faellig, false, "im Notfall nie"); o = r.oeffnen;
  let t = t0 + 60 * 60000, n = 1;
  for (let i = 0; i < 6; i++, t += 60 * 60000) { r = happenFaellig({ einstellungen: an, jetzt: t, oeffnen: o, route: "start", schluss: false }); if (r.faellig) n++; o = r.oeffnen; }
  assert.equal(n, WERTE.appetit.mittel, "Appetit mittel: drei Angebote am Tag");
  r = happenFaellig({ einstellungen: { ...an, appetit: "viel" }, jetzt: t, oeffnen: o, route: "start", schluss: false });
  assert.equal(r.faellig, true, "mehr Appetit, mehr Angebote");
  r = happenFaellig({ einstellungen: an, jetzt: T("2026-10-05T22:30:00"), oeffnen: o, route: "start", schluss: true });
  assert.deepEqual([r.faellig, r.nurAbend], [true, true]); o = r.oeffnen;
  r = happenFaellig({ einstellungen: an, jetzt: T("2026-10-05T23:30:00"), oeffnen: o, route: "start", schluss: true });
  assert.equal(r.faellig, false, "nach dem Tagesschluss nur einmal");
  r = happenFaellig({ einstellungen: an, jetzt: T("2026-10-06T08:00:00"), oeffnen: o, route: "start", schluss: false });
  assert.equal(r.faellig, true, "neuer Tag, neuer Appetit");
  assert.equal(happenFaellig({ einstellungen: { ...an, an: false }, jetzt: t0, oeffnen: null, route: "start" }).faellig, false, "aus heißt aus");
});

test("Verfügbar: wartende Formen nie, Tageszeit, Altersband, was gebraucht wird", () => {
  const f = (id) => formen.find((x) => x.id === id);
  for (const x of formen.filter((x) => x.bedingung)) assert.equal(verfuegbar(x, k({ jetzt: T("2026-10-05T09:00:00") })), false, `${x.id} wartet auf ${x.bedingung.funktion}`);
  assert.equal(verfuegbar(f("zeitgefuehl"), k({ jetzt: T("2026-10-05T09:00:00") })), true);
  assert.equal(verfuegbar(f("zeitgefuehl"), k({ jetzt: T("2026-10-05T15:00:00") })), false, "Zeitgefühl am Morgen");
  assert.equal(verfuegbar(f("rueckwaerts"), k({ jetzt: T("2026-10-05T15:00:00") })), false);
  assert.equal(verfuegbar(f("rueckwaerts"), k({ jetzt: T("2026-10-05T19:00:00") })), true, "Tag rückwärts ab 18 Uhr");
  assert.equal(verfuegbar(f("naechstes"), k({ jetzt: T("2026-10-05T09:00:00"), hat: { roman: false } })), false);
  assert.deepEqual(formen.filter((x) => !x.bedingung).map((x) => x.id).sort(), [...GEBAUT].sort(), "alle gebauten Formen stehen im Paket");
});

test("Dirigent: Mischung Vertraut/Verwandt/Neu, Regler, „Nicht mehr“ nie, nie zweimal hintereinander, Kennenlernen bringt Abwechslung", () => {
  const jetzt = T("2026-10-20T10:00:00");
  const log = []; for (const id of ["pilz", "pilz", "fehler", "fehler", "lumisch"]) logDazu(log, { quelle: "pause", id, art: formen.find((f) => f.id === id).art, ergebnis: {} }, jetzt - 86400000 * 3);
  const e = { ...an, seit: "2026-08-01" }; // Kennenlernen vorbei
  const zaehle = (o, n = 3000) => { const z = {}; let x = 11; const rnd = () => ((x = (x * 16807) % 2147483647) / 2147483647); for (let i = 0; i < n; i++) { const w = waehle({ formen, linie: o.linie ?? {}, log, einstellungen: o.e ?? e, jetzt, kontext: k(), rnd }); z[w.grund] = (z[w.grund] ?? 0) + 1; z[w.form.id] = (z[w.form.id] ?? 0) + 1; } return z; };
  const z = zaehle({});
  assert.ok(z.vertraut / 3000 > 0.55 && z.vertraut / 3000 < 0.75, `rund zwei Drittel Vertrautes (${z.vertraut})`);
  assert.ok(z.neu > 150 && z.neu < 450, `rund ein Zehntel Neues (${z.neu})`);
  const zn = zaehle({ e: { ...e, neuigkeit: 1 } });
  assert.ok(zn.neu > z.neu * 1.8, "Regler Richtung Neues");
  const za = zaehle({ linie: { aus: ["pilz"] } });
  assert.equal(za.pilz, undefined, "„Nicht mehr“ kommt nie");
  for (let i = 0; i < 50; i++) assert.notEqual(waehle({ formen, linie: {}, log, einstellungen: e, jetzt, kontext: k(), ohne: "pilz" }).form.id, "pilz");
  const kenn = waehle({ formen, linie: {}, log, einstellungen: { ...an, seit: "2026-10-15" }, jetzt, kontext: k(), rnd: folge(0) });
  assert.equal(kenn.grund, "kennenlernen"); assert.ok(!["pilz", "fehler"].includes(kenn.form.id), "im Kennenlernen das wenig Gespielte");
  assert.equal(imKennenlernen({ seit: "2026-10-15" }, jetzt), true); assert.equal(imKennenlernen({ seit: "2026-09-01" }, jetzt), false);
  assert.equal(waehle({ formen, linie: {}, log, einstellungen: e, jetzt: T("2026-10-20T22:30:00"), kontext: k({ nurAbend: true, abend: true }) }).form.id, "rueckwaerts", "nach Schluss nur der Tag rückwärts");
});

test("Uhrzeit (0.4.2): Tag rückwärts nie vor 18 Uhr, auch nach einem frühen Schluss; Atemfenster nie der erste Vorschlag des Tages", () => {
  const e = { ...an, seit: "2026-08-01" }, rueck = formen.find((x) => x.id === "rueckwaerts");
  assert.equal(WERTE.abendAb, 18); assert.deepEqual(WERTE.nichtAlsErstes, ["atem"]);
  for (const h of ["09", "14", "17"]) {
    assert.equal(verfuegbar(rueck, k({ jetzt: T(`2026-10-20T${h}:30:00`), abend: true })), false, `nicht um ${h}:30, auch wenn der Tag schon geschlossen ist`);
    assert.equal(waehle({ formen, linie: {}, log: [], einstellungen: e, jetzt: T(`2026-10-20T${h}:30:00`), kontext: k({ nurAbend: true, abend: true }) }), null, "nach frühem Schluss lieber nichts als die Abendfragen");
  }
  assert.equal(verfuegbar(rueck, k({ jetzt: T("2026-10-20T18:00:00") })), true);
  // Nur Atemfenster und Pilz zur Wahl: der erste Vorschlag des Tages ist nie das Atemfenster, danach darf es kommen
  const zwei = formen.filter((x) => ["atem", "pilz"].includes(x.id)), nachm = T("2026-10-20T15:00:00");
  for (let i = 0; i < 40; i++) assert.equal(waehle({ formen: zwei, linie: {}, log: [], einstellungen: e, jetzt: nachm, kontext: k(), rnd: Math.random }).form.id, "pilz");
  const log = []; logDazu(log, { quelle: "pause", id: "pilz", art: ["tempo"], ergebnis: {} }, nachm - 3600000);
  const ids = new Set(Array.from({ length: 60 }, () => waehle({ formen: zwei, linie: {}, log, einstellungen: e, jetzt: nachm, kontext: k(), rnd: Math.random }).form.id));
  assert.ok(ids.has("atem"), "nach dem ersten Happen darf das Atemfenster kommen");
  const abgebrochen = []; logDazu(abgebrochen, { quelle: "pause", id: "pilz", art: ["tempo"], ergebnis: {}, abgebrochen: true }, nachm - 3600000);
  for (let i = 0; i < 20; i++) assert.equal(waehle({ formen: zwei, linie: {}, log: abgebrochen, einstellungen: e, jetzt: nachm, kontext: k() }).form.id, "pilz", "ein abgebrochener zählt nicht");
  const nurAtem = formen.filter((x) => x.id === "atem");
  assert.equal(waehle({ formen: nurAtem, linie: {}, log: [], einstellungen: e, jetzt: nachm, kontext: k() }).form.id, "atem", "gibt es nur das Atemfenster, kommt es trotzdem");
});

test("Raum: alle gebauten Formen wählbar, wartende fehlen, Dauer oder Stand in Worten, Abend und Gebrauchtes mit Grund", () => {
  const roh = { ...an, seit: "2026-10-01" }, kont = k({ hat: { roman: true, gestern: true } });
  const l = raumFormen({ formen, einstellungen: roh, jetzt: T("2026-10-20T10:00:00"), kontext: kont, log: [], lumisch: daten.lumisch, heute: "2026-10-20" });
  assert.deepEqual(l.map((x) => x.form.id).sort(), [...GEBAUT].sort(), "genau die gebauten Formen");
  const by = Object.fromEntries(l.map((x) => [x.form.id, x]));
  assert.equal(by.rueckwaerts.geht, false); assert.equal(by.rueckwaerts.stand, "ab 18 Uhr");
  assert.equal(by.zeitgefuehl.geht, true, "Morgen-Formen darf man selbst auch später wählen");
  assert.equal(by.lumisch.stand, `Tag 1 von ${daten.lumisch.plan.length}`);
  for (const x of l.filter((y) => y.geht && y.form.id !== "lumisch")) assert.match(x.stand, /^(\d+ Sekunden|eine Minute|\w+ Minuten)$/, x.form.id);
  const abends = raumFormen({ formen, einstellungen: roh, jetzt: T("2026-10-20T19:00:00"), kontext: k({ hat: { roman: false, gestern: false } }), log: [], lumisch: daten.lumisch });
  const ab = Object.fromEntries(abends.map((x) => [x.form.id, x]));
  assert.equal(ab.rueckwaerts.geht, true); assert.equal(ab.naechstes.geht, false); assert.equal(ab.tuersteher.geht, false);
  assert.equal(dauerText({ dauer: { von: 40, bis: 60 } }), "50 Sekunden"); assert.equal(dauerText({ dauer: { von: 40, bis: 120 } }), "eine Minute"); assert.equal(dauerText({ dauer: { von: 60, bis: 180 } }), "zwei Minuten");
  const jung = raumFormen({ formen: formen.map((f) => (f.id === "pilz" ? { ...f, alter: ["A"] } : f)), einstellungen: roh, jetzt: T("2026-10-20T10:00:00"), kontext: kont, log: [], lumisch: daten.lumisch });
  assert.ok(!jung.some((x) => x.form.id === "pilz"), "außerhalb des Altersbands fehlt die Form");
});

test("Linie: Mehr davon hebt die Form und Verwandtes, Nicht mehr nimmt sie heraus bis zum Zurückholen, Grenzen halten", () => {
  let l = linieLaden(null);
  l = bewerten(l, formen, "pilz", "mehr");
  assert.equal(gewichtVon(l, "pilz"), 1.3); assert.ok(gewichtVon(l, "fehler") > 1, "verwandt (Tempo)");
  for (let i = 0; i < 30; i++) l = bewerten(l, formen, "pilz", "mehr");
  assert.equal(gewichtVon(l, "pilz"), WERTE.gewicht.hoch);
  l = bewerten(l, formen, "atem", "nicht"); assert.deepEqual(l.aus, ["atem"]);
  l = bewerten(l, formen, "atem", "passt"); assert.deepEqual(l.aus, ["atem"], "Passt holt nichts zurück");
  l = zurueckholen(l, "atem"); assert.deepEqual(l.aus, []);
  for (let i = 0; i < 50; i++) l = bewerten(l, formen, "fehler", "nicht");
  assert.ok(gewichtVon(l, "pilz") >= WERTE.gewicht.tief, "Verwandtes fällt nie unter die Grenze");
});

test("Zone: über 85 % eine Stufe schwerer, unter 75 % leichter; Zu leicht / Zu schwer stellt direkt; Pilz blitzt kürzer", () => {
  const pilz = formen.find((f) => f.id === "pilz");
  const log = (treffer) => Array.from({ length: 3 }, () => ({ quelle: "pause", id: "pilz", art: ["tempo"], ergebnis: { treffer, von: 3 }, zeit: "2026-10-05T10:00:00Z" }));
  assert.equal(stufeVon(zoneAnpassen({}, pilz, log(3)), pilz), pilz.zone.start + 1);
  assert.equal(stufeVon(zoneAnpassen({}, pilz, log(2)), pilz), pilz.zone.start - 1, "2 von 3 = 67 %");
  assert.equal(stufeVon(zoneAnpassen({}, pilz, log(3).slice(0, 2)), pilz), pilz.zone.start, "zu wenig Happen: nichts verstellen");
  assert.equal(stufeVon(schwierigkeit({}, pilz, "leicht"), pilz), pilz.zone.start + 1);
  assert.equal(stufeVon(schwierigkeit({}, pilz, "schwer"), pilz), pilz.zone.start - 1);
  assert.equal(stufeVon(schwierigkeit({}, pilz, "richtig"), pilz), pilz.zone.start);
  assert.ok(pilzMs(1) > pilzMs(5) && pilzMs(10) >= WERTE.pilz.msMin);
});

test("Rückfragen: höchstens eine am Tag im Kennenlernen, danach eine je Woche, jede nur einmal, überspringen fragt nicht wieder", () => {
  const e = { ...an, seit: "2026-10-01" };
  let l = linieLaden(null);
  const q1 = rueckfrageFaellig(l, e, T("2026-10-05T10:00:00")); assert.ok(q1);
  l = rueckfrageBeantworten(l, q1.id, "ruhiger", T("2026-10-05T10:00:00"));
  assert.equal(rueckfrageFaellig(l, e, T("2026-10-05T18:00:00")), null, "nicht zweimal am Tag");
  const q2 = rueckfrageFaellig(l, e, T("2026-10-06T10:00:00")); assert.ok(q2 && q2.id !== q1.id);
  l = rueckfrageBeantworten(l, q2.id, null, T("2026-10-06T10:00:00"));
  assert.ok(q2.id in l.antworten, "übersprungen: nicht wieder fragen");
  const spaeter = { ...an, seit: "2026-08-01" };
  assert.equal(rueckfrageFaellig(l, spaeter, T("2026-10-10T10:00:00")), null, "nach dem Kennenlernen nur einmal je Woche");
  assert.ok(rueckfrageFaellig(l, spaeter, T("2026-10-13T10:00:00")));
});

test("Auffrischung Pilz nach 11 und 35 Monaten: vorgemerkt, fällig, wird bevorzugt", () => {
  const l = linieLaden({ auffrischung: { pilz: { erstes: "2026-01-10" } } });
  assert.deepEqual(auffrischungTermine(l, formen)[0].termine.map((t) => t.datum), ["2026-12-10", "2028-12-10"]);
  assert.equal(auffrischungFaellig(l, formen, T("2026-12-01T10:00:00")), null);
  assert.equal(auffrischungFaellig(l, formen, T("2026-12-10T10:00:00")).monate, 11);
  const w = waehle({ formen, linie: l, log: [], einstellungen: { ...an, seit: "2026-01-10" }, jetzt: T("2026-12-11T10:00:00"), kontext: k() });
  assert.deepEqual([w.form.id, w.grund], ["pilz", "auffrischung"]);
  const erledigt = linieLaden({ auffrischung: { pilz: { erstes: "2026-01-10", erledigt: [11] } } });
  assert.equal(auffrischungFaellig(erledigt, formen, T("2026-12-11T10:00:00")), null);
});

test("Rückspiegel einmal im Monat in Worten, ohne Punkte; Wochen- und Kennenlern-Satz", () => {
  const e = { ...an, seit: "2026-08-01" }, jetzt = T("2026-10-05T10:00:00");
  const log = [{ quelle: "pause", id: "pilz", art: ["tempo"], ergebnis: { treffer: 3, von: 3, ms: 660 }, zeit: "2026-08-20T10:00:00" }, { quelle: "pause", id: "pilz", art: ["tempo"], ergebnis: { treffer: 3, von: 3, ms: 450 }, zeit: "2026-10-04T10:00:00" }];
  const t = rueckspiegel(log, {}, e, jetzt);
  assert.match(t, /Vor einem Monat .*660.*450/); assert.doesNotMatch(t, /Punkt|%/);
  assert.equal(rueckspiegel(log, { rueckspiegelAm: "2026-09-20T10:00:00" }, e, jetzt), null, "höchstens einmal im Monat");
  assert.equal(rueckspiegel(log, {}, { ...e, seit: "2026-09-20" }, jetzt), null, "frühestens nach einem Monat Pause");
  assert.match(soSeheIchDich(linieLaden({ antworten: { tempo: "ruhiger" } }), log, formen), /Wo war der Pilz\?.*ruhig/);
  assert.match(wochenSatz({}, [], formen, jetzt), /Ich achte darauf/);
});

test("Spiel-Log: Einträge mit Zeit, höchstens so viele wie erlaubt", () => {
  let log = [];
  for (let i = 0; i < WERTE.logMax + 5; i++) log = logDazu(log, { quelle: "pause", id: "atem", art: ["ausdauer"], ergebnis: {}, dauer: 40 }, T("2026-10-05T10:00:00"));
  assert.equal(log.length, WERTE.logMax); assert.equal(tagVon(Date.parse(log[0].zeit)), "2026-10-05");
});

test("Brücke spiel.melden / spiel.liste: nur erlaubte Werte, kein Modul-Feld, keine Daten für die Liste", () => {
  const m = (daten) => pruefeNachricht({ offline: 1, id: 1, aufruf: "spiel.melden", daten });
  const ok = { id: "wichteln", art: "gruppe", ergebnis: { personen: 4, engerl: false }, dauer: 0 };
  assert.deepEqual(m(ok), { ok: true, id: 1, aufruf: "spiel.melden", daten: { id: "wichteln", art: ["gruppe"], ergebnis: { personen: 4, engerl: false }, dauer: 0 } });
  assert.equal(m({ ...ok, modul: "anderes" }).ok, false, "fremde Modul-Kennung");
  assert.equal(m({ ...ok, id: "../x" }).ok, false);
  assert.equal(m({ ...ok, art: "geld" }).ok, false);
  assert.equal(m({ ...ok, art: ["tempo", "kraft", "gruppe", "ausdauer"] }).ok, false, "höchstens drei Arten");
  assert.equal(m({ ...ok, ergebnis: { tief: { x: 1 } } }).ok, false, "nichts Verschachteltes");
  assert.equal(m({ ...ok, ergebnis: { text: "x".repeat(81) } }).ok, false);
  assert.equal(m({ ...ok, ergebnis: Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`f${i}`, i])) }).ok, false, "zu viele Felder");
  assert.equal(m({ ...ok, dauer: -1 }).ok, false); assert.equal(m({ ...ok, dauer: Infinity }).ok, false);
  assert.equal(pruefeSpielMeldung({ ...ok, ergebnis: { Gross: 1 } }).ok, false, "Feldnamen klein");
  assert.equal(pruefeNachricht({ offline: 1, id: 2, aufruf: "spiel.liste" }).ok, true);
  assert.equal(pruefeNachricht({ offline: 1, id: 3, aufruf: "spiel.liste", daten: { modul: "wichteln" } }).ok, false, "Liste nimmt keine Daten");
  assert.equal(GRENZEN.meldungenProMinute, 10);
});

test("Paket pause: Format geprüft, Geschichten mit genau einem falschen Satz, Happen höchstens drei Minuten, kein Werbesatz für Gehirntraining", () => {
  assert.deepEqual(pauseFehler(daten), []);
  for (const f of formen.filter((x) => !x.bedingung)) assert.ok(f.dauer.bis <= 180, f.id);
  assert.ok(daten.fehler.length >= 12);
  const alles = JSON.stringify(daten);
  assert.doesNotMatch(alles, /Gehirntraining|Gehirnjogging|klüger|Demenz/i, "keine Werbung mit Gehirntraining");
  const kaputt = structuredClone(daten); kaputt.formen[0].dauer.bis = 600;
  assert.ok(pauseFehler(kaputt).some((f) => /höchstens 3 Minuten/.test(f)));
  const ohne = structuredClone(daten); ohne.formen.push({ ...ohne.formen[0], id: "neu-spiel" });
  assert.ok(pauseFehler(ohne).some((f) => /bedingung\.funktion/.test(f)), "eine Form ohne Spiel in der App muss warten");
});

// ---------- Nachtrag 2026-10-04-05 ----------
const ZAEHLUNG = /\b(\d+|einen|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)\s+(Tag|Tage|Tagen|Mal|Besuch|Besuche|Besuchen|Pausen)\b|\bTage(n)?\b|\bBesuch|\bmal da\b/i;
test("Rückspiegel zählt nie Tage oder Besuche: nur Fortschritt, sonst Lieblingsformen in Worten, sonst keine Karte", () => {
  const e = { ...an, seit: "2026-08-01" }, jetzt = T("2026-10-05T10:00:00");
  const ein = (id, zeit, ergebnis = {}) => ({ quelle: "pause", id, art: formen.find((f) => f.id === id).art, ergebnis, zeit });
  const faelle = [
    [],
    [ein("atem", "2026-09-20T10:00:00"), ein("atem", "2026-09-25T10:00:00"), ein("atem", "2026-10-01T10:00:00")],
    [ein("atem", "2026-09-20T10:00:00"), ein("atem", "2026-09-25T10:00:00"), ein("pilz", "2026-09-26T10:00:00", { treffer: 3, von: 3, ms: 500 }), ein("pilz", "2026-10-02T10:00:00", { treffer: 3, von: 3, ms: 500 })],
    [ein("fehler", "2026-09-22T10:00:00"), ein("rueckwaerts", "2026-09-23T20:00:00")],
    [ein("pilz", "2026-08-20T10:00:00", { treffer: 3, von: 3, ms: 660 }), ein("pilz", "2026-10-04T10:00:00", { treffer: 3, von: 3, ms: 450 })],
    [ein("lumisch", "2026-08-20T10:00:00", { wort: "zan" }), ein("lumisch", "2026-10-03T10:00:00", { wort: "mo" }), ein("lumisch", "2026-10-04T10:00:00", { wort: "pelu" })],
  ];
  const saetze = faelle.map((log) => rueckspiegel(log, {}, e, jetzt, formen));
  for (const t of saetze.filter(Boolean)) assert.doesNotMatch(t, ZAEHLUNG, t);
  assert.equal(saetze[0], null, "nichts gespielt: keine Karte");
  assert.equal(saetze[1], "Diesen Monat warst du am liebsten beim Atemfenster.");
  assert.match(saetze[2], /^Diesen Monat warst du am liebsten beim (Atemfenster und beim Pilz|Pilz und beim Atemfenster)\.$/);
  assert.equal(saetze[3], null, "nichts zweimal gespielt: keine Karte");
  assert.match(saetze[4], /Pilz/); assert.match(saetze[5], /Lumisch-Wörter/);
  assert.equal(rueckspiegel(faelle[1], { aus: ["atem"] }, e, jetzt, formen), null, "„Nicht mehr“ ist kein Liebling");
  for (const f of formen.filter((x) => !x.bedingung)) assert.ok(f.beim, `${f.id}: „beim“ für den Rückspiegel`);
});

test("Lumisch Tag 1 bis 40: Plan bis 21, danach zwei Wiederholungen und ein neues Wort, zuletzt Falsches zuerst", () => {
  const l = daten.lumisch, log = [];
  const tag = (n) => { const d = new Date(2026, 9, 1 + n); return d.getTime() + 10 * 3600000; };
  const heute = (n) => tagVon(tag(n));
  const verlauf = [];
  for (let n = 0; n < 40; n++) {
    const h = lumischHeute(log, l, heute(n));
    assert.equal(h.tag, n + 1, `Tag ${n + 1}`);
    assert.deepEqual(lumischHeute(log, l, heute(n)), h, "am selben Tag dasselbe");
    verlauf.push(h);
    // gespielt: im Plan das Wort des Tages; neue Wörter merken; Tag 25 wird falsch beantwortet
    const falsch = n + 1 === 25;
    const ergebnis = h.art === "plan" ? { wort: h.eintrag.wort || null, abgefragt: h.eintrag.wort || "zan", treffer: 1, von: 1 }
      : h.art === "neu" ? { wort: h.eintrag.wort, abgefragt: h.eintrag.wort, neu: true, treffer: 1, von: 1 }
      : { abgefragt: h.eintrag.wort, wiederholung: true, treffer: falsch ? 0 : 1, von: 1 };
    log.push({ quelle: "pause", id: "lumisch", art: ["kraft"], ergebnis, zeit: new Date(tag(n)).toISOString() });
  }
  assert.ok(verlauf.slice(0, 21).every((h) => h.art === "plan"));
  const danach = verlauf.slice(21).map((h) => h.art);
  assert.deepEqual(danach.slice(0, 6), ["wiederholung", "wiederholung", "neu", "wiederholung", "wiederholung", "neu"], "Tag 22–27");
  assert.equal(danach.filter((a) => a === "neu").length, 6, "Tag 22–40: jeder dritte Tag ein neues Wort");
  const neue = verlauf.filter((h) => h.art === "neu").map((h) => h.eintrag.wort);
  assert.equal(new Set(neue).size, neue.length, "kein neues Wort doppelt");
  assert.ok(neue.every((w) => l.woerterbuch.some((x) => x.wort === w && !x.im_plan)));
  assert.equal(verlauf[25].eintrag.wort, verlauf[24].eintrag.wort, "Tag 26 wiederholt das Wort, das an Tag 25 falsch war");
  assert.ok(verlauf.slice(21).every((h) => h.eintrag?.wort), "es gibt immer ein Wort");
  // Daten (seit 0.5.3): das ganze geprüfte Wörterbuch; die Ablenkwörter stammen daraus
  assert.equal(l.woerterbuch.filter((w) => w.im_plan).length, 20);
  assert.ok(l.woerter.every((w) => l.woerterbuch.some((x) => x.wort === w.wort)), "die Ablenkwörter stammen aus dem Wörterbuch");
  assert.ok(neue.every((w, i) => i === 0 || true) && l.woerterbuch.find((w) => w.wort === neue[0]).gruppe.startsWith("Unten"), "neue Wörter beginnen mit „Unten“");
  assert.deepEqual(lumischAntworten("bei, in, an, auf, hier"), ["bei", "in", "an", "auf", "hier"]);
  assert.deepEqual(lumischAntworten("Eis, kalt"), ["Eis", "kalt"]);
});

// ---------- Lumisch nach der Wortprüfung (Auftrag 2026-10-05-03, 0.5.3) ----------
// Die Beilage ist unveröffentlicht und liegt im Repo nur verschlüsselt (Auftrag 2026-10-06-13); die CI entschlüsselt sie mit dem
// Kanal-Schlüssel, ohne ihn wird der Abgleich übersprungen.
const BEILAGE = new URL("../pakete/pause/quelle/OFFLINE-Lumisch-Woerterbuch-2026-10-05.md", import.meta.url);
const AUSSPRACHE = new URL("../pakete/pause/quelle/OFFLINE-Lumisch-Aussprache.json", import.meta.url);
const MIT_BEILAGE = existsSync(BEILAGE) ? {} : { skip: "Beilage nur verschlüsselt im Repo" };
const beilage = existsSync(BEILAGE) ? await readFile(BEILAGE, "utf8") : "";

test("Lumisch: Wörterbuch im Paket entspricht der Beilage (500, keine Doppelten, kein altes Wort), Plan nach Abschnitt 8", MIT_BEILAGE, () => {
  const l = daten.lumisch;
  const abschnitt6 = beilage.slice(beilage.indexOf("## 6. Wörterbuch"), beilage.indexOf("## 7. Register"));
  const soll = [...abschnitt6.matchAll(/^\| \*\*([a-z]+)\*\* \| ([^|]+) \|/gm)].map((m) => [m[1], m[2].trim()]);
  assert.equal(soll.length, 500);
  assert.equal(l.woerterbuch.length, 500);
  assert.equal(new Set(l.woerterbuch.map((w) => w.wort)).size, 500, "keine Doppelten");
  assert.deepEqual(l.woerterbuch.map((w) => [w.wort, w.deutsch]).sort(), soll.sort(), "Wort und Deutsch wie in der Beilage");
  for (const alt of Object.keys(LUMISCH_ALT)) assert.ok(!l.woerterbuch.some((w) => w.wort === alt), `${alt} ist ersetzt`);
  const plan = Object.fromEntries(l.plan.map((p) => [p.tag, p]));
  assert.deepEqual([plan[3].wort, plan[3].bedeutung, plan[3].aufgabe], ["pelu", "Essen", "Beim nächsten Essen sagst du pelu."]);
  assert.deepEqual([plan[6].wort, plan[6].aufgabe], ["kiv", "Was ist heute kiv? Der Kühlschrank, das Fenster?"]);
  assert.match(plan[7].aufgabe, /\bkiv\b/);
  assert.ok(l.woerterbuch.every((w) => w.gruppe && w.deutsch), "jedes Wort mit Gruppe und Deutsch");
  assert.ok(l.woerterbuch.find((w) => w.wort === "lim").hinweis.includes("Zahlzeichen -"), "Zahlzeichen „-“ heißt lim");
  // Reihenfolge der Gruppen: Unten zuerst, Philosophie und „Zahl und Quant“ zuletzt
  const gruppen = [...new Set(l.woerterbuch.map((w) => w.gruppe))];
  assert.ok(gruppen.slice(0, 7).every((g) => g.startsWith("Unten")), "Unten zuerst, mit Pilzsorten und Höhlenstimmungen");
  assert.deepEqual(gruppen.slice(7, 11), ["Wie etwas ist", "Farben", "Gefühle und Gedanken", "Oben: Strom, Notfall, Familie"], "Strom nach Gefühle");
  const philo = gruppen.indexOf("Denken: Wissen, Wahrheit, Sprache");
  assert.ok(gruppen.indexOf("Gespräch") < philo && gruppen.indexOf("Zeit") < philo, "Gespräch und Zeit vor der Philosophie");
  assert.equal(gruppen.at(-1), "Zahl und Quant");
  assert.ok(!gruppen.some((g) => /Nachtrag|\(/.test(g)), "Nachträge stehen in ihrer Stammgruppe");
  // Nachträge reihen sich hinten in ihre Stammgruppe ein
  const koerper = l.woerterbuch.filter((w) => w.gruppe === "Unten: wir und unser Körper").map((w) => w.wort);
  const nachtrag = [...beilage.slice(beilage.indexOf("### Körper (Nachtrag)")).split("\n### ")[0].matchAll(/^\| \*\*([a-z]+)\*\*/gm)].map((m) => m[1]);
  assert.ok(nachtrag.length >= 5); assert.deepEqual(koerper.slice(-nachtrag.length), nachtrag);
  assert.match(l.woerterbuch.find((w) => w.wort === "tep").hinweis, /nach je drei Ziffern/, "tep in langen Zahlen");
});

test("Lumisch: kein ersetztes Wort in App, Paketen oder Tests (außer der Zuordnung alt → neu)", async () => {
  const { readdir } = await import("node:fs/promises");
  const dateien = [];
  for (const d of ["../web/", "../pakete/"]) {
    const gehe = async (u) => { for (const e of await readdir(u, { withFileTypes: true })) {
      const n = new URL(e.name + (e.isDirectory() ? "/" : ""), u);
      if (e.isDirectory()) { if (!["lib", "pakete", "katalog", "quelle", "node_modules", "lumi"].includes(e.name)) await gehe(n); }
      else if (/\.(js|mjs|json|html|md)$/.test(e.name)) dateien.push(n);
    } };
    await gehe(new URL(d, import.meta.url));
  }
  const alt = Object.keys(LUMISCH_ALT);
  const funde = [];
  for (const f of dateien) {
    const t = (await readFile(f, "utf8")).replace(/export const LUMISCH_ALT = \{[^}]*\};/, "");
    for (const w of alt) if (new RegExp(`(^|[^a-zäöüß])${w}([^a-zäöüß]|$)`).test(t)) funde.push(`${f.pathname.split("/").slice(-2).join("/")}: ${w}`);
  }
  assert.deepEqual(funde, []);
});

test("Lumisch: wer das alte Wort für Eis gelernt hat, verliert nichts; die Karte „Neu heißt es kiv“ kommt genau einmal", () => {
  const KIR = Object.keys(LUMISCH_ALT).find((k) => LUMISCH_ALT[k] === "kiv"); // das alte Wort, nur aus der Zuordnung
  const l = daten.lumisch;
  const tag = (n) => Date.parse("2026-09-01T10:00:00") + n * 86400000;
  const log = [];
  for (let n = 0; n < 21; n++) {
    const p = l.plan[n];
    log.push({ quelle: "pause", id: "lumisch", art: ["kraft"], zeit: new Date(tag(n)).toISOString(), ergebnis: { tag: n + 1, wort: n === 5 ? KIR : p.wort || null, abgefragt: n === 6 ? KIR : l.plan[0].wort, treffer: n === 6 ? 0 : 1, von: 1 } });
  }
  const h = lumischHeute(log, l, "2026-09-23");
  assert.equal(h.art, "wiederholung");
  assert.equal(h.eintrag.wort, "kiv", "das an Tag 7 falsch beantwortete alte Wort kommt als kiv wieder");
  const k = lumischUmbenannt(log, []);
  assert.deepEqual(k, { alt: KIR, neu: "kiv", text: "Neu heißt es kiv. Gleiches Eis, anderer Klang." });
  assert.equal(lumischUmbenannt(log, [KIR]), null, "danach nie wieder");
  assert.equal(lumischUmbenannt(log.map((e) => ({ ...e, ergebnis: { ...e.ergebnis, wort: e.ergebnis.wort === KIR ? "kiv" : e.ergebnis.wort, abgefragt: "zan" } })), []), null, "wer kiv gelernt hat, sieht nichts");
});

// ---------- Lumisch anhören (0.5.6, Auftrag 2026-10-05-09) ----------
test("Lumisch anhören: Umschrift und Lautschrift im Paket, Stimme de-AT zuerst, Weiche für IPA aus, ohne Stimme kein Knopf", async () => {
  const { waehleStimme, sprechText, hoerenKnopf, STIMME_KANN_IPA, TEMPO } = await import("./stimme.js");
  const paket = JSON.parse(await readFile(new URL("../pakete/pause/inhalt/pause.json", import.meta.url), "utf8"));
  const wb = paket.lumisch.woerterbuch;
  assert.equal(wb.length, 500);
  assert.ok(wb.every((w) => w.umschrift && w.ipa), "jedes Wort mit Umschrift und Lautschrift");
  if (existsSync(AUSSPRACHE)) {
    const a = new Map(JSON.parse(await readFile(AUSSPRACHE, "utf8")).woerter.map((x) => [x.wort, x]));
    for (const w of wb) { assert.equal(w.umschrift, a.get(w.wort)?.umschrift, w.wort); assert.equal(w.ipa, a.get(w.wort)?.ipa, w.wort); }
  }
  const w = (wort) => wb.find((x) => x.wort === wort);
  assert.equal(sprechText(w("kiv")), "kiw");
  assert.equal(sprechText(w("vau")), "wa u", "vau als wa-u, zwei Silben");
  assert.equal(sprechText(w("talzanpera")), "tal zan pe ra");
  assert.equal(STIMME_KANN_IPA, false); assert.equal(sprechText(w("vau"), true), "ˈva.u", "Weiche: mit IPA-Stimme die Lautschrift");
  assert.ok(TEMPO < 1, "etwas langsamer");
  const at = { lang: "de-AT", name: "Michael" }, de = { lang: "de-DE", name: "Anna" }, en = { lang: "en-US", name: "Sam", default: true };
  assert.equal(waehleStimme([en, de, at]), at); assert.equal(waehleStimme([en, de]), de); assert.equal(waehleStimme([en]), null); assert.equal(waehleStimme([]), null);
  assert.match(hoerenKnopf(w("vau")), /data-hoeren="wa u"[^>]*aria-label="vau anhören"[^>]*hidden/, "erst sichtbar, wenn es eine Stimme gibt");
  assert.equal(hoerenKnopf({ wort: "alt" }), "", "ohne Umschrift (altes Paket) kein Knopf");
  const happen = await readFile(new URL("./pause-happen.js", import.meta.url), "utf8");
  assert.equal((happen.match(/\$\{hoer\(/g) ?? []).length, 4, "neben jedem Lumisch-Wort: Plan, neues Wort, Wiederholung, Abfrage");
});
