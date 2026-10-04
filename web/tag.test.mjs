// node --test web/tag.test.mjs – Tagesseite und Vorratskammer: Freischaltung, Datumswechsel, Zeitzone, Zeitumstellung,
// leerer Vorrat, Vorratstiefe, Schluss, gelernte Schicht. Läuft zusätzlich unter fremden Zeitzonen (Unterprozess).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { datumVon, tageZwischen, plusTage, tagNummer, kartenFuer, vorratTage, bereichTrifft, bereichVorbei, vorzuladen, tagesKarten, schlussErreicht, textkarteFuer, lernen, SCHLUSS, PLAN_STANDARD, antwortRichtig, antwortNormal, zahlwort } from "./tag.js";
import { tageInhaltFehler } from "../paket-kit/tage-format.mjs";

const r = (datum, id = datum) => ({ art: "raetsel", id: `r-${id}`, frage: "?", loesung: "!" });
const nachDatum = { id: "tage-2026-10", bereich: { von: "2026-10-01", bis: "2026-10-03" }, tage: ["2026-10-01", "2026-10-02", "2026-10-03"].map((d) => ({ datum: d, karten: [r(d)] })) };
const nachNummer = { id: "kurs", bereich: { von_tag: 1, bis_tag: 2 }, tage: [{ tag: 1, karten: [{ art: "text", id: "t1", text: "Tag eins" }] }, { tag: 2, karten: [{ art: "text", id: "t2", text: "Tag zwei" }] }] };

test("Freischaltung: nur der Tag selbst, nach Datum und nach Tagnummer", () => {
  assert.deepEqual(kartenFuer([nachDatum], "2026-10-02", "2026-09-30").map((k) => k.id), ["r-2026-10-02"]);
  assert.deepEqual(kartenFuer([nachDatum], "2026-10-04", "2026-09-30"), []);
  // Tagnummer: Tag 1 ist der Starttag des Geräts
  assert.deepEqual(kartenFuer([nachNummer], "2026-11-05", "2026-11-05").map((k) => k.id), ["t1"]);
  assert.deepEqual(kartenFuer([nachNummer], "2026-11-06", "2026-11-05").map((k) => k.id), ["t2"]);
  assert.equal(tagNummer("2026-11-05", "2026-11-05"), 1);
});

test("Datumswechsel: um Mitternacht ist der nächste Tag frei, eine Minute davor nicht", () => {
  const vor = new Date(2026, 9, 1, 23, 59).getTime(), nach = new Date(2026, 9, 2, 0, 1).getTime();
  assert.equal(datumVon(vor), "2026-10-01");
  assert.equal(datumVon(nach), "2026-10-02");
  assert.deepEqual(kartenFuer([nachDatum], datumVon(nach), "2026-10-01").map((k) => k.id), ["r-2026-10-02"]);
});

test("Uhrumstellung: Kalendertage, nie 24 Stunden (Ende Sommerzeit 25.10.2026, Beginn 29.03.2026)", () => {
  assert.equal(tageZwischen("2026-10-24", "2026-10-26"), 2);
  assert.equal(plusTage("2026-10-24", 1), "2026-10-25");
  assert.equal(plusTage("2026-10-25", 1), "2026-10-26");
  assert.equal(plusTage("2026-03-28", 2), "2026-03-30");
  assert.equal(tageZwischen("2026-03-28", "2026-03-30"), 2);
  assert.equal(tagNummer("2026-10-20", "2026-10-30"), 11);
  assert.equal(plusTage("2026-12-31", 1), "2027-01-01");
  assert.equal(plusTage("2028-02-28", 1), "2028-02-29");
});

test("Zeitzonen: Wien, Auckland, New York, Samoa (+13) – derselbe Augenblick, jeweils das eigene Kalenderdatum", () => {
  const ms = Date.UTC(2026, 9, 25, 0, 30); // 25.10.2026 00:30 UTC
  const erwartet = { "Europe/Vienna": "2026-10-25", "Pacific/Auckland": "2026-10-25", "America/New_York": "2026-10-24", "Pacific/Apia": "2026-10-25", "Pacific/Honolulu": "2026-10-24" };
  for (const [tz, datum] of Object.entries(erwartet)) {
    const aus = execFileSync(process.execPath, ["--input-type=module", "-e", `import { datumVon, plusTage, tageZwischen } from ${JSON.stringify(new URL("./tag.js", import.meta.url).href)}; const d = datumVon(${ms}); console.log(JSON.stringify([d, plusTage(d, 1), tageZwischen(d, plusTage(d, 30))]));`], { env: { ...process.env, TZ: tz } }).toString();
    const [d, morgen, dreissig] = JSON.parse(aus);
    assert.equal(d, datum, tz);
    assert.equal(tageZwischen(d, morgen), 1, tz);
    assert.equal(dreissig, 30, tz);
  }
});

