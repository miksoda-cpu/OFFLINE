// OFFLINE-Paketformat, Version 1 – Referenzumsetzung (Node ≥ 20, keine Abhängigkeiten).
// Spezifikation: docs/PAKETFORMAT.md. Der Rust-Kern der Desktop-App muss sich exakt so verhalten.

import { createHash, generateKeyPairSync, createPublicKey, createPrivateKey, sign, verify } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, writeFile, mkdir, readdir, stat, copyFile } from "node:fs/promises";
import path from "node:path";

import { FORMAT, TEILGROESSE_STANDARD, TEILE_AB, ARTEN, ID_MUSTER, pfadGueltig, versionVergleich, manifestPruefenStruktur, delta } from "./kern.mjs";
export { FORMAT, TEILGROESSE_STANDARD, TEILE_AB, ARTEN, pfadGueltig, versionVergleich, manifestPruefenStruktur, delta };

// ---------- Schlüssel ----------

const b64 = (buf) => Buffer.from(buf).toString("base64");
const b64url = (buf) => Buffer.from(buf).toString("base64url");

export function schluesselId(oeffentlichRoh) {
  return createHash("sha256").update(oeffentlichRoh).digest("hex").slice(0, 16);
}

function rohAusPublicKey(publicKey) {
  const jwk = publicKey.export({ format: "jwk" });
  return Buffer.from(jwk.x, "base64url");
}

export function schluesselErzeugen(bezeichnung) {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const roh = rohAusPublicKey(publicKey);
  return {
    id: schluesselId(roh),
    privatPem: privateKey.export({ type: "pkcs8", format: "pem" }),
    oeffentlich: {
      id: schluesselId(roh),
      algorithmus: "ed25519",
      oeffentlich: b64(roh),
      zweck: ["pakete", "katalog"],
      gueltig_ab: new Date().toISOString().slice(0, 10),
      gueltig_bis: null,
      bezeichnung,
    },
  };
}

export function privatAusPem(pem) {
  const key = createPrivateKey(pem);
  const roh = rohAusPublicKey(createPublicKey(key));
  return { key, id: schluesselId(roh) };
}

function oeffentlichAusRoh(rohBase64) {
  const x = b64url(Buffer.from(rohBase64, "base64"));
  return createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x }, format: "jwk" });
}

export function signiere(bytes, privat) {
  const { key, id } = privat.key ? privat : privatAusPem(privat);
  return { algorithmus: "ed25519", schluessel: id, signatur: b64(sign(null, bytes, key)) };
}

/** Prüft eine Signatur gegen eine Liste bekannter öffentlicher Schlüssel (Format aus schluessel/oeffentlich.json). */
export function pruefeSignatur(bytes, sig, bekannte, { zweck = "pakete", jetzt = new Date() } = {}) {
  if (!sig || sig.algorithmus !== "ed25519" || typeof sig.signatur !== "string") return { ok: false, grund: "Signatur fehlt oder unbekanntes Verfahren" };
  const s = bekannte.find((k) => k.id === sig.schluessel);
  if (!s) return { ok: false, grund: `Unbekannter Schlüssel ${sig.schluessel}` };
  if (!s.zweck.includes(zweck)) return { ok: false, grund: `Schlüssel ${s.id} nicht für ${zweck} freigegeben` };
  const tag = jetzt.toISOString().slice(0, 10);
  if (s.gueltig_ab && tag < s.gueltig_ab) return { ok: false, grund: `Schlüssel ${s.id} noch nicht gültig` };
  if (s.gueltig_bis && tag > s.gueltig_bis) return { ok: false, grund: `Schlüssel ${s.id} abgelaufen` };
  let signatur;
  try { signatur = Buffer.from(sig.signatur, "base64"); } catch { return { ok: false, grund: "Signatur nicht lesbar" }; }
  if (signatur.length !== 64) return { ok: false, grund: "Signatur hat falsche Länge" };
  const ok = verify(null, bytes, oeffentlichAusRoh(s.oeffentlich), signatur);
  return ok ? { ok: true, schluessel: s.id } : { ok: false, grund: "Signatur passt nicht zum Inhalt" };
}

