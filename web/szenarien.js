// Szenarien, Grundvorsorge und Radio (0.8.0, Auftrag Nr. 20). Alle Inhalte kommen aus dem Österreich-Paket (at-basis):
//   inhalt/szenarien.json (Reihenfolge), inhalt/szenarien/<id>.json (zwölf Karten), inhalt/grundvorsorge.json (sechs Bereiche),
//   inhalt/radio.json (Frequenzen je Bundesland), inhalt/sirenen.json (mit Tondateien unter inhalt/sirenen/).
// Hier steht nur die Logik und das Gerüst der Seiten; Texte der Inhalte stehen nie im Code.
// Haushalt und Wohnsituation bleiben auf dem Gerät (speicher "haushalt"); ohne Angabe zeigt die App alles.

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Wer im Haushalt lebt und wie man wohnt: die Schlüssel von `fuer` (Grundvorsorge) und `zusatz` (Karten). */
export const HAUSHALT = [["kinder", "Kinder"], ["aeltere", "Ältere Menschen"], ["pflege", "Jemand braucht Pflege"], ["behinderung", "Jemand mit Behinderung"], ["tiere", "Haustiere"]];
export const WOHNEN = [["haus", "Eigenes Haus"], ["miete", "Mietwohnung"], ["keller", "Keller"]];
const NAMEN = Object.fromEntries([...HAUSHALT, ...WOHNEN]);

/** Die fünf Teile jeder Karte, in dieser Reihenfolge. */
export const TEILE = [["verstehen", "Gefahren verstehen"], ["vorsorgen", "Jetzt vorsorgen"], ["reagieren", "Richtig reagieren"], ["danach", "Danach"], ["informiert", "Informiert bleiben"]];

/** Passt ein Punkt zum Haushalt? Ohne Angabe passt alles; „alle“ passt immer. */
export function passt(fuer = ["alle"], haushalt = []) {
  if (!haushalt?.length) return true;
  return fuer.includes("alle") || fuer.some((f) => haushalt.includes(f));
}

/** Die Punkte eines Bereichs, die zum Haushalt passen. */
export const punkteFuer = (bereich, haushalt) => (bereich?.punkte ?? []).filter((p) => passt(p.fuer, haushalt));

/** „Für dich zusätzlich“: nur die Zusätze, die zum Haushalt passen; ohne Angabe alle, die es gibt. */
export function zusaetze(karte, haushalt = []) {
  const z = karte?.zusatz ?? {};
  const keys = haushalt?.length ? haushalt : Object.keys(z);
  return keys.filter((k) => (z[k] ?? []).length).map((k) => ({ key: k, name: NAMEN[k] ?? k, texte: z[k] }));
}

/** Fortschritt einer Liste von Punkten (Grundvorsorge, abgehakt über ihre id). */
export function fortschritt(punkte, checks = {}) {
  return { erledigt: punkte.filter((p) => checks[p.id]).length, gesamt: punkte.length };
}

/** Fortschritt einer Karte: ihre eigene Checkliste. `abgehakt` ist die Liste der abgehakten Sätze dieser Karte. */
export function szenarioFortschritt(karte, abgehakt = []) {
  const liste = karte?.checkliste_spezifisch ?? [];
  return { erledigt: liste.filter((t) => abgehakt.includes(t)).length, gesamt: liste.length };
}

/**
 * Häkchen der alten Checkliste übernehmen (bis 0.7: Schlüssel „Gruppe-Punkt“ wie "0-0"). Abgleich über den Text: Der Text
 * des alten Punkts steht wortgleich in der Grundvorsorge, die Häkchen wandern auf deren id. Unbekanntes bleibt, wie es ist.
 */
export function checksUebertragen(checks = {}, alt, grund) {
  if (!alt?.gruppen || !grund?.bereiche) return { checks, geaendert: false };
  const nachText = new Map(grund.bereiche.flatMap((b) => b.punkte.map((p) => [p.text, p.id])));
  const aus = { ...checks };
  let geaendert = false;
  alt.gruppen.forEach((g, gi) => g.punkte.forEach((text, pi) => {
    const k = `${gi}-${pi}`;
    if (!(k in aus)) return;
    const id = nachText.get(text);
    if (!id) return;
    if (aus[k]) aus[id] = true;
    delete aus[k];
    geaendert = true;
  }));
  return { checks: aus, geaendert };
}

