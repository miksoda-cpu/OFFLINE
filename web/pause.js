// Pause: Happen für zwischendurch (Auftrag 2026-10-04-pause-stufe1). Hier steht die Logik ohne Oberfläche: Einstellungen,
// Spiel-Log, „Deine Linie“ (Gewichte, Ausschlüsse, Zone), der Dirigent (Regeln, ohne KI, ohne Netz), wann ein Happen
// fällig ist, Rückfragen, Rückspiegel. Die Spiele selbst: web/pause-happen.js. Startwerte: web/pause-werte.js.
// Grundsätze (OFFLINE-Prinzip-Milde-Zugkraft.md): Ende, Gelingen, kein Falsch-Ton, keine Serien, keine Zählung nach außen,
// nichts verlässt das Gerät, alles Gelernte sichtbar und zurücksetzbar.

import { WERTE } from "./pause-werte.js";

export { WERTE };
export const TRAININGSARTEN = ["tempo", "kraft", "ausdauer", "beweglichkeit", "koordination", "gruppe"];
export const ART_TEXT = { tempo: "schnelle Aufgaben", kraft: "Abrufen und Merken", ausdauer: "Ruhe und Fokus", beweglichkeit: "Umdenken", koordination: "Körper und Kopf zugleich", gruppe: "Gemeinsames" };
export const LEBENSABSCHNITTE = { kind: "unter 14", J: "14 bis 29", M1: "30 bis 49", M2: "50 bis 64", A: "65 und älter" };
export const APPETIT = { wenig: "wenig", mittel: "mittel", viel: "viel" };
const TAG_MS = 86400000;

// ---------- Einstellungen ----------
export const STANDARD = { an: false, alter: null, appetit: "mittel", neuigkeit: 0, seit: null };
export function einstellungenLaden(g) {
  const e = { ...STANDARD, ...(g && typeof g === "object" ? g : {}) };
  if (!(e.alter in LEBENSABSCHNITTE)) e.alter = null;
  if (!(e.appetit in APPETIT)) e.appetit = "mittel";
  e.neuigkeit = Math.max(-1, Math.min(1, Number(e.neuigkeit) || 0));
  e.an = e.an === true && e.alter !== null && e.alter !== "kind"; // unter 14 gibt es Pause nicht (Kinder-Modus fehlt noch)
  return e;
}
/** Darf Pause angeboten werden? Unter 14 nicht, solange es den Kinder-Modus nicht gibt. */
export const angeboten = (alter) => alter !== "kind";

// ---------- Datum (Kalendertage des Geräts) ----------
export const tagVon = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const tageZwischen = (a, b) => Math.round((Date.parse(`${tagVon(b)}T12:00:00`) - Date.parse(`${tagVon(a)}T12:00:00`)) / TAG_MS);
export const plusMonate = (t, m) => { const d = new Date(t); d.setMonth(d.getMonth() + m); return tagVon(d); };

// ---------- Spiel-Log (am Gerät) ----------
/** Eintrag: { zeit, quelle ("pause" | "raetsel" | "modul:<id>"), id, art[], ergebnis{}, dauer (s), abgebrochen? } */
export function logDazu(log, eintrag, jetzt = Date.now()) {
  const l = Array.isArray(log) ? log : [];
  l.push({ zeit: new Date(jetzt).toISOString(), ...eintrag });
  return l.length > WERTE.logMax ? l.slice(-WERTE.logMax) : l;
}
export const pauseEintraege = (log) => (log ?? []).filter((e) => e.quelle === "pause");

// ---------- Deine Linie ----------
export function linieLaden(g) {
  const x = g && typeof g === "object" ? g : {};
  const zahlen = (o, min, max) => Object.fromEntries(Object.entries(o && typeof o === "object" ? o : {}).filter(([, v]) => typeof v === "number" && Number.isFinite(v)).map(([k, v]) => [k, Math.min(max, Math.max(min, v))]));
  return {
    gewicht: zahlen(x.gewicht, WERTE.gewicht.tief, WERTE.gewicht.hoch),
    aus: [...new Set((Array.isArray(x.aus) ? x.aus : []).filter((v) => typeof v === "string"))],
    stufe: zahlen(x.stufe, 1, 20),
    antworten: x.antworten && typeof x.antworten === "object" ? { ...x.antworten } : {},
    letzteRueckfrage: typeof x.letzteRueckfrage === "string" ? x.letzteRueckfrage : null,
    auffrischung: x.auffrischung && typeof x.auffrischung === "object" ? { ...x.auffrischung } : {},
    rueckspiegelAm: typeof x.rueckspiegelAm === "string" ? x.rueckspiegelAm : null,
    happen: Number.isInteger(x.happen) ? x.happen : 0, // nur für „jeder fünfte“, wird nie gezeigt
  };
}
export const gewichtVon = (linie, id) => linie.gewicht[id] ?? WERTE.gewicht.start;
export const stufeVon = (linie, form) => linie.stufe[form.id] ?? form.zone?.start ?? 1;
const verwandt = (a, b) => a.id !== b.id && a.art.some((x) => b.art.includes(x));

