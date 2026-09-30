#!/usr/bin/env node
// Erzeugt die Quellen der Tagespakete (art = "tage") aus der Redaktionsablage pakete/tage/quelle/:
//   raetsel.json            eigene Tagesrätsel, eines pro Tag ab START
//   romane/*.json           gemeinfreie Werke von Wikisource (werkzeug/wikisource-holen.mjs), je eines pro Woche ab Montag
// Ergebnis: pakete/tage-JJJJ-MM/ (paket.quelle.json, inhalt/tage.json, inhalt/herkunft.md), ein Paket je Kalendermonat.
// Gebaut und signiert werden sie wie alle Textpakete (Workflow „Inhaltspakete“, textpakete).
//
//   node pakete/tage/bauen.mjs

import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tageBereichFehler, tageInhaltFehler } from "../../paket-kit/tage-format.mjs";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const PAKETE = path.resolve(HIER, "..");
const START = "2026-10-01"; // erstes Rätsel
// Roman der Woche: Reihenfolge und Wochenbeginn (immer ein Montag)
const ROMANE = [
  { datei: "kleider-machen-leute", ab: "2026-10-05", todesjahr: 1890 },
  { datei: "die-judenbuche", ab: "2026-10-12", todesjahr: 1848 },
  { datei: "taugenichts", ab: "2026-10-19", todesjahr: 1857 },
  { datei: "der-schimmelreiter", ab: "2026-10-26", todesjahr: 1888 },
];
const TEILE = 7;

