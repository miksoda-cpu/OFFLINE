// Tests für das Paketformat. Ausführen: node --test werkzeug/
// Diese Fälle sind die Messlatte für jede Umsetzung – auch für den Rust-Kern der App.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  schluesselErzeugen, privatAusPem, signiere, pruefeSignatur, hashDatei, pfadGueltig, versionVergleich,
  paketBauen, paketPruefen, delta, katalogBauen, katalogPruefen, sha256,
} from "./paket-lib.mjs";

const k = schluesselErzeugen("Test");
const privat = privatAusPem(k.privatPem);
const bekannte = [k.oeffentlich];

async function quelle(dateien, meta = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "offline-q-"));
  await mkdir(path.join(dir, "inhalt"), { recursive: true });
  for (const [p, inhalt] of Object.entries(dateien)) {
    await mkdir(path.dirname(path.join(dir, "inhalt", p)), { recursive: true });
    await writeFile(path.join(dir, "inhalt", p), inhalt);
  }
  await writeFile(path.join(dir, "paket.quelle.json"), JSON.stringify({
    id: "test-paket", titel: "Test", beschreibung: "Testpaket", art: "inhalt", lizenz: "CC0",
    herausgeber: "Test", quellen: [], ...meta,
  }));
  return dir;
}

test("Signatur: gültig, manipuliert, unbekannter Schlüssel, abgelaufen", () => {
  const bytes = Buffer.from('{"a":1}\n');
  const sig = signiere(bytes, privat);
  assert.equal(sig.schluessel, k.id);
  assert.ok(pruefeSignatur(bytes, sig, bekannte).ok);
  assert.equal(pruefeSignatur(Buffer.from('{"a":1} \n'), sig, bekannte).ok, false, "ein Leerzeichen mehr → ungültig");
  assert.match(pruefeSignatur(bytes, { ...sig, schluessel: "0000000000000000" }, bekannte).grund, /Unbekannter/);
  assert.match(pruefeSignatur(bytes, sig, [{ ...k.oeffentlich, gueltig_bis: "2020-01-01" }]).grund, /abgelaufen/);
  assert.match(pruefeSignatur(bytes, sig, [{ ...k.oeffentlich, zweck: ["katalog"] }]).grund, /nicht für pakete/);
  assert.equal(pruefeSignatur(bytes, { ...sig, signatur: "AAAA" }, bekannte).ok, false);
});

test("Pfade: nur unter inhalt/, keine Ausbrüche", () => {
  for (const ok of ["inhalt/a.json", "inhalt/ordner/b.zim", "inhalt/ä ö.txt"]) assert.ok(pfadGueltig(ok), ok);
  for (const schlecht of ["a.json", "/inhalt/a", "inhalt/../x", "inhalt/./x", "inhalt//x", "inhalt\\x", "inhalt/", "C:inhalt/x", "inhalt/a\nb", ""]) {
    assert.equal(pfadGueltig(schlecht), false, JSON.stringify(schlecht));
  }
});

test("Versionen vergleichen", () => {
  assert.equal(versionVergleich("2026.09.24", "2026.09.24"), 0);
  assert.equal(versionVergleich("2026.09.24", "2026.09.24.1"), -1);
  assert.equal(versionVergleich("2026.10.01", "2026.09.30"), 1);
  assert.equal(versionVergleich("2026.09.24.2", "2026.09.24.10"), -1, "numerisch, nicht alphabetisch");
});

test("Teil-Prüfsummen: Teile stimmen mit Einzelhashes überein, letztes Teil kürzer", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "offline-h-"));
  const daten = Buffer.alloc(2_500_000);
  for (let i = 0; i < daten.length; i++) daten[i] = (i * 7) & 0xff;
  const p = path.join(dir, "gross.bin");
  await writeFile(p, daten);
  const h = await hashDatei(p, 1_000_000);
  assert.equal(h.groesse, daten.length);
  assert.equal(h.sha256, sha256(daten));
  assert.equal(h.teile.length, 3);
  assert.equal(h.teile[0], sha256(daten.subarray(0, 1_000_000)));
  assert.equal(h.teile[2], sha256(daten.subarray(2_000_000)));
  await rm(dir, { recursive: true });
});