/** Bewertung nach einem Happen: mehr hebt die Form und leicht ihre Verwandten, nicht nimmt sie heraus, passt ändert nichts. */
export function bewerten(linie, formen, id, art) {
  const l = linieLaden(linie), f = formen.find((x) => x.id === id), G = WERTE.gewicht, r = (x) => Math.round(x * 100) / 100;
  if (!f) return l;
  if (art === "mehr") {
    l.gewicht[id] = r(Math.min(G.hoch, gewichtVon(l, id) * G.mehr));
    for (const v of formen.filter((x) => !x.bedingung && verwandt(f, x))) l.gewicht[v.id] = r(Math.min(G.hoch, gewichtVon(l, v.id) * G.verwandtMehr));
  }
  if (art === "nicht") {
    if (!l.aus.includes(id)) l.aus.push(id);
    for (const v of formen.filter((x) => !x.bedingung && verwandt(f, x))) l.gewicht[v.id] = r(Math.max(G.tief, gewichtVon(l, v.id) * G.verwandtNicht));
  }
  return l;
}
export function zurueckholen(linie, id) { const l = linieLaden(linie); l.aus = l.aus.filter((x) => x !== id); return l; }
/** Zu leicht / Genau richtig / Zu schwer stellt die Stufe direkt. */
export function schwierigkeit(linie, form, urteil) {
  const l = linieLaden(linie), s = stufeVon(l, form), max = form.zone?.stufen ?? 1;
  if (urteil === "leicht") l.stufe[form.id] = Math.min(max, s + 1);
  if (urteil === "schwer") l.stufe[form.id] = Math.max(1, s - 1);
  return l;
}
/** Zone 2 halten: Liegt die Trefferquote der letzten Happen dieser Form über 85 %, eine Stufe schwerer, unter 75 % leichter. */
export function zoneAnpassen(linie, form, log) {
  const l = linieLaden(linie);
  if (!form.zone) return l;
  const letzte = pauseEintraege(log).filter((e) => e.id === form.id && !e.abgebrochen && typeof e.ergebnis?.von === "number" && e.ergebnis.von > 0).slice(-WERTE.zone.beurteilenNach);
  if (letzte.length < WERTE.zone.beurteilenNach) return l;
  const quote = letzte.reduce((s, e) => s + e.ergebnis.treffer, 0) / letzte.reduce((s, e) => s + e.ergebnis.von, 0);
  const s = stufeVon(l, form);
  if (quote > WERTE.zone.obere) l.stufe[form.id] = Math.min(form.zone.stufen, s + 1);
  else if (quote < WERTE.zone.untere) l.stufe[form.id] = Math.max(1, s - 1);
  return l;
}
export function zoneText(linie, form, log) {
  const letzte = pauseEintraege(log).filter((e) => e.id === form.id && typeof e.ergebnis?.von === "number" && e.ergebnis.von > 0).slice(-5);
  if (!letzte.length) return "noch nicht gespielt";
  if (letzte.length < WERTE.zone.beurteilenNach) return "wird noch eingestellt";
  const q = letzte.reduce((s, e) => s + e.ergebnis.treffer, 0) / letzte.reduce((s, e) => s + e.ergebnis.von, 0);
  return q > 0.9 ? "locker" : q >= 0.7 ? "fordernd, aber lösbar" : "an der Grenze";
}

// ---------- Was gerade geht ----------
/**
 * Kann diese Form jetzt gespielt werden? kontext: { jetzt, alter, funktionen (Set), abend (Tagesschluss vorbei oder ab 18 Uhr),
 * hat: { roman, gestern } }. Ausgeschlossene Formen (Nicht mehr) zählt der Dirigent selbst aus.
 */
export function verfuegbar(form, k) {
  if (form.bedingung?.funktion && !k.funktionen?.has(form.bedingung.funktion)) return false;
  if (k.alter && !form.alter.includes(k.alter)) return false;
  const stunde = new Date(k.jetzt).getHours();
  if (form.tageszeit === "morgen" && stunde >= WERTE.morgenBis) return false;
  if (form.tageszeit === "abend" && !(k.abend || stunde >= WERTE.abendAb)) return false;
  if (form.braucht && !k.hat?.[form.braucht]) return false;
  return true;
}

