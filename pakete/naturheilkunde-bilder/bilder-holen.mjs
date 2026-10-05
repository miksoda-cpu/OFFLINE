#!/usr/bin/env node
// Paket „naturheilkunde-bilder“ (0.6.1, Auftrag 2026-10-05-11): alte Pflanzentafeln und freie Fotos von Wikimedia Commons.
// Läuft beim Paketbau mit Netz, nie in der App. Keine KI-Bilder.
//   suchen  – liest inhalt/naturheilkunde.json (Klartext, lokal), sucht Tafeln (Köhler 1887, Thomé 1885) und Fotos (nur Pilze,
//             Flechten, Moose und die Doppelgänger aus den Warnkarten), prüft Lizenzen und schreibt auswahl.json und den Bericht.
//   laden   – lädt nach auswahl.json (prüft, dass die Datei auf Commons unverändert ist: sha1), verkleinert auf WebP und schreibt
//             inhalt/bilder/*.webp und inhalt/bildnachweise.json. So läuft es im Workflow „Interner Kanal“.
//   bericht – bilder-bericht.md (je Art Tafel/Foto, ohne Bild, verworfen mit Grund, Gesamtgröße).
// Das Repo ist öffentlich: auswahl.json, verworfen.json und der Bericht liegen dort nur verschlüsselt (verschluesselt/).
// Wikimedia-Regeln: eigener User-Agent mit Kontakt, eine Anfrage nach der anderen mit Pause, maxlag; blockt Commons (429/403),
// bricht das Skript ab und meldet es. Bot-Sperren werden nie umgangen.
import { readFile, writeFile, mkdir, stat, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const TEXT = path.join(HIER, "..", "naturheilkunde", "inhalt", "naturheilkunde.json");
const AUSWAHL = path.join(HIER, "auswahl.json");
const BERICHT = path.join(HIER, "bilder-bericht.md");
const ZIEL = path.join(HIER, "inhalt");
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "OFFLINE-Paketbau/0.6.1 (https://github.com/miksoda-cpu/OFFLINE; Bilder fuer ein Offline-Nachschlagewerk)";
export const KANTE = 1200; // längste Seite in Pixel
export const KATEGORIEN = {
  // Köhlers Werk erschien 1887–1898 in Bänden; das Jahr steht, wo vorhanden, im Dateiblatt (meist 1897), sonst 1887.
  koehler: { kat: ["Köhlers Medizinal-Pflanzen", "Köhler's Medizinal-Pflanzen in naturgetreuen Abbildungen mit kurz erläuterndem Texte (1887)"], werk: "Köhler, Medizinal-Pflanzen", jahr: 1887, autor: "Franz Eugen Köhler (Hrsg.)", merkmal: /K[öo]hler/i },
  thome: { kat: ["Thomé, Flora von Deutschland"], werk: "Thomé, Flora von Deutschland, Österreich und der Schweiz", jahr: 1885, autor: "Otto Wilhelm Thomé", merkmal: /Thom[ée]/i },
};

// ---------- Lizenzen ----------
/** Zulässig: gemeinfrei, CC0, CC BY, CC BY-SA (jede Version). Alles andere – auch NC, ND, GFDL allein – wird verworfen. */
export function lizenzPruefen(kurz) {
  const l = String(kurz ?? "").trim();
  if (!l) return { ok: false, grund: "keine Lizenzangabe" };
  if (/\b(NC|ND)\b|non-?commercial|no-?deriv/i.test(l)) return { ok: false, grund: `nicht frei genug (${l})` };
  if (/^(public domain|PD\b|PD-)/i.test(l) || /gemeinfrei/i.test(l)) return { ok: true, lizenz: "gemeinfrei" };
  if (/^CC0\b/i.test(l) || /^CC-?0\b/i.test(l)) return { ok: true, lizenz: "CC0" };
  const m = /^CC[- ]BY(-SA)?[- ]?(\d(?:\.\d)?)?/i.exec(l);
  if (m) return { ok: true, lizenz: `CC BY${m[1] ? "-SA" : ""}${m[2] ? " " + m[2] : ""}` };
  return { ok: false, grund: `Lizenz nicht zulässig (${l})` };
}
const ohneHtml = (s) => String(s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

// ---------- Namen ----------
/** Binomen aus wiss_name: „Betula pendula; B. pubescens“ → ["Betula pendula", "Betula pubescens"]. */
export function binomen(wiss) {
  const aus = []; let gattung = null;
  for (const teil of String(wiss ?? "").split(/[;,↔/]| und | u\. a\./)) {
    const m = /([A-Z][a-z]+|[A-Z]\.)\s+([a-z][a-z-]+)/.exec(teil.trim());
    if (!m || /^(spp?|sp)\.?$/.test(m[2])) continue;
    const g = m[1].endsWith(".") ? gattung : m[1];
    if (!g) continue;
    gattung = g; aus.push(`${g} ${m[2]}`);
  }
  return [...new Set(aus)];
}
/** Pilze, Flechten und Moose (bekommen ein Foto). */
export const istPilzFlechteMoos = (e) => /pilz|flechte|moos|schwamm|lichen|usnea|cetraria|sphagnum|amanita|fungi/i.test(`${e.name} ${e.abschnitt ?? ""} ${e.wiss_name ?? ""}`);

// ---------- Commons ----------
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
let letzte = 0;
/** Ganze Anfrage samt Inhalt mit Zeitgrenze (fetch bricht das Lesen des Inhalts nicht immer ab). */
const mitFrist = (p, ms, was) => Promise.race([p, new Promise((_, nein) => setTimeout(() => nein(new Error(`Zeit um: ${was}`)), ms))]);
async function holen(url, als = "json", versuch = 1) {
  try { return await mitFrist(holenEinmal(url, als, versuch), 90000, url.slice(0, 80)); }
  catch (e) { if (/^Zeit um/.test(e.message) && versuch < 3) { await warte(10000 * versuch); return holen(url, als, versuch + 1); } throw e; }
}
async function holenEinmal(url, als, versuch) {
  const pause = 1100 - (Date.now() - letzte); if (pause > 0) await warte(pause);
  letzte = Date.now();
  let res;
  try { res = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA }, signal: AbortSignal.timeout(60000) }); } catch (e) { if (versuch < 3) { await warte(10000 * versuch); return holenEinmal(url, als, versuch + 1); } throw e; }
  if (process.env.BILDER_PROTOKOLL) console.error(`${res.status} ${Date.now() - letzte} ms ${url.slice(0, 90)}`);
  if (res.status === 429 || res.status === 403) throw new Error(`Commons blockt (${res.status}) – abgebrochen, nichts umgangen`);
  // Server überlastet (5xx): höflich warten, höchstens dreimal
  if (res.status >= 500 && versuch < 3) { await warte(Number(res.headers.get("retry-after")) * 1000 || 15000 * versuch); return holenEinmal(url, als, versuch + 1); }
  if (!res.ok) throw new Error(`${res.status} bei ${url.slice(0, 120)}`);
  if (als !== "json") return new Uint8Array(await res.arrayBuffer());
  const j = await res.json();
  if (j.error?.code === "maxlag" && versuch < 3) { await warte((Number(res.headers.get("retry-after")) || 10) * 1000); return holenEinmal(url, als, versuch + 1); }
  if (j.error) throw new Error(`Commons: ${j.error.code} ${j.error.info ?? ""}`);
  return j;
}
const api = (p) => holen(`${API}?${new URLSearchParams({ format: "json", formatversion: "2", maxlag: "5", ...p })}`);
async function kategorieDateien(kat) {
  const aus = []; let weiter = {};
  do {
    const j = await api({ action: "query", list: "categorymembers", cmtitle: `Category:${kat}`, cmtype: "file", cmlimit: "500", ...weiter });
    aus.push(...j.query.categorymembers.map((m) => m.title));
    weiter = j.continue ? { cmcontinue: j.continue.cmcontinue } : null;
  } while (weiter);
  return aus;
}
/** imageinfo für bis zu 50 Dateien: Lizenz, Urheber, Datum, Beschreibung, sha1, Größe, Vorschau mit KANTE. */
async function bildInfo(titel) {
  const aus = new Map();
  for (let i = 0; i < titel.length; i += 40) {
    const j = await api({ action: "query", prop: "imageinfo|categories", titles: titel.slice(i, i + 40).join("|"), iiprop: "url|sha1|size|extmetadata|mime", iiurlwidth: String(KANTE), cllimit: "max", clshow: "!hidden" });
    for (const p of j.query.pages) {
      const ii = p.imageinfo?.[0]; if (!ii) { aus.set(p.title, null); continue; }
      const m = ii.extmetadata ?? {}, w = (k) => ohneHtml(m[k]?.value);
      aus.set(p.title, { titel: p.title, url: ii.descriptionurl, original: ii.url, vorschau: ii.thumburl ?? ii.url, sha1: ii.sha1, breite: ii.width, hoehe: ii.height, mime: ii.mime,
        lizenz_roh: w("LicenseShortName"), urheber: w("Artist") || w("Credit"), datum: w("DateTimeOriginal"), beschreibung: w("ImageDescription").slice(0, 400), objekt: w("ObjectName"),
        kategorien: (p.categories ?? []).map((c) => c.title.replace(/^Category:/, "")) });
    }
  }
  return aus;
}
async function suche(text, n = 20) {
  const j = await api({ action: "query", list: "search", srnamespace: "6", srsearch: text, srlimit: String(n) });
  return j.query.search.map((s) => s.title);
}

