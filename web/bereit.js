// Bereit-Modul, Version 2: eine Zahl 0–100 aus vier Quellen (Gesamtkonzept Kapitel 4). Reine Rechnung, keine Oberfläche,
// kein Speicher – läuft gleich in der Desktop-App, im Web-Prototyp und in Tests (web/bereit.test.mjs).
// Jede Position verfällt einzeln und sinkt nach Ablauf über drei Monate langsam auf null.
// Die Lumi (wesen.js) liest nur die Zahl und die Liste der fälligen Positionen.

export const VERSION = 2;

// Die vier Quellen. Die Gewichte stehen nur hier; sie sind ein Vorschlag zum Durchrechnen (Kapitel 4).
export const QUELLEN = [
  { id: "inhalte", titel: "Inhalte", gewicht: 20, ziel: "#bibliothek" },
  { id: "dinge", titel: "Dinge", gewicht: 35, ziel: "#vorsorge" },
  { id: "menschen", titel: "Menschen", gewicht: 25, ziel: "#start" },
  { id: "koennen", titel: "Können", gewicht: 20, ziel: "#start" },
];

// Positionen. `check`: Punkt der Vorsorge-Checkliste im Österreich-Paket (Gruppe-Punkt). `auto`: liest die App vom Gerät.
// Alle anderen bestätigt man auf der Übersicht. `verfall` in Monaten: so lange zählt eine Bestätigung voll.
// `gewicht` relativ innerhalb der Quelle (Standard 1). Fristen aus Kapitel 4: Wasser 12, Batterien 24, Kontakte 6 (Treffpunkt und Anlaufstelle 12, Festlegung Bill 29.09.), Können 12;
// die übrigen Fristen sind ein Vorschlag (Bereit-Patch der Lumis-Session).
export const POSITIONEN = [
  // Inhalte: Pakete geladen, Vorrat an Wissen gefüllt
  { id: "paket", quelle: "inhalte", titel: "Österreich-Paket auf dem Gerät", auto: "paket", gewicht: 2 },
  { id: "paket-aktuell", quelle: "inhalte", titel: "Österreich-Paket nicht älter als sechs Monate", auto: "paket", verfall: 6 },
  { id: "wissen", quelle: "inhalte", titel: "Wissen ohne Netz (Wikipedia, Wikivoyage …)", auto: "wissen" },
  { id: "karte", quelle: "inhalte", titel: "Karte ohne Netz", auto: "karte" },

  // Dinge (Vorsorge-Checkliste)
  { id: "c-0-0", check: "0-0", quelle: "dinge", titel: "Trinkwasser für 14 Tage", verfall: 12, gewicht: 3 },
  { id: "c-0-1", check: "0-1", quelle: "dinge", titel: "Haltbare Lebensmittel", verfall: 12, gewicht: 2 },
  { id: "c-0-2", check: "0-2", quelle: "dinge", titel: "Essen für Haustiere und Babynahrung", verfall: 12, gewicht: 0.5 },
  { id: "c-0-3", check: "0-3", quelle: "dinge", titel: "Campingkocher mit Brennstoff", verfall: 24 },
  { id: "c-0-4", check: "0-4", quelle: "dinge", titel: "Dosenöffner, Feuerzeug, Streichhölzer", verfall: 24, gewicht: 0.5 },
  { id: "c-1-0", check: "1-0", quelle: "dinge", titel: "Radio mit Batterie oder Kurbel", verfall: 24, gewicht: 2 },
  { id: "c-1-1", check: "1-1", quelle: "dinge", titel: "Taschenlampen und Ersatzbatterien", verfall: 24, gewicht: 2 },
  { id: "c-1-2", check: "1-2", quelle: "dinge", titel: "Geladene Powerbanks", verfall: 6 },
  { id: "c-1-3", check: "1-3", quelle: "dinge", titel: "Kerzen, Zünder, Löschdecke", verfall: 24, gewicht: 0.5 },
  { id: "c-1-4", check: "1-4", quelle: "dinge", titel: "Warme Decken und Kleidung", verfall: 24, gewicht: 0.5 },
  { id: "c-2-0", check: "2-0", quelle: "dinge", titel: "Hausapotheke und Erste-Hilfe-Set", verfall: 24 },
  { id: "c-2-1", check: "2-1", quelle: "dinge", titel: "Dauermedikamente für 14 Tage", verfall: 6, gewicht: 2 },
  { id: "c-2-2", check: "2-2", quelle: "dinge", titel: "Hygieneartikel, Müllsäcke, Toilettenpapier", verfall: 24, gewicht: 0.5 },
  { id: "c-2-3", check: "2-3", quelle: "dinge", titel: "Wasser für die Toilettenspülung", verfall: 12, gewicht: 0.5 },
  { id: "c-2-4", check: "2-4", quelle: "dinge", titel: "Desinfektionsmittel, Handschuhe, Masken", verfall: 24, gewicht: 0.5 },
  { id: "c-3-0", check: "3-0", quelle: "dinge", titel: "Bargeld in kleinen Scheinen", verfall: 12, gewicht: 1.5 },
  { id: "c-3-1", check: "3-1", quelle: "dinge", titel: "Dokumentenmappe", verfall: 24 },
  { id: "c-3-4", check: "3-4", quelle: "dinge", titel: "Tank mindestens halb voll", verfall: 3, gewicht: 0.5 },

  // Menschen: Familiengruppe, Treffpunkt, Nachbarn, Anlaufstellen, Notfallmappe
  { id: "familie", quelle: "menschen", titel: "Familiengruppe: wer wen im Notfall anruft", verfall: 6, gewicht: 2, hinweis: "Einmal durchsprechen, wer wen erreicht, wenn das Handynetz wackelt." },
  { id: "c-3-2", check: "3-2", quelle: "menschen", titel: "Treffpunkt mit der Familie vereinbart", verfall: 12, gewicht: 2 },
  { id: "c-3-3", check: "3-3", quelle: "menschen", titel: "Wichtige Nummern auf Papier", verfall: 6 },
  { id: "nachbar", quelle: "menschen", titel: "Einen Nachbarn, den ich im Notfall fragen kann", verfall: 6, hinweis: "Einmal anläuten und Nummern tauschen." },
  { id: "anlaufstelle", quelle: "menschen", titel: "Ich weiß, wo die Anlaufstelle meiner Gemeinde ist", verfall: 12, hinweis: "Die Gemeinde nennt sie auf ihrer Seite oder am Amt." },
  { id: "notfallmappe", quelle: "menschen", titel: "Notfallmappe im Tresor", auto: "notfallmappe", gewicht: 2 },

  // Können
  { id: "kocher", quelle: "koennen", titel: "Campingkocher einmal angezündet", verfall: 12, hinweis: "Im Freien, einmal Wasser kochen." },
  { id: "radio", quelle: "koennen", titel: "Radio getestet und den Sender des Österreichischen Rundfunks (ORF) gefunden", verfall: 12, hinweis: "Ö3 oder Radio Wien einstellen, Frequenz unter Werkzeuge eintragen." },
  { id: "probeabend", quelle: "koennen", titel: "Probeabend ohne Strom gemacht", verfall: 12, gewicht: 2, fest: true, hinweis: "Ein Abend mit Sicherung aus. Danach weißt du, was fehlt." },
];

