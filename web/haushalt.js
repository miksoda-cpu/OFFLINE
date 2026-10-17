// „Dein Haushalt“ als Einstellung (Nr. 40, Mik 17.10.2026): wie viele Menschen, welche Gruppen mit Anzahl, Haustiere mit Art und
// Anzahl, wie man wohnt. Die genauen Angaben liegen unter „haushalt-v2“; daraus leitet die App die bisherigen Merkmale ab
// („haushalt“: kinder, tiere, miete …), nach denen Grundvorsorge, Szenarien, Suche und Export filtern (web/szenarien.js).
// Neu: tier-<art> je Tierart (Inhalte dafür kommen später, bis dahin gilt „tiere“ für jede Art) und „eingestellt“: Wer den
// Haushalt einmal eingestellt hat, sieht nur noch, was passt – ohne Haustiere also keinen Tiervorrat. Nichts davon verlässt das Gerät.

export const GRUPPEN = [["kinder", "Kinder"], ["babys", "Babys (unter 2 Jahren)"], ["aeltere", "Ältere Menschen"], ["pflege", "Jemand braucht Pflege"], ["behinderung", "Jemand mit Behinderung"]];
/** Tierart: Schlüssel, Beschriftung, Einzahl, Mehrzahl. */
export const TIERE = [["hund", "Hund", "Hund", "Hunde"], ["katze", "Katze", "Katze", "Katzen"], ["kaninchen", "Kaninchen", "Kaninchen", "Kaninchen"], ["vogel", "Vogel", "Vogel", "Vögel"], ["reptilien", "Reptilien", "Reptil", "Reptilien"], ["andere", "Andere", "anderes Tier", "andere Tiere"]];
export const WOHNEN = [["haus", "Eigenes Haus"], ["miete", "Mietwohnung"], ["keller", "Keller"]];
const ALT_GRUPPEN = ["kinder", "aeltere", "pflege", "behinderung"];

const zahl = (x, min, max) => Math.min(max, Math.max(min, Math.floor(Number(x) || 0)));
/** Angaben bereinigen. personen: null = noch nicht angegeben. */
export function haushaltAngaben(h = {}) {
  const gruppen = {}, arten = {};
  for (const [k] of GRUPPEN) { const n = zahl(h.gruppen?.[k], 0, 20); if (n) gruppen[k] = n; }
  for (const [k] of TIERE) { const n = zahl(h.tiere?.arten?.[k], 0, 50); if (n) arten[k] = n; }
  return {
    personen: h.personen == null ? null : zahl(h.personen, 1, 20),
    gruppen, tiere: { an: !!h.tiere?.an, arten },
    wohnen: WOHNEN.map(([k]) => k).filter((k) => (h.wohnen ?? []).includes(k)),
    eingestellt: !!h.eingestellt,
  };
}

/** Übernahme beim Update: alte Haken → Ja mit Anzahl 1; Personen aus dem Polster, wenn dort schon eine Zahl stand. */
export function haushaltAusAlt(alt = [], polsterPersonen = null) {
  const tags = Array.isArray(alt) ? alt : [];
  return haushaltAngaben({
    personen: polsterPersonen ?? null,
    gruppen: Object.fromEntries(ALT_GRUPPEN.filter((k) => tags.includes(k)).map((k) => [k, 1])),
    tiere: { an: tags.includes("tiere"), arten: {} },
    wohnen: tags.filter((k) => WOHNEN.some(([w]) => w === k)),
    eingestellt: tags.length > 0, // wer schon Haken gesetzt hatte, hatte eingestellt
  });
}

/** Die Merkmale für die Filter. Babys zählen auch als Kinder (Babynahrung steht unter Kindern). */
export function merkmale(h) {
  const m = [];
  for (const [k] of GRUPPEN) if (h.gruppen[k]) m.push(k);
  if (h.gruppen.babys && !m.includes("kinder")) m.push("kinder");
  if (h.tiere.an) { m.push("tiere"); for (const [k] of TIERE) if (h.tiere.arten[k]) m.push(`tier-${k}`); }
  m.push(...h.wohnen);
  if (h.eingestellt && !m.length) m.push("eingestellt"); // eingestellt, aber nichts davon: nur noch, was für alle gilt
  return m;
}

