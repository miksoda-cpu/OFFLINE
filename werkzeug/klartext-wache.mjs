#!/usr/bin/env node
// Klartext-Wache (Nachtrag 2026-10-06 nach Commit 2725532; Regel fürs öffentliche Repo, Auftrag 2026-10-06-13): Das Repo ist
// öffentlich. Was nicht freigegeben ist (nicht in einer veröffentlichten App-Version, nicht im öffentlichen Katalog), liegt nur
// verschlüsselt darin. Die Wache bricht ab, wenn
//   1. eine geschützte Datei vorgemerkt ist (auch mit `git add -f`). Geschützt ist
//      - was im Block „Klartext-Wache“ der .gitignore steht, und jeder Schlüssel (*.key),
//      - der Klartext zu jeder Datei, die verschlüsselt im Repo liegt (…/verschluesselt/x → …/x),
//      - jedes Paket mit "freigegeben": false oder "kanal": "intern" in paket.quelle.json, außer paket.quelle.json, Code (*.mjs),
//        verschluesselt/ und den Dateien, die das Paket unter "offen" nennt,
//   2. eine Datei in einem Ordner `verschluesselt/` nicht nach Chiffrat aussieht,
//   3. eine Datei Text aus unveröffentlichten Quellen enthält (Fingerabdruck: jedes Textstück ab 40 Zeichen, nur wenn der Klartext
//      auf diesem Rechner liegt; Stücke, die schon in der letzten veröffentlichten App-Version stehen, zählen nicht). Bewusst öffentliche
//      Wendungen stehen mit Grund in klartext-wache-erlaubt.json.
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

/** Klartext-Pfad zu einer verschlüsselten Datei: das Segment „verschluesselt“ fällt weg. */
export const klartextZu = (pfad) => pfad.split("/").filter((s) => s !== "verschluesselt").join("/");
/** Ist ein Paket (Inhalt von paket.quelle.json) noch nicht freigegeben? */
export const nichtFreigegeben = (q) => q?.freigegeben === false || q?.kanal === "intern";
/** Geschützt durch die Kennzeichnung im Paket? pakete: [{ wurzel: "pakete/x/", offen: [...] }] */
export function imGeschuetztenPaket(pfad, pakete) {
  for (const p of pakete) {
    if (!pfad.startsWith(p.wurzel)) continue;
    const rel = pfad.slice(p.wurzel.length);
    if (rel === "paket.quelle.json" || rel.endsWith(".mjs") || rel.split("/").includes("verschluesselt") || (p.offen ?? []).includes(rel)) return false;
    return true;
  }
  return false;
}
/** Alle Schutzregeln für einen Pfad; gibt den Grund zurück oder null. */
export function schutzGrund(pfad, r) {
  if (trifft(pfad, r.muster ?? [])) return `steht im Block „${BLOCK}“ der .gitignore`;
  if (r.spiegel?.has(pfad)) return "liegt verschlüsselt im Repo, der Klartext darf nicht hinein";
  if (imGeschuetztenPaket(pfad, r.pakete ?? [])) return "gehört zu einem Paket, das noch nicht freigegeben ist";
  return null;
}

/** Chiffrat (IV + AES-GCM) ist Zufall: höchstens rund 40 % druckbare Zeichen. Text liegt weit über 90 %. */
export function siehtNachChiffratAus(buf) {
  if (buf.length < 28) return false;
  let druckbar = 0;
  for (const b of buf) if (b === 9 || b === 10 || b === 13 || (b >= 32 && b < 127)) druckbar++;
  return druckbar / buf.length < 0.75;
}

/** Fingerabdrücke: die ersten MIN Zeichen jedes Textstücks ab MIN Zeichen (getrennt an Zeilenende, Anführungszeichen, Backslash,
 *  Tabellenstrich), wenn mindestens die Hälfte davon Buchstaben sind (keine Rahmen, Zahlenreihen, Leerzeichen). Commons-Dateinamen
 *  und Adressen sind öffentlich und zählen nicht. */
