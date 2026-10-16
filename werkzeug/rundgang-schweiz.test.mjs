// Nr. 37 (Bill, 16.10.2026): Die Prüfung des Rundgang-Profils „schweiz“ erkennt eine österreichische Notrufnummer. Auf der echten
// Notfall-Seite für die Schweiz findet sie nichts (die 144 ist dort die Sanität); eine künstlich eingeschleuste 133 im Text oder
// als tel:-Link macht sie rot.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";
import { AT_NUMMERN_PRUEFEN, NOTRUFE_LESEN } from "./rundgang/pruefungen.mjs";
import { LAENDER } from "../web/laender.js";

test("Profil schweiz: echte Notfall-Seite ohne Befund, eingeschleuste österreichische Nummer wird erkannt", async () => {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("ch")); } catch {}` });
    await t.laden(`${server.url}/app.html#notfall`);
    await warteBis(t, `document.querySelector("#notrufe .notruf-nr")`, 60_000);
    assert.deepEqual(await t.auswerten(NOTRUFE_LESEN), LAENDER.ch.notrufe.map((x) => x.nr), "Schweizer Nummern");
    assert.deepEqual(await t.auswerten(AT_NUMMERN_PRUEFEN), [], "echte Seite: keine österreichische Nummer (144 ist Schweizer Sanität)");
    // eingeschleust: im Text
    await t.auswerten(`document.getElementById("main").insertAdjacentHTML("beforeend", "<p id='falsch'>Polizei 133</p>")`);
    assert.deepEqual(await t.auswerten(AT_NUMMERN_PRUEFEN), ["133 im Text"]);
    // eingeschleust: als Link, Text ohne Nummer
    await t.auswerten(`document.getElementById("falsch").outerHTML = "<a id='falsch' href='tel:1450'>Gesundheitsnummer</a>"`);
    assert.deepEqual(await t.auswerten(AT_NUMMERN_PRUEFEN), ["tel:1450"]);
    // Teil einer längeren Zahl zählt nicht
    await t.auswerten(`document.getElementById("falsch").outerHTML = "<p id='falsch'>PLZ 1330, Seite 141.5</p>"`);
    assert.deepEqual(await t.auswerten(AT_NUMMERN_PRUEFEN), []);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
});
