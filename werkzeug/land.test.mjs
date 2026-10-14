// Nr. 28: Land als erste Frage (mit Absender und zwei Sätzen, Nachtrag 2) – nur beim frischen Gerät; Deutschland zeigt auf
// Notfall seine Nummern und keine österreichische (133, 144). Headless-Chrome gegen die Web-App, wie Bildvergleich.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";

const ZEILEN = ["Von der digitalworld Academy OG, Wien.", "Alles, was du eingibst, bleibt auf deinem Gerät.", "OFFLINE ergänzt Radio und Sirene. Es ersetzt sie nicht."];

async function sitzung(vorher, fn) {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    if (vorher) await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (!sessionStorage.getItem("x")) { sessionStorage.setItem("x", "1"); ${vorher} } } catch {}` });
    await t.laden(`${server.url}/app.html#start`);
    return await fn(t, server.url);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}

test("Frisches Gerät: zuerst die Länderfrage mit drei Ländern, „kommen später“ grau, darunter Absender und zwei Sätze sichtbar", async () => {
  await sitzung(null, async (t) => {
    await warteBis(t, `document.getElementById("land-frage")`, 30_000);
    const f = await t.auswerten(`(() => {
      const f = document.getElementById("land-frage"), sichtbar = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0; };
      return { laender: [...f.querySelectorAll('input[name="land"]')].map((i) => i.value + (i.checked ? "*" : "")),
        spaeter: f.querySelector(".land-spaeter")?.textContent, spaeterWaehlbar: !!f.querySelector(".land-spaeter input, .land-spaeter button"),
        zeilen: [...f.querySelectorAll(".land-absender a, .land-absender p")].filter(sichtbar).map((e) => e.textContent.trim()),
        absender: f.querySelector('.land-absender a')?.getAttribute("href"), h1: document.querySelector("#main h1")?.textContent };
    })()`);
    assert.deepEqual(f.laender, ["at*", "de", "ch"]);
    assert.equal(f.spaeter, "Liechtenstein, Italien (Südtirol) und weitere – kommen später"); assert.equal(f.spaeterWaehlbar, false);
    assert.deepEqual(f.zeilen, ZEILEN, "drei Zeilen unter dem Weiter-Knopf, sichtbar"); assert.equal(f.absender, "impressum.html", "Absender führt zum Impressum");
    // Andere Seiten führen nicht an der Frage vorbei
    await t.auswerten(`location.hash = "#notfall"`); await t.auswerten(`new Promise((r) => setTimeout(r, 300))`);
    assert.ok(await t.auswerten(`!!document.getElementById("land-frage")`), "Frage bleibt, bis gewählt ist");
  });
});

test("Langjähriger Benutzer: keine Frage, bleibt bei Österreich", async () => {
  await sitzung(`localStorage.setItem("offline:checks", JSON.stringify({ "0-0": true })); localStorage.setItem("offline:bundesland", JSON.stringify("Tirol"));`, async (t) => {
    await warteBis(t, `document.querySelector("#main h1")`, 30_000);
    assert.deepEqual(await t.auswerten(`({ frage: !!document.getElementById("land-frage"), land: JSON.parse(localStorage.getItem("offline:land")) })`), { frage: false, land: "at" });
  });
});

test("Deutschland: Notfall mit 112, 110, 116 117, keine 133 und keine 144; Szenarien und Radio als Vorschau", async () => {
  await sitzung(null, async (t) => {
    await warteBis(t, `document.getElementById("land-frage")`, 30_000);
    await t.auswerten(`(() => { document.querySelector('input[name="land"][value="de"]').click(); document.querySelector("[data-land-weiter]").click(); })()`);
    await warteBis(t, `!document.getElementById("land-frage") && localStorage.getItem("offline:paket:at-basis")`, 60_000);
    await t.auswerten(`location.hash = "#notfall"`); await warteBis(t, `document.querySelector("#notrufe")`);
    const n = await t.auswerten(`({ nr: [...document.querySelectorAll("#notrufe .notruf-nr")].map((a) => a.textContent), tel: [...document.querySelectorAll("a[href^='tel:']")].map((a) => a.getAttribute("href")), text: document.getElementById("main").innerText })`);
    assert.deepEqual(n.nr, ["112", "110", "116 117"]);
    assert.ok(!n.tel.some((h) => /^tel:(133|144|122|141)$/.test(h)), n.tel.join());
    assert.ok(!/\b133\b|\b144\b/.test(n.text), "keine österreichische Nummer im Text");
    assert.ok(n.text.includes("Kommt mit dem Paket für Deutschland."), "Vorschau statt österreichischer Inhalte");
    assert.ok(!/Ö3|Ö1|Heulton|Zivilschutz/.test(n.text), "keine österreichischen Sender oder Sirenen");
  });
});
