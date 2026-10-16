// Nr. 28 (Bill, Rundgang 14.10.2026 auf 70581c4 bei 390 px: „Heute“, Rätsel-Karte rechts 403 px): Die Karten auf Heute
// laufen bei 360, 390 und 430 px nicht seitlich über, auch nicht mit einem langen Rätseltext (lange Wörter, Zahlenreihen,
// Formeln ohne Leerzeichen). Headless-Chrome gegen die Web-App, wie Bildvergleich und Barrierefreiheit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";

const LANG = "Ein Rätsel mit Donaudampfschifffahrtsgesellschaftskapitänsmützenabzeichen und 1+2+3+4+5+6+7+8+9+10+11+12+13+14+15=120? "
  + "Dazu eine Reihe: 2,4,8,16,32,64,128,256,512,1024,2048,4096 – und die Lösung heißt S-C-H-N-E-E-F-L-O-C-K-E-N-G-E-S-T-Ö-B-E-R.";

const UEBER = (b) => `[...document.querySelectorAll("#main *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > ${b} + 1; }).slice(0, 5).map((e) => (e.className || e.tagName) + " " + Math.round(e.getBoundingClientRect().right))`;

test("Heute und Spiele laufen bei 360, 390 und 430 px nicht seitlich über, auch mit einem langen Rätseltext", async () => {
  const server = await dateiserver(), chrome = await chromeStarten();
  try {
    for (const b of [360, 390, 430]) {
      const t = await chrome.tab();
      await t.s("Emulation.setDeviceMetricsOverride", { width: b, height: 844, deviceScaleFactor: 1, mobile: true });
      await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}` });
      await t.laden(`${server.url}/app.html#start`);
      // Seit Nr. 32 stehen Rätsel und Roman auf „Spiele“; Heute kann ohne Tageskarte sein. Gewartet wird auf das geladene Tagespaket.
      await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && Object.keys(localStorage).some((k) => k.startsWith("offline:paket:tage-")) && document.querySelector("#main .heute-stapel")`, 60_000);
      await t.auswerten(`new Promise((r) => setTimeout(r, 800))`);
      assert.deepEqual(await t.auswerten(UEBER(b)), [], `${b} px, wie geliefert`);
      assert.equal(await t.auswerten(`document.documentElement.scrollWidth`), b, `${b} px: Seite`);
      // Seit Nr. 29 steht das Tagesrätsel oben auf „Spiele“: dort derselbe lange Rätseltext
      await t.auswerten(`location.hash = "#pause"`);
      await warteBis(t, `document.querySelector(".spiele-raetsel .tag-karte .tag-frage")`, 30_000);
      assert.deepEqual(await t.auswerten(UEBER(b)), [], `${b} px, Spiele wie geliefert`);
      // langer Rätseltext in die Karte des Tages, Antwortfeld und Knöpfe bleiben
      await t.auswerten(`(() => { const p = document.querySelector(".spiele-raetsel .tag-karte .tag-frage"); p.textContent = ${JSON.stringify(LANG)}; })()`);
      await t.auswerten(`new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))`);
      assert.deepEqual(await t.auswerten(UEBER(b)), [], `${b} px, langer Rätseltext`);
      assert.equal(await t.auswerten(`document.documentElement.scrollWidth`), b, `${b} px: Seite mit langem Rätseltext`);
      await t.schliessen();
    }
  } finally { await chrome.beenden(); server.schliessen(); }
});
