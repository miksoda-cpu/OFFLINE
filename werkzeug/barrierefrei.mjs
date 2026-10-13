#!/usr/bin/env node
// OFFLINE – Barrierefreiheit der Web-App mit axe-core (Auftrag Nr. 21). Dieselben MVP-Seiten wie der Bildvergleich
// (werkzeug/seiten.mjs), je 360 px und 1280 px, hell und dunkel, Regeln WCAG 2.0/2.1 A und AA.
//
//   node werkzeug/barrierefrei.mjs --chrome                  prüfen (CI); Chrome-Pfad in CHROME
//   Weitere Schalter: --nur <seite[,seite]>  --aus <ordner> (Standard barrierefrei-aus/, Bericht als JSON)
//
// Befunde der Stufen „serious“ und „critical“ lassen die Prüfung fehlschlagen, außer sie stehen mit Grund in
// werkzeug/barrierefrei-ausnahmen.json. „moderate“ und „minor“ werden nur gelistet. axe-core (MPL-2.0) liegt als
// einzelne Datei mit Lizenz in werkzeug/axe/ und wird nur in die geprüfte Seite gegeben, nie in die App.
// Endet mit 0, wenn nichts Ernstes offen ist, sonst mit 1.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { WURZEL, dateiserver, chromeStarten } from "./browser.mjs";
import { BREITEN, FARBEN, seitenListe, appLaden, seiteZeigen } from "./seiten.mjs";

const argv = process.argv.slice(2);
const opt = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const AUS = path.resolve(opt("aus", path.join(WURZEL, "barrierefrei-aus")));
const NUR = opt("nur")?.split(",");
export const ERNST = ["serious", "critical"];
export const REGELN = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/** Passt eine Ausnahme auf einen Befund? Regel muss stimmen; Seite und Ziel (CSS-Selektor wie von axe) nur, wenn angegeben. */
export const ausnahmeFuer = (ausnahmen, regel, seite, ziel) => ausnahmen.find((a) => a.regel === regel && (!a.seite || a.seite === seite) && (!a.ziel || a.ziel === ziel));

/** Prüft die Ausnahmeliste selbst: jeder Eintrag braucht Regel und Grund. */
export function ausnahmenPruefen(ausnahmen) {
  const fehler = [];
  ausnahmen.forEach((a, i) => { if (!a.regel) fehler.push(`Eintrag ${i + 1}: Regel fehlt`); if (!a.grund || a.grund.trim().length < 10) fehler.push(`Eintrag ${i + 1} (${a.regel}): Grund fehlt`); });
  return fehler;
}

async function main() {
  if (!argv.includes("--chrome")) { console.error("Aufruf: node werkzeug/barrierefrei.mjs --chrome [--nur seite] [--aus ordner]"); return 2; }
  const axe = await readFile(path.join(WURZEL, "werkzeug", "axe", "axe.min.js"), "utf8");
  const { ausnahmen } = JSON.parse(await readFile(path.join(WURZEL, "werkzeug", "barrierefrei-ausnahmen.json"), "utf8"));
  const listenfehler = ausnahmenPruefen(ausnahmen);
  if (listenfehler.length) { console.error(`Ausnahmeliste ungültig:\n- ${listenfehler.join("\n- ")}`); return 1; }
  const seiten = (await seitenListe()).filter((s) => !NUR || NUR.includes(s.name));
  await mkdir(AUS, { recursive: true });
  const server = await dateiserver(), chrome = await chromeStarten();
  console.log(`${chrome.version} · axe-core ${axe.match(/axe v([\d.]+)/)?.[1]} · ${seiten.length} Seiten × ${BREITEN.length} Breiten × ${FARBEN.length} Farben\n`);
  const befunde = [], genutzt = new Set();
  try {
    for (const breite of BREITEN) for (const farbe of FARBEN) {
      const t = await chrome.tab();
      await appLaden(t, server.url, breite, farbe);
      for (const seite of seiten) {
        await seiteZeigen(t, seite);
        if (!(await t.auswerten("!!window.axe"))) await t.auswerten(axe + "\n;0");
        const v = await t.auswerten(`axe.run(document, { runOnly: { type: "tag", values: ${JSON.stringify(REGELN)} }, resultTypes: ["violations"] })
          .then((r) => r.violations.map((x) => ({ regel: x.id, stufe: x.impact, hilfe: x.help, ziele: x.nodes.map((n) => n.target.join(" ")) })))`);
        for (const x of v) for (const ziel of x.ziele) {
          const a = ausnahmeFuer(ausnahmen, x.regel, seite.name, ziel);
          if (a) genutzt.add(a);
          befunde.push({ seite: seite.name, breite, farbe, regel: x.regel, stufe: x.stufe, hilfe: x.hilfe, ziel, ausnahme: a?.grund ?? null });
        }
      }
      await t.schliessen();
    }
  } finally { await chrome.beenden(); server.schliessen(); }

  // Zusammenfassen: gleiche Regel, Seite und Ziel über Breiten und Farben hinweg eine Zeile
  const zeilen = new Map();
  for (const b of befunde) {
    const k = `${b.stufe}|${b.regel}|${b.seite}|${b.ziel}`;
    if (!zeilen.has(k)) zeilen.set(k, { ...b, wo: [] });
    zeilen.get(k).wo.push(`${b.breite}-${b.farbe}`);
  }
  const reihe = ["critical", "serious", "moderate", "minor"], liste = [...zeilen.values()].sort((a, b) => reihe.indexOf(a.stufe) - reihe.indexOf(b.stufe) || a.regel.localeCompare(b.regel) || a.seite.localeCompare(b.seite));
  const offen = liste.filter((b) => ERNST.includes(b.stufe) && !b.ausnahme);
  for (const b of liste) console.log(`  ${ERNST.includes(b.stufe) ? (b.ausnahme ? "~" : "✗") : "·"} ${b.stufe.padEnd(8)} ${b.regel.padEnd(24)} ${b.seite.padEnd(22)} ${b.ziel}  [${b.wo.join(", ")}]${b.ausnahme ? `  – Ausnahme: ${b.ausnahme}` : ""}`);
  const ungenutzt = ausnahmen.filter((a) => !genutzt.has(a));
  if (ungenutzt.length && !NUR) console.log(`\nAusnahmen ohne Befund (können weg): ${ungenutzt.map((a) => `${a.regel}${a.seite ? ` auf ${a.seite}` : ""}`).join(", ")}`);
  await writeFile(path.join(AUS, "bericht.json"), JSON.stringify({ chrome: chrome.version, befunde: liste, offen: offen.length }, null, 2));
  console.log(`\n${liste.length} Befunde, davon ${liste.filter((b) => ERNST.includes(b.stufe)).length} ernst (${liste.filter((b) => b.ausnahme).length} mit Ausnahme). ${offen.length ? `${offen.length} offen: Prüfung fehlgeschlagen.` : "Nichts Ernstes offen."}`);
  return offen.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main().then((c) => process.exit(c), (e) => { console.error(e); process.exit(2); });
