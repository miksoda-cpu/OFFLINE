// Nr. 24 (Abschnitt A; Mik 14.10.2026): Die Österreich-Basis aktualisiert sich still beim Start, und unter „Bald“ stehen
// Wikipedia, Wikivoyage, die Karte und die Lumi als Vorschau mit Bildern und einem Satz, nicht ladbar.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { abschnitte, stilleUpdates } from "./pakete.js";
import { BALD, NICHT_LADBAR, baldEintrag } from "./bald.js";
import { versionVergleich } from "./paket-kern.js";

const url = (p) => new URL(p, import.meta.url);
const lies = (p) => readFile(url(p), "utf8");
const inst = (id, version, extra = {}) => ({ manifest: { id, version, titel: id, ...extra } });

test("A1: Eine neuere Österreich-Basis im Katalog wird beim Start ohne Knopfdruck geladen", async () => {
  const k = { pakete: [
    { id: "at-basis", status: "verfuegbar", version: "2026.10.08", app_min: "0.8.0" },
    { id: "tage-2026-10", art: "tage", status: "verfuegbar", version: "2026.10.09" },
    { id: "pause", status: "verfuegbar", version: "2026.10.09" },
  ] };
  const passt = () => true;
  assert.deepEqual(stilleUpdates(k, [inst("at-basis", "2026.09.29.1")], { versionVergleich, appPasst: passt }).map((e) => e.version), ["2026.10.08"]);
  assert.deepEqual(stilleUpdates(k, [inst("at-basis", "2026.10.08")], { versionVergleich, appPasst: passt }), [], "gleiche Ausgabe: nichts");
  assert.deepEqual(stilleUpdates(k, [inst("at-basis", "2026.09.29.1")], { versionVergleich, appPasst: () => false }), [], "zu alte App: nichts");
  assert.deepEqual(stilleUpdates(k, [inst("tage-2026-10", "2026.10.04", { art: "tage" }), inst("pause", "2026.10.08")], { versionVergleich, appPasst: passt }), [], "Tage füllt die Vorratskammer, Pause ist keine Pflicht");

  const app = await lies("./app.js");
  const start = app.slice(app.indexOf("})().finally(async () => {"));
  assert.ok(start.indexOf("await basisStillAktualisieren();") >= 0 && start.indexOf("await basisStillAktualisieren();") < start.indexOf("vorratAuffuellen();"), "beim Start, vor der Vorratskammer");
  const fn = app.slice(app.indexOf("async function basisStillAktualisieren()"), app.indexOf("// Erster Start: Österreich-Paket automatisch holen"));
  assert.ok(fn.includes("stilleUpdates(k, [P()], { versionVergleich, appPasst })") && fn.includes("await installiere(k, e)"), "lädt ohne Knopf");
  assert.ok(!fn.includes("abo"), "unabhängig vom Abo, wie die Tage");
  assert.ok(app.includes("Die neue kommt von selbst; deine Häkchen bleiben und werden übernommen.") && app.includes("Klappt das nicht, hier von Hand laden:"), "Knopf nur als Notlösung");
});

test("Bald: genau Wikipedia, Wikivoyage, Karte und Lumi, je mit Bildern und einem Satz", async () => {
  assert.deepEqual(BALD.map((b) => b.titel), ["Wikipedia Deutsch", "Wikivoyage Deutsch", "Karte Österreich", "Das Lumi-Update", "Tresor"], "Tresor seit Nr. 28");
  for (const b of BALD) {
    assert.ok(b.beschreibung.length > 30 && b.beschreibung.split(/[.!?](\s|$)/).filter((x) => x?.trim()).length === 1, `${b.id}: ein Satz`);
    assert.ok(b.folien.length >= 2, `${b.id}: Bilder`);
    for (const f of b.folien) {
      assert.ok(f.titel && f.text && f.alt, `${b.id}: Titel, Text, Alternativtext`);
      assert.ok(existsSync(url(`./${f.bild}`)), f.bild);
      const svg = await lies(`./${f.bild}`);
      assert.ok(svg.startsWith("<svg") && !/<script|<image|href=/.test(svg), `${f.bild}: schlicht, nichts von außen`);
      assert.match(await lies("./sw.js"), new RegExp(`"/${f.bild}"`), `${f.bild}: auch offline da`);
    }
  }
  assert.match(await lies("./sw.js"), /"\/bald\.js"/);
  assert.deepEqual([...NICHT_LADBAR].sort(), ["karte-at", "lumi-buch", "lumi-philosophie", "lumisch", "wiki-de-maxi", "wiki-de-mini", "wiki-de-nopic", "wikivoyage-de", "wir"]);
});

