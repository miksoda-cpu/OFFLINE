# Auftrag: Teil B, Version 0.7.0 – Lumi-Seite und Bibliothek als Laden (Bill, 07.10.2026, über Mik)

- **Nr.:** 2026-10-07-16
- **Grundlage:** Probe „OFFLINE - Home/lumi-bestand/probe-lumi-und-bibliothek.md“, von Mik freigegeben. Zusammen mit `spiele-nachtrag`.

## Entscheidungen Bill zu den sechs Fragen
1. Heute: Die Figur bleibt auf „Heute“, klein und mit dem Satz des Tages. Ein Tipp auf sie öffnet die Lumi-Seite.
2. „Lumi“ steht unter „Mehr“, kein fünfter Tab. Die Lumi ist standardmäßig aus, Vorsorge bleibt Tab.
3. Heft und Vorhaben stehen als Kästchen auf der Lumi-Seite. „Vorhaben“ führt nach Vorsorge.
4. Lumisch wird ein eigenes Modul im Bereich `lumi`. Ist es aktiv, erscheinen die Lumisch-Happen weiter in Pause.
5. `bereich` ersetzt `kategorie`. Bestehende Pakete bekommen ihren Bereich beim Umbau.
6. Österreich-Basis und Tage-Vorrat sind „immer an“ (`pflicht: true`).

Außerdem: Im Tagesrätsel auf „Heute“ bleibt das Texträtsel aus der Vorratskammer; die Spiele haben ihr Rätsel des Tages in Pause.

## Fertig, wenn
- Alle Tests und die Windows-Probe sind grün, dann Release.
- In der Rückmeldung liegen Bilder bei 360 px der Lumi-Seite und der Bibliothek, hell und dunkel.
