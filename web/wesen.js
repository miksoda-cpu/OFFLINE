// Die Lumi – ein Wesen von unter dem antarktischen Eis. Oberfläche und Zustände; die Tipps kommen aus dem Paket „wir“.
// Grundsätze: Sie stirbt nicht, bettelt nicht (keine Push), lügt nicht (die Bereit-Zahl steht daneben). Pakete liefern nur Text,
// Bedingungen sind Daten (kein Code), jeder Tipp wird beim Anzeigen entschärft.
// Standard ist aus (Wesen-Konzept Entwurf 3). Erst mit einem Namen hat die Lumi ein „Ich“; vorher spricht sie nicht von sich.
// Startablauf und Texte: docs/WESEN.md, Abschnitt A. Bilder: web/lumi/ (Herkunft docs/LUMI-BILDER.md).

import { stufe } from "./bereit.js";
import { MIMIK, LICHT as LICHT_BILD } from "./lumi/mimik.js";

const B = 48, H = 36; // logische Pixel

export const FELLE = {
  eisblau: { fell: "#a9d4e8", bauch: "#dff0f8", rand: "#6f9db3" },
  flieder: { fell: "#c9b3e6", bauch: "#eadff6", rand: "#8f78b3" },
  moos: { fell: "#a9c9a0", bauch: "#dbead6", rand: "#6f8f66" },
  sand: { fell: "#e2cfa6", bauch: "#f3e9d2", rand: "#b09a6a" },
};
const ROSA = "#f2a8b8", AUGE = "#1b1a22", GLANZ = "#ffffff", LICHT = "#ffb35c", LICHT_HELL = "#fff0c2";

export const ZUSTAND_TEXT = {
  liegt: "liegt – Bereit unter 30", sitzt: "sitzt und blinzelt", wandert: "wandert und sammelt Pilze", baut: "sammelt Pilze für den Garten",
  unruhig: "unruhig – etwas ist verfallen", zaehne: "zeigt die Zähne – Reflex", fest: "feiert", schlaeft: "schläft",
};
export const SORTEN = { app: "App", alltag: "Alltag", wissen: "Wissen", weisheit: "Weisheit", laune: "Laune", heute: "Heute", digital: "Digital" };

const STANDARD = {
  version: 2, darstellung: "aus", name: "", figur: "foto", fell: "eisblau", welt: "hoehle", laute: true, toene: false, takt: "normal",
  sorten: { app: true, alltag: true, wissen: true, weisheit: true, laune: true, heute: true, digital: false }, baut: true, groesse: "mittel",
};

// ---------- Startablauf: Texte (OFFLINE-Lumi-Startablauf.md) ----------
export const TEXTE = {
  einladungTitel: "Unter dem Eis wohnt jemand.",
  einladungFrage: "Möchtest du eine Lumi auf deinem Startbildschirm?",
  einladungJa: "Ja, zeig sie mir", einladungNein: "Nein, danke",
  einladungHinweis: "Du kannst sie jederzeit in den Einstellungen wieder ausschalten.",
  beschreibung: "Ein kleines Wesen aus der Höhle unter dem antarktischen Eis. Sie zeigt mit ihrem Licht, wie bereit du bist, und gibt dir ab und zu einen Tipp.",
  ki: "Die Bilder der Lumi sind mit KI erzeugt (Herkunft in der App-Dokumentation).",
  ersterSatz: "Oh. Hier oben ist es hell.",
  namensfrage: "Wie soll sie heißen?", namenGeben: "Namen geben", spaeter: "Später",
  mitNamen: (n) => `${n}. Das bin ich. Das war neu. Ich mag es.`,
  ausschalten: (n) => `${n || "Die Lumi"} geht schlafen. Du kannst sie jederzeit wieder wecken.`,
  wiederDa: "Da bist du ja. Ich hab geschlafen.",
  wiederDaOhneNamen: "Oh. Wieder hell hier.",
};

/** Spricht der Text von sich selbst? Vor der Namensgabe ist das nicht erlaubt. */
export const ICH = /(^|[^\p{L}])(ich|mir|mich|mein|meine|meinen|meinem|meiner|meines)(?![\p{L}])/iu;
export const ohneIch = (text) => !ICH.test(String(text ?? ""));

/**
 * Einstellungen laden und Bestand übernehmen. Frisch: aus. Aus 0.1.x (ohne version): Wer der Lumi einen eigenen Namen
 * gegeben hatte, behält Name und Darstellung. Alle anderen sind nach dem Update aus und bekommen später die Einladung.
 */
export function lumiEinstellungenLaden(gespeichert) {
  const g = gespeichert && typeof gespeichert === "object" ? gespeichert : null;
  if (!g) return { ...STANDARD, sorten: { ...STANDARD.sorten } };
  const e = { ...STANDARD, ...g, sorten: { ...STANDARD.sorten, ...(g.sorten || {}) } };
  if (g.version === 2) return e;
  const name = String(g.name ?? "").trim();
  const benannt = name !== "" && name !== "Das Wesen";
  return { ...e, version: 2, name: benannt ? name : "", darstellung: benannt ? (g.darstellung || "wesen") : "aus" };
}

/** Die einmalige Karte mit zwei Lichtern: nur solange die Lumi aus ist, frühestens nach einer Woche, nie nach „Nein, danke“. */
export function einladungFaellig(start, e, jetzt = Date.now()) {
  if (e.darstellung !== "aus" || !start || start.karte !== "offen") return false;
  return jetzt - new Date(start.erstStart).getTime() >= 7 * 86400000;
}

