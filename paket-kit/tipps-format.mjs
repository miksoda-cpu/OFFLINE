// Format der Lumi-Tipps (inhalt/tipps.json im Paket „wir“). Wird vom Prüfprogramm (pruefen.mjs) und den Tests benutzt.
//   { "hinweis"?: "…", "tipps": [ { id, sorte, text, gewicht?, bedingung?, ziel?, buch? } ] }
// ziel: Stelle in der App für den Knopf „Zeig mir“ (eine der ZIELE). buch: Absatz im künftigen „Lumi-Buch“ (b1-03-07),
// in App 0.3.4 angenommen und noch nicht verwendet. Die App führt dieselbe Liste in web/wesen.js (Test prüft Gleichheit).

/** Stellen der App, zu denen „Zeig mir“ springen kann: Seiten und Abschnitte der Übersicht. */
export const ZIELE = ["start", "uebersicht", "notfall", "vorsorge", "tresor", "werkzeuge", "bibliothek", "karte", "notizen", "updates", "neues", "kapitel", "heft", "tagesplan", "lumi", "lumi-log"];
export const SORTEN = ["app", "alltag", "wissen", "weisheit", "laune", "heute", "digital"];
export const BUCH = /^b\d{1,2}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Fehler in tipps.json (leere Liste = in Ordnung). */
export function tippsFehler(j) {
  const f = [];
  if (!j || typeof j !== "object" || !Array.isArray(j.tipps)) return ["tipps fehlt (Liste)"];
  const ids = new Set();
  j.tipps.forEach((t, i) => {
    const wo = `tipps[${i}]${t?.id ? ` (${t.id})` : ""}`, F = (s) => f.push(`${wo}: ${s}`);
    if (!t || typeof t !== "object") return F("kein Objekt");
    if (!ID.test(t.id ?? "")) F("id fehlt oder ungültig (a–z, 0–9, -)");
    else if (ids.has(t.id)) F("id doppelt"); else ids.add(t.id);
    if (!SORTEN.includes(t.sorte)) F(`sorte unbekannt (${SORTEN.join(", ")})`);
    if (typeof t.text !== "string" || !t.text.trim() || t.text.length > 600) F("text fehlt oder zu lang (600)");
    if (t.gewicht !== undefined && !(typeof t.gewicht === "number" && t.gewicht > 0 && t.gewicht <= 10)) F("gewicht: Zahl über 0 bis 10");
    if (t.bedingung !== undefined && (typeof t.bedingung !== "object" || Array.isArray(t.bedingung) || t.bedingung === null)) F("bedingung: Objekt");
    if (t.ziel !== undefined && !ZIELE.includes(t.ziel)) F(`ziel unbekannt: ${t.ziel} (${ZIELE.join(", ")})`);
    if (t.buch !== undefined && !(typeof t.buch === "string" && BUCH.test(t.buch))) F("buch: Absatznummer wie b1-03-07");
  });
  return f;
}
