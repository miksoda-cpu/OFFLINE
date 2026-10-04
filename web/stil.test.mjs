// node --test web/stil.test.mjs – Der zarte Stil (Auftrag 2026-10-04-stil-zart-app, 0.4.3): Kontrast mindestens 4,5 : 1 für
// alle Textfarben auf ihren Flächen, hell und dunkel, auch im Skin Flechte; nirgends in der App schwerer als 600 (außer den
// Notrufnummern); je Knopfart die zarten Grundwerte.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const lies = (p) => readFile(new URL(p, import.meta.url), "utf8");
const css = await lies("./styles.css");
const wesenCss = await lies("./wesen.css");
const flechte = await lies("../pakete/flechte/inhalt/skin/skin.css");

/** Variablen eines Blocks: alle `--name: #hex` (spätere gewinnen). */
const variablen = (block) => Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [m[1], m[2]]));
const blockNach = (text, kopf) => { const i = text.indexOf(kopf); assert.ok(i >= 0, kopf); const a = text.indexOf("{", i + kopf.length - 1); let t = 0, j = a; for (; j < text.length; j++) { if (text[j] === "{") t++; if (text[j] === "}" && --t === 0) break; } return text.slice(a + 1, j); };
const hell = variablen(blockNach(css, ":root {"));
const dunkel = { ...hell, ...variablen(blockNach(css, ':root[data-theme="dark"] {')) };
const dunkelMedia = { ...hell, ...variablen(blockNach(css, ':root:not([data-theme="light"]) {')) };

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const kontrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const mische = (fg, alpha, bg) => fg.map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha)));
const pruefe = (name, vorne, hinten) => { const k = kontrast(vorne, hinten); assert.ok(k >= 4.5, `${name}: ${k.toFixed(2)} : 1`); };

// Welche Schrift steht auf welcher Fläche (Grundaussehen)
const PAARE = [
  ["--text", "--bg"], ["--text", "--surface"], ["--text", "--surface-2"], ["--text", "--eis"], ["--text", "--accent-soft"],
  ["--muted", "--bg"], ["--muted", "--surface"], ["--muted", "--eis"], // graue Nebenlinks, Untertitel
  ["--accent", "--accent-soft"], ["--accent", "--bg"], ["--accent", "--surface"], // Hauptknopf, rote Links
  ["--eis-ink", "--eis"], ["--eis-ink", "--eis-ruhig"], // Pause-Karte, Happen
  ["--ok", "--ok-soft"], ["--warn", "--warn-soft"], ["--warn", "--bg"], ["--lumi-ton", "--surface"],
];

test("Kontrast 4,5 : 1 für jede Schrift auf ihrer Fläche, hell und dunkel", () => {
  for (const [name, v] of [["hell", hell], ["dunkel", dunkel], ["dunkel (System)", dunkelMedia]])
    for (const [vorne, hinten] of PAARE) { assert.ok(v[vorne] && v[hinten], `${name}: ${vorne} oder ${hinten} fehlt`); pruefe(`${name} ${vorne} auf ${hinten}`, rgb(v[vorne]), rgb(v[hinten])); }
});

