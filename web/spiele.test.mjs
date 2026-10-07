// Spielpaket 1 (Auftrag 2026-10-07-14): Rätsel aus einem Modul als Happen-Formen in Pause. Der Browser-Teil (zwei Geräte,
// dasselbe Rätsel; ohne WebAssembly-Freigabe startet keins) läuft in werkzeug/spiele-probe.mjs gegen den echten Modulserver.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { modulFormen, spielNummerHeute, stufeVon, linieLaden, raumFormen, zoneAnpassen, logDazu, dauerText, einladungFaellig } from "./pause.js";
import { modulHappen } from "./pause-happen.js";
import { pruefeSpielMeldung } from "./modul-host.js";
import { manifestPruefenStruktur } from "./paket-kern.js";
import { pauseFormenFehler } from "../paket-kit/pause-format.mjs";

const url = (p) => new URL(p, import.meta.url);
const FORMEN = url("../pakete/spiele-1/inhalt/pause-formen.json");
const MIT_TEXT = existsSync(FORMEN) ? {} : { skip: "Formen des Spielpakets nur verschlüsselt im Repo" };
const SPIELE = ["lichter", "netz", "muster", "bruecken", "minen", "sudoku", "2048"];

const beispiel = { format: 1, formen: [
  { id: "lichter", spiel: "lichter", titel: "Lichter", einladung: "Ein Satz.", gruppe: "raetsel", art: ["beweglichkeit"], dauer: { von: 90, bis: 420 }, alter: ["J", "M1", "M2", "A"], tageszeit: "jederzeit", zone: { stufen: 3, start: 2 }, beim: "bei den Lichtern", ende: { geloest: "Gelöst.", offen: "Morgen wieder." } },
  { id: "pilz", spiel: "pilz", titel: "Doppelt", einladung: "x", gruppe: "spiel", art: ["tempo"], dauer: { von: 60, bis: 60 }, alter: ["J"], tageszeit: "jederzeit", zone: { stufen: 3, start: 2 }, ende: { geloest: "a", offen: "b" } },
  { id: "kaputt", titel: "ohne Spiel" },
] };

test("Formen aus dem Modul: vollständige werden zu Pause-Formen mit modul: { id, spiel }, doppelte und kaputte fallen weg", () => {
  const f = modulFormen("spiele-1", beispiel, ["pilz", "fehler"]);
  assert.deepEqual(f.map((x) => x.id), ["lichter"]);
  assert.deepEqual(f[0].modul, { id: "spiele-1", spiel: "lichter" });
  assert.equal(stufeVon(linieLaden(null), f[0]), 2, "ab 14 Stufe 2");
  assert.equal(dauerText(f[0]), "vier Minuten");
  assert.deepEqual(modulFormen("x", null), []);
  // Im Raum erscheinen sie wie die anderen Formen
  const raum = raumFormen({ formen: f, einstellungen: { an: true, alter: "M1" }, jetzt: Date.parse("2026-10-07T10:00:00"), kontext: {}, log: [], heute: "2026-10-07" });
  assert.equal(raum[0].geht, true);
});

test("Das wievielte Spiel heute: das erste ist das Rätsel des Tages, Abgebrochenes zählt nicht", () => {
  const t = (h) => Date.parse(`2026-10-07T${h}:00:00`);
  let log = [];
  assert.equal(spielNummerHeute(log, "lichter", "2026-10-07"), 1);
  log = logDazu(log, { quelle: "pause", id: "lichter", art: [], ergebnis: { treffer: 1, von: 1 }, dauer: 100 }, t("09"));
  log = logDazu(log, { quelle: "pause", id: "lichter", art: [], ergebnis: {}, dauer: 5, abgebrochen: true }, t("10"));
  log = logDazu(log, { quelle: "modul:spiele-1", id: "lichter", art: [], ergebnis: {}, dauer: 5 }, t("10"));
  assert.equal(spielNummerHeute(log, "lichter", "2026-10-07"), 2);
  assert.equal(spielNummerHeute(log, "lichter", "2026-10-08"), 1, "jeden Tag neu");
});

