// OFFLINE – Gegenseite der Modul-Brücke in der App (SICHERHEIT.md, Abschnitt Module, Bedingung 1).
// Ein Modul läuft in einem iframe mit sandbox="allow-scripts" (ohne allow-same-origin) von seinem eigenen Server
// (kern/src/modulserver.rs, CSP ohne Netz). Es spricht nur per postMessage. Hier wird jede Nachricht geprüft:
// Herkunft (genau dieser Rahmen, Herkunft „null“), Aufruf aus der Liste in PAKET-KIT.md Abschnitt 5, Größe, Takt.
// Alles andere wird verworfen. Welches Modul spricht, weiß die App selbst – es steht nie in der Nachricht.

export const AUFRUFE = ["speicher.lesen", "speicher.schreiben", "vorlesen", "drucken", "wesen.sagen", "spiel.melden", "spiel.liste"];
export const GRENZEN = { nachricht: 256 * 1024, vorlesen: 2000, wesen: 300, drucken: 200 * 1024, proSekunde: 50, ergebnis: 1024, ergebnisFelder: 12, meldungenProMinute: 10 };
/** Trainingsarten aus dem Trainingsmodell (OFFLINE-Gehirn-Fitness-Trainingsmodell.md, Abschnitt 3). */
export const TRAININGSARTEN = ["tempo", "kraft", "ausdauer", "beweglichkeit", "koordination", "gruppe"];
const SPIEL_ID = /^[a-z0-9][a-z0-9-]{0,39}$/;

/**
 * Eine Spielmeldung prüfen (spiel.melden): { id, art, ergebnis, dauer } und sonst nichts – kein Feld für das Modul (das
 * setzt die App), keine verschachtelten Werte. Gibt { ok, eintrag } oder { ok: false, grund } zurück.
 */
export function pruefeSpielMeldung(x) {
  if (!istObjekt(x)) return { ok: false, grund: "Meldung fehlt" };
  const fremd = Object.keys(x).filter((k) => !["id", "art", "ergebnis", "dauer"].includes(k));
  if (fremd.length) return { ok: false, grund: `unbekanntes Feld: ${fremd[0]}` };
  if (typeof x.id !== "string" || !SPIEL_ID.test(x.id)) return { ok: false, grund: "id ungültig (a–z, 0–9, -, höchstens 40)" };
  const arten = [].concat(x.art);
  if (!arten.length || arten.length > 3 || !arten.every((a) => TRAININGSARTEN.includes(a))) return { ok: false, grund: `art: eine bis drei von ${TRAININGSARTEN.join(", ")}` };
  if (!istObjekt(x.ergebnis)) return { ok: false, grund: "ergebnis: Objekt" };
  const felder = Object.entries(x.ergebnis);
  if (felder.length > GRENZEN.ergebnisFelder) return { ok: false, grund: "ergebnis: zu viele Felder" };
  for (const [k, v] of felder) {
    if (!/^[a-z][a-z0-9_]{0,23}$/.test(k)) return { ok: false, grund: `ergebnis: Feldname ${k.slice(0, 30)}` };
    const ok = (typeof v === "number" && Number.isFinite(v)) || typeof v === "boolean" || (typeof v === "string" && v.length <= 80);
    if (!ok) return { ok: false, grund: `ergebnis.${k}: nur Zahl, ja/nein oder kurzer Text` };
  }
  if (JSON.stringify(x.ergebnis).length > GRENZEN.ergebnis) return { ok: false, grund: "ergebnis zu groß" };
  if (typeof x.dauer !== "number" || !Number.isFinite(x.dauer) || x.dauer < 0 || x.dauer > 86400) return { ok: false, grund: "dauer: Sekunden von 0 bis 86400" };
  return { ok: true, eintrag: { id: x.id, art: arten, ergebnis: Object.fromEntries(felder), dauer: Math.round(x.dauer) } };
}
const SCHLUESSEL = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,63}$/;

const istObjekt = (x) => x !== null && typeof x === "object" && !Array.isArray(x);

