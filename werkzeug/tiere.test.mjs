// Nr. 44 (Mik 18.10., Bill 19.10.2026): Vorsorge-Punkte je Tierart im eigenen Bereich „Haustiere“. Sichtbar nur mit gewählten
// Tieren, auch nicht, wenn der Haushalt noch nicht eingestellt ist. Die Anzahl aus „Dein Haushalt“ steht im Text. Die Punkte
// kommen aus at-basis (neue Ausgabe, im Testkatalog mit Wegwerf-Schlüssel gebaut); die Bereit-Zahl ändert sich ohne Tiere nicht.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { dateiserver, chromeStarten, warteBis, WURZEL } from "./browser.mjs";
import { testkatalog } from "./rundgang/testkatalog.mjs";

const GRUND = JSON.parse(readFileSync(path.join(WURZEL, "pakete/at-basis/inhalt/grundvorsorge.json"), "utf8"));
const HAUSTIERE = GRUND.bereiche.find((b) => b.id === "haustiere").punkte;
const ids = (tag) => HAUSTIERE.filter((p) => p.fuer.includes(tag)).map((p) => p.id);
const ALLE_TIER_IDS = HAUSTIERE.map((p) => p.id);

async function sitzung(fn, { neu = true } = {}) {
  const kat = neu ? await testkatalog([], { neueAusgabe: ["pakete/at-basis"] }) : null;
  const server = await dateiserver(undefined, {}, kat ? kat.umleiten : () => null), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Network.enable", {}); await t.s("Network.setBypassServiceWorker", { bypass: true });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}` });
    await t.laden(`${server.url}/app.html#start`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("#main h1")`, 60_000);
    return await fn(t);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const ruhig = (t, ms = 300) => t.auswerten(`new Promise((r) => setTimeout(r, ${ms}))`);
/** Ein Schalter oder eine Zahl unter Einstellungen › Dein Haushalt, wie von Hand. */
async function haushalt(t, feld, wert) {
  await t.auswerten(`location.hash = "#einstellungen"`); await warteBis(t, `document.getElementById("haushalt")`, 20_000);
  if (typeof wert === "boolean") await warteBis(t, `document.querySelector('[data-hh-an="${feld}"]')`);
  await t.auswerten(typeof wert === "boolean"
    ? `(() => { const i = document.querySelector('[data-hh-an="${feld}"]'); if (i.checked !== ${wert}) i.click(); })()`
    : `(() => { const i = document.querySelector('[data-hh-zahl="${feld}"]'); i.value = "${wert}"; i.dispatchEvent(new Event("change", { bubbles: true })); })()`);
  await ruhig(t);
}
async function vorsorge(t) {
  await t.auswerten(`location.hash = "#__"`); await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelector("#grundvorsorge [data-check]")`, 20_000); await ruhig(t);
  return t.auswerten(`({ bereich: !!document.getElementById("gv-haustiere"), checks: [...document.querySelectorAll("#grundvorsorge [data-check]")].map((i) => i.dataset.check),
    texte: Object.fromEntries([...document.querySelectorAll("#grundvorsorge .gv-punkt")].map((li) => [li.querySelector("[data-check]").dataset.check, li.querySelector(".gv-text").firstChild.textContent.trim()])) })`);
}
const bereitZahl = async (t) => { await t.auswerten(`location.hash = "#uebersicht"`); await warteBis(t, `document.querySelector("#main .bereit-zahl-knopf")`, 20_000); return t.auswerten(`document.querySelector("#main .bereit-zahl-knopf").textContent.replace(/\\D+/g, "")`); };

test("Ohne Tiere kein einziger Tier-Punkt (nichts eingestellt und mit Kindern); die Bereit-Zahl bleibt wie mit der veröffentlichten Ausgabe", async () => {
  const vorher = await sitzung(bereitZahl, { neu: false });
  await sitzung(async (t) => {
    let v = await vorsorge(t);
    assert.equal(v.bereich, false, "kein Bereich Haustiere");
    assert.deepEqual(v.checks.filter((c) => ALLE_TIER_IDS.includes(c)), [], "nichts eingestellt");
    for (const alt of ["tierapotheke", "tierpapiere", "tier-unterkunft"]) assert.ok(!v.checks.includes(alt), `${alt} ersetzt`);
    assert.equal(await bereitZahl(t), vorher, "Bereit-Zahl ohne Tiere unverändert");
    await haushalt(t, "kinder", true);
    v = await vorsorge(t);
    assert.equal(v.bereich, false); assert.deepEqual(v.checks.filter((c) => ALLE_TIER_IDS.includes(c)), [], "mit Kindern, ohne Tiere");
    assert.equal(v.texte["tier-baby-nahrung"], "Essen für Haustiere und Babynahrung, falls nötig", "ohne Tiere wie bisher");
  });
});

test("Hund und Katze: genau die Punkte für alle Tiere, Hund und Katze; Anzahl im Text; Babynahrung ohne Haustier-Teil", async () => {
  await sitzung(async (t) => {
    await haushalt(t, "kinder", true);
    await haushalt(t, "tiere", true); await haushalt(t, "tier-hund", true); await haushalt(t, "tier-hund", 2); await haushalt(t, "tier-katze", true);
    const v = await vorsorge(t);
    assert.equal(v.bereich, true);
    assert.deepEqual(v.checks.filter((c) => ALLE_TIER_IDS.includes(c)), [...ids("tier"), ...ids("tier-hund"), ...ids("tier-katze")]);
    assert.equal(v.texte["tier-futter"], "Futter für 14 Tage für 2 Hunde und 1 Katze");
    assert.equal(v.texte["hund-wasser"], "Wasser für 2 Hunde: etwa 50–60 ml je kg Körpergewicht und Tag");
    assert.equal(v.texte["katze-wasser"], "Wasser für 1 Katze: frisch und frei verfügbar");
    assert.deepEqual(Object.entries(v.texte).filter(([, x]) => x.includes("{")), [], "keine Platzhalter übrig");
    assert.equal(v.texte["tier-baby-nahrung"], "Babynahrung, falls nötig");
    // ohne Kinder fällt der Babynahrung-Punkt mit Tieren ganz weg
    await haushalt(t, "kinder", false);
    assert.ok(!(await vorsorge(t)).checks.includes("tier-baby-nahrung"));
  });
});
