// node --test web/naturheilkunde.test.mjs – Paket „naturheilkunde“ (in Prüfung): Umwandler aus den elf Beilagen.
// Alle Teile ohne Absturz, eindeutige Kennungen, nur erlaubte Werte, Prüfstatus überall „in_pruefung“, Sperren aus
// Teil 6, Erste-Hilfe-Karte, jede Zeile der Quelle wörtlich in einem Text, Paket-JSON gleich frischem Lauf.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { umwandeln, quellenLesen, TEILE, BELEGBARKEIT, ORTE, MARKEN, stufenIn, ortAus, istGesperrt } from "../pakete/naturheilkunde/naturheilkunde-umwandeln.mjs";

// Das Repo ist öffentlich: Quellen und Paketinhalt liegen dort nur verschlüsselt (pakete/naturheilkunde/verschluesselt/).
// Ohne Klartext (CI ohne Secret) werden diese Tests übersprungen; mit Klartext laufen sie lokal und im Workflow „Interner Kanal“.
const DA = existsSync(new URL("../pakete/naturheilkunde/quelle/", import.meta.url)) && existsSync(new URL("../pakete/naturheilkunde/inhalt/naturheilkunde.json", import.meta.url));
const OHNE = DA ? {} : { skip: "Inhalt nur verschlüsselt im Repo" };
const quellen = DA ? await quellenLesen() : null;
const { daten, bericht } = DA ? umwandeln(quellen) : {};
const paket = DA ? JSON.parse(await readFile(new URL("../pakete/naturheilkunde/inhalt/naturheilkunde.json", import.meta.url), "utf8")) : null;

test("alle elf Teile ohne Absturz; Einträge, wo Karten stehen; Kapitel überall", OHNE, () => {
  assert.deepEqual(daten.teile.map((t) => t.nr), TEILE.map((t) => t.nr));
  const zahl = Object.fromEntries(daten.teile.map((t) => [t.nr, t.eintraege.length]));
  for (const nr of [1, 2, 3, 4, 5, 7, 8, 9]) assert.ok(zahl[nr] > 0, `Teil ${nr} hat Einträge`);
  for (const nr of [0, 6, 10]) assert.equal(zahl[nr], 0, `Teil ${nr} besteht nur aus Kapiteln`);
  for (const t of daten.teile) assert.ok(t.kapitel.length > 0, `Teil ${t.nr} hat Kapitel`);
  // Zahlen der Beilagen: Teil 1 Warnkarten 3.1–3.38 und 4.1–4.8, Teil 9 rund 72 Pflanzen
  assert.equal(zahl[1], 46);
  assert.equal(zahl[9], 72);
});

test("jede Kennung ist eindeutig und ASCII; Teile verweisen nur auf Vorhandenes", OHNE, () => {
  const ids = [...daten.eintraege, ...daten.kapitel, ...daten.wechselwirkungen, ...daten.ausfall].map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, "keine doppelte Kennung");
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/, id);
  const e = new Set(daten.eintraege.map((x) => x.id)), k = new Set(daten.kapitel.map((x) => x.id));
  for (const t of daten.teile) {
    for (const id of t.eintraege) assert.ok(e.has(id), id);
    for (const id of t.kapitel) assert.ok(k.has(id), id);
  }
  for (const b of daten.beschwerden_index) for (const id of b.eintraege) assert.ok(e.has(id), `${b.beschwerde}: ${id}`);
  for (const w of daten.waldfunde_index) for (const id of [...w.kandidaten, ...w.doppelgaenger]) assert.ok(e.has(id), `${w.merkmal}: ${id}`);
});

test("Prüfstatus überall in_pruefung; Belegbarkeit, Ort und Marken nur mit erlaubten Werten", OHNE, () => {
  assert.equal(daten.pruefstatus, "in_pruefung");
  for (const x of [...daten.eintraege, ...daten.kapitel]) assert.equal(x.pruefstatus, "in_pruefung", x.id);
  for (const e of daten.eintraege) {
    assert.ok(BELEGBARKEIT.includes(e.belegbarkeit), `${e.id}: ${e.belegbarkeit}`);
    assert.ok(ORTE.includes(e.ort), `${e.id}: ${e.ort}`);
    for (const m of e.marken) assert.ok(MARKEN.includes(m), `${e.id}: ${m}`);
    assert.ok(e.text && e.name, e.id);
  }
  for (const k of daten.kapitel) if (k.ort) assert.ok(ORTE.includes(k.ort), k.id);
  // Giftkapitel: Warnung und giftig
  for (const e of daten.eintraege.filter((x) => x.teil === 1)) { assert.equal(e.belegbarkeit, "warnung", e.id); assert.ok(e.marken.includes("giftig"), e.id); }
});

test("Ort: nichts ist für „Suche und Karte“ freigegeben, solange die Zeile einschränkt", OHNE, () => {
  assert.equal(ortAus(["Handbuch; Suche und Karte erst nach Fachprüfung (nur Wechselwirkung/Vorratsregal, Warnung)."]).ort, "handbuch");
  assert.equal(ortAus(["Handbuch; in Suche und Karte nie als Mittel, nur als Warnung."]).ort, "handbuch");
  assert.equal(ortAus(["Suche und Karte."]).ort, "suche_und_karte");
  assert.equal(ortAus(undefined).ort_fehlt, true);
  assert.equal(daten.eintraege.filter((e) => e.ort === "suche_und_karte").length, 0, "die Beilagen geben noch keinen Eintrag frei");
});