/** Prüft eine Nachricht aus dem Modul. Gibt { ok, id, aufruf, daten } oder { ok: false, id?, grund } zurück. */
export function pruefeNachricht(d) {
  if (!istObjekt(d) || d.offline !== 1) return { ok: false, grund: "keine Nachricht der Brücke" };
  const id = Number.isInteger(d.id) && d.id > 0 && d.id < 2 ** 31 ? d.id : undefined;
  if (id === undefined) return { ok: false, grund: "id fehlt" };
  let groesse;
  try { groesse = JSON.stringify(d).length; } catch { return { ok: false, id, grund: "Daten nicht lesbar" }; }
  if (groesse > GRENZEN.nachricht) return { ok: false, id, grund: "Nachricht zu groß" };
  if (typeof d.aufruf !== "string" || !AUFRUFE.includes(d.aufruf)) return { ok: false, id, grund: "unbekannter Aufruf" };
  const x = istObjekt(d.daten) ? d.daten : {};
  const text = (feld, max) => (typeof x[feld] === "string" && x[feld].length <= max ? x[feld] : null);
  switch (d.aufruf) {
    case "speicher.lesen":
    case "speicher.schreiben": {
      if (typeof x.schluessel !== "string" || !SCHLUESSEL.test(x.schluessel) || x.schluessel.includes("..")) return { ok: false, id, grund: "Schlüssel ungültig (a–z, 0–9, _ . -, höchstens 64)" };
      if (d.aufruf === "speicher.lesen") return { ok: true, id, aufruf: d.aufruf, daten: { schluessel: x.schluessel } };
      if (x.wert === undefined) return { ok: false, id, grund: "wert fehlt" };
      // nur, was sich als JSON speichern lässt; alles andere (Funktionen, Blobs, Zyklen) fällt hier heraus
      let wert;
      try { wert = JSON.parse(JSON.stringify(x.wert)); } catch { return { ok: false, id, grund: "wert ist kein JSON" }; }
      return { ok: true, id, aufruf: d.aufruf, daten: { schluessel: x.schluessel, wert } };
    }
    case "vorlesen": {
      const t = text("text", GRENZEN.vorlesen);
      return t === null ? { ok: false, id, grund: "text fehlt oder zu lang" } : { ok: true, id, aufruf: d.aufruf, daten: { text: t } };
    }
    case "wesen.sagen": {
      const t = text("text", GRENZEN.wesen);
      return t === null ? { ok: false, id, grund: "text fehlt oder zu lang" } : { ok: true, id, aufruf: d.aufruf, daten: { text: t } };
    }
    case "spiel.melden": {
      const m = pruefeSpielMeldung(d.daten);
      return m.ok ? { ok: true, id, aufruf: d.aufruf, daten: m.eintrag } : { ok: false, id, grund: m.grund };
    }
    case "spiel.liste": {
      // keine Daten: wessen Einträge, weiß die App selbst (nie aus der Nachricht)
      if (d.daten !== undefined && !(istObjekt(d.daten) && !Object.keys(d.daten).length)) return { ok: false, id, grund: "spiel.liste nimmt keine Daten" };
      return { ok: true, id, aufruf: d.aufruf, daten: {} };
    }
    case "drucken": {
      const h = text("html", GRENZEN.drucken);
      return h === null ? { ok: false, id, grund: "html fehlt oder zu groß" } : { ok: true, id, aufruf: d.aufruf, daten: { html: h } };
    }
  }
  return { ok: false, id, grund: "unbekannter Aufruf" };
}

// ---------- Drucken: nur Text und einfache Gliederung, nie das HTML des Moduls selbst ----------

const DRUCK_ELEMENTE = new Set(["h1", "h2", "h3", "h4", "p", "div", "span", "section", "ul", "ol", "li", "strong", "b", "em", "i", "small", "br", "hr", "table", "thead", "tbody", "tr", "th", "td"]);

/**
 * Baut aus dem HTML eines Moduls einen sicheren Teilbaum für die Druckansicht: nur die Elemente oben, als Attribut
 * nur `class` (Kleinbuchstaben, Ziffern, Bindestrich), Text nur als Text. Skripte, Bilder, Links, Stile fallen weg.
 * `parser` ist ein DOMParser (im Browser vorhanden), `doc` das Zieldokument.
 */
