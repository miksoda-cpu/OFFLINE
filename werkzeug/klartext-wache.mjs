#!/usr/bin/env node
// Klartext-Wache (Nachtrag 2026-10-06, nach dem Vorfall mit Commit 2725532): Das Repo ist öffentlich. Nichts, was nur intern
// ist, darf im Klartext hinein. Die Wache bricht ab, wenn
//   1. eine Datei aus den geschützten Ordnern der .gitignore vorgemerkt ist (Block „Klartext-Wache“; auch mit `git add -f`),
//      oder ein Schlüssel (*.key),
//   2. eine Datei in einem Ordner `verschluesselt/` nicht nach Chiffrat aussieht,
//   3. eine Datei Text aus den lokalen Quellen enthält (Ordner quelle/ im Block; Fingerabdruck: jedes Textstück ab 40 Zeichen;
//      nur wenn die Quellen auf diesem Rechner liegen). Bewusst öffentliche Wendungen stehen mit Grund in klartext-wache-erlaubt.json.
// Aufruf:
//   node werkzeug/klartext-wache.mjs vorgemerkt   – Hook pre-commit: die vorgemerkten Dateien
//   node werkzeug/klartext-wache.mjs push         – Hook pre-push: alle Dateien in den Commits, die hinausgehen (stdin wie git)
//   node werkzeug/klartext-wache.mjs alle         – alle Dateien im Repo (Test bei jedem Push in der CI)
// Hooks einschalten (einmal je Klon): git config core.hooksPath .githooks
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BLOCK = "Klartext-Wache";
export const IMMER = ["*.key"];
export const MIN = 40;

/** Muster aus dem Block der .gitignore, der mit einer Kommentarzeile mit „Klartext-Wache“ beginnt und bei einer Leerzeile endet. */
export function geschuetzteMuster(gitignore) {
  const aus = [...IMMER];
  let drin = false;
  for (const z of gitignore.split("\n").map((x) => x.trim())) {
    if (z.startsWith("#")) { if (z.includes(BLOCK)) drin = true; continue; }
    if (!z) { drin = false; continue; }
    if (drin && !z.startsWith("!")) aus.push(z);
  }
  return aus;
}

