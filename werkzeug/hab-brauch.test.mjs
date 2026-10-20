// Nr. 47 (Mik 20.10.2026): Jeder Grundvorsorge-Punkt hat zwei Knöpfe, „Hab ich“ (grün, das bisherige Häkchen, zählt für Bereit)
// und „Brauch ich“ (blau, auf der Einkaufsliste, gedrückt „Auf der Liste“). Beides schließt sich aus; nochmal tippen = nichts.
// Alte Daten bleiben: Häkchen = „Hab ich“, Sterne = „Brauch ich“, beides zugleich = „Hab ich“. Die Bereit-Zahl rechnet wie bisher.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { dateiserver, chromeStarten, warteBis, WURZEL } from "./browser.mjs";

async function sitzung(fn, { vorher = null, alt = null } = {}) {
  const server = await dateiserver(undefined, {}, (p) => (alt ? path.join(alt, "web", p.endsWith("/") ? p + "index.html" : p) : null));
  const chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Network.enable", {}); await t.s("Network.setBypassServiceWorker", { bypass: true });
    const setzen = Object.entries({ land: "at", ...(vorher ?? {}) }).map(([k, v]) => `localStorage.setItem("offline:${k}", ${JSON.stringify(JSON.stringify(v))});`).join(" ");
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) { ${setzen} } } catch {}` });
    await t.laden(`${server.url}/app.html#vorsorge`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("#grundvorsorge [data-check]")`, 60_000);
    return await fn(t);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const ruhig = (t, ms = 300) => t.auswerten(`new Promise((r) => setTimeout(r, ${ms}))`);
const stand = (t, id) => t.auswerten(`(() => { const h = document.querySelector('.gv-hab[data-check="${id}"]'), b = document.querySelector('.gv-brauch[data-merk="${id}"]');
  return { hab: h.getAttribute("aria-pressed"), brauch: b.getAttribute("aria-pressed"), text: b.textContent.trim(), habName: h.getAttribute("aria-label").split(":")[0], brauchName: b.getAttribute("aria-label").split(":")[0],
    checks: JSON.parse(localStorage.getItem("offline:checks") ?? "{}")["${id}"] ?? false, liste: JSON.parse(localStorage.getItem("offline:merkliste") ?? "[]").includes("${id}") }; })()`);
const tippen = async (t, knopf, id) => { await t.auswerten(`document.querySelector('${knopf === "hab" ? `.gv-hab[data-check="${id}"]` : `.gv-brauch[data-merk="${id}"]`}').click()`); await ruhig(t); };

test("„Hab ich“ und „Brauch ich“ schließen sich aus; Brauch ich → Einkaufsliste, Hab ich → weg von der Liste; nochmal tippen = nichts", async () => {
  await sitzung(async (t) => {
    assert.deepEqual(await stand(t, "radio"), { hab: "false", brauch: "false", text: "Brauch ich", habName: "Hab ich", brauchName: "Brauch ich", checks: false, liste: false });
    assert.equal(await t.auswerten(`document.querySelectorAll('#grundvorsorge input[type="checkbox"]').length`), 0, "kein Kästchen mehr");
    await tippen(t, "brauch", "radio");
    assert.deepEqual(await stand(t, "radio"), { hab: "false", brauch: "true", text: "Auf der Liste", habName: "Hab ich", brauchName: "Brauch ich", checks: false, liste: true });
    await tippen(t, "hab", "radio");
    assert.deepEqual(await stand(t, "radio"), { hab: "true", brauch: "false", text: "Brauch ich", habName: "Hab ich", brauchName: "Brauch ich", checks: true, liste: false }, "Hab ich nimmt von der Liste");
    await tippen(t, "brauch", "radio");
    assert.deepEqual(await stand(t, "radio"), { hab: "false", brauch: "true", text: "Auf der Liste", habName: "Hab ich", brauchName: "Brauch ich", checks: false, liste: true }, "Brauch ich nimmt Hab ich zurück");
    await tippen(t, "brauch", "radio");
    assert.deepEqual(await stand(t, "radio"), { hab: "false", brauch: "false", text: "Brauch ich", habName: "Hab ich", brauchName: "Brauch ich", checks: false, liste: false }, "nochmal = nichts");
    await tippen(t, "hab", "radio"); await tippen(t, "hab", "radio");
    assert.deepEqual(await stand(t, "radio"), { hab: "false", brauch: "false", text: "Brauch ich", habName: "Hab ich", brauchName: "Brauch ich", checks: false, liste: false });
    // Einkaufsliste: nur, was „Brauch ich“ ist
    await tippen(t, "brauch", "lampen"); await tippen(t, "brauch", "kocher"); await tippen(t, "hab", "kocher");
    await t.auswerten(`document.querySelector('[data-gv="einkauf"]').click()`); await warteBis(t, `document.querySelector(".blatt .vr-einkauf")`);
    assert.equal(await t.auswerten(`document.querySelectorAll(".blatt .vr-einkauf--stern").length`), 1, "nur Lampen");
    // Knöpfe mindestens 44 px hoch, gleich breit
    const m = await t.auswerten(`(() => { document.querySelector(".blatt-zu")?.click(); const h = document.querySelector(".gv-hab").getBoundingClientRect(), b = document.querySelector(".gv-brauch").getBoundingClientRect(); return { hh: h.height, bh: b.height, gleich: Math.abs(h.width - b.width) < 1 }; })()`);
    assert.ok(m.hh >= 44 && m.bh >= 44 && m.gleich, JSON.stringify(m));
  });
});

