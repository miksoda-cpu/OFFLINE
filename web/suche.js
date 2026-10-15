// Suche über alle Texte der App (Nr. 30): auf dem Gerät, ohne Internet, ohne Abhängigkeit. Nur Logik; welche Texte hineinkommen
// (je Land, ohne Tresor) und wie ein Treffer geöffnet wird, entscheidet app.js. Regeln (Bill, 15.10.2026): ab dem zweiten
// Buchstaben, ohne Groß/Klein, Umlaute gleich (ä = ae), mehrere Wörter müssen alle vorkommen, Wortanfänge zählen
// („Kerze“ findet „Kerzen“). Die Texte sind später die Wissensbasis der KI.

/** Vergleichsform: klein, ä/ö/ü/ß ausgeschrieben, ohne Akzente. */
export const norm = (s) => String(s ?? "").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
  .normalize("NFD").replace(/[̀-ͯ]/g, "");
const WORT = /[\p{L}\p{N}]+/gu;
const woerter = (s) => norm(s).match(WORT) ?? [];

/** Suchbegriffe aus der Eingabe; zu kurze (unter 2 Zeichen) zählen nicht. */
export const begriffe = (q) => [...new Set(woerter(q))].filter((w) => w.length >= 2);

/**
 * Index aus Einträgen { rang, bereich, titel, text, ziel }. rang: Reihenfolge der Gruppen (Notfall und Szenarien zuerst).
 * Je Eintrag die Wörter einmal vorberechnet, damit eine Suche nur noch vergleicht.
 */
export function indexBauen(eintraege) {
  return eintraege.filter((e) => e && (e.titel || e.text)).map((e, nr) => ({ ...e, nr, w: [...new Set(woerter(`${e.bereich ?? ""} ${e.titel ?? ""} ${e.text ?? ""}`))] }));
}

/** Treffer: alle Begriffe kommen als Wortanfang vor. Sortiert nach rang, dann Treffer im Titel, dann Reihenfolge. */
export function suchen(index, q, { max = 60 } = {}) {
  const b = begriffe(q);
  if (!b.length) return [];
  const aus = [];
  for (const e of index) {
    if (!b.every((x) => e.w.some((w) => w.startsWith(x)))) continue;
    // Innerhalb eines Rangs (Bill, 15.10.): zuerst Überschriften, die mit dem Suchwort beginnen, dann die, in denen es steht, dann der Rest
    const tw = woerter(e.titel), stufe = tw.length && tw[0].startsWith(b[0]) ? 0 : b.every((x) => tw.some((w) => w.startsWith(x))) ? 1 : 2;
    aus.push({ e, stufe });
  }
  aus.sort((a, c) => a.e.rang - c.e.rang || a.stufe - c.stufe || a.e.nr - c.e.nr);
  return aus.slice(0, max).map((x) => x.e);
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
/** HTML mit fett gesetzten Wörtern, die mit einem Begriff anfangen. */
export function hervorheben(text, q) {
  const b = begriffe(q);
  let aus = "", pos = 0;
  for (const m of String(text ?? "").matchAll(WORT)) {
    aus += esc(text.slice(pos, m.index));
    aus += b.some((x) => norm(m[0]).startsWith(x)) ? `<b>${esc(m[0])}</b>` : esc(m[0]);
    pos = m.index + m[0].length;
  }
  return aus + esc(String(text ?? "").slice(pos));
}

/** Eine Zeile Text rund um den ersten Treffer (höchstens etwa 110 Zeichen), mit Auslassungszeichen. */
export function zeile(text, q, laenge = 110) {
  const t = String(text ?? "").replace(/\s+/g, " ").trim(), b = begriffe(q);
  if (t.length <= laenge) return hervorheben(t, q);
  let start = 0;
  for (const m of t.matchAll(WORT)) if (b.some((x) => norm(m[0]).startsWith(x))) { start = m.index; break; }
  let von = Math.max(0, start - 30);
  if (von > 0) von = t.indexOf(" ", von) + 1 || von;
  let bis = Math.min(t.length, von + laenge);
  if (bis < t.length) bis = t.lastIndexOf(" ", bis) > von ? t.lastIndexOf(" ", bis) : bis;
  return `${von > 0 ? "… " : ""}${hervorheben(t.slice(von, bis), q)}${bis < t.length ? " …" : ""}`;
}
