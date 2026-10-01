#!/usr/bin/env node
// Holt ein gemeinfreies Werk von de.wikisource.org als reine Absätze (Roman der Woche, Tagesseite).
//
//   node werkzeug/wikisource-holen.mjs <Seitentitel> "<Anfang des Textes>" <ziel.json> ["<Beginn des Nachspanns>"]
//
// Übernommen wird nur der Werktext: ohne Kopf (Textdaten), Seitenzahlen, Fußnotenzeichen und die Anmerkungen von
// Wikisource. Zentrierte kurze Zeilen werden zu Überschriften („## …“), Gedichte behalten ihre Zeilen. Die Textdaten
// (Autor, Vorlage, Verlag, Jahr, Scans, Bearbeitungsstand) kommen als Herkunft mit. Nur Seiten im Stand „fertig“.

import { writeFile } from "node:fs/promises";

const [titel, anfang, ziel, nachspann] = process.argv.slice(2);
if (!titel || !anfang || !ziel) throw new Error("Verwendung: wikisource-holen.mjs <Seitentitel> \"<Anfang>\" <ziel.json>");
const UA = { "User-Agent": "OFFLINE-App (github.com/miksoda-cpu/OFFLINE; Redaktion Tagesseite)" };
// Wikisource drosselt bei vielen Abfragen („too many requests“): dann höflich warten und es noch einmal versuchen
async function api(q) {
  for (let versuch = 1; ; versuch++) {
    const t = await fetch(`https://de.wikisource.org/w/api.php?${q}&format=json&formatversion=2`, { headers: UA }).then((r) => r.text());
    try { return JSON.parse(t); } catch {
      if (versuch >= 6) throw new Error(`Wikisource antwortet nicht: ${t.slice(0, 80)}`);
      await new Promise((r) => setTimeout(r, 30000));
    }
  }
}

