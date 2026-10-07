// Abkürzungen (Textregel Mik, 07.10.2026, über Bill): Jede Abkürzung wird in jedem Text der App beim ersten Vorkommen
// ausgeschrieben, z. B. „Vergiftungsinformationszentrale (VIZ)“. Die App macht das beim Anzeigen (ausschreiben): Die
// Quelltexte der Pakete bleiben wörtlich, und jeder Text – eine Hilfe-Antwort, ein Tipp, ein Eintrag, eine Zeile – folgt
// derselben Liste. Steht die Langform im Text schon vor der Abkürzung, bleibt er, wie er ist.
// Neue Abkürzung in einem Text? In LISTE eintragen (Langform ohne Abkürzungen), oder in KEINE mit Grund, oder in OFFEN,
// bis die Langform geklärt ist. Der Test web/abkuerzungen.test.mjs findet jede, die fehlt.

/** Abkürzung → Langform. Reihenfolge egal; Langformen enthalten selbst keine Abkürzung aus der Liste. */
export const LISTE = {
  // App, Hilfe, Österreich-Paket, Tipps
  KI: "künstliche Intelligenz", KIs: "künstliche Intelligenzen", WLAN: "drahtloses lokales Netzwerk", ORF: "Österreichischer Rundfunk",
  SIM: "Teilnehmer-Identitätsmodul", TV: "Fernsehen", WC: "Toilette", USB: "Universal Serial Bus", QR: "Quick Response",
  SMS: "Kurznachricht", PDF: "Portable Document Format", PDFs: "Dateien im Portable Document Format", URL: "Internetadresse", URLs: "Internetadressen",
  EU: "Europäische Union", USA: "Vereinigte Staaten", US: "Vereinigte Staaten", UK: "Vereinigtes Königreich", UN: "Vereinte Nationen",
  NÖ: "Niederösterreich", OÖ: "Oberösterreich", NRW: "Nordrhein-Westfalen", CH: "Schweiz", DE: "Deutschland", FR: "Frankreich",
  // Behörden, Einrichtungen, Werke
  VIZ: "Vergiftungsinformationszentrale", EMA: "Europäische Arzneimittel-Agentur",
  HMPC: "Ausschuss für pflanzliche Arzneimittel der Europäischen Arzneimittel-Agentur",
  NCCIH: "National Center for Complementary and Integrative Health", AGES: "Agentur für Gesundheit und Ernährungssicherheit",
  BASG: "Bundesamt für Sicherheit im Gesundheitswesen", BfR: "Bundesinstitut für Risikobewertung",
  BfArM: "Bundesinstitut für Arzneimittel und Medizinprodukte", DGfM: "Deutsche Gesellschaft für Mykologie",
  NHS: "National Health Service", ESCOP: "European Scientific Cooperative on Phytotherapy",
  LWG: "Landesanstalt für Weinbau und Gartenbau", LWF: "Landesanstalt für Wald und Forstwirtschaft", LfL: "Landesanstalt für Landwirtschaft",
  FDA: "Food and Drug Administration", WHO: "Weltgesundheitsorganisation", NIH: "National Institutes of Health",
  NCI: "National Cancer Institute", NCBI: "National Center for Biotechnology Information", PMC: "PubMed Central",
  EFSA: "Europäische Behörde für Lebensmittelsicherheit", MHRA: "Medicines and Healthcare products Regulatory Agency",
  ANSES: "französische Agentur für Lebensmittelsicherheit", BVL: "Bundesamt für Verbraucherschutz und Lebensmittelsicherheit",
  IARC: "Internationale Agentur für Krebsforschung", IUCN: "Weltnaturschutzunion",
  UNESCO: "Organisation der Vereinten Nationen für Bildung, Wissenschaft und Kultur", NGO: "Nichtregierungsorganisation",
  GIZ: "Giftinformationszentrum", GGIZ: "Gemeinsames Giftinformationszentrum", OÖG: "Oberösterreichische Gesundheitsholding",
  WSL: "Eidgenössische Forschungsanstalt für Wald, Schnee und Landschaft", TU: "Technische Universität",
  LAK: "Landesapothekerkammer", ÖÄK: "Österreichische Ärztekammer", DGIM: "Deutsche Gesellschaft für Innere Medizin",
  DPhG: "Deutsche Pharmazeutische Gesellschaft", AkdÄ: "Arzneimittelkommission der deutschen Ärzteschaft",
  ASAM: "American Society of Addiction Medicine", ESE: "European Society of Endocrinology",
  ICEERS: "International Center for Ethnobotanical Education, Research and Service", BAE: "Bureau of American Ethnology",
  BHL: "Biodiversity Heritage Library", BSB: "Bayerische Staatsbibliothek", ÖNB: "Österreichische Nationalbibliothek",
  LWL: "Landschaftsverband Westfalen-Lippe", HWDA: "Handwörterbuch des deutschen Aberglaubens",
  ÖAB: "Österreichisches Arzneibuch", "Ph. Eur.": "Europäisches Arzneibuch",
  // Recht
  RIS: "Rechtsinformationssystem des Bundes", SMG: "Suchtmittelgesetz", NPSG: "Neue-Psychoaktive-Substanzen-Gesetz",
  AMG: "Arzneimittelgesetz", LGBl: "Landesgesetzblatt", VO: "Verordnung", EG: "Europäische Gemeinschaft",
  CITES: "Washingtoner Artenschutzübereinkommen", FFH: "Fauna-Flora-Habitat", GAP: "Gemeinsame Agrarpolitik",
  EPAR: "Europäischer öffentlicher Beurteilungsbericht", GI: "Gebrauchsinformation",
  ATC: "Anatomisch-Therapeutisch-Chemische Klassifikation", ICD: "Internationale Klassifikation der Krankheiten",
  // Medizin und Chemie
  TCM: "Traditionelle Chinesische Medizin", PA: "Pyrrolizidinalkaloide", WW: "Wechselwirkungen",
  RCT: "randomisierte kontrollierte Studie", RCTs: "randomisierte kontrollierte Studien",
  NSAR: "nichtsteroidale Antirheumatika", PK: "Pharmakokinetik", PD: "Pharmakodynamik", INR: "International Normalized Ratio",
  HIV: "Humanes Immundefizienz-Virus", DOAK: "direkte orale Antikoagulanzien", ASS: "Acetylsalicylsäure",
  SSRI: "selektive Serotonin-Wiederaufnahmehemmer", ACE: "Angiotensin-konvertierendes Enzym", DKA: "diabetische Ketoazidose",
  VKA: "Vitamin-K-Antagonisten", G6PD: "Glukose-6-Phosphat-Dehydrogenase", DMT: "Dimethyltryptamin",
  DNA: "Desoxyribonukleinsäure", NNRTI: "nicht-nukleosidische Reverse-Transkriptase-Hemmer",
  TDI: "tolerierbare tägliche Aufnahmemenge", AUC: "Fläche unter der Konzentrationskurve", KG: "Körpergewicht",
  TVT: "tiefe Venenthrombose", LE: "Lungenembolie", ZNS: "Zentralnervensystem", FSME: "Frühsommer-Meningoenzephalitis",
  CYP: "Cytochrom P450", CYP3A4: "Cytochrom-P450-Enzym 3A4", CYP2C9: "Cytochrom-P450-Enzym 2C9", CYP2C19: "Cytochrom-P450-Enzym 2C19",
  HLA: "humanes Leukozytenantigen", PRES: "posteriores reversibles Enzephalopathie-Syndrom", PDE5: "Phosphodiesterase 5",
  GABA: "Gamma-Aminobuttersäure", MAO: "Monoaminoxidase", PPI: "Protonenpumpenhemmer", LSD: "Lysergsäurediethylamid",
  DOM: "Dimethoxymethylamphetamin", UV: "ultraviolett", SO2: "Schwefeldioxid", NH3: "Ammoniak", NOx: "Stickoxide",
  OCR: "Texterkennung", FAQ: "häufige Fragen", "k.A.": "keine Angabe", MB: "Megabyte", AT: "Österreich",
  BArtSchV: "Bundesartenschutzverordnung", BNatSchG: "Bundesnaturschutzgesetz", VG: "Verwaltungsgericht", BC: "vor Christus",
  GYO: "Grow your own", PR: "Öffentlichkeitsarbeit", WK: "Weltkrieg", DC: "Dünnschichtchromatographie",
  ULB: "Universitäts- und Landesbibliothek", BRIT: "Botanical Research Institute of Texas",
};

