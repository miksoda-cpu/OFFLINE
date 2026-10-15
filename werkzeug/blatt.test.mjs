// Nr. 26 (Bill, 14.10.2026): Ein offenes Blatt übersteht ein Neuzeichnen der Seite darunter (Abo-Stand, Tagespakete im
// Hintergrund): es bleibt offen, an derselben Stelle, und der Fokus bleibt im Blatt. Ein Seitenwechsel schließt es weiter.
// Läuft in der Web-App in Headless-Chrome (CHROME), wie Bildvergleich und Barrierefreiheit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";

async function sitzung(fn) {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 360, height: 640, deviceScaleFactor: 1, mobile: true });
    await t.laden(`${server.url}/app.html#vorsorge`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("#main [data-hilfe]")`, 60_000);
    return await fn(t);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const ruhig = (t, ms = 300) => t.auswerten(`new Promise((r) => setTimeout(r, ${ms}))`);
/** Zustand des Blatts: offen, Bildlauf, liegt der Fokus darin. */
const STAND = `(() => { const b = document.querySelector(".blatt-hinter"), i = b?.querySelector(".blatt-inhalt");
  return { offen: !!b && document.body.contains(b), oben: i ? Math.round(i.scrollTop) : null, fokus: !!b && b.contains(document.activeElement) }; })()`;

test("Hilfe-Blatt bleibt beim Neuzeichnen offen, an derselben Stelle, mit dem Fokus darin", async () => {
  await sitzung(async (t) => {
    await t.auswerten(`document.querySelector("#main [data-hilfe]").click()`);
    await warteBis(t, `document.querySelector(".blatt-hinter .blatt-inhalt")`);
    await ruhig(t);
    await t.auswerten(`(() => { const i = document.querySelector(".blatt-inhalt"); i.scrollTop = 120; i.focus(); })()`);
    const vorher = await t.auswerten(STAND);
    assert.ok(vorher.offen && vorher.oben > 0 && vorher.fokus, `Ausgangslage: ${JSON.stringify(vorher)}`);
    // Neuzeichnen wie aus dem Hintergrund: dieselbe Seite, render() über das Ereignis, an dem es hängt
    await t.auswerten(`dispatchEvent(new HashChangeEvent("hashchange"))`);
    await ruhig(t);
    assert.deepEqual(await t.auswerten(STAND), vorher, "Blatt nach dem Neuzeichnen");
    assert.ok(await t.auswerten(`!!document.querySelector("#main [data-hilfe]")`), "die Seite darunter wurde neu gezeichnet");
  });
});

test("Ein Seitenwechsel schließt das Blatt weiterhin", async () => {
  await sitzung(async (t) => {
    await t.auswerten(`document.querySelector("#main [data-hilfe]").click()`);
    await warteBis(t, `document.querySelector(".blatt-hinter")`);
    await t.auswerten(`location.hash = "#start"`);
    await warteBis(t, `!document.querySelector(".blatt-hinter") && !document.body.classList.contains("blatt-offen")`, 5_000);
  });
});
