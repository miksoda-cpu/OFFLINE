# Hetzner Object Storage als Update-Server – Einrichtung

Stand: 24. September 2026 · Entscheidung: Hetzner (Ghost liegt bereits dort)

Der Update-Server ist nur ein Speicher für statische Dateien: Paketordner unter `pakete/` und der signierte Katalog unter `katalog/`. Hetzner Object Storage ist S3-kompatibel, unterstützt Bereichsanfragen (für fortsetzbare Downloads) und liefert die Dateien öffentlich aus.

```
https://<bucket>.<region>.your-objectstorage.com/
├── katalog/katalog.json          signiert, von der App bei jeder Prüfung geladen
├── katalog/katalog.sig
└── pakete/
    ├── at-basis-2026.09.24/      paket.json, paket.sig, inhalt/…
    └── wikivoyage-de-2026.09.24/ paket.json, paket.sig, inhalt/wikivoyage_de_all_maxi_….zim
```

## Schritt 1: Bucket anlegen (Hetzner Cloud Console)

1. https://console.hetzner.cloud → dein Projekt → links **Object Storage** → **Bucket erstellen**.
2. Region: **Falkenstein (fsn1)** oder Nürnberg (nbg1). Name: **`offline-pakete`** (Bucket-Namen sind weltweit eindeutig – falls vergeben, z. B. `offline-pakete-digioneer`).
3. Sichtbarkeit: **öffentlich** (public). Die Dateien sollen ohne Anmeldung ladbar sein; Schutz liefert die Signatur, nicht der Zugriff.
4. Unter **Object Storage → S3-Zugangsdaten** (S3 credentials) ein Schlüsselpaar erzeugen: **Access Key** und **Secret Key**. Den Secret Key sofort kopieren – er wird nur einmal angezeigt.

Kosten (Stand 2026): ca. 5 €/Monat für 1 TB Speicher und 1 TB Datenverkehr inklusive.

## Schritt 2: Vier Secrets im Repository eintragen

GitHub → Repository **OFFLINE** → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Wert |
|---|---|
| `HETZNER_S3_ENDPOINT` | `https://fsn1.your-objectstorage.com` (bzw. `nbg1`) |
| `HETZNER_S3_BUCKET` | `offline-pakete` (dein Bucket-Name) |
| `HETZNER_S3_ACCESS_KEY` | Access Key aus Schritt 1 |
| `HETZNER_S3_SECRET_KEY` | Secret Key aus Schritt 1 |

## Schritt 3: Signaturschlüssel für den Build

Die Pakete werden in GitHub Actions gebaut und dort signiert. Dafür braucht der Workflow den privaten Schlüssel `offline-ci` (öffentliches Gegenstück `1504cefc5d5d7e11` steht in `schluessel/oeffentlich.json` und ist in der App eingebettet).

- Fünftes Secret: **`OFFLINE_SIGNIERSCHLUESSEL`** – der komplette Inhalt der Datei `OFFLINE-SIGNIERSCHLUESSEL-CI.key` (beginnt mit `-----BEGIN PRIVATE KEY-----`). Die Datei liegt im Scratchpad dieser Sitzung; nach dem Eintragen dort löschen.
- Das ist ein **Erprobungsschlüssel**. Für den öffentlichen Start wird auf deinem Rechner ohne Netz ein Produktionsschlüssel erzeugt (Spezifikation, Abschnitt „Schlüssel“); dann werden alle Pakete neu signiert und der Erprobungsschlüssel bekommt ein `gueltig_bis`.

## Schritt 4: Erstes Paket bauen

GitHub → **Actions → Inhaltspakete → Run workflow** → Paket **wikivoyage-de**, „hochladen“ an → Run.

Der Lauf lädt die aktuelle ZIM-Datei von kiwix.org (ca. 0,9 GB), baut und signiert das Paket, lädt es hoch, spiegelt die Manifeste aller Pakete im Speicher und baut daraus den Katalog neu. Dauer: 10–20 Minuten.

Danach ist der Katalog erreichbar unter `https://<bucket>.<region>.your-objectstorage.com/katalog/katalog.json`. Diese Adresse wird die Voreinstellung der App (`kern/src/abo.rs`, `katalog_url`) – bis dahin zeigt die App auf Vercel und lädt dort nur die Textpakete.

## Was der Workflow nicht macht

- Er löscht nichts. Alte Paketversionen bleiben im Speicher, bis sie von Hand entfernt werden (Console → Bucket → Ordner löschen). Nur die neueste Version steht im Katalog.
- Er baut keine Karten (PMTiles). Das kommt als eigener Workflow, sobald die Quelle geklärt ist (Protomaps-Auszug Österreich).
