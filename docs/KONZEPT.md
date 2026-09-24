# OFFLINE – Konzept

> Wissen, das nicht ausfällt. Für Österreich, auf Deutsch, auf jedem PC und Mac.

Stand: 24. September 2026 · Status: Konzept + Web-Prototyp

---

## 1. Worum es geht

OFFLINE ist ein Offline-Wissens- und Werkzeugpaket für Österreich. Es läuft ohne Internet auf gewöhnlichen Windows-, macOS- und Linux-Rechnern und bringt mit:

- **Bibliothek** – deutschsprachige Wikipedia, Wikivoyage, Wiktionary, Gesundheits- und Erste-Hilfe-Wissen (Kiwix/ZIM)
- **Österreich-Paket** – Notrufe, Sirenensignale, Blackout-Vorsorge, Behördenwege, Rechtsgrundlagen (RIS), regional nach Bundesland
- **Karten** – Österreich offline (basemap.at / OpenStreetMap)
- **KI-Assistent** – lokales Sprachmodell, das auf die installierten Inhalte zugreift (RAG)
- **Kurse** – Offline-Kurse der digitalworld Academy
- **Notizen** – lokal, Markdown

Vorbild ist [Project N.O.M.A.D.](https://github.com/Crosstalk-Solutions/project-nomad) von Crosstalk Solutions (Apache 2.0). OFFLINE übernimmt die Idee und einzelne Bausteine, ist aber **eigenständig**, denn es braucht eine andere Architektur (siehe 3.).

**Zielgruppen:** Privatpersonen und Vorsorgende (B2C) sowie Gemeinden, Schulen, Zivilschutz, Feuerwehren und Betriebe (B2B).

---

## 2. Die zwei Kernfeatures

### 2.1 Offline-Installer für jeden PC und Mac

| Anforderung | Lösung |
|---|---|
| Kein Terminal, kein Docker | Native Desktop-App (Tauri), Installation per Doppelklick |
| Installation ohne Internet | Installer + Inhaltspakete auf USB-Stick/SSD oder als Download-Bündel |
| Windows, macOS, Linux | `.msi`/`.exe`, `.dmg` (Intel + Apple Silicon), `.AppImage`/`.deb` |
| Große Datenmengen | Stufen: **Basis** (~2 GB), **Standard** (~15 GB), **Voll** (~60 GB+) |
| Speicherort wählbar | Inhalte können auf externer Festplatte liegen |

Ablauf: Installer starten → Speicherort wählen → Pakete vom Stick oder aus einem Ordner importieren → fertig. Alles läuft danach im eingebauten Fenster, zusätzlich unter `http://localhost:8080` für andere Geräte im Heimnetz (optional, standardmäßig aus).

### 2.2 Update-Abo

- **Intervall:** täglich, wöchentlich, monatlich – oder manuell
- **Bedingungen:** nur wenn online, optional nur im WLAN/ohne getaktete Verbindung, optional Zeitfenster (z. B. 02:00–05:00)
- **Delta-Updates** für eigene Inhalte (Österreich-Paket, Kurse): Es wird nur übertragen, was sich geändert hat.
- **Voll-Updates** für ZIM-Pakete (Kiwix veröffentlicht etwa monatlich komplette Dateien) – im Hintergrund, fortsetzbar, mit Prüfsumme; alte Version bleibt bis zum erfolgreichen Tausch erhalten.
- **Signiert:** Jedes Paket und der Katalog sind mit Ed25519 signiert; die App prüft vor dem Einspielen. Format und Ablauf: [PAKETFORMAT.md](PAKETFORMAT.md).
- **Änderungsprotokoll** in Klartext: „Was ist neu?“

Sinnvoller Rhythmus je Inhalt:

| Inhalt | Rhythmus |
|---|---|
| Österreich-Paket (Warnungen, Kontakte, Checklisten) | täglich/wöchentlich |
| Rechtsänderungen (RIS-Auszug) | wöchentlich |
| Karten | monatlich/quartalsweise |
| Wikipedia & Co. | monatlich |
| Software selbst | Patch-Updates automatisch, große Versionen nur manuell |

---

## 3. Architektur

NOMAD orchestriert Docker-Container auf Debian. Das ist für Laien auf Windows/Mac nicht zumutbar. OFFLINE bündelt deshalb alles in **einer Desktop-App**:

```
┌──────────────────────────────────────────────────────────┐
│  OFFLINE Desktop (Tauri: Rust-Kern + Web-Oberfläche)     │
│                                                          │
│  Oberfläche (HTML/JS)  ←→  Rust-Kern                     │
│                            ├─ Paketverwaltung (Import,   │
│                            │   Prüfsummen, Signaturen)   │
│                            ├─ Update-Dienst (Abo)        │
│                            ├─ lokaler Webserver :8080    │
│                            └─ Prozesse (Sidecars):       │
│                                ├─ kiwix-serve  (ZIM)     │
│                                ├─ llama.cpp    (KI)      │
│                                └─ Kartenserver (PMTiles) │
└──────────────────────────────────────────────────────────┘
             ▲ nur wenn online + Abo aktiv
             │
┌──────────────────────────────────────────────────────────┐
│  Update-Server (Vercel + Objektspeicher)                 │
│  Paketkatalog (JSON, signiert) · Deltas · Lizenzprüfung  │
└──────────────────────────────────────────────────────────┘
```

- **Tauri statt Electron:** kleiner Installer (~10 MB statt ~100 MB), weniger RAM, Rust für sichere Dateioperationen.
- **Kiwix-serve, llama.cpp** gibt es als eigenständige Programme für alle drei Systeme – kein Docker nötig.
- **Karten** als PMTiles-Datei (eine Datei, direkt lesbar).
- **Web-Prototyp** (dieses Repo, `web/`): dieselbe Oberfläche als installierbare Web-App (PWA), die auch offline im Browser funktioniert. Er dient als Vorschau auf Vercel und wird später die Oberfläche der Desktop-App.

---

## 4. Inhalte & Lizenzen

| Quelle | Inhalt | Lizenz | Status |
|---|---|---|---|
| Wikipedia (de), Wikivoyage, Wiktionary | Nachschlagewerk | CC BY-SA 4.0 | ✅ nutzbar, Namensnennung |
| Kiwix ZIM-Dateien | Verpackung obiger Inhalte | wie Quelle | ✅ |
| basemap.at | Karte Österreich | CC BY 4.0 | ✅ Namensnennung „basemap.at“ |
| OpenStreetMap | Karte, Adressen | ODbL | ✅ Namensnennung, Share-Alike für DB |
| RIS (ris.bka.gv.at) | Bundesrecht, Landesrecht | Open Government Data | ✅ prüfen: Aktualität, Haftungsausschluss |
| data.gv.at | z. B. Apotheken, Krankenhäuser, Schutzräume | meist CC BY 4.0 | 🔶 je Datensatz prüfen |
| Zivilschutzverband, oesterreich.gv.at, gesundheit.gv.at | Ratgeber, Behördenwege | urheberrechtlich geschützt | ❌ nur mit Freigabe → Kooperation anfragen |
| ORF, Zeitungen | Nachrichten | geschützt | ❌ |
| Eigene Texte (The Digioneer, digitalworld Academy) | Vorsorge, Kurse | eigene | ✅ |

**Grundsatz:** Was wir nicht lizenzieren können, schreiben wir selbst – mit Quellenverweis auf die offiziellen Stellen.

---

## 5. Geschäftsmodell: Frei + Pro

Die Software ist frei (Apache 2.0, wie das Vorbild). Bezahlt wird, was wir **selbst leisten**: Kuratierung, Pflege, Service, Hardware.

| | **Frei** | **Pro** (Abo) | **Gemeinde / Schule / Betrieb** |
|---|---|---|---|
| App + Installer | ✅ | ✅ | ✅ |
| Basis-Inhalte (Wikipedia, Karte AT) | ✅ | ✅ | ✅ |
| Zugang | Anmeldung mit Name + E-Mail | Ghost-Abo | Vertrag |
| Updates | manuell | automatisch, Deltas | automatisch, zentral verwaltet |
| Österreich-Paket | Grundversion | laufend gepflegt, nach Bundesland | + eigene Gemeindeinhalte |
| Blackout-/Krisenvorsorge-Paket | Checkliste | vollständig, mit Plänen | + Einsatzpläne, Aushänge |
| KI-Modelle für Deutsch | Basis-Modell | optimierte Modelle | ✅ |
| Kurse digitalworld Academy | Leseprobe | ✅ | ✅ + Mehrplatz |
| Support | Community | E-Mail | Ansprechperson, Schulung |
| Preisidee | 0 € | 4–6 €/Monat oder 39–49 €/Jahr | ab ~290 €/Jahr je Standort |

**Zusatz:** vorbespielter USB-Stick/SSD („OFFLINE-Stick“) und Mini-PC als Komplettgerät – Einmalkauf, inklusive 12 Monate Pro.

**Update-Server und Ablage großer Pakete (Entscheidung offen, Stand 24.09.2026):** Vercel liefert Katalog und kleine Textpakete. Für ZIM- und Kartenpakete (0,9–42 GB) braucht es einen Objektspeicher mit Bereichsanfragen und günstigem Datenverkehr. Vorschlag: **Cloudflare R2** (kein Entgelt für ausgehenden Verkehr, 10 GB Speicher frei, danach ca. 0,015 $/GB/Monat) oder **Hetzner Object Storage** (EU, ca. 5 €/Monat für 1 TB Speicher und 1 TB Verkehr inklusive). Die App braucht dafür keine Änderung, nur eine andere Katalog-Basis-URL. Die Pakete selbst werden in GitHub Actions gebaut (Download von kiwix.org bzw. Protomaps, Werkzeug, Signatur) und hochgeladen.

**Anmeldung und Abo über Ghost (The Digioneer):**
- Das Gratis-Paket gibt es gegen Anmeldung mit Name und E-Mail (Double-Opt-In). Die bestätigte Adresse ist der Filter für ernsthaftes Interesse, der Newsletter ist optional und braucht ein eigenes Häkchen.
- Anmeldungen werden Mitglieder von The Digioneer mit Label `offline`. Der Newsletter „OFFLINE“ läuft über Ghost.
- OFFLINE Pro wird eine bezahlte Stufe in Ghost (Stripe). Wer Pro kauft, wird damit auch Leser:in von The Digioneer.
- Details: [GHOST-SETUP.md](GHOST-SETUP.md)

Hinweise:
- Name „NOMAD“ und dessen Branding werden nicht verwendet; Apache-Lizenz- und NOTICE-Hinweise bleiben erhalten.
- Zahlungsabwicklung und Lizenzschlüssel: später (z. B. Stripe/Paddle als Merchant of Record wegen EU-USt).
- Datenschutz: keine Telemetrie. Die Lizenzprüfung überträgt nur Lizenzschlüssel + Paketversion.

---

## 6. Fahrplan

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **0 – erledigt** | Konzept, Web-Prototyp (PWA), Vercel-Vorschau | Oberfläche zum Ansehen |
| **1 – erledigt (24.09.2026)** | Paketformat mit Signatur ([PAKETFORMAT.md](PAKETFORMAT.md)), Werkzeug, Österreich-Paket v1, signierter Katalog; der Web-Prototyp installiert und aktualisiert Pakete nach genau diesem Verfahren | erstes echtes Paket |
| **2 – in Arbeit (24.09.2026)** | Rust-Kern (`kern/`, gleiche Tests wie das Werkzeug) und Tauri-Hülle (`app/`) mit Import vom USB-Stick; Installer für Windows, macOS, Linux über GitHub Actions ([DESKTOP.md](DESKTOP.md)). Offen: kiwix-serve + Kartendatei als mitgelieferte Programme | Installer Win/Mac/Linux (unsigniert) |
| **3 – erledigt (24.09.2026)** | Update-Dienst im Rust-Kern: Katalog, fortsetzbare Downloads in Teilen, Delta gegen installierte Version, Hintergrund-Abo mit Zeitfenster; Speicherort auf externer Platte. Update-Server = statische Dateien auf Vercel | Abo funktioniert technisch |
| **4 – in Arbeit** | Inhalte: kiwix-serve als mitgeliefertes Programm, Offline-Karte (PMTiles), lokaler Dateiserver – fertig. Offen: erste echte Pakete (Wikivoyage, Karte Österreich) und deren Ablageort; KI-Assistent (llama.cpp) folgt | Wikipedia und Karte offline |
| **5** | Pro: Lizenzschlüssel, Zahlung, Code-Signing (Apple/Windows), Gemeinde-Version | Marktstart |

Offene Punkte:
- **Ghost-Anmeldung (zurückgestellt am 24.09.2026):** Formular und Funktion `/api/anmelden` sind fertig, aber abgeschaltet. Zum Einschalten: Ghost gemäß [GHOST-SETUP.md](GHOST-SETUP.md) einrichten, in Vercel `ANMELDUNG_AKTIV=1` setzen, in `web/index.html` das `hidden` vom Formular `#anmeldung` entfernen und den Hinweis `#anmeldung-bald` löschen. Danach: Anschrift in `datenschutz.html` ergänzen, einmal selbst testen. Später: OFFLINE Pro als bezahlte Ghost-Stufe.
- Code-Signing-Zertifikate (Apple Developer ~99 $/Jahr, Windows EV/OV-Zertifikat) – nötig, sonst warnen Windows und macOS beim Installieren.
- Kooperationsanfragen: Zivilschutzverband, Landeswarnzentralen, Gemeindebund.
- Rechtliche Prüfung der Vorsorge- und Gesundheitsinhalte (Haftungsausschluss).
