#!/usr/bin/env node
// Bis wann reicht der Vorrat an Tagespaketen im öffentlichen Katalog? (Regel „zwei Monate voraus“, bill/README.md)
//   node werkzeug/vorrat-stand.mjs [heute JJJJ-MM-TT]
// Prüft die Signatur des Katalogs, sucht die lückenlose Kette von Tagespaketen ab heute und nennt den letzten Tag.
// Exit 0; unter 45 Tagen Abstand steht eine Warnung in der Ausgabe.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { katalogPruefen } from "./paket-lib.mjs";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const URL_KATALOG = "https://offline-pakete.fsn1.your-objectstorage.com/katalog/katalog.json";
const heute = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const holen = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(`${u}: ${r.status}`); return Buffer.from(await r.arrayBuffer()); };

const bekannte = JSON.parse(await readFile(path.join(WURZEL, "schluessel", "oeffentlich.json"), "utf8")).schluessel;
const k = katalogPruefen(await holen(URL_KATALOG), JSON.parse((await holen(URL_KATALOG.replace(/katalog\.json$/, "katalog.sig"))).toString("utf8")), bekannte);
if (!k.ok) throw new Error(`Katalog abgelehnt: ${k.grund}`);
const bereiche = k.katalog.pakete.filter((p) => p.art === "tage" && p.status === "verfuegbar" && p.tage?.von).map((p) => ({ id: p.id, ...p.tage })).sort((a, b) => a.von.localeCompare(b.von));
const plus = (d, n) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
let bis = plus(heute, -1);
for (const b of bereiche) if (b.von <= plus(bis, 1) && b.bis > bis) bis = b.bis;
const tage = Math.round((Date.parse(bis + "T12:00:00Z") - Date.parse(heute + "T12:00:00Z")) / 86400000);
console.log(`Tagespakete im Katalog: ${bereiche.map((b) => b.id).join(", ") || "keine"}`);
console.log(`Vorrat reicht bis ${bis}, ${tage} Tage ab ${heute}.`);
if (tage < 45) console.log(`ACHTUNG: unter 45 Tagen. Vorschlag für das nächste Paket fällig (bill/README.md).`);
