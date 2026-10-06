// Klartext-Wache (Nachtrag 2026-10-06): nichts Internes im Klartext ins öffentliche Repo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { geschuetzteMuster, trifft, siehtNachChiffratAus, fingerabdruecke, fundeImText, pruefe, erlaubtFuer, klartextZu, nichtFreigegeben, imGeschuetztenPaket, schutzGrund, freigegebeneAbziehen, regelnAusRepo } from "./klartext-wache.mjs";
import { verschluesseln } from "./intern.mjs";

const lies = (p) => readFile(new URL(p, import.meta.url), "utf8");
const B = (s) => Buffer.from(s);

test("Geschützte Ordner kommen aus dem Block „Klartext-Wache“ der .gitignore, Schlüssel immer", async () => {
  const m = geschuetzteMuster(await lies("../.gitignore"));
  for (const p of ["pakete/naturheilkunde/quelle/", "pakete/naturheilkunde/inhalt/", "pakete/naturheilkunde-bilder/inhalt/", "pakete/naturheilkunde-bilder/auswahl.json", "*.key"]) assert.ok(m.includes(p), p);
  assert.ok(!m.includes("node_modules/"), "nur der Block, nicht die ganze Datei");
  assert.ok(trifft("pakete/naturheilkunde/quelle/x.md", m));
  assert.ok(trifft("pakete/naturheilkunde-bilder/inhalt/bilder/a.webp", m));
  assert.ok(trifft("irgendwo/offline-redaktion.key", m));
  assert.ok(!trifft("pakete/naturheilkunde/verschluesselt/quelle/x.md", m));
  assert.ok(!trifft("pakete/naturheilkunde/naturheilkunde-umwandeln.mjs", m));
});

test("Abbruch, wenn eine Datei aus einem geschützten Ordner vorgemerkt ist (auch mit git add -f)", () => {
  const m = ["pakete/x/inhalt/", "*.key"];
  assert.equal(pruefe([{ pfad: "pakete/x/inhalt/a.json", inhalt: B("{}") }], m).length, 1);
  assert.equal(pruefe([{ pfad: "pakete/x/inhalt/bild.webp", inhalt: null }], m).length, 1);
  assert.equal(pruefe([{ pfad: "neu.key", inhalt: B("x") }], m).length, 1);
  assert.deepEqual(pruefe([{ pfad: "web/app.js", inhalt: B("let a = 1;") }], m), []);
});

test("In verschluesselt/ nur Chiffrat: Klartext dort fällt auf", () => {
  const k = randomBytes(32);
  assert.ok(siehtNachChiffratAus(verschluesseln(B("Ein ganz gewöhnlicher Satz über Kräuter und Tee. ".repeat(20)), k)));
  assert.ok(siehtNachChiffratAus(verschluesseln(B("kurz"), k)));
  assert.ok(!siehtNachChiffratAus(B("# Teil 1\n\nGanz normaler Text mit Umlauten: Bärlauch, Herbstzeitlose.\n")));
  assert.ok(!siehtNachChiffratAus(B(JSON.stringify({ eintraege: [{ name: "Bärlauch", text: "x".repeat(200) }] }))));
  assert.equal(pruefe([{ pfad: "pakete/x/verschluesselt/a.md", inhalt: B("# Klartext, versehentlich hier\n".repeat(5)) }], []).length, 1);
  assert.deepEqual(pruefe([{ pfad: "pakete/x/verschluesselt/a.md", inhalt: verschluesseln(B("# Text\n".repeat(5)), k) }], []), []);
});

test("Fingerabdruck: Text aus den Quellen in einer anderen Datei fällt auf, auch in JSON; Freigaben nur mit Wortlaut", () => {
  const quelle = "## 3.1 Bärlauch\nDie Blätter der Herbstzeitlose sind schmal, länglich und stehen ohne Stiel.\nkurz\n| File:Ein öffentlicher Commons-Dateiname mit vielen Zeichen.jpg |";
  const f = fingerabdruecke([quelle]);
  assert.equal(f.size, 1, "nur das Stück ab 40 Zeichen; Commons-Namen zählen nicht");
  assert.equal(fundeImText("nichts davon", f).length, 0);
  assert.equal(fundeImText('const t = "Vorne dran: Die Blätter der Herbstzeitlose sind schmal, länglich";', f).length, 1);
  assert.equal(fundeImText(JSON.stringify({ text: "x\nDie Blätter der Herbstzeitlose sind schmal, länglich und stehen ohne Stiel." }), f).length, 1);
  assert.equal(fundeImText("Die Blätter der Herbstzeitlose sind schmal, länglich", f, ["Die Blätter der Herbstzeitlose sind schmal, länglich"]).length, 0);
  const erl = { "*": [{ text: "A" }], "a.md": [{ text: "B" }] };
  assert.deepEqual(erlaubtFuer(erl, "a.md"), ["A", "B"]); assert.deepEqual(erlaubtFuer(erl, "b.md"), ["A"]);
  assert.deepEqual(erlaubtFuer(erl, "werkzeug/klartext-wache-erlaubt.json").sort(), ["A", "B"], "die Liste selbst");
});

