// Interner Kanal (0.6.0, Auftrag 2026-10-05-08, Weg A mit Bills Ergänzungen 1–7). Gegenstück: werkzeug/intern.mjs.
// - Freischalten: ein Link mit dem Schlüssel hinter „#kanal=“ (Fragment, nie in Server-Protokollen). Die App liest ihn,
//   merkt ihn nur auf diesem Gerät und nimmt ihn sofort aus der Adresszeile.
// - Ohne Schlüssel fragt die App den internen Katalog nie ab; für alle anderen gibt es ihn nicht.
// - Auf dem Server liegt alles mit AES-256-GCM verschlüsselt unter intern/<kennung>/ (Weiterleitung über die Web-Seite,
//   der Speicher selbst schickt keine CORS-Kopfzeilen). Signaturen prüft die App wie beim öffentlichen Katalog.
// - Schlüsselwechsel: Unter der alten Kennung gibt es nichts mehr (403/404) → still „Interner Kanal abgelaufen“.

export const LINK_MUSTER = /^#kanal=([A-Za-z0-9_-]{43})$/;
export const WEB_BASIS = "https://offline-liart.vercel.app/intern/";

const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "="), (c) => c.charCodeAt(0));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Schlüssel aus einem Link oder Fragment („…/app.html#kanal=…“ oder „#kanal=…“); sonst null. */
export function schluesselAusLink(text) {
  const s = String(text ?? "").trim(), i = s.indexOf("#");
  const m = LINK_MUSTER.exec(i >= 0 ? s.slice(i) : "");
  return m ? m[1] : null;
}

/** Kennung wie werkzeug/intern.mjs: SHA-256("offline-intern:" + Schlüssel), die ersten 16 Hex-Zeichen. */
export async function kennung(schluessel) {
  const k = b64url(schluessel), vor = new TextEncoder().encode("offline-intern:");
  const alles = new Uint8Array(vor.length + k.length); alles.set(vor); alles.set(k, vor.length);
  return hex(await crypto.subtle.digest("SHA-256", alles)).slice(0, 16);
}

export async function entschluesseln(daten, schluessel) {
  const key = await crypto.subtle.importKey("raw", b64url(schluessel), { name: "AES-GCM" }, false, ["decrypt"]);
  const d = new Uint8Array(daten);
  return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: d.subarray(0, 12) }, key, d.subarray(12)));
}

/** Fehler, wenn der Kanal unter dieser Kennung nicht (mehr) existiert. */
export class KanalAbgelaufen extends Error {}

/**
 * Holt und entschlüsselt eine Datei des Kanals. basis: Adresse von intern/ (Web: gleiche Seite, Desktop: WEB_BASIS).
 * holen: fetch (für Tests austauschbar).
 */
export async function holeIntern({ basis, schluessel, pfad, holen = fetch }) {
  const url = `${basis}${await kennung(schluessel)}/${pfad}`;
  let res;
  try { res = await holen(url, { cache: "no-store" }); } catch (e) { throw new Error(`Kein Netz: ${e.message ?? e}`); }
  if (res.status === 403 || res.status === 404) throw new KanalAbgelaufen(`${res.status}`);
  if (!res.ok) throw new Error(`${res.status} beim Laden von ${pfad}`);
  try { return await entschluesseln(await res.arrayBuffer(), schluessel); } catch { throw new KanalAbgelaufen("nicht entschlüsselbar"); }
}

/**
 * Katalog des Kanals laden und prüfen. pruefe: (bytes, sig, zweck) → { ok, grund } (pruefeSignatur aus paket-client.js).
 * zuletzt: erstellt des zuletzt gesehenen internen Katalogs (Rollback-Schutz).
 */
export async function internKatalog({ basis, schluessel, pruefe, zuletzt = null, holen = fetch }) {
  const [bytes, sigBytes] = await Promise.all(["katalog/katalog.json", "katalog/katalog.sig"].map((pfad) => holeIntern({ basis, schluessel, pfad, holen })));
  const s = await pruefe(bytes, JSON.parse(new TextDecoder().decode(sigBytes)), "katalog");
  if (!s.ok) throw new Error("Interner Katalog: " + s.grund);
  const katalog = JSON.parse(new TextDecoder().decode(bytes));
  if (zuletzt && katalog.erstellt < zuletzt) throw new Error("Interner Katalog ist älter als der zuletzt gesehene (Rollback-Schutz)");
  return katalog;
}

/** Alle Dateien eines Pakets aus dem Kanal (paket.json, paket.sig, inhalt/…), entschlüsselt. Prüfen tut der Aufrufer. */
export async function internPaketDateien({ basis, schluessel, eintrag, holen = fetch }) {
  const hole = (pfad) => holeIntern({ basis, schluessel, pfad: `pakete/${eintrag.pfad}${pfad}`, holen });
  const manifestBytes = await hole("paket.json");
  const manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
  const dateien = [{ pfad: "paket.json", bytes: manifestBytes }, { pfad: "paket.sig", bytes: await hole("paket.sig") }];
  for (const d of manifest.dateien) dateien.push({ pfad: d.pfad, bytes: await hole(d.pfad) });
  return { manifest, dateien };
}

/** Zustand für die Zeile in „Updates & Abo“: an, abgelaufen oder nichts (dann gibt es keine Zeile). */
export function kanalZeile(stand) {
  if (stand?.abgelaufen) return { text: "Interner Kanal abgelaufen", entfernen: true };
  if (stand?.schluessel) return { text: "Interner Kanal: an", entfernen: true };
  return null;
}
