// node --test web/neuigkeiten.test.mjs – Updates & Abo (Auftrag 2026-10-05-updates-seite, 0.5.2): roter Punkt bei Neuem,
// weg nach dem Ansehen; Reihenfolge der Seite; Hilfetexte; Blatt mit ✕ und Zurück-Taste.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ungesehen, alsGesehen, inhaltsAenderungen, inhalteStart } from "./neuigkeiten.js";
import { HILFE } from "./hilfe.js";

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

test("Info und Hilfe: die zehn Fragen von Bill, kurze Sätze", () => {
  const h = HILFE.updates;
  assert.equal(h.length, 10);
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
