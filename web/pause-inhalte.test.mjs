// Auftrag 2026-10-07-17 (0.7.1): Pause-Inhalte der Pause-Session, fünf Stufen, Lumi aus, keine Zahlen über Leistung.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ohneLumi, ruheText, ruheVariante, aufgabeWaehlen, raumFormen, lumiAn, logDazu, WERTE } from "./pause.js";
import { zeitWort } from "./pause-happen.js";
import { pauseFehler, lumischFehler, lumischAufgabenFehler } from "../paket-kit/pause-format.mjs";

const lies = (p) => readFile(new URL(p, import.meta.url), "utf8");
const daten = JSON.parse(await lies("../pakete/pause/inhalt/pause.json"));
const lumisch = JSON.parse(await lies("../pakete/lumisch/inhalt/lumisch.json"));
const jeStufe = (liste) => [1, 2, 3, 4, 5].map((s) => liste.filter((x) => x.stufe === s).length);

test("Inhalte: Geschichten auf fünf Stufen (ohne die mit „Susi“), Ruhe je 30, neue Formen je 25, Lumisch-Aufgaben 100", () => {
  assert.deepEqual(pauseFehler(daten), []);
  assert.ok(jeStufe(daten.fehler).every((n) => n >= 10), String(jeStufe(daten.fehler)));
  assert.ok(!/Susi/.test(JSON.stringify([daten.fehler, daten.ruhe, daten.kaffeehaus, daten.kopfnuss, daten.fluss, lumisch.aufgaben])), "kein Name in den neuen Inhalten (das Wörterbuch nutzt „Susi“ seit 0.5 als Beispielnamen)");
  for (const g of daten.fehler) assert.ok(g.fehler >= 0 && g.fehler < g.saetze.length, g.id);
  // Die Beilage zählt ab 1; nach der Übernahme ab 0 – Stichprobe: der Kühlschrank beim Bäcker
  const baecker = daten.fehler.find((g) => g.id === "feh-1-01");
  assert.match(baecker.saetze[baecker.fehler], /Kühlschrank/);
  assert.equal(daten.ruhe.rueckwaerts.length, 30); assert.equal(daten.ruhe.atem.length, 30);
  for (const k of ["kaffeehaus", "kopfnuss", "fluss"]) assert.deepEqual(jeStufe(daten[k]), [5, 5, 5, 5, 5], k);
  assert.deepEqual(lumischFehler(lumisch), []); assert.deepEqual(lumischAufgabenFehler(lumisch.aufgaben), []);
  assert.deepEqual(jeStufe(lumisch.aufgaben), [20, 20, 20, 20, 20]);
});

test("Wörterbuch: „tel3“ und „Wir wissen, dass wir nichts wissen“ im Paket lumisch (und gleich in pause.json)", () => {
  const w = (wort) => lumisch.woerterbuch.find((x) => x.wort === wort);
  assert.match(w("tel").hinweis, /die Zahl 3 heißt tel3\./);
  assert.match(w("nesap").hinweis, /nesap sap = wir wissen, dass wir nichts wissen\./);
  assert.ok(!/Zahl 3 heißt zel3|Ich weiß, dass ich nichts weiß/.test(JSON.stringify(lumisch)));
  assert.deepEqual(lumisch.woerterbuch, daten.lumisch.woerterbuch);
});

