// node --test web/neues.test.mjs – „Was ist neu“: Für die aktuelle Version gibt es einen Eintrag, bevor der Tag gesetzt wird
// (bill/README.md, Ablauf). Geschrieben für Nutzer: drei bis sechs Punkte, keine Dateinamen, keine Fachwörter aus der Werkstatt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const lies = (p) => readFile(new URL(p, import.meta.url), "utf8");
const neues = JSON.parse(await lies("./neues.json"));
const zahl = (v) => v.split(".").map(Number);
const vergleich = (a, b) => { const A = zahl(a), B = zahl(b); for (let i = 0; i < 3; i++) if ((A[i] ?? 0) !== (B[i] ?? 0)) return (A[i] ?? 0) - (B[i] ?? 0); return 0; };

test("Die aktuelle Version hat ihren Eintrag, und alle drei Versionsangaben stimmen überein", async () => {
  const web = (await lies("./app.js")).match(/const APP_VERSION = "([\d.]+)"/)[1];
  const tauri = JSON.parse(await lies("../app/src-tauri/tauri.conf.json")).version;
  const cargo = (await lies("../app/src-tauri/Cargo.toml")).match(/^version = "([\d.]+)"/m)[1];
  assert.equal(web, tauri, "APP_VERSION und tauri.conf.json");
  assert.equal(cargo, tauri, "Cargo.toml und tauri.conf.json");
  assert.equal(neues.versionen[0].version, tauri, `„Was ist neu“ braucht einen Eintrag für ${tauri}, oben`);
});

test("Neueste oben, jede Version einmal, Datum, drei bis sechs Punkte in Alltagssprache", () => {
  const v = neues.versionen;
  for (let i = 1; i < v.length; i++) assert.ok(vergleich(v[i - 1].version, v[i].version) > 0, `${v[i - 1].version} vor ${v[i].version}`);
  for (const x of v) {
    assert.match(x.datum, /^\d{4}-\d{2}-\d{2}$/, x.version);
    assert.ok(x.punkte.length >= 3 && x.punkte.length <= 6, `${x.version}: ${x.punkte.length} Punkte`);
    for (const p of x.punkte) {
      assert.ok(p.length <= 300, `${x.version}: Punkt zu lang`);
      assert.doesNotMatch(p, /\b(commit|branch|workflow|manifest|sha256|json|api|ci|merge)\b|\.(js|mjs|rs|json|md|yml)\b|`/i, `${x.version}: „${p.slice(0, 40)}…“ klingt nach Werkstatt`);
    }
  }
});