test("Paket bauen und prüfen; jede Manipulation fällt auf", async () => {
  const q = await quelle({ "a.json": '{"x":1}', "tief/b.txt": "hallo" });
  const ziel = await mkdtemp(path.join(os.tmpdir(), "offline-z-"));
  const { ziel: ordner, manifest } = await paketBauen(q, ziel, privat, { jetzt: new Date("2026-09-24T12:00:00Z") });
  assert.equal(path.basename(ordner), "test-paket-2026.09.24");
  assert.deepEqual(manifest.dateien.map((d) => d.pfad), ["inhalt/a.json", "inhalt/tief/b.txt"]);
  assert.equal(manifest.groesse, 12);
  assert.ok((await paketPruefen(ordner, bekannte)).ok);

  // Datei verändert
  await writeFile(path.join(ordner, "inhalt", "a.json"), '{"x":2}');
  let r = await paketPruefen(ordner, bekannte);
  assert.equal(r.ok, false); assert.match(r.fehler[0], /Prüfsumme falsch: inhalt\/a.json/);
  await writeFile(path.join(ordner, "inhalt", "a.json"), '{"x":1}');

  // Datei fehlt
  await rm(path.join(ordner, "inhalt", "tief", "b.txt"));
  r = await paketPruefen(ordner, bekannte);
  assert.match(r.fehler[0], /Datei fehlt/);
  await writeFile(path.join(ordner, "inhalt", "tief", "b.txt"), "hallo");

  // Manifest verändert (auch wenn der Inhalt „harmlos“ ist) → Signatur ungültig
  const m = JSON.parse(await readFile(path.join(ordner, "paket.json"), "utf8"));
  m.pro = true;
  await writeFile(path.join(ordner, "paket.json"), JSON.stringify(m, null, 2) + "\n");
  r = await paketPruefen(ordner, bekannte);
  assert.match(r.fehler[0], /Signatur passt nicht/);

  // Fremder Schlüssel
  const fremd = schluesselErzeugen("Fremd");
  const { ziel: fremdOrdner } = await paketBauen(q, await mkdtemp(path.join(os.tmpdir(), "offline-f-")), privatAusPem(fremd.privatPem));
  r = await paketPruefen(fremdOrdner, bekannte);
  assert.match(r.fehler[0], /Unbekannter Schlüssel/);
  await rm(q, { recursive: true }); await rm(ziel, { recursive: true });
});

test("Bauen lehnt Pfad-Ausbruch im Manifest ab", async () => {
  const q = await quelle({ "a.json": "1" }, { id: "Ungültig!" });
  await assert.rejects(paketBauen(q, await mkdtemp(path.join(os.tmpdir(), "offline-x-")), privat), /id ungültig/);
  await rm(q, { recursive: true });
});

test("Delta: nur geänderte Dateien, geänderte Teile, gelöschte Dateien", () => {
  const alt = { version: "1", groesse: 0, dateien: [
    { pfad: "inhalt/a", sha256: "aa", groesse: 10 },
    { pfad: "inhalt/b", sha256: "bb", groesse: 10 },
    { pfad: "inhalt/weg", sha256: "ww", groesse: 10 },
    { pfad: "inhalt/gross", sha256: "g1", groesse: 250, teilgroesse: 100, teile: ["t1", "t2", "t3"] },
  ] };
  const neu = { version: "2", groesse: 10 + 10 + 5 + 250, dateien: [
    { pfad: "inhalt/a", sha256: "aa", groesse: 10 },
    { pfad: "inhalt/b", sha256: "b2", groesse: 10 },
    { pfad: "inhalt/neu", sha256: "nn", groesse: 5 },
    { pfad: "inhalt/gross", sha256: "g2", groesse: 250, teilgroesse: 100, teile: ["t1", "X", "t3"] },
  ] };
  const d = delta(alt, neu);
  assert.deepEqual(d.laden.map((l) => l.pfad), ["inhalt/b", "inhalt/neu", "inhalt/gross"]);
  assert.deepEqual(d.laden[2].teile, [1]);
  assert.equal(d.bytes, 10 + 5 + 100);
  assert.deepEqual(d.loeschen, ["inhalt/weg"]);
  // Letztes Teil kürzer: 250 Bytes, Teil 3 hat 50
  const d2 = delta(alt, { ...neu, dateien: [{ ...neu.dateien[3], teile: ["t1", "t2", "Y"] }] });
  assert.equal(d2.bytes, 50);
  assert.equal(delta(null, neu).bytes, neu.groesse, "Neuinstallation lädt alles");
});

