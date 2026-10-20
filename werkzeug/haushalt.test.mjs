// Nr. 40 (Mik 17.10.2026): „Dein Haushalt“ ist eine Einstellung mit Zahlen. (a) Eingestellt ohne Haustiere: kein Tier-Punkt in
// Vorsorge und Suche; mit „Hund 1“ sichtbar. (b) Update von der zuletzt veröffentlichten Version mit alten Haken: übernommen,
// Bereit-Zahl unverändert. (c) Euer Polster rechnet mit der Personenzahl aus dem Haushalt. Dazu der erste Start: nach der
// Länderfrage „Wer lebt bei dir?“, einmal. Headless-Chrome gegen die Web-App.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";
import { vorratEintragen } from "./vorrat-hilfe.mjs";

const WURZEL = path.resolve(import.meta.dirname, "..");
const LAND = `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}`;
async function sitzung(fn, { alt = null, land = true } = {}) {
  const fassung = { alt: !!alt };
  const server = await dateiserver(undefined, {}, (p) => (fassung.alt ? path.join(alt, "web", p.endsWith("/") ? p + "index.html" : p) : null));
  const chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Network.enable", {}); await t.s("Network.setBypassServiceWorker", { bypass: true });
    if (land) await t.s("Page.addScriptToEvaluateOnNewDocument", { source: LAND });
    return await fn(t, server.url, fassung);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const ruhig = (t, ms = 300) => t.auswerten(`new Promise((r) => setTimeout(r, ${ms}))`);
const start = (t, url) => t.laden(`${url}/app.html#start`).then(() => warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("#main h1")`, 60_000));
const einst = async (t) => { await t.auswerten(`location.hash = "#einstellungen"`); await warteBis(t, `document.getElementById("haushalt")`, 20_000); };
const schalten = async (t, feld, an) => { await t.auswerten(`(() => { const c = document.querySelector('[data-hh-an="${feld}"]'); if (c.checked !== ${an}) c.click(); })()`); await ruhig(t); };
const suche = async (t, wort) => {
  await t.auswerten(`document.querySelector("[data-suche-auf]").click()`); await warteBis(t, `document.getElementById("suche-feld")`);
  await t.auswerten(`(() => { const f = document.getElementById("suche-feld"); f.value = ${JSON.stringify(wort)}; f.dispatchEvent(new Event("input", { bubbles: true })); })()`); await ruhig(t);
  const r = await t.auswerten(`[...document.querySelectorAll("#suche-treffer .suche-eintrag")].map((e) => e.innerText.replace(/\\s+/g, " "))`);
  await t.auswerten(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`); await ruhig(t, 150);
  return r;
};

test("(a) Eingestellt ohne Haustiere: kein Tier-Punkt in Vorsorge und Suche; mit „Hund 1“ sichtbar", async () => {
  await sitzung(async (t, url) => {
    await start(t, url);
    await einst(t); await schalten(t, "kinder", true); await schalten(t, "tiere", false);
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelector("[data-check]")`, 20_000);
    assert.equal(await t.auswerten(`!!document.querySelector('[data-check="tierwasser"], [data-check="tier-futter"], [data-check="hund-wasser"]')`), false, "ohne Tiere: kein Tier-Punkt in Vorsorge");
    assert.ok(await t.auswerten(`document.getElementById("haushalt-kurz").innerText.includes("Kinder")`), "Zeile „Dein Haushalt“ in Vorsorge");
    assert.equal((await suche(t, "Kotbeutel")).length, 0, "ohne Tiere: nicht in der Suche"); // seit Nr. 44 Punkte je Tierart
    await einst(t); await schalten(t, "tiere", true); await schalten(t, "tier-hund", true);
    assert.equal(await t.auswerten(`document.getElementById("hh-tier-hund").value`), "1", "Hund mit Anzahl 1");
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelector('[data-check="hund-wasser"]')`, 20_000);
    assert.match(await t.auswerten(`document.querySelector('#gvp-hund-wasser .gv-text').firstChild.textContent`), /^Wasser für 1 Hund: /, "Anzahl im Text");
    assert.ok(await t.auswerten(`document.getElementById("haushalt-kurz").innerText.includes("1 Hund")`));
    assert.ok((await suche(t, "Kotbeutel")).length > 0, "mit Hund: in der Suche");
    assert.deepEqual(await t.auswerten(`JSON.parse(localStorage.getItem("offline:haushalt"))`), ["kinder", "tiere", "tier-hund"]);
  });
});

