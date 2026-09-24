// OFFLINE – App-Oberfläche (Prototyp). Alle Inhalte kommen aus signierten Paketen, siehe paket-client.js.
import { versionVergleich } from "./paket-kern.js";

// Im Browser prüft und speichert paket-client.js selbst; in der Desktop-App macht das der Rust-Kern.
const client = window.__TAURI__ ? await import("./paket-client-tauri.js") : await import("./paket-client.js");
const { speicher, ladeKatalog, katalogAusSpeicher, installiertesPaket, installiere, entferne, verfuegbareUpdates, inhalt, installierteIds } = client;
const desktop = client.istDesktop ? await client.init() : null;
if (desktop) {
  // Abo-Einstellungen liegen in der App beim Kern (er führt sie im Hintergrund aus)
  const a = await client.aboLesen();
  desktop.abo = a;
  client.beiAboErgebnis((erg) => {
    state.meldung = erg.fehler.length
      ? { art: "warn", titel: "Abo", text: `Automatische Prüfung: ${erg.aktualisiert.length} aktualisiert, Fehler: ${esc(erg.fehler.join("; "))}` }
      : { art: "ok", titel: "Abo", text: erg.aktualisiert.length ? `Automatisch aktualisiert: ${erg.aktualisiert.map((x) => `${esc(x.id)} ${esc(x.version)}`).join(", ")}` : "Automatische Prüfung: alles aktuell." };
    render();
  });
}

const BASISPAKET = "at-basis";

const state = {
  checks: speicher.get("checks", {}),
  abo: speicher.get("abo", { intervall: "woechentlich", nurWlan: true, fenster: true, von: "02:00", bis: "05:00", aktiv: true }),
  fortschritt: null, // { pfad, geladen, gesamt } während eines Downloads
  bundesland: speicher.get("bundesland", "Wien"),
  notizen: speicher.get("notizen", ""),
  filter: "Alle",
  meldung: null, // { text, art } für die Update-Seite
};