/**
 * Welches Bild zeigt die Lumi? Vorrang nach der Mimik-Tafel: Zähne › Unruhig › Sprechen › Zuhören › Nachdenken › Fest ›
 * Freude › Müde › Ruhe. „Noch ohne Namen“ ersetzt Ruhe, Freude und Müde, bis es einen Namen gibt. Schläft geht allem vor.
 */
export function mimikZustand({ zustand, benannt, spricht = false, hoertZu = false, denkt = false, freude = false }) {
  if (zustand === "schlaeft") return "schlaeft";
  if (zustand === "zaehne") return "zaehne";
  if (zustand === "unruhig") return "unruhig";
  if (spricht) return "sprechen";
  if (hoertZu) return "zuhoeren";
  if (denkt) return "nachdenken";
  if (zustand === "fest") return "fest";
  const grund = freude || zustand === "baut" ? "freude" : zustand === "liegt" ? "muede" : "ruhe";
  return benannt ? grund : "noch-ohne-namen";
}

const MONAT_MS = 30.44 * 86400000;
/** Tage bis zur nächsten Zeitumstellung (letzter Sonntag im März oder Oktober, Europa). */
function tageBisZeitumstellung(d) {
  const letzterSonntag = (j, m) => { const x = new Date(j, m + 1, 0); x.setDate(x.getDate() - x.getDay()); return x; };
  const heute = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const kandidaten = [letzterSonntag(d.getFullYear(), 2), letzterSonntag(d.getFullYear(), 9), letzterSonntag(d.getFullYear() + 1, 2)].filter((x) => x >= heute);
  return Math.round((kandidaten[0] - heute) / 86400000);
}

/**
 * Bedingung eines Tipps gegen den Kontext. Bedingungen sind Daten mit festem Wortschatz (kein Code):
 * ansicht, einstellung, monat (Zahl oder Liste), tag, wochentag (1 = Mo … 7 = So), stunde, score_unter, score_ab,
 * verfallen, benannt, alter { position, ab_monate } (Bereit-Position seit so vielen Monaten nicht bestätigt),
 * zeitumstellung_in_tagen (höchstens so viele Tage bis zur nächsten Zeitumstellung). Unbekannte Wörter: Tipp kommt nicht.
 */
const WORTSCHATZ = new Set(["ansicht", "einstellung", "monat", "tag", "wochentag", "stunde", "score_unter", "score_ab", "verfallen", "benannt", "alter", "zeitumstellung_in_tagen"]);
export function passtBedingung(b, k) {
  if (!b) return true;
  if (Object.keys(b).some((w) => !WORTSCHATZ.has(w))) return false;
  const d = new Date(k.jetzt ?? Date.now());
  if (b.ansicht && b.ansicht !== k.ansicht) return false;
  if (b.einstellung && !k.einstellung?.[b.einstellung]) return false;
  if (b.monat != null && ![].concat(b.monat).includes(d.getMonth() + 1)) return false;
  if (b.tag != null && b.tag !== d.getDate()) return false;
  if (b.wochentag != null && b.wochentag !== (d.getDay() || 7)) return false;
  if (b.stunde != null && b.stunde !== d.getHours()) return false;
  if (b.score_unter != null && !(k.score < b.score_unter)) return false;
  if (b.score_ab != null && !(k.score >= b.score_ab)) return false;
  if (b.verfallen && !k.verfallen) return false;
  if (b.benannt && !k.benannt) return false;
  if (b.alter) {
    const datum = k.positionen?.[b.alter.position];
    if (!datum || (d.getTime() - new Date(datum).getTime()) / MONAT_MS < b.alter.ab_monate) return false;
  }
  if (b.zeitumstellung_in_tagen != null && tageBisZeitumstellung(d) > b.zeitumstellung_in_tagen) return false;
  return true;
}

/** Welche Tipps kommen in Frage? Ist die Lumi aus, keiner. Ohne Namen keiner, der von sich spricht. */
export function tippPool(alle, e, k) {
  if (!e || e.darstellung === "aus") return [];
  return (alle || []).filter((t) => t && typeof t.text === "string" && SORTEN[t.sorte] && e.sorten[t.sorte]
    && passtBedingung(t.bedingung, k) && (k.benannt || ohneIch(t.text)));
}
const TAKT = { normal: 90, seltener: 180, aus: 0 };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rnd = (n) => Math.floor(Math.random() * n);

