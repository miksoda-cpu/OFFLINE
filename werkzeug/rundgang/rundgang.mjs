#!/usr/bin/env node
// OFFLINE – Rundgang vor jedem Release (Regel von Bill, 07.10.2026; seit Nr. 24 im Repo statt im Sitzungsordner).
// Geht alle Seiten der Web-App durch, zweimal: als frisches Gerät und als langjähriger Benutzer, je hell und dunkel, in
// 360 px und breit. Speichert die Bilder und prüft je Seite: kein Fehler im Browser, nichts läuft seitlich über,
// kein abgeschnittener Text, keine fremde Adresse. Echte Uhrzeit (mit fester Uhr erscheinen Sprechblase und Tipps nicht).
//
//   node werkzeug/rundgang/rundgang.mjs --aus "<Ordner>"            alles (Standard: rundgang-aus/)
//   Schalter: --breiten 360,1280  --farben hell,dunkel  --profile frisch,langzeit  --nur seite[,seite]
//   Chrome-Pfad in CHROME (Standard wie beim Bildvergleich). Keine Abhängigkeit außer Node 22 und Chrome.
//
// Der langjährige Benutzer beginnt mit der Österreich-Basis 2026.09.29.1 aus dem eingefrorenen Katalog der Windows-Probe
// (werkzeug/probe-katalog/) und Daten wie nach Monaten: Häkchen, Bereit-Bestätigungen, Lumi mit Namen und Figur, Heft,
// Vorhaben, Pause an, Spiel-Log, Haushalt. Danach bekommt er den heutigen Katalog und muss die neue Österreich-Basis ohne
// Knopfdruck erhalten (Nr. 24, A1); das ist eine eigene Prüfung mit Bild.
// Ergebnis: <aus>/<profil>/<seite>-<breite>-<farbe>.png und <aus>/bericht.json, Zusammenfassung auf der Konsole.
// Endet mit 0, wenn keine Prüfung scheitert, sonst mit 1.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { WURZEL, dateiserver, chromeStarten, warteBis } from "../browser.mjs";
import { seitenListe } from "../seiten.mjs";

const argv = process.argv.slice(2);
const opt = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const AUS = path.resolve(opt("aus", path.join(WURZEL, "rundgang-aus")));
const BREITEN = opt("breiten", "360,1280").split(",").map(Number);
const FARBEN = opt("farben", "hell,dunkel").split(",");
const PROFILE = opt("profile", "frisch,langzeit").split(",");
const NUR = opt("nur")?.split(",");
const EINGEFROREN = path.join(WURZEL, "werkzeug", "probe-katalog");
const ALT_BASIS = "2026.09.29.1";

/** Läuft vor jedem Skript der Seite: Fehler mitschreiben, keine Bewegung, keine Stimme. Die Uhr bleibt echt. */
const VORBEREITUNG = `(() => {
  window.__fehler = [];
  addEventListener("error", (e) => window.__fehler.push(String(e.message ?? e)));
  addEventListener("unhandledrejection", (e) => window.__fehler.push("Promise: " + String(e.reason?.message ?? e.reason)));
  const ce = console.error.bind(console); console.error = (...a) => { window.__fehler.push(a.map(String).join(" ")); ce(...a); };
  try { speechSynthesis.speak = () => {}; } catch {}
  const stil = () => { const st = document.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}"; (document.head || document.documentElement).append(st); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", stil); else stil();
})();`;

/** Alle Seiten: die MVP-Seiten des Bildvergleichs und dazu, was dort fehlt (Lumi, Heft, Buch, Werkzeuge …). */
async function seiten() {
  const mvp = (await seitenListe()).filter((s) => s.name !== "hilfe");
  const dazu = [
    { name: "lumi", hash: "lumi" }, { name: "heft", hash: "heft" }, { name: "buch", hash: "buch" }, { name: "gedanken", hash: "gedanken" },
    { name: "linie", hash: "linie" }, { name: "neues", hash: "neues" }, { name: "werkzeuge", hash: "werkzeuge" }, { name: "notizen", hash: "notizen" },
    { name: "hilfe", hash: "vorsorge", danach: `document.querySelector('[data-hilfe]')?.click()`, fertig: `document.querySelector('.blatt')`, nurSichtbar: true },
    { name: "seitenleiste", hash: "start", danach: `(() => { const m = document.getElementById("menu"); if (m && !m.hidden) m.click(); })()`, nurSichtbar: true },
    { name: "bald-vorschau", hash: "bibliothek", danach: `document.querySelector('[data-vorschau-oeffnen^="bald:"]')?.click()`, fertig: `document.querySelector('#vorschau-fenster:not([hidden]) img')`, nurSichtbar: true },
  ];
  return [...mvp, ...dazu].filter((s) => !NUR || NUR.includes(s.name));
}

