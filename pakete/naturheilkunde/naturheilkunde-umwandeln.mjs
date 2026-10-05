#!/usr/bin/env node
// Paket „naturheilkunde“ (in Prüfung): die elf Inhaltsdateien aus quelle/ in ein Datenpaket übernehmen.
// Quelle: quelle/OFFLINE-Naturheilkunde-Inhalt-0 … 10-*.md (Fassungen vom 05.10.2026, unverändert kopiert).
// Aufruf: node pakete/naturheilkunde/naturheilkunde-umwandeln.mjs
//   schreibt inhalt/naturheilkunde.json und den Bericht unzugeordnet.md neu.
//
// Grundsatz: Kein Text wird umgeschrieben. Jeder Eintrag und jedes Kapitel trägt sein Markdown wörtlich (Feld text);
// alle anderen Felder sind daraus abgeleitet und dürfen nichts enthalten, was nicht im Text steht.
// - Einträge (eigene Karte mit Feldern): Teil 1 Abschnitte 3.x und 4.x (Warnkarten), Teil 2–5 die ###-Karten mit
//   „- **Feld:**“-Zeilen, Teil 7 die nummerierten Drogen (A: TCM heute, B: klassische Texte, dazu Warneintrag A/B),
//   Teil 8 die Nummern im Abschnitt „Teil 2 – Regionen“ und „Teil 3 – Evidenz“, Teil 9 die nummerierten Pflanzen.
// - Alles andere ist ein Kapitel (Vorspann, „Lies das zuerst“, Lehre, Fehler alter Bücher, Lücken …), Teil 0, 6 und 10
//   bestehen nur aus Kapiteln. Überschriften ohne eigenen Text sind nur Zusammenhang (abschnitt/region).
// - Belegbarkeit: Stufen aus der Zeile „Belegbarkeit“ (Teil 9 auch aus fett gesetzten Stufen wie **traditionell**).
//   Werden mehrere Stufen genannt, gilt: Warnung zuerst, sonst die schwächere Stufe (Bericht: „gemischt“). Teil 1 ist das
//   Giftkapitel → warnung. Teil 7–9 ohne Stufe → „überliefert, nicht geprüft“ nach der Kopfregel „Lies das zuerst“.
//   Teil 2–5 ohne erkennbare Stufe → unklar und in den Bericht.
// - Ort: „Suche und Karte“ nur, wenn die Zeile das ohne Einschränkung sagt (bisher nirgends); fehlt die Zeile → handbuch.
// - Marken (sperren die Anzeige als Mittel): Stichwörter im Text, lieber eine zu viel; Teil 1 immer giftig.
// - Teil 6: Tabellenzeilen werden zu wechselwirkungen[] (A und Nachträge) bzw. ausfall[] (C und Nachträge);
//   gesperrt sind Zeilen mit „keine Quelle gelesen“, „(Lücke)“, Evidenz „Lücke“ oder „gesperrt“ (Block „Sperre“).
//   Die „Captcha-Sperre“ in den Lücken ist keine Sperre im Sinn des Blocks.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
export const QUELLORDNER = path.join(HIER, "quelle");
const ZIEL = path.join(HIER, "inhalt", "naturheilkunde.json");
const BERICHT = path.join(HIER, "unzugeordnet.md");

export const TEILE = [
  [0, "OFFLINE-Naturheilkunde-Inhalt-0-Waldfunde-Beschwerden.md"],
  [1, "OFFLINE-Naturheilkunde-Inhalt-1-Gift-und-Sicherheit.md"],
  [2, "OFFLINE-Naturheilkunde-Inhalt-2-Baeume-Straeucher.md"],
  [3, "OFFLINE-Naturheilkunde-Inhalt-3-Krautschicht.md"],
  [4, "OFFLINE-Naturheilkunde-Inhalt-4-Beeren-Flechten-Wunden-Hygiene.md"],
  [5, "OFFLINE-Naturheilkunde-Inhalt-5-Aussereuropaeisch.md"],
  [6, "OFFLINE-Naturheilkunde-Inhalt-6-Wechselwirkungen.md"],
  [7, "OFFLINE-Naturheilkunde-Inhalt-7-TCM.md"],
  [8, "OFFLINE-Naturheilkunde-Inhalt-8-Schamanismus-Volksmedizin.md"],
  [9, "OFFLINE-Naturheilkunde-Inhalt-9-Alte-Kraeuterbuecher.md"],
  [10, "OFFLINE-Naturheilkunde-Inhalt-10-Lehre-der-Tradition.md"],
].map(([nr, datei]) => ({ nr, datei }));

export const BELEGBARKEIT = ["belegt", "traditionell", "ueberliefert_nicht_geprueft", "unklar", "warnung"];
export const ORTE = ["handbuch", "suche_und_karte"];
export const MARKEN = ["psychoaktiv", "abtreibend", "giftig"];
const PRUEFSTATUS = "in_pruefung";
/** von schwach nach stark; bei mehreren genannten Stufen gilt die schwächere (Warnung geht immer vor) */
const STUFEN_RANG = ["unklar", "ueberliefert_nicht_geprueft", "traditionell", "belegt"];

// ---------------------------------------------------------------------------------------------------------------
// Hilfen

