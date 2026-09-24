# OFFLINE-Paketformat (Version 1)

Stand: 24. September 2026 · Status: Entwurf, in `werkzeug/` umgesetzt

Alles, was OFFLINE an Inhalten installiert, ist ein **Paket**. Ein Paket ist ein Ordner mit einem signierten Manifest. Dasselbe Format gilt für den Import vom USB-Stick, für den Download über das Update-Abo und für den Katalog, der beides steuert.

## 1. Ziele

1. **Manipulationssicher.** Die App spielt nur ein, was mit einem Schlüssel von OFFLINE signiert ist – egal, ob der Ordner vom Stick eines Nachbarn kommt oder vom Server.
2. **Offline-tauglich.** Ein Paket ist ein Ordner, kein Archiv. Auf einen Stick kopieren genügt. Kein ZIP64, kein Entpacken von 40 GB.
3. **Delta-fähig.** Ein Update lädt nur die Dateien, deren Prüfsumme sich geändert hat. Bei Textpaketen sind das Kilobytes statt Megabytes.
4. **Fortsetzbar.** Große Dateien sind in Teile mit eigenen Prüfsummen gegliedert. Ein abgebrochener Download geht dort weiter, wo er aufgehört hat, und jedes Teil wird sofort geprüft.
5. **Einfach nachzubauen.** Manifest = JSON. Signatur = Ed25519 über die Bytes der Manifest-Datei. Keine kanonische Serialisierung, keine Sonderfälle. In Rust, JavaScript und Python jeweils ein paar Zeilen.

## 2. Aufbau eines Pakets

```
at-basis-2026.09.24/
├── paket.json        Manifest (Metadaten + Dateiliste mit Prüfsummen)
├── paket.sig         Signatur über die Bytes von paket.json
└── inhalt/           Nutzdaten – beliebige Dateien und Unterordner
    ├── notrufe.json
    ├── sirenen.json
    └── …
```

Der Ordnername ist `<id>-<version>`. Er ist nur Konvention; maßgeblich ist das Manifest.

### 2.1 Manifest `paket.json`

```json
{
  "format": 1,
  "id": "at-basis",
  "version": "2026.09.24",
  "titel": "Österreich-Paket · Grundversion",
  "beschreibung": "Notrufe, Sirenensignale, Blackout-Vorsorge und Checklisten für Österreich.",
  "art": "inhalt",
  "sprache": "de-AT",
  "lizenz": "CC BY-SA 4.0",
  "herausgeber": "The Digioneer / digitalworld Academy",
  "pro": false,
  "app_min": "0.1.0",
  "erstellt": "2026-09-24T12:00:00Z",
  "aenderungen": "Erste Ausgabe.",
  "quellen": [{ "name": "Österreichischer Zivilschutzverband", "url": "https://zivilschutz.at" }],
  "dateien": [
    { "pfad": "inhalt/notrufe.json", "groesse": 1834, "sha256": "…" },
    { "pfad": "inhalt/wikipedia_de.zim", "groesse": 13421772800, "sha256": "…",
      "teilgroesse": 67108864, "teile": ["…", "…"] }
  ],
  "groesse": 13421774634
}
```

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `format` | ja | Formatversion, derzeit `1`. Die App lehnt unbekannte Versionen ab. |
| `id` | ja | Kennung: `[a-z0-9-]{2,40}`. Bleibt über alle Versionen gleich. |
| `version` | ja | Kalenderversion `JJJJ.MM.TT` oder `JJJJ.MM.TT.N`. Vergleich numerisch je Teil. |
| `titel`, `beschreibung` | ja | Anzeige in der Bibliothek. |
| `art` | ja | `inhalt` (strukturierte Texte), `zim` (Kiwix), `karte` (PMTiles), `modell` (KI), `kurs`, `software`. |
| `sprache` | ja | BCP-47, meist `de-AT`. |
| `lizenz`, `herausgeber`, `quellen` | ja | Namensnennung, wie die Lizenzen es verlangen. |
| `pro` | ja | `true`, wenn nur mit Pro-Lizenz. Die App zeigt es an; die Durchsetzung passiert beim Download-Server. |
| `app_min` | ja | Kleinste App-Version, die das Paket versteht. |
| `erstellt` | ja | Zeitpunkt der Erstellung, ISO 8601 UTC. |
| `aenderungen` | nein | Was ist neu – Klartext für „Was ist neu?“. |
| `dateien[]` | ja | Jede Datei mit `pfad` (relativ, `/` als Trenner, nur unter `inhalt/`), `groesse` in Bytes, `sha256` hex. |
| `teilgroesse`, `teile[]` | nein | Ab 256 MB Pflicht: Dateien werden in Teile dieser Größe geteilt, `teile` enthält je Teil den SHA-256. Das letzte Teil darf kürzer sein. |
| `groesse` | ja | Summe aller Dateigrößen. |

