#!/usr/bin/env node
// Paket „pause“: Lumisch aus der geprüften Beilage übernehmen (Auftrag 2026-10-05-03).
// Quelle: quelle/OFFLINE-Lumisch-Woerterbuch-2026-10-05.md (500 Wörter nach dem Nachtrag 2026-10-05-05, Wortprüfung vom
// 05.10.2026, Mik freigegeben).
// Aufruf: node pakete/pause/lumisch-umwandeln.mjs   – schreibt lumisch in inhalt/pause.json neu, alles andere bleibt.
// - Plan (Tag 1–21): Abschnitt 8. Tag 21 hat kein Wort („—“).
// - Wörterbuch: Abschnitt 6, jedes Wort mit Gruppe (Überschrift ohne Klammer), Deutsch und Hinweis. Ein Beispiel nur, wo
//   die Beilage eines hat: der erste Beispielsatz aus Abschnitt 4, in dem das Wort vorkommt.
// - Reihenfolge (so kommen neue Wörter nach Tag 21): Unten, Wie etwas ist, Farben, Gefühle, dann die übrigen; die
//   Philosophie-Gruppen und „Zahl und Quant“ zuletzt.
// - Hinweise ohne die Klammern „(Bis 05.10.2026: …)“, damit kein ersetztes Wort im Paket steht.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
export const QUELLE = path.join(HIER, "quelle", "OFFLINE-Lumisch-Woerterbuch-2026-10-05.md");
const ZIEL = path.join(HIER, "inhalt", "pause.json");

/** Gruppen in der Reihenfolge, in der neue Wörter kommen (Präfix der Überschrift genügt). */
export const GRUPPEN_REIHENFOLGE = [
  "Unten: die Höhle", "Unten: Pilz, Essen, Trinken", "Unten: Lager und Abfluss", "Unten: wir und unser Körper", "Unten: was man tut",
  "Unten: Pilzsorten", "Unten: Höhlenstimmungen",
  "Wie etwas ist", "Farben", "Gefühle und Gedanken", "Oben: Strom, Notfall, Familie",
  "Kleine Wörter", "Zahlen", "Lange Zahlen", "Gespräch", "Zeit",
  "Oben: Himmel, Wetter, Land", "Oben: Pflanzen und Tiere", "Oben: Macht, Recht, Geld", "Oben: Menschen und ihre Dinge",
  // Philosophie-Gruppen, dann Zahl und Quant (Nachtrag 2026-10-05-05: Gespräch und Zeit vor der Philosophie, Strom nach Gefühle)
  "Denken: Wissen, Wahrheit, Sprache", "Sein und Werden", "Ich, Du, Wir", "Gut, Böse, Glück", "Tod, Wiederkehr, Quantenwelt",
  "Zahl und Quant",
];

const zellen = (zeile) => zeile.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
const abschnitt = (t, von, bis) => t.slice(t.indexOf(von), bis ? t.indexOf(bis) : undefined);
/** Nachträge gehören zu ihrer Stammgruppe und reihen sich dort hinten ein (Nachtrag 2026-10-05-05). */
export const NACHTRAG_STAMM = { "Körper": "Unten: wir und unser Körper", "Was man tut": "Unten: was man tut", "Wie etwas ist": "Wie etwas ist", "Kleine Wörter": "Kleine Wörter" };
const gruppeName = (u) => {
  const ohne = u.replace(/\s*\((neu|Menschenwelt|Mathematik|Sokrates|Heraklit|Descartes|Aristoteles|Heidegger|sie tragen)[^)]*\)/g, "").trim();
  const n = ohne.match(/^(.*?)\s*\(Nachtrag\)$/);
  if (n) { if (!NACHTRAG_STAMM[n[1]]) throw new Error(`Nachtrag ohne Stammgruppe: ${u}`); return NACHTRAG_STAMM[n[1]]; }
  return ohne.replace(/:\s*zustimmen, widersprechen, vergleichen$/, "");
};
const ohneAlt = (h) => h.replace(/\s*\(Bis 05\.10\.2026:[^)]*\)/g, "").trim();
const woerterIn = (satz) => satz.toLowerCase().replace(/[.,!?]/g, " ").split(/\s+/).map((w) => w.replace(/\d+/g, "")).filter(Boolean);

