// Rundgang (Nr. 28): Pakete, die noch nicht im öffentlichen Katalog stehen (z. B. die Naturheilkunde vor dem Release), für die
// Web-App auf 127.0.0.1 sichtbar machen. Baut sie mit einem Wegwerf-Schlüssel in einen Ordner unter /tmp, dazu einen Katalog
// aus den veröffentlichten Paketen in web/pakete/ und den neuen, und eine Schlüsselliste mit dem echten öffentlichen Schlüssel
// und dem Wegwerf-Schlüssel. Nichts davon kommt ins Repo oder ins Netz; der echte Paketschlüssel wird nicht gebraucht.
// Die veröffentlichten Pakete bleiben unverändert und werden weiter gegen ihren echten Schlüssel geprüft.

import { mkdtemp, readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { schluesselErzeugen, paketBauen, katalogBauen } from "../paket-lib.mjs";
import { WURZEL } from "../browser.mjs";

/** neu: Paket-Quellordner (relativ zu WURZEL). Gibt umleiten(pfad) für dateiserver() zurück.
 *  neueAusgabe: Quellordner veröffentlichter Pakete, die trotzdem neu gebaut werden (eine neue Ausgabe mit Unveröffentlichtem,
 *  z. B. at-basis mit den Karten aus Nr. 36); die alte Ausgabe aus web/pakete/ fällt dann aus dem Testkatalog. */
export async function testkatalog(alle, { neueAusgabe = [] } = {}) {
  let neu;
  const ordner = await mkdtemp(path.join(os.tmpdir(), "offline-rundgang-katalog-"));
  const sch = schluesselErzeugen("Rundgang, Wegwerf-Schlüssel (nur lokal)");
  const echt = JSON.parse(await readFile(path.join(WURZEL, "web", "schluessel", "oeffentlich.json"), "utf8"));
  const liste = { ...echt, schluessel: [...echt.schluessel, sch.oeffentlich] };
  await mkdir(path.join(ordner, "pakete"), { recursive: true });
  const gebaut = [], veroeffentlicht = new Set((await readdir(path.join(WURZEL, "web", "pakete"))).map((n) => n.replace(/-\d{4}\.\d\d\.\d\d(\.\d+)?$/, "")));
  neu = [];
  const ersetzt = new Set();
  for (const q of alle) { const id = JSON.parse(await readFile(path.join(WURZEL, q, "paket.quelle.json"), "utf8")).id; if (!veroeffentlicht.has(id)) neu.push(q); }
  for (const q of neueAusgabe) { neu.push(q); ersetzt.add(JSON.parse(await readFile(path.join(WURZEL, q, "paket.quelle.json"), "utf8")).id); }
  if (!neu.length) return null; // alles schon in der Web-Kopie: kein Testkatalog nötig
  for (const q of neu) gebaut.push((await paketBauen(path.join(WURZEL, q), path.join(ordner, "pakete"), sch.privatPem)).ziel);
  const web = (await readdir(path.join(WURZEL, "web", "pakete"))).filter((n) => !ersetzt.has(n.replace(/-\d{4}\.\d\d\.\d\d(\.\d+)?$/, ""))).map((n) => path.join(WURZEL, "web", "pakete", n));
  const { bytes, sig } = await katalogBauen([...web, ...gebaut], { basis: "http://127.0.0.1/pakete/", bekannte: liste.schluessel, privat: sch.privatPem });
  await mkdir(path.join(ordner, "katalog"), { recursive: true });
  await writeFile(path.join(ordner, "katalog", "katalog.json"), bytes);
  await writeFile(path.join(ordner, "katalog", "katalog.sig"), JSON.stringify(sig));
  await mkdir(path.join(ordner, "schluessel"), { recursive: true });
  await writeFile(path.join(ordner, "schluessel", "oeffentlich.json"), JSON.stringify(liste, null, 2));
  const neuePfade = gebaut.map((g) => `/pakete/${path.basename(g)}/`);
  return {
    ordner, ids: gebaut.map((g) => path.basename(g)),
    umleiten(p) {
      if (p === "/katalog/katalog.json" || p === "/katalog/katalog.sig" || p === "/schluessel/oeffentlich.json") return path.join(ordner, p);
      if (neuePfade.some((n) => p.startsWith(n))) return path.join(ordner, p);
      return null;
    },
  };
}
