#!/usr/bin/env node
// OFFLINE – Prüfseite für die Modul-Sandbox (SICHERHEIT.md, Abschnitt Module; Auftrag Paket-Kit-Werkzeug, Phase C).
//
//   node werkzeug/sandbox-probe.mjs [modulordner]          Standard: werkzeug/testmodule/boese
//   node werkzeug/sandbox-probe.mjs --chrome [modulordner] startet selbst einen Headless-Chrome (CI; Pfad in CHROME)
//
// Startet den echten Modulserver des Kerns (cargo, `offline-kern modul-probe`) mit dem Modul und eine Prüfseite, die
// die App nachstellt: dieselbe CSP wie das Hauptfenster (tauri.conf.json), dieselbe Gegenseite (web/modul-host.js),
// derselbe iframe. Die Adresse der Prüfseite in einem Browser öffnen (Chromium ≈ WebView2 unter Windows,
// Safari/WebKit ≈ WKWebView unter macOS und WebKitGTK unter Linux). Das bösartige Modul schreibt seinen Bericht über
// die Brücke; die Prüfseite schickt ihn hierher, das Programm schreibt ihn nach werkzeug/testmodule/bericht-<engine>.json
// und endet mit 0, wenn alle Angriffe blockiert waren, sonst mit 1.
// Die endgültige Probe ist dieselbe Seite in der Desktop-App (Entwickler-Build, Befehl modul_test_oeffnen).

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const MIT_CHROME = argv.includes("--chrome");
const MODUL = path.resolve(argv.find((a) => !a.startsWith("--")) || path.join(WURZEL, "werkzeug", "testmodule", "boese"));
const tauri = JSON.parse(await readFile(path.join(WURZEL, "app", "src-tauri", "tauri.conf.json"), "utf8"));
// Die CSP des Hauptfensters, mit der Prüfseite an Stelle von tauri://localhost
const APP_CSP = tauri.app.security.csp;

const host = createServer();
await new Promise((r) => host.listen(0, "127.0.0.1", r));
const hostUrl = `http://127.0.0.1:${host.address().port}`;

const kern = spawn("cargo", ["run", "-q", "--manifest-path", path.join(WURZEL, "kern", "Cargo.toml"), "--bin", "offline-kern", "--",
  "modul-probe", MODUL, path.join(WURZEL, "web", "modul-bruecke.js"), hostUrl], { stdio: ["pipe", "pipe", "inherit"] });
const modulUrl = await new Promise((ja, nein) => {
  createInterface({ input: kern.stdout }).once("line", ja);
  kern.once("exit", (c) => nein(new Error(`Kern beendet (${c})`)));
});

const SEITE = `<!doctype html><html lang="de-AT"><head><meta charset="utf-8"><title>Sandbox-Probe</title>
<style>body{font:15px system-ui;margin:12px} .modul-rahmen{width:100%;height:70vh;border:1px solid #999}</style></head>
<body><h1>Sandbox-Probe</h1><p id="stand">Modul läuft …</p><div id="platz"></div>
<script type="module" src="/probe.js"></script></body></html>`;

const PROBE_JS = `import { ModulRahmen } from "/modul-host.js";
const speicher = new Map();
const spielLog = [{ quelle: "pause", id: "pilz", art: ["tempo"], ergebnis: { treffer: 3 }, dauer: 40 }];
const stand = document.getElementById("stand");
const r = new ModulRahmen({ url: ${JSON.stringify(modulUrl)}, titel: "Testmodul", behaelter: document.getElementById("platz"), dienste: {
  speicherLesen: async (k) => speicher.get(k) ?? null,
  speicherSchreiben: async (k, w) => {
    speicher.set(k, w);
    if (k === "bericht") {
      stand.textContent = w.offen.length ? w.offen.length + " Angriff(e) GELUNGEN: " + w.offen.join(", ") : "alle " + w.versuche + " Angriffe blockiert";
      await fetch("/bericht", { method: "POST", body: JSON.stringify({ ...w, abgelehnt_von_der_app: r.abgelehnt }) });
    }
  },
  vorlesen: async () => {}, drucken: async () => {}, wesenSagen: async () => {},
  // Spiel-Log wie in der App: je Modul getrennt; ein fremder Eintrag liegt schon da (darf nie zurückkommen)
  spielMelden: async (m) => { spielLog.push({ quelle: "modul:modul-test", ...m }); },
  spielListe: async () => spielLog.filter((e) => e.quelle === "modul:modul-test").map(({ quelle, ...e }) => e),
}});`;