export function fingerabdruecke(texte) {
  const f = new Set();
  for (const t of texte) for (const s of t.split(/[\n\r"\\|]+/)) {
    const x = s.replace(/^[\s\-*#>„“”‚‘'»«•·:()\d.]+/u, "").trim(); // Aufzählung, Hervorhebung, Anführung vorne weg
    if (x.length >= MIN && !/^File:|https?:\/\//.test(x) && (x.slice(0, MIN).match(/\p{L}/gu) ?? []).length >= MIN / 2) f.add(x.slice(0, MIN));
  }
  return f;
}
/** Nimmt aus den Fingerabdrücken alles heraus, was in freigegebenen Texten steht (die sind ohnehin öffentlich). */
export function freigegebeneAbziehen(f, texte) {
  for (const t of texte) for (const w of fundeImText(t, f)) f.delete(w);
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

/** Prüft Dateien [{ pfad, inhalt: Buffer|null }]. `regeln`: { muster, spiegel, pakete } (oder nur die Muster als Liste).
 *  Gibt die Fehler zurück (leer = sauber). */
export function pruefe(dateien, regeln, f = new Set(), erlaubt = {}) {
  const r = Array.isArray(regeln) ? { muster: regeln } : regeln;
  const fehler = [];
  for (const { pfad, inhalt } of dateien) {
    const grund = schutzGrund(pfad, r);
    if (grund) { fehler.push(`${pfad}: ${grund}`); continue; }
    if (!inhalt) continue;
    if (pfad.split("/").includes("verschluesselt")) { if (!siehtNachChiffratAus(inhalt)) fehler.push(`${pfad}: liegt in verschluesselt/, sieht aber nach Klartext aus`); continue; }
    if (inhalt.length > 8e6 || inhalt.includes(0)) continue; // groß oder binär: Bilder, Programme
    const text = inhalt.toString("utf8"), funde = fundeImText(text, f, erlaubtFuer(erlaubt, pfad));
    const zeilenNr = [...new Set(funde.map((w) => text.slice(0, text.indexOf(w)).split("\n").length))];
    if (funde.length) fehler.push(`${pfad}: enthält Klartext aus unveröffentlichten Inhalten (${funde.length}×, Zeile ${zeilenNr.join(", ")}; zuerst „${funde[0]}…“)`);
  }
  return fehler;
}

// ---------- Anbindung an git ----------
const git = (...a) => execFileSync("git", a, { cwd: WURZEL, maxBuffer: 1 << 30, stdio: ["pipe", "pipe", "ignore"] });
const zeilen = (b) => b.toString("utf8").split("\n").filter(Boolean);
const TEXT = /\.(json|md|txt|csv|html?|py)$/i;
function dateienUnter(rel) {
  const abs = path.join(WURZEL, rel);
  if (!existsSync(abs)) return [];
  if (!statSync(abs).isDirectory()) return [rel];
  return readdirSync(abs).filter((e) => e !== ".roh").flatMap((e) => dateienUnter(path.posix.join(rel, e)));
}
/** Schutzregeln aus dem Repo: .gitignore-Block, Spiegel der verschlüsselten Dateien (Index), Pakete mit Kennzeichnung. */
export function regelnAusRepo() {
  const muster = geschuetzteMuster(readFileSync(path.join(WURZEL, ".gitignore"), "utf8"));
  const index = zeilen(git("ls-files", "-z").toString("utf8").replace(/\0/g, "\n"));
  const spiegel = new Set(index.filter((p) => p.split("/").includes("verschluesselt")).map(klartextZu));
  const pakete = [];
  for (const id of readdirSync(path.join(WURZEL, "pakete"))) {
    const q = path.join(WURZEL, "pakete", id, "paket.quelle.json");
    if (!existsSync(q)) continue;
    const j = JSON.parse(readFileSync(q, "utf8"));
    if (nichtFreigegeben(j)) pakete.push({ wurzel: `pakete/${id}/`, offen: j.offen ?? [] });
  }
  return { muster, spiegel, pakete };
}
/** Was sicher öffentlich ist: der Stand der letzten veröffentlichten App-Version (Tag vX.Y.Z) – App-Code und Paketinhalte, ohne
 *  Geschütztes. Bewusst nicht der Arbeitsstand: Was jemand gerade hineinkopiert, darf sich nicht selbst freisprechen. */
function freigegebeneTexte(r) {
  let tag;
  try { tag = git("describe", "--tags", "--abbrev=0", "--match", "v*", "HEAD").toString().trim(); }
  catch { console.error("Klartext-Wache: kein Release-Tag (vX.Y.Z) gefunden, auch Veröffentlichtes zählt als Fund. In der CI: checkout mit fetch-depth 0."); return []; }
  const pfade = zeilen(git("ls-tree", "-r", "--name-only", tag)).filter((p) => TEXT.test(p) || /\.(m?js|css|rs)$/.test(p));
  // Die Web-Kopie der Pakete (web/pakete/<id>-<version>/inhalt/) ist genau das, was im öffentlichen Katalog steht (0.7.1:
  // nötig, wenn ein veröffentlichtes Paket bis zur nächsten Ausgabe wieder gesperrt ist, z. B. pause und lumisch)
  const webKopie = (p) => /^web\/pakete\/[^/]+\/inhalt\/[^/]+\.(json|md|txt)$/.test(p);
  return pfade.filter((p) => webKopie(p) || ((p.startsWith("web/") || p.startsWith("app/src") || /^pakete\/[^/]+\/inhalt\//.test(p)) && !p.startsWith("web/pakete/") && !schutzGrund(p, r)))
    .map((p) => git("show", `${tag}:${p}`).toString("utf8"));
}
/** Fingerabdrücke aus dem lokalen Klartext unveröffentlichter Quellen: Ordner quelle/, alles unter bill/ und die .md-Dateien im
 *  Inhalt geschützter Pakete. Was ein Umwandler selbst erzeugt (JSON im Paketinhalt, Berichte), steht ohnehin im Code und zählt nicht.
 *  Davon ab geht alles, was in der letzten veröffentlichten App-Version steht. */
export function lokalerKlartext(r) {
  const kandidaten = new Set([...r.spiegel]);
  for (const m of r.muster) if (!m.includes("*")) for (const p of dateienUnter(m.replace(/^\/|\/$/g, ""))) kandidaten.add(p);
  for (const p of r.pakete) for (const d of dateienUnter(p.wurzel)) if (imGeschuetztenPaket(d, [p])) kandidaten.add(d);
  const quelle = (p) => p.split("/").includes("quelle") || p.startsWith("bill/") || (/\.md$/i.test(p) && p.split("/").includes("inhalt") && r.pakete.some((x) => p.startsWith(x.wurzel)));
  const texte = [...kandidaten].filter((p) => TEXT.test(p) && quelle(p) && existsSync(path.join(WURZEL, p)) && statSync(path.join(WURZEL, p)).size < 8e6).map((p) => readFileSync(path.join(WURZEL, p), "utf8"));
  const f = fingerabdruecke(texte);
  if (!f.size) return f;
  return freigegebeneAbziehen(f, freigegebeneTexte(r));
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
  const regeln = regelnAusRepo();
  const erlaubt = JSON.parse(readFileSync(path.join(WURZEL, ERLAUBT_DATEI), "utf8")).erlaubt;
  const fehler = pruefe(dateienFuer(modus, stdin), regeln, lokalerKlartext(regeln), erlaubt);
  if (fehler.length) {
    console.error(`Klartext-Wache: abgebrochen, ${fehler.length} Fund${fehler.length > 1 ? "e" : ""}. Das Repo ist öffentlich.`);
    for (const f of fehler) console.error("  " + f);
    console.error("Unveröffentlichtes nur verschlüsselt einchecken (docs/INTERN.md, „Regel fürs öffentliche Repo“).");
    process.exit(1);
  }
  console.log(`Klartext-Wache: sauber (${modus}).`);
}
