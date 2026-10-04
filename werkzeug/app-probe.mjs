#!/usr/bin/env node
// OFFLINE – automatischer Durchlauf durch die echte Desktop-App über WebDriver (tauri-driver, unter Windows mit
// msedgedriver gegen WebView2). Läuft in der CI („Windows-Probe“, .github/workflows/windows-probe.yml).
//
//   node werkzeug/app-probe.mjs alt    --app <exe> [--name Betty] --aus <datei.json>
//        Eine installierte 0.1.8 mit Daten füllen (Checkliste, Bestätigungen, Wesen mit oder ohne Namen) und die
//        Bereit-Zahl ablesen.
//   node werkzeug/app-probe.mjs neu    --app <exe> --vorher <datei.json> --aus <datei.json>
//        Nach dem Update: Die Bereit-Zahl darf nicht fallen, die Daten sind noch da, ein benanntes Wesen ist an,
//        ein unbenanntes ist aus und die Einladung kommt erst nach einer Woche.
//   node werkzeug/app-probe.mjs module --app <exe> --boese <ordner> --quelle <ordner> --aus <datei.json>
//        Sandbox-Probe in der App (bösartiges Testmodul, Entwickler-Build) und Wichteln aus der lokalen Quelle:
//        laden, öffnen, spielen, inaktiv, löschen.
//
// Endet mit 0, wenn alles passt, sonst mit 1. Der Bericht (JSON) steht in --aus.

import { writeFile, readFile, readdir } from "node:fs/promises";
import { spawn } from "node:child_process";

const argv = process.argv.slice(2);
const SCHRITT = argv[0];
const opt = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i > 0 ? argv[i + 1] : d; };
const TREIBER = process.env.WEBDRIVER_URL || "http://127.0.0.1:4444";
const EL = "element-6066-11e4-a52e-4f735466cecf";

const bericht = { schritt: SCHRITT, pruefungen: [], werte: {} };
const pruefe = (name, ok, text = "") => {
  bericht.pruefungen.push({ name, ok: !!ok, text: String(text) });
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${text ? ` – ${text}` : ""}`);
};
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

async function wd(methode, pfad, body) {
  const r = await fetch(TREIBER + pfad, { method: methode, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${methode} ${pfad}: ${r.status} ${JSON.stringify(j.value ?? j).slice(0, 400)}`);
  return j.value;
}

let sid = null;
const js = (script, ...args) => wd("POST", `/session/${sid}/execute/sync`, { script, args });
const jsAsync = (script, ...args) => wd("POST", `/session/${sid}/execute/async`, { script, args });
const finde = async (css) => { try { return (await wd("POST", `/session/${sid}/element`, { using: "css selector", value: css }))[EL]; } catch { return null; } };
// Klick wie ein Mensch; liegt etwas darüber (z. B. die Sprechblase der Lumi), per Skript auf das Element selbst.
// Zeichnet die App zwischen Finden und Klicken neu (z. B. wenn ein Paket ankommt), wird das Element neu gesucht.
const klick = async (css) => {
  for (let versuch = 1; ; versuch++) {
    const e = await bis(() => finde(css), `${css} erscheint`);
    try { await wd("POST", `/session/${sid}/element/${e}/click`, {}); return e; }
    catch (f) {
      if (/stale element/.test(f.message) && versuch < 4) { await warte(500); continue; }
      if (!/intercepted/.test(f.message)) throw f;
      await js("arguments[0].click()", { [EL]: e, ELEMENT: e }); return e;
    }
  }
};
const tippe = async (css, text) => { const e = await bis(() => finde(css), `${css} erscheint`); await wd("POST", `/session/${sid}/element/${e}/value`, { text }); };
const rahmen = async (e) => wd("POST", `/session/${sid}/frame`, { id: e ? { [EL]: e, ELEMENT: e } : null });
const invoke = (cmd, args) => jsAsync("const f = arguments[arguments.length - 1]; window.__TAURI__.core.invoke(arguments[0], arguments[1]).then((v) => f({ ok: v }), (e) => f({ fehler: String(e) }));", cmd, args);

