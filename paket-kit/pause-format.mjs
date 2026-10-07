// Format der Pause-Inhalte (inhalt/pause.json im Paket „pause“, App ab 0.4.0). Prüfprogramm (pruefen.mjs) und Tests nutzen es.
// Jede Form beschreibt sich selbst: Trainingsart, Dauer, Altersband, Tageszeit, Zone. Die Spiele selbst sind Teil der App
// (web/pause-happen.js); das Paket liefert nur Daten. Eine Form, die eine fehlende Funktion braucht, trägt
// bedingung.funktion und wird nicht angeboten, bis die App die Funktion hat (wie bei den Tipps).

export const TRAININGSARTEN = ["tempo", "kraft", "ausdauer", "beweglichkeit", "koordination", "gruppe"];
export const GRUPPEN = ["spiel", "raetsel", "wort", "geschichte", "ruhe", "hand", "zu-zweit"];
export const ALTER = ["J", "M1", "M2", "A"]; // Jung 14–29, Mittel 1 30–49, Mittel 2 50–64, Alt 65+
export const TAGESZEITEN = ["jederzeit", "morgen", "abend"];
export const BRAUCHT = ["roman", "gestern"];
/** Formen, die App 0.4.0 spielen kann (alle anderen brauchen bedingung.funktion). */
export const GEBAUT = ["pilz", "fehler", "lumisch", "naechstes", "tuersteher", "rueckwaerts", "zeitgefuehl", "atem", "kaffeehaus", "kopfnuss", "fluss"]; // die letzten drei ab 0.7.1
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const text = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

/** Fehler in pause.json (leere Liste = in Ordnung). */
export function pauseFehler(j) {
  const f = [];
  if (!j || typeof j !== "object") return ["kein Objekt"];
  if (j.format !== 1) f.push("format muss 1 sein");
  if (!Array.isArray(j.formen) || !j.formen.length) return [...f, "formen fehlt oder leer"];
  const ids = new Set();
  j.formen.forEach((x, i) => {
    const wo = `formen[${i}]${x?.id ? ` (${x.id})` : ""}`, F = (s) => f.push(`${wo}: ${s}`);
    if (!x || typeof x !== "object") return F("kein Objekt");
    if (!ID.test(x.id ?? "")) F("id ungültig"); else if (ids.has(x.id)) F("id doppelt"); else ids.add(x.id);
    if (!text(x.titel, 60)) F("titel fehlt oder zu lang (60)");
    if (!text(x.einladung, 200)) F("einladung: ein Satz, höchstens 200 Zeichen");
    if (!GRUPPEN.includes(x.gruppe)) F(`gruppe: ${GRUPPEN.join(", ")}`);
    if (!Array.isArray(x.art) || !x.art.length || !x.art.every((a) => TRAININGSARTEN.includes(a))) F(`art: Liste aus ${TRAININGSARTEN.join(", ")}`);
    if (!x.dauer || !Number.isInteger(x.dauer.von) || !Number.isInteger(x.dauer.bis) || x.dauer.von < 10 || x.dauer.bis < x.dauer.von) F("dauer: { von, bis } in Sekunden");
    else if (!x.bedingung && x.dauer.bis > 180) F("dauer: ein Happen dauert höchstens 3 Minuten");
    if (!Array.isArray(x.alter) || !x.alter.length || !x.alter.every((a) => ALTER.includes(a))) F(`alter: Liste aus ${ALTER.join(", ")}`);
    if (!TAGESZEITEN.includes(x.tageszeit)) F(`tageszeit: ${TAGESZEITEN.join(", ")}`);
    if (x.braucht !== undefined && !BRAUCHT.includes(x.braucht)) F(`braucht: ${BRAUCHT.join(", ")}`);
    if (x.zone !== undefined && !(Number.isInteger(x.zone?.stufen) && x.zone.stufen >= 1 && x.zone.stufen <= 20 && Number.isInteger(x.zone.start) && x.zone.start >= 1 && x.zone.start <= x.zone.stufen)) F("zone: { stufen 1–20, start }");
    if (x.auffrischung_monate !== undefined && !(Array.isArray(x.auffrischung_monate) && x.auffrischung_monate.every((m) => Number.isInteger(m) && m > 0))) F("auffrischung_monate: Liste ganzer Monate");
    if (x.beim !== undefined && !text(x.beim, 40)) F("beim: kurze Wendung für den Rückspiegel (höchstens 40), z. B. „beim Pilz“");
    if (x.bedingung !== undefined && !(x.bedingung && typeof x.bedingung.funktion === "string" && Object.keys(x.bedingung).length === 1)) F("bedingung: nur { funktion }");
    if (!x.bedingung && !GEBAUT.includes(x.id)) F("diese Form gibt es in der App nicht: bedingung.funktion setzen");
  });
  if (!Array.isArray(j.fehler) || j.fehler.length < 5) f.push("fehler: mindestens fünf Geschichten");
  else j.fehler.forEach((g, i) => {
    const F = (s) => f.push(`fehler[${i}]: ${s}`);
    if (!ID.test(g?.id ?? "")) F("id ungültig");
    if (!Array.isArray(g.saetze) || g.saetze.length < 3 || g.saetze.length > 12 || !g.saetze.every((s) => text(s, 240))) F("saetze: drei bis zwölf Sätze");
    else if (!Number.isInteger(g.fehler) || g.fehler < 0 || g.fehler >= g.saetze.length) F("fehler: Nummer eines Satzes (ab 0)");
    if (!text(g.erklaerung, 300)) F("erklaerung fehlt");
    if (![1, 2, 3, 4, 5].includes(g.stufe)) F("stufe: 1 bis 5");
    if (g.nur_mit_lumi !== undefined && g.nur_mit_lumi !== true) F("nur_mit_lumi: nur true");
  });
  f.push(...lumischFehler(j.lumisch));
  f.push(...ab071Fehler(j));
  const ohneCode = !/<script\b|\son[a-z]+\s*=|javascript:/i.test(JSON.stringify(j));
  if (!ohneCode) f.push("enthält Code (Skript, Ereignis-Attribut oder javascript:)");
  return f;
}

