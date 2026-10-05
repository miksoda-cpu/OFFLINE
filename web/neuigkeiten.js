// Was ist neu auf „Updates & Abo“ (Auftrag 2026-10-05-updates-seite, App 0.5.2): zwei Reiter, App (web/neues.json) und
// Inhalte (aenderungen im Katalog). Ein kleiner roter Punkt, solange etwas Neues nicht angesehen ist; nach dem Ansehen ist
// er weg. Keine Zahl, kein Abzeichen (Milde Zugkraft). Gespeichert wird nur, was zuletzt angesehen wurde.

/** Änderungen der Pakete aus dem Katalog, neueste zuerst. */
export function inhaltsAenderungen(katalog) {
  return (katalog?.pakete ?? []).filter((p) => p.aenderungen && p.erstellt).sort((a, b) => (a.erstellt < b.erstellt ? 1 : a.erstellt > b.erstellt ? -1 : 0));
}

/**
 * Was ist ungesehen? o: { appVersion, neuesGesehen (Version), katalog, inhalteGesehen (Zeitstempel der neuesten gesehenen
 * Paketänderung oder null) }. Ohne gespeicherten Stand bei den Inhalten gilt alles als gesehen (wer neu ist, bekommt keinen
 * Punkt für alte Einträge). Gibt { app, inhalte, irgendwas }.
 */
export function ungesehen({ appVersion, neuesGesehen, katalog, inhalteGesehen }) {
  const neueste = inhaltsAenderungen(katalog)[0]?.erstellt ?? null;
  const app = !!appVersion && neuesGesehen !== appVersion;
  const inhalte = !!neueste && inhalteGesehen != null && neueste > inhalteGesehen;
  return { app, inhalte, irgendwas: app || inhalte };
}

/** Stand nach dem Ansehen eines Reiters. Gibt die neuen Werte zum Speichern zurück. */
export function alsGesehen(reiter, { appVersion, katalog }) {
  if (reiter === "app") return { neuesGesehen: appVersion };
  return { inhalteGesehen: inhaltsAenderungen(katalog)[0]?.erstellt ?? null };
}

/** Erster Stand für die Inhalte: das, was es beim ersten Öffnen schon gibt, gilt als gesehen. */
export const inhalteStart = (katalog) => inhaltsAenderungen(katalog)[0]?.erstellt ?? "";

// ---------- Nach neuer Version suchen im Web (0.5.5, Auftrag 2026-10-05-06) ----------
// Die Web-Version fragt /version.json ab (kommt mit jeder Auslieferung, ohne Cache, der Service Worker lässt sie durch).
// Drei Fälle: gleich, neuer, ohne Netz. Still höchstens einmal am Tag beim Öffnen, nur mit Netz.

/** Vergleicht Versionsnummern wie 0.5.10 und 0.5.9 (Zahl für Zahl). */
export function versionNeuer(a, b) {
  const x = String(a ?? "").split(".").map(Number), y = String(b ?? "").split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0; }
  return false;
}

/** Fragt die Version auf dem Server ab. holen() gibt { version } oder wirft (kein Netz). Gibt { status, version, text }. */
export async function webVersionPruefen({ aktuell, holen }) {
  let server;
  try { server = (await holen())?.version; } catch { server = null; }
  if (!server) return { status: "offline", version: aktuell, text: `Gerade kein Internet. Die App läuft weiter mit ${aktuell}.` };
  if (versionNeuer(server, aktuell)) return { status: "neuer", version: server, text: `Version ${server} ist da.` };
  return { status: "gleich", version: aktuell, text: `Du hast die neueste Version (${aktuell}).` };
}

/** Still prüfen beim Öffnen: nur mit Netz und höchstens einmal am Tag (letzte = Datum JJJJ-MM-TT der letzten Prüfung). */
export const stillPruefenFaellig = ({ letzte, heute, online }) => !!online && letzte !== heute;

/** Steht eine neuere Version bereit, die noch nicht geladen ist? (gemerkt = zuletzt gefundene Serverversion) */
export const webNeuerDa = (gemerkt, aktuell) => !!gemerkt && versionNeuer(gemerkt, aktuell);