/** Wartet, bis `f` etwas Wahres liefert (höchstens `ms`). */
async function bis(f, was, ms = 60_000) {
  const ende = Date.now() + ms;
  let letzter;
  while (Date.now() < ende) {
    try { const v = await f(); if (v) return v; } catch (e) { letzter = e; }
    await warte(500);
  }
  throw new Error(`Zeit abgelaufen: ${was}${letzter ? ` (${letzter.message})` : ""}`);
}

// PROBE_DEBUGGER (z. B. 127.0.0.1:9222): Die App ist mit Debug-Anschluss gebaut; das Skript startet sie selbst und
// msedgedriver hängt sich an. Sonst startet tauri-driver die App („tauri:options“).
const DEBUGGER = process.env.PROBE_DEBUGGER;
let appProzess = null;
async function starten(app) {
  let caps = { "tauri:options": { application: app } };
  if (DEBUGGER) {
    appProzess = spawn(app, [], { stdio: "ignore", detached: false });
    await bis(() => fetch(`http://${DEBUGGER}/json/version`).then((r) => r.ok), "Debug-Anschluss der App", 60_000);
    caps = { browserName: "webview2", "ms:edgeOptions": { debuggerAddress: DEBUGGER } };
  }
  const s = await wd("POST", "/session", { capabilities: { alwaysMatch: caps } });
  sid = s.sessionId;
  // Beim Anhängen kann der Treiber zuerst ein anderes Ziel erwischen (Hilfsseite, Rahmen): auf das App-Fenster wechseln
  const geladen = () => js("return document.readyState === 'complete' && !!window.__TAURI__ && !!document.querySelector('#main, main')");
  try {
    await bis(async () => {
      for (const h of await wd("GET", `/session/${sid}/window/handles`)) {
        await wd("POST", `/session/${sid}/window`, { handle: h });
        if (await geladen().catch(() => false)) return true;
      }
      return false;
    }, "App geladen");
  } catch (e) {
    const ziele = DEBUGGER ? await fetch(`http://${DEBUGGER}/json/list`).then((r) => r.json()).catch(() => []) : [];
    const hier = await js("return [location.href, document.readyState, typeof window.__TAURI__, document.title, String(window.__fehler || '')].join(' | ')").catch((x) => x.message);
    throw new Error(`${e.message}. Seite: ${hier}. Ziele: ${JSON.stringify(ziele.map((z) => [z.type, z.url, z.title]))}`);
  }
  bericht.werte.agent = await js("return navigator.userAgent");
  bericht.werte.app = await invoke("app_info", {}).then((r) => r.ok ?? r.fehler).catch((e) => String(e));
  console.log(`App: ${JSON.stringify(bericht.werte.app)}\n${bericht.werte.agent}`);
}
const ls = (k) => js("return localStorage.getItem(arguments[0])", `offline:${k}`).then((v) => (v === null ? null : JSON.parse(v)));
const lsSetzen = (k, v) => js("localStorage.setItem(arguments[0], arguments[1])", `offline:${k}`, JSON.stringify(v));
const neuLaden = async () => { await js("setTimeout(() => location.reload(), 50)"); await warte(2000); await bis(() => js("return document.readyState === 'complete' && !!window.__TAURI__"), "neu geladen"); };
const gehe = (hash) => js("location.hash = arguments[0]", hash);
const bereitZahl = () => js("const z = document.querySelector('.bereit-zahl'); return z ? Number(z.textContent.trim()) : null");

const TAG = 86400000;
const vor = (monate) => new Date(Date.now() - monate * 30.44 * TAG).toISOString();

