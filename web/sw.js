// OFFLINE Service Worker: App-Hülle vorab speichern, Kartenkacheln beim Ansehen merken.
const VERSION = "offline-v3";
const HUELLE = [
  "/", "/index.html", "/app.html", "/app.js", "/styles.css", "/icon.svg",
  "/manifest.webmanifest", "/anmeldung.js", "/datenschutz.html", "/paket-kern.js", "/paket-client.js", "/schluessel/oeffentlich.json",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js",
];
const KACHELN = "offline-kacheln";
const MAX_KACHELN = 800;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(HUELLE)).then(() => self.skipWaiting()));
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
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (url.origin === location.origin || url.hostname === "cdnjs.cloudflare.com")) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("/app.html"))),
  );
});
