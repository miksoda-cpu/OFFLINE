// Nr. 41 (Mik 17.10.2026): Menü neu geordnet, „Polster“ heißt „Vorräte“. Jede Sache steht an einer Stelle: Radio auf Notfall
// (mit den eigenen Frequenzen von früher), Bundesland-Auswahl nur in den Einstellungen, „Installiert“ in der Bibliothek, Bereit nur
// mit Zahl, Aufschlüsselung und dem zu Bestätigenden. Das Wort „Polster“ steht nirgends mehr, die Suche findet es als Synonym.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";
import { vorratEintragen } from "./vorrat-hilfe.mjs";

const SEITEN = ["start", "notfall", "vorsorge", "uebersicht", "werkzeuge", "bibliothek", "einstellungen", "updates", "neues", "pause", "szenario-blackout", "notizen"];
async function sitzung(fn) {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) { localStorage.setItem("offline:land", JSON.stringify("at")); localStorage.setItem("offline:bundesland", JSON.stringify("Tirol")); localStorage.setItem("offline:radio", JSON.stringify({ Tirol: { oe3: "99,9" } })); } } catch {}` });
    await t.laden(`${server.url}/app.html#start`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("#main h1")`, 60_000);
    return await fn(t);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const ruhig = (t, ms = 400) => t.auswerten(`new Promise((r) => setTimeout(r, ${ms}))`);
async function seite(t, s) {
  await t.auswerten(`location.hash = "#${s}"`); await ruhig(t, 500);
  return t.auswerten(`(() => { for (const d of document.querySelectorAll("#main details")) d.open = true;
    const m = document.getElementById("main");
    return { text: m.innerText, radio: !!m.querySelector("#radio, #radio-eigene"), blAuswahl: [...m.querySelectorAll("select")].filter((x) => [...x.options].some((o) => o.text === "Tirol")).map((x) => x.id),
      installiert: [...m.querySelectorAll("h2")].some((h) => h.textContent.trim() === "Installiert") }; })()`);
}

test("Wer hat was: Radio nur auf Notfall, Bundesland-Auswahl nur in den Einstellungen, „Installiert“ nur in der Bibliothek", async () => {
  await sitzung(async (t) => {
    const stand = {};
    for (const s of SEITEN) stand[s] = await seite(t, s);
    assert.deepEqual(SEITEN.filter((s) => stand[s].radio), ["notfall"], "Radio");
    assert.deepEqual(SEITEN.filter((s) => stand[s].blAuswahl.length), ["einstellungen"], "Bundesland-Auswahl");
    assert.deepEqual(SEITEN.filter((s) => stand[s].installiert), ["bibliothek"], "Installiert");
    // Die eigenen Frequenzen von früher stehen jetzt auf Notfall
    await t.auswerten(`location.hash = "#notfall"`); await warteBis(t, `document.querySelector('#radio-eigene [data-radio="oe3"]')`);
    assert.equal(await t.auswerten(`document.querySelector('#radio-eigene [data-radio="oe3"]').value`), "99,9");
    // Bereit: Zahl, Quellen, zu Bestätigendes – keine Kacheln, keine Pause-/Lumi-Zeile, kein Tagesplan
    assert.equal(await t.auswerten(`(location.hash = "#uebersicht", new Promise((r) => setTimeout(() => r(document.querySelectorAll("#main .kachel, #main .pause-zeile, #main #tagesplan").length), 400)))`), 0);
    // Werkzeuge ohne Vorratsrechner; der Tagesplan ist auf Heute geblieben
    assert.ok(!stand.werkzeuge.text.includes("Vorratsrechner"));
    assert.ok(await t.auswerten(`(location.hash = "#start", new Promise((r) => setTimeout(() => r(!!document.querySelector("#main #tagesplan")), 400)))`), "Tagesplan auf Heute");
  });
});

test("„Polster“ steht in keinem sichtbaren Text (leer und mit Vorräten); die Suche findet Radio, Vorräte und Polster", async () => {
  await sitzung(async (t) => {
    const ohne = [];
    for (const s of SEITEN) if (/polster/i.test((await seite(t, s)).text)) ohne.push(s);
    assert.deepEqual(ohne, [], "leer");
    await vorratEintragen(t, [{ produkt: "Wasser", menge: 56, einheit: "Liter", art: "wasser" }, { produkt: "Essen", menge: 1, einheit: "Stück", art: "essen", mahlzeiten: 42 }]); // seit Nr. 42 als Einträge
    const mit = [];
    for (const s of SEITEN) if (/polster/i.test((await seite(t, s)).text)) mit.push(s);
    assert.deepEqual(mit, [], "mit Vorräten");
    await t.auswerten(`location.hash = "#start"`); await warteBis(t, `document.querySelector("#main .bereit-kreis")`);
    assert.match(await t.auswerten(`document.querySelector(".heute-polster-titel").textContent`), /^Deine Vorräte reichen für 14 Tage$/); // Nr. 43: 1 Person sagt „du“
    await t.auswerten(`document.querySelector("#main .bereit-kreis").click()`); await warteBis(t, `document.querySelector(".blatt .bereit-erklaert")`);
    assert.doesNotMatch(await t.auswerten(`document.querySelector(".blatt").innerText`), /polster/i, "Aufschlüsselung");
    await t.auswerten(`document.querySelector(".blatt-zu")?.click()`); await warteBis(t, `!document.querySelector(".blatt")`);
    for (const [wort, erwartet] of [["Radio", /Wie du informiert bleibst|Deine Frequenzen|Radio/], ["Vorräte", /Vorräte/], ["Polster", /Vorräte/]]) {
      await t.auswerten(`document.querySelector("[data-suche-auf]").click()`); await warteBis(t, `document.getElementById("suche-feld")`);
      await t.auswerten(`(() => { const f = document.getElementById("suche-feld"); f.value = ${JSON.stringify(wort)}; f.dispatchEvent(new Event("input", { bubbles: true })); })()`); await ruhig(t);
      const treffer = await t.auswerten(`[...document.querySelectorAll("#suche-treffer .suche-eintrag")].map((e) => e.innerText.replace(/\\s+/g, " "))`);
      assert.ok(treffer.some((x) => erwartet.test(x)), `${wort}: ${treffer.slice(0, 3).join(" | ")}`);
      await t.auswerten(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`); await ruhig(t, 150);
    }
  });
});
