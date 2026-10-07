// Abkürzungen (Textregel Mik, 07.10.2026): Jede Abkürzung wird in jedem Text der App beim ersten Vorkommen ausgeschrieben.
// Der Test prüft (1) die Liste gegen alle Texte – eine neue Abkürzung ohne Eintrag fällt auf –, (2) dass nach dem Ausschreiben
// jede Abkürzung in jedem Text erklärt ist, (3) dass die App die Regel überall anwendet. Die Naturheilkunde nur mit Klartext.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { LISTE, KEINE, OFFEN, ausschreiben, texteAusschreiben } from "./abkuerzungen.js";
import { HILFE } from "./hilfe.js";
import { TEXTE as LUMI_TEXTE } from "./wesen.js";

const url = (p) => new URL(p, import.meta.url);
const json = async (p) => JSON.parse(await readFile(url(p), "utf8"));
const NATUR = url("../pakete/naturheilkunde/inhalt/naturheilkunde.json");
const MIT_NATUR = existsSync(NATUR) ? {} : { skip: "Naturheilkunde nur verschlüsselt im Repo" };

/** Alle Texte als Liste von Zeichenketten (jede ist ein Text für sich, wie in der App). */
function texteVon(x, aus = []) {
  if (typeof x === "string") aus.push(x);
  else if (Array.isArray(x)) x.forEach((y) => texteVon(y, aus));
  else if (x && typeof x === "object") for (const [k, v] of Object.entries(x)) if (!/^(id|ids|pfad|bild|url|buch|wort|lumisch|umschrift|ipa)$/.test(k)) texteVon(v, aus);
  return aus;
}
async function oeffentlicheTexte() {
  const t = [];
  for (const f of ["blackout", "bundeslaender", "notrufe", "sirenen", "vorsorge"]) texteVon(await json(`../pakete/at-basis/inhalt/${f}.json`), t);
  texteVon(await json("../pakete/wir/inhalt/tipps.json"), t);
  texteVon(await json("../pakete/lumi-buch/inhalt/buch.json"), t);
  texteVon(await json("../pakete/lumi-philosophie/inhalt/gedanken.json"), t);
  texteVon((await json("./neues.json")).versionen, t);
  for (const fragen of Object.values(HILFE)) for (const [f, a] of fragen) t.push(`${f}\n${a}`); // Frage und Antwort sind ein Text
  texteVon(LUMI_TEXTE, t);
  return t;
}
const ohneAdressen = (s) => s.replace(/https?:\/\/\S+|www\.\S+|\S+\.(pdf|html?)\b|[\w.-]+\.(?:org|de|at|com|gv|eu|net|ch|uk|int)\/\S*/gi, " ");
/** Was wie eine Abkürzung aussieht: mindestens zwei Großbuchstaben (auch BfR, LGBl), oder k.A., Ph. Eur. */
const KANDIDAT = /(?<![\p{L}\p{N}_@.-])(?:[A-ZÄÖÜ][a-zäöü]{0,2}[A-ZÄÖÜ][A-Za-zÄÖÜäöü0-9]{0,6}|k\.A\.|Ph\. Eur\.)(?![\p{L}\p{N}_@])/gu;
const QUELLNUMMER = /^(?:[SWNZD]\d+|W-\d+|[IVXLC]+|[A-Z]\d+[A-Z]*\d*|CD\d+)$/; // Quellenverweise S12, W4, römische Zahlen, Codes wie A06AB
function unbekannte(texte) {
  const bekannt = new Set([...Object.keys(LISTE), ...Object.keys(KEINE), ...Object.keys(OFFEN)]), aus = new Map();
  for (const t of texte) for (const m of ohneAdressen(t).matchAll(KANDIDAT)) {
    const k = m[0];
    if (bekannt.has(k) || QUELLNUMMER.test(k) || /^[A-ZÄÖÜ]{4,}$/.test(k) && !bekannt.has(k) && /^(?:[A-ZÄÖÜ]+)$/.test(k) && hervorhebung(t, m.index)) continue;
    aus.set(k, (aus.get(k) ?? 0) + 1);
  }
  return aus;
}
/** Ganze Wörter in Großbuchstaben mitten in einer Hervorhebung (**NICHT**) zählen als Betonung, nicht als Abkürzung. */
const hervorhebung = (t, i) => /\*\*[^*]*$/.test(t.slice(0, i));
/** Ist k in diesem Text erklärt? */
const erklaert = (t, k) => [`${k} (${LISTE[k]})`, `${LISTE[k]} (${k})`, `(${k}: ${LISTE[k]}`, `${k}: ${LISTE[k]})`].some((s) => t.includes(s)) || t.indexOf(LISTE[k]) >= 0 && t.indexOf(LISTE[k]) < t.indexOf(k);
const kommtVor = (t, k) => new RegExp(`(?<![\\p{L}\\p{N}_@.])${k.replace(/[.]/g, "\\.")}(?![\\p{L}\\p{N}_@])`, "u").test(ohneAdressen(t));

