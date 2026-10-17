// Vorratsliste mit Ablaufdatum (Nr. 42, Mik 17.10.2026): Einträge mit Produkt, Menge, Einheit, Art, Ablauf; daraus rechnen die
// Vorräte (Wasser-Tage, Essen-Tage, Licht), was bald abläuft und was einzukaufen ist. Reine Rechnung, kein Speicher, keine
// Oberfläche (die drei Ansichten stehen in vorrat-ansicht.js). Alles bleibt am Gerät.

export const EINHEITEN = ["Stück", "Dosen", "Flaschen", "Packungen", "Liter", "kg"];
export const ARTEN = [["wasser", "Wasser"], ["essen", "Essen"], ["licht", "Licht & Batterien"], ["medizin", "Medizin"], ["tier", "Tier"], ["sonstiges", "Sonstiges"]];
export const ZIEL_TAGE = 14, LITER_JE_TAG = 2, MAHLZEITEN_JE_TAG = 3, BALD_TAGE = 30;
const FLASCHE_LITER = 1.5;
const MAHLZEITEN_JE = { "Stück": 1, "Dosen": 1, "Flaschen": 1, "Packungen": 2, "Liter": 2, "kg": 4 };

const zahl = (x, min = 0, max = 1e6) => { const n = Number(String(x ?? "").replace(",", ".")); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0; };
/** Vorschlag Liter (Wasser) bzw. Mahlzeiten (Essen) aus Menge und Einheit; der Mensch kann ihn ändern. */
export const literVorschlag = (menge, einheit) => Math.round(zahl(menge) * (einheit === "Flaschen" ? FLASCHE_LITER : 1) * 10) / 10;
export const mahlzeitenVorschlag = (menge, einheit) => Math.round(zahl(menge) * (MAHLZEITEN_JE[einheit] ?? 1));

/** Ablauf: „JJJJ-MM“ (gilt bis Monatsende) oder „JJJJ-MM-TT“; leer = kein Ablauf. */
export function ablaufDatum(ablauf) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(String(ablauf ?? ""));
  if (!m) return null;
  const j = Number(m[1]), mo = Number(m[2]);
  return m[3] ? `${m[1]}-${m[2]}-${m[3]}` : new Date(Date.UTC(j, mo, 0)).toISOString().slice(0, 10); // letzter Tag des Monats
}
const tage = (von, bis) => Math.round((Date.parse(bis + "T00:00:00Z") - Date.parse(von + "T00:00:00Z")) / 86_400_000);
/** Tage bis zum Ablauf (negativ = abgelaufen), null ohne Ablauf. */
export const tageBisAblauf = (e, heute) => { const d = ablaufDatum(e.ablauf); return d ? tage(heute, d) : null; };
export const abgelaufen = (e, heute) => { const t = tageBisAblauf(e, heute); return t !== null && t < 0; };

/** Eintrag bereinigen. */
export function eintragAngaben(e = {}) {
  const art = ARTEN.some(([k]) => k === e.art) ? e.art : "sonstiges", einheit = EINHEITEN.includes(e.einheit) ? e.einheit : "Stück";
  const menge = zahl(e.menge, 0, 100000);
  const aus = { id: String(e.id ?? `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`), produkt: String(e.produkt ?? "").trim().slice(0, 80), menge, einheit, art, ablauf: ablaufDatum(e.ablauf) ? String(e.ablauf) : "" };
  if (art === "wasser") aus.liter = e.liter == null || e.liter === "" ? literVorschlag(menge, einheit) : zahl(e.liter, 0, 100000);
  if (art === "essen") aus.mahlzeiten = e.mahlzeiten == null || e.mahlzeiten === "" ? mahlzeitenVorschlag(menge, einheit) : Math.round(zahl(e.mahlzeiten, 0, 100000));
  return aus;
}

/**
 * Die Vorräte aus der Liste: Wasser-Tage = Liter ÷ (2 × Personen), Essen-Tage = Mahlzeiten ÷ (3 × Personen), abgerundet; Licht =
 * mindestens ein Eintrag „Licht & Batterien“. Abgelaufenes zählt nicht. Gleiche Form wie polsterRechnen (für Heute und Bereit).
 */
