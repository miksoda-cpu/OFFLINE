// node --test web/neuigkeiten.test.mjs – Updates & Abo (Auftrag 2026-10-05-updates-seite, 0.5.2): roter Punkt bei Neuem,
// weg nach dem Ansehen; Reihenfolge der Seite; Hilfetexte; Blatt mit ✕ und Zurück-Taste.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ungesehen, alsGesehen, inhaltsAenderungen, inhalteStart } from "./neuigkeiten.js";
import { HILFE } from "./hilfe.js";
import { webVersionPruefen, versionNeuer, stillPruefenFaellig, webNeuerDa } from "./neuigkeiten.js";

const kat = (pakete) => ({ pakete });
const p = (id, erstellt, aenderungen = "geändert") => ({ id, titel: id, version: erstellt.slice(0, 10), erstellt, aenderungen });

test("Roter Punkt App: erscheint mit neuer Version, weg nach dem Ansehen", () => {
  let s = { appVersion: "0.5.2", neuesGesehen: "0.5.1", katalog: kat([]), inhalteGesehen: "" };
  assert.deepEqual(ungesehen(s), { app: true, inhalte: false, irgendwas: true });
  s = { ...s, ...alsGesehen("app", s) };
  assert.equal(s.neuesGesehen, "0.5.2");
  assert.deepEqual(ungesehen(s), { app: false, inhalte: false, irgendwas: false });
});

test("Roter Punkt Inhalte: erscheint bei einer neueren Paketänderung, weg nach dem Ansehen; Neue bekommen keinen Punkt für Altes", () => {
  const k1 = kat([p("wir", "2026-10-04T21:02:08Z"), p("pause", "2026-10-04T19:22:35Z"), { id: "ohne", erstellt: "2026-10-05T00:00:00Z" }]);
  assert.deepEqual(inhaltsAenderungen(k1).map((x) => x.id), ["wir", "pause"], "neueste zuerst, nur mit Änderungstext");
  let s = { appVersion: "0.5.2", neuesGesehen: "0.5.2", katalog: k1, inhalteGesehen: null };
  assert.equal(ungesehen(s).inhalte, false, "ohne gespeicherten Stand kein Punkt");
  s.inhalteGesehen = inhalteStart(k1);
  assert.equal(ungesehen(s).inhalte, false);
  const k2 = kat([...k1.pakete, p("lumi-buch", "2026-10-05T07:53:10Z")]);
  s = { ...s, katalog: k2 };
  assert.deepEqual(ungesehen(s), { app: false, inhalte: true, irgendwas: true }, "neues Paket: Punkt");
  s = { ...s, ...alsGesehen("inhalte", s) };
  assert.equal(ungesehen(s).inhalte, false, "angesehen: weg");
});

