# Auftrag: Nachtrag Lumi, Textkarten und Schlafenszeit

**Von:** Bill · **Datum:** 2026-09-29 · **Dringlichkeit:** normal · **Nach dem Release 0.2.0**, nicht davor

## Ziel
Zwei Entscheidungen, die Mik später am 29.09. in der Lumis-Session getroffen hat, sind in der App umgesetzt. Sie ersetzen die frühere Wahl „ganz still“ aus dem Lagebild.

## Umfang
1. **Drei Stufen der Darstellung:**
   - **Aus mit Textkarten (Standard):** keine Figur. Tipps erscheinen als neutrale Textkarte, nur die Sorten App, Alltag, Wissen, dazu Digital, wenn angekreuzt. Keine Tipps, in denen die Lumi von sich erzählt.
   - **Lumi mit Tipps:** wie jetzt gebaut.
   - **Tipps aus:** ganz still, nur die Bereit-Zahl.
   Tipps, in denen die Lumi von sich erzählt oder „ich“ sagt, erscheinen nur bei eingeschalteter und benannter Lumi.
2. **Einladungskarte** nach der ersten Woche bekommt „Nicht mehr zeigen“ (falls noch nicht da).
3. **Nachts schläft sie:** Zur gelernten Schlafenszeit geht die Lumi in den Zustand „Schläft“, auch bei offener App. Ein Stups weckt sie kurz, danach schläft sie wieder ein. Solange keine Schlafenszeit gelernt ist: 22 bis 6 Uhr.
4. `docs/WESEN.md` und die Tests nachziehen. Referenz: `claude/OFFLINE-Wesen-Konzept.md` (Entwurf 3) und `OFFLINE-Lumi-Startablauf.md`, beide im Projekt; die Session-Fassungen liegen im Ordner `OFFLINE-Lumi-Mimik-fuer-Bill/docs/`.

## Prüfung
Tests: Standard zeigt Textkarten ohne „ich“-Tipps; „Tipps aus“ zeigt nichts; Schlafenszeit schaltet den Zustand, Stups weckt kurz. Kurzer Durchlauf im Web-Prototyp reicht.

## Offene Fragen
Keine. Veröffentlichen im nächsten regulären Update, Freigabe wie beim Release.