test("Lumi aus: kein Lumisch und keine Lumi in Pause – Formen, Geschichten, Ruhe, Gedanke am Fluss, Raum", () => {
  assert.equal(lumiAn("wesen"), true); assert.equal(lumiAn("karten"), false); assert.equal(lumiAn("aus"), false);
  const d = ohneLumi(daten);
  assert.ok(!d.formen.some((f) => f.id === "lumisch") && d.lumisch === null);
  const lumischSaetze = new Set([...daten.ruhe.rueckwaerts, ...daten.ruhe.atem, ...daten.fluss].map((x) => x.lumisch).filter(Boolean));
  const texte = [];
  for (const f of d.formen.filter((x) => !x.bedingung)) texte.push(f.titel, f.einladung, f.beim ?? "");
  for (const g of d.fehler) texte.push(...g.saetze, g.erklaerung);
  for (const v of [...d.ruhe.rueckwaerts, ...d.ruhe.atem]) { const r = ruheText(v, false); assert.equal(r.lumisch, null, v.id); texte.push(...(r.fragen ?? []), r.schluss ?? "", r.ein ?? "", r.aus ?? "", r.ende ?? ""); }
  for (const a of d.kaffeehaus) texte.push(a.frage, ...a.antworten, a.erklaerung);
  for (const a of d.kopfnuss) texte.push(a.frage, a.tipp, a.weg);
  for (const a of d.fluss) texte.push(a.gedanke, ...a.schritte, a.ende_ohne_lumi);
  texte.push(...Object.values(d.texte.zeitgefuehl), ...Object.values(d.texte.atem));
  const raum = raumFormen({ formen: d.formen, einstellungen: { an: true, alter: "M1" }, jetzt: Date.parse("2026-10-07T20:00:00"), kontext: { hat: {} }, log: [], lumisch: d.lumisch });
  texte.push(...raum.map((x) => `${x.form.titel} ${x.stand}`));
  for (const t of texte) {
    assert.doesNotMatch(t, /Lumi/, t);
    for (const l of lumischSaetze) assert.ok(!t.includes(l), `Lumisch „${l}“ in: ${t}`);
  }
  // mit Lumi: der Lumisch-Satz am Ende bleibt
  const v = daten.ruhe.atem.find((x) => x.id === "atem-01");
  assert.ok(ruheText(v, true).lumisch && ruheText(v, false).ende === v.ohne_lumi.ende);
});

test("Die App wendet „Lumi aus“ an: Daten, Rückspiegel, Lumi-Seite; intern.trainiert wird nie gezeigt", async () => {
  const app = await lies("./app.js"), happen = await lies("./pause-happen.js");
  assert.ok(app.includes("pauseDatenMerk = { v, d: lumi ? alle : pauseOhneLumi(alle) };"));
  assert.ok(app.includes("{ mitLumi: lumiInPause() }"), "Rückspiegel ohne Lumisch");
  assert.ok(app.includes("if (l && lumiInPause()) { // 0.7.1: ohne Lumi kein Lumisch"));
  assert.ok(happen.includes("const mitLumisch = lumi && a.lumisch;") && happen.includes("ruheText(roh, lumi)"));
  assert.ok(!/trainiert/.test(happen) && !/\.trainiert\b/.test(app), "nie angezeigt");
});

