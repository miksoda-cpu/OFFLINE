// Teil B (0.7.0): Lumi-Seite, Bibliothek als Laden, Bereich statt Kategorie, „immer an“, Lumisch als eigenes Paket.
// Probe „Lumi-Seite und Bibliothek als Laden“ (von Mik freigegeben), Fragen entschieden von Bill am 07.10.2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { BEREICHE, BEREICH_BISHER, bereichVon, pflicht, paketAn, umschalten, abschnitte } from "./pakete.js";
import { BEREICHE as KERN_BEREICHE, versionVergleich, manifestPruefenStruktur } from "./paket-kern.js";
import { lumischFehler } from "../paket-kit/pause-format.mjs";

const url = (p) => new URL(p, import.meta.url);
const lies = (p) => readFile(url(p), "utf8");
const json = async (p) => JSON.parse(await lies(p));

test("Bereiche: dieselbe Liste in App, Werkzeug, Kit und Kern", async () => {
  const liste = Object.keys(BEREICHE);
  assert.deepEqual(KERN_BEREICHE, liste);
  assert.deepEqual((await import("../werkzeug/kern.mjs")).BEREICHE, liste);
  assert.ok((await lies("../paket-kit/pruefen.mjs")).includes(`const BEREICHE = ${JSON.stringify(liste).replace(/,/g, ", ")};`));
  assert.ok((await lies("../kern/src/manifest.rs")).includes(`pub const BEREICHE: [&str; ${liste.length}] = [${liste.map((b) => `"${b}"`).join(", ")}];`));
});

test("Jedes Paket hat seinen Bereich: Quellen mit bereich statt kategorie (außer Tage), alte Ausgaben über die Zuordnung", async () => {
  for (const id of await readdir(url("../pakete/"))) {
    const f = url(`../pakete/${id}/paket.quelle.json`);
    if (!existsSync(f)) continue;
    const q = JSON.parse(await readFile(f, "utf8"));
    assert.equal(q.kategorie, undefined, `${id}: keine kategorie mehr`);
    if (q.art === "tage") { assert.equal(q.bereich, undefined, `${id}: Tage sind immer „heute“`); assert.equal(bereichVon(q), "heute"); continue; }
    assert.ok(q.bereich in BEREICHE, `${id}: bereich`);
    assert.ok(versionVergleich(q.app_min, q.art === "modul" && q.bereich === "pause" ? "0.6.5" : "0.7.0") >= 0, `${id}: app_min passt zum Feld bereich`);
    assert.equal(bereichVon({ id: q.id, art: q.art }), q.bereich, `${id}: die App ordnet die alte Ausgabe gleich ein`);
  }
  // der Katalog im Web (veröffentlichte Ausgaben ohne bereich): jeder Eintrag landet in einem bekannten Bereich
  for (const p of (await json("./katalog/katalog.json")).pakete) assert.ok(bereichVon(p) in BEREICHE, p.id);
  assert.equal(bereichVon({ id: "wichteln", art: "modul" }), "miteinander");
  assert.equal(BEREICH_BISHER["at-basis"], "ernstfall");
});

test("Manifest: bereich für alle Pakete ab app_min 0.7.0 (Module in Pause ab 0.6.5), pflicht als ja/nein", () => {
  const m = { format: 1, id: "xy", version: "2026.10.07", titel: "t", beschreibung: "b", art: "inhalt", sprache: "de-AT", lizenz: "l", herausgeber: "h", pro: false, app_min: "0.7.0", erstellt: "2026-10-07T00:00:00Z", quellen: [{ name: "q" }], dateien: [{ pfad: "inhalt/a.json", groesse: 1, sha256: "a".repeat(64) }], groesse: 1 };
  assert.deepEqual(manifestPruefenStruktur({ ...m, bereich: "lumi", pflicht: true }), []);
  assert.match(manifestPruefenStruktur({ ...m, bereich: "lumi", app_min: "0.6.5" }).join(), /0\.7\.0/);
  assert.match(manifestPruefenStruktur({ ...m, bereich: "jeden-tag" }).join(), /bereich ungültig/);
  assert.match(manifestPruefenStruktur({ ...m, pflicht: "ja" }).join(), /pflicht/);
  assert.match(manifestPruefenStruktur({ ...m, wasm: true }).join(), /wasm gibt es nur bei Modulen/);
});

test("„Immer an“ und an/aus: Pflichtpakete lassen sich nicht ausschalten, Module über den Kern, sonst die Liste am Gerät", () => {
  assert.ok(pflicht({ id: "at-basis", art: "inhalt" }) && pflicht({ id: "tage-2026-11", art: "tage" }) && pflicht({ id: "x", pflicht: true }));
  assert.ok(!pflicht({ id: "wir", art: "inhalt" }));
  const wir = { manifest: { id: "wir", art: "inhalt" } }, basis = { manifest: { id: "at-basis", art: "inhalt" } }, spiele = { manifest: { id: "spiele-1", art: "modul" } };
  let aus = umschalten([], wir);
  assert.deepEqual(aus, ["wir"]); assert.equal(paketAn(wir, { aus }), false);
  assert.deepEqual(umschalten(aus, wir), [], "wieder an");
  assert.deepEqual(umschalten([], basis), [], "Pflicht bleibt an");
  assert.equal(paketAn(basis, { aus: ["at-basis"] }), true);
  assert.equal(paketAn(spiele, { modulStand: { "spiele-1": { aktiv: false } } }), false);
  assert.equal(paketAn(spiele, {}), true, "neu geladene Module sind an");
});

