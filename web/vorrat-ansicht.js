// Vorratsliste (Nr. 42, Miks Wahl 17.10.2026): Liste nach Art (Entwurf A), darüber die Vorlage-Knöpfe aus Entwurf C zum schnellen
// Eintragen. Dazu Formular, Heute-Zeile „Bald ablaufend“ und die Einkaufsliste (mit den Sternen der Grundvorsorge, eine Liste).
import { EINHEITEN, ARTEN, ablaufText, mengeText, tageBisAblauf, abgelaufen, ablaufend } from "./vorrat.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ARTNAME = Object.fromEntries(ARTEN);
const monat = (a) => (a ? a.slice(0, 7) : ""), tag = (a) => (a && a.length === 10 ? Number(a.slice(8)) : "");

/** Ablauf in Worten für eine Zeile. */
function ablaufZeile(e, heute) {
  if (!e.ablauf) return `<span class="muted of-klein">ohne Ablauf</span>`;
  const t = tageBisAblauf(e, heute), datum = e.ablauf.length === 10 ? `${Number(e.ablauf.slice(8))}.${Number(e.ablauf.slice(5, 7))}.${e.ablauf.slice(0, 4)}` : `${Number(e.ablauf.slice(5, 7))}/${e.ablauf.slice(0, 4)}`;
  return `<span class="vr-ablauf ${t < 0 ? "vr-ablauf--ab" : t <= 30 ? "vr-ablauf--bald" : ""}">${t < 0 ? "abgelaufen" : t <= 30 ? `läuft ${ablaufText(t)} ab` : `bis ${datum}`}</span>`;
}
export function zeileHtml(e, heute) {
  const extra = e.art === "wasser" ? ` · ${String(e.liter).replace(".", ",")} l` : e.art === "essen" ? ` · ${e.mahlzeiten} Mahlzeiten` : "";
  return `<li class="vr-zeile${abgelaufen(e, heute) ? " vr-zeile--ab" : ""}" data-vorrat-id="${esc(e.id)}"><span class="vr-was"><strong>${esc(mengeText(e))}</strong><span class="muted of-klein">${esc(ARTNAME[e.art])}${extra}</span></span>
    ${ablaufZeile(e, heute)}
    <span class="vr-knoepfe"><button type="button" class="btn btn-sm of-btn of-btn--klein" data-vorrat-bearbeiten="${esc(e.id)}" aria-label="${esc(mengeText(e))} bearbeiten">Ändern</button>
    <button type="button" class="btn btn-sm of-btn of-btn--klein" data-vorrat-weg="${esc(e.id)}" aria-label="${esc(mengeText(e))} entfernen">Entfernen</button></span></li>`;
}

/** Das Formular (für alle drei Entwürfe gleich). f: { id?, produkt, menge, einheit, art, ablauf, liter?, mahlzeiten? } */
export function formularHtml(f) {
  const opt = (liste, wert) => liste.map(([k, n]) => `<option value="${esc(k)}" ${k === wert ? "selected" : ""}>${esc(n)}</option>`).join("");
  return `<form class="card of-karte vr-form" id="vorrat-form" data-vorrat-form autocomplete="off">
    <h3 style="margin-top:0">${f.id ? "Eintrag ändern" : "Neuer Eintrag"}</h3>
    <div class="vr-felder">
      <label class="vr-feld vr-feld--breit">Produkt <input class="of-input" id="vorrat-produkt" required maxlength="80" value="${esc(f.produkt ?? "")}" placeholder="z. B. Bohnen"></label>
      <label class="vr-feld">Menge <input class="of-input" id="vorrat-menge" type="number" inputmode="decimal" min="0" step="any" value="${esc(f.menge ?? 1)}"></label>
      <label class="vr-feld">Einheit <select class="of-select" id="vorrat-einheit">${opt(EINHEITEN.map((x) => [x, x]), f.einheit ?? "Stück")}</select></label>
      <label class="vr-feld">Art <select class="of-select" id="vorrat-art" data-vorrat-art>${opt(ARTEN, f.art ?? "essen")}</select></label>
      <label class="vr-feld">Läuft ab (Monat) <input class="of-input" id="vorrat-monat" type="month" value="${esc(monat(f.ablauf))}"></label>
      <label class="vr-feld">Tag (wenn bekannt) <input class="of-input" id="vorrat-tag" type="number" inputmode="numeric" min="1" max="31" value="${esc(tag(f.ablauf))}"></label>
      ${(f.art ?? "essen") === "wasser" ? `<label class="vr-feld">Liter zusammen <input class="of-input" id="vorrat-liter" type="number" inputmode="decimal" min="0" step="any" value="${esc(f.liter ?? "")}" placeholder="aus der Menge"></label>` : ""}
      ${(f.art ?? "essen") === "essen" ? `<label class="vr-feld">Reicht für … Mahlzeiten <input class="of-input" id="vorrat-mahlzeiten" type="number" inputmode="numeric" min="0" value="${esc(f.mahlzeiten ?? "")}" placeholder="aus der Menge"></label>` : ""}
    </div>
    <p class="vr-form-knoepfe"><button type="submit" class="btn btn-primary of-btn of-btn--primaer" data-vorrat-speichern>Speichern</button> <button type="button" class="btn of-btn" data-vorrat-abbrechen>Abbrechen</button></p>
  </form>`;
}

