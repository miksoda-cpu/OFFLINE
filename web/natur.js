// Naturheilkunde (0.6.0, Auftrag 2026-10-05-08): Nachschlagewerk aus dem Paket „naturheilkunde“, offen, ohne Passwort,
// ohne Daten über den Nutzer. Im Menü nur, wenn das Paket installiert ist (heute nur über den internen Kanal).
// Regeln stehen hier im Code, nicht nur in den Daten:
// - Als Mittel erscheint nur, was ort = suche_und_karte UND pruefstatus = fachlich_geprueft hat (heute: nichts).
// - Psychoaktives, Abtreibendes, Giftiges (Marken) und Warnkarten erscheinen nie als Mittel, nur als Warnung –
//   auch nicht mit einem anderen Prüfstatus.
// - Gesperrte Zeilen aus Teil 6 stehen nur im Handbuch (im Text des Kapitels), nie in Suche oder Karten.
// - Oben auf jeder Seite die Erste-Hilfe-Karte aus Teil 1, darunter der Streifen „In Prüfung“.

export const SPERR_MARKEN = ["psychoaktiv", "abtreibend", "giftig"];
export const STREIFEN = "In Prüfung. Noch nicht fachlich geprüft. Nicht zur Anwendung.";
export const NICHTS_GEPRUEFT = "Dazu ist noch nichts fachlich geprüft.";
export const ANWENDUNGEN = [["tee", "Tee"], ["aeusserlich", "äußerlich"], ["kauen", "kauen"]];
const BELEG = { belegt: "belegt", traditionell: "traditionell", ueberliefert_nicht_geprueft: "überliefert, nicht geprüft", unklar: "unklar", warnung: "Warnung" };
const ORT = { handbuch: "nur Handbuch", suche_und_karte: "Suche und Karte" };
const PRUEF = { in_pruefung: "in Prüfung", fachlich_geprueft: "fachlich geprüft" };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Darf dieser Eintrag als Mittel erscheinen? */
export const alsMittel = (e) => !!e && e.ort === "suche_und_karte" && e.pruefstatus === "fachlich_geprueft" && e.belegbarkeit !== "warnung"
  && e.teil !== 1 && !(e.marken ?? []).some((m) => SPERR_MARKEN.includes(m));
/** Ist das eine Warnung (Giftkapitel, Marke oder Stufe Warnung)? */
export const istWarnung = (e) => !!e && (e.teil === 1 || e.belegbarkeit === "warnung" || (e.marken ?? []).some((m) => SPERR_MARKEN.includes(m)));

const nachId = (d) => { const m = new Map(d.eintraege.map((e) => [e.id, e])); return (id) => m.get(id); };
const eindeutig = (liste) => [...new Map(liste.filter(Boolean).map((e) => [e.id, e])).values()];
/** Warnkarten zu Kandidaten: Doppelgänger aus „Ich finde …“, in deren Zeile ein Kandidat steht, dazu Kandidaten mit Marke. */
function warnungenZu(d, kandidaten) {
  const e = nachId(d), ids = new Set(kandidaten.map((k) => k.id));
  const doppel = d.waldfunde_index.filter((w) => w.kandidaten.some((k) => ids.has(k))).flatMap((w) => w.doppelgaenger.map(e));
  return eindeutig([...doppel, ...kandidaten.filter(istWarnung)]);
}

