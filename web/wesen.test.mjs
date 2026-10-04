// node --test web/wesen.test.mjs – Lumi: drei Stufen (Standard Textkarten), kein „ich“ ohne Namen, Übergang, Nachtschlaf,
// Mimik nach der Tafel, Wortschatz der Tipp-Bedingungen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SORTEN, erzaehltVonSich, FUNKTIONEN, ZIELE, tippAktion, tippKnoepfeHtml, bewerten, bewertungLaden, sorteGewicht, GEWICHT, lumiEinstellungenLaden, einladungFaellig, mimikZustand, passtBedingung, tippPool, ohneIch, TEXTE, DARSTELLUNG, nachtsSchlaf, schlafenszeit, abendMerken, Wesen } from "./wesen.js";
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

test("Tipp-Bestand: 175 Tipps (laune-010 gestrichen), Sorten klein, nur bekannter Wortschatz, app-001 korrigiert", () => {
  assert.equal(tipps.length, 175);
  assert.equal(new Set(tipps.map((t) => t.id)).size, 175);
  assert.ok(!tipps.some((t) => t.id === "laune-010"));
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

test("Tipps, die einen Zustand behaupten, kommen nur, wenn er stimmt (Treffpunkt, Wasser, Probeabend; Wort „offen“)", () => {
  const t = Object.fromEntries(tipps.map((x) => [x.id, x]));
  const vor = (m) => new Date(Date.parse("2026-09-30T10:00:00") - m * 30.44 * TAG).toISOString();
  // alltag-020: nur mit bestätigtem Treffpunkt, Text ohne „Tresor“
  assert.doesNotMatch(t["alltag-020"].text, /Tresor/);
  assert.equal(passtBedingung(t["alltag-020"].bedingung, k()), false, "ohne Treffpunkt nicht");
  assert.equal(passtBedingung(t["alltag-020"].bedingung, k({ positionen: { "c-3-2": vor(1) } })), true);
  // alltag-002 „noch keinen Treffpunkt“: genau umgekehrt
  assert.equal(passtBedingung(t["alltag-002"].bedingung, k()), true);
  assert.equal(passtBedingung(t["alltag-002"].bedingung, k({ positionen: { "c-3-2": vor(1) } })), false);
  // Wasser neun Monate, Probeabend sechs Monate
  assert.equal(passtBedingung(t["alltag-001"].bedingung, k({ positionen: { "c-0-0": vor(2) } })), false);
  assert.equal(passtBedingung(t["alltag-001"].bedingung, k({ positionen: { "c-0-0": vor(9.5) } })), true);
  assert.equal(passtBedingung(t["alltag-028"].bedingung, k()), false);
  assert.equal(passtBedingung(t["alltag-028"].bedingung, k({ positionen: { probeabend: vor(7) } })), true);
  assert.equal(passtBedingung(t["alltag-026"].bedingung, k({ positionen: { "c-0-0": vor(13) } })), false, "nur wenn wirklich verfallen");
  assert.equal(passtBedingung(t["alltag-026"].bedingung, k({ verfallen: true, benannt: true, positionen: { "c-0-0": vor(13) } })), true);
});

// Woran man erkennt, dass ein Tipp eine Funktion der App nennt (Grundsatz aus Auftrag 2026-10-01-tipps-und-jaenner).
// Kommt ein Tipp mit einer neuen Funktion dazu, gehört sie hier dazu.
const NENNT = {
  wischen: /\bWisch/, "was-ist-los": /„Was ist los\?“/, gelernt: /„gelernt“/, briefe: /Briefe, die sich öffnen/,
  "karte-offline": /Karte deiner Region/, kalender: /Kalender in der App/, wohin: /„Wohin“/, tagebuch: /Tagebuch/,
  schliessfach: /Schließfach/, "skin-kontrast": /Kontrast-Skin/, familiennachricht: /Familiennachricht/,
  "offline-stunde": /Offline-Stunde/, mesh: /Mesh/, fernschach: /Fernschach/, "neujahr-buecher": /neue Bücher in die Bibliothek/,
  "zettel-drucken": /App druckt/, fragen: /Frag noch einmal\. Mich/,
  tagesseite: /Tagesseite/, tagesplan: /Tagesplan/, vorrat: /Der Vorrat/, vorlesen: /[Vv]orlesen|liest dir die App vor/,
  sparmodus: /Sparmodus/, tresor: /Tresor/, notfallmappe: /Notfallmappe/, bereit: /Bereit/, bibliothek: /Bibliothek/,
  werkzeuge: /Werkzeuge/, radio: /Frequenz deines/, skins: /\bSkin\b/,
};

test("Funktionen: Jeder Tipp, der eine Funktion nennt, hat sie in der App oder wartet mit „funktion“ auf sie", () => {
  let nennungen = 0;
  for (const t of tipps) for (const [f, muster] of Object.entries(NENNT)) {
    if (!muster.test(t.text)) continue;
    nennungen++;
    const wartet = [].concat(t.bedingung?.funktion ?? []);
    assert.ok(FUNKTIONEN.has(f) || wartet.includes(f), `${t.id} nennt „${f}“, die App hat sie nicht und der Tipp hat keine funktion-Bedingung`);
  }
  assert.ok(nennungen >= 25);
  // jede funktion-Bedingung nennt eine bekannte Funktion (sonst wartet der Tipp für immer)
  for (const t of tipps) for (const f of [].concat(t.bedingung?.funktion ?? [])) assert.ok(NENNT[f], `${t.id}: funktion „${f}“ unbekannt`);
  // Bills Liste vom 1.10.: alle warten auf ihre Funktion und kommen heute nicht
  const t = Object.fromEntries(tipps.map((x) => [x.id, x]));
  for (const id of ["app-002", "app-003", "app-006", "app-014", "app-015", "app-016", "app-017", "app-018", "app-019", "app-024", "app-026", "app-028", "app-029", "app-033", "alltag-023"]) {
    assert.ok(t[id].bedingung?.funktion, id);
    assert.equal(passtBedingung(t[id].bedingung, k({ ansicht: t[id].bedingung.ansicht, benannt: true })), false, id);
  }
  // das Wort selbst: vorhanden → ja, fehlt eine → nein
  assert.equal(passtBedingung({ funktion: "tresor" }, k()), true);
  assert.equal(passtBedingung({ funktion: ["tresor", "mesh"] }, k()), false);
});

test("Keine alten Punktzahlen und keine Behauptungen ohne Wissen (Auftrag 2026-10-01)", () => {
  const t = Object.fromEntries(tipps.map((x) => [x.id, x]));
  for (const x of tipps) assert.doesNotMatch(x.text, /\b(acht|zehn|fünf|Fünf)\s+Punkte/, x.id);
  for (const id of ["alltag-001", "alltag-003", "alltag-014"]) assert.match(t[id].text, /hebt deine Bereit-Zahl/, id);
  for (const id of ["laune-006", "laune-007", "laune-015", "laune-002", "alltag-004", "alltag-039"]) assert.doesNotMatch(t[id].text, /^Du (hast|wischst)|Zwei Nachbarn eingetragen|noch bei sieben/, id);
  assert.match(t["app-005"].text, /unten/); assert.doesNotMatch(t["app-005"].text, /unter sieben/);
  assert.doesNotMatch(t["app-010"].text, /Blackout/);
  assert.doesNotMatch(t["app-020"].text, /jedem Text/);
});

// ---------- Auftrag 2026-10-04-lumi-knoepfe ----------
const neuesWesen = (gespeichert = {}) => {
  const m = new Map(Object.entries(gespeichert));
  const sp = { get: (x, d) => (m.has(x) ? m.get(x) : d), set: (x, v) => m.set(x, v), m };
  globalThis.addEventListener ??= () => {};
  globalThis.document ??= { getElementById: () => null, hidden: false };
  document.createElement ??= () => ({ setAttribute() {}, remove() {} });
  document.body ??= { appendChild() {} };
  document.querySelectorAll ??= () => [];
  return { w: new Wesen({ speicher: sp, tipps: () => tipps }), sp };
};

test("Knöpfe je Sorte: App „Zeig mir“ mit Ziel, Alltag „Mach ich“, Wissen „Merken“, Digital je nach Ziel, Weisheit und Laune nur Bewertung", () => {
  const t = Object.fromEntries(tipps.map((x) => [x.id, x]));
  assert.equal(tippAktion(t["app-001"]), "zeig");
  assert.equal(tippAktion(t["app-030"]), null, "App ohne eindeutiges Ziel: nur Bewertung");
  assert.equal(tippAktion(tipps.find((x) => x.sorte === "alltag")), "mach");
  assert.equal(tippAktion(tipps.find((x) => x.sorte === "wissen")), "merken");
  assert.equal(tippAktion(t["digital-001"]), "zeig");
  assert.equal(tippAktion(t["digital-002"]), "merken");
  for (const s of ["weisheit", "laune"]) assert.equal(tippAktion(tipps.find((x) => x.sorte === s)), null, s);
  assert.equal(tippAktion({ sorte: "app", ziel: "irgendwo" }), null, "unbekanntes Ziel zählt nicht");
  const h = tippKnoepfeHtml(t["app-001"], { ort: "karte" });
  assert.match(h, /data-lumi-aktion="zeig"[^>]*>Zeig mir</);
  for (const l of ["Mehr davon", "Passt", "Nicht mehr"]) assert.match(h, new RegExp(`>${l}<`));
  assert.doesNotMatch(h, /Gelesen|Weglegen/);
  assert.match(tippKnoepfeHtml(tipps.find((x) => x.sorte === "wissen"), { gemerkt: true }), /Steht im Heft/);
  assert.match(tippKnoepfeHtml(tipps.find((x) => x.sorte === "alltag"), { vorgemerkt: true }), /Steht in Vorsorge/);
  assert.doesNotMatch(tippKnoepfeHtml(tipps.find((x) => x.sorte === "laune")), /data-lumi-aktion/);
});

test("Ziele: gleiche Liste wie das Kit, jedes Ziel gibt es in der App, jeder Tipp mit Ziel zeigt auf eine bekannte Stelle", async () => {
  const kit = await import("../paket-kit/tipps-format.mjs");
  assert.deepEqual(ZIELE, kit.ZIELE);
  const app = await readFile(new URL("./app.js", import.meta.url), "utf8");
  const seiten = app.slice(app.indexOf("const seiten = {"));
  for (const z of ZIELE) {
    const anker = { tagesplan: 'id="tagesplan"', lumi: 'id="lumi-einstellungen"', "lumi-log": 'id="lumi-log"' }[z];
    assert.ok(anker ? app.includes(anker) : new RegExp(`\\n  ${z}\\(\\) \\{`).test(seiten), `Ziel ${z} fehlt in der App`);
  }
  for (const t of tipps.filter((x) => x.ziel)) assert.ok(ZIELE.includes(t.ziel), t.id);
  assert.ok(tipps.filter((x) => x.sorte === "app" && x.ziel).length >= 12);
  for (const t of tipps.filter((x) => x.ziel && x.bedingung?.funktion)) assert.ok([].concat(t.bedingung.funktion).every((f) => FUNKTIONEN.has(f)), `${t.id}: Ziel nur, wenn die Funktion da ist`);
  assert.ok(passtBedingung(tipps.find((x) => x.id === "app-004").bedingung, k({ benannt: true })), "„gelernt“ gibt es jetzt: app-004 kommt");
  assert.deepEqual(kit.tippsFehler({ tipps }), []);
  assert.ok(kit.tippsFehler({ tipps: [{ id: "a-1", sorte: "app", text: "x", ziel: "nirgendwo" }] }).some((f) => /ziel unbekannt/.test(f)));
  assert.ok(kit.tippsFehler({ tipps: [{ id: "a-1", sorte: "app", text: "x", buch: "Kapitel 3" }] }).some((f) => /buch/.test(f)));
  assert.deepEqual(kit.tippsFehler({ tipps: [{ id: "a-1", sorte: "app", text: "x", buch: "b1-03-07", ziel: "tresor" }] }), []);
});

test("Bewertung: Mehr davon hebt die Sorte, Nicht mehr nimmt den Satz heraus und senkt leicht, Passt ändert nichts, Grenzen halten", () => {
  const a = { id: "wissen-001", sorte: "wissen" };
  let s = bewertungLaden(null);
  s = bewerten(s, a, "passt"); assert.deepEqual(s, { gewicht: {}, aus: [] });
  s = bewerten(s, a, "mehr"); assert.equal(sorteGewicht(s, "wissen"), 1.3);
  for (let i = 0; i < 20; i++) s = bewerten(s, a, "mehr");
  assert.equal(sorteGewicht(s, "wissen"), GEWICHT.hoch);
  s = bewerten(s, { id: "laune-001", sorte: "laune" }, "nicht");
  assert.equal(sorteGewicht(s, "laune"), 0.85); assert.deepEqual(s.aus, ["laune-001"]);
  for (let i = 0; i < 30; i++) s = bewerten(s, { id: "laune-001", sorte: "laune" }, "nicht");
  for (const sorte of Object.keys(SORTEN)) { let x = bewertungLaden(null); for (let i = 0; i < 100; i++) x = bewerten(x, { id: `${sorte}-${i}`, sorte }, "nicht"); assert.ok(sorteGewicht(x, sorte) > 0, `${sorte} fällt nie auf null`); }
  assert.equal(sorteGewicht(s, "laune"), GEWICHT.tief); assert.deepEqual(s.aus, ["laune-001"], "einmal ausgeschlossen, nicht doppelt");
  assert.deepEqual(bewertungLaden({ gewicht: { wissen: 99, quatsch: 2, app: -1 }, aus: ["x", "x", 3] }), { gewicht: { wissen: 3 }, aus: ["x"] });
  // Ausschluss wirkt auf den Pool
  const e = { ...lumiEinstellungenLaden(null), darstellung: "wesen" };
  const pool = tippPool(tipps, e, k({ benannt: true }), new Set(["wissen-001"]));
  assert.ok(pool.length > 0 && !pool.some((t) => t.id === "wissen-001"));
});

test("Bewertung wirkt auf die Auswahl der Lumi und lässt sich zurücknehmen", () => {
  const { w } = neuesWesen();
  w.einstellen("name", "Susi"); w.e.darstellung = "wesen"; w.namensfrage = false;
  const echt = Math.random; let x = 7; Math.random = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  try {
    const anteil = () => { let n = 0; for (let i = 0; i < 1500; i++) if (w.waehleTipp()?.sorte === "wissen") n++; return n / 1500; };
    const vorher = anteil();
    for (let i = 0; i < 6; i++) w.bewerte("wissen-001", "mehr");
    const nachher = anteil();
    assert.ok(nachher > vorher * 1.8, `Wissen kommt öfter (${vorher.toFixed(2)} → ${nachher.toFixed(2)})`);
    w.bewerte("laune-001", "nicht");
    for (let i = 0; i < 1500; i++) assert.notEqual(w.waehleTipp()?.id, "laune-001");
    assert.match(w.gelerntHtml(), /Zurückholen/);
    w.zurueckholen("laune-001"); assert.deepEqual(w.bewertung.aus, []);
    w.lernenZuruecksetzen(); assert.deepEqual(w.bewertung, { gewicht: {}, aus: [] });
  } finally { Math.random = echt; }
});

test("Heft = Log mit Filter „gemerkt“: Merken setzt den Stern, kein zweiter Speicher, einzeln löschbar, durchsuchbar, Gemerktes fällt nie aus dem Log", () => {
  const { w, sp } = neuesWesen({ "wesen-log": [{ id: "wissen-002", sorte: "wissen", text: "Alter Stern", zeit: "2026-09-30T08:00:00Z", stern: true }] });
  assert.deepEqual(w.heft.map((h) => h.id), ["wissen-002"], "Sterne aus dem Log stehen im Heft");
  assert.ok(w.merken("wissen-001")); assert.ok(w.imHeft("wissen-001"));
  assert.ok(sp.m.get("wesen-log").some((l) => l.id === "wissen-001" && l.stern && l.zeit), "Merken = Stern im Log");
  assert.equal(sp.m.has("lumi-heft"), false, "kein zweiter Speicher");
  assert.match(w.logHtml("gemerkt"), /2 Tipps/);
  for (let i = 0; i < 600; i++) w.log.push({ id: `x-${i}`, sorte: "app", text: "x", zeit: new Date().toISOString(), stern: false });
  w.speichern(); assert.ok(w.imHeft("wissen-002") && w.log.length <= 502, "Gemerktes bleibt, Rest auf 500 gekürzt");
  w.merken("wissen-001"); assert.equal(w.heft.filter((h) => h.id === "wissen-001").length, 1, "nicht doppelt");
  const wort = tipps.find((t) => t.id === "wissen-001").text.split(" ")[1];
  assert.match(w.heftHtml(wort), /von 2/);
  assert.match(w.heftHtml("zzzz-nichts"), /Nichts gefunden/);
  w.stern("wissen-002"); assert.ok(!w.imHeft("wissen-002"), "Stern aus = aus dem Heft");
  w.heftLoeschen("wissen-001"); assert.equal(w.heft.length, 0);
});

test("Eine Stimme und kein Tipp vor dem Namen: Namensfrage zuerst, nach „Später“ Sätze ohne „ich“, auch nach Neustart", () => {
  const { w, sp } = neuesWesen();
  w.einschalten = Wesen.prototype.einschalten; w.e.darstellung = "wesen"; w.namensfrage = true;
  const ohne = tipps.find((t) => ohneIch(t.text) && !t.bedingung);
  w.zeigeTipp(ohne); assert.equal(w.aktuellerTipp, null, "während der Namensfrage kein Tipp");
  assert.equal(w.satzDesTages(ohne), false);
  w.spaeter(); assert.equal(sp.m.get("lumi-start").spaeter, true);
  w.zeigeTipp(ohne); assert.equal(w.aktuellerTipp?.id, ohne.id, "nach „Später“ darf sie Sätze ohne ich sagen");
  for (let i = 0; i < 200; i++) { const t = w.waehleTipp(); if (t) assert.ok(!erzaehltVonSich(t), t.id); }
  const w2 = new Wesen({ speicher: sp, tipps: () => tipps }); w2.e.darstellung = "wesen";
  assert.equal(new Wesen({ speicher: sp, tipps: () => tipps }).namensfrage, false, "„Später“ gilt auch nach dem Neustart");
  // mit Namen: Satz des Tages in der Sprechblase, ein zweiter Satz wartet
  w.tippSchliessen(); w.namenGeben("Susi");
  assert.equal(w.satzDesTages(ohne), true); assert.equal(w.tagesSatz, ohne.id);
  assert.equal(w.satzDesTages(tipps[1]), false, "nie zwei Sätze zugleich");
  w.bewerte(ohne.id, "passt"); assert.equal(w.aktuellerTipp, null, "Bewertung schließt den Satz");
  // Textkarten: keine Sprechblase für den Satz des Tages (dort ist er die Karte)
  w.e.darstellung = "karten"; assert.equal(w.satzDesTages(ohne), false);
});
