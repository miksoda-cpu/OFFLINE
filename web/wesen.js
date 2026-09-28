// Das Wesen – ein Lumi von unter dem Eis. Oberfläche und Zustände; die Tipps kommen aus dem Paket „wir“.
// Grundsätze: Es stirbt nicht, bettelt nicht (keine Push), lügt nicht (der Score steht daneben). Pakete liefern nur Text,
// Bedingungen sind Daten (kein Code), jeder Tipp wird beim Anzeigen entschärft.

const B = 48, H = 36; // logische Pixel

export const FELLE = {
  eisblau: { fell: "#a9d4e8", bauch: "#dff0f8", rand: "#6f9db3" },
  flieder: { fell: "#c9b3e6", bauch: "#eadff6", rand: "#8f78b3" },
  moos: { fell: "#a9c9a0", bauch: "#dbead6", rand: "#6f8f66" },
  sand: { fell: "#e2cfa6", bauch: "#f3e9d2", rand: "#b09a6a" },
};
const ROSA = "#f2a8b8", AUGE = "#1b1a22", GLANZ = "#ffffff", LICHT = "#ffb35c", LICHT_HELL = "#fff0c2";

export const ZUSTAND_TEXT = {
  liegt: "liegt – Bereit unter 30", sitzt: "sitzt und blinzelt", wandert: "wandert und sammelt Pilze", baut: "baut einen Turm mit Licht",
  unruhig: "unruhig – etwas ist verfallen", zaehne: "zeigt die Zähne – Reflex", fest: "feiert", schlaeft: "schläft",
};
export const SORTEN = { app: "App", alltag: "Alltag", wissen: "Wissen", weisheit: "Weisheit", laune: "Laune", heute: "Heute", digital: "Digital" };

const STANDARD = {
  darstellung: "wesen", name: "Das Wesen", fell: "eisblau", welt: "hoehle", laute: true, toene: false, takt: "normal",
  sorten: { app: true, alltag: true, wissen: true, weisheit: true, laune: true, heute: true, digital: false }, baut: true, groesse: "mittel",
};
const TAKT = { normal: 90, seltener: 180, aus: 0 };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rnd = (n) => Math.floor(Math.random() * n);

