// OFFLINE – Format der Tagesinhalte (art = "tage", Vorratskammer der Tagesseite). Reine Prüffunktionen ohne Abhängigkeiten;
// genutzt vom Prüfprogramm des Kits (pruefen.mjs) und vom Paketwerkzeug (werkzeug/paket-lib.mjs). PAKET-KIT.md Abschnitt 5b.
//
// inhalt/tage.json:
//   { "format": 1, "tage": [ { "datum": "2026-10-01" | "tag": 1, "karten": [ Karte, … ] }, … ] }
// Karten (Texte sind reiner Text, die App zeigt sie entschärft an):
//   raetsel  { art, id, frage, loesung, hinweis?, erklaerung?, stufe? }
//   kapitel  { art, id, werk, autor, teil, teile, absaetze: [Text, …], quelle: { url, vorlage } }   – absaetze mit „## “ = Überschrift
//   text     { art, id, text, titel? }
//   lektion  { art, id, titel, absaetze: [Text, …] }   – vorgesehen, noch ohne Inhalte
// Manifest: "tage": { "von": "JJJJ-MM-TT", "bis": "JJJJ-MM-TT" } oder { "von_tag": n, "bis_tag": m } (Tag 1 = erster Tag auf dem Gerät).

export const TAGE_DATEI = "inhalt/tage.json";
export const KARTEN_ARTEN = ["raetsel", "kapitel", "text", "lektion"];
const DATUM = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** Gültiges Kalenderdatum JJJJ-MM-TT? */
export function datumGueltig(s) {
  if (typeof s !== "string" || !DATUM.test(s)) return false;
  const [j, m, t] = s.split("-").map(Number);
  const d = new Date(Date.UTC(j, m - 1, t));
  return d.getUTCFullYear() === j && d.getUTCMonth() === m - 1 && d.getUTCDate() === t;
}
const tageZwischen = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);

/** Fehler im Bereich aus dem Manifest bzw. der Quelle ("tage"). */
export function tageBereichFehler(t) {
  const f = [];
  if (!t || typeof t !== "object") return ["tage fehlt (Bereich: von/bis als Datum oder von_tag/bis_tag)"];
  const datum = "von" in t || "bis" in t, nummer = "von_tag" in t || "bis_tag" in t;
  if (datum === nummer) return ["tage: entweder von/bis (Datum) oder von_tag/bis_tag (Tagnummer)"];
  if (datum) {
    if (!datumGueltig(t.von) || !datumGueltig(t.bis)) f.push("tage.von/bis: Datum JJJJ-MM-TT");
    else if (t.bis < t.von) f.push("tage: bis liegt vor von");
    else if (tageZwischen(t.von, t.bis) > 365) f.push("tage: höchstens ein Jahr je Paket");
  } else {
    if (!Number.isInteger(t.von_tag) || !Number.isInteger(t.bis_tag) || t.von_tag < 1) f.push("tage.von_tag/bis_tag: ganze Zahlen ab 1");
    else if (t.bis_tag < t.von_tag) f.push("tage: bis_tag liegt vor von_tag");
    else if (t.bis_tag - t.von_tag > 365) f.push("tage: höchstens 366 Tage je Paket");
  }
  return f;
}

const text = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const ohneCode = (v) => !/<script\b|\son[a-z]+\s*=|javascript:/i.test(v);

/** Fehler in einer Karte (Pfad für die Meldung). */
function karteFehler(k, wo) {
  const f = [], F = (s) => f.push(`${wo}: ${s}`);
  if (!k || typeof k !== "object") return [`${wo}: keine Karte`];
  if (!KARTEN_ARTEN.includes(k.art)) return [`${wo}: art unbekannt (${KARTEN_ARTEN.join(", ")})`];
  if (!ID.test(k.id ?? "")) F("id fehlt oder ungültig (a–z, 0–9, -)");
  if (k.art === "raetsel") {
    if (!text(k.frage, 600)) F("frage fehlt oder zu lang (600)");
    if (!text(k.loesung, 600)) F("loesung fehlt oder zu lang (600)");
    for (const x of ["hinweis", "erklaerung"]) if (k[x] !== undefined && !text(k[x], 800)) F(`${x} leer oder zu lang (800)`);
  } else if (k.art === "kapitel" || k.art === "lektion") {
    if (k.art === "kapitel") {
      if (!text(k.werk, 120) || !text(k.autor, 120)) F("werk und autor nötig");
      if (!Number.isInteger(k.teil) || !Number.isInteger(k.teile) || k.teil < 1 || k.teil > k.teile) F("teil/teile ungültig");
      if (!k.quelle || !text(k.quelle.url, 400) || !text(k.quelle.vorlage, 400)) F("quelle mit url und vorlage nötig");
    } else if (!text(k.titel, 120)) F("titel fehlt");
    if (!Array.isArray(k.absaetze) || !k.absaetze.length || !k.absaetze.every((a) => text(a, 20000))) F("absaetze: Liste nicht leerer Texte (je höchstens 20000 Zeichen)");
  } else if (k.art === "text") {
    if (!text(k.text, 1200)) F("text fehlt oder zu lang (1200)");
    if (k.titel !== undefined && !text(k.titel, 120)) F("titel leer oder zu lang");
  }
  const alles = JSON.stringify(k);
  if (!ohneCode(alles)) F("enthält Code (Skript, Ereignis-Attribut oder javascript:)");
  return f;
}

/** Fehler in tage.json gegen den Bereich aus dem Manifest. */
export function tageInhaltFehler(daten, bereich) {
  const f = [];
  if (!daten || typeof daten !== "object") return ["tage.json: kein Objekt"];
  if (daten.format !== 1) f.push("tage.json: format muss 1 sein");
  if (!Array.isArray(daten.tage) || !daten.tage.length) return [...f, "tage.json: tage fehlt oder leer"];
  const nachDatum = bereich && "von" in bereich;
  const gesehen = new Set(), ids = new Set();
  daten.tage.forEach((t, i) => {
    const wo = `tage[${i}]`;
    const schluessel = nachDatum ? t?.datum : t?.tag;
    if (nachDatum) {
      if ("tag" in (t ?? {}) || !datumGueltig(t?.datum)) f.push(`${wo}: datum JJJJ-MM-TT nötig (Paket nach Datum)`);
      else if (t.datum < bereich.von || t.datum > bereich.bis) f.push(`${wo}: ${t.datum} liegt außerhalb von ${bereich.von} bis ${bereich.bis}`);
    } else {
      if ("datum" in (t ?? {}) || !Number.isInteger(t?.tag)) f.push(`${wo}: tag (Nummer) nötig (Paket nach Tagnummer)`);
      else if (bereich && (t.tag < bereich.von_tag || t.tag > bereich.bis_tag)) f.push(`${wo}: Tag ${t.tag} liegt außerhalb von ${bereich.von_tag} bis ${bereich.bis_tag}`);
    }
    if (gesehen.has(schluessel)) f.push(`${wo}: ${schluessel} doppelt`);
    gesehen.add(schluessel);
    if (!Array.isArray(t?.karten) || t.karten.length < 1 || t.karten.length > 6) { f.push(`${wo}: karten (1 bis 6) nötig`); return; }
    t.karten.forEach((k, j) => {
      f.push(...karteFehler(k, `${wo}.karten[${j}]`));
      if (k?.id) { if (ids.has(`${k.art}:${k.id}`)) f.push(`${wo}.karten[${j}]: id ${k.id} doppelt`); ids.add(`${k.art}:${k.id}`); }
    });
  });
  return f;
}
