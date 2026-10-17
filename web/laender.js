// Land beim ersten Start (Nr. 28, DACH-Start; Entscheidung Mik 14.10.2026). Österreich hat alle Inhalte im Österreich-Paket.
// Deutschland und die Schweiz zeigen in 0.9.0 nur ihre Notrufnummern; Szenarien, Radio, Sirenen und Bundesland/Kanton
// kommen mit dem Paket des Landes. Nur Logik und die Nummern, keine Oberfläche (die steht in app.js).
//
// Quellen der Nummern (Stand 14.10.2026):
//   Deutschland: 112 Bundesamt für Bevölkerungsschutz und Katastrophenhilfe (BBK), „Erste Hilfe und Notruf“,
//                110 Polizeiliche Kriminalprävention (polizei-beratung.de), 116 117 Kassenärztliche Bundesvereinigung (116117.de)
//   Schweiz:     ch.ch, „Notfallnummern“ (112, 117, 118, 144, 145)

import { ausschreiben } from "./abkuerzungen.js";

export const LAENDER = {
  at: { name: "Österreich", paket: "Österreich-Paket" },
  de: {
    name: "Deutschland", paket: "Paket für Deutschland", region: "Bundesland",
    notrufe: [
      { nr: "112", name: "Feuerwehr und Rettungsdienst", info: "Europaweiter Notruf, kostenlos, auch vom Handy." },
      { nr: "110", name: "Polizei", info: "Bei Gefahr, Unfall mit Verletzten, Straftaten." },
      { nr: "116 117", name: "Ärztlicher Bereitschaftsdienst", info: "Wenn die Praxis zu hat und es kein Notfall für die 112 ist." },
    ],
    hinweis: "Bei Lebensgefahr immer 112.",
    capital: [52.52, 13.405],
  },
  ch: {
    name: "Schweiz", paket: "Paket für die Schweiz", region: "Kanton",
    notrufe: [
      { nr: "112", name: "Europäischer Notruf", info: "Verbindet mit der Polizei, auch mit ausländischer SIM-Karte." },
      { nr: "117", name: "Polizei", info: "Bei Gefahr, Unfall, Straftaten." },
      { nr: "118", name: "Feuerwehr", info: "Bei Brand, Rauch, Explosion." },
      { nr: "144", name: "Sanität", info: "Rettungsdienst bei Unfall und schwerer Krankheit." },
      { nr: "145", name: "Vergiftungen", info: "Tox Info Suisse, rund um die Uhr." },
    ],
    hinweis: "Im Zweifel 112.",
    capital: [46.948, 7.447],
  },
};
/** Grau und nicht wählbar (Nr. 28). */
export const SPAETER = "Liechtenstein, Italien (Südtirol) und weitere – kommen später";

/** „Kommt mit dem Paket für Deutschland/die Schweiz“ – für Szenarien, Radio, Sirenen, Bundesland/Kanton. */
export const kommtMit = (land) => `Kommt mit dem ${LAENDER[land]?.paket ?? "Paket deines Landes"}.`;

/**
 * Welches Land gilt? gespeichert: das gespeicherte Land (oder null), schluessel: alle Schlüssel im Gerätespeicher vor dem
 * ersten Schreiben dieser Version. Wer schon Daten hat (langjähriger Benutzer), wird nicht gefragt und bleibt bei Österreich.
 * Gibt { land, fragen } zurück.
 */
export function landBestimmen(gespeichert, schluessel = []) {
  if (gespeichert in LAENDER) return { land: gespeichert, fragen: false };
  const daten = schluessel.some((k) => k.startsWith("offline:") && k !== "offline:land");
  return daten ? { land: "at", fragen: false } : { land: null, fragen: true };
}

/** Kurzzeile der Kachel „Notfall“ auf Bereit (Nachbesserung Nr. 28): die Nummern des Landes, „Sirenen“ nur in Österreich. */
export const NOTFALL_KURZ = { at: "112 · 122 · 133 · 144, Sirenen", de: "112 · 110 · 116 117", ch: "112 · 117 · 118 · 144 · 145" };

/**
 * Sätze aus dem Österreich-Paket und aus Bereit, die in Deutschland und der Schweiz neutral stehen (Nachbesserung Nr. 28,
 * Wortlaut von Bill). Das Paket bleibt unverändert, an seinen Kennungen hängen die Häkchen; ersetzt wird nur beim Anzeigen.
 * null: Satz entfällt.
 */
const NEUTRAL_ROH = [
  ["Radio mit Batterie oder Kurbel – im Krisenfall informiert der ORF", "Radio mit Batterie oder Kurbel – im Krisenfall informiert dein öffentlich-rechtlicher Sender"],
  ["Radio getestet und den Sender des Österreichischen Rundfunks (ORF) gefunden", "Radio getestet und einen Sender für Krisenfälle gefunden"],
  ["Ö3 oder Radio Wien einstellen, Frequenz unter Notfall bei „Deine Frequenzen“ eintragen.", null],
  // Grundvorsorge „Notruf ohne Sprechen“: die österreichische Nummer (0800 133 133) und DEC112 gelten dort nicht
  ["Polizei per SMS oder Fax: 0800 133 133. Daneben gibt es den offiziellen Notruf-Chat DEC112. Stift und Papier helfen mit Einsatzkräften.",
    "Wie du ohne Sprechen einen Notruf absetzt, kommt mit dem Paket deines Landes. Stift und Papier helfen mit Einsatzkräften."],
];
// Die App schreibt Abkürzungen beim Laden aus (Textregel); beide Fassungen werden erkannt
const NEUTRAL = new Map(NEUTRAL_ROH.flatMap(([a, b]) => [[a, b], [ausschreiben(a), b && ausschreiben(b)]]));
/** Ein Text, wie er im Land erscheint. */
export const fuerLand = (text, land) => (land === "at" || typeof text !== "string" || !NEUTRAL.has(text) ? text : NEUTRAL.get(text));
/** Alle Texte eines Objekts (z. B. die Grundvorsorge), Kennungen und Aufbau bleiben. */
export function fuerLandTief(o, land) {
  if (land === "at" || o == null) return o;
  if (typeof o === "string") return fuerLand(o, land);
  if (Array.isArray(o)) return o.map((x) => fuerLandTief(x, land));
  if (typeof o === "object") return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fuerLandTief(v, land)]));
  return o;
}
