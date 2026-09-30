// OFFLINE-Paketformat – reiner Kern ohne Node-Abhängigkeiten.
// Läuft im Werkzeug (Node), im Web-Prototyp (Browser) und ist die Vorlage für den Rust-Kern der App.
// Wird beim Bauen nach web/paket-kern.js kopiert – dort nicht von Hand ändern.

export const FORMAT = 1;
export const TEILGROESSE_STANDARD = 64 * 1024 * 1024; // 64 MB
export const TEILE_AB = 256 * 1024 * 1024; // ab 256 MB werden Dateien geteilt
export const ARTEN = ["inhalt", "zim", "karte", "modell", "kurs", "software", "modul", "skin", "tage"];
// Tagesinhalte (Vorratskammer, PAKET-KIT.md 5b): nur Daten in inhalt/tage.json (dazu Herkunft/Lizenz als .md/.txt),
// Bereich im Manifest ("tage"), ab App 0.3.0. Den Inhalt prüft paket-kit/tage-format.mjs beim Bauen und im Kit.
export const TAGE_DATEI = "inhalt/tage.json";
export const TAGE_GRENZE = 20 * 1024 * 1024;
export const TAGE_ENDUNGEN = [".json", ".md", ".txt"];
// Module (SICHERHEIT.md, Abschnitt Module): Oberfläche nur unter inhalt/modul/, höchstens 2 MB,
// nur mit dem Redaktionsschlüssel (Zweck „module“) signiert und mit pruefstatus „redaktion“.
export const MODUL_ORDNER = "inhalt/modul/";
export const MODUL_GRENZE = 2 * 1024 * 1024;
export const SKRIPT_ENDUNGEN = [".js", ".mjs"];
export const SEITEN_ENDUNGEN = [".html", ".htm", ".xhtml", ".svg"];
// Skins (Aussehen): nur Stil, Schriften, Bilder, Lizenzen, Herkunft – unter inhalt/skin/, Einstieg skin.css, höchstens 20 MB.
export const SKIN_ORDNER = "inhalt/skin/";
export const SKIN_GRENZE = 20 * 1024 * 1024;
export const SKIN_ENDUNGEN = [".css", ".woff2", ".woff", ".webp", ".png", ".jpg", ".svg", ".md", ".txt", ".json"];

/**
 * Ist dieses CSS sicher? Gibt null oder den Grund zurück. Gilt für jede .css-Datei außerhalb einer Modul-Oberfläche
 * (dort wirkt die CSP der Sandbox). Kein @import, keine url() außerhalb des Pakets, kein expression(), keine Skripte
 * über Umwege (javascript:, behavior:, -moz-binding), keine Escapes, mit denen man das Verbotene tarnen könnte.
 */
