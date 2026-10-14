// Nr. 27 (Mik, 14.10.2026): Im MVP ist die Lumi nur angekündigt. Ein frisches Gerät zeigt auf Heute, im Menü und auf
// Bereit nichts von der Lumi (keine Figur, keine Einladung, keine Tipps, keine Lumi-Seite); wer schon eine Lumi mit Namen
// hat, behält alles. Läuft in der Web-App in Headless-Chrome (CHROME), wie Bildvergleich und Barrierefreiheit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";

/** Alles, was nach Lumi aussieht, in Inhalt, Menü und Leiste unten. */
const LUMI = `(() => {
  const orte = [document.getElementById("main"), document.getElementById("sidebar"), document.getElementById("tabbar")].filter(Boolean);
  const aus = [];
  for (const o of orte) {
    for (const el of o.querySelectorAll('[class*="lumi"], [class*="wesen"], [id*="lumi"], [id*="wesen"], [data-route="lumi"], a[href="#lumi"], a[href="#heft"], [data-lumi], [data-tipp]')) {
      if (el.id === "wesen-karte" && !el.querySelector('[class*="buehne"]:not(.buehne-kopf)')) continue; // der Kopf von Heute mit der Bereit-Zahl, leer an Lumi (die Windows-Probe sucht ihn unter diesem Namen)
      aus.push(el.id || el.className || el.tagName);
    }
    if (/Lumi|Textkarte des Tages/.test(o.innerText)) aus.push("Text: " + (o.innerText.match(/.{0,30}(Lumi|Textkarte des Tages).{0,30}/)?.[0] ?? ""));
  }
  return aus;
})()`;

async function sitzung(fn) {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 1, mobile: true });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}` }); // Nr. 28: Land gewählt
    await t.laden(`${server.url}/app.html#start`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("#main h1")`, 60_000);
    return await fn(t, server.url);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const ruhig = (t) => t.auswerten(`new Promise((r) => setTimeout(r, 1500))`);

test("Frisches Gerät: kein Lumi-Element auf Heute, im Menü und auf Bereit; #lumi führt nach Heute", async () => {
  await sitzung(async (t, url) => {
    // eine Woche nach dem ersten Start, damit eine Einladung fällig wäre
    await t.auswerten(`localStorage.setItem("offline:lumi-start", JSON.stringify({ erstStart: new Date(Date.now() - 9 * 86400000).toISOString(), karte: "offen" }))`);
    await t.laden(`${url}/app.html?neu#start`); await warteBis(t, `document.querySelector("#main h1")`); await ruhig(t);
    assert.deepEqual(await t.auswerten(LUMI), [], "Heute");
    await t.auswerten(`location.hash = "#uebersicht"`); await warteBis(t, `document.title.includes("Bereit")`); await ruhig(t);
    assert.deepEqual(await t.auswerten(LUMI), [], "Bereit");
    await t.auswerten(`location.hash = "#lumi"`); await ruhig(t);
    assert.equal(await t.auswerten(`location.hash`), "#start", "keine Lumi-Seite");
    const w = await t.auswerten(`JSON.parse(localStorage.getItem("offline:wesen") ?? "null")`);
    assert.notEqual(w?.darstellung, "aus", "die eigene Darstellung bleibt gespeichert, nichts wird umgestellt");
  });
});

test("Wer eine Lumi mit Namen hat, behält Figur, Lumi-Seite und Menüpunkt", async () => {
  await sitzung(async (t, url) => {
    await t.auswerten(`localStorage.setItem("offline:wesen", JSON.stringify({ version: 3, name: "Fini", darstellung: "wesen" }))`);
    await t.laden(`${url}/app.html?neu#start`); await warteBis(t, `document.querySelector("#main h1")`); await ruhig(t);
    assert.ok(await t.auswerten(`!!document.querySelector("#main .wesen-buehne, #main .lumi-buehne")`), "Figur auf Heute");
    assert.ok(await t.auswerten(`!!document.querySelector('#sidebar [data-route="lumi"]')`), "Lumi im Menü");
    await t.auswerten(`location.hash = "#lumi"`); await ruhig(t);
    assert.equal(await t.auswerten(`location.hash`), "#lumi");
  });
});