test("(b) Update von der zuletzt veröffentlichten Version: alte Haken übernommen, Bereit-Zahl unverändert", async () => {
  const tags = execFileSync("git", ["tag", "--list", "v*", "--sort=-v:refname"], { cwd: WURZEL, encoding: "utf8" }).split("\n").filter((x) => /^v\d+\.\d+\.\d+$/.test(x));
  assert.ok(tags.length, "Tag der veröffentlichten Version (CI: fetch-depth 0)");
  // Seit 0.9.4 hat die neueste Version die neue Oberfläche; der Umstieg wird von v0.9.3 aus geprüft, die letzte Version mit den alten Haushalt-Haken (vor Nr. 40).
  const VON = "v0.9.3"; assert.ok(tags.includes(VON), VON);
  const alt = mkdtempSync(path.join(os.tmpdir(), "offline-alt-"));
  execFileSync("sh", ["-c", `git archive ${VON} web | tar -x -C "${alt}"`], { cwd: WURZEL });
  await sitzung(async (t, url, fassung) => {
    await start(t, url);
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelector('[data-haushalt="kinder"]') && document.querySelector("[data-check]")`, 20_000);
    for (const k of ["kinder", "tiere", "miete"]) { await t.auswerten(`document.querySelector('[data-haushalt="${k}"]').click()`); await ruhig(t); }
    await t.auswerten(`document.querySelector('[data-check="trinkwasser"]').click()`); await ruhig(t);
    await t.auswerten(`location.hash = "#start"`); await warteBis(t, `document.querySelector("#main .bereit-zahl")`);
    const vorher = await t.auswerten(`document.querySelector("#main .bereit-zahl").textContent`);
    fassung.alt = false;
    await t.laden(`${url}/app.html?neu#start`); await warteBis(t, `document.querySelector("#main .bereit-zahl")`, 30_000); await ruhig(t, 600);
    assert.equal(await t.auswerten(`document.querySelector("#main .bereit-zahl").textContent`), vorher, "Bereit-Zahl unverändert");
    assert.deepEqual(await t.auswerten(`JSON.parse(localStorage.getItem("offline:haushalt-v2"))`), { personen: null, gruppen: { kinder: 1 }, tiere: { an: true, arten: {} }, wohnen: { form: "wohnung", besitz: "miete", keller: null, stock: null }, eingestellt: true });
    await einst(t);
    assert.deepEqual(await t.auswerten(`({ kinder: document.querySelector('[data-hh-an="kinder"]').checked, anzahl: document.getElementById("hh-kinder")?.value, tiere: document.querySelector('[data-hh-an="tiere"]').checked, miete: document.querySelector('[data-hh-wahl="wohnen-besitz"][value="miete"]').checked, wohnung: document.querySelector('[data-hh-wahl="wohnen-form"][value="wohnung"]').checked })`), { kinder: true, anzahl: "1", tiere: true, miete: true, wohnung: true });
  }, { alt });
});

test("(c) Die Vorräte rechnen mit der Personenzahl aus dem Haushalt", async () => {
  await sitzung(async (t, url) => {
    await start(t, url);
    await einst(t);
    for (let i = 0; i < 3; i++) { await t.auswerten(`document.querySelector('[data-hh-schritt="personen"][data-hh-um="1"]').click()`); await ruhig(t, 150); }
    assert.equal(await t.auswerten(`document.getElementById("hh-personen").value`), "4");
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.getElementById("polster")`);
    assert.equal(await t.auswerten(`!!document.getElementById("polster-personen")`), false, "kein eigenes Personen-Feld mehr im Polster");
    await vorratEintragen(t, [{ produkt: "Wasser", menge: 40, einheit: "Liter", art: "wasser" }, { produkt: "Essen", menge: 1, einheit: "Stück", art: "essen", mahlzeiten: 168 }]); // seit Nr. 42 als Einträge (4 Personen, 14 Tage)
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.getElementById("polster")`);
    const e = await t.auswerten(`document.querySelector("#polster").innerText`);
    assert.match(e, /Für 4 Personen/); assert.match(e, /Eure Vorräte reichen für 5 Tage/, "40 Liter ÷ (2 × 4)");
  });
});

test("Erster Start: nach der Länderfrage „Wer lebt bei dir?“ einmal, mit Weiter und Später", async () => {
  await sitzung(async (t, url) => {
    await t.laden(`${url}/app.html#start`); await warteBis(t, `document.getElementById("land-frage")`, 30_000);
    await t.auswerten(`document.querySelector("[data-land-weiter]").click()`);
    await warteBis(t, `location.hash === "#haushalt-start" && document.getElementById("hh-start")`, 10_000);
    assert.equal(await t.auswerten(`document.querySelector("#hh-start h1").textContent`), "Wer lebt bei dir?");
    await t.auswerten(`document.querySelector('#hh-start [data-hh-schritt="personen"][data-hh-um="1"]').click()`); await ruhig(t);
    await t.auswerten(`document.querySelector('#hh-start [data-hh-schritt="personen"][data-hh-um="1"]').click()`); await ruhig(t);
    await t.auswerten(`document.querySelector('[data-hh-start="weiter"]').click()`);
    await warteBis(t, `location.hash === "#start"`);
    assert.equal(await t.auswerten(`JSON.parse(localStorage.getItem("offline:haushalt-v2")).personen`), 3);
    assert.deepEqual(await t.auswerten(`JSON.parse(localStorage.getItem("offline:haushalt"))`), [], "nur die Personenzahl: die App zeigt weiter alles");
  }, { land: false });
});