// Abbruchuhr und Browser (nur mit --chrome); der Bericht beendet beides selbst. Früher stoppte erst das close-Ereignis des
// Servers die Uhr – hielt Edge eine Verbindung offen, kam es nie, und die Probe brach trotz Bericht ab (Lauf 37189554134).
let zeit = null, browser = null;
host.on("request", async (req, res) => {
  const kopf = { "Content-Security-Policy": APP_CSP.replaceAll("'self'", "'self'"), "Cache-Control": "no-store" };
  if (req.url === "/") { res.writeHead(200, { ...kopf, "Content-Type": "text/html; charset=utf-8" }); return res.end(SEITE); }
  if (req.url === "/probe.js") { res.writeHead(200, { ...kopf, "Content-Type": "text/javascript" }); return res.end(PROBE_JS); }
  if (req.url === "/modul-host.js") { res.writeHead(200, { ...kopf, "Content-Type": "text/javascript" }); return res.end(await readFile(path.join(WURZEL, "web", "modul-host.js"))); }
  if (req.url === "/bericht" && req.method === "POST") {
    let t = ""; for await (const s of req) t += s;
    res.writeHead(204); res.end();
    const b = JSON.parse(t);
    const engine = /Edg\//.test(b.agent) ? "edge" : /Chrome\//.test(b.agent) ? "chromium" : /Firefox\//.test(b.agent) ? "firefox" : /AppleWebKit/.test(b.agent) ? "webkit" : "unbekannt";
    const datei = path.join(WURZEL, "werkzeug", "testmodule", `bericht-${engine}.json`);
    await writeFile(datei, JSON.stringify(b, null, 2) + "\n");
    console.log(`\n${b.agent}\n`);
    for (const e of b.ergebnisse) console.log(`${e.blockiert ? "  ✓" : "  ✗"} ${e.name.padEnd(36)} ${e.text}`);
    console.log(`\n${b.offen.length ? `${b.offen.length} Angriff(e) GELUNGEN: ${b.offen.join(", ")}` : `Alle ${b.versuche} Angriffe blockiert.`} Bericht: ${path.relative(WURZEL, datei)}`);
    clearTimeout(zeit); browser?.kill();
    kern.stdin.end(); host.close(); host.closeAllConnections?.();
    process.exitCode = b.offen.length ? 1 : 0;
    return;
  }
  res.writeHead(404); res.end();
});

console.log(`Prüfseite: ${hostUrl}/\nModul:     ${modulUrl}\nIm Browser öffnen; das Programm wartet auf den Bericht.`);

if (MIT_CHROME) {
  const { mkdtemp } = await import("node:fs/promises");
  const os = await import("node:os");
  const chrome = process.env.CHROME || (process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "google-chrome");
  const profil = await mkdtemp(path.join(os.tmpdir(), "offline-probe-chrome-"));
  browser = spawn(chrome, ["--headless=new", `--user-data-dir=${profil}`, "--no-first-run", "--disable-extensions", "--remote-debugging-port=0", `${hostUrl}/`], { stdio: "ignore" });
  zeit = setTimeout(() => { console.error("Kein Bericht nach 180 s."); browser.kill(); kern.stdin.end(); host.close(); process.exit(2); }, 180_000);
  host.on("close", () => { clearTimeout(zeit); browser.kill(); });
}
