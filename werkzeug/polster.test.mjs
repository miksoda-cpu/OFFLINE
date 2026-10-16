// Nr. 34 „Euer Polster“ (Bill, 16.10.2026, Wortlaut Mik): Heute zeigt statt „Vorrat: noch … Tage“ das Polster des Haushalts;
// Vorsorge › Polster rechnet Wasser-Tage = Liter ÷ (2 × Personen) und nimmt das Kleinere aus Wasser und Essen. Ab 14 Tagen
// gelten die Bereit-Punkte als erledigt, von Hand gesetzte Häkchen bleiben. Die Tage der Tagespakete stehen unter „Updates & Abo“.
// Dazu das Update von der zuletzt veröffentlichten Version (höchster Tag v*): alle Häkchen bleiben.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";

const WURZEL = path.resolve(import.meta.dirname, "..");
const LAND = `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}`;
const ANGST = /blackout|katastroph|überleb|ueberleb/i;

async function sitzung(fn, { alt = null, land = true } = {}) {
  const fassung = { alt: !!alt };
  const server = await dateiserver(undefined, {}, (p) => (fassung.alt ? path.join(alt, "web", p.endsWith("/") ? p + "index.html" : p) : null));
  const chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Network.enable", {}); await t.s("Network.setBypassServiceWorker", { bypass: true });
    if (land) await t.s("Page.addScriptToEvaluateOnNewDocument", { source: LAND });
    return await fn(t, server.url, fassung);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const ruhig = (t, ms = 400) => t.auswerten(`new Promise((r) => setTimeout(r, ${ms}))`);
const startBereit = (t) => warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("#main h1")`, 60_000);
const zeile = (t) => t.auswerten(`(() => { const z = document.querySelector("#main .heute-polster"); return z ? { text: z.innerText.replace(/\\s+/g, " ").trim(), knopf: z.querySelector("a.btn")?.textContent ?? null, link: (z.matches("a") ? z : z.querySelector("a"))?.getAttribute("href") } : null; })()`);
/** Polster in Vorsorge eintragen, wie ein Mensch: Zahlen ins Feld tippen (change), Licht über den Knopf. */
async function eintragen(t, { personen, liter, essen }) {
  await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.getElementById("polster")`, 20_000);
  for (const [f, w] of Object.entries({ personen, liter, essen })) {
    await t.auswerten(`(() => { const i = document.getElementById("polster-${f}"); i.value = "${w}"; i.dispatchEvent(new Event("change", { bubbles: true })); })()`);
    await ruhig(t, 150);
  }
}

test("(a) frisch: Heute zeigt „Euer Polster wächst mit jedem Vorrat.“ und „Ersten Vorrat eintragen“, keine Vorrat-Zeile", async () => {
  await sitzung(async (t, url) => {
    await t.laden(`${url}/app.html#start`); await startBereit(t); await ruhig(t, 800);
    const z = await zeile(t);
    assert.ok(z, "Polster-Zeile auf Heute");
    assert.ok(z.text.startsWith("Euer Polster wächst mit jedem Vorrat."), z.text);
    assert.equal(z.knopf, "Ersten Vorrat eintragen"); assert.equal(z.link, "#vorsorge");
    assert.doesNotMatch(z.text, ANGST);
    assert.equal(await t.auswerten(`/Vorrat: noch|Vorrat: leer|Neue Inhalte für/.test(document.getElementById("main").innerText)`), false, "die Tage der Tagespakete stehen nicht auf Heute");
    // Der Knopf führt zum Abschnitt Polster oben in Vorsorge
    await t.auswerten(`document.querySelector("#main .heute-polster a.btn").click()`); await warteBis(t, `location.hash === "#vorsorge" && document.getElementById("polster")`, 20_000);
    assert.ok(await t.auswerten(`(() => { const p = document.getElementById("polster"); return !!p && p === p.parentElement.querySelector(".card"); })()`), "Polster ist der erste Abschnitt in Vorsorge");
  });
});

