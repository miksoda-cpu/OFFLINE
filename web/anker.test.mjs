// node --test web/anker.test.mjs – Auftrag Nr. 23: Befunde aus Miks Anker-Bewertung (11.10.2026), Prüfliste aus dem Anker.
// Vorschau-Bilder lesbar (Antippen zum Vergrößern), Alter als Empfehlung statt Ja/Nein-Frage, Bereit mit Farbcode je Quelle.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { berechne, quelleStand, QUELLE_STAENDE, POSITIONEN } from "./bereit.js";

const lies = (p) => readFile(new URL(p, import.meta.url), "utf8");
const app = await lies("./app.js"), css = await lies("./styles.css"), wesenCss = await lies("./wesen.css");

// ---------- Kontrast (wie web/stil.test.mjs) ----------
const variablen = (block) => Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [m[1], m[2]]));
const blockNach = (text, kopf) => { const i = text.indexOf(kopf); assert.ok(i >= 0, kopf); const a = text.indexOf("{", i + kopf.length - 1); let t = 0, j = a; for (; j < text.length; j++) { if (text[j] === "{") t++; if (text[j] === "}" && --t === 0) break; } return text.slice(a + 1, j); };
const hell = variablen(blockNach(css, ":root {"));
const dunkel = { ...hell, ...variablen(blockNach(css, ':root[data-theme="dark"] {')) };
const lum = (hex) => { const k = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2]; };
const kontrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test("Bereit: Ampel je Quelle – unter einem Drittel wenig, bis zwei Drittel halb, darüber gut", () => {
  assert.equal(quelleStand({ roh: 0, max: 20 }), "wenig");
  assert.equal(quelleStand({ roh: 6.6, max: 20 }), "wenig");
  assert.equal(quelleStand({ roh: 6.7, max: 20 }), "halb");
  assert.equal(quelleStand({ roh: 12, max: 20 }), "halb");
  assert.equal(quelleStand({ roh: 13.4, max: 20 }), "gut");
  assert.equal(quelleStand({ roh: 35, max: 35 }), "gut");
  assert.equal(quelleStand({ max: 0 }), "wenig", "ohne Maximum kein Absturz");
  assert.deepEqual(Object.keys(QUELLE_STAENDE).sort(), ["gut", "halb", "wenig"]);
  // Mit der echten Rechnung: leeres Gerät überall „wenig“, alles bestätigt überall „gut“
  const jetzt = Date.parse("2026-10-14T08:00:00Z"), heute = new Date(jetzt).toISOString();
  assert.ok(berechne({}, jetzt).quellen.every((q) => quelleStand(q) === "wenig"));
  const checks = {}, bestaetigt = {};
  for (const p of POSITIONEN) { if (p.check) checks[p.check] = true; if (!p.auto) bestaetigt[p.id] = heute; }
  const voll = berechne({ checks, bestaetigt, geraet: { paketErstellt: heute, arten: ["inhalt", "zim", "karte"], notfallmappe: true } }, jetzt);
  assert.ok(voll.quellen.every((q) => quelleStand(q) === "gut"), voll.quellen.map((q) => `${q.id} ${q.punkte}/${q.max}`).join(", "));
});