// ---------- Prüfsummen ----------

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Hasht eine Datei am Stück und – wenn gewünscht – in Teilen fester Größe. Streamt, lädt nie alles in den Speicher. */
export function hashDatei(pfad, teilgroesse = 0) {
  return new Promise((resolve, reject) => {
    const ganz = createHash("sha256");
    const teile = [];
    let teil = teilgroesse ? createHash("sha256") : null;
    let imTeil = 0;
    let groesse = 0;
    createReadStream(pfad, { highWaterMark: 4 * 1024 * 1024 })
      .on("data", (buf) => {
        ganz.update(buf);
        groesse += buf.length;
        if (!teil) return;
        let off = 0;
        while (off < buf.length) {
          const n = Math.min(buf.length - off, teilgroesse - imTeil);
          teil.update(buf.subarray(off, off + n));
          off += n; imTeil += n;
          if (imTeil === teilgroesse) { teile.push(teil.digest("hex")); teil = createHash("sha256"); imTeil = 0; }
        }
      })
      .on("end", () => {
        if (teil && imTeil > 0) teile.push(teil.digest("hex"));
        const e = { sha256: ganz.digest("hex"), groesse };
        if (teilgroesse) { e.teilgroesse = teilgroesse; e.teile = teile; }
        resolve(e);
      })
      .on("error", reject);
  });
}

// ---------- Manifest ----------

async function dateienRekursiv(wurzel, rel = "") {
  const aus = [];
  const eintraege = await readdir(path.join(wurzel, rel), { withFileTypes: true });
  for (const e of eintraege.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    if (e.name.startsWith(".")) continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) aus.push(...(await dateienRekursiv(wurzel, r)));
    else if (e.isFile()) aus.push(r);
  }
  return aus;
}

/**
 * Baut aus einem Quellordner (paket.quelle.json + inhalt/) einen fertigen, signierten Paketordner.
 * Gibt den Zielpfad und das Manifest zurück.
 */
export async function paketBauen(quelle, zielWurzel, privat, { jetzt = new Date(), teilgroesse = TEILGROESSE_STANDARD, teileAb = TEILE_AB } = {}) {
  const meta = JSON.parse(await readFile(path.join(quelle, "paket.quelle.json"), "utf8"));
  if (!ID_MUSTER.test(meta.id ?? "")) throw new Error("paket.quelle.json: id ungültig");
  const version = meta.version ?? jetzt.toISOString().slice(0, 10).replaceAll("-", ".");
  const ziel = path.join(zielWurzel, `${meta.id}-${version}`);
  await mkdir(path.join(ziel, "inhalt"), { recursive: true });

  const dateien = [];
  for (const rel of await dateienRekursiv(path.join(quelle, "inhalt"))) {
    const von = path.join(quelle, "inhalt", rel);
    const nach = path.join(ziel, "inhalt", rel);
    await mkdir(path.dirname(nach), { recursive: true });
    await copyFile(von, nach);
    const s = await stat(nach);
    const h = await hashDatei(nach, s.size >= teileAb ? teilgroesse : 0);
    dateien.push({ pfad: `inhalt/${rel}`, ...h });
  }

  const manifest = {
    format: FORMAT,
    id: meta.id,
    version,
    titel: meta.titel,
    beschreibung: meta.beschreibung,
    art: meta.art,
    sprache: meta.sprache ?? "de-AT",
    lizenz: meta.lizenz,
    herausgeber: meta.herausgeber,
    pro: Boolean(meta.pro),
    app_min: meta.app_min ?? "0.1.0",
    erstellt: jetzt.toISOString().replace(/\.\d{3}Z$/, "Z"),
    aenderungen: meta.aenderungen ?? "",
    quellen: meta.quellen ?? [],
    dateien,
    groesse: dateien.reduce((s, d) => s + d.groesse, 0),
  };
  const fehler = manifestPruefenStruktur(manifest);
  if (fehler.length) throw new Error("Manifest ungültig:\n  " + fehler.join("\n  "));

  const bytes = Buffer.from(JSON.stringify(manifest, null, 2) + "\n");
  await writeFile(path.join(ziel, "paket.json"), bytes);
  await writeFile(path.join(ziel, "paket.sig"), JSON.stringify(signiere(bytes, privat), null, 2) + "\n");
  return { ziel, manifest };
}

