// Pakete als Laden (0.7.0, Teil B; Probe „Lumi-Seite und Bibliothek als Laden“, Entscheidungen Bill 07.10.2026):
// Bereich je Paket (ersetzt die Kategorie), „immer an“ (pflicht), an/aus für alle Pakete und die drei Abschnitte der
// Bibliothek: Neu · Bald · Auf deinem Gerät. Nur Logik, keine Oberfläche (die steht in app.js).

/** Bereiche mit Anzeigenamen. Gleiche Liste in werkzeug/kern.mjs, web/paket-kern.js, paket-kit/pruefen.mjs und kern/src/manifest.rs. */
export const BEREICHE = { lumi: "Lumi", pause: "Pause", heute: "Heute", ernstfall: "Ernstfall", wissen: "Wissen", karten: "Karten", miteinander: "Miteinander", aussehen: "Aussehen" };

/**
 * Bereich der Pakete, die vor 0.7.0 erschienen sind (ihr Manifest hat noch keinen). Neue Ausgaben tragen ihn selbst
 * (paket.quelle.json, ab app_min 0.7.0); bis dahin gilt diese Zuordnung.
 */
export const BEREICH_BISHER = {
  "at-basis": "ernstfall", wir: "lumi", "lumi-buch": "lumi", "lumi-philosophie": "lumi", lumisch: "lumi", pause: "pause", "spiele-1": "pause",
  wichteln: "miteinander", naturheilkunde: "wissen", "naturheilkunde-bilder": "wissen", flechte: "aussehen",
};
const NACH_ART = { tage: "heute", karte: "karten", zim: "wissen", modell: "wissen", kurs: "wissen", skin: "aussehen", software: "wissen" };
const NACH_KATEGORIE = { ernstfall: "ernstfall", wissen: "wissen", "jeden-tag": "heute", "du-und-die-deinen": "miteinander", unterwegs: "karten", verbindung: "wissen", miteinander: "miteinander", aussehen: "aussehen" };

/** Bereich eines Katalogeintrags oder Manifests. */
export function bereichVon(p) {
  if (!p) return "wissen";
  if (p.bereich in BEREICHE) return p.bereich;
  return BEREICH_BISHER[p.id] ?? NACH_ART[p.art] ?? NACH_KATEGORIE[p.kategorie] ?? (p.art === "modul" ? "miteinander" : "wissen");
}
export const bereichName = (p) => BEREICHE[bereichVon(p)];

/** „Immer an“ (Bill, Frage 6): Österreich-Basis und der Tage-Vorrat. Ohne sie fehlen Notrufe, Vorsorge und die Tagesseite. */
export const pflicht = (p) => !!p && (p.pflicht === true || p.id === "at-basis" || p.art === "tage");

/**
 * Ist ein installiertes Paket an? aus: Liste ausgeschalteter Paket-Ids (Gerätespeicher). Module haben ihren Stand im Kern
 * (modulStand: { id: { aktiv } }). Pflichtpakete sind immer an.
 */
export function paketAn(p, { aus = [], modulStand = {} } = {}) {
  if (!p) return false;
  const m = p.manifest ?? p;
  if (pflicht(m)) return true;
  if (m.art === "modul" || m.art === "skin") return modulStand[m.id]?.aktiv ?? true;
  return !aus.includes(m.id);
}
/** An/aus umschalten (nicht bei Pflichtpaketen). Gibt die neue Liste zurück. */
export function umschalten(aus, p) {
  const m = p?.manifest ?? p;
  if (!m || pflicht(m)) return [...aus];
  return aus.includes(m.id) ? aus.filter((x) => x !== m.id) : [...aus, m.id];
}

/**
 * Die drei Abschnitte der Bibliothek. katalog: { pakete }, installiert: [Paket mit manifest].
 * - neu: verfügbar und noch nicht auf dem Gerät
 * - bald: ausdrücklich angekündigt (status „geplant“), nie ein internes Paket
 * - geraet: was auf dem Gerät liegt (mit dem Katalogeintrag, wenn es einen gibt; dann auch, ob ein Update da ist)
 * Reihenfolge je Abschnitt: nach Bereich (Reihenfolge von BEREICHE), dann Titel.
 */
export function abschnitte(katalog, installiert = [], { versionVergleich = () => 0 } = {}) {
  const pakete = katalog?.pakete ?? [];
  const da = new Map(installiert.filter((p) => p?.manifest).map((p) => [p.manifest.id, p]));
  const reihe = Object.keys(BEREICHE);
  const sortiere = (a, b) => reihe.indexOf(bereichVon(a.eintrag ?? a)) - reihe.indexOf(bereichVon(b.eintrag ?? b)) || String((a.eintrag ?? a).titel).localeCompare(String((b.eintrag ?? b).titel), "de");
  const intern = (p) => p.kanal === "intern" || p.intern === true;
  // Tagespakete stehen nie unter „Neu“: Sie kommen von selbst (0.7.1, Mik)
  const neu = pakete.filter((p) => p.status === "verfuegbar" && !da.has(p.id) && !intern(p) && p.art !== "tage").sort(sortiere);
  const bald = pakete.filter((p) => p.status === "geplant" && !intern(p) && !da.has(p.id)).sort(sortiere);
  const geraet = [...da.values()].map((p) => {
    const e = pakete.find((x) => x.id === p.manifest.id && x.status === "verfuegbar") ?? null;
    return { eintrag: e ? { ...p.manifest, ...e } : p.manifest, paket: p, update: !!e && versionVergleich(e.version, p.manifest.version) > 0 };
  }).sort(sortiere);
  return { neu, bald, geraet };
}
