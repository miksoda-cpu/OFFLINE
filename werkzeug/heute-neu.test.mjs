// Nr. 29 (Entwurf C, Mik 14.10.2026): Heute zeigt oben den Online-Status; ohne Netz „Offline seit …“, vier Fragen mit Ja/Nein,
// den Satz zur Nachbarfrage (Nachtrag), einen Rat und Stufen nach Dauer. Leiste Heute · Notfall · Vorsorge · Spiele · Menü,
// das Tagesrätsel steht auf „Spiele“. Headless-Chrome gegen die Web-App; offline über das DevTools-Protokoll.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";

async function sitzung(fn) {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: `try { if (localStorage.getItem("offline:land") === null) localStorage.setItem("offline:land", JSON.stringify("at")); } catch {}` });
    await t.laden(`${server.url}/app.html#start`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && localStorage.getItem("offline:paket:tage-2026-10") && document.querySelector("#main h1")`, 60_000);
    return await fn(t, server.url);
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
}
const offline = (t, aus) => t.s("Network.emulateNetworkConditions", { offline: aus, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
const ruhig = (t, ms = 400) => t.auswerten(`new Promise((r) => setTimeout(r, ${ms}))`);
const sichtbar = `(el) => { if (!el) return false; const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; }`;

test("(a) Offline: „Offline seit …“, vier Fragen mit Ja/Nein, der Satz zur Nachbarfrage sichtbar, Rat und Stufen; Zeitpunkt überlebt den Neustart", async () => {
  await sitzung(async (t, url) => {
    assert.ok(await t.auswerten(`document.querySelector(".heute-status--on")?.innerText.includes("Online")`), "online: grünes Statusfeld");
    const zuletzt = await t.auswerten(`JSON.parse(localStorage.getItem("offline:zuletzt-online"))`);
    assert.ok(zuletzt, "Zeitpunkt der letzten Verbindung gemerkt");
    await offline(t, true); await ruhig(t);
    // Neustart ohne Netz: der Zeitpunkt, an dem die App das Offline bemerkt hat, bleibt; die Seite zählt von dort (Nachbesserung)
    assert.ok(await t.auswerten(`!!JSON.parse(localStorage.getItem("offline:offline-bemerkt"))`), "Offline bemerkt und gemerkt");
    await t.auswerten(`localStorage.setItem("offline:offline-bemerkt", JSON.stringify(new Date(Date.now() - 2 * 60e3 - 5e3).toISOString()))`);
    await ruhig(t, 1500); // Chrome gibt den Gerätespeicher verzögert an den neuen Seitenprozess weiter
    await t.laden(`${url}/app.html?neu#start`); await warteBis(t, `document.querySelector(".heute-status--off")`, 20_000);
    const o = await t.auswerten(`(() => { const s = ${sichtbar};
      return { status: document.querySelector(".heute-status--off").innerText, fragen: [...document.querySelectorAll(".netz-frage")].map((f) => f.querySelector("span").textContent + ":" + f.querySelectorAll("button").length),
        nachbar: s(document.querySelector(".netz-nachbar")) ? document.querySelector(".netz-nachbar").textContent : null, stufen: [...document.querySelectorAll(".netz-stufe")].map((a) => a.getAttribute("href")),
        jetzt: document.querySelector(".netz-stufe--jetzt")?.getAttribute("href"), bereit: !!document.getElementById("wesen-karte") }; })()`);
    assert.match(o.status, /^Offline seit 2 Minuten/); assert.match(o.status, /Zuletzt Internet um \d\d:\d\d/);
    assert.deepEqual(o.fragen, ["Ist der Flugmodus aus?:2", "Rechnung bezahlt, Datenvolumen da?:2", "Bist du im Lift, Keller, Tunnel?:2", "Haben Nachbarn auch kein Netz?:2"]);
    assert.equal(o.nachbar, "Wir fragen dich. Die App misst nichts und sucht keine Geräte in der Nähe.", "Nachtrag: Satz sichtbar");
    assert.deepEqual(o.stufen, ["#netz-ich", "#netz-andere", "#szenario-blackout", "#vorsorge", "#szenario-blackout"]); assert.equal(o.jetzt, "#netz-ich", "erste Minuten hervorgehoben");
    assert.equal(o.bereit, false, "offline wie Entwurf C: Fragen statt Bereit");
    // Antworten: Flugmodus aus, Rechnung ok, kein Funkloch, Nachbarn auch weg → großer Ausfall mit Radio-Satz
    for (const [f, w] of [["flugmodus", "ja"], ["rechnung", "ja"], ["funkloch", "nein"], ["nachbarn", "ja"]]) await t.auswerten(`document.querySelector('[data-netz-frage="${f}"][data-wert="${w}"]').click()`);
    const rat = await t.auswerten(`document.querySelector(".netz-rat")?.innerText ?? ""`);
    assert.ok(rat.includes("Dann liegt es nicht an dir.") && rat.includes("Ö3 oder dein ORF-Landesstudio") && rat.includes("Was jetzt zu tun ist"), rat);
    assert.deepEqual(await t.auswerten(`JSON.parse(localStorage.getItem("offline:netz-antworten"))`), { flugmodus: "ja", rechnung: "ja", funkloch: "nein", nachbarn: "ja" }, "Antworten nur am Gerät");
    // Stufen-Knöpfe führen auf vorhandene Seiten
    for (const z of ["#netz-ich", "#netz-andere"]) { await t.auswerten(`location.hash = "${z}"`); await ruhig(t, 200); assert.ok(await t.auswerten(`location.hash === "${z}" && !!document.querySelector(".netz-seite h1")`), z); }
    // wieder online: grün, Antworten vergessen
    await offline(t, false); await ruhig(t); await t.auswerten(`location.hash = "#start"`); await ruhig(t);
    assert.ok(await t.auswerten(`!!document.querySelector(".heute-status--on") && localStorage.getItem("offline:netz-antworten") === null`));
  });
});