test("Kacheln: Untertitel auf jeder Kachelfarbe mindestens 4,5 : 1", () => {
  const a = Number(css.match(/\.kachel \.muted \{ color: rgb\(28 27 25 \/ \.(\d+)\)/)[1]) / 100;
  for (const f of ["--eisblau", "--flieder", "--moos", "--sand", "--rose"]) pruefe(`Kachel ${f}`, mische([28, 27, 25], a, rgb(hell[f])), rgb(hell[f]));
});

test("Skin Flechte: gleiche Regel, hell und dunkel", () => {
  const fh = variablen(blockNach(flechte, ":root {")), fd = { ...fh, ...variablen(blockNach(flechte, ':root[data-theme="dark"] {')) };
  const P = [["--of-tinte", "--of-grund"], ["--of-tinte", "--of-flaeche"], ["--of-tinte-2", "--of-grund"], ["--of-tinte-2", "--of-flaeche"], ["--of-tinte-3", "--of-grund"], ["--of-tinte-3", "--of-flaeche"],
    ["--of-moos", "--of-moos-zart"], ["--of-moos", "--of-flaeche"], ["--of-mohn", "--of-mohn-zart"], ["--of-kornblume", "--of-flaeche"], ["--of-kornblume", "--of-kornblume-zart"],
    ["--of-hahnenfuss", "--of-hahnenfuss-zart"], ["--of-ziegel", "--of-ziegel-zart"]];
  for (const [name, v] of [["Flechte hell", fh], ["Flechte dunkel", fd]]) for (const [a, b] of P) pruefe(`${name} ${a} auf ${b}`, rgb(v[a]), rgb(v[b]));
  assert.match(flechte, /\.of-btn--primaer \{ --b-bg: var\(--of-moos-zart\); --b-fg: var\(--of-moos\)/, "Hauptknopf zart in Moos");
});

/** Regeln einer CSS-Datei als [Selektor, Deklarationen]. */
const regeln = (t) => [...t.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim().replace(/^@media[^{]*$/, ""), m[2]]);
const gewicht = (d) => { const m = d.match(/font-weight:\s*(\d+)/) ?? d.match(/font:\s*(\d{3})\s/); return m ? Number(m[1]) : null; };

test("Schrift: in der App nirgends schwerer als 600 (Ausnahme Notrufnummern), Überschriften 300 bis 400", () => {
  const app = regeln(css), ueber = new Map(app.filter(([s]) => s.startsWith(".of-app ")).flatMap(([s, d]) => s.split(",").map((x) => [x.trim().replace(/^\.of-app /, ""), gewicht(d)])));
  const NUR_STARTSEITE = new Set([".price", ".feature-num", ".consent strong"]); // index.html hat keine .of-app
  const schwer = [];
  for (const [sel, d] of [...app, ...regeln(wesenCss)]) {
    const g = gewicht(d); if (g === null || g <= 600) continue;
    for (const s of sel.split(",").map((x) => x.trim()).filter(Boolean)) {
      if (s.startsWith(".of-app") || NUR_STARTSEITE.has(s) || /notruf-nr/.test(s)) continue;
      const u = ueber.get(s); if (u === null || u === undefined || u > 600) schwer.push(`${s} (${g})`);
    }
  }
  assert.deepEqual(schwer, [], "zu schwer, ohne leichtere Regel in .of-app");
  for (const h of ["h1", "h2", "h3"]) { const g = ueber.get(h); assert.ok(g >= 300 && g <= 400, `${h}: ${g}`); }
  assert.equal(ueber.get(".bereit-zahl"), 300, "Bereit-Zahl groß und leicht");
  assert.ok(ueber.get("strong") <= 600 && ueber.get("b") <= 600);
});

test("Knöpfe: Hauptknopf zartes Rot ohne Schatten, Nebenknopf Haarlinie, Tippfläche 44 px", () => {
  const r = Object.fromEntries(regeln(css).map(([s, d]) => [s, d]));
  assert.match(r[".of-app .btn-primary"], /color: var\(--accent\)/); assert.match(r[".of-app .btn-primary"], /box-shadow: none/);
  assert.match(r[".of-app .btn-primary::before"], /background: var\(--accent-soft\)/);
  assert.match(r[".of-app .btn::before"], /border: 1px solid var\(--z-hair\)/);
  assert.match(r[".of-app .btn"], /min-height: 44px/); assert.match(r[".of-app .btn"], /background: transparent/);
  assert.match(r[".of-app .card"], /border: 0/);
  assert.match(css, /--z-haupt-groesse: 12\.5px; --z-haupt-gewicht: 500; --z-haupt-pad: 6px 11px; --z-radius: 6px;/);
});
