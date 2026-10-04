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

// ---------- Antwort auf das Tagesrätsel prüfen (lokal, ohne Netz; Auftrag 2026-10-01-raetsel-eingabe) ----------
// Gleich gelten: Groß/klein, Leerzeichen, Satzzeichen, ä/ae, ö/oe, ü/ue, ß/ss, Ziffer und Zahlwort („3“ = „drei“),
// führende Füllwörter („der“, „ein“, „um“, „am“ …). Steht in den Antworten eine reine Zahl, darf ein Wort folgen („12 Runden“).
const EINER = { null: 0, ein: 1, eins: 1, eine: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9 };
const BIS_19 = { ...EINER, zehn: 10, elf: 11, zwoelf: 12, dreizehn: 13, vierzehn: 14, fuenfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19 };
const ZEHNER = { zwanzig: 20, dreissig: 30, vierzig: 40, fuenfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };
const FUELL = new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "um", "am", "im", "in", "nach", "es", "sind", "ist", "er", "sie", "hat", "dein", "deine", "mein", "meine"]);

function unter100(w) {
  if (w in BIS_19) return BIS_19[w];
  if (w in ZEHNER) return ZEHNER[w];
  const m = w.match(/^(.+?)und(.+)$/);
  return m && m[1] in EINER && EINER[m[1]] > 0 && m[2] in ZEHNER ? EINER[m[1]] + ZEHNER[m[2]] : null;
}
/** „dreitausendsechshundert“ → 3600; kein Zahlwort → null. */
export function zahlwort(w) {
  if (!w || /\d/.test(w)) return null;
  const teil = (s, wort, faktor, rest) => {
    const i = s.indexOf(wort); if (i < 0) return undefined;
    const vor = s.slice(0, i), nach = s.slice(i + wort.length);
    const v = vor === "" ? 1 : rest(vor), n = nach === "" ? 0 : rest(nach);
    return v == null || n == null ? null : v * faktor + n;
  };
  const bis999 = (s) => { const h = teil(s, "hundert", 100, unter100); return h === undefined ? unter100(s) : h; };
  const t = teil(w, "tausend", 1000, bis999);
  return t === undefined ? bis999(w) : t;
}

/** Text in die Vergleichsform: klein, Umlaute ausgeschrieben, Zahlwörter als Ziffern, ohne Füllwörter vorn, ohne Zeichen. */
export function antwortNormal(s) {
  let w = String(s ?? "").toLowerCase().normalize("NFC").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
  while (w.length > 1 && FUELL.has(w[0])) w = w.slice(1);
  return w.map((x) => { const z = zahlwort(x); return z == null ? x : String(z); }).join("");
}

/** Stimmt die eingegebene Antwort? antworten: Liste gültiger Varianten aus dem Paket. */
export function antwortRichtig(eingabe, antworten) {
  const e = antwortNormal(eingabe);
  if (!e || !Array.isArray(antworten)) return false;
  return antworten.some((a) => {
    const v = antwortNormal(a);
    return v === e || (/^\d+$/.test(v) && e.startsWith(v) && /^[a-z]+$/.test(e.slice(v.length)));
  });
}