/** Keine Abkürzung zum Ausschreiben: Namen, Hervorhebungen, Nummern von Quellen, Codes. */
export const KEINE = {
  OFFLINE: "Name der App", "Ö3": "Name des Senders", ENTWURF: "Hervorhebung", WARNUNG: "Hervorhebung", NICHT: "Hervorhebung",
  HOCH: "Gefahrenstufe", SEHR: "Gefahrenstufe", TÖDLICH: "Gefahrenstufe", NIEMALS: "Hervorhebung", KEINE: "Hervorhebung",
  KEIN: "Hervorhebung", HANDELN: "Hervorhebung", ERST: "Hervorhebung", DANN: "Hervorhebung", ODER: "Hervorhebung",
  KANN: "Hervorhebung", SEIN: "Hervorhebung", ALS: "Hervorhebung", DIE: "Hervorhebung", ABER: "Hervorhebung",
  MSD: "Name des Handbuchs (MSD Manual)", UC: "Name des Verlags (UC Press)", BMJ: "Name der Zeitschrift (BMJ Open)",
  EUR: "Name der Rechtsdatenbank (EUR-Lex)", EMEA: "Teil einer Dokumentnummer", HTTP: "technischer Fehlercode",
  QT: "Name eines Abschnitts im Elektrokardiogramm", QTc: "Name eines Abschnitts im Elektrokardiogramm",
  XARELTO: "Handelsname", WebFetch: "Name eines Werkzeugs", PubMed: "Name einer Datenbank", DocCheck: "Name einer Seite",
  MedUni: "Teil eines Namens (MedUni Wien)", HgS: "chemische Formel", MeO: "Teil eines Stoffnamens", IDs: "Kennungen",
  TOBIAS: "Name eines Archivs (TOBIAS-lib)", PTAheute: "Name einer Zeitschrift",
};