/** Verweise in den Karten: wohin sie führen. Szenarien als Karte, Grundvorsorge mit Bereich, Radio und Notrufe auf Notfall. */
export function verweisZiel(v, grund, karten) {
  if (karten?.[v]) return { hash: `#szenario-${v}`, name: karten[v].titel };
  const bereich = (id) => grund?.bereiche.find((b) => b.id === id);
  if (v === "notfall-rucksack") return { hash: "#vorsorge", anker: "gv-notfall-rucksack", name: bereich("notfall-rucksack")?.titel ?? "Notfall-Rucksack" };
  if (v === "vorrat") return { hash: "#vorsorge", anker: "gv-wasser-essen", name: bereich("wasser-essen")?.titel ?? "Vorrat" };
  if (v === "hausapotheke") return { hash: "#vorsorge", anker: "gv-gesundheit-hygiene", name: bereich("gesundheit-hygiene")?.titel ?? "Hausapotheke" };
  if (v === "grundvorsorge") return { hash: "#vorsorge", anker: "grundvorsorge", name: "Grundvorsorge" };
  if (v === "radio") return { hash: "#notfall", anker: "radio", name: "Radio" };
  if (v === "notrufe") return { hash: "#notfall", anker: "notrufe", name: "Notrufe" };
  return null;
}

/** Die Liste zum Mitnehmen: Text (zum Speichern) oder dieselbe Liste zum Drucken. Nur die Punkte, die zum Haushalt passen. */
export function exportText(grund, checks = {}, haushalt = [], merk = []) {
  const zeilen = ["OFFLINE – Grundvorsorge", grund.einleitung ?? "", ""];
  if (haushalt?.length) zeilen.push(`Für: ${haushalt.map((k) => NAMEN[k] ?? k).join(", ")}`, "");
  for (const b of grund.bereiche) {
    const punkte = punkteFuer(b, haushalt), f = fortschritt(punkte, checks);
    zeilen.push(`${b.titel} (${f.erledigt} von ${f.gesamt})`);
    for (const p of punkte) zeilen.push(`[${checks[p.id] ? "x" : " "}] ${p.text}${merk.includes(p.id) ? "  ★" : ""}`);
    zeilen.push("");
  }
  return zeilen.join("\n").trim() + "\n";
}

const balken = (f) => `<div class="progress of-balken" role="progressbar" aria-valuemin="0" aria-valuemax="${f.gesamt}" aria-valuenow="${f.erledigt}"><div style="width:${f.gesamt ? (100 * f.erledigt) / f.gesamt : 0}%"></div></div>`;
const zahl = (f) => `${f.erledigt} von ${f.gesamt}`;

/** Haushalt einstellen (Vorsorge, oben). */
export function haushaltHtml(haushalt = []) {
  const box = ([k, n]) => `<label class="haushalt-wahl"><input type="checkbox" data-haushalt="${k}" ${haushalt.includes(k) ? "checked" : ""}> ${esc(n)}</label>`;
  return `<details class="card of-karte haushalt" id="haushalt" ${haushalt.length ? "" : "open"}>
    <summary><strong>Dein Haushalt</strong> <span class="muted of-klein">${haushalt.length ? esc(haushalt.map((k) => NAMEN[k]).join(", ")) : "nicht eingestellt – die App zeigt alles"}</span></summary>
    <p class="muted of-klein">Wer lebt bei dir, und wie wohnst du? Danach richten sich Grundvorsorge und „Für dich zusätzlich“. Bleibt nur auf diesem Gerät.</p>
    <fieldset class="haushalt-gruppe"><legend class="of-klein">Wer lebt bei dir</legend>${HAUSHALT.map(box).join("")}</fieldset>
    <fieldset class="haushalt-gruppe"><legend class="of-klein">Wie du wohnst</legend>${WOHNEN.map(box).join("")}</fieldset>
  </details>`;
}

