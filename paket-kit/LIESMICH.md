# OFFLINE Paket-Kit

Alles, was man braucht, um ein Paket für OFFLINE abzugeben.

| Datei | Wofür |
|---|---|
| `PFLICHTENHEFT.md` | was ein Paket enthalten muss, für neue Pakete und für Updates |
| `vorlage/` | leerer Quellordner zum Kopieren und Ausfüllen |
| `pruefen.mjs` | Prüfprogramm, Node ab Version 20, keine Abhängigkeiten |
| `beispiel/wichteln/` | ein fertig ausgefülltes Paket (Modul mit eigener Oberfläche), grün geprüft |

## In drei Schritten

1. `vorlage/` kopieren und nach der Paket-Id benennen, ausfüllen.
2. `node pruefen.mjs <ordner>` laufen lassen, bis keine Fehler mehr kommen. Das Programm schreibt `PRUEFBERICHT.md` in den Ordner.
3. Ordner mit Prüfbericht abgeben.

Bei einem Update: `node pruefen.mjs <neu> --vorher <alt>`.

Das Wichtel-Beispiel lässt sich im Browser öffnen: `beispiel/wichteln/inhalt/modul/index.html`.
