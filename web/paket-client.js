// Paket-Client für den Browser: Katalog laden, Signaturen prüfen, Pakete installieren.
// Spiegelt werkzeug/paket-lib.mjs – nur mit WebCrypto statt node:crypto. Spezifikation: docs/PAKETFORMAT.md.

import { versionVergleich, delta, manifestPruefenStruktur, FORMAT } from "./paket-kern.js";

const SCHLUESSEL_URL = "/schluessel/oeffentlich.json";
const KATALOG_URL = "/katalog/katalog.json";

const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export async function sha256Hex(bytes) {
  const h = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------- Speicher ----------
export const speicher = {
  get(key, fallback) {
    try { const v = localStorage.getItem("offline:" + key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem("offline:" + key, JSON.stringify(value)); } catch { /* Speicher voll oder gesperrt */ } },
  del(key) { try { localStorage.removeItem("offline:" + key); } catch { /* egal */ } },
  installierte() {
    const aus = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("offline:paket:")) aus.push(k.slice("offline:paket:".length));
      }
    } catch { /* egal */ }
    return aus;
  },
};

// ---------- Schlüssel & Signatur ----------
let bekannteCache = null;
export async function bekannteSchluessel() {
  if (bekannteCache) return bekannteCache;
  const res = await fetch(SCHLUESSEL_URL);
  if (!res.ok) throw new Error("Schlüsselliste nicht ladbar");
  const liste = await res.json();
  bekannteCache = liste.schluessel;
  return bekannteCache;
}

async function importiere(k) {
  const jwk = { kty: "OKP", crv: "Ed25519", x: b64url(b64(k.oeffentlich)) };
  return crypto.subtle.importKey("jwk", jwk, { name: "Ed25519" }, false, ["verify"]);
}

export async function pruefeSignatur(bytes, sig, zweck = "pakete") {
  if (!sig || sig.algorithmus !== "ed25519" || typeof sig.signatur !== "string") return { ok: false, grund: "Signatur fehlt oder unbekanntes Verfahren" };
  const bekannte = await bekannteSchluessel();
  const s = bekannte.find((k) => k.id === sig.schluessel);
  if (!s) return { ok: false, grund: `Unbekannter Schlüssel ${sig.schluessel}` };
  if (!s.zweck.includes(zweck)) return { ok: false, grund: `Schlüssel ${s.id} nicht für ${zweck} freigegeben` };
  const tag = new Date().toISOString().slice(0, 10);
  if (s.gueltig_ab && tag < s.gueltig_ab) return { ok: false, grund: `Schlüssel ${s.id} noch nicht gültig` };
  if (s.gueltig_bis && tag > s.gueltig_bis) return { ok: false, grund: `Schlüssel ${s.id} abgelaufen` };
  const signatur = b64(sig.signatur);
  if (signatur.length !== 64) return { ok: false, grund: "Signatur hat falsche Länge" };
  let key;
  try { key = await importiere(s); } catch { return { ok: false, grund: "Dieser Browser kann Ed25519-Signaturen nicht prüfen" }; }
  const ok = await crypto.subtle.verify({ name: "Ed25519" }, key, signatur, bytes);
  return ok ? { ok: true, schluessel: s.id } : { ok: false, grund: "Signatur passt nicht zum Inhalt" };
}

