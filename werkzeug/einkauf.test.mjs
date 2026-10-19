// Nr. 42 (Miks Wahl 17.10.2026): Der Stern der Grundvorsorge und die Einkaufsliste sind eine Liste. Stern setzen → Punkt steht in
// der Einkaufsliste; „entfernen“ dort nimmt den Stern weg. Update von der zuletzt veröffentlichten Version: gesetzte Sterne
// (Merkliste) bleiben und stehen in der Einkaufsliste. Dazu Entwurf A mit den Vorlage-Knöpfen aus C.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";

const WURZEL = path.resolve(import.meta.dirname, "..");
async function sitzung(fn, { alt = null } = {}) {
  const fassung = { alt: !!alt };
  const server = await dateiserver(undefined, {}, (p) => (fassung.alt ? path.join(alt, "web", p.endsWith("/") ? p + "index.html" : p) : null));
  const chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Network.enable", {}); await t.s("Network.setBypassServiceWorker", { bypass: true });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}` });
    await t.laden(`${server.url}/app.html#vorsorge`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("[data-merk]")`, 60_000);
    return await fn(t, server.url, fassung);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const ruhig = (t, ms = 300) => t.auswerten(`new Promise((r) => setTimeout(r, ${ms}))`);
const liste = async (t) => {
  await t.auswerten(`document.querySelector('[data-gv="einkauf"]').click()`); await warteBis(t, `document.querySelector(".blatt .vr-einkauf")`);
  const x = await t.auswerten(`[...document.querySelectorAll(".blatt .vr-einkauf--stern")].map((l) => l.firstChild.textContent.trim())`);
  return x;
};

test("„+ Liste“ (früher Stern) → Punkt steht in der Einkaufsliste; „entfernen“ nimmt ihn weg; Name „Auf die Einkaufsliste“", async () => {
  await sitzung(async (t) => {
    const p = await t.auswerten(`(() => { const b = document.querySelector('[data-merk="radio"]'); return { label: b.getAttribute("aria-label"), text: b.closest("li").querySelector("span").textContent.trim() }; })()`);
    assert.match(p.label, /^Auf die Einkaufsliste: /);
    await t.auswerten(`document.querySelector('[data-merk="radio"]').click()`); await ruhig(t);
    // Nr. 45 Nachtrag: Knopf mit gleichbleibendem Namen, der Zustand steht in aria-pressed
    assert.equal(await t.auswerten(`document.querySelector('[data-merk="radio"]').getAttribute("aria-pressed")`), "true");
    assert.match(await t.auswerten(`document.querySelector('[data-gv="einkauf"]').textContent`), /^Einkaufsliste \(1\)$/);
    assert.deepEqual(await liste(t), [p.text]);
    await t.auswerten(`document.querySelector('.blatt [data-merk="radio"]').click()`); await ruhig(t);
    assert.equal(await t.auswerten(`document.querySelectorAll(".blatt .vr-einkauf--stern").length`), 0, "entfernt");
    assert.deepEqual(await t.auswerten(`JSON.parse(localStorage.getItem("offline:merkliste"))`), []);
    // Entwurf A mit den Vorlagen aus C: Knöpfe über der Liste nach Art
    await t.auswerten(`document.querySelector(".blatt-zu")?.click()`); await warteBis(t, `!document.querySelector(".blatt")`);
    assert.ok(await t.auswerten(`(() => { const v = document.querySelector("#polster .vr-vorlagen"), g = document.querySelector("#polster .vr-gruppe"); return !!v && !!g && (v.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; })()`), "Vorlagen über der Liste");
  });
});

test("Update von der zuletzt veröffentlichten Version: gesetzte Sterne bleiben und stehen in der Einkaufsliste", async () => {
  const tags = execFileSync("git", ["tag", "--list", "v*", "--sort=-v:refname"], { cwd: WURZEL, encoding: "utf8" }).split("\n").filter((x) => /^v\d+\.\d+\.\d+$/.test(x));
  assert.ok(tags.length, "Tag (CI: fetch-depth 0)");
  const alt = mkdtempSync(path.join(os.tmpdir(), "offline-alt-"));
  execFileSync("sh", ["-c", `git archive ${tags[0]} web | tar -x -C "${alt}"`], { cwd: WURZEL });
  await sitzung(async (t, url, fassung) => {
    for (const id of ["radio", "lampen"]) { await t.auswerten(`document.querySelector('[data-merk="${id}"]').click()`); await ruhig(t); }
    const vorher = await t.auswerten(`localStorage.getItem("offline:merkliste")`);
    assert.deepEqual(JSON.parse(vorher), ["radio", "lampen"]);
    fassung.alt = false;
    await t.laden(`${url}/app.html?neu#vorsorge`); await warteBis(t, `document.querySelector('[data-gv="einkauf"]')`, 30_000);
    assert.equal(await t.auswerten(`localStorage.getItem("offline:merkliste")`), vorher, "Sterne unverändert");
    assert.equal((await liste(t)).length, 2, "beide in der Einkaufsliste");
  }, { alt });
});
