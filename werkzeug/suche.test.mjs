// Nr. 30: Suche über alle Texte, auf dem Gerät, ohne Internet. Headless-Chrome gegen die Web-App.
// (a) „Kerze“ findet das Blackout-Szenario, (b) „Knollenblätterpilz“ den Eintrag und die Verweise bei Wiesenchampignon und
// Parasol (statt „Fliegenpilz“, Bill 15.10.), (c) Deutschland: „144“ ergibt nichts, (d) eine eigene Notiz wird gefunden.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";

async function sitzung(land, fn, vorher = "") {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) { localStorage.setItem("offline:land", JSON.stringify("${land}")); ${vorher} } } catch {}` });
    await t.laden(`${server.url}/app.html#start`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && localStorage.getItem("offline:paket:heilkunde-grundstock") && document.querySelector("#main h1")`, 60_000);
    // ohne Internet: die Suche braucht kein Netz
    await t.s("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    return await fn(t);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const suche = (t, q) => t.auswerten(`(async () => {
  if (document.getElementById("suche")?.hidden !== false) document.querySelector(".topbar [data-suche-auf]").click();
  const f = document.getElementById("suche-feld"); f.value = ${JSON.stringify(q)};
  const t0 = performance.now(); f.dispatchEvent(new Event("input")); const ms = performance.now() - t0;
  return { ms, leer: !!document.querySelector(".suche-leer"), treffer: [...document.querySelectorAll(".suche-eintrag")].map((b) => ({ bereich: b.querySelector(".suche-bereich")?.textContent, titel: b.querySelector(".suche-titel")?.textContent ?? "", fett: [...b.querySelectorAll("b")].map((x) => x.textContent) })) };
})()`);

test("(a) „Kerze“ findet das Blackout-Szenario, offline, Wortanfänge, Antippen öffnet die Stelle", async () => {
  await sitzung("at", async (t) => {
    const r = await suche(t, "Kerze");
    const b = r.treffer.filter((x) => x.bereich.startsWith("Szenario Blackout"));
    assert.ok(b.length >= 1, JSON.stringify(r.treffer.slice(0, 5)));
    assert.ok(r.treffer[0].bereich.startsWith("Notfall") || r.treffer[0].bereich.startsWith("Szenario"), "Notfall und Szenarien zuerst");
    assert.ok(b[0].fett.some((w) => /^Kerze/i.test(w)), "Wort fett");
    assert.ok(r.ms < 150, `Antwort in ${r.ms.toFixed(1)} ms`);
    // Antippen: Szenario Blackout, der Teil aufgeklappt
    await t.auswerten(`[...document.querySelectorAll(".suche-eintrag")].find((e) => e.querySelector(".suche-bereich").textContent.startsWith("Szenario Blackout ·")).click()`);
    await warteBis(t, `location.hash === "#szenario-blackout" && document.querySelector("details.sz-teil[open]")`, 10_000);
    assert.equal(await t.auswerten(`document.getElementById("suche").hidden`), true);
    // Umlaute gleich: „Kaelte“ findet „Kälte“
    assert.ok((await suche(t, "Kaelte")).treffer.length > 0, "ä = ae");
    assert.equal((await suche(t, "K")).treffer.length, 0, "erst ab zwei Buchstaben");
  });
});

test("(b) „Knollenblätterpilz“ findet den Eintrag und die Verweise bei Wiesenchampignon und Parasol", async () => {
  await sitzung("at", async (t) => {
    const r = await suche(t, "Knollenblätterpilz"), titel = r.treffer.map((x) => x.titel);
    for (const n of ["Grüner Knollenblätterpilz", "Wiesenchampignon", "Parasol"]) assert.ok(titel.includes(n), `${n}: ${titel.join(", ")}`);
    await t.auswerten(`[...document.querySelectorAll(".suche-eintrag")].find((e) => e.querySelector(".suche-titel")?.textContent === "Grüner Knollenblätterpilz").click()`);
    await warteBis(t, `location.hash === "#heilkunde" && document.querySelector(".hk-titel")?.textContent.includes("Grüner Knollenblätterpilz")`, 10_000);
  });
});

test("(c) Deutschland: „144“ ergibt nichts, „112“ findet den Notruf", async () => {
  await sitzung("de", async (t) => {
    const r = await suche(t, "144");
    assert.deepEqual(r.treffer, [], JSON.stringify(r.treffer.slice(0, 5)));
    assert.ok(r.leer, "Nichts gefunden …");
    assert.ok(await t.auswerten(`document.querySelector(".suche-leer").innerText.includes("Nichts gefunden. Versuch ein anderes Wort.") && document.querySelectorAll(".suche-leer a.btn").length === 3`));
    assert.ok((await suche(t, "112")).treffer.some((x) => x.bereich === "Notfall"));
  });
});

test("(d) Eigene Notiz „Schlüssel bei Oma“ wird gefunden; die Suche geht ohne Internet", async () => {
  await sitzung("at", async (t) => {
    assert.equal(await t.auswerten(`navigator.onLine`), false);
    const r = await suche(t, "Schlüssel Oma");
    assert.ok(r.treffer.some((x) => x.bereich === "Notizen" && x.titel === "Schlüssel bei Oma"), JSON.stringify(r.treffer));
    await t.auswerten(`[...document.querySelectorAll(".suche-eintrag")].find((e) => e.querySelector(".suche-bereich").textContent === "Notizen").click()`);
    await warteBis(t, `location.hash === "#notizen"`, 10_000);
  }, `localStorage.setItem("offline:notizbuch", JSON.stringify([{ id: "n1", titel: "Schlüssel bei Oma", text: "Ersatzschlüssel liegt bei Oma in der Lade.", geaendert: new Date().toISOString() }]));`);
});
