// „Mein Tag“ (0.5.6, Auftrag 2026-10-05-10): eine Uhr für Tagesschluss, Lumi-Schlaf und die Tageszeiten in Pause.
// Zeiten in Minuten ab Mitternacht; Schluss 19:00 bis 24:00 (1440) oder null („keine Uhrzeit“), Aufstehen 5:00 bis 9:00.
// Die App sagt nicht, wann jemand schlafen soll: Alter und Gelerntes geben nur Startwert und Vorschlag.

const halbe = (von, bis) => Array.from({ length: (bis - von) / 30 + 1 }, (_, i) => von + i * 30);
export const SCHLUSS_ZEITEN = halbe(19 * 60, 24 * 60);
export const AUFSTEHEN_ZEITEN = halbe(5 * 60, 9 * 60);
export const ARTEN = [
  { id: "morgen", titel: "Morgenmensch", schluss: 21 * 60 + 30, aufstehen: 6 * 60 },
  { id: "dazwischen", titel: "Dazwischen", schluss: 22 * 60 + 30, aufstehen: 7 * 60 },
  { id: "nacht", titel: "Nachtmensch", schluss: 23 * 60 + 30, aufstehen: 8 * 60 },
];
export const STANDARD = { schluss: 22 * 60 + 30, aufstehen: 7 * 60 };

/** 22:30, 24:00 */
export const zeitText = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
const minuten = (jetzt) => { const d = new Date(jetzt); return d.getHours() * 60 + d.getMinutes(); };

/** Startwert nach Alter in Jahren (später Kinder-Modus). */
export function schlussNachAlter(jahre) {
  if (!Number.isFinite(jahre)) return null;
  return jahre < 10 ? 19 * 60 + 30 : jahre < 14 ? 20 * 60 + 30 : jahre < 18 ? 21 * 60 + 30 : 22 * 60 + 30;
}
/** Startwert nach der Altersstufe aus Pause. „unter 14“ nimmt den früheren Wert, „14 bis 29“ den für Erwachsene. */
export const STUFE_JAHRE = { kind: 9, J: 18, M1: 30, M2: 50, A: 65 };
export const schlussNachStufe = (stufe) => (stufe in STUFE_JAHRE ? schlussNachAlter(STUFE_JAHRE[stufe]) : null);

/**
 * Mein Tag aus dem gespeicherten Tagesplan. Übernahme: „schlussUm“ (volle Stunde oder null, bis 0.5.5) gilt weiter.
 * Ist nichts gespeichert, gilt der Startwert nach Alter, sonst „Dazwischen“.
 */
export function meinTag(gespeichert, stufe) {
  const p = gespeichert ?? {};
  const schluss = "schluss" in p ? p.schluss : "schlussUm" in p ? (p.schlussUm == null ? null : p.schlussUm * 60) : schlussNachStufe(stufe) ?? STANDARD.schluss;
  const aufstehen = AUFSTEHEN_ZEITEN.includes(p.aufstehen) ? p.aufstehen : STANDARD.aufstehen;
  return { schluss: schluss === null || SCHLUSS_ZEITEN.includes(schluss) ? schluss : STANDARD.schluss, aufstehen };
}

/** Ist die Schluss-Zeit heute erreicht? (24:00 erst mit dem neuen Tag, also nie am selben Tag) */
export const schlussVorbei = (jetzt, tag) => tag.schluss != null && minuten(jetzt) >= tag.schluss;

/** Lumi schläft von Schluss (ohne Uhrzeit: gelernte Zeit) bis Aufstehen. */
export function schlaeftJetzt(jetzt, tag, gelerntVon) {
  const m = minuten(jetzt), von = (tag.schluss ?? gelerntVon) % 1440, bis = tag.aufstehen;
  return von > bis ? m >= von || m < bis : m >= von && m < bis;
}

/** Pause: „Der Tag rückwärts“ ab zwei Stunden vor Schluss, nie vor 18 Uhr; Morgen-Formen von Aufstehen bis 12 Uhr. */
export const abendAb = (tag, frueheste = 18 * 60) => Math.max(frueheste, tag?.schluss != null ? tag.schluss - 120 : frueheste);
export const morgenAb = (tag) => tag?.aufstehen ?? 0;

/**
 * Vorschlag aus dem Gelernten. abende: { "JJJJ-MM-TT": Minuten seit Mittag } (aus der Lumi). Gefragt wird, wenn in den
 * letzten 14 Abenden mindestens 10 gemerkt sind und ihr Median mehr als 45 Minuten vom Schluss abweicht; höchstens alle
 * 14 Tage, nach zweimal „Nein“ nie wieder. frage: { nein, zuletzt } (gespeichert). Gibt { wach, neu } oder null.
 */
export function vorschlag({ abende, tag, frage = {}, heute }) {
  if (tag.schluss == null || (frage.nein ?? 0) >= 2) return null;
  if (frage.zuletzt && tageZwischen(frage.zuletzt, heute) < 14) return null;
  const grenze = verschoben(heute, -14);
  const werte = Object.entries(abende ?? {}).filter(([d, v]) => d > grenze && d <= heute && Number.isFinite(v)).map(([, v]) => v).sort((a, b) => a - b);
  if (werte.length < 10) return null;
  const wach = (werte[Math.floor(werte.length / 2)] + 12 * 60) % 1440; // seit Mittag → Uhrzeit
  const wachLinear = wach < 12 * 60 ? wach + 1440 : wach; // nach Mitternacht zählt als später
  if (Math.abs(wachLinear - tag.schluss) <= 45) return null;
  const neu = Math.min(24 * 60, Math.max(19 * 60, Math.floor(wachLinear / 30) * 30));
  return neu === tag.schluss ? null : { wach, neu };
}
export const vorschlagText = (v) => `Du bist meist bis ${zeitText(v.wach)} wach. Schluss auf ${zeitText(v.neu)} verschieben?`;
/** Antwort merken: ja → neue Zeit gilt; nein → zählt (zweimal nein, nie wieder). */
export const vorschlagAntwort = (frage = {}, ja, heute) => ({ nein: (frage.nein ?? 0) + (ja ? 0 : 1), zuletzt: heute });

function verschoben(d, n) { const t = new Date(d + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
function tageZwischen(a, b) { return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5); }
