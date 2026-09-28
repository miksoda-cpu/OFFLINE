# OFFLINE – Sicherheit und Bedrohungsmodell

Stand: 28. September 2026 · Status: Entwurf 1, aus der Frage „Wie stellen wir sicher, dass ein Paket die App nicht kaputt macht, und wie groß ist das Manipulationsrisiko?“

## Grundsätze

1. **Drei Schichten.** Der Motor (Rust-Kern) ist das einzige Teil, das schreibt, prüft, lädt und verschlüsselt. Die Hülle (Oberfläche) zeigt an und reicht Befehle weiter. Pakete sind reine Daten.
2. **Pakete enthalten nie Code, der in der App läuft.** Erlaubt: JSON-Texte, ZIM-Archive, PMTiles-Karten, KI-Modelle. Kein Skript, keine Erweiterung, keine Oberfläche.
3. **Ausfall vor Fälschung.** Jede Prüfung ist so gebaut, dass ein Angreifer im schlimmsten Fall etwas verhindern, aber nichts unterschieben kann.
4. **Wir haben keinen Schlüssel zum Tresor.** Was verschlüsselt ist, bleibt es auch für uns.

## Was ein Paket beim Einspielen durchläuft

| Schritt | Prüfung | Bei Fehler |
|---|---|---|
| 1 | Signatur gegen die eingebauten öffentlichen Schlüssel (Zweck, Gültigkeitsfenster) | Abbruch, nichts gelesen |
| 2 | Struktur: Pflichtfelder, Kennung, Kalenderversion, bekannte Paketart, Mindestversion der App | Abbruch |
| 3 | Pfade: nur unter `inhalt/`, kein `..`, kein absoluter Pfad, keine Steuerzeichen | Abbruch |
| 4 | Größe und SHA-256 jeder Datei, bei großen Dateien jedes Teilstücks | Abbruch, Teilstück wird neu geladen |
| 5 | Staging in `<id>-<version>.neu/`, dort erneute Vollprüfung, dann atomarer Tausch; der alte Stand bleibt als `.alt` bis zum Abschluss | halber Zustand wird beim nächsten Start aufgeräumt |
| 6 | Beim Start jedes installierte Paket erneut prüfen | beschädigtes Paket erscheint nicht, die anderen laufen |
| Katalog | Signatur, `erstellt` darf nie kleiner werden (Rollback-Sperre), Ablaufdatum | Katalog abgelehnt, Installiertes läuft weiter |

Was ein sauber signiertes, aber inhaltlich kaputtes Paket bewirkt: Ein unlesbares JSON liefert der Hülle „nichts“, sie zeigt den Ersatztext. Texte werden beim Anzeigen entschärft (kein eingeschmuggeltes HTML). ZIM-Seiten rendert kiwix-serve in einem eigenen Rahmen ohne Zugriff auf die App. Karten liest MapLibre nur als Kacheln.

## Angriffsorte und Gegenmittel

### A. Auf dem Weg zum Gerät (Server, Download, USB-Stick)
- **Abgedeckt:** Signatur, Prüfsummen, Rollback-Sperre, Bereichs-Downloads mit Prüfung je Teil. Ein gehackter Speicher kann Pakete löschen oder Alte hinlegen, aber keine gefälschten einschleusen.
- **Offen:** Speicherplatzprüfung vor dem Download (ein 42-GB-Paket darf die Platte nicht vollschreiben).

### B. Der Signaturschlüssel
- **Heute:** Erprobungsschlüssel `offline-ci` liegt als GitHub-Secret; wer das GitHub-Konto übernimmt, kann echte Pakete signieren.
- **Vor dem Start (Checkliste in HETZNER-SETUP.md):** Produktionsschlüssel offline erzeugen, zwei Kopien an zwei Orten; Redaktionspakete auf einem Rechner ohne Dauer-Netz signieren; Erprobungsschlüssel mit `gueltig_bis` beenden.
- **Geplant:** getrennter Schlüssel für den Katalog, damit Paket und Katalog von zwei Stellen kommen müssen. Rückzugsliste im Katalog für kompromittierte Schlüssel (Format 2). Updater-Schlüssel (`TAURI_SIGNING_PRIVATE_KEY`) ebenso offline sichern, ohne ihn gibt es keine App-Updates mehr.

### C. Werkstatt (Code, Build, Installer)
- **Abgedeckt:** öffentlicher Quelltext (Apache 2.0), Builds nur auf Knopfdruck, Tests im Kern und im Werkzeug bei jedem Lauf, App-Updates signiert mit eigenem Schlüssel.
- **Offen:** Code-Signing der Installer (Apple Developer ID + Notarisierung, Windows-Zertifikat), sonst kann ein manipuliertes DMG unter unserem Namen verteilt werden. Reproduzierbare Builds, damit Dritte den Installer aus dem Quelltext nachrechnen können.

### D. Der Inhalt (das größte Risiko)
Keine Kryptografie schützt vor einer falschen Notrufnummer, die sauber signiert durch die Redaktion ging. Gegenmittel sind redaktionell:
- Quellenpflicht: jede Angabe mit Verweis auf die amtliche Stelle (`quellen` im Manifest).
- Vier-Augen-Prinzip vor jeder Signatur eines Redaktionspakets.
- Herausgeber, Datum, Lizenz und Prüfstatus sichtbar auf jeder Paketkarte.
- Öffentliches Verzeichnis aller je signierten Pakete mit Prüfsummen (Transparenz), damit nichts still ausgetauscht werden kann.
- Marktplatz (Ebene 3) nur mit Freigabe vor Veröffentlichung; Herausgeber dürfen nur ihre eigenen Kennungen liefern.

### E. Das Gerät selbst
- Tresor: Argon2id, XChaCha20-Poly1305, Schlüssel nur im Arbeitsspeicher, Sperre nach Zeit und beim Minimieren, nichts Entschlüsseltes auf der Platte. Details: TRESOR.md.
- **Nicht in unserer Hand:** Schadsoftware auf dem Gerät, jemand, der beim Entsperren zusieht, verlorenes Passwort samt Code.

## Nächste Schritte am Kern
- [ ] Speicherplatzprüfung vor dem Download
- [ ] Getrennter Katalogschlüssel (Zweck `katalog`), Paketschlüssel nur für Pakete
- [ ] Öffentliches Paketverzeichnis (Liste aller signierten Manifeste mit Hash, auf der Website)
- [ ] Ein Paket, das beim Start dreimal als beschädigt erkannt wird, wird in `.kaputt/` verschoben statt still ausgeblendet
- [ ] Anleitung „Offline signieren mit dem Produktionsschlüssel“ für die Redaktion
