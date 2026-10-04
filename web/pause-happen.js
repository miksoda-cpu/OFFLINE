// Pause: die Happen auf dem Bildschirm (Aufträge 2026-10-04-pause-stufe1 und -pause-umbau). Ein Happen ist ein eigener
// ruhiger Fokus-Bildschirm (seit 0.4.2; vorher ein Fenster über der Tagesseite): oben ✕, drei feine Striche als Fortschritt
// und der Name der Form, in der Mitte die Aufgabe, unten genau ein Hauptknopf. Ablauf: Einladung in einem Satz → eine Sache
// → Gelingen → ein Satz zum Mitnehmen → Bewertung (Mehr davon · Passt · Nicht mehr, gelegentlich die Schwierigkeit,
// höchstens eine Rückfrage) → „Noch einen“ oder „Zurück“. Kein Falsch-Ton, keine rote Zahl: Falsches führt zu „Schau, so war's“.
// Die Daten kommen aus dem Paket „pause“, die Auswahl aus web/pause.js. Aussehen: die zarten Werte (--z-*) in styles.css.

import { WERTE, stufeVon, zahlText, lumischAntworten } from "./pause.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
const zufall = (n, rnd = Math.random) => Math.floor(rnd() * n) % Math.max(1, n);
const mischen = (a, rnd = Math.random) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = zufall(i + 1, rnd); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const ruhigBewegt = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };
/** Hauptknopf (zartes Feld in hellem Rot, je Bildschirm genau einer) oder Nebenweg (grauer Text mit Haarlinie). */
const knopf = (text, attr = "", primaer = false) => `<button type="button" class="${primaer ? "z-haupt" : "z-neben"}" ${attr}>${text}</button>`;
/** Wahl- und Bewertungsfelder: Haarlinie, dunkle Schrift, keine Füllung. */
const feld = (text, attr = "") => `<button type="button" class="z-linie" ${attr}>${text}</button>`;
const X = '<svg class="z-x" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>';

/** Pilz: neun Felder; die Mitte ist der Blickpunkt. Beschriftet, damit man auch per Vorlesen weiß, welches Feld welches ist. */
const FELDER = ["oben links", "oben", "oben rechts", "links", "Mitte", "rechts", "unten links", "unten", "unten rechts"];
const RAND = [0, 2, 6, 8], NAH = [1, 3, 5, 7];
export const pilzMs = (stufe) => Math.max(WERTE.pilz.msMin, WERTE.pilz.msStufe1 - (stufe - 1) * WERTE.pilz.msSchritt);