test("Vorrat: jeder kommende Tag mit Inhalt; leer ist 0, kein Fehler", () => {
  assert.equal(vorratTage([nachDatum], "2026-10-01", "2026-10-01"), 3);
  assert.equal(vorratTage([nachDatum], "2026-10-03", "2026-10-01"), 1);
  assert.equal(vorratTage([nachDatum], "2026-10-04", "2026-10-01"), 0);
  assert.equal(vorratTage([], "2026-10-04", "2026-10-01"), 0);
  assert.equal(vorratTage([nachDatum], "2026-09-30", "2026-09-30"), 3, "heute noch nichts, ab morgen drei Tage");
  const luecke = { ...nachDatum, tage: nachDatum.tage.filter((t) => t.datum !== "2026-10-02") };
  assert.equal(vorratTage([luecke], "2026-10-01", "2026-10-01"), 2);
  assert.equal(vorratTage([nachNummer], "2026-11-05", "2026-11-05"), 2);
});

test("Vorratstiefe 7/30/90: welche Tagespakete geladen, welche weggeräumt werden", () => {
  const e = (id, von, bis, version = "2026.09.30") => ({ id, art: "tage", status: "verfuegbar", version, tage: { von, bis } });
  const katalog = { pakete: [e("tage-2026-10", "2026-10-01", "2026-10-31"), e("tage-2026-11", "2026-11-01", "2026-11-30"), e("tage-2026-12", "2026-12-01", "2026-12-31"), { id: "wir", art: "inhalt", status: "verfuegbar" }] };
  const ids = (t, heute = "2026-10-20", inst = []) => vorzuladen(katalog, inst, heute, t, "2026-10-01").map((x) => x.id);
  assert.deepEqual(ids(7), ["tage-2026-10"]);
  assert.deepEqual(ids(30), ["tage-2026-10", "tage-2026-11"]);
  assert.deepEqual(ids(90), ["tage-2026-10", "tage-2026-11", "tage-2026-12"]);
  assert.deepEqual(ids(30, "2026-10-20", [{ id: "tage-2026-10", version: "2026.09.30" }]), ["tage-2026-11"], "schon da");
  assert.deepEqual(ids(30, "2026-10-20", [{ id: "tage-2026-10", version: "2026.09.01" }]), ["tage-2026-10", "tage-2026-11"], "neuere Ausgabe");
  assert.equal(bereichTrifft({ von_tag: 1, bis_tag: 60 }, "2026-10-05", 7, "2026-10-01"), true);
  assert.equal(bereichTrifft({ von_tag: 1, bis_tag: 3 }, "2026-10-05", 7, "2026-10-01"), false);
  assert.equal(bereichVorbei({ von: "2026-10-01", bis: "2026-10-31" }, "2026-11-07", "2026-10-01"), false);
  assert.equal(bereichVorbei({ von: "2026-10-01", bis: "2026-10-31" }, "2026-11-08", "2026-10-01"), true);
});

test("Tagesseite: Karten nach Tagesplan, die Lumi oder die Textkarte, Schluss mit festem Satz", () => {
  const karten = [r("x"), { art: "kapitel", id: "k1" }];
  const tipp = { id: "app-001", text: "Tipp", sorte: "app" };
  assert.deepEqual(tagesKarten({ karten, lumi: "karten", textkarte: tipp }).map((k) => k.art), ["raetsel", "kapitel", "text"]);
  assert.deepEqual(tagesKarten({ karten, lumi: "wesen", textkarte: tipp }).map((k) => k.art), ["raetsel", "kapitel", "lumi"]);
  assert.deepEqual(tagesKarten({ karten, lumi: "aus", textkarte: tipp }).map((k) => k.art), ["raetsel", "kapitel"], "Tipps aus: keine Karte");
  assert.deepEqual(tagesKarten({ karten, plan: { karten: { raetsel: false, kapitel: true, lumi: false } } }).map((k) => k.art), ["kapitel"]);
  const tk = tagesKarten({ karten, lumi: "karten", textkarte: tipp });
  const jetzt = new Date(2026, 9, 1, 12).getTime();
  assert.equal(schlussErreicht({ karten: tk, zustand: { "r-x": "erledigt" }, jetzt }), null);
  assert.equal(schlussErreicht({ karten: tk, zustand: { "r-x": "erledigt", k1: "weg", "lumi-app-001": "erledigt" }, jetzt }), "erledigt");
  assert.equal(schlussErreicht({ karten: tk, zustand: {}, jetzt: new Date(2026, 9, 1, 22).getTime() }), "uhrzeit");
  assert.equal(schlussErreicht({ karten: tk, zustand: {}, jetzt: new Date(2026, 9, 1, 22).getTime(), plan: { ...PLAN_STANDARD, schlussUm: null } }), null, "Schluss nur, wenn erledigt");
  assert.equal(SCHLUSS, "Das war dein Tag. Bis morgen.");
});

