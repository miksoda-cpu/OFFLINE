// Tests für Pause (Auftrag 2026-10-04-pause-stufe1): Einstellungen, wann ein Happen kommt, Dirigent, Linie, Zone,
// Rückfragen, Auffrischung, Rückspiegel, Paketformat und die Brücke spiel.melden / spiel.liste.
//   node --test web/pause.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { WERTE, einstellungenLaden, angeboten, happenFaellig, waehle, linieLaden, bewerten, zurueckholen, schwierigkeit, zoneAnpassen, verfuegbar,
  rueckfrageFaellig, rueckfrageBeantworten, auffrischungFaellig, auffrischungTermine, rueckspiegel, soSeheIchDich, wochenSatz, logDazu, imKennenlernen, gewichtVon, stufeVon, tagVon } from "./pause.js";
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
  assert.equal(waehle({ formen, linie: {}, log, einstellungen: e, jetzt: T("2026-10-20T14:00:00"), kontext: k({ nurAbend: true, abend: true }) }).form.id, "rueckwaerts", "nach Schluss nur der Tag rückwärts");
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
