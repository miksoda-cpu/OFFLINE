// „Was die Lumis denken“ (Auftrag 2026-10-06-12, App 0.6.2): Paket „lumi-philosophie“, Daten in inhalt/gedanken.json
// (Format paket-kit/gedanken-format.mjs). Ein Inhaltsverzeichnis und je Gedanke eine Seite: Bild, Name, Titel, Lumisch-Satz
// groß mit Lautsprecher-Knopf (spricht die Umschrift wie im Lumisch-Happen), Wort für Wort, Deutsch, Text. Einleitung und
// Schluss, wenn das Paket sie hat, als eigene Seiten davor und danach. Für Erwachsene: alter_ab 18, keine Tipps.
import { hoerenKnopf } from "./stimme.js";

export const PAKET = "lumi-philosophie";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const absaetze = (t) => String(t ?? "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).map((x) => `<p class="gedanke-text">${esc(x)}</p>`).join("");

/** Alle Seiten in Lesereihenfolge: Einleitung (falls da), die Gedanken, Schluss (falls da). */
export function seitenListe(d) {
  if (!d) return [];
  return [
    ...(d.einleitung ? [{ art: "einleitung", titel: "Einleitung", text: d.einleitung }] : []),
    ...(d.gedanken ?? []).map((g) => ({ art: "gedanke", ...g })),
    ...(d.schluss ? [{ art: "schluss", titel: "Schluss", text: d.schluss }] : []),
  ];
}

/** Inhaltsverzeichnis mit allen Titeln. */
export function inhaltHtml(d) {
  const s = seitenListe(d);
  return `<article class="gedanken" lang="de">
    <header class="gedanken-kopf"><h1>${esc(d.titel)}</h1><p class="gedanken-unter">${esc(d.untertitel)}</p><p class="gedanken-hinweis">${esc(d.hinweis)}</p></header>
    <ol class="gedanken-inhalt">${s.map((x, i) => `<li><button type="button" class="gedanken-eintrag" data-gedanke="${i}">${x.art === "gedanke" ? `<span class="gedanken-nr">${x.nr}</span> <span class="gedanken-titel">${esc(x.titel)}</span> <span class="gedanken-wer">${esc(x.wer)}</span>` : `<span class="gedanken-titel">${esc(x.titel)}</span>`}</button></li>`).join("")}</ol>
    <p class="gedanken-fuss"><a class="z-neben" href="#bibliothek">Zurück</a></p>
  </article>`;
}

/** Eine Seite: Bild, Name, Titel, Lumisch groß mit Lautsprecher, Wort für Wort, Deutsch, Text; unten Blättern. */
export function seiteHtml(d, i, { liest = false } = {}) {
  const s = seitenListe(d), x = s[i];
  if (!x) return inhaltHtml(d);
  const blaettern = `<nav class="gedanken-blaettern" aria-label="Blättern">
      ${i > 0 ? `<button type="button" class="z-neben" data-gedanke="${i - 1}">← ${esc(s[i - 1].titel)}</button>` : "<span></span>"}
      <a class="z-neben" href="#gedanken">Inhalt</a>
      ${i < s.length - 1 ? `<button type="button" class="z-neben" data-gedanke="${i + 1}">${esc(s[i + 1].titel)} →</button>` : "<span></span>"}
    </nav>`;
  const vorlesen = `<button type="button" class="z-neben" data-gedanken="vorlesen">${liest ? "Anhalten" : "Vorlesen"}</button>`;
  if (x.art !== "gedanke") return `<article class="gedanken gedanke" lang="de"><p class="gedanken-marke">${esc(d.titel)}</p><h1>${esc(x.titel)}</h1><p class="gedanken-werkzeug">${vorlesen}</p>${absaetze(x.text)}${blaettern}</article>`;
  return `<article class="gedanken gedanke" lang="de" aria-labelledby="gedanke-titel">
    <figure class="gedanke-bild"><img data-gedanke-bild="${esc(x.bild)}" alt="Aquarell zu „${esc(x.titel)}“" loading="lazy" decoding="async"></figure>
    <p class="gedanke-wer">${esc(x.wer)}</p>
    <h1 id="gedanke-titel">${esc(x.titel)}</h1>
    <p class="gedanke-lumisch"><span lang="x-lumisch">${esc(x.lumisch)}</span> ${hoerenKnopf({ wort: x.lumisch, umschrift: x.umschrift })}</p>
    <p class="gedanke-wort"><span class="gedanken-feld">Wort für Wort</span> ${esc(x.wort_fuer_wort)}</p>
    <p class="gedanke-deutsch">${esc(x.deutsch)}</p>
    <p class="gedanken-werkzeug">${vorlesen}</p>
    ${absaetze(x.text)}
    ${blaettern}
  </article>`;
}

/** Was „Vorlesen“ spricht (deutsche Stimme): Titel, die deutsche Übersetzung, dann der Text. Lumisch spricht der Knopf. */
export function vorleseTeile(d, i) {
  const x = seitenListe(d)[i];
  if (!x) return [];
  return x.art === "gedanke" ? [`${x.titel}. ${x.wer}.`, x.deutsch, ...String(x.text).split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)] : [x.titel, ...String(x.text).split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean)];
}
