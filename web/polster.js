// „Vorräte“ (Nr. 34 als „Euer Polster“, seit Nr. 41 „Vorräte“, Wortlaut Mik 17.10.2026): wie lange der Haushalt mit Wasser und Essen auskommt. Reine Rechnung,
// keine Oberfläche, kein Speicher; die Angaben bleiben am Gerät (app.js, Schlüssel „polster“). Ohne Angst-Wörter.

export const ZIEL = 14;
export const LITER_PRO_PERSON_UND_TAG = 2; // 2 Liter je Person und Tag (Zivilschutzverband)

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

/**
 * Nr. 43 (Miks Regel, 18.10.2026): Die App sagt „du“. „Ihr/eure“ nur ab 2 Personen im Haushalt und nur in der Vorräte-Überschrift
 * und im Leer-Satz; sonst überall „du“. Personenzahl aus „Dein Haushalt“, nicht eingestellt = 1.
 */
export const anrede = (personen) => ((Number(personen) || 1) > 1 ? "ihr" : "du");
/** Überschrift „Deine/Eure Vorräte reichen für …“ und der Satz, wenn noch nichts eingetragen ist. */
export const vorraeteTitel = (tage, personen) => `${anrede(personen) === "ihr" ? "Eure" : "Deine"} Vorräte reichen für ${tageText(tage)}`;
export const vorraeteLeer = (personen) => (anrede(personen) === "ihr" ? "Tragt eure Vorräte ein – dann seht ihr, wie lange sie reichen." : "Trag deine Vorräte ein – dann siehst du, wie lange sie reichen.");

/** Ein Satz zum knappsten Teil. */
export function polsterSatz(r) {
  if (r.tage >= ZIEL) return `Die Vorräte reichen für das Ziel von ${ZIEL} Tagen.`;
  if (r.knapp === "wasser") return "Mit mehr Wasser reichen die Vorräte am längsten.";
  if (r.knapp === "essen") return "Mit mehr Essen reichen die Vorräte am längsten.";
  return "Wasser und Essen reichen gleich lang. Mit beidem reichen die Vorräte länger.";
}
export const LICHT_SATZ = "Denk auch an Licht: Taschenlampe und Batterien.";

/** Die Zeile auf Heute: mit Vorrat die Tage, bei 0 der Satz zum Wachsen. */
export function heuteZeile(r) {
  return r.tage > 0 ? { titel: vorraeteTitel(r.tage, r.personen), klein: `Wasser, Essen, Licht · Ziel ${ZIEL} Tage` } : { titel: vorraeteLeer(r.personen), knopf: "Vorräte eintragen" };
}

/**
 * Welche Punkte der Grundvorsorge das Polster erfüllt (Bereit): Trinkwasser ab 14 Wasser-Tagen, Lebensmittel ab 14 Essen-Tagen,
 * Taschenlampe bei Licht „Ja“. Gibt { checkId: true/false } zurück; app.js setzt nur, was das Polster selbst gesetzt hat, zurück.
 */
export function polsterPunkte(r) {
  return { trinkwasser: r.wasserTage >= ZIEL, lebensmittel: r.essenTage >= ZIEL, lampen: r.licht === true };
}
