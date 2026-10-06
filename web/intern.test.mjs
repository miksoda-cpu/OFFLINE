// Interner Kanal (0.6.0, Auftrag 2026-10-05-08, Weg A mit Bills Ergänzungen 1–7) und die Regeln der Naturheilkunde.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import * as werkzeug from "../werkzeug/intern.mjs";
import { schluesselAusLink, kennung, entschluesseln, holeIntern, internKatalog, internPaketDateien, KanalAbgelaufen, kanalZeile } from "./intern.js";
import { alsMittel, istWarnung, beschwerdeErgebnis, findeErgebnis, anwendungErgebnis, naturHtml, suche, mdHtml, STREIFEN, NICHTS_GEPRUEFT, SPERR_MARKEN } from "./natur.js";

const lies = (p) => readFile(new URL(p, import.meta.url), "utf8");
const K = randomBytes(32), KS = K.toString("base64url");

test("Link: Schlüssel nur hinter #kanal= (Fragment), sonst nichts", () => {
  assert.equal(schluesselAusLink(`https://offline-liart.vercel.app/app.html#kanal=${KS}`), KS);
  assert.equal(schluesselAusLink(`#kanal=${KS}`), KS);
  assert.equal(schluesselAusLink(`https://offline-liart.vercel.app/app.html?kanal=${KS}`), null, "nie nach ?");
  assert.equal(schluesselAusLink("#kanal=kurz"), null); assert.equal(schluesselAusLink(""), null); assert.equal(schluesselAusLink("#updates"), null);
});

test("Verschlüsselung: CI (Node) und App (WebCrypto) passen zusammen, Kennung gleich", async () => {
  assert.equal(await kennung(KS), werkzeug.kennung(K));
  const klar = Buffer.from("Hallo Naturheilkunde ✓");
  const zu = werkzeug.verschluesseln(klar, K);
  assert.ok(!zu.includes(klar), "verschlüsselt");
  assert.equal(Buffer.from(await entschluesseln(zu, KS)).toString(), klar.toString());
  assert.equal(werkzeug.entschluesseln(zu, K).toString(), klar.toString());
  await assert.rejects(entschluesseln(zu, randomBytes(32).toString("base64url")), "falscher Schlüssel liest nichts");
  assert.notEqual(werkzeug.kennung(randomBytes(32)), werkzeug.kennung(K), "neuer Schlüssel, neue Kennung");
});

/** Ein Server im Speicher: intern/<kennung>/… wie nach dem Workflow. */
function server(dateien, schluessel = K) {
  const kid = werkzeug.kennung(schluessel), m = new Map();
  for (const [p, b] of Object.entries(dateien)) m.set(`https://x/intern/${kid}/${p}`, werkzeug.verschluesseln(Buffer.from(b), schluessel));
  return async (url) => (m.has(url) ? { ok: true, status: 200, arrayBuffer: async () => m.get(url) } : { ok: false, status: 404 });
}

