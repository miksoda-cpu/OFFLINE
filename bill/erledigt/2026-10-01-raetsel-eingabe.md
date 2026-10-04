# Nachtrag: Antwortfeld beim Tagesrätsel

**Von:** Bill · **Datum:** 2026-10-01 · **Wunsch von Mik** · **Ins laufende Update** (mit Tipps und Jänner), wenn es den Zeitplan nicht sprengt, sonst ins nächste.

## Ziel
Beim Tagesrätsel kann man eine Antwort eintippen und erfährt, ob sie stimmt.

## Umfang
1. **Eingabefeld** auf der Rätselkarte mit Knopf „Prüfen“. Hinweis und Lösung bleiben wie bisher.
2. **Prüfung lokal, ohne Netz.** Großschreibung, Leerzeichen, Satzzeichen und Umlautschreibweisen (ae/ä, ss/ß) werden ignoriert. Zahlen als Ziffer oder Wort („3“, „drei“) gelten beide.
3. **Mehrere richtige Antworten:** Jedes Rätsel bekommt im Paket ein Feld `antworten` (Liste der gültigen Varianten). Für die bestehenden Rätsel (Oktober bis Jänner) die Liste ergänzen. Rätsel, die keine eindeutige Kurzantwort haben (Erklärrätsel), bekommen kein Eingabefeld und bleiben wie jetzt.
4. **Rückmeldung freundlich:** richtig: kurz bestätigen und die Erklärung zeigen, Karte gilt als erledigt. Falsch: „Noch nicht. Magst du einen Hinweis?“ Keine Zählung der Versuche, keine Punkte, keine Serien (Regel aus dem Gesamtkonzept: keine Belohnungsschleifen).
5. **Barrierefreiheit und Handy:** Feld mit Beschriftung, Enter prüft, 360 Pixel, 44-Pixel-Knöpfe.
6. Prüfprogramm des Kits: `antworten` ist optional, aber wenn vorhanden, eine nicht leere Liste von Texten.
7. „Was ist neu“ bekommt den Punkt.

## Prüfung
Tests für die Vergleichsregeln (Groß/klein, Ziffer/Wort, Umlaute, falsche Antwort). Kurzer Durchlauf in der Test-App.

## Regeln
Eigener Branch, veröffentlichen erst bei allen Tests und Windows-Probe grün. Freigabe erteilt.
