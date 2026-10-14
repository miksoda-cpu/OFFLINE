// Nr. 28: Naturheilkunde, erste Fassung. Die Inhalte liegen bis zur Freigabe verschlüsselt im Repo (CI entschlüsselt sie);
// ohne Klartext und ohne Kanal-Schlüssel wird der Inhaltsteil übersprungen, wie bei den anderen unveröffentlichten Paketen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { seiteHtml, verweise, klick, startZustand, PAKET } from "./heilkunde.js";

const url = (p) => new URL(p, import.meta.url);
const DATEI = url("../pakete/heilkunde-grundstock/inhalt/heilkunde.json");
const da = existsSync(DATEI);
const d = da ? JSON.parse(await readFile(DATEI, "utf8")) : null;

test("Paket: Kennung, Bereich, App-Version, kein Code", async () => {
  const q = JSON.parse(await readFile(url("../pakete/heilkunde-grundstock/paket.quelle.json"), "utf8"));
  assert.equal(q.id, PAKET); assert.equal(q.art, "inhalt"); assert.equal(q.bereich, "wissen"); assert.equal(q.app_min, "0.9.0");
  if (!da) return;
  assert.ok(!/<script|function\s*\(|=>/.test(JSON.stringify(d)), "nur Daten");
});

test("Jeder Doppelgänger-Link führt auf einen vorhandenen Eintrag", { skip: !da && "Klartext fehlt (verschlüsselt)" }, () => {
  const ids = new Set(d.karten.map((k) => k.id));
  const v = verweise(d);
  assert.ok(v.length >= 7, `${v.length} Verweise (Probe v7: 7)`);
  for (const { von, nach } of v) assert.ok(ids.has(nach), `${von} → ${nach}`);
  // und in der fertigen Seite: jeder Knopf data-hk-m zeigt auf eine Karte, die sich öffnen lässt
  for (const k of d.karten) {
    const z = { ...startZustand(), stapel: [{ m: k.id }] };
    const html = seiteHtml(d, z, "at");
    for (const [, ziel] of html.matchAll(/data-hk-m="([^"]+)"/g)) assert.ok(ids.has(ziel), `${k.id}: Link auf ${ziel}`);
    assert.ok(html.includes(k.n.replace(/&/g, "&amp;")), `${k.id}: Titel`);
  }
});

test("Aufbau wie die Probe v7: zwei Reiter, Beschwerden mit Zahl, Gruppen, grüner Kasten mit dem Satz aus Nachtrag 2, Notrufzeile unten", { skip: !da && "Klartext fehlt (verschlüsselt)" }, () => {
  const html = seiteHtml(d, startZustand(), "at");
  assert.equal((html.match(/data-hk-tab=/g) ?? []).length, 2);
  assert.equal((html.match(/data-hk-b=/g) ?? []).length, Object.keys(d.beschwerden).length);
  assert.ok(html.includes('class="hk-umfang"') && d.texte.grundstock[0] === "Was heute gratis ist, bleibt gratis.", "erster Satz im grünen Kasten (Nachtrag 2)");
  assert.ok(html.indexOf("hk-selbst") > html.indexOf("hk-umfang"), "Notrufzeile unten");
  const z = startZustand(); z.tab = "ogg"; z.gr = "pilz";
  const pilze = seiteHtml(d, z, "at");
  assert.ok((pilze.match(/hk-rot/g) ?? []).length >= 3, "Giftpilze rot");
  // Klick-Logik: Reiter, Gruppe, Karte, Zurück
  const s = startZustand(), el = (attr) => ({ closest: () => ({ dataset: attr, hasAttribute: (n) => n === "data-hk-zurueck" && attr.zurueck }) });
  assert.ok(klick(s, el({ hkTab: "ogg" })) && s.tab === "ogg");
  assert.ok(klick(s, el({ hkM: "knolle" })) && s.stapel.at(-1).m === "knolle");
  assert.ok(klick(s, el({ zurueck: true })) && s.stapel.length === 0);
});

test("Notrufzeile je Land: Deutschland ohne 144 und ohne die österreichische Vergiftungsnummer", { skip: !da && "Klartext fehlt (verschlüsselt)" }, () => {
  const at = seiteHtml(d, startZustand(), "at"), de = seiteHtml(d, startZustand(), "de"), ch = seiteHtml(d, startZustand(), "ch");
  assert.ok(at.includes("01 406 43 43") && at.includes("144"));
  assert.ok(!/\b144\b|\b133\b|01 406 43 43/.test(de) && de.includes("112"), "Deutschland");
  assert.ok(ch.includes("145") && ch.includes("144") && !ch.includes("01 406 43 43"), "Schweiz");
});