/** Prüft einen Paketordner vollständig – genau die Schritte, die die App vor dem Einspielen macht. */
export async function paketPruefen(ordner, bekannte, { jetzt = new Date() } = {}) {
  const fehler = [];
  let bytes, sig;
  try { bytes = await readFile(path.join(ordner, "paket.json")); } catch { return { ok: false, fehler: ["paket.json fehlt"] }; }
  try { sig = JSON.parse(await readFile(path.join(ordner, "paket.sig"), "utf8")); } catch { return { ok: false, fehler: ["paket.sig fehlt oder unlesbar"] }; }

  const s = pruefeSignatur(bytes, sig, bekannte, { zweck: "pakete", jetzt });
  if (!s.ok) return { ok: false, fehler: [`Signatur: ${s.grund}`] };

  let m;
  try { m = JSON.parse(bytes.toString("utf8")); } catch { return { ok: false, fehler: ["paket.json ist kein gültiges JSON"] }; }
  fehler.push(...manifestPruefenStruktur(m));
  if (fehler.length) return { ok: false, fehler, manifest: m };

  for (const d of m.dateien) {
    const p = path.join(ordner, ...d.pfad.split("/"));
    let st;
    try { st = await stat(p); } catch { fehler.push(`Datei fehlt: ${d.pfad}`); continue; }
    if (st.size !== d.groesse) { fehler.push(`Größe falsch: ${d.pfad} (${st.size} statt ${d.groesse})`); continue; }
    const h = await hashDatei(p, d.teilgroesse ?? 0);
    if (h.sha256 !== d.sha256) fehler.push(`Prüfsumme falsch: ${d.pfad}`);
    if (d.teile && d.teile.some((t, i) => t !== h.teile[i])) fehler.push(`Teil-Prüfsumme falsch: ${d.pfad}`);
  }
  return { ok: fehler.length === 0, fehler, manifest: m, schluessel: s.schluessel };
}

// ---------- Delta ----------

// ---------- Katalog ----------

export async function katalogBauen(paketOrdner, { basis, geplant = [], gueltigTage = 90, jetzt = new Date(), bekannte, privat }) {
  const pakete = [];
  for (const ordner of paketOrdner) {
    const p = await paketPruefen(ordner, bekannte, { jetzt });
    if (!p.ok) throw new Error(`${ordner}: ${p.fehler.join("; ")}`);
    const m = p.manifest;
    const bytes = await readFile(path.join(ordner, "paket.json"));
    pakete.push({
      id: m.id, version: m.version, titel: m.titel, beschreibung: m.beschreibung, art: m.art, pro: m.pro,
      groesse: m.groesse, app_min: m.app_min, erstellt: m.erstellt, aenderungen: m.aenderungen,
      pfad: `${path.basename(ordner)}/`, sha256_manifest: sha256(bytes), status: "verfuegbar",
    });
  }
  for (const g of geplant) pakete.push({ ...g, status: "geplant" });
  const ids = pakete.map((p) => p.id);
  if (new Set(ids).size !== ids.length) throw new Error("Katalog: doppelte Paket-IDs");

  const katalog = {
    format: FORMAT,
    erstellt: jetzt.toISOString().replace(/\.\d{3}Z$/, "Z"),
    gueltig_bis: new Date(jetzt.getTime() + gueltigTage * 864e5).toISOString().replace(/\.\d{3}Z$/, "Z"),
    basis,
    pakete,
  };
  const bytes = Buffer.from(JSON.stringify(katalog, null, 2) + "\n");
  return { katalog, bytes, sig: signiere(bytes, privat) };
}

export function katalogPruefen(bytes, sig, bekannte, { jetzt = new Date(), zuletztErstellt = null } = {}) {
  const s = pruefeSignatur(bytes, sig, bekannte, { zweck: "katalog", jetzt });
  if (!s.ok) return { ok: false, grund: `Signatur: ${s.grund}` };
  let k;
  try { k = JSON.parse(bytes.toString("utf8")); } catch { return { ok: false, grund: "Katalog ist kein gültiges JSON" }; }
  if (k.format !== FORMAT) return { ok: false, grund: `Katalogformat ${k.format} unbekannt` };
  if (zuletztErstellt && k.erstellt < zuletztErstellt) return { ok: false, grund: "Katalog ist älter als der zuletzt gesehene (Rollback?)" };
  const veraltet = k.gueltig_bis && k.gueltig_bis < jetzt.toISOString();
  return { ok: true, katalog: k, veraltet };
}