test("Schlüsselwechsel im Repo: umschlüsseln (alles oder nichts) und auffrischen aus dem Klartext", async () => {
  const { mkdtemp, mkdir, writeFile } = await import("node:fs/promises");
  const os = await import("node:os"), path = await import("node:path");
  const p = await mkdtemp(path.join(os.tmpdir(), "offline-kanal-"));
  await mkdir(path.join(p, "verschluesselt", "quelle"), { recursive: true }); await mkdir(path.join(p, "quelle"));
  await writeFile(path.join(p, "quelle", "a.md"), "Alpha"); await writeFile(path.join(p, "b.json"), "{\"b\":1}");
  await writeFile(path.join(p, "verschluesselt", "quelle", "a.md"), werkzeug.verschluesseln(Buffer.from("alt"), K));
  await writeFile(path.join(p, "verschluesselt", "b.json"), werkzeug.verschluesseln(Buffer.from("alt"), K));
  assert.deepEqual((await werkzeug.auffrischen(p, K)).sort(), ["b.json", "quelle/a.md"]);
  assert.equal(werkzeug.entschluesseln(await readFile(path.join(p, "verschluesselt", "quelle", "a.md")), K).toString(), "Alpha");
  const NEU = randomBytes(32), FALSCH = randomBytes(32);
  await assert.rejects(werkzeug.umschluesseln(path.join(p, "verschluesselt"), FALSCH, NEU), /nichts geändert/);
  assert.equal(werkzeug.entschluesseln(await readFile(path.join(p, "verschluesselt", "b.json")), K).toString(), "{\"b\":1}", "unverändert");
  await werkzeug.umschluesseln(path.join(p, "verschluesselt"), K, NEU);
  await mkdir(path.join(p, "inhalt", "bilder"), { recursive: true }); await writeFile(path.join(p, "inhalt", "bilder", "x.webp"), "BILD");
  assert.deepEqual(await werkzeug.einlagern(p, [path.join(p, "inhalt")], NEU), ["inhalt/bilder/x.webp"]);
  assert.equal(werkzeug.entschluesseln(await readFile(path.join(p, "verschluesselt", "inhalt", "bilder", "x.webp")), NEU).toString(), "BILD");
  await assert.rejects(werkzeug.einlagern(path.join(p, "inhalt"), [path.join(p, "b.json")], NEU), /nicht unter/);
  assert.equal(werkzeug.entschluesseln(await readFile(path.join(p, "verschluesselt", "quelle", "a.md")), NEU).toString(), "Alpha");
  assert.throws(() => werkzeug.entschluesseln(readFileSync(path.join(p, "verschluesselt", "b.json")), K));
  const doku = await lies("../docs/INTERN.md");
  for (const s of ["## Schlüssel wechseln", "umschluesseln", "OFFLINE_INTERN_SCHLUESSEL_ALT", "gh secret set OFFLINE_INTERN_SCHLUESSEL <", "Interner Kanal abgelaufen", "klartext-wache"]) assert.ok(doku.includes(s), s);
});

test("Katalog und Paket aus dem Kanal; Schlüsselwechsel meldet still „abgelaufen“", async () => {
  const katalog = { format: 1, erstellt: "2026-10-05T20:00:00Z", pakete: [{ id: "naturheilkunde", version: "2026.10.05", pfad: "naturheilkunde-2026.10.05/", status: "verfuegbar" }] };
  const manifest = { id: "naturheilkunde", dateien: [{ pfad: "inhalt/naturheilkunde.json" }] };
  const p0 = "pakete/naturheilkunde-2026.10.05/";
  const holen = server({ "katalog/katalog.json": JSON.stringify(katalog), "katalog/katalog.sig": "{}", [`${p0}paket.json`]: JSON.stringify(manifest), [`${p0}paket.sig`]: "{}", [`${p0}inhalt/naturheilkunde.json`]: "{}" });
  const basis = "https://x/intern/";
  const k = await internKatalog({ basis, schluessel: KS, pruefe: async () => ({ ok: true }), holen });
  assert.equal(k.pakete[0].id, "naturheilkunde");
  await assert.rejects(internKatalog({ basis, schluessel: KS, pruefe: async () => ({ ok: false, grund: "Signatur passt nicht" }), holen }), /Signatur passt nicht/);
  await assert.rejects(internKatalog({ basis, schluessel: KS, pruefe: async () => ({ ok: true }), zuletzt: "2026-10-06T00:00:00Z", holen }), /Rollback/);
  const p = await internPaketDateien({ basis, schluessel: KS, eintrag: k.pakete[0], holen });
  assert.deepEqual(p.dateien.map((d) => d.pfad), ["paket.json", "paket.sig", "inhalt/naturheilkunde.json"]);
  // alter Schlüssel nach dem Wechsel: unter seiner Kennung gibt es nichts mehr
  const neu = server({ "katalog/katalog.json": "{}" }, randomBytes(32));
  await assert.rejects(holeIntern({ basis, schluessel: KS, pfad: "katalog/katalog.json", holen: neu }), KanalAbgelaufen);
  await assert.rejects(holeIntern({ basis, schluessel: KS, pfad: "x", holen: async () => { throw new TypeError("offline"); } }), (e) => !(e instanceof KanalAbgelaufen), "ohne Netz ist nicht abgelaufen");
  assert.deepEqual(kanalZeile({ schluessel: KS }), { text: "Interner Kanal: an", entfernen: true });
  assert.deepEqual(kanalZeile({ schluessel: KS, abgelaufen: true }), { text: "Interner Kanal abgelaufen", entfernen: true });
  assert.equal(kanalZeile(null), null, "ohne Kanal keine Zeile");
});