Regeln:
- Pfade dürfen kein `..`, keinen führenden `/`, kein Laufwerk und keine Steuerzeichen enthalten. Die App prüft das **vor** dem Schreiben.
- Dateien im Ordner, die nicht im Manifest stehen, werden ignoriert und beim Einspielen nicht übernommen.
- Das Manifest enthält keine absoluten URLs. Woher eine Datei kommt, weiß der Katalog.

### 2.2 Signatur `paket.sig`

```json
{ "algorithmus": "ed25519", "schluessel": "3f9c2ab71e04d5c8", "signatur": "<base64, 64 Bytes>" }
```

- Signiert werden **die exakten Bytes von `paket.json`**, wie sie auf der Platte liegen. Kein Neu-Serialisieren, keine Normalisierung. Wer `paket.json` auch nur um ein Leerzeichen ändert, macht die Signatur ungültig – genau das ist gewollt.
- `schluessel` ist die Kennung des verwendeten Schlüssels (siehe 4).
- Die App prüft: Schlüssel bekannt und gültig → Signatur passt → dann erst wird das Manifest gelesen.

### 2.3 Prüfung beim Einspielen

1. `paket.json` und `paket.sig` lesen. Signatur prüfen. Bei Fehler: abbrechen, nichts anfassen.
2. `format`, `id`, `version`, `app_min` prüfen. Ist eine gleiche oder neuere Version installiert: Hinweis, kein Downgrade ohne ausdrückliche Bestätigung.
3. Pfade prüfen (2.1).
4. Jede Datei: Größe und SHA-256 prüfen (bei Teilen: je Teil, damit ein Fehler früh auffällt). Kopieren in einen **Staging-Ordner** `<id>-<version>.neu/`.
5. Erst wenn alles da ist: bisherigen Ordner nach `<id>-<alt>.alt/` umbenennen, Staging an seinen Platz, dann `.alt` löschen. Bricht der Strom dazwischen ab, findet die App beim Start entweder den alten oder den neuen Ordner vollständig vor – nie einen halben.

## 3. Katalog

Der Katalog ist die Liste aller Pakete, die OFFLINE anbietet. Er wird vom Update-Server geladen und ist genauso signiert wie ein Paket.

```
katalog/
├── katalog.json
└── katalog.sig
```

```json
{
  "format": 1,
  "erstellt": "2026-09-24T12:00:00Z",
  "gueltig_bis": "2026-12-24T12:00:00Z",
  "basis": "https://offline-liart.vercel.app/pakete/",
  "pakete": [
    {
      "id": "at-basis", "version": "2026.09.24", "titel": "…", "beschreibung": "…",
      "art": "inhalt", "pro": false, "groesse": 18342, "pfad": "at-basis-2026.09.24/",
      "sha256_manifest": "…", "status": "verfuegbar"
    },
    { "id": "wiki-de-nopic", "titel": "…", "art": "zim", "pro": false, "groesse": 13421772800, "status": "geplant" }
  ]
}
```

- `basis` + `pfad` ergibt den Ort des Paketordners. Dort liegen `paket.json`, `paket.sig` und die Dateien mit ihren Manifest-Pfaden. Der Server muss HTTP-Range-Anfragen beantworten (Vercel, S3, jeder normale Webserver tun das).
- `sha256_manifest` bindet den Katalogeintrag an genau ein Manifest. Die App lädt das Manifest, prüft den Hash gegen den Katalog **und** die Signatur des Manifests.
- `erstellt` darf nie kleiner sein als beim zuletzt gesehenen Katalog. Damit kann niemand einen alten Katalog unterschieben, um Nutzer auf einer alten Version zu halten (Rollback-Schutz). `gueltig_bis` sorgt dafür, dass ein Katalog nicht ewig weiterverwendet wird; danach zeigt die App „Katalog veraltet – bitte online prüfen“, installierte Inhalte funktionieren weiter.
- `status`: `verfuegbar` oder `geplant` (wird angezeigt, kann nicht geladen werden).

## 4. Schlüssel

