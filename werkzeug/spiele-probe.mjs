#!/usr/bin/env node
// OFFLINE – Probe für das Spielpaket 1 (Auftrag 2026-10-07-14): Bekommen zwei Geräte am selben Datum dasselbe Rätsel?
//
//   node werkzeug/spiele-probe.mjs            Adresse im Browser öffnen (Safari/WebKit ≈ Mac-App, Chromium/Edge ≈ Windows)
//   node werkzeug/spiele-probe.mjs --chrome   startet selbst einen Headless-Chrome (CI; Pfad in CHROME)
//
// Startet den echten Modulserver des Kerns dreimal mit pakete/spiele-1/inhalt/modul: „Gerät A“ und „Gerät B“ mit
// WebAssembly-Freigabe (wie ein angemeldetes Modul mit Redaktionsschlüssel), dazu eines ohne Freigabe. Jedes Spiel läuft
// auf A und B mit demselben Datum und meldet im Probe-Modus das erzeugte Rätsel. Geprüft wird:
//   1. A und B haben bei jedem der sieben Spiele dasselbe Rätsel (Tagesrätsel, ohne Netz),
//   2. am nächsten Tag ist es ein anderes,
//   3. ohne Freigabe startet kein Tatham-Rätsel (die Sandbox sperrt WebAssembly).
// Endet mit 0, wenn alles stimmt, sonst mit 1.

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIT_CHROME = process.argv.includes("--chrome");
const MODUL = path.join(WURZEL, "pakete", "spiele-1", "inhalt", "modul");
const SPIELE = ["lichter", "netz", "muster", "bruecken", "minen", "sudoku", "2048"];
const DATUM = "2026-10-07", MORGEN = "2026-10-08";

const host = createServer();
await new Promise((r) => host.listen(0, "127.0.0.1", r));
const hostUrl = `http://127.0.0.1:${host.address().port}`;
const kerne = [];
async function modulserver(wasm) {
  const k = spawn("cargo", ["run", "-q", "--manifest-path", path.join(WURZEL, "kern", "Cargo.toml"), "--bin", "offline-kern", "--",
    "modul-probe", MODUL, path.join(WURZEL, "web", "modul-bruecke.js"), hostUrl, ...(wasm ? ["--wasm"] : [])], { stdio: ["pipe", "pipe", "inherit"] });
  kerne.push(k);
  return new Promise((ja, nein) => { createInterface({ input: k.stdout }).once("line", ja); k.once("exit", (c) => nein(new Error(`Kern beendet (${c})`))); });
}
const A = await modulserver(true), B = await modulserver(true), OHNE = await modulserver(false);

// Je Lauf ein Rahmen, nacheinander: Gerät, Spiel, Datum
const LAEUFE = [
  ...SPIELE.flatMap((s) => [{ geraet: "A", url: A, spiel: s, datum: DATUM }, { geraet: "B", url: B, spiel: s, datum: DATUM }]),
  { geraet: "A", url: A, spiel: "lichter", datum: MORGEN }, { geraet: "A", url: A, spiel: "2048", datum: MORGEN },
  { geraet: "ohne", url: OHNE, spiel: "lichter", datum: DATUM },
];
const SEITE = `<!doctype html><html lang="de-AT"><head><meta charset="utf-8"><title>Spiele-Probe</title>
<style>body{font:15px system-ui;margin:12px} .modul-rahmen{width:360px;height:640px;border:1px solid #999}</style></head>
<body><h1>Spiele-Probe</h1><p id="stand">läuft …</p><div id="platz"></div><script type="module" src="/probe.js"></script></body></html>`;
const PROBE_JS = `import { ModulRahmen } from "/modul-host.js";
const laeufe = ${JSON.stringify(LAEUFE)}, stand = document.getElementById("stand"), ergebnisse = [];
for (const [i, l] of laeufe.entries()) {
  stand.textContent = (i + 1) + " von " + laeufe.length + ": " + l.spiel + " auf Gerät " + l.geraet;
  const wert = await new Promise((fertig) => {
    const r = new ModulRahmen({ url: l.url + "#spiel=" + l.spiel + "&stufe=2&datum=" + l.datum + "&n=1&probe=1", titel: l.spiel, behaelter: document.getElementById("platz"), dienste: {
      speicherLesen: async () => null, speicherSchreiben: async (k, w) => { if (k === "probe") { r.schliessen(); fertig(w); } },
      vorlesen: async () => {}, drucken: async () => {}, wesenSagen: async () => {}, spielMelden: async () => {}, spielListe: async () => [] } });
    setTimeout(() => { r.schliessen(); fertig({ fehler: "keine Antwort nach 20 s" }); }, 20000);
  });
  ergebnisse.push({ ...l, url: undefined, ...wert });
}
stand.textContent = "fertig";
await fetch("/bericht", { method: "POST", body: JSON.stringify({ agent: navigator.userAgent, ergebnisse }) });`;

