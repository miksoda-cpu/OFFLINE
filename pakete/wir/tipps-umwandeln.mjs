#!/usr/bin/env node
// Paket „wir“: die 180 Tipps aus der Session (bill/eingang/2026-09-29-bill/material/pakete/wir/inhalt/tipps.json)
// in das Format der App bringen (web/wesen.js, passtBedingung). Aufruf: node pakete/wir/tipps-umwandeln.mjs
// - Sorten klein (App → app).
// - Bedingungen von Text in Daten mit festem Wortschatz. profil.* gibt es in der App noch nicht: diese Tipps fallen weg.
// - Tipps, die von sich sprechen (ich, mir, mich, mein …), bekommen „benannt“: erst nach der Namensgabe.
// - app-001 korrigiert: Der Tresor liegt links in der Seitenleiste.
// - Tipps, die einen Zustand behaupten, kommen nur, wenn er stimmt (ZUSTAND, Auftrag 2026-09-30-dezember-und-tippfix).
// - Grundsatz (Auftrag 2026-10-01-tipps-und-jaenner): Ein Tipp behauptet nie etwas, das die App nicht weiß, und nennt keine
//   Funktion, die es nicht gibt. Umformuliert (KORREKTUR), gestrichen (WEG), oder er wartet auf die Funktion (FUNKTION).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ICH } from "../../web/wesen.js";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const QUELLE = path.join(WURZEL, "bill", "eingang", "2026-09-29-bill", "material", "pakete", "wir", "inhalt", "tipps.json");
const ZIEL = path.join(WURZEL, "pakete", "wir", "inhalt", "tipps.json");
// Auftrag 2026-10-04-lumi-buch-app: jeder Tipp zeigt auf seinen Absatz im Lumi-Buch (Zuordnung von Bill, gegen das Buch geprüft)
const ZUORDNUNG = path.join(WURZEL, "pakete", "lumi-buch", "quelle", "OFFLINE-Lumi-Buch-Zuordnung.json");