async function holeBytes(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${res.status} beim Laden von ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}
async function holeJson(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${res.status} beim Laden von ${url}`);
  return res.json();
}

// ---------- Katalog ----------
export async function ladeKatalog() {
  const [bytes, sig] = await Promise.all([holeBytes(KATALOG_URL), holeJson(KATALOG_URL.replace(/\.json$/, ".sig"))]);
  const s = await pruefeSignatur(bytes, sig, "katalog");
  if (!s.ok) throw new Error("Katalog: " + s.grund);
  const katalog = JSON.parse(new TextDecoder().decode(bytes));
  if (katalog.format !== FORMAT) throw new Error(`Katalogformat ${katalog.format} unbekannt`);
  const zuletzt = speicher.get("katalog-erstellt", null);
  if (zuletzt && katalog.erstellt < zuletzt) throw new Error("Katalog ist älter als der zuletzt gesehene – wird abgelehnt (Rollback-Schutz)");
  speicher.set("katalog-erstellt", katalog.erstellt);
  const veraltet = katalog.gueltig_bis < new Date().toISOString();
  speicher.set("katalog", { katalog, geladen: new Date().toISOString(), schluessel: s.schluessel });
  return { katalog, veraltet, schluessel: s.schluessel };
}

export function katalogAusSpeicher() {
  return speicher.get("katalog", null);
}

/** Paketordner-URL: Katalog-Basis, wenn sie auf diese Seite zeigt, sonst /pakete/ auf dieser Seite (lokale Entwicklung, Vorschau-URLs). */
export function paketUrl(katalog, eintrag) {
  let basis;
  try { basis = new URL(katalog.basis); } catch { basis = null; }
  const wurzel = basis && basis.origin === location.origin ? basis.href : location.origin + "/pakete/";
  return new URL(eintrag.pfad, wurzel).href;
}

// ---------- Pakete ----------
export function installiertesPaket(id) {
  return speicher.get("paket:" + id, null);
}

export async function ladeManifest(katalog, eintrag) {
  const url = paketUrl(katalog, eintrag);
  const [bytes, sig] = await Promise.all([holeBytes(url + "paket.json"), holeJson(url + "paket.sig")]);
  const hash = await sha256Hex(bytes);
  if (hash !== eintrag.sha256_manifest) throw new Error("Manifest passt nicht zum Katalog (Prüfsumme)");
  const s = await pruefeSignatur(bytes, sig, "pakete");
  if (!s.ok) throw new Error("Paket: " + s.grund);
  const manifest = JSON.parse(new TextDecoder().decode(bytes));
  const fehler = manifestPruefenStruktur(manifest);
  if (fehler.length) throw new Error("Manifest ungültig: " + fehler[0]);
  if (manifest.id !== eintrag.id || manifest.version !== eintrag.version) throw new Error("Manifest gehört zu einem anderen Paket");
  return { manifest, url, schluessel: s.schluessel };
}

/**
 * Installiert oder aktualisiert ein Paket im Browser-Speicher. Lädt nur, was sich geändert hat (Delta),
 * prüft jede Datei gegen ihre Prüfsumme und ersetzt den alten Stand erst, wenn alles da ist.
 * Nur für art "inhalt" – große Pakete gehören in die Desktop-App.
 */
export async function installiere(katalog, eintrag, fortschritt = () => {}) {
  if (eintrag.status !== "verfuegbar") throw new Error("Dieses Paket ist noch nicht verfügbar");
  if (eintrag.art !== "inhalt") throw new Error("Pakete dieser Größe lassen sich nur in der Desktop-App installieren");
  const alt = installiertesPaket(eintrag.id);
  const { manifest, url, schluessel } = await ladeManifest(katalog, eintrag);
  const d = delta(alt?.manifest ?? null, manifest);
  const inhalt = {};
  let geladen = 0;
  for (const datei of manifest.dateien) {
    const muss = d.laden.find((l) => l.pfad === datei.pfad);
    if (!muss) { inhalt[datei.pfad] = alt.inhalt[datei.pfad]; continue; }
    const bytes = await holeBytes(url + datei.pfad);
    if (bytes.length !== datei.groesse) throw new Error(`Größe falsch: ${datei.pfad}`);
    if ((await sha256Hex(bytes)) !== datei.sha256) throw new Error(`Prüfsumme falsch: ${datei.pfad}`);
    inhalt[datei.pfad] = new TextDecoder().decode(bytes);
    geladen += bytes.length;
    fortschritt({ pfad: datei.pfad, geladen, gesamt: d.bytes });
  }
  const paket = { manifest, inhalt, installiert: new Date().toISOString(), schluessel };
  speicher.set("paket:" + eintrag.id, paket); // atomar: ein Schreibvorgang ersetzt den alten Stand
  return { paket, delta: d, geladen };
}

export function entferne(id) {
  speicher.del("paket:" + id);
}

/** Welche installierten Pakete haben im Katalog eine neuere Version? */
export function verfuegbareUpdates(katalog) {
  const aus = [];
  for (const id of speicher.installierte()) {
    const p = installiertesPaket(id);
    const e = katalog.pakete.find((x) => x.id === id && x.status === "verfuegbar");
    if (p && e && versionVergleich(e.version, p.manifest.version) > 0) aus.push({ eintrag: e, installiert: p.manifest.version });
  }
  return aus;
}

/** Bequemer Zugriff auf eine JSON-Datei eines installierten Pakets. */
export function inhalt(paket, pfad) {
  const t = paket?.inhalt?.[pfad];
  if (t == null) return null;
  try { return JSON.parse(t); } catch { return null; }
}
