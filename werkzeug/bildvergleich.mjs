#!/usr/bin/env node
// OFFLINE – Bildvergleich der Web-App gegen Referenzbilder (Auftrag Nr. 21). Findet feine Layout-Änderungen, die ein
// Bildmodell übersieht: Jede MVP-Seite (werkzeug/seiten.mjs) wird in 360 px und 1280 px, hell und dunkel, über die volle
// Seitenhöhe aufgenommen und Pixel für Pixel mit werkzeug/referenz/<seite>-<breite>-<farbe>.png verglichen.
//
//   node werkzeug/bildvergleich.mjs --chrome                    vergleichen (CI); Chrome-Pfad in CHROME
//   node werkzeug/bildvergleich.mjs --chrome --referenz-setzen  Referenz neu setzen (nie im CI, nur von Hand)
//   Weitere Schalter: --nur <seite[,seite]>  --aus <ordner> (Standard bildvergleich-aus/)  --anker <ordner> (JPG, 480 px)
//
// Toleranz: werkzeug/referenz/toleranz.json, Standard sehr eng. Ein Pixel weicht ab, wenn ein Farbkanal um mehr als
// `schwelle` abweicht; eine Seite fällt durch, wenn mehr als `anteil` ihrer Pixel abweichen oder die Größe nicht stimmt.
// Bei Abweichung landen Aufnahme und Differenzbild (Referenz blass, Abweichung rot) im Ausgabeordner, in der CI als Artefakt.
// Endet mit 0, wenn alle Seiten passen, sonst mit 1.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { WURZEL, dateiserver, chromeStarten } from "./browser.mjs";
import { BREITEN, FARBEN, seitenListe, appLaden, seiteZeigen } from "./seiten.mjs";
import { pngLesen, pngSchreiben, vergleichen } from "./png.mjs";

const argv = process.argv.slice(2);
const opt = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const REFERENZ = path.join(WURZEL, "werkzeug", "referenz");
const SETZEN = argv.includes("--referenz-setzen");
const AUS = path.resolve(opt("aus", path.join(WURZEL, "bildvergleich-aus")));
const ANKER = opt("anker") ? path.resolve(opt("anker")) : null;
const NUR = opt("nur")?.split(",");
const HOECHSTENS = 8000; // Seitenhöhe in px, darüber wird abgeschnitten


