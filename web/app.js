import {
  PAKET, NOTRUFE, SIRENEN, SIRENEN_HINWEIS, VORSORGE, BLACKOUT_ABLAUF,
  BUNDESLAENDER, QUELLEN, PAKETE, AENDERUNGEN,
} from "./data/inhalte.js";

// ---------- Speicher (nur Komfort, darf fehlen) ----------
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem("offline:" + key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("offline:" + key, JSON.stringify(value)); } catch { /* egal */ }
  },
};

const state = {
  installiert: new Set(store.get("installiert", PAKETE.filter((p) => p.installiert).map((p) => p.id))),
  checks: store.get("checks", {}),
  abo: store.get("abo", { intervall: "woechentlich", nurWlan: true, fenster: true, von: "02:00", bis: "05:00", aktiv: true }),
  bundesland: store.get("bundesland", "Wien"),
  notizen: store.get("notizen", ""),
  filter: "Alle",
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const gb = (n) => (n < 1 ? `${Math.round(n * 1000)} MB` : `${n.toLocaleString("de-AT", { maximumFractionDigits: 1 })} GB`);
const datum = (iso) => new Date(iso).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" });

// ---------- Navigation ----------
const I = {
  start: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  notfall: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  vorsorge: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  bibliothek: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  karte: '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4z"/><path d="M8 2v16M16 6v16"/>',
  ki: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  notizen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  updates: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
};
const ROUTEN = [
  ["start", "Übersicht"], ["notfall", "Notfall"], ["vorsorge", "Vorsorge"], ["bibliothek", "Bibliothek"],
  ["karte", "Karte"], ["ki", "KI-Assistent"], ["notizen", "Notizen"], ["updates", "Updates & Abo"],
];
const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;
document.getElementById("nav").innerHTML = ROUTEN.map(([id, name]) => `<a href="#${id}" data-route="${id}">${icon(id)}${name}</a>`).join("");

// ---------- Seiten ----------
const seiten = {
  start() {
    const belegt = PAKETE.filter((p) => state.installiert.has(p.id)).reduce((s, p) => s + p.groesse, 0);
    const erledigt = Object.values(state.checks).filter(Boolean).length;
    const gesamt = VORSORGE.reduce((s, g) => s + g.punkte.length, 0);
    return `
      <div class="page-head"><div><h1 style="font-size:2rem">Servus.</h1><p>Alles hier funktioniert ohne Internet.</p></div>
        <div class="field" style="margin:0"><label for="bl">Dein Bundesland</label>
          <select id="bl">${BUNDESLAENDER.map((b) => `<option ${b === state.bundesland ? "selected" : ""}>${b}</option>`).join("")}</select></div></div>
      <div class="grid grid-3">
        <a class="card" href="#notfall" style="text-decoration:none;border-color:var(--accent)">
          <span class="tag tag-pro">Notfall</span><h3 style="margin-top:.6rem">Notrufe & Sirenen</h3>
          <p class="muted" style="margin:0">112 · 122 · 133 · 144 und was die Sirenen bedeuten.</p></a>
        <a class="card" href="#vorsorge" style="text-decoration:none">
          <span class="tag">${erledigt} / ${gesamt} erledigt</span><h3 style="margin-top:.6rem">Blackout-Vorsorge</h3>
          <div class="progress"><div style="width:${(erledigt / gesamt) * 100}%"></div></div></a>
        <a class="card" href="#updates" style="text-decoration:none">
          <span class="tag ${state.abo.aktiv ? "tag-ok" : "tag-warn"}">${state.abo.aktiv ? "Abo aktiv" : "Abo pausiert"}</span>
          <h3 style="margin-top:.6rem">Updates</h3><p class="muted" style="margin:0">${intervallText()} · ${AENDERUNGEN.length} Änderungen im letzten Monat</p></a>
      </div>
      <h2 style="margin-top:2rem">Installiert</h2>
      <div class="card">
        <div class="storage"><strong>${gb(belegt)}</strong><div class="progress"><div style="width:${Math.min(100, (belegt / 64) * 100)}%"></div></div><span class="muted">von 64 GB auf „OFFLINE-Stick“</span></div>
        <ul class="changelog" style="margin-top:.75rem">${PAKETE.filter((p) => state.installiert.has(p.id)).map((p) =>
          `<li><span class="tag">${esc(p.typ)}</span><span>${esc(p.name)} <span class="muted">· ${gb(p.groesse)}</span></span></li>`).join("")}</ul>
        <a class="btn btn-sm" href="#bibliothek" style="margin-top:.75rem">Pakete verwalten</a>
      </div>`;
  },

  notfall() {
    const welle = {
      konstant: "M2 22 H298",
      heulend: "M2 22 " + Array.from({ length: 6 }, (_, i) => `Q${27 + i * 50} ${i % 2 ? 42 : 2} ${52 + i * 50} 22`).join(" "),
    };
    return `
      <div class="page-head"><div><h1 style="font-size:2rem">Notfall</h1><p>Tippe auf eine Nummer, um anzurufen.</p></div></div>
      <div class="grid grid-2">${NOTRUFE.map((n) => `
        <div class="card notruf"><a class="notruf-nr ${n.nr.length > 4 ? "long" : ""}" href="tel:${n.nr.replace(/\s/g, "")}">${esc(n.nr)}</a>
          <div><h3>${esc(n.name)}</h3><p>${esc(n.info)}</p></div></div>`).join("")}
      </div>
      <h2 style="margin-top:2rem">Sirenensignale</h2>
      <div class="grid grid-3">${SIRENEN.map((s) => `
        <div class="card siren"><h3>${esc(s.name)}</h3>
          <svg viewBox="0 0 300 44" preserveAspectRatio="none" aria-hidden="true"><path d="${welle[s.muster]}"/></svg>
          <p><strong>${esc(s.dauer)}</strong></p><p class="muted" style="margin:0">${esc(s.tun)}</p></div>`).join("")}
      </div>
      <p class="muted" style="margin-top:1rem">${esc(SIRENEN_HINWEIS)}</p>`;
  },

  vorsorge() {
    const gesamt = VORSORGE.reduce((s, g) => s + g.punkte.length, 0);
    const erledigt = Object.values(state.checks).filter(Boolean).length;
    return `
      <div class="page-head"><div><h1 style="font-size:2rem">Blackout-Vorsorge</h1><p>Deine Checkliste. Wird nur auf diesem Gerät gespeichert.</p></div>
        <div style="min-width:220px"><div class="muted" style="font-size:.9rem;margin-bottom:.3rem">${erledigt} von ${gesamt} erledigt</div><div class="progress"><div style="width:${(erledigt / gesamt) * 100}%"></div></div></div></div>
      <div class="grid grid-2">${VORSORGE.map((g, gi) => `
        <div class="card"><h3>${esc(g.gruppe)}</h3><ul class="check">${g.punkte.map((p, pi) => {
          const id = `${gi}-${pi}`;
          return `<li><label><input type="checkbox" data-check="${id}" ${state.checks[id] ? "checked" : ""}><span>${esc(p)}</span></label></li>`;
        }).join("")}</ul></div>`).join("")}
      </div>
      <h2 style="margin-top:2rem">Wenn der Strom ausfällt</h2>
      <div class="card"><ol class="timeline">${BLACKOUT_ABLAUF.map((s) => `<li><h3>${esc(s.t)}</h3><p class="muted" style="margin:0">${esc(s.text)}</p></li>`).join("")}</ol></div>
      <p class="muted" style="margin-top:1rem;font-size:.9rem">Weiterführend: ${QUELLEN.slice(0, 2).map((q) => `<a href="${q.url}" rel="noopener">${esc(q.name)}</a>`).join(" · ")}</p>`;
  },

  bibliothek() {
    const typen = ["Alle", ...new Set(PAKETE.map((p) => p.typ))];
    const liste = PAKETE.filter((p) => state.filter === "Alle" || p.typ === state.filter);
    return `
      <div class="page-head"><div><h1 style="font-size:2rem">Bibliothek</h1><p>Pakete installieren – im Prototyp simuliert, in der App vom USB-Stick oder aus dem Netz.</p></div></div>
      <div class="filters">${typen.map((t) => `<button data-filter="${t}" aria-pressed="${t === state.filter}">${t}</button>`).join("")}</div>
      <div class="grid grid-2">${liste.map((p) => {
        const inst = state.installiert.has(p.id);
        return `<div class="card pkg">
          <div class="pkg-head"><h3 style="margin:0">${esc(p.name)}</h3>${p.pro ? '<span class="tag tag-pro">Pro</span>' : ""}</div>
          <p>${esc(p.text)}</p>
          <div class="pkg-foot"><span class="muted mono" style="font-size:.85rem">${gb(p.groesse)}</span>
            ${inst ? `<button class="btn btn-sm" data-remove="${p.id}">Entfernen</button>`
                   : `<button class="btn btn-sm ${p.pro ? "" : "btn-primary"}" data-install="${p.id}" ${p.pro ? "disabled title='Nur mit Pro'" : ""}>${p.pro ? "Nur mit Pro" : "Installieren"}</button>`}
          </div></div>`;
      }).join("")}</div>`;
  },

  karte() {
    return `
      <div class="page-head"><div><h1 style="font-size:2rem">Karte Österreich</h1><p>Im Prototyp live von basemap.at, in der App als Offline-Datei auf deinem Rechner.</p></div></div>
      <div id="karte" role="region" aria-label="Karte von Österreich"></div>`;
  },

  ki() {
    return `
      <div class="page-head"><div><h1 style="font-size:2rem">KI-Assistent</h1><p>Prototyp: sucht in den installierten Österreich-Inhalten. In der App antwortet ein lokales Sprachmodell.</p></div></div>
      <div class="card"><div class="chat" id="chat">
        <div class="bubble bot">Servus! Frag mich etwas zu Notrufen, Sirenen oder Blackout-Vorsorge – zum Beispiel „Was bedeutet der Heulton?“ oder „Wie viel Wasser brauche ich?“</div></div>
        <form class="chat-form" id="chat-form"><input type="text" id="frage" placeholder="Deine Frage …" autocomplete="off" aria-label="Frage"><button class="btn btn-primary">Fragen</button></form>
      </div>`;
  },

  notizen() {
    return `
      <div class="page-head"><div><h1 style="font-size:2rem">Notizen</h1><p>Bleiben auf diesem Gerät. Markdown ist erlaubt.</p></div><span class="muted" id="gespeichert"></span></div>
      <textarea id="notizen" rows="18" style="width:100%;resize:vertical" placeholder="z. B. Treffpunkt der Familie, wichtige Nummern, Medikamente …">${esc(state.notizen)}</textarea>`;
  },

  updates() {
    const opt = [["taeglich", "Täglich"], ["woechentlich", "Wöchentlich"], ["monatlich", "Monatlich"], ["manuell", "Manuell"]];
    return `
      <div class="page-head"><div><h1 style="font-size:2rem">Updates & Abo</h1><p>Geladen wird nur, wenn du online bist – und nur, was sich geändert hat.</p></div>
        <button class="btn btn-primary" id="jetzt">Jetzt prüfen</button></div>
      <div class="grid grid-2">
        <div class="card">
          <div class="field"><span class="legend">Wie oft?</span>
            <div class="seg" role="group" aria-label="Intervall">${opt.map(([k, n]) => `<button data-intervall="${k}" aria-pressed="${state.abo.intervall === k}">${n}</button>`).join("")}</div></div>
          <div class="switch"><span><strong>Update-Abo aktiv</strong><br><span class="muted" style="font-size:.9rem">Pausieren, ohne Einstellungen zu verlieren</span></span><input type="checkbox" data-abo="aktiv" ${state.abo.aktiv ? "checked" : ""}></div>
          <div class="switch"><span><strong>Nur im WLAN</strong><br><span class="muted" style="font-size:.9rem">Kein Download über Handy-Hotspot</span></span><input type="checkbox" data-abo="nurWlan" ${state.abo.nurWlan ? "checked" : ""}></div>
          <div class="switch"><span><strong>Zeitfenster</strong><br><span class="muted" style="font-size:.9rem">z. B. nachts, wenn der Rechner nicht gebraucht wird</span></span><input type="checkbox" data-abo="fenster" ${state.abo.fenster ? "checked" : ""}></div>
          <div style="display:flex;gap:.5rem;align-items:center;${state.abo.fenster ? "" : "opacity:.5"}">
            <input type="time" data-zeit="von" value="${state.abo.von}" aria-label="von"> bis <input type="time" data-zeit="bis" value="${state.abo.bis}" aria-label="bis"></div>
        </div>
        <div class="card">
          <h3>Was ist neu?</h3>
          <ul class="changelog">${AENDERUNGEN.map((a) => `<li><span class="muted mono" style="font-size:.85rem">${datum(a.datum)}</span><span><strong>${esc(a.paket)}</strong><br><span class="muted">${esc(a.text)}</span></span></li>`).join("")}</ul>
        </div>
      </div>
      <div class="card" style="margin-top:1rem" id="pruef"><span class="muted">Installiert: ${esc(PAKET.titel)} · Version <span class="mono">${PAKET.version}</span>. Jedes Paket ist signiert und wird vor dem Einspielen geprüft.</span></div>`;
  },
};

function intervallText() {
  return { taeglich: "täglich", woechentlich: "wöchentlich", monatlich: "monatlich", manuell: "manuell" }[state.abo.intervall];
}

// ---------- Karte ----------
function karteStarten() {
  const el = document.getElementById("karte");
  if (!el || !window.L) { if (el) el.innerHTML = '<p class="muted" style="padding:1rem">Karte konnte nicht geladen werden.</p>'; return; }
  const map = L.map(el, { minZoom: 6, maxBounds: [[45.8, 9.0], [49.6, 17.6]] }).setView([47.6, 13.6], 7);
  L.tileLayer("https://mapsneu.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png", {
    maxZoom: 19, attribution: 'Grundkarte: <a href="https://basemap.at">basemap.at</a> (CC BY 4.0)',
  }).addTo(map);
}

// ---------- KI (Prototyp: Stichwortsuche) ----------
function antworte(frage) {
  const f = frage.toLowerCase();
  const treffer = [];
  for (const n of NOTRUFE) if (f.includes(n.nr) || f.includes(n.name.toLowerCase().split(" ")[0])) treffer.push(`<strong>${n.nr} – ${n.name}:</strong> ${n.info}`);
  for (const s of SIRENEN) if (f.includes(s.name.toLowerCase()) || (f.includes("heul") && s.muster === "heulend") || (f.includes("sirene") && !treffer.length))
    treffer.push(`<strong>${s.name}</strong> (${s.dauer}): ${s.tun}`);
  if (/wasser|trink/.test(f)) treffer.push(VORSORGE[0].punkte[0] + ". Dazu Wasser für die WC-Spülung.");
  if (/blackout|strom/.test(f)) BLACKOUT_ABLAUF.slice(0, 2).forEach((s) => treffer.push(`<strong>${s.t}:</strong> ${s.text}`));
  if (/geld|bargeld|bankomat/.test(f)) treffer.push(VORSORGE[3].punkte[0] + ".");
  if (/rettung|arzt|krank|verletzt/.test(f) && !treffer.length) treffer.push(`<strong>144 – Rettung</strong> im Notfall, <strong>141</strong> für den Ärztenotdienst, <strong>1450</strong> für Beratung.`);
  return treffer.length
    ? [...new Set(treffer)].slice(0, 4).map(esc).map((t) => t.replace(/&lt;(\/?)strong&gt;/g, "<$1strong>")).join("<br><br>") + '<br><br><span class="muted" style="font-size:.85rem">Quelle: Österreich-Paket</span>'
    : "Dazu finde ich im Österreich-Paket nichts. Mit installierter Wikipedia und dem KI-Modell kann ich in der App mehr beantworten.";
}

// ---------- Rendern & Ereignisse ----------
const main = document.getElementById("main");
function render() {
  const route = (location.hash.slice(1) || "start");
  const seite = seiten[route] ? route : "start";
  main.innerHTML = seiten[seite]();
  document.querySelectorAll("#nav a").forEach((a) => (a.dataset.route === seite ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  document.title = `OFFLINE – ${ROUTEN.find((r) => r[0] === seite)[1]}`;
  if (seite === "karte") karteStarten();
  sidebar.classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
}

main.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.check) { state.checks[t.dataset.check] = t.checked; store.set("checks", state.checks); render(); }
  if (t.dataset.abo) { state.abo[t.dataset.abo] = t.checked; store.set("abo", state.abo); render(); }
  if (t.dataset.zeit) { state.abo[t.dataset.zeit] = t.value; store.set("abo", state.abo); }
  if (t.id === "bl") { state.bundesland = t.value; store.set("bundesland", t.value); }
});