/**
 * Formen aus einem Modul im Bereich „pause“ (inhalt/pause-formen.json, App ab 0.6.5; Spielpaket 1, Auftrag 2026-10-07-14).
 * Jede Form ist ein Spiel des Moduls: Die App öffnet das Modul im Happen mit spiel, Stufe und Datum in der Adresse und
 * nimmt das Ergebnis über offline.spiel.melden an. Rätsel dürfen länger dauern als die Happen der App (bis 15 Minuten);
 * jede Form hat Stufen (zone) und einen Satz fürs Ende, gelöst und offen.
 */
export function pauseFormenFehler(j) {
  const f = [];
  if (!j || typeof j !== "object") return ["kein Objekt"];
  if (j.format !== 1) f.push("format muss 1 sein");
  if (!Array.isArray(j.formen) || !j.formen.length) return [...f, "formen fehlt oder leer"];
  const ids = new Set();
  j.formen.forEach((x, i) => {
    const wo = `formen[${i}]${x?.id ? ` (${x.id})` : ""}`, F = (s) => f.push(`${wo}: ${s}`);
    if (!x || typeof x !== "object") return F("kein Objekt");
    if (!ID.test(x.id ?? "") && !/^[0-9]+$/.test(x.id ?? "")) F("id ungültig"); else if (ids.has(x.id) || GEBAUT.includes(x.id)) F("id doppelt oder schon eine Form der App"); else ids.add(x.id);
    if (!/^[a-z0-9-]{1,40}$/.test(x.spiel ?? "")) F("spiel: Kennung des Spiels im Modul");
    if (!text(x.titel, 60)) F("titel fehlt oder zu lang (60)");
    if (!text(x.einladung, 200)) F("einladung: ein Satz, höchstens 200 Zeichen");
    if (!GRUPPEN.includes(x.gruppe)) F(`gruppe: ${GRUPPEN.join(", ")}`);
    if (!Array.isArray(x.art) || !x.art.length || !x.art.every((a) => TRAININGSARTEN.includes(a))) F(`art: Liste aus ${TRAININGSARTEN.join(", ")}`);
    if (!x.dauer || !Number.isInteger(x.dauer.von) || !Number.isInteger(x.dauer.bis) || x.dauer.von < 10 || x.dauer.bis < x.dauer.von || x.dauer.bis > 900) F("dauer: { von, bis } in Sekunden, höchstens 15 Minuten");
    if (!Array.isArray(x.alter) || !x.alter.length || !x.alter.every((a) => ALTER.includes(a))) F(`alter: Liste aus ${ALTER.join(", ")}`);
    if (!TAGESZEITEN.includes(x.tageszeit)) F(`tageszeit: ${TAGESZEITEN.join(", ")}`);
    if (!(Number.isInteger(x.zone?.stufen) && x.zone.stufen >= 1 && x.zone.stufen <= 20 && Number.isInteger(x.zone.start) && x.zone.start >= 1 && x.zone.start <= x.zone.stufen)) F("zone: { stufen 1–20, start }");
    if (x.beim !== undefined && !text(x.beim, 40)) F("beim: kurze Wendung für den Rückspiegel (höchstens 40)");
    if (!text(x.ende?.geloest, 160) || !text(x.ende?.offen, 160)) F("ende: { geloest, offen } je ein Satz");
    for (const k of Object.keys(x)) if (!["id", "spiel", "titel", "einladung", "gruppe", "art", "dauer", "alter", "tageszeit", "zone", "beim", "ende"].includes(k)) F(`unbekanntes Feld: ${k}`);
  });
  if (/<script\b|\son[a-z]+\s*=|javascript:/i.test(JSON.stringify(j))) f.push("enthält Code (Skript, Ereignis-Attribut oder javascript:)");
  return f;
}

