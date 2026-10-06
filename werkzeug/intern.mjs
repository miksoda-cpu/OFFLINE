#!/usr/bin/env node
// Interner Kanal (0.6.0, Auftrag 2026-10-05-08, Weg A): Pakete, die nur auf freigeschalteten Geräten erscheinen.
// Jede Datei liegt auf dem Server mit AES-256-GCM verschlüsselt (12 Byte Zufalls-IV, dann Chiffrat mit Tag). Der Ort ist
// intern/<kennung>/, die Kennung kommt aus dem Schlüssel; ohne Schlüssel findet und liest niemand etwas. Signiert wird wie
// immer (Katalog und Pakete mit dem Paketschlüssel der CI), verschlüsselt erst danach. Gegenstück: web/intern.js.
// Aufruf (CI): OFFLINE_INTERN_SCHLUESSEL=… node werkzeug/intern.mjs verschluesseln <ordner> <ziel>  → gibt die Kennung aus
// Das Repo ist öffentlich: Inhalte interner Pakete liegen dort nur verschlüsselt (pakete/<id>/verschluesselt/, gleicher
// Schlüssel); `entschluesseln` holt sie in der CI zurück. Klartext nur lokal (.gitignore).
//   auffrischen <paket>    – nach einer Änderung am Inhalt: was in <paket>/verschluesselt/ liegt, neu aus dem Klartext
//   umschluesseln <ordner> – Schlüsselwechsel: alter Schlüssel in OFFLINE_INTERN_SCHLUESSEL_ALT, neuer in OFFLINE_INTERN_SCHLUESSEL
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const IV_LAENGE = 12;
/** Schlüssel aus base64url (43 Zeichen = 32 Byte). */
export function schluesselLesen(text) {
  const k = Buffer.from(String(text ?? "").trim(), "base64url");
  if (k.length !== 32) throw new Error("Kanal-Schlüssel muss 32 Byte haben");
  return k;
}
/** Kennung des Kanals: die ersten 16 Hex-Zeichen von SHA-256("offline-intern:" + Schlüssel). Wechselt mit dem Schlüssel. */
export const kennung = (k) => createHash("sha256").update(Buffer.concat([Buffer.from("offline-intern:"), k])).digest("hex").slice(0, 16);
export function verschluesseln(bytes, k, iv = randomBytes(IV_LAENGE)) {
  const c = createCipheriv("aes-256-gcm", k, iv);
  return Buffer.concat([iv, c.update(bytes), c.final(), c.getAuthTag()]);
}
export function entschluesseln(daten, k) {
  const iv = daten.subarray(0, IV_LAENGE), tag = daten.subarray(daten.length - 16), ct = daten.subarray(IV_LAENGE, daten.length - 16);
  const d = createDecipheriv("aes-256-gcm", k, iv); d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]);
}
async function dateien(ordner, rel = "") {
  const aus = [];
  for (const e of await readdir(path.join(ordner, rel))) {
    const r = path.posix.join(rel, e);
    if ((await stat(path.join(ordner, r))).isDirectory()) aus.push(...await dateien(ordner, r)); else aus.push(r);
  }
  return aus;
}
/** Entschlüsselt jeden Pfad unter ordner nach ziel (gleiche Namen). */
export async function ordnerEntschluesseln(ordner, ziel, k) {
  for (const r of await dateien(ordner)) {
    await mkdir(path.dirname(path.join(ziel, r)), { recursive: true });
    await writeFile(path.join(ziel, r), entschluesseln(await readFile(path.join(ordner, r)), k));
  }
}
/** Verschlüsselt jeden Pfad unter ordner nach ziel (gleiche Namen). */
export async function ordnerVerschluesseln(ordner, ziel, k) {
  for (const r of await dateien(ordner)) {
    await mkdir(path.dirname(path.join(ziel, r)), { recursive: true });
    await writeFile(path.join(ziel, r), verschluesseln(await readFile(path.join(ordner, r)), k));
  }
}

/** Verschlüsselt jede Datei, die schon in <paket>/verschluesselt/ liegt, neu aus dem Klartext daneben (<paket>/<gleicher Pfad>).
 *  Für jede Änderung am Inhalt: welche Dateien verschlüsselt im Repo liegen, bestimmt der Ordner selbst. */
export async function auffrischen(paket, k) {
  const v = path.join(paket, "verschluesselt"), liste = await dateien(v);
  for (const r of liste) {
    const klar = await readFile(path.join(paket, r)).catch(() => { throw new Error(`Klartext fehlt: ${path.join(paket, r)} (erst entschlüsseln)`); });
    await writeFile(path.join(v, r), verschluesseln(klar, k));
  }
  return liste;
}
/** Schlüsselwechsel im Repo: jede Datei unter ordner mit dem alten Schlüssel öffnen und mit dem neuen verschließen, an Ort und Stelle.
 *  Erst alles prüfen, dann schreiben: passt der alte Schlüssel bei einer Datei nicht, bleibt alles unverändert. */
export async function umschluesseln(ordner, alt, neu) {
  const liste = await dateien(ordner), klar = [];
  for (const r of liste) {
    try { klar.push(entschluesseln(await readFile(path.join(ordner, r)), alt)); } catch { throw new Error(`${r}: alter Schlüssel passt nicht – nichts geändert`); }
  }
  for (const [i, r] of liste.entries()) await writeFile(path.join(ordner, r), verschluesseln(klar[i], neu));
  return liste;
}

async function main() {
  const [befehl, ordner, ziel] = process.argv.slice(2);
  const k = schluesselLesen(process.env.OFFLINE_INTERN_SCHLUESSEL);
  if (befehl === "kennung") return console.log(kennung(k));
  if (befehl === "auffrischen" && ordner) return console.log(`${(await auffrischen(ordner, k)).length} Dateien neu verschlüsselt (Kennung ${kennung(k)})`);
  if (befehl === "umschluesseln" && ordner) {
    const alt = schluesselLesen(process.env.OFFLINE_INTERN_SCHLUESSEL_ALT);
    return console.log(`${(await umschluesseln(ordner, alt, k)).length} Dateien umgeschlüsselt: ${kennung(alt)} → ${kennung(k)}`);
  }
  if (!["verschluesseln", "entschluesseln"].includes(befehl) || !ordner || !ziel) throw new Error("Aufruf: intern.mjs verschluesseln|entschluesseln <ordner> <ziel> | auffrischen <paket> | umschluesseln <ordner> | kennung");
  await (befehl === "verschluesseln" ? ordnerVerschluesseln : ordnerEntschluesseln)(ordner, ziel, k);
  console.log(kennung(k));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
