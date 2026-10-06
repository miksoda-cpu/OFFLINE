#!/usr/bin/env node
// OFFLINE Paket-Kit – Prüfprogramm für Quellordner. Siehe PFLICHTENHEFT.md.
// Aufruf:  node pruefen.mjs <quellordner> [--vorher <alter-quellordner>] [--kein-bericht]
// Node ≥ 20, keine Abhängigkeiten. Schreibt PRUEFBERICHT.md in den Quellordner.
// Als Modul: import { pruefeQuellordner } from "./pruefen.mjs" (so nutzen es werkzeug/test.mjs und werkzeug/paket.mjs).

import { readFile, writeFile, readdir, lstat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tageBereichFehler, tageInhaltFehler } from "./tage-format.mjs";
import { tippsFehler } from "./tipps-format.mjs";
import { pauseFehler } from "./pause-format.mjs";
import { buchFehler, zuordnungFehler } from "./buch-format.mjs";
import { gedankenFehler } from "./gedanken-format.mjs";

const ARTEN = ["inhalt", "zim", "karte", "modell", "kurs", "software", "modul", "skin", "tage"];
const PREISE = ["gratis", "pro", "kauf"];
const PRUEFSTATUS = ["redaktion", "herausgeber", "community"];
const ALTER = [0, 6, 10, 14, 18];
const KATEGORIEN = ["ernstfall", "wissen", "jeden-tag", "du-und-die-deinen", "unterwegs", "verbindung", "miteinander", "aussehen"];
const ROLLEN = ["wofuer", "aussehen", "inhalt", "platz", "herkunft"];
const TYPEN = [".json", ".md", ".txt", ".html", ".css", ".js", ".svg", ".png", ".webp", ".jpg", ".mp3", ".ogg", ".pdf", ".zim", ".pmtiles", ".gguf", ".woff2", ".woff"];
const SKIN_TYPEN = [".css", ".woff2", ".woff", ".webp", ".png", ".jpg", ".svg", ".md", ".txt", ".json"];
const SKIN_GRENZE = 20 * 1024 * 1024;

