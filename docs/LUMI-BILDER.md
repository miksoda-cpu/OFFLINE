# Lumi: Bilder und ihre Herkunft

*Stand 29.09.2026 · Die Bilder kommen mit der App (`web/lumi/`), nicht aus einem Paket (Regel aus `WESEN.md`: Oberfläche kommt mit der App).*

**Die Bilder der Lumi sind mit KI erzeugt.** Die App sagt das beim Einschalten und in den Einstellungen der Lumi.

## So sind sie entstanden (Session „Lumi-Mimik“, 27. bis 29.09.2026)

1. **Referenz:** ein Porträt aus der Runde „Ohren aufgestellt“ (27.09., Datei `ohren-portrait-2`), erzeugt mit Meta Muse Image (`meta/muse-image`) über OpenRouter; von Mik als Lumi gewählt (`Lumi-gewaehlt-2026-09-29.png`). Es ist der Zustand **Freude**.
2. **Zustände:** zehn weitere Zustände aus der Referenz abgeleitet mit Gemini 3 Pro Image (`google/gemini-3-pro-image`) über OpenRouter, in 2K („gleiche Figur, nur Ausdruck, Ohren, Licht, Haltung ändern“). Ein Versuch mit Muse hat die Figur zu stark verändert und wurde verworfen. Lippe und Zähne sind an allen elf Bildern geprüft (Oberlippe geschlossen; Zähne nur bei Freude, Sprechen, Fest, Zähne).
3. **Freistellung:** rembg mit dem Modell `isnet-general-use`; Ausgabe 1200 × 800, WebP mit Transparenz. Die Antennenlicht-Ebene ist ein 256-px-Leuchtpunkt.
4. **Antennenspitzen:** je Zustand von Hand am Bild geprüft, relativ zur Bildgröße (`web/lumi/mimik.js`, aus `lumi-mimik.json`).

Werkzeuge der Session (ohne Schlüssel): `gem.py` (Ableitung), `export.py` (Freistellung, Größen, JSON). Sie liegen bei der Session-Übergabe, nicht im Repo.

## In der App

| Datei | Größe | SHA-256 |
|---|---|---|
| `antennen-licht.webp` | 4 kB | `c63b50e896ea16aae54f00f9d691876dbdb86c2276d4d30b7a9c2f1c9743dacb` |
| `lumi-fest.webp` | 162 kB | `37093f0cdb780b753a7df8301f1545ae5418d249da28dd5e3c6b472edbe01f9f` |
| `lumi-freude.webp` | 114 kB | `f36c17a7af0b76f8fba958d0b0ab3e59bd9d280487e2da3771eed61c0d9eeeea` |
| `lumi-muede.webp` | 107 kB | `2f99175ddf6040cc87be4b4baa2a6adda1ae5d47a4c9c9871e219271c26e33ab` |
| `lumi-nachdenken.webp` | 112 kB | `ed20f8e2fdd29727b9670340aa9f3712475184fde3cf1c33b3c608a8cc981ed1` |
| `lumi-noch-ohne-namen.webp` | 110 kB | `01fb9b93b5a7d8551ef315d054d1103ff781bfc34af472f568013c266d761725` |
| `lumi-ruhe.webp` | 114 kB | `ff4494f534a890047c78705f6d92fcfd32369265ca41c28679d5ee6909217afb` |
| `lumi-schlaeft.webp` | 113 kB | `5c79a21418b54fad6170e8ab04a09a1f4856c7db19bffb331cdae78fb9fedea6` |
| `lumi-sprechen.webp` | 115 kB | `14d4912102d8f32af0f0f179e8b04354a60a82c42dae3437ec21090a7c75ab3c` |
| `lumi-unruhig.webp` | 99 kB | `88af51e7c15ea5b24876d6de80a529dfa8ad2014029ff3620c3c5dc5f73e2df0` |
| `lumi-zaehne.webp` | 98 kB | `9fb69e04a0d6ee911e3f7f8d82361ccda042c6b1ecefc7b86075dda88b1e1f35` |
| `lumi-zuhoeren.webp` | 106 kB | `03a57a79887ef952f857e6991b6471fa4aaab5de32fec8908467e74edd9fb210` |

Zusammen rund 1,3 MB. Mimik-Tafel (wann welcher Zustand, Vorrang): `docs/WESEN.md`, Abschnitt A, und `mimikZustand()` in `web/wesen.js`.
