// OFFLINE – die MVP-Seiten der Web-App für Bildvergleich und Barrierefreiheit (Auftrag Nr. 21, Umfang nach der
// MVP-Festlegung vom 11.10.2026): ohne Lumi, mit festem Datum und festem Zufall, damit jede Aufnahme gleich ausfällt.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { WURZEL, warteBis } from "./browser.mjs";

export const BREITEN = [360, 1280];
export const FARBEN = ["hell", "dunkel"];
/** Fester Zeitpunkt der Aufnahmen: Mittwoch, 14.10.2026, 10:00 in Wien (im Vorrat der Tagespakete). */
export const ZEITPUNKT = Date.UTC(2026, 9, 14, 8, 0, 0);

async function szenarien() {
  const ordner = (await readdir(path.join(WURZEL, "web", "pakete"))).filter((n) => n.startsWith("at-basis-")).sort().at(-1);
  return JSON.parse(await readFile(path.join(WURZEL, "web", "pakete", ordner, "inhalt", "szenarien.json"), "utf8")).reihenfolge;
}

/**
 * Die Seiten: Name (für Dateinamen), Adresse (Hash der App), optional ein Schritt danach (z. B. Hilfe öffnen).
 * Radio steht auf „Notfall“, Grundvorsorge und Haushalt auf „Vorsorge“, die Einstellungen unter „Updates & Abo“.
 */
export async function seitenListe() {
  return [
    { name: "heute", hash: "start" },
    { name: "bereit", hash: "uebersicht" },
    { name: "notfall", hash: "notfall" },
    { name: "vorsorge", hash: "vorsorge" },
    ...(await szenarien()).map((id) => ({ name: `szenario-${id}`, hash: `szenario-${id}` })),
    { name: "karte", hash: "karte" },
    { name: "bibliothek", hash: "bibliothek" },
    { name: "pause", hash: "pause" },
    { name: "tresor", hash: "tresor" },
    { name: "einstellungen", hash: "updates" },
    { name: "hilfe", hash: "vorsorge", danach: `document.querySelector('[data-hilfe="vorsorge"]').click()`, fertig: `document.querySelector('.blatt')`, nurSichtbar: true },
  ];
}

/** Läuft in jeder Seite vor dem ersten Skript: festes Datum, fester Zufall, Lumi aus, keine Bewegung. */
export const VORBEREITUNG = `(() => {
  const T = ${ZEITPUNKT}, E = Date;
  class D extends E { constructor(...a) { a.length ? super(...a) : super(T); } static now() { return T; } }
  globalThis.Date = D;
  let s = 20261014; Math.random = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  try { if (localStorage.getItem("offline:wesen") === null) localStorage.setItem("offline:wesen", JSON.stringify({ version: 3, darstellung: "aus" })); } catch {}
  try { speechSynthesis.speak = () => {}; } catch {}
  const stil = () => { const st = document.createElement("style"); st.textContent = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important}"; (document.head || document.documentElement).append(st); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", stil); else stil();
})();`;

/** Richtet einen Tab für eine Breite und Farbe ein und lädt die App, bis das Österreich-Paket da ist. */
export async function appLaden(t, basis, breite, farbe) {
  await t.s("Emulation.setDeviceMetricsOverride", { width: breite, height: breite < 600 ? 800 : 900, deviceScaleFactor: 1, mobile: breite < 600 });
  await t.s("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-color-scheme", value: farbe === "dunkel" ? "dark" : "light" }, { name: "prefers-reduced-motion", value: "reduce" }] });
  await t.s("Emulation.setTimezoneOverride", { timezoneId: "Europe/Vienna" });
  await t.s("Emulation.setLocaleOverride", { locale: "de-AT" });
  await t.s("Page.addScriptToEvaluateOnNewDocument", { source: VORBEREITUNG });
  await t.laden(`${basis}/app.html#start`);
  await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && document.querySelector("#main h1")`, 60_000);
}

/** Zeigt eine Seite und wartet, bis sie ruhig ist (Schriften, Bilder, zwei Bildaufbauten). */
export async function seiteZeigen(t, seite) {
  await t.auswerten(`(async () => { document.querySelector(".blatt-hinter, .blatt")?.remove(); location.hash = "#__"; await new Promise((r) => setTimeout(r, 30)); location.hash = ${JSON.stringify("#" + seite.hash)}; })()`);
  await warteBis(t, `document.title !== "" && document.querySelector("#main").children.length`);
  if (seite.danach) { await new Promise((r) => setTimeout(r, 200)); await t.auswerten(seite.danach); }
  if (seite.fertig) await warteBis(t, seite.fertig);
  await t.auswerten(`(async () => {
    await document.fonts.ready;
    const ende = performance.now() + 5000;
    while ([...document.images].some((i) => !i.complete) && performance.now() < ende) await new Promise((r) => setTimeout(r, 50));
    window.scrollTo(0, 0); document.getElementById("main").scrollTop = 0;
    for (let i = 0; i < 2; i++) await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 300));
  })()`);
}