test("Keine Zahlen über Leistung: Zeitgefühl in einem Wort, Pilz ohne „drei von drei“", async () => {
  assert.deepEqual(zeitWort(600, 605, 10), { wort: "Fast auf den Punkt.", getroffen: true, ab: 5 });
  assert.equal(zeitWort(560, 600, 10).wort, "Ein Stück zu früh.");
  assert.equal(zeitWort(640, 600, 10).wort, "Ein Stück zu spät.");
  assert.equal(zeitWort(1435, 5, 20).wort, "Fast auf den Punkt.", "über Mitternacht");
  assert.deepEqual(WERTE.zeitToleranzMin, [30, 20, 10, 5, 2]);
  const happen = await lies("./pause-happen.js");
  assert.ok(!/Du lagst|Minuten daneben\.`/.test(happen));
  assert.ok(!/von \$\{zahlText\(runden\)\} Pilzen|alle \$\{zahlText\(runden\)\} Pilze/.test(happen));
  assert.ok(happen.includes('"Heute hast du jeden Pilz gefunden."'));
});

test("Ruhe-Varianten: einen Monat lang keine zweimal; Aufgaben von der eigenen Stufe, Neues zuerst", () => {
  let log = [];
  const gesehen = [];
  for (let tag = 1; tag <= 30; tag++) {
    const jetzt = Date.parse(`2026-11-${String(tag).padStart(2, "0")}T21:00:00`);
    const v = ruheVariante(daten.ruhe.rueckwaerts, log, "rueckwaerts", jetzt);
    gesehen.push(v.id);
    log = logDazu(log, { quelle: "pause", id: "rueckwaerts", art: ["kraft"], ergebnis: { variante: v.id }, dauer: 60 }, jetzt);
  }
  assert.equal(new Set(gesehen).size, 30);
  const a = aufgabeWaehlen(daten.kopfnuss, 3, new Set(daten.kopfnuss.filter((x) => x.stufe === 3).slice(0, 4).map((x) => x.id)), () => 0);
  assert.equal(a.stufe, 3); assert.equal(a.id, daten.kopfnuss.filter((x) => x.stufe === 3)[4].id);
});

test("Kleinigkeiten aus 0.7.0: keine Lücke unter dem Bild, „alle 90 Sekunden“, Rechtsinformationssystem (RIS)", async () => {
  assert.match(await lies("./wesen.css"), /\.wesen-blase-platz:has\(> \.wesen-blase\[hidden\]\) \{ min-height: 0; margin-top: 0; \}/);
  const app = await lies("./app.js"), wesen = await lies("./wesen.js");
  assert.ok(app.includes('"alle 90 Sekunden"') && wesen.includes("normal (alle 90 Sekunden)") && !/alle 90 s\b/.test(app + wesen));
  const geplant = JSON.parse(await lies("../pakete/geplant.json"));
  assert.ok(JSON.stringify(geplant).includes("Rechtsinformationssystem (RIS) · Bundesrecht (Auszug)"));
});

test("Miks Fehler aus 0.7.0 und der Rundgang: Vorrat, Bereit, Rätsel, Heft, Lumi-Buch, Seitenleiste, Tipps je Seite", async () => {
  const app = await lies("./app.js"), wesen = await lies("./wesen.js"), css = await lies("./styles.css"), pakete = await lies("./pakete.js");
  // Vorrat: keine Tiefe mehr, Tage kommen von selbst und stehen nie unter „Neu“
  assert.ok(!app.includes('data-tagesplan="tiefe"') && app.includes("Vorrat: Alle Tage, die es schon gibt, kommen von selbst auf das Gerät."));
  assert.ok(pakete.includes('&& p.art !== "tage").sort(sortiere)'));
  // Bereit: eine Zahl, ein Satz, kein „unterwegs“, nichts über die Vorversion
  assert.ok(!/"unterwegs"|Aus der Vorversion übernommen/.test(app));
  assert.equal((app.match(/bereitSatz\(b\.wert\)/g) ?? []).length, 2, "Heute und Übersicht");
  // Tagesrätsel erledigt: Rätsel, Lösung und was „Zurückholen“ tut
  assert.ok(app.includes("Lösung: ${esc(k.loesung)}") && app.includes("„Zurückholen“ legt das Rätsel wieder offen hin"));
  // Heft: Suchfeld mit Rahmen, Zahl in Worten, „Aus dem Heft nehmen“ erklärt
  assert.match(css, /input\[type="search"\], textarea \{/);
  assert.ok(wesen.includes("„Aus dem Heft nehmen“ löscht einen Satz hier") && !/\$\{liste\.length\} von \$\{this\.heft\.length\}/.test(wesen));
  // Lumi-Buch in Worten; Seitenleiste ohne KI, Satz nicht abgeschnitten
  assert.ok(app.includes('"noch nichts aufgeschlagen"') && !/% lesbar/.test(app));
  assert.ok(!app.includes('["ki", "Künstliche Intelligenz"]') && !app.includes("Abo kann laden"));
  assert.match(css, /#net-text \{ white-space: normal;/);
  // Rundgang: ein Tipp bleibt auf seiner Seite; Deine Linie führt zurück zur Pause
  assert.ok(wesen.includes("if (name !== vorher && vorher) { const toast = document.getElementById(\"wesen-toast\")"));
  assert.ok(app.includes('<p style="margin:0 0 1rem"><a href="#pause">‹ Pause</a></p>'));
});