test("Seite: neue Reihenfolge, „Wie oft?“ zugeklappt unter Einstellungen, langer Satz weg, Punkt ohne Zahl", async () => {
  const app = await readFile(new URL("./app.js", import.meta.url), "utf8");
  const seite = app.slice(app.indexOf("  updates() {"), app.indexOf("\n  },\n", app.indexOf("  updates() {")));
  const reihenfolge = ['aria-label="Stand"', 'id="jetzt"', "upd-neu-titel", 'role="tablist"', "data-neu-alle", 'id="upd-einstellungen"', "Wie oft?", "data-offline-pruefen", 'data-hilfe="updates"', 'aria-label="Daten löschen"', "data-loeschen"];
  let i = -1;
  for (const r of reihenfolge) { const j = seite.indexOf(r); assert.ok(j > i, `${r} an der richtigen Stelle`); i = j; }
  assert.match(seite, /<details class="card of-karte upd-einst" id="upd-einstellungen">\s*<summary>/, "Einstellungen zugeklappt");
  assert.doesNotMatch(seite, /So läuft ein Update|signiert mit Schlüssel|Neu in den Paketen/, "Details und der lange Satz sind weg");
  assert.doesNotMatch(app, /neu-punkt[^"]*">\s*\$\{[^}]*length/, "keine Zahl im Punkt");
  for (const r of ["App", "Inhalte"]) assert.ok(seite.includes(`["${r === "App" ? "app" : "inhalte"}", "${r}"`), `Reiter ${r}`);
});

test("Info und Hilfe: die zehn Fragen von Bill und seit 0.5.5 die elfte zur App-Version, kurze Sätze", () => {
  const h = HILFE.updates;
  assert.equal(h.length, 11);
  assert.equal(h[0][0], "Was ist ein Update?"); assert.equal(h.at(-1)[0], "Woher kommen die Daten?");
  for (const [, a] of h) for (const satz of a.split(/(?<=[.!?])\s+/)) assert.ok(satz.split(/\s+/).length <= 20, `kurzer Satz: ${satz}`);
});

test("Blatt: ✕, Escape, Zurück-Taste (popstate) und eigener Bildlauf; Punkt am Menüpunkt", async () => {
  const b = await readFile(new URL("./blatt.js", import.meta.url), "utf8"), css = await readFile(new URL("./styles.css", import.meta.url), "utf8");
  assert.match(b, /aria-label="Schließen"/); assert.match(b, /history\.pushState/); assert.match(b, /addEventListener\("popstate"/); assert.match(b, /Escape/);
  assert.match(css, /\.blatt-inhalt \{ overflow-y: auto; overscroll-behavior: contain;/);
  assert.match(css, /@media \(min-width: 821px\) \{\s*\.blatt-hinter \{ align-items: center; \}/, "breit: in der Mitte");
  const app = await readFile(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /#nav a\[data-route="updates"\]/, "Punkt am Menüpunkt");
});

test("0.5.4: Info und Hilfe auf sieben weiteren Seiten, Bills Texte Wort für Wort, Tresor nur Desktop, Notfall ohne", async () => {
  const auftrag = await readFile(new URL("../bill/erledigt/2026-10-05-info-und-hilfe.md", import.meta.url), "utf8").catch(() => readFile(new URL("../bill/todo/2026-10-05-info-und-hilfe.md", import.meta.url), "utf8"));
  const teil2 = auftrag.slice(auftrag.indexOf("## Teil 2"), auftrag.indexOf("## Fertig, wenn"));
  const soll = Object.fromEntries(teil2.split("\n### ").slice(1).map((b) => [b.split(/[\s(]/)[0].trim(), [...b.matchAll(/^\d+\. \*\*(.+?)\*\* (.+)$/gm)].map((m) => [m[1], m[2].trim()])]));
  assert.deepEqual(Object.keys(soll), ["tresor", "bibliothek", "bereit", "pause-linie", "lumi", "werkzeuge", "lumi-buch"]);
  korrekturAnwenden(soll, await korrekturLesen());
  for (const [k, v] of Object.entries(soll)) assert.deepEqual(HILFE[k], v, `Texte ${k} Wort für Wort`);
  assert.equal(HILFE.notfall, undefined, "Notfall bleibt ohne");
  const app = await readFile(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /get tresor\(\) \{ return desktop \? "tresor" : null; \}/, "Tresor nur in der Desktop-App");
  for (const s of ["bibliothek", "werkzeuge", "pause-linie", "lumi-buch"]) assert.ok(app.includes(`"${s}"`) && app.includes("main.innerHTML = seiten[seite]() + hilfeZeile(HILFE_SEITE[seite]);"), `${s}: letzte Zeile der Seite`);
  assert.match(app, /hilfeZeile\("bereit", "bereit-hilfe"\)/); assert.match(app, /hilfeZeile\("lumi", "bereit-hilfe"\)/);
  assert.doesNotMatch(app, /notfall: "notfall"/);
});

// ---------- 0.5.5 ----------
const auftragLesen = (name) => readFile(new URL(`../bill/erledigt/${name}`, import.meta.url), "utf8").catch(() => readFile(new URL(`../bill/todo/${name}`, import.meta.url), "utf8"));
/** Antworten im Auftrag stehen in „…“, darin ‚…‘; in der App ist die Antwort ohne äußere Zeichen, innen „…“. */
const auspacken = (t) => t.trim().replace(/^„/, "").replace(/“$/, "").replace(/‚/g, "„").replace(/‘/g, "“");
/** Korrekturen aus Auftrag 2026-10-05-07: { schluessel: [[nummer, neueFrage|null, antwort]] } */
async function korrekturLesen() {
  const t = await auftragLesen("2026-10-05-hilfe-korrektur.md");
  const teil = t.slice(t.indexOf("\n## pause-linie"), t.indexOf("## Fertig, wenn"));
  return Object.fromEntries(teil.split("\n## ").slice(1).map((b) => [b.split("\n")[0].trim(),
    [...b.matchAll(/^- \*\*(\d+)(?: \(Frage neu: „(.+?)“\))?:\*\* (.+)$/gm)].map((m) => [Number(m[1]), m[2] ?? null, auspacken(m[3])])]));
}
function korrekturAnwenden(soll, korr) {
  for (const [k, liste] of Object.entries(korr)) for (const [n, frage, antwort] of liste) soll[k][n - 1] = [frage ?? soll[k][n - 1][0], antwort];
}

test("0.5.5: 14 Hilfe-Antworten Wort für Wort aus dem Auftrag, pause-linie 7 ohne Wirkversprechen", async () => {
  const korr = await korrekturLesen();
  assert.equal(Object.values(korr).flat().length, 14, "14 Korrekturen");
  for (const [k, liste] of Object.entries(korr)) for (const [n, frage, antwort] of liste) {
    assert.equal(HILFE[k][n - 1][1], antwort, `${k} ${n}`);
    if (frage) assert.equal(HILFE[k][n - 1][0], frage, `${k} ${n}: Frage neu`);
  }
  const alles = JSON.stringify(HILFE);
  assert.doesNotMatch(alles, /Training|Gehirn|ersetzt keine ärztliche/, "keine Werbung mit Gehirntraining");
  assert.equal(HILFE["pause-linie"][6][0], "Was sagt Pause über die Wirkung?");
  assert.doesNotMatch(alles, /‚|‘/, "innen „…“ wie überall");
});

test("0.5.5: Frage zur neuen App-Version bei Updates, nach „Was ist ein Update?“", async () => {
  const t = await auftragLesen("2026-10-05-version-suchen-web.md");
  const m = t.match(/^\s*„(Wie bekomme ich die neue App-Version\?)“ – („.+“)$/m);
  assert.ok(m, "Frage im Auftrag");
  assert.deepEqual(HILFE.updates[1], [m[1], auspacken(m[2])]);
  assert.equal(HILFE.updates[0][0], "Was ist ein Update?");
});

test("0.5.5: Nach neuer Version suchen im Web – gleich, neuer, ohne Netz", async () => {
  const gleich = await webVersionPruefen({ aktuell: "0.5.5", holen: async () => ({ version: "0.5.5" }) });
  assert.deepEqual(gleich, { status: "gleich", version: "0.5.5", text: "Du hast die neueste Version (0.5.5)." });
  const neuer = await webVersionPruefen({ aktuell: "0.5.5", holen: async () => ({ version: "0.5.10" }) });
  assert.deepEqual(neuer, { status: "neuer", version: "0.5.10", text: "Version 0.5.10 ist da." });
  const ohne = await webVersionPruefen({ aktuell: "0.5.5", holen: async () => { throw new TypeError("Failed to fetch"); } });
  assert.deepEqual(ohne, { status: "offline", version: "0.5.5", text: "Gerade kein Internet. Die App läuft weiter mit 0.5.5." });
  // ältere Version auf dem Server (Vercel baut noch) gilt nicht als neu
  assert.equal((await webVersionPruefen({ aktuell: "0.5.5", holen: async () => ({ version: "0.5.4" }) })).status, "gleich");
  assert.ok(versionNeuer("0.6.0", "0.5.9") && versionNeuer("0.5.10", "0.5.9") && !versionNeuer("0.5.5", "0.5.5"));
  // still: nur mit Netz, höchstens einmal am Tag
  assert.equal(stillPruefenFaellig({ letzte: null, heute: "2026-10-05", online: true }), true);
  assert.equal(stillPruefenFaellig({ letzte: "2026-10-05", heute: "2026-10-05", online: true }), false);
  assert.equal(stillPruefenFaellig({ letzte: "2026-10-04", heute: "2026-10-05", online: false }), false);
  assert.equal(webNeuerDa("0.5.6", "0.5.5"), true); assert.equal(webNeuerDa("0.5.5", "0.5.5"), false); assert.equal(webNeuerDa(null, "0.5.5"), false);
});

test("0.5.5: version.json = App-Version, Zeile auch im Web, Service Worker lässt version.json durch", async () => {
  const app = await readFile(new URL("./app.js", import.meta.url), "utf8");
  const v = app.match(/const APP_VERSION = "([\d.]+)"/)[1];
  assert.equal(JSON.parse(await readFile(new URL("./version.json", import.meta.url), "utf8")).version, v);
  assert.match(app, /\$\{appUpdateZeile\(\)\}/, "Zeile ohne desktop-Bedingung");
  assert.match(app, /if \(!desktop\) return webUpdateZeile\(\);/);
  assert.match(app, /data-web-update-laden>Jetzt laden</);
  assert.match(app, /Nach neuer Version suchen/);
  assert.match(app, /webNeuerDa\(speicher\.get\("web-version-server", null\), APP_VERSION\)\), p = a\.querySelector/, "roter Punkt bei Updates & Abo");
  assert.match(app, /reg\.update\(\)/);
  const sw = await readFile(new URL("./sw.js", import.meta.url), "utf8");
  assert.match(sw, /url\.pathname === "\/version\.json"[^\n]*\) return;/);
  assert.match(sw, /new Request\(u, \{ cache: "reload" \}\)/, "neue Hülle an Zwischenspeichern vorbei");
  assert.match(sw, /new Request\(req, \{ cache: "no-cache" \}\)/, "eigene Dateien beim Server nachfragen");
  assert.doesNotMatch(sw.match(/const HUELLE = \[[\s\S]*?\];/)[0], /version\.json/, "nicht im Speicher");
});
