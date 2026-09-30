// Die Tagesseite und ihre Vorratskammer – reine Logik, ohne Oberfläche (Tests: web/tag.test.mjs).
// Gesamtkonzept Kap. 1 (das leise Versprechen), 2 (Vorratskammer), 6 (Tagesplan, Vorratstiefe), 6a (der Tag).
//
// Ein Tag ist das lokale Kalenderdatum des Geräts (JJJJ-MM-TT). Gerechnet wird mit Kalendertagen, nie mit 24 Stunden,
// damit Zeitzonen und Zeitumstellung keinen Tag verschieben. Tagespakete (art = "tage") tragen Einträge nach Datum oder
// nach Tagnummer (Tag 1 = der erste Tag, an dem die Tagesseite auf diesem Gerät lief).

/** Der feste Schlusssatz (Kap. 6a). In allen Lagen gleich. */
export const SCHLUSS = "Das war dein Tag. Bis morgen.";
export const TIEFEN = [7, 30, 90];
export const KARTEN = [
  { id: "raetsel", titel: "Tagesrätsel" },
  { id: "kapitel", titel: "Roman der Woche" },
  { id: "lumi", titel: "Die Lumi oder die Textkarte des Tages" },
  { id: "lektion", titel: "Lektion des Tages", spaeter: true },
];
export const PLAN_STANDARD = { karten: { raetsel: true, kapitel: true, lumi: true, lektion: false }, schlussUm: 22, tiefe: 30, sparmodus: false };

