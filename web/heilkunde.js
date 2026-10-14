// Naturheilkunde, erste Fassung (Nr. 28): Seite „Naturheilkunde“ nach Aufbau der Probe v7, Gestaltung im App-Skin.
// Alle Texte kommen aus dem Paket „heilkunde-grundstock“ (inhalt/heilkunde.json); hier stehen nur Aufbau und Zeichen.
// Zwei Einstiege: „Was plagt dich?“ (Beschwerden) und Obst · Gemüse · Kräuter · Pilze (Gruppen). Jede Karte hängt an beidem.

export const PAKET = "heilkunde-grundstock";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Zeichen je Darreichung oder Gruppe (aus der Probe v7, Farben über CSS-Variablen der Seite). */
const IC = {
  blatt: `<path d="M6 26C6 13 15 6 27 5c0 12-7 21-20 21z" fill="var(--hk-blatt)"/><path d="M8 24C13 18 18 13 24 8" stroke="var(--hk-grund)" stroke-width="1.6" fill="none"/>`,
  samen: `<ellipse cx="11" cy="12" rx="3.2" ry="5" transform="rotate(-25 11 12)" fill="var(--hk-samen)"/><ellipse cx="21" cy="11" rx="3.2" ry="5" transform="rotate(20 21 11)" fill="var(--hk-samen)"/><ellipse cx="16" cy="22" rx="3.2" ry="5" transform="rotate(-5 16 22)" fill="var(--hk-samen)"/>`,
  stoessel: `<path d="M17 4l5 2-6 12-3-1z" fill="var(--hk-stein)"/><path d="M5 16h22c0 7-5 11-11 11S5 23 5 16z" fill="var(--hk-stein)"/><rect x="9" y="26" width="14" height="3" rx="1.5" fill="var(--hk-stein)"/>`,
  honig: `<rect x="9" y="5" width="14" height="4" rx="1.5" fill="var(--hk-samen)"/><path d="M8 10h16v14a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z" fill="var(--hk-honig)"/><path d="M8 15c3 2 5-1 8 1s5-1 8 0" stroke="var(--hk-grund)" stroke-width="1.5" fill="none"/>`,
  obst: `<path d="M16 10c-6-3-11 1-11 8s5 11 8 11c1.5 0 2-1 3-1s1.5 1 3 1c3 0 8-4 8-11s-5-11-11-8z" fill="var(--hk-obst)"/><path d="M16 10c0-3 1-5 3-6" stroke="var(--hk-samen)" stroke-width="2" fill="none"/><path d="M17 8c2-3 5-3 7-2-2 2-4 3-7 2z" fill="var(--hk-blatt)"/>`,
  gemuese: `<path d="M20 9L7 27c-1 1 0 2 1 1l16-14z" fill="var(--hk-gemuese)"/><path d="M21 8c0-3 2-5 4-5-1 2-1 4-2 5 2-1 4-1 6 0-2 1-4 2-6 2z" fill="var(--hk-blatt)"/>`,
  gewuerz: `<rect x="10" y="4" width="12" height="5" rx="1.5" fill="var(--hk-stein)"/><path d="M9 10h14v16a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2z" fill="var(--hk-samen)"/><circle cx="14" cy="17" r="1.4" fill="var(--hk-grund)"/><circle cx="18" cy="20" r="1.4" fill="var(--hk-grund)"/><circle cx="14" cy="23" r="1.4" fill="var(--hk-grund)"/>`,
  pilz: `<path d="M3 16C3 9 9 5 16 5s13 4 13 11z" fill="var(--hk-pilz)"/><path d="M12 16h8l-1 11h-6z" fill="var(--hk-samen)"/>`,
};
const zeichen = (k) => (IC[k] ? `<svg class="hk-ic" viewBox="0 0 32 32" aria-hidden="true">${IC[k]}</svg>` : "");

/** Zustand: { tab: "bes"|"ogg", stapel: [{ b } | { m }], gr } */
export const startZustand = () => ({ tab: "bes", stapel: [], gr: "obst" });

