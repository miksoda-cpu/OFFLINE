#!/usr/bin/env node
// OFFLINE Paket-Kit – Prüfprogramm für Quellordner. Siehe PFLICHTENHEFT.md.
// Aufruf:  node pruefen.mjs <quellordner> [--vorher <alter-quellordner>]
// Node ≥ 20, keine Abhängigkeiten. Schreibt PRUEFBERICHT.md in den Quellordner.

import { readFile, writeFile, readdir, lstat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ARTEN = ["inhalt", "zim", "karte", "modell", "kurs", "software", "modul"];
const PREISE = ["gratis", "pro", "kauf"];
const PRUEFSTATUS = ["redaktion", "herausgeber", "community"];
const ALTER = [0, 6, 10, 14, 18];
const KATEGORIEN = ["ernstfall", "wissen", "jeden-tag", "du-und-die-deinen", "unterwegs", "verbindung", "miteinander", "aussehen"];
const ROLLEN = ["wofuer", "aussehen", "inhalt", "platz", "herkunft"];
const TYPEN = [".json", ".md", ".txt", ".html", ".css", ".js", ".svg", ".png", ".webp", ".jpg", ".mp3", ".ogg", ".pdf", ".zim", ".pmtiles", ".gguf"];
const BILDTYPEN = [".svg", ".webp", ".png", ".jpg"];
const PFAD_OK = /^[a-z0-9._\-/]+$/;
const ID_OK = /^[a-z0-9-]{2,40}$/;
const VERBOTEN = [
  [/\bfetch\s*\(/, "fetch()"], [/XMLHttpRequest/, "XMLHttpRequest"], [/\bWebSocket\b/, "WebSocket"],
  [/\bEventSource\b/, "EventSource"], [/sendBeacon/, "sendBeacon"], [/\beval\s*\(/, "eval()"],
  [/new\s+Function\s*\(/, "new Function()"], [/importScripts/, "importScripts"], [/<iframe/i, "<iframe>"],
  [/window\.open\s*\(/, "window.open()"],
  [/(?:src|href)\s*=\s*["']?\s*(?:https?:)?\/\//i, "externe Adresse in src/href"],
  [/@import\s+url\(\s*["']?https?:/i, "externes @import"], [/url\(\s*["']?https?:/i, "externe url() in CSS"],
];

const fehler = [], hinweise = [], redaktion = [];
const F = (m) => fehler.push(m), H = (m) => hinweise.push(m), R = (m) => redaktion.push(m);

async function dateien(wurzel, rel = "") {
  const aus = [];
  if (!existsSync(path.join(wurzel, rel))) return aus;
  for (const e of await readdir(path.join(wurzel, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    const st = await lstat(path.join(wurzel, r));
    if (st.isSymbolicLink()) { F(`Verknüpfung nicht erlaubt: inhalt/${r}`); continue; }
    if (e.isDirectory()) aus.push(...await dateien(wurzel, r));
    else aus.push({ rel: r, groesse: st.size });
  }
  return aus;
}

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
const txt = (v) => typeof v === "string" && v.trim().length > 0;

async function lesenJson(p, name) {
  try { return JSON.parse(await readFile(p, "utf8")); }
  catch (e) { F(`${name}: nicht lesbar oder kein gültiges JSON (${e.message})`); return null; }
}

async function pruefen(ordner) {
  const meta = await lesenJson(path.join(ordner, "paket.quelle.json"), "paket.quelle.json");
  if (!meta) return { meta: null, liste: [] };

  // --- Felder ---
  if (!ID_OK.test(meta.id ?? "")) F("id fehlt oder ungültig (erlaubt: a–z, 0–9, -, 2 bis 40 Zeichen)");
  if (!txt(meta.titel)) F("titel fehlt"); else if (meta.titel.length > 60) F(`titel zu lang (${meta.titel.length} > 60)`);
  if (!txt(meta.beschreibung)) F("beschreibung fehlt"); else if (meta.beschreibung.length > 240) F(`beschreibung zu lang (${meta.beschreibung.length} > 240)`);
  if (!ARTEN.includes(meta.art)) F(`art ungültig: ${meta.art} (erlaubt: ${ARTEN.join(", ")})`);
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(meta.sprache ?? "")) F("sprache fehlt oder ist kein BCP-47-Kürzel wie de-AT");
  for (const f of ["lizenz", "herausgeber", "aenderungen", "app_min"]) if (!txt(meta[f])) F(`${f} fehlt`);
  if (!Array.isArray(meta.quellen) || meta.quellen.length === 0) F("quellen fehlt oder ist leer");
  else meta.quellen.forEach((q, i) => { if (!txt(q?.name)) F(`quellen[${i}]: name fehlt`); if (typeof q?.url !== "string") F(`quellen[${i}]: url fehlt (leer ist erlaubt)`); });
  if (typeof meta.pro !== "boolean") F("pro muss true oder false sein");
  if (!PREISE.includes(meta.preis)) F(`preis ungültig: ${meta.preis}`);
  if (meta.pro === false && meta.preis !== "gratis") F("pro ist false, preis ist aber nicht gratis");
  if (!PRUEFSTATUS.includes(meta.pruefstatus)) F(`pruefstatus ungültig: ${meta.pruefstatus}`);
  if (!ALTER.includes(meta.alter_ab)) F(`alter_ab ungültig: ${meta.alter_ab} (erlaubt: ${ALTER.join(", ")})`);
  if (!KATEGORIEN.includes(meta.kategorie)) F(`kategorie ungültig: ${meta.kategorie}`);
  if (meta.braucht_netz !== false) {
    if (meta.braucht_netz === true) H("braucht_netz ist true: nur mit Begründung im LIESMICH zulässig"); else F("braucht_netz muss false sein");
  }
  if (!txt(meta.abnahme)) F("abnahme fehlt (\"keine\" oder wer abnimmt und Stand)");
  if (meta.art === "modul" && !(Number.isInteger(meta.datenversion) && meta.datenversion >= 1)) F("datenversion fehlt (ganze Zahl ab 1, Pflicht bei art = modul)");

  // --- LIESMICH ---
  const lm = path.join(ordner, "LIESMICH.md");
  if (!existsSync(lm)) F("LIESMICH.md fehlt");
  else {
    const t = await readFile(lm, "utf8");
    for (const a of ["Was", "Für wen", "Wie geprüft", "Offene Punkte"]) if (!new RegExp(`^#+\\s*${a}`, "mi").test(t)) F(`LIESMICH.md: Abschnitt „${a}" fehlt`);
  }

  // --- Dateien ---
  const inhalt = path.join(ordner, "inhalt");
  if (!existsSync(inhalt)) { F("Ordner inhalt/ fehlt"); return { meta, liste: [], ordner }; }
  const liste = await dateien(inhalt);
  let summe = 0;
  for (const d of liste) {
    summe += d.groesse;
    const name = path.posix.basename(d.rel);
    if (!PFAD_OK.test(d.rel) || d.rel.includes("..")) F(`Pfad nicht erlaubt: inhalt/${d.rel}`);
    if (name.startsWith(".")) F(`versteckte Datei: inhalt/${d.rel}`);
    if (!TYPEN.includes(path.extname(name).toLowerCase())) F(`Dateityp nicht erlaubt: inhalt/${d.rel}`);
  }

  // --- Slideshow ---
  const vs = path.join(inhalt, "vorschau", "folien.json");
  if (!existsSync(vs)) F("inhalt/vorschau/folien.json fehlt");
  else {
    const v = await lesenJson(vs, "folien.json");
    const folien = v?.folien;
    if (!Array.isArray(folien) || folien.length !== 5) F(`Slideshow: genau 5 Folien verlangt, gefunden ${folien?.length ?? 0}`);
    else {
      let bildsumme = 0;
      folien.forEach((f, i) => {
        const w = `Folie ${i + 1}`;
        if (f.nr !== i + 1) F(`${w}: nr muss ${i + 1} sein`);
        if (f.rolle !== ROLLEN[i]) F(`${w}: rolle muss ${ROLLEN[i]} sein, ist ${f.rolle}`);
        if (!txt(f.titel)) F(`${w}: titel fehlt`); else if (f.titel.length > 50) F(`${w}: titel zu lang (${f.titel.length} > 50)`);
        if (!txt(f.text)) F(`${w}: text fehlt`); else if (f.text.length > 160) F(`${w}: text zu lang (${f.text.length} > 160)`);
        if (!txt(f.alt)) F(`${w}: alt (Bildbeschreibung) fehlt`);
        const b = liste.find((d) => d.rel === `vorschau/${f.bild}`);
        if (!b) F(`${w}: Bild vorschau/${f.bild} fehlt`);
        else { bildsumme += b.groesse; if (!BILDTYPEN.includes(path.extname(f.bild).toLowerCase())) F(`${w}: Bildformat nicht erlaubt`); }
      });
      if (bildsumme > 200 * 1024) F(`Slideshow-Bilder zusammen ${kb(bildsumme)} > 200 kB`);
    }
    R("Folie 2 zeigt einen echten Bildschirm aus dem Paket, keine geschönte Grafik.");
  }

  // --- Inhalte durchsuchen ---
  for (const d of liste.filter((d) => [".html", ".js", ".css", ".svg"].includes(path.extname(d.rel)))) {
    const t = await readFile(path.join(inhalt, d.rel), "utf8");
    for (const [re, was] of VERBOTEN) if (re.test(t)) F(`inhalt/${d.rel}: verboten – ${was}`);
    if (d.rel.startsWith("modul/") && /localStorage/.test(t) && !/window\.offline/.test(t)) F(`inhalt/${d.rel}: localStorage direkt verwendet; nur über offline.speicher (Ersatz für die Entwicklung erlaubt)`);
  }
  for (const d of liste.filter((d) => [".md", ".txt", ".json", ".html"].includes(path.extname(d.rel)))) {
    const t = await readFile(path.join(inhalt, d.rel), "utf8");
    if (/lorem ipsum/i.test(t)) F(`inhalt/${d.rel}: Platzhaltertext (lorem ipsum)`);
    if (/\bJanuar\b/.test(t)) H(`inhalt/${d.rel}: „Januar" – in de-AT „Jänner"`);
  }

  // --- Modul ---
  if (meta.art === "modul") {
    const modul = liste.filter((d) => d.rel.startsWith("modul/"));
    if (!modul.find((d) => d.rel === "modul/index.html")) F("art = modul: inhalt/modul/index.html fehlt");
    const g = modul.reduce((s, d) => s + d.groesse, 0);
    if (g > 2 * 1024 * 1024) F(`Modul zu groß: ${kb(g)} > 2 MB`);
    const idx = liste.find((d) => d.rel === "modul/index.html");
    if (idx) {
      const t = await readFile(path.join(inhalt, idx.rel), "utf8");
      if (!/window\.offline/.test(t)) F("modul/index.html: keine Verwendung von window.offline gefunden");
      if (!/name=["']viewport["']/.test(t)) H("modul/index.html: kein viewport-Meta – am Handy prüfen");
    }
    R("Modul am Handy bei 360 px Breite bedient: alle Knöpfe erreichbar, mindestens 44 px hoch.");
    R("Modul ohne Netz getestet (Flugmodus).");
  }

  // --- Regeln nach Inhalt ---
  if (meta.alter_ab < 18) R(`alter_ab = ${meta.alter_ab}: keine Kontaktmöglichkeit zu Fremden, keine Links nach außen, Sprache fürs Alter.`);
  if (meta.kategorie === "ernstfall") {
    R("Jede Notfallanleitung beginnt mit „Ist jemand in Gefahr?\" und der Notrufnummer.");
    if (/^keine$/i.test(meta.abnahme ?? "")) H("kategorie = ernstfall, aber abnahme = keine – fachliche Abnahme nötig?");
  }
  R("Lizenz und Quellen stimmen mit dem Inhalt überein.");
  R("Texte gelesen: kurze Sätze, österreichische Begriffe, keine Floskeln.");
  return { meta, liste, summe, ordner };
}

async function updatePruefen(neu, altOrdner) {
  const alt = await lesenJson(path.join(altOrdner, "paket.quelle.json"), "vorher/paket.quelle.json");
  if (!alt || !neu.meta) return;
  const m = neu.meta;
  if (alt.id !== m.id) F(`Update: id geändert (${alt.id} → ${m.id})`);
  if ((alt.aenderungen ?? "") === (m.aenderungen ?? "")) F("Update: aenderungen ist unverändert – was ist neu?");
  if (alt.alter_ab !== undefined && m.alter_ab < alt.alter_ab) F(`Update: alter_ab gesunken (${alt.alter_ab} → ${m.alter_ab}), braucht Freigabe der Redaktion`);
  const vorher = new Set((await dateien(path.join(altOrdner, "inhalt"))).map((d) => d.rel));
  const jetzt = new Set(neu.liste.map((d) => d.rel));
  const weg = [...vorher].filter((r) => !jetzt.has(r));
  if (weg.length) { H(`Update: ${weg.length} Datei(en) entfernt: ${weg.join(", ")}`); R("Entfernte Dateien: nichts fällt weg, worauf Nutzer sich verlassen."); }
  if (m.art === "modul") {
    const dv0 = alt.datenversion ?? 1, dv1 = m.datenversion ?? 1;
    if (dv1 < dv0) F(`Update: datenversion gesunken (${dv0} → ${dv1})`);
    if (dv1 > dv0 && !jetzt.has("modul/migration.js")) F(`Update: datenversion ${dv0} → ${dv1}, aber inhalt/modul/migration.js fehlt`);
    if (dv1 > dv0) R(`Migration von Datenversion ${dv0} auf ${dv1} mit echten Altdaten getestet.`);
  }
  const lm = await readFile(path.join(neu.ordner, "LIESMICH.md"), "utf8").catch(() => "");
  if (!/^#+\s*Was hat sich geändert/mi.test(lm)) F("Update: LIESMICH.md braucht den Abschnitt „Was hat sich geändert\"");
}

async function main() {
  const [ordner, ...rest] = process.argv.slice(2);
  if (!ordner) { console.error("Verwendung: node pruefen.mjs <quellordner> [--vorher <alter-quellordner>]"); process.exit(2); }
  const vi = rest.indexOf("--vorher"), vorher = vi >= 0 ? rest[vi + 1] : null;
  const r = await pruefen(ordner);
  if (vorher) await updatePruefen(r, vorher);

  const m = r.meta ?? {};
  const kopf = `# Prüfbericht: ${m.id ?? "?"}\n\n*${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · Paket-Kit 1 · ${vorher ? `Update gegen ${vorher}` : "neues Paket"}*\n\n` +
    `**Ergebnis: ${fehler.length ? `${fehler.length} Fehler – nicht einbaufertig` : "keine Fehler – bereit für die Redaktion"}**\n\n` +
    `| | |\n|---|---|\n| Titel | ${m.titel ?? ""} |\n| Art | ${m.art ?? ""} |\n| Kategorie | ${m.kategorie ?? ""} |\n| Alter ab | ${m.alter_ab ?? ""} |\n| Preis | ${m.preis ?? ""} |\n| Dateien | ${r.liste.length}, ${kb(r.summe ?? 0)} |\n\n`;
  const abschnitt = (t, l, z) => `## ${t}\n\n${l.length ? l.map((x) => `${z} ${x}`).join("\n") : "keine"}\n\n`;
  const bericht = kopf + abschnitt("Fehler", fehler, "-") + abschnitt("Hinweise", hinweise, "-") + abschnitt("Für die Redaktion", redaktion, "- [ ]");
  await writeFile(path.join(ordner, "PRUEFBERICHT.md"), bericht);
  console.log(bericht);
  process.exitCode = fehler.length ? 1 : 0;
}

main();
