// „Bald“ in der Bibliothek (Nr. 24, Mik 14.10.2026): Für den Start im App Store sind Wikipedia, Wikivoyage, die Karte und
// die Lumi nur angekündigt – je eine Karte mit Vorschau (Bilder und ein Satz), nicht ladbar, auch nicht still im Hintergrund.
// Wer eines der Pakete schon hat, behält es unter „Auf deinem Gerät“. Bilder: web/bald/ (werkzeug/bald-bilder.mjs).

const folie = (bild, titel, text, alt) => ({ bild: `bald/${bild}`, bild_daten: `bald/${bild}`, titel, text, alt });

export const BALD = [
  {
    id: "bald-wikipedia", titel: "Wikipedia Deutsch", bereich: "wissen",
    beschreibung: "Die deutschsprachige Wikipedia zum Lesen ohne Internet, kompakt oder vollständig.",
    ersetzt: ["wiki-de-mini", "wiki-de-nopic", "wiki-de-maxi"],
    folien: [
      folie("wikipedia-1.svg", "Wikipedia auf deinem Gerät", "Alle Artikel der deutschen Wikipedia, kompakt mit den Einleitungen oder vollständig.", "Titelseite: Wikipedia Deutsch"),
      folie("wikipedia-2.svg", "Suchen und lesen ohne Netz", "Die Suche der App findet Artikel, und jeder Artikel geht auch im Flugmodus auf.", "Skizze eines Artikels mit Suchfeld"),
    ],
  },
  {
    id: "bald-wikivoyage", titel: "Wikivoyage Deutsch", bereich: "wissen",
    beschreibung: "Der Reiseführer zum Mitnehmen, mit jeder Region in Österreich, auch ohne Internet.",
    ersetzt: ["wikivoyage-de"],
    folien: [
      folie("wikivoyage-1.svg", "Reiseführer für unterwegs", "Für jede Region: Anreise, Sehenswertes, Essen und Schlafen.", "Titelseite: Wikivoyage Deutsch"),
      folie("wikivoyage-2.svg", "Eine Seite als Beispiel", "So sieht ein Ort aus, gegliedert in Abschnitte, ohne Netz lesbar.", "Skizze der Seite Salzburg"),
    ],
  },
  {
    id: "bald-karte", titel: "Karte Österreich", bereich: "karten",
    beschreibung: "Ganz Österreich als Karte auf deinem Gerät, zoombar bis zur Straße, ohne Internet.",
    ersetzt: ["karte-at"],
    folien: [
      folie("karte-1.svg", "Die ganze Karte dabei", "Ganz Österreich liegt auf deinem Gerät und geht auch ohne Netz.", "Titelseite: Karte Österreich"),
      folie("karte-2.svg", "Bis zur Straße", "Zoomen bis zur einzelnen Straße, mit Flüssen und Orten.", "Skizze einer Karte mit Fluss, Straßen und Markierung"),
    ],
  },
  {
    id: "bald-lumi", titel: "Das Lumi-Update", bereich: "lumi",
    beschreibung: "Die Lumis kommen mit einem eigenen Update: ihr Buch, ihre Sprache und ihre Gedanken.",
    ersetzt: ["lumi-buch", "lumi-philosophie", "lumisch", "wir"], // wir: die Tipps der Lumi (Nr. 27)
    folien: [
      folie("lumi-1.svg", "Das Lumi-Update", "Das Lumi-Buch, Lumisch und die Gedanken der Lumis kommen gesammelt mit einem späteren Update.", "Titelseite: Das Lumi-Update"),
      folie("lumi-2.svg", "Buch, Sprache, Gedanken", "Drei Teile: zum Lesen, zum Lernen und zum Nachdenken.", "Drei Kärtchen: Buch, Sprache, Gedanken"),
    ],
  },
];

/** Katalog-Ids, die in dieser Version nicht geladen werden (weder per Knopf noch still). Was schon da ist, bleibt. */
export const NICHT_LADBAR = new Set(BALD.flatMap((b) => b.ersetzt));
export const baldEintrag = (id) => BALD.find((b) => b.id === id) ?? null;