// Nach Ablauf sinkt eine Position über diese Zeit langsam auf null, statt sofort zu fallen.
export const AUSKLANG_MONATE = 3;
const TAG = 86400000;
const MONAT = 30.44 * TAG;

/** Wert einer Position zwischen 0 und 1 und ihr Stand: offen, gut oder fällig. */
export function positionWert(pos, datum, jetzt = Date.now()) {
  if (!datum) return { wert: 0, stand: "offen" };
  const t = typeof datum === "number" ? datum : Date.parse(datum);
  if (!Number.isFinite(t)) return { wert: 0, stand: "offen" };
  if (!pos.verfall) return { wert: 1, stand: "gut" };
  const ablauf = t + pos.verfall * MONAT;
  const rest = Math.ceil((ablauf - jetzt) / TAG);
  if (jetzt <= ablauf) return { wert: 1, stand: "gut", ablauf, rest };
  return { wert: Math.max(0, 1 - (jetzt - ablauf) / (AUSKLANG_MONATE * MONAT)), stand: "faellig", ablauf, rest };
}

/**
 * Datum, ab dem eine Position gilt. `undefined` heißt: gibt es auf diesem Gerät nicht (zählt dann nicht mit).
 * daten = { checks: { "0-0": true }, bestaetigt: { positionId: ISO }, geraet: { paketErstellt, arten: [], notfallmappe } }
 * `geraet.notfallmappe` fehlt im Web-Prototyp (kein Tresor), dann zählt die Position dort nicht.
 */
