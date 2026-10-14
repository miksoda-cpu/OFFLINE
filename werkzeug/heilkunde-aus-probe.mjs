#!/usr/bin/env node
// Nr. 28: Naturheilkunde, erste Fassung. Liest die Inhalte wortgleich aus der Probe v7 (HTML von Bill, liegt in
// „OFFLINE - Home/naturheilkunde/probe-v7.html“, nicht im Repo) und schreibt pakete/heilkunde-grundstock/inhalt/heilkunde.json.
// Nur Daten: Beschwerden, Gruppen, Karten und die festen Sätze der Seite. Gestaltung und Zeichen macht die App.
//   node werkzeug/heilkunde-aus-probe.mjs <probe-v7.html> <ziel.json>
import { readFileSync, writeFileSync } from "node:fs";
const [quelle, ziel] = process.argv.slice(2);
const html = readFileSync(quelle, "utf8");
const block = (name, ende) => { const i = html.indexOf(`const ${name}=`); const j = html.indexOf(ende, i); return html.slice(i + `const ${name}=`.length, j + ende.length - 1); };
const wert = (src) => Function(`"use strict"; return (${src});`)();
const BES = wert(block("BES", "};")), GR = wert(block("GR", "};")), D = wert(block("D", "\n};"));
const satz = (vor, nach) => { const i = html.indexOf(vor) + vor.length; return html.slice(i, html.indexOf(nach, i)); };
const texte = {
  reiter: ["Was plagt dich?", "Obst · Gemüse · Kräuter · Pilze"],
  hinweis: satz('<p class="hinweis">', "</p>"),
  essen_hinweis: satz('k==="essen"?`<p class="hinweis">', "</p>"),
  grundstock_titel: "Gratis-Grundstock",
  grundstock: [...satz('<div class="umfang"><b>Gratis-Grundstock</b>', "</div>").matchAll(/<p>(.*?)<\/p>/g)].map((m) => m[1]),
  selbst: satz('<div class="selbst"><p>', "</p>"),
  notruf: { at: [...satz('<div class="not">', "</div></div>").matchAll(/<span>(.*?)<\/span>/g)].map((m) => m[1]) },
  moeglichkeiten: "Möglichkeiten", aus_dem_vorrat: "Aus dem Vorrat", zum_essen: "zum Essen",
  beispiel: satz('<span class="bsp">', "</span>"),
  hilft_bei: "Hilft bei", fakten: ["Wo", "Anbauen", "Essen"],
  foto: satz('<div class="foto">', "</div>"),
  erkennen: "So erkennst du ihn", verwechslung: "Verwechslung:", mit_fotos: "mit Fotos ansehen ›",
  was_tun: "Was tun", so_gehts: "So geht's", folgen: "Was passiert, wenn man es isst:", kueche: "In der Küche",
  wer_nicht: "Wer nicht:", mehr: "Mehr dazu", zurueck: "‹ Zurück",
};
// Prüfen, dass die festen Sätze so in der Probe stehen
for (const t of [texte.reiter[0], texte.reiter[1], texte.hinweis, texte.essen_hinweis, texte.selbst, texte.beispiel, texte.foto, texte.erkennen, texte.verwechslung, texte.mit_fotos, texte.was_tun, texte.so_gehts, texte.folgen, texte.kueche, texte.wer_nicht, texte.mehr, texte.moeglichkeiten, texte.aus_dem_vorrat, texte.zum_essen, texte.hilft_bei, ...texte.fakten, ...texte.grundstock, ...texte.notruf.at])
  if (!html.includes(t)) throw new Error(`nicht in der Probe: ${t}`);
// Nachtrag 2 zu Nr. 28 (Bill, 14.10.): erster Satz im grünen Kasten
texte.grundstock.unshift("Was heute gratis ist, bleibt gratis.");
// Deutschland und Schweiz (Nr. 28, Punkt 2: keine österreichische Nummer): gleicher Satz, die Nummer des Landes.
// Deutschland hat keinen bundesweiten Giftnotruf (je Land ein Giftinformationszentrum), darum dort nur die 112.
texte.hinweis = { at: texte.hinweis, ch: texte.hinweis, de: texte.hinweis.replace("144", "112") };
texte.notruf.ch = ["Vergiftung: 145", "Rettung: 144"];
texte.notruf.de = ["Rettung: 112"];
const karten = Object.entries(D).map(([id, x]) => ({ id, ...x }));
writeFileSync(ziel, JSON.stringify({ version: 1, quelle: "Probe v7 (Bill, 14.10.2026)", beschwerden: BES, gruppen: GR, karten, texte }, null, 2) + "\n");
console.log(`${karten.length} Karten, ${Object.keys(BES).length} Beschwerden → ${ziel}`);