test("Alte Daten: Häkchen = „Hab ich“, Sterne = „Brauch ich“, beides zugleich = „Hab ich“ und fällt von der Liste", async () => {
  await sitzung(async (t) => {
    const r = await stand(t, "radio"), l = await stand(t, "lampen"), k = await stand(t, "kocher");
    assert.equal(r.hab, "true"); assert.equal(r.brauch, "false"); assert.equal(r.liste, false, "beides → Hab ich, von der Liste");
    assert.equal(l.hab, "true"); assert.equal(l.brauch, "false");
    assert.equal(k.hab, "false"); assert.equal(k.brauch, "true"); assert.equal(k.text, "Auf der Liste");
    assert.deepEqual(await t.auswerten(`JSON.parse(localStorage.getItem("offline:merkliste"))`), ["kocher"]);
    assert.deepEqual(await t.auswerten(`JSON.parse(localStorage.getItem("offline:checks"))`), { radio: true, lampen: true }, "kein Häkchen verloren");
  }, { vorher: { checks: { radio: true, lampen: true }, merkliste: ["radio", "kocher"] } });
});

test("Bereit-Zahl: gleicher Abhak-Stand ergibt dieselbe Zahl wie in der veröffentlichten Version (Kästchen)", async () => {
  const tags = execFileSync("git", ["tag", "--list", "v*", "--sort=-v:refname"], { cwd: WURZEL, encoding: "utf8" }).split("\n").filter((x) => /^v\d+\.\d+\.\d+$/.test(x));
  const alt = mkdtempSync(path.join(os.tmpdir(), "offline-alt-"));
  execFileSync("sh", ["-c", `git archive ${tags[0]} web | tar -x -C "${alt}"`], { cwd: WURZEL });
  const IDS = ["trinkwasser", "radio", "lampen", "bargeld"];
  const zahl = async (t) => { await t.auswerten(`location.hash = "#uebersicht"`); await warteBis(t, `document.querySelector("#main .bereit-zahl-knopf")`, 20_000); return t.auswerten(`document.querySelector("#main .bereit-zahl-knopf").textContent.replace(/\\D+/g, "")`); };
  const vorher = await sitzung(async (t) => { for (const id of IDS) { await t.auswerten(`document.querySelector('[data-check="${id}"]').click()`); await ruhig(t); } return zahl(t); }, { alt });
  const nachher = await sitzung(async (t) => { for (const id of IDS) await tippen(t, "hab", id); return zahl(t); });
  assert.equal(nachher, vorher, `${tags[0]}: ${vorher}, jetzt: ${nachher}`);
});

test("Farben: Hab ich grün, Brauch ich blau, hell und dunkel mindestens 4,5:1; kein Rot", () => {
  const css = readFileSync(path.join(WURZEL, "web/styles.css"), "utf8");
  const wert = (block, name) => block.match(new RegExp(`--${name}: (#[0-9a-f]{6})`))?.[1];
  const hell = css.slice(0, css.indexOf("@media (prefers-color-scheme: dark)")), dunkel = css.slice(css.indexOf(":root[data-theme=\"dark\"]"));
  const lum = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const kontrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  assert.deepEqual([wert(hell, "hab-bg"), wert(hell, "hab-ink"), wert(hell, "brauch-bg"), wert(hell, "brauch-ink")], ["#e6f4ea", "#18692b", "#e8f0fb", "#1a56b0"], "Werte aus dem Auftrag");
  for (const [name, block] of [["hell", hell], ["dunkel", dunkel]]) for (const k of ["hab", "brauch"]) {
    const v = kontrast(wert(block, `${k}-bg`), wert(block, `${k}-ink`));
    assert.ok(v >= 4.5, `${name} ${k}: ${v.toFixed(2)}`);
  }
  for (const k of ["hab-ink", "brauch-ink"]) { const h = wert(dunkel, k); assert.ok(parseInt(h.slice(1, 3), 16) < parseInt(h.slice(3, 5), 16) || parseInt(h.slice(1, 3), 16) < parseInt(h.slice(5, 7), 16), `${k} nicht rot`); }
});
