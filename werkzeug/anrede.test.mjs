// Nr. 43 (Miks Regel, 18.10.2026): Die App sagt „du“. „Ihr/eure“ nur ab 2 Personen im Haushalt und nur in der Vorräte-Überschrift
// und im Leer-Satz. Geprüft wird der Text der App selbst; Sätze aus Inhaltspaketen ändert die App nicht (die gehen als Liste an Bill)
// und werden deshalb vor der Prüfung herausgenommen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";
import { personenSetzen, vorratEintragen } from "./vorrat-hilfe.mjs";
import { HILFE } from "../web/hilfe.js";

const WURZEL = path.resolve(import.meta.dirname, "..");
const IHR = /\b(Eure[nmrs]?|eure[nmrs]?|[Ee]uch|[Ee]uer|[Ii]hr|Tragt|seht|habt|könnt|braucht ihr)\b/g;
const SEITEN = { heute: "start", vorsorge: "vorsorge", bereit: "uebersicht", einstellungen: "einstellungen" };

/** Alle Texte aus den Inhalten des Österreich-Pakets, längste zuerst (damit Teilsätze nicht vorher herausfallen). */
const PAKETTEXTE = (() => {
  const l = [];
  const walk = (o) => { if (typeof o === "string") { if (o.length > 12) l.push(o); } else if (o && typeof o === "object") Object.values(o).forEach(walk); };
  const ordner = (d) => { for (const n of readdirSync(d)) { const p = path.join(d, n); if (statSync(p).isDirectory()) ordner(p); else if (n.endsWith(".json")) walk(JSON.parse(readFileSync(p, "utf8"))); } };
  ordner(path.join(WURZEL, "pakete/at-basis/inhalt"));
  return l.sort((a, b) => b.length - a.length);
})();
const ohnePaket = (text) => PAKETTEXTE.reduce((t, s) => t.split(s).join(" "), text);
const treffer = (text) => [...text.matchAll(IHR)].map((m) => text.slice(Math.max(0, m.index - 40), m.index + 30).replace(/\s+/g, " "));

async function sitzung(fn) {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}` });
    await t.laden(`${server.url}/app.html#start`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("#main h1")`, 60_000);
    return await fn(t);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
async function seitenText(t, hash) {
  await t.auswerten(`location.hash = "#__"`); await t.auswerten(`location.hash = "#${hash}"`);
  await warteBis(t, `document.querySelector("#main").children.length`); await t.auswerten(`new Promise((r) => setTimeout(r, 500))`);
  return t.auswerten(`[...document.querySelectorAll("#main *")].filter((e) => !e.children.length || e.matches("p, li, h1, h2, h3, summary, label, button, a")).map((e) => e.textContent).join(" \\n ")`);
}

test("Hilfe: keine Ansprache mit „ihr/euch/eure“ in allen Antworten", () => {
  const alle = Object.entries(HILFE).flatMap(([seite, l]) => (Array.isArray(l) ? l : l.fragen ?? []).flat().map((x) => `${seite}: ${x}`));
  assert.ok(alle.length > 20, "Hilfe-Texte gefunden");
  assert.deepEqual(alle.flatMap(treffer), []);
});

test("1 Person: Heute, Vorsorge, Bereit und Einstellungen sagen „du“, auch mit Vorräten", async () => {
  await sitzung(async (t) => {
    const leer = {};
    for (const [n, h] of Object.entries(SEITEN)) leer[n] = treffer(ohnePaket(await seitenText(t, h)));
    assert.deepEqual(leer, { heute: [], vorsorge: [], bereit: [], einstellungen: [] }, "ohne Vorräte");
    await personenSetzen(t, 1);
    await vorratEintragen(t, [{ produkt: "Wasser", menge: 20, einheit: "Liter", art: "wasser", liter: 20 }, { produkt: "Nudeln", menge: 4, einheit: "Packungen", art: "essen", mahlzeiten: 12 }]);
    const mit = {};
    for (const [n, h] of Object.entries(SEITEN)) mit[n] = treffer(ohnePaket(await seitenText(t, h)));
    assert.deepEqual(mit, { heute: [], vorsorge: [], bereit: [], einstellungen: [] }, "mit Vorräten");
    await t.auswerten(`location.hash = "#start"`); await warteBis(t, `document.querySelector(".heute-polster-titel")`);
    assert.equal(await t.auswerten(`document.querySelector(".heute-polster-titel").textContent`), "Deine Vorräte reichen für 4 Tage");
  });
});

test("3 Personen: nur die Vorräte-Überschrift und der Leer-Satz sagen „Eure/Tragt eure“, alles andere „du“", async () => {
  await sitzung(async (t) => {
    await personenSetzen(t, 3);
    const leerSatz = "Tragt eure Vorräte ein – dann seht ihr, wie lange sie reichen.";
    await t.auswerten(`location.hash = "#start"`); await warteBis(t, `document.querySelector(".heute-polster-titel")`);
    assert.equal(await t.auswerten(`document.querySelector(".heute-polster-titel").textContent`), leerSatz);
    await vorratEintragen(t, [{ produkt: "Wasser", menge: 60, einheit: "Liter", art: "wasser", liter: 60 }, { produkt: "Reis", menge: 6, einheit: "Packungen", art: "essen", mahlzeiten: 45 }]);
    const titel = "Eure Vorräte reichen für 5 Tage";
    const rest = {};
    for (const [n, h] of Object.entries(SEITEN)) rest[n] = treffer(ohnePaket(await seitenText(t, h)).split(titel).join(" ").split(leerSatz).join(" "));
    assert.deepEqual(rest, { heute: [], vorsorge: [], bereit: [], einstellungen: [] });
    await t.auswerten(`location.hash = "#start"`); await warteBis(t, `document.querySelector(".heute-polster-titel")`);
    assert.equal(await t.auswerten(`document.querySelector(".heute-polster-titel").textContent`), titel);
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelector("#polster .polster-tage")`);
    assert.equal(await t.auswerten(`document.querySelector("#polster .polster-tage").textContent`), titel);
  });
});