const quell = await api(`action=query&prop=revisions&rvprop=content|ids&rvslots=main&titles=${encodeURIComponent(titel)}&redirects=1`);
const seite = quell.query.pages[0];
const wikitext = seite.revisions[0].slots.main.content;
const feldAus = (text, k) => (text.match(new RegExp(`\\|\\s*${k}\\s*=([^\\n]*)`)) || [])[1]?.trim() ?? "";
// Seiten mit {{Navigation2}} (Teil eines Sammelbands) tragen nur STATUS; die Textdaten stehen auf der Seite des Bandes (ARTIKEL)
let kopf = wikitext;
// Seiten mit {{Navigation|Werk|vorher|nachher|Autor|STATUS=…}} (Kapitel eines Werks) ebenso; die Textdaten stehen auf der Werkseite
const nav1 = wikitext.match(/\{\{Navigation\|([^|}]+)\|/);
const nav = /\{\{Navigation2/.test(wikitext) || !!nav1;
if (nav) {
  const band = nav1 ? nav1[1].trim() : feldAus(wikitext, "ARTIKEL").replace(/^\[\[|\]\]$/g, "").split("|")[0];
  const b = await api(`action=query&prop=revisions&rvprop=content&rvslots=main&titles=${encodeURIComponent(band)}&redirects=1`);
  kopf = b.query.pages[0].revisions[0].slots.main.content;
}
const feld = (k) => (k === "TITEL" && nav && !nav1 ? feldAus(wikitext, "KAPITEL") : feldAus(kopf, k)) || (k === "AUTOR" ? feldAus(wikitext, "AUTOR") : "");
const stand = (nav ? feldAus(wikitext, "STATUS") : feldAus(wikitext, "BEARBEITUNGSSTAND")).replace(/\}\}.*$/, "").trim().toLowerCase();
if (stand !== "fertig") throw new Error(`${titel}: Bearbeitungsstand „${stand}“, nicht „fertig“`);
const klar = (s) => s.replace(/&nbsp;/g, " ").replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1").replace(/\{\{GBS\|([^|}]+)[^}]*\}\}/g, "Google Books $1").replace(/\[\S+ ([^\]]+)\]/g, "$1").replace(/'''?/g, "").trim();

const html = (await api(`action=parse&page=${encodeURIComponent(seite.title)}&prop=text&disableeditsection=1`)).parse.text;
const entity = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");

let h = html;
const ende = h.search(/<h2[^>]*>(?:(?!<\/h2>).)*Anmerkungen/s); if (ende > 0) h = h.slice(0, ende);
h = h.replace(/<ol class="references">.*?<\/ol>/gs, "")             // Fußnoten der Vorlage
  .replace(/<span class="PageNumber"[^>]*>.*?<\/span>/gs, "")      // Seitenzahlen
  .replace(/<sup[^>]*class="reference"[^>]*>.*?<\/sup>/gs, "")        // Fußnotenzeichen
  .replace(/<span style="display:none;?">.*?<\/span>/gs, "")
  .replace(/<table.*?<\/table>/gs, "");                                // Kopf mit Textdaten
// Gedichte: Zeilen behalten
h = h.replace(/<div class="poem">(.*?)<\/div>/gs, (_, g) => `\n@@GEDICHT@@${g.replace(/\n/g, "").replace(/<br\s*\/?>/g, "@@ZEILE@@").replace(/<\/p>\s*<p>/g, "@@ZEILE@@@@ZEILE@@")}@@ENDE@@\n`);
// Zentrierte Zeilen → Überschrift
h = h.replace(/<div style="[^"]*text-align:\s*center[^"]*">(.*?)<\/div>/gs, (_, t) => `\n@@UEBER@@${t}\n`);
h = h.replace(/<br\s*\/?>/g, " ").replace(/<\/(p|div|h\d|li|dd)>/g, "\n").replace(/<[^>]+>/g, "");
h = entity(h);
const zeilen = h.split(/\n/).map((z) => z.replace(/[ \t ]+/g, " ").trim()).filter(Boolean);
// „-“: vom Anfang an (Titelzeilen werden später beim Teilen weggelassen)
const start = anfang === "-" ? 0 : zeilen.findIndex((z) => z.replace(/@@\w+@@/g, "").startsWith(anfang));
if (start < 0) throw new Error(`${titel}: Anfang „${anfang}“ nicht gefunden`);
// Eine Überschrift direkt vor dem Anfang (z. B. „Erstes Kapitel.“) gehört dazu
let von = start; while (von > 0 && zeilen[von - 1].startsWith("@@UEBER@@") && zeilen[von - 1].length < 60) von--;
const absaetze = [];
for (const z of zeilen.slice(von).filter((x) => !x.startsWith("↑"))) {
  if (z.startsWith("@@GEDICHT@@")) { absaetze.push(z.replace("@@GEDICHT@@", "").replace("@@ENDE@@", "").split("@@ZEILE@@").map((x) => x.trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim()); continue; }
  if (z.startsWith("@@UEBER@@")) { const t = z.replace("@@UEBER@@", "").trim(); if (t) absaetze.push(`## ${t}`); continue; }
  absaetze.push(z.replace(/@@\w+@@/g, "").trim());
}
// Seitengrenzen der Vorlage trennen Absätze mitten im Satz: Endet ein Absatz ohne Satzzeichen, gehört der nächste dazu
// (bei Trennstrich am Ende ohne Leerzeichen, wenn der nächste klein beginnt).
for (let i = absaetze.length - 2; i >= 0; i--) {
  const a = absaetze[i], b = absaetze[i + 1];
  if (a.startsWith("## ") || b.startsWith("## ") || a.includes("\n") || b.includes("\n")) continue;
  if (/[.!?:;»«"“”„'’)\]–—]$/.test(a)) continue;
  absaetze.splice(i, 2, /[-¬]$/.test(a) && /^\p{Ll}/u.test(b) ? a.slice(0, -1) + b : `${a} ${b}`);
}
// Nachspann der Vorlage (Druckerei, Druckfehlerliste) abschneiden
if (nachspann) {
  const n = absaetze.findIndex((x) => x.replace(/^## /, "").startsWith(nachspann));
  if (n < 0) throw new Error(`${titel}: Nachspann „${nachspann}“ nicht gefunden`);
  absaetze.splice(n);
}
// Reste ohne Text (eine einzelne Klammer aus einer Vorlage) weg; „## 1.“ + „## Ein Nachtstück.“ → „## 1. Ein Nachtstück.“
for (let i = absaetze.length - 1; i >= 0; i--) if (!absaetze[i] || /^[\[\]{}|]+$/.test(absaetze[i])) absaetze.splice(i, 1);
for (let i = absaetze.length - 2; i >= 0; i--) if (/^## [0-9IVXL]+\.$/.test(absaetze[i]) && absaetze[i + 1].startsWith("## ")) absaetze.splice(i, 2, `${absaetze[i]} ${absaetze[i + 1].slice(3)}`);
const woerter = absaetze.join(" ").split(/\s+/).length;
// Fortsetzungsromane der Gartenlaube ({{GartenlaubenArtikel}}): Vorlage ist der Erstdruck in der Zeitschrift
const gl = /\{\{GartenlaubenArtikel/.test(wikitext);
const hefte = gl ? feldAus(wikitext, "Heft") : "";
await writeFile(ziel, JSON.stringify({
  werk: klar(feld("TITEL")), autor: klar(feld("AUTOR")),
  quelle: {
    url: `https://de.wikisource.org/wiki/${encodeURIComponent(seite.title.replaceAll(" ", "_"))}`, revision: seite.revisions[0].revid,
    herkunft: gl ? `Die Gartenlaube, Jahrgang ${feldAus(wikitext, "JAHR")}, Heft ${hefte}` : klar(feld("HERKUNFT")),
    verlag: gl ? "Ernst Keil" : klar(feld("VERLAG")), jahr: gl ? feldAus(wikitext, "JAHR") : feld("ERSCHEINUNGSJAHR"),
    ort: gl ? "Leipzig" : klar(feld("ERSCHEINUNGSORT")), scans: gl ? "Scans auf Wikisource (Die Gartenlaube)" : klar(feld("QUELLE")), stand, herausgeber: klar(feld("HERAUSGEBER")), auflage: klar(feld("AUFLAGE")),
  },
  woerter, absaetze,
}, null, 1) + "\n");
console.log(`${titel}: ${absaetze.length} Absätze, ${woerter} Wörter → ${ziel}`);