test("Der Happen eines Modulspiels: Stufe an das Modul, Ende aus dem Paket, Treffer für die Zone", async () => {
  const form = modulFormen("spiele-1", beispiel)[0];
  const platz = {}, el = { set innerHTML(v) { this.html = v; }, querySelector: () => platz };
  let gefragt = null;
  const geloest = await modulHappen(el, { form, linie: linieLaden({ stufe: { lichter: 3 } }), starten: async (p, stufe) => { gefragt = { p, stufe }; return { id: "lichter", ergebnis: { geloest: true } }; } });
  assert.deepEqual(gefragt, { p: platz, stufe: 3 });
  assert.equal(geloest.satz, "Gelöst.");
  assert.deepEqual(geloest.ergebnis, { treffer: 1, von: 1, stufe: 3, geloest: true });
  const offen = await modulHappen(el, { form, linie: linieLaden(null), starten: async () => ({ ergebnis: { geloest: false } }) });
  assert.equal(offen.satz, "Morgen wieder.");
  assert.equal(offen.treffer, 0);
  assert.equal((await modulHappen(el, { form, linie: linieLaden(null), starten: async () => null })).treffer, 0, "ließ sich nicht öffnen");
  // 0.7.1: fünfmal gelöst → Einladung zum Höherstellen (nie still hinauf), wie bei den anderen Formen
  let log = [];
  for (let i = 0; i < 5; i++) log = logDazu(log, { quelle: "pause", id: "lichter", art: form.art, ergebnis: geloest.ergebnis, dauer: 100 });
  assert.equal(zoneAnpassen(linieLaden({ stufe: { lichter: 2 } }), form, log).stufe.lichter, 2);
  assert.equal(einladungFaellig(linieLaden({ stufe: { lichter: 2 } }), form, log, Date.now()), true);
});

test("Die Meldung des Moduls kommt durch die Prüfung der Brücke (ohne Punkte, nichts zum Vergleichen)", () => {
  const m = { id: "2048", art: ["beweglichkeit"], ergebnis: { treffer: 1, von: 1, stufe: 2, geloest: true }, dauer: 300 };
  assert.equal(pruefeSpielMeldung(m).ok, true);
  for (const s of SPIELE) assert.equal(pruefeSpielMeldung({ ...m, id: s }).ok, true, s);
});

test("Manifest: bereich und wasm nur bei Modulen, bereich nur „pause“, beides ab App 0.6.5", () => {
  const basis = { format: 1, id: "spiele-1", version: "2026.10.07", titel: "t", beschreibung: "b", art: "modul", sprache: "de-AT", lizenz: "MIT", herausgeber: "h", pro: false,
    pruefstatus: "redaktion", datenversion: 1, app_min: "0.6.5", erstellt: "2026-10-07T00:00:00Z", quellen: [{ name: "q", url: "" }], dateien: [{ pfad: "inhalt/modul/index.html", groesse: 1, sha256: "a".repeat(64) }], groesse: 1 };
  assert.deepEqual(manifestPruefenStruktur({ ...basis, bereich: "pause", wasm: true }), []);
  assert.match(manifestPruefenStruktur({ ...basis, bereich: "notfall" }).join(), /bereich ungültig/);
  assert.match(manifestPruefenStruktur({ ...basis, wasm: "ja" }).join(), /wasm: true oder false/);
  assert.match(manifestPruefenStruktur({ ...basis, wasm: true, app_min: "0.6.4" }).join(), /0\.6\.5/);
  assert.match(manifestPruefenStruktur({ ...basis, art: "inhalt", wasm: true, pruefstatus: undefined, datenversion: undefined, dateien: [{ pfad: "inhalt/a.json", groesse: 1, sha256: "a".repeat(64) }] }).join(), /nur bei Modulen/);
});

test("Schlüssel: nur der Redaktionsschlüssel darf WebAssembly freigeben (Zweck „wasm“), kein Katalogschlüssel", async () => {
  const s = JSON.parse(await readFile(url("../schluessel/oeffentlich.json"), "utf8")).schluessel;
  const wasm = s.filter((k) => k.zweck.includes("wasm"));
  assert.deepEqual(wasm.map((k) => k.id), ["d9b62d1755ba3744"]);
  assert.ok(wasm.every((k) => k.zweck.includes("module") && !k.zweck.includes("katalog") && !k.zweck.includes("pakete")));
  assert.deepEqual(JSON.parse(await readFile(url("./schluessel/oeffentlich.json"), "utf8")), JSON.parse(await readFile(url("../schluessel/oeffentlich.json"), "utf8")), "Kopie im Web gleich");
});