const VORLAGEN = [
  { produkt: "Wasser", menge: 6, einheit: "Flaschen", art: "wasser", knopf: "Wasser 6 × 1,5 l" },
  { produkt: "Nudeln 500 g", menge: 2, einheit: "Packungen", art: "essen", knopf: "Nudeln 500 g" },
  { produkt: "Reis", menge: 1, einheit: "kg", art: "essen", knopf: "Reis 1 kg" },
  { produkt: "Bohnen", menge: 4, einheit: "Dosen", art: "essen", knopf: "Dosen (Bohnen, Eintopf)" },
  { produkt: "Knäckebrot", menge: 2, einheit: "Packungen", art: "essen", knopf: "Knäckebrot" },
  { produkt: "Kerzen", menge: 10, einheit: "Stück", art: "licht", knopf: "Kerzen" },
  { produkt: "Batterien AA", menge: 8, einheit: "Stück", art: "licht", knopf: "Batterien" },
  { produkt: "Taschenlampe", menge: 1, einheit: "Stück", art: "licht", knopf: "Taschenlampe" },
];
export const vorlage = (i) => { const { knopf, ...v } = VORLAGEN[i] ?? {}; return v; };

/** Die Vorlagen (aus Entwurf C) über der Liste nach Art (Entwurf A). */
const vorlagenHtml = () => `<div class="vr-vorlagen" role="group" aria-label="Häufige Vorräte"><p class="of-klein" style="margin:0 0 .4rem">Schnell eintragen – antippen, dann Menge und Ablauf anpassen:</p>
  ${VORLAGEN.map((v, i) => `<button type="button" class="btn btn-sm of-btn of-btn--klein" data-vorrat-vorlage="${i}">${esc(v.knopf)}</button>`).join("")}</div>`;

/** Die Liste: Vorlagen, darunter je Art die Einträge mit „+ Eintrag“. */
export function listeHtml(eintraege, heute) {
  return vorlagenHtml() + ARTEN.map(([k, n]) => { const z = eintraege.filter((e) => e.art === k); return `<section class="vr-gruppe" aria-labelledby="vr-g-${k}"><h3 id="vr-g-${k}">${esc(n)} <span class="muted of-klein">${z.length || ""}</span></h3>
    ${z.length ? `<ul class="vr-liste">${z.map((e) => zeileHtml(e, heute)).join("")}</ul>` : ""}
    <button type="button" class="btn btn-sm of-btn of-btn--klein" data-vorrat-neu data-vorrat-art-vor="${k}">+ Eintrag${z.length ? "" : ` ${esc(n)}`}</button></section>`; }).join("");
}

/** Heute: „Bald ablaufend“ / „Abgelaufen“, ruhig, ohne Rot-Alarm. */
export function heuteAblaufHtml(eintraege, heute) {
  const a = ablaufend(eintraege, heute);
  if (!a.length) return "";
  const ab = a.filter((x) => x.t < 0), bald = a.filter((x) => x.t >= 0);
  const satz = (liste, wort, mitZeit) => liste.length ? `<span class="vr-heute-zeile">${wort}: ${esc(mengeText(liste[0].e))}${mitZeit ? ` (${ablaufText(liste[0].t)})` : ""}${liste.length > 1 ? ` und ${liste.length - 1} weitere` : ""}</span>` : "";
  return `<a class="vr-heute" href="#vorsorge" data-anker-ziel="polster">${satz(bald, "Bald ablaufend", true)}${satz(ab, "Abgelaufen", false)}</a>`;
}

/** Einkaufsliste als Blatt (Drucken und Teilen wie die Checkliste). */
export function einkaufHtml(liste, sterne = []) {
  return `<div class="vr-einkauf">
    ${sterne.length ? `<h3>Aus der Checkliste <span class="muted of-klein">(mit Stern)</span></h3><ul>${sterne.map((x) => `<li class="vr-einkauf--stern">${esc(x.text)} <button type="button" class="btn btn-sm of-btn of-btn--klein" data-merk="${esc(x.id)}" aria-label="Von der Einkaufsliste nehmen: ${esc(x.text)}">entfernen</button></li>`).join("")}</ul>` : ""}
    ${liste.length ? `${sterne.length ? "<h3>Aus den Vorräten</h3>" : ""}<ul>${liste.map((x) => `<li class="vr-einkauf--${x.art}">${esc(x.text)}</li>`).join("")}</ul>` : `<p>${sterne.length ? "Bei den Vorräten fehlt nichts" : "Nichts einzukaufen"}. Eure Vorräte reichen für 14 Tage.</p>`}
    <p class="muted of-klein">Mit dem Stern in der Grundvorsorge kommt ein Punkt hierher.</p>
    <p class="vr-form-knoepfe"><button type="button" class="btn of-btn" data-einkauf="drucken">Drucken</button> <button type="button" class="btn of-btn" data-einkauf="teilen">Teilen</button></p></div>`;
}
