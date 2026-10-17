// Nr. 38 (Mik 17.10.2026: „Nix passiert, wenn man auf Anhören klickt“): Ein echter Klick auf „Anhören“ spielt den Ton, und
// play() läuft noch im Klick selbst (WebKit erlaubt Ton nur aus der Geste; vorher kam die Adresse erst nach einem await).
// Fehlt der Ton, steht eine Meldung unter dem Knopf, statt still nichts zu tun. Headless-Chrome, Klick über das DevTools-
// Protokoll (vertrauenswürdige Eingabe).
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";

// play() mitschreiben: ob es während des Klicks lief (Capture setzt die Marke, ein Bubble-Hörer am window nimmt sie zurück)
const MITSCHRIFT = `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}
  window.__play = []; let imKlick = false;
  addEventListener("click", () => { imKlick = true; }, true); addEventListener("click", () => { imKlick = false; });
  const P = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { window.__play.push({ imKlick }); return P.call(this); };`;

async function sitzung(fn, vorbereiten = "") {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: MITSCHRIFT });
    await t.laden(`${server.url}/app.html#start`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("#main h1")`, 60_000);
    await warteBis(t, `caches.open("offline-paket-bilder").then((c) => c.keys()).then((k) => k.filter((r) => r.url.endsWith(".m4a")).length === 4)`, 60_000);
    if (vorbereiten) await t.auswerten(vorbereiten);
    await t.laden(`${server.url}/app.html?neu#notfall`);
    await warteBis(t, `document.querySelector("[data-ton]")`, 30_000);
    await t.auswerten(`new Promise((r) => setTimeout(r, 1500))`); // Töne vorab bereit
    return await fn(t);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
async function klick(t, sel) {
  const { x, y } = await t.auswerten(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({ block: "center" }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  for (const type of ["mousePressed", "mouseReleased"]) await t.s("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
}

test("Anhören: echter Klick spielt den Ton, play() läuft im Klick selbst, keine Meldung", async () => {
  await sitzung(async (t) => {
    await klick(t, "[data-ton]");
    await warteBis(t, `document.querySelector("[data-ton]").dataset.tonStand === "spielt"`, 10_000).catch(() => null);
    const r = await t.auswerten(`({ stand: document.querySelector("[data-ton]").dataset.tonStand ?? "", knopf: document.querySelector("[data-ton]").textContent, play: window.__play, meldung: !!document.querySelector(".sirene-meldung") })`);
    assert.equal(r.stand, "spielt", JSON.stringify(r));
    assert.equal(r.knopf, "■ Anhalten");
    assert.deepEqual(r.play, [{ imKlick: true }], "play() im Klick selbst, nicht nach einem await");
    assert.equal(r.meldung, false);
    // Noch einmal tippen hält an
    await klick(t, "[data-ton]");
    assert.equal(await t.auswerten(`document.querySelector("[data-ton]").textContent`), "▶ Anhören");
  });
});

test("Anhören ohne Ton im Gerät: Meldung unter dem Knopf statt still nichts", async () => {
  await sitzung(async (t) => {
    await klick(t, "[data-ton]");
    await warteBis(t, `document.querySelector(".sirene-meldung")`, 10_000).catch(() => null);
    const r = await t.auswerten(`({ meldung: document.querySelector(".sirene-meldung")?.textContent ?? null, rolle: document.querySelector(".sirene-meldung")?.getAttribute("role"), knopf: document.querySelector("[data-ton]").textContent })`);
    assert.deepEqual(r, { meldung: "Ton lässt sich auf diesem Gerät gerade nicht abspielen.", rolle: "status", knopf: "▶ Anhören" });
  }, `caches.open("offline-paket-bilder").then((c) => c.keys().then((k) => Promise.all(k.filter((r) => r.url.endsWith(".m4a")).map((r) => c.delete(r)))))`);
});