export function datumFuer(pos, { checks = {}, bestaetigt = {}, geraet = {} } = {}, jetzt = Date.now()) {
  if (pos.auto === "paket") return geraet.paketErstellt ?? null;
  if (pos.auto === "wissen") return (geraet.arten ?? []).includes("zim") ? jetzt : null;
  if (pos.auto === "karte") return (geraet.arten ?? []).includes("karte") ? jetzt : null;
  if (pos.auto === "notfallmappe") return geraet.notfallmappe === undefined ? undefined : geraet.notfallmappe ? jetzt : null;
  if (pos.check && !checks[pos.check]) return null; // abgehakt und bestätigt: beides nötig
  return bestaetigt[pos.id] ?? null;
}

/**
 * Die ganze Rechnung. Gibt { version, wert, quellen, positionen, faellig, verfallen, hinweis, sockel } zurück.
 * `daten.sockel` ({ wert, am }): Übergang von Version 1, siehe sockelWert. `sockel` im Ergebnis ist true, solange er trägt.
 */
export function berechne(daten = {}, jetzt = Date.now()) {
  const alle = [];
  const quellen = QUELLEN.map((q) => {
    const pos = POSITIONEN.filter((p) => p.quelle === q.id)
      .map((p) => ({ p, d: datumFuer(p, daten, jetzt) }))
      .filter(({ d }) => d !== undefined)
      .map(({ p, d }) => ({ ...p, ...positionWert(p, d, jetzt), datum: d ?? null }));
    alle.push(...pos);
    const summe = pos.reduce((s, p) => s + (p.gewicht ?? 1), 0);
    const erreicht = pos.reduce((s, p) => s + (p.gewicht ?? 1) * p.wert, 0);
    const anteil = summe ? erreicht / summe : 0;
    const gut = pos.filter((p) => p.stand === "gut").length;
    return { ...q, name: q.titel, anteil, roh: anteil * q.gewicht, punkte: Math.round(anteil * q.gewicht), max: q.gewicht, text: `${gut} von ${pos.length}`, positionen: pos };
  });
  const eigen = Math.max(0, Math.min(100, Math.round(quellen.reduce((s, q) => s + q.roh, 0))));
  const boden = sockelWert(daten.sockel, jetzt);
  const wert = Math.max(eigen, boden);
  const faellig = alle.filter((p) => p.stand === "faellig" && !p.auto).sort((a, b) => a.ablauf - b.ablauf);
  return { version: VERSION, wert, eigen, sockel: boden > eigen, quellen, positionen: alle, faellig, verfallen: faellig, hinweis: hinweis(wert, daten, jetzt) };
}

// Übergang von Version 1: Version 2 zählt Dinge, die es vorher nicht gab (Familiengruppe, Nachbar, Anlaufstelle, Kocher).
// Damit die Zahl beim Update nicht fällt, gilt der alte Wert nach dem Update drei Monate als Untergrenze und klingt dann
// über drei Monate aus. Wer in der Zeit die neuen Punkte bestätigt, liegt ohnehin darüber.
export const SOCKEL_MONATE = 3;
export function sockelWert(sockel, jetzt = Date.now()) {
  const t = Date.parse(sockel?.am ?? "");
  if (!Number.isFinite(t) || !(sockel.wert > 0)) return 0;
  const alter = (jetzt - t) / MONAT;
  if (alter <= SOCKEL_MONATE) return Math.min(100, Math.round(sockel.wert));
  return Math.max(0, Math.round(Math.min(100, sockel.wert) * (1 - (alter - SOCKEL_MONATE) / AUSKLANG_MONATE)));
}