test("(b) 2 Personen, 40 Liter, Essen 14 Tage → „Euer Polster: 10 Tage“ mit dem Wasser-Satz", async () => {
  await sitzung(async (t, url) => {
    await t.laden(`${url}/app.html#start`); await startBereit(t);
    await eintragen(t, { personen: 2, liter: 40, essen: 14 });
    const e = await t.auswerten(`document.querySelector("#polster .polster-ergebnis").innerText`);
    assert.match(e, /^Euer Polster: 10 Tage/); assert.ok(e.includes("Mehr Wasser bringt euer Polster am weitesten."), e);
    // Licht „Nein“: der freundliche Satz; die Tage bleiben
    await t.auswerten(`document.querySelector('[data-polster-licht="false"]').click()`); await ruhig(t);
    const e2 = await t.auswerten(`document.querySelector("#polster .polster-ergebnis").innerText`);
    assert.ok(e2.includes("Denk auch an Licht: Taschenlampe und Batterien.") && /^Euer Polster: 10 Tage/.test(e2), e2);
    // Gewählte Taste deutlich gefüllt (Bill, 16.10.): Hintergrund in der Akzentfarbe, die andere nicht; aria-pressed bleibt
    const knopf = await t.auswerten(`(() => { const f = (w) => { const b = document.querySelector('[data-polster-licht="' + w + '"]'); return { pressed: b.getAttribute("aria-pressed"), bg: getComputedStyle(b).backgroundColor }; }; return { nein: f("false"), ja: f("true"), akzent: getComputedStyle(document.querySelector('[data-polster-licht="false"]')).borderColor }; })()`);
    assert.equal(knopf.nein.pressed, "true"); assert.equal(knopf.ja.pressed, "false");
    assert.equal(knopf.nein.bg, knopf.akzent, "gewählt: gefüllt"); assert.notEqual(knopf.ja.bg, knopf.nein.bg, "nicht gewählt: nicht gefüllt");
    // Plus/Minus: +5 Liter → 11 Tage (45 ÷ 4)
    await t.auswerten(`document.querySelector('[data-polster-schritt="liter"][data-polster-um="5"]').click()`); await ruhig(t);
    assert.match(await t.auswerten(`document.querySelector("#polster .polster-tage").textContent`), /^Euer Polster: 11 Tage$/);
    // Heute: Zeile mit Tagen und dem kleinen Satz, führt zu Vorsorge › Polster
    await t.auswerten(`location.hash = "#start"`); await ruhig(t, 600);
    const z = await zeile(t);
    assert.equal(z.text, "Euer Polster: 11 Tage Wasser, Essen, Licht · Ziel 14 Tage"); assert.equal(z.link, "#vorsorge"); assert.doesNotMatch(z.text, ANGST);
    // Alles bleibt am Gerät
    assert.deepEqual(await t.auswerten(`JSON.parse(localStorage.getItem("offline:polster"))`), { personen: 2, liter: 45, essen: 14, licht: false });
    // Die Suche findet „Polster“
    await t.auswerten(`document.querySelector("[data-suche-auf]").click()`); await warteBis(t, `document.getElementById("suche-feld")`);
    await t.auswerten(`(() => { const f = document.getElementById("suche-feld"); f.value = "Polster"; f.dispatchEvent(new Event("input", { bubbles: true })); })()`); await ruhig(t);
    assert.ok(await t.auswerten(`document.querySelector(".suche-treffer, #suche-liste")?.innerText.includes("Euer Polster")`), "Suche findet das Polster");
  });
});

test("(c) 2 Personen, 56 Liter, Essen 14 Tage → Polster 14; Trinkwasser und Lebensmittel gelten in Bereit als erledigt", async () => {
  await sitzung(async (t, url) => {
    await t.laden(`${url}/app.html#start`); await startBereit(t);
    await eintragen(t, { personen: 2, liter: 56, essen: 14 });
    const e = await t.auswerten(`document.querySelector("#polster .polster-ergebnis").innerText`);
    assert.match(e, /^Euer Polster: 14 Tage/);
    const b = await t.auswerten(`({ wasser: document.querySelector('[data-check="trinkwasser"]').checked, essen: document.querySelector('[data-check="lebensmittel"]').checked, v2: JSON.parse(localStorage.getItem("offline:bereit-v2") ?? "{}") })`);
    assert.ok(b.wasser && b.essen, "Häkchen in der Grundvorsorge"); assert.ok(b.v2["c-0-0"] && b.v2["c-0-1"], "Bereit-Punkte Trinkwasser und Lebensmittel bestätigt");
    await t.auswerten(`location.hash = "#start"`); await ruhig(t, 600);
    assert.notEqual(await t.auswerten(`document.querySelector(".bereit-schritt")?.textContent`), "Trinkwasser für 14 Tage", "Trinkwasser ist nicht mehr der nächste Schritt");
    // Weniger Wasser: was das Polster gesetzt hat, nimmt es zurück; ein Häkchen von Hand bleibt
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.getElementById("polster")`);
    for (let i = 0; i < 2; i++) { await t.auswerten(`document.querySelector('[data-check="lebensmittel"]').click()`); await ruhig(t); } // von Hand: aus und wieder an (jeder Klick zeichnet neu)
    await eintragen(t, { personen: 2, liter: 20, essen: 3 });
    assert.deepEqual(await t.auswerten(`({ wasser: document.querySelector('[data-check="trinkwasser"]').checked, essen: document.querySelector('[data-check="lebensmittel"]').checked })`), { wasser: false, essen: true });
  });
});

test("(d) „Neue Inhalte für … Tage“ steht unter Updates & Abo, nicht auf Heute", async () => {
  await sitzung(async (t, url) => {
    await t.laden(`${url}/app.html#start`); await startBereit(t);
    await warteBis(t, `Object.keys(localStorage).some((k) => k.startsWith("offline:paket:tage-"))`, 60_000); await ruhig(t, 800);
    assert.equal(await t.auswerten(`/Neue Inhalte für|Vorrat: noch/.test(document.getElementById("main").innerText)`), false);
    await t.auswerten(`location.hash = "#updates"`); await warteBis(t, `document.querySelector("#main .upd-inhalte")`, 20_000);
    assert.match(await t.auswerten(`document.querySelector("#main .upd-inhalte").textContent`), /^Neue Inhalte für \d+ Tage?$/);
  });
});