test("(b) Leiste: Heute, Notfall, Vorsorge, Spiele, Menü", async () => {
  await sitzung(async (t) => {
    assert.deepEqual(await t.auswerten(`[...document.querySelectorAll("#tabbar a, #tabbar button")].map((e) => e.textContent.trim())`), ["Heute", "Notfall", "Vorsorge", "Spiele", "Menü"]);
    assert.equal(await t.auswerten(`document.querySelector('#tabbar a[data-route="pause"]').getAttribute("href")`), "#pause", "Spiele öffnet die bisherige Pause-Seite");
  });
});

test("(c) Kein Tagesrätsel auf Heute; es steht oben auf „Spiele“", async () => {
  await sitzung(async (t) => {
    assert.equal(await t.auswerten(`[...document.querySelectorAll("#main .tag-art")].filter((e) => e.textContent.includes("Tagesrätsel")).length + document.querySelectorAll("#main .tag-frage, #main [data-tag-pruefen]").length`), 0);
    await t.auswerten(`location.hash = "#pause"`); await warteBis(t, `document.querySelector("#main .spiele-raetsel")`, 20_000);
    const r = await t.auswerten(`(() => { const s = document.querySelector("#main .spiele-raetsel"), h = document.querySelector("#main .page-head"); return { art: s.querySelector(".tag-art")?.textContent ?? "", direktNachKopf: h?.nextElementSibling === s }; })()`);
    assert.ok(r.art.includes("Tagesrätsel") && r.direktNachKopf, JSON.stringify(r));
  });
});

test("Nachbesserung: gestern online, App zu, heute ohne Netz gestartet – zählt ab jetzt, „Zuletzt Internet gestern um …“", async () => {
  await sitzung(async (t, url) => {
    await offline(t, true);
    await t.auswerten(`(() => { localStorage.setItem("offline:zuletzt-online", JSON.stringify(new Date(Date.now() - 86400e3).toISOString())); localStorage.removeItem("offline:offline-bemerkt"); })()`);
    await ruhig(t, 1500);
    await t.laden(`${url}/app.html?morgen#start`); await warteBis(t, `document.querySelector(".heute-status--off")`, 20_000);
    const o = await t.auswerten(`({ status: document.querySelector(".heute-status--off").innerText, jetzt: document.querySelector(".netz-stufe--jetzt")?.innerText ?? "" })`);
    assert.match(o.status, /^Offline seit weniger als einer Minute/); assert.match(o.status, /Zuletzt Internet gestern um \d\d:\d\d/);
    assert.ok(o.jetzt.startsWith("Erste Minuten"), o.jetzt);
    await offline(t, false); await ruhig(t);
    assert.equal(await t.auswerten(`localStorage.getItem("offline:offline-bemerkt")`), null, "wieder online: gelöscht");
  });
});
