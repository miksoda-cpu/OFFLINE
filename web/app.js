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

function notizbuchLaden() {
  const liste = speicher.get("notizbuch", null);
  if (Array.isArray(liste)) return liste;
  // Übernahme aus dem alten Prototyp: ein einzelnes Textfeld wird die erste Notiz
  const alt = speicher.get("notizen", "");
  const start = alt ? [{ id: Date.now().toString(36), titel: "Meine Notizen", text: alt, geaendert: new Date().toISOString() }] : [];
  speicher.set("notizbuch", start);
  return start;
}
const notizId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const state = {
  checks: speicher.get("checks", {}),
  abo: speicher.get("abo", { intervall: "woechentlich", nurWlan: true, fenster: true, von: "02:00", bis: "05:00", aktiv: true }),
  fortschritt: null, // { pfad, geladen, gesamt } während eines Downloads
  lesen: null, // { url, titel } – Leseansicht für kiwix-serve
  tresor: { status: null, notizen: [], aktiv: null, suche: "", code: null, codeGruppen: null, vorschau: null, msg: "", einstellungen: false, sperreMin: 5 },
  download: null, // Seitenleiste: { id, titel, status: laedt|unterbrochen|kaputt|fertig, geladen, gesamt, text }
  bundesland: speicher.get("bundesland", "Wien"),
  notizbuch: notizbuchLaden(), // offene Notizen: [{ id, titel, text, geaendert }]
  notizAktiv: null, notizSuche: "",
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
  tresor: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  updates: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
};
const ROUTEN = [
  ["start", "Übersicht"], ["notfall", "Notfall"], ["vorsorge", "Vorsorge"], ["bibliothek", "Bibliothek"],
  ["karte", "Karte"], ["ki", "KI-Assistent"], ["notizen", "Notizen"], ["tresor", "Tresor"], ["updates", "Updates & Abo"],
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

  tresor() {
    const t = state.tresor;
    const hinweis = `<p class="muted" style="margin:.5rem 0 0">Nur du kennst dieses Passwort. Wir können es nicht zurücksetzen, weil wir keinen Zugang zu deinem Tresor haben. Wenn du Passwort <em>und</em> Wiederherstellungscode verlierst, kann niemand den Inhalt wiederherstellen, auch wir nicht.</p>`;
    if (!desktop) return `${kopf("Tresor", "Verschlüsselter Bereich für Notfallmappe, Passwörter, PINs und Ausweisscans.")}
      <div class="card"><p>Der Tresor gibt es nur in der <strong>Desktop-App</strong>: Die Verschlüsselung läuft dort im Rust-Kern, der Schlüssel liegt nie im Browser. Im Web-Prototyp bleibt er deshalb aus.</p><a class="btn btn-primary" href="/#download">Desktop-App holen</a></div>`;
    if (t.status === null) return `${kopf("Tresor", "Einen Moment …")}`;
    const msg = `<p class="form-msg ${t.msgArt ?? ""}" id="tresor-msg">${t.msg ?? ""}</p>`;

    if (t.status === "kein") return `${kopf("Tresor", "Verschlüsselter Bereich für Notfallmappe, Passwörter, PINs und Ausweisscans. Verlässt das Gerät nie unverschlüsselt – wir haben keinen Schlüssel.")}
      <div class="tresor"><div class="card" style="grid-column:1 / -1;max-width:560px">
        <h3>Tresor anlegen</h3>
        <label>Passwort (mindestens 8 Zeichen, nicht dasselbe wie für das Gerät)<br><input type="password" id="tresor-pw1" autocomplete="new-password"></label>
        <label style="display:block;margin-top:.6rem">Noch einmal<br><input type="password" id="tresor-pw2" autocomplete="new-password"></label>
        ${hinweis}
        <div style="margin-top:1rem"><button class="btn btn-primary" data-tresor-anlegen>Tresor anlegen</button></div>${msg}
      </div></div>`;

    if (t.status === "code") return `${kopf("Tresor", "Dein Wiederherstellungscode – er wird nur jetzt angezeigt.")}
      <div class="tresor"><div class="card" style="grid-column:1 / -1;max-width:640px">
        <div class="warnkasten"><strong>Druck diesen Code aus oder schreib ihn ab</strong> und leg ihn an einen sicheren Ort, getrennt vom Gerät. Mit ihm kommst du in den Tresor, wenn du das Passwort vergisst. Er wird nur jetzt angezeigt.</div>
        <div class="code-anzeige">${esc(t.code)}</div>
        <p class="muted">Zur Sicherheit: Trag vier der sechs Gruppen ein, damit wir wissen, dass du ihn hast.</p>
        <div class="code-gruppen">${t.code.split("-").map((g, i) => t.codeGruppen.includes(i) ? `<input type="text" data-code-gruppe="${i}" maxlength="5" autocomplete="off" spellcheck="false">` : `<span>${esc(g)}</span>`).join('<span class="muted">–</span>')}</div>
        <div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-primary" data-tresor-code-ok>Ich habe den Code gesichert</button><button class="btn" data-tresor-code-kopieren>Kopieren (30 s)</button></div>${msg}
      </div></div>`;

    if (t.status === "gesperrt") return `${kopf("Tresor", "Gesperrt.", '<span class="tag">Gesperrt</span>')}
      <div class="tresor"><div class="card" style="grid-column:1 / -1;max-width:560px">
        <label>Passwort<br><input type="password" id="tresor-pw" autocomplete="current-password"></label>
        <div style="margin-top:.8rem;display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-primary" data-tresor-oeffnen>Öffnen</button><button class="btn" data-tresor-code-modus>${t.codeModus ? "Doch mit Passwort" : "Mit Wiederherstellungscode"}</button></div>
        ${t.codeModus ? `<label style="display:block;margin-top:1rem">Wiederherstellungscode (6 Gruppen)<br><input type="text" id="tresor-code" autocomplete="off" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"></label><div style="margin-top:.6rem"><button class="btn btn-primary" data-tresor-oeffnen-code>Mit Code öffnen</button> <span class="muted">Danach gleich ein neues Passwort setzen.</span></div>` : ""}
        ${msg}
        <details style="margin-top:1.2rem"><summary class="muted">Sicherung zurückspielen</summary><p class="muted">Ersetzt den Tresor auf diesem Gerät durch eine Sicherung (Ordner „OFFLINE-Tresor-Sicherung“ vom Stick). Das Passwort der Sicherung gilt dann.</p><button class="btn btn-sm" data-tresor-zurueckspielen>Sicherung wählen …</button></details>
      </div></div>`;

    // offen
    const q = t.suche.trim().toLowerCase();
    const liste = t.notizen.filter((n) => !q || n.titel.toLowerCase().includes(q) || n.text.toLowerCase().includes(q));
    const n = t.notizen.find((x) => x.id === t.aktiv) ?? null;
    const v = t.vorschau;
    return `${kopf("Tresor", `Offen · sperrt nach ${t.sperreMin} Min. ohne Eingabe, beim Minimieren und beim Beenden.`, '<span style="display:flex;gap:.5rem"><button class="btn btn-sm" data-tresor-einstellungen>Einstellungen</button><button class="btn btn-sm btn-primary" data-tresor-sperren>Sperren</button></span>')}
      ${t.einstellungen ? `<div class="card" style="margin-bottom:1rem"><h3>Einstellungen</h3>
        <div class="grid grid-3">
          <div><label>Automatisch sperren nach<br><select id="tresor-sperre"><option value="1" ${t.sperreMin == 1 ? "selected" : ""}>1 Minute</option><option value="5" ${t.sperreMin == 5 ? "selected" : ""}>5 Minuten</option><option value="15" ${t.sperreMin == 15 ? "selected" : ""}>15 Minuten</option></select></label></div>
          <div><label>Passwort ändern<br><input type="password" id="tresor-alt" placeholder="bisheriges" autocomplete="current-password"></label><input type="password" id="tresor-neu" placeholder="neues (min. 8)" autocomplete="new-password" style="margin-top:.4rem"><button class="btn btn-sm" data-tresor-pw-aendern style="margin-top:.4rem">Ändern</button></div>
          <div><label>Neuer Wiederherstellungscode<br><input type="password" id="tresor-pw-code" placeholder="Passwort zur Bestätigung"></label><button class="btn btn-sm" data-tresor-code-neu style="margin-top:.4rem">Code erneuern</button><p class="muted" style="margin:.3rem 0 0;font-size:.85rem">Der alte Code gilt danach nicht mehr.</p></div>
        </div>
        <div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-sm" data-tresor-sichern>Sicherung auf Stick oder Ordner …</button><span class="muted" style="align-self:center">Nur Verschlüsseltes wird kopiert.</span></div>${msg}</div>` : ""}
      <div class="tresor">
        <div class="card">
          <input type="text" id="tresor-suche" placeholder="Suchen …" value="${esc(t.suche)}" autocomplete="off">
          <div style="display:flex;gap:.4rem;margin:.6rem 0;flex-wrap:wrap"><button class="btn btn-sm btn-primary" data-tresor-neu>Neue Notiz</button><button class="btn btn-sm" data-tresor-mappe title="Zehn Abschnitte: Personen, Nummern, Treffpunkte, Dokumente, Versicherungen, Geld, Zugänge, Haus, Tiere, Radio">Notfallmappe anlegen</button></div>
          <div class="tresor-liste">${liste.length ? liste.map((x) => `<button data-tresor-notiz="${esc(x.id)}" aria-current="${x.id === t.aktiv}">${x.reihe ? `${x.reihe}. ` : ""}${esc(x.titel || "Ohne Titel")}<span class="muted">${x.anhaenge.length ? `${x.anhaenge.length} Anhang${x.anhaenge.length > 1 ? "e" : ""} · ` : ""}${datum(x.geaendert)}</span></button>`).join("") : `<p class="muted" style="padding:.5rem .7rem">${t.notizen.length ? "Nichts gefunden." : "Noch leer. Leg die Notfallmappe an oder eine neue Notiz."}</p>`}</div>
        </div>
        <div class="card">${n ? `
          <input type="text" class="titel" id="tresor-titel" value="${esc(n.titel)}" placeholder="Titel" autocomplete="off">
          <textarea id="tresor-text" placeholder="Inhalt – bleibt verschlüsselt auf diesem Gerät" style="margin-top:.6rem">${esc(n.text)}</textarea>
          <div style="display:flex;justify-content:space-between;gap:.5rem;margin-top:.6rem;flex-wrap:wrap"><span class="muted" id="tresor-gespeichert">Geändert ${datum(n.geaendert)}</span><span><button class="btn btn-sm" data-tresor-anhang>Anhang hinzufügen …</button> <button class="btn btn-sm" data-tresor-notiz-loeschen="${esc(n.id)}">Notiz löschen</button></span></div>
          ${n.anhaenge.length ? `<div style="margin-top:.8rem"><strong>Anhänge</strong>${n.anhaenge.map((a) => `<div class="anhang"><span>${esc(a.name)}</span><span class="muted mono" style="font-size:.8rem">${groesse(a.groesse)}</span><span style="margin-left:auto"><button class="btn btn-sm" data-tresor-anzeigen="${esc(a.id)}">${v?.id === a.id ? "Ausblenden" : "Anzeigen"}</button> <button class="btn btn-sm" data-tresor-anhang-loeschen="${esc(a.id)}">Löschen</button></span></div>`).join("")}</div>` : ""}
          ${v && n.anhaenge.some((a) => a.id === v.id) ? `<div class="anhang-vorschau" style="margin-top:.8rem">${v.typ.startsWith("image/") ? `<img src="${v.url}" alt="${esc(v.name)}">` : v.typ === "application/pdf" ? `<iframe src="${v.url}" title="${esc(v.name)}"></iframe>` : `<pre style="white-space:pre-wrap">${esc(v.text ?? "")}</pre>`}</div>` : ""}
          ${t.einstellungen ? "" : msg}` : `<p class="muted">Links eine Notiz wählen oder eine neue anlegen.</p>${t.einstellungen ? "" : msg}`}
        </div>
      </div>`;
  },

  lesen() {
    const l = state.lesen;
    if (!l) return `${kopf("Lesen", "Nichts geöffnet.")}<div class="card"><a class="btn btn-primary" href="#bibliothek">Zur Bibliothek</a></div>`;
    return `<div class="lesen-kopf"><a class="btn btn-sm" href="#bibliothek">‹ Bibliothek</a><strong>${esc(l.titel)}</strong>
        <span style="margin-left:auto;display:flex;gap:.4rem"><button class="btn btn-sm" data-lesen-zurueck title="Eine Seite zurück">‹</button><button class="btn btn-sm" data-lesen-start title="Zur Startseite der Bibliothek">Start</button><button class="btn btn-sm" data-lesen-fenster>In eigenem Fenster</button></span></div>
      <iframe id="lesen-rahmen" class="lesen-rahmen" src="${esc(l.url)}" title="${esc(l.titel)}"></iframe>`;
  },

  bibliothek() {
    const k = katalog();
    if (!k) return `${kopf("Bibliothek", "Der Paketkatalog wurde noch nie geladen.")}<div class="card"><p class="muted">Geh einmal online, dann holt OFFLINE den Katalog und merkt ihn sich.</p><button class="btn btn-primary" data-katalog>Katalog laden</button><p class="form-msg" id="bib-msg"></p></div>`;
    const typen = ["Alle", ...new Set(k.pakete.map((p) => ARTEN[p.art] ?? p.art))];
    const liste = k.pakete.filter((p) => state.filter === "Alle" || (ARTEN[p.art] ?? p.art) === state.filter);
    return `
      ${kopf("Bibliothek", `Katalog vom ${datum(k.erstellt)} · Signatur geprüft ✓${desktop ? "" : " · Pakete im Browser sind Textpakete, große kommen in die Desktop-App."}`)}
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
        if (inst) knopf = `${update ? `<button class="btn btn-sm btn-primary" data-install="${p.id}">Aktualisieren</button> ` : ""}${desktop && p.art === "zim" ? `<button class="btn btn-sm btn-primary" data-oeffnen-zim="${p.id}">Öffnen</button> ` : ""}${desktop && p.art === "karte" ? `<a class="btn btn-sm btn-primary" href="#karte">Karte öffnen</a> ` : ""}<button class="btn btn-sm" data-remove="${p.id}">Entfernen</button>`;
        else if (p.status !== "verfuegbar") knopf = `<span class="tag tag-warn">Geplant</span>`;
        else if (p.pro) knopf = `<button class="btn btn-sm" disabled title="Nur mit Pro">Nur mit Pro</button>`;
        else if (!desktop && p.art !== "inhalt") knopf = `<span class="tag">Nur in der Desktop-App</span>`;
        else knopf = `<button class="btn btn-sm btn-primary" data-install="${p.id}">Installieren</button>`;
        return `<div class="card pkg">
          <div class="pkg-head"><h3 style="margin:0">${esc(p.titel)}</h3><span>${p.pro ? '<span class="tag tag-pro">Pro</span> ' : ""}${inst ? `<span class="tag tag-ok">${update ? "Update " + esc(p.version) : "Installiert"}</span>` : ""}</span></div>
          <p>${esc(p.beschreibung)}</p>
          <div class="pkg-foot"><span class="muted mono" style="font-size:.85rem">${groesse(p.groesse)}${p.version ? ` · ${esc(p.version)}` : ""}</span><span>${knopf}</span></div></div>`;
      }).join("")}</div>`;
  },

  karte() {
    const kp = kartenPaket();
    return `${kopf("Karte Österreich", kp ? `Offline aus ${esc(kp.manifest.titel)} ${esc(kp.manifest.version)} – kein Internet nötig.` : desktop ? "Noch kein Kartenpaket installiert – solange online von basemap.at. Kartenpaket: Bibliothek → Karten." : "Im Prototyp live von basemap.at, in der App als Offline-Datei auf deinem Rechner.")}
      <div id="karte" role="region" aria-label="Karte von Österreich"></div>
      <p class="form-msg" id="karte-msg"></p>`;
  },

  ki() {
    return `${kopf("KI-Assistent", "Prototyp: sucht im installierten Österreich-Paket. In der App antwortet ein lokales Sprachmodell.")}
      <div class="card"><div class="chat" id="chat">
        <div class="bubble bot">Servus! Frag mich etwas zu Notrufen, Sirenen oder Blackout-Vorsorge – zum Beispiel „Was bedeutet der Heulton?“ oder „Wie viel Wasser brauche ich?“</div></div>
        <form class="chat-form" id="chat-form"><input type="text" id="frage" placeholder="Deine Frage …" autocomplete="off" aria-label="Frage"><button class="btn btn-primary">Fragen</button></form>
      </div>`;
  },

  notizen() {
    const q = state.notizSuche.trim().toLowerCase();
    const alle = [...state.notizbuch].sort((a, b) => (a.geaendert < b.geaendert ? 1 : -1));
    const liste = alle.filter((n) => !q || n.titel.toLowerCase().includes(q) || n.text.toLowerCase().includes(q));
    const n = state.notizbuch.find((x) => x.id === state.notizAktiv) ?? null;
    return `${kopf("Notizen", "Bleiben auf diesem Gerät, unverschlüsselt. Passwörter, PINs und Ausweise gehören in den <a href=\"#tresor\">Tresor</a>.", '<button class="btn btn-primary" data-notiz-neu>Neue Notiz</button>')}
      <div class="notizbuch">
        <div class="card">
          <input type="text" id="notiz-suche" placeholder="Suchen …" value="${esc(state.notizSuche)}" autocomplete="off">
          <div class="tresor-liste" style="margin-top:.6rem">${liste.length ? liste.map((x) => `<button data-notiz="${esc(x.id)}" aria-current="${x.id === state.notizAktiv}">${esc(x.titel || "Ohne Titel")}<span class="muted">${esc(x.text.split("\n")[0].slice(0, 40))}${x.text.length > 40 ? " …" : ""}<br>${datum(x.geaendert)}</span></button>`).join("") : `<p class="muted" style="padding:.5rem .7rem">${state.notizbuch.length ? "Nichts gefunden." : "Noch keine Notiz. Oben rechts „Neue Notiz“."}</p>`}</div>
        </div>
        <div class="card">${n ? `
          <input type="text" class="titel" id="notiz-titel" value="${esc(n.titel)}" placeholder="Titel" autocomplete="off">
          <textarea id="notiz-text" placeholder="z. B. Treffpunkt der Familie, Einkaufsliste für den Vorrat, Medikamente …" style="margin-top:.6rem">${esc(n.text)}</textarea>
          <div style="display:flex;justify-content:space-between;gap:.5rem;margin-top:.6rem;flex-wrap:wrap"><span class="muted" id="notiz-gespeichert">Geändert ${datum(n.geaendert)}</span><span>${desktop ? `<button class="btn btn-sm" data-notiz-in-tresor="${esc(n.id)}" title="Verschlüsselt in den Tresor verschieben (Tresor muss offen sein)">In den Tresor</button> ` : ""}<button class="btn btn-sm" data-notiz-loeschen="${esc(n.id)}">Löschen</button></span></div>` : `<p class="muted">Links eine Notiz wählen oder oben „Neue Notiz“.</p>`}</div>
      </div>`;
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
      ${desktop ? appUpdateKarte() : ""}
      ${desktop ? `<div class="card" style="margin-top:1rem"><h3>Speicherort</h3><p class="muted" style="margin:0 0 .5rem">Pakete liegen in <span class="mono" style="font-size:.85rem">${esc(desktop.datenordner)}</span>. Für große Pakete (Wikipedia, Karten) kann das eine externe Platte sein.</p>
        <button class="btn btn-sm" data-speicherort>Ordner wählen …</button> <button class="btn btn-sm" data-speicherort-standard>Standard</button><p class="form-msg" id="ort-msg"></p></div>` : ""}
      <div class="card" style="margin-top:1rem"><h3>Werkzeuge</h3>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem">
          ${desktop ? "" : `<button class="btn btn-sm btn-primary" data-offline-pruefen>Offline-Bereitschaft prüfen</button>
          <button class="btn btn-sm" data-app-installieren>Als App installieren</button>
          <button class="btn btn-sm" data-zuruecksetzen>Alles zurücksetzen</button>`}
          <button class="btn btn-sm" data-loeschen style="color:var(--accent);border-color:var(--accent)">Restlos löschen &amp; deinstallieren</button>
        </div>
        ${state.loeschenOffen ? `<div class="card" style="margin-top:.75rem;border-color:var(--accent)"><strong>Wirklich alles löschen?</strong>
          <p class="muted" style="margin:.3rem 0 .6rem">Pakete, Notizen, Checkliste und Einstellungen verschwinden von diesem Gerät. Das lässt sich nicht rückgängig machen. Zur Sicherheit bitte <strong>LÖSCHEN</strong> eintippen:</p>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap"><input type="text" id="loeschen-wort" autocomplete="off" placeholder="LÖSCHEN" style="min-width:12rem"><button class="btn btn-sm btn-primary" data-loeschen-jetzt>Jetzt löschen</button><button class="btn btn-sm" data-loeschen-abbrechen>Abbrechen</button></div></div>` : ""}
        <p class="muted" style="font-size:.85rem;margin:.6rem 0 0">${desktop ? "„Restlos löschen“ entfernt alle Pakete und Einstellungen der App – doppelt gesichert. Das Programm selbst deinstallierst du danach über das Betriebssystem." : "„Zurücksetzen“ löscht alles und lädt OFFLINE frisch. „Restlos löschen“ entfernt alle Daten und die Offline-Kopie – doppelt gesichert, damit nichts aus Versehen verschwindet."}</p>
        <p class="form-msg" id="werkzeug-msg" role="status" aria-live="polite"></p></div>
      <p class="muted" style="margin-top:1rem;font-size:.9rem">So läuft ein Update: Katalog laden → Signatur prüfen → Manifest gegen Katalog und Signatur prüfen → nur geänderte Dateien laden → jede Datei gegen ihre Prüfsumme prüfen → erst dann den alten Stand ersetzen. Details: <a href="https://github.com/miksoda-cpu/OFFLINE/blob/claude/optimistic-hypatia-yymcne/docs/PAKETFORMAT.md" rel="noopener">Paketformat</a>.</p>`;
  },
};

function appUpdateKarte() {
  const u = state.appUpdate ?? { status: "" };
  let inhalt;
  switch (u.status) {
    case "pruefe": inhalt = `<span class="muted">Frage den Update-Server …</span>`; break;
    case "keins": inhalt = `<span class="tag tag-ok">Aktuell</span> <span class="muted">Du hast die neueste Version${u.aktuell ? ` (${esc(u.aktuell)})` : ""}.</span>`; break;
    case "gefunden": inhalt = `<span class="tag tag-warn">Neue Version ${esc(u.info.version)}</span> <span class="muted">Du hast ${esc(u.info.aktuell)}.${u.info.hinweise ? " " + esc(u.info.hinweise) : ""}</span>
      <div style="margin-top:.6rem"><button class="btn btn-sm btn-primary" data-app-update-installieren>Version ${esc(u.info.version)} laden und installieren</button></div>`; break;
    case "laedt": inhalt = `<span class="muted">Lade Version ${esc(u.info.version)} … ${u.fortschritt?.gesamt ? `${groesse(u.fortschritt.geladen)} / ${groesse(u.fortschritt.gesamt)}` : ""}</span>
      <div class="progress" style="margin:.5rem 0"><div style="width:${u.fortschritt?.gesamt ? Math.min(100, (100 * u.fortschritt.geladen) / u.fortschritt.gesamt) : 0}%"></div></div>`; break;
    case "fertig": inhalt = `<span class="tag tag-ok">Installiert</span> <span class="muted">Version ${esc(u.info.version)} ist bereit. Signatur geprüft.</span>
      <div style="margin-top:.6rem"><button class="btn btn-sm btn-primary" data-app-neustart>Jetzt neu starten</button></div>`; break;
    case "fehler": inhalt = `<span class="tag tag-pro">Fehler</span> <span class="muted">${esc(u.text)}</span>`; break;
    default: inhalt = `<span class="muted">Die App holt sich neue Versionen selbst – signiert, vom selben Server wie die Pakete.</span>`;
  }
  const laeuft = u.status === "pruefe" || u.status === "laedt";
  return `<div class="card" style="margin-top:1rem"><div style="display:flex;justify-content:space-between;gap:1rem;align-items:center;flex-wrap:wrap"><h3 style="margin:0">App-Update</h3>
    <button class="btn btn-sm" data-app-update-pruefen ${laeuft ? "disabled" : ""}>Nach neuer Version suchen</button></div>
    <p style="margin:.6rem 0 0" id="app-update-inhalt">${inhalt}</p></div>`;
}

async function appUpdatePruefen() {
  state.appUpdate = { status: "pruefe" }; render();
  try {
    const info = await client.appUpdatePruefen();
    state.appUpdate = info ? { status: "gefunden", info } : { status: "keins", aktuell: APP_VERSION };
  } catch (e) { state.appUpdate = { status: "fehler", text: String(e?.message ?? e) }; }
  render();
}

async function appUpdateInstallieren() {
  const info = state.appUpdate?.info; if (!info) return;
  state.appUpdate = { status: "laedt", info, fortschritt: null }; render();
  try {
    await client.appUpdateInstallieren((f) => {
      state.appUpdate.fortschritt = f;
      const el = document.getElementById("app-update-inhalt");
      if (el && location.hash === "#updates") render();
    });
    state.appUpdate = { status: "fertig", info };
  } catch (e) { state.appUpdate = { status: "fehler", text: String(e?.message ?? e) }; }
  render();
}

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

// Seitenleiste: laufender, unterbrochener oder kaputter Download
const STATUS_TEXT = { laedt: "Lädt", unterbrochen: "Unterbrochen", kaputt: "Fehler", fertig: "Fertig" };
function downloadLeiste() {
  const el = document.getElementById("download");
  if (!el) return;
  const d = state.download;
  if (!d) { el.hidden = true; el.innerHTML = ""; return; }
  const p = d.gesamt ? Math.min(100, (100 * d.geladen) / d.gesamt) : 0;
  const tag = d.status === "laedt" ? "tag-pro" : d.status === "fertig" ? "tag-ok" : "tag-warn";
  el.hidden = false;
  el.innerHTML = `<span class="dl-titel" title="${esc(d.titel)}">${esc(d.titel)}</span>
    <div class="dl-zeile"><span class="tag ${tag}">${STATUS_TEXT[d.status]}</span><span class="mono">${d.gesamt ? `${groesse(d.geladen)} / ${groesse(d.gesamt)}` : groesse(d.geladen)}</span></div>
    ${d.status === "laedt" || d.status === "unterbrochen" ? `<div class="progress"><div style="width:${p}%"></div></div>` : ""}
    ${d.status === "kaputt" && d.text ? `<div class="muted" style="margin-top:.3rem">${esc(d.text)}</div>` : ""}
    ${d.status === "unterbrochen" ? `<button class="btn btn-sm btn-primary" data-install="${esc(d.id)}">Fortsetzen</button>` : ""}
    ${d.status === "kaputt" ? `<button class="btn btn-sm" data-install="${esc(d.id)}">Erneut versuchen</button>` : ""}
    ${d.status === "laedt" && desktop ? `<button class="btn btn-sm" data-abbrechen>Abbrechen</button>` : ""}`;
}

async function installiereMitMeldung(id, ziel) {
  if (state.download?.status === "laedt") { zeige(ziel, "Es läuft schon ein Download – bitte warten oder abbrechen.", ""); return; }
  const k = katalog() ?? (await pruefeUpdates({ still: true }));
  const eintrag = k?.pakete.find((p) => p.id === id);
  if (!eintrag) { zeige(ziel, "Paket nicht im Katalog.", "err"); return; }
  const alt = installiertesPaket(id);
  zeige(ziel, `Lade ${esc(eintrag.titel)} …`, "");
  state.download = { id, titel: eintrag.titel, status: "laedt", geladen: state.download?.id === id ? state.download.geladen : 0, gesamt: state.download?.id === id ? state.download.gesamt : eintrag.groesse };
  downloadLeiste();
  try {
    const { paket, delta: d, geladen } = await installiere(k, eintrag, (f) => {
      state.fortschritt = f;
      state.download = { ...state.download, status: "laedt", geladen: f.geladen, gesamt: f.gesamt };
      downloadLeiste();
      if (location.hash === "#updates") render();
    });
    state.fortschritt = null;
    state.download = { ...state.download, status: "fertig", geladen: state.download.gesamt };
    downloadLeiste();
    setTimeout(() => { if (state.download?.status === "fertig") { state.download = null; downloadLeiste(); } }, 8000);
    const text = alt
      ? `${esc(paket.manifest.titel)} auf ${esc(paket.manifest.version)} aktualisiert – ${groesse(geladen)} geladen (${d.laden.length} von ${paket.manifest.dateien.length} Dateien), Signatur und Prüfsummen geprüft.`
      : `${esc(paket.manifest.titel)} ${esc(paket.manifest.version)} installiert – ${groesse(geladen)}, Signatur und Prüfsummen geprüft.`;
    state.meldung = { art: "ok", titel: alt ? "Aktualisiert" : "Installiert", text };
    render();
    zeige(ziel, text, "ok");
  } catch (e) {
    state.fortschritt = null;
    const msg = String(e?.message ?? e);
    // Ein Abbruch durch den Nutzer ist keine Ablehnung – der Stand bleibt und wird beim nächsten Mal fortgesetzt
    const abbruch = msg.startsWith("Abgebrochen");
    state.download = { ...state.download, status: abbruch ? "unterbrochen" : "kaputt", text: abbruch ? "" : msg };
    downloadLeiste();
    zeige(ziel, (abbruch ? "" : "Abgelehnt: ") + esc(msg) + (abbruch ? " Zum Fortsetzen in der Bibliothek noch einmal auf „Installieren“ klicken." : ""), abbruch ? "" : "err");
    if (location.hash === "#updates") { state.meldung = abbruch ? { art: "warn", titel: "Abgebrochen", text: "Der bisherige Stand bleibt gespeichert. Zum Fortsetzen: Bibliothek → Installieren." } : { art: "fehler", titel: "Abgelehnt", text: esc(msg) }; render(); }
  }
}

// ---------- Tresor ----------
function tresorMeldung(text, art = "") { state.tresor.msg = text; state.tresor.msgArt = art; render(); }

function vorschauFrei() {
  if (state.tresor.vorschau?.url) URL.revokeObjectURL(state.tresor.vorschau.url);
  state.tresor.vorschau = null;
}

async function tresorLaden() {
  if (!desktop) return;
  try {
    const st = await client.tresorStatus();
    state.tresor.sperreMin = st.sperre_min;
    if (!st.existiert) state.tresor.status = "kein";
    else if (!st.offen) { state.tresor.status = "gesperrt"; state.tresor.notizen = []; }
    else { state.tresor.notizen = await client.tresorNotizen(); state.tresor.status = "offen"; }
  } catch (e) { state.tresor.status = "gesperrt"; state.tresor.msg = esc(String(e?.message ?? e)); state.tresor.msgArt = "err"; }
}

function tresorGesperrt(grund) {
  vorschauFrei();
  state.tresor = { ...state.tresor, status: "gesperrt", notizen: [], aktiv: null, code: null, einstellungen: false, codeModus: false, msg: grund === "zeit" ? "Automatisch gesperrt – keine Eingabe in der eingestellten Zeit." : "", msgArt: "" };
  if (location.hash === "#tresor") render();
}

async function tresorAnlegen() {
  const a = document.getElementById("tresor-pw1").value, b = document.getElementById("tresor-pw2").value;
  if (a.length < 8) return tresorMeldung("Mindestens 8 Zeichen.", "err");
  if (a !== b) return tresorMeldung("Die beiden Passwörter stimmen nicht überein.", "err");
  tresorMeldung("Lege an – das dauert einen Moment (Schlüssel wird berechnet) …");
  try {
    const code = await client.tresorAnlegen(a);
    const gruppen = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 4).sort();
    state.tresor = { ...state.tresor, status: "code", code, codeGruppen: gruppen, msg: "", msgArt: "" };
    render();
  } catch (e) { tresorMeldung(esc(String(e?.message ?? e)), "err"); }
}

async function tresorCodeBestaetigen() {
  const t = state.tresor;
  const gruppen = t.code.split("-");
  const falsch = [...document.querySelectorAll("[data-code-gruppe]")].filter((i) => i.value.trim().toUpperCase() !== gruppen[+i.dataset.codeGruppe]);
  if (falsch.length) { falsch.forEach((i) => (i.style.borderColor = "var(--accent)")); return tresorMeldung("Eine Gruppe stimmt nicht – bitte genau abschreiben.", "err"); }
  state.tresor = { ...t, status: "offen", code: null, codeGruppen: null, notizen: [], msg: "Tresor angelegt. Leg jetzt die Notfallmappe an.", msgArt: "ok" };
  render();
}

// Zwischenablage: nach 30 s wieder leeren
async function kopierenKurz(text) {
  try { await navigator.clipboard.writeText(text); setTimeout(() => navigator.clipboard.writeText("").catch(() => {}), 30000); return true; } catch { return false; }
}

async function tresorOeffnen(mitCode) {
  try {
    if (mitCode) await client.tresorOeffnenCode(document.getElementById("tresor-code").value);
    else await client.tresorOeffnen(document.getElementById("tresor-pw").value);
    state.tresor.msg = mitCode ? "Mit Code geöffnet – setz unter Einstellungen ein neues Passwort." : ""; state.tresor.msgArt = mitCode ? "ok" : "";
    state.tresor.codeModus = false;
    state.tresor.einstellungen = !!mitCode;
    await tresorLaden(); render();
  } catch (e) { tresorMeldung(esc(String(e?.message ?? e)), "err"); }
}

let tresorTimer = null;
function tresorAutoSpeichern() {
  clearTimeout(tresorTimer);
  tresorTimer = setTimeout(async () => {
    const t = state.tresor; const n = t.notizen.find((x) => x.id === t.aktiv); if (!n || t.status !== "offen") return;
    const titel = document.getElementById("tresor-titel")?.value ?? n.titel, text = document.getElementById("tresor-text")?.value ?? n.text;
    if (titel === n.titel && text === n.text) return;
    try {
      const g = await client.tresorNotizSchreiben({ ...n, titel, text });
      Object.assign(n, g);
      const el = document.getElementById("tresor-gespeichert"); if (el) el.textContent = "Gespeichert";
      const b = document.querySelector(`[data-tresor-notiz="${n.id}"]`); if (b) b.firstChild.textContent = `${n.reihe ? `${n.reihe}. ` : ""}${titel || "Ohne Titel"}`;
    } catch (e) { tresorMeldung("Nicht gespeichert: " + esc(String(e?.message ?? e)), "err"); }
  }, 700);
}

async function tresorAktion(b) {
  const t = state.tresor;
  const wert = (id) => document.getElementById(id)?.value ?? "";
  try {
    if (b.hasAttribute("data-tresor-anlegen")) return tresorAnlegen();
    if (b.hasAttribute("data-tresor-code-ok")) return tresorCodeBestaetigen();
    if (b.hasAttribute("data-tresor-code-kopieren")) return tresorMeldung((await kopierenKurz(t.code)) ? "Kopiert – die Zwischenablage wird in 30 Sekunden geleert." : "Kopieren nicht möglich.", "");
    if (b.hasAttribute("data-tresor-oeffnen")) return tresorOeffnen(false);
    if (b.hasAttribute("data-tresor-oeffnen-code")) return tresorOeffnen(true);
    if (b.hasAttribute("data-tresor-code-modus")) { t.codeModus = !t.codeModus; t.msg = ""; return render(); }
    if (b.hasAttribute("data-tresor-sperren")) { await client.tresorSperren(); return tresorGesperrt("hand"); }
    if (b.hasAttribute("data-tresor-einstellungen")) { t.einstellungen = !t.einstellungen; t.msg = ""; return render(); }
    if (b.hasAttribute("data-tresor-neu")) { const n = await client.tresorNotizSchreiben({ id: "", titel: "", text: "", reihe: 0, geaendert: "", anhaenge: [] }); t.notizen.unshift(n); t.aktiv = n.id; vorschauFrei(); render(); document.getElementById("tresor-titel")?.focus(); return; }
    if (b.hasAttribute("data-tresor-mappe")) { t.notizen = await client.tresorNotfallmappe(); t.aktiv = t.notizen[0]?.id ?? null; return tresorMeldung("Notfallmappe angelegt – zehn Abschnitte, jedes Feld ist freiwillig.", "ok"); }
    if (b.dataset.tresorNotiz) { clearTimeout(tresorTimer); t.aktiv = b.dataset.tresorNotiz; vorschauFrei(); t.msg = ""; return render(); }
    if (b.dataset.tresorNotizLoeschen) { if (!confirm("Diese Notiz samt Anhängen endgültig löschen?")) return; await client.tresorNotizLoeschen(b.dataset.tresorNotizLoeschen); t.notizen = t.notizen.filter((x) => x.id !== b.dataset.tresorNotizLoeschen); t.aktiv = null; vorschauFrei(); return render(); }
    if (b.hasAttribute("data-tresor-anhang")) {
      const pfad = await client.dateiWaehlen("Scan oder Dokument in den Tresor legen"); if (!pfad) return;
      tresorMeldung("Verschlüssele und lege ab …");
      const n = await client.tresorAnhangAusDatei(t.aktiv, pfad); Object.assign(t.notizen.find((x) => x.id === n.id), n);
      return tresorMeldung("Anhang abgelegt. Das Original liegt noch dort, wo es war – wenn du es nur im Tresor willst, lösch es dort.", "ok");
    }
    if (b.dataset.tresorAnzeigen) {
      const id = b.dataset.tresorAnzeigen;
      if (t.vorschau?.id === id) { vorschauFrei(); return render(); }
      const n = t.notizen.find((x) => x.id === t.aktiv); const a = n.anhaenge.find((x) => x.id === id);
      const b64 = await client.tresorAnhangLesen(id);
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      vorschauFrei();
      t.vorschau = { id, typ: a.typ, name: a.name, url: URL.createObjectURL(new Blob([bytes], { type: a.typ })), text: a.typ.startsWith("text/") ? new TextDecoder().decode(bytes) : null };
      return render();
    }
    if (b.dataset.tresorAnhangLoeschen) { if (!confirm("Anhang endgültig löschen?")) return; const n = await client.tresorAnhangLoeschen(t.aktiv, b.dataset.tresorAnhangLoeschen); Object.assign(t.notizen.find((x) => x.id === n.id), n); vorschauFrei(); return render(); }
    if (b.hasAttribute("data-tresor-pw-aendern")) { await client.tresorPasswortAendern(wert("tresor-alt"), wert("tresor-neu")); return tresorMeldung("Passwort geändert.", "ok"); }
    if (b.hasAttribute("data-tresor-code-neu")) { const code = await client.tresorCodeErneuern(wert("tresor-pw-code")); const gruppen = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 4).sort(); state.tresor = { ...t, status: "code", code, codeGruppen: gruppen, einstellungen: false, msg: "", msgArt: "" }; return render(); }
    if (b.hasAttribute("data-tresor-sichern")) { const ziel = await client.ordnerWaehlen("Ordner für die Sicherung wählen (z. B. USB-Stick)"); if (!ziel) return; const wo = await client.tresorSichern(ziel); return tresorMeldung(`Gesichert nach ${esc(wo)}.`, "ok"); }
    if (b.hasAttribute("data-tresor-zurueckspielen")) { const q = await client.ordnerWaehlen("Ordner „OFFLINE-Tresor-Sicherung“ wählen"); if (!q) return; if (!confirm("Den Tresor auf diesem Gerät durch die Sicherung ersetzen?")) return; await client.tresorZurueckspielen(q); await tresorLaden(); return tresorMeldung("Sicherung zurückgespielt – mit dem Passwort der Sicherung öffnen.", "ok"); }
  } catch (e) { tresorMeldung(esc(String(e?.message ?? e)), "err"); }
}

// Inhalte (kiwix-serve) in der App lesen – Leseansicht mit eingebetteter Seite
async function zimOeffnen(id) {
  zeige("bib-msg", "Starte die Bibliothek …", "");
  try {
    const url = await client.kiwixUrl();
    if (!url) throw new Error("Kein Inhaltspaket gefunden");
    state.lesen = { url, titel: installiertesPaket(id)?.manifest.titel ?? "Bibliothek" };
    location.hash = "#lesen";
  } catch (e) { zeige("bib-msg", "Konnte nicht öffnen: " + esc(String(e?.message ?? e)), "err"); }
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

async function restlosLoeschen(wort) {
  // Sicherung 1: Wort eintippen. Sicherung 2: nochmals bestätigen.
  if (wort.trim().toUpperCase() !== "LÖSCHEN") { zeige("werkzeug-msg", "Nicht gelöscht – das Wort stimmte nicht.", "err"); return; }
  if (!confirm("Wirklich alles restlos löschen? Das lässt sich nicht rückgängig machen.")) { zeige("werkzeug-msg", "Abgebrochen – nichts gelöscht.", ""); state.loeschenOffen = false; render(); return; }
  let anleitungDesktop = null;
  if (desktop) {
    try { anleitungDesktop = await client.allesLoeschen(wort); }
    catch (e) { zeige("werkzeug-msg", "Konnte nicht löschen: " + esc(String(e?.message ?? e)), "err"); return; }
  }
  await allesEntfernen();
  const mac = /Mac/.test(navigator.platform);
  document.body.innerHTML = `<div class="wrap" style="padding:3rem 16px;max-width:40rem">
    <a class="brand" href="/"><span class="brand-flag" aria-hidden="true"></span>OFFLINE</a>
    <h1 style="font-size:1.8rem;margin-top:1.5rem">Alles gelöscht.</h1>
    <p class="muted">Pakete, Notizen, Checkliste, Einstellungen und die Offline-Kopie der App sind von diesem Gerät entfernt.</p>
    <div class="card"><h3>Letzter Schritt: ${anleitungDesktop ? "das Programm deinstallieren" : "das App-Symbol entfernen"}</h3>
      ${anleitungDesktop ? `<p class="muted" style="margin:0">${esc(anleitungDesktop)}</p>` : ""}
      <p class="muted" style="margin:0;${anleitungDesktop ? "display:none" : ""}">Falls du OFFLINE als App installiert hattest, ist noch das Symbol da. Es geht nur von Hand:</p>
      <ul class="muted" style="padding-left:1.1rem;margin:.5rem 0 0;${anleitungDesktop ? "display:none" : ""}">
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
function kartenPaket() {
  if (!desktop) return null;
  return installierteIds().map(installiertesPaket).find((p) => p?.manifest.art === "karte" && p.manifest.dateien.some((d) => d.pfad.endsWith(".pmtiles"))) ?? null;
}