export function vorratRechnen(eintraege = [], personen = 1, heute) {
  const p = Math.max(1, Math.floor(personen || 1)), gilt = eintraege.filter((e) => !abgelaufen(e, heute));
  const liter = gilt.filter((e) => e.art === "wasser").reduce((s, e) => s + (e.liter ?? 0), 0);
  const mahlzeiten = gilt.filter((e) => e.art === "essen").reduce((s, e) => s + (e.mahlzeiten ?? 0), 0);
  const wasserTage = Math.floor(liter / (LITER_JE_TAG * p)), essenTage = Math.floor(mahlzeiten / (MAHLZEITEN_JE_TAG * p));
  const licht = gilt.some((e) => e.art === "licht") ? true : null;
  const knapp = wasserTage < essenTage ? "wasser" : essenTage < wasserTage ? "essen" : "gleich";
  return { personen: p, liter, mahlzeiten, wasserTage, essenTage, tage: Math.min(wasserTage, essenTage), knapp, licht };
}

/** Was in den nächsten 30 Tagen abläuft oder schon abgelaufen ist, das Früheste zuerst. */
export function ablaufend(eintraege = [], heute, grenze = BALD_TAGE) {
  return eintraege.map((e) => ({ e, t: tageBisAblauf(e, heute) })).filter((x) => x.t !== null && x.t <= grenze).sort((a, b) => a.t - b.t);
}
export const mengeText = (e) => `${String(e.menge).replace(".", ",")} ${e.einheit === "Stück" ? "" : e.einheit + " "}${e.produkt}`.replace(/\s+/g, " ").trim();
export const ablaufText = (t) => (t < 0 ? (t === -1 ? "seit gestern" : `seit ${-t} Tagen`) : t === 0 ? "heute" : t === 1 ? "morgen" : `in ${t} Tagen`);

/** Die Einkaufsliste: Abgelaufenes ersetzen, bald Ablaufendes nachkaufen, und was bis 14 Tage fehlt. */
export function einkaufsliste(eintraege = [], personen = 1, heute) {
  const r = vorratRechnen(eintraege, personen, heute), aus = [];
  for (const { e, t } of ablaufend(eintraege, heute)) aus.push({ art: t < 0 ? "abgelaufen" : "bald", text: `${mengeText(e)} (${t < 0 ? "abgelaufen" : `läuft ${ablaufText(t)} ab`})` });
  const literFehlen = Math.ceil(ZIEL_TAGE * LITER_JE_TAG * r.personen - r.liter), mahlzeitenFehlen = Math.ceil(ZIEL_TAGE * MAHLZEITEN_JE_TAG * r.personen - r.mahlzeiten);
  if (literFehlen > 0) aus.push({ art: "fehlt", text: `noch ${literFehlen} Liter Wasser` });
  if (mahlzeitenFehlen > 0) aus.push({ art: "fehlt", text: `Essen für noch ${mahlzeitenFehlen} Mahlzeiten` });
  if (!r.licht) aus.push({ art: "fehlt", text: "Taschenlampe und Batterien" });
  return aus;
}

/** Übernahme aus Nr. 34 (Liter, Essen-Tage, Licht) als drei Sammel-Einträge; nichts geht verloren. */
export function ausPolster(polster = {}, personen = 1) {
  const p = Math.max(1, Math.floor(personen || 1)), aus = [];
  if (polster.liter > 0) aus.push(eintragAngaben({ id: "alt-wasser", produkt: "Wasser (bisherige Angabe)", menge: polster.liter, einheit: "Liter", art: "wasser", liter: polster.liter }));
  if (polster.essen > 0) aus.push(eintragAngaben({ id: "alt-essen", produkt: `Essen für ${polster.essen} Tage (bisherige Angabe)`, menge: 1, einheit: "Stück", art: "essen", mahlzeiten: polster.essen * MAHLZEITEN_JE_TAG * p }));
  if (polster.licht === true) aus.push(eintragAngaben({ id: "alt-licht", produkt: "Licht (bisherige Angabe)", menge: 1, einheit: "Stück", art: "licht" }));
  return aus;
}
