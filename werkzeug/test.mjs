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
  const jetzt = new Date("2026-09-24T12:00:00Z");
  const { katalog, bytes, sig } = await katalogBauen([ordner], {
    basis: "https://example.org/pakete/", bekannte, privat, jetzt,
    geplant: [{ id: "wiki-de", titel: "Wikipedia", art: "zim", pro: false, groesse: 1 }],
  });
  assert.equal(katalog.pakete.length, 2);
  assert.equal(katalog.pakete[0].sha256_manifest, sha256(await readFile(path.join(ordner, "paket.json"))));
  assert.equal(katalog.pakete[1].status, "geplant");
  assert.ok(katalogPruefen(bytes, sig, bekannte, { jetzt }).ok);
  assert.match(katalogPruefen(bytes, sig, bekannte, { jetzt, zuletztErstellt: "2026-09-25T00:00:00Z" }).grund, /Rollback/);
  assert.equal(katalogPruefen(bytes, sig, bekannte, { jetzt: new Date("2027-06-01") }).veraltet, true);
  assert.equal(katalogPruefen(Buffer.from(bytes.toString() + " "), sig, bekannte, { jetzt }).ok, false);
  await assert.rejects(katalogBauen([ordner, ordner], { basis: "x", bekannte, privat, jetzt }), /doppelte/);
  await rm(q, { recursive: true }); await rm(ziel, { recursive: true });
});
