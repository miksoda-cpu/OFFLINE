// Österreich-Paket – Grundversion (Prototyp)
// Eigene Texte. Offizielle Stellen werden als Quelle genannt, nicht kopiert.
export const PAKET = {
  id: "at-basis",
  version: "2026.09.24",
  titel: "Österreich-Paket · Grundversion",
};

export const NOTRUFE = [
  { nr: "112", name: "Euro-Notruf", info: "Funktioniert in ganz Europa, auch ohne SIM-Karte und bei gesperrtem Handy." },
  { nr: "122", name: "Feuerwehr", info: "Brand, technische Hilfe, Unwetter, Gefahrstoffe." },
  { nr: "133", name: "Polizei", info: "Verbrechen, Unfälle mit Verletzten oder Gefahr, Bedrohung." },
  { nr: "144", name: "Rettung", info: "Medizinischer Notfall. Bleib am Telefon, bis die Leitstelle auflegt." },
  { nr: "140", name: "Bergrettung", info: "Alpiner Notfall, Lawine, Absturz." },
  { nr: "141", name: "Ärztenotdienst", info: "Wenn der Hausarzt nicht erreichbar ist – nachts und am Wochenende." },
  { nr: "1450", name: "Gesundheitsnummer", info: "Telefonische Gesundheitsberatung: Was tun, wohin gehen?" },
  { nr: "147", name: "Rat auf Draht", info: "Für Kinder, Jugendliche und Eltern – anonym, rund um die Uhr." },
  { nr: "128", name: "Gasnotruf", info: "Gasgeruch: kein Licht, keine Klingel, Fenster auf, Gebäude verlassen, dann anrufen." },
  { nr: "01 406 43 43", name: "Vergiftungsinformationszentrale", info: "Vergiftungen bei Mensch und Tier, rund um die Uhr." },
];

export const SIRENEN = [
  { name: "Warnung", muster: "konstant", dauer: "3 Minuten gleichbleibender Dauerton",
    tun: "Radio (ORF) oder Fernsehen einschalten, Verhaltensmaßnahmen beachten." },
  { name: "Alarm", muster: "heulend", dauer: "1 Minute auf- und abschwellender Heulton",
    tun: "Schützende Räumlichkeiten aufsuchen, über Radio/TV informieren, Anweisungen befolgen." },
  { name: "Entwarnung", muster: "konstant", dauer: "1 Minute gleichbleibender Dauerton",
    tun: "Ende der Gefahr. Weitere Hinweise über Radio/TV beachten." },
];
export const SIRENEN_HINWEIS =
  "Sirenenprobe: jeden Samstag um 12 Uhr (15 Sekunden). Einmal im Jahr, meist am ersten Samstag im Oktober, werden alle Signale österreichweit getestet.";

export const VORSORGE = [
  { gruppe: "Wasser & Essen", punkte: [
    "Trinkwasser: mindestens 2 Liter pro Person und Tag, Vorrat für 14 Tage",
    "Haltbare Lebensmittel, die ohne Kühlschrank auskommen",
    "Essen für Haustiere und Babynahrung, falls nötig",
    "Campingkocher mit Brennstoff (nur im Freien oder gut belüftet verwenden)",
  ]},
  { gruppe: "Licht, Strom & Information", punkte: [
    "Radio mit Batterie oder Kurbel – im Krisenfall informiert der ORF",
    "Taschenlampen/Stirnlampen und Ersatzbatterien",
    "Geladene Powerbanks",
    "Kerzen, Zünder, Feuerlöscher oder Löschdecke",
  ]},
  { gruppe: "Gesundheit & Hygiene", punkte: [
    "Hausapotheke und Erste-Hilfe-Set",
    "Dauermedikamente für mindestens 14 Tage",
    "Hygieneartikel, Müllsäcke, Toilettenpapier",
    "Wasser für die WC-Spülung (Kanister, gefüllte Badewanne)",
  ]},
  { gruppe: "Dokumente & Geld", punkte: [
    "Bargeld in kleinen Scheinen – Bankomat und Kartenzahlung fallen aus",
    "Wichtige Dokumente in einer Mappe (auch als Kopie auf USB-Stick)",
    "Treffpunkt mit Familie vereinbaren, falls Handynetz ausfällt",
    "Liste wichtiger Telefonnummern auf Papier",
  ]},
];

