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
// Was Bill nicht hat, bleibt sichtbar markiert, bis Mik es liefert; nichts davon wird erfunden.
const FEHLT = ["Unternehmensgegenstand", "Wirtschaftskammer", "Gewerbebehörde", "§ 25 Mediengesetz"];
const ohneTags = (html) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

test("Impressum: Seite mit allen Angaben der OG, E-Mail und Telefon als Text, fehlende Angaben markiert", async () => {
  const html = await lies("./impressum.html"), text = ohneTags(html);
  for (const a of ANGABEN) assert.ok(text.includes(a), a);
  for (const f of FEHLT) { const i = html.lastIndexOf(f); assert.ok(i > 0 && html.slice(i, i + 300).includes('<span class="tag tag-warn">wird ergänzt</span>'), f); }
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