/** „1 Möglichkeit“, „5 Möglichkeiten“ (in der Probe stand auch bei einer die Mehrzahl). */
const zahlText = (n, mehrzahl) => `${n} ${esc(n === 1 ? mehrzahl.replace(/en$/, "") : mehrzahl)}`;
const nach = (d) => Object.fromEntries(d.karten.map((k) => [k.id, k]));

/** Alle Verweise auf Doppelgänger: [{ von, nach }] (für den Test: jeder führt auf eine vorhandene Karte). */
export function verweise(d) {
  const aus = [];
  for (const k of d.karten) for (const v of [].concat(k.verw ?? [])) if (v && typeof v === "object") aus.push({ von: k.id, nach: v.l });
  return aus;
}

function fuss(d, land) {
  const t = d.texte, n = t.notruf[land] ?? t.notruf.at;
  return `<div class="hk-selbst"><p>${esc(t.selbst)}</p><div class="hk-not">${n.map((x) => `<span>${esc(x)}</span>`).join("")}</div></div>`;
}
function reiter(d, z) {
  const [a, b] = d.texte.reiter;
  return `<div class="hk-reiter" role="group" aria-label="Einstieg"><button type="button" data-hk-tab="bes" aria-pressed="${z.tab === "bes"}">${esc(a)}</button><button type="button" data-hk-tab="ogg" aria-pressed="${z.tab === "ogg"}">${esc(b)}</button></div>`;
}
const zurueck = (d) => `<button type="button" class="btn btn-sm of-btn of-btn--klein hk-zurueck" data-hk-zurueck>${esc(d.texte.zurueck)}</button>`;
const plak = (p) => `<span class="hk-plak${p === "überliefert" ? " hk-plak--ue" : /gift|nicht essen/.test(p) ? " hk-plak--rot" : ""}">${esc(p)}</span>`;
function zeile(x) { return `<button type="button" class="hk-zeile" data-hk-m="${esc(x.id)}">${zeichen(x.form)}<span><b>${esc(x.n)}</b><small>${esc(x.roh)}</small></span></button>`; }

