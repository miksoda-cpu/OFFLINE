// OFFLINE – App-Oberfläche (Prototyp). Alle Inhalte kommen aus signierten Paketen, siehe paket-client.js.
import { versionVergleich } from "./paket-kern.js";
import { berechne as bereitBerechnen, naechsterSchritt, uebertragen as bereitUebertragen, wertV1 as bereitWertV1, POSITIONEN as BEREIT_POSITIONEN } from "./bereit.js";
import { Wesen, SORTEN, TEXTE as LUMI_TEXTE, einladungFaellig, ohneIch, tippPool, tippKnoepfeHtml, ZIELE, FUNKTIONEN } from "./wesen.js";
import { WERTE as PAUSE_WERTE, LEBENSABSCHNITTE, APPETIT, ART_TEXT, angeboten as pauseAngeboten, einstellungenLaden as pauseEinstellungenLaden, linieLaden as pauseLinieLaden,
  logDazu as pauseLogDazu, happenFaellig, waehle as pauseWaehle, bewerten as pauseBewerten, schwierigkeit as pauseSchwierigkeit, zoneAnpassen, zoneText, zurueckholen as pauseZurueckholen,
  rueckfrageFaellig, rueckfrageBeantworten, auffrischungFaellig, auffrischungTermine, soSeheIchDich, wochenSatz, rueckspiegel, lumischHeute, imKennenlernen, gewichtVon, stufeVon, verfuegbar as pauseVerfuegbar, tagVon, raumFormen, dauerText } from "./pause.js";
import { FORMEN as PAUSE_FORMEN, happenFokus } from "./pause-happen.js";
import { freiLaden as buchFreiLaden, freischalten as buchFreischalten, anteil as buchAnteil, buchMitLuecken, linkErlaubt as buchLinkErlaubt, vorleseTeile as buchVorleseTeile, absatz as buchAbsatz, LUECKE as BUCH_LUECKE, LUECKE_WARTET as BUCH_LUECKE_WARTET, wartendeAbsaetze as buchWartend, mitSchluss as buchMitSchluss } from "./buch.js";
import { SCHLUSS, KARTEN as TAG_KARTEN, PLAN_STANDARD, TIEFEN, datumVon, plusTage, kartenFuer, vorratTage, vorzuladen, bereichVorbei, tagesKarten, schlussErreicht, textkarteFuer, lernen as tagLernen, antwortRichtig } from "./tag.js";
import { ModulRahmen, druckTeil } from "./modul-host.js";

// Im Browser prüft und speichert paket-client.js selbst; in der Desktop-App macht das der Rust-Kern.
const client = window.__TAURI__ ? await import("./paket-client-tauri.js") : await import("./paket-client.js");
const { speicher, ladeKatalog, katalogAusSpeicher, installiertesPaket, installiere, entferne, verfuegbareUpdates: alleUpdates, inhalt, installierteIds } = client;
const desktop = client.istDesktop ? await client.init() : null;
const APP_VERSION = "0.5.1";
// app_min: Pakete für eine neuere App bleiben sichtbar, lassen sich aber nicht laden (ältere Apps bis 0.1.8 prüften das nicht).
const appVersion = () => desktop?.info?.version ?? APP_VERSION;
const appPasst = (e) => !e?.app_min || versionVergleich(appVersion(), e.app_min) >= 0;
const verfuegbareUpdates = (k) => alleUpdates(k).filter((u) => appPasst(u.eintrag));
const braucht = (e) => `<span class="tag of-plakette" title="Dieses Paket braucht eine neuere App. Unter Einstellungen → App-Update.">Braucht App ${esc(e.app_min)}</span>`;
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
  bestaetigt: null, // Bereit Version 2: positionId → ISO-Datum der letzten Bestätigung (siehe bereit.js), unten geladen
  wesenLog: { filter: "", suche: "" },
  abo: speicher.get("abo", { intervall: "woechentlich", nurWlan: true, fenster: true, von: "02:00", bis: "05:00", aktiv: true }),
  fortschritt: null, // { pfad, geladen, gesamt } während eines Downloads
  lesen: null, // { url, titel } – Leseansicht für kiwix-serve
  werkzeug: { radio: speicher.get("radio", {}), datum: null, rechner: { art: "laenge", von: "km", nach: "m", wert: "1" }, vorrat: { personen: 2, tage: 14 } },
  tresor: { status: null, notizen: [], aktiv: null, suche: "", code: null, codeGruppen: null, vorschau: null, msg: "", einstellungen: false, sperreMin: 5 },
  download: null, // Seitenleiste: { id, titel, status: laedt|unterbrochen|kaputt|fertig, geladen, gesamt, text }
  bundesland: speicher.get("bundesland", "Wien"),
  notizbuch: notizbuchLaden(), // offene Notizen: [{ id, titel, text, geaendert }]
  notizAktiv: null, notizSuche: "",
  filter: "Alle",
  meldung: null, // { text, art } für die Update-Seite
  // Module (art = "modul"): Stand je Modul, geladene Vorschauen, gewählte Folie, offener Löschdialog, lokale Quelle, laufendes Modul
  modul: { stand: {}, vorschau: {}, folie: {}, loeschen: null, lokal: null, offen: null, skin: null },
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
const ARTEN = { inhalt: "Österreich", zim: "Bibliothek", karte: "Karten", modell: "KI", kurs: "Kurse", software: "Software", tage: "Tage", modul: "Module" };

// ---------- Paketinhalt ----------
const P = () => installiertesPaket(BASISPAKET);
const PW = () => installiertesPaket("wir");
const PB = () => installiertesPaket("lumi-buch"); // Das Lumi-Buch (0.5.0)
const buchDaten = () => inhalt(PB(), "inhalt/buch.json");
// Vorhaben: Sätze der Lumi, die man sich mit „Mach ich“ vorgenommen hat. Eine Erinnerung, keine Prüfung: zählen nicht zu Bereit.
const vorhaben = () => speicher.get("vorhaben", []);
const vorhabenSpeichern = (l) => speicher.set("vorhaben", l);
function vorhabenDazu(t) {
  const l = vorhaben(); if (l.some((v) => v.tipp === t.id)) return;
  l.unshift({ id: `v-${Date.now().toString(36)}`, tipp: t.id, text: t.text, datum: new Date().toISOString(), erledigt: null });
  vorhabenSpeichern(l);
}
const wesen = new Wesen({ speicher, istVorhaben: (id) => vorhaben().some((v) => v.tipp === id), buchLink: (t) => buchLinkErlaubt(t, wesen.e, buchDaten()), tipps: () => inhalt(PW(), "inhalt/tipps.json")?.tipps ?? [], onLog: () => {
  const z = document.getElementById("wesen-log-zahl"); if (z) z.textContent = `· ${wesen.log.length}`;
  const el = document.getElementById("wesen-log"); if (el) el.innerHTML = wesen.logHtml(state.wesenLog.filter, state.wesenLog.suche);
} });

// Bereit, Version 2: vier Quellen nach Gesamtkonzept Kapitel 4, jede Position mit eigenem Verfall (bereit.js).
// Beim ersten Start nach dem Update werden die Bestätigungen aus Version 1 übernommen; die alten Daten bleiben liegen.
// Erster Start mit Version 2 nach einem Update: den Wert aus Version 1 als Sockel merken (bereit.js, sockelWert),
// sobald Paket und Tresor-Stand bekannt sind (sockelFestlegen).
if (speicher.get("bereit-v2", null) === null && (Object.values(state.checks).some(Boolean) || Object.keys(speicher.get("bestaetigungen", {})).length)) speicher.set("bereit-sockel-offen", true);
state.bestaetigt = speicher.get("bereit-v2", null) ?? bereitUebertragen({ checks: state.checks, bestaetigungenV1: speicher.get("bestaetigungen", {}) });
speicher.set("bereit-v2", state.bestaetigt);
function bereit() {
  const arten = installierteIds().map(installiertesPaket).filter(Boolean).map((x) => x.manifest.art);
  const notfallmappe = desktop ? state.tresor.status !== null && state.tresor.status !== "kein" : undefined; // ohne Tresor zählt sie nicht
  return bereitBerechnen({ checks: state.checks, bestaetigt: state.bestaetigt, geraet: { paketErstellt: P()?.manifest.erstellt ?? null, arten, notfallmappe }, sockel: sockelFestlegen(arten) }, testJetzt());
}
/** Sockel aus Version 1: wird einmal festgelegt, sobald der Tresor-Stand bekannt ist; bis dahin vorläufig ohne Notfallmappe. */
function sockelFestlegen(arten) {
  if (!speicher.get("bereit-sockel-offen", false)) return speicher.get("bereit-sockel", null);
  const vorsorge = D("vorsorge");
  const gesamt = vorsorge ? vorsorge.gruppen.reduce((n, g) => n + g.punkte.length, 0) : 0;
  const bekannt = !desktop || state.tresor.status !== null;
  const sockel = { wert: bereitWertV1({ erledigt: Object.values(state.checks).filter(Boolean).length, gesamt, notfallmappe: !!desktop && bekannt && state.tresor.status !== "kein", arten, bestaetigungenV1: speicher.get("bestaetigungen", {}) }), am: new Date().toISOString() };
  if (bekannt) { speicher.set("bereit-sockel", sockel); speicher.del("bereit-sockel-offen"); }
  return sockel;
}
// Nur im Entwickler-Build: Datum für die Bereit-Rechnung vorstellen, um Verfall zu prüfen (Übersicht, Testleiste).
const testJetzt = () => (desktop?.info?.entwickler ? Date.now() + speicher.get("test-monate", 0) * 30.44 * 86400000 + speicher.get("test-tage", 0) * 86400000 : Date.now());
const testLeiste = () => desktop?.info?.entwickler ? `<div class="card of-karte" style="margin-bottom:1rem;border-style:dashed"><strong>Entwickler-Build:</strong> Datum für Bereit ${speicher.get("test-monate", 0) ? `+${speicher.get("test-monate", 0)} Monate` : "heute"}
  ${[0, 7, 13, 16].map((m) => `<button class="btn btn-sm of-btn of-btn--klein" data-test-monate="${m}">${m ? `+${m} Monate` : "heute"}</button>`).join(" ")}
  <br><span class="muted of-klein">Tagesseite: ${speicher.get("test-tage", 0) ? `+${speicher.get("test-tage", 0)} Tage` : "heute"}</span> ${[0, 1, 7, 30, 60, 62].map((t) => `<button class="btn btn-sm of-btn of-btn--klein" data-test-tage="${t}">${t ? `+${t} Tage` : "heute"}</button>`).join(" ")}</div>` : "";
function bestaetigen(id, ja = true) {
  if (ja) state.bestaetigt[id] = new Date(testJetzt()).toISOString(); else delete state.bestaetigt[id];
  speicher.set("bereit-v2", state.bestaetigt);
  if (ja && BEREIT_POSITIONEN.find((p) => p.id === id)?.fest) wesen.fest(); else if (ja && wesen.mitFigur()) wesen.freude();
  render();
}
const D = (name) => inhalt(P(), `inhalt/${name}.json`);
const katalog = () => katalogAusSpeicher()?.katalog ?? null;

// ---------- Navigation ----------
const I = {
  start: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  uebersicht: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  notfall: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  vorsorge: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>',
  bibliothek: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  karte: '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4z"/><path d="M8 2v16M16 6v16"/>',
  ki: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  werkzeuge: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  notizen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  tresor: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  updates: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
};
const ROUTEN = [
  ["start", "Heute"], ["pause", "Pause"], ["uebersicht", "Übersicht"], ["notfall", "Notfall"], ["vorsorge", "Vorsorge"], ["werkzeuge", "Werkzeuge"], ["bibliothek", "Bibliothek"],
  ["karte", "Karte"], ["ki", "KI-Assistent"], ["notizen", "Notizen"], ["tresor", "Tresor"], ["updates", "Updates & Abo"],
];
const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;
document.getElementById("nav").innerHTML = ROUTEN.map(([id, name]) => `<a href="#${id}" data-route="${id}">${icon(id)}${name}</a>`).join("");
const TABS = ["start", "pause", "notfall", "vorsorge"]; // seit 0.4.2 Pause statt Bibliothek; die Bibliothek ist unter „Mehr“
document.getElementById("tabbar").innerHTML = TABS.map((id) => { const n = ROUTEN.find((r) => r[0] === id)[1]; return `<a href="#${id}" data-route="${id}">${icon(id)}${n}</a>`; }).join("")
  + `<button type="button" id="tab-mehr" aria-controls="sidebar" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>Mehr</button>`;
if (desktop) document.getElementById("proto-banner")?.remove();

const kachel = (route, farbe, titel, text) => `<a class="kachel kachel- of-karte of-karte--klick ${farbe}" href="#${route}"><span class="kachel-ikon">${icon(route)}</span><svg class="kachel-pfeil" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg><span><strong>${titel}</strong><span class="muted of-klein">${text}</span></span></a>`;
const kopf = (titel, text, extra = "") => `<div class="page-head of-seitenkopf"><div><h1 style="font-size:2rem">${titel}</h1><p>${text}</p></div>${extra}</div>`;
const fehlt = () => `${kopf("Kein Österreich-Paket", "Dieses Gerät hat noch kein Paket installiert und ist offline.")}
  <div class="card of-karte"><p class="muted of-klein">Sobald du online bist, lädt OFFLINE das Österreich-Paket automatisch. Oder du gehst in die Bibliothek und installierst es von Hand.</p><a class="btn btn-primary of-btn of-btn--primaer" href="#bibliothek">Zur Bibliothek</a></div>`;