test("Das Formular der Formen im Paket: alle sieben Spiele, jedes mit Stufen und Ende", MIT_TEXT, async () => {
  const j = JSON.parse(await readFile(FORMEN, "utf8"));
  assert.deepEqual(pauseFormenFehler(j), []);
  assert.deepEqual(j.formen.map((f) => f.spiel), SPIELE);
  for (const f of j.formen) assert.deepEqual(f.zone, { stufen: 3, start: 2 }, f.id);
  assert.ok(!/training/i.test(JSON.stringify(j)), "das Wort kommt nicht vor");
  assert.match(pauseFormenFehler({ format: 1, formen: [{ ...j.formen[0], id: "pilz" }] }).join(), /schon eine Form der App/);
});

test("Das Modul: jedes Spiel aus den Formen gibt es, Stufen je drei, keine Töne, nichts gespeichert", async () => {
  const js = await readFile(url("../pakete/spiele-1/inhalt/modul/spiel.js"), "utf8");
  for (const s of SPIELE) assert.match(js, new RegExp(`${/^\d/.test(s) ? `"${s}"` : s}: \\{ titel`), s);
  assert.equal((js.match(/stufen: \[/g) ?? []).length, 6, "sechs Tatham-Rätsel mit drei Stufen");
  assert.match(js, /ziel: \[512, 1024, 2048\]/);
  assert.ok(!/Audio|AudioContext|\.play\(|localStorage|training/i.test(js), "keine Töne, kein Browser-Speicher");
  assert.match(js, /getBestScore = function \(\) \{ return 0; \}/, "kein Bestwert");
  for (const s of ["lightup", "net", "pattern", "bridges", "mines", "solo"]) {
    const t = await readFile(url(`../pakete/spiele-1/inhalt/modul/tatham/${s}.js`), "utf8");
    assert.ok(t.includes("offlineKeinNetz(") && !/\bfetch\s*\(/.test(t) && t.includes("game_status"), s);
  }
});

test("Nachtrag 0.6.6 (Bill zu 0.6.5): langer Druck bei Minen, Name und Anleitung ohne App-Rahmen, gleich der Einladung", MIT_TEXT, async () => {
  const js = await readFile(url("../pakete/spiele-1/inhalt/modul/spiel.js"), "utf8");
  assert.match(js, /taste: "Fahne setzen", langerDruck: true/);
  assert.match(js, /if \(s\.langerDruck\) langerDruck\(\$\("puzzlecanvas"\)\)/);
  assert.match(js, /var LANG = 450;/);
  assert.match(js, /if \(!imHappen\) \{ \$\("titel"\)\.textContent = s\.titel; \$\("regel"\)\.textContent = s\.regel;/);
  const formen = JSON.parse(await readFile(FORMEN, "utf8")).formen;
  for (const f of formen) assert.ok(js.includes(`titel: "${f.titel}", regel: ${JSON.stringify(f.einladung)}`), `${f.id}: Name und Anleitung wie in Pause`);
  const app = await readFile(url("./app.js"), "utf8");
  assert.match(app, /manifest\.bereich === "pause" \? `#f=\$\{encodeURIComponent\(JSON\.stringify\(spielFarben\(\)\)\)\}`/, "Farben auch aus der Bibliothek");
  assert.ok(app.includes("Simon Tatham's Portable Puzzle Collection, angepasst für OFFLINE."));
});

test("Einbau in die App: Modulformen in Pause, Lumi still, Rahmen zu beim Verlassen, Lizenzen unter Über", async () => {
  const app = await readFile(url("./app.js"), "utf8");
  for (const s of ['p.manifest.bereich === "pause"', 'texte(m, "inhalt/pause-formen.json")', "if (form.modul) return modulHappen(", "pauseModulZu();",
    "wesenSagen: async () => {}, // im Happen", "spielNummerHeute(spielLog(), form.id, heute)", "Simon Tatham's Portable Puzzle Collection", "Copyright (c) 2014 Gabriele Cirulli"]) assert.ok(app.includes(s), s);
  // nur in der Desktop-App (der Web-Prototyp nimmt keine Module an)
  assert.match(app, /const pauseModule = \(\) => \(desktop \?/);
});