test("Katalog: bauen, prüfen, Rollback-Schutz, Ablauf", async () => {
  const q = await quelle({ "a.json": "1" });
  const ziel = await mkdtemp(path.join(os.tmpdir(), "offline-k-"));
  const { ziel: ordner } = await paketBauen(q, ziel, privat);
  // relativ zum echten Datum, weil der Testschlüssel ab „heute“ gilt (gueltig_ab)
  const jetzt = new Date(); jetzt.setUTCHours(12, 0, 0, 0);
  const morgen = new Date(jetzt.getTime() + 86400000).toISOString();
  const inEinemJahr = new Date(jetzt.getTime() + 400 * 86400000);
  const { katalog, bytes, sig } = await katalogBauen([ordner], {
    basis: "https://example.org/pakete/", bekannte, privat, jetzt,
    geplant: [{ id: "wiki-de", titel: "Wikipedia", art: "zim", pro: false, groesse: 1 }],
  });
  assert.equal(katalog.pakete.length, 2);
  assert.equal(katalog.pakete[0].sha256_manifest, sha256(await readFile(path.join(ordner, "paket.json"))));
  assert.equal(katalog.pakete[1].status, "geplant");
  assert.ok(katalogPruefen(bytes, sig, bekannte, { jetzt }).ok);
  assert.match(katalogPruefen(bytes, sig, bekannte, { jetzt, zuletztErstellt: morgen }).grund, /Rollback/);
  assert.equal(katalogPruefen(bytes, sig, bekannte, { jetzt: inEinemJahr }).veraltet, true);
  assert.equal(katalogPruefen(Buffer.from(bytes.toString() + " "), sig, bekannte, { jetzt }).ok, false);
  await assert.rejects(katalogBauen([ordner, ordner], { basis: "x", bekannte, privat, jetzt }), /doppelte/);
  // Zwei Versionen desselben Pakets: die neuere zählt, die ältere fällt weg
  const alt = JSON.parse(await readFile(path.join(ordner, "paket.json"), "utf8"));
  const { ziel: neuOrdner } = await paketBauen(q, path.join(ziel, "neu"), privat, { jetzt: new Date(jetzt.getTime() + 864e5) });
  const zwei = await katalogBauen([ordner, neuOrdner], { basis: "x", bekannte, privat, jetzt });
  assert.equal(zwei.katalog.pakete.filter((p) => p.id === alt.id).length, 1);
  assert.ok(zwei.katalog.pakete.find((p) => p.id === alt.id).version > alt.version, "neuere Version zählt");
  await rm(q, { recursive: true }); await rm(ziel, { recursive: true });
});

// ---------- Paket-Kit: Prüfprogramm und der Weg aus PAKET-KIT.md Abschnitt 9 ----------

import { pruefeQuellordner } from "../paket-kit/pruefen.mjs";
import { cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const KIT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "paket-kit");

/** Kopie eines Kit-Ordners in ein Temp-Verzeichnis, damit Tests nichts im Repo verändern. */
async function kitKopie(rel) {
  const dir = path.join(await mkdtemp(path.join(os.tmpdir(), "offline-kit-")), path.basename(rel));
  await cp(path.join(KIT, rel), dir, { recursive: true });
  return dir;
}

async function quelleAendern(ordner, f) {
  const p = path.join(ordner, "paket.quelle.json");
  const m = JSON.parse(await readFile(p, "utf8"));
  f(m);
  await writeFile(p, JSON.stringify(m, null, 2));
}

test("Paket-Kit: Beispiel Wichteln ist grün", async () => {
  const r = await pruefeQuellordner(path.join(KIT, "beispiel", "wichteln"), { bericht: false });
  assert.deepEqual(r.fehler, []);
});

