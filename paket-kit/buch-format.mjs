// Format des Lumi-Buchs (inhalt/buch.json im Paket „lumi-buch“, App ab 0.5.0, Auftrag 2026-10-04-lumi-buch-app).
// Ein Band je Paket (Band 2 kann später als eigenes Paket kommen). Absätze tragen die Nummer b<Band>-<Kapitel>-<Absatz>
// (b1-03-07); auf sie zeigt das Feld buch der Tipps im Paket „wir“ (paket-kit/tipps-format.mjs, BUCH).

import { BUCH } from "./tipps-format.mjs";
export { BUCH };
const text = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

/** Fehler in buch.json (leere Liste = in Ordnung). */
export function buchFehler(j) {
  const f = [];
  if (!j || typeof j !== "object") return ["kein Objekt"];
  if (j.format !== 1) f.push("format muss 1 sein");
  if (!Number.isInteger(j.band) || j.band < 1 || j.band > 99) f.push("band: ganze Zahl 1 bis 99");
  if (!text(j.titel, 80)) f.push("titel fehlt");
  if (!text(j.hinweis, 300) || !/erfundene Geschichte/.test(j.hinweis)) f.push("hinweis: muss „Eine erfundene Geschichte“ enthalten (Titelseite)");
  if (!Array.isArray(j.kapitel) || !j.kapitel.length) return [...f, "kapitel fehlt oder leer"];
  const ids = new Set();
  j.kapitel.forEach((k, i) => {
    const wo = `kapitel[${i}]`, F = (s) => f.push(`${wo}: ${s}`);
    if (k?.nr !== i + 1) F(`nr muss ${i + 1} sein (Reihenfolge)`);
    if (!text(k?.titel, 80)) F("titel fehlt");
    if (!Array.isArray(k?.absaetze) || !k.absaetze.length) return F("absaetze fehlt oder leer");
    k.absaetze.forEach((a, p) => {
      const soll = `b${j.band}-${String(i + 1).padStart(2, "0")}-${String(p + 1).padStart(2, "0")}`;
      if (a?.id !== soll) F(`absaetze[${p}]: id muss ${soll} sein`);
      else if (ids.has(a.id)) F(`${a.id} doppelt`); else ids.add(a.id);
      if (!text(a?.text, 3000)) F(`${a?.id ?? p}: text fehlt oder länger als 3000 Zeichen`);
      if (/`|Tipps:/.test(a?.text ?? "")) F(`${a?.id}: Redaktionszeile im Text`);
    });
  });
  return f;
}
/** Alle Absatznummern eines Buchs. */
export const absatzIds = (j) => (j?.kapitel ?? []).flatMap((k) => (k.absaetze ?? []).map((a) => a.id));
/** Tipps, deren buch auf keinen Absatz zeigt, und Absätze ohne Tipp (für Band dieses Buchs). */
export function zuordnungFehler(buch, tipps) {
  const ids = new Set(absatzIds(buch)), band = new RegExp(`^b${buch.band}-`);
  const f = [];
  for (const t of tipps) if (t.buch && band.test(t.buch) && !ids.has(t.buch)) f.push(`${t.id}: Absatz ${t.buch} gibt es im Buch nicht`);
  const mit = new Set(tipps.map((t) => t.buch).filter(Boolean));
  for (const id of ids) if (!mit.has(id)) f.push(`${id}: kein Tipp zeigt auf diesen Absatz`);
  return f;
}