/** Grundvorsorge in sechs Bereichen, mit Fortschritt je Bereich, Lesezeichen (Merkliste), Export und Zurücksetzen. */
export function grundvorsorgeHtml(grund, { checks = {}, haushalt = [], merk = [], nurMerk = false, zuruecksetzen = false, faellig = new Map() } = {}) {
  const alle = grund.bereiche.flatMap((b) => punkteFuer(b, haushalt)), gesamt = fortschritt(alle, checks);
  const punkt = (p) => `<li class="gv-punkt"><label><input type="checkbox" data-check="${esc(p.id)}" ${checks[p.id] ? "checked" : ""}><span>${esc(p.text)}${faellig.has(p.id) ? ` <span class="tag tag-warn of-plakette of-plakette--warnung">fällig</span>` : ""}</span></label>${faellig.has(p.id) ? ` <button class="btn btn-sm btn-primary of-btn of-btn--klein of-btn--primaer" data-bestaetigen="${esc(faellig.get(p.id))}">Erneuert</button>` : ""}
      <button type="button" class="gv-merk" data-merk="${esc(p.id)}" aria-pressed="${merk.includes(p.id)}" aria-label="${merk.includes(p.id) ? "Von der Merkliste nehmen" : "Auf die Merkliste"}: ${esc(p.text)}">${merk.includes(p.id) ? "★" : "☆"}</button>
      ${p.detail ? `<details class="gv-detail"><summary class="of-klein">Erklärung</summary><p class="muted of-klein">${esc(p.detail)}</p></details>` : ""}</li>`;
  const bereiche = grund.bereiche.map((b) => {
    const punkte = punkteFuer(b, haushalt), f = fortschritt(punkte, checks), sicht = nurMerk ? punkte.filter((p) => merk.includes(p.id)) : punkte;
    if (nurMerk && !sicht.length) return "";
    return `<section class="card of-karte gv-bereich" id="gv-${esc(b.id)}" aria-labelledby="gv-t-${esc(b.id)}">
      <h3 id="gv-t-${esc(b.id)}">${esc(b.titel)}</h3><p class="muted of-klein">${esc(b.satz)}</p>
      <div class="gv-stand of-klein">${zahl(f)} erledigt</div>${balken(f)}
      <ul class="check gv-liste">${sicht.map(punkt).join("")}</ul></section>`;
  }).join("");
  return `<section id="grundvorsorge" class="gv" aria-labelledby="gv-titel">
    <div class="gv-kopf"><h2 id="gv-titel">Grundvorsorge</h2><span class="muted of-klein">${zahl(gesamt)} erledigt</span></div>
    <p class="muted of-klein">${esc(grund.einleitung)}</p>
    <div class="gv-werkzeug">
      <button type="button" class="btn btn-sm of-btn of-btn--klein" data-gv="merkliste" aria-pressed="${nurMerk}">${nurMerk ? "Alle Punkte" : `Merkliste (${merk.length})`}</button>
      <button type="button" class="btn btn-sm of-btn of-btn--klein" data-gv="export">Liste exportieren</button>
      <button type="button" class="btn btn-sm of-btn of-btn--klein" data-gv="drucken">Drucken</button>
      ${zuruecksetzen ? `<span class="gv-zurueck" role="group" aria-label="Zurücksetzen bestätigen"><span class="of-klein">Alle Häkchen und die Merkliste löschen?</span> <button type="button" class="btn btn-sm of-btn of-btn--klein" data-gv="zuruecksetzen-ja">Ja, zurücksetzen</button> <button type="button" class="btn btn-sm of-btn of-btn--klein" data-gv="zuruecksetzen-nein">Abbrechen</button></span>`
        : `<button type="button" class="btn btn-sm of-btn of-btn--klein" data-gv="zuruecksetzen">Zurücksetzen</button>`}
    </div>
    <p class="form-msg of-meldung" id="gv-msg" role="status"></p>
    ${nurMerk && !merk.length ? `<p class="muted">Noch nichts auf der Merkliste. Tipp auf ☆ neben einem Punkt.</p>` : ""}
    <div class="grid grid-2 gv-bereiche">${bereiche}</div>
  </section>`;
}

/** Die zwölf Szenarien als Kacheln (Notfall und Vorsorge), mit dem Fortschritt der eigenen Checkliste. */
export function kachelnHtml(karten, reihenfolge, szChecks = {}) {
  return `<div class="sz-kacheln">${reihenfolge.filter((id) => karten[id]).map((id) => {
    const k = karten[id], f = szenarioFortschritt(k, szChecks[id]);
    return `<a class="card of-karte sz-kachel" href="#szenario-${esc(id)}"><strong>${esc(k.titel)}</strong><span class="muted of-klein">${zahl(f)} vorbereitet</span>${balken(f)}</a>`;
  }).join("")}</div>`;
}