/** Noch offen: Langform von Bill erbeten; bis dahin bleibt die Abkürzung, wie sie ist. */
export const OFFEN = {
  BMLUK: "Name des Bundesministeriums in der aktuellen Fassung",
  PI: "zwei Bedeutungen in den Texten (Proteasehemmer, Fachinformation des Herstellers)",
  DGAM: "Gesellschaft nicht eindeutig", ÖGC: "Gesellschaft nicht eindeutig",
};

const re = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MUSTER = Object.keys(LISTE).sort((a, b) => b.length - a.length)
  .map((k) => [k, new RegExp(`(?<![\\p{L}\\p{N}_@.])${re(k)}(?![\\p{L}\\p{N}_@])`, "gu")]);
/** Liegt die Stelle in einer Internetadresse oder einem Pfad? Dann bleibt sie unangetastet. */
const inAdresse = (text, i) => { const vor = text.slice(0, i), anfang = Math.max(vor.lastIndexOf(" "), vor.lastIndexOf("\n"), vor.lastIndexOf("(")) + 1; const rest = text.slice(i).search(/[\s)]/); const wort = text.slice(anfang, rest < 0 ? text.length : i + rest); return /:\/\/|www\.|\.(at|de|org|com|gv|ch|uk|int|eu|net)\//i.test(wort); };

