// Pause: alle Startwerte an einer Stelle (Auftrag 2026-10-04-pause-stufe1). Es sind Annahmen für die Testphase, keine
// belegten Größen (OFFLINE-Modul-Pause-Konzept.md, Abschnitt 5 und 11; Trainingsmodell, Abschnitt 4). Ändern heißt: hier
// eine Zahl ändern; web/pause.test.mjs prüft nur das Verhalten, nicht die Zahlen selbst.

export const WERTE = {
  // Startmischung des Dirigenten: Vertrautes (gespielt und gemocht), Verwandtes (gleiche Trainingsart wie Gemochtes), Neues
  mischung: { vertraut: 0.65, verwandt: 0.25, neu: 0.1 },
  // Regler „Vertraut ↔ Neues“ (−1 … +1) verschiebt so viel vom Vertrauten ins Neue (bzw. zurück)
  neuigkeitRegler: 0.15,
  // Zone 2 (Grundlage): Trefferquote, in der die Stufe bleibt; darüber eine Stufe schwerer, darunter eine leichter
  zone: { untere: 0.75, obere: 0.85, beurteilenNach: 3 }, // erst nach so vielen Happen einer Form verstellen
  // Kennenlernen: so viele Tage viel Abwechslung, Rückfragen höchstens einmal am Tag, danach höchstens einmal je Woche
  kennenlernenTage: 21,
  rueckfrage: { kennenlernenAbstandTage: 1, danachAbstandTage: 7 },
  // Appetit: so oft am Tag wird ein Happen angeboten (beim Öffnen); „Noch einen?“ zählt nicht dazu
  appetit: { wenig: 1, mittel: 3, viel: 6 },
  // Ein Öffnen innerhalb so vieler Minuten nach dem letzten zählt nicht als neues
  oeffnenAbstandMin: 10,
  // „Zu leicht · Genau richtig · Zu schwer“ höchstens bei jedem n-ten Happen
  schwierigkeitAlleN: 5,
  // Bewertung je Form: Start 1, „Mehr davon“ ×1,3 (höchstens 3), verwandte Formen ×1,1; „Nicht mehr“ nimmt die Form heraus
  // und senkt Verwandtes leicht (×0,9, nie unter 0,4)
  gewicht: { start: 1, mehr: 1.3, verwandtMehr: 1.1, verwandtNicht: 0.9, hoch: 3, tief: 0.4 },
  // Ausgleich über die Woche: eine Trainingsart, die diese Woche noch nicht vorkam, zählt so viel mehr
  wocheFehlt: 1.5,
  // Tendenz je Lebensabschnitt (Konzept Abschnitt 8): Faktor je Trainingsart oder Gruppe
  alter: {
    J: { tempo: 1.2, wort: 1.2, gruppe: 1.1 },
    M1: { ruhe: 1.3, raetsel: 1.2, wort: 1.1 },
    M2: { beweglichkeit: 1.3, wort: 1.1, tempo: 1.1 },
    A: { tempo: 1.2, ruhe: 1.2, geschichte: 1.1 },
  },
  // Tageszeiten: „morgen“ bis 12 Uhr, „abend“ (Der Tag rückwärts) ab 18 Uhr, auch nach einem früheren Tagesschluss nie davor
  morgenBis: 12,
  abendAb: 18,
  // Diese Formen sind nie der erste Vorschlag des Tages (Auftrag 2026-10-04-pause-umbau): erst nach einem gespielten Happen
  nichtAlsErstes: ["atem"],
  // Rückspiegel: eine ruhige Karte höchstens alle so viele Tage, frühestens nach so vielen Tagen Pause
  rueckspiegelTage: 30,
  // Routine erreicht, wenn an so vielen der letzten 7 Tage ein Happen gespielt wurde (Annahme)
  routineTage: 4,
  // Pilz: Blitzdauer in ms je Stufe (Stufe 1 = lang), Runden je Happen
  pilz: { msStufe1: 800, msSchritt: 70, msMin: 150, runden: 3, rundenAbStufe7: 5 },
  // Zeitgefühl: so viele Minuten daneben zählen noch als „getroffen“, je Stufe
  zeitToleranzMin: [30, 20, 10],
  // Spiel-Log: höchstens so viele Einträge am Gerät
  logMax: 3000,
};