const WOCHENTAG = { mo: 1, di: 2, mi: 3, do: 4, fr: 5, sa: 6, so: 7 };
const ALTER = { wasser_alter_monate: "c-0-0", batterien_alter_monate: "c-1-1" };
const KORREKTUR = {
  "app-001": "Der Tresor ist das kleine Schloss links in der Seitenleiste. Nur du kennst das Passwort. Ich auch nicht.",
  // Die App kennt den Treffpunkt als Bereit-Bestätigung, nicht als Eintrag im Tresor
  "alltag-020": "Euer Treffpunkt steht. Weiß ihn wirklich die ganze Familie? Frag heute Abend. Ohne Anlass.",
  // Zustand, den die App nicht kennt: allgemein formuliert
  "laune-002": "Wenn du mich weckst, sag ich nichts Kluges. Nur damit du es weißt.",
  "laune-006": "Ob es intelligentes Leben da draußen gibt? Wer im Blackout dreimal die Kühlschranktür aufmacht, um zu sehen, ob der Strom noch weg ist, ist jedenfalls gründlich. Ich enthalte mich.",
  "laune-007": "Wer schnell wischt, dem rede ich langsamer. Einer von uns muss.",
  "laune-015": "Ein Häkchen bei Bereit dauert eine Sekunde. Ich sage es nur. Ich meine es nicht böse. Ich meine es nie böse.",
  "alltag-004": "Ein Nachbar, den du im Notfall fragen kannst, und ich bin ruhiger. Man muss ihn nicht mögen. Man muss wissen, wo er wohnt.",
  "alltag-039": "Über 80. Du bist ruhig, ich bin ruhig. Jetzt ist die Zeit für die Nachbarin, die vielleicht noch nicht so weit ist.",
  "app-025": "Unter Werkzeuge trägst du die Frequenz deines Radiosenders ein. Schreib sie trotzdem auf Papier. Papier braucht keinen Akku.",
  // Auftrag 2026-10-04-wir-drei-tipps: die Bibliothek hat keine Kategorie „Wissen“
  "app-011": "Die Pakete in der Bibliothek liegen ganz auf deinem Gerät. Kein Netz nötig, nie. Deshalb sind sie groß.",
  // Mik, 04.10.2026 (Nachtrag 2026-10-04-01a), wegen des Lumi-Buchs
  "weisheit-002": "Wir kennen unten keine Kriege. Nicht, weil wir besser sind. Wir haben aufgehört, haben zu wollen, was ein anderer hat.",
  // Punktzahlen aus Bereit Version 1
  "alltag-001": "Dein Wasser ist neun Monate alt. Tauschen dauert zehn Minuten und hebt deine Bereit-Zahl.",
  "alltag-003": "Ein Probeabend ohne Strom hebt deine Bereit-Zahl. Und du weißt danach, was fehlt. Meistens die Taschenlampe.",
  "alltag-014": "Der Kocher. Hast du ihn je angezündet? Mach es heute. Draußen. Das hebt deine Bereit-Zahl.",
  // An den heutigen Stand angepasst
  "app-005": "Der Vorrat unten auf der Tagesseite zeigt, wie viele Tage Rätsel und Kapitel schon da sind. Wie weit die App vorlädt, stellst du im Tagesplan ein. Ohne Netz geht es weiter, bis er leer ist.",
  "app-010": "Der Sparmodus im Tagesplan lässt mich auf der Tagesseite weg. Dann ist es dort ruhiger. Ein Haken, und ich bin wieder da.",
  "app-020": "Das Kapitel des Tages liest dir die App vor. Der Knopf „Vorlesen“ steht oben in der Leseansicht.",
};
// Stelle in der App für „Zeig mir“ (Auftrag 2026-10-04-lumi-knoepfe; Liste in paket-kit/tipps-format.mjs). Nur wo eindeutig;
// Tipps, die auf eine Funktion warten, bekommen keins.
const STELLE = {
  "app-001": "tresor", "app-004": "lumi", "app-005": "tagesplan", "app-007": "tresor", "app-008": "start", "app-009": "lumi-log",
  "app-010": "tagesplan", "app-011": "bibliothek", "app-012": "bibliothek", "app-020": "kapitel", "app-021": "start", "app-022": "start",
  "app-023": "tagesplan", "app-025": "werkzeuge", "app-027": "bibliothek",
  "digital-001": "updates",
};
// Gestrichen (Auftrag 2026-10-01): die App merkt sich frühere Namen nicht
const WEG = new Set(["laune-010"]);
// Tipps über Funktionen, die es noch nicht gibt: Sie kommen, sobald die App die Funktion hat (web/wesen.js, FUNKTIONEN)
const FUNKTION = {
  "app-002": "wischen", "app-003": "was-ist-los", "app-004": "gelernt", "app-006": "briefe", "app-013": "karte-offline",
  "app-014": "kalender", "app-015": "wohin", "app-016": "tagebuch", "app-017": "schliessfach", "app-018": ["schliessfach", "tagebuch"],
  "app-019": "skin-kontrast", "app-024": "familiennachricht", "app-026": "offline-stunde", "app-028": "mesh",
  "app-029": ["fernschach", "mesh"], "app-031": "neujahr-buecher", "app-033": "wohin", "alltag-023": "zettel-drucken",
  "digital-030": "fragen",
  // Auftrag 2026-10-04-wir-drei-tipps: Wikipedia mit und ohne Bilder ist noch keine eigene Wahl; Export gibt es noch nicht
  "app-012": "wikipedia-varianten", "app-030": "export",
};
// Zusätzliche Bedingungen für Tipps, die einen Zustand behaupten (Bereit-Positionen aus web/bereit.js)
const ZUSTAND = {
  "alltag-001": { alter: { position: "c-0-0", ab_monate: 9 } },  // „Dein Wasser ist neun Monate alt.“
  "alltag-002": { offen: "c-3-2" },                               // „Du hast noch keinen Treffpunkt eingetragen.“
  "alltag-020": { alter: { position: "c-3-2", ab_monate: 0 } },  // Treffpunkt bestätigt
  "alltag-026": { alter: { position: "c-0-0", ab_monate: 12 }, verfallen: true }, // „… weil das Wasser abläuft.“
  "alltag-028": { alter: { position: "probeabend", ab_monate: 6 } }, // „Der Probeabend war vor sechs Monaten.“
};

