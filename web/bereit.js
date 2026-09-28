// Bereit-Modul: eine Zahl 0–100 aus vier Quellen mit Verfall. Reine Berechnung, keine Nebenwirkungen.
// Quellen: Checkliste (40), Notfallmappe (15), Wissen ohne Netz (15), Bestätigungen mit Verfall (30).
// Das Wesen liest nur diese Zahl und die Liste der verfallenen Positionen.

export const BESTAETIGUNGEN = [
  { id: "wasser", titel: "Wasservorrat frisch", monate: 6, punkte: 6, hinweis: "2 Liter je Person und Tag für 14 Tage. Alle sechs Monate tauschen." },
  { id: "licht", titel: "Taschenlampe und Batterien geprüft", monate: 12, punkte: 6, hinweis: "Einmal im Jahr einschalten. Batterien tauschen, Kurbel drehen." },
  { id: "medikamente", titel: "Medikamente für 14 Tage", monate: 6, punkte: 6, hinweis: "Ablaufdaten prüfen, Rezepte rechtzeitig holen." },
  { id: "radio", titel: "Batterieradio getestet", monate: 12, punkte: 6, hinweis: "Ö3 einstellen, Frequenz unter Werkzeuge eintragen." },
  { id: "probeabend", titel: "Probeabend ohne Strom", monate: 12, punkte: 6, hinweis: "Ein Abend mit Sicherung aus. Danach weißt du, was fehlt.", fest: true },
];

const MONAT = 30.4375 * 86400000;

/** Zustand einer Bestätigung: { status: "offen" | "gueltig" | "verfallen", ablauf: Date|null, rest: Tage|null } */
export function bestaetigungStatus(eintrag, datumIso, jetzt = Date.now()) {
  if (!datumIso) return { status: "offen", ablauf: null, rest: null };
  const ablauf = new Date(new Date(datumIso).getTime() + eintrag.monate * MONAT);
  const rest = Math.ceil((ablauf - jetzt) / 86400000);
  return { status: rest <= 0 ? "verfallen" : "gueltig", ablauf, rest };
}

/**
 * @param {object} p
 * @param {number} p.erledigt  abgehakte Punkte der Vorsorge-Checkliste
 * @param {number} p.gesamt    Punkte der Checkliste insgesamt
 * @param {boolean} p.notfallmappe  Tresor angelegt (Desktop) bzw. Notfallmappe vorhanden
 * @param {string[]} p.arten   Paketarten der installierten Pakete (inhalt, zim, karte, …)
 * @param {object} p.bestaetigungen  { id: ISO-Datum der letzten Bestätigung }
 * @param {number} [p.jetzt]
 */
export function bereitBerechnen({ erledigt = 0, gesamt = 0, notfallmappe = false, arten = [], bestaetigungen = {}, jetzt = Date.now() }) {
  const quellen = [];
  const liste = gesamt ? Math.round((erledigt / gesamt) * 40) : 0;
  quellen.push({ id: "checkliste", name: "Vorsorge-Checkliste", punkte: liste, max: 40, text: gesamt ? `${erledigt} von ${gesamt} erledigt` : "Österreich-Paket fehlt", ziel: "#vorsorge" });
  quellen.push({ id: "notfallmappe", name: "Notfallmappe im Tresor", punkte: notfallmappe ? 15 : 0, max: 15, text: notfallmappe ? "angelegt" : "noch nicht angelegt", ziel: "#tresor" });
  const wissen = (arten.includes("inhalt") ? 5 : 0) + (arten.includes("zim") ? 5 : 0) + (arten.includes("karte") ? 5 : 0);
  quellen.push({ id: "wissen", name: "Wissen ohne Netz", punkte: wissen, max: 15, text: [arten.includes("inhalt") && "Österreich", arten.includes("zim") && "Bibliothek", arten.includes("karte") && "Karte"].filter(Boolean).join(", ") || "nichts installiert", ziel: "#bibliothek" });
  let best = 0; const verfallen = [];
  const positionen = BESTAETIGUNGEN.map((b) => {
    const s = bestaetigungStatus(b, bestaetigungen[b.id], jetzt);
    if (s.status === "gueltig") best += b.punkte;
    if (s.status === "verfallen") verfallen.push(b);
    return { ...b, ...s, datum: bestaetigungen[b.id] ?? null };
  });
  quellen.push({ id: "bestaetigungen", name: "Bestätigungen", punkte: best, max: 30, text: `${positionen.filter((x) => x.status === "gueltig").length} von ${BESTAETIGUNGEN.length} gültig${verfallen.length ? `, ${verfallen.length} verfallen` : ""}`, ziel: "#start" });
  const wert = Math.max(0, Math.min(100, quellen.reduce((s, q) => s + q.punkte, 0)));
  return { wert, quellen, positionen, verfallen };
}

/** Was als Nächstes am meisten bringt – ein Satz für das Wesen und die Karte. */
export function naechsterSchritt(b) {
  if (b.verfallen.length) return { text: `${b.verfallen[0].titel}: bitte bestätigen.`, ziel: "#start", id: b.verfallen[0].id };
  const offen = b.quellen.filter((q) => q.punkte < q.max).sort((a, c) => (c.max - c.punkte) - (a.max - a.punkte));
  if (!offen.length) return { text: "Alles bereit. Wer zählt schon.", ziel: "#start" };
  const q = offen[0];
  const texte = { checkliste: "Ein Punkt auf der Checkliste bringt am meisten.", notfallmappe: "Die Notfallmappe im Tresor fehlt noch.", wissen: "Ein Wissenspaket in die Bibliothek laden.", bestaetigungen: "Eine Bestätigung ist offen." };
  return { text: texte[q.id], ziel: q.ziel };
}