export class Wesen {
  /** @param {{speicher:object, tipps:()=>Array, onLog?:Function}} o */
  constructor(o) {
    this.sp = o.speicher; this.tippsQuelle = o.tipps; this.onLog = o.onLog;
    this.e = lumiEinstellungenLaden(this.sp.get("wesen", null));
    this.start = this.sp.get("lumi-start", null) ?? { erstStart: new Date().toISOString(), karte: "offen" };
    this.sp.set("lumi-start", this.start);
    this.positionen = {}; this.sprichtBis = 0; this.denktBis = 0; this.freudeBis = 0; this.hoertZu = false;
    this.namensfrage = !this.e.name && this.e.darstellung !== "aus"; this.ausschaltenFrage = false;
    this.gelernt = this.sp.get("wesen-gelernt", { intervall: 90, gelesen: 0, weitergewischt: 0 });
    this.log = this.sp.get("wesen-log", []);
    this.score = 0; this.verfallen = []; this.zustand = "sitzt"; this.ansichtName = "start";
    this.frame = 0; this.blinzelt = 0; this.pokes = []; this.zaehneBis = 0; this.ohrenZurueckBis = 0;
    this.sitzung = { tipps: 0, start: Date.now() }; this.letzteEingabe = Date.now(); this.timer = null; this.tickTimer = null;
    this.tippGezeigtUm = 0; this.aktuellerTipp = null; this.ansichtTippGezeigt = new Set();
    const zuletzt = this.sp.get("wesen-zuletzt", null);
    this.schlaeft = zuletzt ? Date.now() - new Date(zuletzt).getTime() > 30 * 86400000 : false;
    this.sp.set("wesen-zuletzt", new Date().toISOString());
    this.festBis = new Date(this.sp.get("wesen-fest", 0) || 0).getTime();
    addEventListener("pointerdown", () => (this.letzteEingabe = Date.now()), { passive: true });
    addEventListener("keydown", () => (this.letzteEingabe = Date.now()));
  }

  speichern() { this.sp.set("lumi-start", this.start); this.sp.set("wesen", this.e); this.sp.set("wesen-gelernt", this.gelernt); this.sp.set("wesen-log", this.log.slice(-500)); }
  aktiv() { return this.e.darstellung !== "aus"; }
  mitFigur() { return this.e.darstellung === "wesen"; }
  benannt() { return this.e.name.trim() !== ""; }
  anzeigename() { return this.benannt() ? this.e.name : "Lumi"; }
  einladungFaellig() { return einladungFaellig(this.start, this.e); }

  // ---------- Startablauf ----------
  einladung(ja) {
    this.start.karte = ja ? "angenommen" : "nein";
    if (ja) return this.einschalten();
    this.speichern();
  }
  einschalten() {
    const warSchonDa = this.benannt();
    this.e.darstellung = "wesen"; this.ausschaltenFrage = false;
    if (this.start.karte === "offen") this.start.karte = "angenommen";
    this.speichern(); this.planen();
    if (warSchonDa) { this.schlaeft = true; setTimeout(() => { this.schlaeft = false; this.zustandBerechnen(); this.sagen(TEXTE.wiederDa); this.zeichnen(); }, 1500); }
    else { this.namensfrage = true; setTimeout(() => this.sagen(TEXTE.ersterSatz), 400); }
  }
  namenGeben(n) {
    const name = String(n ?? "").trim().slice(0, 24);
    if (!name) return;
    this.e.name = name; this.namensfrage = false; this.hoertZu = false; this.speichern();
    this.freude(4000); setTimeout(() => this.sagen(TEXTE.mitNamen(name)), 80); // nach dem Neuzeichnen der Seite
  }
  spaeter() { this.namensfrage = false; this.hoertZu = false; }
  ausschalten() {
    this.e.darstellung = "aus"; this.ausschaltenFrage = false; this.speichern(); this.planen();
    this.tippSchliessen();
  }
  freude(ms = 3000) { this.freudeBis = Date.now() + ms; this.zeichnen(); }
  sagen(text) { if (this.benannt() || ohneIch(text)) { this.sprichtBis = Date.now() + 2500; this.sprechblase(text, null, 3500); this.zeichnen(); } }

  // ---------- Zustand ----------
  setScore(bereit) {
    this.score = bereit.wert; this.verfallen = bereit.verfallen.map((v) => v.titel);
    this.positionen = Object.fromEntries((bereit.positionen ?? []).filter((p) => p.datum).map((p) => [p.id, p.datum]));
    this.zustandBerechnen();
  }
  zustandBerechnen() {
    const jetzt = Date.now();
    if (this.zaehneBis > jetzt) return (this.zustand = "zaehne");
    if (this.schlaeft) return (this.zustand = "schlaeft");
    if (this.festBis > jetzt) return (this.zustand = "fest");
    if (this.verfallen.length && this.score >= 30) return (this.zustand = "unruhig");
    const st = stufe(this.score); // gemeinsame Stufen aus bereit.js
    this.zustand = st === "baut" && !this.e.baut ? "wandert" : st;
  }
  fest() { this.festBis = Date.now() + 12 * 3600000; this.sp.set("wesen-fest", new Date(this.festBis).toISOString()); this.ton("fest"); this.zustandBerechnen(); this.zeichnen(); }
  anstupsen() {
    const jetzt = Date.now();
    this.letzteEingabe = jetzt;
    if (this.schlaeft) { this.schlaeft = false; this.zustandBerechnen(); this.laut(this.benannt() ? "…mh? Da bin ich." : "…mh?"); this.zeichnen(); return; }
    this.pokes = this.pokes.filter((t) => jetzt - t < 1200); this.pokes.push(jetzt);
    if (this.pokes.length >= 3) {
      this.pokes = []; this.zaehneBis = jetzt + 1000; this.zustandBerechnen(); this.laut("grrr"); this.ton("zaehne");
      setTimeout(() => { this.zaehneBis = 0; this.zustandBerechnen(); this.laut(this.benannt() ? "…tschuldigung. Ich mag das nicht." : "…tschuldigung."); this.zeichnen(); }, 1000);
    } else { this.ohrenZurueckBis = jetzt + 600; this.laut(["mh", "!", "mh?"][rnd(3)]); this.ton("laut"); }
    this.zeichnen();
  }

