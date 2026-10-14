// Auftrag Nr. 22: Impressum und Datenschutz mit den Daten der digitalworld Academy OG (Festlegung Mik, 11.10.2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const lies = (p) => readFile(new URL(p, import.meta.url), "utf8");
const ANGABEN = [
  "digitalworld Academy OG",
  "Große Schiffgasse 18/Top 2, 1020 Wien, Österreich",
  "FN 477728t",
  "Handelsgericht Wien",
  "ATU72706716",
  "office@diwo.at",
  "+43 1 890 0195",
];
// Nachtrag zu Nr. 22 (13.10.2026, Firmenbuchauszug FN 477728t vom 12.10.2026): keine Platzhalter mehr, nur Angaben aus dem
// Auszug und dem Nachtrag. Wirtschaftskammer und Gewerbebehörde entfallen (Bildungsinstitut, kein Gewerbe).
const NACHTRAG = [
  "Rechtsform: Offene Gesellschaft",
  "Unternehmensgegenstand: Bildungsinstitut",
  "Medieninhaber: digitalworld Academy OG, Große Schiffgasse 18/Top 2, 1020 Wien",
  "Unbeschränkt haftende Gesellschafter: Mag. Sabine Kainz, Daniel Kainz",
  "Grundlegende Richtung (Blattlinie): Praktisches Wissen für Vorsorge und Alltag in Österreich, das auch ohne Internet funktioniert. Unabhängig, werbefrei, ohne Parteinahme.",
];
const ohneTags = (html) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

test("Impressum: Seite mit allen Angaben der OG, E-Mail und Telefon als Text, vollständig ohne Platzhalter", async () => {
  const html = await lies("./impressum.html"), text = ohneTags(html);
  for (const a of ANGABEN) assert.ok(text.includes(a), a);
  for (const a of NACHTRAG) assert.ok(text.includes(a), a);
  assert.ok(!/ergänzt/.test(html), "kein „wird ergänzt“ mehr");
  assert.ok(!/Wirtschaftskammer|Gewerbebehörde/.test(html), "entfällt: kein Gewerbe");
  assert.ok(!/\d{2}\.\d{2}\.\d{4}/.test(text), "keine Geburtsdaten (kein Datum im Impressum)");
  assert.match(html, /<link rel="stylesheet" href="\/styles\.css">/, "Stil der bestehenden Seiten");
});

test("Impressum: keine Fremdskripte, keine Karte, keine fremden Adressen außer dem Mail-Link", async () => {
  const html = await lies("./impressum.html");
  assert.ok(!/<script|<iframe|<img|leaflet|basemap|maps|https?:\/\//i.test(html.replace(/<meta[^>]*>/g, "")), "nichts, was ins Netz geht");
});

test("Impressum von jeder Webseite verlinkt", async () => {
  for (const f of ["./index.html", "./datenschutz.html", "./app.html"]) assert.match(await lies(f), /href="\/impressum\.html"/, f);
  assert.match(await lies("./sw.js"), /"\/impressum\.html"/, "auch offline da");
});

test("Datenschutz: Verantwortlich vollständig, ohne „werden ergänzt“; Hetzner als Auftragsverarbeiter", async () => {
  const html = await lies("./datenschutz.html");
  const verantwortlich = html.slice(html.indexOf("<h2>Verantwortlich</h2>"), html.indexOf("<h2>", html.indexOf("<h2>Verantwortlich</h2>") + 5));
  assert.ok(verantwortlich.length > 30);
  assert.ok(!/ergänzt/.test(verantwortlich), "kein Platzhalter bei Verantwortlich");
  for (const a of ANGABEN) assert.ok(ohneTags(verantwortlich).includes(a), a);
  assert.match(ohneTags(html), /Hetzner Online GmbH[^.]*Falkenstein/);
  assert.match(ohneTags(html), /Hetzner[^.]*Auftragsverarbeit/);
});

test("App: „Über“ nennt den Herausgeber mit denselben Angaben; Tauri-Bündel trägt die OG", async () => {
  const app = await lies("./app.js");
  const ueber = app.slice(app.indexOf("const HERAUSGEBER"), app.indexOf("const ueberHtml"));
  for (const a of ANGABEN) assert.ok(ueber.includes(a), a);
  assert.match(app, /const ueberHtml = \(\) => `<details class="upd-zeile ueber"><summary class="muted of-klein">Über · Impressum und Lizenzen<\/summary>\$\{herausgeberHtml\(\)\}/);
  const conf = JSON.parse(await lies("../app/src-tauri/tauri.conf.json"));
  assert.equal(conf.bundle.publisher, "digitalworld Academy OG");
  assert.match(conf.bundle.copyright, /digitalworld Academy OG/);
});