export function lumischAusBeilage(md) {
  // Abschnitt 8: Plan
  const plan = abschnitt(md, "## 8. Lumisch in 21 Tagen", "## 9.").split("\n").filter((z) => /^\| \d+ \|/.test(z)).map((z) => {
    const [tag, wort, bedeutung, aufgabe] = zellen(z);
    const w = wort.replace(/\*/g, "").trim();
    return { tag: Number(tag), wort: w === "—" ? "" : w, bedeutung, aufgabe };
  });
  // Abschnitt 4: Beispielsätze
  const saetze = abschnitt(md, "## 4. Beispielsätze", "## 5.").split("\n").filter((z) => z.startsWith("| ") && !z.startsWith("| Lumisch") && !z.startsWith("|---"))
    .map((z) => { const c = zellen(z); return { lumisch: c[0], deutsch: c[2] }; });
  // Abschnitt 6: Wörterbuch
  const eintraege = [];
  let gruppe = null;
  for (const z of abschnitt(md, "## 6. Wörterbuch", "## 7.").split("\n")) {
    if (z.startsWith("### ")) { gruppe = gruppeName(z.slice(4)); continue; }
    const m = z.match(/^\| \*\*([a-z]+)\*\* \|/);
    if (!m) continue;
    const [, deutsch, hinweis = ""] = zellen(z);
    const satz = saetze.find((s) => woerterIn(s.lumisch).includes(m[1]));
    eintraege.push({ wort: m[1], deutsch, gruppe, ...(ohneAlt(hinweis) ? { hinweis: ohneAlt(hinweis) } : {}), ...(satz ? { beispiel: satz } : {}) });
  }
  const rang = (g) => { const i = GRUPPEN_REIHENFOLGE.findIndex((x) => g.startsWith(x)); if (i < 0) throw new Error(`Gruppe ohne Platz in der Reihenfolge: ${g}`); return i; };
  const imPlan = new Set(plan.map((p) => p.wort).filter(Boolean));
  const woerterbuch = eintraege.map((e, i) => ({ e, i })).sort((a, b) => rang(a.e.gruppe) - rang(b.e.gruppe) || a.i - b.i)
    .map(({ e }) => ({ ...e, ...(imPlan.has(e.wort) ? { im_plan: true } : {}) }));
  return {
    plan,
    // kurze Liste für die Abfrage (Ablenkwörter): alle Wörter mit ihrer ersten Bedeutung
    woerter: woerterbuch.map((w) => ({ wort: w.wort, deutsch: w.deutsch.split(",")[0].trim() })),
    woerterbuch,
    hinweis: "Lumisch nach der Wortprüfung vom 05.10.2026: alle 500 Wörter des Wörterbuchs, Plan in 21 Tagen. Neue Wörter nach Tag 21 kommen nach Gruppen: Unten, Wie etwas ist, Farben, Gefühle, Strom und Notfall, Gespräch und Zeit, die Philosophie und „Zahl und Quant“ zuletzt. In langen Zahlen wird nach je drei Ziffern tep gesprochen.",
  };
}

async function main() {
  const md = await readFile(QUELLE, "utf8");
  const j = JSON.parse(await readFile(ZIEL, "utf8"));
  j.lumisch = lumischAusBeilage(md);
  await writeFile(ZIEL, JSON.stringify(j, null, 1) + "\n");
  console.log(`Plan ${j.lumisch.plan.length} Tage, Wörterbuch ${j.lumisch.woerterbuch.length} Wörter (${j.lumisch.woerterbuch.filter((w) => w.beispiel).length} mit Beispiel)`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