/** Eine Zeile wie „3 Personen, 1 Hund, Kinder“. */
export function zusammenfassung(h) {
  const teile = [];
  if (h.personen) teile.push(`${h.personen} ${h.personen === 1 ? "Person" : "Personen"}`);
  for (const [k, n] of GRUPPEN) if (h.gruppen[k]) teile.push(n.replace(/ \(.*\)$/, ""));
  if (h.tiere.an) {
    const arten = TIERE.filter(([k]) => h.tiere.arten[k]).map(([k, , eins, viele]) => `${h.tiere.arten[k]} ${h.tiere.arten[k] === 1 ? eins : viele}`);
    teile.push(arten.length ? arten.join(", ") : "Haustiere");
  }
  for (const [k, n] of WOHNEN) if (h.wohnen.includes(k)) teile.push(n);
  return teile.join(", ");
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const zahlFeld = (id, titel, wert, min, max) => `<div class="hh-zahl"><button type="button" class="btn of-btn hh-schritt" data-hh-schritt="${id}" data-hh-um="-1" aria-label="${esc(titel)}: weniger">−</button>
  <input class="of-input" id="hh-${id}" data-hh-zahl="${id}" type="number" inputmode="numeric" min="${min}" max="${max}" value="${wert}" aria-label="${esc(titel)}">
  <button type="button" class="btn of-btn hh-schritt" data-hh-schritt="${id}" data-hh-um="1" aria-label="${esc(titel)}: mehr">+</button></div>`;
const schalter = (id, titel, an) => `<label class="hh-schalter"><input type="checkbox" role="switch" data-hh-an="${id}" ${an ? "checked" : ""}> <span>${esc(titel)}</span></label>`;

/** Abschnitt in den Einstellungen. */
export function haushaltEinstellungHtml(h) {
  return `<section class="card of-karte einst-teil hh" id="haushalt" aria-labelledby="hh-titel"><h2 id="hh-titel">Dein Haushalt</h2>
    <p class="muted of-klein">Danach richten sich Grundvorsorge, Szenarien, Suche und „Euer Polster“. Ändert sich etwas, etwa ein Baby oder ein Hund kommt dazu, stellst du es hier um. Bleibt auf diesem Gerät.</p>
    <div class="hh-zeile"><span class="hh-name">Wie viele Menschen leben bei dir?</span>${zahlFeld("personen", "Menschen im Haushalt", h.personen ?? 1, 1, 20)}</div>
    <fieldset class="hh-gruppe"><legend>Wer lebt bei dir</legend>
      ${GRUPPEN.map(([k, n]) => `<div class="hh-zeile">${schalter(k, n, !!h.gruppen[k])}${h.gruppen[k] ? zahlFeld(k, `${n}: Anzahl`, h.gruppen[k], 1, 20) : ""}</div>`).join("")}
    </fieldset>
    <fieldset class="hh-gruppe"><legend>Haustiere</legend>
      <div class="hh-zeile">${schalter("tiere", "Haustiere", h.tiere.an)}</div>
      ${h.tiere.an ? TIERE.map(([k, name, , viele]) => `<div class="hh-zeile hh-tier">${schalter(`tier-${k}`, name, !!h.tiere.arten[k])}${h.tiere.arten[k] ? zahlFeld(`tier-${k}`, `${viele}: Anzahl`, h.tiere.arten[k], 1, 50) : ""}</div>`).join("") : ""}
    </fieldset>
    <fieldset class="hh-gruppe"><legend>Wie du wohnst</legend>
      ${WOHNEN.map(([k, n]) => `<div class="hh-zeile">${schalter(`wohnen-${k}`, n, h.wohnen.includes(k))}</div>`).join("")}
    </fieldset>
  </section>`;
}

/** Eine Änderung aus den Einstellungen anwenden: feld wie data-hh-an / data-hh-zahl („kinder“, „tier-hund“, „wohnen-miete“, „personen“). */
export function haushaltAendern(h, feld, wert) {
  const n = structuredClone(h);
  if (feld !== "personen") n.eingestellt = true; // die Personenzahl allein filtert nichts
  if (feld === "personen") n.personen = wert;
  else if (feld === "tiere") { n.tiere.an = !!wert; if (!wert) n.tiere.arten = {}; }
  else if (feld.startsWith("tier-")) { const a = feld.slice(5); if (wert === true) n.tiere.arten[a] = n.tiere.arten[a] || 1; else if (wert === false) delete n.tiere.arten[a]; else n.tiere.arten[a] = wert; }
  else if (feld.startsWith("wohnen-")) { const w = feld.slice(7); n.wohnen = wert ? [...new Set([...n.wohnen, w])] : n.wohnen.filter((x) => x !== w); }
  else if (wert === true) n.gruppen[feld] = n.gruppen[feld] || 1;
  else if (wert === false) delete n.gruppen[feld];
  else n.gruppen[feld] = wert;
  return haushaltAngaben(n);
}