/** Beschwerde-Suche: { eintrag (Index-Zeile), mittel, warnungen }. mit: gewählte Mitbeschwerde verfeinert. */
export function beschwerdeErgebnis(d, beschwerde, mit = null) {
  const b = d.beschwerden_index.find((x) => x.beschwerde === beschwerde);
  if (!b) return null;
  const e = nachId(d);
  let kandidaten = b.eintraege.map(e).filter(Boolean);
  if (mit) { const f = kandidaten.filter((k) => (k.beschwerden ?? []).some((x) => x.toLowerCase().includes(mit.toLowerCase()))); if (f.length) kandidaten = f; }
  return { index: b, mittel: kandidaten.filter(alsMittel), warnungen: warnungenZu(d, kandidaten) };
}
/** „Ich finde …“: Doppelgänger immer zuerst, dann Kandidaten (zum Nachlesen; als Mittel nur, was geprüft ist). */
export function findeErgebnis(d, merkmal) {
  const w = d.waldfunde_index.find((x) => x.merkmal === merkmal);
  if (!w) return null;
  const e = nachId(d);
  const doppel = eindeutig(w.doppelgaenger.map(e));
  const kand = eindeutig(w.kandidaten.map(e)).filter((k) => !doppel.some((x) => x.id === k.id));
  return { index: w, doppelgaenger: doppel, kandidaten: [...kand.filter(istWarnung), ...kand.filter((k) => !istWarnung(k))] };
}
export function anwendungErgebnis(d, art) {
  const kandidaten = d.eintraege.filter((e) => (e.anwendung ?? []).includes(art));
  return { mittel: kandidaten.filter(alsMittel), warnungen: kandidaten.filter(istWarnung) };
}
/** Volltextsuche im Handbuch (ohne Netz): Einträge und Kapitel, die alle Wörter enthalten. */
export function suche(d, q) {
  const w = String(q ?? "").toLowerCase().split(/\s+/).filter((x) => x.length >= 2);
  if (!w.length) return [];
  const passt = (t) => { const s = t.toLowerCase(); return w.every((x) => s.includes(x)); };
  return [...d.eintraege.filter((e) => passt(`${e.name} ${e.wiss_name ?? ""} ${e.text}`)).map((e) => ({ art: "eintrag", x: e })),
    ...d.kapitel.filter((k) => passt(`${k.titel} ${k.text}`)).map((k) => ({ art: "kapitel", x: k }))].slice(0, 60);
}
export function ausschnitt(text, q) {
  const s = String(text).replace(/[#*|`>_]/g, " ").replace(/\s+/g, " "), w = String(q).toLowerCase().split(/\s+/).find((x) => x.length >= 2) ?? "";
  const i = Math.max(0, s.toLowerCase().indexOf(w) - 60);
  return (i ? "… " : "") + s.slice(i, i + 180) + (s.length > i + 180 ? " …" : "");
}

// ---------- Bilder (0.6.1, Paket „naturheilkunde-bilder“, Auftrag 2026-10-05-11) ----------
// Tafeln (Köhler, Thomé) und freie Fotos von Commons, jedes mit vollständigem Nachweis aus bildnachweise.json. Ohne das
// Bilderpaket geht alles weiter, nur ohne Bilder. Bilder lädt app.js nach dem Zeichnen (img[data-natur-bild]).
export const BILD_SATZ = "Ein Bild reicht zum Bestimmen nicht. Im Zweifel nicht essen.";
export const ERLAUBTE_LIZENZ = /^(gemeinfrei|CC0|CC BY( \d(\.\d)?)?|CC BY-SA( \d(\.\d)?)?)$/;
/** Bilder je Eintrag: { nachEintrag: Map(id → [bild]), alle } aus bildnachweise.json. Bilder ohne erlaubte Lizenz fallen weg. */
export function bilderIndex(nachweise) {
  const alle = (nachweise?.bilder ?? []).filter((b) => b.datei && b.urheber && b.quelle && ERLAUBTE_LIZENZ.test(b.lizenz));
  const nachEintrag = new Map();
  for (const b of alle) for (const id of b.eintraege ?? []) nachEintrag.set(id, [...(nachEintrag.get(id) ?? []), b]);
  return { alle, nachEintrag };
}
/**
 * Arten einer Warnkarte, die giftige Doppelgänger sind: alle ohne eigene Pflanzenkarte in Teil 2–5 (Bäume, Kräuter, Beeren,
 * Außereuropäisches), die nicht auf „Warnung“ steht. Die Marke „giftig“ zählt hier nicht: Der Umwandler setzt sie auch bei
 * Pflanzen, deren Karte einen giftigen Doppelgänger nennt (Bärlauch). Teil 7–9 (Überlieferung) zählt nicht.
 */
export function giftigeArt(d, art) {
  return !d.eintraege.some((e) => e.teil >= 2 && e.teil <= 5 && e.belegbarkeit !== "warnung" && String(e.wiss_name ?? "").includes(art));
}
/** Bilder eines Eintrags in der Reihenfolge der Anzeige: bei Warnkarten giftige Arten zuerst; sonst Tafel vor Foto. */
export function eintragBilder(d, e, bi) {
  const liste = [...(bi?.nachEintrag.get(e.id) ?? [])];
  const gift = (b) => istWarnung(e) && giftigeArt(d, b.art);
  return liste.map((b) => ({ ...b, gift: gift(b) })).sort((a, b) => (b.gift - a.gift) || ((a.typ === "tafel" ? 0 : 1) - (b.typ === "tafel" ? 0 : 1)));
}
const urheberText = (u) => String(u ?? "").replace(/[\s;,·]+$/, "");
const lesbar = (url) => { try { return decodeURI(url); } catch { return url; } };
export const bildZeile = (b) => b.typ === "tafel" ? `Tafel: ${b.werk ?? ""}${b.jahr ? `, ${b.jahr}` : ""} · ${b.lizenz}` : `Foto: ${urheberText(b.urheber)} · ${b.lizenz}`;
const bildHtml = (b, klein = false) => `<figure class="natur-bild natur-bild--${b.typ === "tafel" ? "tafel" : "foto"}${b.gift ? " natur-bild--gift" : ""}${klein ? " natur-bild--klein" : ""}"><button type="button" class="natur-bild-knopf" data-natur-gross="${esc(b.datei)}" aria-label="Bild vergrößern: ${esc(b.art)}"><img data-natur-bild="${esc(b.datei)}" alt="${esc(`${b.typ === "tafel" ? "Pflanzentafel" : "Foto"}: ${b.art}`)}" loading="lazy"></button>${klein ? "" : `<figcaption>${esc(bildZeile(b))}</figcaption>`}</figure>`;

// ---------- Markdown (klein, sicher: erst escapen, dann wenige Formen) ----------
const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>").replace(/`([^`]+)`/g, "<code>$1</code>");
export function mdHtml(md) {
  const zeilen = String(md ?? "").replace(/\r/g, "").split("\n"), aus = [];
  for (let i = 0; i < zeilen.length;) {
    const z = zeilen[i];
    if (!z.trim()) { i++; continue; }
    const h = /^(#{1,6})\s+(.*)$/.exec(z);
    if (h) { const n = Math.min(6, h[1].length + 2); aus.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }
    if (/^\s*\|/.test(z)) {
      const rows = []; while (i < zeilen.length && /^\s*\|/.test(zeilen[i])) rows.push(zeilen[i++]);
      const zellen = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const trenn = rows.length > 1 && /^[\s|:-]+$/.test(rows[1]);
      const kopf = trenn ? zellen(rows[0]) : null, koerper = rows.slice(trenn ? 2 : 0);
      aus.push(`<div class="natur-tabelle"><table>${kopf ? `<thead><tr>${kopf.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>` : ""}<tbody>${koerper.map((r) => `<tr>${zellen(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if (/^\s*([-*+]|\d+\.)\s+/.test(z)) {
      const geordnet = /^\s*\d+\./.test(z), items = [];
      while (i < zeilen.length && (/^\s*([-*+]|\d+\.)\s+/.test(zeilen[i]) || (/^\s{2,}\S/.test(zeilen[i]) && items.length))) {
        const m = /^\s*([-*+]|\d+\.)\s+(.*)$/.exec(zeilen[i]);
        if (m) items.push(m[2]); else items[items.length - 1] += " " + zeilen[i].trim();
        i++;
      }
      aus.push(`<${geordnet ? "ol" : "ul"}>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</${geordnet ? "ol" : "ul"}>`);
      continue;
    }
    if (/^\s*>/.test(z)) { const q = []; while (i < zeilen.length && /^\s*>/.test(zeilen[i])) q.push(zeilen[i++].replace(/^\s*>\s?/, "")); aus.push(`<blockquote>${inline(q.join(" "))}</blockquote>`); continue; }
    if (/^\s*(---|\*\*\*)\s*$/.test(z)) { aus.push("<hr>"); i++; continue; }
    if (/^\s*```/.test(z)) { const c = []; i++; while (i < zeilen.length && !/^\s*```/.test(zeilen[i])) c.push(zeilen[i++]); i++; aus.push(`<pre>${esc(c.join("\n"))}</pre>`); continue; }
    const p = []; while (i < zeilen.length && zeilen[i].trim() && !/^(#{1,6}\s|\s*\||\s*([-*+]|\d+\.)\s|\s*>)/.test(zeilen[i])) p.push(zeilen[i++]);
    aus.push(`<p>${inline(p.join(" "))}</p>`);
  }
  return aus.join("");
}
/** Text zum Vorlesen: Absätze ohne Markdown-Zeichen. */
export const vorleseTeile = (md) => String(md ?? "").split(/\n\s*\n/).map((t) => t.replace(/^#+\s*/gm, "").replace(/[*`>|_]/g, " ").replace(/\s+/g, " ").trim()).filter((t) => t && !/^[-:\s]+$/.test(t));

// ---------- Oberfläche ----------
/** Erste-Hilfe-Karte: die nummerierten Schritte aus Teil 1, wörtlich; Nummern antippbar. kompakt (Unterseiten): eine Zeile
 * mit beiden Nummern, aufklappbar. Die Redaktionssätze vor und nach den Schritten gehören nicht auf die Karte. */
export function ersteHilfeHtml(d, kompakt = false) {
  const eh = d.erste_hilfe, nummern = eh.nummern ?? [];
  const tel = (html) => nummern.reduce((h, n) => h.split(esc(n.nummer)).join(`<a href="tel:${esc(n.tel)}" class="natur-tel">${esc(n.nummer)}</a>`), html);
  const schritte = String(eh.text).split("\n").filter((z) => /^\d+\.\s/.test(z)).join("\n");
  const liste = tel(mdHtml(schritte || eh.text));
  const kurz = nummern.map((n) => `${esc(n.name.replace(/\s*\(.*\)\s*/, " ").replace(/ Wien$/, "").trim())} <a href="tel:${esc(n.tel)}" class="natur-tel">${esc(n.nummer)}</a>`).join(" · ");
  const karte = kompakt
    ? `<details class="card of-karte natur-erste-hilfe" aria-label="Erste Hilfe"><summary><strong>Erste Hilfe</strong> · ${kurz}</summary>${liste}</details>`
    : `<section class="card of-karte natur-erste-hilfe" aria-label="Erste Hilfe"><h2>Erste Hilfe bei Vergiftung</h2>${liste}</section>`;
  return `${karte}<p class="natur-streifen" role="note">${esc(STREIFEN)}</p>`;
}
const plaketten = (e) => `<span class="natur-plaketten"><span class="tag of-plakette${e.belegbarkeit === "warnung" ? " natur-warn" : ""}">${esc(BELEG[e.belegbarkeit] ?? e.belegbarkeit)}</span><span class="tag of-plakette">${esc(ORT[e.ort] ?? e.ort)}</span><span class="tag of-plakette">${esc(PRUEF[e.pruefstatus] ?? e.pruefstatus)}</span></span>`;
const eintragZeile = (e, warn) => `<li><button type="button" class="natur-link${warn ? " natur-link--warn" : ""}" data-natur-eintrag="${esc(e.id)}">${warn ? "⚠ " : ""}${esc(e.name)}${e.wiss_name ? ` <span class="muted of-klein">${esc(e.wiss_name)}</span>` : ""}</button></li>`;
const zurueck = (wohin = "start", text = "Naturheilkunde") => `<p class="natur-zurueck"><button type="button" class="z-neben" data-natur-weg="${wohin}">← ${esc(text)}</button></p>`;
const chips = (liste, attr, aktiv) => `<div class="natur-chips">${liste.map(([w, t]) => `<button type="button" class="btn btn-sm of-btn of-btn--klein${w === aktiv ? " ist-gewaehlt" : ""}" ${attr}="${esc(w)}" aria-pressed="${w === aktiv}">${esc(t)}</button>`).join("")}</div>`;
function mittelUndWarnungen(r, handbuchLink, warum) {
  return `${r.mittel.length ? `<h3>Mittel</h3><ul class="natur-liste">${r.mittel.map((e) => eintragZeile(e, false)).join("")}</ul>` : `<p class="natur-nichts">${esc(NICHTS_GEPRUEFT)}</p>`}
    ${r.warnungen.length ? `<h3>Warnungen</h3>${warum ? `<p class="muted of-klein">${esc(warum)}</p>` : ""}<ul class="natur-liste">${r.warnungen.map((e) => eintragZeile(e, true)).join("")}</ul>` : ""}
    ${handbuchLink}`;
}

/** Die ganze Seite. z: { weg, beschwerde, mit, merkmal, anwendung, teil, eintrag, kapitel, q, liest } */
export function naturHtml(d, z, bi = null) {
  /** Listenzeile mit kleinem Bild (giftig: das Bild der giftigen Art, roter Rand). */
  const mitBild = (e, warn) => {
    const b = bi ? eintragBilder(d, e, bi)[0] : null;
    return b ? `<li class="natur-mitbild">${bildHtml({ ...b, gift: warn }, true)}<span>${eintragZeile(e, warn).replace(/^<li>|<\/li>$/g, "")}</span></li>` : eintragZeile(e, warn);
  };
  const kopf = `<div class="page-head of-seitenkopf"><div><h1 style="font-size:2rem">Naturheilkunde</h1></div></div>${ersteHilfeHtml(d, (z.weg ?? "start") !== "start")}`;
  const zurueckZu = `<p class="natur-zurueck"><button type="button" class="z-neben" data-natur-zurueck>← zurück</button></p>`;
  const vorlesen = (an) => `<button type="button" class="btn btn-sm of-btn of-btn--klein" data-natur-vorlesen>${an ? "Vorlesen beenden" : "Vorlesen"}</button>`;
  if (z.weg === "eintrag") {
    const e = d.eintraege.find((x) => x.id === z.eintrag);
    if (!e) return kopf + zurueck();
    const bilder = eintragBilder(d, e, bi);
    return `${kopf}${zurueckZu}<article class="card of-karte natur-text"><h2>${esc(e.name)}</h2>${e.wiss_name ? `<p class="muted"><em>${esc(e.wiss_name)}</em></p>` : ""}${plaketten(e)}${istWarnung(e) ? `<p class="natur-warnhinweis">Nur als Warnung. Nie als Mittel.</p>` : ""}
      ${bilder.length ? `<div class="natur-bilder">${bilder.map((b) => bildHtml(b)).join("")}</div>${bilder.some((b) => b.gift) || istWarnung(e) ? `<p class="natur-bildsatz">${esc(BILD_SATZ)}</p>` : ""}` : ""}
      <p>${vorlesen(z.liest)}</p>${mdHtml(e.text)}</article>`;
  }
  if (z.weg === "kapitel") {
    const k = d.kapitel.find((x) => x.id === z.kapitel);
    if (!k) return kopf + zurueck();
    return `${kopf}${zurueckZu}<article class="card of-karte natur-text"><h2>${esc(k.titel)}</h2><p>${vorlesen(z.liest)}</p>${mdHtml(k.text)}</article>`;
  }
  if (z.weg === "beschwerde") {
    const r = z.beschwerde ? beschwerdeErgebnis(d, z.beschwerde, z.mit) : null;
    return `${kopf}${zurueck()}<section class="card of-karte"><h2>Beschwerde</h2>${chips(d.beschwerden_index.map((b) => [b.beschwerde, b.beschwerde]), "data-natur-beschwerde", z.beschwerde)}
      ${r ? `${r.index.mit.length ? `<p class="muted of-klein">Dazu:</p>${chips(r.index.mit.map((m) => [m, m]), "data-natur-mit", z.mit)}` : ""}
      ${mittelUndWarnungen(r, `<p><button type="button" class="z-neben" data-natur-index="beschwerde">Im Handbuch nachlesen: ${esc(r.index.beschwerde)}</button></p>`, "Giftige Pflanzen, die man mit Pflanzen aus dieser Beschwerde verwechseln kann, und Pflanzen mit Warnung.")}` : ""}</section>`;
  }
  if (z.weg === "beschwerde-text" || z.weg === "finde-text") {
    const t = z.weg === "beschwerde-text" ? d.beschwerden_index.find((b) => b.beschwerde === z.beschwerde)?.text : d.waldfunde_index.find((w) => w.merkmal === z.merkmal)?.text;
    return `${kopf}${zurueckZu}<article class="card of-karte natur-text">${mdHtml(t ?? "")}</article>`;
  }
  if (z.weg === "finde") {
    const r = z.merkmal ? findeErgebnis(d, z.merkmal) : null;
    return `${kopf}${zurueck()}<section class="card of-karte"><h2>Ich finde …</h2><p class="muted of-klein">Nach Aussehen. Kein Foto, keine Bestimmung per Kamera. Nur sammeln, was du sicher kennst.</p>
      ${chips(d.waldfunde_index.map((w) => [w.merkmal, w.merkmal]), "data-natur-merkmal", z.merkmal)}
      ${r ? `${r.doppelgaenger.length ? `<h3>Giftige Doppelgänger zuerst</h3><ul class="natur-liste">${r.doppelgaenger.map((e) => mitBild(e, true)).join("")}</ul>${bi ? `<p class="natur-bildsatz">${esc(BILD_SATZ)}</p>` : ""}` : ""}
        <h3>Was es sein kann</h3>${r.kandidaten.length ? `<ul class="natur-liste">${r.kandidaten.map((e) => mitBild(e, istWarnung(e))).join("")}</ul>` : `<p class="muted">Keine Einträge.</p>`}
        <p class="muted of-klein">${esc(NICHTS_GEPRUEFT)} Die Einträge sind zum Nachlesen, nicht zur Anwendung.</p>
        <p><button type="button" class="z-neben" data-natur-index="finde">Im Handbuch nachlesen: ${esc(r.index.merkmal)}</button></p>` : ""}</section>`;
  }
  if (z.weg === "anwendung") {
    const r = z.anwendung ? anwendungErgebnis(d, z.anwendung) : null;
    return `${kopf}${zurueck()}<section class="card of-karte"><h2>Anwendung</h2>${chips(ANWENDUNGEN, "data-natur-anwendung", z.anwendung)}
      ${r ? mittelUndWarnungen(r, `<p><button type="button" class="z-neben" data-natur-weg="handbuch">Im Handbuch nachlesen</button></p>`, "Pflanzen mit dieser Anwendung, die giftig oder gefährlich sind.") : ""}</section>`;
  }
  if (z.weg === "bildnachweise") {
    const liste = [...(bi?.alle ?? [])].sort((a, b) => a.art.localeCompare(b.art) || a.typ.localeCompare(b.typ));
    return `${kopf}${zurueck("handbuch", "Handbuch")}<section class="card of-karte natur-text"><h2>Bildnachweise</h2>
      <p class="muted of-klein">Alle Bilder kommen von Wikimedia Commons: alte Pflanzentafeln (gemeinfrei) und freie Fotos (CC0, CC BY, CC BY-SA). Keine KI-Bilder.</p>
      <ul class="natur-nachweise">${liste.map((b) => `<li>${bildHtml(b, true)}<div><strong>${esc(b.art)}</strong> · ${b.typ === "tafel" ? "Tafel" : "Foto"}<br>
        <span class="of-klein">${b.typ === "tafel" ? `${esc(b.werk ?? "")}${b.jahr ? `, ${b.jahr}` : ""}${b.jahr_laut ? ` (Jahr laut ${esc(b.jahr_laut)})` : ""} · ` : ""}Urheber: ${esc(urheberText(b.urheber))}${b.urheber_laut && b.urheber_laut !== "Dateiblatt" ? ` (laut ${esc(b.urheber_laut)})` : ""} · Lizenz: ${esc(b.lizenz)}<br>Quelle: ${esc(lesbar(b.quelle))}</span></div></li>`).join("")}</ul></section>`;
  }
  if (z.weg === "handbuch") {
    const treffer = z.q ? suche(d, z.q) : null;
    const teil = z.teil != null ? d.teile.find((t) => t.nr === z.teil) : null;
    const kapitel = (id) => d.kapitel.find((k) => k.id === id), eintrag = (id) => d.eintraege.find((e) => e.id === id);
    return `${kopf}${zurueck()}<section class="card of-karte"><h2>Handbuch</h2>
      <form class="natur-suche" data-natur-suche role="search"><label for="natur-q" class="sr-only">Im Handbuch suchen</label><input id="natur-q" class="of-feld" type="search" placeholder="Im Handbuch suchen" value="${esc(z.q ?? "")}" autocomplete="off"><button type="submit" class="btn of-btn">Suchen</button></form>
      ${treffer ? `<p><button type="button" class="z-neben" data-natur-teil="">← Inhalt</button></p><p class="muted of-klein">${treffer.length ? `${treffer.length}${treffer.length === 60 ? "+" : ""} Treffer` : "Nichts gefunden."}</p><ul class="natur-liste natur-treffer">${treffer.map((t) => `<li><button type="button" class="natur-link" ${t.art === "eintrag" ? `data-natur-eintrag="${esc(t.x.id)}"` : `data-natur-kapitel="${esc(t.x.id)}"`}>${esc(t.art === "eintrag" ? t.x.name : t.x.titel)}</button><span class="muted of-klein">Teil ${t.x.teil} · ${esc(ausschnitt(t.x.text, z.q))}</span></li>`).join("")}</ul>`
        : teil ? `<p><button type="button" class="z-neben" data-natur-teil="">← Inhalt</button></p><h3>Teil ${teil.nr}: ${esc(teil.titel)}</h3>
          ${teil.kapitel.length ? `<h4>Kapitel</h4><ul class="natur-liste">${teil.kapitel.map(kapitel).filter(Boolean).map((k) => `<li><button type="button" class="natur-link" data-natur-kapitel="${esc(k.id)}">${esc(k.titel)}</button></li>`).join("")}</ul>` : ""}
          ${teil.eintraege.length ? `<h4>Einträge</h4><ul class="natur-liste">${teil.eintraege.map(eintrag).filter(Boolean).map((e) => eintragZeile(e, istWarnung(e))).join("")}</ul>` : ""}`
        : `<ol class="natur-inhalt" start="0">${d.teile.map((t) => `<li><button type="button" class="natur-link" data-natur-teil="${t.nr}">${esc(t.titel)}</button> <span class="muted of-klein">${t.eintraege.length ? `${t.eintraege.length} Einträge` : `${t.kapitel.length} Kapitel`}</span></li>`).join("")}</ol>
          ${bi?.alle.length ? `<p><button type="button" class="natur-link" data-natur-weg="bildnachweise">Bildnachweise</button> <span class="muted of-klein">${bi.alle.length} Bilder</span></p>` : ""}`}
      </section>`;
  }
  return `${kopf}<section class="natur-wege">
    <button type="button" class="card of-karte natur-weg" data-natur-weg="beschwerde"><strong>Beschwerde</strong><span class="muted of-klein">Husten, Magen, Schlaf, kleine Wunden …</span></button>
    <button type="button" class="card of-karte natur-weg" data-natur-weg="finde"><strong>Ich finde …</strong><span class="muted of-klein">Nach Aussehen, giftige Doppelgänger zuerst</span></button>
    <button type="button" class="card of-karte natur-weg" data-natur-weg="anwendung"><strong>Anwendung</strong><span class="muted of-klein">Tee, äußerlich, kauen</span></button>
    <button type="button" class="card of-karte natur-weg" data-natur-weg="handbuch"><strong>Handbuch</strong><span class="muted of-klein">Alle Teile 0 bis 10, Suche ohne Netz</span></button>
  </section>`;
}

/** Klick im Bereich: gibt den neuen Zustand zurück oder null (nicht zuständig). */
export function naturKlick(b, z) {
  const ds = b.dataset;
  if (ds.naturWeg !== undefined) return { weg: ds.naturWeg };
  if (ds.naturBeschwerde) return { ...z, beschwerde: ds.naturBeschwerde, mit: null };
  if (ds.naturMit) return { ...z, mit: z.mit === ds.naturMit ? null : ds.naturMit };
  if (ds.naturMerkmal) return { ...z, merkmal: ds.naturMerkmal };
  if (ds.naturAnwendung) return { ...z, anwendung: ds.naturAnwendung };
  if (ds.naturZurueck !== undefined) return z.zurueckZu ?? { weg: "start" };
  if (ds.naturIndex) return { ...z, weg: `${ds.naturIndex}-text`, zurueckZu: z };
  if (ds.naturTeil !== undefined) return { ...z, weg: "handbuch", q: null, teil: ds.naturTeil === "" ? null : Number(ds.naturTeil) };
  if (ds.naturEintrag) return { ...z, weg: "eintrag", eintrag: ds.naturEintrag, liest: false, zurueckZu: { ...z, liest: false } };
  if (ds.naturKapitel) return { ...z, weg: "kapitel", kapitel: ds.naturKapitel, liest: false, zurueckZu: { ...z, liest: false } };
  return null;
}
