// Das Blatt (Auftrag 2026-10-05-updates-seite): am Handy von unten, am breiten Schirm als Fenster in der Mitte. Eigener
// Bildlauf zum Wischen (kein Kasten mitten in der Seite), ✕ zum Schließen, Escape und die Zurück-Taste schließen auch.
let offen = null;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Öffnet ein Blatt mit Titel und HTML-Inhalt. Ein zweites ersetzt das erste. */
export function blattOeffnen(titel, html, { beimSchliessen } = {}) {
  if (offen) schliessen(true);
  const alt = document.activeElement;
  const r = document.createElement("div");
  r.className = "blatt-hinter";
  r.innerHTML = `<div class="blatt" role="dialog" aria-modal="true" aria-labelledby="blatt-titel">
    <div class="blatt-kopf"><h2 id="blatt-titel">${esc(titel)}</h2><button type="button" class="blatt-zu" aria-label="Schließen"><svg class="z-x" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg></button></div>
    <div class="blatt-inhalt">${html}</div></div>`;
  document.body.appendChild(r);
  document.body.classList.add("blatt-offen");
  const taste = (e) => { if (e.key === "Escape") zu(); };
  const zurueck = () => schliessen(true);
  offen = { r, alt, taste, zurueck, beimSchliessen };
  history.pushState({ blatt: true }, ""); // die Zurück-Taste schließt das Blatt, nicht die Seite
  addEventListener("popstate", zurueck);
  document.addEventListener("keydown", taste);
  r.addEventListener("click", (e) => { if (e.target === r) zu(); });
  r.querySelector(".blatt-zu").onclick = zu;
  setTimeout(() => r.querySelector(".blatt-zu")?.focus({ preventScroll: true }), 30);
  return r;
}
/** Schließen über ✕, Escape oder Hintergrund: einen Schritt zurück in der Geschichte, das schließt über popstate. */
function zu() { if (offen) history.back(); }
function schliessen(ohneZurueck) {
  if (!offen) return;
  const o = offen; offen = null;
  removeEventListener("popstate", o.zurueck);
  document.removeEventListener("keydown", o.taste);
  o.r.remove();
  document.body.classList.remove("blatt-offen");
  o.alt?.focus?.({ preventScroll: true });
  o.beimSchliessen?.();
  if (!ohneZurueck) history.back();
}
export const blattIstOffen = () => !!offen;
/** Für einen Seitenwechsel: das Blatt still entfernen. */
export function blattWeg() { if (offen) schliessen(true); }
