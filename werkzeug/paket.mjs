#!/usr/bin/env node
// OFFLINE-Paketwerkzeug – Kommandozeile. Siehe docs/PAKETFORMAT.md, Abschnitt 7.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import {
  schluesselErzeugen, privatAusPem, paketBauen, paketPruefen, delta, katalogBauen, katalogPruefen,
} from "./paket-lib.mjs";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OEFFENTLICH = path.join(WURZEL, "schluessel", "oeffentlich.json");
const PRIVAT_ORDNER = process.env.OFFLINE_SCHLUESSEL_ORDNER || path.join(os.homedir(), ".offline", "schluessel");

const mb = (n) => n < 1e6 ? `${(n / 1e3).toFixed(1)} kB` : n < 1e9 ? `${(n / 1e6).toFixed(1)} MB` : `${(n / 1e9).toFixed(2)} GB`;

async function bekannteLaden() {
  if (!existsSync(OEFFENTLICH)) return [];
  return JSON.parse(await readFile(OEFFENTLICH, "utf8")).schluessel;
}

async function privatLaden(name) {
  const pfad = process.env.OFFLINE_SCHLUESSEL || path.join(PRIVAT_ORDNER, `${name}.key`);
  if (!existsSync(pfad)) {
    throw new Error(`Privater Schlüssel fehlt: ${pfad}\n  Erzeugen mit: node werkzeug/paket.mjs schluessel erzeugen ${name}`);
  }
  return privatAusPem(await readFile(pfad, "utf8"));
}

const befehle = {
  async schluessel([unter, name = "offline-dev"]) {
    if (unter !== "erzeugen") throw new Error("Verwendung: schluessel erzeugen <name>");
    const pfad = path.join(PRIVAT_ORDNER, `${name}.key`);
    if (existsSync(pfad)) throw new Error(`Gibt es schon: ${pfad}`);
    const k = schluesselErzeugen(name === "offline-dev" ? "Entwicklungsschlüssel – wird vor dem Start ersetzt" : name);
    await mkdir(PRIVAT_ORDNER, { recursive: true, mode: 0o700 });
    await writeFile(pfad, k.privatPem, { mode: 0o600 });
    const liste = { format: 1, schluessel: await bekannteLaden() };
    liste.schluessel.push(k.oeffentlich);
    await mkdir(path.dirname(OEFFENTLICH), { recursive: true });
    await writeFile(OEFFENTLICH, JSON.stringify(liste, null, 2) + "\n");
    console.log(`Schlüssel ${k.id} erzeugt.\n  privat:     ${pfad}  (nie ins Repository!)\n  öffentlich: ${OEFFENTLICH}`);
  },

  async bauen([quelle, ziel, name = process.env.OFFLINE_SCHLUESSEL_NAME || "offline-dev"]) {
    if (!quelle || !ziel) throw new Error("Verwendung: bauen <quellordner> <zielwurzel> [schlüsselname]");
    const privat = await privatLaden(name);
    const { ziel: ordner, manifest } = await paketBauen(quelle, ziel, privat);
    console.log(`Paket ${manifest.id} ${manifest.version} gebaut → ${ordner}\n  ${manifest.dateien.length} Dateien, ${mb(manifest.groesse)}, signiert mit ${privat.id}`);
  },

  async pruefen([ordner]) {
    if (!ordner) throw new Error("Verwendung: pruefen <paketordner>");
    const r = await paketPruefen(ordner, await bekannteLaden());
    if (r.ok) { console.log(`OK: ${r.manifest.id} ${r.manifest.version} – ${r.manifest.dateien.length} Dateien, Schlüssel ${r.schluessel}`); return; }
    console.error("FEHLER:\n  " + r.fehler.join("\n  "));
    process.exitCode = 1;
  },

  async delta([alt, neu]) {
    if (!alt || !neu) throw new Error("Verwendung: delta <alt/paket.json|-> <neu/paket.json>");
    const a = alt === "-" ? null : JSON.parse(await readFile(alt, "utf8"));
    const n = JSON.parse(await readFile(neu, "utf8"));
    const d = delta(a, n);
    console.log(`${a ? `${a.id} ${a.version} → ` : "Neu: "}${n.id} ${n.version}`);
    for (const l of d.laden) console.log(`  laden   ${l.pfad}  ${mb(l.bytes)}${l.teile ? ` (${l.teile.length} Teile)` : ""}`);
    for (const l of d.loeschen) console.log(`  löschen ${l}`);
    console.log(`Zu laden: ${mb(d.bytes)} von ${mb(d.gesamt)} (${Math.round((100 * d.bytes) / Math.max(1, d.gesamt))} %)`);
  },

  async katalog([ziel, ...rest]) {
    const name = process.env.OFFLINE_SCHLUESSEL_NAME || "offline-dev";
    const basis = process.env.OFFLINE_BASIS || "https://offline-liart.vercel.app/pakete/";
    const geplantPfad = rest.find((r) => r.startsWith("--geplant="))?.slice(10);
    const nurManifest = rest.includes("--nur-manifest");
    const gueltigTage = Number(rest.find((r) => r.startsWith("--gueltig-tage="))?.slice(15) || 90);
    const ordner = rest.filter((r) => !r.startsWith("--"));
    if (!ziel || ordner.length === 0) throw new Error("Verwendung: katalog <zielordner> <paketordner…> [--geplant=datei.json]");
    const geplant = geplantPfad ? JSON.parse(await readFile(geplantPfad, "utf8")) : [];
    const bekannte = await bekannteLaden();
    const { katalog, bytes, sig } = await katalogBauen(ordner, { basis, geplant, bekannte, privat: await privatLaden(name), nurManifest, gueltigTage });
    await mkdir(ziel, { recursive: true });
    await writeFile(path.join(ziel, "katalog.json"), bytes);
    await writeFile(path.join(ziel, "katalog.sig"), JSON.stringify(sig, null, 2) + "\n");
    const k = katalogPruefen(bytes, sig, bekannte);
    if (!k.ok) throw new Error("Katalog nach dem Bauen ungültig: " + k.grund);
    console.log(`Katalog geschrieben → ${ziel}/katalog.json\n  ${katalog.pakete.length} Pakete (${katalog.pakete.filter((p) => p.status === "verfuegbar").length} verfügbar), gültig bis ${katalog.gueltig_bis}`);
  },
};

const [befehl, ...args] = process.argv.slice(2);
if (!befehl || !befehle[befehl]) {
  console.log(`OFFLINE-Paketwerkzeug\n\n  schluessel erzeugen <name>\n  bauen <quelle> <zielwurzel> [schlüssel]\n  pruefen <paketordner>\n  delta <alt/paket.json|-> <neu/paket.json>\n  katalog <ziel> <paketordner…> [--geplant=datei.json] [--nur-manifest] [--gueltig-tage=90]\n`);
  process.exit(befehl ? 1 : 0);
}
befehle[befehl](args).catch((e) => { console.error(e.message); process.exit(1); });
