# Auftrag: Tagesseite mit Vorratskammer

**Von:** Bill · **Datum:** 2026-09-30 · **Dringlichkeit:** normal (Miks Priorität, Lagebild)

## Ziel
Die App hat eine Tagesseite als Startbildschirm: ein endlicher Tag mit drei bis vier Karten, der mit „Das war dein Tag. Bis morgen.“ endet. Die Inhalte kommen aus einer Vorratskammer, die 30 Tage im Voraus lädt und jeden Tag einen freischaltet. Fällt das Netz aus, läuft der Rhythmus weiter. Fertig, wenn die Tagesseite in der Test-App mit echten Inhalten für mindestens 30 Tage läuft, auch ohne Netz, und alle Tests grün sind.

## Hintergrund
Gesamtkonzept Fassung 7 im Ordner OFFLINE - Home und im Projekt: Kapitel 1 (das leise Versprechen „Hier ist Schluss. Du bist fertig für heute.“), Kapitel 2 (Bild der App), Kapitel 6 (Einstellungen: Tagesplan, Vorratstiefe 7/30/90), Kapitel 6a (Der Tag in der App), Kapitel 8 Stufe 1 (Vorratskammer, Tagesseite, Tagesrätsel, Roman der Woche, Lektion des Tages).

## Umfang
1. **Vorratskammer (Kern):** ein Paketformat für Tagesinhalte. Jeder Eintrag hat ein Datum oder eine Tagnummer. Die App lädt im Voraus nach der Vorratstiefe (Standard 30 Tage, einstellbar 7/30/90) und schaltet lokal jeden Tag einen frei. Kein Server außer dem bestehenden Katalog, alles signiert wie jedes Paket, nur Daten, kein Code. Ohne Netz: Der Rhythmus läuft weiter, bis der Vorrat leer ist. Die Tagesseite zeigt „Vorrat: noch 27 Tage“. Vorschlag zum Format in `docs/PAKETFORMAT.md` und `docs/PAKET-KIT.md`, Prüfprogramm ergänzen.
2. **Tagesseite:** Sie wird zum Startbildschirm. Oben stehen die Bereit-Zahl und die Lumi (oder die Textkarte, je nach Stufe), darunter die Karten des Tages, unten der Vorrat. Keine Feeds, kein endloses Scrollen. Wenn alle Karten des Tages erledigt oder weggelegt sind, kommt der Schluss: „Das war dein Tag. Bis morgen.“ Der Satz ist fest und in allen Lagen gleich (Kapitel 6a).
3. **Drei Karten zum Start:**
   - **Tagesrätsel:** eigene Rätsel. Code liefert einen Erstbestand von mindestens 60, einfach bis mittel, ohne fremde Rätseltexte zu kopieren.
   - **Roman der Woche:** Jeden Montag beginnt ein gemeinfreier deutschsprachiger Roman, ein Kapitel pro Tag. Nur Texte, deren Autor vor 1956 gestorben ist, in einer Ausgabe ohne eigene Rechte, am besten Wikisource oder eigene Abschrift aus einer gemeinfreien Ausgabe, mit Quellenangabe. Erstbestand: vier Wochen. Die Auswahl schlägt Code in der Rückmeldung vor, mit Autor, Todesjahr und Quelle je Titel. Kein Titel, dessen Ausgabe unklar ist (Anwaltsfrage 5).
   - **Die Lumi:** nur, wenn eingeschaltet. Ist sie aus, erscheint die Textkarte des Tages.
   Die Lektion des Tages kommt später, als Karte vorgesehen, aber noch ohne Inhalte.
4. **Tagesplan in den Einstellungen:** welche Karten, wann der Schluss kommt (Standard: wenn alles erledigt ist, spätestens 22 Uhr). Die Regeln der gelernten Schicht gelten: sichtbar, begründet, rückgängig.
5. **Blackout:** Die Tagesseite bleibt im Blackout gleich. Sparmodus zeigt die Karten ohne Bilder.
6. **Handy zuerst:** bedienbar bei 360 Pixel, Knöpfe mindestens 44 Pixel. Die Web-Version bekommt die Tagesseite ebenfalls.

**Nicht dabei:** Mesh-Puls, Lektion mit Inhalten, Kinder-Modus, KI.

## Prüfung
Test-App: frische Installation, dann 30 Tage vorstellen (Freischaltung, Vorratsanzeige, Schluss), Netz aus (Rhythmus läuft weiter), Vorrat leer (freundlicher Hinweis, kein Fehler). Tests für Freischaltung, Datumswechsel, Zeitzone und Uhrumstellung, leeren Vorrat. Windows-Probe wie immer.

## Regeln
Eigener Branch, zusammenführen und veröffentlichen erst, wenn alle Tests auf drei Systemen und die Windows-Probe grün sind. Freigabe zum Veröffentlichen: ja, unter dieser Bedingung, wie beim Release 0.2.0. Die Inhaltspakete dürfen mit hoch.

## Offene Fragen
Die Romanauswahl darfst du vorschlagen und bauen. Wenn bei einem Titel die Rechte der Ausgabe unklar sind, nimm ihn nicht und nenne ihn in der Rückmeldung.