test("Ausschreiben: Abkürzung bleibt im Satz, Langform in Klammern; Zusammensetzungen, Klammern, schon Erklärtes, Adressen", () => {
  assert.equal(ausschreiben("Tun, was die VIZ sagt. Die VIZ hilft."), "Tun, was die VIZ (Vergiftungsinformationszentrale) sagt. Die VIZ hilft.");
  assert.equal(ausschreiben("Vergiftungsinformationszentrale anrufen. Tun, was die VIZ sagt."), "Vergiftungsinformationszentrale (VIZ) anrufen. Tun, was die VIZ sagt.");
  assert.equal(ausschreiben("Ein Notfall (EMA)"), "Ein Notfall (EMA: Europäische Arzneimittel-Agentur)");
  assert.equal(ausschreiben("auch ohne SIM-Karte und"), "auch ohne SIM-Karte (SIM: Teilnehmer-Identitätsmodul) und");
  assert.equal(ausschreiben("bei TVT/LE nicht"), "bei TVT (tiefe Venenthrombose)/LE (Lungenembolie) nicht");
  assert.equal(ausschreiben("siehe https://www.ema.europa.eu/EMA/x"), "siehe https://www.ema.europa.eu/EMA/x", "Adressen bleiben");
  assert.equal(ausschreiben("Pyrrolizidinalkaloide (PA) und PA-haltig"), "Pyrrolizidinalkaloide (PA) und PA-haltig", "schon erklärt");
  assert.equal(ausschreiben("k.A. | k.A."), "k.A. (keine Angabe) | k.A.");
  for (const s of ["Tun, was die VIZ sagt.", "keine HMPC-/ESCOP-Monographie", "Notfall (EMA)", "Radio/TV einschalten"]) assert.equal(ausschreiben(ausschreiben(s)), ausschreiben(s), `zweimal = einmal: ${s}`);
  assert.deepEqual(texteAusschreiben({ id: "VIZ", text: "die VIZ" }), { id: "VIZ", text: "die VIZ (Vergiftungsinformationszentrale)" }, "Kennungen bleiben");
});

test("Die Liste ist sauber: Langformen ohne eigene Abkürzungen, keine Abkürzung doppelt eingeordnet", () => {
  const alle = Object.keys(LISTE);
  for (const [k, lang] of Object.entries(LISTE)) {
    assert.ok(lang.length > k.length, k);
    for (const j of alle) assert.ok(!new RegExp(`(?<![\\p{L}\\p{N}])${j.replace(/[.]/g, "\\.")}(?![\\p{L}\\p{N}])`, "u").test(lang), `Langform von ${k} enthält ${j}`);
  }
  for (const k of [...Object.keys(KEINE), ...Object.keys(OFFEN)]) assert.ok(!(k in LISTE), `${k} steht zweimal`);
  for (const [k, g] of [...Object.entries(KEINE), ...Object.entries(OFFEN)]) assert.ok(g.length > 3, `${k}: Grund fehlt`);
});

test("Alle Texte der App und der öffentlichen Pakete: jede Abkürzung ist eingeordnet und nach dem Ausschreiben erklärt", async () => {
  const texte = await oeffentlicheTexte();
  assert.deepEqual(Object.fromEntries(unbekannte(texte)), {}, "neue Abkürzung: in LISTE, KEINE oder OFFEN eintragen");
  for (const t of texte) {
    const a = ausschreiben(t);
    for (const k of Object.keys(LISTE)) if (kommtVor(a, k)) assert.ok(erklaert(a, k), `${k} nicht erklärt in: ${a.slice(0, 120)}`);
  }
});

test("Naturheilkunde und Erste-Hilfe-Karte: jede Abkürzung eingeordnet und erklärt; die Seiten bauen weiter (mit Klartext)", MIT_NATUR, async () => {
  const roh = JSON.parse(await readFile(NATUR, "utf8")), texte = texteVon(roh);
  assert.deepEqual(Object.fromEntries(unbekannte(texte)), {}, "neue Abkürzung in der Naturheilkunde");
  const d = texteAusschreiben(roh);
  for (const t of texteVon(d)) for (const k of Object.keys(LISTE)) if (kommtVor(t, k)) assert.ok(erklaert(t, k), `${k} nicht erklärt in: ${t.slice(0, 120)}`);
  const { naturHtml, ersteHilfeHtml } = await import("./natur.js");
  const karte = ersteHilfeHtml(d);
  assert.match(karte, /href="tel:/, "Nummern bleiben antippbar");
  assert.match(karte, /Vergiftungsinformationszentrale \(VIZ\)/);
  for (const e of d.eintraege) assert.ok(naturHtml(d, { weg: "eintrag", eintrag: e.id }).length > 100, e.id);
  for (const w of d.waldfunde_index) assert.ok(naturHtml(d, { weg: "finde", merkmal: w.merkmal }).includes("natur-"), w.merkmal);
});

test("Die App wendet die Regel überall an: Pakete, Hilfe, Was ist neu; eigene Sätze tragen die Langform", async () => {
  const app = await readFile(url("./app.js"), "utf8");
  for (const s of ['const buchDaten = () => texte(PB(), "inhalt/buch.json");', 'texte(installiertesPaket(GEDANKEN_PAKET), "inhalt/gedanken.json")', 'tipps: () => texte(PW(), "inhalt/tipps.json")',
    "const D = (name) => texte(P(), `inhalt/${name}.json`);", 'const naturDaten = () => texte(naturPaket(), "inhalt/naturheilkunde.json");', "ausschreiben(`${f}${TRENNER}${a}`)", "state.neues = texteAusschreiben("]) assert.ok(app.includes(s), s);
  assert.ok(!/inhalt\(P\(\), "inhalt\/bundeslaender/.test(app), "Bundesländer über texte()");
  assert.match(LUMI_TEXTE.ki, /künstlicher Intelligenz \(KI\)/);
  assert.match(app, /Österreichische Rundfunk \(ORF\)/);
});
