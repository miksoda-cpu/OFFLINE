#!/usr/bin/env node
// Spiegelt die veröffentlichten Textpakete (art = inhalt und die Tagesinhalte art = tage) aus dem öffentlichen Katalog nach web/pakete/, bytegleich.
// Der Web-Prototyp bekommt so genau die Pakete, die auch die App lädt. Signatur des Katalogs, Signatur jedes Manifests
// und jede Datei werden geprüft; bei einem Fehler bleibt web/pakete/ unverändert.
//
//   node werkzeug/web-spiegeln.mjs [katalog-url]
//
// Danach baut `paket.mjs katalog web/katalog web/pakete/*/` den Katalog des Web-Prototyps (Workflow „Web-Version“).

import { mkdir, writeFile, rm, rename, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { katalogPruefen, paketPruefen } from "./paket-lib.mjs";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const URL_KATALOG = process.argv[2] || "https://offline-pakete.fsn1.your-objectstorage.com/katalog/katalog.json";
const ZIEL = path.join(WURZEL, "web", "pakete");
const NEU = ZIEL + ".neu";

const bekannte = JSON.parse(await readFile(path.join(WURZEL, "schluessel", "oeffentlich.json"), "utf8")).schluessel;
const holen = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(`${u}: ${r.status}`); return Buffer.from(await r.arrayBuffer()); };

const kBytes = await holen(URL_KATALOG);
const kSig = JSON.parse((await holen(URL_KATALOG.replace(/katalog\.json$/, "katalog.sig"))).toString("utf8"));
const k = katalogPruefen(kBytes, kSig, bekannte);
if (!k.ok) throw new Error(`Katalog abgelehnt: ${k.grund}`);

await rm(NEU, { recursive: true, force: true });
const textpakete = k.katalog.pakete.filter((p) => p.status === "verfuegbar" && (p.art === "inhalt" || p.art === "tage"));
for (const p of textpakete) {
  const basis = k.katalog.basis + p.pfad;
  const ordner = path.join(NEU, p.pfad);
  const manifest = await holen(basis + "paket.json");
  const m = JSON.parse(manifest.toString("utf8"));
  await mkdir(ordner, { recursive: true });
  await writeFile(path.join(ordner, "paket.json"), manifest);
  await writeFile(path.join(ordner, "paket.sig"), await holen(basis + "paket.sig"));
  for (const d of m.dateien) {
    const ziel = path.join(ordner, d.pfad);
    await mkdir(path.dirname(ziel), { recursive: true });
    await writeFile(ziel, await holen(basis + d.pfad));
  }
  const r = await paketPruefen(ordner, bekannte);
  if (!r.ok) throw new Error(`${p.id}: ${r.fehler.join("; ")}`);
  console.log(`${p.id} ${p.version}: ${m.dateien.length} Dateien, Schlüssel ${r.schluessel}`);
}
if (!textpakete.length) throw new Error("Keine Textpakete im Katalog");
await rm(ZIEL, { recursive: true, force: true });
await rename(NEU, ZIEL);
console.log(`web/pakete: ${textpakete.map((p) => `${p.id} ${p.version}`).join(", ")}`);
