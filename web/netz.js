// Heute neu (Nr. 29, Entwurf C, von Mik am 14.10.2026 gewählt): Online-Status, Dauer ohne Internet, vier Fragen mit Ja/Nein,
// ein Rat daraus und Stufen nach Dauer. Nur Logik und Texte (Wortlaut der zwei Offline-Seiten von Bill, 15.10.2026), keine
// Oberfläche. Die Antworten bleiben am Gerät; die App misst nichts und sucht keine Geräte in der Nähe.

/** Radio-Satz je Land (Nr. 29, Punkt 8): Deutschland und Schweiz ohne ORF, bis die Länderpakete kommen. */
export const radioSender = (land) => (land === "at" ? "Ö3 oder dein ORF-Landesstudio" : "dein Radiosender für Krisenfälle");

/** Die vier Fragen. ok: die Antwort, bei der es nicht an dir liegt. */
export const FRAGEN = [
  { id: "flugmodus", text: "Ist der Flugmodus aus?", ok: "ja" },
  { id: "rechnung", text: "Rechnung bezahlt, Datenvolumen da?", ok: "ja" },
  { id: "funkloch", text: "Bist du im Lift, Keller, Tunnel?", ok: "nein" },
  { id: "nachbarn", text: "Haben Nachbarn auch kein Netz?", ok: "ja" },
];
export const NACHBAR_SATZ = "Wir fragen dich. Die App misst nichts und sucht keine Geräte in der Nähe.";

/**
 * Rat aus den Antworten ({ flugmodus: "ja"|"nein", … }). Zuerst, was du selbst ändern kannst; dann, ob es auch bei den
 * Nachbarn weg ist. null, solange nichts beantwortet ist, was einen Rat trägt.
 */
export function rat(a, land = "at") {
  if (a.flugmodus === "nein") return { titel: "Schalte den Flugmodus aus.", text: "Wisch auf deinem Handy von oben nach unten. Ist das Flugzeug-Zeichen hell, tipp darauf, um es auszuschalten.", ziel: "#netz-ich", knopf: "Liegt es an mir?" };
  if (a.rechnung === "nein") return { titel: "Dann liegt es vermutlich am Vertrag.", text: "Ist dein Datenvolumen für diesen Monat aufgebraucht oder eine Rechnung offen, sperrt der Anbieter oft das Internet. Telefonieren geht dann meist noch. Eine SMS vom Anbieter verrät es.", ziel: "#netz-ich", knopf: "Liegt es an mir?" };
  if (a.funkloch === "ja") return { titel: "Dann ist es wohl ein Funkloch.", text: "Geh ein paar Schritte ins Freie oder ans Fenster.", ziel: "#netz-ich", knopf: "Liegt es an mir?" };
  if (a.nachbarn === "ja") return { titel: "Dann liegt es nicht an dir.", text: `Wahrscheinlich ein größerer Ausfall. Schalte das Radio ein: ${radioSender(land)}.`, ziel: "#netz-andere", knopf: "Was jetzt zu tun ist", gross: true };
  if (a.nachbarn === "nein") return { titel: "Dann ist es nur bei dir weg.", text: "Starte das Handy einmal neu. Nimm Kontakt mit deinem Anbieter auf, sobald du wieder Netz hast, oder frag Nachbarn, ob du kurz ihr WLAN nutzen darfst.", ziel: "#netz-ich", knopf: "Liegt es an mir?" };
  return null;
}

/** Stufen nach Dauer (Nr. 29, Punkt 4). ziel: vorhandene Seite der App. */
export const STUFEN = [
  { titel: "Erste Minuten", text: "Liegt es an mir?", ziel: "#netz-ich", bis: 15 * 60e3 },
  { titel: "Bis 1 Stunde", text: "Haben andere auch kein Netz?", ziel: "#netz-andere", bis: 60 * 60e3 },
  { titel: "Einige Stunden", text: "Licht, Kühlschrank, Akku", ziel: "#szenario-blackout", bis: 24 * 3600e3 },
  { titel: "Ab 1 Tag", text: "Wasser, Vorrat, Nachbarn", ziel: "#vorsorge", bis: 3 * 24 * 3600e3 },
  { titel: "Mehrere Tage", text: "Grundvorsorge, Danach", ziel: "#szenario-blackout", anker: "danach", bis: Infinity },
];
/** Welche Stufe gilt nach ms ohne Internet? (unbekannt: die erste) */
export const stufeFuer = (ms) => (ms == null || ms < 0 ? 0 : STUFEN.findIndex((s) => ms < s.bis));