test("Bald: nicht ladbar – nicht unter „Neu“, kein Knopf, nicht still; wer es hat, behält es", async () => {
  const k = { pakete: [
    { id: "at-basis", titel: "Österreich", status: "verfuegbar", version: "2026.10.08" },
    { id: "wikivoyage-de", titel: "Wikivoyage Deutsch", art: "zim", status: "verfuegbar", version: "2026.09.24" },
    { id: "lumi-buch", titel: "Das Lumi-Buch", status: "verfuegbar", version: "2026.10.05.2" },
    { id: "lumisch", titel: "Lumisch", status: "verfuegbar", version: "2026.10.07.1" },
    { id: "lumi-philosophie", titel: "Was die Lumis denken", status: "verfuegbar", version: "2026.10.06.1" },
    { id: "spiele-1", titel: "Rätsel", art: "modul", status: "verfuegbar", version: "2026.10.07.1" },
    { id: "wiki-de-mini", titel: "Wikipedia kompakt", art: "zim", status: "geplant" },
    { id: "ris-bund", titel: "RIS", status: "geplant" },
  ] };
  const frisch = abschnitte(k, [], { versionVergleich, bald: BALD, nichtLadbar: NICHT_LADBAR });
  assert.deepEqual(frisch.neu.map((p) => p.id).sort(), ["at-basis", "spiele-1"]);
  assert.deepEqual(frisch.bald.map((b) => b.id), ["bald-wikipedia", "bald-wikivoyage", "bald-karte", "bald-lumi", "bald-tresor"], "in Miks Reihenfolge");
  const alt = abschnitte(k, [inst("lumi-buch", "2026.10.05.2"), inst("lumisch", "2026.10.07.1"), inst("lumi-philosophie", "2026.10.06.1"), inst("wir", "2026.10.04.4"), inst("wikivoyage-de", "2026.09.24")], { versionVergleich, bald: BALD, nichtLadbar: NICHT_LADBAR });
  assert.deepEqual(alt.geraet.map((g) => g.eintrag.id).sort(), ["lumi-buch", "lumi-philosophie", "lumisch", "wikivoyage-de", "wir"], "bleibt auf dem Gerät");
  assert.deepEqual(alt.bald.map((b) => b.id), ["bald-wikipedia", "bald-karte", "bald-tresor"], "alles schon da: keine Ankündigung (der Tresor hängt an keinem Paket)");
  assert.deepEqual(abschnitte(k, []).bald.map((p) => p.id).sort(), ["ris-bund", "wiki-de-mini"], "ohne Liste wie bisher");

  const app = await lies("./app.js");
  assert.ok(app.includes('ladenAbschnitte(k, inst, { versionVergleich, bald: BALD.filter((b) => b.nurOhne !== "tresor" || !tresorBenutzt()), nichtLadbar: NICHT_LADBAR })') && app.includes("bald.map(baldKarte)"));
  const karte = app.slice(app.indexOf("function baldKarte(b)"), app.indexOf("/** Lokale Quelle"));
  assert.ok(karte.includes("vorschauTitelHtml(`bald:${b.id}`, b)") && !/data-install|schieber\(/.test(karte), "Vorschau, kein Laden");
  assert.ok(app.includes('if (NICHT_LADBAR.has(id) && !installiertesPaket(id)) {'), "auch über einen anderen Knopf nicht");
  assert.ok(app.includes('if (baldEintrag(id)) return `<p class="muted of-klein">Kommt mit einem späteren Update. Noch nicht zum Laden.</p>`;'), "Vorschaufenster ohne „laden“");
  assert.ok(app.includes('for (const id of [BASISPAKET, HEILKUNDE_PAKET, ...(wesen.nurVorschau ? [] : ["wir"])]) {'), "Erststart ohne Lumi-Buch, ohne Namen auch ohne Tipps (Nr. 27), mit Naturheilkunde (Nr. 28)");
  assert.ok(app.includes('if (!PB() && !NICHT_LADBAR.has("lumi-buch") && navigator.onLine)') && app.includes('!speicher.get("lumisch-geholt", false) && !NICHT_LADBAR.has("lumisch") && navigator.onLine'), "nichts still nachladen");
  assert.equal(baldEintrag("bald-karte").titel, "Karte Österreich");
});