export function druckTeil(html, doc = document, parser = new DOMParser()) {
  const quelle = parser.parseFromString(`<body>${html}</body>`, "text/html").body;
  const ziel = doc.createElement("div");
  const kopiere = (von, nach) => {
    for (const k of von.childNodes) {
      if (k.nodeType === 3) { nach.appendChild(doc.createTextNode(k.textContent)); continue; }
      if (k.nodeType !== 1) continue;
      const name = k.localName;
      if (!DRUCK_ELEMENTE.has(name)) { if (!["script", "style", "template", "iframe", "object", "svg", "math"].includes(name)) kopiere(k, nach); continue; }
      const el = doc.createElement(name);
      const klasse = (k.getAttribute("class") || "").split(/\s+/).filter((c) => /^[a-z][a-z0-9-]{0,30}$/.test(c)).join(" ");
      if (klasse) el.setAttribute("class", klasse);
      kopiere(k, el);
      nach.appendChild(el);
    }
  };
  kopiere(quelle, ziel);
  return ziel;
}

// ---------- Rahmen ----------

/**
 * Ein laufendes Modul in der Oberfläche.
 * dienste: { speicherLesen(schluessel), speicherSchreiben(schluessel, wert), vorlesen(text), drucken(html), wesenSagen(text),
 *            spielMelden(eintrag), spielListe() } – spielListe gibt nur die Einträge dieses Moduls zurück.
 * – alle bekommen nur ihre geprüften Daten, die Modul-Id bindet der Aufrufer selbst ein.
 */
export class ModulRahmen {
  constructor({ url, titel, behaelter, dienste }) {
    this.dienste = dienste;
    this.takt = { sekunde: 0, anzahl: 0 };
    this.meldungen = []; // Zeitpunkte der angenommenen Spielmeldungen (höchstens GRENZEN.meldungenProMinute je Minute)
    this.abgelehnt = 0;
    const f = document.createElement("iframe");
    f.setAttribute("sandbox", "allow-scripts");
    f.setAttribute("referrerpolicy", "no-referrer");
    f.setAttribute("allow", "");
    f.setAttribute("title", titel);
    f.className = "modul-rahmen";
    f.src = url;
    this.iframe = f;
    this.aufNachricht = (e) => this.nachricht(e);
    window.addEventListener("message", this.aufNachricht);
    behaelter.appendChild(f);
  }

  antworten(id, ok, wertOderFehler) {
    const w = this.iframe.contentWindow;
    if (!w) return;
    w.postMessage(ok ? { offline: 1, id, ok: true, wert: wertOderFehler ?? null } : { offline: 1, id, ok: false, fehler: String(wertOderFehler) }, "*");
  }

  async nachricht(e) {
    if (!this.iframe.contentWindow || e.source !== this.iframe.contentWindow) return; // nur genau dieser Rahmen
    if (e.origin !== "null") return; // Sandbox ohne allow-same-origin hat keine eigene Herkunft
    const s = Math.floor(Date.now() / 1000);
    if (this.takt.sekunde !== s) this.takt = { sekunde: s, anzahl: 0 };
    if (++this.takt.anzahl > GRENZEN.proSekunde) { this.abgelehnt++; return; }
    const r = pruefeNachricht(e.data);
    if (!r.ok) { this.abgelehnt++; if (r.id) this.antworten(r.id, false, r.grund); return; }
    try {
      const d = r.daten;
      let wert = null;
      if (r.aufruf === "speicher.lesen") wert = await this.dienste.speicherLesen(d.schluessel);
      else if (r.aufruf === "speicher.schreiben") await this.dienste.speicherSchreiben(d.schluessel, d.wert);
      else if (r.aufruf === "vorlesen") await this.dienste.vorlesen(d.text);
      else if (r.aufruf === "drucken") await this.dienste.drucken(d.html);
      else if (r.aufruf === "wesen.sagen") await this.dienste.wesenSagen(d.text);
      else if (r.aufruf === "spiel.melden") {
        const jetzt = Date.now();
        this.meldungen = this.meldungen.filter((t) => jetzt - t < 60000);
        if (this.meldungen.length >= GRENZEN.meldungenProMinute) { this.abgelehnt++; return this.antworten(r.id, false, "zu viele Meldungen (höchstens 10 je Minute)"); }
        this.meldungen.push(jetzt);
        await this.dienste.spielMelden(d);
      } else if (r.aufruf === "spiel.liste") wert = await this.dienste.spielListe();
      this.antworten(r.id, true, wert);
    } catch (err) {
      this.antworten(r.id, false, err?.message ?? err);
    }
  }

  schliessen() {
    window.removeEventListener("message", this.aufNachricht);
    this.iframe.remove();
  }
}
