// OFFLINE-Paketformat – reiner Kern ohne Node-Abhängigkeiten.
// Läuft im Werkzeug (Node), im Web-Prototyp (Browser) und ist die Vorlage für den Rust-Kern der App.
// Wird beim Bauen nach web/paket-kern.js kopiert – dort nicht von Hand ändern.

export const FORMAT = 1;
export const TEILGROESSE_STANDARD = 64 * 1024 * 1024; // 64 MB
export const TEILE_AB = 256 * 1024 * 1024; // ab 256 MB werden Dateien geteilt
export const ARTEN = ["inhalt", "zim", "karte", "modell", "kurs", "software"];
export const ID_MUSTER = /^[a-z0-9-]{2,40}$/;
const VERSION_MUSTER = /^\d{4}\.\d{2}\.\d{2}(\.\d+)?$/;

export function pfadGueltig(p) {
  if (typeof p !== "string" || !p.startsWith("inhalt/") || p.endsWith("/")) return false;
  if (p.includes("\\") || p.includes("\0") || /[\x00-\x1f]/.test(p)) return false;
  const teile = p.split("/");
  return teile.every((t) => t !== "" && t !== "." && t !== "..") && !/^[a-zA-Z]:/.test(p);
}

export function versionVergleich(a, b) {
  const A = a.split(".").map(Number), B = b.split(".").map(Number);
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const x = A[i] ?? 0, y = B[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

export function manifestPruefenStruktur(m) {
  const f = [];
  if (m.format !== FORMAT) f.push(`format ${m.format} wird nicht unterstützt (erwartet ${FORMAT})`);
  if (!ID_MUSTER.test(m.id ?? "")) f.push("id ungültig");
  if (!VERSION_MUSTER.test(m.version ?? "")) f.push("version ungültig (JJJJ.MM.TT oder JJJJ.MM.TT.N)");
  for (const k of ["titel", "beschreibung", "sprache", "lizenz", "herausgeber", "app_min", "erstellt"]) if (typeof m[k] !== "string" || !m[k]) f.push(`${k} fehlt`);
  if (!ARTEN.includes(m.art)) f.push(`art ungültig (${ARTEN.join(", ")})`);
  if (typeof m.pro !== "boolean") f.push("pro fehlt");
  if (!Array.isArray(m.quellen)) f.push("quellen fehlt");
  if (!Array.isArray(m.dateien) || m.dateien.length === 0) { f.push("dateien fehlt oder leer"); return f; }
  const gesehen = new Set();
  let summe = 0;
  for (const d of m.dateien) {
    if (!pfadGueltig(d.pfad)) f.push(`Pfad unzulässig: ${JSON.stringify(d.pfad)}`);
    if (gesehen.has(d.pfad)) f.push(`Pfad doppelt: ${d.pfad}`);
    gesehen.add(d.pfad);
    if (!Number.isInteger(d.groesse) || d.groesse < 0) f.push(`groesse ungültig: ${d.pfad}`);
    if (!/^[0-9a-f]{64}$/.test(d.sha256 ?? "")) f.push(`sha256 ungültig: ${d.pfad}`);
    if (d.groesse >= TEILE_AB && !d.teile) f.push(`Datei über 256 MB braucht Teile: ${d.pfad}`);
    if (d.teile) {
      if (!Number.isInteger(d.teilgroesse) || d.teilgroesse <= 0) f.push(`teilgroesse ungültig: ${d.pfad}`);
      else if (d.teile.length !== Math.ceil(d.groesse / d.teilgroesse)) f.push(`Anzahl Teile passt nicht zur Größe: ${d.pfad}`);
      if (!d.teile.every((t) => /^[0-9a-f]{64}$/.test(t))) f.push(`Teil-Prüfsumme ungültig: ${d.pfad}`);
    }
    summe += d.groesse || 0;
  }
  if (m.groesse !== summe) f.push(`groesse (${m.groesse}) ist nicht die Summe der Dateien (${summe})`);
  return f;
}

/** Was muss ein Update von `alt` auf `neu` laden? alt darf null sein (Neuinstallation). */
export function delta(alt, neu) {
  const vorher = new Map((alt?.dateien ?? []).map((d) => [d.pfad, d]));
  const laden = [];
  let bytes = 0;
  for (const d of neu.dateien) {
    const a = vorher.get(d.pfad);
    if (a && a.sha256 === d.sha256) continue;
    if (d.teile && a?.teile && a.teilgroesse === d.teilgroesse) {
      const teile = d.teile.map((t, i) => i).filter((i) => a.teile[i] !== d.teile[i]);
      const b = teile.reduce((s, i) => s + Math.min(d.teilgroesse, d.groesse - i * d.teilgroesse), 0);
      laden.push({ pfad: d.pfad, bytes: b, teile });
      bytes += b;
    } else {
      laden.push({ pfad: d.pfad, bytes: d.groesse });
      bytes += d.groesse;
    }
  }
  const nachher = new Set(neu.dateien.map((d) => d.pfad));
  const loeschen = [...vorher.keys()].filter((p) => !nachher.has(p));
  return { laden, loeschen, bytes, gesamt: neu.groesse };
}

