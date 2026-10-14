// Auftrag Nr. 19 (0.7.2): Nachtrag zu 0.7.1 und Startreife, Teil 1 (was ohne Konten geht).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const lies = (p) => readFile(new URL(p, import.meta.url), "utf8");
const app = await lies("./app.js"), css = await lies("./styles.css");

test("Vorschau: Titelbild und „Vorschau ansehen“ in der Karte, großes Fenster statt Slideshow, für Pakete und Module", async () => {
  assert.ok(!/sliderHtml|aria-roledescription="Slideshow"|data-folie=/.test(app), "keine Slideshow mehr in der Box");
  assert.ok(app.includes('class="vorschau-titelbild" data-vorschau-oeffnen=') && app.includes(">Vorschau ansehen</button>"));
  // Karte: Titelbild vor dem Namen, bei Modulen und bei Paketen mit Vorschau
  assert.match(app, /data-modul-karte="\$\{esc\(e\.id\)\}">\n {4}\$\{vorschauTitelHtml\(/);
  assert.match(app, /data-laden-karte="\$\{esc\(p\.id\)\}">\n {4}\$\{p\.vorschau\?\.folien\?\.length \? vorschauTitelHtml\(/);
  // Fenster: Dialog, Bild oben, Text darunter, ×, Esc, Tippen daneben, „laden“. Seit Nr. 28 (Nachtrag Mik) kein Durchblättern:
  // alle Bilder untereinander, keine Pfeile, kein „1 von 4“, kein Wischen
  for (const s of ['role="dialog" aria-modal="true"', '<div class="vorschau-bild">', "<figcaption><h3>", '<div class="vorschau-folien">${folien.map((f, i) =>', 'aria-label="Vorschau schließen">×</button>',
    '<div class="vorschau-hinter" data-vorschau-zu></div>', 'ev.key === "Escape"', "data-vorschau-laden>laden</button>"]) assert.ok(app.includes(s), s);
  const vorschauTeil = app.slice(app.indexOf("const vorschauFenster = {"), app.indexOf("function vorschauLaden(key)"));
  for (const s of ["von ${n}", "data-vorschau-schritt", 'ev.key === "ArrowRight"', '"pointerup"', "vorschauBlaettern"]) assert.ok(!vorschauTeil.includes(s) && !app.includes("vorschauBlaettern"), `nicht mehr: ${s}`);
  // Ein Hauptknopf: nur „laden“ ist primär; Handy: ganzer Bildschirm
  const fenster = app.slice(app.indexOf("function vorschauFensterZeichnen"), app.indexOf("function vorschauOeffnen"));
  assert.equal((fenster.match(/of-btn--primaer/g) ?? []).length, 0);
  assert.equal((app.slice(app.indexOf("function vorschauFuss"), app.indexOf("function vorschauFensterZeichnen")).match(/of-btn--primaer/g) ?? []).length, 1);
  assert.match(css, /@media \(max-width: 640px\) \{\n {2}\.vorschau-dialog \{ width: 100vw; height: 100dvh;/);
  // Browser: Bilder aus dem Paketordner, jedes gegen Größe und Prüfsumme im signierten Katalog
  const client = await lies("./paket-client.js");
  assert.ok(client.includes("export async function vorschauKatalog(id)") && client.includes("(await sha256Hex(bytes)) !== d.sha256"));
});

test("Übersicht heißt „Bereit“; Web-Version: Rätsel gibt es in der Desktop-App; „Heute ruhig“ nicht gebaut", () => {
  assert.ok(app.includes('["uebersicht", "Bereit"]') && app.includes("<h1>Bereit</h1>") && !app.includes('["uebersicht", "Übersicht"], ["notfall"'));
  assert.ok(app.includes("${desktop ? \"\" : `<p class=\"z-leise pause-knobeln-web\">Die Rätsel zum Knobeln gibt es in der Desktop-App.</p>`}"));
  assert.ok(!/heute ruhig/i.test(app));
});

test("Lumisch ohne Figur nur, wenn das Paket selbst geladen (oder eingeschaltet) wurde; das stille Nachladen zählt nicht", () => {
  assert.ok(app.includes('const lumischInPause = () => lumiInPause() || (speicher.get("lumisch-selbst", false) && !!PL());'));
  assert.ok(app.includes('if (id === "lumisch" && !alt) { speicher.set("lumisch-selbst", true);'), "Laden in der Bibliothek");
  assert.ok(app.includes('if (b.dataset.remove === "lumisch") speicher.set("lumisch-selbst", false);'), "Löschen nimmt es zurück");
  const still = app.slice(app.indexOf('if (paketRoh("pause") && !paketRoh("lumisch")'), app.indexOf('if (paketRoh("pause") && !paketRoh("lumisch")') + 400);
  assert.ok(still.includes("lumisch-geholt") && !still.includes("lumisch-selbst"), "automatisch geholt ist keine Entscheidung");
});

test("Alter (seit Nr. 23, Entscheidung Mik 11.10.2026): Empfehlung statt Sperre, keine Frage, keine gespeicherte Antwort", () => {
  // Vorher: einmalige Frage „Bist du mindestens 18?“ beim ersten Laden. Mik: „Wer soll das überprüfen? … Eher als Empfehlung“.
  assert.ok(!app.includes("Bist du mindestens") && !app.includes('speicher.get("alter-bestaetigt", {})'));
  assert.ok(!app.includes("alterSperre("), "Pakete und Module laden ohne Frage");
  assert.ok(app.includes("Empfohlen ab ${Number(p.alter_ab)} Jahren"));
});

test("Startreife: ehrliche Beschreibung, kein Lizenzschlüssel, kein Kamera-Hinweis, nichts Versprochenes ohne Funktion", async () => {
  const conf = JSON.parse(await lies("../app/src-tauri/tauri.conf.json"));
  assert.equal(conf.bundle.longDescription, "OFFLINE bringt Wikipedia, Wikivoyage, Karten und Notfallwissen für Österreich auf PC und Mac, auch ohne Internet. Dazu kommen jeden Tag ein Rätsel und ein Stück vom Roman der Woche. Die Inhalte kommen als signierte Pakete per Update oder vom USB-Stick.");
  for (const f of ["./hilfe.js", "./datenschutz.html"]) assert.ok(!/Lizenzschlüssel/.test(await lies(f)), f);
  assert.ok((await lies("./hilfe.js")).includes("Die Pakete kommen von unserem Server. Die App sendet nur die Versionen deiner Pakete, keine Inhalte und keine Notizen."));
  const plist = await lies("../app/src-tauri/Info.plist");
  assert.ok(!plist.includes("NSCameraUsageDescription") && plist.includes("NSMicrophoneUsageDescription"));
  assert.ok(!JSON.parse(await lies("../pakete/geplant.json")).some((p) => p.art === "modell"), "kein KI-Modell unter „Bald“");
  assert.ok(!/Sprachmodell|lokale KI/.test(await lies("./index.html")));
  // Kein fremder Server für die Karte: Leaflet liegt bei uns (Datenschutz-Angaben der Stores)
  assert.ok(!/cdnjs/.test((await lies("./app.html")) + (await lies("./sw.js")) + JSON.stringify(conf)));
  for (const f of ["icon-1024.png", "store-1024.png"]) assert.ok((await stat(new URL(`../app/src-tauri/icons/${f}`, import.meta.url))).size > 1000, f);
});

test("Store-Build: Schalter ohne Updater und ohne internen Kanal; der Direkt-Download bleibt", async () => {
  const cargo = await lies("../app/src-tauri/Cargo.toml"), lib = await lies("../app/src-tauri/src/lib.rs");
  assert.match(cargo, /default = \["tls", "updater"\]/);
  assert.match(cargo, /updater = \["tls", "dep:tauri-plugin-updater"\]/);
  assert.match(cargo, /store = \["tls"\]/);
  assert.ok(lib.includes('#[cfg(all(feature = "store", feature = "updater"))]\ncompile_error!'));
  assert.ok(lib.includes('#[cfg(feature = "updater")]\n    let builder = builder.plugin(tauri_plugin_updater'));
  assert.ok(lib.includes('if cfg!(feature = "store") { return None; } // Store-Build: kein interner Kanal'));
  assert.ok(lib.includes('store: cfg!(feature = "store") }'));
  assert.deepEqual(JSON.parse(await lies("../app/src-tauri/tauri.store.conf.json")), { bundle: { createUpdaterArtifacts: false } });
  for (const s of ["const storeBuild = !!desktop?.info?.store;", "const k = storeBuild ? null : schluesselAusLink(location.hash);", "Neue Versionen der App kommen über den Store.", "if (storeBuild) return \"\";", "if (versionTipps.length >= 7 && !storeBuild)"]) assert.ok(app.includes(s), s);
});

test("Version überall gleich (App, version.json), Service Worker mit neuer Fassung", async () => {
  const v = JSON.parse(await lies("./version.json")).version;
  assert.ok(app.includes(`const APP_VERSION = "${v}";`));
  assert.match(await lies("./sw.js"), /const VERSION = "offline-v(\d+)";/);
  assert.ok(Number((await lies("./sw.js")).match(/offline-v(\d+)/)[1]) >= 33);
});