test("Update von der zuletzt veröffentlichten Version: Häkchen und Notizen bleiben, Polster-Angaben überleben den Neustart", async () => {
  const tags = execFileSync("git", ["tag", "--list", "v*", "--sort=-v:refname"], { cwd: WURZEL, encoding: "utf8" }).split("\n").filter((x) => /^v\d+\.\d+\.\d+$/.test(x));
  assert.ok(tags.length, "Tag der veröffentlichten Version (CI: fetch-depth 0)");
  const alt = mkdtempSync(path.join(os.tmpdir(), "offline-alt-"));
  execFileSync("sh", ["-c", `git archive ${tags[0]} web | tar -x -C "${alt}"`], { cwd: WURZEL });
  await sitzung(async (t, url, fassung) => {
    await t.laden(`${url}/app.html#start`); await startBereit(t);
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelectorAll("[data-check]").length > 3`, 20_000);
    const ids = await t.auswerten(`(() => { const a = [...document.querySelectorAll("[data-check]")].map((c) => c.dataset.check); return ["trinkwasser", "radio", ...a.slice(-2)]; })()`);
    for (const id of ids) { await t.auswerten(`document.querySelector('[data-check="${id}"]').click()`); await ruhig(t, 250); } // jeder Klick zeichnet neu
    await t.auswerten(`(() => { const n = JSON.parse(localStorage.getItem("offline:notizbuch") ?? "[]"); n.push({ id: "u1", titel: "Treffpunkt", text: "Bei der Kirche um 18 Uhr.", geaendert: new Date().toISOString() }); localStorage.setItem("offline:notizbuch", JSON.stringify(n)); })()`);
    const vorher = await t.auswerten(`({ checks: localStorage.getItem("offline:checks"), v2: localStorage.getItem("offline:bereit-v2"), notizen: localStorage.getItem("offline:notizbuch") })`);
    assert.equal(Object.values(JSON.parse(vorher.checks)).filter(Boolean).length, 4);
    fassung.alt = false;
    await t.laden(`${url}/app.html?neu#start`); await warteBis(t, `document.querySelector("#main .heute-polster")`, 30_000); await ruhig(t, 600);
    assert.deepEqual(await t.auswerten(`({ checks: localStorage.getItem("offline:checks"), v2: localStorage.getItem("offline:bereit-v2"), notizen: localStorage.getItem("offline:notizbuch") })`), vorher, "Häkchen, Bestätigungen und Notizen unverändert");
    // Mit Polster unter dem Ziel: kein Häkchen geht verloren (Trinkwasser war von Hand gesetzt)
    await eintragen(t, { personen: 2, liter: 10, essen: 2 });
    const nach = JSON.parse(await t.auswerten(`localStorage.getItem("offline:checks")`));
    for (const [k, v] of Object.entries(JSON.parse(vorher.checks))) if (v) assert.equal(nach[k], true, k);
    // Neustart der neuen Fassung: Polster-Angaben, Notiz und Häkchen bleiben, Heute zeigt das Polster
    await t.laden(`${url}/app.html?nochmal#start`); await warteBis(t, `document.querySelector("#main .heute-polster")`, 30_000);
    assert.deepEqual(await t.auswerten(`JSON.parse(localStorage.getItem("offline:polster"))`), { personen: 2, liter: 10, essen: 2, licht: null });
    assert.equal((await zeile(t)).text, "Euer Polster: 2 Tage Wasser, Essen, Licht · Ziel 14 Tage");
    assert.equal(await t.auswerten(`localStorage.getItem("offline:notizbuch")`), vorher.notizen);
    await t.auswerten(`location.hash = "#notizen"`); await ruhig(t);
    assert.ok(await t.auswerten(`document.getElementById("main").innerText.includes("Treffpunkt")`), "Notiz da");
  }, { alt });
});