// Die Rechnung von Version 1 (App bis 0.1.8), nur noch für den Sockel beim Update.
const V1_BESTAETIGUNGEN = { wasser: 6, licht: 12, medikamente: 6, radio: 12, probeabend: 12 }; // Monate, je 6 Punkte
export function wertV1({ erledigt = 0, gesamt = 0, notfallmappe = false, arten = [], bestaetigungenV1 = {} } = {}, jetzt = Date.now()) {
  const liste = gesamt ? Math.round((erledigt / gesamt) * 40) : 0;
  const wissen = ["inhalt", "zim", "karte"].filter((a) => arten.includes(a)).length * 5;
  let best = 0;
  for (const [id, monate] of Object.entries(V1_BESTAETIGUNGEN)) {
    const t = Date.parse(bestaetigungenV1[id] ?? "");
    if (Number.isFinite(t) && t + monate * 30.4375 * TAG > jetzt) best += 6;
  }
  return Math.max(0, Math.min(100, liste + (notfallmappe ? 15 : 0) + wissen + best));
}

// „Das ist verdächtig gut“: über 95 ohne Probeabend in den letzten drei Monaten.
function hinweis(wert, daten, jetzt) {
  if (wert <= 95) return null;
  const pa = daten.bestaetigt?.probeabend ? Date.parse(daten.bestaetigt.probeabend) : 0;
  if (jetzt - pa < 3 * MONAT) return null;
  return "Das ist verdächtig gut. Wann war dein letzter Probeabend?";
}

/** Die Stufen, an denen die Lumi ihren Zustand wechselt. Einzige Stelle dafür, wesen.js nutzt sie auch. */
export function stufe(wert) {
  if (wert < 30) return "liegt";
  if (wert < 60) return "sitzt";
  if (wert < 80) return "wandert";
  return "baut";
}

/** Ein Satz für die Karte auf der Übersicht: was als Nächstes am meisten bringt. */
export function naechsterSchritt(b) {
  if (b.faellig.length) return { text: `${b.faellig[0].titel}: bitte bestätigen.`, ziel: b.faellig[0].check ? "#vorsorge" : "#start", id: b.faellig[0].id };
  if (b.hinweis) return { text: b.hinweis, ziel: "#start", id: "probeabend" };
  const offen = b.quellen.filter((q) => q.roh < q.gewicht - 0.01).sort((a, c) => (c.gewicht - c.roh) - (a.gewicht - a.roh));
  if (!offen.length) return { text: "Alles bereit. Wer zählt schon.", ziel: "#start" };
  const texte = { inhalte: "Ein Wissenspaket in die Bibliothek laden.", dinge: "Ein Punkt auf der Checkliste bringt am meisten.", menschen: "Mit Familie und Nachbarn etwas ausmachen.", koennen: "Einmal etwas ausprobieren: Kocher, Radio, Probeabend." };
  return { text: texte[offen[0].id], ziel: offen[0].ziel };
}

// Version 1 speicherte Bestätigungen unter diesen Namen. Beim Update werden sie übernommen.
export const V1_ZUORDNUNG = { wasser: "c-0-0", licht: "c-1-1", medikamente: "c-2-1", radio: "radio", probeabend: "probeabend" };

/**
 * Übertragung von Version 1: Bestätigungen behalten ihr Datum, alte Häkchen ohne Datum gelten ab heute.
 * Überschreibt nichts, was in Version 2 schon steht. Damit verliert beim Update niemand eine Bestätigung.
 */
export function uebertragen({ checks = {}, bestaetigungenV1 = {} } = {}, bestaetigt = {}, jetzt = Date.now()) {
  const neu = { ...bestaetigt };
  const heute = new Date(jetzt).toISOString();
  for (const [alt, id] of Object.entries(V1_ZUORDNUNG)) {
    const d = bestaetigungenV1[alt];
    if (d && !neu[id]) neu[id] = d;
  }
  for (const p of POSITIONEN) if (p.check && checks[p.check] && !neu[p.id]) neu[p.id] = heute;
  return neu;
}
