// Nr. 25: Der eingefrorene Katalog für die alte App (0.1.8) in der Windows-Probe. Er ist ein bereits veröffentlichter,
// signierter Stand (Web-Katalog vom 08.10.2026, 03:39 UTC, Commit db393f1) mit den beiden Paketen, die 0.1.8 früher
// selbst geladen hat. Neu signiert wird hier nichts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { katalogPruefen, paketPruefen, sha256, versionVergleich } from "./paket-lib.mjs";

const ORT = new URL("./probe-katalog/", import.meta.url);
const bekannte = JSON.parse(await readFile(new URL("../schluessel/oeffentlich.json", import.meta.url), "utf8")).schluessel;
const bytes = await readFile(new URL("katalog.json", ORT));
const sig = JSON.parse(await readFile(new URL("katalog.sig", ORT), "utf8"));
const k = JSON.parse(bytes);
// Am Tag der Probe gilt der Schlüssel; ein abgelaufener Katalog wird nur als „veraltet“ markiert, nicht abgelehnt
const g = katalogPruefen(bytes, sig, bekannte, { jetzt: new Date("2026-10-13T12:00:00Z") });

test("Der eingefrorene Katalog ist gültig signiert und vor dem Wechsel von at-basis auf app_min 0.8.0 entstanden", () => {
  assert.ok(g.ok, g.grund);
  assert.equal(sig.schluessel, "1504cefc5d5d7e11", "derselbe Schlüssel, den 0.1.8 eingebettet hat");
  assert.ok(k.erstellt < "2026-10-08T15:29:32Z", k.erstellt);
});

test("at-basis und wir darin erfüllt 0.1.8; die Paketordner gehören per Prüfsumme genau zu diesem Katalog", async () => {
  for (const id of ["at-basis", "wir"]) {
    const e = k.pakete.find((p) => p.id === id && p.status === "verfuegbar");
    assert.ok(e, id);
    if (id === "at-basis") assert.ok(versionVergleich("0.1.8", e.app_min) >= 0, `${id}: app_min ${e.app_min}`);
    const ordner = new URL(`pakete/${e.pfad}`, ORT);
    assert.equal(sha256(await readFile(new URL("paket.json", ordner))), e.sha256_manifest, `${id}: Manifest`);
    const p = await paketPruefen(decodeURIComponent(ordner.pathname).replace(/^\/([A-Za-z]:)/, "$1"), bekannte, { jetzt: new Date("2026-10-13T12:00:00Z") });
    assert.ok(p.ok, `${id}: ${(p.fehler ?? []).join("; ")}`);
  }
  assert.equal(k.pakete.find((p) => p.id === "at-basis").version, "2026.09.29.1", "die Ausgabe mit der Checkliste von 20 Punkten");
});