/** „2 Minuten“, „1 Stunde“, „3 Tagen“ – für „Offline seit …“. */
export function dauerText(ms) {
  const min = Math.max(0, Math.floor(ms / 60e3));
  if (min < 1) return "weniger als einer Minute";
  if (min < 60) return min === 1 ? "1 Minute" : `${min} Minuten`;
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? "1 Stunde" : `${h} Stunden`;
  const t = Math.floor(h / 24);
  return t === 1 ? "1 Tag" : `${t} Tagen`;
}

/** Die zwei Offline-Seiten, Wortlaut Bill (15.10.2026, ergänzte Fassung). */
export function seite(id, land = "at") {
  if (id === "ich") return {
    titel: "Liegt es an mir?",
    einleitung: "Meistens ist das Netz nur bei dir weg. Prüf diese vier Dinge, das dauert eine Minute.",
    schritte: [
      ["Flugmodus.", "Wisch auf deinem Handy von oben nach unten. Ist das Flugzeug-Zeichen hell, tipp darauf, um es auszuschalten."],
      ["WLAN und mobile Daten.", "Schau, ob beide eingeschaltet sind. Bist du zu Hause, schalte das WLAN einmal aus und wieder ein."],
      ["Datenvolumen und Rechnung.", "Ist dein Datenvolumen für diesen Monat aufgebraucht oder eine Rechnung offen, sperrt der Anbieter oft das Internet. Telefonieren geht dann meist noch. Eine SMS vom Anbieter verrät es."],
      ["Funkloch.", "Im Lift, in der Tiefgarage, im Keller, im Tunnel oder im Zug gibt es oft kein Netz. Geh ein paar Schritte ins Freie oder ans Fenster."],
    ],
    schluss: [["Immer noch kein Netz?", "Starte das Handy einmal neu. Hilft das nicht, liegt es vermutlich nicht an dir. Weiter mit „Haben andere auch kein Netz?“."]],
    weiter: { ziel: "#netz-andere", text: "Haben andere auch kein Netz?" },
  };
  return {
    titel: "Haben andere auch kein Netz?",
    einleitung: "Wenn bei dir alles stimmt, ist vielleicht das Netz in deiner Gegend ausgefallen. So findest du es heraus.",
    schritte: [
      ["Frag in der Nähe.", "Klopf bei Nachbarn an oder frag jemanden auf der Straße, ob deren Handy oder Internet geht. Die App fragt dich das nur. Sie misst nichts und sucht keine Geräte in der Nähe."],
      ["Schau, ob Strom da ist.", "Geht das Licht? Leuchten die Straßenlaternen und die Ampeln? Ist auch der Strom weg, kann es ein größerer Ausfall sein."],
      ["Schalte das Radio ein.", `Ein Radio mit Batterie oder Kurbel, oder das Autoradio. Bei größeren Ausfällen ${land === "at" ? "informieren Ö3 oder dein ORF-Landesstudio" : "informiert dein Radiosender für Krisenfälle"}.`],
    ],
    wasJetzt: [
      ["Nur bei dir weg:", "Nimm Kontakt mit deinem Anbieter auf, sobald du wieder Netz hast, oder frag Nachbarn, ob du kurz ihr WLAN nutzen darfst."],
      ["Bei allen weg, Strom da:", "Meist ist es in einigen Stunden vorbei. Spar Akku, halte das Radio bereit."],
      ["Bei allen weg, auch kein Strom:", "Das kann ein Blackout sein. Öffne die Blackout-Karte. Dort steht, was du in den ersten Stunden tust."],
    ],
    schluss: [["Im Notfall:", "Notrufe gehen oft auch dann noch, wenn sonst nichts geht. Probier 112."]],
    weiter: { ziel: "#szenario-blackout", text: "Blackout-Karte" },
  };
}
