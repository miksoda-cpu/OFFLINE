// Paket-Client für die Desktop-App: gleiche Schnittstelle wie paket-client.js, aber alles, was Pakete prüft,
// lädt oder speichert, macht der Rust-Kern (Update-Dienst). Die Oberfläche zeigt nur an.

import { speicher } from "./paket-client.js";
import { delta, versionVergleich } from "./paket-kern.js";

export { speicher, katalogAusSpeicher, paketUrl, inhalt, sha256Hex } from "./paket-client.js";
export { verfuegbareUpdates };

const T = window.__TAURI__;
const invoke = (befehl, args) => T.core.invoke(befehl, args);

// Zwischenspeicher der installierten Pakete – die Seiten greifen synchron darauf zu.
const cache = new Map();
export const istDesktop = true;

export async function init() {
  await cacheLaden();
  verbindungMelden();
  addEventListener("online", verbindungMelden);
  addEventListener("offline", verbindungMelden);
  return { datenordner: await invoke("datenordner") };
}

async function cacheLaden() {
  cache.clear();
  for (const p of await invoke("installierte")) cache.set(p.manifest.id, p);
}

function verbindungMelden() {
  // getaktet: der Browser weiß es meist nicht; null = unbekannt (zählt nicht als getaktet)
  const getaktet = navigator.connection?.saveData === true ? true : null;
  invoke("verbindung_melden", { online: navigator.onLine, getaktet, versatzMin: -new Date().getTimezoneOffset() }).catch(() => {});
}

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

/** Katalog über den Kern laden (Signatur, Rollback-Schutz in Rust); Ergebnis wie im Browser-Client. */
export async function ladeKatalog() {
  const r = await invoke("katalog_laden");
  speicher.set("katalog", { katalog: r.katalog, geladen: r.geladen, schluessel: r.schluessel });
  return { katalog: r.katalog, veraltet: r.veraltet, schluessel: r.schluessel };
}

/** Paket aus dem Katalog laden – alle Arten, fortsetzbar, Fortschritt über `fortschritt`. */
export async function installiere(katalog, eintrag, fortschritt = () => {}) {
  if (eintrag.status !== "verfuegbar") throw new Error("Dieses Paket ist noch nicht verfügbar");
  const alt = cache.get(eintrag.id) ?? null;
  const ab = await T.event.listen("download-fortschritt", (ev) => {
    const f = ev.payload;
    if (f.id === eintrag.id) fortschritt({ pfad: f.datei, geladen: f.geladen, gesamt: f.gesamt });
  });
  try {
    const e = await invoke("paket_laden", { id: eintrag.id });
    const paket = await invoke("paket_lesen", { id: eintrag.id });
    cache.set(eintrag.id, paket);
    const d = delta(alt?.manifest ?? null, paket.manifest);
    return { paket, delta: d, geladen: e.kopiert_bytes };
  } finally {
    ab();
  }
}

export async function entferne(id) {
  await invoke("entfernen", { id });
  cache.delete(id);
}

// ---------- nur Desktop ----------

export const abbrechen = () => invoke("download_abbrechen");
export const stickSuchen = () => invoke("stick_suchen");
export const aboLesen = () => invoke("abo_lesen");
export const aboSchreiben = (einstellungen) => invoke("abo_schreiben", { einstellungen });
export const aboStatus = () => invoke("abo_status");

export async function updatesJetzt() {
  const r = await invoke("updates_jetzt");
  await cacheLaden();
  return r;
}

export async function einspielenOrdner(pfad, downgrade = false) {
  const e = await invoke("einspielen_ordner", { pfad, downgrade });
  cache.set(e.id, await invoke("paket_lesen", { id: e.id }));
  return e;
}

export async function ordnerWaehlen(titel = "Paketordner wählen (mit paket.json)") {
  return T.dialog.open({ directory: true, multiple: false, title: titel });
}

export async function speicherortSetzen(pfad) {
  const wurzel = await invoke("speicherort_setzen", { pfad });
  await cacheLaden();
  return wurzel;
}

export const lokalUrl = () => invoke("lokal_url");
export const appInfo = () => invoke("app_info");
export const appUpdatePruefen = () => invoke("app_update_pruefen");
export async function appUpdateInstallieren(fortschritt = () => {}) {
  const ab = await T.event.listen("app-update-fortschritt", (ev) => fortschritt(ev.payload));
  try { return await invoke("app_update_installieren"); } finally { ab(); }
}
export const appNeustart = () => invoke("app_neustart");
export const kiwixUrl = () => invoke("kiwix_url");
export const fensterOeffnen = (url, titel) => invoke("fenster_oeffnen", { url, titel });
export const allesLoeschen = (bestaetigung) => invoke("alles_loeschen", { bestaetigung });

/** Ereignisse des Hintergrund-Abos (automatische Updates) an die Oberfläche weiterreichen. */
export function beiAboErgebnis(cb) {
  T.event.listen("abo-ergebnis", async (ev) => { await cacheLaden(); cb(ev.payload); });
}
