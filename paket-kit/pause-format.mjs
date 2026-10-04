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
export const GEBAUT = ["pilz", "fehler", "lumisch", "naechstes", "tuersteher", "rueckwaerts", "zeitgefuehl", "atem"];
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
    if (!Array.isArray(g.saetze) || g.saetze.length < 3 || g.saetze.length > 6 || !g.saetze.every((s) => text(s, 200))) F("saetze: drei bis sechs Sätze");
    else if (!Number.isInteger(g.fehler) || g.fehler < 0 || g.fehler >= g.saetze.length) F("fehler: Nummer eines Satzes (ab 0)");
    if (!text(g.erklaerung, 300)) F("erklaerung fehlt");
    if (![1, 2, 3].includes(g.stufe)) F("stufe: 1 bis 3");
  });
  const l = j.lumisch;
  if (!l || !Array.isArray(l.plan) || l.plan.length < 7 || !Array.isArray(l.woerter) || l.woerter.length < 10) f.push("lumisch: plan (mindestens 7 Tage) und woerter (mindestens 10)");
  else {
    l.plan.forEach((p, i) => { if (p.tag !== i + 1 || typeof p.wort !== "string" || !text(p.bedeutung, 80) || !text(p.aufgabe, 200)) f.push(`lumisch.plan[${i}]: tag, wort, bedeutung, aufgabe`); });
    l.woerter.forEach((w, i) => { if (!/^[a-z]{1,12}$/.test(w?.wort ?? "") || !text(w.deutsch, 60)) f.push(`lumisch.woerter[${i}]: wort (a–z) und deutsch`); });
    if (l.woerterbuch !== undefined) {
      if (!Array.isArray(l.woerterbuch)) f.push("lumisch.woerterbuch: Liste");
      else l.woerterbuch.forEach((w, i) => {
        if (!/^[a-z]{1,12}$/.test(w?.wort ?? "") || !text(w.deutsch, 80) || !text(w.gruppe, 40)) f.push(`lumisch.woerterbuch[${i}]: wort, deutsch, gruppe`);
        if (w.beispiel !== undefined && !(text(w.beispiel?.lumisch, 120) && text(w.beispiel?.deutsch, 160))) f.push(`lumisch.woerterbuch[${i}]: beispiel { lumisch, deutsch }`);
      });
    }
  }
  const ohneCode = !/<script\b|\son[a-z]+\s*=|javascript:/i.test(JSON.stringify(j));
  if (!ohneCode) f.push("enthält Code (Skript, Ereignis-Attribut oder javascript:)");
  return f;
}
