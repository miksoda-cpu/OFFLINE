// Zusätzliche Prüfungen des Rundgangs (Nr. 37, Bill 16.10.2026), als Ausdrücke für den Browser, damit Rundgang und Test dieselben
// benutzen.
//
// Profil „schweiz“: keine österreichischen Notrufnummern. Gesucht werden 133 (Polizei), 122 (Feuerwehr), 1450 (Gesundheitsnummer)
// und 141 (Ärztenotdienst) im sichtbaren Text von #main und in tel:-Links. Die 144 gehört nicht dazu: In der Schweiz ist sie die
// Sanität und steht dort zu Recht (web/laender.js).
export const AT_NUMMERN = ["133", "122", "1450", "141"];

/** Im Browser: österreichische Nummern im Text von #main (und im offenen Suchfeld) und in tel:-Links; [] wenn keine. */
export const AT_NUMMERN_PRUEFEN = `(() => {
  const nummern = ${JSON.stringify(AT_NUMMERN)};
  const bereiche = [document.getElementById("main"), document.querySelector("#suche:not([hidden])")].filter(Boolean);
  const text = bereiche.map((b) => b.innerText).join("\\n");
  const tel = bereiche.flatMap((b) => [...b.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute("href").slice(4).replace(/\\s/g, "")));
  const funde = new Set();
  for (const n of nummern) {
    if (new RegExp("(?<![\\\\d.,/])" + n + "(?![\\\\d.,/])").test(text)) funde.add(n + " im Text");
    if (tel.includes(n)) funde.add("tel:" + n);
  }
  return [...funde];
})()`;

/** Im Browser: die Notrufnummern, die #main zeigt (Notfall-Seite). */
export const NOTRUFE_LESEN = `[...document.querySelectorAll("#notrufe .notruf-nr")].map((e) => e.textContent.trim())`;

/** Im Browser, Profil „offline“: Seite gerendert, ohne die Lesefehler-Meldung. */
export const OFFLINE_SEITE_PRUEFEN = `(() => {
  const m = document.getElementById("main"), text = m?.innerText.trim() ?? "";
  return { leer: !m || !m.children.length || text.length < 10, unlesbar: /lässt sich nicht lesen/i.test(text), text: text.slice(0, 80) };
})()`;
