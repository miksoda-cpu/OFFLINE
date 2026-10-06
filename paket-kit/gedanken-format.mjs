// Format „Gedanken“ (inhalt/gedanken.json, Paket „lumi-philosophie“, App ab 0.6.2, Auftrag 2026-10-06-12): je Gedanke eine
// Seite mit Bild, Name, Titel, Lumisch-Satz, Wort für Wort, Deutsch und Text; optional Einleitung und Schluss als eigene Seiten.

export const FELDER = ["wer", "titel", "lumisch", "wort_fuer_wort", "umschrift", "deutsch", "bild", "text"];
const text = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

/** Fehler in gedanken.json (leere Liste = in Ordnung). bilder: Pfade unter inhalt/, die im Paket liegen (optional). */
export function gedankenFehler(j, bilder = null) {
  const f = [];
  if (!j || typeof j !== "object") return ["kein Objekt"];
  if (j.format !== 1) f.push("format muss 1 sein");
  if (!text(j.titel, 80)) f.push("titel fehlt");
  if (!text(j.untertitel, 120)) f.push("untertitel fehlt");
  if (!text(j.hinweis, 200) || !/erfunden/.test(j.hinweis)) f.push("hinweis: muss sagen, was erfunden ist");
  for (const k of ["einleitung", "schluss"]) if (j[k] !== undefined && !text(j[k], 6000)) f.push(`${k}: leer oder zu lang`);
  if (!Array.isArray(j.gedanken) || !j.gedanken.length) return [...f, "gedanken fehlt oder leer"];
  j.gedanken.forEach((g, i) => {
    const F = (s) => f.push(`gedanken[${i}]: ${s}`);
    if (g?.nr !== i + 1) F(`nr muss ${i + 1} sein (Reihenfolge)`);
    for (const k of FELDER) if (!text(g?.[k], k === "text" ? 4000 : 300)) F(`${k} fehlt oder zu lang`);
    if (g?.bild && !/^bilder\/[a-z0-9-]+\.(webp|jpg|png)$/.test(g.bild)) F(`bild: Pfad ${g.bild} nicht erlaubt`);
    else if (g?.bild && bilder && !bilder.includes(g.bild)) F(`bild ${g.bild} liegt nicht im Paket`);
  });
  return f;
}

/** Wörter eines Lumisch-Satzes ohne Satzzeichen; Eigennamen (großgeschrieben) getrennt. */
export function lumischWoerter(satz) {
  const w = String(satz ?? "").match(/[A-Za-zÄÖÜäöüß]+/g) ?? [];
  return { woerter: w.filter((x) => x[0] === x[0].toLowerCase()), eigennamen: w.filter((x) => x[0] !== x[0].toLowerCase()) };
}