/** Gleiche Regeln wie cssFehler in werkzeug/kern.mjs (hier eigenständig, damit das Kit ohne Repo läuft), aber alle Gründe. */
function cssFehler(t) {
  const g = [];
  if (t.includes("\\")) g.push("Escape-Zeichen (\\) in CSS");
  if (/@import/i.test(t)) g.push("@import");
  if (/expression\s*\(/i.test(t)) g.push("expression()");
  if (/javascript:|vbscript:/i.test(t)) g.push("javascript:");
  if (/behavior\s*:|-moz-binding/i.test(t)) g.push("behavior/-moz-binding");
  for (const m of t.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
    const ziel = m[2].trim();
    if (/^data:(image|font)\/[a-z0-9.+-]+[;,]/i.test(ziel)) continue;
    if (!ziel || /^[a-z][a-z0-9+.-]*:/i.test(ziel) || ziel.startsWith("/") || ziel.split(/[/?#]/).includes("..")) g.push(`url() außerhalb des Pakets: ${ziel.slice(0, 60)}`);
  }
  if (/image-set\(\s*['"]/i.test(t)) g.push("image-set() mit Adresse ohne url()");
  return g;
}
const BILDTYPEN = [".svg", ".webp", ".png", ".jpg"];
const PFAD_OK = /^[a-z0-9._\-/]+$/;
const ID_OK = /^[a-z0-9-]{2,40}$/;
const QUELLE_ID_OK = /^[a-z0-9-]{1,40}$/;
// Notfallanleitungen, die maschinell erkennbar sind (PAKET-KIT.md Regel 4.5): diese Inhaltstypen in einem Paket der
// Kategorie „ernstfall“, und jeder Inhalt mit "notfall": true.
const NOTFALL_TYPEN = ["guide", "nachschlage-guide"];
const NOTRUF_FRAGE = "Ist jemand in Gefahr?";
const SKRIPT_TYPEN = [".js", ".mjs"];
const VERBOTEN = [
  [/\bfetch\s*\(/, "fetch()"], [/XMLHttpRequest/, "XMLHttpRequest"], [/\bWebSocket\b/, "WebSocket"],
  [/\bEventSource\b/, "EventSource"], [/sendBeacon/, "sendBeacon"], [/\beval\s*\(/, "eval()"],
  [/new\s+Function\s*\(/, "new Function()"], [/importScripts/, "importScripts"], [/<iframe/i, "<iframe>"],
  [/window\.open\s*\(/, "window.open()"],
  [/RTCPeerConnection|RTCDataChannel/, "WebRTC (RTCPeerConnection)"],
  [/(?:src|href)\s*=\s*["']?\s*(?:https?:)?\/\//i, "externe Adresse in src/href"],
  [/@import\s+url\(\s*["']?https?:/i, "externes @import"], [/url\(\s*["']?https?:/i, "externe url() in CSS"],
];

let fehler, hinweise, redaktion;
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
const versionKleiner = (a, b) => { const A = a.split(".").map(Number), B = b.split(".").map(Number); for (let i = 0; i < 3; i++) if ((A[i] || 0) !== (B[i] || 0)) return (A[i] || 0) < (B[i] || 0); return false; };
const appMinZuAlt = (v) => { const [a = 0, b = 0] = v.split(".").map(Number); return a === 0 && b < 2; };

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
  else {
    const ids = new Set();
    meta.quellen.forEach((q, i) => {
      if (!QUELLE_ID_OK.test(q?.id ?? "")) F(`quellen[${i}]: id fehlt oder ungültig (a–z, 0–9, -)`);
      else if (ids.has(q.id)) F(`quellen[${i}]: id „${q.id}" doppelt`);
      else ids.add(q.id);
      if (!txt(q?.name)) F(`quellen[${i}]: name fehlt`);
      if (typeof q?.url !== "string") F(`quellen[${i}]: url fehlt (leer ist erlaubt)`);
    });
  }
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
  if (meta.ki_generiert !== undefined && typeof meta.ki_generiert !== "boolean") F("ki_generiert muss true oder false sein");
  if ((meta.art === "modul" || meta.art === "skin") && txt(meta.app_min) && appMinZuAlt(meta.app_min)) F(`art = ${meta.art}: app_min muss 0.2.0 oder höher sein (ältere Apps kennen Module und Skins nicht)`);
  if (meta.art === "modul" && meta.pruefstatus !== "redaktion") F("art = modul: pruefstatus muss redaktion sein (SICHERHEIT.md, Module, Bedingung 2)");

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
  if (!existsSync(vs)) { if (meta.art !== "tage") F("inhalt/vorschau/folien.json fehlt"); } // Tagesinhalte: die Tagesseite ist die Vorschau
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
    // offline.spiel.melden / .liste gibt es ab App 0.4.0: entweder app_min 0.4.0 oder vorher prüfen (if (offline.spiel) …)
    if (d.rel.startsWith("modul/") && /offline\.spiel\b/.test(t) && !(txt(meta.app_min) && !versionKleiner(meta.app_min, "0.4.0")) && !/if\s*\(\s*(window\.)?offline\.spiel\s*\)|(window\.)?offline\.spiel\s*&&/.test(t)) H(`inhalt/${d.rel}: offline.spiel gibt es erst ab App 0.4.0 – app_min auf 0.4.0 setzen oder vorher prüfen (if (offline.spiel) …)`);
  }
  for (const d of liste.filter((d) => [".md", ".txt", ".json", ".html"].includes(path.extname(d.rel)))) {
    const t = await readFile(path.join(inhalt, d.rel), "utf8");
    if (/lorem ipsum/i.test(t)) F(`inhalt/${d.rel}: Platzhaltertext (lorem ipsum)`);
    if (/\bJanuar\b/.test(t)) H(`inhalt/${d.rel}: „Januar" – in de-AT „Jänner"`);
  }

  // --- Code nur in Modulen, und dort nur unter modul/ (SICHERHEIT.md, Grundsatz 2 und Bedingung 3) ---
  for (const d of liste) {
    const ext = path.extname(d.rel).toLowerCase();
    const imModul = meta.art === "modul" && d.rel.startsWith("modul/");
    if (imModul) continue;
    if (SKRIPT_TYPEN.includes(ext)) F(`inhalt/${d.rel}: Skript außerhalb eines Moduls (Pakete enthalten keinen Code${meta.art === "modul" ? ", außer unter inhalt/modul/" : ""})`);
    else if ([".html", ".svg"].includes(ext) && /<script\b|\bon[a-z]+\s*=\s*["']|javascript:/i.test(await readFile(path.join(inhalt, d.rel), "utf8"))) {
      F(`inhalt/${d.rel}: Skript in ${ext} außerhalb eines Moduls`);
    }
  }

  // --- CSS: nur Stil, nichts von außen (PAKET-KIT.md Regel 4.2 und Abschnitt 5a) ---
  for (const d of liste.filter((d) => path.extname(d.rel).toLowerCase() === ".css" && !(meta.art === "modul" && d.rel.startsWith("modul/")))) {
    for (const c of cssFehler(await readFile(path.join(inhalt, d.rel), "utf8"))) F(`inhalt/${d.rel}: CSS nicht erlaubt – ${c}`);
  }

  // --- Skin ---
  if (meta.art === "skin") {
    if (!liste.find((d) => d.rel === "skin/skin.css")) F("art = skin: inhalt/skin/skin.css fehlt");
    for (const d of liste) {
      if (!d.rel.startsWith("skin/") && !d.rel.startsWith("vorschau/")) F(`art = skin: Datei außerhalb von inhalt/skin/: inhalt/${d.rel}`);
      else if (d.rel.startsWith("skin/") && !SKIN_TYPEN.includes(path.extname(d.rel).toLowerCase())) F(`art = skin: Dateityp nicht erlaubt: inhalt/${d.rel}`);
    }
    if ((summe ?? 0) > SKIN_GRENZE) F(`Skin zu groß: ${kb(summe)} > 20 MB`);
    if (meta.kategorie !== "aussehen") H("art = skin: kategorie sollte aussehen sein");
    if (meta.ki_generiert === undefined) F("art = skin: ki_generiert angeben (true, wenn Bilder mit KI erzeugt sind)");
    R("Skin in hell und dunkel und bei 360 px angesehen; Notfallseiten bleiben im Grundaussehen.");
    if (meta.ki_generiert) R("KI-Bilder: Herkunft (Modell, Datum, Prompts) liegt im Paket, z. B. inhalt/skin/HERKUNFT.md.");
  }

  // --- Tagesinhalte (Abschnitt 5b) ---
  if (meta.art === "tage") {
    for (const f of tageBereichFehler(meta.tage)) F(`art = tage: ${f}`);
    if (txt(meta.app_min) && versionKleiner(meta.app_min, "0.3.0")) F("art = tage: app_min muss 0.3.0 oder höher sein (ältere Apps kennen Tagesinhalte nicht)");
    if (!liste.find((d) => d.rel === "tage.json")) F("art = tage: inhalt/tage.json fehlt");
    else {
      let t = null;
      try { t = JSON.parse(await readFile(path.join(inhalt, "tage.json"), "utf8")); } catch { F("inhalt/tage.json: kein gültiges JSON"); }
      if (t) for (const f of tageInhaltFehler(t, meta.tage)) F(`inhalt/tage.json: ${f}`);
    }
    for (const d of liste) if (!d.rel.startsWith("vorschau/") && ![".json", ".md", ".txt"].includes(path.extname(d.rel).toLowerCase())) F(`art = tage: Dateityp nicht erlaubt: inhalt/${d.rel}`);
    R("Texte gegengelesen; bei Romanen Autor vor 1956 gestorben und Ausgabe ohne eigene Rechte (Herkunft im Paket).");
  }

  // --- Lumi-Tipps (inhalt/tipps.json, Paket „wir“): Sorten, ziel gegen die bekannten Stellen der App, buch reserviert ---
  if (liste.find((d) => d.rel === "tipps.json")) {
    let t = null;
    try { t = JSON.parse(await readFile(path.join(inhalt, "tipps.json"), "utf8")); } catch { F("inhalt/tipps.json: kein gültiges JSON"); }
    if (t) for (const f of tippsFehler(t)) F(`inhalt/tipps.json: ${f}`);
    // buch: jede Absatznummer muss es im Lumi-Buch geben (Paket „lumi-buch“ daneben, z. B. pakete/lumi-buch)
    const mitBuch = (t?.tipps ?? []).filter((x) => x.buch);
    if (mitBuch.length) {
      const buchDatei = path.join(ordner, "..", "lumi-buch", "inhalt", "buch.json");
      if (!existsSync(buchDatei)) H(`inhalt/tipps.json: ${mitBuch.length} Tipps mit buch, aber kein Lumi-Buch daneben (../lumi-buch) – Nummern nicht geprüft`);
      else {
        let b = null;
        try { b = JSON.parse(await readFile(buchDatei, "utf8")); } catch { F("../lumi-buch/inhalt/buch.json: kein gültiges JSON"); }
        if (b) for (const f of zuordnungFehler(b, t.tipps).filter((x) => !/kein Tipp zeigt/.test(x))) F(`inhalt/tipps.json: ${f}`);
      }
    }
  }

  // --- Lumi-Buch (inhalt/buch.json, Paket „lumi-buch“): Band, Kapitel in Reihenfolge, Absatznummern b<Band>-KK-PP ---
  if (liste.find((d) => d.rel === "buch.json")) {
    let b = null;
    try { b = JSON.parse(await readFile(path.join(inhalt, "buch.json"), "utf8")); } catch { F("inhalt/buch.json: kein gültiges JSON"); }
    if (b) for (const f of buchFehler(b)) F(`inhalt/buch.json: ${f}`);
    if (txt(meta.app_min) && versionKleiner(meta.app_min, "0.5.0")) F("Lumi-Buch: app_min muss 0.5.0 oder höher sein");
    // jeder Absatz braucht mindestens einen Tipp im Paket „wir“ daneben
    const tippDatei = path.join(ordner, "..", "wir", "inhalt", "tipps.json");
    if (b && existsSync(tippDatei)) {
      let t = null;
      try { t = JSON.parse(await readFile(tippDatei, "utf8")); } catch { /* das prüft das Paket wir selbst */ }
      if (t) for (const f of zuordnungFehler(b, t.tipps ?? []).filter((x) => /kein Tipp zeigt/.test(x))) F(`inhalt/buch.json: ${f}`);
    }
    R("Text gegen die freigegebene Vorlage gelesen; nur Tippfehler korrigiert und gemeldet.");
  }

  // --- Gedanken (inhalt/gedanken.json, Paket „lumi-philosophie“): je Gedanke alle Felder und ein Bild im Paket ---
  if (liste.find((d) => d.rel === "gedanken.json")) {
    let g = null;
    try { g = JSON.parse(await readFile(path.join(inhalt, "gedanken.json"), "utf8")); } catch { F("inhalt/gedanken.json: kein gültiges JSON"); }
    if (g) for (const f of gedankenFehler(g, liste.map((d) => d.rel))) F(`inhalt/gedanken.json: ${f}`);
  }

  // --- Pause (inhalt/pause.json, Paket „pause“): Formen mit Selbstbeschreibung, Geschichten, Lumisch ---
  if (liste.find((d) => d.rel === "pause.json")) {
    let t = null;
    try { t = JSON.parse(await readFile(path.join(inhalt, "pause.json"), "utf8")); } catch { F("inhalt/pause.json: kein gültiges JSON"); }
    if (t) for (const f of pauseFehler(t)) F(`inhalt/pause.json: ${f}`);
    if (txt(meta.app_min) && versionKleiner(meta.app_min, "0.4.0")) F("Pause-Inhalte: app_min muss 0.4.0 oder höher sein");
  }

  // --- Quellen-Verweise und Notrufhinweis in den Inhalten ---
  const quellenIds = new Set((Array.isArray(meta.quellen) ? meta.quellen : []).map((q) => q?.id).filter(Boolean));
  for (const d of liste.filter((d) => path.extname(d.rel) === ".json" && !d.rel.startsWith("vorschau/"))) {
    let j;
    try { j = JSON.parse(await readFile(path.join(inhalt, d.rel), "utf8")); } catch { F(`inhalt/${d.rel}: kein gültiges JSON`); continue; }
    for (const q of quellenVerweise(j)) if (!quellenIds.has(q)) F(`inhalt/${d.rel}: verweist auf Quelle „${q}", die in paket.quelle.json → quellen fehlt`);
    const notfall = j?.notfall === true || (NOTFALL_TYPEN.includes(j?.typ) && meta.kategorie === "ernstfall");
    if (notfall) {
      const n = j.notruf;
      if (!n || typeof n !== "object") F(`inhalt/${d.rel}: Notfallanleitung ohne Notrufhinweis (Feld notruf mit frage und nummer, Regel 4.5)`);
      else {
        if (n.frage !== NOTRUF_FRAGE) F(`inhalt/${d.rel}: notruf.frage muss „${NOTRUF_FRAGE}" lauten`);
        if (!/^\d{3,5}$/.test(n.nummer ?? "")) F(`inhalt/${d.rel}: notruf.nummer fehlt oder ist keine Notrufnummer`);
      }
    }
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

/** Alle Werte zu einem Schlüssel „quelle“ (Text oder Liste), beliebig tief. */
function quellenVerweise(j, aus = []) {
  if (Array.isArray(j)) for (const x of j) quellenVerweise(x, aus);
  else if (j && typeof j === "object") {
    for (const [k, v] of Object.entries(j)) {
      if (k === "quelle" && typeof v === "string") aus.push(v);
      else if (k === "quelle" && Array.isArray(v)) aus.push(...v.filter((x) => typeof x === "string"));
      else quellenVerweise(v, aus);
    }
  }
  return aus;
}

/**
 * Prüft einen Quellordner. Gibt { ok, fehler, hinweise, redaktion, bericht, meta } zurück.
 * `bericht: true` schreibt PRUEFBERICHT.md in den Ordner (Standard wie auf der Kommandozeile).
 */
export async function pruefeQuellordner(ordner, { vorher = null, bericht = true } = {}) {
  fehler = []; hinweise = []; redaktion = [];
  const r = await pruefen(ordner);
  if (vorher) await updatePruefen(r, vorher);

  const m = r.meta ?? {};
  const kopf = `# Prüfbericht: ${m.id ?? "?"}\n\n*${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · Paket-Kit 1 · ${vorher ? `Update gegen ${vorher}` : "neues Paket"}*\n\n` +
    `**Ergebnis: ${fehler.length ? `${fehler.length} Fehler – nicht einbaufertig` : "keine Fehler – bereit für die Redaktion"}**\n\n` +
    `| | |\n|---|---|\n| Titel | ${m.titel ?? ""} |\n| Art | ${m.art ?? ""} |\n| Kategorie | ${m.kategorie ?? ""} |\n| Alter ab | ${m.alter_ab ?? ""} |\n| Preis | ${m.preis ?? ""} |\n| Dateien | ${r.liste.length}, ${kb(r.summe ?? 0)} |\n\n`;
  const abschnitt = (t, l, z) => `## ${t}\n\n${l.length ? l.map((x) => `${z} ${x}`).join("\n") : "keine"}\n\n`;
  const text = kopf + abschnitt("Fehler", fehler, "-") + abschnitt("Hinweise", hinweise, "-") + abschnitt("Für die Redaktion", redaktion, "- [ ]");
  if (bericht) await writeFile(path.join(ordner, "PRUEFBERICHT.md"), text);
  return { ok: fehler.length === 0, fehler, hinweise, redaktion, bericht: text, meta: r.meta };
}

async function main() {
  const [ordner, ...rest] = process.argv.slice(2);
  if (!ordner) { console.error("Verwendung: node pruefen.mjs <quellordner> [--vorher <alter-quellordner>] [--kein-bericht]"); process.exit(2); }
  const vi = rest.indexOf("--vorher"), vorher = vi >= 0 ? rest[vi + 1] : null;
  const r = await pruefeQuellordner(ordner, { vorher, bericht: !rest.includes("--kein-bericht") });
  console.log(r.bericht);
  process.exitCode = r.ok ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