test("Regel fürs öffentliche Repo (Auftrag 13): Spiegel der verschlüsselten Dateien und Pakete mit \"freigegeben\": false", () => {
  assert.equal(klartextZu("pakete/x/verschluesselt/quelle/a.md"), "pakete/x/quelle/a.md");
  assert.equal(klartextZu("bill/beilagen/verschluesselt/a.md"), "bill/beilagen/a.md");
  assert.ok(nichtFreigegeben({ freigegeben: false })); assert.ok(nichtFreigegeben({ kanal: "intern" }));
  assert.ok(!nichtFreigegeben({})); assert.ok(!nichtFreigegeben({ freigegeben: true }));
  const r = { muster: [], spiegel: new Set(["pakete/p/quelle/a.md"]), pakete: [{ wurzel: "pakete/neu/", offen: ["LIESMICH.md"] }] };
  assert.match(schutzGrund("pakete/p/quelle/a.md", r), /verschlüsselt im Repo/);
  for (const p of ["pakete/neu/inhalt/text.json", "pakete/neu/PRUEFBERICHT.md", "pakete/neu/quelle/x.md", "pakete/neu/inhalt/bild.webp"]) assert.match(schutzGrund(p, r), /nicht freigegeben/, p);
  for (const p of ["pakete/neu/paket.quelle.json", "pakete/neu/umwandeln.mjs", "pakete/neu/LIESMICH.md", "pakete/neu/verschluesselt/inhalt/text.json", "pakete/alt/inhalt/text.json"]) assert.equal(schutzGrund(p, r), null, p);
  assert.equal(pruefe([{ pfad: "pakete/neu/inhalt/text.json", inhalt: B("{}") }], r).length, 1, "neues Paket ohne .gitignore-Eintrag wird trotzdem gestoppt");
});

test("Fingerabdruck: Freigegebenes zählt nicht; Rahmen und Aufzählungszeichen machen keinen Fund", () => {
  const f = fingerabdruecke(["- **Ein Satz aus einer Quelle, der noch nicht veröffentlicht ist.**", "„Ein Satz, der schon in der App steht und daher öffentlich ist.“", "│" + " ".repeat(60) + "│"]);
  assert.equal(f.size, 2);
  freigegebeneAbziehen(f, ['const hilfe = "Ein Satz, der schon in der App steht und daher öffentlich ist.";']);
  assert.equal(f.size, 1);
  assert.equal(fundeImText("Zitat: Ein Satz aus einer Quelle, der noch nicht veröffentlicht ist.", f).length, 1);
});

test("Die Regeln im Repo: Naturheilkunde, Bilder und Flechte gekennzeichnet; Unveröffentlichtes liegt verschlüsselt", () => {
  const r = regelnAusRepo();
  assert.deepEqual(r.pakete.map((p) => p.wurzel).sort(), ["pakete/flechte/", "pakete/lumi-philosophie/", "pakete/naturheilkunde-bilder/", "pakete/naturheilkunde/"]);
  for (const p of ["pakete/flechte/inhalt/skin/skin.css", "pakete/pause/quelle/OFFLINE-Lumisch-Woerterbuch-2026-10-05.md", "pakete/pause/quelle/OFFLINE-Lumisch-Aussprache.json",
    "bill/eingang/2026-10-04-pause-quellen/OFFLINE-Modul-Pause-Konzept.md", "bill/eingang/2026-09-29-bill/material/pakete/wir/inhalt/tipps.json", "bill/beilagen/2026-10-06-auszuege.md"])
    assert.ok(r.spiegel.has(p) && schutzGrund(p, r), p);
  assert.equal(schutzGrund("pakete/pause/inhalt/pause.json", r), null, "freigegebener Paketinhalt bleibt offen");
});

test("Jede Freigabe hat einen Grund und ist kurz (Namen und Redaktionssätze, kein Inhalt)", async () => {
  const e = JSON.parse(await lies("./klartext-wache-erlaubt.json")).erlaubt;
  for (const [datei, l] of Object.entries(e)) for (const x of l) { assert.ok(x.grund?.length > 10, `${datei}: Grund`); assert.ok(x.text.length <= 160, `${datei}: zu lang`); }
});

test("Das ganze Repo ist sauber, und die Hooks sind da", async () => {
  const aus = execFileSync(process.execPath, [fileURLToPath(new URL("./klartext-wache.mjs", import.meta.url)), "alle"], { encoding: "utf8" });
  assert.match(aus, /sauber/);
  for (const h of ["pre-commit", "pre-push"]) {
    const t = await lies(`../.githooks/${h}`);
    assert.match(t, /klartext-wache\.mjs" (vorgemerkt|push)/);
    if (process.platform !== "win32") assert.ok((await stat(new URL(`../.githooks/${h}`, import.meta.url))).mode & 0o100, `${h} ausführbar`);
  }
});
