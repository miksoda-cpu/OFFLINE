#!/usr/bin/env node
// Paket „wir“: die 180 Tipps aus der Session (bill/eingang/2026-09-29-bill/material/pakete/wir/inhalt/tipps.json)
// in das Format der App bringen (web/wesen.js, passtBedingung). Aufruf: node pakete/wir/tipps-umwandeln.mjs
// - Sorten klein (App → app).
// - Bedingungen von Text in Daten mit festem Wortschatz. profil.* gibt es in der App noch nicht: diese Tipps fallen weg.
// - Tipps, die von sich sprechen (ich, mir, mich, mein …), bekommen „benannt“: erst nach der Namensgabe.
// - app-001 korrigiert: Der Tresor liegt links in der Seitenleiste.
// - Tipps, die einen Zustand behaupten, kommen nur, wenn er stimmt (ZUSTAND, Auftrag 2026-09-30-dezember-und-tippfix).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ICH } from "../../web/wesen.js";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const QUELLE = path.join(WURZEL, "bill", "eingang", "2026-09-29-bill", "material", "pakete", "wir", "inhalt", "tipps.json");
const ZIEL = path.join(WURZEL, "pakete", "wir", "inhalt", "tipps.json");

const WOCHENTAG = { mo: 1, di: 2, mi: 3, do: 4, fr: 5, sa: 6, so: 7 };
const ALTER = { wasser_alter_monate: "c-0-0", batterien_alter_monate: "c-1-1" };
const KORREKTUR = {
  "app-001": "Der Tresor ist das kleine Schloss links in der Seitenleiste. Nur du kennst das Passwort. Ich auch nicht.",
  // Die App kennt den Treffpunkt als Bereit-Bestätigung, nicht als Eintrag im Tresor
  "alltag-020": "Euer Treffpunkt steht. Weiß ihn wirklich die ganze Familie? Frag heute Abend. Ohne Anlass.",
};
// Zusätzliche Bedingungen für Tipps, die einen Zustand behaupten (Bereit-Positionen aus web/bereit.js)
const ZUSTAND = {
  "alltag-001": { alter: { position: "c-0-0", ab_monate: 9 } },  // „Dein Wasser ist neun Monate alt.“
  "alltag-002": { offen: "c-3-2" },                               // „Du hast noch keinen Treffpunkt eingetragen.“
  "alltag-020": { alter: { position: "c-3-2", ab_monate: 0 } },  // Treffpunkt bestätigt
  "alltag-026": { alter: { position: "c-0-0", ab_monate: 12 }, verfallen: true }, // „… weil das Wasser abläuft.“
  "alltag-028": { alter: { position: "probeabend", ab_monate: 6 } }, // „Der Probeabend war vor sechs Monaten.“
};

/** "monat>=6&monat<=8" → { monat: [6,7,8] }. Gibt null zurück, wenn der Tipp wegfallen soll (profil.*). */
export function bedingung(text) {
  if (!text) return {};
  const b = {};
  const bereich = {};
  for (const teil of text.split("&")) {
    const m = teil.trim().match(/^([a-z_.]+)\s*(>=|<=|=|>|<)?\s*([\w.-]*)$/);
    if (!m) throw new Error(`Bedingung nicht lesbar: ${text}`);
    const [, k, op = "", v] = m;
    if (k.startsWith("profil.")) return null;
    if (k === "einstellung.digital") b.einstellung = "digital";
    else if (k === "ansicht" && op === "=") b.ansicht = v;
    else if (k === "monat" && op === "=") b.monat = Number(v);
    else if (k === "monat" && (op === ">=" || op === "<=")) bereich[op] = Number(v);
    else if (k === "tag" && op === "=") b.tag = Number(v);
    else if (k === "stunde" && op === "=") b.stunde = Number(v);
    else if (k === "wochentag" && op === "=" && WOCHENTAG[v]) b.wochentag = WOCHENTAG[v];
    else if (k === "score" && op === ">=") b.score_ab = Number(v);
    else if (k === "score" && op === "<") b.score_unter = Number(v);
    else if (ALTER[k] && op === ">") b.alter = { position: ALTER[k], ab_monate: Number(v) };
    else if (k === "kalender.zeitumstellung_in_tagen" && op === "<=") b.zeitumstellung_in_tagen = Number(v);
    else throw new Error(`Bedingung unbekannt: ${teil} (in ${text})`);
  }
  if (bereich[">="] != null || bereich["<="] != null) {
    const von = bereich[">="] ?? 1, bis = bereich["<="] ?? 12;
    b.monat = Array.from({ length: bis - von + 1 }, (_, i) => von + i);
  }
  return b;
}

async function main() {
  const q = JSON.parse(await readFile(QUELLE, "utf8"));
  const tipps = [], weg = [], benannt = [];
  for (const t of q.tipps) {
    const b = bedingung(t.bedingung);
    if (b === null) { weg.push(`${t.id} (${t.bedingung})`); continue; }
    const text = KORREKTUR[t.id] ?? t.text;
    Object.assign(b, ZUSTAND[t.id] ?? {});
    if (ICH.test(text)) { b.benannt = true; benannt.push(t.id); }
    tipps.push({ id: t.id, sorte: t.sorte.toLowerCase(), text, ...(t.gewicht && t.gewicht !== 1 ? { gewicht: t.gewicht } : {}), ...(Object.keys(b).length ? { bedingung: b } : {}) });
  }
  const aus = {
    hinweis: "Tipps der Lumi. Felder: id, sorte (app, alltag, wissen, weisheit, laune, heute, digital), text, optional gewicht und bedingung. Bedingungen sind Daten, kein Code (web/wesen.js, passtBedingung): ansicht, einstellung, monat (Zahl oder Liste), tag, wochentag (1 = Mo … 7 = So), stunde, score_unter, score_ab, verfallen, benannt (erst nach der Namensgabe; Pflicht bei jedem Tipp, der von sich spricht), alter { position, ab_monate }, zeitumstellung_in_tagen. Unbekannte Wörter: Der Tipp kommt nicht. Gebaut mit pakete/wir/tipps-umwandeln.mjs aus dem Bestand der Session (180 Tipps).",
    tipps,
  };
  await writeFile(ZIEL, JSON.stringify(aus, null, 2) + "\n");
  console.log(`${tipps.length} Tipps geschrieben (${benannt.length} mit „benannt“), ${weg.length} weggelassen: ${weg.join(", ")}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