async function zeigen(t, seite) {
  await t.auswerten(`(async () => { document.getElementById("vorschau-fenster")?.setAttribute("hidden", ""); document.body.classList.remove("vorschau-offen", "nav-offen"); document.querySelector(".blatt-hinter, .blatt")?.remove(); location.hash = "#__"; await new Promise((r) => setTimeout(r, 30)); location.hash = ${JSON.stringify("#" + seite.hash)}; })()`);
  await warteBis(t, `document.querySelector("#main") && document.querySelector("#main").children.length`);
  if (seite.danach) { await new Promise((r) => setTimeout(r, 300)); await t.auswerten(seite.danach); }
  if (seite.fertig) await warteBis(t, seite.fertig, 10_000).catch(() => null);
  await t.auswerten(`(async () => {
    await document.fonts.ready;
    const ende = performance.now() + 5000;
    while ([...document.images].some((i) => !i.complete) && performance.now() < ende) await new Promise((r) => setTimeout(r, 50));
    ${seite.nurSichtbar ? "" : `window.scrollTo(0, 0); document.getElementById("main").scrollTop = 0;`}
    for (let i = 0; i < 2; i++) await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 400));
  })()`);
}

/** Die Prüfungen je Seite, im Browser ausgewertet. */
const PRUEFEN = `(() => {
  const b = document.documentElement.clientWidth, aus = { fehler: window.__fehler.splice(0), ueber: [], abgeschnitten: [], titel: document.querySelector("main h1, #main h1")?.textContent ?? "" };
  if (document.documentElement.scrollWidth > b + 1) aus.ueber.push("Seite " + document.documentElement.scrollWidth + " > " + b);
  for (const el of document.querySelectorAll("#main *, #sidebar *, .vorschau-dialog *, .blatt *")) {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const st = getComputedStyle(el); if (st.visibility === "hidden" || el.closest("[hidden], .leaflet-container, pre, .vorschau-bild--gross, .sr-only, .visually-hidden")) continue;
    // In einem Behälter, der selbst rollt oder abschneidet (Reiter, Tabellen), ist rechts außen gewollt
    let rollt = false; for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o !== "visible") { rollt = true; break; } }
    if (r.left >= b || el.closest("[inert], [aria-hidden=true]") || (el.closest("details:not([open])") && !el.closest("summary"))) continue; // ganz außerhalb: eingeklapptes Fenster, nicht sichtbar
    if (r.right > b + 1 && st.position !== "fixed" && !rollt) aus.ueber.push((el.className || el.tagName) + " rechts " + Math.round(r.right));
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (text && (st.textOverflow === "ellipsis" || st.overflow === "hidden" || st.overflowX === "hidden") && el.scrollWidth > el.clientWidth + 1) aus.abgeschnitten.push((el.className || el.tagName) + ": " + el.textContent.trim().slice(0, 60));
  }
  aus.ueber = [...new Set(aus.ueber)].slice(0, 8); aus.abgeschnitten = [...new Set(aus.abgeschnitten)].slice(0, 8);
  return aus;
})()`;

