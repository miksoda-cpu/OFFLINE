# Wichteln und Engerl-Bengerl

## Was

Ein Modul zum Auslosen von Wichtelrunden in Familie und Freundeskreis, ohne Internet. Dazu die österreichische Variante Engerl-Bengerl: eine Woche kleiner Aufmerksamkeiten und harmloser Streiche mit einer Idee pro Tag.

## Für wen

Familien, Freundesgruppen, Schulklassen, Büros. Ab 6 Jahren im Kinder-Modus sichtbar; Kinder brauchen zum Anlegen einer Runde einen Erwachsenen, ziehen aber selbst.

## Wie funktioniert es

- Wer die Runde anlegt, trägt Anlass, Datum, Preisrahmen, Teilnehmer und Ausschlüsse ein (gilt in beide Richtungen). Optional: niemand zieht dieselbe Person wie in der letzten Runde.
- Ausgelost wird am Gerät mit `crypto.getRandomValues`: jeder genau einmal, niemand sich selbst, Ausschlüsse beachtet. Geht es nicht auf, sagt das Modul das.
- Verteilen: Handy reihum (Name antippen, Knopf 0,9 s gedrückt halten, Ergebnis sehen, verstecken) oder Zettel zum Drucken und Falten.
- Auflösen erst mit Bestätigung.
- Speichern über `offline.speicher`, Schlüssel `runden`, Datenversion 1.

## Wie geprüft

- Im Browser mit dem Ersatz für `window.offline` (Chromium, 420 px Breite).
- Auslosung mit 3, 4 und 8 Personen, mit und ohne Ausschlüsse, mit unmöglicher Kombination (Meldung erscheint).
- Noch nicht in der App selbst (die Schnittstelle `window.offline` gibt es dort noch nicht).

## Offene Punkte

- QR-Code je Person als dritter Verteilweg (braucht eine QR-Bibliothek als Datei).
- Verteilung über den Familienkanal im Mesh, sobald Mesh-Stufe 2 steht.
- Anbindung an ChrisKI² für Wunschlisten (Kontakt über Mik).
- Die Liste liegt unverschlüsselt im Modulspeicher. Wer in den Gerätedaten sucht, findet sie. Das Modul sagt das offen.
