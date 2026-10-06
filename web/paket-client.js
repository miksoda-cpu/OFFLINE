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
export const istDesktop = false;
export function installierteIds() { return speicher.installierte(); }

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
 * Nur Textpakete (art "inhalt" und die Tagesinhalte "tage") – große Pakete gehören in die Desktop-App.
 */
export async function installiere(katalog, eintrag, fortschritt = () => {}) {
  if (eintrag.status !== "verfuegbar") throw new Error("Dieses Paket ist noch nicht verfügbar");
  if (eintrag.art !== "inhalt" && eintrag.art !== "tage") throw new Error("Pakete dieser Größe lassen sich nur in der Desktop-App installieren");
  const alt = installiertesPaket(eintrag.id);
  const { manifest, url, schluessel } = await ladeManifest(katalog, eintrag);
  const d = delta(alt?.manifest ?? null, manifest);
  const inhalt = {}, binaer = [], neueBilder = [];
  let geladen = 0;
  for (const datei of manifest.dateien) {
    const bild = BINAER.test(datei.pfad);
    if (bild) binaer.push(datei.pfad);
    const muss = d.laden.find((l) => l.pfad === datei.pfad);
    if (!muss && (bild || alt?.inhalt?.[datei.pfad] !== undefined)) { if (!bild) inhalt[datei.pfad] = alt.inhalt[datei.pfad]; continue; }
    const bytes = await holeBytes(url + datei.pfad);
    if (bytes.length !== datei.groesse) throw new Error(`Größe falsch: ${datei.pfad}`);
    if ((await sha256Hex(bytes)) !== datei.sha256) throw new Error(`Prüfsumme falsch: ${datei.pfad}`);
    if (bild) neueBilder.push([datei.pfad, bytes]); else inhalt[datei.pfad] = new TextDecoder().decode(bytes);
    geladen += bytes.length;
    fortschritt({ pfad: datei.pfad, geladen, gesamt: d.bytes });
  }
  // Bilder (0.6.2, z. B. „Was die Lumis denken“): erst wenn alles geprüft ist, in den Cache-Speicher, nicht in localStorage
  if (neueBilder.length || alt?.binaer?.length) {
    const c = await caches.open(BILD_SPEICHER);
    for (const [pfad, bytes] of neueBilder) await c.put(bildSchluessel(eintrag.id, pfad), new Response(bytes, { headers: { "Content-Type": MIME[pfad.split(".").pop().toLowerCase()] ?? "application/octet-stream" } }));
    for (const a of alt?.binaer ?? []) if (!binaer.includes(a)) await c.delete(bildSchluessel(eintrag.id, a));
    for (const [pfad] of neueBilder) bildUrls.delete(bildSchluessel(eintrag.id, pfad));
  }
  const paket = { manifest, inhalt, ...(binaer.length ? { binaer } : {}), installiert: new Date().toISOString(), schluessel };
  speicher.set("paket:" + eintrag.id, paket); // atomar: ein Schreibvorgang ersetzt den alten Stand
  return { paket, delta: d, geladen };
}

/**
 * Interner Kanal (0.6.0): Paket aus schon geladenen, entschlüsselten Dateien einspielen. Prüft wie installiere():
 * Manifest-Prüfsumme gegen den (signierten) Katalogeintrag, Signatur, Größe und Prüfsumme jeder Datei.
 */
export async function installiereAusDateien(eintrag, dateien) {
  const finde = (p) => dateien.find((d) => d.pfad === p)?.bytes;
  const bytes = finde("paket.json"), sigBytes = finde("paket.sig");
  if (!bytes || !sigBytes) throw new Error("Paket unvollständig");
  if ((await sha256Hex(bytes)) !== eintrag.sha256_manifest) throw new Error("Manifest passt nicht zum Katalog (Prüfsumme)");
  const s = await pruefeSignatur(bytes, JSON.parse(new TextDecoder().decode(sigBytes)), "pakete");
  if (!s.ok) throw new Error("Paket: " + s.grund);
  const manifest = JSON.parse(new TextDecoder().decode(bytes));
  const fehler = manifestPruefenStruktur(manifest);
  if (fehler.length) throw new Error("Manifest ungültig: " + fehler[0]);
  if (manifest.id !== eintrag.id || manifest.version !== eintrag.version) throw new Error("Manifest gehört zu einem anderen Paket");
  const inhalt = {}, binaer = [];
  for (const datei of manifest.dateien) {
    const b = finde(datei.pfad);
    if (!b || b.length !== datei.groesse || (await sha256Hex(b)) !== datei.sha256) throw new Error(`Prüfsumme falsch: ${datei.pfad}`);
    if (BINAER.test(datei.pfad)) binaer.push(datei.pfad); else inhalt[datei.pfad] = new TextDecoder().decode(b);
  }
  // Bilder (0.6.1) nicht in localStorage, sondern in den Cache-Speicher des Browsers (Binärdaten, mehr Platz)
  if (binaer.length) {
    const c = await caches.open(BILD_SPEICHER);
    for (const pfad of binaer) await c.put(bildSchluessel(eintrag.id, pfad), new Response(finde(pfad), { headers: { "Content-Type": MIME[pfad.split(".").pop().toLowerCase()] ?? "application/octet-stream" } }));
    for (const alt of installiertesPaket(eintrag.id)?.binaer ?? []) if (!binaer.includes(alt)) await c.delete(bildSchluessel(eintrag.id, alt));
  }
  const paket = { manifest, inhalt, ...(binaer.length ? { binaer } : {}), installiert: new Date().toISOString(), schluessel: s.schluessel };
  speicher.set("paket:" + eintrag.id, paket);
  if (!installiertesPaket(eintrag.id)) throw new Error("Der Speicher des Browsers ist voll");
  return { paket };
}

export function entferne(id) {
  const binaer = installiertesPaket(id)?.binaer ?? [];
  speicher.del("paket:" + id);
  if (binaer.length && typeof caches !== "undefined") caches.open(BILD_SPEICHER).then((c) => Promise.all(binaer.map((p) => c.delete(bildSchluessel(id, p))))).catch(() => {});
}

// ---------- Bilder aus Paketen (0.6.1) ----------
const BINAER = /\.(webp|png|jpe?g|gif)$/i;
const MIME = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif" };
export const BILD_SPEICHER = "offline-paket-bilder";
const bildSchluessel = (id, pfad) => `/paket-bild/${encodeURIComponent(id)}/${pfad.split("/").map(encodeURIComponent).join("/")}`;
const bildUrls = new Map();
/** Adresse eines Bildes aus einem installierten Paket (Blob-URL aus dem Cache-Speicher), sonst null. */
export async function bildUrl(id, pfad) {
  const k = bildSchluessel(id, pfad);
  if (bildUrls.has(k)) return bildUrls.get(k);
  try {
    const r = await (await caches.open(BILD_SPEICHER)).match(k);
    if (!r) return null;
    const url = URL.createObjectURL(await r.blob()); bildUrls.set(k, url); return url;
  } catch { return null; }
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