async function aufnehmen(t, breite, seite) {
  let hoehe = breite < 600 ? 800 : 900;
  if (!seite.nurSichtbar) {
    for (let i = 0; i < 3; i++) {
      const h = Math.min(8000, await t.auswerten(`Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, (() => { const m = document.getElementById("main"); return m.getBoundingClientRect().top + m.scrollHeight; })())`));
      if (h === hoehe) break;
      hoehe = Math.ceil(h);
      await t.s("Emulation.setDeviceMetricsOverride", { width: breite, height: hoehe, deviceScaleFactor: 1, mobile: breite < 600 });
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  const bild = await t.s("Page.captureScreenshot", { format: "png", fromSurface: true });
  await t.s("Emulation.setDeviceMetricsOverride", { width: breite, height: breite < 600 ? 800 : 900, deviceScaleFactor: 1, mobile: breite < 600 });
  return Buffer.from(bild.data, "base64");
}

const ls = (t, key) => t.auswerten(`JSON.parse(localStorage.getItem("offline:${key}") ?? "null")`);
const lsSetzen = (t, werte) => t.auswerten(`(() => { for (const [k, v] of Object.entries(${JSON.stringify(werte)})) localStorage.setItem("offline:" + k, JSON.stringify(v)); })()`);

/** Daten wie nach Monaten Nutzung. Formate wie in der App (web/app.js, web/bereit.js, web/pause.js). */
async function langzeitDaten(t) {
  const tipp = JSON.parse(await readFile(path.join(EINGEFROREN, "pakete", "wir-2026.10.04.4", "inhalt", "tipps.json"), "utf8")).tipps[0];
  const tag = (n) => new Date(Date.now() - n * 86_400_000).toISOString();
  const checks = { "0-0": true, "0-1": true, "0-2": true, "1-0": true, "1-1": true, "2-0": true, "2-3": true };
  await lsSetzen(t, {
    checks, "bereit-v2": { "c-0-0": tag(20), radio: tag(40), probeabend: tag(60) },
    wesen: { version: 3, name: "Fini", darstellung: "wesen" },
    notizbuch: [{ id: "n1", titel: "Treffpunkt der Familie", text: "Bei Stromausfall: Oma, Gemeindeamt, 18 Uhr.", geaendert: tag(30) }],
    vorhaben: [{ id: "v-1", tipp: tipp.id, text: tipp.text, datum: tag(12), erledigt: null }],
    "spiel-log": [{ zeit: tag(3), quelle: "raetsel", id: "tagesraetsel", art: ["beweglichkeit"], ergebnis: { raetsel: "r", geloest: true, aufgedeckt: false }, dauer: 0 }],
    haushalt: ["kinder", "miete"], bundesland: "tirol",
  });
  // Pause an: über die App selbst (Lebensabschnitt wählen), damit das Format stimmt
  await t.auswerten(`location.hash = "#pause"`);
  await warteBis(t, `document.querySelector('[data-pause="alter"]') || document.querySelector(".pause-liste")`, 15_000).catch(() => null);
  await t.auswerten(`document.querySelector('[data-pause="alter"][data-alter="M1"]')?.click() ?? document.querySelector('[data-pause="alter"]')?.click()`);
}

async function lauf(chrome, profil, breite, farbe, liste, bericht) {
  let alt = profil === "langzeit";
  const server = await dateiserver(path.join(WURZEL, "web"), {}, (p) => {
    if (!alt) return null;
    if (p === "/katalog/katalog.json" || p === "/katalog/katalog.sig") return path.join(EINGEFROREN, path.basename(p));
    if (p.startsWith(`/pakete/at-basis-${ALT_BASIS}/`)) return path.join(EINGEFROREN, p);
    return null;
  });
  const t = await chrome.tab();
  const ordner = path.join(AUS, profil); await mkdir(ordner, { recursive: true });
  const pruefe = (name, ok, text) => { bericht.pruefungen.push({ profil, breite, farbe, name, ok, text }); if (!ok) console.log(`  ✗ ${profil} ${breite} ${farbe} ${name}: ${text}`); };
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: breite, height: breite < 600 ? 800 : 900, deviceScaleFactor: 1, mobile: breite < 600 });
    await t.s("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-color-scheme", value: farbe === "dunkel" ? "dark" : "light" }, { name: "prefers-reduced-motion", value: "reduce" }] });
    await t.s("Emulation.setTimezoneOverride", { timezoneId: "Europe/Vienna" });
    await t.s("Emulation.setLocaleOverride", { locale: "de-AT" });
    await t.s("Page.addScriptToEvaluateOnNewDocument", { source: VORBEREITUNG });
    await t.laden(`${server.url}/app.html#start`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("#main h1")`, 60_000);
    if (alt) {
      const vorher = (await ls(t, "paket:at-basis"))?.manifest?.version;
      pruefe("Ausgangslage: alte Österreich-Basis", vorher === ALT_BASIS, String(vorher));
      await langzeitDaten(t);
      // Neuer Katalog, neuer Start: die neue Ausgabe muss ohne Knopfdruck kommen
      alt = false;
      await t.laden(`${server.url}/app.html?neustart#vorsorge`); // eigene Adresse, sonst lädt die Seite nicht neu
      const neu = await warteBis(t, `JSON.parse(localStorage.getItem("offline:paket:at-basis") ?? "null")?.manifest?.version !== ${JSON.stringify(ALT_BASIS)}`, 60_000).then(() => ls(t, "paket:at-basis"), () => null);
      pruefe("Österreich-Basis still aktualisiert", !!neu && neu.manifest.version !== ALT_BASIS, `${ALT_BASIS} → ${neu?.manifest?.version ?? "keine neue Ausgabe"}`);
      await warteBis(t, `document.querySelector("#main .gv-bereich, #main [data-gv], #main h1")`, 15_000).catch(() => null);
      await zeigen(t, { name: "vorsorge-nach-update", hash: "vorsorge" });
      await writeFile(path.join(ordner, `vorsorge-nach-update-${breite}-${farbe}.png`), await aufnehmen(t, breite, { nurSichtbar: true }));
      const wesen = await ls(t, "wesen"), checks = await ls(t, "checks");
      pruefe("Daten nach dem Update", wesen?.name === "Fini" && Object.keys(checks ?? {}).length >= 7, `Lumi ${wesen?.name}, ${Object.keys(checks ?? {}).length} Häkchen`);
    }
    for (const seite of liste) {
      try {
        await zeigen(t, seite);
        const p = await t.auswerten(PRUEFEN);
        await writeFile(path.join(ordner, `${seite.name}-${breite}-${farbe}.png`), await aufnehmen(t, breite, seite));
        pruefe(`${seite.name}: keine Fehler`, !p.fehler.length, p.fehler.join(" | "));
        pruefe(`${seite.name}: nichts läuft seitlich über`, !p.ueber.length, p.ueber.join(" | "));
        pruefe(`${seite.name}: kein abgeschnittener Text`, !p.abgeschnitten.length, p.abgeschnitten.join(" | "));
      } catch (e) { pruefe(`${seite.name}: Seite geht auf`, false, String(e.message ?? e)); }
    }
    pruefe("keine fremde Adresse", !t.fremd.length, [...new Set(t.fremd.map((u) => new URL(u).host))].join(", "));
  } finally { await t.schliessen(); server.schliessen(); }
}

async function main() {
  await mkdir(AUS, { recursive: true });
  const liste = await seiten(), chrome = await chromeStarten();
  const bericht = { chrome: chrome.version, zeit: new Date().toISOString(), seiten: liste.map((s) => s.name), pruefungen: [] };
  console.log(`${chrome.version} · ${liste.length} Seiten × ${PROFILE.join("/")} × ${BREITEN.join("/")} px × ${FARBEN.join("/")} → ${AUS}`);
  try {
    for (const profil of PROFILE) for (const breite of BREITEN) for (const farbe of FARBEN) {
      await lauf(chrome, profil, breite, farbe, liste, bericht);
      console.log(`  • ${profil} ${breite} px ${farbe} fertig`);
    }
  } finally { await chrome.beenden(); }
  await writeFile(path.join(AUS, "bericht.json"), JSON.stringify(bericht, null, 2));
  const falsch = bericht.pruefungen.filter((p) => !p.ok);
  console.log(`\n${bericht.pruefungen.length} Prüfungen, ${falsch.length} gescheitert.`);
  return falsch.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main().then((c) => process.exit(c), (e) => { console.error(e); process.exit(2); });