async function karteStarten() {
  const el = document.getElementById("karte");
  const kp = kartenPaket();
  if (el && kp) {
    try {
      const wurzel = await client.lokalUrl();
      if (!wurzel) throw new Error("Lokaler Dateiserver läuft nicht");
      const { offlineKarte } = await import("./karte.js");
      await offlineKarte(el, `${wurzel}${encodeURIComponent(kp.ordner.split(/[\\/]/).pop())}/`, kp.manifest);
      return;
    } catch (e) {
      zeige("karte-msg", "Offline-Karte konnte nicht geladen werden: " + esc(String(e?.message ?? e)) + " – zeige Online-Karte.", "err");
    }
  }
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
  const aktiv = seite === "lesen" ? "bibliothek" : seite;
  document.querySelectorAll("#nav a").forEach((a) => (a.dataset.route === aktiv ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  main.classList.toggle("main-lesen", seite === "lesen");
  document.title = `OFFLINE – ${ROUTEN.find((r) => r[0] === seite)?.[1] ?? state.lesen?.titel ?? "Lesen"}`;
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

// Klicks in der Hauptfläche und in der Download-Leiste der Seitenleiste
function beiKlick(e) {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.filter) { state.filter = b.dataset.filter; render(); }
  if (b.dataset.install) installiereMitMeldung(b.dataset.install, "bib-msg");
  if ([...b.attributes].some((a) => a.name.startsWith("data-tresor"))) return tresorAktion(b);
  if ([...b.attributes].some((a) => a.name.startsWith("data-notiz"))) return notizAktion(b);
  if (b.hasAttribute("data-lesen-zurueck")) { try { document.getElementById("lesen-rahmen")?.contentWindow.history.back(); } catch {} }
  if (b.hasAttribute("data-lesen-start")) { const f = document.getElementById("lesen-rahmen"); if (f) f.src = state.lesen.url; }
  if (b.hasAttribute("data-lesen-fenster")) client.fensterOeffnen(state.lesen.url, `OFFLINE – ${state.lesen.titel}`).catch(() => {});
  if (b.dataset.remove) Promise.resolve(entferne(b.dataset.remove)).then(render);
  if (b.hasAttribute("data-stick-suchen")) client.stickSuchen().then((f) => { state.funde = f; render(); if (!f.length) zeige("bib-msg", "Kein signiertes Paket auf einem Datenträger gefunden.", "err"); });
  if (b.hasAttribute("data-ordner-waehlen")) client.ordnerWaehlen().then((p) => p && einspielenVonOrdner(p));
  if (b.dataset.stick) einspielenVonOrdner(b.dataset.stick);
  if (b.dataset.oeffnenZim) zimOeffnen(b.dataset.oeffnenZim);
  if (b.dataset.intervall) { state.abo.intervall = b.dataset.intervall; aboSpeichern(); render(); }
  if (b.hasAttribute("data-katalog")) pruefeUpdates();
  if (b.hasAttribute("data-app-update-pruefen")) appUpdatePruefen();
  if (b.hasAttribute("data-app-update-installieren")) appUpdateInstallieren();
  if (b.hasAttribute("data-app-neustart")) client.appNeustart();
  if (b.id === "jetzt") { b.disabled = true; b.textContent = "Prüfe …"; desktop ? updatesJetztDesktop() : pruefeUpdates(); }
  if (b.hasAttribute("data-abbrechen")) client.abbrechen();
  if (b.hasAttribute("data-offline-pruefen")) offlinePruefen();
  if (b.hasAttribute("data-app-installieren")) appInstallieren();
  if (b.hasAttribute("data-zuruecksetzen")) zuruecksetzen();
  if (b.hasAttribute("data-loeschen")) { state.loeschenOffen = true; render(); document.getElementById("loeschen-wort")?.focus(); }
  if (b.hasAttribute("data-loeschen-abbrechen")) { state.loeschenOffen = false; render(); }
  if (b.hasAttribute("data-loeschen-jetzt")) restlosLoeschen(document.getElementById("loeschen-wort")?.value ?? "");
  if (b.hasAttribute("data-speicherort")) client.ordnerWaehlen("Ordner für Pakete wählen (z. B. externe Platte)").then((p) => p && speicherortSetzen(p));
  if (b.hasAttribute("data-speicherort-standard")) speicherortSetzen(null);
}
main.addEventListener("click", beiKlick);
main.addEventListener("input", (e) => {
  if (e.target.id === "tresor-titel" || e.target.id === "tresor-text") tresorAutoSpeichern();
  if (e.target.id === "tresor-suche") { state.tresor.suche = e.target.value; const pos = e.target.selectionStart; render(); const s2 = document.getElementById("tresor-suche"); s2?.focus(); s2?.setSelectionRange(pos, pos); }
});
main.addEventListener("change", (e) => {
  if (e.target.id === "tresor-sperre") client.tresorSperreSetzen(+e.target.value).then((m) => { state.tresor.sperreMin = m; render(); }).catch(() => {});
});
if (desktop) {
  client.beiTresorGesperrt(tresorGesperrt);
  // Beim Minimieren (Fenster unsichtbar) sperren – wie in der Spezifikation
  document.addEventListener("visibilitychange", () => { if (document.hidden && state.tresor.status === "offen") client.tresorSperren().then(() => tresorGesperrt("hand")).catch(() => {}); });
  addEventListener("hashchange", () => { if (location.hash === "#tresor") tresorLaden().then(render); });
  tresorLaden().then(() => { if (location.hash === "#tresor") render(); });
}
document.getElementById("download").addEventListener("click", beiKlick);

main.addEventListener("submit", (e) => {
  if (e.target.id !== "chat-form") return;
  e.preventDefault();
  const input = document.getElementById("frage");
  const frage = input.value.trim();
  if (!frage) return;
  document.getElementById("chat").insertAdjacentHTML("beforeend", `<div class="bubble user">${esc(frage)}</div><div class="bubble bot">${antworte(frage)}</div>`);
  input.value = "";
});

function notizbuchSpeichern() { speicher.set("notizbuch", state.notizbuch); }
let notizTimer = null;
main.addEventListener("input", (e) => {
  if (e.target.id === "notiz-titel" || e.target.id === "notiz-text") {
    const n = state.notizbuch.find((x) => x.id === state.notizAktiv); if (!n) return;
    n.titel = document.getElementById("notiz-titel").value; n.text = document.getElementById("notiz-text").value; n.geaendert = new Date().toISOString();
    notizbuchSpeichern();
    clearTimeout(notizTimer);
    const g = document.getElementById("notiz-gespeichert"); if (g) g.textContent = "Gespeichert";
    const b = document.querySelector(`[data-notiz="${n.id}"]`); if (b) b.firstChild.textContent = n.titel || "Ohne Titel";
  }
  if (e.target.id === "notiz-suche") { state.notizSuche = e.target.value; const pos = e.target.selectionStart; render(); const s2 = document.getElementById("notiz-suche"); s2?.focus(); s2?.setSelectionRange(pos, pos); }
});
async function notizAktion(b) {
  if (b.hasAttribute("data-notiz-neu")) { const n = { id: notizId(), titel: "", text: "", geaendert: new Date().toISOString() }; state.notizbuch.push(n); state.notizAktiv = n.id; notizbuchSpeichern(); render(); document.getElementById("notiz-titel")?.focus(); return; }
  if (b.dataset.notiz) { state.notizAktiv = b.dataset.notiz; return render(); }
  if (b.dataset.notizLoeschen) { if (!confirm("Diese Notiz löschen?")) return; state.notizbuch = state.notizbuch.filter((x) => x.id !== b.dataset.notizLoeschen); state.notizAktiv = null; notizbuchSpeichern(); return render(); }
  if (b.dataset.notizInTresor) {
    const n = state.notizbuch.find((x) => x.id === b.dataset.notizInTresor); if (!n) return;
    try {
      const st = await client.tresorStatus();
      if (!st.existiert || !st.offen) { alert(st.existiert ? "Bitte zuerst den Tresor öffnen, dann noch einmal „In den Tresor“." : "Bitte zuerst einen Tresor anlegen (Seite „Tresor“)."); return; }
      await client.tresorNotizSchreiben({ id: "", titel: n.titel, text: n.text, reihe: 0, geaendert: "", anhaenge: [] });
      state.notizbuch = state.notizbuch.filter((x) => x.id !== n.id); state.notizAktiv = null; notizbuchSpeichern();
      state.tresor.status = null; // beim nächsten Öffnen der Tresor-Seite neu laden
      render();
    } catch (e) { alert("Nicht verschoben: " + String(e?.message ?? e)); }
  }
}

menu.addEventListener("click", () => { const open = sidebar.classList.toggle("open"); menu.setAttribute("aria-expanded", String(open)); });

const APP_VERSION = "0.1.3";
function netz() {
  const on = navigator.onLine;
  document.getElementById("net-dot").className = "dot " + (on ? "on" : "off");
  document.getElementById("net-text").textContent = on ? "Online – Abo kann laden" : "Offline – alles verfügbar";
}
async function appAngaben() {
  const el = document.getElementById("app-info");
  if (!el) return;
  if (desktop) {
    try {
      const i = await client.appInfo();
      el.textContent = `Desktop-App ${i.version} · ${i.system} ${i.arch} · Tauri ${i.tauri}`;
      el.title = `Datenordner: ${desktop.datenordner}`;
      return;
    } catch {}
  }
  const pwa = matchMedia("(display-mode: standalone)").matches;
  el.textContent = `Web-App ${APP_VERSION} · ${pwa ? "installiert (PWA)" : "im Browser"}`;
}
async function neuLaden() {
  const b = document.getElementById("net-neu");
  b.disabled = true; b.classList.add("dreht");
  netz();
  try {
    if (navigator.onLine) await ladeKatalog();
    state.meldung = null;
  } catch (e) { state.meldung = { art: "fehler", titel: "Abgelehnt", text: esc(String(e?.message ?? e)) }; }
  await appAngaben();
  render();
  b.disabled = false; b.classList.remove("dreht");
}
document.getElementById("net-neu").addEventListener("click", neuLaden);
addEventListener("online", netz);
addEventListener("offline", netz);
addEventListener("hashchange", render);
netz();
appAngaben();
render();

// Unterbrochene Downloads vom letzten Mal: anzeigen und, wenn online, von selbst fortsetzen
async function offeneDownloads() {
  if (!desktop) return;
  let offen = [];
  try { offen = await client.downloadsOffen(); } catch { return; }
  const o = offen[0];
  if (!o) return;
  state.download = { id: o.id, titel: o.titel, status: "unterbrochen", geladen: o.geladen, gesamt: o.gesamt };
  downloadLeiste();
  if (navigator.onLine) installiereMitMeldung(o.id, "bib-msg");
}

// Erster Start: Österreich-Paket automatisch holen, wenn noch keins da ist. Danach still nach Updates sehen.
(async () => {
  await offeneDownloads();
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