// ---------- Die Formen: jede bekommt ein Element und gibt am Ende ein Ergebnis zurück ----------
// Ergebnis: { treffer?, von?, satz (zum Mitnehmen), mitnehmen?, ergebnis (fürs Spiel-Log) }
export const FORMEN = {
  async pilz(el, { form, linie, rnd, rahmen }) {
    const stufe = stufeVon(linie, form), ms = pilzMs(stufe), runden = stufe >= 7 ? WERTE.pilz.rundenAbStufe7 : WERTE.pilz.runden;
    const orte = stufe <= 2 ? NAH : stufe <= 5 ? [...NAH, ...RAND] : RAND;
    el.innerHTML = `<p class="pause-anleitung" id="pause-pilz-hinweis">Er ist nur kurz zu sehen. Tipp danach auf das Feld, wo er war.</p>
      <div class="pause-pilz" role="group" aria-label="Neun Felder">${FELDER.map((f, i) => `<button type="button" class="pause-feld" data-feld="${i}" aria-label="${f}" disabled ${i === 4 ? 'aria-hidden="true" tabindex="-1"' : ""}>${i === 4 ? '<span class="pause-punkt"></span>' : ""}</button>`).join("")}</div>
      <p class="pause-stand" role="status" aria-live="polite"></p>${knopf("Los", "data-pause-los", true)}`;
    const stand = el.querySelector(".pause-stand"), los = el.querySelector("[data-pause-los]"), felder = [...el.querySelectorAll(".pause-feld")];
    await new Promise((r) => { los.onclick = r; });
    los.remove();
    let treffer = 0;
    for (let runde = 0; runde < runden; runde++) {
      felder.forEach((f) => { f.classList.remove("pause-feld--da", "pause-feld--hier", "pause-feld--gut"); f.disabled = true; });
      stand.textContent = `Runde ${runde + 1} von ${runden}. Schau in die Mitte.`;
      await warte(700 + zufall(500, rnd));
      const ort = orte[zufall(orte.length, rnd)];
      felder[ort].innerHTML = '<span class="pause-pilz-bild" aria-hidden="true"></span>';
      await warte(ms);
      felder[ort].innerHTML = "";
      stand.textContent = "Wo war der Pilz?";
      felder.forEach((f, i) => { if (i !== 4) f.disabled = false; });
      const gewaehlt = await new Promise((r) => felder.forEach((f, i) => { f.onclick = () => r(i); }));
      felder.forEach((f) => { f.disabled = true; f.onclick = null; });
      if (gewaehlt === ort) { treffer++; felder[ort].classList.add("pause-feld--gut"); stand.textContent = "Genau dort."; }
      else { felder[ort].classList.add("pause-feld--hier"); stand.textContent = `Schau, so war's: ${FELDER[ort]}.`; }
      rahmen?.fortschritt?.((runde + 1) / runden);
      await warte(1100);
    }
    const satz = treffer === runden ? `Heute: alle ${zahlText(runden)} Pilze gefunden.` : treffer ? `Heute: ${zahlText(treffer)} von ${zahlText(runden)} Pilzen gefunden.` : "Heute hat sich der Pilz gut versteckt. Nächstes Mal blitzt er etwas länger.";
    return { treffer, von: runden, satz, ergebnis: { treffer, von: runden, ms, stufe } };
  },

  async fehler(el, { form, linie, daten, gesehen, rnd }) {
    const stufe = stufeVon(linie, form);
    const passend = daten.fehler.filter((g) => g.stufe <= stufe);
    const frisch = passend.filter((g) => !gesehen.has(g.id));
    const g = (frisch.length ? frisch : passend)[zufall((frisch.length ? frisch : passend).length, rnd)];
    el.innerHTML = `<p class="pause-anleitung">Tipp auf den Satz, der nicht stimmt. Mh?</p>
      <ol class="pause-geschichte">${g.saetze.map((s, i) => `<li><button type="button" class="pause-satz" data-satz="${i}">${esc(s)}</button></li>`).join("")}</ol><div class="pause-aufloesung" role="status" aria-live="polite"></div>`;
    const knoepfe = [...el.querySelectorAll(".pause-satz")];
    const i = await new Promise((r) => knoepfe.forEach((b, j) => { b.onclick = () => r(j); }));
    knoepfe.forEach((b) => { b.disabled = true; });
    knoepfe[g.fehler].classList.add("pause-satz--fehler");
    const richtig = i === g.fehler;
    el.querySelector(".pause-aufloesung").innerHTML = `<p><strong>${richtig ? "Mh! Genau der." : "Schau, so war's:"}</strong> ${esc(g.erklaerung)}</p>`;
    await new Promise((r) => { el.insertAdjacentHTML("beforeend", knopf("Weiter", "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = r; });
    return { treffer: richtig ? 1 : 0, von: 1, satz: richtig ? "Den Fehler hast du gefunden." : "Jetzt kennst du die Geschichte ganz.", ergebnis: { treffer: richtig ? 1 : 0, von: 1, geschichte: g.id } };
  },

  async lumisch(el, { form, linie, daten, heute, antwortRichtig, rnd }) {
    // heute: lumischHeute(…) aus web/pause.js – Plan (Tag 1–21), neues Wort (jeder dritte Tag danach) oder Wiederholung
    const plan = daten.lumisch.plan, stufe = stufeVon(linie, form), wb = daten.lumisch.woerterbuch ?? daten.lumisch.woerter;
    const weiter = (text = "Weiter") => new Promise((r) => { el.insertAdjacentHTML("beforeend", knopf(text, "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = r; });
    const beispiel = (w) => (w?.beispiel ? `<p class="muted of-klein">Zum Beispiel: <span lang="x-lumisch">${esc(w.beispiel.lumisch)}</span> – ${esc(w.beispiel.deutsch)}</p>` : "");
    const abfrage = async (frage, richtigText, ziel) => {
      const anzahl = 2 + Math.min(2, stufe); // 3 bis 4 Möglichkeiten
      const falsch = mischen((daten.lumisch.woerter ?? wb).filter((w) => w.wort !== frage && w.deutsch !== richtigText), rnd).slice(0, anzahl - 1).map((w) => w.deutsch);
      const wahl = mischen([richtigText, ...falsch], rnd);
      ziel.innerHTML = `<p>Was heißt <strong lang="x-lumisch">${esc(frage)}</strong>?</p><div class="pause-wahl" role="group">${wahl.map((w, i) => feld(esc(w), `data-wahl="${i}"`)).join("")}</div><p class="pause-aufloesung" role="status" aria-live="polite"></p>`;
      const kn = [...ziel.querySelectorAll("[data-wahl]")];
      const i = await new Promise((r) => kn.forEach((b, j) => { b.onclick = () => r(j); }));
      kn.forEach((b) => { b.disabled = true; });
      const ok = wahl[i] === richtigText;
      kn[wahl.indexOf(richtigText)].classList.add("pause-wahl--richtig");
      ziel.querySelector(".pause-aufloesung").textContent = ok ? `Ak! ${frage} heißt ${richtigText}.` : `Schau, so war's: ${frage} heißt ${richtigText}.`;
      return ok;
    };
    if (heute.art === "wiederholung") {
      const w = heute.eintrag;
      el.innerHTML = `<p class="pause-anleitung">Wiederholung · Tag ${heute.tag}</p><p class="pause-wort">Weißt du es noch? Was heißt <strong lang="x-lumisch">${esc(w.wort)}</strong>?</p>
        <form class="tag-antwort" data-pause-form autocomplete="off"><label for="pause-antwort">Aus dem Kopf</label><div class="tag-antwort-zeile"><input id="pause-antwort" class="z-eingabe" type="text" maxlength="60" autocapitalize="off" spellcheck="false"><button type="submit" class="z-haupt">Prüfen</button></div></form>
        ${knopf("Weiß ich nicht mehr", "data-pause-aufdecken")}<div class="pause-aufloesung" role="status" aria-live="polite"></div>`;
      const eingabe = await new Promise((ja) => { el.querySelector("[data-pause-form]").onsubmit = (e) => { e.preventDefault(); ja(el.querySelector("#pause-antwort").value); }; el.querySelector("[data-pause-aufdecken]").onclick = () => ja(null); });
      const ok = eingabe !== null && antwortRichtig(eingabe, lumischAntworten(w.deutsch));
      el.querySelector("[data-pause-form]").remove(); el.querySelector("[data-pause-aufdecken]").remove();
      el.querySelector(".pause-aufloesung").innerHTML = `<p><strong>${ok ? "Ak! Gut erinnert." : "Schau, so war's:"}</strong> ${esc(w.wort)} heißt ${esc(w.deutsch)}.</p>${beispiel(w)}`;
      await weiter();
      return { treffer: ok ? 1 : 0, von: 1, satz: ok ? `${w.wort} sitzt.` : `Jetzt weißt du es wieder: ${w.wort} heißt ${w.deutsch}.`, ergebnis: { treffer: ok ? 1 : 0, von: 1, abgefragt: w.wort, wiederholung: true, tag: heute.tag } };
    }
    if (heute.art === "neu") {
      const w = heute.eintrag;
      el.innerHTML = `<p class="pause-anleitung">Neues Wort · ${esc(w.gruppe)}</p><p class="pause-wort"><span lang="x-lumisch">${esc(w.wort)}</span> heißt <strong>${esc(w.deutsch)}</strong>.</p>${beispiel(w)}<div class="pause-quiz"></div>`;
      const ok = await abfrage(w.wort, w.deutsch, el.querySelector(".pause-quiz"));
      await weiter();
      return { treffer: ok ? 1 : 0, von: 1, satz: `Neues Wort: ${w.wort} heißt ${w.deutsch}.`, ergebnis: { treffer: ok ? 1 : 0, von: 1, wort: w.wort, abgefragt: w.wort, neu: true, tag: heute.tag } };
    }
    const tagE = heute.eintrag, tag = heute.tag;
    const bekannt = plan.slice(0, tag).filter((x) => x.wort);
    const frage = bekannt.length ? bekannt[zufall(bekannt.length, rnd)] : null;
    el.innerHTML = `<p class="pause-anleitung">Tag ${tag} von ${plan.length}</p>
      ${tagE.wort ? `<p class="pause-wort"><span lang="x-lumisch">${esc(tagE.wort)}</span> heißt <strong>${esc(tagE.bedeutung)}</strong>.</p>` : `<p class="pause-wort">Heute: <strong>${esc(tagE.bedeutung)}</strong>.</p>`}
      <p>${esc(tagE.aufgabe)}</p><div class="pause-quiz"></div>`;
    if (!frage) { await weiter(); return { satz: "Heute: dein eigener Satz auf Lumisch.", mitnehmen: tagE.aufgabe, ergebnis: { tag } }; }
    const ok = await abfrage(frage.wort, frage.bedeutung, el.querySelector(".pause-quiz"));
    await weiter();
    return { treffer: ok ? 1 : 0, von: 1, satz: tagE.wort ? `Heute: ${tagE.wort} heißt ${tagE.bedeutung}.` : "Ein Satz auf Lumisch, ganz von dir.", mitnehmen: tagE.aufgabe, ergebnis: { treffer: ok ? 1 : 0, von: 1, wort: tagE.wort || null, abgefragt: frage.wort, tag } };
  },

  async naechstes(el, { roman, vermutung, vermutungSpeichern }) {
    // roman: { heute: kapitel, gestern: kapitel|null, heuteGelesen: bool }
    const anfang = (k) => { const a = (k.absaetze ?? []).filter((x) => !x.startsWith("## ")); const t = a[0] ?? ""; return t.length > 320 ? `${t.slice(0, 320).replace(/\s\S*$/, "")} …` : t; };
    const ende = (k) => { const a = (k.absaetze ?? []).filter((x) => !x.startsWith("## ")); const t = a.at(-1) ?? ""; return t.length > 320 ? `… ${t.slice(-320).replace(/^\S*\s/, "")}` : t; };
    if (vermutung && vermutung.kapitel === roman.heute.id && roman.heuteGelesen) {
      el.innerHTML = `<p class="pause-anleitung">${esc(roman.heute.werk)}</p><p>Du hattest vermutet:</p><blockquote class="pause-zitat">${esc(vermutung.text || "(nur im Kopf)")}</blockquote><p>So ging es weiter:</p><blockquote class="pause-zitat">${esc(anfang(roman.heute))}</blockquote>`;
      await new Promise((r) => { el.insertAdjacentHTML("beforeend", knopf("Weiter", "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = r; });
      vermutungSpeichern(null);
      return { satz: "Ob es so kam oder anders: Jetzt weißt du es.", ergebnis: { aufgeloest: true } };
    }
    el.innerHTML = `<p class="pause-anleitung">${esc(roman.heute.werk)} · ${esc(roman.heute.autor)}</p><p>So endete es gestern:</p><blockquote class="pause-zitat">${esc(ende(roman.gestern))}</blockquote>
      <label for="pause-vermutung">Was glaubst du, passiert heute? <span class="muted of-klein">(du kannst es auch nur denken)</span></label>
      <input class="z-eingabe" id="pause-vermutung" type="text" maxlength="200" autocomplete="off">`;
    await new Promise((r) => { el.insertAdjacentHTML("beforeend", knopf("Gemerkt", "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = r; });
    vermutungSpeichern({ kapitel: roman.heute.id, text: el.querySelector("#pause-vermutung").value.trim().slice(0, 200) });
    return { satz: "Wenn du heute gelesen hast, zeigt dir der nächste Happen, wie es weiterging.", ergebnis: { vermutet: true } };
  },

  async tuersteher(el, { gestern, antwortRichtig, rnd }) {
    // gestern: { raetsel?: Karte mit antworten, roman?: { werk, autor, andere: [Autoren] } }
    if (gestern.raetsel) {
      const k = gestern.raetsel;
      el.innerHTML = `<p class="pause-anleitung">Gestern war das Tagesrätsel:</p><blockquote class="pause-zitat">${esc(k.frage)}</blockquote>
        <form class="tag-antwort" data-pause-form autocomplete="off"><label for="pause-antwort">Weißt du die Lösung noch?</label><div class="tag-antwort-zeile"><input id="pause-antwort" class="z-eingabe" type="text" maxlength="120" autocapitalize="off" spellcheck="false"><button type="submit" class="z-haupt">Prüfen</button></div></form>
        ${knopf("Weiß ich nicht mehr", "data-pause-aufdecken")}<p class="pause-aufloesung" role="status" aria-live="polite"></p>`;
      const r = await new Promise((ja) => {
        el.querySelector("[data-pause-form]").onsubmit = (e) => { e.preventDefault(); ja(el.querySelector("#pause-antwort").value); };
        el.querySelector("[data-pause-aufdecken]").onclick = () => ja(null);
      });
      const richtig = r !== null && antwortRichtig(r, [...(k.antworten ?? []), k.loesung]);
      el.querySelector("[data-pause-form]").remove(); el.querySelector("[data-pause-aufdecken]").remove();
      el.querySelector(".pause-aufloesung").innerHTML = `<strong>${richtig ? "Gut erinnert!" : "Schau, so war's:"}</strong> ${esc(k.loesung)}`;
      await new Promise((ja) => { el.insertAdjacentHTML("beforeend", knopf("Weiter", "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = ja; });
      return { treffer: richtig ? 1 : 0, von: 1, satz: richtig ? "Aus dem Kopf geholt, nicht nachgeschaut." : "Morgen fragt dich vielleicht wieder jemand.", ergebnis: { treffer: richtig ? 1 : 0, von: 1, frage: "raetsel" } };
    }
    const ro = gestern.roman, wahl = mischen([ro.autor, ...ro.andere.slice(0, 2)], rnd);
    el.innerHTML = `<p class="pause-anleitung">Zum Roman der Woche:</p><p>Von wem ist <strong>${esc(ro.werk)}</strong>?</p><div class="pause-wahl" role="group">${wahl.map((w, i) => feld(esc(w), `data-wahl="${i}"`)).join("")}</div><p class="pause-aufloesung" role="status" aria-live="polite"></p>`;
    const kn = [...el.querySelectorAll("[data-wahl]")];
    const i = await new Promise((r) => kn.forEach((b, j) => { b.onclick = () => r(j); }));
    kn.forEach((b) => { b.disabled = true; });
    const richtig = wahl[i] === ro.autor;
    kn[wahl.indexOf(ro.autor)].classList.add("pause-wahl--richtig");
    el.querySelector(".pause-aufloesung").textContent = richtig ? "Genau." : `Schau, so war's: ${ro.autor}.`;
    await new Promise((r) => { el.insertAdjacentHTML("beforeend", knopf("Weiter", "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = r; });
    return { treffer: richtig ? 1 : 0, von: 1, satz: "Was man liest, bleibt eher, wenn man es wieder hervorholt.", ergebnis: { treffer: richtig ? 1 : 0, von: 1, frage: "roman" } };
  },

  async rueckwaerts(el, { daten, rahmen }) {
    rahmen.classList.add("happen--ruhig");
    const t = daten.texte.rueckwaerts;
    for (let i = 0; i < t.schritte.length; i++) {
      el.innerHTML = `<p class="pause-anleitung">${i + 1} von ${t.schritte.length}</p><p class="pause-wort">${esc(t.schritte[i])}</p><p class="z-leise">Nur im Kopf. Nichts wird aufgeschrieben.</p>`;
      rahmen.fortschritt?.((i + 1) / t.schritte.length);
      await new Promise((r) => { el.insertAdjacentHTML("beforeend", knopf("Ich hab's", "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = r; });
    }
    return { satz: t.ende, ergebnis: { schritte: t.schritte.length } };
  },

  async zeitgefuehl(el, { form, linie, jetzt, daten }) {
    const stufe = stufeVon(linie, form), tol = WERTE.zeitToleranzMin[Math.min(WERTE.zeitToleranzMin.length, stufe) - 1];
    const t = daten.texte.zeitgefuehl;
    el.innerHTML = `<p class="pause-wort">${esc(t.frage)}</p><div class="pause-zeit"><label>Stunde <select class="of-select" id="pause-stunde">${Array.from({ length: 24 }, (_, h) => `<option value="${h}">${h}</option>`).join("")}</select></label>
      <label>Minute <select class="of-select" id="pause-minute">${[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => `<option value="${m}">${String(m).padStart(2, "0")}</option>`).join("")}</select></label></div>`;
    const d = new Date(jetzt()); el.querySelector("#pause-stunde").value = String((d.getHours() + 23) % 24);
    await new Promise((r) => { el.insertAdjacentHTML("beforeend", knopf("Das schätze ich", "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = r; });
    const n = new Date(jetzt()), geschaetzt = Number(el.querySelector("#pause-stunde").value) * 60 + Number(el.querySelector("#pause-minute").value), echt = n.getHours() * 60 + n.getMinutes();
    const ab = Math.min(Math.abs(geschaetzt - echt), 1440 - Math.abs(geschaetzt - echt)), getroffen = ab <= tol;
    el.innerHTML = `<p class="pause-wort">Es ist ${n.getHours()}:${String(n.getMinutes()).padStart(2, "0")}.</p><p>${ab <= 5 ? esc(t.knapp) : getroffen ? esc(t.nah) : esc(t.weit)} ${ab > 5 ? `Du lagst ${ab} Minuten daneben.` : ""}</p>`;
    await new Promise((r) => { el.insertAdjacentHTML("beforeend", knopf("Weiter", "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = r; });
    return { treffer: getroffen ? 1 : 0, von: 1, satz: getroffen ? "Dein Zeitgefühl stimmt heute." : "Morgen früh fragt die Uhr vielleicht wieder.", ergebnis: { treffer: getroffen ? 1 : 0, von: 1, minuten: ab } };
  },

  async atem(el, { daten, rahmen }) {
    const t = daten.texte.atem, ruhig = ruhigBewegt();
    rahmen.classList.add("happen--ruhig");
    el.innerHTML = `<div class="pause-atem ${ruhig ? "pause-atem--ruhig" : ""}" aria-hidden="true"></div><p class="pause-wort" role="status" aria-live="polite"></p><p class="muted of-klein pause-zaehler"></p>`;
    const kreis = el.querySelector(".pause-atem"), text = el.querySelector(".pause-wort"), z = el.querySelector(".pause-zaehler");
    for (let i = 0; i < 4; i++) {
      z.textContent = `${i + 1}. Atemzug`;
      text.textContent = t.ein; kreis.classList.add("pause-atem--ein"); await warte(4000);
      text.textContent = t.aus; kreis.classList.remove("pause-atem--ein"); await warte(6000);
      rahmen.fortschritt?.((i + 1) / 4);
    }
    return { satz: t.ende, ergebnis: { atemzuege: 4 } };
  },
};

// ---------- Der Fokus-Bildschirm ----------
/**
 * Zeigt Happen in el (füllt den Inhaltsbereich, am Handy den ganzen Schirm), bis man ✕ oder „Zurück“ tippt. a (von der App):
 *   erste: Form | null                         zuerst diese (im Raum gewählt oder von der Karte auf Heute)
 *   naechster(ohne) → { form } | null          wählt den nächsten Happen (Dirigent)
 *   spielen(form, el, rahmen) → Ergebnis       ruft FORMEN[form.id] mit den Daten
 *   gespielt(form, ergebnis | null, sekunden)  ins Spiel-Log (null = abgebrochen)
 *   bewertet(form, art), schwierigkeit(form, urteil), rueckfrage() → Frage | null, beantwortet(id, antwort | null)
 *   schwierigkeitFragen() → bool               jeder fünfte Happen
 *   zurueckText                                „Zurück zu Heute“ oder „Zurück zur Pause“
 *   zu()                                       zurück dorthin, wo man herkam
 * Gibt { abbrechen() } zurück: verlässt man den Bildschirm anders (Zurück im Browser, Navigation), zählt ein laufender
 * Happen als abgebrochen.
 */
export function happenFokus(el, a) {
  el.className = "happen";
  el.setAttribute("role", "region");
  el.setAttribute("aria-labelledby", "happen-name");
  el.innerHTML = `<div class="happen-kopf"><button type="button" class="happen-zu" data-happen-zu aria-label="Schließen">${X}</button>
    <div class="happen-striche" aria-hidden="true"><i></i><i></i><i></i></div><h2 class="happen-name" id="happen-name"></h2></div>
    <p class="happen-einladung"></p><div class="happen-inhalt"></div>`;
  const inhalt = el.querySelector(".happen-inhalt"), einl = el.querySelector(".happen-einladung"), name = el.querySelector(".happen-name");
  const striche = [...el.querySelectorAll(".happen-striche i")];
  el.fortschritt = (anteil) => { const n = Math.max(1, Math.min(3, Math.ceil(anteil * 3))); striche.forEach((s, i) => s.classList.toggle("an", i < n)); };
  let zu = false, laeuft = null, beginn = 0, ohne = null;
  const sek = () => Math.round((Date.now() - beginn) / 1000);
  const aufraeumen = () => { zu = true; document.removeEventListener("keydown", taste); };
  const schliessen = () => { if (zu) return; if (laeuft) a.gespielt(laeuft, null, sek()); aufraeumen(); a.zu(); };
  const taste = (e) => { if (e.key === "Escape") schliessen(); };
  document.addEventListener("keydown", taste);
  el.querySelector("[data-happen-zu]").onclick = schliessen;
  const fokus = () => setTimeout(() => { if (!zu) (inhalt.querySelector(".z-haupt:not([disabled]), button:not([disabled]), input, select") ?? el.querySelector("[data-happen-zu]"))?.focus?.({ preventScroll: true }); }, 60);
  (async () => {
    let erste = a.erste ?? null;
    while (!zu) {
      const n = erste ? { form: erste } : a.naechster(ohne);
      erste = null;
      if (!n) {
        name.textContent = "Pause"; einl.textContent = "Gerade passt kein Happen.";
        inhalt.innerHTML = `<p class="z-leise">Schau später wieder vorbei.</p><div class="happen-fuss">${knopf(esc(a.zurueckText), "data-happen-zurueck")}</div>`;
        inhalt.querySelector("[data-happen-zurueck]").onclick = schliessen; fokus(); return;
      }
      const { form } = n; ohne = form.id;
      el.classList.remove("happen--ruhig", "happen--ende");
      name.textContent = form.titel; einl.textContent = form.einladung; el.fortschritt(0);
      laeuft = form; beginn = Date.now();
      fokus();
      let erg;
      try { erg = await a.spielen(form, inhalt, el); } catch (e) { console.error("Pause", form.id, e); erg = { satz: "Das hat nicht geklappt. Morgen wieder.", ergebnis: { fehler: true } }; }
      if (zu) return;
      laeuft = null;
      a.gespielt(form, erg, sek());
      const frage = a.rueckfrage(), schwer = !!form.zone && a.schwierigkeitFragen();
      el.classList.add("happen--ende"); el.fortschritt(1); einl.textContent = "";
      inhalt.innerHTML = `<p class="happen-satz">${esc(erg.satz)}</p>${erg.mitnehmen ? `<p class="z-mit">Zum Mitnehmen: ${esc(erg.mitnehmen)}</p>` : ""}
        <p class="z-leise happen-frage">Wie war das?</p>
        <div class="z-reihe" role="group" aria-label="Wie war der Happen?">${[["mehr", "Mehr davon"], ["passt", "Passt"], ["nicht", "Nicht mehr"]].map(([k, l]) => feld(l, `data-pause-bewerten="${k}" aria-pressed="false"`)).join("")}</div>
        ${schwer ? `<p class="z-leise happen-frage">Und die Schwierigkeit?</p><div class="z-reihe" role="group" aria-label="Wie schwer war es?">${[["leicht", "Zu leicht"], ["richtig", "Genau richtig"], ["schwer", "Zu schwer"]].map(([k, l]) => feld(l, `data-pause-schwer="${k}" aria-pressed="false"`)).join("")}</div>` : ""}
        ${frage ? `<div class="pause-rueckfrage" role="group" aria-label="Kurze Frage"><p class="z-leise happen-frage">${esc(frage.frage)}</p><div class="z-reihe">${Object.entries(frage.antworten).map(([k, l]) => feld(esc(l), `data-pause-antwort="${k}"`)).join("")}</div>${knopf("Überspringen", 'data-pause-antwort=""')}</div>` : ""}
        <div class="happen-fuss">${knopf("Noch einen", "data-pause-noch", true)}${knopf(esc(a.zurueckText), "data-happen-zurueck")}</div>`;
      inhalt.querySelectorAll("[data-pause-bewerten]").forEach((b) => { b.onclick = () => { inhalt.querySelectorAll("[data-pause-bewerten]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); a.bewertet(form, b.dataset.pauseBewerten); }; });
      inhalt.querySelectorAll("[data-pause-schwer]").forEach((b) => { b.onclick = () => { inhalt.querySelectorAll("[data-pause-schwer]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); a.schwierigkeit(form, b.dataset.pauseSchwer); }; });
      inhalt.querySelectorAll("[data-pause-antwort]").forEach((b) => { b.onclick = () => { a.beantwortet(frage.id, b.dataset.pauseAntwort || null); b.closest(".pause-rueckfrage").innerHTML = `<p class="z-leise">Danke. Du kannst es in „Deine Linie“ jederzeit ändern.</p>`; }; });
      fokus();
      const weiter = await new Promise((ja) => { inhalt.querySelector("[data-pause-noch]").onclick = () => ja(true); inhalt.querySelector("[data-happen-zurueck]").onclick = () => ja(false); });
      if (zu) return;
      if (!weiter) { schliessen(); return; }
    }
  })();
  return { abbrechen: () => { if (zu) return; if (laeuft) a.gespielt(laeuft, null, sek()); aufraeumen(); } };
}
