// Lumisch anhören (0.5.6, Auftrag 2026-10-05-09): Die Sprachausgabe des Geräts spricht die Umschrift mit einer deutschen
// Stimme, bevorzugt de-AT, etwas langsamer als normal. Die Lautschrift (IPA) liegt mit im Paket; keine Sprachausgabe im
// Browser oder in der Tauri-Webview kann sie heute lesen, deshalb ist die Weiche STIMME_KANN_IPA aus.
export const STIMME_KANN_IPA = false;
export const TEMPO = 0.8;

/** Die beste Stimme: de-AT, sonst irgendeine deutsche. Ohne deutsche Stimme null (dann gibt es keinen Knopf). */
export function waehleStimme(stimmen) {
  const de = (stimmen ?? []).filter((s) => /^de([-_]|$)/i.test(s.lang ?? ""));
  return de.find((s) => /^de[-_]AT$/i.test(s.lang)) ?? de.find((s) => s.default) ?? de[0] ?? null;
}

/** Was gesprochen wird: IPA nur, wenn die Weiche an ist; sonst die Umschrift, Silben getrennt („wa-u“ → „wa u“). */
export function sprechText({ umschrift, ipa }, kannIpa = STIMME_KANN_IPA) {
  if (kannIpa && ipa) return ipa;
  return umschrift ? umschrift.replace(/-/g, " ") : null;
}

const synth = () => (typeof speechSynthesis !== "undefined" ? speechSynthesis : null);
/** Stimme des Geräts (die Liste kommt in manchen Browsern erst nach „voiceschanged“). */
export const stimme = () => waehleStimme(synth()?.getVoices?.());

/** Knopf „Anhören“ neben einem Lumisch-Wort; versteckt, bis feststeht, dass das Gerät eine deutsche Stimme hat. */
const ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function hoerenKnopf(w) {
  const text = w && sprechText(w);
  if (!text) return "";
  return `<button type="button" class="lumisch-hoeren" data-hoeren="${esc(text)}" aria-label="${esc(w.wort)} anhören" title="Anhören" hidden>${ICON}</button>`;
}
/** Knöpfe in el zeigen, sobald es eine Stimme gibt. */
export function hoerenZeigen(el) {
  const s = synth(); if (!s || !el) return;
  const zeigen = () => { if (stimme()) el.querySelectorAll(".lumisch-hoeren[hidden]").forEach((b) => (b.hidden = false)); };
  zeigen();
  s.addEventListener?.("voiceschanged", zeigen, { once: true });
}
export function sprechen(text) {
  const s = synth(), v = stimme(); if (!s || !v || !text) return false;
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = v; u.lang = v.lang; u.rate = TEMPO;
  s.speak(u);
  return true;
}