/**
 * Tafel: Die Kategorie entscheidet (Auftrag). Bestätigt ist eine Tafel, wenn das Dateiblatt in einer Kategorie des Werks steht.
 * Jahr aus dem Dateiblatt (1880–1914, sonst gilt es nicht), sonst aus der Kategorie; Urheber aus dem Dateiblatt, sonst der
 * Autor des Werks. Gibt { ok, jahr, jahr_laut, urheber, urheber_laut } oder { ok: false, grund }.
 */
export function tafelBestaetigt(info, werk) {
  if (!info.kategorien.some((k) => werk.kat.includes(k)) && !werk.merkmal.test(info.kategorien.join(" "))) return { ok: false, grund: `nicht in der Kategorie von ${werk.werk}` };
  const j = /\b(18[89]\d|190\d|191[0-4])\b/.exec(info.datum ?? "");
  if (info.datum && !j && /\d{4}/.test(info.datum)) return { ok: false, grund: `Jahr im Dateiblatt passt nicht (${info.datum})` };
  return { ok: true, jahr: j ? Number(j[1]) : werk.jahr, jahr_laut: j ? "Dateiblatt" : "Kategorie", urheber: info.urheber || werk.autor, urheber_laut: info.urheber ? "Dateiblatt" : "Werk" };
}