/**
 * Ist beim Öffnen ein Happen fällig? Höchstens einmal je Öffnen; ein Öffnen innerhalb von 10 Minuten nach dem letzten
 * zählt nicht. Appetit = Angebote je Tag. Nie im Notfall-Bereich. Nach dem Tagesschluss nur noch „Der Tag rückwärts“,
 * einmal. o: { einstellungen, jetzt, oeffnen: { letztes, tag, angebote, abendGezeigt }, route, schluss }.
 * Gibt { faellig, nurAbend, oeffnen } zurück (oeffnen = neuer Stand zum Speichern).
 */
export function happenFaellig({ einstellungen, jetzt, oeffnen, route, schluss }) {
  const e = einstellungenLaden(einstellungen);
  const alt = oeffnen && typeof oeffnen === "object" ? oeffnen : {};
  const heute = tagVon(jetzt);
  const neu = { letztes: new Date(jetzt).toISOString(), tag: heute, angebote: alt.tag === heute ? alt.angebote ?? 0 : 0, abendGezeigt: alt.tag === heute ? !!alt.abendGezeigt : false };
  const nichts = (grund) => ({ faellig: false, nurAbend: false, grund, oeffnen: neu });
  if (!e.an) return nichts("aus");
  if (route === "notfall") return { ...nichts("Notfall"), oeffnen: { ...alt } }; // im Notfall zählt nichts
  if (alt.letztes && jetzt - Date.parse(alt.letztes) < WERTE.oeffnenAbstandMin * 60000) return { ...nichts("kein neues Öffnen"), oeffnen: { ...alt, letztes: neu.letztes } };
  if (schluss) return neu.abendGezeigt ? nichts("Tagesschluss") : { faellig: true, nurAbend: true, oeffnen: { ...neu, abendGezeigt: true } };
  if (neu.angebote >= (WERTE.appetit[e.appetit] ?? WERTE.appetit.mittel)) return nichts("Appetit");
  return { faellig: true, nurAbend: false, oeffnen: { ...neu, angebote: neu.angebote + 1 } };
}

// ---------- Der Dirigent ----------
/** Trainingsarten, die diese Woche (Montag bis heute) schon in Happen vorkamen. */
export function artenDieseWoche(log, jetzt) {
  const d = new Date(jetzt); const montag = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)).getTime();
  return new Set(pauseEintraege(log).filter((e) => Date.parse(e.zeit) >= montag && !e.abgebrochen).flatMap((e) => e.art ?? []));
}
export const imKennenlernen = (einstellungen, jetzt) => !!einstellungen?.seit && tageZwischen(einstellungen.seit, jetzt) < WERTE.kennenlernenTage;
/** Ist heute eine Auffrischung für eine Form fällig (nach etwa 11 und 35 Monaten, ACTIVE-Muster)? */
export function auffrischungFaellig(linie, formen, jetzt) {
  const heute = tagVon(jetzt);
  for (const f of formen.filter((x) => x.auffrischung_monate)) {
    const a = linie.auffrischung?.[f.id];
    if (!a?.erstes) continue;
    for (const m of f.auffrischung_monate) { const termin = plusMonate(a.erstes, m); if (termin <= heute && !(a.erledigt ?? []).includes(m)) return { form: f.id, monate: m, termin }; }
  }
  return null;
}
export function auffrischungTermine(linie, formen) {
  return formen.filter((x) => x.auffrischung_monate && linie.auffrischung?.[x.id]?.erstes).map((f) => ({ form: f.id, titel: f.titel, termine: f.auffrischung_monate.map((m) => ({ monate: m, datum: plusMonate(linie.auffrischung[f.id].erstes, m), erledigt: (linie.auffrischung[f.id].erledigt ?? []).includes(m) })) }));
}

/**
 * Den nächsten Happen wählen. o: { formen, linie, log, einstellungen, jetzt, kontext, rnd, ohne (zuletzt gespielte id) }.
 * Gibt { form, grund } oder null zurück. Regeln: nur verfügbare, nicht ausgeschlossene Formen; Auffrischung zuerst; im
 * Kennenlernen das am wenigsten Gespielte; sonst Mischung Vertraut/Verwandt/Neu (Regler), darin nach Gewicht, Alter und
 * Wochenausgleich. Nie zweimal dieselbe Form hintereinander, wenn es anders geht.
 */