function startBes(d, z, land) {
  const t = d.texte;
  return `${reiter(d, z)}<p class="hk-hinweis">${esc(t.hinweis[land] ?? t.hinweis.at)}</p>
    <div class="hk-kacheln">${Object.entries(d.beschwerden).map(([k, name]) => `<button type="button" class="hk-kachel" data-hk-b="${esc(k)}"><b>${esc(name)}</b><small>${zahlText(d.karten.filter((x) => x.bei.includes(k)).length, t.moeglichkeiten)}</small></button>`).join("")}</div>
    <div class="hk-umfang"><b>${esc(t.grundstock_titel)}</b>${t.grundstock.map((p) => `<p>${esc(p)}</p>`).join("")}</div>${fuss(d, land)}`;
}
function beschwerde(d, k, land) {
  const t = d.texte, grp = {};
  for (const x of d.karten.filter((x) => x.bei.includes(k))) (grp[x.gr ? d.gruppen[x.gr] : t.aus_dem_vorrat] ??= []).push(x);
  return `${zurueck(d)}<h2 class="hk-titel">${esc(d.beschwerden[k])}</h2>${k === "essen" ? `<p class="hk-hinweis">${esc(t.essen_hinweis)}</p>` : ""}
    <div class="hk-liste">${Object.entries(grp).map(([g, l]) => `<p class="hk-gruppe">${esc(g)}</p>${l.map(zeile).join("")}`).join("")}</div>${fuss(d, land)}`;
}
function startOgg(d, z, land) {
  const t = d.texte;
  return `${reiter(d, z)}
    <div class="hk-chips" role="group" aria-label="Gruppe">${Object.entries(d.gruppen).map(([k, n]) => `<button type="button" class="hk-chip" data-hk-gr="${esc(k)}" aria-pressed="${z.gr === k}">${esc(n)}</button>`).join("")}</div>
    <div class="hk-kacheln">${d.karten.filter((x) => x.gr === z.gr).map((x) => `<button type="button" class="hk-kachel" data-hk-m="${esc(x.id)}">${zeichen(x.form)}<b>${esc(x.n)}</b><small>${x.gift ? `<span class="hk-rot">${esc(x.plak)}</span>` : esc(x.bei.filter((b) => b !== "essen").map((b) => d.beschwerden[b]).join(", ") || t.zum_essen)}</small></button>`).join("")}</div>${fuss(d, land)}`;
}
function karte(d, id, land) {
  const t = d.texte, x = nach(d)[id];
  if (!x) return "";
  const verw = [].concat(x.verw ?? []);
  return `${zurueck(d)}<h2 class="hk-titel">${zeichen(x.form)}${esc(x.n)}</h2>
    <div class="hk-plaketten">${plak(x.plak)}${x.bsp ? `<span class="hk-bsp">${esc(t.beispiel)}</span>` : ""}</div>
    ${x.bei.length ? `<div><b>${esc(t.hilft_bei)}</b><div class="hk-chips">${x.bei.map((b) => `<button type="button" class="hk-chip" data-hk-b="${esc(b)}">${esc(d.beschwerden[b])}</button>`).join("")}</div></div>` : ""}
    <dl class="hk-fakten"><dt>${esc(t.fakten[0])}</dt><dd>${esc(x.wo)}</dd><dt>${esc(t.fakten[1])}</dt><dd>${esc(x.anbau)}</dd><dt>${esc(t.fakten[2])}</dt><dd>${esc(x.roh)}</dd></dl>
    ${x.foto ? `<div class="hk-foto">${esc(t.foto)}</div>` : ""}
    ${x.erkennen ? `<div class="hk-block"><h3>${esc(t.erkennen)}</h3><ol class="hk-schritte">${x.erkennen.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></div>` : ""}
    ${verw.length ? `<div class="hk-verw"><b>${esc(t.verwechslung)}</b> ${verw.map((v) => (typeof v === "string" ? `<p>${esc(v)}</p>` : `<p>${esc(v.t)}</p><button type="button" class="hk-link" data-hk-m="${esc(v.l)}">${esc(nach(d)[v.l]?.n ?? v.l)} ${esc(t.mit_fotos)}</button>`)).join("")}</div>` : ""}
    <div><b>${esc(x.gift ? t.was_tun : t.so_gehts)}</b><ol class="hk-schritte">${x.s.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></div>
    ${x.folgen ? `<div class="hk-verw"><b>${esc(t.folgen)}</b> ${esc(x.folgen)}</div>` : ""}
    ${x.kueche ? `<div class="hk-kueche"><b>${esc(t.kueche)}</b><ul>${x.kueche.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>` : ""}
    <div class="hk-wer"><b>${esc(t.wer_nicht)}</b> ${esc(x.wer)}</div>
    ${x.mehr?.length ? `<details class="hk-mehr"><summary>${esc(t.mehr)}</summary>${x.mehr.map((s) => `<p>${esc(s)}</p>`).join("")}</details>` : ""}${fuss(d, land)}`;
}

/** Inhalt der Seite (ohne Kopf). d: Paketdaten, z: Zustand, land: "at" | "de" | "ch". */
export function seiteHtml(d, z, land = "at") {
  const oben = z.stapel.at(-1);
  const inhalt = !oben ? (z.tab === "bes" ? startBes(d, z, land) : startOgg(d, z, land)) : oben.m ? karte(d, oben.m, land) : beschwerde(d, oben.b, land);
  return `<div class="heilkunde">${inhalt}</div>`;
}

/** Klick auf der Seite. Gibt true zurück, wenn sich der Zustand geändert hat. */
export function klick(z, el) {
  const b = el.closest("[data-hk-tab], [data-hk-zurueck], [data-hk-gr], [data-hk-b], [data-hk-m]");
  if (!b) return false;
  if (b.dataset.hkTab) { z.tab = b.dataset.hkTab; z.stapel = []; }
  else if (b.hasAttribute("data-hk-zurueck")) z.stapel.pop();
  else if (b.dataset.hkGr) z.gr = b.dataset.hkGr;
  else if (b.dataset.hkB) z.stapel.push({ b: b.dataset.hkB });
  else if (b.dataset.hkM) z.stapel.push({ m: b.dataset.hkM });
  return true;
}