export const BLACKOUT_ABLAUF = [
  { t: "Die ersten Minuten", text: "Prüfen, ob nur dein Haus oder die ganze Gegend betroffen ist. Elektrogeräte ausschalten, eine Lampe eingeschaltet lassen – so merkst du, wann der Strom zurück ist." },
  { t: "Die ersten Stunden", text: "Radio einschalten. Kühlschrank geschlossen halten. Handy sparen: Flugmodus, nur für Notfälle einschalten. Nachbarn, besonders ältere Menschen, fragen, ob alles in Ordnung ist." },
  { t: "Tag 1 bis 3", text: "Wasser und Lebensmittel einteilen. Die Gemeinde richtet Anlaufstellen ein – im Radio auf Durchsagen achten. Notrufe nur bei echten Notfällen, die Netze sind überlastet." },
  { t: "Wenn der Strom zurückkommt", text: "Geräte nach und nach einschalten, nicht alle gleichzeitig. Lebensmittel im Kühlschrank prüfen. Vorräte wieder auffüllen." },
];

export const BUNDESLAENDER = [
  "Burgenland", "Kärnten", "Niederösterreich", "Oberösterreich", "Salzburg",
  "Steiermark", "Tirol", "Vorarlberg", "Wien",
];

export const QUELLEN = [
  { name: "Österreichischer Zivilschutzverband", url: "https://zivilschutz.at" },
  { name: "oesterreich.gv.at – Krisenvorsorge", url: "https://www.oesterreich.gv.at" },
  { name: "Rechtsinformationssystem des Bundes (RIS)", url: "https://www.ris.bka.gv.at" },
  { name: "basemap.at – Verwaltungsgrundkarte", url: "https://basemap.at" },
];

// Pakete, die in der Bibliothek angeboten werden (Größen gerundet, Stand Prototyp)
export const PAKETE = [
  { id: "at-basis", name: "Österreich-Paket", typ: "Österreich", groesse: 0.05, pro: false, installiert: true,
    text: "Notrufe, Sirenen, Blackout-Vorsorge, Checklisten." },
  { id: "at-pro", name: "Österreich-Paket Pro", typ: "Österreich", groesse: 0.4, pro: true, installiert: false,
    text: "Nach Bundesland: Behördenwege, Anlaufstellen, Apotheken, Krankenhäuser. Laufend gepflegt." },
  { id: "karte-at", name: "Karte Österreich", typ: "Karten", groesse: 1.2, pro: false, installiert: true,
    text: "Ganz Österreich, basemap.at und OpenStreetMap, zoombar bis zur Straße." },
  { id: "wiki-de-mini", name: "Wikipedia Deutsch · kompakt", typ: "Bibliothek", groesse: 3.1, pro: false, installiert: false,
    text: "Einleitungen aller Artikel, ohne Bilder. Ideal für Laptops." },
  { id: "wiki-de-nopic", name: "Wikipedia Deutsch · ohne Bilder", typ: "Bibliothek", groesse: 12.5, pro: false, installiert: false,
    text: "Alle Artikel vollständig, ohne Bilder." },
  { id: "wiki-de-maxi", name: "Wikipedia Deutsch · komplett", typ: "Bibliothek", groesse: 42, pro: false, installiert: false,
    text: "Alle Artikel mit Bildern. Braucht eine große Festplatte." },
  { id: "wikivoyage-de", name: "Wikivoyage Deutsch", typ: "Bibliothek", groesse: 0.9, pro: false, installiert: false,
    text: "Reiseführer – auch für jede Region in Österreich." },
  { id: "ris-bund", name: "RIS · Bundesrecht (Auszug)", typ: "Recht", groesse: 0.8, pro: true, installiert: false,
    text: "Geltende Fassungen wichtiger Bundesgesetze, wöchentlich aktualisiert." },
  { id: "dwa-ki", name: "Kurs: KI-Management", typ: "Kurse", groesse: 2.4, pro: true, installiert: false,
    text: "digitalworld Academy – kompletter Kurs, offline." },
  { id: "ki-basis", name: "KI-Modell Deutsch · Basis", typ: "KI", groesse: 4.7, pro: false, installiert: false,
    text: "Lokales Sprachmodell für Fragen an deine Bibliothek. Ab 8 GB RAM." },
];

// Beispiel-Änderungsprotokoll für das Update-Abo
export const AENDERUNGEN = [
  { datum: "2026-09-24", paket: "Österreich-Paket", text: "Blackout-Ablauf überarbeitet, Hinweis zur Sirenenprobe im Oktober ergänzt." },
  { datum: "2026-09-17", paket: "RIS · Bundesrecht", text: "12 Gesetze aktualisiert (Änderungen aus BGBl. I der Vorwoche)." },
  { datum: "2026-09-01", paket: "Wikipedia Deutsch", text: "Neue Monatsausgabe verfügbar (Voll-Update, 12,5 GB)." },
  { datum: "2026-08-28", paket: "Karte Österreich", text: "Quartals-Update: neue Straßen und Adressen." },
];