async function alt() {
  await starten(opt("app"));
  // Erster Start: 0.1.8 holt das Österreich-Paket selbst (Checkliste mit 20 Punkten)
  await gehe("#start");
  await bis(() => js("return [...document.querySelectorAll('.bereit-quelle')].some((q) => /von 20 erledigt/.test(q.textContent))"), "Österreich-Paket installiert", 180_000);
  const checks = {};
  for (let g = 0; g < 4; g++) for (let p = 0; p < 5; p++) if (g * 5 + p < 14) checks[`${g}-${p}`] = true;
  const bestaetigungen = { wasser: vor(1), radio: vor(2), probeabend: vor(3) };
  await lsSetzen("checks", checks);
  await lsSetzen("bestaetigungen", bestaetigungen);
  const name = opt("name");
  const wesen = (await ls("wesen")) ?? {};
  if (name) wesen.name = name; else delete wesen.name;
  await lsSetzen("wesen", wesen);
  await neuLaden(); await gehe("#start");
  // Nichts darf die eingetragenen Daten beim Neuladen überschrieben haben
  const nachher = { checks: await ls("checks"), bestaetigungen: await ls("bestaetigungen"), wesen: await ls("wesen") };
  pruefe("Daten eingetragen", JSON.stringify(nachher.checks) === JSON.stringify(checks) && JSON.stringify(nachher.bestaetigungen) === JSON.stringify(bestaetigungen) && (name ? nachher.wesen?.name === name : !nachher.wesen?.name || nachher.wesen.name === "Das Wesen"), JSON.stringify(nachher.wesen?.name ?? null));
  const wert = await bis(async () => { const z = await bereitZahl(); return z > 0 ? z : null; }, "Bereit-Zahl");
  const version = await js("return document.body.innerText.match(/0\\.1\\.\\d+/)?.[0] ?? null");
  bericht.werte = { ...bericht.werte, wert, checks, bestaetigungen, name: name ?? null, wesen: await ls("wesen") };
  pruefe("0.1.8 mit Daten", wert > 0, `Bereit ${wert}${name ? `, Wesen „${name}“` : ", Wesen ohne Namen"}`);
}

