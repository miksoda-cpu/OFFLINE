# HERKUNFT – Flechtenbilder im Skin „Flechte“

**Alle 15 Bilder in `flechten/` sind KI-generiert.** Sie wurden mit dem Bildmodell Meta: Muse Image erzeugt, nicht fotografiert und nicht von Hand gezeichnet. Menschen und Tiere darin sind erfunden und stellen keine realen Personen dar. Das Wiener Riesenrad und der Praterstern kommen als Motiv vor; es wurden keine Fotos oder Werke Dritter als Vorlage verwendet.

## Auf einen Blick

| | |
|---|---|
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, Endpunkt `POST /api/v1/images`, Konto von Michael Kainz |
| Datum | 24.09.2026, 19:11 bis 19:45 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic), Cowork-Session im Projekt OFFLINE, im Auftrag und unter Anleitung von Michael Kainz (Mik) |
| Auswahl und Freigabe | Mik („viel besser!“ zu Entwurf 2, Entwurf 1 verworfen) |
| Werkzeug | `muse-bild.py` (Python, Standardbibliothek). Das Skript enthält keinen Schlüssel, es liest `OPENROUTER_API_KEY` aus der Umgebung. |
| Parameter | `n: 1`, `aspect_ratio` je Bild, bei allen Bildern außer Entwurf 1 ein Referenzbild als `images` (Base64-PNG) |
| Kosten | rund 0,01 USD je Bild laut OpenRouter-Antwort |
| Rechtlicher Status | Ob und wie weit maschinell erzeugte Bilder urheberrechtlich geschützt sind, ist nicht geklärt. Frage an den Anwalt ist vorgeschlagen, noch nicht gestellt. Die Bilder sind in App-Oberfläche und Metadaten als KI-generiert zu kennzeichnen. |

## Wie ein Prompt zusammengesetzt ist

Jeder gesendete Prompt ist: **Bildbeschreibung + Satz zur Referenz + gemeinsamer Stilblock**. Unten steht bei jedem Bild der vollständige Text, so wie er an das Modell ging.

Gemeinsamer Stilblock (Entwurf 2, gilt für alle 15 Bilder):

```text
Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

## Stammbaum

```
Entwurf 1 „Dorf“ (verworfen, 19:11, ohne Referenz)
        │  Referenz
        ▼
03-dorf (19:15) ──── Referenz für alle weiteren ────┐
        │                                          │
        ├─► 01-riesenrad, 02-felder, 04-rosette, 05-fassade (19:16)
        └─► ecke-ol, ecke-or, ecke-ul, ecke-ur,
            tupfer-bank, -bienen, -brunnen, -rad, -tram, -ziege (19:45)
