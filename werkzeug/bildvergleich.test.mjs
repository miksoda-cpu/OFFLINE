// Tests für die Prüfstufen Bildvergleich und Barrierefreiheit (Auftrag Nr. 21), ohne Browser:
// PNG lesen/schreiben, der Vergleich findet eine Verschiebung um 2 px, die Ausnahmeliste hat Gründe,
// Referenzbilder passen zur Seitenliste und werden im CI nie gesetzt.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pngLesen, pngSchreiben, vergleichen } from "./png.mjs";
import { ausnahmeFuer, ausnahmenPruefen, ERNST } from "./barrierefrei.mjs";
import { seitenListe, BREITEN, FARBEN } from "./seiten.mjs";

const HIER = path.dirname(fileURLToPath(import.meta.url));

/** Eine kleine „Seite“: heller Grund, drei dunkle Balken; `versatz` schiebt den zweiten und dritten Balken nach unten. */
function seite(versatz = 0, breite = 60, hoehe = 80) {
  const pixel = new Uint8Array(breite * hoehe * 4).fill(245);
  const balken = (y0) => { for (let y = y0; y < y0 + 6; y++) for (let x = 8; x < 52; x++) { const o = (y * breite + x) * 4; pixel[o] = 30; pixel[o + 1] = 30; pixel[o + 2] = 40; } };
  balken(10); balken(30 + versatz); balken(50 + versatz);
  return { breite, hoehe, pixel };
}

test("PNG schreiben und lesen ergibt dieselben Pixel", () => {
  const b = seite(), zurueck = pngLesen(pngSchreiben(b));
  assert.equal(zurueck.breite, b.breite); assert.equal(zurueck.hoehe, b.hoehe);
  assert.deepEqual(Buffer.from(zurueck.pixel), Buffer.from(b.pixel));
});

test("gleiche Bilder: keine Abweichung", () => {
  const v = vergleichen(seite(), seite());
  assert.equal(v.anders, 0); assert.equal(v.gleicheGroesse, true); assert.equal(v.rahmen, null);
});

test("ein Abstand 2 px größer wird gefunden, mit Rahmen und Differenzbild", () => {
  const v = vergleichen(seite(), seite(2));
  assert.ok(v.anders > 0, "Verschiebung um 2 px nicht gefunden");
  assert.equal(v.rahmen.y, 30); // ab dem verschobenen Balken
  const d = pngLesen(pngSchreiben(v.differenz));
  const o = (31 * d.breite + 20) * 4; // im verschobenen Bereich: rot
  assert.deepEqual([...d.pixel.subarray(o, o + 3)], [230, 0, 40]);
});

test("andere Größe ist immer eine Abweichung", () => {
  const v = vergleichen(seite(0, 60, 80), seite(0, 60, 82));
  assert.equal(v.gleicheGroesse, false); assert.ok(v.anders >= 60 * 2);
});

test("Schwelle: kleine Farbunterschiede (Kantenglättung) zählen nicht, große schon", () => {
  const a = seite(), b = seite(); b.pixel[0] = 245 - 10;
  assert.equal(vergleichen(a, b, { schwelle: 16 }).anders, 0);
  b.pixel[0] = 245 - 40;
  assert.equal(vergleichen(a, b, { schwelle: 16 }).anders, 1);
});

test("Chrome-PNG mit RGB und Filtern wird gelesen (Paeth, Up, Sub)", async () => {
  // eine echte Referenz aus dem Repo, wenn vorhanden; sonst das eigene Format
  const ref = (await readdir(path.join(HIER, "referenz"))).find((n) => n.endsWith(".png"));
  if (!ref) return;
  const b = pngLesen(await readFile(path.join(HIER, "referenz", ref)));
  assert.ok(b.breite >= 360 && b.hoehe >= 600);
});

test("Ausnahmeliste: jeder Eintrag hat Regel und Grund, passt nur auf seine Regel und Seite", async () => {
  const { ausnahmen } = JSON.parse(await readFile(path.join(HIER, "barrierefrei-ausnahmen.json"), "utf8"));
  assert.deepEqual(ausnahmenPruefen(ausnahmen), []);
  assert.deepEqual(ausnahmenPruefen([{ regel: "image-alt" }]), ["Eintrag 1 (image-alt): Grund fehlt"]);
  const liste = [{ regel: "color-contrast", seite: "karte", grund: "nur Leaflet-Quellenzeile" }];
  assert.ok(ausnahmeFuer(liste, "color-contrast", "karte", "a"));
  assert.equal(ausnahmeFuer(liste, "color-contrast", "notfall", "a"), undefined);
  assert.equal(ausnahmeFuer(liste, "image-alt", "karte", "img"), undefined);
  // Ein Bild ohne Alternativtext ist nie ausgenommen
  assert.equal(ausnahmen.some((a) => a.regel === "image-alt"), false);
  assert.deepEqual(ERNST, ["serious", "critical"]);
});

test("Referenzbilder: zu jeder Seite, Breite und Farbe genau eines, kein übriges", async () => {
  const da = (await readdir(path.join(HIER, "referenz"))).filter((n) => n.endsWith(".png")).sort();
  const soll = (await seitenListe()).flatMap((s) => BREITEN.flatMap((b) => FARBEN.map((f) => `${s.name}-${b}-${f}.png`))).sort();
  assert.deepEqual(da, soll);
  const tol = JSON.parse(await readFile(path.join(HIER, "referenz", "toleranz.json"), "utf8"));
  assert.ok(tol.standard.anteil <= 0.001 && tol.standard.schwelle <= 32, "Standard-Toleranz muss eng bleiben");
  for (const [seite, t] of Object.entries(tol.seiten ?? {})) assert.ok(t.grund, `Toleranz für ${seite} ohne Grund`);
});

test("im CI wird die Referenz nie gesetzt", () => {
  const r = spawnSync(process.execPath, [path.join(HIER, "bildvergleich.mjs"), "--chrome", "--referenz-setzen"], { env: { ...process.env, CI: "true", CHROME: "/gibt/es/nicht" }, encoding: "utf8" });
  assert.equal(r.status, 2); assert.match(r.stderr, /nie gesetzt/);
});
