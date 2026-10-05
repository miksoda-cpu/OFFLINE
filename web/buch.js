// Das Lumi-Buch (Auftrag 2026-10-04-lumi-buch-app, App 0.5.0): Das ganze Buch liegt im Paket „lumi-buch“ auf dem Gerät.
// Lesbar wird ein Absatz erst, wenn man ihn unter einem Satz der Lumi mit „Aus dem Lumi-Buch“ öffnet. Das bloße Anzeigen
// eines Tipps schaltet nichts frei, ältere Logeinträge auch nicht (sie bekommen nur den Link). Milde Zugkraft: keine
// Zählung von Tagen, kein „nur noch 3“, keine Liste der fehlenden Tipps.
// Gespeichert wird nur die Liste der lesbaren Absätze (speicher "lumi-buch-frei"), am Gerät.

export const LUECKE = "Dieses Stück hat dir deine Lumi noch nicht erzählt.";
/** Lücke für Absätze, deren Tipps alle auf eine Funktion warten (0.5.1, Auftrag 2026-10-05-01). */
export const LUECKE_WARTET = "Dieses Stück erzählt sie, sobald OFFLINE so weit ist.";
export const LINK_TEXT = "Aus dem Lumi-Buch";

/** Gespeicherten Stand laden: { absaetze: [Nummern], seit }. */
export function freiLaden(g) {
  const a = Array.isArray(g?.absaetze) ? g.absaetze.filter((x) => typeof x === "string") : [];
  return { absaetze: [...new Set(a)], seit: typeof g?.seit === "string" ? g.seit : null };
}

/** Alle Absätze eines Buchs mit Kapitel, in Lesereihenfolge. */
export function absaetze(buch) {
  return (buch?.kapitel ?? []).flatMap((k) => (k.absaetze ?? []).map((a) => ({ ...a, kapitel: k.nr, kapitelTitel: k.titel })));
}
export const absatz = (buch, id) => absaetze(buch).find((a) => a.id === id) ?? null;

/**
 * Absätze, die heute niemand erreichen kann: Alle Tipps, die auf sie zeigen, warten auf eine Funktion, die die App noch
 * nicht hat (bedingung.funktion nicht in funktionen). Berechnet aus den Tipps, nicht fest im Code.
 */
export function wartendeAbsaetze(tipps, funktionen) {
  const je = new Map();
  for (const t of tipps ?? []) if (t.buch) je.set(t.buch, [...(je.get(t.buch) ?? []), t]);
  return new Set([...je].filter(([, l]) => l.every((t) => t.bedingung?.funktion && !funktionen?.has(t.bedingung.funktion))).map(([id]) => id));
}

/** Das Schlussstück (letzter Absatz des letzten Kapitels) wird frei, sobald die anderen Absätze dieses Kapitels gelesen sind. */
export function mitSchluss(frei, buch, jetzt = Date.now()) {
  const f = freiLaden(frei), letztes = buch?.kapitel?.at(-1), schluss = letztes?.absaetze?.at(-1);
  if (!schluss || f.absaetze.includes(schluss.id)) return f;
  const andere = letztes.absaetze.slice(0, -1);
  if (!andere.length || !andere.every((a) => f.absaetze.includes(a.id))) return f;
  return { absaetze: [...f.absaetze, schluss.id], seit: f.seit ?? new Date(jetzt).toISOString() };
}

/** Einen Absatz lesbar machen (nur einen, den es im Buch gibt); danach ggf. das Schlussstück. Gibt den neuen Stand zurück. */
export function freischalten(frei, buch, id, jetzt = Date.now()) {
  const f = freiLaden(frei);
  if (!absatz(buch, id) || f.absaetze.includes(id)) return mitSchluss(f, buch, jetzt);
  return mitSchluss({ absaetze: [...f.absaetze, id], seit: f.seit ?? new Date(jetzt).toISOString() }, buch, jetzt);
}

/** Anteil lesbarer Absätze in ganzen Prozent (abgerundet, damit 100 % erst bei allen steht). */
export function anteil(buch, frei) {
  const alle = absaetze(buch), f = new Set(freiLaden(frei).absaetze);
  if (!alle.length) return 0;
  return Math.floor((alle.filter((a) => f.has(a.id)).length / alle.length) * 100);
}

/**
 * Das Buch zum Lesen: Kapitel in Reihenfolge, darin lesbare Absätze und stille Lücken. Mehrere fehlende Absätze
 * derselben Art hintereinander sind eine Lücke. wartend: Absätze, die heute niemand erreichen kann (wartendeAbsaetze).
 * teile: [{ art: "absatz", id, text } | { art: "luecke" } | { art: "wartet" }].
 */
export function buchMitLuecken(buch, frei, wartend = new Set()) {
  const f = new Set(freiLaden(frei).absaetze);
  return (buch?.kapitel ?? []).map((k) => {
    const teile = [];
    for (const a of k.absaetze ?? []) {
      const art = f.has(a.id) ? "absatz" : wartend.has(a.id) ? "wartet" : "luecke";
      if (art === "absatz") teile.push({ art, id: a.id, text: a.text });
      else if (teile.at(-1)?.art !== art) teile.push({ art });
    }
    return { nr: k.nr, titel: k.titel, teile };
  });
}

/**
 * Gibt es unter diesem Satz den Link „Aus dem Lumi-Buch“? Nur bei der eingeschalteten Lumi mit Figur und Namen, solange
 * Tipps kommen (nicht „Tipps aus“), der Tipp ein buch-Feld hat und das Buch den Absatz enthält.
 * e: Lumi-Einstellungen ({ darstellung, name, takt }).
 */
export function linkErlaubt(tipp, e, buch) {
  return !!tipp?.buch && e?.darstellung === "wesen" && !!e?.name && e?.takt !== "aus" && !!absatz(buch, tipp.buch);
}

/** Text zum Vorlesen: Kapitelname, dann die lesbaren Absätze; Lücken werden übersprungen. */
export function vorleseTeile(buch, frei) {
  return buchMitLuecken(buch, frei).filter((k) => k.teile.some((t) => t.art === "absatz"))
    .flatMap((k) => [`Kapitel ${k.nr}: ${k.titel}`, ...k.teile.filter((t) => t.art === "absatz").map((t) => t.text)]);
}
