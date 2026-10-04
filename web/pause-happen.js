// Pause: die Happen auf dem Bildschirm (Auftrag 2026-10-04-pause-stufe1). Ein Happen läuft in einem Rahmen über der
// Tagesseite (Dialog), immer mit „Nicht jetzt“. Ablauf: Einladung in einem Satz → eine Sache → Gelingen → ein Satz zum
// Mitnehmen → Bewertung (Mehr davon · Passt · Nicht mehr, gelegentlich die Schwierigkeit, höchstens eine Rückfrage) →
// „Noch einen?“ muss man selbst tippen. Kein Falsch-Ton, keine rote Zahl: Falsches führt zu „Schau, so war's“.
// Die Daten kommen aus dem Paket „pause“, die Auswahl aus web/pause.js.

import { WERTE, stufeVon, zahlText } from "./pause.js";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const warte = (ms) => new Promise((r) => setTimeout(r, ms));
const zufall = (n, rnd = Math.random) => Math.floor(rnd() * n) % Math.max(1, n);
const mischen = (a, rnd = Math.random) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = zufall(i + 1, rnd); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const ruhigBewegt = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };
const knopf = (text, attr = "", primaer = false) => `<button type="button" class="btn of-btn ${primaer ? "btn-primary of-btn--primaer" : ""}" ${attr}>${text}</button>`;

/** Pilz: neun Felder; die Mitte ist der Blickpunkt. Beschriftet, damit man auch per Vorlesen weiß, welches Feld welches ist. */
const FELDER = ["oben links", "oben", "oben rechts", "links", "Mitte", "rechts", "unten links", "unten", "unten rechts"];
const RAND = [0, 2, 6, 8], NAH = [1, 3, 5, 7];
export const pilzMs = (stufe) => Math.max(WERTE.pilz.msMin, WERTE.pilz.msStufe1 - (stufe - 1) * WERTE.pilz.msSchritt);