test("Bereit: jede Zeile (Inhalte, Dinge, Menschen, Können) zeigt ihren Stand mit Farbe, in jeder Breite, und in Worten fürs Vorlesen", () => {
  const zeile = app.slice(app.indexOf("${b.quellen.map((q) =>"), app.indexOf("${hilfeZeile(\"bereit\""));
  assert.ok(zeile.includes("const st = quelleStand(q)") && zeile.includes('class="bereit-quelle bereit-quelle--${st}"'), "Klasse je Stand");
  assert.ok(zeile.includes('<span class="bq-punkt" aria-hidden="true"></span>') && zeile.includes('<span class="bq-balken" aria-hidden="true">'), "Punkt und Balken");
  assert.ok(zeile.includes('<span class="sr-only">, ${QUELLE_STAENDE[st]}</span>'), "Stand in Worten");
  for (const [st, farbe] of [["wenig", "--accent"], ["halb", "--warn"], ["gut", "--ok"]]) assert.ok(wesenCss.includes(`.bereit-quelle--${st} { --bq: var(${farbe}); }`), st);
  assert.ok(/\.bereit-quelle \.mono \{ color: var\(--bq\);/.test(wesenCss) && /\.bereit-quelle \.bq-balken > span \{[^}]*background: var\(--bq\)/.test(wesenCss));
  // keine Breitenregel blendet die Farbe aus
  assert.ok(!/@media[^{]*\{[^}]*\.bq-(punkt|balken)[^}]*display:\s*none/.test(css + wesenCss));
  // Kontrast: Zahl als Text 4,5 : 1, Punkt und Balken als Grafik 3 : 1, hell und dunkel, auf der Kartenfläche
  for (const [name, v] of [["hell", hell], ["dunkel", dunkel]]) for (const f of ["--accent", "--warn", "--ok"]) {
    assert.ok(kontrast(v[f], v["--surface"]) >= 4.5, `${name} ${f} auf --surface: ${kontrast(v[f], v["--surface"]).toFixed(2)}`);
    assert.ok(kontrast(v[f], v["--surface-2"]) >= 3, `${name} ${f} auf --surface-2 (Balkengrund)`);
  }
});

test("Alter: Empfehlung statt Ja/Nein-Frage – „Empfohlen ab …“ beim Paket, laden ohne Frage", () => {
  assert.ok(!app.includes("Bist du mindestens"), "keine Altersfrage mehr");
  assert.ok(!/alterSperre|data-alter-ja|data-alter-nein|alter-bestaetigt|state\.alterFrage/.test(app), "keine Sperre, keine gespeicherte Antwort");
  assert.ok(app.includes('const alterEmpfehlung = (p) => (Number(p.alter_ab) > 0 ? `<p class="alter-empfehlung of-klein">Empfohlen ab ${Number(p.alter_ab)} Jahren</p>` : "");'));
  assert.ok(app.includes("<p>${esc(p.beschreibung)}</p>") && app.includes("${alterEmpfehlung(p)}"), "Paketkarte");
  assert.ok(app.includes("<p>${esc(e.beschreibung)}</p>${alterEmpfehlung(inst?.manifest ?? e)}"), "Modulkarte");
  // Der laden-Schieber hängt nur noch an Verfügbarkeit und App-Version, nicht am Alter
  assert.ok(app.includes('else steuerung = schieber({ an: false, art: "laden", text: "laden", attr: `data-install="${esc(p.id)}" aria-label="${esc(p.titel)} laden"` });'));
  assert.ok(!/\$\{(e|p)\.alter_ab \? ` · ab/.test(app), "die alte Angabe „ab 18 Jahren“ im Fuß ist durch die Empfehlung ersetzt");
});

test("Vorschau lesbar: Antippen zeigt das Bild in voller Größe zum Verschieben, noch einmal Antippen passt es ein", () => {
  assert.ok(app.includes('<button type="button" class="vorschau-zoom" data-vorschau-gross="${i}" aria-pressed="${gross}"'), "Bild ist ein Knopf, je Bild (Nr. 28: Bilder untereinander)");
  assert.ok(app.includes('if (b.hasAttribute("data-vorschau-gross")) { const i = Number(b.dataset.vorschauGross); vorschauFenster.gross = vorschauFenster.gross === i ? null : i; vorschauFensterZeichnen();'), "Umschalten, nur dieses Bild");
  assert.ok(app.includes("const gross = vorschauFenster.gross === i;") && app.includes("Object.assign(vorschauFenster, { key, id, vorher: ausloeser ?? document.activeElement, gross: null });"), "Öffnen beginnt eingepasst");
  assert.ok(app.includes("Zum Vergrößern aufs Bild tippen."), "Hinweis sichtbar");
  const gross = css.slice(css.indexOf(".vorschau-bild--gross {"));
  assert.ok(/\.vorschau-bild--gross \{[^}]*place-items: normal;[^}]*overflow: auto;[^}]*touch-action: pan-x pan-y;/.test(gross), "links beginnend, in beide Richtungen verschiebbar (zentriert wäre der linke Rand abgeschnitten)");
  assert.ok(/\.vorschau-bild--gross img \{[^}]*position: static;[^}]*width: auto;[^}]*height: auto;[^}]*max-width: none;/.test(gross), "volle Größe, nicht eingepasst");
  assert.ok(/\.vorschau-zoom-hinweis \{[^}]*font-size: \.9rem;/.test(css), "Hinweis selbst lesbar (mindestens 14 px)");
});