test("Textkarte des Tages: fest für den Tag, am nächsten Tag meist eine andere", () => {
  const pool = Array.from({ length: 40 }, (_, i) => ({ id: `t-${i}`, text: `${i}` }));
  assert.equal(textkarteFuer(pool, "2026-10-01").id, textkarteFuer([...pool].reverse(), "2026-10-01").id);
  const woche = new Set(Array.from({ length: 7 }, (_, i) => textkarteFuer(pool, plusTage("2026-10-01", i)).id));
  assert.ok(woche.size >= 5, `${woche.size} verschiedene`);
  assert.equal(textkarteFuer([], "2026-10-01"), null);
});

test("Gelernte Schicht: eine Woche weggelegt → ausblenden, begründet; eingefroren bleibt sie", () => {
  const verlauf = {};
  for (let i = 1; i <= 7; i++) verlauf[plusTage("2026-10-20", -i)] = { raetsel: "weg", kapitel: "erledigt" };
  const v = lernen(verlauf, "2026-10-20", PLAN_STANDARD);
  assert.equal(v.art, "raetsel");
  assert.match(v.text, /seit einer Woche/);
  assert.doesNotMatch(v.text, /\bich\b/i);
  assert.equal(lernen(verlauf, "2026-10-20", PLAN_STANDARD, { eingefroren: { raetsel: true } }), null);
  verlauf[plusTage("2026-10-20", -3)].raetsel = "erledigt";
  assert.equal(lernen(verlauf, "2026-10-20", PLAN_STANDARD), null);
});

test("Die gebauten Pakete: 61 Tage mit Rätsel ab 1.10.2026, vier Werke zu je sieben Teilen ab Montag", async () => {
  const pakete = [];
  for (const m of ["2026-10", "2026-11"]) {
    const q = JSON.parse(await readFile(new URL(`../pakete/tage-${m}/paket.quelle.json`, import.meta.url), "utf8"));
    const inhalt = JSON.parse(await readFile(new URL(`../pakete/tage-${m}/inhalt/tage.json`, import.meta.url), "utf8"));
    assert.deepEqual(tageInhaltFehler(inhalt, q.tage), [], m);
    pakete.push({ id: q.id, bereich: q.tage, tage: inhalt.tage });
  }
  assert.equal(vorratTage(pakete, "2026-10-01", "2026-10-01"), 61);
  const kapitel = pakete.flatMap((p) => p.tage).flatMap((t) => t.karten.filter((k) => k.art === "kapitel").map((k) => ({ ...k, datum: t.datum })));
  assert.equal(kapitel.length, 28);
  for (const k of kapitel.filter((k) => k.teil === 1)) assert.equal(new Date(k.datum + "T12:00:00Z").getUTCDay(), 1, `${k.werk} beginnt an einem Montag`);
  assert.deepEqual([...new Set(kapitel.map((k) => k.werk))], ["Kleider machen Leute", "Die Judenbuche", "Aus dem Leben eines Taugenichts", "Der Schimmelreiter"]);
});