// ---------- suchen ----------
async function suchen() {
  const d = JSON.parse(await readFile(TEXT, "utf8"));
  const werke = {};
  for (const [k, w] of Object.entries(KATEGORIEN)) {
    const alle = new Set(); for (const kat of w.kat) for (const t of await kategorieDateien(kat)) alle.add(t);
    werke[k] = [...alle].filter((t) => !/modified|retusch|cropped|ausschnitt/i.test(t));
  }
  const warnIds = new Set([...d.eintraege.filter((e) => e.teil === 1).map((e) => e.id), ...d.waldfunde_index.flatMap((w) => w.doppelgaenger)]);
  const plaene = []; // { id, art, typ, kandidaten }
  for (const e of d.eintraege) {
    for (const b of binomen(e.wiss_name)) {
      const re = new RegExp(b.replace(/ /, "[ _]+"), "i");
      plaene.push({ eintrag: e.id, art: b, typ: "tafel", kandidaten: [...werke.koehler.filter((t) => re.test(t)).map((t) => ({ t, w: "koehler" })), ...werke.thome.filter((t) => re.test(t)).map((t) => ({ t, w: "thome" }))] });
      if (istPilzFlechteMoos(e) || warnIds.has(e.id)) plaene.push({ eintrag: e.id, art: b, typ: "foto", kandidaten: (await suche(`"${b}" filetype:bitmap -illustration -drawing`, 12)).map((t) => ({ t })) });
    }
  }
  const sicht = JSON.parse(await readFile(path.join(HIER, "sichtpruefung.json"), "utf8").catch(() => '{"verworfen":{}}')).verworfen;
  const info = await bildInfo([...new Set(plaene.flatMap((p) => p.kandidaten.map((k) => k.t)))]);
  const auswahl = [], verworfen = [];
  const schonArt = new Map();
  for (const p of plaene) {
    const schluessel = `${p.art}|${p.typ}`;
    if (schonArt.has(schluessel)) { for (const g of schonArt.get(schluessel)) auswahl.push({ ...g, eintrag: p.eintrag }); continue; }
    const gut = [];
    for (const k of p.kandidaten) {
      const i = info.get(k.t);
      if (!i) { verworfen.push({ datei: k.t, art: p.art, grund: "Dateiblatt nicht lesbar" }); continue; }
      if (sicht[k.t]) { verworfen.push({ datei: k.t, art: p.art, grund: `Sichtprüfung: ${sicht[k.t]}` }); continue; }
      if (!/^image\/(jpeg|png|tiff|webp)$/.test(i.mime)) { verworfen.push({ datei: k.t, art: p.art, grund: `kein Foto/Bild (${i.mime})` }); continue; }
      const l = lizenzPruefen(i.lizenz_roh);
      if (!l.ok) { verworfen.push({ datei: k.t, art: p.art, grund: l.grund }); continue; }
      const tb = p.typ === "tafel" ? tafelBestaetigt(i, KATEGORIEN[k.w]) : null;
      if (tb && !tb.ok) { verworfen.push({ datei: k.t, art: p.art, grund: tb.grund }); continue; }
      if (p.typ === "foto" && !i.urheber) { verworfen.push({ datei: k.t, art: p.art, grund: "kein Urheber im Dateiblatt" }); continue; }
      if (p.typ === "foto" && /illustration|drawing|zeichnung|tafel|plate|köhler|thomé|herbarium/i.test(`${i.titel} ${i.kategorien.join(" ")}`)) { verworfen.push({ datei: k.t, art: p.art, grund: "kein Foto (Zeichnung, Tafel oder Herbarbeleg)" }); continue; }
      gut.push({ ...i, lizenz: l.lizenz, werk: k.w ? KATEGORIEN[k.w].werk : null, jahr: tb?.jahr ?? null, jahr_laut: tb?.jahr_laut ?? null, urheber: tb?.urheber ?? i.urheber, urheber_laut: tb?.urheber_laut ?? "Dateiblatt",
        rang: (p.typ === "tafel" ? (k.w === "koehler" ? 2 : 1) : 0) + (i.kategorien.some((c) => /Quality images|Featured pictures|Valued images/i.test(c)) ? 3 : 0) + Math.min(1, (i.breite * i.hoehe) / 12e6) });
    }
    gut.sort((a, b) => b.rang - a.rang);
    const n = p.typ === "tafel" ? 1 : 2; // je Art eine Tafel, höchstens zwei Fotos
    const genommen = gut.slice(0, n).map((g, i) => ({ id: `${slug(p.art)}-${p.typ}${i ? "-" + (i + 1) : ""}`, art: p.art, typ: p.typ, datei: g.titel, url: g.url, vorschau: g.vorschau, sha1: g.sha1, lizenz: g.lizenz, lizenz_roh: g.lizenz_roh, urheber: g.urheber.slice(0, 200), urheber_laut: g.urheber_laut, werk: g.werk, jahr: g.jahr, jahr_laut: g.jahr_laut }));
    schonArt.set(schluessel, genommen);
    for (const g of genommen) auswahl.push({ ...g, eintrag: p.eintrag });
  }
  // eine Zeile je Bild, mit allen Einträgen
  const jeBild = new Map();
  for (const a of auswahl) { const x = jeBild.get(a.id) ?? { ...a, eintraege: [] }; delete x.eintrag; if (!x.eintraege.includes(a.eintrag)) x.eintraege.push(a.eintrag); jeBild.set(a.id, x); }
  await writeFile(AUSWAHL, JSON.stringify({ stand: new Date().toISOString().slice(0, 10), kante: KANTE, bilder: [...jeBild.values()] }, null, 1) + "\n");
  await writeFile(path.join(HIER, "verworfen.json"), JSON.stringify(verworfen, null, 1) + "\n");
  console.log(`${jeBild.size} Bilder ausgewählt, ${verworfen.length} verworfen`);
}
const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---------- laden ----------
async function laden() {
  const a = JSON.parse(await readFile(AUSWAHL, "utf8"));
  const info = await bildInfo(a.bilder.map((b) => b.datei));
  await rm(path.join(ZIEL, "bilder"), { recursive: true, force: true });
  await mkdir(path.join(ZIEL, "bilder"), { recursive: true });
  const nachweise = [], fehlt = [];
  for (const b of a.bilder) {
    const i = info.get(b.datei);
    if (!i || i.sha1 !== b.sha1) { fehlt.push({ ...b, grund: i ? "Datei auf Commons geändert" : "Datei nicht mehr da" }); continue; }
    const l = lizenzPruefen(i.lizenz_roh);
    if (!l.ok) { fehlt.push({ ...b, grund: l.grund }); continue; }
    // Rohdaten nach sha1 zwischenspeichern (.roh/, nicht im Repo): ein Neustart lädt nichts doppelt
    if (process.env.BILDER_PROTOKOLL) console.error(`… ${b.id}`);
    const rohDatei = path.join(HIER, ".roh", `${b.sha1}.bin`);
    let roh = await readFile(rohDatei).catch(() => null);
    if (!roh) { roh = await holen(i.vorschau, "bytes"); await mkdir(path.dirname(rohDatei), { recursive: true }); await writeFile(rohDatei, roh); }
    const ziel = path.join(ZIEL, "bilder", `${b.id}.webp`);
    // Pfad statt Standardeingabe: das Durchreichen großer Daten über stdin blieb unter macOS hängen
    const py = spawnSync("python3", ["-c", `import sys\nfrom PIL import Image\nim=Image.open(sys.argv[1]); im=im.convert("RGB"); im.thumbnail((${KANTE},${KANTE})); im.save(sys.argv[2],"WEBP",quality=78,method=6)`, rohDatei, ziel], { timeout: 120000 });
    if (py.status !== 0) { fehlt.push({ ...b, grund: "WebP nicht erzeugt: " + py.stderr.toString().slice(0, 200) }); continue; }
    nachweise.push({ id: b.id, datei: `bilder/${b.id}.webp`, art: b.art, typ: b.typ, eintraege: b.eintraege, urheber: (i.urheber || b.urheber).slice(0, 200), urheber_laut: i.urheber ? "Dateiblatt" : b.urheber_laut, lizenz: l.lizenz, quelle: i.url, commons_datei: b.datei, werk: b.werk, jahr: b.jahr, jahr_laut: b.jahr_laut, groesse: (await stat(ziel)).size });
  }
  await writeFile(path.join(ZIEL, "bildnachweise.json"), JSON.stringify({ stand: a.stand, bilder: nachweise }) + "\n");
  await writeFile(path.join(HIER, "laden-fehlt.json"), JSON.stringify(fehlt, null, 1) + "\n");
  console.log(`${nachweise.length} Bilder geladen (${(nachweise.reduce((s, n) => s + n.groesse, 0) / 1e6).toFixed(1)} MB), ${fehlt.length} fehlen`);
  if (fehlt.length) for (const f of fehlt) console.log(`  fehlt: ${f.datei} – ${f.grund}`);
}