export async function aufnehmen(t, breite, seite, format = "png") {
  await seiteZeigen(t, seite);
  let hoehe = breite < 600 ? 800 : 900;
  if (!seite.nurSichtbar) {
    // Volle Seitenhöhe: Fenster so hoch wie der Inhalt, zweimal, weil sich das Layout mit der Höhe ändern kann
    for (let i = 0; i < 3; i++) {
      const h = Math.min(HOECHSTENS, await t.auswerten(`Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, (() => { const m = document.getElementById("main"); return m.getBoundingClientRect().top + m.scrollHeight; })())`));
      if (h === hoehe) break;
      hoehe = Math.ceil(h);
      await t.s("Emulation.setDeviceMetricsOverride", { width: breite, height: hoehe, deviceScaleFactor: 1, mobile: breite < 600 });
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  const bild = await t.s("Page.captureScreenshot", { format: "png", fromSurface: true });
  const jpg = ANKER ? await t.s("Page.captureScreenshot", { format: "jpeg", quality: 82, fromSurface: true, clip: { x: 0, y: 0, width: breite, height: hoehe, scale: 480 / breite } }) : null;
  await t.s("Emulation.setDeviceMetricsOverride", { width: breite, height: breite < 600 ? 800 : 900, deviceScaleFactor: 1, mobile: breite < 600 });
  return { png: Buffer.from(bild.data, "base64"), jpg: jpg && Buffer.from(jpg.data, "base64"), hoehe };
}

async function main() {
  if (!argv.includes("--chrome")) { console.error("Aufruf: node werkzeug/bildvergleich.mjs --chrome [--referenz-setzen] [--nur seite] [--aus ordner] [--anker ordner]"); return 2; }
  if (SETZEN && process.env.CI) { console.error("Referenzbilder werden im CI nie gesetzt. Von Hand: --referenz-setzen."); return 2; }
  const toleranz = JSON.parse(await readFile(path.join(REFERENZ, "toleranz.json"), "utf8"));
  const seiten = (await seitenListe()).filter((s) => !NUR || NUR.includes(s.name));
  await mkdir(AUS, { recursive: true }); if (SETZEN) await mkdir(REFERENZ, { recursive: true }); if (ANKER) await mkdir(ANKER, { recursive: true });
  const server = await dateiserver(), chrome = await chromeStarten();
  console.log(`${chrome.version} · ${seiten.length} Seiten × ${BREITEN.length} Breiten × ${FARBEN.length} Farben${SETZEN ? " · Referenz wird gesetzt" : ""}\n`);
  const fehler = [], ergebnisse = [];
  try {
    for (const breite of BREITEN) for (const farbe of FARBEN) {
      const t = await chrome.tab();
      await appLaden(t, server.url, breite, farbe);
      for (const seite of seiten) {
        const name = `${seite.name}-${breite}-${farbe}`, tol = { ...toleranz.standard, ...(toleranz.seiten?.[seite.name] ?? {}) };
        const { png, jpg } = await aufnehmen(t, breite, seite);
        if (jpg) await writeFile(path.join(ANKER, `${name}.jpg`), jpg);
        if (SETZEN) { await writeFile(path.join(REFERENZ, `${name}.png`), png); console.log(`  • ${name} gesetzt`); continue; }
        let ref = null;
        try { ref = pngLesen(await readFile(path.join(REFERENZ, `${name}.png`))); } catch { /* fehlt */ }
        if (!ref) {
          await writeFile(path.join(AUS, `${name}.png`), png);
          fehler.push(`${name}: keine Referenz`); console.log(`  ✗ ${name} – keine Referenz (Aufnahme in ${path.relative(WURZEL, AUS)}/)`); continue;
        }
        const v = vergleichen(ref, pngLesen(png), { schwelle: tol.schwelle });
        const ok = v.gleicheGroesse && v.anteil <= tol.anteil;
        ergebnisse.push({ name, ok, anteil: v.anteil, anders: v.anders, rahmen: v.rahmen, groesse: v.gleicheGroesse });
        if (ok) { console.log(`  ✓ ${name}${v.anders ? ` (${v.anders} Pixel innerhalb der Toleranz)` : ""}`); continue; }
        await writeFile(path.join(AUS, `${name}.png`), png);
        await writeFile(path.join(AUS, `${name}-differenz.png`), pngSchreiben(v.differenz));
        const was = v.gleicheGroesse ? `${v.anders} Pixel (${(v.anteil * 100).toFixed(3)} %)` : `Größe ${ref.breite}×${ref.hoehe} → ${pngLesen(png).breite}×${pngLesen(png).hoehe}, ${v.anders} Pixel`;
        fehler.push(`${name}: ${was}`);
        console.log(`  ✗ ${name} – ${was}, ab y=${v.rahmen?.y} (Differenzbild in ${path.relative(WURZEL, AUS)}/)`);
      }
      if (t.fremd.length) console.log(`    gesperrte fremde Adressen: ${[...new Set(t.fremd.map((u) => new URL(u).host))].join(", ")}`);
      await t.schliessen();
    }
  } finally { await chrome.beenden(); server.schliessen(); }
  await writeFile(path.join(AUS, "bericht.json"), JSON.stringify({ chrome: chrome.version, ergebnisse, fehler }, null, 2));
  console.log(fehler.length ? `\n${fehler.length} Abweichungen:\n- ${fehler.join("\n- ")}` : SETZEN ? "\nReferenz gesetzt." : "\nAlle Seiten gleich der Referenz.");
  return fehler.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main().then((c) => process.exit(c), (e) => { console.error(e); process.exit(2); });