/** Eine Szenario-Karte: Merksätze, fünf aufklappbare Teile, Für dich zusätzlich, eigene Checkliste, Verweise, Quellen. */
export function karteHtml(k, { haushalt = [], abgehakt = [], verweise = [], zurueck = "#notfall" } = {}) {
  const f = szenarioFortschritt(k, abgehakt);
  const eintrag = (x) => (typeof x === "string" ? `<li>${esc(x)}</li>` : `<li><strong>${esc(x.t)}</strong> ${esc(x.text)}</li>`);
  const teil = ([id, name]) => (k[id]?.length ? `<details class="card of-karte sz-teil" id="sz-${id}"><summary><h2>${esc(name)}</h2></summary><ul class="sz-liste">${k[id].map(eintrag).join("")}</ul></details>` : "");
  const zu = zusaetze(k, haushalt);
  return `<p class="sz-zurueck"><a href="${esc(zurueck)}">‹ ${zurueck === "#vorsorge" ? "Vorsorge" : "Notfall"}</a></p>
    <div class="page-head of-seitenkopf"><div><h1>${esc(k.titel)}</h1><p class="muted of-klein">${zahl(f)} aus der Checkliste vorbereitet</p></div></div>
    ${k.merksaetze?.length ? `<div class="card of-karte sz-merk"><ul>${k.merksaetze.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>` : ""}
    ${TEILE.map(teil).join("")}
    ${zu.length ? `<section class="card of-karte sz-zusatz"><h2>Für dich zusätzlich</h2>${zu.map((z) => `<h3>${esc(z.name)}</h3><ul class="sz-liste">${z.texte.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`).join("")}</section>` : ""}
    ${k.checkliste_spezifisch?.length ? `<section class="card of-karte sz-check"><h2>Checkliste für ${esc(k.titel)}</h2><div class="of-klein">${zahl(f)} erledigt</div>${balken(f)}
      <ul class="check">${k.checkliste_spezifisch.map((t, i) => `<li><label><input type="checkbox" data-sz-check="${esc(k.id)}" data-sz-punkt="${i}" ${abgehakt.includes(t) ? "checked" : ""}><span>${esc(t)}</span></label></li>`).join("")}</ul></section>` : ""}
    ${verweise.length ? `<p class="sz-verweise">Mehr dazu: ${verweise.map((v) => `<a href="${esc(v.hash)}"${v.anker ? ` data-anker-ziel="${esc(v.anker)}"` : ""}>${esc(v.name)}</a>`).join(" · ")}</p>` : ""}
    ${k.quellen?.length ? `<details class="sz-quellen"><summary class="muted of-klein">Quellen (Stand ${esc(k.stand ?? "")})</summary><ul class="muted of-klein">${k.quellen.map((q) => `<li>${q.url ? `<a href="${esc(q.url)}" rel="noopener">${esc(q.name)}</a>` : esc(q.name)}${q.abgerufen ? `, abgerufen ${esc(q.abgerufen)}` : ""}</li>`).join("")}</ul></details>` : ""}`;
}

/** „Wie du informiert bleibst“: Ö3, Ö1 und das Regionalradio des eingestellten Bundeslands. */
export function radioHtml(radio, land, laender = []) {
  const bl = radio?.bundeslaender.find((b) => b.land === land) ?? radio?.bundeslaender[0];
  if (!bl) return "";
  return `<section class="card of-karte radio-box" id="radio" aria-labelledby="radio-titel">
    <div class="radio-kopf"><h2 id="radio-titel">Wie du informiert bleibst</h2>
      <label class="of-klein">Bundesland <select class="of-select" id="bl3">${laender.map((n) => `<option ${n === bl.land ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label></div>
    <table class="radio-tabelle"><thead><tr><th>Sender</th><th>MHz</th><th>Standort</th></tr></thead>
      <tbody>${bl.sender.map((s) => `<tr><td>${esc(s.name)}</td><td class="mono of-mono">${esc(s.mhz)}</td><td class="muted of-klein">${esc(s.ort)}</td></tr>`).join("")}</tbody></table>
    <p class="muted of-klein">${esc(radio.hinweis)}</p>
  </section>`;
}