if (desktop?.abo) {
  const e = desktop.abo.einstellungen;
  state.abo = { intervall: e.intervall, nurWlan: e.nur_wlan, fenster: e.fenster, von: e.von, bis: e.bis, aktiv: e.aktiv, katalogUrl: e.katalog_url };
}
function aboSpeichern() {
  speicher.set("abo", state.abo);
  if (desktop) client.aboSchreiben({ aktiv: state.abo.aktiv, intervall: state.abo.intervall, nur_wlan: state.abo.nurWlan, fenster: state.abo.fenster, von: state.abo.von, bis: state.abo.bis, katalog_url: state.abo.katalogUrl ?? desktop.abo.einstellungen.katalog_url }).catch(() => {});
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const groesse = (b) => b < 1e6 ? `${Math.max(1, Math.round(b / 1e3))} kB` : b < 1e9 ? `${(b / 1e6).toLocaleString("de-AT", { maximumFractionDigits: 1 })} MB` : `${(b / 1e9).toLocaleString("de-AT", { maximumFractionDigits: 1 })} GB`;
const datum = (iso) => new Date(iso).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" });
const ARTEN = { inhalt: "Österreich", zim: "Bibliothek", karte: "Karten", modell: "KI", kurs: "Kurse", software: "Software" };

// ---------- Paketinhalt ----------
const P = () => installiertesPaket(BASISPAKET);
const D = (name) => inhalt(P(), `inhalt/${name}.json`);
const katalog = () => katalogAusSpeicher()?.katalog ?? null;

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

const kopf = (titel, text, extra = "") => `<div class="page-head"><div><h1 style="font-size:2rem">${titel}</h1><p>${text}</p></div>${extra}</div>`;
const fehlt = () => `${kopf("Kein Österreich-Paket", "Dieses Gerät hat noch kein Paket installiert und ist offline.")}
  <div class="card"><p class="muted">Sobald du online bist, lädt OFFLINE das Österreich-Paket automatisch. Oder du gehst in die Bibliothek und installierst es von Hand.</p><a class="btn btn-primary" href="#bibliothek">Zur Bibliothek</a></div>`;

// ---------- Seiten ----------
const seiten = {
  start() {
    const p = P();
    if (!p) return fehlt();
    const vorsorge = D("vorsorge");
    const laender = D("bundeslaender")?.laender ?? [];
    const erledigt = Object.values(state.checks).filter(Boolean).length;
    const gesamt = vorsorge.gruppen.reduce((s, g) => s + g.punkte.length, 0);
    const installierte = installierteIds().map(installiertesPaket).filter(Boolean);
    const belegt = installierte.reduce((s, x) => s + x.manifest.groesse, 0);
    const k = katalog();
    const updates = k ? verfuegbareUpdates(k).length : 0;
    const land = laender.find((l) => l.name === state.bundesland);
    return `
      ${kopf("Servus.", "Alles hier funktioniert ohne Internet.", `<div class="field" style="margin:0"><label for="bl">Dein Bundesland</label>
          <select id="bl">${laender.map((b) => `<option ${b.name === state.bundesland ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select></div>`)}
      <div class="grid grid-3">
        <a class="card" href="#notfall" style="text-decoration:none;border-color:var(--accent)">
          <span class="tag tag-pro">Notfall</span><h3 style="margin-top:.6rem">Notrufe & Sirenen</h3>
          <p class="muted" style="margin:0">112 · 122 · 133 · 144 und was die Sirenen bedeuten.</p></a>
        <a class="card" href="#vorsorge" style="text-decoration:none">
          <span class="tag">${erledigt} / ${gesamt} erledigt</span><h3 style="margin-top:.6rem">Blackout-Vorsorge</h3>
          <div class="progress"><div style="width:${(erledigt / gesamt) * 100}%"></div></div></a>
        <a class="card" href="#updates" style="text-decoration:none">
          <span class="tag ${updates ? "tag-warn" : state.abo.aktiv ? "tag-ok" : "tag-warn"}">${updates ? `${updates} Update${updates > 1 ? "s" : ""} verfügbar` : state.abo.aktiv ? "Abo aktiv" : "Abo pausiert"}</span>
          <h3 style="margin-top:.6rem">Updates</h3><p class="muted" style="margin:0">${intervallText()} · Paket vom ${datum(p.manifest.erstellt)}</p></a>
      </div>
      ${land ? `<div class="card" style="margin-top:1rem"><strong>${esc(land.name)}</strong> <span class="muted">· Landeshauptstadt ${esc(land.hauptstadt)} · im Krisenfall informiert <strong>${esc(land.orf_radio)}</strong></span></div>` : ""}
      <h2 style="margin-top:2rem">Installiert</h2>
      <div class="card">
        <div class="storage"><strong>${groesse(belegt)}</strong><div class="progress"><div style="width:${Math.min(100, (belegt / 64e9) * 100)}%"></div></div><span class="muted">${desktop ? esc(desktop.datenordner) : "von 64 GB auf „OFFLINE-Stick“"}</span></div>
        <ul class="changelog" style="margin-top:.75rem">${installierte.map((x) =>
          `<li><span class="tag">${esc(ARTEN[x.manifest.art] ?? x.manifest.art)}</span><span>${esc(x.manifest.titel)} <span class="muted">· ${esc(x.manifest.version)} · ${groesse(x.manifest.groesse)} · Signatur geprüft ✓</span></span></li>`).join("")}</ul>
        <a class="btn btn-sm" href="#bibliothek" style="margin-top:.75rem">Pakete verwalten</a>
      </div>`;
  },

  notfall() {
    const n = D("notrufe"), s = D("sirenen");
    if (!n || !s) return fehlt();
    const welle = { konstant: "M2 22 H298", heulend: "M2 22 " + Array.from({ length: 6 }, (_, i) => `Q${27 + i * 50} ${i % 2 ? 42 : 2} ${52 + i * 50} 22`).join(" ") };
    return `
      ${kopf("Notfall", "Tippe auf eine Nummer, um anzurufen.")}
      <div class="grid grid-2">${n.eintraege.map((e) => `
        <div class="card notruf"><a class="notruf-nr ${e.nr.length > 4 ? "long" : ""}" href="tel:${e.nr.replace(/\s/g, "")}">${esc(e.nr)}</a>
          <div><h3>${esc(e.name)}</h3><p>${esc(e.info)}</p></div></div>`).join("")}
      </div>
      <p class="muted" style="margin-top:1rem">${esc(n.hinweis)}</p>
      <h2 style="margin-top:2rem">Sirenensignale</h2>
      <p class="muted">${esc(s.einleitung)}</p>
      <div class="grid grid-3">${s.signale.map((x) => `
        <div class="card siren"><h3>${esc(x.name)} <span class="muted" style="font-weight:500;font-size:.9rem">– ${esc(x.bedeutung)}</span></h3>
          <svg viewBox="0 0 300 44" preserveAspectRatio="none" aria-hidden="true"><path d="${welle[x.muster]}"/></svg>
          <p><strong>${esc(x.dauer)}</strong></p><p class="muted" style="margin:0">${esc(x.tun)}</p></div>`).join("")}
      </div>
      <div class="card" style="margin-top:1rem"><p class="muted" style="margin:0 0 .5rem">${esc(s.probe)}</p><p class="muted" style="margin:0 0 .5rem">${esc(s.feuerwehr)}</p><p class="muted" style="margin:0">${esc(s.warn_app)}</p></div>`;
  },

  vorsorge() {
    const v = D("vorsorge"), b = D("blackout");
    if (!v || !b) return fehlt();
    const gesamt = v.gruppen.reduce((s, g) => s + g.punkte.length, 0);
    const erledigt = Object.values(state.checks).filter(Boolean).length;
    return `
      ${kopf("Blackout-Vorsorge", esc(v.einleitung), `<div style="min-width:220px"><div class="muted" style="font-size:.9rem;margin-bottom:.3rem">${erledigt} von ${gesamt} erledigt</div><div class="progress"><div style="width:${(erledigt / gesamt) * 100}%"></div></div></div>`)}
      <div class="grid grid-2">${v.gruppen.map((g, gi) => `
        <div class="card"><h3>${esc(g.gruppe)}</h3><ul class="check">${g.punkte.map((p, pi) => {
          const id = `${gi}-${pi}`;
          return `<li><label><input type="checkbox" data-check="${id}" ${state.checks[id] ? "checked" : ""}><span>${esc(p)}</span></label></li>`;
        }).join("")}</ul></div>`).join("")}
      </div>
      <h2 style="margin-top:2rem">Wenn der Strom ausfällt</h2>
      <p class="muted">${esc(b.einleitung)}</p>
      <div class="card"><ol class="timeline">${b.ablauf.map((s) => `<li><h3>${esc(s.t)}</h3><p class="muted" style="margin:0">${esc(s.text)}</p></li>`).join("")}</ol></div>
      <div class="card" style="margin-top:1rem;border-color:var(--accent)"><ul style="margin:0;padding-left:1.1rem">${b.merksaetze.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>
      <p class="muted" style="margin-top:1rem;font-size:.9rem">Quellen: ${(P()?.manifest.quellen ?? []).map((q) => `<a href="${esc(q.url)}" rel="noopener">${esc(q.name)}</a>`).join(" · ")}</p>`;
  },

  bibliothek() {
    const k = katalog();
    if (!k) return `${kopf("Bibliothek", "Der Paketkatalog wurde noch nie geladen.")}<div class="card"><p class="muted">Geh einmal online, dann holt OFFLINE den Katalog und merkt ihn sich.</p><button class="btn btn-primary" data-katalog>Katalog laden</button><p class="form-msg" id="bib-msg"></p></div>`;
    const typen = ["Alle", ...new Set(k.pakete.map((p) => ARTEN[p.art] ?? p.art))];
    const liste = k.pakete.filter((p) => state.filter === "Alle" || (ARTEN[p.art] ?? p.art) === state.filter);
    return `
      ${kopf("Bibliothek", `Katalog vom ${datum(k.erstellt)} · Signatur geprüft ✓ · Pakete im Browser sind Textpakete, große kommen in die Desktop-App.`)}
      ${desktop ? `<div class="card" style="margin-bottom:1rem"><h3>Vom USB-Stick oder Ordner einspielen</h3>
        <p class="muted" style="margin:0 0 .75rem">Ohne Internet: Paketordner vom Stick auswählen. Der Kern prüft Signatur und jede Datei, bevor etwas übernommen wird.</p>
        <button class="btn btn-sm btn-primary" data-stick-suchen>Datenträger durchsuchen</button> <button class="btn btn-sm" data-ordner-waehlen>Ordner wählen …</button>
        <div id="stick-funde" style="margin-top:.75rem">${(state.funde ?? []).map((f) => `<div class="switch"><span><strong>${esc(f.titel)}</strong> <span class="muted">${esc(f.version)} · ${groesse(f.groesse)}</span><br><span class="muted mono" style="font-size:.8rem">${esc(f.pfad)}</span></span><button class="btn btn-sm btn-primary" data-stick="${esc(f.pfad)}">Einspielen</button></div>`).join("")}</div></div>` : ""}
      <div class="filters">${typen.map((t) => `<button data-filter="${esc(t)}" aria-pressed="${t === state.filter}">${esc(t)}</button>`).join("")}</div>
      <p class="form-msg" id="bib-msg"></p>
      <div class="grid grid-2">${liste.map((p) => {
        const inst = installiertesPaket(p.id);
        const update = inst && p.status === "verfuegbar" && versionVergleich(p.version, inst.manifest.version) > 0;
        let knopf;
        if (inst) knopf = `${update ? `<button class="btn btn-sm btn-primary" data-install="${p.id}">Aktualisieren</button> ` : ""}<button class="btn btn-sm" data-remove="${p.id}">Entfernen</button>`;
        else if (p.status !== "verfuegbar") knopf = `<span class="tag tag-warn">Geplant</span>`;
        else if (p.pro) knopf = `<button class="btn btn-sm" disabled title="Nur mit Pro">Nur mit Pro</button>`;
        else if (p.art !== "inhalt") knopf = `<span class="tag">Nur in der Desktop-App</span>`;
        else knopf = `<button class="btn btn-sm btn-primary" data-install="${p.id}">Installieren</button>`;
        return `<div class="card pkg">
          <div class="pkg-head"><h3 style="margin:0">${esc(p.titel)}</h3><span>${p.pro ? '<span class="tag tag-pro">Pro</span> ' : ""}${inst ? `<span class="tag tag-ok">${update ? "Update " + esc(p.version) : "Installiert"}</span>` : ""}</span></div>
          <p>${esc(p.beschreibung)}</p>
          <div class="pkg-foot"><span class="muted mono" style="font-size:.85rem">${groesse(p.groesse)}${p.version ? ` · ${esc(p.version)}` : ""}</span><span>${knopf}</span></div></div>`;
      }).join("")}</div>`;
  },

  karte() {
    return `${kopf("Karte Österreich", "Im Prototyp live von basemap.at, in der App als Offline-Datei auf deinem Rechner.")}
      <div id="karte" role="region" aria-label="Karte von Österreich"></div>`;
  },

  ki() {
    return `${kopf("KI-Assistent", "Prototyp: sucht im installierten Österreich-Paket. In der App antwortet ein lokales Sprachmodell.")}
      <div class="card"><div class="chat" id="chat">
        <div class="bubble bot">Servus! Frag mich etwas zu Notrufen, Sirenen oder Blackout-Vorsorge – zum Beispiel „Was bedeutet der Heulton?“ oder „Wie viel Wasser brauche ich?“</div></div>
        <form class="chat-form" id="chat-form"><input type="text" id="frage" placeholder="Deine Frage …" autocomplete="off" aria-label="Frage"><button class="btn btn-primary">Fragen</button></form>
      </div>`;
  },

  notizen() {
    return `${kopf("Notizen", "Bleiben auf diesem Gerät. Markdown ist erlaubt.", '<span class="muted" id="gespeichert"></span>')}
      <textarea id="notizen" rows="18" style="width:100%;resize:vertical" placeholder="z. B. Treffpunkt der Familie, wichtige Nummern, Medikamente …">${esc(state.notizen)}</textarea>`;
  },

  updates() {
    const opt = [["taeglich", "Täglich"], ["woechentlich", "Wöchentlich"], ["monatlich", "Monatlich"], ["manuell", "Manuell"]];
    const ks = katalogAusSpeicher();
    const k = ks?.katalog;
    const updates = k ? verfuegbareUpdates(k) : [];
    const aenderungen = (k?.pakete ?? []).filter((p) => p.aenderungen).sort((a, b) => (a.erstellt < b.erstellt ? 1 : -1));
    const m = state.meldung;
    return `
      ${kopf("Updates & Abo", "Geladen wird nur, wenn du online bist – und nur, was sich geändert hat.", '<button class="btn btn-primary" id="jetzt">Jetzt prüfen</button>')}
      ${state.fortschritt ? `<div class="card" style="margin-bottom:1rem"><div style="display:flex;justify-content:space-between;gap:1rem;align-items:center"><span><strong>Lädt</strong> <span class="muted mono" style="font-size:.85rem">${esc(state.fortschritt.pfad)}</span></span><span class="muted">${groesse(state.fortschritt.geladen)} / ${groesse(state.fortschritt.gesamt)}</span></div>
        <div class="progress" style="margin:.5rem 0"><div style="width:${state.fortschritt.gesamt ? Math.min(100, (100 * state.fortschritt.geladen) / state.fortschritt.gesamt) : 0}%"></div></div>
        ${desktop ? '<button class="btn btn-sm" data-abbrechen>Abbrechen – wird später fortgesetzt</button>' : ""}</div>` : ""}
      <div class="card" id="pruef" style="margin-bottom:1rem">${m ? `<span class="tag ${m.art === "ok" ? "tag-ok" : m.art === "warn" ? "tag-warn" : "tag-pro"}">${esc(m.titel)}</span> ${m.text}` :
        k ? `<span class="muted">Katalog vom ${datum(k.erstellt)}, geladen ${datum(ks.geladen)}, signiert mit Schlüssel <span class="mono">${esc(ks.schluessel)}</span>. ${updates.length ? `<strong>${updates.length} Update${updates.length > 1 ? "s" : ""} verfügbar.</strong>` : "Alle installierten Pakete sind aktuell."}</span>` :
        '<span class="muted">Noch kein Katalog geladen.</span>'}
        ${desktop?.aboStatus !== undefined ? `<div class="muted" style="margin-top:.5rem;font-size:.9rem">Hintergrund-Abo: ${desktop.aboStatus ? esc(desktop.aboStatus) : "fällig – läuft beim nächsten Takt"}</div>` : ""}
        ${updates.map((u) => `<div style="margin-top:.75rem"><strong>${esc(u.eintrag.titel)}</strong> <span class="muted">${esc(u.installiert)} → ${esc(u.eintrag.version)}</span> <button class="btn btn-sm btn-primary" data-install="${u.eintrag.id}" style="margin-left:.5rem">Aktualisieren</button></div>`).join("")}
      </div>
      <div class="grid grid-2">
        <div class="card">
          <div class="field"><span class="legend">Wie oft?</span>
            <div class="seg" role="group" aria-label="Intervall">${opt.map(([kk, n]) => `<button data-intervall="${kk}" aria-pressed="${state.abo.intervall === kk}">${n}</button>`).join("")}</div></div>
          <div class="switch"><span><strong>Update-Abo aktiv</strong><br><span class="muted" style="font-size:.9rem">Pausieren, ohne Einstellungen zu verlieren</span></span><input type="checkbox" data-abo="aktiv" ${state.abo.aktiv ? "checked" : ""}></div>
          <div class="switch"><span><strong>Nur im WLAN</strong><br><span class="muted" style="font-size:.9rem">Kein Download über Handy-Hotspot</span></span><input type="checkbox" data-abo="nurWlan" ${state.abo.nurWlan ? "checked" : ""}></div>
          <div class="switch"><span><strong>Zeitfenster</strong><br><span class="muted" style="font-size:.9rem">z. B. nachts, wenn der Rechner nicht gebraucht wird</span></span><input type="checkbox" data-abo="fenster" ${state.abo.fenster ? "checked" : ""}></div>
          <div style="display:flex;gap:.5rem;align-items:center;${state.abo.fenster ? "" : "opacity:.5"}">
            <input type="time" data-zeit="von" value="${state.abo.von}" aria-label="von"> bis <input type="time" data-zeit="bis" value="${state.abo.bis}" aria-label="bis"></div>
        </div>
        <div class="card">
          <h3>Was ist neu?</h3>
          <ul class="changelog">${aenderungen.length ? aenderungen.map((a) => `<li><span class="muted mono" style="font-size:.85rem">${datum(a.erstellt)}</span><span><strong>${esc(a.titel)}</strong> <span class="muted">${esc(a.version)}</span><br><span class="muted">${esc(a.aenderungen)}</span></span></li>`).join("") : '<li><span class="muted">Noch nichts – Katalog laden.</span></li>'}</ul>
        </div>
      </div>
      ${desktop ? `<div class="card" style="margin-top:1rem"><h3>Speicherort</h3><p class="muted" style="margin:0 0 .5rem">Pakete liegen in <span class="mono" style="font-size:.85rem">${esc(desktop.datenordner)}</span>. Für große Pakete (Wikipedia, Karten) kann das eine externe Platte sein.</p>
        <button class="btn btn-sm" data-speicherort>Ordner wählen …</button> <button class="btn btn-sm" data-speicherort-standard>Standard</button><p class="form-msg" id="ort-msg"></p></div>` : ""}
      ${desktop ? "" : `<div class="card" style="margin-top:1rem"><h3>Werkzeuge</h3>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem">
          <button class="btn btn-sm btn-primary" data-offline-pruefen>Offline-Bereitschaft prüfen</button>
          <button class="btn btn-sm" data-app-installieren>Als App installieren</button>
          <button class="btn btn-sm" data-zuruecksetzen>Alles zurücksetzen</button>
          <button class="btn btn-sm" data-loeschen style="color:var(--accent);border-color:var(--accent)">Restlos löschen &amp; deinstallieren</button>
        </div>
        <p class="muted" style="font-size:.85rem;margin:.6rem 0 0">„Zurücksetzen“ löscht alles und lädt OFFLINE frisch. „Restlos löschen“ entfernt alle Daten und die Offline-Kopie – doppelt gesichert, damit nichts aus Versehen verschwindet.</p>
        <p class="form-msg" id="werkzeug-msg" role="status" aria-live="polite"></p></div>`}
      <p class="muted" style="margin-top:1rem;font-size:.9rem">So läuft ein Update: Katalog laden → Signatur prüfen → Manifest gegen Katalog und Signatur prüfen → nur geänderte Dateien laden → jede Datei gegen ihre Prüfsumme prüfen → erst dann den alten Stand ersetzen. Details: <a href="https://github.com/miksoda-cpu/OFFLINE/blob/claude/optimistic-hypatia-yymcne/docs/PAKETFORMAT.md" rel="noopener">Paketformat</a>.</p>`;
  },
};

function intervallText() {
  return { taeglich: "täglich", woechentlich: "wöchentlich", monatlich: "monatlich", manuell: "manuell" }[state.abo.intervall];
}

// ---------- Update-Vorgang ----------
async function pruefeUpdates({ still = false } = {}) {
  if (!navigator.onLine) { state.meldung = { art: "warn", titel: "Offline", text: "Kein Internet – das Abo prüft beim nächsten Mal, wenn du online bist." }; if (!still) render(); return null; }
  try {
    const { katalog: k, veraltet, schluessel } = await ladeKatalog();
    const updates = verfuegbareUpdates(k);
    state.meldung = veraltet
      ? { art: "warn", titel: "Katalog veraltet", text: "Der Katalog ist abgelaufen. Installierte Inhalte funktionieren weiter." }
      : { art: "ok", titel: "Geprüft", text: `Katalog signiert mit <span class="mono">${esc(schluessel)}</span>. ${updates.length ? `${updates.length} Update${updates.length > 1 ? "s" : ""} verfügbar.` : `Alle Pakete aktuell. Nächste Prüfung: ${intervallText()}.`}` };
    return k;
  } catch (e) {
    state.meldung = { art: "fehler", titel: "Abgelehnt", text: esc(e.message) };
    return null;
  } finally { if (!still) render(); }
}

async function installiereMitMeldung(id, ziel) {
  const k = katalog() ?? (await pruefeUpdates({ still: true }));
  const eintrag = k?.pakete.find((p) => p.id === id);
  if (!eintrag) { zeige(ziel, "Paket nicht im Katalog.", "err"); return; }
  const alt = installiertesPaket(id);
  zeige(ziel, `Lade ${esc(eintrag.titel)} …`, "");
  try {
    const { paket, delta: d, geladen } = await installiere(k, eintrag, (f) => {
      state.fortschritt = f;
      const bar = document.querySelector(".progress-dl");
      if (location.hash === "#updates") render();
    });
    state.fortschritt = null;
    const text = alt
      ? `${esc(paket.manifest.titel)} auf ${esc(paket.manifest.version)} aktualisiert – ${groesse(geladen)} geladen (${d.laden.length} von ${paket.manifest.dateien.length} Dateien), Signatur und Prüfsummen geprüft.`
      : `${esc(paket.manifest.titel)} ${esc(paket.manifest.version)} installiert – ${groesse(geladen)}, Signatur und Prüfsummen geprüft.`;
    state.meldung = { art: "ok", titel: alt ? "Aktualisiert" : "Installiert", text };
    render();
    zeige(ziel, text, "ok");
  } catch (e) {
    state.fortschritt = null;
    zeige(ziel, "Abgelehnt: " + esc(String(e?.message ?? e)), "err");
    if (location.hash === "#updates") { state.meldung = { art: "fehler", titel: "Abgelehnt", text: esc(String(e?.message ?? e)) }; render(); }
  }
}

async function einspielenVonOrdner(pfad) {
  zeige("bib-msg", `Prüfe und spiele ein: ${esc(pfad)} …`, "");
  try {
    const e = await client.einspielenOrdner(pfad);
    state.meldung = { art: "ok", titel: "Eingespielt", text: `${esc(e.id)} ${esc(e.version)}${e.ersetzt ? ` (ersetzt ${esc(e.ersetzt)})` : ""} – ${groesse(e.kopiert_bytes)} kopiert, Signatur und Prüfsummen geprüft.` };
    render();
    zeige("bib-msg", state.meldung.text, "ok");
  } catch (err) {
    zeige("bib-msg", "Abgelehnt: " + esc(String(err?.message ?? err)), "err");
  }
}

async function speicherortSetzen(pfad) {
  try {
    desktop.datenordner = await client.speicherortSetzen(pfad);
    state.meldung = { art: "ok", titel: "Speicherort", text: `Pakete liegen ab jetzt in ${esc(desktop.datenordner)}. Bereits installierte Pakete bleiben am alten Ort.` };
    render();
  } catch (e) { zeige("ort-msg", "Abgelehnt: " + esc(String(e?.message ?? e)), "err"); }
}

async function updatesJetztDesktop() {
  try {
    const erg = await client.updatesJetzt();
    const k = katalogAusSpeicher()?.katalog;
    state.meldung = erg.fehler.length
      ? { art: "warn", titel: "Teilweise", text: `${erg.aktualisiert.length} aktualisiert. Fehler: ${esc(erg.fehler.join("; "))}` }
      : { art: "ok", titel: "Geprüft", text: erg.aktualisiert.length ? `Aktualisiert: ${erg.aktualisiert.map((x) => `${esc(x.id)} ${esc(x.version)} (${groesse(x.kopiert_bytes)} geladen)`).join(", ")}` : `Alle Pakete aktuell.${k ? "" : ""} Nächste Prüfung: ${intervallText()}.` };
    if (!k) await ladeKatalog().catch(() => {});
  } catch (e) {
    state.meldung = { art: "fehler", titel: "Abgelehnt", text: esc(String(e?.message ?? e)) };
  }
  render();
}

// ---------- Werkzeuge (Browser) ----------
const HUELLE = ["/app.html", "/app.js", "/styles.css", "/paket-kern.js", "/paket-client.js", "/schluessel/oeffentlich.json", "/icon.svg", "/manifest.webmanifest"];
let installAufforderung = null;
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installAufforderung = e; });

async function offlinePruefen() {
  zeige("werkzeug-msg", "Prüfe …", "");
  const fehlt = [];
  if (!("caches" in window)) { zeige("werkzeug-msg", "Dieser Browser kann die App nicht offline speichern.", "err"); return; }
  const sw = await navigator.serviceWorker?.getRegistration();
  if (!sw) fehlt.push("Offline-Dienst (Service Worker) nicht aktiv – Seite einmal neu laden");
  for (const u of HUELLE) if (!(await caches.match(u, { ignoreSearch: true }))) fehlt.push(u);
  const paket = P();
  if (!paket) fehlt.push("Österreich-Paket nicht installiert");
  if (fehlt.length) {
    zeige("werkzeug-msg", `Noch nicht bereit. Es fehlt: ${fehlt.map(esc).join(", ")}. Tipp: Seite neu laden, kurz warten, noch einmal prüfen.`, "err");
  } else {
    zeige("werkzeug-msg", `Bereit für den Offline-Betrieb: App (${HUELLE.length} Dateien) und ${esc(paket.manifest.titel)} ${esc(paket.manifest.version)} sind auf diesem Gerät gespeichert. Du kannst das Internet abschalten – Notfall, Vorsorge, Bibliothek und Notizen bleiben da. Nur die Karte braucht im Prototyp noch Netz.`, "ok");
  }
}

async function appInstallieren() {
  if (matchMedia("(display-mode: standalone)").matches) { zeige("werkzeug-msg", "OFFLINE läuft bereits als App.", "ok"); return; }
  if (installAufforderung) {
    installAufforderung.prompt();
    const { outcome } = await installAufforderung.userChoice;
    installAufforderung = null;
    zeige("werkzeug-msg", outcome === "accepted" ? "Installiert – OFFLINE erscheint jetzt wie ein Programm." : "Abgebrochen. Du kannst es jederzeit wieder versuchen.", outcome === "accepted" ? "ok" : "err");
    return;
  }
  const safari = /safari/i.test(navigator.userAgent) && !/chrome|chromium|crios/i.test(navigator.userAgent);
  zeige("werkzeug-msg", safari
    ? "In Safari: Menü „Ablage“ → „Zum Dock hinzufügen“ (Mac) oder Teilen-Symbol → „Zum Home-Bildschirm“ (iPhone/iPad)."
    : "Chrome: Menü (⋮) → „OFFLINE installieren“ – oder das kleine Installieren-Symbol rechts in der Adressleiste.", "");
}

async function zuruecksetzen() {
  if (!confirm("Alle Pakete, Einstellungen, Notizen und die Checkliste auf diesem Gerät löschen und OFFLINE frisch laden?")) return;
  await allesEntfernen();
  location.href = "/app.html#start";
  location.reload();
}

async function allesEntfernen() {
  try { localStorage.clear(); sessionStorage.clear(); } catch { /* egal */ }
  if ("caches" in window) for (const k of await caches.keys()) await caches.delete(k);
  const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
  for (const r of regs) await r.unregister();
  if (indexedDB?.databases) for (const db of await indexedDB.databases()) if (db.name) indexedDB.deleteDatabase(db.name);
}

async function restlosLoeschen() {
  // Sicherung 1: Wort eintippen. Sicherung 2: nochmals bestätigen.
  const wort = prompt("Das entfernt OFFLINE mit allen Paketen, Notizen und Einstellungen von diesem Gerät.\n\nZur Sicherheit bitte LÖSCHEN eintippen:");
  if (wort === null) return;
  if (wort.trim().toUpperCase() !== "LÖSCHEN") { zeige("werkzeug-msg", "Nicht gelöscht – das Wort stimmte nicht.", "err"); return; }
  if (!confirm("Wirklich alles restlos löschen? Das lässt sich nicht rückgängig machen.")) { zeige("werkzeug-msg", "Abgebrochen – nichts gelöscht.", ""); return; }
  await allesEntfernen();
  const mac = /Mac/.test(navigator.platform);
  document.body.innerHTML = `<div class="wrap" style="padding:3rem 16px;max-width:40rem">
    <a class="brand" href="/"><span class="brand-flag" aria-hidden="true"></span>OFFLINE</a>
    <h1 style="font-size:1.8rem;margin-top:1.5rem">Alles gelöscht.</h1>
    <p class="muted">Pakete, Notizen, Checkliste, Einstellungen und die Offline-Kopie der App sind von diesem Gerät entfernt.</p>
    <div class="card"><h3>Letzter Schritt: das App-Symbol entfernen</h3>
      <p class="muted" style="margin:0">Falls du OFFLINE als App installiert hattest, ist noch das Symbol da. Es geht nur von Hand:</p>
      <ul class="muted" style="padding-left:1.1rem;margin:.5rem 0 0">
        <li><strong>Chrome:</strong> In der App oben rechts das Menü (⋮) → „OFFLINE deinstallieren“. Oder <span class="mono">chrome://apps</span> aufrufen, Rechtsklick auf OFFLINE → „Aus Chrome entfernen“.</li>
        <li><strong>${mac ? "Mac" : "Windows"}:</strong> ${mac ? "Im Ordner „Programme“ (bzw. Programme → Chrome-Apps) OFFLINE in den Papierkorb ziehen." : "Einstellungen → Apps → OFFLINE → Deinstallieren."}</li>
        <li><strong>Safari:</strong> Das Symbol im Dock rechtsklicken → „Aus dem Dock entfernen“, dann im Ordner „Programme“ löschen.</li>
      </ul></div>
    <p style="margin-top:1.5rem"><a class="btn" href="/">Zur Startseite</a></p></div>`;
}

function zeige(id, html, art) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = html;
  el.className = "form-msg " + art;
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

// ---------- KI (Prototyp: Stichwortsuche im Paket) ----------
function antworte(frage) {
  const f = frage.toLowerCase();
  const n = D("notrufe"), s = D("sirenen"), v = D("vorsorge"), b = D("blackout");
  if (!n) return "Kein Österreich-Paket installiert.";
  const treffer = [];
  for (const e of n.eintraege) if (f.includes(e.nr) || f.includes(e.name.toLowerCase().split(" ")[0])) treffer.push(`<strong>${e.nr} – ${e.name}:</strong> ${e.info}`);
  for (const x of s.signale) if (f.includes(x.name.toLowerCase()) || (f.includes("heul") && x.muster === "heulend") || (f.includes("sirene") && !treffer.length)) treffer.push(`<strong>${x.name}</strong> (${x.dauer}): ${x.tun}`);
  if (/wasser|trink/.test(f)) treffer.push(v.gruppen[0].punkte[0] + ". Dazu Wasser für die WC-Spülung.");
  if (/blackout|strom/.test(f)) b.ablauf.slice(0, 2).forEach((x) => treffer.push(`<strong>${x.t}:</strong> ${x.text}`));
  if (/geld|bargeld|bankomat/.test(f)) treffer.push(v.gruppen[3].punkte[0] + ".");
  if (/rettung|arzt|krank|verletzt/.test(f) && !treffer.length) treffer.push("<strong>144 – Rettung</strong> im Notfall, <strong>141</strong> für den Ärztenotdienst, <strong>1450</strong> für Beratung.");
  return treffer.length
    ? [...new Set(treffer)].slice(0, 4).map(esc).map((t) => t.replace(/&lt;(\/?)strong&gt;/g, "<$1strong>")).join("<br><br>") + `<br><br><span class="muted" style="font-size:.85rem">Quelle: ${esc(P().manifest.titel)} ${esc(P().manifest.version)}</span>`
    : "Dazu finde ich im Österreich-Paket nichts. Mit installierter Wikipedia und dem KI-Modell kann ich in der App mehr beantworten.";
}

// ---------- Rendern & Ereignisse ----------
const main = document.getElementById("main");
const sidebar = document.getElementById("sidebar");
const menu = document.getElementById("menu");

function render() {
  const route = location.hash.slice(1) || "start";
  if (desktop && route === "updates") client.aboStatus().then((st) => { if (st !== desktop.aboStatus) { desktop.aboStatus = st; render(); } }).catch(() => {});
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
  if (t.dataset.check) { state.checks[t.dataset.check] = t.checked; speicher.set("checks", state.checks); render(); }
  if (t.dataset.abo) { state.abo[t.dataset.abo] = t.checked; aboSpeichern(); render(); }
  if (t.dataset.zeit) { state.abo[t.dataset.zeit] = t.value; aboSpeichern(); }
  if (t.id === "bl") { state.bundesland = t.value; speicher.set("bundesland", t.value); render(); }
});

main.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.filter) { state.filter = b.dataset.filter; render(); }
  if (b.dataset.install) installiereMitMeldung(b.dataset.install, "bib-msg");
  if (b.dataset.remove) Promise.resolve(entferne(b.dataset.remove)).then(render);
  if (b.hasAttribute("data-stick-suchen")) client.stickSuchen().then((f) => { state.funde = f; render(); if (!f.length) zeige("bib-msg", "Kein signiertes Paket auf einem Datenträger gefunden.", "err"); });
  if (b.hasAttribute("data-ordner-waehlen")) client.ordnerWaehlen().then((p) => p && einspielenVonOrdner(p));
  if (b.dataset.stick) einspielenVonOrdner(b.dataset.stick);
  if (b.dataset.intervall) { state.abo.intervall = b.dataset.intervall; aboSpeichern(); render(); }
  if (b.hasAttribute("data-katalog")) pruefeUpdates();
  if (b.id === "jetzt") { b.disabled = true; b.textContent = "Prüfe …"; desktop ? updatesJetztDesktop() : pruefeUpdates(); }
  if (b.hasAttribute("data-abbrechen")) client.abbrechen();
  if (b.hasAttribute("data-offline-pruefen")) offlinePruefen();
  if (b.hasAttribute("data-app-installieren")) appInstallieren();
  if (b.hasAttribute("data-zuruecksetzen")) zuruecksetzen();
  if (b.hasAttribute("data-loeschen")) restlosLoeschen();
  if (b.hasAttribute("data-speicherort")) client.ordnerWaehlen("Ordner für Pakete wählen (z. B. externe Platte)").then((p) => p && speicherortSetzen(p));
  if (b.hasAttribute("data-speicherort-standard")) speicherortSetzen(null);
});

main.addEventListener("submit", (e) => {
  if (e.target.id !== "chat-form") return;
  e.preventDefault();
  const input = document.getElementById("frage");
  const frage = input.value.trim();
  if (!frage) return;
  document.getElementById("chat").insertAdjacentHTML("beforeend", `<div class="bubble user">${esc(frage)}</div><div class="bubble bot">${antworte(frage)}</div>`);
  input.value = "";
});

main.addEventListener("input", (e) => {
  if (e.target.id !== "notizen") return;
  state.notizen = e.target.value;
  speicher.set("notizen", state.notizen);
  document.getElementById("gespeichert").textContent = "Gespeichert";
});

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

// Erster Start: Österreich-Paket automatisch holen, wenn noch keins da ist. Danach still nach Updates sehen.
(async () => {
  if (!P()) {
    if (!navigator.onLine) return;
    try {
      const { katalog: k } = await ladeKatalog();
      const e = k.pakete.find((p) => p.id === BASISPAKET && p.status === "verfuegbar");
      if (e) { await installiere(k, e); render(); }
    } catch (err) { console.error("Erstinstallation", err); }
  } else if (navigator.onLine && state.abo.aktiv) {
    await pruefeUpdates({ still: true });
    if (katalog() && verfuegbareUpdates(katalog()).length) render();
  }
})();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
