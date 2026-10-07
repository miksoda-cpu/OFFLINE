#!/usr/bin/env node
// Pause-Inhalte der Pause-Session übernehmen (Auftrag 2026-10-07-17, App 0.7.1; geprüft am 07.10.2026).
// Aufruf: node pakete/pause/inhalte-uebernehmen.mjs <ordner mit den JSON-Dateien der Beilage>
// - OFFLINE-Pause-Fehler-Geschichten.json → pause.json „fehler“ (60 Geschichten, 12 je Stufe, ersetzt die 15 alten)
// - OFFLINE-Pause-Ruhe-Varianten.json    → pause.json „ruhe“ (je 30 Varianten Tag rückwärts und Atemfenster)
// - OFFLINE-Pause-Neue-Formen.json       → pause.json „kaffeehaus“, „kopfnuss“, „fluss“ (je 25 Aufgaben) und drei Formen
// - OFFLINE-Pause-Lumisch-Aufgaben.json  → pakete/lumisch/inhalt/lumisch.json „aufgaben“ (100, 20 je Stufe)
// Fünf Stufen je Form (OFFLINE-Pause-Stufen.md, Abschnitt 9.2), Start ab 14 auf Stufe 3, der Pilz auf 5 von 10.
// Das Feld intern.trainiert bleibt in den Daten, die App zeigt es nie.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const quelle = process.argv[2];
if (!quelle) { console.error("Verwendung: node pakete/pause/inhalte-uebernehmen.mjs <ordner>"); process.exit(2); }
const lies = async (f) => JSON.parse(await readFile(path.join(quelle, f), "utf8"));
const ohne = (o, ...k) => Object.fromEntries(Object.entries(o).filter(([x]) => !k.includes(x)));

const PAUSE = path.join(HIER, "inhalt", "pause.json"), LUMISCH = path.join(HIER, "..", "lumisch", "inhalt", "lumisch.json");
const d = JSON.parse(await readFile(PAUSE, "utf8"));
const fehler = await lies("OFFLINE-Pause-Fehler-Geschichten.json");
const ruhe = await lies("OFFLINE-Pause-Ruhe-Varianten.json");
const neu = await lies("OFFLINE-Pause-Neue-Formen.json");
const lumisch = await lies("OFFLINE-Pause-Lumisch-Aufgaben.json");

d.stufen_woerter = ["leicht", "gemütlich", "mit Biss", "knifflig", "Knackpunkt"];
// Geschichten mit der Lumi gibt es nur, wenn die Lumi an ist. Die Beilage kennzeichnet sie mit art „Lumi“; eine Geschichte,
// die die Lumi(s) nur im Text nennt (feh-5-12), gilt ebenso.
const mitLumi = (g) => g.nur_mit_lumi || g.art === "Lumi" || /\bLumi/.test([...g.saetze, g.erklaerung].join(" "));
// Die Beilage zählt den falschen Satz ab 1, die App ab 0. Geschichten, in denen noch der Name „Susi“ steht (laut Prüfung
// sollte er nirgends mehr vorkommen), bleiben draußen, bis Bill sie korrigiert hat.
const zurueck = fehler.geschichten.filter((g) => /Susi/.test(JSON.stringify(g))).map((g) => g.id);
d.fehler = fehler.geschichten.filter((g) => !zurueck.includes(g.id)).map((g) => {
  if (!(Number.isInteger(g.fehler) && g.fehler >= 1 && g.fehler <= g.saetze.length)) throw new Error(`${g.id}: fehler ${g.fehler} passt nicht zu ${g.saetze.length} Sätzen (ab 1 gezählt)`);
  return { ...ohne(g, "form"), fehler: g.fehler - 1, ...(mitLumi(g) ? { nur_mit_lumi: true } : {}) };
});
if (zurueck.length) console.log(`Zurückgestellt (Name „Susi“): ${zurueck.join(", ")}`);
d.ruhe = { rueckwaerts: ruhe.tag_rueckwaerts.map((v) => ohne(v, "form")), atem: ruhe.atemfenster.map((v) => ohne(v, "form")) };
d.kaffeehaus = neu.kaffeehaus_logik; d.kopfnuss = neu.kopfnuss; d.fluss = neu.gedanke_am_fluss;

const fuenf = { stufen: 5, start: 3 };
for (const f of d.formen) {
  if (f.id === "pilz") f.zone = { stufen: 10, start: 5 };
  if (["fehler", "lumisch", "zeitgefuehl"].includes(f.id)) f.zone = { ...fuenf };
}
const ALLE = ["J", "M1", "M2", "A"];
const NEUE_FORMEN = [
  { id: "kaffeehaus", titel: "Kaffeehaus-Logik", gruppe: "raetsel", art: ["kraft", "beweglichkeit"], trainiert: ["Sl"], dauer: { von: 40, bis: 180 }, alter: ALLE, tageszeit: "jederzeit",
    einladung: "Ein kleines Rätsel am Kaffeehaustisch. Wer trinkt was, wer sitzt wo?", zone: { ...fuenf }, herkunft: "Pause-Session 07.10.2026, Neue Formen", beim: "bei der Kaffeehaus-Logik" },
  { id: "kopfnuss", titel: "Kopfnuss", gruppe: "raetsel", art: ["kraft", "beweglichkeit"], trainiert: ["Tp"], dauer: { von: 30, bis: 180 }, alter: ALLE, tageszeit: "jederzeit",
    einladung: "Eine Aufgabe zum Rechnen und Knobeln, ganz im Kopf.", zone: { ...fuenf }, herkunft: "Pause-Session 07.10.2026, Neue Formen", beim: "bei der Kopfnuss" },
  { id: "fluss", titel: "Ein Gedanke am Fluss", gruppe: "ruhe", art: ["beweglichkeit"], trainiert: ["Sp"], dauer: { von: 60, bis: 180 }, alter: ALLE, tageszeit: "jederzeit",
    einladung: "Ein Gedanke zum Nachdenken. Es gibt kein Richtig und kein Falsch.", zone: { ...fuenf }, herkunft: "Pause-Session 07.10.2026, Neue Formen", beim: "beim Gedanken am Fluss" },
];
const vorhanden = new Set(d.formen.map((f) => f.id));
const atem = d.formen.findIndex((f) => f.id === "atem");
d.formen.splice(atem + 1, 0, ...NEUE_FORMEN.filter((f) => !vorhanden.has(f.id)));
await writeFile(PAUSE, JSON.stringify(d, null, 1) + "\n");

const l = JSON.parse(await readFile(LUMISCH, "utf8"));
l.aufgaben = lumisch.aufgaben.map((a) => ohne(a, "form"));
await writeFile(LUMISCH, JSON.stringify(l, null, 1) + "\n");
console.log(`pause.json: ${d.fehler.length} Geschichten (${d.fehler.filter((g) => g.nur_mit_lumi).length} nur mit Lumi), Ruhe ${d.ruhe.rueckwaerts.length} + ${d.ruhe.atem.length}, neue Formen ${d.kaffeehaus.length}/${d.kopfnuss.length}/${d.fluss.length}; lumisch.json: ${l.aufgaben.length} Aufgaben`);