const plus = (datum, n) => { const d = new Date(datum + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const wochentag = (datum) => new Date(datum + "T12:00:00Z").getUTCDay(); // 1 = Montag

/**
 * Teilt ein Werk in sieben Tagesteile, möglichst gleich lang (Wörter). Schnitte an einer Kapitelüberschrift sind billiger
 * als mitten im Kapitel; nach einer Überschrift wird nie geschnitten. Dynamische Programmierung über die Absatzgrenzen.
 */
function teilen(absaetze) {
  // Titelzeilen am Anfang weglassen (Titel, Untertitel, Verfasser), Kapitelüberschriften bleiben
  const a = [...absaetze];
  while (a.length && a[0].startsWith("## ") && !/kapitel/i.test(a[0])) a.shift();
  const n = a.length, w = a.map((x) => x.split(/\s+/).length);
  const vor = [0]; for (const x of w) vor.push(vor.at(-1) + x);
  const ziel = vor[n] / TEILE;
  const kapitel = a.some((x) => /^## .*kapitel/i.test(x));
  const istUeber = (i) => a[i]?.startsWith("## ") && a[i] !== "## * * *";
  // Kosten eines Schnitts vor Absatz i
  const schnitt = (i) => (i === 0 || i === n ? 0 : istUeber(i - 1) ? Infinity : istUeber(i) ? 0 : kapitel ? 0.35 : 0);
  const teil = (von, bis) => ((vor[bis] - vor[von] - ziel) / ziel) ** 2;
  const K = Array.from({ length: TEILE + 1 }, () => new Array(n + 1).fill(Infinity));
  const Z = Array.from({ length: TEILE + 1 }, () => new Array(n + 1).fill(-1));
  K[0][0] = 0;
  for (let t = 1; t <= TEILE; t++) for (let bis = 1; bis <= n; bis++) {
    const c = schnitt(bis); if (c === Infinity) continue;
    for (let von = t - 1; von < bis; von++) {
      if (K[t - 1][von] === Infinity) continue;
      const k = K[t - 1][von] + teil(von, bis) + c;
      if (k < K[t][bis]) { K[t][bis] = k; Z[t][bis] = von; }
    }
  }
  const grenzen = [n];
  for (let t = TEILE, i = n; t > 0; t--) { i = Z[t][i]; grenzen.unshift(i); }
  const teile = [];
  for (let k = 0; k < TEILE; k++) teile.push(a.slice(grenzen[k], grenzen[k + 1]));
  if (teile.some((t) => !t.length)) throw new Error("Teilung ergab einen leeren Teil");
  return teile;
}

const raetsel = JSON.parse(await readFile(path.join(HIER, "quelle", "raetsel.json"), "utf8")).raetsel;
const tage = new Map(); // datum → karten
const karte = (datum, k) => { if (!tage.has(datum)) tage.set(datum, []); tage.get(datum).push(k); };
raetsel.forEach((r, i) => karte(plus(START, i), { art: "raetsel", id: r.id, stufe: r.stufe, frage: r.frage, hinweis: r.hinweis, loesung: r.loesung, erklaerung: r.erklaerung }));

const herkunft = [];
for (const r of ROMANE) {
  if (wochentag(r.ab) !== 1) throw new Error(`${r.datei}: ${r.ab} ist kein Montag`);
  if (r.todesjahr >= 1956) throw new Error(`${r.datei}: Autor nach 1955 gestorben`);
  const w = JSON.parse(await readFile(path.join(HIER, "quelle", "romane", `${r.datei}.json`), "utf8"));
  if (w.quelle.stand !== "fertig") throw new Error(`${r.datei}: Wikisource-Stand nicht fertig`);
  const vorlage = [w.quelle.herkunft, w.quelle.verlag, w.quelle.ort, w.quelle.jahr].filter(Boolean).join(", ");
  teilen(w.absaetze).forEach((absaetze, i) => karte(plus(r.ab, i), {
    art: "kapitel", id: `${r.datei}-${i + 1}`, werk: w.werk.replace(/\.$/, ""), autor: w.autor, teil: i + 1, teile: TEILE,
    absaetze, quelle: { url: w.quelle.url, vorlage, revision: w.quelle.revision },
  }));
  herkunft.push(`- **${w.werk}** – ${w.autor} (gestorben ${r.todesjahr}). Vorlage: ${vorlage}. Text: Wikisource, ${w.quelle.url} (Version ${w.quelle.revision}, Stand „fertig“, Scans: ${w.quelle.scans}). Gemeinfrei. In sieben Tagesteile geschnitten, Wortlaut unverändert; weggelassen sind Seitenzahlen, Titelseiten, Nachspann und Anmerkungen von Wikisource. Woche ab ${r.ab}.`);
}

// Ein Paket je Kalendermonat
const monate = new Map();
for (const datum of [...tage.keys()].sort()) { const m = datum.slice(0, 7); if (!monate.has(m)) monate.set(m, []); monate.get(m).push(datum); }
for (const [monat, daten] of monate) {
  const id = `tage-${monat}`;
  const ordner = path.join(PAKETE, id);
  await rm(ordner, { recursive: true, force: true });
  await mkdir(path.join(ordner, "inhalt"), { recursive: true });
  const [j, m] = monat.split("-").map(Number);
  const bis = new Date(Date.UTC(j, m, 0)).toISOString().slice(0, 10);
  const bereich = { von: `${monat}-01`, bis };
  const inhalt = { format: 1, tage: daten.map((d) => ({ datum: d, karten: tage.get(d) })) };
  const fehler = [...tageBereichFehler(bereich), ...tageInhaltFehler(inhalt, bereich)];
  if (fehler.length) throw new Error(`${id}:\n  ${fehler.join("\n  ")}`);
  const name = new Date(Date.UTC(j, m - 1, 1)).toLocaleDateString("de-AT", { month: "long", year: "numeric", timeZone: "UTC" });
  const kapitel = daten.flatMap((d) => tage.get(d)).filter((k) => k.art === "kapitel");
  const werke = [...new Set(kapitel.map((k) => `${k.werk} (${k.autor})`))];
  await writeFile(path.join(ordner, "inhalt", "tage.json"), JSON.stringify(inhalt) + "\n");
  await writeFile(path.join(ordner, "inhalt", "herkunft.md"), `# Herkunft: Tage im ${name}\n\n## Tagesrätsel\n\nEigene Texte der Redaktion (The Digioneer, 2026), CC BY-SA 4.0. Bekannte Denkaufgaben sind neu erzählt, keine fremden Rätseltexte übernommen.\n\n## Roman der Woche\n\n${herkunft.filter((h) => werke.some((w) => h.includes(w.split(" (")[0]))).join("\n") || "In diesem Monat keiner."}\n`);
  await writeFile(path.join(ordner, "LIESMICH.md"), `# Tage im ${name}\n\n## Was\n\nTagesinhalte für die Tagesseite (art = tage): ${daten.length} Tage, je ein Tagesrätsel${kapitel.length ? `, dazu ${kapitel.length} Tagesteile des Romans der Woche` : ""}. Erzeugt mit \`node pakete/tage/bauen.mjs\` aus \`pakete/tage/quelle/\`.\n\n## Für wen\n\nAlle ab 10 Jahren. Die Romane sind Klassiker in der Rechtschreibung ihrer Zeit.\n\n## Wie geprüft\n\nRätsel nachgerechnet, Lösungen und Erklärungen gegengelesen. Romane: Autor vor 1956 gestorben, Text von Wikisource im Stand „fertig“, Vorlage ein Druck des 19. Jahrhunderts (inhalt/herkunft.md). Format mit paket-kit/tage-format.mjs geprüft.\n\n## Offene Punkte\n\nKeine Vorschau-Folien (die Tagesseite ist die Vorschau). Historische Schreibweisen (Januar, Thür) bleiben, wie sie in der Vorlage stehen.\n`);
  await writeFile(path.join(ordner, "paket.quelle.json"), JSON.stringify({
    id, titel: `Tage im ${name}`,
    beschreibung: `Für die Tagesseite: jeden Tag ein Rätsel${werke.length ? ` und ein Stück vom Roman der Woche (${werke.map((w) => w.split(" (")[0]).join(", ")})` : ""}. Tag für Tag freigeschaltet.`,
    art: "tage", tage: bereich, sprache: "de-AT",
    lizenz: "Rätsel CC BY-SA 4.0 (eigene Texte); Romane gemeinfrei (Wikisource), Herkunft in inhalt/herkunft.md",
    herausgeber: "The Digioneer / digitalworld Academy", pro: false, preis: "gratis", pruefstatus: "redaktion", kategorie: "jeden-tag", alter_ab: 10, braucht_netz: false, abnahme: "Redaktion (Code), 30.09.2026: Rätsel nachgerechnet, Romane gegen die Wikisource-Textdaten geprüft",
    app_min: "0.3.0", aenderungen: `Erste Ausgabe: ${daten.length} Tage.`,
    quellen: [{ id: "redaktion", name: "Eigene Rätsel der Redaktion", url: "" }, { id: "wikisource", name: "Wikisource (gemeinfreie Texte)", url: "https://de.wikisource.org" }],
  }, null, 2) + "\n");
  console.log(`${id}: ${daten.length} Tage (${daten[0]} bis ${daten.at(-1)}), ${kapitel.length} Kapitel, ${(JSON.stringify(inhalt).length / 1024).toFixed(0)} kB`);
}
