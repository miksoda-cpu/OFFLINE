#!/usr/bin/env node
// Spielpaket 1: die gebauten Tatham-Rätsel ins Modul übernehmen (Auftrag 2026-10-07-14).
//
//   node pakete/spiele-1/bauen.mjs <bauordner von tatham-bauen.sh>
//
// Je Rätsel zwei Dateien unter inhalt/modul/tatham/:
//   <name>.js       das Programm des Rätsels (Emscripten); die zwei Netzabrufe der Laufzeit führen ins Leere (offlineKeinNetz),
//                   gebraucht werden sie nicht, weil die Seite das WebAssembly selbst mitgibt
//   <name>.wasm.js  das WebAssembly als Text (Base64): Die Sandbox hat kein Netz (connect-src 'none'), also kommt es als
//                   Skript aus dem signierten Paket, nie aus dem Netz
// Danach prüft das Skript jede Datei gegen die Verbotsliste des Paket-Kits und die Größe der Modul-Oberfläche.
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const ZIEL = path.join(HIER, "inhalt", "modul", "tatham");
const SPIELE = ["lightup", "net", "pattern", "bridges", "mines", "solo"];
const bau = process.argv[2];
if (!bau) { console.error("Verwendung: node pakete/spiele-1/bauen.mjs <bauordner>"); process.exit(2); }

const ersetze = (t, alt, neu, n, wo) => {
  const c = t.split(alt).length - 1;
  if (c !== n) throw new Error(`${wo}: „${alt}“ ${c}× statt ${n}×`);
  return t.split(alt).join(neu);
};
for (const s of SPIELE) {
  let js = await readFile(path.join(bau, `${s}.js`), "utf8");
  if (!js.includes("offlineSpielId") || !js.includes("game_status")) throw new Error(`${s}.js: ohne den OFFLINE-Patch gebaut`);
  js = ersetze(js, "fetch(", "offlineKeinNetz(", 2, s);
  // Das WebAssembly gibt die Seite mit (window.offlineWasm); diese Emscripten-Fassung liest Module.wasmBinary nicht mehr ein
  js = ersetze(js, "var wasmBinary;", "var wasmBinary=window.offlineWasm;", 1, s);
  js = ersetze(js, "async function getWasmBinary(binaryFile){", "async function getWasmBinary(binaryFile){if(wasmBinary)return wasmBinary;", 1, s);
  const wasm = await readFile(path.join(bau, `${s}.wasm`));
  if (wasm.subarray(0, 4).toString("latin1") !== "\0asm") throw new Error(`${s}.wasm: kein WebAssembly`);
  await writeFile(path.join(ZIEL, `${s}.js`), `// Simon Tathams Portable Puzzle Collection (MIT-Lizenz, licence.txt), Rätsel „${s}“, für OFFLINE gebaut (pakete/spiele-1/tatham-bauen.sh)\n${js}`);
  await writeFile(path.join(ZIEL, `${s}.wasm.js`), `window.offlineWasmDaten="${wasm.toString("base64")}";\n`);
}

// Prüfen wie das Paket-Kit (Verbotsliste) und die Größe der Oberfläche (höchstens 2 MB)
const VERBOTEN = [/\bfetch\s*\(/, /XMLHttpRequest/, /\bWebSocket\b/, /\bEventSource\b/, /sendBeacon/, /\beval\s*\(/, /new\s+Function\s*\(/, /importScripts\s*\(/, /<iframe/i, /window\.open\s*\(/, /RTCPeerConnection|RTCDataChannel/, /localStorage/];
let summe = 0;
const alle = async (d) => (await Promise.all((await readdir(d, { withFileTypes: true })).map((e) => (e.isDirectory() ? alle(path.join(d, e.name)) : [path.join(d, e.name)])))).flat();
for (const f of await alle(path.join(HIER, "inhalt", "modul"))) {
  summe += (await stat(f)).size;
  if (!/\.(js|html|css)$/.test(f)) continue;
  const t = await readFile(f, "utf8");
  for (const re of VERBOTEN) if (re.test(t)) throw new Error(`${path.relative(HIER, f)}: verboten – ${re}`);
}
console.log(`Modul-Oberfläche: ${(summe / 1024).toFixed(0)} kB von 2048 kB`);
if (summe > 2 * 1024 * 1024) throw new Error("Modul-Oberfläche über 2 MB");
