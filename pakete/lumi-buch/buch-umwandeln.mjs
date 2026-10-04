#!/usr/bin/env node
// Paket „lumi-buch“: Band 1 aus der Vorlage (quelle/OFFLINE-Lumi-Buch-Band1.md, von Mik am 04.10.2026 freigegeben) in
// inhalt/buch.json bringen. Aufruf: node pakete/lumi-buch/buch-umwandeln.mjs
// - „# Kapitel N: Titel“ wird ein Kapitel, „### b1-KK-PP“ ein Absatz. Die Zeile `Tipps: …` ist Redaktion und fällt weg.
// - Inhalt bleibt, wie er ist. Tippfehler stehen in KORREKTUR und in der Rückmeldung.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buchFehler } from "../../paket-kit/buch-format.mjs";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const QUELLE = path.join(HIER, "quelle", "OFFLINE-Lumi-Buch-Band1.md");
const ZIEL = path.join(HIER, "inhalt", "buch.json");
/** Kleine Tippfehler, wörtlich ersetzt: [Absatz, falsch, richtig] */
export const KORREKTUR = [];

export function umwandeln(md) {
  const kapitel = [];
  let absatz = null;
  for (const zeile of md.split("\n")) {
    const k = zeile.match(/^# Kapitel (\d+): (.+)$/);
    if (k) { kapitel.push({ nr: Number(k[1]), titel: k[2].trim(), absaetze: [] }); absatz = null; continue; }
    const a = zeile.match(/^### (b\d+-\d\d-\d\d)$/);
    if (a) { absatz = { id: a[1], teile: [] }; kapitel.at(-1).absaetze.push(absatz); continue; }
    if (!absatz || /^`Tipps:/.test(zeile) || /^---$/.test(zeile)) continue;
    absatz.teile.push(zeile);
  }
  for (const k of kapitel) for (const a of k.absaetze) {
    a.text = a.teile.join("\n").trim().replace(/\n{2,}/g, "\n\n");
    delete a.teile;
    for (const [id, falsch, richtig] of KORREKTUR) if (id === a.id) a.text = a.text.replace(falsch, richtig);
  }
  return {
    format: 1,
    band: 1,
    titel: "Das Lumi-Buch",
    untertitel: "Band 1",
    hinweis: "Eine erfundene Geschichte. Die Quantenwelt in den Kapiteln 9 bis 12 ist ein Bild, keine Physik.",
    kapitel,
  };
}

async function main() {
  const buch = umwandeln(await readFile(QUELLE, "utf8"));
  const f = buchFehler(buch);
  if (f.length) { console.error(f.join("\n")); process.exit(1); }
  await writeFile(ZIEL, JSON.stringify(buch, null, 1) + "\n");
  console.log(`${buch.kapitel.length} Kapitel, ${buch.kapitel.reduce((n, k) => n + k.absaetze.length, 0)} Absätze → ${path.relative(process.cwd(), ZIEL)}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