test("Nur intern: nie im öffentlichen Katalog, nie in web/pakete; Freigabe ist eine Zeile", async () => {
  const quelle = JSON.parse(await lies("../pakete/naturheilkunde/paket.quelle.json"));
  assert.equal(quelle.kanal, "intern");
  const yml = await lies("../.github/workflows/inhalte.yml");
  assert.ok(yml.includes(`if grep -qE '"kanal": *"intern"' "$q/paket.quelle.json"; then echo "Intern, nicht öffentlich: $q"; continue; fi`));
  const intern = await lies("../.github/workflows/intern.yml");
  assert.match(intern, /intern\.mjs verschluesseln/);
  assert.doesNotMatch(intern, /s3:\/\/\$BUCKET\/(pakete|katalog)/, "nie in den öffentlichen Ordnern");
  assert.ok(!(await readdir(new URL("./pakete/", import.meta.url))).some((d) => d.startsWith("naturheilkunde")), "keine Web-Kopie");
  assert.doesNotMatch(await lies("./katalog/katalog.json"), /naturheilkunde/);
  for (const d of ["../bill", "../docs", "../pakete/naturheilkunde"]) for (const f of await readdir(new URL(d + "/", import.meta.url), { recursive: true })) {
    if (!/\.(md|json|txt|mjs)$/.test(f)) continue;
    assert.doesNotMatch(await lies(`${d}/${f}`), /#kanal=[A-Za-z0-9_-]{43}/, `kein Freischalt-Link in ${d}/${f}`);
  }
});

test("Schlüssel nur auf dem Gerät: Datenordner bzw. Browser, nie im Tresor, nie in einer Sicherung", async () => {
  const rs = await lies("../app/src-tauri/src/lib.rs"), app = await lies("./app.js");
  assert.match(rs, /z\.datenordner\.join\("intern-kanal\.json"\)/);
  assert.doesNotMatch(rs.slice(rs.indexOf("fn tresor_sichern"), rs.indexOf("fn tresor_zurueckspielen")), /intern/);
  assert.ok(app.includes("history.replaceState(null, \"\", `${location.pathname}${location.search}#updates`)"), "Schlüssel sofort aus der Adresszeile");
  assert.match(await lies("./sw.js"), /url\.pathname\.startsWith\("\/intern\/"\)\)\) return;/);
});

test("Öffentliches Repo: Inhalte der Naturheilkunde nur verschlüsselt, Klartext nie eingecheckt", async () => {
  const ign = await lies("../.gitignore");
  for (const z of ["pakete/naturheilkunde/quelle/", "pakete/naturheilkunde/inhalt/", "pakete/naturheilkunde/unzugeordnet.md"]) assert.ok(ign.split("\n").includes(z), `.gitignore: ${z}`);
  const zu = new URL("../pakete/naturheilkunde/verschluesselt/", import.meta.url);
  const dateien = (await readdir(zu, { recursive: true, withFileTypes: true })).filter((d) => d.isFile());
  assert.ok(dateien.some((d) => d.name === "naturheilkunde.json"), "Paketinhalt verschlüsselt da");
  for (const d of dateien) {
    const b = await readFile(new URL(`${d.parentPath ?? d.path}/${d.name}`.replace(/^/, "file://")));
    assert.ok(!b.includes(Buffer.from("Betula")) && !b.includes(Buffer.from("Schierling")) && !b.includes(Buffer.from("Naturheilkunde-Modul")), `${d.name} ist Klartext`);
  }
  const intern = await lies("../.github/workflows/intern.yml");
  assert.ok(intern.includes(`for v in pakete/*/verschluesselt; do node werkzeug/intern.mjs entschluesseln "$v" "$(dirname "$v")"`), "CI entschlüsselt vor dem Bauen");
});

// ---------- Naturheilkunde ----------
// Inhalt nur verschlüsselt im öffentlichen Repo: ohne Klartext (CI ohne Secret) werden die Inhaltstests übersprungen.
const paket = await lies("../pakete/naturheilkunde/inhalt/naturheilkunde.json").then(JSON.parse).catch(() => null);
const MIT = paket ? {} : { skip: "Inhalt nur verschlüsselt im Repo" };