/**
 * Schreibt in einem Text jede bekannte Abkürzung beim ersten Vorkommen aus:
 *   „laut EMA“ → „laut EMA (Europäische Arzneimittel-Agentur)“ – die Abkürzung bleibt im Satz, so stimmt der Fall immer
 *   „(EMA)“ → „(EMA: Europäische Arzneimittel-Agentur)“
 *   „SIM-Karte“ → „SIM-Karte (SIM: Teilnehmer-Identitätsmodul)“
 *   steht die Langform schon davor: „Vergiftungsinformationszentrale anrufen … die VIZ“ → „Vergiftungsinformationszentrale (VIZ) anrufen …“
 * Texte, die die App selbst schreibt (Hilfe, Was ist neu), tragen die Langform von Hand in der Form „Langform (KURZ)“.
 * Internetadressen bleiben unangetastet.
 */
const ALLE = new RegExp(`(?<![\\p{L}\\p{N}_@.])(?:${MUSTER.map(([k]) => re(k)).join("|")})(?![\\p{L}\\p{N}_@])`, "gu");
export function ausschreiben(text, liste = LISTE) {
  if (typeof text !== "string" || text.length < 2) return text;
  const da = new Set(text.match(ALLE) ?? []); // nur die Abkürzungen, die in diesem Text vorkommen
  if (!da.size) return text;
  let aus = text;
  for (const [k, muster] of MUSTER) {
    if (!da.has(k)) continue;
    const lang = liste[k]; if (!lang) continue;
    if (aus.includes(`${k} (${lang})`) || aus.includes(`${lang} (${k})`) || aus.includes(`(${k}: ${lang}`) || aus.includes(`${k}: ${lang})`)) continue; // schon erklärt
    muster.lastIndex = 0;
    let m;
    while ((m = muster.exec(aus)) && inAdresse(aus, m.index)) { /* weiter suchen */ }
    if (!m) continue;
    const davor = aus.slice(0, m.index), wo = davor.search(new RegExp(`${re(lang)}(?![\\p{L}])`, "u")); // ganze Langform, nicht „Studie“ in „Studien“
    if (wo >= 0) { // Langform steht schon davor: die Abkürzung gleich dahinter nennen, wenn sie dort nicht schon steht
      if (!aus.slice(wo + lang.length).startsWith(` (${k}`)) aus = `${aus.slice(0, wo + lang.length)} (${k})${aus.slice(wo + lang.length)}`;
      continue;
    }
    const i = m.index, ende = i + k.length, vorne = aus[i - 1], hinten = aus[ende];
    if (hinten === "-" || vorne === "-") { // Wortzusammensetzung (PA-haltig, BfR-PDF): hinter dem ganzen Wort erklären
      const wortEnde = ende + (/^[-/\p{L}\p{N}]*/u.exec(aus.slice(ende))?.[0].length ?? 0);
      aus = `${aus.slice(0, wortEnde)} (${k}: ${lang})${aus.slice(wortEnde)}`;
    } else if (vorne === "(" && hinten === ")") aus = `${aus.slice(0, ende)}: ${lang}${aus.slice(ende)}`; // „(EMA)“ → „(EMA: …)“
    else aus = `${aus.slice(0, ende)} (${lang})${aus.slice(ende)}`; // Abkürzung bleibt im Satz, Langform in Klammern: kein Fallfehler
  }
  return aus;
}

/** Alle Texte in Paketdaten ausschreiben (jede Zeichenkette ist ein Text für sich). Schlüssel und Kennungen bleiben. */
export function texteAusschreiben(daten, liste = LISTE) {
  if (typeof daten === "string") return ausschreiben(daten, liste);
  if (Array.isArray(daten)) return daten.map((x) => texteAusschreiben(x, liste));
  if (daten && typeof daten === "object") return Object.fromEntries(Object.entries(daten).map(([k, v]) => [k, /^(id|ids|pfad|bild|url|buch|wort|lumisch|umschrift|ipa)$/.test(k) ? v : texteAusschreiben(v, liste)]));
  return daten;
}