export function cssFehler(text) {
  const t = String(text);
  if (t.includes("\\")) return "Escape-Zeichen (\\) in CSS";
  if (/@import/i.test(t)) return "@import";
  if (/expression\s*\(/i.test(t)) return "expression()";
  if (/javascript:|vbscript:/i.test(t)) return "javascript:";
  if (/behavior\s*:|-moz-binding/i.test(t)) return "behavior/-moz-binding";
  for (const m of t.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
    const ziel = m[2].trim();
    if (/^data:(image|font)\/[a-z0-9.+-]+[;,]/i.test(ziel)) continue;
    if (!ziel || /^[a-z][a-z0-9+.-]*:/i.test(ziel) || ziel.startsWith("/") || ziel.split(/[/?#]/).includes("..")) return `url() außerhalb des Pakets: ${ziel.slice(0, 60)}`;
  }
  if (/image-set\(\s*['"]/i.test(t)) return "image-set() mit Adresse ohne url()";
  return null;
}
export const brauchtCssPruefung = (art, pfad) => endung(pfad) === ".css" && !codeErlaubt(art, pfad);
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

const endung = (p) => { const i = p.lastIndexOf("."); return i > p.lastIndexOf("/") ? p.slice(i).toLowerCase() : ""; };

/** Darf eine Datei an diesem Pfad Code enthalten? Nur in Modulen und nur unter inhalt/modul/. */
export function codeErlaubt(art, pfad) {
  return art === "modul" && typeof pfad === "string" && pfad.startsWith(MODUL_ORDNER);
}

/** Steht in einer Seite (HTML/SVG) Code? Grob, aber ohne Fehlalarm bei Text: Skript-Tag, Ereignis-Attribut, javascript:. */
export function seiteHatSkript(text) {
  return /<script\b|\son[a-z]+\s*=|javascript:/i.test(text);
}
export const brauchtSkriptPruefung = (art, pfad) => SEITEN_ENDUNGEN.includes(endung(pfad)) && !codeErlaubt(art, pfad);

/**
 * Passt der Schlüssel, mit dem signiert wurde, zur Paketart? Gibt null oder den Fehlertext zurück.
 * Module brauchen einen Schlüssel mit Zweck „module“, der nicht zugleich den Katalog signiert.
 * Alle anderen Pakete brauchen Zweck „pakete“.
 */
export function schluesselPasstZurArt(art, schluessel) {
  const z = schluessel?.zweck ?? [];
  if (art === "skin") {
    // Skins enthalten keinen Code; signieren darf der Paketschlüssel oder der Redaktionsschlüssel.
    return z.includes("pakete") || z.includes("module") ? null : `Schlüssel ${schluessel?.id} nicht für Skins freigegeben`;
  }
  if (art === "modul") {
    if (!z.includes("module")) return `Module nur mit dem Redaktionsschlüssel (Schlüssel ${schluessel?.id} hat nicht den Zweck module)`;
    if (z.includes("katalog")) return `Module nie mit einem Katalogschlüssel (Schlüssel ${schluessel.id})`;
    return null;
  }
  return z.includes("pakete") ? null : `Schlüssel ${schluessel?.id} nicht für pakete freigegeben`;
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
    if (SKRIPT_ENDUNGEN.includes(endung(d.pfad ?? "")) && !codeErlaubt(m.art, d.pfad)) {
      f.push(m.art === "modul" ? `Skript außerhalb von inhalt/modul/: ${d.pfad}` : `Pakete enthalten keinen Code: ${d.pfad}`);
    }
    summe += d.groesse || 0;
  }
  if (m.groesse !== summe) f.push(`groesse (${m.groesse}) ist nicht die Summe der Dateien (${summe})`);
  if (m.art === "skin") {
    if (!m.dateien.some((d) => d.pfad === SKIN_ORDNER + "skin.css")) f.push("Skin ohne inhalt/skin/skin.css");
    for (const d of m.dateien) {
      if (!d.pfad?.startsWith(SKIN_ORDNER) && !d.pfad?.startsWith("inhalt/vorschau/")) f.push(`Skin: Datei außerhalb von inhalt/skin/: ${d.pfad}`);
      else if (d.pfad.startsWith(SKIN_ORDNER) && !SKIN_ENDUNGEN.includes(endung(d.pfad))) f.push(`Skin: Dateityp nicht erlaubt: ${d.pfad}`);
    }
    if (summe > SKIN_GRENZE) f.push(`Skin zu groß (${summe} Bytes, höchstens ${SKIN_GRENZE})`);
  }
  if (m.art === "tage") {
    const t = m.tage;
    const datum = t && typeof t.von === "string" && typeof t.bis === "string" && t.von <= t.bis;
    const nummer = t && Number.isInteger(t.von_tag) && Number.isInteger(t.bis_tag) && t.von_tag >= 1 && t.von_tag <= t.bis_tag;
    if (!datum && !nummer) f.push("Tagesinhalte brauchen tage (von/bis als Datum oder von_tag/bis_tag)");
    if (!m.dateien.some((d) => d.pfad === TAGE_DATEI)) f.push("Tagesinhalte ohne inhalt/tage.json");
    for (const d of m.dateien) if (!TAGE_ENDUNGEN.includes(endung(d.pfad ?? ""))) f.push(`Tagesinhalte: Dateityp nicht erlaubt: ${d.pfad}`);
    if (summe > TAGE_GRENZE) f.push(`Tagesinhalte zu groß (${summe} Bytes, höchstens ${TAGE_GRENZE})`);
    if (versionVergleich(m.app_min || "0", "0.3.0") < 0) f.push("Tagesinhalte brauchen app_min 0.3.0 oder höher");
  }
  if ((m.art === "modul" || m.art === "skin") && versionVergleich(m.app_min || "0", "0.2.0") < 0) f.push(`${m.art === "modul" ? "Module" : "Skins"} brauchen app_min 0.2.0 oder höher (ältere Apps kennen die Art nicht)`);
  if (m.art === "modul") {
    if (m.pruefstatus !== "redaktion") f.push("Module nur mit pruefstatus redaktion");
    if (!Number.isInteger(m.datenversion) || m.datenversion < 1) f.push("Module brauchen datenversion (ganze Zahl ab 1)");
    if (!m.dateien.some((d) => d.pfad === MODUL_ORDNER + "index.html")) f.push("Modul ohne inhalt/modul/index.html");
    const oberflaeche = m.dateien.filter((d) => codeErlaubt("modul", d.pfad)).reduce((s, d) => s + (d.groesse || 0), 0);
    if (oberflaeche > MODUL_GRENZE) f.push(`Modul-Oberfläche zu groß (${oberflaeche} Bytes, höchstens ${MODUL_GRENZE})`);
  }
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