test("Als Mittel nur suche_und_karte UND fachlich_geprueft; heute nichts", MIT, () => {
  assert.equal(paket.eintraege.filter(alsMittel).length, 0);
  for (const b of paket.beschwerden_index) assert.equal(beschwerdeErgebnis(paket, b.beschwerde).mittel.length, 0, b.beschwerde);
  for (const a of ["tee", "aeusserlich", "kauen"]) assert.equal(anwendungErgebnis(paket, a).mittel.length, 0);
  const html = naturHtml(paket, { weg: "beschwerde", beschwerde: "Husten" });
  assert.ok(html.includes(NICHTS_GEPRUEFT)); assert.match(html, /Warnungen/); assert.match(html, /data-natur-index="beschwerde"/);
  const roh = paket.eintraege.find((e) => !istWarnung(e));
  assert.equal(alsMittel({ ...roh, ort: "suche_und_karte", pruefstatus: "fachlich_geprueft" }), true);
  assert.equal(alsMittel({ ...roh, ort: "handbuch", pruefstatus: "fachlich_geprueft" }), false);
  assert.equal(alsMittel({ ...roh, ort: "suche_und_karte", pruefstatus: "in_pruefung" }), false);
});

test("Psychoaktiv, abtreibend, giftig: nie als Mittel, auch nicht mit gefälschtem Prüfstatus", MIT, () => {
  const markiert = paket.eintraege.filter((e) => (e.marken ?? []).some((m) => SPERR_MARKEN.includes(m)));
  assert.ok(markiert.length > 50);
  for (const e of [...markiert, ...paket.eintraege.filter((x) => x.teil === 1)]) assert.equal(alsMittel({ ...e, ort: "suche_und_karte", pruefstatus: "fachlich_geprueft", belegbarkeit: "belegt" }), false, e.id);
  for (const m of SPERR_MARKEN) assert.equal(alsMittel({ id: "x", teil: 3, ort: "suche_und_karte", pruefstatus: "fachlich_geprueft", belegbarkeit: "belegt", marken: [m] }), false, m);
});

test("„Ich finde …“: giftige Doppelgänger immer zuerst", MIT, () => {
  for (const w of paket.waldfunde_index) {
    const r = findeErgebnis(paket, w.merkmal), html = naturHtml(paket, { weg: "finde", merkmal: w.merkmal });
    if (r.doppelgaenger.length) assert.ok(html.indexOf("Giftige Doppelgänger zuerst") < html.indexOf("Was es sein kann"), w.merkmal);
  }
  assert.ok(paket.waldfunde_index.some((w) => findeErgebnis(paket, w.merkmal).doppelgaenger.length), "es gibt Doppelgänger");
});

test("Gesperrte Zeilen aus Teil 6 nirgends außer im Handbuch; Erste-Hilfe-Karte auf jeder Seite", MIT, () => {
  const gesperrt = [...paket.wechselwirkungen, ...(paket.ausfall ?? [])].filter((w) => w.gesperrt);
  assert.ok(gesperrt.length >= 1);
  const seiten = [{ weg: "start" }, { weg: "anwendung" }, { weg: "finde" }, { weg: "beschwerde" }, { weg: "handbuch" },
    ...paket.beschwerden_index.flatMap((b) => [{ weg: "beschwerde", beschwerde: b.beschwerde }, ...b.mit.map((m) => ({ weg: "beschwerde", beschwerde: b.beschwerde, mit: m }))]),
    ...paket.waldfunde_index.map((w) => ({ weg: "finde", merkmal: w.merkmal })), ...["tee", "aeusserlich", "kauen"].map((a) => ({ weg: "anwendung", anwendung: a }))];
  for (const z of seiten) {
    const html = naturHtml(paket, z);
    for (const g of gesperrt) for (const zelle of g.text.split("|").map((c) => c.trim()).filter((c) => c.length > 25)) assert.ok(!html.includes(mdHtml(zelle).replace(/^<p>|<\/p>$/g, "")), `${JSON.stringify(z)} zeigt gesperrte Zeile ${g.id}`);
    assert.match(html, /class="card of-karte natur-erste-hilfe"/, JSON.stringify(z));
    assert.match(html, /Kein Erbrechen auslösen/, "die Schritte stehen immer da (aufklappbar)");
    assert.match(html, /href="tel:\+4314064343"/); assert.match(html, /href="tel:144"/);
    assert.ok(html.includes(STREIFEN));
  }
  const t6 = paket.kapitel.filter((k) => k.teil === 6).map((k) => k.text).join("\n");
  for (const g of gesperrt) assert.ok(t6.includes(g.text.trim()), `${g.id} steht im Handbuch`);
  for (const z of [{ weg: "eintrag", eintrag: paket.eintraege[0].id }, { weg: "kapitel", kapitel: paket.kapitel[0].id }, { weg: "handbuch", teil: 6 }, { weg: "handbuch", q: "Eibe" }]) assert.match(naturHtml(paket, z), /natur-erste-hilfe[\s\S]*01 406 43 43[\s\S]*144/);
});

