// Nr. 32, Nachtrag (Mik, 16.10.2026): Der Roman der Woche steht nicht mehr auf Heute, sondern auf „Spiele“ direkt unter dem
// Tagesrätsel, mit Stand, Lesen und Weglegen wie bisher. Dazu der Weg von der letzten veröffentlichten Version (Tag v*) zu
// dieser: Land, Haushalt, Häkchen, Notizen und der Lesestand des Romans bleiben. Beide Fassungen laufen nacheinander unter
// derselben Adresse, also mit demselben Gerätespeicher; die alte kommt aus `git archive <Tag> web`.
// Das Datum steht fest auf dem 16.10.2026, damit ein Kapitel da ist (nicht jeder Tag der Tagespakete hat eins).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";

const WURZEL = path.resolve(import.meta.dirname, "..");
const TAG = "2026-10-16";
const FEST = `(() => { const Echt = Date, d = Echt.parse("${TAG}T10:00:00") - Echt.now();
  class D extends Echt { constructor(...a) { super(...(a.length ? a : [Echt.now() + d])); } static now() { return Echt.now() + d; } }
  globalThis.Date = D; })();`;
const kapitelId = (() => {
  const t = JSON.parse(readFileSync(path.join(WURZEL, "web/pakete/tage-2026-10-2026.10.04/inhalt/tage.json"), "utf8")).tage.find((x) => x.datum === TAG);
  return t.karten.find((k) => k.art === "kapitel").id;
})();
const zahl = (v) => v.split(".").map(Number), kleiner = (a, b) => { const A = zahl(a), B = zahl(b); for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] < B[i]; return false; };
const appVersion = readFileSync(path.join(WURZEL, "web/app.js"), "utf8").match(/const APP_VERSION = "([\d.]+)"/)[1];
/** Die letzte veröffentlichte Version vor dieser (höchster Tag v* unter APP_VERSION). */
const vorige = () => execFileSync("git", ["tag", "--list", "v*"], { cwd: WURZEL, encoding: "utf8" }).split("\n").map((s) => s.trim().slice(1))
  .filter((v) => /^\d+\.\d+\.\d+$/.test(v) && kleiner(v, appVersion)).sort((a, b) => (kleiner(a, b) ? 1 : -1))[0];

async function sitzung(fn, { alt = null } = {}) {
  const fassung = { alt: !!alt };
  const server = await dateiserver(undefined, {}, (p) => (fassung.alt ? path.join(alt, "web", p.endsWith("/") ? p + "index.html" : p) : null));
  const chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Network.enable", {}); await t.s("Network.setBypassServiceWorker", { bypass: true }); // jede Fassung frisch vom Server
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: FEST });
    return await fn(t, server.url, fassung);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const ruhig = (t, ms = 400) => t.auswerten(`new Promise((r) => setTimeout(r, ${ms}))`);
const startBereit = (t) => warteBis(t, `localStorage.getItem("offline:paket:at-basis") && localStorage.getItem("offline:paket:tage-2026-10") && document.querySelector("#main h1")`, 60_000);

test("Heute ohne Roman-Karte; Spiele zeigt sie direkt unter dem Tagesrätsel, mit Stand, Lesen und Weglegen", async () => {
  await sitzung(async (t, url) => {
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}` });
    await t.laden(`${url}/app.html#start`); await startBereit(t);
    await ruhig(t, 800); // Tagespaket geladen, Heute neu gezeichnet
    assert.equal(await t.auswerten(`document.querySelectorAll("#main .tag-leer").length`), 0, "kein „Vorratskammer leer“, wenn die Karten des Tages auf Spiele stehen");
    assert.equal(await t.auswerten(`[...document.querySelectorAll("#main .tag-art")].filter((e) => e.textContent.includes("Roman der Woche")).length + document.querySelectorAll('#main [data-tag-lesen]').length`), 0, "Heute ohne Roman");
    await t.auswerten(`location.hash = "#pause"`); await warteBis(t, `document.querySelector("#main .spiele-roman")`, 20_000);
    const s = await t.auswerten(`(() => { const r = document.querySelector("#main .spiele-raetsel"), roman = document.querySelector("#main .spiele-roman");
      return { direkt: r?.nextElementSibling === roman, art: roman.querySelector(".tag-art").textContent, stand: roman.innerText.match(/Teil \\d+ von \\d+/)?.[0] ?? "",
        lesen: roman.querySelector("[data-tag-lesen]")?.getAttribute("href"), weg: !!roman.querySelector('[data-tag="weg"]') }; })()`);
    assert.ok(s.direkt, "direkt unter dem Tagesrätsel"); assert.equal(s.art, "Roman der Woche"); assert.match(s.stand, /^Teil \d+ von \d+$/);
    assert.equal(s.lesen, "#kapitel"); assert.ok(s.weg, "Weglegen");
    // Lesen öffnet das Kapitel; „‹ Spiele“ und „Gelesen“ führen zurück auf Spiele
    await t.auswerten(`document.querySelector("#main .spiele-roman [data-tag-lesen]").click()`); await warteBis(t, `location.hash === "#kapitel" && document.querySelector(".kapitel-text")`);
    assert.equal(await t.auswerten(`document.querySelector(".kapitel-kopf a").getAttribute("href")`), "#pause");
    await t.auswerten(`document.querySelector('[data-tag="gelesen"]').click()`); await warteBis(t, `location.hash === "#pause" && document.querySelector("#main .spiele-roman")`);
    assert.ok(await t.auswerten(`document.querySelector("#main .spiele-roman .tag-karte--fertig")?.innerText.includes("erledigt")`), "gelesen bleibt sichtbar als erledigt");
  });
});

