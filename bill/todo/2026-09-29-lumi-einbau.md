# Auftrag: Die Lumi, standardmäßig aus, mit Namen, Bildern und 180 Tipps

**Von:** Bill · **Datum:** 2026-09-29 · **Dringlichkeit:** normal

## Ziel
Die Lumi ist nach dem Update standardmäßig aus. Wer sie einschaltet, gibt ihr einen Namen, erst danach sagt sie „ich“. Sie zeigt die Zustände aus der Mimik-Tafel mit den neuen Bildern, das Antennenlicht folgt der Bereit-Zahl. Das Paket „wir“ hat 180 Tipps. Fertig, wenn der Startablauf in der Test-App durchgespielt ist und die Tests grün sind.

## Hintergrund
Im Ordner OFFLINE - Home, `OFFLINE-Lumi-Mimik-fuer-Bill/`: Zusammenfassung, `docs/OFFLINE-Lumi-Mimik.md`, `docs/OFFLINE-Lumi-Startablauf.md` (alle Texte), `docs/OFFLINE-Wesen-Konzept.md` (Entwurf 3), `bilder/app/`, `bilder/frei/`, `bilder/ebenen/`, `bilder/lumi-mimik.json`.
Miks Entscheidungen (Lagebild, Fragen 14 bis 17): Ruhe mit geschlossenem Mund und leichtem Lächeln; Einladung über die Einstellungen und einmal eine Karte nach der ersten Woche; ganz still, solange sie aus ist (keine Tipps); „Später“ bei der Namensgabe ist erlaubt.

## Umfang
1. **Standard aus.** Bestehende Nutzer: Wer die Lumi schon benannt hat, behält sie an. Alle anderen: aus, mit der einmaligen Karte. Drei Darstellungen: aus (Standard), Lumi mit Tipps, nur Tipps.
2. **Startablauf** genau nach `OFFLINE-Lumi-Startablauf.md`, mit den Texten von dort. Ohne Namen kein „ich, mir, mich, mein“. Das gilt auch für Tipps (Tipps mit „ich“ erst nach dem Namen, die Bedingung `benannt` gibt es schon).
3. **Bilder:** die elf Zustände aus `bilder/frei/` als Fotoansicht der Lumi, Antennenlicht als Ebene nach `lumi-mimik.json`, Kopfneigung als Drehung. Das Pixel-Sprite bleibt als Sparmodus und für kleine Flächen. Zusammen höchstens rund 2 MB zusätzlich. Die Bilder kommen mit der App, nicht aus einem Paket (Regel aus `WESEN.md`: Oberfläche kommt mit der App).
4. **KI-Kennzeichnung:** In „Über“ oder beim Einschalten ein Satz, dass die Bilder der Lumi KI-generiert sind. Herkunftsangaben aus der Session (Modell, Referenz) in `docs/`.
5. **180 Tipps:** Material aus `bill/eingang/2026-09-29-bill/material/pakete/wir/`, Format angleichen wie in deiner Rückmeldung empfohlen: Sorten klein, Wortschatz der App um `wochentag`, `stunde`, `tag` und Verfallsalter erweitern, `profil.*` beim Bau weglassen. Tipp `app-001` korrigieren: Der Tresor liegt links in der Seitenleiste. Tipps, die „Hörner“, „Arktis“ oder „das Wesen“ sagen, auf Lumi und Antennen umschreiben und in der Rückmeldung auflisten.
6. `docs/WESEN.md` auf Entwurf 3 nachziehen (Konzept aus der Session in Abschnitt A übernehmen).

**Nicht dabei:** Pro-Chat, Pupillen folgen dem Finger, Kinder-Modus.

## Prüfung
Test-App: frische Installation (aus, Karte erst nach einer Woche, Datum vorstellen), Einschalten, „Später“, dann Name, alle Zustände einmal auslösen, Ausschalten, wieder Einschalten (Name bleibt). Tests für: kein „ich“ ohne Namen, keine Tipps wenn aus, Übergang für bestehende Nutzer.

## Offene Fragen
Wenn die Fotoansicht auf dem Handy-Maß (360 Pixel) nicht funktioniert, melde es mit einem Vorschlag. Reihenfolge: Nach „Bereit Version 2“ bauen, weil das Antennenlicht die neue Zahl liest.