const reAus = (m) => new RegExp("^" + m.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\0").replace(/\*/g, "[^/]*").replace(/\0/g, ".*").replace(/\?/g, "[^/]") + "$");
/** Trifft ein Repo-Pfad ein Muster? Wie .gitignore: „ordner/“ trifft alles darunter, Muster ohne „/“ jeden Dateinamen. */
export function trifft(pfad, muster) {
  return muster.some((m) => {
    if (m.endsWith("/")) return pfad.startsWith(m.replace(/^\//, ""));
    if (!m.replace(/^\//, "").includes("/")) return reAus(m).test(path.posix.basename(pfad));
    const r = reAus(m.replace(/^\//, ""));
    return r.test(pfad) || pfad.split("/").some((_, i, t) => r.test(t.slice(0, i + 1).join("/")));
  });
}

/** Chiffrat (IV + AES-GCM) ist Zufall: höchstens rund 40 % druckbare Zeichen. Text liegt weit über 90 %. */
export function siehtNachChiffratAus(buf) {
  if (buf.length < 28) return false;
  let druckbar = 0;
  for (const b of buf) if (b === 9 || b === 10 || b === 13 || (b >= 32 && b < 127)) druckbar++;
  return druckbar / buf.length < 0.75;
}

/** Fingerabdrücke: die ersten MIN Zeichen jedes Textstücks ab MIN Zeichen (getrennt an Zeilenende, Anführungszeichen, Backslash,
 *  Tabellenstrich). Commons-Dateinamen und Adressen sind öffentlich und zählen nicht. */
export function fingerabdruecke(texte) {
  const f = new Set();
  for (const t of texte) for (const s of t.split(/[\n\r"\\|]+/)) { const x = s.trim(); if (x.length >= MIN && !/^File:|https?:\/\//.test(x)) f.add(x.slice(0, MIN)); }
  return f;
}
/** Stücke aus dem Klartext, die im Text vorkommen. `erlaubt`: Wendungen, die bewusst öffentlich sind (klartext-wache-erlaubt.json). */
export function fundeImText(text, f, erlaubt = []) {
  const aus = [];
  if (!f.size) return aus;
  for (const s of text.split(/[\n\r"\\]+/)) {
    const x = s.trim();
    for (let i = 0; i + MIN <= x.length; i++) {
      const w = x.slice(i, i + MIN);
      if (!f.has(w)) continue;
      if (!erlaubt.some((e) => e.includes(w))) aus.push(w);
      i += MIN - 1;
    }
  }
  return aus;
}

export const ERLAUBT_DATEI = "werkzeug/klartext-wache-erlaubt.json";
/** Freigegebene Wendungen für eine Datei: die unter ihrem Pfad und die unter „*“. Die Freigabeliste selbst darf genau ihre Einträge enthalten. */
export const erlaubtFuer = (liste, pfad) => (pfad === ERLAUBT_DATEI ? Object.values(liste).flat() : [...(liste["*"] ?? []), ...(liste[pfad] ?? [])]).map((e) => e.text);

/** Prüft Dateien [{ pfad, inhalt: Buffer|null }]. Gibt die Fehler zurück (leer = sauber). */
export function pruefe(dateien, muster, f = new Set(), erlaubt = {}) {
  const fehler = [];
  for (const { pfad, inhalt } of dateien) {
    if (trifft(pfad, muster)) { fehler.push(`${pfad}: liegt in einem geschützten Ordner (.gitignore, Block „${BLOCK}“)`); continue; }
    if (!inhalt) continue;
    if (pfad.split("/").includes("verschluesselt")) { if (!siehtNachChiffratAus(inhalt)) fehler.push(`${pfad}: liegt in verschluesselt/, sieht aber nach Klartext aus`); continue; }
    if (inhalt.length > 8e6 || inhalt.includes(0)) continue; // groß oder binär: Bilder, Programme
    const funde = fundeImText(inhalt.toString("utf8"), f, erlaubtFuer(erlaubt, pfad));
    if (funde.length) fehler.push(`${pfad}: enthält Klartext aus internen Inhalten (${funde.length}×, zuerst „${funde[0]}…“)`);
  }
  return fehler;
}

// ---------- Anbindung an git ----------
const git = (...a) => execFileSync("git", a, { cwd: WURZEL, maxBuffer: 1 << 30 });
const zeilen = (b) => b.toString("utf8").split("\n").filter(Boolean);
function lokalerKlartext(muster) {
  const texte = [];
  const lauf = (rel) => {
    const abs = path.join(WURZEL, rel);
    if (!existsSync(abs)) return;
    const st = statSync(abs);
    if (st.isDirectory()) { for (const e of readdirSync(abs)) if (e !== ".roh") lauf(path.posix.join(rel, e)); return; }
    if (st.size < 8e6 && /\.(json|md|txt|csv|html?)$/i.test(rel)) texte.push(readFileSync(abs, "utf8"));
  };
  // Nur die Quellen (Bills Material) geben Fingerabdrücke. Was der Umwandler oder bilder-holen.mjs selbst erzeugt, steht ohnehin
  // im Code und ist öffentlich; die Quelltexte im Paketinhalt sind dieselben wie in quelle/.
  for (const m of muster) if (!m.includes("*") && m.split("/").includes("quelle")) lauf(m.replace(/^\/|\/$/g, ""));
  return fingerabdruecke(texte);
}
const NULL = /^0+$/;
function dateienFuer(modus, stdin) {
  if (modus === "alle") return zeilen(git("ls-files", "-z").toString("utf8").replace(/\0/g, "\n")).map((p) => ({ pfad: p, inhalt: existsSync(path.join(WURZEL, p)) ? readFileSync(path.join(WURZEL, p)) : null }));
  if (modus === "vorgemerkt") return zeilen(git("diff", "--cached", "--name-only", "--diff-filter=ACMR")).map((p) => ({ pfad: p, inhalt: git("show", `:${p}`) }));
  if (modus === "push") {
    const aus = new Map();
    for (const z of zeilen(Buffer.from(stdin))) {
      const [, lokal, , fern] = z.split(" ");
      if (!lokal || NULL.test(lokal)) continue; // Löschen eines Branches
      const bereich = NULL.test(fern) ? [lokal, "--not", "--remotes"] : [`${fern}..${lokal}`];
      for (const c of zeilen(git("rev-list", ...bereich)))
        for (const p of zeilen(git("diff-tree", "--no-commit-id", "--name-only", "-r", "--diff-filter=ACMR", "--root", c)))
          if (!aus.has(p)) aus.set(p, { pfad: p, inhalt: git("show", `${c}:${p}`) });
    }
    return [...aus.values()];
  }
  throw new Error("Aufruf: klartext-wache.mjs vorgemerkt|push|alle");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const modus = process.argv[2];
  const stdin = modus === "push" ? readFileSync(0, "utf8") : "";
  const muster = geschuetzteMuster(readFileSync(path.join(WURZEL, ".gitignore"), "utf8"));
  const erlaubt = JSON.parse(readFileSync(path.join(WURZEL, ERLAUBT_DATEI), "utf8")).erlaubt;
  const fehler = pruefe(dateienFuer(modus, stdin), muster, lokalerKlartext(muster), erlaubt);
  if (fehler.length) {
    console.error(`Klartext-Wache: abgebrochen, ${fehler.length} Fund${fehler.length > 1 ? "e" : ""}. Das Repo ist öffentlich.`);
    for (const f of fehler) console.error("  " + f);
    console.error("Interne Inhalte nur verschlüsselt einchecken (docs/INTERN.md).");
    process.exit(1);
  }
  console.log(`Klartext-Wache: sauber (${modus}).`);
}