```

## Große Motive

### `flechten/03-dorf.webp`

| Feld | Wert |
|---|---|
| Inhalt | Hauptbild und Stilvorlage der Serie: Dorf am Praterstern, Riesenrad, Brunnen, Beete, Teich, Menschen, Tiere |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:15 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | Entwurf 1 „Dorf“, siehe Abschnitt „Verworfen“ |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet (freigestellt), auf 1100 px lange Kante verkleinert, WebP Qualität 82. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 1100 × 1100 px, 486 KB |
| SHA-256 | `a7a3a739f28fb7ff06c34ae0a5ebb30564954c85ad474593fd07ee8e8d7a1dd6` |

Prompt, wörtlich wie gesendet:

```text
A round lichen colony in the centre of the image: a medieval-feeling village of small timber-and-stone cottages built from reused city materials, on the site of the Praterstern in Vienna in the 2030s, reclaimed by nature. Chimney smoke columns, a well, fruit trees, small colourful fields, and in the background the Vienna Giant Ferris Wheel (Wiener Riesenrad) overgrown with ivy and flowers. Intended for an empty-state screen of an app. Keep the composition and drawing technique of the reference image, but make it greener, more colourful and full of life. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/01-riesenrad.webp`

| Feld | Wert |
|---|---|
| Inhalt | Riesenrad, überwachsen, Gondeln als Pflanzkästen, Dorfleute und Tiere |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:16 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet (freigestellt), auf 1100 px lange Kante verkleinert, WebP Qualität 82. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 1100 × 1100 px, 582 KB |
| SHA-256 | `20a310e84eca29a157dbe565733b35053c3c2228a7762958a5f4983a3a25633e` |

Prompt, wörtlich wie gesendet:

```text
An organic lichen patch growing only from the top-left corner of the image: the Vienna Giant Ferris Wheel (Wiener Riesenrad) overgrown with ivy and flowers, its gondolas used as planters and a pigeon loft, a few villagers on a path below, birds and bees, smoke columns rising behind. The rest of the image stays empty. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/02-felder.webp`

| Feld | Wert |
|---|---|
| Inhalt | Gemeinschaftsgärten am früheren Kreisverkehr Praterstern, Ernte, Pferdewagen, Gänse |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:16 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 4:1 angefragt, 3:2 geliefert |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1920 × 1280 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet (freigestellt), auf 1100 px lange Kante verkleinert, WebP Qualität 82. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 1100 × 734 px, 267 KB |
| SHA-256 | `f20e66ec9547f1104a033b323383258c6e582af45114d05e60e2d37b1af2b57c` |

Prompt, wörtlich wie gesendet:

```text
A long, low lichen-shaped strip along the bottom edge: colourful allotment fields and vegetable rows where the Praterstern roundabout in Vienna used to be, a tram track swallowed by grass and poppies, three tiny cottages with smoking chimneys, people harvesting, geese, a goat, a horse pulling a small cart. Upper part of the image stays empty. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/04-rosette.webp`

| Feld | Wert |
|---|---|
| Inhalt | Flechtenrosette mit Häuschen, Menschen und Tieren |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:16 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet (freigestellt), auf 1100 px lange Kante verkleinert, WebP Qualität 82. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 1100 × 1100 px, 330 KB |
| SHA-256 | `c583a9168f46263f29152beaa6e6426e9afcc404c325c8dcb6b1971e586bf537` |

Prompt, wörtlich wie gesendet:

```text
A small lichen spot in the centre, like a single rosette of crustose lichen, in which one miniature cottage with a smoke column sits, a cat on the doorstep, a hen, a few flowers. Small, lots of empty space around it. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/05-fassade.webp`

| Feld | Wert |
|---|---|
| Inhalt | Bewachsene Gründerzeitfassade, Birken auf Balkonen, Wäsche, Leute an Fenstern |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:16 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:2 angefragt, 2:3 geliefert |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1280 × 1920 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet (freigestellt), auf 1100 px lange Kante verkleinert, WebP Qualität 82. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 734 × 1100 px, 520 KB |
| SHA-256 | `9d07b48e8b177f254249d3b9d8536a6ddd34b37767c13233d0061867435e0743` |

Prompt, wörtlich wie gesendet:

```text
A vertical lichen growth creeping in from the right edge: an old Viennese Gruenderzeit facade covered in moss and blooming climbers, birch trees growing from balconies, laundry lines, people waving from windows, a cat on a windowsill, birds nesting, a thin smoke trail. Left part of the image stays empty. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

## Kleine Stücke: Ecken und Tupfer

### `flechten/ecke-ol.webp`

| Feld | Wert |
|---|---|
| Inhalt | Ecke oben links: Moos, Blumen, Hausdach, Amsel, Bienen |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:45 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet, Papierstruktur nur in der Nähe der Zeichnung behalten, auf den Inhalt zugeschnitten, auf höchstens 640 px verkleinert, WebP Qualität 85. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 631 × 640 px, 175 KB |
| SHA-256 | `7ef53f1063719d460dda011b26b6cafdc6cc2e9b6ffffbd341b1bf5d612c1235` |

Prompt, wörtlich wie gesendet:

```text
A small lichen growth tucked into the TOP-LEFT corner only, spreading along both edges: moss, meadow flowers, a tiny cottage roof with smoke, a blackbird, bees. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Keep it small and delicate; the vignette covers at most a quarter of the canvas. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/ecke-or.webp`

| Feld | Wert |
|---|---|
| Inhalt | Ecke oben rechts: Apfelzweig, Eichhörnchen, Schwalben, Riesenrad-Gondel |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:45 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet, Papierstruktur nur in der Nähe der Zeichnung behalten, auf den Inhalt zugeschnitten, auf höchstens 640 px verkleinert, WebP Qualität 85. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 478 × 640 px, 195 KB |
| SHA-256 | `754ff213e6ac1cacedc037f3154cb0b28b9d2ce8ddcac553ca4da7a610af8541` |

Prompt, wörtlich wie gesendet:

```text
A small lichen growth tucked into the TOP-RIGHT corner only: ivy tendrils, apple branch with fruit, a squirrel, swallows, a distant tiny Ferris wheel gondola overgrown with flowers. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Keep it small and delicate; the vignette covers at most a quarter of the canvas. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/ecke-ul.webp`

| Feld | Wert |
|---|---|
| Inhalt | Ecke unten links: Beet, Kind mit Gießkanne, Henne mit Küken |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:45 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet, Papierstruktur nur in der Nähe der Zeichnung behalten, auf den Inhalt zugeschnitten, auf höchstens 640 px verkleinert, WebP Qualität 85. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 640 × 535 px, 138 KB |
| SHA-256 | `a991262ab3d9583b125ea280931c8b4219b452f60871b8e31026bc35c2f7d86c` |