let zeit = null, browser = null;
const ende = (code) => { clearTimeout(zeit); browser?.kill(); for (const k of kerne) k.stdin.end(); host.close(); host.closeAllConnections?.(); process.exitCode = code; };
host.on("request", async (req, res) => {
  if (req.url === "/") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(SEITE); }
  if (req.url === "/probe.js") { res.writeHead(200, { "Content-Type": "text/javascript" }); return res.end(PROBE_JS); }
  if (req.url === "/modul-host.js") { res.writeHead(200, { "Content-Type": "text/javascript" }); return res.end(await readFile(path.join(WURZEL, "web", "modul-host.js"))); }
  if (req.url === "/bericht" && req.method === "POST") {
    let t = ""; for await (const s of req) t += s;
    res.writeHead(204); res.end();
    const { agent, ergebnisse } = JSON.parse(t), finde = (g, s, d = DATUM) => ergebnisse.find((e) => e.geraet === g && e.spiel === s && e.datum === d);
    const fehler = [];
    console.log(`\n${agent}\n`);
    for (const s of SPIELE) {
      const a = finde("A", s), b = finde("B", s), gleich = !!a?.raetsel && a.raetsel === b?.raetsel;
      if (!gleich) fehler.push(`${s}: A und B verschieden oder ohne Rätsel (${a?.fehler ?? ""}${b?.fehler ?? ""})`);
      console.log(`${gleich ? "  ✓" : "  ✗"} ${s.padEnd(9)} ${String(a?.id ?? "").padEnd(32)} ${String(a?.raetsel ?? a?.fehler ?? "").slice(0, 70)}`);
    }
    for (const s of ["lichter", "2048"]) {
      const anders = finde("A", s, MORGEN)?.raetsel && finde("A", s, MORGEN).raetsel !== finde("A", s)?.raetsel;
      if (!anders) fehler.push(`${s}: am nächsten Tag dasselbe Rätsel`);
      console.log(`${anders ? "  ✓" : "  ✗"} ${s} am ${MORGEN} ein anderes Rätsel`);
    }
    const ohne = finde("ohne", "lichter"), gesperrt = !!ohne?.fehler && !ohne.raetsel;
    if (!gesperrt) fehler.push("ohne Freigabe ist ein Tatham-Rätsel gestartet");
    console.log(`${gesperrt ? "  ✓" : "  ✗"} ohne WebAssembly-Freigabe startet kein Rätsel (${ohne?.fehler ?? ohne?.raetsel ?? "?"})`);
    console.log(fehler.length ? `\n${fehler.length} Fehler:\n- ${fehler.join("\n- ")}` : "\nAlles gleich: zwei Geräte, dasselbe Rätsel des Tages.");
    return ende(fehler.length ? 1 : 0);
  }
  res.writeHead(404); res.end();
});

console.log(`Prüfseite: ${hostUrl}/\nIm Browser öffnen; das Programm wartet auf den Bericht.`);
if (MIT_CHROME) {
  const { mkdtemp } = await import("node:fs/promises");
  const os = await import("node:os");
  const chrome = process.env.CHROME || (process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "google-chrome");
  const profil = await mkdtemp(path.join(os.tmpdir(), "offline-spiele-chrome-"));
  browser = spawn(chrome, ["--headless=new", `--user-data-dir=${profil}`, "--no-first-run", "--disable-extensions", "--remote-debugging-port=0", `${hostUrl}/`], { stdio: "ignore" });
  zeit = setTimeout(() => { console.error("Kein Bericht nach 300 s."); ende(2); process.exit(2); }, 300_000);
}