test("Dezember 2026: 31 Rätsel ohne Wiederholung, Advent ab Montag, ab 24. Dezember ruhig und kurz", async () => {
  const q = JSON.parse(await readFile(new URL("../pakete/tage-2026-12/paket.quelle.json", import.meta.url), "utf8"));
  const inhalt = JSON.parse(await readFile(new URL("../pakete/tage-2026-12/inhalt/tage.json", import.meta.url), "utf8"));
  assert.deepEqual(tageInhaltFehler(inhalt, q.tage), []);
  assert.deepEqual(q.tage, { von: "2026-12-01", bis: "2026-12-31" });
  const raetsel = inhalt.tage.map((t) => t.karten.find((k) => k.art === "raetsel"));
  assert.equal(raetsel.filter(Boolean).length, 31);
  const alt = [];
  for (const m of ["2026-10", "2026-11"]) alt.push(...JSON.parse(await readFile(new URL(`../pakete/tage-${m}/inhalt/tage.json`, import.meta.url), "utf8")).tage.flatMap((t) => t.karten));
  const fragen = new Set(alt.filter((k) => k.art === "raetsel").map((k) => k.frage));
  for (const r of raetsel) assert.ok(!fragen.has(r.frage), `${r.id} wiederholt ein Rätsel`);
  for (const t of inhalt.tage.filter((t) => t.datum >= "2026-12-24")) {
    assert.equal(t.karten.find((k) => k.art === "raetsel").stufe, "einfach", `${t.datum}: Rätsel leicht`);
    const k = t.karten.find((x) => x.art === "kapitel");
    const woerter = k.absaetze.join(" ").split(/\s+/).length;
    assert.ok(woerter <= 1100, `${t.datum}: Lesetext kurz (${woerter} Wörter)`);
  }
  const kapitel = inhalt.tage.flatMap((t) => t.karten.filter((k) => k.art === "kapitel").map((k) => ({ ...k, datum: t.datum })));
  for (const k of kapitel.filter((k) => k.teil === 1)) assert.equal(new Date(k.datum + "T12:00:00Z").getUTCDay(), 1, `${k.werk} beginnt an einem Montag`);
  assert.deepEqual([...new Set(kapitel.map((k) => k.werk))], ["Das kalte Herz", "Immensee", "Wintermärchen der Brüder Grimm", "Kalendergeschichten aus dem Schatzkästlein"]);
});

test("Jänner 2027: 31 Rätsel ohne Wiederholung, vier Werke ab Montag, alle von vor 1956 und im Stand „fertig“", async () => {
  const q = JSON.parse(await readFile(new URL("../pakete/tage-2027-01/paket.quelle.json", import.meta.url), "utf8"));
  const inhalt = JSON.parse(await readFile(new URL("../pakete/tage-2027-01/inhalt/tage.json", import.meta.url), "utf8"));
  assert.deepEqual(tageInhaltFehler(inhalt, q.tage), []);
  assert.deepEqual(q.tage, { von: "2027-01-01", bis: "2027-01-31" });
  const raetsel = inhalt.tage.map((t) => t.karten.find((k) => k.art === "raetsel"));
  assert.equal(raetsel.filter(Boolean).length, 31);
  const alt = [];
  for (const m of ["2026-10", "2026-11", "2026-12"]) alt.push(...JSON.parse(await readFile(new URL(`../pakete/tage-${m}/inhalt/tage.json`, import.meta.url), "utf8")).tage.flatMap((t) => t.karten));
  const fragen = new Set(alt.filter((k) => k.art === "raetsel").map((k) => k.frage));
  const loesungen = new Set(alt.filter((k) => k.art === "raetsel").map((k) => k.loesung));
  for (const r of raetsel) { assert.ok(!fragen.has(r.frage), `${r.id} wiederholt eine Frage`); assert.ok(!loesungen.has(r.loesung), `${r.id} wiederholt eine Lösung`); }
  const kapitel = inhalt.tage.flatMap((t) => t.karten.filter((k) => k.art === "kapitel").map((k) => ({ ...k, datum: t.datum })));
  for (const k of kapitel.filter((k) => k.teil === 1)) assert.equal(new Date(k.datum + "T12:00:00Z").getUTCDay(), 1, `${k.werk} beginnt an einem Montag`);
  assert.deepEqual([...new Set(kapitel.map((k) => k.werk))], ["Der Condor", "Mozart auf der Reise nach Prag", "Die schwarze Spinne", "Unterm Birnbaum"]);
  assert.equal(kapitel.length, 28);
  // keine Titelzeile und kein leerer Absatz im Lesetext
  for (const k of kapitel) for (const a of k.absaetze) assert.ok(a.trim() && a !== "Unterm Birnbaum.", `${k.id}: Absatz leer oder Titel`);
});

