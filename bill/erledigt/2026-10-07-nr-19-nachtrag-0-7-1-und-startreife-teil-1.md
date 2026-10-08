# Auftrag Nr. 19 – Nachtrag zu 0.7.1 und Startreife, Teil 1 (ohne Konten)

**Von:** Bill · **Datum:** 07.10.2026 · **Version:** 0.7.2 · Abnahme 0.7.1: erteilt (Web geprüft: Vorrat 117 Tage, Seitenleiste, Bereit-Karte mit einer Zahl).

## A. Nachtrag zu 0.7.1
1. **Vorschau in der Bibliothek:** keine Slideshow in der Box. Die Box zeigt ein Titelbild (erste Vorschau-Seite), den Namen, einen Satz und „Vorschau ansehen“. Der Klick öffnet ein großes Fenster über der Seite (am Handy ganzer Bildschirm): je Seite oben das Bild, darunter der Text in normaler Lesegröße, Pfeile und Wischen, „1 von 4“, Schließen mit ×, Esc und Tippen daneben, „laden“ unten im Fenster. Gilt für alle Pakete und Module mit Vorschau. Zarter Stil, ein Hauptknopf.
2. **„Künstliche Intelligenz Bilder damit erzeugt“** bei „Was die Lumis denken“ (Web 0.7.1, Bibliothek): Die Abkürzungs-Ersetzung zerlegt Wortverbindungen. Richtig: „Bilder mit künstlicher Intelligenz (KI) erzeugt, Herkunft im Paket“. Die Ersetzung soll Bindestrich-Wörter („KI-Bilder“) nicht anfassen; ein Test dazu.
3. **Fünf Fehler-Geschichten** ohne „Susi“: `pause-inhalte/2026-10-07-nachtrag-fuenf-geschichten.json`. `fehler` zählt ab 1 wie in der Beilage. Alle fünf sind `nur_mit_lumi`. Damit 60 Geschichten.
4. **Lumi aus = kein Lumisch:** wie gebaut bestätigt. Zusatz: Wer das Paket `lumisch` in der Bibliothek selbst lädt, bekommt Lumisch in Pause auch ohne Figur. Das Laden ist die bewusste Entscheidung.
5. **„Übersicht“** heißt ab jetzt **„Bereit“** (Seitenleiste, Überschrift, Links). Inhalt bleibt.
6. **Web-Version, Pause:** Solange die Rätsel fehlen, steht im Browser: „Die Rätsel zum Knobeln gibt es in der Desktop-App.“
7. **„Heute ruhig“** aus der Stufen-Datei: noch nicht bauen.

## B. Startreife, Teil 1 (was ohne Konten geht)
1. **Beschreibung ehrlich** (`app/src-tauri/tauri.conf.json`, `longDescription`): „OFFLINE bringt Wikipedia, Wikivoyage, Karten und Notfallwissen für Österreich auf PC und Mac, auch ohne Internet. Dazu kommen jeden Tag ein Rätsel und ein Stück vom Roman der Woche. Die Inhalte kommen als signierte Pakete per Update oder vom USB-Stick.“ Dieselbe Prüfung für Webseite und Katalogtexte: nichts versprechen, was es nicht gibt.
2. **Hilfe und Datenschutz** (`web/hilfe.js`, `web/datenschutz.html`): den Lizenzschlüssel streichen. Hilfe: „Die Pakete kommen von unserem Server. Die App sendet nur die Versionen deiner Pakete, keine Inhalte und keine Notizen.“ Datenschutz entsprechend. Wenn es Pro gibt, kommt der Satz wieder.
3. **Kamera-Hinweis** aus `Info.plist` entfernen, Mikrofon bleibt.
4. **Store-Build:** Schalter beim Bauen ohne Updater und ohne internen Kanal. Der Direkt-Download bleibt wie er ist.
5. **Sperre nach Alter** für `alter_ab`: einmalige Frage „Bist du mindestens 18?“ beim ersten Laden eines Pakets ab 18, Antwort wird gemerkt, im Kinder-Modus später fest gesperrt. Kein Ausweis, keine Daten.
6. **Entwürfe** für die Datenschutz-Angaben bei Apple und Google nach `bill/beilagen/`. Hetzner-Protokolle des Buckets prüfen und in den Entwurf schreiben.
7. **Gigabyte-Test am Mac.**
8. **App-Symbol** in 1024 px vorbereiten.

## Nicht in diesem Auftrag
Signaturen, Store-Einträge, iOS und Android, Kiwix im Kern. Das kommt nach Miks Konten.

## Release
Wie immer: alle Tests, Windows-Probe, Rundgang nach `rundgang/0.7.2/`, dazu die neue Vorschau hell, dunkel und in Handy-Breite.
