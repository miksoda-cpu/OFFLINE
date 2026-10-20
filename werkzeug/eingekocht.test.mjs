// Nr. 45 (Mik 19.10.2026): Eingekochtes in den Vorräten – Einheit „Gläser“, Vorlagen „Eingekochtes (Gläser)“ und „Marmelade
// (Gläser)“, Hinweis nur bei Gläsern, die Suche findet die Vorräte auch unter „Einkochen“. Nachtrag (Mik wählt A): Der Stern der
// Grundvorsorge wird zum Knopf „+ Liste“ / „✓ Auf der Liste“, beim ersten Mal ein kurzer Hinweis, gesetzte Sterne bleiben.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";
import { personenSetzen } from "./vorrat-hilfe.mjs";
import { GLAESER_HINWEIS } from "../web/vorrat-ansicht.js";

async function sitzung(fn, { merkliste = null } = {}) {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) { localStorage.setItem("offline:land", JSON.stringify("at"));${merkliste ? ` localStorage.setItem("offline:merkliste", ${JSON.stringify(JSON.stringify(merkliste))});` : ""} } } catch {}` });
    await t.laden(`${server.url}/app.html#vorsorge`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("[data-merk]")`, 60_000);
    return await fn(t);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const ruhig = (t, ms = 300) => t.auswerten(`new Promise((r) => setTimeout(r, ${ms}))`);
const vorlageKnopf = (t, name) => t.auswerten(`(() => { const b = [...document.querySelectorAll("#polster [data-vorrat-vorlage]")].find((x) => x.textContent.trim() === ${JSON.stringify(name)}); if (b) b.click(); return !!b; })()`);
const hinweis = (t) => t.auswerten(`document.getElementById("vorrat-glaeser")?.textContent ?? null`);
const heute = () => new Date().toISOString().slice(0, 7);
const inZwoelf = () => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 12); return d.toISOString().slice(0, 7); };

test("Vorlage „Eingekochtes (Gläser)“: Gläser, Ablauf in 12 Monaten, Hinweis; gespeichert 6 Mahlzeiten; Marmelade 0; Hinweis nur bei Gläsern", async () => {
  await sitzung(async (t) => {
    await personenSetzen(t, 1);
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelector("#polster [data-vorrat-vorlage]")`, 20_000);
    assert.ok(await vorlageKnopf(t, "Eingekochtes (Gläser)")); await warteBis(t, `document.getElementById("vorrat-form")`);
    const f = await t.auswerten(`({ einheit: document.getElementById("vorrat-einheit").value, monat: document.getElementById("vorrat-monat").value, menge: document.getElementById("vorrat-menge").value })`);
    assert.deepEqual(f, { einheit: "Gläser", monat: inZwoelf(), menge: "6" }); assert.notEqual(f.monat, heute());
    assert.equal(await hinweis(t), GLAESER_HINWEIS, "Hinweis bei Gläsern");
    // Einheit wechseln: Hinweis weg, zurück: wieder da
    await t.auswerten(`(() => { const s = document.getElementById("vorrat-einheit"); s.value = "Dosen"; s.dispatchEvent(new Event("change", { bubbles: true })); })()`); await ruhig(t);
    assert.equal(await hinweis(t), null, "bei Dosen kein Hinweis");
    await t.auswerten(`(() => { const s = document.getElementById("vorrat-einheit"); s.value = "Gläser"; s.dispatchEvent(new Event("change", { bubbles: true })); })()`); await ruhig(t);
    assert.equal(await hinweis(t), GLAESER_HINWEIS);
    await t.auswerten(`document.querySelector("[data-vorrat-speichern]").click()`); await warteBis(t, `!document.getElementById("vorrat-form")`);
    assert.ok(await vorlageKnopf(t, "Marmelade (Gläser)")); await warteBis(t, `document.getElementById("vorrat-form")`);
    await t.auswerten(`document.querySelector("[data-vorrat-speichern]").click()`); await warteBis(t, `!document.getElementById("vorrat-form")`);
    const v = await t.auswerten(`JSON.parse(localStorage.getItem("offline:vorraete")).map((e) => [e.produkt, e.einheit, e.mahlzeiten, e.ablauf])`);
    assert.deepEqual(v, [["Eingekochtes", "Gläser", 6, inZwoelf()], ["Marmelade", "Gläser", 0, inZwoelf()]]);
    // „Neuer Eintrag“ (Stück) ohne Hinweis
    await t.auswerten(`document.querySelector("#polster [data-vorrat-neu]").click()`); await warteBis(t, `document.getElementById("vorrat-form")`);
    assert.equal(await hinweis(t), null);
  });
});

test("Suche: „Einkochen“, „Eingekochtes“, „Einmachgläser“ und „Marmelade“ finden die Vorräte", async () => {
  await sitzung(async (t) => {
    for (const wort of ["Einkochen", "Eingekochtes", "Einmachgläser", "Marmelade"]) {
      await t.auswerten(`document.querySelector("[data-suche-auf]").click()`); await warteBis(t, `document.getElementById("suche-feld")`);
      await t.auswerten(`(() => { const f = document.getElementById("suche-feld"); f.value = ${JSON.stringify(wort)}; f.dispatchEvent(new Event("input", { bubbles: true })); })()`); await ruhig(t);
      const treffer = await t.auswerten(`[...document.querySelectorAll("#suche-treffer .suche-eintrag")].map((e) => e.innerText.replace(/\\s+/g, " "))`);
      assert.ok(treffer.some((x) => /Vorräte/.test(x)), `${wort}: ${treffer.slice(0, 3).join(" | ")}`);
      await t.auswerten(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`); await ruhig(t, 150);
    }
  });
});