// ---------- Bericht (nur lokal; braucht den Klartext des Textpakets) ----------
async function bericht() {
  const d = JSON.parse(await readFile(TEXT, "utf8"));
  const a = JSON.parse(await readFile(AUSWAHL, "utf8")).bilder;
  const v = JSON.parse(await readFile(path.join(HIER, "verworfen.json"), "utf8"));
  const n = JSON.parse(await readFile(path.join(ZIEL, "bildnachweise.json"), "utf8")).bilder;
  const geladen = new Set(n.map((x) => x.id));
  const da = a.filter((b) => geladen.has(b.id));
  const tafel = new Set(da.filter((b) => b.typ === "tafel").flatMap((b) => b.eintraege)), foto = new Set(da.filter((b) => b.typ === "foto").flatMap((b) => b.eintraege));
  const groesse = n.reduce((s, x) => s + x.groesse, 0);
  const t1 = d.eintraege.filter((e) => e.teil === 1), t1ohne = t1.filter((e) => !tafel.has(e.id));
  const zeilen = [
    "# Bilder für die Naturheilkunde: Bericht", "",
    `Stand ${new Date().toISOString().slice(0, 10)} · erzeugt von \`bilder-holen.mjs\` · Quelle: Wikimedia Commons (Tafeln aus den Kategorien „Köhlers Medizinal-Pflanzen“ und „Thomé, Flora von Deutschland“, Fotos aus der Commons-Suche) · keine KI-Bilder`, "",
    "## Zahlen", "",
    `- Einträge: ${d.eintraege.length}, davon mit wissenschaftlichem Namen ${d.eintraege.filter((e) => e.wiss_name).length}`,
    `- mit Tafel: ${tafel.size} · mit Foto: ${foto.size} · ohne Bild: ${d.eintraege.filter((e) => !tafel.has(e.id) && !foto.has(e.id)).length}`,
    `- Bilder: ${n.length} (${n.filter((x) => x.typ === "tafel").length} Tafeln, ${n.filter((x) => x.typ === "foto").length} Fotos), zusammen ${(groesse / 1e6).toFixed(1)} MB (WebP, längste Seite ${KANTE} px)`,
    `- Giftpflanzen und Pilze aus Teil 1: ${t1.length}, davon mit Tafel ${t1.length - t1ohne.length}, ohne ${t1ohne.length}`,
    `- Lizenzen: ${Object.entries(n.reduce((m, x) => ({ ...m, [x.lizenz]: (m[x.lizenz] ?? 0) + 1 }), {})).map(([l, z]) => `${l} ${z}`).join(", ")}`,
    `- Tafeln, bei denen das Jahr aus der Kategorie stammt (Dateiblatt ohne Jahr): ${n.filter((x) => x.jahr_laut === "Kategorie").length}; Urheber aus dem Werk statt dem Dateiblatt: ${n.filter((x) => x.urheber_laut === "Werk").length}`, "",
    "## Je Art", "", "| Art | Einträge | Tafel | Foto |", "|---|---|---|---|",
    ...[...new Set(da.map((b) => b.art))].sort().map((art) => { const x = da.filter((b) => b.art === art); return `| ${art} | ${[...new Set(x.flatMap((b) => b.eintraege))].length} | ${x.some((b) => b.typ === "tafel") ? "ja" : "nein"} | ${x.filter((b) => b.typ === "foto").length || "nein"} |`; }), "",
    "## Ohne Bild", "", ...d.eintraege.filter((e) => !tafel.has(e.id) && !foto.has(e.id)).map((e) => `- Teil ${e.teil}: ${e.name}${e.wiss_name ? ` (${e.wiss_name})` : " (kein wissenschaftlicher Name)"}`), "",
    "## Verworfen", "", "| Datei | Art | Grund |", "|---|---|---|", ...v.map((x) => `| ${x.datei.replace(/\|/g, "/")} | ${x.art} | ${x.grund.replace(/\|/g, "/")} |`), "",
  ];
  await writeFile(BERICHT, zeilen.join("\n"));
  console.log(`Bericht: ${tafel.size} mit Tafel, ${foto.size} mit Foto, ${(groesse / 1e6).toFixed(1)} MB`);
}

const befehl = process.argv[2];
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  (befehl === "suchen" ? suchen() : befehl === "laden" ? laden() : befehl === "bericht" ? bericht() : Promise.reject(new Error("Aufruf: bilder-holen.mjs suchen|laden|bericht"))).catch((e) => { console.error(e.message, e.cause?.code ?? e.cause ?? ""); process.exit(1); });
}