async function neu() {
  const vorher = JSON.parse(await readFile(opt("vorher"), "utf8")).werte;
  await starten(opt("app"));
  await gehe("#start");
  // Der Sockel wird festgelegt, sobald Paket und Tresor-Stand bekannt sind
  const ersteZahl = await bis(async () => { const z = await bereitZahl(); return z > 0 ? z : null; }, "Bereit-Zahl beim ersten Bild");
  await bis(() => ls("bereit-sockel"), "Sockel aus Version 1 festgelegt", 60_000).catch(() => null);
  await gehe("#vorsorge"); await warte(300); await gehe("#start");
  const wert = await bis(async () => { const z = await bereitZahl(); return z > 0 ? z : null; }, "Bereit-Zahl");
  const sockel = await ls("bereit-sockel");
  const checks = await ls("checks");
  const v2 = await ls("bereit-v2");
  bericht.werte = { ...bericht.werte, wert, ersteZahl, vorher: vorher.wert, sockel, bereitV2: v2 };
  pruefe("Bereit fällt nicht", wert >= vorher.wert, `vorher ${vorher.wert}, nachher ${wert}${sockel ? ` (Sockel ${sockel.wert})` : ""}`);
  pruefe("Auch das erste Bild fällt nicht", ersteZahl >= vorher.wert, `erstes Bild ${ersteZahl}`);
  const worker = await jsAsync("const f = arguments[arguments.length - 1]; (navigator.serviceWorker ? navigator.serviceWorker.getRegistrations() : Promise.resolve([])).then((r) => f(r.length), () => f(-1));");
  pruefe("Kein Service Worker mehr", worker === 0, `${worker} Registrierung(en)`);
  const vorrat = await js("return document.querySelector('.tag-vorrat')?.textContent ?? null");
  pruefe("Tagesseite ist der Startbildschirm", /^Vorrat/.test(vorrat ?? "") && !!(await finde("#wesen-karte")), vorrat ?? "keine Tagesseite");
  // „Was ist neu“: kommt mit der App (ohne Netz), Eintrag der eigenen Version oben
  const version = bericht.werte.app?.version;
  await gehe("#neues");
  const neues = await bis(() => js("return [...document.querySelectorAll('.neues-version h2')].map((h) => h.textContent)"), "Was ist neu", 15_000).catch(() => []);
  pruefe("Was ist neu", neues[0] === `Version ${version}`, neues.slice(0, 2).join(" · ") || "keine Einträge");
  await gehe("#start");
  pruefe("Checkliste erhalten", JSON.stringify(checks) === JSON.stringify(vorher.checks), `${Object.keys(checks ?? {}).length} Häkchen`);
  pruefe("Bestätigungen übernommen", v2 && v2["c-0-0"] === vorher.bestaetigungen.wasser && v2.radio === vorher.bestaetigungen.radio && v2.probeabend === vorher.bestaetigungen.probeabend, "Wasser, Radio, Probeabend mit altem Datum");
  const buehne = await js("const b = document.getElementById('lumi-buehne'); return b ? b.getAttribute('aria-label') : null");
  const einladung = await js("return !!document.querySelector('.lumi-einladung')");
  if (vorher.name) pruefe("Benanntes Wesen bleibt an", buehne?.startsWith(`${vorher.name}:`), buehne ?? "keine Figur");
  else {
    pruefe("Unbenanntes Wesen ist aus", !buehne, buehne ?? "keine Figur");
    pruefe("Keine Einladung am ersten Tag", !einladung);
    await lsSetzen("test-monate", 0.25); await neuLaden(); await gehe("#start");
    // Das Test-Datum gilt erst, wenn die App-Info geladen ist: Seite neu zeichnen, bis die Karte kommt
    pruefe("Einladung nach einer Woche", await bis(async () => { await gehe("#vorsorge"); await warte(200); await gehe("#start"); await warte(300); return js("return !!document.querySelector('.lumi-einladung')"); }, "Einladung", 20_000).catch(() => false));
    await lsSetzen("test-monate", 0);
  }
}

