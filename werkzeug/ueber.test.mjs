// Nr. 31: „Über OFFLINE“ ganz oben in den Einstellungen, Text wortgleich (Mik, 15.10.2026), der Satz zu den Tönen, der Speicher;
// der Absender-Knopf der Länderfrage führt hierher, von hier ein Knopf „Impressum“. Headless-Chrome gegen die Web-App.
import { test } from "node:test";
import assert from "node:assert/strict";
import { dateiserver, chromeStarten, warteBis } from "./browser.mjs";

const TEXT = "OFFLINE kommt von der digitalworld Academy OG in Wien, einem kleinen Bildungsinstitut. Entwicklung und Server bezahlen wir selbst. Später gibt es eine Pro-Stufe mit zusätzlichen Inhalten. Was heute gratis ist, bleibt gratis. Keine Werbung, kein Konto, keine Daten über dich auf unseren Servern.";
const TOENE = "Die App spielt von selbst keine Töne. Sirenen hörst du nur, wenn du auf ‚Anhören‘ tippst.";

test("„Über OFFLINE“: Abschnitt oben, Text wortgleich, Töne, Speicher, Impressum; Absender der Länderfrage führt hierher", async () => {
  const server = await dateiserver(), chrome = await chromeStarten(), t = await chrome.tab();
  try {
    await t.s("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await t.laden(`${server.url}/app.html#start`);
    await warteBis(t, `document.getElementById("land-frage")`, 30_000);
    await t.auswerten(`[...document.querySelectorAll(".land-absender a")].find((a) => a.textContent === "Von der digitalworld Academy OG, Wien.").click()`);
    await warteBis(t, `location.hash === "#einstellungen" && document.getElementById("ueber-offline")`, 10_000);
    const u = await t.auswerten(`(() => { const s = document.getElementById("ueber-offline"), erster = document.querySelector("#main .einst-teil");
      return { oben: erster === s, titel: s.querySelector("h2").textContent, absaetze: [...s.querySelectorAll("p")].map((p) => p.textContent), impressum: [...s.querySelectorAll("a")].find((a) => a.textContent === "Impressum")?.getAttribute("href") }; })()`);
    assert.ok(u.oben, "ganz oben"); assert.equal(u.titel, "Über OFFLINE");
    assert.equal(u.absaetze[0], TEXT, "wortgleich"); assert.equal(u.absaetze[1], TOENE);
    assert.match(u.absaetze[2], /^Auf diesem Gerät: Pakete [\d,]+ (kB|MB)/, u.absaetze[2]);
    assert.equal(u.impressum, "impressum.html");
    // zurück zur Frage, wählen, dann regulär unter Einstellungen
    await t.auswerten(`[...document.querySelectorAll("#ueber-offline a")].find((a) => a.textContent.includes("Zurück zur Länderfrage")).click()`);
    await warteBis(t, `document.getElementById("land-frage")`, 10_000);
    await t.auswerten(`document.querySelector("[data-land-weiter]").click()`);
    await warteBis(t, `localStorage.getItem("offline:paket:at-basis") && !document.getElementById("land-frage")`, 60_000);
    await t.auswerten(`location.hash = "#einstellungen"`); await warteBis(t, `document.getElementById("ueber-offline")`);
    assert.ok(await t.auswerten(`!document.querySelector("#ueber-offline").innerText.includes("Zurück zur Länderfrage")`));
  } finally { await t.schliessen(); await chrome.beenden(); server.schliessen(); }
});
