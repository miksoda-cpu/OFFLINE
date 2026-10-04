# Auftrag: drei Tipps aus der Rückmeldung zu 0.3.4

- Nr.: 2026-10-04-03
- Priorität: klein, mit der nächsten `wir`-Ausgabe (gern zusammen mit Pause 0.4.0 oder davor als eigene Ausgabe)
- Quelle: Codes Rückmeldung zu 0.3.4, Entscheidung Bill
- Grundsatz: Ein Tipp behauptet nie etwas, das die App nicht kann.

| Tipp | Problem | Entscheidung |
|---|---|---|
| `app-011` | nennt eine Kategorie „Wissen“, die es nicht gibt | Text neu: „Die Pakete in der Bibliothek liegen ganz auf deinem Gerät. Kein Netz nötig, nie. Deshalb sind sie groß.“ `ziel` bleibt `bibliothek`. |
| `app-012` | Wikipedia ohne Bilder wird nicht als eigene Wahl angeboten | Text bleibt, Bedingung `{"funktion": "wikipedia-varianten"}`. Der Tipp wartet, bis man in der Bibliothek zwischen Wikipedia mit und ohne Bilder wählen kann. `ziel` bleibt. |
| `app-030` | Export in offene Formate gibt es noch nicht | Text bleibt, Bedingung `{"funktion": "export"}`. Kein `ziel`. |

Fertig, wenn die neue `wir`-Ausgabe signiert im Katalog liegt, der Test „keine falschen Behauptungen“ die beiden neuen Funktionswörter kennt und die Liste der wartenden Tipps in der Doku stimmt. Das Feld `buch` bleibt leer: Das Lumi-Buch ist als Entwurf fertig, geht aber erst nach Miks Durchsicht und einer Lektorenrunde als eigener Auftrag an dich.