async function module() {
  await starten(opt("app"));
  // 1. Sandbox-Probe in der App: das bösartige Testmodul im echten Modulrahmen
  await lsSetzen("test-ordner", opt("boese"));
  await lsSetzen("modul-quelle", opt("quelle"));
  await neuLaden(); await gehe("#bibliothek");
  await klick("[data-modul-probe]");
  await bis(() => finde("#modul-platz iframe"), "Modulrahmen");
  const b = await bis(async () => (await invoke("modul_speicher_lesen", { id: "modul-test", schluessel: "bericht" })).ok, "Bericht des Testmoduls", 120_000);
  bericht.werte.sandbox = b;
  for (const e of b.ergebnisse) pruefe(`Sandbox: ${e.name}`, e.blockiert, e.text);
  pruefe("Sandbox: alle Angriffe blockiert", b.offen.length === 0, `${b.versuche} Versuche, ${b.offen.length} gelungen`);
  await klick("[data-modul-zu]");

  // 2. Wichteln aus der lokalen Quelle (signiert mit dem Redaktionsschlüssel), ohne Netz: Seit Wichteln im Katalog steht, zeigt
  // die Bibliothek nur die Katalogkarte, und „laden“ holt aus dem Netz (Zeitüberschreitung im Lauf 36911173315). Deshalb spielt die
  // Probe den Ordner ein wie „Ordner wählen …“ oder ein Datenträger (Knopf data-stick, gleicher Weg: Kern prüft Signatur,
  // Redaktionsschlüssel und jede Datei).
  const qOrdner = opt("quelle"), wName = (await readdir(qOrdner)).find((n) => n.startsWith("wichteln-"));
  if (!wName) throw new Error(`Wichteln fehlt in ${qOrdner}`);
  const wPfad = `${qOrdner.replace(/[\\/]$/, "")}${qOrdner.includes("\\") ? "\\" : "/"}${wName}`;
  // Derselbe Kernbefehl wie „Ordner wählen …“ (einspielen_ordner); eine Ablehnung steht so mit Grund im Bericht.
  const ein = await invoke("einspielen_ordner", { pfad: wPfad, downgrade: false });
  if (ein.fehler) throw new Error(`Wichteln einspielen abgelehnt: ${ein.fehler}`);
  await neuLaden(); await gehe("#bibliothek");
  await bis(() => finde('[data-modul-start="wichteln"]'), "Wichteln geladen", 60_000);
  pruefe("Wichteln: laden", true, `aus der lokalen Quelle ${wName}, Signatur und Redaktionsschlüssel geprüft, eingespielt`);
  await klick('[data-modul-start="wichteln"]');
  const f = await bis(() => finde("#modul-platz iframe"), "Wichteln-Rahmen");
  await rahmen(f);
  await klick("#neu");
  for (const n of ["Anna", "Bert", "Cleo", "Dora"]) { await tippe("#neuername", n); await klick("#dazu"); }
  await klick("#los");
  await warte(800);
  const fehler = await js("const f = document.getElementById('fehler'); return f && !f.hidden ? f.textContent : null");
  await rahmen(null);
  const runden = (await invoke("modul_speicher_lesen", { id: "wichteln", schluessel: "runden" })).ok;
  // Wichteln legt vier Beispielnamen an (Anna, Ben, Clara, David); dazu kommen Bert, Cleo, Dora (Anna gibt es schon)
  pruefe("Wichteln: spielen", !fehler && Array.isArray(runden) && runden.length === 1 && ["Bert", "Cleo", "Dora"].every((n) => runden[0].namen?.includes(n)) && Object.keys(runden[0].zuteilung ?? {}).length === runden[0].namen.length, fehler ?? `${runden?.length ?? 0} Runde, ${runden?.[0]?.namen?.length ?? 0} Namen, über window.offline gespeichert`);
  await klick("[data-modul-zu]");
  await gehe("#bibliothek");
  await klick('[data-modul-aktiv="wichteln"]');
  pruefe("Wichteln: inaktiv", await bis(() => js("const b = document.querySelector('[data-modul-start=\"wichteln\"]'); return b && b.disabled"), "Öffnen gesperrt", 15_000).catch(() => false), "Öffnen gesperrt");
  await klick('[data-modul-loeschen="wichteln"]');
  await tippe("#modul-loeschwort", "löschen");
  await klick('[data-modul-loeschen-jetzt="wichteln"]');
  pruefe("Wichteln: löschen", await bis(() => finde('[data-modul-laden="wichteln"]'), "wieder ladbar", 30_000).catch(() => false), "Karte zeigt wieder „laden“");
}

let code = 0;
try {
  if (SCHRITT === "alt") await alt();
  else if (SCHRITT === "neu") await neu();
  else if (SCHRITT === "module") await module();
  else throw new Error("Schritt: alt | neu | module");
} catch (e) {
  pruefe("Durchlauf", false, e.message);
}
if (sid) {
  try { bericht.werte.konsole = await js("return (window.__probeFehler || []).slice(0, 20)"); } catch { /* egal */ }
  await wd("DELETE", `/session/${sid}`).catch(() => {});
}
if (appProzess) { appProzess.kill(); await warte(2000); }
if (bericht.pruefungen.some((p) => !p.ok)) code = 1;
if (opt("aus")) await writeFile(opt("aus"), JSON.stringify(bericht, null, 2) + "\n");
console.log(code ? "\nNICHT BESTANDEN" : "\nBestanden");
process.exit(code);