test("Nachtrag (seit Nr. 47 „Brauch ich“): setzt und nimmt den Punkt; Hinweis nur beim ersten Mal; 44 px; Name „Brauch ich: …“", async () => {
  await sitzung(async (t) => {
    const knopf = (id) => t.auswerten(`(() => { const b = document.querySelector('.gv-brauch[data-merk="${id}"]'); const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), gedrueckt: b.getAttribute("aria-pressed"), name: b.getAttribute("aria-label"), h: r.height, w: r.width }; })()`);
    let k = await knopf("radio");
    assert.equal(k.text, "Brauch ich"); assert.equal(k.gedrueckt, "false"); assert.match(k.name, /^Brauch ich: /); assert.ok(k.h >= 44 && k.w >= 44, JSON.stringify(k));
    assert.equal(await t.auswerten(`document.querySelectorAll("#grundvorsorge .gv-brauch").length > 0 && ![...document.querySelectorAll("#grundvorsorge .gv-brauch")].some((b) => /[☆★]/.test(b.textContent))`), true, "kein Stern mehr");
    await t.auswerten(`document.querySelector('.gv-brauch[data-merk="radio"]').click()`); await ruhig(t);
    k = await knopf("radio");
    assert.equal(k.text, "Auf der Liste"); assert.equal(k.gedrueckt, "true");
    assert.equal(await t.auswerten(`document.getElementById("gv-msg").textContent.trim()`), "Auf die Einkaufsliste gesetzt", "Hinweis beim ersten Mal");
    assert.deepEqual(await t.auswerten(`JSON.parse(localStorage.getItem("offline:merkliste"))`), ["radio"]);
    await t.auswerten(`document.querySelector('.gv-brauch[data-merk="radio"]').click()`); await ruhig(t);
    assert.equal((await knopf("radio")).text, "Brauch ich"); assert.deepEqual(await t.auswerten(`JSON.parse(localStorage.getItem("offline:merkliste"))`), []);
    await t.auswerten(`document.querySelector('.gv-brauch[data-merk="lampen"]').click()`); await ruhig(t);
    assert.equal(await t.auswerten(`document.getElementById("gv-msg").textContent.trim()`), "", "kein Hinweis beim zweiten Mal");
  });
});

test("Nachtrag: gesetzte Sterne von früher erscheinen als „Auf der Liste“ (Nr. 47)", async () => {
  await sitzung(async (t) => {
    for (const id of ["radio", "lampen"]) assert.equal(await t.auswerten(`document.querySelector('.gv-brauch[data-merk="${id}"]').textContent.trim()`), "Auf der Liste", id);
    assert.equal(await t.auswerten(`document.querySelector('[data-gv="einkauf"]').textContent`), "Einkaufsliste (2)");
  }, { merkliste: ["radio", "lampen"] });
});
