// Offline-Karte: MapLibre GL + PMTiles aus einem installierten Kartenpaket, gelesen über den lokalen Dateiserver.
// Wird nur geladen, wenn ein Kartenpaket (art "karte") installiert ist – sonst bleibt die Online-Karte (Leaflet).

let maplibre = null;

async function bibliothekLaden() {
  if (maplibre) return maplibre;
  if (!document.querySelector('link[href="/lib/maplibre-gl.css"]')) {
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = "/lib/maplibre-gl.css";
    document.head.appendChild(l);
  }
  for (const src of ["/lib/pmtiles.js", "/lib/basemaps.js"]) {
    if (!document.querySelector(`script[src="${src}"]`)) {
      await new Promise((ok, nein) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = nein; document.head.appendChild(s); });
    }
  }
  maplibre = await import("/lib/maplibre-gl.mjs");
  return maplibre;
}

/**
 * Startet die Offline-Karte in `el`.
 * `basis` = URL des Paketordners auf dem lokalen Server (endet mit /), `manifest` = Manifest des Kartenpakets.
 * Erwartete Dateien im Paket: inhalt/karte.pmtiles, inhalt/fonts/{fontstack}/{range}.pbf, optional inhalt/sprites/…
 */
export async function offlineKarte(el, basis, manifest) {
  const ml = await bibliothekLaden();
  const pm = window.pmtiles, bm = window.basemaps;
  const protokoll = new pm.Protocol();
  ml.addProtocol("pmtiles", protokoll.tile);

  const pmDatei = manifest.dateien.find((d) => d.pfad.endsWith(".pmtiles"))?.pfad ?? "inhalt/karte.pmtiles";
  const quelle = new pm.PMTiles(basis + pmDatei);
  protokoll.add(quelle);
  const kopf = await quelle.getHeader();
  const meta = await quelle.getMetadata().catch(() => ({}));
  const hatFonts = manifest.dateien.some((d) => d.pfad.startsWith("inhalt/fonts/"));
  const hatSprites = manifest.dateien.some((d) => d.pfad.startsWith("inhalt/sprites/"));

  const ebenen = bm.layers("karte", bm.namedFlavor("light"), { lang: "de" });
  const stil = {
    version: 8,
    glyphs: hatFonts ? `${basis}inhalt/fonts/{fontstack}/{range}.pbf` : undefined,
    sprite: hatSprites ? `${basis}inhalt/sprites/light` : undefined,
    sources: { karte: { type: "vector", url: `pmtiles://${basis}${pmDatei}`, attribution: meta.attribution ?? "© OpenStreetMap-Mitwirkende · Protomaps" } },
    // ohne Schriften keine Beschriftungen – sonst meldet MapLibre Fehler
    layers: hatFonts ? ebenen : ebenen.filter((l) => l.type !== "symbol"),
  };
  const map = new ml.Map({
    container: el, style: stil,
    center: [kopf.centerLon || 13.6, kopf.centerLat || 47.6],
    zoom: Math.max(kopf.minZoom ?? 6, 6.5),
    minZoom: kopf.minZoom ?? 5, maxZoom: Math.max(kopf.maxZoom ?? 14, 17),
    maxBounds: [[kopf.minLon - 0.5, kopf.minLat - 0.3], [kopf.maxLon + 0.5, kopf.maxLat + 0.3]],
    attributionControl: { compact: false },
  });
  map.addControl(new ml.NavigationControl(), "top-right");
  map.addControl(new ml.ScaleControl({ unit: "metric" }));
  return map;
}
