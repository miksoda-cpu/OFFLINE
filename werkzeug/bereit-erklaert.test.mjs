// Nr. 39 (Mik 17.10.2026: „Ich habe 12 Punkte, ohne etwas gemacht zu haben“): Antippen der Bereit-Zahl (Heute und Bereit-Seite)
// öffnet „So setzt sich deine Zahl zusammen“ – je Quelle Punkte von möglichen, die Punkte mit Grund, der nächste Schritt.
// Nur Anzeige; die Rechnung bleibt. Headless-Chrome gegen die Web-App.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";
import { vorratEintragen } from "./vorrat-hilfe.mjs";

async function sitzung(fn) {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}` });
    await t.laden(`${server.url}/app.html#start`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("#main [data-bereit-erklaeren]")`, 60_000);
    await t.auswerten(`new Promise((r) => setTimeout(r, 600))`);
    return await fn(t);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const blatt = (t) => t.auswerten(`(() => { const b = document.querySelector(".blatt"); if (!b) return null;
  return { titel: b.querySelector("#blatt-titel").textContent, quellen: [...b.querySelectorAll(".be-quelle h3")].map((h) => h.innerText.replace(/\\s+/g, " ").trim()),
    punkte: [...b.querySelectorAll(".be-quelle li")].map((l) => l.innerText.replace(/\\s+/g, " ").trim()), schritt: b.querySelector(".be-schritt a")?.textContent ?? "" }; })()`);

test("Frisch: Kreis auf Heute ist ein Knopf; das Blatt zeigt „Inhalte 12 von 20“ und beide Paket-Gründe", async () => {
  await sitzung(async (t) => {
    const k = await t.auswerten(`(() => { const k = document.querySelector("#main .bereit-kreis"); return { tag: k.tagName, name: k.getAttribute("aria-label") }; })()`);
    assert.equal(k.tag, "BUTTON"); assert.match(k.name, /^Bereit: \d+ von 100, Aufschlüsselung öffnen$/);
    const zahl = Number(k.name.match(/\d+/)[0]);
    await t.auswerten(`document.querySelector("#main .bereit-kreis").click()`); await warteBis(t, `document.querySelector(".blatt .bereit-erklaert")`);
    const b = await blatt(t);
    assert.equal(b.titel, "So setzt sich deine Zahl zusammen");
    assert.deepEqual(b.quellen, ["Inhalte 12 von 20", "Dinge 0 von 35", "Menschen 0 von 25", "Können 0 von 20"]);
    assert.equal(zahl, 12, "die Summe passt zur Zahl");
    assert.ok(b.punkte.includes("Österreich-Paket auf dem Gerät – automatisch, weil die App es geladen hat"), JSON.stringify(b.punkte));
    assert.ok(b.punkte.some((p) => /^Österreich-Paket nicht älter als sechs Monate – automatisch: Ausgabe vom \d{1,2}\.\d{1,2}\.\d{4}$/.test(p)), JSON.stringify(b.punkte));
    assert.ok(b.schritt.length > 3, "nächster Schritt");
    // Auch auf der Bereit-Seite
    // Das Blatt schließt über einen Schritt zurück in der Historie (Nr. 26); erst danach die Seite wechseln
    await t.auswerten(`document.querySelector(".blatt-zu")?.click()`); await warteBis(t, `!document.querySelector(".blatt") && location.hash === "#start"`);
    await t.auswerten(`location.hash = "#uebersicht"`); await warteBis(t, `document.querySelector("#main .bereit-zahl-knopf")`);
    await warteBis(t, `(() => { const k = document.querySelector("#main .bereit-zahl-knopf"); if (k) k.click(); return !!document.querySelector(".blatt .bereit-erklaert"); })()`, 15_000);
    assert.equal((await blatt(t)).quellen[0], "Inhalte 12 von 20");
  });
});

test("Mit Polster: Trinkwasser trägt den Grund „über eure Vorräte“, ein Häkchen von Hand „von dir abgehakt am …“", async () => {
  await sitzung(async (t) => {
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.getElementById("polster") && document.querySelector('[data-check="radio"]')`, 20_000);
    await t.auswerten(`location.hash = "#einstellungen"`); await warteBis(t, `document.getElementById("hh-personen")`);
    await t.auswerten(`(() => { const i = document.getElementById("hh-personen"); i.value = "2"; i.dispatchEvent(new Event("change", { bubbles: true })); })()`);
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.getElementById("polster")`);
    await vorratEintragen(t, [{ produkt: "Wasser", menge: 56, einheit: "Liter", art: "wasser" }, { produkt: "Essen", menge: 1, einheit: "Stück", art: "essen", mahlzeiten: 18 }]); // seit Nr. 42 als Einträge (2 Personen, 3 Tage)
    await t.auswerten(`document.querySelector('[data-check="radio"]').click()`); await t.auswerten(`new Promise((r) => setTimeout(r, 300))`);
    await t.auswerten(`location.hash = "#start"`); await warteBis(t, `document.querySelector("#main .bereit-kreis")`);
    await t.auswerten(`document.querySelector("#main .bereit-kreis").click()`); await warteBis(t, `document.querySelector(".blatt .bereit-erklaert")`);
    const b = await blatt(t);
    assert.ok(b.punkte.includes("Trinkwasser für 14 Tage – über eure Vorräte"), JSON.stringify(b.punkte));
    assert.ok(b.punkte.some((p) => /^Radio mit Batterie oder Kurbel – von dir abgehakt am \d{1,2}\.\d{1,2}\.\d{4}$/.test(p)), JSON.stringify(b.punkte));
    assert.ok(/^Dinge [1-9]\d* von 35$/.test(b.quellen[1]), b.quellen[1]);
  });
});