  // ---------- Töne (aus, außer man will sie) ----------
  ton(art) {
    if (!this.e.toene) return;
    try {
      const ac = this.ac ??= new (window.AudioContext || window.webkitAudioContext)();
      const spiel = (f, t0, d = 0.12) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.value = 0.05; o.connect(g).connect(ac.destination); o.start(ac.currentTime + t0); o.stop(ac.currentTime + t0 + d); };
      if (art === "fest") { spiel(660, 0); spiel(880, 0.12); } else if (art === "zaehne") spiel(110, 0, 0.2); else spiel(520, 0, 0.08);
    } catch {}
  }

  // ---------- Tipps ----------
  kontext() { return { ansicht: this.ansichtName, score: this.score, verfallen: this.verfallen.length > 0, jetzt: Date.now(), einstellung: { digital: !!this.e.sorten.digital }, benannt: this.benannt(), positionen: this.positionen }; }
  waehleTipp(nurAnsicht = null) {
    const k = this.kontext();
    const kuerzlich = new Set(this.log.filter((l) => Date.now() - new Date(l.zeit).getTime() < 86400000).map((l) => l.id));
    let pool = tippPool(this.tippsQuelle(), this.e, k);
    if (nurAnsicht) pool = pool.filter((t) => t.bedingung?.ansicht === nurAnsicht);
    if (!pool.length) return null;
    const frisch = pool.filter((t) => !kuerzlich.has(t.id)); if (frisch.length) pool = frisch;
    // erst die Sorte (gleich verteilt, Laune halb so oft), dann der Tipp nach Gewicht
    const sorten = [...new Set(pool.map((t) => t.sorte))];
    const sw = sorten.map((s) => (s === "laune" ? 0.5 : 1)); let r = Math.random() * sw.reduce((a, b) => a + b, 0); let sorte = sorten[0];
    for (let i = 0; i < sorten.length; i++) { r -= sw[i]; if (r <= 0) { sorte = sorten[i]; break; } }
    const kand = pool.filter((t) => t.sorte === sorte); const gw = kand.map((t) => t.gewicht || 1);
    r = Math.random() * gw.reduce((a, b) => a + b, 0);
    for (let i = 0; i < kand.length; i++) { r -= gw[i]; if (r <= 0) return kand[i]; }
    return kand[kand.length - 1];
  }
  zeigeTipp(t) {
    if (!t || !this.aktiv()) return;
    if (t.sorte === "weisheit" && this.mitFigur() && !this.denktBis) { this.denktBis = Date.now() + 1200; this.zeichnen(); setTimeout(() => { this.denktBis = 0; this.zeigeTipp(t); }, 1200); return; }
    this.sprichtBis = Date.now() + 2500;
    this.aktuellerTipp = t; this.tippGezeigtUm = Date.now(); this.sitzung.tipps++;
    this.log.push({ id: t.id, sorte: t.sorte, text: t.text, zeit: new Date().toISOString(), stern: false });
    this.speichern();
    this.sprechblase(t.text, t.sorte);
    this.onLog?.();
  }
  tippSchliessen() {
    if (this.aktuellerTipp) {
      const dauer = Date.now() - this.tippGezeigtUm;
      if (dauer < 2000) this.gelernt.weitergewischt++; else this.gelernt.gelesen++;
      // gelernt: wer sofort weiterwischt, bekommt seltener; wer liest, öfter (60–180 s)
      const basis = TAKT[this.e.takt] || 90;
      const q = this.gelernt.gelesen + this.gelernt.weitergewischt;
      const anteil = q ? this.gelernt.gelesen / q : 0.5;
      this.gelernt.intervall = Math.round(basis * (anteil < 0.3 ? 2 : anteil > 0.7 ? 0.67 : 1));
      this.speichern();
    }
    this.aktuellerTipp = null;
    const el = document.getElementById("wesen-blase"); if (el) el.hidden = true;
    const toast = document.getElementById("wesen-toast"); if (toast) toast.remove();
  }
  planen() {
    clearTimeout(this.timer); clearInterval(this.tickTimer);
    if (!this.aktiv() || this.e.takt === "aus") return;
    const versuch = () => {
      if (this.sitzung.tipps >= 12 || this.ansichtName === "notfall" || document.hidden) return;
      if (Date.now() - this.letzteEingabe > 120000) return; // Stillstand: pausieren
      this.zeigeTipp(this.waehleTipp());
    };
    this.timer = setTimeout(versuch, 3000);
    this.tickTimer = setInterval(() => { if (Date.now() - this.tippGezeigtUm >= (this.gelernt.intervall || 90) * 1000) versuch(); }, 5000);
  }
  ansicht(name) {
    const vorher = this.ansichtName; this.ansichtName = name;
    if (name === "start") { const toast = document.getElementById("wesen-toast"); if (toast) { toast.remove(); this.aktuellerTipp = null; } this.planen(); return; }
    if (!this.aktiv() || name === vorher || this.ansichtTippGezeigt.has(name) || name === "notfall" || this.sitzung.tipps >= 12) return;
    const t = this.waehleTipp(name); if (t) { this.ansichtTippGezeigt.add(name); this.zeigeTipp(t); }
  }
  stern(id) { const l = this.log.find((x) => x.id === id && !x.stern) || [...this.log].reverse().find((x) => x.id === id); if (l) { l.stern = !l.stern; this.speichern(); } }

  // ---------- Sprechblase / Karte ----------
  laut(text) { if (this.e.laute && this.mitFigur()) this.sprechblase(text, null, 2500); }
  sprechblase(text, sorte, dauer = 0) {
    const blase = document.getElementById("wesen-blase");
    if (blase && this.mitFigur()) {
      blase.hidden = false; blase.innerHTML = `${sorte ? `<span class="wesen-sorte">${esc(SORTEN[sorte])}</span>` : ""}<span>${esc(text)}</span>${sorte ? `<button class="wesen-zu" data-wesen-zu aria-label="Weiter">×</button>` : ""}`;
      if (dauer) setTimeout(() => { if (!this.aktuellerTipp) blase.hidden = true; }, dauer);
      return;
    }
    if (!sorte) return;
    let toast = document.getElementById("wesen-toast");
    if (!toast) { toast = document.createElement("div"); toast.id = "wesen-toast"; toast.className = "wesen-toast"; toast.setAttribute("role", "status"); toast.setAttribute("aria-live", "polite"); document.body.appendChild(toast); }
    toast.innerHTML = `<span class="wesen-sorte">${esc(SORTEN[sorte])}</span><span>${esc(text)}</span><button class="wesen-zu" data-wesen-zu aria-label="Weiter">×</button>`;
  }

  // ---------- Bühne (HTML) ----------
  buehneHtml() {
    const g = { klein: 144, mittel: 240, gross: 336 }[this.e.groesse] || 240;
    if (!this.mitFigur()) return "";
    const figur = this.e.figur === "pixel"
      ? `<div class="wesen-buehne"><canvas id="wesen-pixel" width="${B}" height="${H}" role="img" aria-label="${esc(this.anzeigename())}: ${esc(ZUSTAND_TEXT[this.zustand])}" tabindex="0"></canvas><canvas id="wesen-glut" width="${B}" height="${H}"></canvas></div>`
      : `<div class="lumi-buehne" id="lumi-buehne" role="img" tabindex="0" aria-label="${esc(this.anzeigename())}: ${esc(ZUSTAND_TEXT[this.zustand])}"><div class="lumi-figur" id="lumi-figur"><img id="lumi-bild" alt="" src="${MIMIK.ruhe.bild}"><span class="lumi-licht" id="lumi-licht-0" style="background-image:url(${LICHT_BILD})"></span><span class="lumi-licht" id="lumi-licht-1" style="background-image:url(${LICHT_BILD})"></span></div></div>`;
    const frage = !this.benannt() && this.namensfrage
      ? `<form class="lumi-name" data-lumi-name-form><label for="lumi-name-feld"><strong>${esc(TEXTE.namensfrage)}</strong></label>
          <input class="of-input" id="lumi-name-feld" type="text" maxlength="24" autocomplete="off" placeholder="Max, Horst, Susi …" data-lumi-zuhoeren>
          <span class="lumi-name-knoepfe"><button type="submit" class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer">${esc(TEXTE.namenGeben)}</button> <button type="button" class="btn btn-sm of-btn of-btn--klein" data-lumi="spaeter">${esc(TEXTE.spaeter)}</button></span></form>`
      : !this.benannt() ? `<button type="button" class="btn btn-sm of-btn of-btn--klein" data-lumi="namensfrage">${esc(TEXTE.namenGeben)}</button>` : "";
    return `<div class="wesen" style="--wb:${g}px">${figur}
      <div class="wesen-blase-platz"><div class="wesen-blase" id="wesen-blase" role="status" aria-live="polite" hidden></div></div>
      <div class="wesen-text"><strong>${esc(this.anzeigename())}</strong> <span class="muted of-klein" id="wesen-zustand">${esc(ZUSTAND_TEXT[this.zustand])}</span></div>${frage}</div>`;
  }
  einbauen() {
    clearInterval(this.anim);
    const c = document.getElementById("wesen-pixel") ?? document.getElementById("lumi-buehne"); if (!c) return;
    c.onclick = () => this.anstupsen(); c.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.anstupsen(); } };
    const feld = document.getElementById("lumi-name-feld");
    if (feld) { feld.onfocus = () => { this.hoertZu = true; this.zeichnen(); }; feld.onblur = () => { this.hoertZu = false; this.zeichnen(); }; }
    this.anim = setInterval(() => { this.frame++; if (!document.getElementById("wesen-pixel") && !document.getElementById("lumi-buehne")) { clearInterval(this.anim); return; } this.zeichnen(); }, 125);
    this.zeichnen();
  }
  /** Foto-Ansicht: ein freigestelltes Bild je Zustand, Antennenlicht als Ebene nach Bereit, Kopfneigung als Drehung. */
  fotoZeichnen() {
    const img = document.getElementById("lumi-bild"); if (!img) return false;
    const jetzt = Date.now(); this.zustandBerechnen();
    const m = mimikZustand({ zustand: this.zustand, benannt: this.benannt(), spricht: this.sprichtBis > jetzt, hoertZu: this.hoertZu, denkt: this.denktBis > jetzt, freude: this.freudeBis > jetzt });
    const d = MIMIK[m] ?? MIMIK.ruhe;
    if (!img.src.endsWith(d.bild)) img.src = d.bild;
    img.alt = "";
    const neigung = { "noch-ohne-namen": -10, zuhoeren: 7, sprechen: 4, nachdenken: -6, freude: 5 }[m] ?? 0;
    document.getElementById("lumi-figur").style.transform = `rotate(${neigung}deg)`;
    // Grundhelligkeit nach Bereit (0 aus · 30 glimmen · 60 mittel · 80 hell), der Zustand verschiebt sie kurz.
    let h = m === "schlaeft" ? 0 : Math.min(1, this.score / 100) * 0.9 + (this.score > 0 ? 0.05 : 0);
    if (m === "fest") h = 1.25; else if (["sprechen", "freude", "zaehne"].includes(m)) h += 0.15; else if (m === "nachdenken") h -= 0.2; else if (m === "muede") h *= 0.5;
    if (m === "noch-ohne-namen") h = Math.max(h, 0.45);
    d.antennen.forEach((a, i) => {
      const el = document.getElementById(`lumi-licht-${i}`); if (!el) return;
      const flacker = m === "unruhig" ? (((this.frame + i * 3) % 7) < 3 ? 0.35 : 1) : 1;
      el.style.left = `${a.x * 100}%`; el.style.top = `${a.y * 100}%`;
      el.style.opacity = String(Math.max(0, Math.min(1, h * flacker)));
      el.style.transform = `translate(-50%, -50%) scale(${0.4 + Math.max(0, h) * 1.1})`;
    });
    const zt = document.getElementById("wesen-zustand"); if (zt) zt.textContent = ZUSTAND_TEXT[this.zustand];
    document.getElementById("lumi-buehne")?.setAttribute("aria-label", `${this.anzeigename()}: ${ZUSTAND_TEXT[this.zustand]}`);
    return true;
  }
  zeichnen() {
    if (this.fotoZeichnen()) return;
    const c = document.getElementById("wesen-pixel"), gl = document.getElementById("wesen-glut"); if (!c || !gl) return;
    const x = c.getContext("2d"); const jetzt = Date.now(); this.zustandBerechnen();
    const z = this.zustand; const f = this.frame;
    const grau = this.score < 30;
    const farben = { ...(FELLE[this.e.fell] || FELLE.eisblau) };
    if (grau) { farben.fell = "#b4bac2"; farben.bauch = "#d6dbe0"; farben.rand = "#7f868f"; }
    const px = (X, Y, col, w = 1, h = 1) => { x.fillStyle = col; x.fillRect(Math.round(X), Math.round(Y), w, h); };
    // Welt: Höhle
    x.fillStyle = "#1c1e23"; x.fillRect(0, 0, B, H);
    for (let i = 0; i < 40; i++) px((i * 7 + (i * i) % 11) % B, 5 + (i * 13) % 26, "#232630");
    for (let X = 0; X < B; X++) { px(X, 0, "#cfe9f2", 1, 2); px(X, 2, (X % 3 === 0) ? "#9fd3e6" : "#b9dfea"); if (X % 4 === 1) px(X, 3, "#9fd3e6"); }
    x.fillStyle = "#2a2422"; x.fillRect(0, 33, B, 3);
    for (let X = 0; X < B; X++) px(X, 34, (X + f) % 5 === 0 ? "#ff9a4a" : "#d06a1f");
    for (let i = 0; i < 6; i++) { const Y = 33 - ((f * 2 + i * 9) % 26); px((i * 8 + 3 + Math.floor(Y / 6)) % B, Y, "#3a3138"); }
    // Bewegung
    const wander = z === "wandert" ? Math.round(Math.sin(f / 6) * 4) : 0;
    const cx = 24 + wander; const liegt = z === "liegt" || z === "schlaeft";
    const zittert = z === "unruhig" ? (f % 2 ? 1 : 0) : 0;
    const ky = liegt ? 23 : 16; // Kopfmitte y
    // Turm (baut)
    if (z === "baut") { x.fillStyle = "#4a4d55"; x.fillRect(38, 22, 6, 11); x.fillStyle = "#5c606a"; x.fillRect(39, 21, 4, 1); px(40, 19, (f % 8 < 4) ? LICHT_HELL : LICHT, 2, 2); }
    // Pilzgarten über 80
    const pilze = Math.min(5, Math.max(0, Math.floor((this.score - 80) / 4)));
    for (let i = 0; i < pilze; i++) { const X = 3 + i * 4; px(X + 1, 31, "#e8dcc0", 1, 2); px(X, 29, i % 2 ? "#d06a1f" : "#c9b3e6", 3, 2); px(X + 1, 29, "#fff", 1, 1); }
    // Körper
    const body = (X, Y, w, h, col) => { for (let yy = 0; yy < h; yy++) { const d = Math.abs((yy + 0.5) / h - 0.5) * 2; const ww = Math.round(w * Math.sqrt(1 - d * d)); x.fillStyle = col; x.fillRect(Math.round(X - ww / 2), Y + yy, ww, 1); } };
    if (liegt) { body(cx, 21, 20, 10, farben.rand); body(cx, 22, 18, 8, farben.fell); body(cx, 25, 10, 4, farben.bauch); }
    else { body(cx + zittert, 22, 16, 11, farben.rand); body(cx + zittert, 23, 14, 9, farben.fell); body(cx + zittert, 26, 8, 5, farben.bauch); }
    // Hände
    px(cx - 8 + zittert, liegt ? 27 : 27, farben.rand, 2, 2); px(cx + 6 + zittert, liegt ? 27 : 27, farben.rand, 2, 2);
    if (z === "fest") { px(cx - 9, 21, farben.rand, 2, 3); px(cx + 7, 21, farben.rand, 2, 3); }
    // Kopf
    body(cx + zittert, ky - 6, 13, 12, farben.rand); body(cx + zittert, ky - 5, 11, 10, farben.fell);
    // Ohren: Winkel je Zustand (0 = aufrecht, negativ = nach hinten, seitlich bei liegt)
    const ohrenZurueck = jetzt < this.ohrenZurueckBis || z === "zaehne";
    const ohr = (seite) => {
      const bx = cx + zittert + seite * 5, by = ky - 5;
      let dx = 0, dy = -1;
      if (liegt) { dx = seite * 0.9; dy = -0.35; } else if (ohrenZurueck) { dx = -seite * 0.6; dy = -0.7; } else if (z === "unruhig") { dx = seite * (f % 4 < 2 ? 0.4 : -0.2); dy = -0.9; }
      for (let i = 1; i <= 9; i++) { const X = bx + dx * i, Y = by + dy * i; px(X - 1, Y, farben.rand, 3, 1); px(X, Y, i > 2 && i < 8 ? ROSA : farben.fell, 1, 1); }
    };
    ohr(-1); ohr(1);
    // Antennen und Leuchtkugeln
    const helligkeit = z === "fest" ? 1 : liegt ? 0.12 : Math.max(0.15, this.score / 100) * (this.score > 30 && f % 16 < 8 ? 1 : 0.85);
    const antenne = (seite) => {
      const bx = cx + zittert + seite, by = ky - 6;
      for (let i = 1; i <= 6; i++) px(bx + seite * Math.round(i * 0.35), by - i, i > 4 ? farben.fell : farben.rand, 2, 1);
      const X = bx + seite * 2 - 1, Y = by - 9;
      px(X, Y, helligkeit > 0.5 ? LICHT_HELL : LICHT, 3, 3); px(X + 1, Y - 1, LICHT, 1, 1); px(X + 1, Y + 3, LICHT, 1, 1); px(X - 1, Y + 1, LICHT, 1, 1); px(X + 3, Y + 1, LICHT, 1, 1);
      if (helligkeit > 0.3) px(X + 1, Y + 1, "#fff");
    };
    antenne(-1); antenne(1);
    // Gesicht
    const augenZu = liegt || (this.blinzelt > 0) || z === "fest" && f % 2;
    if (this.blinzelt > 0) this.blinzelt--; else if (rnd(45) === 0) this.blinzelt = 2;
    const auge = (X) => { if (augenZu) { px(X, ky, AUGE, 3, 1); return; } px(X, ky - 2, "#fff", 3, 5); px(X + (this.pupille ?? 1), ky - 1, AUGE, 2, 3); px(X + 1, ky - 1, GLANZ); };
    auge(cx - 5 + zittert); auge(cx + 2 + zittert);
    px(cx + zittert, ky + 2, ROSA); // Nase
    if (z === "zaehne") { px(cx - 2 + zittert, ky + 3, AUGE, 5, 2); px(cx - 1 + zittert, ky + 4, "#fff", 3, 1); }
    else if (z === "fest") { px(cx - 1 + zittert, ky + 3, AUGE, 3, 2); }
    else { px(cx - 1 + zittert, ky + 3, AUGE); px(cx + 1 + zittert, ky + 3, AUGE); }
    // Sterne (Fest) / zzz (schläft)
    if (z === "fest") for (let i = 0; i < 5; i++) { const X = (cx - 12 + i * 6 + f) % B, Y = 4 + (i * 3 + Math.floor(f / 4)) % 6; px(X, Y, i % 2 ? LICHT_HELL : "#fff"); }
    if (z === "schlaeft") { const s = Math.floor(f / 8) % 3; px(cx + 8, 8 - s, "#cfe9f2"); px(cx + 10, 6 - s, "#cfe9f2", 2, 1); px(cx + 13, 4 - s, "#cfe9f2", 3, 1); }
    // Schein (nicht pixelig, eigene Ebene)
    const g = gl.getContext("2d"); g.clearRect(0, 0, B, H);
    const r = 6 + helligkeit * (z === "fest" ? 40 : 18);
    for (const X of [cx - 2 + zittert, cx + 3 + zittert]) {
      const grad = g.createRadialGradient(X, ky - 14, 0, X, ky - 14, r);
      grad.addColorStop(0, `rgba(255,190,110,${0.6 * helligkeit + 0.1})`); grad.addColorStop(1, "rgba(255,150,60,0)");
      g.fillStyle = grad; g.fillRect(0, 0, B, H);
    }
    const zt = document.getElementById("wesen-zustand"); if (zt) zt.textContent = ZUSTAND_TEXT[z];
  }

  // ---------- Einstellungen und Log (HTML) ----------
  /** Einstellungen › Lumi. Aus: Beschreibung und Schalter. An: Name, Darstellung, Ausschalten (mit Rückfrage) und der Rest. */
  einstellungenHtml() {
    const e = this.e;
    const opt = (v, l, cur) => `<option value="${v}" ${cur === v ? "selected" : ""}>${l}</option>`;
    if (!this.aktiv()) return `<p style="margin:0 0 .6rem">${esc(TEXTE.beschreibung)}</p>
      <button type="button" class="btn btn-primary of-btn of-btn--primaer" data-lumi="einschalten">Lumi zeigen</button>
      <p class="muted of-klein" style="margin:.6rem 0 0;font-size:.85rem">${esc(TEXTE.einladungHinweis)} ${esc(TEXTE.ki)}${this.benannt() ? ` ${esc(e.name)} und alles, was sie gesagt hat, bleiben gespeichert.` : ""}</p>`;
    const aus = this.ausschaltenFrage
      ? `<div class="lumi-aus-frage" role="group"><p style="margin:0 0 .5rem">${esc(TEXTE.ausschalten(this.benannt() ? e.name : ""))}</p><button type="button" class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-lumi="ausschalten">Ausschalten</button> <button type="button" class="btn btn-sm of-btn of-btn--klein" data-lumi="dochnicht">Doch nicht</button></div>`
      : `<button type="button" class="btn btn-sm of-btn of-btn--klein" data-lumi="ausschalten-frage">Lumi ausschalten</button>`;
    return `<div class="grid grid-3">
      <label>Name<br><input class="of-input" type="text" data-wesen="name" value="${esc(e.name)}" maxlength="24" autocomplete="off" placeholder="noch ohne Namen"></label>
      <label>Darstellung<br><select class="of-select" data-wesen="darstellung">${opt("wesen", "Lumi mit Tipps", e.darstellung)}${opt("tipps", "Nur Tipps", e.darstellung)}</select></label>
      <label>Figur<br><select class="of-select" data-wesen="figur">${opt("foto", "Foto", e.figur)}${opt("pixel", "Pixel (sparsam)", e.figur)}</select></label>
      <label>Tipps<br><select class="of-select" data-wesen="takt">${opt("normal", "normal (alle 90 s)", e.takt)}${opt("seltener", "seltener", e.takt)}${opt("aus", "aus", e.takt)}</select></label>
      <label>Größe<br><select class="of-select" data-wesen="groesse">${opt("klein", "klein", e.groesse)}${opt("mittel", "mittel", e.groesse)}${opt("gross", "groß", e.groesse)}</select></label>
      <label>Fell (Pixel)<br><select class="of-select" data-wesen="fell">${Object.keys(FELLE).map((k) => opt(k, k[0].toUpperCase() + k.slice(1), e.fell)).join("")}</select></label>
      <div><label><input type="checkbox" data-wesen="laute" ${e.laute ? "checked" : ""}> Laute in Sprechblasen</label><br><label><input type="checkbox" data-wesen="toene" ${e.toene ? "checked" : ""}> drei leise Töne</label><br><label><input type="checkbox" data-wesen="baut" ${e.baut ? "checked" : ""}> baut über 80</label></div>
    </div>
    <p class="muted of-klein" style="margin:.8rem 0 .3rem">Welche Tipps kommen</p>
    <div style="display:flex;gap:.8rem;flex-wrap:wrap">${Object.entries(SORTEN).map(([k, l]) => `<label><input type="checkbox" data-wesen-sorte="${k}" ${e.sorten[k] ? "checked" : ""}> ${l}${k === "digital" ? ' <span class="muted of-klein">(Einstieg in die digitale Welt)</span>' : ""}</label>`).join("")}</div>
    <p class="muted of-klein" style="margin:.8rem 0 0;font-size:.85rem">Gelernt: Tipps alle ${this.gelernt.intervall} s (${this.gelernt.gelesen} gelesen, ${this.gelernt.weitergewischt} weitergewischt). <button class="btn btn-sm of-btn of-btn--klein" data-wesen-gelernt-zurueck>Zurücksetzen</button></p>
    <p class="muted of-klein" style="margin:.4rem 0 .8rem;font-size:.85rem">${esc(TEXTE.ki)}</p>
    ${aus}`;
  }
  logHtml(filter = "", suche = "") {
    const q = suche.trim().toLowerCase();
    const liste = [...this.log].reverse().filter((l) => (!filter || l.sorte === filter) && (!q || l.text.toLowerCase().includes(q)));
    return `<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.6rem"><select class="of-select" id="wesen-log-filter"><option value="">Alle Sorten</option>${Object.entries(SORTEN).map(([k, l]) => `<option value="${k}" ${filter === k ? "selected" : ""}>${l}</option>`).join("")}</select><input class="of-input" type="text" id="wesen-log-suche" placeholder="Suchen …" value="${esc(suche)}" autocomplete="off"><span class="muted of-klein" style="align-self:center">${liste.length} Tipp${liste.length === 1 ? "" : "s"}</span></div>
      ${liste.length ? `<ul class="wesen-log">${liste.slice(0, 200).map((l) => `<li><button class="wesen-stern ${l.stern ? "an" : ""}" data-wesen-stern="${esc(l.id)}" aria-label="Merken">${l.stern ? "★" : "☆"}</button><span class="wesen-sorte">${esc(SORTEN[l.sorte] ?? l.sorte)}</span> ${esc(l.text)} <span class="muted of-klein" style="font-size:.8rem">${new Date(l.zeit).toLocaleString("de-AT", { dateStyle: "short", timeStyle: "short" })}</span></li>`).join("")}</ul>` : `<p class="muted of-klein">Noch nichts gesagt.</p>`}`;
  }
  einstellen(k, v) {
    if (k in STANDARD.sorten) this.e.sorten[k] = v; else this.e[k] = v;
    if (k === "name") { const n = String(v).trim().slice(0, 24); if (!n) return; if (!this.benannt()) return this.namenGeben(n); this.e.name = n; }
    this.speichern(); if (k === "takt" || k === "darstellung") this.planen();
  }
}