export class Wesen {
  /** @param {{speicher:object, tipps:()=>Array, onLog?:Function}} o */
  constructor(o) {
    this.sp = o.speicher; this.tippsQuelle = o.tipps; this.onLog = o.onLog;
    this.e = { ...STANDARD, ...(this.sp.get("wesen", {}) || {}) }; this.e.sorten = { ...STANDARD.sorten, ...(this.e.sorten || {}) };
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

  speichern() { this.sp.set("wesen", this.e); this.sp.set("wesen-gelernt", this.gelernt); this.sp.set("wesen-log", this.log.slice(-500)); }
  aktiv() { return this.e.darstellung !== "aus"; }
  mitFigur() { return this.e.darstellung === "wesen"; }

  // ---------- Zustand ----------
  setScore(bereit) {
    this.score = bereit.wert; this.verfallen = bereit.verfallen.map((v) => v.titel);
    this.zustandBerechnen();
  }
  zustandBerechnen() {
    const jetzt = Date.now();
    if (this.zaehneBis > jetzt) return (this.zustand = "zaehne");
    if (this.schlaeft) return (this.zustand = "schlaeft");
    if (this.festBis > jetzt) return (this.zustand = "fest");
    if (this.verfallen.length && this.score >= 30) return (this.zustand = "unruhig");
    this.zustand = this.score < 30 ? "liegt" : this.score < 60 ? "sitzt" : this.score < 80 || !this.e.baut ? "wandert" : "baut";
  }
  fest() { this.festBis = Date.now() + 12 * 3600000; this.sp.set("wesen-fest", new Date(this.festBis).toISOString()); this.ton("fest"); this.zustandBerechnen(); this.zeichnen(); }
  anstupsen() {
    const jetzt = Date.now();
    this.letzteEingabe = jetzt;
    if (this.schlaeft) { this.schlaeft = false; this.zustandBerechnen(); this.laut("…mh? Da bin ich."); this.zeichnen(); return; }
    this.pokes = this.pokes.filter((t) => jetzt - t < 1200); this.pokes.push(jetzt);
    if (this.pokes.length >= 3) {
      this.pokes = []; this.zaehneBis = jetzt + 1000; this.zustandBerechnen(); this.laut("grrr"); this.ton("zaehne");
      setTimeout(() => { this.zaehneBis = 0; this.zustandBerechnen(); this.laut("…tschuldigung. Ich mag das nicht."); this.zeichnen(); }, 1000);
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
  kontext() { return { ansicht: this.ansichtName, score: this.score, verfallen: this.verfallen.length > 0, monat: new Date().getMonth() + 1, einstellung: { digital: !!this.e.sorten.digital } }; }
  passt(t, k) {
    const b = t.bedingung; if (!b) return true;
    if (b.ansicht && b.ansicht !== k.ansicht) return false;
    if (b.einstellung && !k.einstellung[b.einstellung]) return false;
    if (b.monat && b.monat !== k.monat) return false;
    if (b.score_unter != null && !(k.score < b.score_unter)) return false;
    if (b.score_ab != null && !(k.score >= b.score_ab)) return false;
    if (b.verfallen && !k.verfallen) return false;
    return true;
  }
  waehleTipp(nurAnsicht = null) {
    const alle = (this.tippsQuelle() || []).filter((t) => t && typeof t.text === "string" && SORTEN[t.sorte]);
    const k = this.kontext();
    const kuerzlich = new Set(this.log.filter((l) => Date.now() - new Date(l.zeit).getTime() < 86400000).map((l) => l.id));
    let pool = alle.filter((t) => this.e.sorten[t.sorte] && this.passt(t, k));
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
    if (!t) return;
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
    return `<div class="wesen" style="--wb:${g}px"><div class="wesen-buehne"><canvas id="wesen-pixel" width="${B}" height="${H}" role="img" aria-label="${esc(this.e.name)}: ${esc(ZUSTAND_TEXT[this.zustand])}" tabindex="0"></canvas><canvas id="wesen-glut" width="${B}" height="${H}"></canvas></div>
      <div class="wesen-blase" id="wesen-blase" role="status" aria-live="polite" hidden></div>
      <div class="wesen-text"><strong>${esc(this.e.name)}</strong> <span class="muted" id="wesen-zustand">${esc(ZUSTAND_TEXT[this.zustand])}</span></div></div>`;
  }
  einbauen() {
    const c = document.getElementById("wesen-pixel"); if (!c) return;
    c.onclick = () => this.anstupsen(); c.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.anstupsen(); } };
    clearInterval(this.anim); this.anim = setInterval(() => { this.frame++; if (!document.getElementById("wesen-pixel")) { clearInterval(this.anim); return; } this.zeichnen(); }, 125);
    this.zeichnen();
  }

  // ---------- Zeichnen ----------
  zeichnen() {
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
  einstellungenHtml() {
    const e = this.e;
    const opt = (v, l, cur) => `<option value="${v}" ${cur === v ? "selected" : ""}>${l}</option>`;
    return `<div class="grid grid-3">
      <label>Darstellung<br><select data-wesen="darstellung">${opt("wesen", "Wesen mit Tipps", e.darstellung)}${opt("tipps", "Nur Tipps", e.darstellung)}${opt("aus", "Aus – nur die Zahl", e.darstellung)}</select></label>
      <label>Name<br><input type="text" data-wesen="name" value="${esc(e.name)}" maxlength="24" autocomplete="off"></label>
      <label>Fell<br><select data-wesen="fell">${Object.keys(FELLE).map((k) => opt(k, k[0].toUpperCase() + k.slice(1), e.fell)).join("")}</select></label>
      <label>Tipps<br><select data-wesen="takt">${opt("normal", "normal (alle 90 s)", e.takt)}${opt("seltener", "seltener", e.takt)}${opt("aus", "aus", e.takt)}</select></label>
      <label>Größe<br><select data-wesen="groesse">${opt("klein", "klein", e.groesse)}${opt("mittel", "mittel", e.groesse)}${opt("gross", "groß", e.groesse)}</select></label>
      <div><label><input type="checkbox" data-wesen="laute" ${e.laute ? "checked" : ""}> Laute in Sprechblasen</label><br><label><input type="checkbox" data-wesen="toene" ${e.toene ? "checked" : ""}> drei leise Töne</label><br><label><input type="checkbox" data-wesen="baut" ${e.baut ? "checked" : ""}> baut über 80</label></div>
    </div>
    <p class="muted" style="margin:.8rem 0 .3rem">Welche Tipps kommen</p>
    <div style="display:flex;gap:.8rem;flex-wrap:wrap">${Object.entries(SORTEN).map(([k, l]) => `<label><input type="checkbox" data-wesen-sorte="${k}" ${e.sorten[k] ? "checked" : ""}> ${l}${k === "digital" ? ' <span class="muted">(Einstieg in die digitale Welt)</span>' : ""}</label>`).join("")}</div>
    <p class="muted" style="margin:.8rem 0 0;font-size:.85rem">Gelernt: Tipps alle ${this.gelernt.intervall} s (${this.gelernt.gelesen} gelesen, ${this.gelernt.weitergewischt} weitergewischt). <button class="btn btn-sm" data-wesen-gelernt-zurueck>Zurücksetzen</button></p>`;
  }
  logHtml(filter = "", suche = "") {
    const q = suche.trim().toLowerCase();
    const liste = [...this.log].reverse().filter((l) => (!filter || l.sorte === filter) && (!q || l.text.toLowerCase().includes(q)));
    return `<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.6rem"><select id="wesen-log-filter"><option value="">Alle Sorten</option>${Object.entries(SORTEN).map(([k, l]) => `<option value="${k}" ${filter === k ? "selected" : ""}>${l}</option>`).join("")}</select><input type="text" id="wesen-log-suche" placeholder="Suchen …" value="${esc(suche)}" autocomplete="off"><span class="muted" style="align-self:center">${liste.length} Tipp${liste.length === 1 ? "" : "s"}</span></div>
      ${liste.length ? `<ul class="wesen-log">${liste.slice(0, 200).map((l) => `<li><button class="wesen-stern ${l.stern ? "an" : ""}" data-wesen-stern="${esc(l.id)}" aria-label="Merken">${l.stern ? "★" : "☆"}</button><span class="wesen-sorte">${esc(SORTEN[l.sorte] ?? l.sorte)}</span> ${esc(l.text)} <span class="muted" style="font-size:.8rem">${new Date(l.zeit).toLocaleString("de-AT", { dateStyle: "short", timeStyle: "short" })}</span></li>`).join("")}</ul>` : `<p class="muted">Noch nichts gesagt.</p>`}`;
  }
  einstellen(k, v) {
    if (k in STANDARD.sorten) this.e.sorten[k] = v; else this.e[k] = v;
    if (k === "name" && !String(v).trim()) this.e.name = "Das Wesen";
    this.speichern(); if (k === "takt" || k === "darstellung") this.planen();
  }
}