Prompt, wörtlich wie gesendet:

```text
A small lichen growth tucked into the BOTTOM-LEFT corner only: vegetable bed, a child with a watering can, a hen with chicks, poppies and cornflowers. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Keep it small and delicate; the vignette covers at most a quarter of the canvas. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/ecke-ur.webp`

| Feld | Wert |
|---|---|
| Inhalt | Ecke unten rechts: Teich, Enten, Fuchs, Lavendel, Frosch |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:45 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet, Papierstruktur nur in der Nähe der Zeichnung behalten, auf den Inhalt zugeschnitten, auf höchstens 640 px verkleinert, WebP Qualität 85. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 640 × 587 px, 165 KB |
| SHA-256 | `b9edec91dbd2df58ea84e232a111e04b790db163bf5258278bbb011092bd80f2` |

Prompt, wörtlich wie gesendet:

```text
A small lichen growth tucked into the BOTTOM-RIGHT corner only: a little pond with ducks, reeds, a fox sitting, lavender, a frog. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Keep it small and delicate; the vignette covers at most a quarter of the canvas. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/tupfer-bank.webp`

| Feld | Wert |
|---|---|
| Inhalt | Parkbank, lesende ältere Person, Katze |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:45 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet, Papierstruktur nur in der Nähe der Zeichnung behalten, auf den Inhalt zugeschnitten, auf höchstens 640 px verkleinert, WebP Qualität 85. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 640 × 537 px, 207 KB |
| SHA-256 | `8673cadce98b174e7f276b4dd15b7303bed33aa36c532d5702225f65dda7514c` |

Prompt, wörtlich wie gesendet:

```text
A tiny isolated lichen spot in the centre: an old Viennese park bench overgrown with moss, an elderly person reading, a cat beside them. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Keep it small and delicate; the vignette covers at most a quarter of the canvas. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/tupfer-bienen.webp`

| Feld | Wert |
|---|---|
| Inhalt | Bienenstock, Sonnenblumen, Thymian |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:45 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet, Papierstruktur nur in der Nähe der Zeichnung behalten, auf den Inhalt zugeschnitten, auf höchstens 640 px verkleinert, WebP Qualität 85. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 628 × 640 px, 113 KB |
| SHA-256 | `dfa84112e108af6d4a48e1a7f8e28e07fc11641c313fa332e01b604766f337e2` |

Prompt, wörtlich wie gesendet:

```text
A tiny isolated lichen spot in the centre: a wooden beehive stand with bees, sunflowers and thyme. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Keep it small and delicate; the vignette covers at most a quarter of the canvas. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/tupfer-brunnen.webp`

| Feld | Wert |
|---|---|
| Inhalt | Steinbrunnen, Spatzen, Farn, Vergissmeinnicht |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:45 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet, Papierstruktur nur in der Nähe der Zeichnung behalten, auf den Inhalt zugeschnitten, auf höchstens 640 px verkleinert, WebP Qualität 85. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 640 × 479 px, 130 KB |
| SHA-256 | `216bea58472836c0bcab421327e1be91aaa08dc665976ea60d09ddc11b815ff0` |

Prompt, wörtlich wie gesendet:

```text
A tiny isolated lichen spot in the centre: a small stone well with a bucket, two sparrows, ferns and forget-me-nots. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Keep it small and delicate; the vignette covers at most a quarter of the canvas. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/tupfer-rad.webp`

| Feld | Wert |
|---|---|
| Inhalt | Radfahrer mit Gemüsekorb, Hund |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:45 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet, Papierstruktur nur in der Nähe der Zeichnung behalten, auf den Inhalt zugeschnitten, auf höchstens 640 px verkleinert, WebP Qualität 85. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 640 × 620 px, 197 KB |
| SHA-256 | `9bb5a263fedb455057d4aa75eebfa862074a1f230aec0dda738411781e27785f` |

Prompt, wörtlich wie gesendet:

```text
A tiny isolated lichen spot in the centre: a person on a bicycle with a basket of vegetables, a dog running alongside, grass and daisies. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Keep it small and delicate; the vignette covers at most a quarter of the canvas. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/tupfer-tram.webp`

| Feld | Wert |
|---|---|
| Inhalt | Straßenbahnschiene im Gras, Igel, Walderdbeeren |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:45 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet, Papierstruktur nur in der Nähe der Zeichnung behalten, auf den Inhalt zugeschnitten, auf höchstens 640 px verkleinert, WebP Qualität 85. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 640 × 576 px, 204 KB |
| SHA-256 | `5c36a2898cae37215e5c91680a997c877fe92f0927f556129e2d6580a49b2164` |

Prompt, wörtlich wie gesendet:

