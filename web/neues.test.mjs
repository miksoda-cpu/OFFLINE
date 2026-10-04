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

// Startseite verspricht nur, was die App kann (Auftrag 2026-10-04-webseite-ehrlich): keine KI im Startbild und in der
// Seitenbeschreibung, Geplantes trägt „kommt“, der Satz über den Preiskarten steht da.
test("Startseite: kein KI-Versprechen im Startbild, Geplantes mit „kommt“", async () => {
  const html = await readFile(new URL("./index.html", import.meta.url), "utf8");
  const meta = [...html.matchAll(/<meta[^>]+(?:name|property)="(?:og:)?description"[^>]+content="([^"]+)"/g)].map((m) => m[1]);
  const lead = html.match(/<p class="lead">([\s\S]*?)<\/p>/)[1];
  for (const t of [...meta, lead]) assert.doesNotMatch(t, /\bKI\b|KI-|Wikipedia|Karte/, t);
  assert.equal(meta.length, 2);
  const kommt = (text) => new RegExp(`${text}[^<]*<span class="tag tag-warn">kommt</span>`).test(html);
  for (const t of ["Nach Bundesland", "Österreich-Paket nach Bundesland", "RIS-Gesetzesauszug, wöchentlich", "Karte Österreich und Wikipedia auf Deutsch", "Zentral verwaltete Updates"]) assert.ok(kommt(t), t);
  assert.match(html, /<h3>Karten <span class="tag tag-warn">kommt<\/span><\/h3>/);
  assert.match(html, /Wikivoyage auf Deutsch\. Wikipedia und Wiktionary kommen\./);
  assert.match(html, /Wikivoyage, Österreich-Paket Grundversion<\/li>\s*<li class="muted">Wikipedia und Karte kommen<\/li>/);
  assert.match(html, /Was mit „kommt“ markiert ist, bauen wir gerade\. Du zahlst für das, was es gibt\./);
  for (const p of ["7,90 €", "79 € / Jahr", "19,90 €", "199 € / Jahr", "ab 590 €"]) assert.ok(html.includes(p), `Preis ${p} unverändert`);
});
