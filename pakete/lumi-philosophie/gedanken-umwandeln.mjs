#!/usr/bin/env node
// Paket „lumi-philosophie“ (Auftrag 2026-10-06-12): „Was die Lumis denken“, fünfzehn Gedanken für Erwachsene.
// Quelle: quelle/texte.md und quelle/bilder/01.webp … 15.webp (Beilage, von Bill geprüft, Fassung mit „Sisyphos kik.“).
// Aufruf: node pakete/lumi-philosophie/gedanken-umwandeln.mjs  → inhalt/gedanken.json und inhalt/bilder/*.webp
// - Kein Text wird umgeschrieben: Jedes Feld kommt wörtlich aus der Liste unter „## NN“, der Text ist alles danach.
// - Einleitung und Schluss („## Einleitung“, „## Schluss“) werden eigene Seiten, wenn sie in texte.md stehen.
// - Bilder: längste Seite höchstens 1200 Pixel (WebP, Qualität 85).
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
export const KANTE = 1200;
export const KOPF = { titel: "Was die Lumis denken", untertitel: "Fünfzehn Gedanken, für Erwachsene", hinweis: "Die Lumis sind erfunden, die Philosophen nicht." };
const FELDER = { "Nummer": "nr", "Wer": "wer", "Titel": "titel", "Lumisch": "lumisch", "Wort für Wort": "wort_fuer_wort", "Umschrift": "umschrift", "Deutsch": "deutsch", "Bild": "bild" };

/** texte.md → { einleitung, gedanken, schluss } (Texte unverändert, nur Ränder getrimmt). */
export function umwandeln(md) {
  const abschnitte = md.split(/^## /m).slice(1).map((a) => { const i = a.indexOf("\n"); return { kopf: a.slice(0, i).trim(), rest: a.slice(i + 1) }; });
  const gedanken = [], extra = {};
  for (const { kopf, rest } of abschnitte) {
    if (/^Einleitung$/i.test(kopf)) { extra.einleitung = rest.trim(); continue; }
    if (/^Schluss$/i.test(kopf)) { extra.schluss = rest.trim(); continue; }
    if (!/^\d\d$/.test(kopf)) throw new Error(`Unbekannter Abschnitt „${kopf}“`);
    const g = {}, text = [];
    for (const z of rest.split("\n")) {
      const m = z.match(/^- \*\*(.+?):\*\* (.*)$/);
      if (m && FELDER[m[1]] && !text.some((x) => x.trim())) g[FELDER[m[1]]] = m[2].trim();
      else text.push(z);
    }
    g.nr = Number(g.nr);
    g.bild = `bilder/${g.bild}`;
    g.text = text.join("\n").trim();
    gedanken.push(g);
  }
  return { ...extra, gedanken };
}

async function main() {
  const md = await readFile(path.join(HIER, "quelle", "texte.md"), "utf8");
  const { gedanken, einleitung, schluss } = umwandeln(md);
  const ziel = path.join(HIER, "inhalt", "bilder");
  await rm(ziel, { recursive: true, force: true }); await mkdir(ziel, { recursive: true });
  for (const g of gedanken) {
    const datei = path.basename(g.bild);
    const py = spawnSync("python3", ["-c", `import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]).convert("RGB"); im.thumbnail((${KANTE},${KANTE})); im.save(sys.argv[2],"WEBP",quality=85,method=6)`, path.join(HIER, "quelle", "bilder", datei), path.join(ziel, datei)]);
    if (py.status !== 0) throw new Error(`Bild ${datei}: ${py.stderr}`);
  }
  const daten = { format: 1, ...KOPF, ...(einleitung ? { einleitung } : {}), gedanken, ...(schluss ? { schluss } : {}) };
  await writeFile(path.join(HIER, "inhalt", "gedanken.json"), JSON.stringify(daten, null, 1) + "\n");
  console.log(`${gedanken.length} Gedanken, ${einleitung ? "mit" : "ohne"} Einleitung, ${schluss ? "mit" : "ohne"} Schluss`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
