// „Euer Polster“ (Nr. 34, Wortlaut Mik 16.10.2026): wie lange der Haushalt mit Wasser und Essen auskommt. Reine Rechnung,
// keine Oberfläche, kein Speicher; die Angaben bleiben am Gerät (app.js, Schlüssel „polster“). Ohne Angst-Wörter.

export const ZIEL = 14;
export const LITER_PRO_PERSON_UND_TAG = 2; // wie im Vorratsrechner unter Werkzeuge

const ganz = (x, min, max) => Math.min(max, Math.max(min, Math.floor(Number(x) || 0)));
/** Angaben bereinigen: Personen 1–20, Liter 0–5000, Essen-Tage 0–365, Licht true/false/null. */
export const polsterAngaben = (a = {}) => ({
  personen: ganz(a.personen ?? 1, 1, 20), liter: ganz(a.liter, 0, 5000), essen: ganz(a.essen, 0, 365),
  licht: a.licht === true ? true : a.licht === false ? false : null,
});

/** Wasser-Tage = Liter ÷ (2 Liter × Personen), abgerundet; Polster = das Kleinere aus Wasser- und Essen-Tagen. */
export function polsterRechnen(roh) {
  const a = polsterAngaben(roh);
  const wasserTage = Math.floor(a.liter / (LITER_PRO_PERSON_UND_TAG * a.personen)), essenTage = a.essen;
  const tage = Math.min(wasserTage, essenTage);
  const knapp = wasserTage < essenTage ? "wasser" : essenTage < wasserTage ? "essen" : "gleich";
  return { ...a, wasserTage, essenTage, tage, knapp };
}

export const tageText = (n) => `${n} ${n === 1 ? "Tag" : "Tage"}`;

/** Ein Satz zum knappsten Teil. */
export function polsterSatz(r) {
  if (r.tage >= ZIEL) return `Euer Polster reicht für das Ziel von ${ZIEL} Tagen.`;
  if (r.knapp === "wasser") return "Mehr Wasser bringt euer Polster am weitesten.";
  if (r.knapp === "essen") return "Mehr Essen bringt euer Polster am weitesten.";
  return "Wasser und Essen reichen gleich lang. Mit beidem wächst euer Polster.";
}
export const LICHT_SATZ = "Denk auch an Licht: Taschenlampe und Batterien.";

/** Die Zeile auf Heute: mit Vorrat die Tage, bei 0 der Satz zum Wachsen. */
export function heuteZeile(r) {
  return r.tage > 0 ? { titel: `Euer Polster: ${tageText(r.tage)}`, klein: `Wasser, Essen, Licht · Ziel ${ZIEL} Tage` } : { titel: "Euer Polster wächst mit jedem Vorrat.", knopf: "Ersten Vorrat eintragen" };
}

/**
 * Welche Punkte der Grundvorsorge das Polster erfüllt (Bereit): Trinkwasser ab 14 Wasser-Tagen, Lebensmittel ab 14 Essen-Tagen,
 * Taschenlampe bei Licht „Ja“. Gibt { checkId: true/false } zurück; app.js setzt nur, was das Polster selbst gesetzt hat, zurück.
 */
export function polsterPunkte(r) {
  return { trinkwasser: r.wasserTage >= ZIEL, lebensmittel: r.essenTage >= ZIEL, lampen: r.licht === true };
}