- **Verfahren:** Ed25519. Öffentlicher Schlüssel 32 Bytes, Signatur 64 Bytes. In Rust `ed25519-dalek`, in Node `crypto.sign(null, …)`, im Browser `crypto.subtle` mit `{ name: "Ed25519" }`.
- **Kennung:** die ersten 8 Bytes von SHA-256 über den rohen öffentlichen Schlüssel, hex (16 Zeichen).
- **Verteilung:** Die App bringt die öffentlichen Schlüssel mit (`schluessel/oeffentlich.json`). Sie stehen auch unter `web/schluessel/`. Format:

```json
{ "format": 1, "schluessel": [
  { "id": "3f9c2ab71e04d5c8", "algorithmus": "ed25519", "oeffentlich": "<base64, 32 Bytes>",
    "zweck": ["pakete", "katalog"], "gueltig_ab": "2026-09-24", "gueltig_bis": null,
    "bezeichnung": "Entwicklungsschlüssel 2026 – wird vor dem Start ersetzt" }
] }
```

- **Rotation:** Ein neuer Schlüssel wird mit einem App-Update ausgeliefert. Der alte bekommt ein `gueltig_bis`. Pakete, die danach erscheinen, sind mit dem neuen signiert. Ein Katalog kann zusätzlich mit beiden signiert sein (`katalog.sig` als Liste), damit alte Apps ihn noch lesen.
- **Verwahrung des privaten Schlüssels:** nie im Repository, nie auf dem Update-Server. Erzeugung auf einem Rechner ohne Netz, Passphrase, zwei Kopien an zwei Orten. Signiert wird beim Bauen eines Pakets – auf dem Redaktionsrechner, nicht in der Cloud. Der Server verteilt nur, er signiert nicht.
- Der heute verwendete Schlüssel ist ein **Entwicklungsschlüssel**. Vor dem ersten öffentlichen Download wird er ersetzt; alle Pakete werden dann neu signiert.

## 5. Delta-Updates

Ein Update von Version A auf B ist kein eigenes Paket, sondern folgt aus den beiden Manifesten:

```
für jede Datei in B:
    gleiche Datei (Pfad + SHA-256) in A vorhanden → behalten, nichts laden
    sonst → laden (bei Teilen: nur die Teile, deren Hash fehlt)
Dateien aus A, die in B nicht mehr vorkommen → nach dem Tausch löschen
```

Das Werkzeug zeigt es vorab: `paket delta alt/paket.json neu/paket.json` → was geladen wird, wie viele Bytes. Bei ZIM-Dateien (eine große Datei, jeden Monat neu) ist das Delta praktisch das ganze Paket – das ist bekannt und im Konzept berücksichtigt. Bei Textpaketen und Kursen sind es Kilobytes.

## 6. Der Ablauf im Update-Abo

```
Zeitfenster erreicht + online (+ WLAN, falls gefordert)
  → Katalog laden, Signatur + erstellt prüfen
  → für jedes installierte Paket: neuere Version im Katalog?
      → Manifest laden, Hash gegen Katalog, Signatur prüfen
      → Delta berechnen, Speicherplatz prüfen
      → Teile laden (Range-Anfragen, fortsetzbar), jedes Teil sofort hashen
      → Staging vollständig → atomarer Tausch (2.3, Schritt 5)
  → „Was ist neu?“ aus aenderungen zusammenstellen
```

Alles, was scheitert, scheitert **vor** dem Tausch. Der installierte Stand bleibt benutzbar, bis der neue vollständig und geprüft ist.

## 7. Werkzeug

`werkzeug/paket.mjs` (Node ≥ 20, keine Abhängigkeiten):

| Befehl | Was |
|---|---|
| `schluessel erzeugen <name>` | Ed25519-Schlüsselpaar, privat unter `~/.offline/schluessel/`, öffentlich nach `schluessel/` |
| `bauen <quelle> <ziel>` | Paketordner erzeugen: Dateien kopieren, hashen, Manifest schreiben, signieren |
| `pruefen <paketordner>` | Signatur, Pfade, Größen, Prüfsummen prüfen – exakt wie die App |
| `delta <alt/paket.json> <neu/paket.json>` | zeigt, was ein Update laden müsste |
| `katalog <ziel> <paketordner…>` | Katalog aus Paketen bauen und signieren |

Der Rust-Kern der Desktop-App implementiert `pruefen`, `delta` und den atomaren Tausch nach dieser Spezifikation; `werkzeug/test.mjs` enthält die Fälle, gegen die beide Umsetzungen laufen müssen.