test("Handbuch: Volltextsuche ohne Netz, Markdown mit Tabellen sicher", MIT, () => {
  assert.ok(suche(paket, "Eibe").length > 0);
  assert.deepEqual(suche(paket, "x"), []);
  const h = mdHtml("| A | B |\n|---|---|\n| **x** | <script> |\n\n- eins\n- zwei");
  assert.ok(h.includes("<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td><strong>x</strong></td><td>&lt;script&gt;</td></tr></tbody></table>"));
  assert.ok(h.includes("<ul><li>eins</li><li>zwei</li></ul>"));
});

test("Menü nur mit installiertem Paket", async () => {
  const app = await lies("./app.js");
  assert.ok(app.includes("if (naturPaket() && !da)")); assert.ok(app.includes("if (!naturPaket() && da) da.remove();"));
  assert.ok(app.includes('route !== "natur" || naturDaten()'));
  assert.doesNotMatch(app.match(/const ROUTEN = \[[\s\S]*?\];/)[0], /natur/, "nicht in der festen Liste");
});

test("0.6.3: Desktop-Weg des Kanals – alles, was paket-client-tauri.js selbst aufruft, ist auch importiert", async () => {
  const t = await lies("./paket-client-tauri.js");
  const durch = [...t.matchAll(/^export \{([^}]+)\} from/gm)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]));
  const importiert = new Set([...t.matchAll(/^import \{([^}]+)\} from/gm)].flatMap((m) => m[1].split(",").map((s) => s.trim().split(/\s+as\s+/).at(-1))));
  const ohneExport = t.split("\n").filter((z) => !/^export \{/.test(z)).join("\n");
  for (const n of durch) if (new RegExp(`\\b${n}\\s*[(.]`).test(ohneExport)) assert.ok(importiert.has(n), `${n} wird benutzt, aber nur durchgereicht`);
  assert.ok(importiert.has("sha256Hex"));
});

test("0.6.3: installiereAusDateien der Mac-App prüft die Manifest-Prüfsumme und gibt alles an den Kern", async () => {
  const aufrufe = [];
  globalThis.window = { __TAURI__: { core: { invoke: async (b, a) => { aufrufe.push([b, a]); return b === "installierte" ? [] : null; } } } };
  const tauri = await import("./paket-client-tauri.js?test-0-6-3");
  const manifest = new TextEncoder().encode(JSON.stringify({ id: "x", version: "1" }));
  const { createHash } = await import("node:crypto");
  const eintrag = { id: "x", sha256_manifest: createHash("sha256").update(manifest).digest("hex") };
  const dateien = [{ pfad: "paket.json", bytes: manifest }, { pfad: "paket.sig", bytes: new TextEncoder().encode("{}") }, { pfad: "inhalt/a.json", bytes: new TextEncoder().encode("[]") }];
  await tauri.installiereAusDateien(eintrag, dateien);
  const e = aufrufe.find(([b]) => b === "einspielen_bytes");
  assert.deepEqual(e[1].dateien.map((d) => [d.pfad, Buffer.from(d.daten, "base64").toString()]), [["paket.json", '{"id":"x","version":"1"}'], ["paket.sig", "{}"], ["inhalt/a.json", "[]"]]);
  await assert.rejects(tauri.installiereAusDateien({ ...eintrag, sha256_manifest: "0".repeat(64) }, dateien), /Prüfsumme/);
  delete globalThis.window;
});

test("0.6.3: Die Lumi schweigt auf den Leseseiten (Lumi-Buch, Was die Lumis denken), auch ein offener Satz geht", async () => {
  const { STILL } = await import("./wesen.js");
  for (const s of ["notfall", "natur", "buch", "absatz", "gedanken", "gedanke"]) assert.ok(STILL.includes(s), s);
  const w = await lies("./wesen.js");
  assert.ok(w.includes('if (STILL.includes(name)) { const toast = document.getElementById("wesen-toast"); if (toast) { toast.remove();'));
  assert.match(await lies("./styles.css"), /\.upd-version \{[^}]*touch-action: manipulation/, "siebenmal Tippen ohne Doppeltipp-Zoom");
});
