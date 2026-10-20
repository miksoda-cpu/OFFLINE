// Nr. 48 (Mik 20.10.2026): Rot nur für Warnung und Alarm. „Aktiv/gewählt/Fokus“ ist Blau (--aktiv, das Blau aus Nr. 47); Rot
// (--accent) bleibt bei Notruf, Sirenen, Fehlern, Warnkasten, Gefahr, Erster Hilfe, Giftpflanze, Offline-Status, Netzausfall-Rat
// und dem Glas-Hinweis (Liste rueckmeldungen/nr-47-rot-liste.md, Gruppe A und B).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { dateiserver, chromeStarten, warteBis, WURZEL } from "./browser.mjs";

const GRUPPE_A = [".btn-primary", ".tag-pro", ".feature-num", ".plan.featured", ".nav a[aria-current", ".check input", ".timeline li::before", ".filters button[aria-pressed",
  ".seg button[aria-pressed", ".switch input", ".bubble.user", ".consent input", ".tresor-liste button[aria-current", ".code-anzeige", ".tabbar a[aria-current", ".schieber:focus-visible",
  ".tag-zu:focus-visible", ".neues-punkt", ".z-haupt", ".pause-zeile-wahl:hover", ".upd-reiter", ".neu-punkt", ".lumi-reiter-knopf", ".sz-merk", ".land-opt:focus-within",
  ".netz-stufe--jetzt", ".suche-knopf:focus-visible", ".polster-licht", "button.bereit-kreis:focus-visible", "#wesen-pixel:focus-visible", ".lumi-buehne:focus-visible", ".lumi-balken-spur"];
const GRUPPE_B = [".notruf-nr", ".siren path", ".form-msg.err", ".warnkasten", ".upd-gefahr", ".natur-erste-hilfe", ".natur-bild--gift", ".heute-status--off", ".netz-rat--gross", ".vr-hinweis"];
const regeln = () => ["web/styles.css", "web/wesen.css"].flatMap((f) => readFileSync(path.join(WURZEL, f), "utf8").split("\n").filter((z) => z.includes("{") && !z.trimStart().startsWith("--")));

test("Stylesheet: Gruppe A ohne Rot, Gruppe B weiter Rot; --aktiv hell und dunkel festgelegt", () => {
  const r = regeln();
  const rotA = r.filter((z) => GRUPPE_A.some((a) => z.split("{")[0].includes(a)) && z.includes("var(--accent"));
  assert.deepEqual(rotA, [], "aktiv/gewählt/Fokus nicht rot");
  for (const b of GRUPPE_B) assert.ok(r.some((z) => z.split("{")[0].includes(b) && z.includes("var(--accent")), `${b} bleibt rot`);
  const css = readFileSync(path.join(WURZEL, "web/styles.css"), "utf8");
  assert.match(css, /--aktiv: #1a56b0;/); assert.equal((css.match(/--aktiv: #9dc3ff;/g) ?? []).length, 2, "dunkel: beide Blöcke");
});

async function sitzung(farbe, fn) {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-color-scheme", value: farbe === "dunkel" ? "dark" : "light" }] });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}` });
    await t.laden(`${server.url}/app.html#notfall`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector(".notruf-nr")`, 60_000);
    return await fn(t);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
/** Rot heißt hier: rot deutlich über grün und blau (die Akzentfarbe #c8102e / #ff4d63). */
const rot = (rgb) => { const [r, g, b] = rgb.match(/\d+/g).map(Number); return r > 150 && r > g + 60 && r > b + 60; };
const blau = (rgb) => { const [r, g, b] = rgb.match(/\d+/g).map(Number); return b > r + 40 && b > g; };

for (const farbe of ["hell", "dunkel"]) test(`Gerendert (${farbe}): aktiver Menüpunkt und Hauptknopf blau, Notrufnummer rot`, async () => {
  await sitzung(farbe, async (t) => {
    const f = await t.auswerten(`(() => { const c = (el, p) => el ? getComputedStyle(el)[p] : null;
      const tab = document.querySelector('.tabbar a[aria-current="page"], .nav a[aria-current="page"]');
      return { notruf: c(document.querySelector(".notruf-nr"), "color"), tab: c(tab, "color") }; })()`);
    assert.ok(rot(f.notruf), `Notruf ${f.notruf}`);
    assert.ok(f.tab && blau(f.tab) && !rot(f.tab), `aktiver Menüpunkt ${f.tab}`);
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelector("#polster [data-vorrat-neu]")`, 20_000);
    await t.auswerten(`document.querySelector("#polster [data-vorrat-neu]").click()`); await warteBis(t, `document.querySelector("[data-vorrat-speichern]")`);
    const k = await t.auswerten(`(() => { const s = getComputedStyle(document.querySelector("[data-vorrat-speichern]")); return { color: s.color, bg: s.backgroundColor }; })()`);
    assert.ok(!rot(k.color) && !rot(k.bg), `Hauptknopf ${JSON.stringify(k)}`);
    assert.ok(blau(k.color) || blau(k.bg), `Hauptknopf blau ${JSON.stringify(k)}`);
  });
});