/** "monat>=6&monat<=8" → { monat: [6,7,8] }. Gibt null zurück, wenn der Tipp wegfallen soll (profil.*). */
export function bedingung(text) {
  if (!text) return {};
  const b = {};
  const bereich = {};
  for (const teil of text.split("&")) {
    const m = teil.trim().match(/^([a-z_.]+)\s*(>=|<=|=|>|<)?\s*([\w.-]*)$/);
    if (!m) throw new Error(`Bedingung nicht lesbar: ${text}`);
    const [, k, op = "", v] = m;
    if (k.startsWith("profil.")) return null;
    if (k === "einstellung.digital") b.einstellung = "digital";
    else if (k === "ansicht" && op === "=") b.ansicht = v;
    else if (k === "monat" && op === "=") b.monat = Number(v);
    else if (k === "monat" && (op === ">=" || op === "<=")) bereich[op] = Number(v);
    else if (k === "tag" && op === "=") b.tag = Number(v);
    else if (k === "stunde" && op === "=") b.stunde = Number(v);
    else if (k === "wochentag" && op === "=" && WOCHENTAG[v]) b.wochentag = WOCHENTAG[v];
    else if (k === "score" && op === ">=") b.score_ab = Number(v);
    else if (k === "score" && op === "<") b.score_unter = Number(v);
    else if (ALTER[k] && op === ">") b.alter = { position: ALTER[k], ab_monate: Number(v) };
    else if (k === "kalender.zeitumstellung_in_tagen" && op === "<=") b.zeitumstellung_in_tagen = Number(v);
    else throw new Error(`Bedingung unbekannt: ${teil} (in ${text})`);
  }
  if (bereich[">="] != null || bereich["<="] != null) {
    const von = bereich[">="] ?? 1, bis = bereich["<="] ?? 12;
    b.monat = Array.from({ length: bis - von + 1 }, (_, i) => von + i);
  }
  return b;
}

async function main() {
  const q = JSON.parse(await readFile(QUELLE, "utf8"));
  const buch = JSON.parse(await readFile(ZUORDNUNG, "utf8"));
  const tipps = [], weg = [], benannt = [];
  for (const t of q.tipps) {
    const b = bedingung(t.bedingung);
    if (b === null) { weg.push(`${t.id} (${t.bedingung})`); continue; }
    if (WEG.has(t.id)) { weg.push(`${t.id} (gestrichen)`); continue; }
    const text = KORREKTUR[t.id] ?? t.text;
    Object.assign(b, ZUSTAND[t.id] ?? {});
    if (FUNKTION[t.id]) b.funktion = FUNKTION[t.id];
    if (ICH.test(text)) { b.benannt = true; benannt.push(t.id); }
    tipps.push({ id: t.id, sorte: t.sorte.toLowerCase(), text, ...(t.gewicht && t.gewicht !== 1 ? { gewicht: t.gewicht } : {}), ...(Object.keys(b).length ? { bedingung: b } : {}), ...(STELLE[t.id] ? { ziel: STELLE[t.id] } : {}), ...(buch[t.id] ? { buch: buch[t.id] } : {}) });
  }
  const aus = {
    hinweis: "Tipps der Lumi. Felder: id, sorte (app, alltag, wissen, weisheit, laune, heute, digital), text, optional gewicht und bedingung. Bedingungen sind Daten, kein Code (web/wesen.js, passtBedingung): ansicht, einstellung, monat (Zahl oder Liste), tag, wochentag (1 = Mo … 7 = So), stunde, score_unter, score_ab, verfallen, benannt (erst nach der Namensgabe; Pflicht bei jedem Tipp, der von sich spricht), alter { position, ab_monate }, offen (Position nie bestätigt), funktion (erst, wenn die App die Funktion hat), zeitumstellung_in_tagen. Optional ziel (Stelle in der App für „Zeig mir“) und buch (Absatz im Lumi-Buch, Paket „lumi-buch“, App ab 0.5.0); Format in paket-kit/tipps-format.mjs. Unbekannte Wörter: Der Tipp kommt nicht. Gebaut mit pakete/wir/tipps-umwandeln.mjs aus dem Bestand der Session (180 Tipps).",
    tipps,
  };
  await writeFile(ZIEL, JSON.stringify(aus, null, 2) + "\n");
  console.log(`${tipps.length} Tipps geschrieben (${benannt.length} mit „benannt“), ${weg.length} weggelassen: ${weg.join(", ")}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