test("Update von der letzten veröffentlichten Version: Land, Haushalt, Häkchen, Notizen und Lesestand bleiben", async () => {
  const v = vorige();
  assert.ok(v, "Tag der vorigen Version gefunden (CI: Checkout mit fetch-depth 0)");
  const alt = mkdtempSync(path.join(os.tmpdir(), "offline-alt-"));
  execFileSync("sh", ["-c", `git archive v${v} web | tar -x -C "${alt}"`], { cwd: WURZEL });
  await sitzung(async (t, url, fassung) => {
    // Alte Fassung: Land über die Frage, Haushalt und ein Häkchen über die Vorsorge, Roman auf Heute weglegen, eine Notiz
    await t.laden(`${url}/app.html#start`); await warteBis(t, `document.getElementById("land-frage")`, 30_000);
    assert.equal(await t.auswerten(`fetch("/version.json").then((r) => r.json()).then((j) => j.version)`), v, "alte Fassung läuft");
    await t.auswerten(`(() => { document.querySelector('input[name="land"][value="at"]').click(); document.querySelector("[data-land-weiter]").click(); })()`);
    await startBereit(t);
    // Den Roman dort weglegen, wo die alte Fassung ihn zeigt: bis 0.9.0 auf Heute, seit 0.9.1 auf Spiele
    await ruhig(t, 800);
    if (!(await t.auswerten(`!!document.querySelector('#main [data-tag="weg"][data-tag-id="${kapitelId}"]')`))) await t.auswerten(`location.hash = "#pause"`);
    await warteBis(t, `document.querySelector('#main [data-tag="weg"][data-tag-id="${kapitelId}"]')`, 20_000);
    await t.auswerten(`document.querySelector('#main [data-tag="weg"][data-tag-id="${kapitelId}"]').click()`); await ruhig(t);
    // Haushalt dort einstellen, wo die alte Fassung ihn hat: bis 0.9.3 als Haken in der Vorsorge, seit 0.9.4 unter Einstellungen
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelector("[data-check]")`, 20_000);
    if (await t.auswerten(`!!document.querySelector('[data-haushalt="kinder"]')`)) { await t.auswerten(`document.querySelector('[data-haushalt="kinder"]').click()`); await ruhig(t); }
    else {
      await t.auswerten(`location.hash = "#einstellungen"`); await warteBis(t, `document.querySelector('[data-hh-an="kinder"]')`, 20_000);
      await t.auswerten(`document.querySelector('[data-hh-an="kinder"]').click()`); await ruhig(t);
      await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelector("[data-check]")`, 20_000);
    }
    await t.auswerten(`document.querySelector("[data-check]").click()`); await ruhig(t);
    await t.auswerten(`(() => { const n = JSON.parse(localStorage.getItem("offline:notizbuch") ?? "[]"); n.push({ id: "u1", titel: "Treffpunkt", text: "Bei der Kirche um 18 Uhr.", geaendert: new Date().toISOString() }); localStorage.setItem("offline:notizbuch", JSON.stringify(n)); })()`);
    const SCHLUESSEL = ["land", "haushalt", "checks", "notizbuch", `tag:${TAG}`];
    const lesen = () => t.auswerten(`Object.fromEntries(${JSON.stringify(SCHLUESSEL)}.map((k) => [k, localStorage.getItem("offline:" + k)]))`);
    const vorher = await lesen();
    assert.equal(JSON.parse(vorher.land), "at"); assert.deepEqual(JSON.parse(vorher.haushalt), ["kinder"]);
    assert.equal(Object.values(JSON.parse(vorher.checks)).filter(Boolean).length, 1); assert.equal(JSON.parse(vorher[`tag:${TAG}`])[kapitelId], "weg");
    // Neue Fassung unter derselben Adresse
    fassung.alt = false;
    await t.laden(`${url}/app.html?neu#start`); await warteBis(t, `document.querySelector("#main h1")`, 30_000);
    assert.equal(await t.auswerten(`fetch("/version.json").then((r) => r.json()).then((j) => j.version)`), appVersion, "neue Fassung läuft");
    assert.equal(await t.auswerten(`!!document.getElementById("land-frage")`), false, "keine Länderfrage nach dem Update");
    await ruhig(t, 800);
    assert.deepEqual(await lesen(), vorher, "Gerätespeicher unverändert");
    // Und die App zeigt es: Notiz, Haushalt, Häkchen, Roman weggelegt auf Spiele
    // Haushalt steht seit Nr. 40 unter Einstellungen (Haken „Kinder“ → Ja); die Häkchen in Vorsorge
    await t.auswerten(`location.hash = "#einstellungen"`); await warteBis(t, `document.querySelector('[data-hh-an="kinder"]')`, 20_000);
    assert.equal(await t.auswerten(`document.querySelector('[data-hh-an="kinder"]').checked`), true, "Kinder übernommen");
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelector("[data-check]")`, 20_000);
    assert.equal(await t.auswerten(`[...document.querySelectorAll("[data-check]")].filter((c) => c.checked).length`), 1, "Häkchen");
    await t.auswerten(`location.hash = "#notizen"`); await ruhig(t);
    assert.ok(await t.auswerten(`document.getElementById("main").innerText.includes("Treffpunkt")`), "Notiz da");
    await t.auswerten(`location.hash = "#pause"`); await warteBis(t, `document.querySelector("#main .spiele-roman")`, 20_000);
    assert.ok(await t.auswerten(`document.querySelector("#main .spiele-roman .tag-karte--fertig")?.innerText.includes("weggelegt")`), "Lesestand: Roman bleibt weggelegt");
  }, { alt });
});