test("Laden: Neu, Bald (nur Angekündigtes, nie Internes), Auf deinem Gerät mit Update", () => {
  const k = { pakete: [
    { id: "wir", titel: "Wir", art: "inhalt", status: "verfuegbar", version: "2026.10.05" },
    { id: "lumisch", titel: "Lumisch", art: "inhalt", status: "verfuegbar", version: "2026.10.07", bereich: "lumi" },
    { id: "karte-at", titel: "Karte", art: "karte", status: "geplant" },
    { id: "geheim", titel: "Geheim", art: "inhalt", status: "geplant", kanal: "intern" },
    { id: "naturheilkunde", titel: "Intern", art: "inhalt", status: "verfuegbar", kanal: "intern" },
  ] };
  const a = abschnitte(k, [{ manifest: { id: "wir", titel: "Wir", art: "inhalt", version: "2026.10.04" } }], { versionVergleich });
  assert.deepEqual(a.neu.map((p) => p.id), ["lumisch"]);
  assert.deepEqual(a.bald.map((p) => p.id), ["karte-at"]);
  assert.deepEqual(a.geraet.map((g) => [g.eintrag.id, g.update]), [["wir", true]]);
});

test("Lumisch: eigenes Paket im Bereich Lumi, wortgleich mit dem Stand in pause.json, Format geprüft", async () => {
  const l = await json("../pakete/lumisch/inhalt/lumisch.json"), p = (await json("../pakete/pause/inhalt/pause.json")).lumisch;
  assert.deepEqual(lumischFehler(l), []);
  for (const k of ["plan", "woerter", "woerterbuch", "hinweis"]) assert.deepEqual(l[k], p[k], k);
  const q = await json("../pakete/lumisch/paket.quelle.json");
  assert.equal(q.bereich, "lumi"); assert.equal(q.app_min, "0.7.0"); assert.equal(q.art, "inhalt");
});

test("App: Lumi-Seite unter „Mehr“ (kein Tab), Kästchen, Menü, Heute mit kleiner Figur, Übersicht ohne Lumi-Abschnitt", async () => {
  const app = await lies("./app.js"), wesen = await lies("./wesen.js"), sw = await lies("./sw.js");
  assert.match(app, /\["lumi", "Lumi"\]/);
  assert.match(app, /const TABS = \["start", "pause", "notfall", "vorsorge"\];/, "Vorsorge bleibt Tab, Lumi kein Tab");
  assert.match(app, /\n  lumi\(\) \{ return lumiSeiteHtml\(\); \},/);
  assert.ok(app.includes('[["uebersicht", "Übersicht"], ["gesagt", "Alles Gesagte"], ["gelernt", "Gelernt"], ["einstellungen", "Einstellungen"], ["hilfe", "Hilfe"]]'));
  for (const t of ['titel: "Tipps"', 'titel: "Das Lumi-Buch"', 'titel: "Was die Lumis denken"', 'titel: "Lumisch"', 'titel: "Heft"', 'titel: "Vorhaben", zeile: `${offen} offen`, ziel: "#vorsorge"']) assert.ok(app.includes(t), t);
  assert.ok(app.includes("Mehr für die Lumi in der Bibliothek"));
  assert.ok(app.includes("wesen.buehneHtml({ klein: true })") && app.includes('wesen.einbauen({ tippen: () => { location.hash = "#lumi"; } })'), "Heute: klein, Tipp öffnet die Lumi-Seite");
  assert.match(wesen, /buehneHtml\(\{ klein = false \} = \{\}\)/);
  assert.ok(!app.includes('id="lumi-log"') && !app.includes('class="card of-karte buch-zeile"'), "Übersicht ohne Log und Buch-Zeile");
  assert.ok(app.includes("const installiertesPaket = (id) => { const p = paketRoh(id); return p && paketAn(p,"), "ausgeschaltete Pakete liest die App nicht");
  assert.ok(app.includes('const lumischDaten = () => inhalt(PL(), "inhalt/lumisch.json");') && app.includes('formen: roh.formen.filter((f) => f.id !== "lumisch" || lumisch)'), "Lumisch-Happen nur mit dem Paket");
  assert.ok(app.includes('!paketRoh("lumisch") && !speicher.get("lumisch-geholt", false)'), "einmal still nachladen");
  assert.ok(app.includes('abschnitt("Neu", "Verfügbar, noch nicht auf deinem Gerät."') && app.includes('abschnitt("Bald", "Angekündigt. Kommt, sobald es fertig ist."') && app.includes('abschnitt("Auf deinem Gerät", "Aus heißt: nicht sichtbar, Daten und Lesestand bleiben. Löschen nimmt alles weg."'));
  assert.ok(app.includes('<span class="laden-immer">immer an</span>'));
  assert.ok(sw.includes('"/pakete.js"'), "Service Worker hält pakete.js offline");
});