// ---------- Die Formen: jede bekommt ein Element und gibt am Ende ein Ergebnis zurück ----------
// Ergebnis: { treffer?, von?, satz (zum Mitnehmen), mitnehmen?, ergebnis (fürs Spiel-Log) }
export const FORMEN = {
  async pilz(el, { form, linie, rnd }) {
    const stufe = stufeVon(linie, form), ms = pilzMs(stufe), runden = stufe >= 7 ? WERTE.pilz.rundenAbStufe7 : WERTE.pilz.runden;
    const orte = stufe <= 2 ? NAH : stufe <= 5 ? [...NAH, ...RAND] : RAND;
    el.innerHTML = `<p class="pause-anleitung" id="pause-pilz-hinweis">Schau auf den Punkt in der Mitte. Ein Pilz blitzt kurz auf. Tipp dann auf das Feld, wo er war.</p>
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

  async lumisch(el, { form, linie, daten, gelernt, rnd }) {
    const plan = daten.lumisch.plan, tag = Math.min(plan.length, gelernt.size + 1);
    const heute = plan[tag - 1], stufe = stufeVon(linie, form);
    const bekannt = plan.filter((p) => p.wort && (gelernt.has(p.wort) || p.wort === heute.wort));
    const frage = bekannt.length ? bekannt[zufall(bekannt.length, rnd)] : null;
    el.innerHTML = `<p class="pause-anleitung">Tag ${tag} von ${plan.length}</p>
      ${heute.wort ? `<p class="pause-wort"><span lang="x-lumisch">${esc(heute.wort)}</span> heißt <strong>${esc(heute.bedeutung)}</strong>.</p>` : `<p class="pause-wort">Heute: <strong>${esc(heute.bedeutung)}</strong>.</p>`}
      <p>${esc(heute.aufgabe)}</p><div class="pause-quiz"></div>`;
    if (!frage) { await new Promise((r) => { el.insertAdjacentHTML("beforeend", knopf("Weiter", "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = r; }); return { satz: "Heute: dein eigener Satz auf Lumisch.", mitnehmen: heute.aufgabe, ergebnis: { tag } }; }
    const anzahl = 2 + Math.min(2, stufe); // 3 bis 4 Möglichkeiten
    const falsch = mischen(daten.lumisch.woerter.filter((w) => w.wort !== frage.wort && w.deutsch !== frage.bedeutung), rnd).slice(0, anzahl - 1).map((w) => w.deutsch);
    const wahl = mischen([frage.bedeutung, ...falsch], rnd);
    const quiz = el.querySelector(".pause-quiz");
    quiz.innerHTML = `<p>Was heißt <strong lang="x-lumisch">${esc(frage.wort)}</strong>?</p><div class="pause-wahl" role="group">${wahl.map((w, i) => `<button type="button" class="btn of-btn" data-wahl="${i}">${esc(w)}</button>`).join("")}</div><p class="pause-aufloesung" role="status" aria-live="polite"></p>`;
    const kn = [...quiz.querySelectorAll("[data-wahl]")];
    const i = await new Promise((r) => kn.forEach((b, j) => { b.onclick = () => r(j); }));
    kn.forEach((b) => { b.disabled = true; });
    const richtig = wahl[i] === frage.bedeutung;
    kn[wahl.indexOf(frage.bedeutung)].classList.add("pause-wahl--richtig");
    quiz.querySelector(".pause-aufloesung").textContent = richtig ? `Ak! ${frage.wort} heißt ${frage.bedeutung}.` : `Schau, so war's: ${frage.wort} heißt ${frage.bedeutung}.`;
    await new Promise((r) => { el.insertAdjacentHTML("beforeend", knopf("Weiter", "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = r; });
    return { treffer: richtig ? 1 : 0, von: 1, satz: heute.wort ? `Heute: ${heute.wort} heißt ${heute.bedeutung}.` : "Ein Satz auf Lumisch, ganz von dir.", mitnehmen: heute.aufgabe, ergebnis: { treffer: richtig ? 1 : 0, von: 1, wort: heute.wort || null, tag } };
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
      <textarea class="of-input pause-text" id="pause-vermutung" rows="3" maxlength="500"></textarea>`;
    await new Promise((r) => { el.insertAdjacentHTML("beforeend", knopf("Gemerkt", "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = r; });
    vermutungSpeichern({ kapitel: roman.heute.id, text: el.querySelector("#pause-vermutung").value.trim().slice(0, 500) });
    return { satz: "Wenn du heute gelesen hast, zeigt dir der nächste Happen, wie es weiterging.", ergebnis: { vermutet: true } };
  },

  async tuersteher(el, { gestern, antwortRichtig, rnd }) {
    // gestern: { raetsel?: Karte mit antworten, roman?: { werk, autor, andere: [Autoren] } }
    if (gestern.raetsel) {
      const k = gestern.raetsel;
      el.innerHTML = `<p class="pause-anleitung">Gestern war das Tagesrätsel:</p><blockquote class="pause-zitat">${esc(k.frage)}</blockquote>
        <form class="tag-antwort" data-pause-form autocomplete="off"><label for="pause-antwort">Weißt du die Lösung noch?</label><div class="tag-antwort-zeile"><input id="pause-antwort" class="of-feld" type="text" maxlength="120" autocapitalize="off" spellcheck="false"><button type="submit" class="btn of-btn">Prüfen</button></div></form>
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
    el.innerHTML = `<p class="pause-anleitung">Zum Roman der Woche:</p><p>Von wem ist <strong>${esc(ro.werk)}</strong>?</p><div class="pause-wahl" role="group">${wahl.map((w, i) => `<button type="button" class="btn of-btn" data-wahl="${i}">${esc(w)}</button>`).join("")}</div><p class="pause-aufloesung" role="status" aria-live="polite"></p>`;
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
    rahmen.classList.add("pause--abend");
    const t = daten.texte.rueckwaerts;
    for (let i = 0; i < t.schritte.length; i++) {
      el.innerHTML = `<p class="pause-anleitung">${i + 1} von ${t.schritte.length}</p><label for="pause-tag" class="pause-wort">${esc(t.schritte[i])}</label>
        <textarea class="of-input pause-text" id="pause-tag" rows="2" maxlength="300" aria-describedby="pause-tag-hinweis"></textarea><p class="muted of-klein" id="pause-tag-hinweis">Du kannst es auch nur denken. Was du tippst, wird nicht gespeichert.</p>`;
      await new Promise((r) => { el.insertAdjacentHTML("beforeend", knopf(i < t.schritte.length - 1 ? "Weiter" : "Fertig", "data-pause-weiter", true)); el.querySelector("[data-pause-weiter]").onclick = r; });
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
    rahmen.classList.add("pause--abend");
    el.innerHTML = `<div class="pause-atem ${ruhig ? "pause-atem--ruhig" : ""}" aria-hidden="true"></div><p class="pause-wort" role="status" aria-live="polite"></p><p class="muted of-klein pause-zaehler"></p>`;
    const kreis = el.querySelector(".pause-atem"), text = el.querySelector(".pause-wort"), z = el.querySelector(".pause-zaehler");
    for (let i = 0; i < 4; i++) {
      z.textContent = `${i + 1}. Atemzug`;
      text.textContent = t.ein; kreis.classList.add("pause-atem--ein"); await warte(4000);
      text.textContent = t.aus; kreis.classList.remove("pause-atem--ein"); await warte(6000);
    }
    return { satz: t.ende, ergebnis: { atemzuege: 4 } };
  },
};

// ---------- Der Rahmen um einen Happen ----------
/**
 * Zeigt Happen, bis man „Fertig“ oder „Nicht jetzt“ tippt. a (von der App):
 *   naechster() → { form, kontext } | null      wählt den nächsten Happen (Dirigent)
 *   spielen(form, el, rahmen) → Ergebnis       ruft FORMEN[form.id] mit den Daten
 *   gespielt(form, ergebnis | null, sekunden)  ins Spiel-Log (null = übersprungen)
 *   bewertet(form, art), schwierigkeit(form, urteil), rueckfrage() → Frage | null, beantwortet(id, antwort | null)
 *   schwierigkeitFragen() → bool               jeder fünfte Happen
 *   fertig()                                   Rahmen zu
 */
export async function happenRahmen(a) {
  const alt = document.activeElement;
  const r = document.createElement("div");
  r.className = "pause-rahmen";
  r.innerHTML = `<div class="pause-karte" role="dialog" aria-modal="true" aria-labelledby="pause-titel">
    <div class="pause-kopf"><span class="pause-marke" aria-hidden="true">⏸</span> <span class="muted of-klein"><strong>Pause</strong> · ein Happen für zwischendurch</span></div>
    <h2 id="pause-titel" class="pause-titel"></h2><p class="pause-einladung"></p><div class="pause-inhalt"></div>
    <div class="pause-fuss">${knopf("Nicht jetzt", "data-pause-zu")}</div></div>`;
  document.body.appendChild(r);
  let zu = false, aufZu;
  const schliessen = () => { if (zu) return; zu = true; r.remove(); document.removeEventListener("keydown", taste); alt?.focus?.(); a.fertig(); aufZu?.(); };
  const taste = (e) => { if (e.key === "Escape") schliessen(); };
  document.addEventListener("keydown", taste);
  r.querySelector("[data-pause-zu]").onclick = () => { if (laeuft) a.gespielt(laeuft, null, Math.round((Date.now() - beginn) / 1000)); schliessen(); };
  let laeuft = null, beginn = 0, ohne = null;
  const fertigVersprechen = new Promise((r2) => { aufZu = r2; });
  (async () => {
    while (!zu) {
      const n = a.naechster(ohne);
      if (!n) { r.querySelector(".pause-titel").textContent = "Gerade passt kein Happen."; r.querySelector(".pause-inhalt").innerHTML = `<p>Schau später wieder vorbei.</p>`; break; }
      const { form } = n; ohne = form.id;
      r.classList.remove("pause--abend");
      r.querySelector(".pause-titel").textContent = form.titel;
      r.querySelector(".pause-einladung").textContent = form.einladung;
      const el = r.querySelector(".pause-inhalt");
      laeuft = form; beginn = Date.now();
      setTimeout(() => (el.querySelector("button:not([disabled]), input, select, textarea") ?? r.querySelector("[data-pause-zu]"))?.focus?.(), 50);
      let erg;
      try { erg = await a.spielen(form, el, r); } catch (e) { console.error("Pause", form.id, e); erg = { satz: "Das hat nicht geklappt. Morgen wieder.", ergebnis: { fehler: true } }; }
      if (zu) return;
      laeuft = null;
      a.gespielt(form, erg, Math.round((Date.now() - beginn) / 1000));
      const frage = a.rueckfrage(), schwer = !!form.zone && a.schwierigkeitFragen();
      r.querySelector(".pause-einladung").textContent = "";
      el.innerHTML = `<p class="pause-mitnehmen">${esc(erg.satz)}</p>${erg.mitnehmen ? `<p class="muted of-klein">Zum Mitnehmen: ${esc(erg.mitnehmen)}</p>` : ""}
        <div class="pause-bewertung" role="group" aria-label="Wie war der Happen?">${[["mehr", "Mehr davon"], ["passt", "Passt"], ["nicht", "Nicht mehr"]].map(([k, l]) => `<button type="button" class="btn btn-sm of-btn of-btn--klein" data-pause-bewerten="${k}" aria-pressed="false">${l}</button>`).join("")}</div>
        ${schwer ? `<div class="pause-bewertung" role="group" aria-label="Wie schwer war es?">${[["leicht", "Zu leicht"], ["richtig", "Genau richtig"], ["schwer", "Zu schwer"]].map(([k, l]) => `<button type="button" class="btn btn-sm of-btn of-btn--klein" data-pause-schwer="${k}" aria-pressed="false">${l}</button>`).join("")}</div>` : ""}
        ${frage ? `<div class="pause-rueckfrage" role="group" aria-label="Kurze Frage"><p class="of-klein" style="margin:.6rem 0 .3rem">${esc(frage.frage)}</p>${Object.entries(frage.antworten).map(([k, l]) => `<button type="button" class="btn btn-sm of-btn of-btn--klein" data-pause-antwort="${k}">${esc(l)}</button>`).join(" ")} <button type="button" class="btn btn-sm of-btn of-btn--klein" data-pause-antwort="">Überspringen</button></div>` : ""}
        <div class="pause-ende">${knopf("Noch einen?", "data-pause-noch")}${knopf("Fertig", "data-pause-fertig", true)}</div>`;
      el.querySelectorAll("[data-pause-bewerten]").forEach((b) => { b.onclick = () => { el.querySelectorAll("[data-pause-bewerten]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); a.bewertet(form, b.dataset.pauseBewerten); }; });
      el.querySelectorAll("[data-pause-schwer]").forEach((b) => { b.onclick = () => { el.querySelectorAll("[data-pause-schwer]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); a.schwierigkeit(form, b.dataset.pauseSchwer); }; });
      el.querySelectorAll("[data-pause-antwort]").forEach((b) => { b.onclick = () => { a.beantwortet(frage.id, b.dataset.pauseAntwort || null); b.closest(".pause-rueckfrage").innerHTML = `<p class="muted of-klein">Danke. Du kannst es in „Deine Linie“ jederzeit ändern.</p>`; }; });
      r.querySelector("[data-pause-zu]").hidden = true;
      el.querySelector("[data-pause-noch]").focus();
      const weiter = await new Promise((ja) => { el.querySelector("[data-pause-noch]").onclick = () => ja(true); el.querySelector("[data-pause-fertig]").onclick = () => ja(false); });
      r.querySelector("[data-pause-zu]").hidden = false;
      if (!weiter) break;
    }
    if (!zu) {
      const el = r.querySelector(".pause-inhalt");
      if (!el.querySelector(".pause-ende")) return; // „Gerade passt kein Happen“: offen lassen, „Nicht jetzt“ schließt
      schliessen();
    }
  })();
  return fertigVersprechen;
}
