// Nr. 42 (Mik 17.10.2026): Vorratsliste mit Ablaufdatum – in jedem der drei Entwürfe gleich geprüft: Rechnung aus den Einträgen,
// Abgelaufenes zählt nicht, „Bald ablaufend“ auf Heute (ruhig), Einkaufsliste, Suche. Einträge über das Formular wie ein Mensch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";
import { personenSetzen, vorratEintragen } from "./vorrat-hilfe.mjs";

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
const tag = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const ergebnis = (t) => t.auswerten(`document.querySelector("#polster .polster-ergebnis").innerText`);

test("2 Personen, 40 l Wasser, 42 Mahlzeiten → reichen für 7 Tage, Satz zum Essen; Abgelaufenes zählt nicht", async () => {
  await sitzung(async (t) => {
    await personenSetzen(t, 2);
    await vorratEintragen(t, [{ produkt: "Wasser", menge: 40, einheit: "Liter", art: "wasser", ablauf: tag(400) }, { produkt: "Nudeln", menge: 21, einheit: "Packungen", art: "essen", ablauf: tag(300) }]);
    let e = await ergebnis(t);
    assert.match(e, /^Eure Vorräte reichen für 7 Tage/); assert.ok(e.includes("Mit mehr Essen reichen die Vorräte am längsten."), e);
    assert.ok(e.includes("Essen für 7 Tage (42 Mahlzeiten)") && e.includes("Wasser reicht für 10 Tage (40 Liter)"), e);
    // Abgelaufenes Wasser zählt nicht, steht aber in der Liste
    await vorratEintragen(t, [{ produkt: "Altes Wasser", menge: 20, einheit: "Liter", art: "wasser", ablauf: tag(-40).slice(0, 7) }]);
    e = await ergebnis(t);
    assert.ok(e.includes("Wasser reicht für 10 Tage (40 Liter)"), e);
    assert.ok(await t.auswerten(`[...document.querySelectorAll("#polster .vr-zeile--ab")].some((z) => z.innerText.includes("Altes Wasser"))`), "abgelaufen markiert");
    // Alles am Gerät
    assert.equal(await t.auswerten(`JSON.parse(localStorage.getItem("offline:vorraete")).length`), 3);
  });
});

test("Heute: „Bald ablaufend: 6 Dosen Bohnen (in 12 Tagen)“ und ruhig „Abgelaufen: …“; Einkaufsliste; Suche findet Einträge", async () => {
  await sitzung(async (t) => {
    await vorratEintragen(t, [{ produkt: "Bohnen", menge: 6, einheit: "Dosen", art: "essen", ablauf: tag(12) }, { produkt: "Milch", menge: 2, einheit: "Liter", art: "essen", ablauf: tag(-3) }, { produkt: "Kerzen", menge: 10, einheit: "Stück", art: "licht" }]);
    await t.auswerten(`location.hash = "#start"`); await warteBis(t, `document.querySelector("#main .vr-heute")`);
    const h = await t.auswerten(`({ text: document.querySelector("#main .vr-heute").innerText.replace(/\\s+/g, " "), link: document.querySelector("#main .vr-heute").getAttribute("href") })`);
    assert.ok(h.text.includes("Bald ablaufend: 6 Dosen Bohnen (in 12 Tagen)"), h.text);
    assert.ok(h.text.includes("Abgelaufen: 2 Liter Milch"), h.text);
    assert.equal(h.link, "#vorsorge");
    // Einkaufsliste
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelector("[data-vorrat-einkauf]")`);
    await t.auswerten(`document.querySelector("[data-vorrat-einkauf]").click()`); await warteBis(t, `document.querySelector(".blatt .vr-einkauf")`);
    const k = await t.auswerten(`[...document.querySelectorAll(".blatt .vr-einkauf li")].map((l) => l.textContent)`);
    assert.deepEqual(k.slice(0, 2), ["2 Liter Milch (abgelaufen)", "6 Dosen Bohnen (läuft in 12 Tagen ab)"]);
    assert.ok(k.includes("noch 28 Liter Wasser") && !k.includes("Taschenlampe und Batterien"), JSON.stringify(k));
    assert.ok(await t.auswerten(`!!document.querySelector('.blatt [data-einkauf="drucken"]') && !!document.querySelector('.blatt [data-einkauf="teilen"]')`));
    await t.auswerten(`document.querySelector(".blatt-zu")?.click()`); await warteBis(t, `!document.querySelector(".blatt")`);
    // Suche
    await t.auswerten(`document.querySelector("[data-suche-auf]").click()`); await warteBis(t, `document.getElementById("suche-feld")`);
    await t.auswerten(`(() => { const f = document.getElementById("suche-feld"); f.value = "Bohnen"; f.dispatchEvent(new Event("input", { bubbles: true })); })()`);
    await t.auswerten(`new Promise((r) => setTimeout(r, 400))`);
    assert.ok(await t.auswerten(`[...document.querySelectorAll("#suche-treffer .suche-eintrag")].some((e) => e.innerText.includes("Vorräte") && e.innerText.includes("Bohnen"))`), "Suche findet den Eintrag");
  });
});
