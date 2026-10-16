// Nr. 36 (Bill, 16.10.2026): zwei Karten zu Akku und Strom aus inhalt/karten.json des Österreich-Pakets, eine im Szenario
// Blackout unter „Richtig reagieren“, eine in Vorsorge unter „Licht, Strom & Information“; die Suche findet „Powerbank“, „Akku“
// und „laden“. Die Karten sind noch nicht veröffentlicht: Der Klartext liegt nur lokal bzw. in der CI entschlüsselt, deshalb
// stehen hier keine Texte, der Test liest sie aus der Datei (Regel fürs öffentliche Repo, docs/INTERN.md). Er baut eine neue
// Ausgabe von at-basis in einen Testkatalog (Wegwerf-Schlüssel, nur lokal).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { dateiserver, chromeStarten, warteBis, WURZEL } from "./browser.mjs";
import { testkatalog } from "./rundgang/testkatalog.mjs";

const KLARTEXT = path.join(WURZEL, "pakete/at-basis/inhalt/karten.json");
const ohne = !existsSync(KLARTEXT) && "Klartext der Karten fehlt (ohne Kanal-Schlüssel), Test übersprungen";
const KARTEN = ohne ? [] : JSON.parse(readFileSync(KLARTEXT, "utf8")).karten;
// Abkürzungen schreibt die App bei der ersten Nennung aus (Textregel, web/abkuerzungen.js): verglichen wird ohne die Klammer
const ohneKlammer = (x) => x.replace(/ \([^)]*\)/g, "");
const SZ = KARTEN.find((c) => c.ort?.szenario === "blackout" && c.ort.teil === "reagieren"), GV = KARTEN.find((c) => c.ort?.bereich === "licht-strom-info");

async function sitzung(fn) {
  const kat = await testkatalog([], { neueAusgabe: ["pakete/at-basis"] });
  const server = await dateiserver(undefined, {}, kat.umleiten), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Network.enable", {}); await t.s("Network.setBypassServiceWorker", { bypass: true });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}` });
    await t.laden(`${server.url}/app.html#start`);
    await warteBis(t, `(() => { const p = JSON.parse(localStorage.getItem("offline:paket:at-basis") ?? "null"); return p && JSON.stringify(p).includes("karten.json") && document.querySelector("#main h1"); })()`, 60_000);
    return await fn(t);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const ruhig = (t, ms = 400) => t.auswerten(`new Promise((r) => setTimeout(r, ${ms}))`);
async function suche(t, wort) {
  await t.auswerten(`document.querySelector("[data-suche-auf]").click()`); await warteBis(t, `document.getElementById("suche-feld")`);
  await t.auswerten(`(() => { const f = document.getElementById("suche-feld"); f.value = ${JSON.stringify(wort)}; f.dispatchEvent(new Event("input", { bubbles: true })); })()`); await ruhig(t);
  return t.auswerten(`[...document.querySelectorAll("#suche-treffer .suche-eintrag")].map((e) => e.innerText.replace(/\\s+/g, " ").trim())`);
}

test("Blackout › Richtig reagieren: die Karte mit ihren nummerierten Punkten; Suche „Akku“ findet sie", { skip: ohne }, async () => {
  await sitzung(async (t) => {
    await t.auswerten(`location.hash = "#szenario-blackout"`); await warteBis(t, `document.getElementById("sz-reagieren")`, 20_000);
    const k = await t.auswerten(`(() => { const c = document.querySelector("#sz-reagieren #karte-${SZ.id}"); return c ? { titel: c.querySelector("h3").textContent, ol: !!c.querySelector("ol"), punkte: [...c.querySelectorAll("li strong")].map((s) => s.textContent) } : null; })()`);
    assert.deepEqual({ ...k, punkte: k.punkte.map(ohneKlammer) }, { titel: SZ.titel, ol: true, punkte: SZ.punkte.map((x) => x.t) });
    assert.equal(SZ.punkte.length, 6, "sechs Punkte wie im Auftrag");
    // Abkürzungen je Karte nur einmal erklärt (Bill, 16.10.): jede Langform höchstens einmal in der Karte
    assert.deepEqual(await t.auswerten(`(() => { const x = document.querySelector("#karte-${SZ.id}").textContent; return ["Kurznachricht", "drahtloses lokales Netzwerk"].map((w) => x.split(w).length - 1); })()`), [1, 1]);
    assert.equal(await t.auswerten(`document.getElementById("main").innerText.includes("zwei- bis dreimal")`), false, "der Satz mit der unbelegten Zahl fehlt");
    const treffer = await suche(t, "Akku");
    assert.ok(treffer.some((x) => x.includes(SZ.titel)), `Karte nicht gefunden (${treffer.length} Treffer)`);
    // Antippen öffnet das Szenario mit aufgeklapptem Teil
    await t.auswerten(`[...document.querySelectorAll("#suche-treffer .suche-eintrag")].find((e) => e.innerText.includes(${JSON.stringify(SZ.titel)})).click()`);
    await warteBis(t, `location.hash === "#szenario-blackout" && document.getElementById("sz-reagieren")?.open`, 20_000);
  });
});

test("Vorsorge › Licht, Strom & Information: die Karte mit ihren Punkten; Suche „Powerbank“ und „laden“ finden sie", { skip: ohne }, async () => {
  await sitzung(async (t) => {
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.getElementById("gv-licht-strom-info")`, 20_000);
    const k = await t.auswerten(`(() => { const c = document.querySelector("#gv-licht-strom-info #karte-${GV.id}"); return c ? { titel: c.querySelector("h3").textContent, ul: !!c.querySelector("ul"), punkte: [...c.querySelectorAll("li strong")].map((s) => s.textContent) } : null; })()`);
    assert.deepEqual({ ...k, punkte: k.punkte.map(ohneKlammer) }, { titel: GV.titel, ul: true, punkte: GV.punkte.map((x) => x.t) });
    assert.equal(GV.punkte.length, 4, "vier Punkte wie im Auftrag");
    assert.deepEqual(await t.auswerten(`(() => { const x = document.querySelector("#karte-${GV.id}").textContent; return ["Universal Serial Bus", "Kurznachricht"].map((w) => x.split(w).length - 1); })()`), [1, 1]);
    for (const wort of ["Powerbank", "laden"]) {
      const treffer = await suche(t, wort);
      assert.ok(treffer.some((x) => x.includes(GV.titel)), `${wort}: Karte nicht gefunden (${treffer.length} Treffer)`);
      await t.auswerten(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`); await ruhig(t, 200);
    }
  });
});
