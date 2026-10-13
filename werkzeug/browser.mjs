// OFFLINE – gemeinsame Teile für Bildvergleich und Barrierefreiheit (Auftrag Nr. 21): ein kleiner Dateiserver für web/
// und ein Headless-Chrome, gesteuert über das DevTools-Protokoll (WebSocket aus Node 22, keine Abhängigkeit).
// Fremde Adressen sind im Browser gesperrt: Die Seiten laufen nur gegen 127.0.0.1, damit Aufnahmen gleich bleiben.

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile, mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TYPEN = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".sig": "application/octet-stream",
  ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2", ".pmtiles": "application/octet-stream",
};

/** Liefert einen Ordner (Standard: web/) auf 127.0.0.1 aus. `zusatz` ordnet Pfade eigenen Inhalten zu (z. B. axe-core). */
export async function dateiserver(ordner = path.join(WURZEL, "web"), zusatz = {}) {
  const server = createServer(async (req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (zusatz[p]) { res.writeHead(200, { "Content-Type": zusatz[p].typ }); return res.end(zusatz[p].inhalt); }
    const datei = path.join(ordner, p.endsWith("/") ? p + "index.html" : p);
    if (!datei.startsWith(ordner)) { res.writeHead(403); return res.end(); }
    try {
      if (!(await stat(datei)).isFile()) throw new Error("kein File");
      res.writeHead(200, { "Content-Type": TYPEN[path.extname(datei)] ?? "application/octet-stream", "Cache-Control": "no-store" });
      res.end(await readFile(datei));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { url: `http://127.0.0.1:${server.address().port}`, schliessen: () => { server.closeAllConnections?.(); server.close(); } };
}

/** Startet Headless-Chrome und gibt eine schlanke CDP-Sitzung auf einem neuen Tab zurück. */
export async function chromeStarten() {
  const chrome = process.env.CHROME || (process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "google-chrome");
  const profil = await mkdtemp(path.join(os.tmpdir(), "offline-pruef-chrome-"));
  // Feste Darstellung: keine GPU, keine Schriftglättung nach Bildschirm, Skalierung 1, keine Scrollbalken
  const proc = spawn(chrome, ["--headless=new", `--user-data-dir=${profil}`, "--no-first-run", "--disable-extensions", "--disable-gpu",
    "--hide-scrollbars", "--force-device-scale-factor=1", "--font-render-hinting=none", "--disable-lcd-text", "--mute-audio",
    "--disable-background-networking", "--disable-component-update", "--no-default-browser-check", "--lang=de-AT",
    "--remote-debugging-port=0", ...(process.getuid?.() === 0 ? ["--no-sandbox"] : []), "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
  const wsUrl = await new Promise((ja, nein) => {
    let puffer = "";
    const zeit = setTimeout(() => nein(new Error("Chrome meldet sich nicht (30 s)")), 30_000);
    proc.stderr.on("data", (d) => { puffer += d; const m = puffer.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(zeit); ja(m[1]); } });
    proc.once("exit", (c) => { clearTimeout(zeit); nein(new Error(`Chrome beendet (${c}) ${puffer.slice(-400)}`)); });
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((ja, nein) => { ws.onopen = ja; ws.onerror = () => nein(new Error("DevTools-Verbindung gescheitert")); });
  let n = 0;
  const offen = new Map(), hoerer = new Set();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && offen.has(m.id)) { const { ja, nein } = offen.get(m.id); offen.delete(m.id); m.error ? nein(new Error(`${m.error.message}`)) : ja(m.result); }
    else if (m.method) for (const h of hoerer) h(m);
  };
  const senden = (method, params = {}, sessionId) => new Promise((ja, nein) => {
    const id = ++n; offen.set(id, { ja, nein }); ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const beenden = async () => { try { ws.close(); } catch { /* egal */ } proc.kill(); await rm(profil, { recursive: true, force: true }).catch(() => {}); };

  /** Neuer Tab mit eigenem Speicher (Browser-Kontext), Netz nur zu 127.0.0.1. */
  async function tab() {
    const { browserContextId } = await senden("Target.createBrowserContext", { disposeOnDetach: true });
    const { targetId } = await senden("Target.createTarget", { url: "about:blank", browserContextId });
    const { sessionId } = await senden("Target.attachToTarget", { targetId, flatten: true });
    const s = (method, params) => senden(method, params, sessionId);
    await s("Page.enable"); await s("Runtime.enable"); await s("Network.enable");
    // Jede Anfrage läuft über Fetch-Abfangen: 127.0.0.1 geht durch, alles andere scheitert und wird gezählt
    await s("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
    const fremd = [];
    const hoer = (m) => {
      if (m.sessionId !== sessionId || m.method !== "Fetch.requestPaused") return;
      const u = m.params.request.url;
      if (/^(https?|wss?):\/\/127\.0\.0\.1[:/]/.test(u) || u.startsWith("data:") || u.startsWith("blob:")) s("Fetch.continueRequest", { requestId: m.params.requestId }).catch(() => {});
      else { fremd.push(u); s("Fetch.failRequest", { requestId: m.params.requestId, errorReason: "BlockedByClient" }).catch(() => {}); }
    };
    hoerer.add(hoer);
    const warteAuf = (method, ms = 30_000) => new Promise((ja, nein) => {
      const z = setTimeout(() => { hoerer.delete(h); nein(new Error(`${method} kam nicht`)); }, ms);
      const h = (m) => { if (m.sessionId === sessionId && m.method === method) { clearTimeout(z); hoerer.delete(h); ja(m.params); } };
      hoerer.add(h);
    });
    const auswerten = async (ausdruck) => {
      const r = await s("Runtime.evaluate", { expression: ausdruck, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(`Im Browser: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
      return r.result.value;
    };
    return {
      s, fremd, auswerten,
      async laden(url) { const geladen = warteAuf("Page.loadEventFired"); await s("Page.navigate", { url }); await geladen; },
      async schliessen() { hoerer.delete(hoer); await senden("Target.closeTarget", { targetId }).catch(() => {}); await senden("Target.disposeBrowserContext", { browserContextId }).catch(() => {}); },
    };
  }
  const version = (await senden("Browser.getVersion")).product;
  return { tab, beenden, version };
}

/** Wartet, bis eine Bedingung im Browser wahr ist. */
export async function warteBis(t, ausdruck, ms = 20_000) {
  const ende = Date.now() + ms;
  while (Date.now() < ende) { if (await t.auswerten(`!!(${ausdruck})`).catch(() => false)) return true; await new Promise((r) => setTimeout(r, 100)); }
  throw new Error(`Zeitüberschreitung: ${ausdruck}`);
}
