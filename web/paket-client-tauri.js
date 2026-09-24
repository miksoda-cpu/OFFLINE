// Paket-Client für die Desktop-App: gleiche Schnittstelle wie paket-client.js, aber alles, was Pakete prüft
// oder speichert, macht der Rust-Kern. Die Oberfläche lädt höchstens Bytes und reicht sie weiter.

import * as web from "./paket-client.js";
import { delta, versionVergleich } from "./paket-kern.js";

export { speicher, ladeKatalog, katalogAusSpeicher, paketUrl, inhalt, sha256Hex } from "./paket-client.js";
export { verfuegbareUpdates };

const T = window.__TAURI__;
const invoke = (befehl, args) => T.core.invoke(befehl, args);
const b64 = (bytes) => { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); };

// Zwischenspeicher der installierten Pakete – die Seiten greifen synchron darauf zu.
const cache = new Map();

export async function init() {
  cache.clear();
  for (const p of await invoke("installierte")) cache.set(p.manifest.id, p);
  return { datenordner: await invoke("datenordner") };
}

export const istDesktop = true;

export function installiertesPaket(id) {
  return cache.get(id) ?? null;
}

export function installierteIds() {
  return [...cache.keys()];
}

function verfuegbareUpdates(katalog) {
  const aus = [];
  for (const [id, p] of cache) {
    const e = katalog.pakete.find((x) => x.id === id && x.status === "verfuegbar");
    if (e && versionVergleich(e.version, p.manifest.version) > 0) aus.push({ eintrag: e, installiert: p.manifest.version });
  }
  return aus;
}

async function holeBytes(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${res.status} beim Laden von ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Aus dem Katalog laden (nur Textpakete) – Bytes holen, an den Kern übergeben, der prüft und einspielt. */
export async function installiere(katalog, eintrag, fortschritt = () => {}) {
  if (eintrag.status !== "verfuegbar") throw new Error("Dieses Paket ist noch nicht verfügbar");
  if (eintrag.art !== "inhalt") throw new Error("Große Pakete kommen mit dem Update-Dienst (Phase 3) – bis dahin vom USB-Stick einspielen");
  const alt = cache.get(eintrag.id) ?? null;
  const url = web.paketUrl(katalog, eintrag);
  const manifestBytes = await holeBytes(url + "paket.json");
  const manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
  const d = delta(alt?.manifest ?? null, manifest);
  const dateien = [
    { pfad: "paket.json", daten: b64(manifestBytes) },
    { pfad: "paket.sig", daten: b64(await holeBytes(url + "paket.sig")) },
  ];
  let geladen = 0;
  for (const datei of manifest.dateien) {
    // Unveränderte Dateien nimmt der Kern nicht aus dem alten Ordner – im Zwischenordner muss alles liegen.
    // Für Textpakete ist das egal (Kilobytes); der Update-Dienst in Phase 3 macht echte Deltas auf der Platte.
    const bytes = await holeBytes(url + datei.pfad);
    dateien.push({ pfad: datei.pfad, daten: b64(bytes) });
    if (d.laden.some((l) => l.pfad === datei.pfad)) geladen += bytes.length;
    fortschritt({ pfad: datei.pfad, geladen, gesamt: d.bytes });
  }
  await invoke("einspielen_bytes", { dateien, downgrade: false });
  const paket = await invoke("paket_lesen", { id: eintrag.id });
  cache.set(eintrag.id, paket);
  return { paket, delta: d, geladen };
}

export async function entferne(id) {
  await invoke("entfernen", { id });
  cache.delete(id);
}

// ---------- nur Desktop ----------

export async function stickSuchen() {
  return invoke("stick_suchen");
}

export async function einspielenOrdner(pfad, downgrade = false) {
  const e = await invoke("einspielen_ordner", { pfad, downgrade });
  cache.set(e.id, await invoke("paket_lesen", { id: e.id }));
  return e;
}

export async function ordnerWaehlen() {
  return T.dialog.open({ directory: true, multiple: false, title: "Paketordner wählen (mit paket.json)" });
}
