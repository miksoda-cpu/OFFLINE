// OFFLINE Service Worker: App-Hülle vorab speichern, Kartenkacheln beim Ansehen merken.
const VERSION = "offline-v33";
const HUELLE = [
  "/", "/index.html", "/app.html", "/app.js", "/styles.css", "/icon.svg",
  "/manifest.webmanifest", "/anmeldung.js", "/datenschutz.html", "/paket-kern.js", "/paket-client.js", "/bereit.js", "/wesen.js", "/wesen.css", "/modul-host.js", "/tag.js", "/pause.js", "/pause-werte.js", "/pause-happen.js", "/buch.js", "/neuigkeiten.js", "/hilfe.js", "/blatt.js", "/meintag.js", "/stimme.js", "/intern.js", "/natur.js", "/gedanken.js", "/abkuerzungen.js", "/pakete.js", "/neues.json", "/schluessel/oeffentlich.json",
  "/lib/leaflet/leaflet.min.css", "/lib/leaflet/leaflet.min.js", // 0.7.2: Leaflet liegt bei uns, keine Anfrage an Cloudflare
];
const KACHELN = "offline-kacheln";
const MAX_KACHELN = 800;

self.addEventListener("install", (e) => {
  // Eigene Dateien müssen da sein; Fremdes (Kartenbibliothek) darf fehlen, sonst wäre die App in gefilterten Netzen nie offline-fähig.
  e.waitUntil(caches.open(VERSION).then(async (c) => {
    // cache: "reload" – an jedem Zwischenspeicher vorbei, sonst käme nach „Jetzt laden“ die alte Hülle (0.5.5)
    await c.addAll(HUELLE.filter((u) => u.startsWith("/")).map((u) => new Request(u, { cache: "reload" })));
    await Promise.allSettled(HUELLE.filter((u) => !u.startsWith("/")).map((u) => c.add(u)));
  }).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== KACHELN).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Versionsnummer (0.5.5): immer vom Netz, nie aus dem Speicher – ohne Netz soll die App „kein Internet“ sagen können
  if (url.origin === location.origin && (url.pathname === "/version.json" || url.pathname.startsWith("/intern/"))) return; // 0.6.0: interner Kanal nie aus dem Speicher

  // Kartenkacheln: zuerst Speicher, sonst Netz und merken
  if (url.hostname.endsWith("wien.gv.at")) {
    e.respondWith(caches.open(KACHELN).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === "opaque") {
        c.put(req, res.clone());
        c.keys().then((k) => { if (k.length > MAX_KACHELN) c.delete(k[0]); });
      }
      return res;
    }));
    return;
  }

  // Alles andere: Netz zuerst (frische Inhalte), bei Ausfall aus dem Speicher
  // Eigene Dateien immer beim Server nachfragen (no-cache: 304, wenn gleich), nie still aus dem HTTP-Speicher
  const frisch = url.origin === location.origin && req.mode !== "navigate" ? new Request(req, { cache: "no-cache" }) : req;
  e.respondWith(
    fetch(frisch)
      .then((res) => {
        if (res.ok && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === "navigate" ? caches.match("/app.html") : Response.error()))),
  );
});
