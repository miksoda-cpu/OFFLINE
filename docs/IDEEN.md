# OFFLINE – Ideen: Was ohne Internet fehlt und was die App mitbringen könnte

*Stand 24.09.2026. Eine Sammlung zum Weiterdenken, noch ohne Entscheidung. Die Spalte „Lizenz“ ist eine erste Einordnung, keine Rechtsauskunft.*

## Was wegfällt, wenn das Internet zu ist

- **Fotos:** Bei iCloud-Fotos mit „Speicher optimieren“ und bei Google Fotos liegen am Gerät oft nur Vorschaubilder. Ältere Fotos fehlen dann teils ganz.
- **Dateien in der Cloud:** OneDrive, Google Drive und Dropbox mit „bei Bedarf laden“
- **Bücher und Medien:** Bücher in der Kindle- oder tolino-Cloud, Streaming, Podcasts, Hörbücher bei Audible
- **Unterwegs:** Navigation ohne vorher geladene Karten, digitale Tickets, Fahrpläne
- **Kommunikation:** Mail, Messenger, Wetter, Nachrichten, Übersetzer, KI-Assistenten
- **Geld und Zugänge:** Online-Banking, oft auch das Zahlen mit Karte, Passwortmanager in der Cloud, SMS-TAN, wenn auch das Handynetz ausfällt
- **Zu Hause:** Smart-Home-Apps und Spiele mit Online-Zwang

## Was OFFLINE mitbringen könnte

| Idee | Früheres Gegenstück | Quelle / Lizenz | Gratis oder Pro |
|---|---|---|---|
| **Tresor und Notfallmappe** | Mappe in der Lade | eigene Entwicklung | Gratis (siehe Spezifikation) |
| **Fotoimport:** Originale lokal ablegen, Familienalbum | Fotoalbum | eigene Dateien | Gratis |
| Solitär, FreeCell, Minesweeper, Sudoku, 2048 | Windows 95, Rätselheft | eigene Umsetzung | Gratis |
| Schach gegen den Computer | Schachcomputer | Stockfish, GPL (als eigenes Programm mitliefern, Quelltext verlinken) | Gratis |
| Österreichische Kartenspiele: Schnapsen, Watten, Tarock (erst die Regeln, später spielbar) | Wirtshausrunde | eigene Texte | Regeln gratis, Spiel Pro |
| Wörterbuch | Duden | Wiktionary, CC BY-SA | Gratis |
| Übersetzung ohne Netz | Sprachführer | Bergamot (Mozilla), Argos Translate, offene Modelle | Pro, wegen Speicherbedarf |
| Gemeinfreie Hörbücher | Hörspielkassetten | LibriVox (Lage in Österreich klären, Anwaltsfrage 5) | Gratis |
| Liederbuch mit Texten und Akkorden | Liederbuch | Volkslieder sind gemeinfrei, bei Bearbeitungen und Notensatz aufpassen | Gratis |
| Sonnen- und Mondzeiten, einfache Sternkarte | Kalender, Sternkarte | Berechnung, offene Sternkataloge | Gratis |
| Taschenrechner, Einheiten, Kochmaße | Tabellenbuch | eigene Umsetzung | Gratis |
| Radioseite: ORF-Frequenzen je Region, Hinweis auf den Krisenkanal | Batterieradio | eigene Recherche | Gratis |
| **Lokale KI**, die aus der eigenen Wikipedia und den Handbüchern antwortet | Nachbar, der alles weiß | offene Modelle (Lizenzen je Modell prüfen) | Pro |

## Handy-Version (Notiz)

- Im Blackout ist das Handy das wichtigere Gerät, weil es mit einer Powerbank lange läuft.
- OFFLINE ist mit Tauri 2 gebaut (geprüft 24.09.2026). Damit ließe sich derselbe Rust-Kern und dieselbe Oberfläche für iOS und Android bauen; kiwix-serve und llama.cpp als mitgelieferte Programme gehen dort allerdings nicht, dafür bräuchte es die Kiwix-Bibliothek direkt im Kern.
- Eine PWA eignet sich nicht für große Pakete, weil iOS den Speicher begrenzt und Daten löschen kann.
- Ein Handy-Paket statt des vollen Umfangs: Tresor, Erste Hilfe und Vorsorge, Karte der eigenen Region, Wikipedia ohne Bilder, ausgewählte Bücher.
- Abgleich zwischen Laptop und Handy nur lokal über WLAN oder Kabel, damit wir keine Plattform werden (Anwaltsfrage 2).
- Kiwix zeigt, dass Wikipedia ohne Netz auf Android und iOS funktioniert.

## Einordnung (24.09.2026, nach Übernahme ins Repository)

Was davon wohin gehört. „Paket“ heißt: Inhalt kommt signiert über den Katalog, die App braucht dafür keine neue Funktion, nur eine Anzeige. „App“ heißt: neuer Code in Oberfläche oder Kern.

| Idee | Art | Aufwand | Wann |
|---|---|---|---|
| Tresor und Notfallmappe | App (Kern + Oberfläche), siehe [TRESOR.md](TRESOR.md) | groß | Phase 4b |
| Radioseite, Sonnen- und Mondzeiten, Rechner und Einheiten, Kochmaße | App (nur Oberfläche, reine Berechnung oder Text) | klein | **erledigt 25.09.2026**: Seite „Werkzeuge“ (Radio mit merkbaren Frequenzen je Bundesland, Sonne/Mond nach NOAA-Verfahren für die Landeshauptstadt, Einheiten, Kochmaße, Vorratsrechner) |
| Kartenspiel-Regeln, Liederbuch, Wörterbuch (Wiktionary-ZIM) | Paket | klein | sobald der Katalog steht, Texte müssen geschrieben werden |
| Hörbücher (LibriVox) | Paket, Abspielen im Fenster | klein, Rechtsfrage offen | nach Anwaltsantwort |
| Fotoimport und Familienalbum | App (Kern kopiert Originale in den Datenordner, Oberfläche zeigt Raster) | mittel | Phase 5 |
| Solitär, FreeCell, Minesweeper, Sudoku, 2048 | App (Oberfläche) oder Paket mit eingebetteten HTML-Spielen | mittel | Phase 5, gut als Paket „Spiele“ |
| Schach (Stockfish) | Sidecar wie kiwix-serve, GPL getrennt ausliefern | mittel | Phase 5 |
| Übersetzung ohne Netz | Sidecar (Bergamot) + Modellpaket | groß | nach der KI |
| Lokale KI | Sidecar llama.cpp + Modellpaket, im Fahrplan bereits Phase 4 | groß | Phase 4c |
| Handy-Version | eigener Build (Tauri Mobile), abgespecktes Paketset | sehr groß | nach Marktstart |

Grundsatz für alles Inhaltliche: Lieber ein Paket mehr als eine Funktion mehr. Pakete kann die Redaktion ohne neuen App-Build ausliefern und aktualisieren.
