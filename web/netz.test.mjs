// Nr. 29 (Heute neu) mit Nachbesserung (Bill, 15.10.2026): Dauer mit Minuten, Seite „Haben andere auch kein Netz?“ mit fünf
// Schritten (Anbieter nur in Österreich), Rat aus den Antworten, Stufen, „Zuletzt Internet …“ mit Tag.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dauerText, seite, rat, stufeFuer, STUFEN, zuletztText, radioSender } from "./netz.js";

test("dauerText: unter 24 Stunden mit Minuten, volle Stunden ohne", () => {
  const m = (n) => n * 60e3;
  assert.equal(dauerText(m(70)), "1 Stunde 10 Minuten");
  assert.equal(dauerText(m(185)), "3 Stunden 5 Minuten");
  assert.equal(dauerText(m(120)), "2 Stunden");
  assert.equal(dauerText(m(61)), "1 Stunde 1 Minute");
  assert.equal(dauerText(m(2)), "2 Minuten"); assert.equal(dauerText(20e3), "weniger als einer Minute");
  assert.equal(dauerText(m(60 * 50)), "2 Tagen");
});

test("Seite „Haben andere auch kein Netz?“: fünf Schritte, A1/Magenta/Drei nur in Österreich", () => {
  const at = seite("andere", "at"), de = seite("andere", "de");
  assert.equal(at.schritte.length, 5); assert.equal(de.schritte.length, 5);
  assert.equal(at.schritte[3][0], "Ruf jemanden an oder schick eine SMS.");
  assert.ok(at.schritte[4][1].includes("deines Anbieters (zum Beispiel A1, Magenta oder Drei). Die Anbieter melden"));
  assert.ok(de.schritte[4][1].includes("die App deines Anbieters. Die Anbieter melden") && !/A1|Magenta|Drei|ORF|Ö3/.test(JSON.stringify(de)));
  assert.equal(seite("ich").schritte.length, 4);
});

test("Rat, Stufen, Radio je Land, „Zuletzt Internet“ mit Tag", () => {
  assert.equal(rat({}), null);
  assert.equal(rat({ flugmodus: "ja", rechnung: "ja", funkloch: "nein", nachbarn: "ja" }, "de").text.includes(radioSender("de")), true);
  assert.equal(rat({ flugmodus: "nein", nachbarn: "ja" }).ziel, "#netz-ich", "zuerst, was du selbst ändern kannst");
  assert.deepEqual([0, 20, 90, 25 * 60, 4 * 24 * 60].map((m) => stufeFuer(m * 60e3)), [0, 1, 2, 3, 4]);
  assert.equal(STUFEN.length, 5);
  const jetzt = new Date(2026, 9, 15, 9, 0).getTime();
  assert.equal(zuletztText(new Date(2026, 9, 15, 8, 30).toISOString(), jetzt), "um 08:30");
  assert.equal(zuletztText(new Date(2026, 9, 14, 18, 46).toISOString(), jetzt), "gestern um 18:46");
  assert.equal(zuletztText(new Date(2026, 9, 13, 18, 46).toISOString(), jetzt), "am 13.10. um 18:46");
});