/** Lumisch (Plan, Abfragewörter, Wörterbuch): im Paket „pause“ (bis 0.6.x) und im eigenen Paket „lumisch“ (ab 0.7.0). */
export function lumischFehler(l) {
  const f = [];
  if (!l || !Array.isArray(l.plan) || l.plan.length < 7 || !Array.isArray(l.woerter) || l.woerter.length < 10) f.push("lumisch: plan (mindestens 7 Tage) und woerter (mindestens 10)");
  else {
    l.plan.forEach((p, i) => { if (p.tag !== i + 1 || typeof p.wort !== "string" || !text(p.bedeutung, 80) || !text(p.aufgabe, 200)) f.push(`lumisch.plan[${i}]: tag, wort, bedeutung, aufgabe`); });
    l.woerter.forEach((w, i) => { if (!/^[a-z]{1,12}$/.test(w?.wort ?? "") || !text(w.deutsch, 60)) f.push(`lumisch.woerter[${i}]: wort (a–z) und deutsch`); });
    if (l.woerterbuch !== undefined) {
      if (!Array.isArray(l.woerterbuch)) f.push("lumisch.woerterbuch: Liste");
      else l.woerterbuch.forEach((w, i) => {
        if (!/^[a-z]{1,12}$/.test(w?.wort ?? "") || !text(w.deutsch, 80) || !text(w.gruppe, 40)) f.push(`lumisch.woerterbuch[${i}]: wort, deutsch, gruppe`);
        if (w.hinweis !== undefined && !text(w.hinweis, 300)) f.push(`lumisch.woerterbuch[${i}]: hinweis höchstens 300 Zeichen`);
        if (w.beispiel !== undefined && !(text(w.beispiel?.lumisch, 120) && text(w.beispiel?.deutsch, 160))) f.push(`lumisch.woerterbuch[${i}]: beispiel { lumisch, deutsch }`);
      });
    }
  }
  return f;
}