/** Lokales Kalenderdatum JJJJ-MM-TT eines Zeitpunkts. */
export function datumVon(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const utc = (datum) => { const [j, m, t] = datum.split("-").map(Number); return Date.UTC(j, m - 1, t); };
/** Kalendertage von a bis b (b − a), unabhängig von Zeitzone und Zeitumstellung. */
export const tageZwischen = (a, b) => Math.round((utc(b) - utc(a)) / 86400000);
/** Datum plus n Kalendertage. */
export function plusTage(datum, n) { const d = new Date(utc(datum) + n * 86400000); return d.toISOString().slice(0, 10); }
/** Tagnummer (1 = Starttag) für ein Datum. */
export const tagNummer = (start, datum) => tageZwischen(start, datum) + 1;

/**
 * Karten eines Tages aus allen installierten Tagespaketen. pakete: [{ id, bereich, tage: [{ datum | tag, karten }] }].
 * Nur freigeschaltete Tage (heute und früher) liefert man hierher; spätere bleiben im Vorrat unsichtbar.
 */
export function kartenFuer(pakete, datum, start) {
  const nr = tagNummer(start, datum);
  const aus = [], ids = new Set();
  for (const p of pakete) for (const t of p.tage ?? []) {
    if (t.datum ? t.datum !== datum : t.tag !== nr) continue;
    for (const k of t.karten ?? []) { const key = `${k.art}:${k.id}`; if (!ids.has(key)) { ids.add(key); aus.push({ ...k, paket: p.id }); } }
  }
  return aus;
}

/** Wie viele Tage ab heute (einschließlich) liegen noch im Vorrat? Gezählt wird jeder kommende Tag mit Inhalt (bis `max`). */
export function vorratTage(pakete, heute, start, max = 400) {
  let n = 0;
  for (let i = 0; i < max; i++) if (kartenFuer(pakete, plusTage(heute, i), start).some((k) => k.art !== "lektion" || k.absaetze)) n++;
  return n;
}

/** Deckt ein Katalog- oder Paketbereich den Zeitraum [heute, heute + tiefe − 1] (ganz oder teilweise) ab? */
export function bereichTrifft(bereich, heute, tiefe, start) {
  if (!bereich) return false;
  const bis = plusTage(heute, tiefe - 1);
  if (bereich.von) return bereich.bis >= heute && bereich.von <= bis;
  const von = tagNummer(start, heute), vonBis = von + tiefe - 1;
  return bereich.bis_tag >= von && bereich.von_tag <= vonBis;
}

/** Ist ein Tagespaket vorbei (letzter Tag länger als eine Woche her)? Dann darf es aus dem Vorrat. */
export function bereichVorbei(bereich, heute, start) {
  if (!bereich) return false;
  if (bereich.von) return tageZwischen(bereich.bis, heute) > 7;
  return tagNummer(start, heute) - bereich.bis_tag > 7;
}

/** Welche Katalogeinträge soll die Vorratskammer holen? Tagespakete für die Vorratstiefe, die noch nicht da sind. */
export function vorzuladen(katalog, installiert, heute, tiefe, start) {
  const da = new Map(installiert.map((p) => [p.id, p.version]));
  return (katalog?.pakete ?? []).filter((e) => e.art === "tage" && e.status === "verfuegbar" && bereichTrifft(e.tage, heute, tiefe, start)
    && (!da.has(e.id) || versionNeuer(e.version, da.get(e.id))));
}
const versionNeuer = (a, b) => { const A = String(a).split(".").map(Number), B = String(b).split(".").map(Number); for (let i = 0; i < Math.max(A.length, B.length); i++) { if ((A[i] ?? 0) !== (B[i] ?? 0)) return (A[i] ?? 0) > (B[i] ?? 0); } return false; };

/** Die Karten der Tagesseite in fester Reihenfolge, nach Tagesplan. lumi: "wesen" | "karten" | "aus". */
export function tagesKarten({ karten, plan = PLAN_STANDARD, lumi = "karten", textkarte = null }) {
  const p = plan.karten ?? PLAN_STANDARD.karten;
  const aus = [];
  if (p.raetsel) aus.push(...karten.filter((k) => k.art === "raetsel").slice(0, 1));
  if (p.kapitel) aus.push(...karten.filter((k) => k.art === "kapitel").slice(0, 1));
  if (p.lumi && lumi !== "aus" && textkarte) aus.push({ art: lumi === "wesen" ? "lumi" : "text", id: `lumi-${textkarte.id}`, text: textkarte.text, sorte: textkarte.sorte });
  if (p.lektion) aus.push(...karten.filter((k) => k.art === "lektion" && k.absaetze).slice(0, 1));
  return aus;
}

/** Ist der Tag zu Ende? Alle Karten erledigt oder weggelegt, oder die Schlussstunde ist erreicht. zustand: { id → "erledigt" | "weg" }. */
export function schlussErreicht({ karten, zustand = {}, jetzt, plan = PLAN_STANDARD }) {
  if (karten.length && karten.every((k) => zustand[k.id] === "erledigt" || zustand[k.id] === "weg")) return "erledigt";
  if (plan.schlussUm != null && new Date(jetzt).getHours() >= plan.schlussUm) return "uhrzeit";
  return null;
}

/**
 * Textkarte des Tages: ein Tipp, fest für den Tag (derselbe den ganzen Tag, am nächsten Tag ein anderer).
 * pool kommt aus der Lumi (tippPool), damit dieselben Regeln gelten (Stufe, Sorten, kein „ich“ ohne Namen).
 */
export function textkarteFuer(pool, datum) {
  if (!pool?.length) return null;
  let h = 0; for (const c of datum) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const sortiert = [...pool].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return sortiert[h % sortiert.length];
}

/**
 * Gelernte Schicht (Kap. 6): Wird eine Karte an sieben Tagen hintereinander weggelegt und nie erledigt, blendet die App sie
 * aus – sichtbar, begründet, rückgängig. Wer das zweimal zurücknimmt, friert die Karte ein (ab dann gilt sie als gesetzt).
 * verlauf: { datum → { kartenArt → "erledigt" | "weg" } }, gelernt: { eingefroren: { art: true }, zurueck: { art: n } }.
 */
export function lernen(verlauf, heute, plan, gelernt = {}) {
  const tage = Array.from({ length: 7 }, (_, i) => plusTage(heute, -1 - i));
  for (const art of ["raetsel", "kapitel", "lumi"]) {
    if (!plan.karten?.[art] || gelernt.eingefroren?.[art]) continue;
    if (tage.every((d) => verlauf[d]?.[art] === "weg")) {
      const titel = KARTEN.find((k) => k.id === art).titel;
      return { art, text: `„${titel}“ ist ausgeblendet, weil die Karte seit einer Woche jeden Tag weggelegt wurde.` };
    }
  }
  return null;
}