test("Belegbarkeit: Stufen aus dem Wortlaut, „nicht belegt“ ist nicht belegt", OHNE, () => {
  assert.deepEqual([...stufenIn("überliefert, nicht geprüft · Warnung.")].sort(), ["ueberliefert_nicht_geprueft", "warnung"]);
  assert.deepEqual([...stufenIn("Primärquelle noch nicht belegt; überliefert, nicht geprüft")], ["ueberliefert_nicht_geprueft"]);
  assert.deepEqual([...stufenIn("traditionell (HMPC \"traditional use\")")], ["traditionell"]);
  assert.deepEqual([...stufenIn("keine Heilquelle gefunden. Belegbarkeit: unklar. Nur Erkennung und Warnung.")], ["unklar"]);
  const weide = daten.eintraege.find((e) => e.id === "t2-silber-weide");
  assert.equal(weide.belegbarkeit, "traditionell", "belegt und traditionell genannt: die schwächere Stufe gilt");
  assert.match(weide.belegbarkeit_text, /^belegt/);
});

test("Teil 6: mindestens eine Wechselwirkung ist gesperrt; „Captcha-Sperre“ sperrt nichts", OHNE, () => {
  const gesperrt = daten.wechselwirkungen.filter((w) => w.gesperrt === true);
  assert.ok(gesperrt.length >= 1);
  for (const p of ["Cayenne", "Boswellia"]) assert.ok(gesperrt.some((w) => w.pflanze === p), p);
  for (const k of ["Lithium", "Antipsychotika", "Protonenpumpenhemmer"]) assert.ok(gesperrt.some((w) => w.mit === k), k);
  assert.ok(daten.ausfall.find((a) => a.nr === "W-9").gesperrt, "Blutdruckmittel allgemein W-9");
  assert.equal(daten.wechselwirkungen.find((w) => w.nr === "1").gesperrt, false, "Johanniskraut × VKA ist belegt");
  assert.equal(istGesperrt("1. **Volltexte von PubMed/PMC/NCBI (LiverTox) waren nicht abrufbar** (Captcha-Sperre; nicht umgangen)."), false);
  for (const w of daten.wechselwirkungen) assert.ok(quellen[6].includes(w.text), `${w.id}: Zeile wörtlich`);
  assert.ok(daten.kapitel.some((k) => k.gesperrt && /^Sperre/.test(k.titel)));
});

test("Erste-Hilfe-Karte: VIZ 01 406 43 43 und 144, Text wörtlich aus Teil 1", OHNE, () => {
  const h = daten.erste_hilfe;
  assert.ok(h, "Block gefunden");
  assert.match(h.text, /01 406 43 43/);
  assert.match(h.text, /\b144\b/);
  assert.match(h.text, /Kein Erbrechen auslösen/);
  assert.match(h.text, /nur nach Anweisung der VIZ/);
  assert.ok(quellen[1].includes(h.text), "wörtlich");
  assert.deepEqual(h.nummern.map((n) => [n.nummer, n.tel]), [["01 406 43 43", "+4314064343"], ["144", "144"]]);
});

test("Texte wörtlich: jeder Text steht so in der Quelle, jede Zeile der Quelle in einem Text", OHNE, () => {
  for (const x of [...daten.eintraege, ...daten.kapitel]) assert.ok(quellen[x.teil].includes(x.text), `${x.id}: Text wörtlich`);
  assert.match(bericht, /Jede nichtleere Zeile der Quellen steht wörtlich/);
  const alle = [...daten.eintraege, ...daten.kapitel];
  for (const t of daten.teile) {
    const texte = alle.filter((x) => x.teil === t.nr).map((x) => x.text).join("\n");
    const fehlt = quellen[t.nr].split("\n").filter((z) => z.trim() && !/^#{1,6}\s|^-{3,}\s*$/.test(z) && !texte.includes(z));
    assert.deepEqual(fehlt, [], `Teil ${t.nr}: Zeilen ohne Text`);
  }
});

test("Indizes aus Teil 0: Beschwerden und Waldfunde zeigen auf Karten, Doppelgänger auf das Giftkapitel", OHNE, () => {
  const husten = daten.beschwerden_index.find((b) => b.beschwerde === "Husten");
  assert.deepEqual(husten.mit, ["Halsreiz"]);
  assert.ok(husten.eintraege.includes("t3-spitzwegerich"));
  const nadel = daten.waldfunde_index.find((w) => w.merkmal.startsWith("Nadelbaum"));
  assert.ok(nadel.doppelgaenger.includes("t1-3-11-eibe"));
  for (const w of daten.waldfunde_index) for (const id of w.doppelgaenger) assert.ok(/^t[124]-/.test(id), `${w.merkmal}: ${id}`);
  assert.ok(daten.eintraege.find((e) => e.id === "t3-spitzwegerich").beschwerden.includes("Husten"));
});

test("Paket-JSON ist gleich einem frischen Lauf des Umwandlers", OHNE, () => {
  assert.deepEqual(paket, JSON.parse(JSON.stringify(daten)));
});
