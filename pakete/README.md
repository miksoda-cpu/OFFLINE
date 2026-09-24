# Paketquellen

Jeder Unterordner ist die Quelle eines OFFLINE-Pakets: `paket.quelle.json` (Metadaten) und `inhalt/` (Dateien). Das fertige, signierte Paket entsteht mit dem Werkzeug – Format in [`docs/PAKETFORMAT.md`](../docs/PAKETFORMAT.md).

```bash
node werkzeug/paket.mjs schluessel erzeugen offline-dev      # einmal je Rechner
./werkzeug/alles-bauen.sh                                    # baut alle Pakete, Katalog und Web-Kopien
node --test werkzeug/test.mjs                                # Tests
```

`geplant.json` listet Pakete, die im Katalog als „geplant“ erscheinen, aber noch nicht existieren.

## Redaktion

Die Texte sind eigene Formulierungen. Zahlen und Abläufe folgen den Empfehlungen des Österreichischen Zivilschutzverbands und des Innenministeriums. Vor dem Start: fachliche Durchsicht durch den Zivilschutzverband anfragen, Haftungsausschluss ergänzen.