const STUFE = (x) => [1, 2, 3, 4, 5].includes(x?.stufe);
/** Inhalte ab 0.7.1 (Pause-Session 07.10.2026): Ruhe-Varianten, Kaffeehaus-Logik, Kopfnuss, Ein Gedanke am Fluss. Alles optional. */
export function ab071Fehler(j) {
  const f = [];
  const lumiTeil = (x, wo) => { if (x.lumisch !== undefined && !(text(x.lumisch, 120) && text(x.uebersetzung, 160))) f.push(`${wo}: lumisch mit uebersetzung`); };
  if (j.ruhe !== undefined) {
    const r = j.ruhe;
    if (!Array.isArray(r?.rueckwaerts) || !Array.isArray(r?.atem)) f.push("ruhe: { rueckwaerts, atem }");
    else {
      r.rueckwaerts.forEach((v, i) => { const wo = `ruhe.rueckwaerts[${i}]`; if (!ID.test(v.id ?? "") || !Array.isArray(v.fragen) || v.fragen.length < 2 || !v.fragen.every((s) => text(s, 200)) || !text(v.schluss, 240)) f.push(`${wo}: id, fragen, schluss`); lumiTeil(v, wo); if (v.ohne_lumi && !(Array.isArray(v.ohne_lumi.fragen ?? v.fragen) && text(v.ohne_lumi.schluss ?? v.schluss, 240))) f.push(`${wo}: ohne_lumi`); });
      r.atem.forEach((v, i) => { const wo = `ruhe.atem[${i}]`; if (!ID.test(v.id ?? "") || !text(v.ein, 160) || !text(v.aus, 160) || !text(v.ende, 240)) f.push(`${wo}: id, ein, aus, ende`); lumiTeil(v, wo); });
    }
  }
  for (const [k, pruef] of [
    ["kaffeehaus", (a) => text(a.frage, 600) && Array.isArray(a.antworten) && a.antworten.length >= 2 && a.antworten.every((x) => text(x, 120)) && Number.isInteger(a.richtig) && a.richtig >= 0 && a.richtig < a.antworten.length && text(a.erklaerung, 600)],
    ["kopfnuss", (a) => text(a.frage, 600) && typeof a.antwort === "number" && Number.isFinite(a.antwort) && text(a.tipp, 300) && text(a.weg, 600)],
    ["fluss", (a) => text(a.gedanke, 400) && Array.isArray(a.schritte) && a.schritte.length >= 1 && a.schritte.every((s) => text(s, 300)) && text(a.ende_ohne_lumi, 240)],
  ]) {
    if (j[k] === undefined) continue;
    if (!Array.isArray(j[k]) || !j[k].length) { f.push(`${k}: Liste`); continue; }
    j[k].forEach((a, i) => { if (!ID.test(a?.id ?? "") || !STUFE(a) || !pruef(a)) f.push(`${k}[${i}]: Felder unvollständig`); if (k === "fluss") lumiTeil(a, `${k}[${i}]`); });
    for (let s = 1; s <= 5; s++) if (!j[k].some((a) => a.stufe === s)) f.push(`${k}: keine Aufgabe auf Stufe ${s}`);
  }
  return f;
}
/** Lumisch-Aufgaben (Paket „lumisch“, ab 0.7.1): Auswahl wie das Lumisch-Quiz, fünf Stufen. */
export function lumischAufgabenFehler(liste) {
  const f = [];
  if (liste === undefined) return f;
  if (!Array.isArray(liste) || !liste.length) return ["aufgaben: Liste"];
  liste.forEach((a, i) => { if (!ID.test(a?.id ?? "") || !STUFE(a) || !text(a.frage, 200) || !text(a.richtig, 160) || !Array.isArray(a.falsch) || a.falsch.length < 1 || !a.falsch.every((x) => text(x, 160)) || a.falsch.includes(a.richtig) || !text(a.erklaerung, 400)) f.push(`aufgaben[${i}]: id, stufe, frage, richtig, falsch, erklaerung`); });
  for (let s = 1; s <= 5; s++) if (!liste.some((a) => a.stufe === s)) f.push(`aufgaben: keine Aufgabe auf Stufe ${s}`);
  return f;
}