const zeilenVon = (md) => md.replace(/\r\n/g, "\n").split("\n");
const ueberschrift = (z) => { const m = z.match(/^(#{1,6})\s+(.*?)\s*$/); return m ? { ebene: m[1].length, titel: m[2] } : null; };
const ohneFett = (s) => s.replace(/\*\*/g, "");
const ohneKlammern = (s) => { let t = s, alt; do { alt = t; t = t.replace(/\([^()]*\)/g, ""); } while (t !== alt); return t; };
const leer = (s) => !s || !s.trim();
/** Zeilen ohne eigenen Inhalt: leer, Trennlinie „---“ oder Überschrift */
const inhaltlos = (zeilen) => zeilen.every((z) => leer(z) || /^-{3,}\s*$/.test(z) || ueberschrift(z));
const zellen = (z) => z.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
const textAus = (zeilen) => { const z = [...zeilen]; while (z.length && leer(z.at(-1))) z.pop(); while (z.length && leer(z[0])) z.shift(); return z.join("\n"); };

/** ASCII-Kennung aus einem deutschen Namen (ä → ae …), höchstens etwa 40 Zeichen, an einem Bindestrich gekürzt */
export function slug(s, max = 40) {
  let t = s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (t.length > max) { t = t.slice(0, max); if (t.includes("-")) t = t.slice(0, t.lastIndexOf("-")); }
  return t || "x";
}

/** Lateinischer Artname (Gattung + Art, „agg.“, „spp.“ oder abgekürzte Gattung „B. pubescens“) */
const LATEIN = /^(?:[A-Z][a-z]+(?: ×| x)? (?:[a-z][a-z-]+|spp?\.|spec\.)(?: (?:agg\.|var\. [a-z]+|subsp\. [a-z]+))?|[A-Z]\. [a-z][a-z-]+)$/;
function lateinIn(teile) {
  const funde = [];
  for (const roh of teile) for (let p of roh.split(/[,;]| \/ |\/| = /)) {
    p = p.replace(/^\s*(?:syn\.|=)\s*/, "").replace(/\s+u\. a\.$/, "").replace(/\s+L\.$/, "").trim();
    if (LATEIN.test(p) && !funde.includes(p)) funde.push(p);
  }
  return funde;
}

// ---------------------------------------------------------------------------------------------------------------
// Felder aus dem Text eines Eintrags

/** Schlüssel der abgeleiteten Felder für eine Feldbeschriftung (Teil einer „A / B“-Beschriftung) */
function feldSchluessel(teil) {
  const t = teil.toLowerCase().trim();
  if (t === "ort") return "ort";
  if (t.startsWith("belegbarkeit")) return "belegbarkeit";
  if (t === "quellen" || t === "quelle") return "quellen";
  if (t.includes("verwechslung")) return "verwechslung";
  if (/^(vorsicht|gefahr|gefahren|warnung|symptome|wirkung)\b/.test(t)) return "warnung";
  if (/^(so erkennst du (sie|ihn) im wald|woran man sie erkennt|merkmal laut quellen)/.test(t)) return "aussehen";
  if (t.startsWith("zubereitung")) return "zubereitung";
  if (t.startsWith("anwendung laut monographie")) return "anwendung";
  return null;
}
const FREIE_LABELS = ["Belegbarkeit", "Quellen", "Quelle", "Ort", "Warnung", "Gefahren", "Gefahr"];

/**
 * Feldbeschriftungen einer Zeile: fett („**Feld:**“, überall) und frei („- Feld:“ am Zeilenanfang, „Ort:“/„Quellen:“ …
 * nach Satzende). Der Wert reicht bis zur nächsten Beschriftung derselben Zeile.
 */
function beschriftungen(zeile, frei) {
  const treffer = [];
  for (const m of zeile.matchAll(/\*\*([^*\n]{2,90}?):\*\*\s*/g)) treffer.push({ label: m[1].trim(), von: m.index, wert: m.index + m[0].length });
  if (frei) {
    const a = zeile.match(/^\s*-\s+([A-ZÄÖÜ][^:*\n]{1,60}?):\s/);
    if (a && !treffer.some((t) => t.von === 0)) treffer.push({ label: a[1].trim(), von: 0, wert: a[0].length });
    const re = new RegExp(`(^|[.;)]\\s+|·\\s+|\\*\\*)(${FREIE_LABELS.join("|")}):(?:\\*\\*)?\\s`, "g");
    for (const m of zeile.matchAll(re)) {
      const von = m.index + m[1].length - (m[1] === "**" ? 2 : 0);
      if (treffer.some((t) => von >= t.von && von < t.wert)) continue;
      if (treffer.some((t) => Math.abs(t.von - von) < 3)) continue;
      treffer.push({ label: m[2], von, wert: m.index + m[0].length });
    }
  }
  treffer.sort((a, b) => a.von - b.von);
  return treffer.map((t, i) => ({ label: t.label, wert: zeile.slice(t.wert, i + 1 < treffer.length ? treffer[i + 1].von : undefined).trim() }));
}

/** alle Felder eines Eintrags: { felder: {Beschriftung: Wert}, nach: {schluessel: [Werte]} } */
export function felderAus(text, frei) {
  const felder = {}, nach = {};
  const zeilen = text.split("\n");
  for (const z of ueberschrift(zeilen[0]) ? zeilen.slice(1) : zeilen) {
    for (const { label, wert } of beschriftungen(z, frei)) {
      felder[label] = felder[label] ? `${felder[label]}\n${wert}` : wert;
      const schluessel = [...new Set(label.split(" / ").map(feldSchluessel).filter(Boolean))];
      for (const s of schluessel) (nach[s] ??= []).push(wert);
    }
  }
  return { felder, nach };
}

/** genannte Stufen in einem Belegbarkeits-Text */
export function stufenIn(s) {
  let t = ohneFett(s);
  // „Anwendung / Belegbarkeit: … Belegbarkeit: unklar. …“: die innere Angabe gilt
  const innen = t.match(/Belegbarkeit:\s*([^.]*)/);
  if (innen) t = innen[1];
  const f = new Set();
  if (/(^|[^a-zäöüß])warnung\b/i.test(t)) f.add("warnung");
  if (/überliefert/i.test(t)) f.add("ueberliefert_nicht_geprueft");
  if (/\btraditionell/i.test(t)) f.add("traditionell");
  for (const m of t.matchAll(/\bbelegt\b/gi)) if (!/nicht\s+(?:\S+\s+){0,3}$/i.test(t.slice(Math.max(0, m.index - 30), m.index))) f.add("belegt");
  if (/\bunklar\b|stufe offen|einstufung nicht genannt|^\s*nicht gefunden/i.test(t)) f.add("unklar");
  return f;
}
function stufeAus(f) {
  if (f.has("warnung")) return "warnung";
  return STUFEN_RANG.find((s) => f.has(s)) ?? null;
}

const ORT_EINSCHRAENKUNG = /erst nach|nur als|nur über|\bnie\b|\bnicht\b|Fachprüfung/i;
export function ortAus(werte) {
  if (!werte?.length) return { ort: "handbuch", ort_fehlt: true };
  const t = werte.join(" ");
  if (/^Handbuch\b/i.test(t.trim())) return { ort: "handbuch" };
  if (/^„?Suche und Karte/i.test(t.trim()) && !ORT_EINSCHRAENKUNG.test(t)) return { ort: "suche_und_karte" };
  if (/Suche und Karte/i.test(t)) return { ort: "handbuch", unsicher: "Ort nennt „Suche und Karte“ mit Einschränkung, aber nicht „Handbuch“" };
  return { ort: "handbuch", unsicher: "Ort-Zeile ohne „Handbuch“ oder „Suche und Karte“" };
}

const MARKEN_MUSTER = {
  psychoaktiv: /psychoaktiv\w*|halluzino\w*|Halluzination\w*|Rauschmittel|Rauschzustand|Rausch\b|berausch\w*|Suchtgift\w*|Suchtmittel\w*|Trance|deliriant|\bDelir\w*|psychedel\w*|Psychedelika|Meskalin|Psilocybin|\bDMT\b/gi,
  abtreibend: /abtreib\w*|Abtreibung\w*|\bAbort\w*|Fehlgeburt\w*|wehenfördernd|wehenauslösend|Regel fördernd/gi,
  giftig: /\w*giftig\w*|tödlich\w*|Giftpflanze\w*|Vergiftung\w*|\bGift\b|\w*toxisch\b/gi,
};
/** Marken mit Stichwort; Quellen-Adressen und Feldbeschriftungen werden nicht durchsucht */
export function markenAus(text) {
  const t = text.replace(/https?:\/\/\S+/g, " ").replace(/\*\*[^*\n]{2,90}?:\*\*/g, " ");
  const aus = [];
  for (const [marke, re] of Object.entries(MARKEN_MUSTER)) {
    for (const m of t.matchAll(re)) {
      const w = m[0];
      if (marke === "giftig" && (/^un|^nicht|ungiftig|^Giftigkeit$/i.test(w) || /^giftige\s+Verwechslung/i.test(t.slice(m.index, m.index + 25)))) continue;
      const davor = t.slice(Math.max(0, m.index - 12), m.index);
      if (marke === "giftig" && /(nicht|kein|keine)\s+$/i.test(davor)) continue;
      aus.push({ marke, stichwort: w, stelle: t.slice(Math.max(0, m.index - 40), m.index + w.length + 40).replace(/\s+/g, " ").trim() });
      break;
    }
  }
  return aus;
}

const AUSSEHEN_WOERTER = [
  "Baum", "Strauch", "Zwergstrauch", "Staude", "Rosette", "Flechte", "Moos", "Pilz", "Nadeln", "Zapfen", "Rinde", "Kätzchen",
  "gefiedert", "lanzettlich", "herzförmig", "eiförmig", "kreisrund", "rundlich", "gesägt", "gelappt", "behaart", "filzig",
  "parallelnervig", "netznervig", "ganzrandig", "dreiteilig", "grundständig", "gegenständig", "wechselständig",
  "Dolde", "Dolden", "Ähre", "Traube", "Köpfchen", "Beere", "Beeren", "Nuss", "Kapsel", "Steinfrucht", "Milchsaft",
  "Knoblauchgeruch", "duftend", "honigduftend", "aromatisch", "Geruch", "Duft",
];
const FARBEN = ["weiß", "gelb", "blau", "violett", "rosa", "rot", "purpur", "schwarz", "grün", "braun", "orange", "silbrig"];
/** Stichwörter zum Aussehen: nur Wörter aus einer festen Liste, die im Text vorkommen */
export function aussehenAus(text) {
  if (!text) return [];
  const aus = [];
  for (const w of AUSSEHEN_WOERTER) if (new RegExp(`(^|[^A-Za-zÄÖÜäöüß])${w}([^A-Za-zÄÖÜäöüß]|$)`, "i").test(text)) aus.push(w);
  for (const f of FARBEN) if (new RegExp(`(^|[^A-Za-zÄÖÜäöüß])${f}`, "i").test(text)) aus.push(f);
  return aus;
}

/** Anwendungsart aus der Zubereitung: Tee, äußerlich, kauen (nur wenn die Zeile es nennt) */
export function anwendungAus(werte) {
  const t = (werte ?? []).join(" ");
  const a = [];
  if (/\bTee\b|Aufguss|aufgegossen|Teeaufguss/i.test(t)) a.push("tee");
  if (/äußerlich|Umschlag|Umschläge|Auflage|Salbe|Wickel|Spülung|Bad\b|Bäder/i.test(t)) a.push("aeusserlich");
  if (/\bkauen|gekaut/i.test(t)) a.push("kauen");
  return a;
}

// ---------------------------------------------------------------------------------------------------------------
// Gliederung je Teil

/**
 * Regel je Teil: welche Überschriften-Blöcke Einträge sind und welche Blöcke Einträge im Fließtext tragen
 * (fett nummerierte Absätze oder nummerierte Listenpunkte).
 */
const REGELN = {
  1: { eintrag: (u) => u.ebene === 3 && /^[34]\.\d+\s/.test(u.titel), frei: false },
  2: { eintrag: (u, block) => u.ebene === 3 && feldZeilen(block) >= 2, frei: false },
  3: { eintrag: (u, block) => u.ebene === 3 && feldZeilen(block) >= 2, frei: false },
  4: { eintrag: (u, block) => u.ebene === 3 && feldZeilen(block) >= 2, frei: false },
  5: { eintrag: (u, block) => u.ebene === 3 && feldZeilen(block) >= 2, frei: false },
  7: {
    frei: true,
    teilen: [
      { titel: /^Teil 2: Einzeldrogen/, start: /^\*\*(\d+(?:–\d+)?)\.\s+(.*?)\*\*/, art: "eintrag", kennung: "heute" },
      { titel: /^3\. Drogen/, start: /^\*\*(?:(\d+)\.|Warneintrag ([AB]):)\s+(.*?)\*\*/, art: "eintrag", kennung: "klassisch" },
      { titel: /^Teil [34]: /, start: /^\*\*(\d+)\.\s+(.*?)\*\*/, art: "kapitel", kennung: "heute" },
    ],
  },
  8: { eintrag: (u, block, vorfahren) => u.ebene === 4 && /^\d+\.\s/.test(u.titel) && vorfahren.some((v) => /^Teil [23] –/.test(v.titel)), frei: true },
  9: { frei: true, teilen: [{ titel: /^[AB]\. Pflanzen/, start: /^(\d+)\.\s+\*\*(.*?)\*\*/, art: "eintrag", kennung: "" }] },
};
function feldZeilen(block) { return block.filter((z) => /^\s*-\s+\*\*[^*]+:\*\*/.test(z)).length; }
/** Überschriften, die als „abschnitt“ nichts sagen (Warnblock vor den Karten), werden übersprungen */
const ABSCHNITT_UEBERSPRINGEN = [/^Wichtige Warnung/, /^Zentrale Warnung/];

/** Zerlegt eine Datei in Stücke (eintrag/kapitel) mit wörtlichem Text, in Reihenfolge der Quelle */
export function gliedern(md, teil) {
  const zeilen = zeilenVon(md);
  const regel = REGELN[teil] ?? {};
  const kopf = [];
  zeilen.forEach((z, i) => { const u = ueberschrift(z); if (u) kopf.push({ ...u, zeile: i }); });
  const stuecke = [];
  const bloecke = [];
  // Vorspann bis zur ersten Überschrift unter der Dateiüberschrift
  const erste = kopf.findIndex((u, i) => i > 0);
  const vorspannEnde = erste >= 0 ? kopf[erste].zeile : zeilen.length;
  stuecke.push({ art: "kapitel", titel: "Vorspann", text: textAus(zeilen.slice(0, vorspannEnde)), von: 0, bis: vorspannEnde, abschnitt: ohneFett(kopf[0]?.titel ?? "") });
  for (let k = 1; k < kopf.length; k++) {
    const u = kopf[k];
    const bis = k + 1 < kopf.length ? kopf[k + 1].zeile : zeilen.length;
    const vorfahren = [];
    for (let j = k - 1, eb = u.ebene; j >= 0; j--) if (kopf[j].ebene < eb) { vorfahren.push(kopf[j]); eb = kopf[j].ebene; }
    bloecke.push({ u, von: u.zeile, bis, vorfahren, vorher: kopf.slice(0, k) });
  }
  for (const b of bloecke) {
    const block = zeilen.slice(b.von, b.bis);
    const rumpf = block.slice(1);
    const abschnitt = ohneFett(b.vorfahren.find((v) => !ABSCHNITT_UEBERSPRINGEN.some((re) => re.test(v.titel)))?.titel ?? "");
    const teilen = regel.teilen?.find((t) => t.titel.test(b.u.titel));
    if (teilen) { stuecke.push(...teileBlock(block, b, teilen)); continue; }
    if (inhaltlos(rumpf)) continue; // Überschrift ohne eigenen Text (oder nur „---“): nur Zusammenhang
    if (regel.eintrag?.(b.u, block, b.vorfahren)) {
      // Teil 8: Region aus der letzten Überschrift gleicher Ebene ohne Nummer
      const region = teil === 8 ? b.vorher.filter((v) => v.ebene === b.u.ebene && !/^\d+\./.test(v.titel)).at(-1)?.titel : undefined;
      stuecke.push({ art: "eintrag", titel: ohneFett(b.u.titel), text: textAus(block), von: b.von, bis: b.bis, abschnitt, ...(region ? { region } : {}) });
    } else {
      stuecke.push({ art: "kapitel", titel: ohneFett(b.u.titel), text: textAus(block), von: b.von, bis: b.bis, abschnitt });
    }
  }
  return { zeilen, stuecke };
}

/** Block mit Einträgen im Fließtext: jeder Eintrag reicht bis zur nächsten Leerzeile; der Rest wird Kapitel */
function teileBlock(block, b, regel) {
  const aus = [];
  let rest = [], restVon = null;
  const restAbschliessen = (bis) => {
    if (!inhaltlos(rest)) aus.push({ art: "kapitel", titel: ohneFett(b.u.titel) + (aus.length ? " (Nachsatz)" : ""), text: textAus(rest), von: restVon, bis, abschnitt: ohneFett(b.u.titel), ...(aus.length ? { nachsatz: true } : {}) });
    rest = []; restVon = null;
  };
  for (let i = 0; i < block.length; i++) {
    const m = i > 0 ? block[i].match(regel.start) : null;
    if (!m) { if (restVon === null) restVon = b.von + i; rest.push(block[i]); continue; }
    restAbschliessen(b.von + i);
    let j = i + 1;
    while (j < block.length && !leer(block[j]) && !regel.start.test(block[j])) j++;
    const nr = m[1] ?? m[2];
    const titel = ohneFett(m[m.length - 1]).trim().replace(/[.:]$/, "");
    aus.push({ art: regel.art, titel, nr, text: textAus(block.slice(i, j)), von: b.von + i, bis: b.von + j, abschnitt: ohneFett(b.u.titel), kennung: regel.kennung });
    i = j - 1;
  }
  restAbschliessen(b.von + block.length);
  return aus;
}

// ---------------------------------------------------------------------------------------------------------------
// Einträge

/** Name, lateinischer Name, Nummer und Gefahrenstufe aus einer Überschrift */
export function nameAus(titel, teil, kennung) {
  let t = ohneFett(titel).trim();
  let nr = null, gefahrenstufe = null;
  const n = t.match(/^(\d+\.\d+|\d+)\.?\s+/);
  if (n) { nr = n[1]; t = t.slice(n[0].length); }
  const g = t.match(/\s+–\s+(Gefahrenstufe\b.*)$/);
  if (g) { gefahrenstufe = g[1]; t = t.slice(0, g.index); }
  let name, latein;
  if (teil === 7 && kennung === "klassisch") {
    // Teil 7 B: „Pinyin / Latein / Deutsch“
    const teile = t.split(/ \/ | – /).map((x) => x.trim());
    latein = lateinIn(teile.map((x) => x.replace(/\s*\(.*\)\s*/g, "")).concat(teile.flatMap((x) => [...x.matchAll(/\(([^()]*)\)/g)].map((m) => m[1]))));
    name = teile.filter((x) => !lateinIn([x.replace(/\s*\(.*\)\s*/g, "")]).length).map((x) => ohneKlammern(x).replace(/\s+/g, " ").trim()).filter(Boolean).join(" / ");
  } else {
    const haupt = t.split(" – ")[0];
    const klammern = [...haupt.matchAll(/\(([^()]*)\)/g)].map((m) => m[1]);
    latein = lateinIn(klammern.length ? klammern : t.split(" – ").slice(1));
    name = ohneKlammern(haupt).replace(/\s+/g, " ").replace(/\s+([.,;])/g, "$1").trim();
  }
  const wiss = latein.length ? latein.join(/↔/.test(t) ? " ↔ " : "; ") : null;
  return { name: name || null, wiss_name: wiss, nr, gefahrenstufe };
}

function eintragBauen(s, teil, ids, bericht) {
  const { name, wiss_name, nr: nrTitel, gefahrenstufe } = nameAus(s.titel, teil, s.kennung);
  const nr = s.nr ?? nrTitel;
  const frei = REGELN[teil]?.frei ?? false;
  const { felder, nach } = felderAus(s.text, frei);
  // Kennung
  const erstes = (name ?? s.titel).split(/ und | \/ |, /)[0];
  const grund = teil === 1 || teil === 7 || erstes.endsWith("-") ? (name ?? s.titel) : erstes;
  const teile = [`t${teil}`];
  if (s.kennung) teile.push(s.kennung);
  if (nr) teile.push(slug(String(nr)));
  let id = `${teile.join("-")}-${slug(grund)}`;
  for (let k = 2; ids.has(id); k++) id = `${teile.join("-")}-${slug(grund)}-${k}`;
  ids.add(id);
  const unsicher = [];
  // Belegbarkeit
  const belegText = nach.belegbarkeit?.join(" | ") ?? null;
  const stufen = new Set();
  for (const w of nach.belegbarkeit ?? []) for (const x of stufenIn(w)) stufen.add(x);
  if (teil === 9) for (const m of s.text.matchAll(/\*\*(belegt|traditionell|WARNUNG|Warnung|unklar|überliefert, nicht geprüft)\*\*/g)) for (const x of stufenIn(m[1])) stufen.add(x);
  let belegbarkeit = stufeAus(stufen), herkunft = "zeile";
  if (teil === 1) {
    if (belegbarkeit && belegbarkeit !== "warnung") bericht.giftkapitel.push({ id, name, text: belegText, stufe: belegbarkeit });
    belegbarkeit = "warnung"; herkunft = "giftkapitel";
  } else if (!belegbarkeit) {
    if ([7, 8, 9].includes(teil)) { belegbarkeit = "ueberliefert_nicht_geprueft"; herkunft = "kopfregel"; }
    else { belegbarkeit = "unklar"; herkunft = belegText ? "unlesbar" : "fehlt"; unsicher.push({ feld: "belegbarkeit", grund: belegText ? `keine Stufe erkennbar in „${belegText}“` : "keine Zeile Belegbarkeit" }); }
  }
  if (stufen.size > 1 && teil !== 1) bericht.gemischt.push({ id, name, text: belegText ?? [...stufen].join(", "), stufe: belegbarkeit });
  // Ort
  const o = ortAus(nach.ort);
  if (o.unsicher) unsicher.push({ feld: "ort", grund: o.unsicher });
  if (!name) unsicher.push({ feld: "name", grund: "kein Name in der Überschrift" });
  // Marken
  const marken = teil === 1 ? [{ marke: "giftig", stichwort: "Giftkapitel (Teil 1)", stelle: "" }] : [];
  for (const m of markenAus(s.text)) if (!marken.some((x) => x.marke === m.marke)) marken.push(m);
  const quellen = (nach.quellen ?? []).flatMap((q) => q.split(/\s*;\s+|\s+·\s+/)).map((q) => q.trim().replace(/[.;]$/, "")).filter(Boolean);
  const e = {
    id, teil, ...(nr ? { nr: String(nr) } : {}), name, wiss_name, titel: s.titel, abschnitt: s.abschnitt,
    ...(s.region ? { region: s.region } : {}),
    ort: o.ort, ...(nach.ort ? { ort_text: nach.ort.join(" ") } : {}),
    belegbarkeit, ...(belegText ? { belegbarkeit_text: belegText } : {}),
    pruefstatus: PRUEFSTATUS,
    marken: MARKEN.filter((m) => marken.some((x) => x.marke === m)),
    ...(gefahrenstufe ? { gefahrenstufe } : {}),
    ...(nach.warnung ? { warnung: nach.warnung.join("\n") } : {}),
    ...(nach.verwechslung ? { verwechslung: nach.verwechslung.join("\n") } : {}),
    quellen,
    beschwerden: [],
    anwendung: anwendungAus(nach.zubereitung),
    aussehen: aussehenAus(nach.aussehen?.join(" ")),
    // felder (alle Feldzeilen) nicht im Paket: stehen wörtlich in text; spart ein Fünftel (Speicher im Browser, 0.6.0)
    text: s.text,
  };
  return { e, meta: { unsicher, ort_fehlt: !!o.ort_fehlt, herkunft, marken } };
}

// ---------------------------------------------------------------------------------------------------------------
// Namen auflösen (Indizes in Teil 0)

const norm = (s) => s.toLowerCase().replace(/[-–\/]/g, " ").replace(/[^a-zäöüß0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const ENDUNGEN = ["blüten", "blüte", "blätter", "blatt", "rinde", "wurzel", "pulver", "öl", "beeren", "beere", "samen"];
function woerterVon(e) {
  if (!e._w) {
    const t = ohneFett(e.titel).split(" – ")[0].toLowerCase(); // ohne Familie/Herkunft nach „ – “
    e._w = new Set([...norm(t).split(" "), ...t.replace(/-/g, "").replace(/[^a-zäöüß0-9 ]/g, " ").split(/\s+/)].filter(Boolean));
    e._n = " " + norm(t) + " ";
  }
  return e._w;
}
/** Begriff → Einträge: ganzer Ausdruck im Titel, sonst erstes Wort (auch ohne Endung wie „-blüten“) als Wort, sonst als Wortteil */
export function aufloesen(begriff, kandidaten) {
  const t = norm(ohneKlammern(ohneFett(begriff)));
  if (!t) return [];
  for (const e of kandidaten) woerterVon(e);
  const ganz = kandidaten.filter((e) => e._n.includes(" " + t + " "));
  if (ganz.length) return ganz;
  const w = t.split(" ")[0];
  const varianten = [w];
  for (const end of ENDUNGEN) if (w.endsWith(end) && w.length - end.length >= 4) varianten.push(w.slice(0, -end.length));
  for (const v of [...varianten]) { if (v.endsWith("en")) varianten.push(v.slice(0, -2)); if (/[ne]$/.test(v)) varianten.push(v.slice(0, -1)); }
  const vs = [...new Set(varianten)].filter((v) => v.length >= 4);
  for (const v of vs) { const r = kandidaten.filter((e) => e._w.has(v)); if (r.length) return r; }
  for (const v of vs.filter((x) => x.length >= 5)) { const r = kandidaten.filter((e) => [...e._w].some((x) => x.includes(v))); if (r.length) return r; }
  return [];
}

function abschnittZeilen(zeilen, kopfMuster) {
  const i = zeilen.findIndex((z) => kopfMuster.test(z));
  if (i < 0) return [];
  let j = i + 1;
  while (j < zeilen.length && !/^#{1,2}\s/.test(zeilen[j])) j++;
  return zeilen.slice(i + 1, j);
}

function waldfundeAus(zeilen, eintraege, nichtAufgeloest) {
  const teil1 = eintraege.filter((e) => e.teil === 1), karten = eintraege.filter((e) => e.teil >= 2 && e.teil <= 5);
  const aus = [];
  for (const z of abschnittZeilen(zeilen, /^## 1\. Ich finde/)) {
    if (!z.startsWith("| ") || /^\|\s*Ich finde/.test(z) || /^\|---/.test(z)) continue;
    const [m, kand, dopp] = zellen(z);
    const merkmal = ohneFett(m).trim();
    const kandidaten = [];
    const kandText = ohneFett(kand);
    if (/^Teil 5$/.test(kandText.trim())) kandidaten.push(...eintraege.filter((e) => e.teil === 5).map((e) => e.id));
    else for (const teilText of ohneKlammern(kandText).split(/,/).map((x) => x.trim()).filter(Boolean)) {
      const r = aufloesen(teilText, karten);
      if (r.length) kandidaten.push(...r.map((e) => e.id)); else nichtAufgeloest.push({ index: "waldfunde", wo: merkmal, name: teilText, feld: "kandidaten" });
    }
    const doppelgaenger = [];
    const nummern = [...(dopp ?? "").matchAll(/\b([34]\.\d{1,2})\b/g)].map((x) => x[1]);
    if (nummern.length) for (const n of nummern) {
      const e = teil1.find((x) => x.nr === n);
      if (e) doppelgaenger.push(e.id); else nichtAufgeloest.push({ index: "waldfunde", wo: merkmal, name: n, feld: "doppelgaenger" });
    } else for (let stueck of ohneKlammern(ohneFett(dopp ?? "")).split(/[,;.]/)) {
      stueck = stueck.split(":")[0].trim();
      if (!stueck || /^[a-zäöü]/.test(stueck)) continue;
      const r = aufloesen(stueck, teil1).length ? aufloesen(stueck, teil1) : aufloesen(stueck, eintraege);
      if (r.length) doppelgaenger.push(...r.map((e) => e.id)); else nichtAufgeloest.push({ index: "waldfunde", wo: merkmal, name: stueck, feld: "doppelgaenger" });
    }
    aus.push({ merkmal, kandidaten: [...new Set(kandidaten)], doppelgaenger: [...new Set(doppelgaenger)], text: z });
  }
  return aus;
}

function beschwerdenAus(zeilen, eintraege, nichtAufgeloest) {
  const karten = eintraege.filter((e) => e.teil >= 2 && e.teil <= 5);
  const block = abschnittZeilen(zeilen, /^## 2\. Beschwerde-Suche/);
  const gruppen = [];
  for (const z of block) {
    const m = z.match(/^\*\*([^*]+?)(:?)\*\*(:?)\s*(.*)$/);
    if (m) gruppen.push({ titel: m[1].trim(), inline: (m[2] || m[3]) ? m[4] : null, zeilen: [z] });
    else if (gruppen.length) gruppen.at(-1).zeilen.push(z);
  }
  return gruppen.map((g) => {
    // „Husten, Halsreiz“ → Husten, mit Halsreiz; „Magen und Darm: Blähungen, …“; einzelne kleingeschriebene Wörter
    // („Durchfall, leicht“) gehören zur Beschwerde selbst.
    let beschwerde, mit;
    const titel = ohneKlammern(g.titel).trim();
    if (titel.includes(":")) { [beschwerde] = titel.split(":"); mit = titel.split(":")[1].split(",").map((x) => x.trim()).filter(Boolean); }
    else { const teile = titel.split(",").map((x) => x.trim()); beschwerde = teile.shift(); mit = teile; }
    while (mit.length && /^[a-zäöü]\S*$/.test(mit[0])) beschwerde += ", " + mit.shift();
    const namen = [];
    if (g.inline !== null && g.inline !== undefined) {
      const satz = ohneKlammern(ohneFett(g.inline)).split(/\.\s|\.$/)[0];
      namen.push(...satz.split(/,/));
    } else for (const z of g.zeilen) {
      if (!z.startsWith("| ") || /^\|\s*Pflanze/.test(z) || /^\|---/.test(z)) continue;
      namen.push(...ohneKlammern(ohneFett(zellen(z)[0])).split(/,|\//));
    }
    const ids = [];
    for (const n of namen.map((x) => x.trim()).filter(Boolean)) {
      const r = aufloesen(n, karten);
      if (r.length) ids.push(...r.map((e) => e.id)); else nichtAufgeloest.push({ index: "beschwerden", wo: beschwerde.trim(), name: n, feld: "eintraege" });
    }
    return { beschwerde: beschwerde.trim(), mit, eintraege: [...new Set(ids)], text: textAus(g.zeilen) };
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Teil 6: Wechselwirkungen und Ausfall

export const istGesperrt = (zeile) => /keine (?:belastbare )?Quelle[^|]*gelesen|\(Lücke\)|\|\s*Lücke\s*\||gesperrt/i.test(zeile);

function tabellenAus(zeilen) {
  const ww = [], ausfall = [];
  let art = null;
  for (const z of zeilen) {
    if (/^\| Nr \| Pflanze \|/.test(z)) { art = "ww"; continue; }
    if (/^\| Nr \| Wirkstoffklasse \|/.test(z)) { art = "ausfall"; continue; }
    if (/^\| Medikamentenklasse \| Belegte Pflanzen/.test(z)) { art = "klassen"; continue; }
    if (!z.startsWith("|")) { art = null; continue; }
    if (/^\|-/.test(z) || !art) continue;
    const c = zellen(z);
    if (art === "ww") {
      const [nr, pflanze, mit, wirkung, schweregrad, evidenz, belege] = c;
      ww.push({ id: `t6-ww-${slug(nr)}`, nr, pflanze, mit, wirkung, schweregrad, evidenz, belege, gesperrt: istGesperrt(z), text: z });
    } else if (art === "ausfall") {
      const [nr, klasse, folge, belege, evidenz] = c;
      ausfall.push({ id: `t6-ausfall-${slug(nr)}`, nr, klasse, folge, belege, evidenz, gesperrt: istGesperrt(z), text: z });
    } else if (art === "klassen" && istGesperrt(z)) {
      // Medikamentenklassen ohne gelesene Quelle (Tabelle B): gesperrt, keine Pflanze
      const [klasse, , befund] = c;
      ww.push({ id: `t6-ww-klasse-${slug(klasse)}`, nr: null, pflanze: null, mit: klasse, wirkung: ohneFett(befund), schweregrad: null, evidenz: null, belege: null, gesperrt: true, text: z });
    }
  }
  for (const w of [...ww, ...ausfall]) for (const k of Object.keys(w)) if (w[k] === "" ) w[k] = null;
  return { ww, ausfall };
}

// ---------------------------------------------------------------------------------------------------------------
// Erste-Hilfe-Karte (Teil 1)

const NUMMERN_NAMEN = { "01 406 43 43": "Vergiftungsinformationszentrale (VIZ) Wien", "144": "Rettung", "112": "Euro-Notruf" };
const telVon = (n) => { const d = n.replace(/\D/g, ""); return d.startsWith("0") ? "+43" + d.slice(1) : d; };
export function ersteHilfeAus(md) {
  const zeilen = zeilenVon(md);
  const i = zeilen.findIndex((z) => /^## Erste-Hilfe-Karte/.test(z));
  if (i < 0) return null;
  let j = i + 1;
  while (j < zeilen.length && !/^#{1,6}\s/.test(zeilen[j])) j++;
  const text = textAus(zeilen.slice(i + 1, j));
  const nummern = [];
  for (const m of text.matchAll(/\b0\d{1,4}(?: \d{2,4})+\b|(?<![\d ])(?:144|112)(?!\d)/g)) {
    const n = m[0];
    if (!nummern.some((x) => x.nummer === n)) nummern.push({ name: NUMMERN_NAMEN[n] ?? null, nummer: n, tel: telVon(n) });
  }
  return { titel: ohneFett(zeilen[i].replace(/^##\s+/, "")), text, nummern };
}

// ---------------------------------------------------------------------------------------------------------------
// Zusammenbau

export async function quellenLesen(ordner = QUELLORDNER) {
  const aus = {};
  for (const t of TEILE) aus[t.nr] = await readFile(path.join(ordner, t.datei), "utf8");
  return aus;
}

/** Baut das Paket-JSON und den Bericht aus den Quelltexten { teilNr: markdown } */
export function umwandeln(quellen) {
  const ids = new Set(), kapIds = new Set();
  const bericht = { gemischt: [], giftkapitel: [], meta: {}, abdeckung: {} };
  const teile = [], eintraege = [], kapitel = [];
  for (const { nr: teil, datei } of TEILE) {
    const md = quellen[teil];
    const { zeilen, stuecke } = gliedern(md, teil);
    const titelZeile = zeilen.find((z) => /^# /.test(z)) ?? "";
    const t = { nr: teil, titel: titelZeile.replace(/^#\s+/, "").replace(/^.*?Teil \d+:\s*/, "").trim(), datei: `quelle/${datei}`, kapitel: [], eintraege: [] };
    // Abdeckung: jede nichtleere Zeile steht in einem Text oder ist eine Überschrift ohne eigenen Text
    const gedeckt = new Set();
    for (const s of stuecke) for (let i = s.von; i < s.bis; i++) gedeckt.add(i);
    bericht.abdeckung[teil] = zeilen.map((z, i) => ({ z, i })).filter(({ z, i }) => !inhaltlos([z]) && !gedeckt.has(i)).map(({ i }) => i + 1);
    for (const s of stuecke) {
      if (s.art === "eintrag") {
        const { e, meta } = eintragBauen(s, teil, ids, bericht);
        eintraege.push(e); t.eintraege.push(e.id); bericht.meta[e.id] = meta;
      } else {
        const grund = s.nr ? `${s.nr}-${s.titel}` : s.titel;
        let id = `t${teil}-k-${s.kennung ? s.kennung + "-" : ""}${slug(grund)}${s.nachsatz ? "-nachsatz" : ""}`;
        for (let k = 2; kapIds.has(id); k++) id = `t${teil}-k-${slug(grund)}-${k}`;
        kapIds.add(id);
        const { nach } = felderAus(s.text, REGELN[teil]?.frei ?? true);
        const k = { id, teil, titel: s.titel, abschnitt: s.abschnitt || null };
        if (nach.ort?.length === 1) { const o = ortAus(nach.ort); k.ort = o.ort; k.ort_text = nach.ort[0]; }
        if (teil === 6 && /Sperre/.test(s.titel)) k.gesperrt = true;
        k.pruefstatus = PRUEFSTATUS;
        k.text = s.text;
        kapitel.push(k); t.kapitel.push(id);
      }
    }
    teile.push(t);
  }
  const nichtAufgeloest = [];
  const zeilen0 = zeilenVon(quellen[0]);
  const waldfunde_index = waldfundeAus(zeilen0, eintraege, nichtAufgeloest);
  const beschwerden_index = beschwerdenAus(zeilen0, eintraege, nichtAufgeloest);
  // Beschwerden und Fundmerkmale an die Einträge
  for (const b of beschwerden_index) for (const id of b.eintraege) {
    const e = eintraege.find((x) => x.id === id);
    for (const w of [b.beschwerde, ...b.mit]) if (!e.beschwerden.includes(w)) e.beschwerden.push(w);
  }
  for (const w of waldfunde_index) for (const id of w.kandidaten) {
    const e = eintraege.find((x) => x.id === id);
    const m = ohneKlammern(w.merkmal).trim();
    if (!e.aussehen.includes(m)) e.aussehen.push(m);
  }
  for (const e of eintraege) { delete e._w; delete e._n; }
  const { ww: wechselwirkungen, ausfall } = tabellenAus(zeilenVon(quellen[6]));
  const erste_hilfe = ersteHilfeAus(quellen[1]);
  const daten = {
    format: "naturheilkunde-1",
    titel: "Naturheilkunde (in Prüfung)",
    hinweis: "Entwurf, nicht zur Anwendung. Alle Texte stehen wörtlich wie in den Beilagen (Stand 05.10.2026); nichts ist fachlich geprüft. Einträge mit einer Marke (psychoaktiv, abtreibend, giftig) erscheinen nie als Mittel.",
    pruefstatus: PRUEFSTATUS,
    werte: { belegbarkeit: BELEGBARKEIT, ort: ORTE, marken: MARKEN },
    teile, erste_hilfe, beschwerden_index, waldfunde_index, eintraege, kapitel, wechselwirkungen, ausfall,
  };
  return { daten, bericht: berichtSchreiben(daten, bericht, nichtAufgeloest) };
}

// ---------------------------------------------------------------------------------------------------------------
// Bericht

function berichtSchreiben(d, b, nichtAufgeloest) {
  const z = [];
  const proTeil = d.teile.map((t) => {
    const es = d.eintraege.filter((e) => e.teil === t.nr);
    const unsicher = es.filter((e) => b.meta[e.id].unsicher.length);
    return { t, es, unsicher, ohneOrt: es.filter((e) => b.meta[e.id].ort_fehlt), kopfregel: es.filter((e) => b.meta[e.id].herkunft === "kopfregel"),
      ohneBeleg: es.filter((e) => !e.belegbarkeit_text), anteil: es.length ? unsicher.length / es.length : 0 };
  });
  const prozent = (x) => `${(x * 100).toFixed(1).replace(".", ",")} %`;
  const zuViel = proTeil.filter((p) => p.anteil > 0.25);
  z.push("# Naturheilkunde: Bericht des Umwandlers (nicht sicher Zugeordnetes)", "");
  if (zuViel.length) for (const p of zuViel) z.push(`**Teil ${p.t.nr} ist zu ${prozent(p.anteil)} nicht zuordenbar (über 25 %).**`, "");
  else z.push("**Kein Teil ist über 25 % nicht zuordenbar.**", "");
  z.push("Erzeugt von `naturheilkunde-umwandeln.mjs` aus `quelle/` (Stand der Beilagen 05.10.2026). Texte sind wörtlich übernommen; dieser Bericht listet nur, was der Umwandler abgeleitet hat und wo er unsicher ist.", "");
  z.push("Regeln: „unsicher“ heißt, ein Pflichtfeld (Name, Belegbarkeit, Ort) ließ sich nicht aus einer Zeile der Quelle ablesen. Fehlt die Zeile Ort, gilt nach Auftrag „handbuch“ (gezählt, nicht unsicher). Teil 1 (Giftkapitel) hat immer Belegbarkeit „warnung“. Teil 7–9 ohne Stufe: „überliefert, nicht geprüft“ nach der Kopfregel „Lies das zuerst“ des jeweiligen Teils. Nennt eine Zeile mehrere Stufen, gilt Warnung zuerst, sonst die schwächere Stufe (Liste „gemischt“).", "");
  z.push("## Übersicht je Teil", "", "| Teil | Einträge | Kapitel | ohne Ort-Zeile | ohne Belegbarkeit-Zeile | Stufe aus Kopfregel | unsicher |", "|---|---|---|---|---|---|---|");
  for (const p of proTeil) z.push(`| ${p.t.nr} ${p.t.titel} | ${p.es.length} | ${p.t.kapitel.length} | ${p.ohneOrt.length} | ${p.ohneBeleg.length} | ${p.kopfregel.length} | ${p.unsicher.length} |`);
  z.push("", `Dazu: ${d.wechselwirkungen.length} Wechselwirkungszeilen (${d.wechselwirkungen.filter((w) => w.gesperrt).length} gesperrt), ${d.ausfall.length} Ausfallzeilen (${d.ausfall.filter((w) => w.gesperrt).length} gesperrt), ${d.beschwerden_index.length} Beschwerden, ${d.waldfunde_index.length} Fundmerkmale.`, "");
  z.push("## Nicht sicher zugeordnet (Feld, Eintrag, Grund)", "");
  const alle = d.eintraege.flatMap((e) => b.meta[e.id].unsicher.map((u) => ({ e, u })));
  if (!alle.length) z.push("Keine.");
  for (const { e, u } of alle) z.push(`- ${u.feld}: \`${e.id}\` (${e.name ?? e.titel}): ${u.grund}`);
  z.push("", "## Belegbarkeit gemischt (Regel angewendet, bitte prüfen)", "");
  if (!b.gemischt.length) z.push("Keine.");
  for (const g of b.gemischt) z.push(`- \`${g.id}\` (${g.name}): → **${g.stufe}** aus „${g.text.replace(/\s+/g, " ").slice(0, 220)}“`);
  z.push("", "## Giftkapitel mit anderer Stufe in der Zeile (gesetzt: warnung)", "");
  if (!b.giftkapitel.length) z.push("Keine.");
  for (const g of b.giftkapitel) z.push(`- \`${g.id}\` (${g.name}): Zeile nennt „${g.stufe}“: ${g.text.replace(/\s+/g, " ").slice(0, 200)}…`);
  z.push("", "## Einträge ohne Ort-Zeile (gesetzt: handbuch)", "");
  for (const p of proTeil) if (p.es.length) z.push(`- Teil ${p.t.nr}: ${p.ohneOrt.length} von ${p.es.length}`);
  z.push("", "Ort-Texte (gezählt, alle → handbuch, solange nicht ausdrücklich ohne Einschränkung „Suche und Karte“):", "");
  const orte = {};
  for (const e of d.eintraege) if (e.ort_text) { const k = e.ort_text.replace(/\s+/g, " "); orte[k] = (orte[k] ?? 0) + 1; }
  for (const [k, n] of Object.entries(orte).sort((a, b2) => b2[1] - a[1])) z.push(`- ${n} × „${k}“`);
  z.push("", `Einträge mit Ort „suche_und_karte“: ${d.eintraege.filter((e) => e.ort === "suche_und_karte").length}.`, "");
  z.push("## Einträge ohne Zeile Belegbarkeit", "");
  for (const p of proTeil) if (p.ohneBeleg.length) z.push(`- Teil ${p.t.nr} (${p.ohneBeleg.length}): ${p.ohneBeleg.map((e) => e.name ?? e.titel).join(", ")}`);
  z.push("", "Davon nach Kopfregel „überliefert, nicht geprüft“ (Teil 7–9): " + (proTeil.flatMap((p) => p.kopfregel).map((e) => `\`${e.id}\``).join(", ") || "keine"), "");
  z.push("## Marken (sperren die Anzeige als Mittel)", "");
  for (const m of ["psychoaktiv", "abtreibend", "giftig"]) {
    const es = d.eintraege.filter((e) => e.marken.includes(m));
    z.push(`### ${m} (${es.length})`, "");
    for (const e of es) { const x = b.meta[e.id].marken.find((y) => y.marke === m); z.push(`- \`${e.id}\` (${e.name ?? e.titel}): „${x.stichwort}“${x.stelle ? ` – …${x.stelle}…` : ""}`); }
    z.push("");
  }
  z.push("## Sperren (Teil 6)", "");
  z.push("„Sperre“ steht in Teil 6 an drei Stellen: Überschrift des Blocks „Sperre „nicht geprüft““, im selben Block „Die Sperre gilt …“ und in den Lücken als „Captcha-Sperre“ (PubMed). Nur der Block ist eine Sperre; er sperrt Zeilen mit „keine Quelle gelesen“ oder „(Lücke)“. Die Captcha-Sperre ist keine.", "");
  for (const w of d.wechselwirkungen.filter((x) => x.gesperrt)) z.push(`- Wechselwirkung \`${w.id}\`: ${w.pflanze ?? "(keine Pflanze)"} × ${w.mit}`);
  for (const w of d.ausfall.filter((x) => x.gesperrt)) z.push(`- Ausfall \`${w.id}\`: ${w.klasse}`);
  for (const k of d.kapitel.filter((x) => x.gesperrt)) z.push(`- Kapitel \`${k.id}\`: ${k.titel}`);
  z.push("", "## Erste-Hilfe-Karte", "");
  z.push(d.erste_hilfe ? `Klarer Block „${d.erste_hilfe.titel}“ in Teil 1; Nummern: ${d.erste_hilfe.nummern.map((n) => `${n.nummer} (${n.name ?? "ohne Namen"})`).join(", ")}.` : "**Kein klarer Block gefunden.**", "");
  z.push("## Nicht aufgelöste Namen in den Indizes (Teil 0)", "");
  if (!nichtAufgeloest.length) z.push("Keine.");
  for (const n of nichtAufgeloest) z.push(`- ${n.index} / ${n.wo} / ${n.feld}: „${n.name}“`);
  const ungedeckt = Object.entries(b.abdeckung).filter(([, v]) => v.length);
  z.push("", "## Abdeckung", "", ungedeckt.length ? ungedeckt.map(([t, v]) => `- Teil ${t}: Zeilen ${v.join(", ")} stehen in keinem Text`).join("\n") : "Jede nichtleere Zeile der Quellen steht wörtlich in einem Eintrag oder Kapitel (außer Überschriften ohne eigenen Text und Trennlinien „---“).", "");
  z.push("## Anteil nicht zugeordnet je Teil", "", "Einträge mit mindestens einem unsicheren Pflichtfeld / alle Einträge.", "");
  for (const p of proTeil) z.push(`- Teil ${p.t.nr}: ${p.es.length ? `${p.unsicher.length} / ${p.es.length} = ${prozent(p.anteil)}` : "keine Einträge (nur Kapitel)"}`);
  z.push("");
  return z.join("\n");
}

async function main() {
  const { daten, bericht } = umwandeln(await quellenLesen());
  await writeFile(ZIEL, JSON.stringify(daten) + "\n"); // kompakt: am iPad liegt das Paket im Speicher des Browsers
  await writeFile(BERICHT, bericht);
  for (const t of daten.teile) console.log(`Teil ${t.nr}: ${t.eintraege.length} Einträge, ${t.kapitel.length} Kapitel`);
  console.log(`Wechselwirkungen ${daten.wechselwirkungen.length} (${daten.wechselwirkungen.filter((w) => w.gesperrt).length} gesperrt), Ausfall ${daten.ausfall.length}, Beschwerden ${daten.beschwerden_index.length}, Fundmerkmale ${daten.waldfunde_index.length}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