```text
A tiny isolated lichen spot in the centre: a fragment of an old Vienna tram rail swallowed by grass, a hedgehog, wild strawberries. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Keep it small and delicate; the vignette covers at most a quarter of the canvas. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

### `flechten/tupfer-ziege.webp`

| Feld | Wert |
|---|---|
| Inhalt | Ziege auf Klee, Schmetterling |
| KI-generiert | **Ja.** Vollständig von einem Bildmodell erzeugt, nicht fotografiert, nicht von Hand gezeichnet. |
| Modell | Meta: Muse Image (`meta/muse-image`) |
| Zugang | OpenRouter, `POST https://openrouter.ai/api/v1/images`, Konto von Michael Kainz |
| Datum der Erzeugung | 24.09.2026, 19:45 Uhr (Wien, MESZ) |
| Erzeugt von | Claude (Anthropic) in einer Cowork-Session im Auftrag und unter Anleitung von Michael Kainz (Mik); Motiv, Stilwahl und Freigabe durch Mik |
| Seitenverhältnis | 1:1 |
| Referenzbild | `flechten/03-dorf.webp` in der Rohfassung (PNG) |
| Rohbild | PNG, 1600 × 1600 px |
| Nachbearbeitung | Papierton per Farbabstand zu Alpha umgerechnet, Papierstruktur nur in der Nähe der Zeichnung behalten, auf den Inhalt zugeschnitten, auf höchstens 640 px verkleinert, WebP Qualität 85. Keine inhaltliche Retusche. |
| Datei im Skin | WebP mit Alpha, 562 × 449 px, 126 KB |
| SHA-256 | `91e67af1339574aa3bb3ec76d3e7bc35b49595a69faca95d83e2037bdec5950f` |

Prompt, wörtlich wie gesendet:

```text
A tiny isolated lichen spot in the centre: a goat grazing on a patch of clover and flowers, a butterfly. Match the exact drawing style, colours and lichen-edge treatment of the reference image. Keep it small and delicate; the vignette covers at most a quarter of the canvas. Style: lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Lush and green: vivid moss, fresh leaf greens, meadow flowers in poppy red, cornflower blue, buttercup yellow and lavender, rust-red roof tiles, warm golden light. Lively: small villagers going about their day (tending fields, carrying baskets, children playing, someone on a bicycle), and animals (chickens, goats, a dog, a cat, ducks, bees, birds, a fox at the edge). Fine hand-drawn texture between etching and watercolor, cheerful, utopian and hopeful, not post-apocalyptic, no text, no logos. Composition leaves at least 50 % empty background.
```

## Verworfen: Entwurf 1 „Dorf“

Nicht im Skin enthalten. Diente nur als Referenz für `03-dorf`. Erzeugt am 24.09.2026 um 19:11 Uhr mit demselben Modell, ohne Referenzbild, Seitenverhältnis 1:1. Mik fand ihn zu blass und wollte „grüner, bunter, Menschen und Tiere“.

```text
A small round lichen colony in the centre of the image: a medieval-feeling village of small timber-and-stone cottages built from reused city materials, on the site of the Praterstern in Vienna in the 2030s, reclaimed by nature. Chimney smoke columns, a well, fruit trees, small fields, and in the background the silhouette of the Vienna Giant Ferris Wheel (Wiener Riesenrad) overgrown with ivy. Intended for an empty-state screen of an app. Style: delicate lichen-like vignette, organic irregular edges that dissolve into a plain warm off-white paper background (#F4F1EA), no frame, no border. Muted palette of lichen greens, grey-sage, ochre and rust, with small touches of chimney smoke. Fine hand-drawn texture between etching and watercolor, very low contrast, calm, utopian and hopeful, not post-apocalyptic, no ruins drama, no people in focus, no text, no logos. Composition leaves at least 60 % empty background.
```

## Bekannte Abweichungen vom Prompt

- `02-felder`: Trotz „no text“ steht auf einem kleinen Schild im Bild das Wort „Praterstern“. Es wurde belassen.
- `02-felder` und `05-fassade`: Das Modell hat das angefragte Seitenverhältnis (4:1 bzw. 1:2) auf 3:2 bzw. 2:3 geändert.
- `ecke-ul` und `ecke-ur`: Das Modell setzte die Zeichnung nicht ganz in die Ecke. Erst der Zuschnitt auf den Inhalt lässt sie bündig an den Rand stoßen.

## Pflege

Wird ein Bild ersetzt oder ein neues hinzugefügt, bekommt es hier einen eigenen Block mit denselben Feldern. Die Prüfsumme muss zur Datei in `flechten/` passen. Prüfen: `shasum -a 256 flechten/*.webp`

Stand: 29.09.2026