test("Paket-Kit: Vorlage meldet nur leere Felder und fehlende Bilder", async () => {
  const r = await pruefeQuellordner(path.join(KIT, "vorlage"), { bericht: false });
  assert.ok(r.fehler.length > 0, "eine leere Vorlage darf nicht grün sein");
  for (const f of r.fehler) assert.match(f, /fehlt/, f);
});

test("Paket-Kit: quellen[].id ist Pflicht, eindeutig, und Verweise müssen passen", async () => {
  const o = await kitKopie("beispiel/wichteln");
  await quelleAendern(o, (m) => { m.quellen = [{ name: "ohne id", url: "" }, { id: "a", name: "A", url: "" }, { id: "a", name: "B", url: "" }]; });
  let r = await pruefeQuellordner(o, { bericht: false });
  assert.ok(r.fehler.some((f) => /quellen\[0\]: id fehlt/.test(f)));
  assert.ok(r.fehler.some((f) => /quellen\[2\]: id „a" doppelt/.test(f)));

  await quelleAendern(o, (m) => { m.quellen = [{ id: "eigen", name: "eigene Entwicklung", url: "" }]; });
  await writeFile(path.join(o, "inhalt", "daten.json"), JSON.stringify({ eintraege: [{ text: "x", quelle: "eigen" }, { text: "y", quelle: "gibts-nicht" }] }));
  r = await pruefeQuellordner(o, { bericht: false });
  assert.deepEqual(r.fehler, ["inhalt/daten.json: verweist auf Quelle „gibts-nicht\", die in paket.quelle.json → quellen fehlt"]);
});

test("Paket-Kit: Notfallanleitung ohne Notrufhinweis ist ein Fehler", async () => {
  const o = await kitKopie("beispiel/wichteln");
  await quelleAendern(o, (m) => { m.art = "inhalt"; m.kategorie = "ernstfall"; delete m.datenversion; });
  await rm(path.join(o, "inhalt", "modul"), { recursive: true });
  const guide = { typ: "guide", titel: "Blackout", phasen: [] };
  await writeFile(path.join(o, "inhalt", "guide.json"), JSON.stringify(guide));
  let r = await pruefeQuellordner(o, { bericht: false });
  assert.ok(r.fehler.some((f) => /guide.json: Notfallanleitung ohne Notrufhinweis/.test(f)), r.fehler.join("\n"));

  await writeFile(path.join(o, "inhalt", "guide.json"), JSON.stringify({ ...guide, notruf: { frage: "Alles gut?", nummer: "144" } }));
  r = await pruefeQuellordner(o, { bericht: false });
  assert.ok(r.fehler.some((f) => /notruf.frage muss/.test(f)));

  await writeFile(path.join(o, "inhalt", "guide.json"), JSON.stringify({ ...guide, notruf: { frage: "Ist jemand in Gefahr?", nummer: "144" } }));
  r = await pruefeQuellordner(o, { bericht: false });
  assert.deepEqual(r.fehler, []);

  // auch außerhalb von „ernstfall“, wenn der Inhalt sich selbst als Notfall kennzeichnet
  await quelleAendern(o, (m) => { m.kategorie = "unterwegs"; });
  await writeFile(path.join(o, "inhalt", "zecke.json"), JSON.stringify({ typ: "nachschlage-guide", notfall: true }));
  r = await pruefeQuellordner(o, { bericht: false });
  assert.ok(r.fehler.some((f) => /zecke.json: Notfallanleitung ohne Notrufhinweis/.test(f)));
});

test("Paket-Kit: Code nur in Modulen, nur unter modul/, Module nur mit pruefstatus redaktion", async () => {
  const o = await kitKopie("beispiel/wichteln");
  await writeFile(path.join(o, "inhalt", "helfer.js"), "1");
  await writeFile(path.join(o, "inhalt", "seite.html"), "<p onclick=\"x()\">hi</p>");
  await quelleAendern(o, (m) => { m.pruefstatus = "community"; });
  const r = await pruefeQuellordner(o, { bericht: false });
  assert.ok(r.fehler.some((f) => /helfer.js: Skript außerhalb/.test(f)));
  assert.ok(r.fehler.some((f) => /seite.html: Skript in .html außerhalb/.test(f)));
  assert.ok(r.fehler.some((f) => /pruefstatus muss redaktion/.test(f)));
});

test("Paket-Kit: Update-Prüfung mit --vorher", async () => {
  const alt = await kitKopie("beispiel/wichteln");
  const neu = await kitKopie("beispiel/wichteln");
  await quelleAendern(neu, (m) => { m.datenversion = 2; m.alter_ab = 0; });
  const r = await pruefeQuellordner(neu, { vorher: alt, bericht: false });
  assert.ok(r.fehler.some((f) => /aenderungen ist unverändert/.test(f)));
  assert.ok(r.fehler.some((f) => /alter_ab gesunken/.test(f)));
  assert.ok(r.fehler.some((f) => /migration.js fehlt/.test(f)));
  assert.ok(r.fehler.some((f) => /Was hat sich geändert/.test(f)));
});

test("Paket-Kit: Weg aus Abschnitt 9 – prüfen, ablegen, bauen, Manifest mit Kit-Angaben, Katalog", async () => {
  // Ein Inhaltspaket nach Vorlage: Wichteln ohne Oberfläche reicht als ausgefüllter Quellordner.
  const abgabe = await kitKopie("beispiel/wichteln");
  await quelleAendern(abgabe, (m) => { m.id = "kit-probe"; m.art = "inhalt"; delete m.datenversion; });
  await rm(path.join(abgabe, "inhalt", "modul"), { recursive: true });
  assert.deepEqual((await pruefeQuellordner(abgabe, { bericht: true })).fehler, []);   // 1. prüfen, Bericht liegt bei

  const repo = await mkdtemp(path.join(os.tmpdir(), "offline-repo-"));
  const quelleImRepo = path.join(repo, "pakete", "kit-probe");
  await cp(abgabe, quelleImRepo, { recursive: true });                                 // 2. Quelle ablegen
  const { ziel: ordner, manifest } = await paketBauen(quelleImRepo, path.join(repo, "web", "pakete"), privat, { pruefen: true }); // 3. bauen, signieren
  assert.ok((await paketPruefen(ordner, bekannte)).ok);
  assert.equal(manifest.kategorie, "miteinander");
  assert.equal(manifest.alter_ab, 6);
  assert.equal(manifest.preis, "gratis");
  assert.equal(manifest.pruefstatus, "redaktion");
  assert.equal(manifest.datenversion, undefined, "datenversion nur bei Modulen");
  assert.deepEqual(manifest.quellen, [{ id: "eigen", name: "eigene Entwicklung", url: "" }]);
  assert.ok(!manifest.dateien.some((d) => /PRUEFBERICHT|LIESMICH|paket\.quelle/.test(d.pfad)), "nur inhalt/ wird ausgeliefert");
  const { katalog } = await katalogBauen([ordner], { basis: "x/", bekannte, privat });  // 4. Katalog
  assert.equal(katalog.pakete[0].kategorie, "miteinander");
  await rm(repo, { recursive: true });
});

test("Paket-Kit: bauen mit --pruefen verweigert ein fehlerhaftes Paket", async () => {
  const o = await kitKopie("beispiel/wichteln");
  await quelleAendern(o, (m) => { m.art = "inhalt"; m.titel = ""; delete m.datenversion; });
  await rm(path.join(o, "inhalt", "modul"), { recursive: true });
  await assert.rejects(paketBauen(o, await mkdtemp(path.join(os.tmpdir(), "offline-x-")), privat, { pruefen: true }), /Prüfprogramm meldet 1 Fehler:\n  titel fehlt/);
});

test("Paket-Kit: PFLICHTENHEFT.md ist wortgleich mit docs/PAKET-KIT.md", async () => {
  const docs = await readFile(path.join(KIT, "..", "docs", "PAKET-KIT.md"), "utf8");
  assert.equal(await readFile(path.join(KIT, "PFLICHTENHEFT.md"), "utf8"), docs, "nach Änderungen: cp docs/PAKET-KIT.md paket-kit/PFLICHTENHEFT.md");
});