export function waehle({ formen, linie, log, einstellungen, jetzt, kontext, rnd = Math.random, ohne = null }) {
  const l = linieLaden(linie), e = einstellungenLaden(einstellungen);
  let pool = formen.filter((f) => !l.aus.includes(f.id) && verfuegbar(f, { ...kontext, jetzt, alter: e.alter }));
  if (kontext?.nurAbend) pool = pool.filter((f) => f.tageszeit === "abend");
  if (!pool.length) return null;
  if (pool.length > 1 && ohne) pool = pool.filter((f) => f.id !== ohne);
  const af = auffrischungFaellig(l, pool, jetzt);
  if (af) return { form: pool.find((f) => f.id === af.form), grund: "auffrischung" };
  const gespielt = (id) => pauseEintraege(log).filter((x) => x.id === id).length;
  if (imKennenlernen(e, jetzt)) {
    const min = Math.min(...pool.map((f) => gespielt(f.id)));
    const wenig = pool.filter((f) => gespielt(f.id) === min);
    return { form: wenig[Math.floor(rnd() * wenig.length) % wenig.length], grund: "kennenlernen" };
  }
  const gemocht = pool.filter((f) => gespielt(f.id) >= 2 && gewichtVon(l, f.id) >= 1);
  const vertraut = gemocht, neu = pool.filter((f) => gespielt(f.id) === 0);
  const verw = pool.filter((f) => !vertraut.includes(f) && !neu.includes(f) && vertraut.some((g) => verwandt(f, g)));
  const M = WERTE.mischung, s = e.neuigkeit * WERTE.neuigkeitRegler;
  const anteile = [["vertraut", vertraut, Math.max(0, M.vertraut - s)], ["verwandt", verw, M.verwandt], ["neu", neu, Math.max(0, M.neu + s)]].filter(([, l2]) => l2.length);
  let topf = anteile.length ? anteile : [["vertraut", pool, 1]];
  let r = rnd() * topf.reduce((a, [, , w]) => a + w, 0), wahl = topf[0];
  for (const t of topf) { r -= t[2]; if (r <= 0) { wahl = t; break; } }
  const fehlt = artenDieseWoche(log, jetzt), tendenz = WERTE.alter[e.alter] ?? {};
  const antw = l.antworten ?? {};
  const gw = wahl[1].map((f) => {
    let w = gewichtVon(l, f.id);
    if (f.art.some((a) => !fehlt.has(a))) w *= WERTE.wocheFehlt; // Ausgleich: kommt diese Woche noch nicht vor
    w *= Math.max(1, ...f.art.map((a) => tendenz[a] ?? 1), tendenz[f.gruppe] ?? 1);
    if (antw.tempo === "ruhiger" && f.gruppe === "ruhe") w *= 1.3;
    if (antw.tempo === "schneller" && f.art.includes("tempo")) w *= 1.3;
    if (antw.inhalt === "woerter" && (f.gruppe === "wort" || f.gruppe === "geschichte")) w *= 1.3;
    if (antw.inhalt === "zahlen" && (f.gruppe === "spiel" || f.gruppe === "raetsel")) w *= 1.3;
    return w;
  });
  r = rnd() * gw.reduce((a, b) => a + b, 0);
  for (let i = 0; i < wahl[1].length; i++) { r -= gw[i]; if (r <= 0) return { form: wahl[1][i], grund: wahl[0] }; }
  return { form: wahl[1][wahl[1].length - 1], grund: wahl[0] };
}

// ---------- Rückfragen (kurz, überspringbar) ----------
export const RUECKFRAGEN = [
  { id: "tempo", frage: "Lieber schneller oder ruhiger?", antworten: { schneller: "Schneller", ruhiger: "Ruhiger" } },
  { id: "inhalt", frage: "Mehr Wörter oder mehr Zahlen?", antworten: { woerter: "Wörter", zahlen: "Zahlen" } },
  { id: "zeit", frage: "Wann passt dir so etwas am besten?", antworten: { morgens: "Morgens", abends: "Abends", egal: "Egal" } },
];
/** Höchstens eine Rückfrage am Tag im Kennenlernen, danach höchstens eine je Woche; jede Frage nur einmal. */
export function rueckfrageFaellig(linie, einstellungen, jetzt) {
  const l = linieLaden(linie), e = einstellungenLaden(einstellungen);
  const offen = RUECKFRAGEN.filter((q) => !(q.id in l.antworten));
  if (!offen.length) return null;
  const abstand = imKennenlernen(e, jetzt) ? WERTE.rueckfrage.kennenlernenAbstandTage : WERTE.rueckfrage.danachAbstandTage;
  if (l.letzteRueckfrage && tageZwischen(l.letzteRueckfrage, jetzt) < abstand) return null;
  return offen[0];
}
export function rueckfrageBeantworten(linie, id, antwort, jetzt) {
  const l = linieLaden(linie);
  l.letzteRueckfrage = new Date(jetzt).toISOString();
  if (antwort !== null) l.antworten[id] = antwort; else l.antworten[id] = l.antworten[id] ?? null; // überspringen: nicht wieder fragen
  return l;
}