test("Antwort prüfen: Groß/klein, Leer- und Satzzeichen, Umlaute, Ziffer und Zahlwort, Füllwörter, falsche Antworten", () => {
  // Groß/klein, Leerzeichen, Satzzeichen
  assert.ok(antwortRichtig("  palme! ", ["Palme"]));
  assert.ok(antwortRichtig("P A L M E", ["Palme"]));
  assert.ok(antwortRichtig("»Sonne«.", ["Sonne"]));
  // Umlaute und ß in beiden Schreibweisen
  assert.ok(antwortRichtig("Zuendholz", ["Zündholz"]));
  assert.ok(antwortRichtig("Zündholz", ["Zuendholz"]));
  assert.ok(antwortRichtig("Reissverschluss", ["Reißverschluss"]));
  assert.ok(antwortRichtig("FÜNFTEN Nacht", ["fünften Nacht"]));
  // Ziffer und Zahlwort, auch zusammengesetzt
  assert.ok(antwortRichtig("drei", ["3"]));
  assert.ok(antwortRichtig("3", ["drei"]));
  assert.ok(antwortRichtig("sechsundfünfzig", ["56"]));
  assert.ok(antwortRichtig("eintausendvierhundertvierzig", ["1440"]));
  assert.ok(antwortRichtig("dreitausendsechshundert", ["3600"]));
  assert.ok(antwortRichtig("zwölf", ["12"]));
  assert.ok(antwortRichtig("zwoelf", ["12"]));
  // reine Zahl: ein Wort danach ist erlaubt, eine andere Zahl nicht
  assert.ok(antwortRichtig("12 Runden", ["12"]));
  assert.ok(antwortRichtig("drei Grad", ["3"]));
  assert.ok(!antwortRichtig("120", ["12"]));
  assert.ok(!antwortRichtig("1 2", ["3"]));
  // Füllwörter vorn
  assert.ok(antwortRichtig("Die Dunkelheit", ["Dunkelheit"]));
  assert.ok(antwortRichtig("Er hat eine Glatze.", ["Glatze"]));
  assert.ok(antwortRichtig("Um 9 Uhr früh", ["9"]));
  // Uhrzeiten und Beträge
  assert.ok(antwortRichtig("8.20", ["8:20"]));
  assert.ok(antwortRichtig("halb drei", ["halb 3"]));
  assert.ok(antwortRichtig("2.50", ["2,50"]));
  // falsch und leer
  assert.ok(!antwortRichtig("Birne", ["Palme"]));
  assert.ok(!antwortRichtig("vier", ["3"]));
  assert.ok(!antwortRichtig("", ["3"]));
  assert.ok(!antwortRichtig("   ", ["3"]));
  assert.ok(!antwortRichtig("3", undefined));
  // Zahlwörter
  assert.equal(zahlwort("einhundertsechsundfuenfzig"), 156);
  assert.equal(zahlwort("hundert"), 100);
  assert.equal(zahlwort("palme"), null);
  assert.equal(antwortNormal("Ein Handtuch"), "handtuch");
});

test("Rätsel Oktober bis Jänner: Kurzantworten vollständig, Erklärrätsel ohne Feld, jede Antwortliste passt zu sich selbst", async () => {
  const ERKLAER = ["r-005", "r-008", "r-016", "r-018", "r-030", "r-037", "r-039", "r-046", "r-057", "r-104", "r-113", "r-141"];
  let mit = 0;
  for (const m of ["2026-10", "2026-11", "2026-12", "2027-01"]) {
    const inhalt = JSON.parse(await readFile(new URL(`../pakete/tage-${m}/inhalt/tage.json`, import.meta.url), "utf8"));
    for (const k of inhalt.tage.flatMap((t) => t.karten).filter((k) => k.art === "raetsel")) {
      if (ERKLAER.includes(k.id)) { assert.equal(k.antworten, undefined, `${k.id}: Erklärrätsel ohne Feld`); continue; }
      assert.ok(Array.isArray(k.antworten) && k.antworten.length, `${k.id}: antworten fehlen`);
      for (const a of k.antworten) assert.ok(antwortRichtig(a, k.antworten), `${k.id}: „${a}“`);
      assert.ok(antwortNormal(k.antworten[0]).length > 0, k.id);
      assert.ok(!antwortRichtig("xyz", k.antworten), `${k.id}: nimmt alles`);
      mit++;
    }
  }
  assert.equal(mit, 111);
});

test("Kit: antworten ist optional, wenn vorhanden eine nicht leere Liste von Texten", () => {
  const tag = (antworten) => ({ format: 1, tage: [{ datum: "2027-01-01", karten: [{ art: "raetsel", id: "r-x", frage: "?", loesung: "3", ...(antworten === undefined ? {} : { antworten }) }] }] });
  const b = { von: "2027-01-01", bis: "2027-01-01" };
  assert.deepEqual(tageInhaltFehler(tag(undefined), b), []);
  assert.deepEqual(tageInhaltFehler(tag(["3", "drei"]), b), []);
  for (const falsch of [[], "3", [""], [3], ["x".repeat(121)]]) assert.ok(tageInhaltFehler(tag(falsch), b).some((f) => /antworten/.test(f)), JSON.stringify(falsch));
});