main.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.filter) { state.filter = b.dataset.filter; render(); }
  if (b.dataset.install) { state.installiert.add(b.dataset.install); store.set("installiert", [...state.installiert]); render(); }
  if (b.dataset.remove) { state.installiert.delete(b.dataset.remove); store.set("installiert", [...state.installiert]); render(); }
  if (b.dataset.intervall) { state.abo.intervall = b.dataset.intervall; store.set("abo", state.abo); render(); }
  if (b.id === "jetzt") {
    const box = document.getElementById("pruef");
    if (!navigator.onLine) { box.innerHTML = '<span class="tag tag-warn">Offline</span> Kein Internet – das Abo prüft beim nächsten Mal, wenn du online bist.'; return; }
    box.innerHTML = '<span class="muted">Prüfe Paketkatalog …</span>';
    setTimeout(() => { box.innerHTML = `<span class="tag tag-ok">Aktuell</span> Alle installierten Pakete sind auf dem neuesten Stand. Nächste Prüfung: ${intervallText()}.`; }, 900);
  }
});

main.addEventListener("submit", (e) => {
  if (e.target.id !== "chat-form") return;
  e.preventDefault();
  const input = document.getElementById("frage");
  const frage = input.value.trim();
  if (!frage) return;
  const chat = document.getElementById("chat");
  chat.insertAdjacentHTML("beforeend", `<div class="bubble user">${esc(frage)}</div><div class="bubble bot">${antworte(frage)}</div>`);
  input.value = "";
});

main.addEventListener("input", (e) => {
  if (e.target.id !== "notizen") return;
  state.notizen = e.target.value;
  store.set("notizen", state.notizen);
  document.getElementById("gespeichert").textContent = "Gespeichert";
});

const sidebar = document.getElementById("sidebar");
const menu = document.getElementById("menu");
menu.addEventListener("click", () => { const open = sidebar.classList.toggle("open"); menu.setAttribute("aria-expanded", String(open)); });

function netz() {
  const on = navigator.onLine;
  document.getElementById("net-dot").className = "dot " + (on ? "on" : "off");
  document.getElementById("net-text").textContent = on ? "Online – Abo kann laden" : "Offline – alles verfügbar";
}
addEventListener("online", netz);
addEventListener("offline", netz);
addEventListener("hashchange", render);
netz();
render();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