// ---------- In Worten ----------
const zahlwort = (n) => ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn"][n] ?? String(n);
export const zahlText = (n) => (n === 1 ? "einen" : zahlwort(n));

/** „So sehe ich dich“ am Ende des Kennenlernens (oder später): was gern gespielt wird, in einem Satz. */
export function soSeheIchDich(linie, log, formen) {
  const l = linieLaden(linie);
  const beliebt = formen.filter((f) => !l.aus.includes(f.id) && pauseEintraege(log).some((e) => e.id === f.id)).sort((a, b) => gewichtVon(l, b.id) - gewichtVon(l, a.id)).slice(0, 2);
  if (!beliebt.length) return null;
  const tempo = l.antworten.tempo === "ruhiger" ? " und eher ruhig" : l.antworten.tempo === "schneller" ? " und gern schnell" : "";
  return `Du magst ${beliebt.map((f) => `„${f.titel}“`).join(" und ")}${tempo}.`;
}
/** Wochenbilanz in Worten (nur Gemochtes zählt, ein abgelehntes Spiel wird nie untergeschoben). */
export function wochenSatz(linie, log, formen, jetzt) {
  const l = linieLaden(linie), da = artenDieseWoche(log, jetzt);
  const gemocht = formen.filter((f) => !l.aus.includes(f.id) && gewichtVon(l, f.id) >= 1 && !f.bedingung);
  const fehlt = TRAININGSARTEN.filter((a) => !da.has(a) && gemocht.some((f) => f.art.includes(a)));
  if (!fehlt.length) return "Diese Woche war schon von allem etwas dabei, was du magst.";
  return `Ich achte darauf, dass diese Woche auch ${fehlt.slice(0, 2).map((a) => ART_TEXT[a]).join(" und ")} vorkommen, in Happen, die du magst.`;
}
/**
 * Rückspiegel: einmal im Monat eine ruhige Karte in Worten, ohne Punkte. Vergleicht den Pilz (Blitzdauer) oder die Zahl der
 * gelernten Lumisch-Wörter mit vor einem Monat. Gibt einen Satz oder null.
 */
export function rueckspiegel(log, linie, einstellungen, jetzt, formen = []) {
  const l = linieLaden(linie), e = einstellungenLaden(einstellungen);
  if (!e.seit || tageZwischen(e.seit, jetzt) < WERTE.rueckspiegelTage) return null;
  if (l.rueckspiegelAm && tageZwischen(l.rueckspiegelAm, jetzt) < WERTE.rueckspiegelTage) return null;
  const vorMonat = jetzt - WERTE.rueckspiegelTage * TAG_MS;
  const p = pauseEintraege(log);
  const pilz = p.filter((x) => x.id === "pilz" && typeof x.ergebnis?.ms === "number");
  const frueh = pilz.filter((x) => Date.parse(x.zeit) <= vorMonat).at(-1), jetztP = pilz.at(-1);
  if (frueh && jetztP && jetztP.ergebnis.ms < frueh.ergebnis.ms) return `Vor einem Monat blitzte der Pilz noch ${frueh.ergebnis.ms} Millisekunden lang. Heute findest du ihn schon nach ${jetztP.ergebnis.ms}.`;
  const woerter = (bis) => new Set(p.filter((x) => x.id === "lumisch" && Date.parse(x.zeit) <= bis && x.ergebnis?.wort).map((x) => x.ergebnis.wort)).size;
  const a = woerter(vorMonat), b = woerter(jetzt);
  if (b > a) return a ? `Vor einem Monat kanntest du ${zahlText(a)} Lumisch-Wörter. Heute sind es ${zahlText(b)}.` : `Vor einem Monat war Lumisch noch fremd. Heute kennst du ${b === 1 ? "ein Wort" : `${zahlText(b)} Wörter`}.`;
  const tage = new Set(p.filter((x) => Date.parse(x.zeit) > vorMonat).map((x) => tagVon(Date.parse(x.zeit)))).size;
  return tage ? `Im letzten Monat hattest du an ${zahlText(tage)} Tagen eine Pause. Schön, dass du dir die Zeit nimmst.` : null;
}
