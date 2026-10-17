// Hilfen für Browser-Tests der Vorratsliste (Nr. 42): Einträge über das Formular anlegen, wie ein Mensch. Das Formular hat in allen
// drei Entwürfen dieselben Felder und Kennungen, deshalb laufen die Tests für jeden Entwurf gleich.
import { warteBis } from "./browser.mjs";

const ruhig = (t, ms = 200) => t.auswerten(`new Promise((r) => setTimeout(r, ${ms}))`);
const setzen = (t, id, wert) => t.auswerten(`(() => { const i = document.getElementById(${JSON.stringify(id)}); if (!i) return false; i.value = ${JSON.stringify(String(wert))}; i.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);

/** Personenzahl unter Einstellungen › Dein Haushalt. */
export async function personenSetzen(t, personen) {
  await t.auswerten(`location.hash = "#einstellungen"`); await warteBis(t, `document.getElementById("hh-personen")`, 20_000);
  await setzen(t, "hh-personen", personen); await ruhig(t, 150);
}
/** Einträge anlegen: { produkt, menge, einheit, art, ablauf?, liter?, mahlzeiten? } */
export async function vorratEintragen(t, eintraege) {
  for (const e of eintraege) {
    await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.querySelector("#polster [data-vorrat-neu]")`, 20_000);
    await t.auswerten(`document.querySelector("#polster [data-vorrat-neu]").click()`); await warteBis(t, `document.getElementById("vorrat-form")`);
    await setzen(t, "vorrat-art", e.art); await warteBis(t, `document.getElementById("vorrat-art").value === ${JSON.stringify(e.art)}`);
    for (const [id, w] of [["vorrat-produkt", e.produkt], ["vorrat-menge", e.menge], ["vorrat-einheit", e.einheit ?? "Stück"], ["vorrat-liter", e.liter], ["vorrat-mahlzeiten", e.mahlzeiten]]) {
      if (w === undefined) continue;
      await t.auswerten(`(() => { const i = document.getElementById(${JSON.stringify(id)}); if (i) i.value = ${JSON.stringify(String(w))}; })()`);
    }
    if (e.ablauf) await t.auswerten(`(() => { document.getElementById("vorrat-monat").value = ${JSON.stringify(e.ablauf.slice(0, 7))}; document.getElementById("vorrat-tag").value = ${JSON.stringify(e.ablauf.length === 10 ? String(Number(e.ablauf.slice(8))) : "")}; })()`);
    await t.auswerten(`document.querySelector("[data-vorrat-speichern]").click()`); await warteBis(t, `!document.getElementById("vorrat-form")`);
    await ruhig(t, 100);
  }
}
/** Alle Einträge entfernen. */
export async function vorratLeeren(t) {
  await t.auswerten(`location.hash = "#vorsorge"`); await warteBis(t, `document.getElementById("polster")`, 20_000);
  for (let i = 0; i < 50 && (await t.auswerten(`!!document.querySelector("[data-vorrat-weg]")`)); i++) { await t.auswerten(`document.querySelector("[data-vorrat-weg]").click()`); await ruhig(t, 80); }
}
/** Wie die Eingaben von Nr. 34: Personen, Liter Wasser, Essen für N Tage (als Mahlzeiten = Tage × 3 × Personen). */
export async function wieBisher(t, { personen, liter, essen }) {
  await personenSetzen(t, personen);
  await vorratLeeren(t);
  const e = [];
  if (liter) e.push({ produkt: "Wasser", menge: liter, einheit: "Liter", art: "wasser", liter });
  if (essen) e.push({ produkt: "Essen", menge: 1, einheit: "Stück", art: "essen", mahlzeiten: essen * 3 * personen });
  await vorratEintragen(t, e);
}
