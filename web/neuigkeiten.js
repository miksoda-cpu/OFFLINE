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