// ---------- Tagesseite und Vorratskammer (Logik in tag.js) ----------
const heuteDatum = () => datumVon(testJetzt());
state.tag = { offen: {}, nochmal: false, datum: null, liest: false, lesen: null, schlussGezeigt: null };
function tagesplan() {
  const p = speicher.get("tagesplan", null) ?? {};
  return { ...PLAN_STANDARD, ...p, karten: { ...PLAN_STANDARD.karten, ...(p.karten ?? {}) } };
}
function planSpeichern(p) { speicher.set("tagesplan", p); }
/** Tag 1 der Tagnummern: der erste Tag, an dem die Tagesseite auf diesem Gerät lief. */
function tagStart() { let t = speicher.get("tag-start", null); if (!t) { t = heuteDatum(); speicher.set("tag-start", t); } return t; }
function tagesPakete() {
  return installierteIds().map(installiertesPaket).filter((x) => x?.manifest.art === "tage")
    .map((x) => ({ id: x.manifest.id, version: x.manifest.version, bereich: x.manifest.tage, tage: inhalt(x, "inhalt/tage.json")?.tage ?? [] }));
}
const tagZustand = (datum) => speicher.get(`tag:${datum}`, {});
/** Status einer Karte für heute merken, dazu der Verlauf (für die gelernte Schicht, 45 Tage). */
function tagSetzen(karte, status) {
  const d = heuteDatum(), z = tagZustand(d);
  // Das Tagesrätsel bleibt sein eigenes Paket, meldet sein Ergebnis aber ins Spiel-Log (einmal je Rätsel)
  if (karte.art === "raetsel" && status === "erledigt" && !spielLog().some((e) => e.quelle === "raetsel" && e.ergebnis?.raetsel === karte.id)) {
    const o = state.tag.offen[karte.id] ?? {};
    spielLogDazu({ quelle: "raetsel", id: "tagesraetsel", art: ["beweglichkeit"], ergebnis: { raetsel: karte.id, geloest: !!o.richtig, aufgedeckt: !!o.loesung && !o.richtig }, dauer: 0 });
  }
  if (status) z[karte.id] = status; else delete z[karte.id];
  speicher.set(`tag:${d}`, z);
  const v = speicher.get("tag-verlauf", {}), art = karte.art === "text" ? "lumi" : karte.art;
  v[d] = { ...(v[d] ?? {}) }; if (status) v[d][art] = status; else delete v[d][art];
  for (const alt of Object.keys(v).sort().slice(0, -45)) { delete v[alt]; speicher.del(`tag:${alt}`); }
  speicher.set("tag-verlauf", v);
}
/** Die Textkarte (oder der Satz der Lumi) des Tages: aus demselben Pool wie die Tipps, fest für den Tag. */
function textkarteHeute(d) {
  const k = { ...wesen.kontext(), ansicht: "start", jetzt: testJetzt() };
  const g = speicher.get("lumi-satz", null), pool = tippPool(wesen.tippsQuelle(), wesen.e, k);
  if (g?.datum === d) { const t = pool.find((x) => x.id === g.id); if (t) return t; } // bleibt den Tag über, auch nach „Nicht mehr“
  const t = textkarteFuer(tippPool(wesen.tippsQuelle(), wesen.e, k, new Set(wesen.bewertung.aus)), d);
  if (t) speicher.set("lumi-satz", { datum: d, id: t.id });
  return t;
}
/** Mit Figur spricht der Satz des Tages in der Sprechblase – einmal, bis er bewertet oder geschlossen ist. */
function tagesSatzZeigen() {
  if (!wesen.mitFigur()) return;
  const d = heuteDatum(), t = textkarteHeute(d), z = tagZustand(d);
  if (!t || z[`lumi-${t.id}`] || !tagesplan().karten.lumi) return;
  wesen.satzDesTages(t);
}
/** „Zeig mir“: an die Stelle in der App, Abschnitte der Übersicht aufklappen. */
const ANKER = { tagesplan: "tagesplan", lumi: "lumi-einstellungen", "lumi-log": "lumi-log" };
function zielOeffnen(ziel) {
  if (!ZIELE.includes(ziel)) return;
  const anker = ANKER[ziel];
  location.hash = `#${anker ? "uebersicht" : ziel}`;
  if (anker) setTimeout(() => { const el = document.getElementById(anker); if (el) { if (el.tagName === "DETAILS") el.open = true; el.scrollIntoView({ block: "start" }); } }, 60);
}
function heutigeKarten() {
  const d = heuteDatum();
  return tagesKarten({ karten: kartenFuer(tagesPakete(), d, tagStart()), plan: tagesplan(), lumi: wesen.e.darstellung, textkarte: textkarteHeute(d) });
}
/** Gelernte Schicht: einmal am Tag prüfen; ausblenden sichtbar, begründet, rückgängig (Kap. 6). */
function tagLernenPruefen() {
  const d = heuteDatum(), g = speicher.get("tag-gelernt", { eingefroren: {}, zurueck: {}, ruheBis: {} });
  if (g.geprueft === d) return;
  g.geprueft = d;
  const gesperrt = { ...(g.eingefroren ?? {}) };
  for (const [art, bis] of Object.entries(g.ruheBis ?? {})) if (d < bis) gesperrt[art] = true;
  const v = tagLernen(speicher.get("tag-verlauf", {}), d, tagesplan(), { eingefroren: gesperrt });
  if (v) { const p = tagesplan(); p.karten[v.art] = false; planSpeichern(p); g.hinweis = { ...v, am: d }; }
  speicher.set("tag-gelernt", g);
}
const ersterAbsatz = (k) => (k.absaetze ?? []).find((a) => !a.startsWith("## ")) ?? "";
function tagKarteHtml(k, status) {
  const titel = k.art === "raetsel" ? "Tagesrätsel" : k.art === "kapitel" ? "Roman der Woche" : k.art === "lumi" ? `${esc(wesen.anzeigename())} sagt` : k.art === "text" ? `Textkarte des Tages${k.sorte ? ` · ${esc(SORTEN[k.sorte] ?? k.sorte)}` : ""}` : "Lektion des Tages";
  const r = state.tag.offen[k.id] ?? {};
  if (status === "erledigt" && k.art === "raetsel" && r.richtig) return `<article class="card of-karte tag-karte" data-tag-karte="${esc(k.id)}"><p class="tag-art">${titel} <span class="tag tag-ok of-plakette of-plakette--offline">erledigt</span></p><p class="tag-frage">${esc(k.frage)}</p><div class="tag-loesung tag-richtig" role="status"><p style="margin:0"><strong>Richtig!</strong> ${esc(k.loesung)}</p>${k.erklaerung ? `<p class="muted of-klein" style="margin:.4rem 0 0">${esc(k.erklaerung)}</p>` : ""}</div></article>`;
  if (status) return `<div class="card of-karte tag-karte tag-karte--fertig" data-tag-karte="${esc(k.id)}"><span><span class="tag-art">${titel}</span> ${status === "erledigt" ? `<span class="tag tag-ok of-plakette of-plakette--offline">erledigt</span>` : `<span class="muted of-klein">weggelegt</span>`}</span><button type="button" class="btn btn-sm of-btn of-btn--klein" data-tag="zurueck" data-tag-id="${esc(k.id)}">Zurückholen</button></div>`;
  const o = state.tag.offen[k.id] ?? {};
  const weg = `<button type="button" class="btn of-btn" data-tag="weg" data-tag-id="${esc(k.id)}">Weglegen</button>`;
  let inhaltHtml = "", knoepfe = "";
  if (k.art === "raetsel") {
    const feld = Array.isArray(k.antworten) && k.antworten.length && !o.loesung
      ? `<form class="tag-antwort" data-tag-pruefen="${esc(k.id)}" autocomplete="off"><label for="antwort-${esc(k.id)}">Deine Antwort</label><div class="tag-antwort-zeile"><input id="antwort-${esc(k.id)}" class="of-feld" name="antwort" type="text" enterkeyhint="done" autocapitalize="off" spellcheck="false" maxlength="120" value="${esc(o.eingabe ?? "")}" ${o.falsch ? 'aria-describedby="antwort-rm-' + esc(k.id) + '"' : ""}><button type="submit" class="btn of-btn">Prüfen</button></div>${o.falsch ? `<p class="tag-noch-nicht" id="antwort-rm-${esc(k.id)}" role="status">Noch nicht. Magst du einen Hinweis?</p>` : ""}</form>` : "";
    inhaltHtml = `<p class="tag-frage">${esc(k.frage)}</p>${feld}${o.hinweis && k.hinweis ? `<p class="tag-hinweis"><strong>Hinweis:</strong> ${esc(k.hinweis)}</p>` : ""}${o.loesung ? `<div class="tag-loesung"><p style="margin:0"><strong>Lösung:</strong> ${esc(k.loesung)}</p>${k.erklaerung ? `<p class="muted of-klein" style="margin:.4rem 0 0">${esc(k.erklaerung)}</p>` : ""}</div>` : ""}`;
    knoepfe = o.loesung ? `<button type="button" class="btn btn-primary of-btn of-btn--primaer" data-tag="erledigt" data-tag-id="${esc(k.id)}">Erledigt</button>`
      : `${k.hinweis && !o.hinweis ? `<button type="button" class="btn of-btn" data-tag="hinweis" data-tag-id="${esc(k.id)}">Hinweis</button>` : ""}<button type="button" class="btn btn-primary of-btn of-btn--primaer" data-tag="loesung" data-tag-id="${esc(k.id)}">Lösung zeigen</button>`;
  } else if (k.art === "kapitel") {
    const anriss = ersterAbsatz(k);
    inhaltHtml = `<h3 style="margin:.2rem 0 0">${esc(k.werk)}</h3><p class="muted of-klein" style="margin:.1rem 0 .6rem">${esc(k.autor)} · Teil ${k.teil} von ${k.teile}</p><p class="tag-anriss">${esc(anriss.length > 220 ? anriss.slice(0, 220).replace(/\s\S*$/, "") + " …" : anriss)}</p>`;
    knoepfe = `<a class="btn btn-primary of-btn of-btn--primaer" href="#kapitel" data-tag-lesen="${esc(k.id)}">Lesen</a>`;
  } else {
    const t = wesen.tipp(k.id.replace(/^lumi-/, "")) ?? { id: k.id.replace(/^lumi-/, ""), sorte: k.sorte, text: k.text };
    inhaltHtml = `<button type="button" class="tag-zu" data-tag="weg" data-tag-id="${esc(k.id)}" aria-label="Schließen ohne Bewertung">×</button><p class="tag-text">${esc(k.text)}</p>${tippKnoepfeHtml(t, { ort: "karte", gemerkt: wesen.imHeft(t.id), vorgemerkt: vorhaben().some((v) => v.tipp === t.id) })}`;
    return `<article class="card of-karte tag-karte tag-karte--lumi" data-tag-karte="${esc(k.id)}"><p class="tag-art">${titel}</p>${inhaltHtml}</article>`;
    knoepfe = `<button type="button" class="btn btn-primary of-btn of-btn--primaer" data-tag="erledigt" data-tag-id="${esc(k.id)}">Gelesen</button>`;
  }
  return `<article class="card of-karte tag-karte" data-tag-karte="${esc(k.id)}"><p class="tag-art">${titel}${k.art === "raetsel" && k.stufe ? ` <span class="muted of-klein">· ${esc(k.stufe)}</span>` : ""}</p>${inhaltHtml}<div class="tag-knoepfe">${knoepfe} ${weg}</div></article>`;
}
/** Einstellungen › Tagesplan (gesetzte Schicht), dazu was gelernt wurde. */
function tagesplanHtml() {
  const p = tagesplan(), g = speicher.get("tag-gelernt", {});
  const eingefroren = Object.keys(g.eingefroren ?? {}).filter((k) => g.eingefroren[k]);
  return `<details class="card of-karte" style="margin-bottom:1rem" id="tagesplan"><summary><strong>Tagesplan</strong> <span class="muted of-klein">· Karten, Schluss, Vorrat</span></summary>
    <div style="margin-top:.8rem" class="tagesplan">
      <fieldset><legend>Welche Karten</legend>${TAG_KARTEN.map((k) => `<label class="tagesplan-zeile"><input type="checkbox" data-tagesplan-karte="${k.id}" ${p.karten[k.id] && !k.spaeter ? "checked" : ""} ${k.spaeter ? "disabled" : ""}> ${esc(k.titel)}${k.spaeter ? ' <span class="muted of-klein">(kommt später)</span>' : ""}</label>`).join("")}</fieldset>
      <label class="tagesplan-zeile">Schluss: wenn alles erledigt ist, spätestens um<br><select class="of-select" data-tagesplan="schlussUm">${[20, 21, 22, 23].map((h) => `<option value="${h}" ${p.schlussUm === h ? "selected" : ""}>${h} Uhr</option>`).join("")}<option value="" ${p.schlussUm == null ? "selected" : ""}>keine Uhrzeit</option></select></label>
      <label class="tagesplan-zeile">Vorrat<br><select class="of-select" data-tagesplan="tiefe">${TIEFEN.map((t) => `<option value="${t}" ${p.tiefe === t ? "selected" : ""}>${t} Tage im Voraus laden</option>`).join("")}</select></label>
      <label class="tagesplan-zeile"><input type="checkbox" data-tagesplan="sparmodus" ${p.sparmodus ? "checked" : ""}> Sparmodus: Tagesseite ohne Bilder</label>
      ${eingefroren.length ? `<p class="muted of-klein">Fest eingestellt (zweimal zurückgenommen): ${eingefroren.map((a) => esc(TAG_KARTEN.find((k) => k.id === a)?.titel ?? a)).join(", ")}. <button type="button" class="btn btn-sm of-btn of-btn--klein" data-tag="gelernt-zuruecksetzen">Gelerntes zurücksetzen</button></p>` : ""}
    </div></details>`;
}
/** Vorratskammer: alte Monate wegräumen, fehlende nach der Vorratstiefe holen (nur Katalog, alles signiert). */
let vorratLaeuft = false, vorratKatalogGeholt = false;
async function vorratAuffuellen() {
  if (vorratLaeuft) return;
  vorratLaeuft = true;
  let geaendert = false;
  try {
    const d = heuteDatum(), start = tagStart(), plan = tagesplan();
    for (const x of tagesPakete()) if (bereichVorbei(x.bereich, d, start)) { try { await entferne(x.id); geaendert = true; } catch (e) { console.error("Vorratskammer", x.id, e); } }
    if (navigator.onLine) {
      let k = katalog();
      if (!vorratKatalogGeholt) { try { k = (await ladeKatalog()).katalog; vorratKatalogGeholt = true; } catch (e) { console.error("Vorratskammer: Katalog", e); } }
      for (const e of vorzuladen(k, tagesPakete(), d, plan.tiefe, start)) {
        if (!appPasst(e)) continue;
        try { await installiere(k, e); geaendert = true; } catch (err) { console.error("Vorratskammer", e.id, err); }
      }
    }
  } finally { vorratLaeuft = false; }
  if (geaendert && (location.hash || "#start") === "#start") render();
}
function vorlesenStop() { try { speechSynthesis.cancel(); } catch { /* egal */ } state.tag.liest = false; }
function tagAktion(b) {
  const a = b.dataset.tag, id = b.dataset.tagId;
  const karte = () => heutigeKarten().find((k) => k.id === id) ?? kartenFuer(tagesPakete(), heuteDatum(), tagStart()).find((k) => k.id === id);
  if (a === "hinweis" || a === "loesung") { state.tag.offen[id] = { ...(state.tag.offen[id] ?? {}), [a]: true }; return render(); }
  if (a === "erledigt" || a === "weg" || a === "gelesen") { const k = karte(); if (k) tagSetzen(k, a === "weg" ? "weg" : "erledigt"); vorlesenStop(); if (a === "gelesen") { location.hash = "#start"; return; } return render(); }
  if (a === "zurueck") { const k = karte(); if (k) tagSetzen(k, null); state.tag.nochmal = false; return render(); }
  if (a === "nochmal") { state.tag.nochmal = true; return render(); }
  if (a === "vorlesen") {
    if (state.tag.liest) { vorlesenStop(); return render(); }
    const k = karte(); if (!k) return;
    try {
      speechSynthesis.cancel();
      const teile = k.absaetze.map((x) => x.replace(/^## /, ""));
      teile.forEach((t, i) => { const u = new SpeechSynthesisUtterance(t); u.lang = "de-AT"; if (i === teile.length - 1) u.onend = () => { state.tag.liest = false; if (location.hash === "#kapitel") render(); }; speechSynthesis.speak(u); });
      state.tag.liest = true;
    } catch { state.tag.liest = false; }
    return render();
  }
  const g = speicher.get("tag-gelernt", { eingefroren: {}, zurueck: {}, ruheBis: {} });
  if (a === "lern-zurueck" && g.hinweis) {
    const art = g.hinweis.art, p = tagesplan();
    p.karten[art] = true; planSpeichern(p);
    g.zurueck = { ...(g.zurueck ?? {}), [art]: (g.zurueck?.[art] ?? 0) + 1 };
    if (g.zurueck[art] >= 2) g.eingefroren = { ...(g.eingefroren ?? {}), [art]: true };
    else g.ruheBis = { ...(g.ruheBis ?? {}), [art]: plusTage(heuteDatum(), 7) };
    delete g.hinweis; speicher.set("tag-gelernt", g); return render();
  }
  if (a === "lern-ok") { delete g.hinweis; speicher.set("tag-gelernt", g); return render(); }
  if (a === "gelernt-zuruecksetzen") { speicher.set("tag-gelernt", { eingefroren: {}, zurueck: {}, ruheBis: {}, geprueft: heuteDatum() }); return render(); }
}
/** Datumswechsel bei offener App und Schluss um die eingestellte Uhrzeit: jede Minute nachsehen. */
setInterval(() => {
  const d = heuteDatum();
  if (d !== state.tag.datum) { const erster = state.tag.datum === null; state.tag = { offen: {}, nochmal: false, datum: d, liest: false, lesen: null, schlussGezeigt: null }; if (!erster) { vorratAuffuellen(); if ((location.hash || "#start") === "#start") render(); } return; }
  if ((location.hash || "#start") === "#start" && !state.tag.nochmal) {
    const s = schlussErreicht({ karten: heutigeKarten(), zustand: tagZustand(d), jetzt: testJetzt(), plan: tagesplan() });
    if (s !== state.tag.schlussGezeigt) render();
  }
}, 60000);
state.tag.datum = heuteDatum();

// ---------- Seiten ----------
const seiten = {
  /** Die Tagesseite (Startbildschirm): Bereit und Lumi, die Karten des Tages, der Vorrat. Endlich: „Das war dein Tag.“ */
  start() {
    const p = P();
    if (!p) return fehlt();
    const b = bereit(); wesen.setScore(b); const schritt = naechsterSchritt(b);
    const plan = tagesplan(), d = heuteDatum();
    tagLernenPruefen();
    const karten = heutigeKarten(), zustand = tagZustand(d);
    const schluss = state.tag.nochmal ? null : schlussErreicht({ karten, zustand, jetzt: testJetzt(), plan });
    state.tag.schlussGezeigt = schluss;
    const pakete = tagesPakete(), vorrat = vorratTage(pakete, d, tagStart());
    const g = speicher.get("tag-gelernt", {});
    const datumText = new Date(testJetzt()).toLocaleDateString("de-AT", { weekday: "long", day: "numeric", month: "long" });
    return `
      <div class="gruss of-gruss"><div><h1>Servus.</h1><p class="muted of-klein">${esc(datumText)}</p></div></div>
      ${pauseKarteHtml()}
      <div class="buehne-kopf" id="wesen-karte">
        ${wesen.mitFigur() && !plan.sparmodus ? wesen.buehneHtml() : ""}
        <div class="bereit-kopf">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:1rem"><span class="muted of-klein">Bereit</span><span class="muted of-klein" style="font-size:.85rem">${b.wert < 30 ? "Anfang" : b.wert < 60 ? "unterwegs" : b.wert < 80 ? "gut" : "bereit"}</span></div>
          <div class="bereit-zahl">${b.wert}</div>
          <div class="progress of-balken" style="margin:.4rem 0 .8rem"><div style="width:${b.wert}%"></div></div>
          ${b.sockel ? `<p class="muted of-klein" id="bereit-sockel" style="margin:0 0 .4rem">Aus der Vorversion übernommen. Neu sind Familie, Nachbar, Anlaufstelle und Kocher. Bestätigt, trägt sich die Zahl selbst (jetzt ${b.eigen}).</p>` : ""}
          <p style="margin:0 0 .3rem"><a href="${schritt.ziel}">${esc(schritt.text)}</a></p>
          <p class="of-klein" style="margin:0"><a href="#uebersicht">Alles zur Bereitschaft</a></p>
        </div>
      </div>
      ${testLeiste()}
      ${einladungFaellig(wesen.start, wesen.e, testJetzt()) ? `<div class="card lumi-einladung of-karte" role="group" aria-label="Einladung"><div class="lumi-zwei-lichter" aria-hidden="true"><span></span><span></span></div>
        <div><strong>${esc(LUMI_TEXTE.einladungTitel)}</strong><p style="margin:.3rem 0 .7rem">${esc(LUMI_TEXTE.einladungFrage)}</p>
        <button type="button" class="btn btn-primary of-btn of-btn--primaer" data-lumi="einladung-ja">${esc(LUMI_TEXTE.einladungJa)}</button> <button type="button" class="btn of-btn" data-lumi="einladung-nein">${esc(LUMI_TEXTE.einladungNein)}</button>
        <p class="lumi-einladung-klein">${esc(LUMI_TEXTE.einladungHinweis)} ${esc(LUMI_TEXTE.ki)}</p></div></div>` : ""}
      ${g.hinweis ? `<div class="card of-karte tag-gelernt" role="status"><p style="margin:0 0 .6rem">${esc(g.hinweis.text)}</p><button type="button" class="btn btn-sm of-btn of-btn--klein" data-tag="lern-zurueck">Rückgängig</button> <button type="button" class="btn btn-sm of-btn of-btn--klein" data-tag="lern-ok">In Ordnung</button></div>` : ""}
      ${(() => { if (!pauseE().an || !pauseDaten()) return ""; const t = rueckspiegel(spielLog(), pauseL(), speicher.get("pause", null), testJetzt(), pauseDaten().formen); return t ? `<div class="card of-karte pause-rueckspiegel" role="status"><p class="muted of-klein" style="margin:0 0 .3rem">⏸ Pause · Rückspiegel</p><p style="margin:0 0 .6rem">${esc(t)}</p><button type="button" class="btn btn-sm of-btn of-btn--klein" data-pause="rueckspiegel-ok">Schön</button></div>` : ""; })()}
      <section class="tag-karten" aria-label="Heute">
        ${schluss ? `${karten.filter((k) => k.art === "raetsel" && zustand[k.id] === "erledigt" && state.tag.offen[k.id]?.richtig).map((k) => tagKarteHtml(k, "erledigt")).join("")}<div class="card of-karte tag-schluss" role="status"><p class="tag-schluss-satz">${esc(SCHLUSS)}</p>${karten.length ? `<button type="button" class="btn btn-sm of-btn of-btn--klein" data-tag="nochmal">Heute noch einmal ansehen</button>` : ""}</div>`
          : karten.length ? karten.map((k) => tagKarteHtml(k, zustand[k.id])).join("")
          : `<div class="card of-karte tag-leer"><p style="margin:0">${pakete.length ? "Für heute liegt nichts in der Vorratskammer." : "Die Vorratskammer ist noch leer."} ${navigator.onLine ? "OFFLINE holt die nächsten Tage, sobald der Katalog sie hat." : "Sobald du wieder online bist, holt OFFLINE die nächsten Tage."} Alles andere funktioniert weiter.</p></div>`}
      </section>
      <p class="tag-vorrat muted of-klein">${vorrat ? `Vorrat: noch ${vorrat} ${vorrat === 1 ? "Tag" : "Tage"}${!navigator.onLine ? " · ohne Netz geht es weiter" : ""}` : `Vorrat: leer. ${navigator.onLine ? "Die nächsten Tage kommen, sobald der Katalog sie hat." : "Sobald du wieder online bist, holt OFFLINE die nächsten Tage."}`}</p>`;
  },

  /** Der Raum „Pause“: Vorschlag, alle Formen zum Wählen, Deine Linie und Einstellungen; beim ersten Mal das Einschalten. */
  pause() { return pauseRaumHtml(); },
  /** Ein laufender Happen (Fokus-Bildschirm). render() baut ihn selbst ein; ohne laufenden Happen geht es in den Raum. */
  happen() { return ""; },
  /** Pause › Deine Linie */
  linie() { return linieHtml(); },
  /** Das Lumi-Buch: Titelseite, Anteil, Kapitel mit Lücken, Vorlesen. */
  buch() { return buchHtml(); },
  /** Ein Absatz aus dem Lumi-Buch: ruhige Leseansicht, nur ✕ und „Zurück“. */
  absatz() { return absatzHtml(); },

  /** Heft „Was Lumi gesagt hat“: gemerkte Sätze, ohne Netz durchsuchbar, einzeln löschbar. */
  heft() {
    return `${kopf(`Was ${esc(wesen.anzeigename())} gesagt hat`, "Die Sätze, die du dir gemerkt hast. Sie bleiben auf diesem Gerät.")}
      <p style="margin:0 0 1rem"><a href="#uebersicht">‹ Übersicht</a></p>
      ${wesen.heft.length ? `<label for="heft-suche" class="of-klein">Im Heft suchen</label><br><input class="of-input" type="search" id="heft-suche" value="${esc(state.heftSuche ?? "")}" autocomplete="off" style="margin:.3rem 0 1rem;max-width:28rem;width:100%">` : ""}
      <div class="card of-karte" id="heft-liste">${wesen.heftHtml(state.heftSuche ?? "")}</div>`;
  },

  /** Was ist neu: alle Versionen, neueste oben, in Alltagssprache. */
  neues() {
    if (!state.neues) { neuesLaden(); return `${kopf("Was ist neu", "Einen Moment …")}`; }
    speicher.set("neues-gesehen", appVersion());
    const v = state.neues.versionen ?? [];
    const datumText = (d) => new Date(d + "T12:00:00").toLocaleDateString("de-AT", { day: "numeric", month: "long", year: "numeric" });
    return `<div class="kapitel-kopf"><a class="btn btn-sm of-btn of-btn--klein" href="#updates">‹ Updates &amp; Abo</a></div>
      <article class="neues-seite">
        <h1>Was ist neu</h1>
        <p class="muted">Du hast Version ${esc(appVersion())}.</p>
        ${state.neues.fehler ? `<p>Die Liste lässt sich gerade nicht lesen.</p>` : ""}
        ${v.map((x) => `<section class="card of-karte neues-version"><h2>${esc(x.titel ?? `Version ${x.version}`)}</h2><p class="muted of-klein">${esc(datumText(x.datum))}</p>
          <ul>${x.punkte.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></section>`).join("")}
      </article>`;
  },

  /** Das Kapitel des Tages zum Lesen, mit Vorlesen. */
  kapitel() {
    const k = heutigeKarten().find((x) => x.art === "kapitel") ?? (state.tag.lesen && kartenFuer(tagesPakete(), heuteDatum(), tagStart()).find((x) => x.id === state.tag.lesen));
    if (!k) return `${kopf("Roman der Woche", "Heute ist kein Kapitel da.")}<a class="btn of-btn" href="#start">Zur Tagesseite</a>`;
    const status = tagZustand(heuteDatum())[k.id];
    return `<div class="kapitel-kopf"><a class="btn btn-sm of-btn of-btn--klein" href="#start">‹ Heute</a><button type="button" class="btn btn-sm of-btn of-btn--klein" data-tag="vorlesen" data-tag-id="${esc(k.id)}">${state.tag.liest ? "Anhalten" : "Vorlesen"}</button></div>
      <article class="kapitel-text" lang="de">
        <p class="tag-art">Roman der Woche · Teil ${k.teil} von ${k.teile}</p>
        <h1>${esc(k.werk)}</h1><p class="muted">${esc(k.autor)}</p>
        ${k.absaetze.map((a) => a.startsWith("## ") ? `<h2>${esc(a.slice(3))}</h2>` : a.includes("\n") ? `<p class="vers">${esc(a).replace(/\n/g, "<br>")}</p>` : `<p>${esc(a)}</p>`).join("")}
        <div class="tag-knoepfe">${status === "erledigt" ? `<span class="tag tag-ok of-plakette of-plakette--offline">Gelesen</span>` : `<button type="button" class="btn btn-primary of-btn of-btn--primaer" data-tag="gelesen" data-tag-id="${esc(k.id)}">Gelesen</button>`} <a class="btn of-btn" href="#start">Zur Tagesseite</a></div>
        <p class="muted of-klein kapitel-quelle">Vorlage: ${esc(k.quelle.vorlage)}. Text von Wikisource (${esc(k.quelle.url)}). Gemeinfrei.</p>
      </article>`;
  },

  uebersicht() {
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
    const b = bereit(); wesen.setScore(b); const schritt = naechsterSchritt(b);
    const wl = state.wesenLog;
    return `
      <div class="gruss of-gruss"><div><h1>Übersicht</h1><p class="muted of-klein">Alles hier funktioniert ohne Internet.</p></div>
        <select class="of-select" id="bl" aria-label="Dein Bundesland">${laender.map((b) => `<option ${b.name === state.bundesland ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select></div>
      <div class="card of-karte bereit-kopf" style="margin-bottom:1rem">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:1rem"><span class="muted of-klein">Bereit</span><span class="muted of-klein" style="font-size:.85rem">${b.wert < 30 ? "Anfang" : b.wert < 60 ? "unterwegs" : b.wert < 80 ? "gut" : "bereit"}</span></div>
        <div class="bereit-zahl">${b.wert}</div>
        <div class="progress of-balken" style="margin:.4rem 0 .8rem"><div style="width:${b.wert}%"></div></div>
        <p style="margin:0 0 .6rem"><a href="${schritt.ziel}">${esc(schritt.text)}</a></p>
        ${b.quellen.map((q) => `<div class="bereit-quelle"><span>${esc(q.name)} <span class="muted of-klein">· ${esc(q.text)}</span></span><span class="mono of-mono">${q.punkte}/${q.max}</span></div>`).join("")}
      </div>
      <div class="kacheln">
        ${kachel("notfall", "rose", "Notfall", "112 · 122 · 133 · 144, Sirenen")}
        ${kachel("vorsorge", "moos", "Vorsorge", `${erledigt} von ${gesamt} erledigt`)}
        ${kachel("bibliothek", "eisblau", "Bibliothek", `${installierte.length} Paket${installierte.length === 1 ? "" : "e"} am Gerät`)}
        ${kachel("werkzeuge", "flieder", "Werkzeuge", "Radio, Sonne, Vorrat")}
      </div>
      ${b.hinweis ? `<div class="card of-karte" style="margin-bottom:1rem"><strong>${esc(b.hinweis)}</strong></div>` : ""}
      <div class="card of-karte" style="margin-bottom:1rem"><h3>Menschen und Können</h3><p class="muted of-klein" style="margin:.2rem 0 .4rem">Dinge, die verfallen. Einmal bestätigen, dann ist Ruhe, bis es wieder so weit ist.${b.faellig.some((x) => x.check) ? " Fällige Punkte der Checkliste stehen darunter." : ""}</p>
        ${b.positionen.filter((x) => (!x.check && !x.auto) || (x.check && x.stand === "faellig")).map((x) => `<div class="bestaetigung of-liste__zeile"><span><strong>${esc(x.titel)}</strong><br><span class="muted of-klein">${x.stand === "gut" ? `gültig noch ${x.rest} Tage` : x.stand === "faellig" ? `<span class="tag tag-warn of-plakette of-plakette--warnung">fällig</span> seit ${-x.rest} Tagen` : esc(x.hinweis ?? "")}</span></span><button class="btn btn-sm of-btn of-btn--klein" data-bestaetigen="${x.id}">${x.stand === "gut" ? "Erneut bestätigen" : "Bestätigen"}</button></div>`).join("")}
      </div>
      ${tagesplanHtml()}
      <a class="card of-karte pause-zeile" href="#pause" style="margin-bottom:1rem"><strong>⏸ Pause</strong> <span class="muted of-klein">· ${pauseE().an ? `ein · Appetit ${esc(pauseE().appetit)}` : "aus"} · Happen für zwischendurch, jetzt mit eigenem Raum</span></a>
      <details class="card of-karte" id="lumi-einstellungen" style="margin-bottom:1rem" ${wesen.ausschaltenFrage ? "open" : ""}><summary><strong>Lumi</strong> <span class="muted of-klein">· ${wesen.mitFigur() ? `${esc(wesen.anzeigename())} · Einstellungen` : wesen.aktiv() ? "Textkarten" : "Tipps aus"}</span></summary><div style="margin-top:.8rem">${wesen.einstellungenHtml()}</div></details>
      ${buchDaten() && wesen.mitFigur() ? `<a class="card of-karte buch-zeile" href="#buch" style="margin-bottom:1rem"><strong>Das Lumi-Buch</strong> <span class="muted of-klein">· Band ${buchDaten().band} · ${buchAnteil(buchDaten(), buchFrei())} % lesbar</span></a>` : ""}
      ${wesen.aktiv() || wesen.log.length ? `<details class="card of-karte" id="lumi-log" style="margin-bottom:1rem" ${wl.filter || wl.suche ? "open" : ""}><summary><strong>${wesen.mitFigur() ? `Alles, was ${esc(wesen.anzeigename())} gesagt hat` : "Bisherige Tipps"}</strong> <span class="muted of-klein" id="wesen-log-zahl">· ${wesen.log.length}</span></summary><div style="margin-top:.8rem" id="wesen-log">${wesen.logHtml(wl.filter, wl.suche)}</div></details>` : ""}
      ${updates ? `<a class="card of-karte" href="#updates" style="text-decoration:none;display:block;margin-bottom:1rem"><span class="tag tag-warn of-plakette of-plakette--warnung">${updates} Update${updates > 1 ? "s" : ""} verfügbar</span> <span class="muted of-klein">· ${intervallText()}</span></a>` : ""}
      ${land ? `<div class="card of-karte" style="margin-top:0"><strong>${esc(land.name)}</strong> <span class="muted of-klein">· Landeshauptstadt ${esc(land.hauptstadt)} · im Krisenfall informiert <strong>${esc(land.orf_radio)}</strong></span></div>` : ""}
      <h2 style="margin-top:2rem">Installiert</h2>
      <div class="card of-karte">
        <div class="storage"><strong>${groesse(belegt)}</strong><div class="progress of-balken"><div style="width:${Math.min(100, (belegt / 64e9) * 100)}%"></div></div><span class="muted of-klein">${desktop ? esc(desktop.datenordner) : "von 64 GB auf „OFFLINE-Stick“"}</span></div>
        <ul class="changelog" style="margin-top:.75rem">${installierte.map((x) =>
          `<li><span class="tag of-plakette">${esc(ARTEN[x.manifest.art] ?? x.manifest.art)}</span><span>${esc(x.manifest.titel)} <span class="muted of-klein">· ${esc(x.manifest.version)} · ${groesse(x.manifest.groesse)} · Signatur geprüft ✓</span></span></li>`).join("")}</ul>
        <a class="btn btn-sm of-btn of-btn--klein" href="#bibliothek" style="margin-top:.75rem">Pakete verwalten</a>
      </div>`;
  },

  notfall() {
    const n = D("notrufe"), s = D("sirenen");
    if (!n || !s) return fehlt();
    const welle = { konstant: "M2 22 H298", heulend: "M2 22 " + Array.from({ length: 6 }, (_, i) => `Q${27 + i * 50} ${i % 2 ? 42 : 2} ${52 + i * 50} 22`).join(" ") };
    return `
      ${kopf("Notfall", "Tippe auf eine Nummer, um anzurufen.")}
      <div class="grid grid-2">${n.eintraege.map((e) => `
        <div class="card notruf of-karte"><a class="notruf-nr ${e.nr.length > 4 ? "long" : ""}" href="tel:${e.nr.replace(/\s/g, "")}">${esc(e.nr)}</a>
          <div><h3>${esc(e.name)}</h3><p>${esc(e.info)}</p></div></div>`).join("")}
      </div>
      <p class="muted of-klein" style="margin-top:1rem">${esc(n.hinweis)}</p>
      <h2 style="margin-top:2rem">Sirenensignale</h2>
      <p class="muted of-klein">${esc(s.einleitung)}</p>
      <div class="grid grid-3">${s.signale.map((x) => `
        <div class="card siren of-karte"><h3>${esc(x.name)} <span class="muted of-klein" style="font-weight:500;font-size:.9rem">– ${esc(x.bedeutung)}</span></h3>
          <svg viewBox="0 0 300 44" preserveAspectRatio="none" aria-hidden="true"><path d="${welle[x.muster]}"/></svg>
          <p><strong>${esc(x.dauer)}</strong></p><p class="muted of-klein" style="margin:0">${esc(x.tun)}</p></div>`).join("")}
      </div>
      <div class="card of-karte" style="margin-top:1rem"><p class="muted of-klein" style="margin:0 0 .5rem">${esc(s.probe)}</p><p class="muted of-klein" style="margin:0 0 .5rem">${esc(s.feuerwehr)}</p><p class="muted of-klein" style="margin:0">${esc(s.warn_app)}</p></div>`;
  },

  vorsorge() {
    const v = D("vorsorge"), b = D("blackout");
    if (!v || !b) return fehlt();
    const gesamt = v.gruppen.reduce((s, g) => s + g.punkte.length, 0);
    const erledigt = Object.values(state.checks).filter(Boolean).length;
    const bereitStand = bereit(), vh = vorhaben();
    const vorhabenHtml = vh.length ? `<div class="card of-karte vorhaben" id="vorhaben" style="margin-bottom:1rem"><h3 style="margin-top:0">Vorhaben</h3>
      <p class="muted of-klein" style="margin:0 0 .6rem">Was du dir nach einem Satz von ${esc(wesen.anzeigename())} vorgenommen hast. Eine Erinnerung für dich, sie ändert die Bereit-Zahl nicht.</p>
      <ul class="check">${vh.map((v) => `<li><label><input type="checkbox" data-vorhaben="${esc(v.id)}" ${v.erledigt ? "checked" : ""}><span>${esc(v.text)}</span></label> <button type="button" class="btn btn-sm of-btn of-btn--klein" data-vorhaben-weg="${esc(v.id)}" aria-label="Vorhaben löschen">Löschen</button></li>`).join("")}</ul></div>` : "";
    return `
      ${kopf("Blackout-Vorsorge", esc(v.einleitung), `<div style="min-width:220px"><div class="muted of-klein" style="font-size:.9rem;margin-bottom:.3rem">${erledigt} von ${gesamt} erledigt</div><div class="progress of-balken"><div style="width:${(erledigt / gesamt) * 100}%"></div></div></div>`)}
      ${vorhabenHtml}<div class="grid grid-2">${v.gruppen.map((g, gi) => `
        <div class="card of-karte"><h3>${esc(g.gruppe)}</h3><ul class="check">${g.punkte.map((p, pi) => {
          const id = `${gi}-${pi}`;
          const pos = bereitStand.positionen.find((x) => x.check === id);
          return `<li><label><input type="checkbox" data-check="${id}" ${state.checks[id] ? "checked" : ""}><span>${esc(p)}${pos?.stand === "faellig" ? ` <span class="tag tag-warn of-plakette of-plakette--warnung">fällig</span>` : ""}</span></label>${pos?.stand === "faellig" ? ` <button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-bestaetigen="${pos.id}">Erneuert</button>` : ""}</li>`;
        }).join("")}</ul></div>`).join("")}
      </div>
      <h2 style="margin-top:2rem">Wenn der Strom ausfällt</h2>
      <p class="muted of-klein">${esc(b.einleitung)}</p>
      <div class="card of-karte"><ol class="timeline">${b.ablauf.map((s) => `<li><h3>${esc(s.t)}</h3><p class="muted of-klein" style="margin:0">${esc(s.text)}</p></li>`).join("")}</ol></div>
      <div class="card of-karte" style="margin-top:1rem;border-color:var(--accent)"><ul style="margin:0;padding-left:1.1rem">${b.merksaetze.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>
      <p class="muted of-klein" style="margin-top:1rem;font-size:.9rem">Quellen: ${(P()?.manifest.quellen ?? []).map((q) => `<a href="${esc(q.url)}" rel="noopener">${esc(q.name)}</a>`).join(" · ")}</p>`;
  },

  tresor() {
    const t = state.tresor;
    const hinweis = `<p class="muted of-klein" style="margin:.5rem 0 0">Nur du kennst dieses Passwort. Wir können es nicht zurücksetzen, weil wir keinen Zugang zu deinem Tresor haben. Wenn du Passwort <em>und</em> Wiederherstellungscode verlierst, kann niemand den Inhalt wiederherstellen, auch wir nicht.</p>`;
    if (!desktop) return `${kopf("Tresor", "Verschlüsselter Bereich für Notfallmappe, Passwörter, PINs und Ausweisscans.")}
      <div class="card of-karte"><p>Der Tresor gibt es nur in der <strong>Desktop-App</strong>: Die Verschlüsselung läuft dort im Rust-Kern, der Schlüssel liegt nie im Browser. Im Web-Prototyp bleibt er deshalb aus.</p><a class="btn btn-primary of-btn of-btn--primaer" href="/#download">Desktop-App holen</a></div>`;
    if (t.status === null) return `${kopf("Tresor", "Einen Moment …")}`;
    const msg = `<p class="form-msg of-meldung ${t.msgArt ?? ""}" id="tresor-msg">${t.msg ?? ""}</p>`;

    if (t.status === "kein") return `${kopf("Tresor", "Verschlüsselter Bereich für Notfallmappe, Passwörter, PINs und Ausweisscans. Verlässt das Gerät nie unverschlüsselt – wir haben keinen Schlüssel.")}
      <div class="tresor"><div class="card of-karte" style="grid-column:1 / -1;max-width:560px">
        <h3>Tresor anlegen</h3>
        <label>Passwort (mindestens 8 Zeichen, nicht dasselbe wie für das Gerät)<br><input class="of-input" type="password" id="tresor-pw1" autocomplete="new-password"></label>
        <label style="display:block;margin-top:.6rem">Noch einmal<br><input class="of-input" type="password" id="tresor-pw2" autocomplete="new-password"></label>
        ${hinweis}
        <div style="margin-top:1rem"><button class="btn btn-primary of-btn of-btn--primaer" data-tresor-anlegen>Tresor anlegen</button></div>${msg}
      </div></div>`;

    if (t.status === "code") return `${kopf("Tresor", "Dein Wiederherstellungscode – er wird nur jetzt angezeigt.")}
      <div class="tresor"><div class="card of-karte" style="grid-column:1 / -1;max-width:640px">
        <div class="warnkasten"><strong>Druck diesen Code aus oder schreib ihn ab</strong> und leg ihn an einen sicheren Ort, getrennt vom Gerät. Mit ihm kommst du in den Tresor, wenn du das Passwort vergisst. Er wird nur jetzt angezeigt.</div>
        <div class="code-anzeige">${esc(t.code)}</div>
        <p class="muted of-klein">Zur Sicherheit: Trag vier der sechs Gruppen ein, damit wir wissen, dass du ihn hast.</p>
        <div class="code-gruppen">${t.code.split("-").map((g, i) => t.codeGruppen.includes(i) ? `<input class="of-input" type="text" data-code-gruppe="${i}" maxlength="5" autocomplete="off" spellcheck="false">` : `<span>${esc(g)}</span>`).join('<span class="muted of-klein">–</span>')}</div>
        <div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-primary of-btn of-btn--primaer" data-tresor-code-ok>Ich habe den Code gesichert</button><button class="btn of-btn" data-tresor-code-kopieren>Kopieren (30 s)</button></div>${msg}
      </div></div>`;

    if (t.status === "gesperrt") return `${kopf("Tresor", "Gesperrt.", '<span class="tag of-plakette">Gesperrt</span>')}
      <div class="tresor"><div class="card of-karte" style="grid-column:1 / -1;max-width:560px">
        <label>Passwort<br><input class="of-input" type="password" id="tresor-pw" autocomplete="current-password"></label>
        <div style="margin-top:.8rem;display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-primary of-btn of-btn--primaer" data-tresor-oeffnen>Öffnen</button><button class="btn of-btn" data-tresor-code-modus>${t.codeModus ? "Doch mit Passwort" : "Mit Wiederherstellungscode"}</button></div>
        ${t.codeModus ? `<label style="display:block;margin-top:1rem">Wiederherstellungscode (6 Gruppen)<br><input class="of-input" type="text" id="tresor-code" autocomplete="off" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"></label><div style="margin-top:.6rem"><button class="btn btn-primary of-btn of-btn--primaer" data-tresor-oeffnen-code>Mit Code öffnen</button> <span class="muted of-klein">Danach gleich ein neues Passwort setzen.</span></div>` : ""}
        ${msg}
        <details style="margin-top:1.2rem"><summary class="muted of-klein">Sicherung zurückspielen</summary><p class="muted of-klein">Ersetzt den Tresor auf diesem Gerät durch eine Sicherung (Ordner „OFFLINE-Tresor-Sicherung“ vom Stick). Das Passwort der Sicherung gilt dann.</p><button class="btn btn-sm of-btn of-btn--klein" data-tresor-zurueckspielen>Sicherung wählen …</button></details>
      </div></div>`;

    // offen
    const q = t.suche.trim().toLowerCase();
    const liste = t.notizen.filter((n) => !q || n.titel.toLowerCase().includes(q) || n.text.toLowerCase().includes(q));
    const n = t.notizen.find((x) => x.id === t.aktiv) ?? null;
    const v = t.vorschau;
    return `${kopf("Tresor", `Offen · sperrt nach ${t.sperreMin} Min. ohne Eingabe, beim Minimieren und beim Beenden.`, '<span style="display:flex;gap:.5rem"><button class="btn btn-sm of-btn of-btn--klein" data-tresor-einstellungen>Einstellungen</button><button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-tresor-sperren>Sperren</button></span>')}
      ${t.einstellungen ? `<div class="card of-karte" style="margin-bottom:1rem"><h3>Einstellungen</h3>
        <div class="grid grid-3">
          <div><label>Automatisch sperren nach<br><select class="of-select" id="tresor-sperre"><option value="1" ${t.sperreMin == 1 ? "selected" : ""}>1 Minute</option><option value="5" ${t.sperreMin == 5 ? "selected" : ""}>5 Minuten</option><option value="15" ${t.sperreMin == 15 ? "selected" : ""}>15 Minuten</option></select></label></div>
          <div><label>Passwort ändern<br><input class="of-input" type="password" id="tresor-alt" placeholder="bisheriges" autocomplete="current-password"></label><input class="of-input" type="password" id="tresor-neu" placeholder="neues (min. 8)" autocomplete="new-password" style="margin-top:.4rem"><button class="btn btn-sm of-btn of-btn--klein" data-tresor-pw-aendern style="margin-top:.4rem">Ändern</button></div>
          <div><label>Neuer Wiederherstellungscode<br><input class="of-input" type="password" id="tresor-pw-code" placeholder="Passwort zur Bestätigung"></label><button class="btn btn-sm of-btn of-btn--klein" data-tresor-code-neu style="margin-top:.4rem">Code erneuern</button><p class="muted of-klein" style="margin:.3rem 0 0;font-size:.85rem">Der alte Code gilt danach nicht mehr.</p></div>
        </div>
        <div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-sm of-btn of-btn--klein" data-tresor-sichern>Sicherung auf Stick oder Ordner …</button><span class="muted of-klein" style="align-self:center">Nur Verschlüsseltes wird kopiert.</span></div>${msg}</div>` : ""}
      <div class="tresor">
        <div class="card of-karte">
          <input class="of-input" type="text" id="tresor-suche" placeholder="Suchen …" value="${esc(t.suche)}" autocomplete="off">
          <div style="display:flex;gap:.4rem;margin:.6rem 0;flex-wrap:wrap"><button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-tresor-neu>Neue Notiz</button><button class="btn btn-sm of-btn of-btn--klein" data-tresor-mappe title="Zehn Abschnitte: Personen, Nummern, Treffpunkte, Dokumente, Versicherungen, Geld, Zugänge, Haus, Tiere, Radio">Notfallmappe anlegen</button></div>
          <div class="tresor-liste">${liste.length ? liste.map((x) => `<button data-tresor-notiz="${esc(x.id)}" aria-current="${x.id === t.aktiv}">${x.reihe ? `${x.reihe}. ` : ""}${esc(x.titel || "Ohne Titel")}<span class="muted of-klein">${x.anhaenge.length ? `${x.anhaenge.length} Anhang${x.anhaenge.length > 1 ? "e" : ""} · ` : ""}${datum(x.geaendert)}</span></button>`).join("") : `<p class="muted of-klein" style="padding:.5rem .7rem">${t.notizen.length ? "Nichts gefunden." : "Noch leer. Leg die Notfallmappe an oder eine neue Notiz."}</p>`}</div>
        </div>
        <div class="card of-karte">${n ? `
          <input type="text" class="titel" id="tresor-titel" value="${esc(n.titel)}" placeholder="Titel" autocomplete="off">
          <textarea class="of-textarea" id="tresor-text" placeholder="Inhalt – bleibt verschlüsselt auf diesem Gerät" style="margin-top:.6rem">${esc(n.text)}</textarea>
          <div style="display:flex;justify-content:space-between;gap:.5rem;margin-top:.6rem;flex-wrap:wrap"><span class="muted of-klein" id="tresor-gespeichert">Geändert ${datum(n.geaendert)}</span><span>${aufnahmeKnopf()} <button class="btn btn-sm of-btn of-btn--klein" data-tresor-anhang>Foto oder Datei …</button> <button class="btn btn-sm of-btn of-btn--klein" data-tresor-notiz-loeschen="${esc(n.id)}">Notiz löschen</button></span></div>
          ${n.anhaenge.length ? `<div style="margin-top:.8rem"><strong>Anhänge</strong>${n.anhaenge.map((a) => anhangZeile(a, v?.id === a.id, "tresor")).join("")}</div>` : ""}
          ${v && n.anhaenge.some((a) => a.id === v.id) ? `<div class="anhang-vorschau" style="margin-top:.8rem">${vorschauHtml(v)}</div>` : ""}
          ${t.einstellungen ? "" : msg}` : `<p class="muted of-klein">Links eine Notiz wählen oder eine neue anlegen.</p>${t.einstellungen ? "" : msg}`}
        </div>
      </div>`;
  },

  lesen() {
    const l = state.lesen;
    if (!l) return `${kopf("Lesen", "Nichts geöffnet.")}<div class="card of-karte"><a class="btn btn-primary of-btn of-btn--primaer" href="#bibliothek">Zur Bibliothek</a></div>`;
    return `<div class="lesen-kopf"><a class="btn btn-sm of-btn of-btn--klein" href="#bibliothek">‹ Bibliothek</a><strong>${esc(l.titel)}</strong>
        <span style="margin-left:auto;display:flex;gap:.4rem"><button class="btn btn-sm of-btn of-btn--klein" data-lesen-zurueck title="Eine Seite zurück">‹</button><button class="btn btn-sm of-btn of-btn--klein" data-lesen-start title="Zur Startseite der Bibliothek">Start</button><button class="btn btn-sm of-btn of-btn--klein" data-lesen-fenster>In eigenem Fenster</button></span></div>
      <iframe id="lesen-rahmen" class="lesen-rahmen" src="${esc(l.url)}" title="${esc(l.titel)}"></iframe>`;
  },

  werkzeuge() {
    const w = state.werkzeug;
    const laender = inhalt(P(), "inhalt/bundeslaender.json")?.laender ?? [];
    const land = laender.find((l) => l.name === state.bundesland);
    const koord = HAUPTSTAEDTE[state.bundesland] ?? HAUPTSTAEDTE.Wien;
    const d = w.datum ? new Date(w.datum + "T12:00:00") : new Date();
    const sz = sonnenzeiten(koord[0], koord[1], d);
    const mond = mondphase(d);
    const r = w.rechner; const art = EINHEITEN[r.art]; const einh = Object.keys(art.e);
    const von = einh.includes(r.von) ? r.von : einh[0], nach = einh.includes(r.nach) ? r.nach : einh[1];
    const erg = umrechnen(r.art, parseFloat(String(r.wert).replace(",", ".")), von, nach);
    const radio = w.radio[state.bundesland] ?? {};
    const sender = [["oe1", "Ö1"], ["oe2", land?.orf_radio ?? "ORF-Regionalradio"], ["oe3", "Ö3 (Verkehrs- und Krisenfunk)"]];
    const v = w.vorrat; const wasser = v.personen * v.tage * 2, essen = v.personen * v.tage;
    return `${kopf("Werkzeuge", "Radio, Sonne und Mond, Rechner – alles ohne Netz.", `<div class="switch of-liste__zeile" style="border:0;padding:0"><label class="muted of-klein" for="bl2">Bundesland</label><select class="of-select" id="bl2">${laender.map((b) => `<option ${b.name === state.bundesland ? "selected" : ""}>${esc(b.name)}</option>`).join("")}</select></div>`)}
      <div class="grid grid-2">
        <div class="card of-karte"><h3>📻 Radio im Krisenfall</h3>
          <p class="muted of-klein" style="margin:.3rem 0 .6rem">Fällt Strom und Netz aus, informiert der ORF über Radio – Ö3 ist der Verkehrs- und Krisenfunk, dazu das Landesstudio. Ein <strong>Batterie- oder Kurbelradio</strong> gehört in jede Vorsorge. Die Frequenz hängt vom Sender in deiner Nähe ab: einmal am Radio suchen und hier eintragen, dann steht sie auch ohne Netz da.</p>
          ${sender.map(([k, name]) => `<div class="switch of-liste__zeile"><span><strong>${esc(name)}</strong></span><span style="display:flex;align-items:center;gap:.3rem"><input class="of-input" type="text" data-radio="${k}" value="${esc(radio[k] ?? "")}" placeholder="z. B. 99,9" inputmode="decimal" style="width:7.5em;text-align:right" autocomplete="off"> <span class="muted of-klein">MHz</span></span></div>`).join("")}
          <p class="muted of-klein" style="margin:.6rem 0 0;font-size:.85rem">Wien: Ö1 92,0 · Radio Wien 89,9 · Ö3 99,9 MHz (Sender Kahlenberg). Digital: DAB+ ist in Ballungsräumen zusätzlich verfügbar, im Blackout aber vom Sendernetz abhängig – UKW bleibt die sicherste Wahl.</p>
        </div>
        <div class="card of-karte"><h3>☀️ Sonne und Mond</h3>
          <div class="switch of-liste__zeile" style="border:0;padding:.2rem 0 .6rem"><label class="muted of-klein" for="wz-datum">Tag</label><input class="of-input" type="date" id="wz-datum" value="${esc(w.datum ?? new Date().toISOString().slice(0, 10))}"></div>
          <div class="grid grid-2" style="gap:.5rem">
            <div><div class="muted of-klein" style="font-size:.85rem">Dämmerung</div><div class="mono of-mono">${uhr(sz.daemmerungMorgen)}</div></div>
            <div><div class="muted of-klein" style="font-size:.85rem">Sonnenaufgang</div><div class="mono of-mono" style="font-size:1.3rem">${uhr(sz.aufgang)}</div></div>
            <div><div class="muted of-klein" style="font-size:.85rem">Sonnenuntergang</div><div class="mono of-mono" style="font-size:1.3rem">${uhr(sz.untergang)}</div></div>
            <div><div class="muted of-klein" style="font-size:.85rem">Dunkel ab</div><div class="mono of-mono">${uhr(sz.daemmerungAbend)}</div></div>
          </div>
          <p style="margin:.8rem 0 0">${mond.symbol} <strong>${esc(mond.name)}</strong> <span class="muted of-klein">· ${mond.beleuchtet} % beleuchtet · Vollmond in ${mond.naechsterVollmond} Tagen, Neumond in ${mond.naechsterNeumond} Tagen</span></p>
          <p class="muted of-klein" style="margin:.5rem 0 0;font-size:.85rem">Berechnet für ${esc(land?.hauptstadt ?? "Wien")}, ohne Internet. Tageslicht: ${sz.aufgang && sz.untergang ? `${Math.round((sz.untergang - sz.aufgang) / 3600000 * 10) / 10} Stunden` : "–"}. Bei Vollmond kann man nachts ohne Lampe gehen – ein Detail, das im Blackout zählt.</p>
        </div>
        <div class="card of-karte"><h3>🔢 Einheiten umrechnen</h3>
          <div style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin:.4rem 0">
            <select class="of-select" id="wz-art">${Object.entries(EINHEITEN).map(([k, a]) => `<option value="${k}" ${k === r.art ? "selected" : ""}>${a.name}</option>`).join("")}</select>
            <input class="of-input" type="text" id="wz-wert" value="${esc(String(r.wert))}" inputmode="decimal" style="width:7em" autocomplete="off">
            <select class="of-select" id="wz-von">${einh.map((e) => `<option ${e === von ? "selected" : ""}>${esc(e)}</option>`).join("")}</select>
            <span class="muted of-klein">→</span>
            <select class="of-select" id="wz-nach">${einh.map((e) => `<option ${e === nach ? "selected" : ""}>${esc(e)}</option>`).join("")}</select>
          </div>
          <div style="font-size:1.4rem;font-weight:500" id="wz-ergebnis">${zahl(erg)} ${esc(nach)}</div>
          <details style="margin-top:.8rem"><summary class="muted of-klein">Kochmaße</summary><table style="width:100%;margin-top:.4rem;font-size:.9rem;border-collapse:collapse">${KOCHMASSE.map(([a, b]) => `<tr><td style="padding:.2rem 0;border-top:1px solid var(--line)">${esc(a)}</td><td class="mono of-mono" style="padding:.2rem 0;border-top:1px solid var(--line);text-align:right">${esc(b)}</td></tr>`).join("")}</table></details>
        </div>
        <div class="card of-karte"><h3>🥫 Vorratsrechner</h3>
          <p class="muted of-klein" style="margin:.3rem 0 .6rem">Der Zivilschutzverband empfiehlt Vorräte für <strong>14 Tage</strong>: 2 Liter Wasser pro Person und Tag (Trinken und Kochen), dazu haltbare Lebensmittel.</p>
          <div style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:center"><label>Personen <input class="of-input" type="number" id="wz-personen" min="1" max="20" value="${v.personen}" style="width:4.5em"></label><label>Tage <input class="of-input" type="number" id="wz-tage" min="1" max="60" value="${v.tage}" style="width:4.5em"></label></div>
          <div class="grid grid-2" style="gap:.5rem;margin-top:.8rem">
            <div><div class="muted of-klein" style="font-size:.85rem">Wasser</div><div class="mono of-mono" style="font-size:1.3rem">${wasser} l</div><div class="muted of-klein" style="font-size:.8rem">${Math.ceil(wasser / 9)} Kisten à 6 × 1,5 l</div></div>
            <div><div class="muted of-klein" style="font-size:.85rem">Mahlzeiten</div><div class="mono of-mono" style="font-size:1.3rem">${essen * 3}</div><div class="muted of-klein" style="font-size:.8rem">${essen} Personentage · ca. ${essen * 2000} kcal</div></div>
          </div>
          <p class="muted of-klein" style="margin:.8rem 0 0;font-size:.85rem">Dazu: Medikamente für 14 Tage, Hygieneartikel, Bargeld in kleinen Scheinen, Taschenlampe, Batterien, Campingkocher. Die Checkliste dazu steht unter <a href="#vorsorge">Vorsorge</a>.</p>
        </div>
      </div>`;
  },

  bibliothek() {
    const k = katalog();
    if (!k) return `${kopf("Bibliothek", "Der Paketkatalog wurde noch nie geladen.")}<div class="card of-karte"><p class="muted of-klein">Geh einmal online, dann holt OFFLINE den Katalog und merkt ihn sich.</p><button class="btn btn-primary of-btn of-btn--primaer" data-katalog>Katalog laden</button><p class="form-msg of-meldung" id="bib-msg"></p></div>`;
    const typen = ["Alle", ...new Set(k.pakete.map((p) => ARTEN[p.art] ?? p.art)), ...(state.modul.lokal?.pakete.length && !k.pakete.some((p) => p.art === "modul") ? [ARTEN.modul] : [])];
    const liste = k.pakete.filter((p) => state.filter === "Alle" || (ARTEN[p.art] ?? p.art) === state.filter);
    return `
      ${kopf("Bibliothek", `Katalog vom ${datum(k.erstellt)} · Signatur geprüft ✓${desktop ? "" : " · Pakete im Browser sind Textpakete, große kommen in die Desktop-App."}`)}
      ${desktop ? `<div class="card of-karte" style="margin-bottom:1rem"><h3>Vom USB-Stick oder Ordner einspielen</h3>
        <p class="muted of-klein" style="margin:0 0 .75rem">Ohne Internet: Paketordner vom Stick auswählen. Der Kern prüft Signatur und jede Datei, bevor etwas übernommen wird.</p>
        <button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-stick-suchen>Datenträger durchsuchen</button> <button class="btn btn-sm of-btn of-btn--klein" data-ordner-waehlen>Ordner wählen …</button>
        <div id="stick-funde" style="margin-top:.75rem">${(state.funde ?? []).map((f) => `<div class="switch of-liste__zeile"><span><strong>${esc(f.titel)}</strong> <span class="muted of-klein">${esc(f.version)} · ${groesse(f.groesse)}</span><br><span class="muted mono of-klein of-mono" style="font-size:.8rem">${esc(f.pfad)}</span></span><button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-stick="${esc(f.pfad)}">Einspielen</button></div>`).join("")}</div></div>` : ""}
      <div class="filters of-reiter">${typen.map((t) => `<button data-filter="${esc(t)}" aria-pressed="${t === state.filter}">${esc(t)}</button>`).join("")}</div>
      <p class="form-msg of-meldung" id="bib-msg"></p>
      ${desktop ? lokaleQuelleHtml() : ""}
      <div class="grid grid-2">${state.filter === "Alle" || state.filter === ARTEN.modul ? `<div class="card of-karte pkg"><div class="pkg-head"><h3 style="margin:0">⏸ Pause</h3><span><span class="tag of-plakette">eingebaut</span> <span class="tag of-plakette ${pauseE().an ? "tag-ok of-plakette--offline" : ""}">${pauseE().an ? "Ein" : "Aus"}</span></span></div><p class="muted of-klein" style="margin:.4rem 0 .6rem">Ein Happen für zwischendurch, mit eigenem Raum direkt unter „Heute“. Teil der App, standardmäßig aus; die Inhalte kommen als Paket „Pause“.</p><a class="btn btn-sm of-btn of-btn--klein" href="#pause">${pauseE().an ? "Zur Pause" : "Einschalten"}</a></div>` : ""}${liste.map((p) => {
        if (p.art === "modul" || p.art === "skin") return modulKarte(p, { art: "katalog" });
        const inst = installiertesPaket(p.id);
        const update = inst && p.status === "verfuegbar" && versionVergleich(p.version, inst.manifest.version) > 0 && appPasst(p);
        let knopf;
        if (inst) knopf = `${p.id === "lumi-buch" ? `<a class="btn btn-sm of-btn of-btn--klein" href="#buch">Lesen</a> ` : ""}${update ? `<button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-install="${p.id}">Aktualisieren</button> ` : ""}${desktop && p.art === "zim" ? `<button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-oeffnen-zim="${p.id}">Öffnen</button> ` : ""}${desktop && p.art === "karte" ? `<a class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" href="#karte">Karte öffnen</a> ` : ""}<button class="btn btn-sm of-btn of-btn--klein" data-remove="${p.id}">Entfernen</button>`;
        else if (p.status !== "verfuegbar") knopf = `<span class="tag tag-warn of-plakette of-plakette--warnung">Geplant</span>`;
        else if (p.pro) knopf = `<button class="btn btn-sm of-btn of-btn--klein" disabled title="Nur mit Pro">Nur mit Pro</button>`;
        else if (!desktop && p.art !== "inhalt" && p.art !== "tage") knopf = `<span class="tag of-plakette">Nur in der Desktop-App</span>`;
        else if (!appPasst(p)) knopf = braucht(p);
        else knopf = `<button class="btn btn-sm of-btn of-btn--klein" data-install="${p.id}">Installieren</button>`;
        return `<div class="card pkg of-karte of-paket">
          <div class="pkg-head"><h3 style="margin:0">${esc(p.titel)}</h3><span>${p.pro ? '<span class="tag tag-pro of-plakette of-plakette--pro">Pro</span> ' : ""}${inst ? `<span class="tag tag-ok of-plakette of-plakette--offline">${update ? "Update " + esc(p.version) : "Installiert"}</span>` : ""}</span></div>
          <p>${esc(p.beschreibung)}</p>
          <div class="pkg-foot"><span class="muted mono of-klein of-mono" style="font-size:.85rem">${groesse(p.groesse)}${p.version ? ` · ${esc(p.version)}` : ""}</span><span>${knopf}</span></div></div>`;
      }).join("")}</div>`;
  },

  karte() {
    const kp = kartenPaket();
    return `${kopf("Karte Österreich", kp ? `Offline aus ${esc(kp.manifest.titel)} ${esc(kp.manifest.version)} – kein Internet nötig.` : desktop ? "Noch kein Kartenpaket installiert – solange online von basemap.at. Kartenpaket: Bibliothek → Karten." : "Im Prototyp live von basemap.at, in der App als Offline-Datei auf deinem Rechner.")}
      <div id="karte" role="region" aria-label="Karte von Österreich"></div>
      <p class="form-msg of-meldung" id="karte-msg"></p>`;
  },

  ki() {
    return `${kopf("KI-Assistent", "Prototyp: sucht im installierten Österreich-Paket. In der App antwortet ein lokales Sprachmodell.")}
      <div class="card of-karte"><div class="chat" id="chat">
        <div class="bubble bot">Servus! Frag mich etwas zu Notrufen, Sirenen oder Blackout-Vorsorge – zum Beispiel „Was bedeutet der Heulton?“ oder „Wie viel Wasser brauche ich?“</div></div>
        <form class="chat-form" id="chat-form"><input class="of-input" type="text" id="frage" placeholder="Deine Frage …" autocomplete="off" aria-label="Frage"><button class="btn btn-primary of-btn of-btn--primaer">Fragen</button></form>
      </div>`;
  },

  notizen() {
    const q = state.notizSuche.trim().toLowerCase();
    const alle = [...state.notizbuch].sort((a, b) => (a.geaendert < b.geaendert ? 1 : -1));
    const liste = alle.filter((n) => !q || n.titel.toLowerCase().includes(q) || n.text.toLowerCase().includes(q));
    const n = state.notizbuch.find((x) => x.id === state.notizAktiv) ?? null;
    return `${kopf("Notizen", "Bleiben auf diesem Gerät, unverschlüsselt. Passwörter, PINs und Ausweise gehören in den <a href=\"#tresor\">Tresor</a>.", '<button class="btn btn-primary of-btn of-btn--primaer" data-notiz-neu>Neue Notiz</button>')}
      <div class="notizbuch">
        <div class="card of-karte">
          <input class="of-input" type="text" id="notiz-suche" placeholder="Suchen …" value="${esc(state.notizSuche)}" autocomplete="off">
          <div class="tresor-liste" style="margin-top:.6rem">${liste.length ? liste.map((x) => `<button data-notiz="${esc(x.id)}" aria-current="${x.id === state.notizAktiv}">${esc(x.titel || "Ohne Titel")}<span class="muted of-klein">${esc(x.text.split("\n")[0].slice(0, 40))}${x.text.length > 40 ? " …" : ""}<br>${datum(x.geaendert)}</span></button>`).join("") : `<p class="muted of-klein" style="padding:.5rem .7rem">${state.notizbuch.length ? "Nichts gefunden." : "Noch keine Notiz. Oben rechts „Neue Notiz“."}</p>`}</div>
        </div>
        <div class="card of-karte">${n ? `
          <input type="text" class="titel" id="notiz-titel" value="${esc(n.titel)}" placeholder="Titel" autocomplete="off">
          <textarea class="of-textarea" id="notiz-text" placeholder="z. B. Treffpunkt der Familie, Einkaufsliste für den Vorrat, Medikamente …" style="margin-top:.6rem">${esc(n.text)}</textarea>
          <div style="display:flex;justify-content:space-between;gap:.5rem;margin-top:.6rem;flex-wrap:wrap"><span class="muted of-klein" id="notiz-gespeichert">Geändert ${datum(n.geaendert)}</span><span>${desktop ? `${aufnahmeKnopf()} <button class="btn btn-sm of-btn of-btn--klein" data-notiz-anhang>Foto oder Datei …</button> <button class="btn btn-sm of-btn of-btn--klein" data-notiz-in-tresor="${esc(n.id)}" title="Verschlüsselt in den Tresor verschieben (Tresor muss offen sein)">In den Tresor</button> ` : ""}<button class="btn btn-sm of-btn of-btn--klein" data-notiz-loeschen="${esc(n.id)}">Löschen</button></span></div>
          ${(n.anhaenge ?? []).length ? `<div style="margin-top:.8rem"><strong>Anhänge</strong>${n.anhaenge.map((a) => anhangZeile(a, state.notizVorschau?.id === a.id, "notiz")).join("")}</div>` : ""}
          ${state.notizVorschau && (n.anhaenge ?? []).some((a) => a.id === state.notizVorschau.id) ? `<div class="anhang-vorschau" style="margin-top:.8rem">${vorschauHtml(state.notizVorschau)}</div>` : ""}
          ${desktop ? "" : `<p class="muted of-klein" style="margin-top:.8rem;font-size:.85rem">Diktat und Fotos zu Notizen gibt es in der Desktop-App.</p>`}
          <p class="form-msg of-meldung" id="notiz-msg"></p>` : `<p class="muted of-klein">Links eine Notiz wählen oder oben „Neue Notiz“.</p>`}</div>
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
      ${kopf("Updates & Abo", "Geladen wird nur, wenn du online bist – und nur, was sich geändert hat.", '<button class="btn btn-primary of-btn of-btn--primaer" id="jetzt">Jetzt prüfen</button>')}
      ${state.fortschritt ? `<div class="card of-karte" style="margin-bottom:1rem"><div style="display:flex;justify-content:space-between;gap:1rem;align-items:center"><span><strong>Lädt</strong> <span class="muted mono of-klein of-mono" style="font-size:.85rem">${esc(state.fortschritt.pfad)}</span></span><span class="muted of-klein">${groesse(state.fortschritt.geladen)} / ${groesse(state.fortschritt.gesamt)}</span></div>
        <div class="progress of-balken" style="margin:.5rem 0"><div style="width:${state.fortschritt.gesamt ? Math.min(100, (100 * state.fortschritt.geladen) / state.fortschritt.gesamt) : 0}%"></div></div>
        ${desktop ? '<button class="btn btn-sm of-btn of-btn--klein" data-abbrechen>Abbrechen – wird später fortgesetzt</button>' : ""}</div>` : ""}
      <div class="card of-karte" id="pruef" style="margin-bottom:1rem">${m ? `<span class="tag of-plakette ${m.art === "ok" ? "tag-ok of-plakette--offline" : m.art === "warn" ? "tag-warn of-plakette--warnung" : "tag-pro"}">${esc(m.titel)}</span> ${m.text}` :
        k ? `<span class="muted of-klein">Katalog vom ${datum(k.erstellt)}, geladen ${datum(ks.geladen)}, signiert mit Schlüssel <span class="mono of-mono">${esc(ks.schluessel)}</span>. ${updates.length ? `<strong>${updates.length} Update${updates.length > 1 ? "s" : ""} verfügbar.</strong>` : "Alle installierten Pakete sind aktuell."}</span>` :
        '<span class="muted of-klein">Noch kein Katalog geladen.</span>'}
        ${desktop?.aboStatus !== undefined ? `<div class="muted of-klein" style="margin-top:.5rem;font-size:.9rem">Hintergrund-Abo: ${desktop.aboStatus ? esc(desktop.aboStatus) : "fällig – läuft beim nächsten Takt"}</div>` : ""}
        ${updates.map((u) => `<div style="margin-top:.75rem"><strong>${esc(u.eintrag.titel)}</strong> <span class="muted of-klein">${esc(u.installiert)} → ${esc(u.eintrag.version)}</span> <button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-install="${u.eintrag.id}" style="margin-left:.5rem">Aktualisieren</button></div>`).join("")}
      </div>
      <div class="grid grid-2">
        <div class="card of-karte">
          <div class="field"><span class="legend">Wie oft?</span>
            <div class="seg" role="group" aria-label="Intervall">${opt.map(([kk, n]) => `<button data-intervall="${kk}" aria-pressed="${state.abo.intervall === kk}">${n}</button>`).join("")}</div></div>
          <div class="switch of-liste__zeile"><span><strong>Update-Abo aktiv</strong><br><span class="muted of-klein" style="font-size:.9rem">Pausieren, ohne Einstellungen zu verlieren</span></span><input type="checkbox" data-abo="aktiv" ${state.abo.aktiv ? "checked" : ""}></div>
          <div class="switch of-liste__zeile"><span><strong>Nur im WLAN</strong><br><span class="muted of-klein" style="font-size:.9rem">Kein Download über Handy-Hotspot</span></span><input type="checkbox" data-abo="nurWlan" ${state.abo.nurWlan ? "checked" : ""}></div>
          <div class="switch of-liste__zeile"><span><strong>Zeitfenster</strong><br><span class="muted of-klein" style="font-size:.9rem">z. B. nachts, wenn der Rechner nicht gebraucht wird</span></span><input type="checkbox" data-abo="fenster" ${state.abo.fenster ? "checked" : ""}></div>
          <div style="display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;${state.abo.fenster ? "" : "opacity:.5"}">
            <input class="of-input" type="time" data-zeit="von" value="${state.abo.von}" aria-label="von"> bis <input class="of-input" type="time" data-zeit="bis" value="${state.abo.bis}" aria-label="bis"></div>
        </div>
        <div class="card of-karte">
          <h3>Neu in den Paketen</h3>
          <ul class="changelog">${aenderungen.length ? aenderungen.map((a) => `<li><span class="muted mono of-klein of-mono" style="font-size:.85rem">${datum(a.erstellt)}</span><span><strong>${esc(a.titel)}</strong> <span class="muted of-klein">${esc(a.version)}</span><br><span class="muted of-klein">${esc(a.aenderungen)}</span></span></li>`).join("") : '<li><span class="muted of-klein">Noch nichts – Katalog laden.</span></li>'}</ul>
        </div>
      </div>
      ${desktop ? appUpdateKarte() : webAppKarte()}
      ${desktop ? `<div class="card of-karte" style="margin-top:1rem"><h3>Speicherort</h3><p class="muted of-klein" style="margin:0 0 .5rem">Pakete liegen in <span class="mono of-mono" style="font-size:.85rem">${esc(desktop.datenordner)}</span>. Für große Pakete (Wikipedia, Karten) kann das eine externe Platte sein.</p>
        <button class="btn btn-sm of-btn of-btn--klein" data-speicherort>Ordner wählen …</button> <button class="btn btn-sm of-btn of-btn--klein" data-speicherort-standard>Standard</button><p class="form-msg of-meldung" id="ort-msg"></p></div>` : ""}
      <div class="card of-karte" style="margin-top:1rem"><h3>Werkzeuge</h3>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem">
          ${desktop ? "" : `<button class="btn btn-sm of-btn of-btn--klein" data-offline-pruefen>Offline-Bereitschaft prüfen</button>
          <button class="btn btn-sm of-btn of-btn--klein" data-app-installieren>Als App installieren</button>
          <button class="btn btn-sm of-btn of-btn--klein" data-zuruecksetzen>Alles zurücksetzen</button>`}
          <button class="btn btn-sm of-btn of-btn--klein" data-loeschen style="color:var(--accent);border-color:var(--accent)">Restlos löschen &amp; deinstallieren</button>
        </div>
        ${state.loeschenOffen ? `<div class="card of-karte" style="margin-top:.75rem;border-color:var(--accent)"><strong>Wirklich alles löschen?</strong>
          <p class="muted of-klein" style="margin:.3rem 0 .6rem">Pakete, Notizen, Checkliste und Einstellungen verschwinden von diesem Gerät. Das lässt sich nicht rückgängig machen. Zur Sicherheit bitte <strong>LÖSCHEN</strong> eintippen:</p>
          <div style="display:flex;gap:.5rem;flex-wrap:wrap"><input class="of-input" type="text" id="loeschen-wort" autocomplete="off" placeholder="LÖSCHEN" style="min-width:12rem"><button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-loeschen-jetzt>Jetzt löschen</button><button class="btn btn-sm of-btn of-btn--klein" data-loeschen-abbrechen>Abbrechen</button></div></div>` : ""}
        <p class="muted of-klein" style="font-size:.85rem;margin:.6rem 0 0">${desktop ? "„Restlos löschen“ entfernt alle Pakete und Einstellungen der App – doppelt gesichert. Das Programm selbst deinstallierst du danach über das Betriebssystem." : "„Zurücksetzen“ löscht alles und lädt OFFLINE frisch. „Restlos löschen“ entfernt alle Daten und die Offline-Kopie – doppelt gesichert, damit nichts aus Versehen verschwindet."}</p>
        <p class="form-msg of-meldung" id="werkzeug-msg" role="status" aria-live="polite"></p></div>
      <p class="muted of-klein" style="margin-top:1rem;font-size:.9rem">So läuft ein Update: Katalog laden → Signatur prüfen → Manifest gegen Katalog und Signatur prüfen → nur geänderte Dateien laden → jede Datei gegen ihre Prüfsumme prüfen → erst dann den alten Stand ersetzen. Details: <a href="https://github.com/miksoda-cpu/OFFLINE/blob/claude/optimistic-hypatia-yymcne/docs/PAKETFORMAT.md" rel="noopener">Paketformat</a>.</p>`;
  },
};

function appUpdateKarte() {
  const u = state.appUpdate ?? { status: "" };
  let inhalt;
  switch (u.status) {
    case "pruefe": inhalt = `<span class="muted of-klein">Frage den Update-Server …</span>`; break;
    case "keins": inhalt = `<span class="tag tag-ok of-plakette of-plakette--offline">Aktuell</span> <span class="muted of-klein">Du hast die neueste Version${u.aktuell ? ` (${esc(u.aktuell)})` : ""}.</span>`; break;
    case "gefunden": inhalt = `<span class="tag tag-warn of-plakette of-plakette--warnung">Neue Version ${esc(u.info.version)}</span> <span class="muted of-klein">Du hast ${esc(u.info.aktuell)}.${u.info.hinweise ? " " + esc(u.info.hinweise) : ""}</span>
      <div style="margin-top:.6rem"><button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-app-update-installieren>Version ${esc(u.info.version)} laden und installieren</button></div>`; break;
    case "laedt": inhalt = `<span class="muted of-klein">Lade Version ${esc(u.info.version)} … ${u.fortschritt?.gesamt ? `${groesse(u.fortschritt.geladen)} / ${groesse(u.fortschritt.gesamt)}` : ""}</span>
      <div class="progress of-balken" style="margin:.5rem 0"><div style="width:${u.fortschritt?.gesamt ? Math.min(100, (100 * u.fortschritt.geladen) / u.fortschritt.gesamt) : 0}%"></div></div>`; break;
    case "fertig": inhalt = `<span class="tag tag-ok of-plakette of-plakette--offline">Installiert</span> <span class="muted of-klein">Version ${esc(u.info.version)} ist bereit. Signatur geprüft.</span>
      <div style="margin-top:.6rem"><button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-app-neustart>Jetzt neu starten</button></div>`; break;
    case "fehler": inhalt = `<span class="tag tag-pro of-plakette of-plakette--pro">Fehler</span> <span class="muted of-klein">${esc(u.text)}</span>`; break;
    default: inhalt = `<span class="muted of-klein">Die App holt sich neue Versionen selbst – signiert, vom selben Server wie die Pakete.</span>`;
  }
  const ortProblem = desktop?.info?.ort_problem;
  if (ortProblem) inhalt = `<span class="tag tag-warn of-plakette of-plakette--warnung">Falscher Ort</span> <span>${esc(ortProblem)}</span><br><span class="muted mono of-klein of-mono" style="font-size:.8rem">${esc(desktop.info.ort)}</span>`;
  const laeuft = u.status === "pruefe" || u.status === "laedt" || !!ortProblem;
  return `<div class="card of-karte" style="margin-top:1rem"><div style="display:flex;justify-content:space-between;gap:1rem;align-items:center;flex-wrap:wrap"><h3 style="margin:0">App-Update</h3>
    <button class="btn btn-sm of-btn of-btn--klein" data-app-update-pruefen ${laeuft ? "disabled" : ""}>Nach neuer Version suchen</button></div>
    <p style="margin:.6rem 0 0" id="app-update-inhalt">${inhalt}</p>${neuesKnopf()}</div>`;
}
/** Web-Version: dieselbe Box ohne Updater (die Seite ist nach dem Neuladen aktuell), mit „Was ist neu“. */
function webAppKarte() {
  return `<div class="card of-karte" style="margin-top:1rem"><h3 style="margin:0">App-Update</h3>
    <p style="margin:.6rem 0 0"><span class="muted of-klein">Web-App ${esc(APP_VERSION)}. Im Browser ist die App nach dem Neuladen der Seite aktuell.</span></p>${neuesKnopf()}</div>`;
}

// ---------- Was ist neu (web/neues.json, kommt mit der App, ohne Netz lesbar) ----------
// Kein Aufdrängen: nichts geht von selbst auf. Ein kleiner Punkt am Knopf, bis man die Seite zur aktuellen Version geöffnet hat.
const neuesUngesehen = () => speicher.get("neues-gesehen", null) !== appVersion();
function neuesKnopf() {
  return `<div class="neues-fuss"><a class="btn btn-sm of-btn of-btn--klein neues-knopf" href="#neues">Was ist neu${neuesUngesehen() ? '<span class="neues-punkt" aria-label="neu"></span>' : ""}</a></div>`;
}
async function neuesLaden() {
  if (state.neues) return;
  try { state.neues = await (await fetch("/neues.json", { cache: "no-cache" })).json(); }
  catch { state.neues = { versionen: [], fehler: true }; }
  if (location.hash === "#neues") render();
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
  if (desktop?.info?.ort_problem) { state.appUpdate = { status: "fehler", text: desktop.info.ort_problem }; render(); return; }
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
      : { art: "ok", titel: "Geprüft", text: `Katalog signiert mit <span class="mono of-mono">${esc(schluessel)}</span>. ${updates.length ? `${updates.length} Update${updates.length > 1 ? "s" : ""} verfügbar.` : `Alle Pakete aktuell. Nächste Prüfung: ${intervallText()}.`}` };
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
  const tag = d.status === "laedt" ? "tag-pro" : d.status === "fertig" ? "tag-ok of-plakette--offline" : "tag-warn of-plakette--warnung";
  el.hidden = false;
  el.innerHTML = `<span class="dl-titel" title="${esc(d.titel)}">${esc(d.titel)}</span>
    <div class="dl-zeile"><span class="tag of-plakette ${tag}">${STATUS_TEXT[d.status]}</span><span class="mono of-mono">${d.gesamt ? `${groesse(d.geladen)} / ${groesse(d.gesamt)}` : groesse(d.geladen)}</span></div>
    ${d.status === "laedt" || d.status === "unterbrochen" ? `<div class="progress of-balken"><div style="width:${p}%"></div></div>` : ""}
    ${d.status === "kaputt" && d.text ? `<div class="muted of-klein" style="margin-top:.3rem">${esc(d.text)}</div>` : ""}
    ${d.status === "unterbrochen" ? `<button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-install="${esc(d.id)}">Fortsetzen</button>` : ""}
    ${d.status === "kaputt" ? `<button class="btn btn-sm of-btn of-btn--klein" data-install="${esc(d.id)}">Erneut versuchen</button>` : ""}
    ${d.status === "laedt" && desktop ? `<button class="btn btn-sm of-btn of-btn--klein" data-abbrechen>Abbrechen</button>` : ""}`;
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

// ---------- Pause (Aufträge 2026-10-04-pause-stufe1 und -umbau): Raum, Einladung auf Heute, Happen, Spiel-Log, Deine Linie ----------
// Eine Funktion im Kern mit eigenem Raum (#pause, seit 0.4.2; Auftrag 2026-10-04-pause-umbau), ein- und ausschaltbar; standardmäßig
// aus. Inhalte aus dem Paket „pause“ (nur Daten). Logik: web/pause.js, Spiele: web/pause-happen.js, Startwerte: web/pause-werte.js.
const PP = () => installiertesPaket("pause");
const pauseDaten = () => inhalt(PP(), "inhalt/pause.json");
const pauseE = () => pauseEinstellungenLaden(speicher.get("pause", null));
const pauseL = () => pauseLinieLaden(speicher.get("pause-linie", null));
const linieSpeichern = (l) => speicher.set("pause-linie", l);
const spielLog = () => speicher.get("spiel-log", []);
function spielLogDazu(eintrag) { speicher.set("spiel-log", pauseLogDazu(spielLog(), eintrag, testJetzt())); }
let pauseFokus = null; // laufender Happen: { erste, nurAbend, zurueck, gepusht, ctrl }
let pauseKarte = null; // Einladung oben auf Heute: { form, nurAbend, tag } – einmal je Öffnen, wegwischbar
let pauseVorschlagMerk = null; // Vorschlag im Raum bleibt stehen, solange sich nichts ändert

/** Roman der Woche für „Was kommt als Nächstes?“: fragen (gestern gelesen, heute noch nicht) oder auflösen (heute gelesen). */
function pauseRoman() {
  const d = heuteDatum(), heute = kartenFuer(tagesPakete(), d, tagStart()).find((k) => k.art === "kapitel");
  if (!heute) return null;
  const gestern = kartenFuer(tagesPakete(), plusTage(d, -1), tagStart()).find((k) => k.art === "kapitel" && k.werk === heute.werk && k.teil === heute.teil - 1) ?? null;
  const heuteGelesen = tagZustand(d)[heute.id] === "erledigt", v = speicher.get("pause-vermutung", null);
  const aufloesen = v?.kapitel === heute.id && heuteGelesen, fragen = !!gestern && !heuteGelesen && v?.kapitel !== heute.id;
  return aufloesen || fragen ? { heute, gestern, heuteGelesen } : null;
}
/** Türsteherfrage: das Rätsel von gestern (mit Kurzantwort) oder der Autor des Romans der Woche. */
function pauseGestern() {
  const karten = kartenFuer(tagesPakete(), plusTage(heuteDatum(), -1), tagStart());
  const raetsel = karten.find((k) => k.art === "raetsel" && k.antworten?.length);
  if (raetsel) return { raetsel };
  const kap = karten.find((k) => k.art === "kapitel");
  if (!kap) return null;
  const andere = [...new Set(tagesPakete().flatMap((p) => p.tage.flatMap((t) => t.karten.filter((k) => k.art === "kapitel").map((k) => k.autor))))].filter((a) => a && a !== kap.autor);
  return andere.length >= 2 ? { roman: { werk: kap.werk, autor: kap.autor, andere } } : null;
}
function pauseKontext(nurAbend) {
  const plan = tagesplan(), jetzt = testJetzt();
  const abend = nurAbend || (plan.schlussUm != null && new Date(jetzt).getHours() >= plan.schlussUm);
  return { funktionen: FUNKTIONEN, abend, nurAbend, hat: { roman: !!pauseRoman(), gestern: !!pauseGestern() } };
}
const tagesSchlussVorbei = () => { const p = tagesplan(); return p.schlussUm != null && new Date(testJetzt()).getHours() >= p.schlussUm; };

/**
 * Einen Happen starten (Fokus-Bildschirm, Route #happen). form: im Raum oder auf der Karte gewählte Form (id), sonst wählt
 * der Dirigent. nurAbend: nach dem Tagesschluss nur „Der Tag rückwärts“. Nach ✕ oder „Zurück“ geht es dorthin zurück, wo
 * man herkam (Heute oder Raum).
 */
function pauseStarten({ nurAbend = false, form = null, zurueck = null } = {}) {
  const daten = pauseDaten();
  if (!daten) return;
  const hier = (location.hash || "#start").slice(1);
  pauseFokus = { nurAbend, erste: form ? daten.formen.find((f) => f.id === form) ?? null : null, zurueck: zurueck ?? (hier === "pause" ? "pause" : "start"), gepusht: hier !== "happen", ctrl: null };
  pauseKarte = null; pauseVorschlagMerk = null;
  if (hier === "happen") render(); else location.hash = "#happen";
}
/** Baut den Fokus-Bildschirm in den Inhaltsbereich (aus render()). Ohne laufenden Happen geht es in den Raum. */
function pauseFokusEinbauen() {
  const daten = pauseDaten();
  if (!pauseFokus || !daten) { pauseFokus = null; location.replace("#pause"); return; }
  if (pauseFokus.ctrl) return; // läuft schon
  const formen = daten.formen, { nurAbend } = pauseFokus;
  main.innerHTML = '<section id="happen"></section>';
  pauseFokus.ctrl = happenFokus(document.getElementById("happen"), {
    erste: pauseFokus.erste,
    zurueckText: pauseFokus.zurueck === "pause" ? "Zurück zur Pause" : "Zurück zu Heute",
    zu: () => { const f = pauseFokus; pauseFokus = null; if (f?.gepusht) history.back(); else location.replace(`#${f?.zurueck ?? "start"}`); },
    naechster: (ohne) => {
      if (nurAbend && spielLog().some((e) => e.quelle === "pause" && e.id === "rueckwaerts" && tagVon(Date.parse(e.zeit)) === heuteDatum() && !e.abgebrochen)) return null;
      return pauseWaehle({ formen, linie: pauseL(), log: spielLog(), einstellungen: speicher.get("pause", null), jetzt: testJetzt(), kontext: pauseKontext(nurAbend), ohne });
    },
    spielen: (form, el, rahmen) => {
      const log = spielLog().filter((e) => e.quelle === "pause"), heute = heuteDatum();
      return PAUSE_FORMEN[form.id](el, {
        form, linie: pauseL(), daten, rahmen, rnd: Math.random, jetzt: testJetzt, antwortRichtig,
        gesehen: new Set(log.filter((e) => e.id === "fehler").slice(-10).map((e) => e.ergebnis?.geschichte)),
        heute: lumischHeute(spielLog(), daten.lumisch, heute),
        roman: pauseRoman(), vermutung: speicher.get("pause-vermutung", null), vermutungSpeichern: (v) => speicher.set("pause-vermutung", v), gestern: pauseGestern(),
      });
    },
    gespielt: (form, erg, sek) => {
      spielLogDazu({ quelle: "pause", id: form.id, art: form.art, ergebnis: erg?.ergebnis ?? {}, dauer: sek, ...(erg ? {} : { abgebrochen: true }) });
      let l = pauseL();
      if (erg) l.happen = (l.happen ?? 0) + 1;
      if (erg && form.auffrischung_monate) {
        const a = { ...(l.auffrischung[form.id] ?? {}) };
        if (!a.erstes) a.erstes = heuteDatum();
        else { const f = auffrischungFaellig(l, [form], testJetzt()); if (f) a.erledigt = [...(a.erledigt ?? []), f.monate]; }
        l.auffrischung[form.id] = a;
      }
      l = zoneAnpassen(l, form, spielLog());
      linieSpeichern(l);
      if (erg && wesen.mitFigur()) wesen.freude(2500); // die Lumi freut sich mit
    },
    bewertet: (form, art) => linieSpeichern(pauseBewerten(pauseL(), formen, form.id, art)),
    schwierigkeit: (form, u) => linieSpeichern(pauseSchwierigkeit(pauseL(), form, u)),
    rueckfrage: () => { const q = rueckfrageFaellig(pauseL(), speicher.get("pause", null), testJetzt()); if (q) { const l = pauseL(); l.letzteRueckfrage = new Date(testJetzt()).toISOString(); linieSpeichern(l); } return q; },
    beantwortet: (id, a) => linieSpeichern(rueckfrageBeantworten(pauseL(), id, a, testJetzt())),
    schwierigkeitFragen: () => pauseL().happen % PAUSE_WERTE.schwierigkeitAlleN === 0,
  });
}
/** Beim Öffnen der App (und beim Zurückkommen): höchstens eine Einladung je Öffnen, als Karte oben auf Heute, nie im Notfall-Bereich. */
function pauseBeimOeffnen() {
  if (pauseFokus || !pauseE().an || !pauseDaten()) return;
  const route = (location.hash || "#start").slice(1);
  if (pauseKarte && pauseKarte.tag !== heuteDatum()) pauseKarte = null;
  const f = happenFaellig({ einstellungen: speicher.get("pause", null), jetzt: testJetzt(), oeffnen: speicher.get("pause-oeffnen", null), route, schluss: tagesSchlussVorbei() });
  speicher.set("pause-oeffnen", f.oeffnen);
  if (!f.faellig || route === "notfall") return;
  const w = pauseWaehle({ formen: pauseDaten().formen, linie: pauseL(), log: spielLog(), einstellungen: speicher.get("pause", null), jetzt: testJetzt(), kontext: pauseKontext(f.nurAbend) });
  if (!w) return;
  pauseKarte = { form: w.form.id, nurAbend: f.nurAbend, tag: heuteDatum() };
  if (route === "start") render();
}
/** Die Einladung oben auf Heute: Name, Dauer, „Spielen“, „Andere Pause“ (Raum), „später“. Wegwischbar. */
function pauseKarteHtml() {
  if (!pauseKarte || !pauseE().an) return "";
  const f = pauseDaten()?.formen.find((x) => x.id === pauseKarte.form);
  if (!f) return "";
  return `<div class="z-karte z-eis pause-einladung" id="pause-karte" role="group" aria-label="Pause">
    <small class="z-marke">Pause</small><p class="z-titel">${esc(f.titel)}</p><p class="z-unter">${esc(dauerText(f))}</p>
    <div class="z-zeile"><button type="button" class="z-haupt" data-pause="spielen" data-form="${esc(f.id)}">Spielen</button><a class="z-neben" href="#pause">Andere Pause</a><button type="button" class="z-neben" data-pause="karte-weg">später</button></div></div>`;
}
/** Die Karte lässt sich zur Seite wischen (wie „später“). */
function pauseKarteWischen() {
  const k = document.getElementById("pause-karte");
  if (!k) return;
  let x0 = null, dx = 0;
  k.addEventListener("pointerdown", (e) => { if (e.target.closest("button, a")) return; x0 = e.clientX; dx = 0; k.setPointerCapture?.(e.pointerId); });
  k.addEventListener("pointermove", (e) => { if (x0 === null) return; dx = e.clientX - x0; k.style.transform = `translateX(${dx}px)`; k.style.opacity = String(Math.max(.2, 1 - Math.abs(dx) / 300)); });
  const los = () => {
    if (x0 === null) return; x0 = null;
    if (Math.abs(dx) > 90) { pauseKarte = null; k.remove(); return; }
    k.style.transform = ""; k.style.opacity = "";
  };
  k.addEventListener("pointerup", los); k.addEventListener("pointercancel", los);
}
async function pauseEinschalten(alter) {
  if (!(alter in LEBENSABSCHNITTE)) return;
  const e = pauseE(), roh = speicher.get("pause", null) ?? {};
  speicher.set("pause", { ...roh, alter, an: pauseAngeboten(alter), seit: e.seit ?? heuteDatum() });
  if (!pauseAngeboten(alter)) return render();
  if (!PP()) { render(); await installiereMitMeldung("pause", "pause-msg"); }
  if (PP()) pauseStarten({ zurueck: "pause" }); else render();
}

/** Der Raum „Pause“ (#pause). Ist Pause aus: zwei Sätze und fünf Knöpfe fürs Alter – ein Tipp schaltet ein und startet den ersten Happen. */
function pauseRaumHtml() {
  const e = pauseE(), roh = speicher.get("pause", null) ?? {}, daten = pauseDaten();
  const kopfR = `<div class="page-head of-seitenkopf"><div><h1 class="z-h1">Pause</h1><p class="z-leise">Ein Happen für zwischendurch, dann ist wieder Ruhe.</p></div></div>`;
  if (!e.an) return `${kopfR}<div class="pause-raum">
    <p class="z-text">Pause schlägt dir ab und zu einen kurzen Happen vor, 30 Sekunden bis 3 Minuten: eine Sache, ein Gelingen, ein Satz zum Mitnehmen. Keine Serien, keine Pushnachrichten, nichts verlässt das Gerät.</p>
    ${roh.alter === "kind" ? `<p class="of-meldung">Pause gibt es ab 14 Jahren. Für Jüngere kommt später ein Kinder-Modus.</p>` : ""}
    <p class="z-leise" id="pause-alter-frage">Wie alt bist du? Ein Tipp schaltet Pause ein und startet den ersten Happen.</p>
    <div class="pause-alter" role="group" aria-labelledby="pause-alter-frage">${Object.entries(LEBENSABSCHNITTE).map(([k, l]) => `<button type="button" class="z-linie" data-pause="alter" data-alter="${k}">${esc(l)}</button>`).join("")}</div>
    <p class="form-msg of-meldung" id="pause-msg"></p></div>`;
  if (!daten) return `${kopfR}<div class="pause-raum"><p class="z-text">Die Happen kommen, sobald das Paket „Pause“ geladen ist${navigator.onLine ? "" : " (beim nächsten Mal mit Netz)"}.</p><p class="form-msg of-meldung" id="pause-msg"></p>
    <details class="pause-einst" id="pause-einstellungen"><summary class="z-neben">Einstellungen</summary><div>${pauseEinstellungenHtml()}</div></details></div>`;
  const liste = raumFormen({ formen: daten.formen, einstellungen: roh, jetzt: testJetzt(), kontext: pauseKontext(false), log: spielLog(), lumisch: daten.lumisch, heute: heuteDatum() });
  const schluessel = `${heuteDatum()}|${spielLog().length}|${pauseL().aus.join()}|${e.alter}|${new Date(testJetzt()).getHours()}`;
  if (pauseKarte) pauseVorschlagMerk = { schluessel, form: pauseKarte.form };
  if (pauseVorschlagMerk?.schluessel !== schluessel) pauseVorschlagMerk = { schluessel, form: pauseWaehle({ formen: daten.formen, linie: pauseL(), log: spielLog(), einstellungen: roh, jetzt: testJetzt(), kontext: pauseKontext(false) })?.form.id ?? null };
  const v = daten.formen.find((f) => f.id === pauseVorschlagMerk.form);
  return `${kopfR}<div class="pause-raum">
    ${v ? `<div class="z-karte z-eis pause-vorschlag"><small class="z-marke">Jetzt passt</small><p class="z-titel">${esc(v.titel)}</p><p class="z-unter">${esc(dauerText(v))}</p><div class="z-zeile"><button type="button" class="z-haupt" data-pause="spielen" data-form="${esc(v.id)}">Spielen</button></div></div>`
      : `<div class="z-karte z-eis"><p class="z-text" style="margin:0">Gerade schlägt Pause nichts vor. Such dir unten etwas aus.</p></div>`}
    <h2 class="z-ueber">Alle Spiele</h2>
    <ul class="z-liste pause-liste">${liste.map((x) => `<li><button type="button" class="pause-zeile-wahl" data-pause="spielen" data-form="${esc(x.form.id)}" ${x.geht ? "" : "disabled"}><span class="z-name">${esc(x.form.titel)}</span><span class="z-unter">${esc(x.stand)}</span></button></li>`).join("")}</ul>
    <div class="z-zeile pause-raum-fuss"><a class="z-neben" href="#linie">Deine Linie</a></div>
    <details class="pause-einst" id="pause-einstellungen"><summary class="z-neben">Einstellungen</summary><div>${pauseEinstellungenHtml()}</div></details></div>`;
}

/** Raum › Einstellungen: Alter, Appetit, Vertraut ↔ Neues, ausschalten. */
function pauseEinstellungenHtml() {
  const e = pauseE();
  return `<div class="grid grid-3"><label>Wie alt bist du?<br><select class="of-select" data-pause-einstellung="alter">${Object.entries(LEBENSABSCHNITTE).map(([k, l]) => `<option value="${k}" ${e.alter === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label>Appetit<br><select class="of-select" data-pause-einstellung="appetit">${Object.entries(APPETIT).map(([k, l]) => `<option value="${k}" ${e.appetit === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label>Vertraut ↔ Neues<br><input type="range" min="-1" max="1" step="0.5" value="${e.neuigkeit}" data-pause-einstellung="neuigkeit" aria-valuetext="${e.neuigkeit < 0 ? "mehr Vertrautes" : e.neuigkeit > 0 ? "mehr Neues" : "gemischt"}"></label></div>
    <p class="z-leise" style="margin:.5rem 0 .6rem">Appetit: wie oft am Tag beim Öffnen eine Einladung auf Heute steht (wenig 1, mittel 3, viel 6). Hier im Raum kannst du immer spielen.</p>
    <p style="margin:0">${`<button type="button" class="z-neben" data-pause="aus">Pause ausschalten</button>`}</p>`;
}

/** Deine Linie: was die App gelernt hat, in einfachen Balken – alles änderbar, alles zurücksetzbar. */
function linieHtml() {
  const daten = pauseDaten(), e = pauseE(), l = pauseL(), log = spielLog(), jetzt = testJetzt();
  if (!e.an) return `${kopf("⏸ Deine Linie", "Was Pause über dich gelernt hat.")}<div class="card of-karte"><p>Pause ist aus. Einschalten kannst du sie im Raum <a href="#pause">Pause</a>.</p></div>`;
  if (!daten) return `${kopf("⏸ Deine Linie", "Was Pause über dich gelernt hat.")}<div class="card of-karte"><p>Das Paket „Pause“ ist noch nicht geladen.</p></div>`;
  const formen = daten.formen.filter((f) => !f.bedingung), max = PAUSE_WERTE.gewicht.hoch;
  const gespielt = (id) => log.some((x) => x.quelle === "pause" && x.id === id);
  const bild = soSeheIchDich(l, log, daten.formen);
  const termine = auffrischungTermine(l, daten.formen);
  const fmt = (d) => new Date(`${d}T12:00:00`).toLocaleDateString("de-AT", { day: "numeric", month: "long", year: "numeric" });
  return `${kopf("⏸ Deine Linie", "Was Pause über dich gelernt hat. Jede Annahme kannst du hier ändern oder zurücksetzen.")}
    <p style="margin:0 0 1rem"><a href="#uebersicht">‹ Übersicht</a></p>
    ${bild && !imKennenlernen(e, jetzt) ? `<div class="card of-karte" style="margin-bottom:1rem"><p style="margin:0"><strong>So sehe ich dich:</strong> ${esc(bild)}</p></div>` : imKennenlernen(e, jetzt) ? `<div class="card of-karte" style="margin-bottom:1rem"><p style="margin:0">Wir lernen uns noch kennen. In den ersten drei Wochen kommt viel Abwechslung.</p></div>` : ""}
    <div class="card of-karte" style="margin-bottom:1rem"><h3 style="margin-top:0">Was du magst</h3>
      <ul class="lumi-balken linie-balken">${formen.filter((f) => !l.aus.includes(f.id)).map((f) => { const g = gewichtVon(l, f.id); return `<li><span>${esc(f.titel)}</span><span class="lumi-balken-spur" role="img" aria-label="${esc(f.titel)}: ${g < 1 ? "seltener" : g > 1 ? "öfter" : "normal"}"><span style="width:${Math.round((g / max) * 100)}%"></span></span><span class="muted of-klein">${gespielt(f.id) ? (g < 1 ? "seltener" : g > 1 ? "öfter" : "normal") : "neu"}</span></li>`; }).join("")}</ul>
      ${l.aus.length ? `<p class="of-klein" style="margin:.8rem 0 .3rem"><strong>Nicht mehr</strong></p><ul class="lumi-aus">${l.aus.map((id) => `<li><span>${esc(daten.formen.find((f) => f.id === id)?.titel ?? id)}</span> <button type="button" class="btn btn-sm of-btn of-btn--klein" data-pause-zurueck="${esc(id)}">Zurückholen</button></li>`).join("")}</ul>` : ""}
    </div>
    <div class="card of-karte" style="margin-bottom:1rem"><h3 style="margin-top:0">Wie schwer</h3>
      <p class="muted of-klein" style="margin:0 0 .5rem">Die Aufgaben stellen sich so ein, dass es meist klappt. Du kannst nachhelfen.</p>
      <ul class="lumi-aus">${formen.filter((f) => f.zone).map((f) => `<li><span>${esc(f.titel)}: Stufe ${stufeVon(l, f)} von ${f.zone.stufen} · ${esc(zoneText(l, f, log))}</span> <span><button type="button" class="btn btn-sm of-btn of-btn--klein" data-pause-stufe="${f.id}" data-richtung="schwer" aria-label="${esc(f.titel)} leichter">leichter</button> <button type="button" class="btn btn-sm of-btn of-btn--klein" data-pause-stufe="${f.id}" data-richtung="leicht" aria-label="${esc(f.titel)} schwerer">schwerer</button></span></li>`).join("")}</ul>
    </div>
    <div class="card of-karte" style="margin-bottom:1rem"><h3 style="margin-top:0">Über die Woche</h3><p style="margin:0">${esc(wochenSatz(l, log, daten.formen, jetzt))}</p>
      ${termine.length ? `<p class="of-klein" style="margin:.6rem 0 0">Auffrischung vorgemerkt: ${termine.map((t) => `${esc(t.titel)} am ${t.termine.map((x) => `${fmt(x.datum)}${x.erledigt ? " (erledigt)" : ""}`).join(" und am ")}`).join("; ")}. Ohne Pushnachricht: Der Happen kommt einfach an dem Tag.</p>` : ""}
      ${Object.keys(l.antworten).length ? `<p class="of-klein" style="margin:.6rem 0 0">Deine Antworten: ${Object.entries(l.antworten).filter(([, v]) => v).map(([, v]) => esc({ schneller: "lieber schneller", ruhiger: "lieber ruhiger", woerter: "mehr Wörter", zahlen: "mehr Zahlen", morgens: "morgens", abends: "abends", egal: "Zeit egal" }[v] ?? v)).join(", ") || "übersprungen"}.</p>` : ""}
    </div>
    <div class="card of-karte" style="margin-bottom:1rem"><h3 style="margin-top:0">Einstellungen</h3>${pauseEinstellungenHtml()}</div>
    <div class="card of-karte" style="margin-bottom:1rem"><h3 style="margin-top:0">Was Pause bewirkt</h3>
      <p style="margin:0 0 .4rem">Spiele werden besser durch Übung. Ob sich das auf den Alltag überträgt, ist offen.</p>
      <p style="margin:0 0 .4rem">Die Pilz-Aufgabe schult Tempo und Wahrnehmung. Ob sich das auf den Alltag überträgt, ist noch offen.</p>
      <p style="margin:0 0 .4rem">Studien zeigen: Wer sich viel bewegt, hat im Durchschnitt ein niedrigeres Demenzrisiko. Pause ersetzt keine Bewegung.</p>
      <p style="margin:0">Wenn du dich wegen deines Gedächtnisses sorgst, sprich mit deiner Ärztin oder deinem Arzt.</p></div>
    <p><button type="button" class="btn btn-sm of-btn of-btn--klein" data-pause="linie-zuruecksetzen">Linie zurücksetzen</button> <button type="button" class="btn btn-sm of-btn of-btn--klein" data-pause="log-loeschen">Spiel-Log löschen</button></p>
    <p class="muted of-klein">Alles hier bleibt auf diesem Gerät. Es wird nichts gezählt, um dich festzuhalten.</p>`;
}

// ---------- Das Lumi-Buch (Auftrag 2026-10-04-lumi-buch-app): lesbar wird, was man unter einem Satz der Lumi öffnet ----------
// Logik in web/buch.js. Milde Zugkraft: oben nur der Anteil in Prozent, keine Liste fehlender Tipps, kein Hinweis aufs
// schnellere Freischalten. Gespeichert wird nur, welche Absätze lesbar sind ("lumi-buch-frei").
const buchFrei = () => buchMitSchluss(speicher.get("lumi-buch-frei", null), buchDaten()); // Schlussstück frei, wenn der Rest von Kapitel 12 gelesen ist
let buchLesen = null; // { id, zurueck } – der zuletzt geöffnete Absatz und wohin „Zurück“ führt
/** „Aus dem Lumi-Buch“ unter einem Satz oder im Log: Absatz öffnen und damit lesbar machen (nicht bei „Tipps aus“). */
function buchOeffnen(id) {
  const b = buchDaten();
  if (!b || !buchAbsatz(b, id)) return;
  if (wesen.e.takt !== "aus") speicher.set("lumi-buch-frei", buchFreischalten(buchFrei(), b, id));
  const hier = (location.hash || "#start").slice(1);
  buchLesen = { id, zurueck: hier === "absatz" ? buchLesen?.zurueck ?? "start" : hier };
  wesen.tippSchliessen?.();
  if (hier === "absatz") render(); else location.hash = "#absatz";
}
function absatzHtml() {
  const b = buchDaten(), a = b && buchLesen ? buchAbsatz(b, buchLesen.id) : null;
  if (!a) return buchHtml();
  const zurueck = `#${buchLesen.zurueck || "start"}`;
  return `<article class="buch-lesen buch-absatz" lang="de" aria-labelledby="buch-kapitel">
    <div class="buch-kopf"><a class="buch-zu" href="${esc(zurueck)}" aria-label="Schließen"><svg class="z-x" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg></a><p class="buch-marke" id="buch-kapitel">${esc(b.titel)} · Kapitel ${a.kapitel}: ${esc(a.kapitelTitel)}</p></div>
    <p class="buch-text">${esc(a.text)}</p>
    <p class="buch-fuss"><a class="z-neben" href="${esc(zurueck)}">Zurück</a></p>
  </article>`;
}
function buchHtml() {
  const b = buchDaten();
  if (!b) return `${kopf("Das Lumi-Buch", "Das Buch kommt mit dem Paket „Das Lumi-Buch“.")}<div class="card of-karte"><p style="margin:0">${navigator.onLine ? "Es wird gerade geladen oder lässt sich in der Bibliothek installieren." : "Sobald du online bist, lädt OFFLINE es."}</p></div>`;
  const frei = buchFrei();
  return `<article class="buch-lesen" lang="de">
    <header class="buch-titel"><h1>${esc(b.titel)}</h1><p class="buch-band">Band ${b.band} · ${buchAnteil(b, frei)} % lesbar</p>
      <p class="buch-hinweis">${esc(b.hinweis)}</p>
      <p class="buch-werkzeug">${frei.absaetze.length ? `<button type="button" class="z-neben" data-buch="vorlesen">${state.buchLiest ? "Anhalten" : "Vorlesen"}</button>` : ""}<a class="z-neben" href="#uebersicht">Zurück</a></p></header>
    ${frei.absaetze.length ? "" : `<p class="buch-leer">Unter einem Satz deiner Lumi steht „Aus dem Lumi-Buch“. Was du dort aufschlägst, steht danach hier.</p>`}
    ${buchMitLuecken(b, frei, buchWartend(wesen.tippsQuelle() ?? [], FUNKTIONEN)).map((k) => `<section class="buch-kapitel"><h2>Kapitel ${k.nr}: ${esc(k.titel)}</h2>${k.teile.map((t) => t.art === "absatz" ? `<p class="buch-text" id="${esc(t.id)}">${esc(t.text)}</p>` : `<p class="buch-luecke">${esc(t.art === "wartet" ? BUCH_LUECKE_WARTET : BUCH_LUECKE)}</p>`).join("")}</section>`).join("")}
  </article>`;
}
function buchVorlesen() {
  if (state.buchLiest) { try { speechSynthesis.cancel(); } catch { /* egal */ } state.buchLiest = false; return render(); }
  const teile = buchDaten() ? buchVorleseTeile(buchDaten(), buchFrei()) : [];
  if (!teile.length) return;
  try {
    speechSynthesis.cancel();
    teile.forEach((t, i) => { const u = new SpeechSynthesisUtterance(t); u.lang = "de-AT"; if (i === teile.length - 1) u.onend = () => { state.buchLiest = false; if (location.hash === "#buch") render(); }; speechSynthesis.speak(u); });
    state.buchLiest = true;
  } catch { state.buchLiest = false; }
  render();
}
// ---------- Das Lumi-Buch ende ----------

// ---------- Module (art = "modul"): Katalogkarte, Schieber, aktiv/inaktiv, löschen, Ansicht in der Sandbox ----------
// Sicherheit: SICHERHEIT.md, Abschnitt Module. Das Modul läuft in einem eigenen Rahmen (web/modul-host.js) und erreicht
// die App nur über die geprüfte Brücke; welches Modul spricht, setzt diese Datei selbst.

/** Darf man dieses Modul laden? Heute darf es jeder. Kauf oder Abo (offen) kommen hier davor. */
const darfLaden = (e) => appPasst(e);

async function moduleStandLaden() {
  if (!desktop) return;
  try { state.modul.stand = await client.moduleStand(); } catch { state.modul.stand = {}; }
  try { state.modul.skin = await client.skinStand(); } catch { state.modul.skin = null; }
}

// ---------- Skins: höchstens einer aktiv; Notfallseiten zeigen immer das Grundaussehen ----------
let skinStil = null;
async function skinAnwenden() {
  if (!desktop) return;
  let r = null;
  try { r = await client.skinCss(); } catch (e) { console.error("Skin", e); }
  if (!r) { skinStil?.remove(); skinStil = null; return; }
  if (!skinStil) { skinStil = document.createElement("style"); skinStil.id = "skin-stil"; document.head.appendChild(skinStil); }
  skinStil.dataset.skin = r.id;
  skinStil.textContent = r.css;
  skinFuerSeite();
}
function skinFuerSeite() {
  if (!skinStil) return;
  const route = location.hash.slice(1) || "start";
  skinStil.media = route === "notfall" ? "not all" : "all"; // Notfall: immer Grundaussehen
  document.body.classList.toggle("of-grundaussehen", route === "notfall");
}

const schieber = ({ an, art, text, attr }) => `<button type="button" role="switch" aria-checked="${an}" class="schieber schieber-${art}" ${attr}><span class="schieber-bahn" aria-hidden="true"><span class="schieber-knopf"></span></span><span class="schieber-text">${text}</span></button>`;

function sliderSchluessel(id, quelle) {
  if (installiertesPaket(id)) return `inst:${id}`;
  return quelle.art === "ordner" ? `ordner:${quelle.pfad}` : `katalog:${id}`;
}

function sliderHtml(key, e) {
  const v = state.modul.vorschau[key];
  const folien = Array.isArray(v) && v.length ? v : (e.vorschau?.folien ?? []); // ohne Bilder: die Texte aus dem Katalog
  if (!folien.length) return v === undefined ? `<div class="slider slider-leer" data-slider="${esc(key)}"><span class="muted of-klein">Vorschau wird geladen …</span></div>` : "";
  const i = Math.min(state.modul.folie[key] ?? 0, folien.length - 1);
  const f = folien[i];
  return `<div class="slider" data-slider="${esc(key)}" role="group" aria-roledescription="Slideshow" aria-label="Vorschau, Folie ${i + 1} von ${folien.length}">
    <div class="slider-bild">${f.bild_daten ? `<img src="${esc(f.bild_daten)}" alt="${esc(f.alt)}">` : `<span class="muted of-klein">${esc(f.alt)}</span>`}</div>
    <div class="slider-text"><strong>${esc(f.titel)}</strong><span>${esc(f.text)}</span></div>
    <div class="slider-nav"><button type="button" class="btn btn-sm of-btn of-btn--klein" data-folie="${esc(key)}" data-richtung="-1" aria-label="Vorherige Folie">‹</button><span class="muted mono of-klein of-mono">${i + 1} / ${folien.length}</span><button type="button" class="btn btn-sm of-btn of-btn--klein" data-folie="${esc(key)}" data-richtung="1" aria-label="Nächste Folie">›</button></div>
  </div>`;
}

function loeschDialog(id) {
  const bytes = state.modul.stand[id]?.daten_bytes ?? 0;
  return `<div class="modul-loeschen" role="group" aria-label="Modul löschen">
    <label for="modul-loeschwort">Zum Löschen das Wort <strong>löschen</strong> eintippen:</label>
    <input class="of-input" type="text" id="modul-loeschwort" autocomplete="off" autocapitalize="off" spellcheck="false">
    <fieldset><legend>Was passiert mit den gespeicherten Daten${bytes ? ` (${groesse(bytes)})` : ""}?</legend>
      <label><input type="radio" name="modul-daten" value="behalten" checked> behalten – bei einer Neuinstallation sind sie wieder da</label>
      <label><input type="radio" name="modul-daten" value="loeschen"> mitlöschen</label></fieldset>
    <div class="modul-loeschen-knoepfe"><button type="button" class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-modul-loeschen-jetzt="${esc(id)}" disabled>Endgültig löschen</button> <button type="button" class="btn btn-sm of-btn of-btn--klein" data-modul-loeschen-abbrechen>Abbrechen</button></div>
  </div>`;
}

/** Katalogkarte eines Moduls. quelle: { art: "katalog" } oder { art: "ordner", pfad } (lokal, nicht veröffentlicht). */
function modulKarte(e, quelle) {
  const inst = installiertesPaket(e.id);
  const skin = (inst?.manifest.art ?? e.art) === "skin";
  const aktiv = skin ? state.modul.skin === e.id : state.modul.stand[e.id]?.aktiv ?? true;
  let steuerung;
  if (!desktop) steuerung = `<span class="tag of-plakette">Nur in der Desktop-App</span>`;
  else if (inst) {
    const neuer = e.version && versionVergleich(e.version, inst.manifest.version) > 0 && appPasst(e);
    steuerung = `${schieber({ an: aktiv, art: "aktiv", text: aktiv ? "aktiv" : "inaktiv", attr: `data-modul-aktiv="${esc(e.id)}" aria-label="${esc(e.titel)} ${aktiv ? "aktiv" : "inaktiv"}"` })}
      ${skin ? "" : `<button type="button" class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-modul-start="${esc(e.id)}" ${aktiv ? "" : "disabled title=\"Erst aktiv schalten\""}>Öffnen</button>`}
      ${neuer ? `<button type="button" class="btn btn-sm of-btn of-btn--klein" data-modul-laden="${esc(e.id)}" ${quelle.art === "ordner" ? `data-pfad="${esc(quelle.pfad)}"` : ""}>Aktualisieren</button>` : ""}
      <button type="button" class="btn btn-sm of-btn of-btn--klein" data-modul-loeschen="${esc(e.id)}">löschen</button>`;
  } else if (e.status && e.status !== "verfuegbar") steuerung = `<span class="tag tag-warn of-plakette of-plakette--warnung">Geplant</span>`;
  else if (!darfLaden(e)) steuerung = braucht(e);
  else steuerung = schieber({ an: false, art: "laden", text: "laden", attr: `data-modul-laden="${esc(e.id)}" ${quelle.art === "ordner" ? `data-pfad="${esc(quelle.pfad)}"` : ""} aria-label="${esc(e.titel)} laden"` });
  return `<div class="card pkg modul-karte of-karte of-paket" data-modul-karte="${esc(e.id)}">
    <div class="pkg-head"><h3 style="margin:0">${esc(e.titel)}</h3><span><span class="tag of-plakette">${skin ? "Skin" : "Modul"}</span>${quelle.art === "ordner" ? ' <span class="tag tag-warn of-plakette of-plakette--warnung">lokal, nicht veröffentlicht</span>' : ""}${inst ? ` <span class="tag of-plakette ${aktiv ? "tag-ok of-plakette--offline" : ""}">${aktiv ? "Geladen" : "Inaktiv"}</span>` : ""}</span></div>
    <p>${esc(e.beschreibung)}</p>
    ${(inst?.manifest.ki_generiert ?? e.ki_generiert) ? `<p class="muted of-klein" style="margin:-.3rem 0 .5rem"><span class="tag of-plakette">KI</span> Bilder KI-generiert, Herkunft im Paket</p>` : ""}
    ${sliderHtml(sliderSchluessel(e.id, quelle), e)}
    <div class="pkg-foot"><span class="muted mono of-klein of-mono" style="font-size:.85rem">${groesse(e.groesse)}${e.version ? ` · ${esc(e.version)}` : ""}${e.alter_ab ? ` · ab ${e.alter_ab} Jahren` : ""}</span><span class="modul-steuerung">${steuerung}</span></div>
    ${state.modul.loeschen === e.id ? loeschDialog(e.id) : ""}
  </div>`;
}

/** Lokale Quelle: ein Ordner mit signierten, noch nicht veröffentlichten Paketen (Redaktionsablage). */
function lokaleQuelleHtml() {
  const l = state.modul.lokal;
  const inKatalog = new Set((katalog()?.pakete ?? []).map((p) => p.id));
  const karten = (l?.pakete ?? []).filter((p) => (p.art === "modul" || p.art === "skin") && !inKatalog.has(p.id) && (state.filter === "Alle" || state.filter === ARTEN[p.art]));
  const probe = desktop.info?.entwickler ? ` <button type="button" class="btn btn-sm of-btn of-btn--klein" data-modul-probe>Sandbox-Probe …</button>` : "";
  return `<div class="card of-karte" style="margin-bottom:1rem"><h3>Lokale Quelle</h3>
    <p class="muted of-klein" style="margin:0 0 .75rem">Module und Skins, die noch nicht im Katalog sind (Redaktionsablage). Geladen wird wie vom Stick: Der Kern prüft Signatur, Redaktionsschlüssel und jede Datei.</p>
    <button type="button" class="btn btn-sm of-btn of-btn--klein" data-modul-quelle>${l ? "Anderen Ordner wählen …" : "Ordner wählen …"}</button>${l ? ` <span class="muted mono of-klein of-mono" style="font-size:.8rem">${esc(l.pfad)}</span>` : ""}${probe}
    ${l && !karten.length ? `<p class="muted of-klein" style="margin:.75rem 0 0">Dort liegt kein neues, gültig signiertes Modul.</p>` : ""}
    ${karten.length ? `<div class="grid grid-2" style="margin-top:.75rem">${karten.map((p) => modulKarte(p, { art: "ordner", pfad: p.pfad })).join("")}</div>` : ""}
  </div>`;
}

async function lokaleQuelleLaden(pfad) {
  try { state.modul.lokal = { pfad, pakete: await client.lokalePakete(pfad) }; speicher.set("modul-quelle", pfad); }
  catch (e) { zeige("bib-msg", "Ordner nicht lesbar: " + esc(String(e?.message ?? e)), "err"); }
}

/** Vorschaubilder nachladen, ohne die Seite neu aufzubauen: nur der jeweilige Slider wird ersetzt. */
const vorschauLaeuft = new Set();
function vorschauenNachladen() {
  if (!desktop) return;
  for (const el of main.querySelectorAll("[data-slider]")) {
    const key = el.dataset.slider;
    if (key in state.modul.vorschau || vorschauLaeuft.has(key)) continue;
    vorschauLaeuft.add(key);
    const [art, ...rest] = key.split(":"); const wert = rest.join(":");
    const laden = art === "inst" ? client.vorschauInstalliert(wert) : art === "ordner" ? client.vorschauOrdner(wert) : client.vorschauKatalog(wert);
    laden.then((f) => { state.modul.vorschau[key] = f; }, () => { state.modul.vorschau[key] = []; }).finally(() => { vorschauLaeuft.delete(key); sliderErneuern(key); });
  }
}
function sliderErneuern(key) {
  for (const el of main.querySelectorAll(`[data-slider="${CSS.escape(key)}"]`)) {
    const karte = el.closest("[data-modul-karte]");
    const id = karte?.dataset.modulKarte;
    const e = katalog()?.pakete.find((p) => p.id === id) ?? state.modul.lokal?.pakete.find((p) => p.id === id) ?? {};
    const neu = sliderHtml(key, e);
    if (neu) el.outerHTML = neu; else el.remove();
  }
}

async function modulAktion(b) {
  const d = b.dataset;
  if (d.folie) {
    const n = (state.modul.vorschau[d.folie]?.length || 5);
    state.modul.folie[d.folie] = ((state.modul.folie[d.folie] ?? 0) + Number(d.richtung) + n) % n;
    return sliderErneuern(d.folie);
  }
  if (b.hasAttribute("data-modul-quelle")) { const p = await client.ordnerWaehlen("Ordner mit Modulen wählen"); if (p) { await lokaleQuelleLaden(p); render(); } return; }
  if (d.modulLaden) {
    b.setAttribute("aria-checked", "true"); b.disabled = true; b.querySelector(".schieber-text").textContent = "lädt …";
    if (d.pfad) await einspielenVonOrdner(d.pfad); else await installiereMitMeldung(d.modulLaden, "bib-msg");
    delete state.modul.vorschau[`katalog:${d.modulLaden}`];
    await moduleStandLaden(); return render();
  }
  if (d.modulAktiv) {
    const id = d.modulAktiv;
    try {
      if (installiertesPaket(id)?.manifest.art === "skin") { await client.skinAktivieren(state.modul.skin === id ? null : id); await moduleStandLaden(); await skinAnwenden(); }
      else { await client.modulAktivSetzen(id, !(state.modul.stand[id]?.aktiv ?? true)); await moduleStandLaden(); }
    } catch (e) { zeige("bib-msg", esc(String(e?.message ?? e)), "err"); }
    return render();
  }
  if (d.modulStart) { const e = installiertesPaket(d.modulStart); state.modul.offen = { id: d.modulStart, titel: e?.manifest.titel ?? d.modulStart }; location.hash = "#modul"; return; }
  if (d.modulLoeschen) { state.modul.loeschen = d.modulLoeschen; render(); document.getElementById("modul-loeschwort")?.focus(); return; }
  if (b.hasAttribute("data-modul-loeschen-abbrechen")) { state.modul.loeschen = null; return render(); }
  if (d.modulLoeschenJetzt) {
    const id = d.modulLoeschenJetzt;
    const wort = document.getElementById("modul-loeschwort")?.value ?? "";
    const daten = document.querySelector('input[name="modul-daten"]:checked')?.value === "loeschen";
    try {
      await client.modulLoeschen(id, wort, daten);
      state.modul.loeschen = null; delete state.modul.vorschau[`inst:${id}`];
      await moduleStandLaden(); await skinAnwenden(); render();
      zeige("bib-msg", `Gelöscht${daten ? ", mit den gespeicherten Daten" : ", die gespeicherten Daten bleiben für eine Neuinstallation"}.`, "ok");
    } catch (e) { zeige("bib-msg", esc(String(e?.message ?? e)), "err"); }
    return;
  }
  if (b.hasAttribute("data-modul-probe")) {
    // Automatischer Durchlauf (werkzeug/app-probe.mjs): Ordner vorgegeben statt Dialog, nur im Entwickler-Build
    const p = (desktop.info?.entwickler && speicher.get("test-ordner", null)) || await client.ordnerWaehlen("Ordner des Testmoduls wählen (werkzeug/testmodule/boese)");
    if (!p) return;
    try { state.modul.offen = { id: "modul-test", titel: "Sandbox-Probe", url: await client.modulTestOeffnen(p) }; location.hash = "#modul"; }
    catch (e) { zeige("bib-msg", esc(String(e?.message ?? e)), "err"); }
  }
}

// Die Modulansicht liegt neben <main>, damit ein Neuzeichnen der Seite den laufenden Rahmen nicht neu lädt.
const modulAnsicht = document.getElementById("modul-ansicht");
let laufend = null; // { id, rahmen }

async function modulAnsichtZeigen() {
  const o = state.modul.offen;
  if (!o || !desktop) { location.hash = "#bibliothek"; return; }
  main.hidden = true; modulAnsicht.hidden = false;
  document.title = `OFFLINE – ${o.titel}`;
  if (laufend?.id === o.id) return;
  modulAnsichtVerbergen(true);
  modulAnsicht.innerHTML = `<div class="modul-kopf"><button type="button" class="btn btn-sm of-btn of-btn--klein" data-modul-zu>‹ Zurück</button><h1>${esc(o.titel)}</h1><span class="tag of-plakette" title="Läuft abgeschlossen, ohne Internet. Spricht nur über window.offline mit der App.">Sandbox · ohne Netz</span></div>
    <div class="modul-wesen" id="modul-wesen" role="status" aria-live="polite" hidden></div>
    <div class="modul-platz" id="modul-platz"></div><p class="form-msg of-meldung" id="modul-msg"></p>`;
  const id = o.id;
  try {
    const url = o.url ?? (await client.modulOeffnen(id));
    const rahmen = new ModulRahmen({ url, titel: o.titel, behaelter: document.getElementById("modul-platz"), dienste: {
      speicherLesen: (k) => client.modulSpeicherLesen(id, k),
      speicherSchreiben: (k, w) => client.modulSpeicherSchreiben(id, k, w),
      vorlesen: async (t) => { speechSynthesis.cancel(); speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(t), { lang: "de-AT" })); },
      drucken: async (html) => {
        document.getElementById("druck-bereich").replaceChildren(druckTeil(html));
        try { await client.drucken(); } catch { print(); }
      },
      // Spiel-Log (ab 0.4.0): geprüft in web/modul-host.js; die Quelle setzt die App, lesbar sind nur die eigenen Einträge
      spielMelden: async (m) => spielLogDazu({ quelle: `modul:${id}`, ...m }),
      spielListe: async () => spielLog().filter((e) => e.quelle === `modul:${id}`).slice(-200).map(({ quelle, ...e }) => e),
      wesenSagen: async (t) => {
        if (!wesen.mitFigur() || (!wesen.benannt() && !ohneIch(t))) return; // nur mit Figur, und ohne Namen kein „ich“
        const el = document.getElementById("modul-wesen");
        if (!el) return;
        el.textContent = `${wesen.anzeigename()}: „${t}“`; el.hidden = false;
        clearTimeout(el._zu); el._zu = setTimeout(() => { el.hidden = true; }, 9000);
      },
    } });
    laufend = { id, rahmen };
  } catch (e) {
    zeige("modul-msg", esc(String(e?.message ?? e)), "err");
  }
}

function modulAnsichtVerbergen(nurRahmen = false) {
  if (laufend) { laufend.rahmen.schliessen(); client.modulSchliessen(laufend.id).catch(() => {}); laufend = null; }
  if (nurRahmen) return;
  modulAnsicht.hidden = true; modulAnsicht.innerHTML = ""; main.hidden = false;
  document.getElementById("druck-bereich")?.replaceChildren();
}
modulAnsicht.addEventListener("click", (e) => {
  if (e.target.closest("[data-modul-zu]")) { state.modul.offen = null; location.hash = "#bibliothek"; }
});

// ---------- Werkzeuge ohne Netz: Radio, Sonne & Mond, Rechner ----------
const HAUPTSTAEDTE = { Wien: [48.21, 16.37], Burgenland: [47.85, 16.52], Kärnten: [46.62, 14.31], Niederösterreich: [48.20, 15.62], Oberösterreich: [48.31, 14.29], Salzburg: [47.80, 13.04], Steiermark: [47.07, 15.44], Tirol: [47.27, 11.40], Vorarlberg: [47.50, 9.75] };
const RAD = Math.PI / 180;
// Sonnenauf- und -untergang nach dem NOAA-Verfahren (Genauigkeit ± 1–2 Minuten)
function sonnenzeiten(lat, lon, d) {
  // Tage seit J2000 (1.1.2000 12:00 UTC), ganzzahlig für den gewählten Kalendertag
  const tag = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12) - Date.UTC(2000, 0, 1, 12)) / 86400000);
  const berechne = (aufgang, hoehe) => {
    const jstern = tag + 0.0008 - lon / 360; // mittlerer Sonnenmittag am Ort: östlich früher (UTC)
    const M = (357.5291 + 0.98560028 * jstern) % 360;
    const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
    const L = (M + C + 180 + 102.9372) % 360;
    const transit = 2451545 + jstern + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * L * RAD);
    const dekl = Math.asin(Math.sin(L * RAD) * Math.sin(23.4397 * RAD));
    const cosH = (Math.sin(hoehe * RAD) - Math.sin(lat * RAD) * Math.sin(dekl)) / (Math.cos(lat * RAD) * Math.cos(dekl));
    if (cosH > 1 || cosH < -1) return null;
    const H = Math.acos(cosH) / RAD / 360;
    const jd = transit + (aufgang ? -H : H); // die Länge steckt schon im Sonnenmittag
    return new Date((jd - 2440587.5) * 86400000);
  };
  return { aufgang: berechne(true, -0.833), untergang: berechne(false, -0.833), daemmerungMorgen: berechne(true, -6), daemmerungAbend: berechne(false, -6) };
}
function mondphase(d) {
  const synodisch = 29.530588853;
  const alter = (((d.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000) % synodisch + synodisch) % synodisch;
  const anteil = alter / synodisch;
  const beleuchtet = Math.round((1 - Math.cos(anteil * 2 * Math.PI)) / 2 * 100);
  const namen = ["Neumond", "zunehmende Sichel", "erstes Viertel", "zunehmender Mond", "Vollmond", "abnehmender Mond", "letztes Viertel", "abnehmende Sichel"];
  const symbole = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  const i = Math.round(anteil * 8) % 8;
  return { name: namen[i], symbol: symbole[i], beleuchtet, alter: Math.round(alter), naechsterVollmond: Math.round(((0.5 - anteil + 1) % 1) * synodisch), naechsterNeumond: Math.round(((1 - anteil) % 1) * synodisch) };
}
const uhr = (d) => (d ? d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" }) : "–");
const EINHEITEN = {
  laenge: { name: "Länge", basis: "m", e: { mm: 0.001, cm: 0.01, m: 1, km: 1000, Zoll: 0.0254, Fuß: 0.3048, Meile: 1609.344, Seemeile: 1852 } },
  gewicht: { name: "Gewicht", basis: "g", e: { g: 1, dag: 10, kg: 1000, t: 1e6, Unze: 28.3495, Pfund: 453.592 } },
  volumen: { name: "Volumen", basis: "ml", e: { ml: 1, cl: 10, l: 1000, "TL": 5, "EL": 15, "Tasse (250 ml)": 250, "Cup (US)": 236.6, "Gallone (US)": 3785.41 } },
  flaeche: { name: "Fläche", basis: "m²", e: { "m²": 1, a: 100, ha: 10000, "km²": 1e6, Joch: 5755 } },
  temperatur: { name: "Temperatur", basis: "°C", e: { "°C": 1, "°F": 1, K: 1 } },
};
function umrechnen(art, wert, von, nach) {
  if (!Number.isFinite(wert)) return null;
  if (art === "temperatur") {
    const c = von === "°C" ? wert : von === "°F" ? (wert - 32) * 5 / 9 : wert - 273.15;
    return nach === "°C" ? c : nach === "°F" ? c * 9 / 5 + 32 : c + 273.15;
  }
  const e = EINHEITEN[art].e;
  return (wert * e[von]) / e[nach];
}
const zahl = (x) => (x === null ? "–" : new Intl.NumberFormat("de-AT", { maximumSignificantDigits: 6 }).format(x));
const KOCHMASSE = [["1 TL", "5 ml"], ["1 EL", "15 ml"], ["1 Tasse", "250 ml"], ["1 Schuss", "ca. 5 ml"], ["1 Messerspitze", "ca. 0,5 g"], ["1 EL Mehl", "ca. 10 g"], ["1 EL Zucker", "ca. 15 g"], ["1 EL Öl", "ca. 12 g"], ["1 EL Honig", "ca. 20 g"], ["1 Tasse Reis", "ca. 200 g"], ["1 Tasse Mehl", "ca. 130 g"], ["1 Würfel Germ", "42 g = 2 Pkg. Trockengerm"], ["1 Ei (M)", "ca. 55 g"], ["1 Pkg. Backpulver", "ca. 16 g"]];

// ---------- Sprachaufnahme (Diktat) – für Notizen und Tresor ----------
const aufnahme = { rec: null, teile: [], start: 0, timer: null, ziel: null };
function aufnahmeTyp() {
  for (const t of ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg"]) if (window.MediaRecorder?.isTypeSupported?.(t)) return t;
  return "";
}
async function aufnahmeStart(ziel, melde) {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { melde("Aufnahme wird von diesem System nicht unterstützt.", "err"); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const typ = aufnahmeTyp();
    const rec = new MediaRecorder(stream, typ ? { mimeType: typ } : undefined);
    aufnahme.rec = rec; aufnahme.teile = []; aufnahme.start = Date.now(); aufnahme.ziel = ziel;
    rec.ondataavailable = (e) => { if (e.data.size) aufnahme.teile.push(e.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      clearInterval(aufnahme.timer);
      const blob = new Blob(aufnahme.teile, { type: rec.mimeType || typ || "audio/webm" });
      const sek = Math.round((Date.now() - aufnahme.start) / 1000);
      aufnahme.rec = null;
      if (!blob.size) { melde("Nichts aufgenommen.", "err"); return; }
      const b64 = await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result.split(",")[1]); r.readAsDataURL(blob); });
      const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
      const name = `Diktat ${new Date().toLocaleString("de-AT", { dateStyle: "short", timeStyle: "short" })} (${Math.floor(sek / 60)}:${String(sek % 60).padStart(2, "0")}).${ext}`;
      try { await ziel.speichern(name, blob.type.split(";")[0], b64); melde("Aufnahme gespeichert.", "ok"); } catch (e) { melde("Nicht gespeichert: " + esc(String(e?.message ?? e)), "err"); }
    };
    rec.start(1000);
    aufnahme.timer = setInterval(() => { const b = document.querySelector("[data-aufnahme]"); if (b) { const sek = Math.round((Date.now() - aufnahme.start) / 1000); b.textContent = `■ Stopp (${Math.floor(sek / 60)}:${String(sek % 60).padStart(2, "0")})`; } }, 500);
    render();
  } catch (e) { melde("Kein Zugriff auf das Mikrofon: " + esc(String(e?.message ?? e)), "err"); }
}
function aufnahmeStopp() { aufnahme.rec?.state === "recording" && aufnahme.rec.stop(); }
const aufnahmeKnopf = () => aufnahme.rec ? `<button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-aufnahme>■ Stopp</button>` : `<button class="btn btn-sm of-btn of-btn--klein" data-aufnahme title="Sprachnotiz aufnehmen">● Diktat aufnehmen</button>`;

// Vorschau eines Anhangs (Bild, Ton, PDF, Text) aus Base64 – nur im Speicher
function vorschauAus(a, b64) {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return { id: a.id, typ: a.typ, name: a.name, url: URL.createObjectURL(new Blob([bytes], { type: a.typ })), text: a.typ.startsWith("text/") ? new TextDecoder().decode(bytes) : null };
}
const vorschauHtml = (v) => v.typ.startsWith("image/") ? `<img src="${v.url}" alt="${esc(v.name)}">` : v.typ.startsWith("audio/") ? `<audio controls src="${v.url}" style="width:100%"></audio>` : v.typ === "application/pdf" ? `<iframe src="${v.url}" title="${esc(v.name)}"></iframe>` : `<pre style="white-space:pre-wrap">${esc(v.text ?? "")}</pre>`;
const anhangZeile = (a, aktiv, prefix) => `<div class="anhang"><span>${a.typ.startsWith("audio/") ? "🎙 " : a.typ.startsWith("image/") ? "🖼 " : "📄 "}${esc(a.name)}</span><span class="muted mono of-klein of-mono" style="font-size:.8rem">${groesse(a.groesse)}</span><span style="margin-left:auto"><button class="btn btn-sm of-btn of-btn--klein" data-${prefix}-anzeigen="${esc(a.id)}">${aktiv ? "Ausblenden" : a.typ.startsWith("audio/") ? "Abspielen" : "Anzeigen"}</button> <button class="btn btn-sm of-btn of-btn--klein" data-${prefix}-anhang-loeschen="${esc(a.id)}">Löschen</button></span></div>`;

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
    if (b.hasAttribute("data-aufnahme") && location.hash === "#tresor") {
      if (aufnahme.rec) return aufnahmeStopp();
      const notizId = t.aktiv;
      return aufnahmeStart({ speichern: async (name, typ, b64) => { const n = await client.tresorAnhangBytes(notizId, name, typ, b64); Object.assign(state.tresor.notizen.find((x) => x.id === n.id), n); } }, tresorMeldung);
    }
    if (b.hasAttribute("data-tresor-anhang")) {
      const pfad = await client.dateiWaehlen("Foto, Scan oder Dokument in den Tresor legen"); if (!pfad) return;
      tresorMeldung("Verschlüssele und lege ab …");
      const n = await client.tresorAnhangAusDatei(t.aktiv, pfad); Object.assign(t.notizen.find((x) => x.id === n.id), n);
      return tresorMeldung("Anhang abgelegt. Das Original liegt noch dort, wo es war – wenn du es nur im Tresor willst, lösch es dort.", "ok");
    }
    if (b.dataset.tresorAnzeigen) {
      const id = b.dataset.tresorAnzeigen;
      if (t.vorschau?.id === id) { vorschauFrei(); return render(); }
      const n = t.notizen.find((x) => x.id === t.aktiv); const a = n.anhaenge.find((x) => x.id === id);
      const b64 = await client.tresorAnhangLesen(id);
      vorschauFrei();
      t.vorschau = vorschauAus(a, b64);
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
const HUELLE = ["/app.html", "/app.js", "/styles.css", "/paket-kern.js", "/paket-client.js", "/modul-host.js", "/schluessel/oeffentlich.json", "/icon.svg", "/manifest.webmanifest"];
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
    <a class="brand of-marke" href="/"><span class="brand-flag" aria-hidden="true"></span>OFFLINE</a>
    <h1 style="font-size:1.8rem;margin-top:1.5rem">Alles gelöscht.</h1>
    <p class="muted of-klein">Pakete, Notizen, Checkliste, Einstellungen und die Offline-Kopie der App sind von diesem Gerät entfernt.</p>
    <div class="card of-karte"><h3>Letzter Schritt: ${anleitungDesktop ? "das Programm deinstallieren" : "das App-Symbol entfernen"}</h3>
      ${anleitungDesktop ? `<p class="muted of-klein" style="margin:0">${esc(anleitungDesktop)}</p>` : ""}
      <p class="muted of-klein" style="margin:0;${anleitungDesktop ? "display:none" : ""}">Falls du OFFLINE als App installiert hattest, ist noch das Symbol da. Es geht nur von Hand:</p>
      <ul class="muted of-klein" style="padding-left:1.1rem;margin:.5rem 0 0;${anleitungDesktop ? "display:none" : ""}">
        <li><strong>Chrome:</strong> In der App oben rechts das Menü (⋮) → „OFFLINE deinstallieren“. Oder <span class="mono of-mono">chrome://apps</span> aufrufen, Rechtsklick auf OFFLINE → „Aus Chrome entfernen“.</li>
        <li><strong>${mac ? "Mac" : "Windows"}:</strong> ${mac ? "Im Ordner „Programme“ (bzw. Programme → Chrome-Apps) OFFLINE in den Papierkorb ziehen." : "Einstellungen → Apps → OFFLINE → Deinstallieren."}</li>
        <li><strong>Safari:</strong> Das Symbol im Dock rechtsklicken → „Aus dem Dock entfernen“, dann im Ordner „Programme“ löschen.</li>
      </ul></div>
    <p style="margin-top:1.5rem"><a class="btn of-btn" href="/">Zur Startseite</a></p></div>`;
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
  if (!el || !window.L) { if (el) el.innerHTML = '<p class="muted of-klein" style="padding:1rem">Karte konnte nicht geladen werden.</p>'; return; }
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
    ? [...new Set(treffer)].slice(0, 4).map(esc).map((t) => t.replace(/&lt;(\/?)strong&gt;/g, "<$1strong>")).join("<br><br>") + `<br><br><span class="muted of-klein" style="font-size:.85rem">Quelle: ${esc(P().manifest.titel)} ${esc(P().manifest.version)}</span>`
    : "Dazu finde ich im Österreich-Paket nichts. Mit installierter Wikipedia und dem KI-Modell kann ich in der App mehr beantworten.";
}

// ---------- Rendern & Ereignisse ----------
const main = document.getElementById("main");
const sidebar = document.getElementById("sidebar");
const menu = document.getElementById("menu");

function render() {
  const route = location.hash.slice(1) || "start";
  if (route === "modul") { modulAnsichtZeigen(); return; }
  modulAnsichtVerbergen();
  if (route !== "happen" && pauseFokus) { pauseFokus.ctrl?.abbrechen(); pauseFokus = null; } // Happen verlassen (Zurück, Navigation): zählt als abgebrochen
  document.body.classList.toggle("happen-offen", route === "happen");
  if (route === "happen") {
    if (!pauseFokus?.ctrl) { window.scrollTo(0, 0); main.scrollTop = 0; }
    pauseFokusEinbauen();
    state.tag.seiteVorher = "happen";
    document.title = "OFFLINE – Pause";
    sidebar.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); document.getElementById("sheet-hinter").hidden = true;
    document.querySelectorAll("#nav a, #tabbar a").forEach((a) => (a.dataset.route === "pause" ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    return;
  }
  if (desktop && route === "updates") client.aboStatus().then((st) => { if (st !== desktop.aboStatus) { desktop.aboStatus = st; render(); } }).catch(() => {});
  const seite = seiten[route] ? route : "start";
  main.innerHTML = seiten[seite]();
  if (seite === "start") wesen.einbauen(); else wesen.setScore(bereit());
  wesen.ansicht(seite);
  if (seite === "start") { tagesSatzZeigen(); pauseKarteWischen(); }
  const aktiv = seite === "lesen" ? "bibliothek" : seite === "kapitel" ? "start" : seite === "neues" ? "updates" : seite === "heft" || seite === "buch" || seite === "absatz" ? "uebersicht" : seite === "linie" ? "pause" : seite;
  if (seite !== "kapitel" && state.tag.liest) vorlesenStop();
  if (seite !== "buch" && state.buchLiest) { try { speechSynthesis.cancel(); } catch { /* egal */ } state.buchLiest = false; }
  document.querySelectorAll("#nav a").forEach((a) => (a.dataset.route === aktiv ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  main.classList.toggle("main-lesen", seite === "lesen");
  if ((seite === "kapitel" || seite === "neues" || seite === "heft" || seite === "linie" || seite === "pause" || seite === "buch" || seite === "absatz") && state.tag.seiteVorher !== seite) { window.scrollTo(0, 0); main.scrollTop = 0; } // beginnt oben
  state.tag.seiteVorher = seite;
  document.title = `OFFLINE – ${ROUTEN.find((r) => r[0] === seite)?.[1] ?? (seite === "kapitel" ? "Roman der Woche" : seite === "neues" ? "Was ist neu" : seite === "heft" ? `Was ${wesen.anzeigename()} gesagt hat` : seite === "linie" ? "Deine Linie" : seite === "buch" || seite === "absatz" ? "Das Lumi-Buch" : state.lesen?.titel ?? "Lesen")}`;
  if (seite === "karte") karteStarten();
  if (seite === "bibliothek") vorschauenNachladen();
  skinFuerSeite();
  sidebar.classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
  document.getElementById("tab-mehr")?.setAttribute("aria-expanded", "false"); document.getElementById("sheet-hinter").hidden = true;
  document.querySelectorAll("#tabbar a").forEach((a) => (a.dataset.route === aktiv ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
}

main.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.tagesplanKarte) { const p = tagesplan(); p.karten[t.dataset.tagesplanKarte] = t.checked; planSpeichern(p); return; }
  if (t.dataset.tagesplan) {
    const p = tagesplan(), k = t.dataset.tagesplan;
    p[k] = k === "sparmodus" ? t.checked : k === "schlussUm" ? (t.value === "" ? null : Number(t.value)) : Number(t.value);
    planSpeichern(p); if (k === "tiefe") vorratAuffuellen(); return;
  }
  if (t.dataset.check) { state.checks[t.dataset.check] = t.checked; speicher.set("checks", state.checks); return bestaetigen(`c-${t.dataset.check}`, t.checked); }
  if (t.dataset.pauseEinstellung) {
    const k = t.dataset.pauseEinstellung, roh = speicher.get("pause", null) ?? {};
    const v = k === "neuigkeit" ? Number(t.value) : t.value;
    const neu = { ...roh, [k]: v };
    if (k === "alter" && v === "kind") neu.an = false; // unter 14 gibt es Pause nicht
    speicher.set("pause", neu); return render();
  }
  if (t.dataset.vorhaben) { vorhabenSpeichern(vorhaben().map((v) => (v.id === t.dataset.vorhaben ? { ...v, erledigt: t.checked ? new Date().toISOString() : null } : v))); return; }
  if (t.dataset.abo) { state.abo[t.dataset.abo] = t.checked; aboSpeichern(); render(); }
  if (t.dataset.zeit) { state.abo[t.dataset.zeit] = t.value; aboSpeichern(); }
  if (t.dataset.wesen) { wesen.einstellen(t.dataset.wesen, t.type === "checkbox" ? t.checked : t.value); if (t.dataset.wesen !== "name") render(); return; }
  if (t.dataset.wesenSorte) { wesen.einstellen(t.dataset.wesenSorte, t.checked); return; }
  if (t.id === "wesen-log-filter") { state.wesenLog.filter = t.value; document.getElementById("wesen-log").innerHTML = wesen.logHtml(state.wesenLog.filter, state.wesenLog.suche); return; }
  if (t.id === "bl" || t.id === "bl2") { state.bundesland = t.value; speicher.set("bundesland", t.value); render(); }
  if (t.id === "wz-datum") { state.werkzeug.datum = t.value || null; render(); }
  if (t.id === "wz-art") { state.werkzeug.rechner = { ...state.werkzeug.rechner, art: t.value, von: Object.keys(EINHEITEN[t.value].e)[0], nach: Object.keys(EINHEITEN[t.value].e)[1] }; render(); }
  if (t.id === "wz-von") { state.werkzeug.rechner.von = t.value; render(); }
  if (t.id === "wz-nach") { state.werkzeug.rechner.nach = t.value; render(); }
  if (t.id === "wz-personen" || t.id === "wz-tage") { state.werkzeug.vorrat[t.id === "wz-personen" ? "personen" : "tage"] = Math.max(1, +t.value || 1); render(); }
});

// Klicks in der Hauptfläche und in der Download-Leiste der Seitenleiste
function beiKlick(e) {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.filter) { state.filter = b.dataset.filter; render(); }
  if (b.dataset.bestaetigen) return bestaetigen(b.dataset.bestaetigen);
  if (b.dataset.lumi) return lumiAktion(b.dataset.lumi);
  if (b.dataset.testMonate) { speicher.set("test-monate", Number(b.dataset.testMonate)); return render(); }
  if (b.dataset.testTage !== undefined) { speicher.set("test-tage", Number(b.dataset.testTage)); state.tag = { offen: {}, nochmal: false, datum: heuteDatum(), liest: false, lesen: null, schlussGezeigt: null }; vorratAuffuellen(); return render(); }
  if (b.dataset.tag) return tagAktion(b);
  if (b.hasAttribute("data-wesen-gelernt-zurueck")) { wesen.gelernt = { intervall: 90, gelesen: 0, weitergewischt: 0 }; wesen.speichern(); return render(); }
  if (b.dataset.install) installiereMitMeldung(b.dataset.install, "bib-msg");
  if ([...b.attributes].some((a) => a.name.startsWith("data-modul") || a.name === "data-folie")) return modulAktion(b);
  if ([...b.attributes].some((a) => a.name.startsWith("data-tresor")) || (b.hasAttribute("data-aufnahme") && location.hash === "#tresor")) return tresorAktion(b);
  if ([...b.attributes].some((a) => a.name.startsWith("data-notiz")) || (b.hasAttribute("data-aufnahme") && location.hash === "#notizen")) return notizAktion(b);
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
main.addEventListener("click", (e) => { const l = e.target.closest("[data-tag-lesen]"); if (l) state.tag.lesen = l.dataset.tagLesen; });
// Lumi: Startablauf (Einladung, Einschalten, Namensgabe, Ausschalten mit Rückfrage), siehe wesen.js
function lumiAktion(a) {
  if (a === "einladung-ja") wesen.einladung(true);
  else if (a === "einladung-nein") wesen.einladung(false);
  else if (a === "einschalten") wesen.einschalten();
  else if (a === "ausschalten-frage") wesen.ausschaltenFrage = true;
  else if (a === "dochnicht") wesen.ausschaltenFrage = false;
  else if (a === "ausschalten") wesen.ausschalten();
  else if (a === "spaeter") wesen.spaeter();
  else if (a === "namensfrage") wesen.namensfrage = true;
  render();
  if (a === "namensfrage" || a === "einladung-ja" || a === "einschalten") document.getElementById("lumi-name-feld")?.focus();
}
main.addEventListener("input", (e) => {
  const f = e.target.closest?.("[data-tag-pruefen]");
  if (f) state.tag.offen[f.dataset.tagPruefen] = { ...(state.tag.offen[f.dataset.tagPruefen] ?? {}), eingabe: e.target.value };
});
main.addEventListener("submit", (e) => {
  const f = e.target.closest("[data-tag-pruefen]");
  if (!f) return;
  e.preventDefault();
  const id = f.dataset.tagPruefen, eingabe = f.elements.antwort?.value ?? "";
  const k = heutigeKarten().find((x) => x.id === id);
  if (!k || !eingabe.trim()) return f.elements.antwort?.focus();
  const o = { ...(state.tag.offen[id] ?? {}), eingabe };
  // Richtig, wenn eine der Varianten aus dem Paket passt oder die ganze Lösung eingegeben wurde. Keine Zählung der Versuche.
  if (antwortRichtig(eingabe, [...k.antworten, k.loesung])) { state.tag.offen[id] = { ...o, richtig: true, falsch: false, loesung: true }; tagSetzen(k, "erledigt"); }
  else state.tag.offen[id] = { ...o, falsch: true };
  render();
  if (!state.tag.offen[id].richtig) { const feld = document.getElementById(`antwort-${id}`); if (feld) { feld.focus(); feld.select(); } }
});
main.addEventListener("submit", (e) => {
  if (!e.target.matches("[data-lumi-name-form]")) return;
  e.preventDefault();
  const n = document.getElementById("lumi-name-feld")?.value ?? "";
  if (n.trim()) { wesen.namenGeben(n); render(); }
});
main.addEventListener("input", (e) => {
  if (e.target.id === "modul-loeschwort") { const k = document.querySelector("[data-modul-loeschen-jetzt]"); if (k) k.disabled = e.target.value.trim().toLowerCase() !== "löschen"; }
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
  tresorLaden().then(() => { if (location.hash === "#tresor" || speicher.get("bereit-sockel-offen", false)) render(); }); // Sockel braucht den Tresor-Stand
}
document.getElementById("download").addEventListener("click", beiKlick);
// Sprechblase, Karte und Log des Wesens (Karte liegt außerhalb von main)
document.addEventListener("click", (e) => {
  const anker = e.target.closest("a[data-anker]");
  if (anker) setTimeout(() => { const el = document.getElementById(anker.dataset.anker); if (el) { if (el.tagName === "DETAILS") el.open = true; el.scrollIntoView({ block: "start" }); } }, 60);
  const b = e.target.closest("button"); if (!b) return;
  if (b.hasAttribute("data-wesen-zu")) { const satz = wesen.tagesSatz; wesen.tippSchliessen(); if (satz) tagSetzen({ id: `lumi-${satz}`, art: "lumi" }, "weg"); }
  if (b.dataset.lumiBuch) return buchOeffnen(b.dataset.lumiBuch);
  if (b.dataset.lumiAktion) return lumiKnopf(b);
  if (b.dataset.buch === "vorlesen") return buchVorlesen();
  if (b.dataset.pause) return pauseKnopf(b.dataset.pause, b);
  if (b.dataset.pauseZurueck) { linieSpeichern(pauseZurueckholen(pauseL(), b.dataset.pauseZurueck)); return render(); }
  if (b.dataset.pauseStufe) { const f = pauseDaten()?.formen.find((x) => x.id === b.dataset.pauseStufe); if (f) linieSpeichern(pauseSchwierigkeit(pauseL(), f, b.dataset.richtung)); return render(); }
  if (b.dataset.lumiBewerten) return lumiBewerten(b);
  if (b.dataset.lumiZurueckholen) { wesen.zurueckholen(b.dataset.lumiZurueckholen); return render(); }
  if (b.hasAttribute("data-lumi-lernen-zuruecksetzen")) { wesen.lernenZuruecksetzen(); return render(); }
  if (b.dataset.heftWeg) { wesen.heftLoeschen(b.dataset.heftWeg); return render(); }
  if (b.dataset.vorhabenWeg) { vorhabenSpeichern(vorhaben().filter((v) => v.id !== b.dataset.vorhabenWeg)); return render(); }
  if (b.dataset.wesenStern) { wesen.stern(b.dataset.wesenStern); const el = document.getElementById("wesen-log"); if (el) el.innerHTML = wesen.logHtml(state.wesenLog.filter, state.wesenLog.suche); }
});

function pauseKnopf(was, b) {
  if (was === "alter") return pauseEinschalten(b.dataset.alter);
  if (was === "aus") { speicher.set("pause", { ...(speicher.get("pause", null) ?? {}), an: false }); pauseKarte = null; return render(); }
  if (was === "spielen") { const nurAbend = !!(pauseKarte && pauseKarte.form === b.dataset.form && pauseKarte.nurAbend); return pauseStarten({ form: b.dataset.form, nurAbend }); }
  if (was === "karte-weg") { pauseKarte = null; return render(); }
  if (was === "rueckspiegel-ok") { const l = pauseL(); l.rueckspiegelAm = new Date(testJetzt()).toISOString(); linieSpeichern(l); return render(); }
  if (was === "linie-zuruecksetzen") { const l = pauseL(); linieSpeichern({ ...pauseLinieLaden(null), auffrischung: l.auffrischung }); return render(); } // Auffrischungstermine bleiben
  if (was === "log-loeschen") { speicher.set("spiel-log", []); return render(); }
}
/** Erster Knopf unter einem Satz: Zeig mir, Mach ich, Merken. Die Karte bleibt offen, bewerten kann man danach. */
function lumiKnopf(b) {
  const id = b.dataset.tipp, t = wesen.tipp(id); if (!t) return;
  if (b.dataset.lumiAktion === "zeig") return zielOeffnen(t.ziel);
  if (b.dataset.lumiAktion === "mach") vorhabenDazu(t);
  if (b.dataset.lumiAktion === "merken") wesen.merken(id);
  if (b.dataset.ort === "karte") render(); else wesen.knoepfeNeu();
}
/** Mehr davon · Passt · Nicht mehr: jede schließt den Satz. Auf der Tagesseite gilt die Karte dann als erledigt. */
function lumiBewerten(b) {
  const id = b.dataset.tipp, satz = wesen.tagesSatz;
  if (!wesen.bewerte(id, b.dataset.lumiBewerten)) return;
  if (b.dataset.ort === "karte" || satz === id) tagSetzen({ id: `lumi-${id}`, art: "lumi" }, "erledigt");
  if (b.dataset.ort === "karte" || (location.hash || "#start") === "#uebersicht") render();
}
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
  if (e.target.id === "heft-suche") { state.heftSuche = e.target.value; const l = document.getElementById("heft-liste"); if (l) l.innerHTML = wesen.heftHtml(state.heftSuche); return; }
  if (e.target.id === "wesen-log-suche") { state.wesenLog.suche = e.target.value; const pos = e.target.selectionStart; document.getElementById("wesen-log").innerHTML = wesen.logHtml(state.wesenLog.filter, state.wesenLog.suche); const s2 = document.getElementById("wesen-log-suche"); s2?.focus(); s2?.setSelectionRange(pos, pos); return; }
  if (e.target.dataset.wesen === "name") { if (!wesen.benannt()) return; wesen.einstellen("name", e.target.value); const el = document.querySelector(".wesen-text strong"); if (el) el.textContent = wesen.anzeigename(); return; }
  if (e.target.id === "wz-wert") { state.werkzeug.rechner.wert = e.target.value; const r = state.werkzeug.rechner; const el = document.getElementById("wz-ergebnis"); if (el) el.textContent = `${zahl(umrechnen(r.art, parseFloat(r.wert.replace(",", ".")), r.von, r.nach))} ${r.nach}`; }
  if (e.target.dataset.radio) { const f = (state.werkzeug.radio[state.bundesland] ??= {}); f[e.target.dataset.radio] = e.target.value.trim(); speicher.set("radio", state.werkzeug.radio); }
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
function notizMeldung(text, art = "") { zeige("notiz-msg", text, art); }
function notizVorschauFrei() { if (state.notizVorschau?.url) URL.revokeObjectURL(state.notizVorschau.url); state.notizVorschau = null; }
async function notizAktion(b) {
  const n = state.notizbuch.find((x) => x.id === state.notizAktiv);
  if (b.hasAttribute("data-aufnahme")) {
    if (aufnahme.rec) return aufnahmeStopp();
    if (!n) return;
    return aufnahmeStart({ speichern: async (name, typ, b64) => { const a = await client.notizAnhangBytes(name, typ, b64); (n.anhaenge ??= []).push(a); n.geaendert = new Date().toISOString(); notizbuchSpeichern(); render(); } }, notizMeldung);
  }
  if (b.hasAttribute("data-notiz-anhang")) {
    if (!n) return;
    const pfad = await client.dateiWaehlen("Foto oder Datei zur Notiz"); if (!pfad) return;
    try { const a = await client.notizAnhangAusDatei(pfad); (n.anhaenge ??= []).push(a); n.geaendert = new Date().toISOString(); notizbuchSpeichern(); render(); } catch (e) { notizMeldung(esc(String(e?.message ?? e)), "err"); }
    return;
  }
  if (b.dataset.notizAnzeigen) {
    const id = b.dataset.notizAnzeigen;
    if (state.notizVorschau?.id === id) { notizVorschauFrei(); return render(); }
    const a = n?.anhaenge?.find((x) => x.id === id); if (!a) return;
    try { const b64 = await client.notizAnhangLesen(id); notizVorschauFrei(); state.notizVorschau = vorschauAus(a, b64); render(); } catch (e) { notizMeldung(esc(String(e?.message ?? e)), "err"); }
    return;
  }
  if (b.dataset.notizAnhangLoeschen) {
    if (!n || !confirm("Anhang löschen?")) return;
    await client.notizAnhangLoeschen(b.dataset.notizAnhangLoeschen).catch(() => {});
    n.anhaenge = (n.anhaenge ?? []).filter((x) => x.id !== b.dataset.notizAnhangLoeschen); notizbuchSpeichern(); notizVorschauFrei(); return render();
  }
  if (b.hasAttribute("data-notiz-neu")) { const n = { id: notizId(), titel: "", text: "", geaendert: new Date().toISOString() }; state.notizbuch.push(n); state.notizAktiv = n.id; notizbuchSpeichern(); render(); document.getElementById("notiz-titel")?.focus(); return; }
  if (b.dataset.notiz) { state.notizAktiv = b.dataset.notiz; notizVorschauFrei(); return render(); }
  if (b.dataset.notizLoeschen) {
    if (!confirm("Diese Notiz samt Anhängen löschen?")) return;
    const weg = state.notizbuch.find((x) => x.id === b.dataset.notizLoeschen);
    for (const a of weg?.anhaenge ?? []) client.notizAnhangLoeschen?.(a.id).catch(() => {});
    state.notizbuch = state.notizbuch.filter((x) => x.id !== b.dataset.notizLoeschen); state.notizAktiv = null; notizbuchSpeichern(); notizVorschauFrei(); return render();
  }
  if (b.dataset.notizInTresor) {
    const n = state.notizbuch.find((x) => x.id === b.dataset.notizInTresor); if (!n) return;
    try {
      const st = await client.tresorStatus();
      if (!st.existiert || !st.offen) { alert(st.existiert ? "Bitte zuerst den Tresor öffnen, dann noch einmal „In den Tresor“." : "Bitte zuerst einen Tresor anlegen (Seite „Tresor“)."); return; }
      const neu = await client.tresorNotizSchreiben({ id: "", titel: n.titel, text: n.text, reihe: 0, geaendert: "", anhaenge: [] });
      for (const a of n.anhaenge ?? []) { const b64 = await client.notizAnhangLesen(a.id); await client.tresorAnhangBytes(neu.id, a.name, a.typ, b64); await client.notizAnhangLoeschen(a.id).catch(() => {}); }
      state.notizbuch = state.notizbuch.filter((x) => x.id !== n.id); state.notizAktiv = null; notizbuchSpeichern(); notizVorschauFrei();
      state.tresor.status = null; // beim nächsten Öffnen der Tresor-Seite neu laden
      render();
    } catch (e) { alert("Nicht verschoben: " + String(e?.message ?? e)); }
  }
}

const tabMehr = document.getElementById("tab-mehr"), sheetHinter = document.getElementById("sheet-hinter");
const blattSetzen = (open) => { sidebar.classList.toggle("open", open); tabMehr.setAttribute("aria-expanded", String(open)); menu.setAttribute("aria-expanded", String(open)); sheetHinter.hidden = !open; };
menu.addEventListener("click", () => blattSetzen(!sidebar.classList.contains("open")));
tabMehr.addEventListener("click", () => blattSetzen(!sidebar.classList.contains("open")));
sheetHinter.addEventListener("click", () => blattSetzen(false));

function netz() {
  const on = navigator.onLine;
  document.getElementById("net-dot").className = "dot " + (on ? "on" : "off");
  document.getElementById("net-text").textContent = on ? "Online – Abo kann laden" : "Offline – alles verfügbar";
  const d2 = document.getElementById("net-dot-oben"), t2 = document.getElementById("net-text-oben"); if (d2) d2.className = "dot " + (on ? "on" : "off"); if (t2) t2.textContent = on ? "Online" : "Offline";
}
async function appAngaben() {
  const el = document.getElementById("app-info");
  if (!el) return;
  if (desktop) {
    try {
      const i = await client.appInfo();
      desktop.info = i;
      if (i.entwickler && location.hash === "#bibliothek") render();
      el.textContent = `Desktop-App ${i.version} · ${i.system} ${i.arch} · Tauri ${i.tauri}`;
      el.title = `Programm: ${i.ort}\nDatenordner: ${desktop.datenordner}`;
      if (i.ort_problem && location.hash === "#updates") render();
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

// Module: Stand (aktiv/inaktiv, Daten) und die zuletzt gewählte lokale Quelle
if (desktop) (async () => {
  await moduleStandLaden();
  await skinAnwenden();
  const q = speicher.get("modul-quelle", null);
  if (q) await lokaleQuelleLaden(q);
  if (location.hash === "#bibliothek") render();
})();

// Erster Start: Österreich-Paket automatisch holen, wenn noch keins da ist. Danach still nach Updates sehen.
(async () => {
  await offeneDownloads();
  if (!P() || !PW()) {
    if (!navigator.onLine) return;
    try {
      const { katalog: k } = await ladeKatalog();
      for (const id of [BASISPAKET, "wir", "lumi-buch"]) {
        if (installiertesPaket(id)) continue;
        const e = k.pakete.find((p) => p.id === id && p.status === "verfuegbar");
        if (e && appPasst(e)) { await installiere(k, e); render(); }
      }
    } catch (err) { console.error("Erstinstallation", err); }
  } else if (navigator.onLine && state.abo.aktiv) {
    await pruefeUpdates({ still: true });
    if (katalog() && verfuegbareUpdates(katalog()).length) render();
  }
})().finally(async () => {
  vorratAuffuellen(); // danach die Vorratskammer der Tagesseite
  // Lumi-Buch (0.5.0): liegt ganz auf dem Gerät; wer es noch nicht hat (Update von 0.4), bekommt es still dazu
  if (!PB() && navigator.onLine) { try { const { katalog: k } = await ladeKatalog(); const e = k.pakete.find((p) => p.id === "lumi-buch" && p.status === "verfuegbar"); if (e && appPasst(e)) await installiere(k, e); } catch (err) { console.error("Lumi-Buch", err); } }
  // 0.5.1: Tipps ohne Absatznummern (wir vor 2026.10.04.3) einmal still auffrischen, damit „Aus dem Lumi-Buch“ sofort kommt
  if (PW() && !(inhalt(PW(), "inhalt/tipps.json")?.tipps ?? []).some((t) => t.buch) && navigator.onLine) { try { const { katalog: k } = await ladeKatalog(); const e = k.pakete.find((p) => p.id === "wir" && p.status === "verfuegbar"); if (e && appPasst(e) && versionVergleich(e.version, PW().manifest.version) > 0) { await installiere(k, e); render(); } } catch (err) { console.error("wir", err); } }
  // Pause: ist sie an und das Paket fehlt, still holen; dann der Happen beim Öffnen
  if (pauseE().an && !PP() && navigator.onLine) { try { const { katalog: k } = await ladeKatalog(); const e = k.pakete.find((p) => p.id === "pause" && p.status === "verfuegbar"); if (e && appPasst(e)) await installiere(k, e); } catch (err) { console.error("Pause", err); } }
  pauseBeimOeffnen();
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) pauseBeimOeffnen(); });
addEventListener("online", () => vorratAuffuellen());

// Service Worker nur im Web-Prototyp. In der Desktop-App liefert der Kern die Dateien; ein Worker aus 0.1.x (Windows)
// wird abgemeldet (der Kern löscht ihn zusätzlich vor dem Start, siehe lib.rs).
if ("serviceWorker" in navigator) {
  if (desktop) navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
  else navigator.serviceWorker.register("/sw.js").catch(() => {});
}
