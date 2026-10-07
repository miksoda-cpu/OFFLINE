#!/usr/bin/env node
// Paket „lumisch“ (0.7.0, Bill 07.10.2026, Frage 4): Lumisch wird ein eigenes Paket im Bereich „lumi“.
// Aufruf: node pakete/lumisch/aus-pause.mjs – übernimmt Plan, Abfragewörter, Wörterbuch und Hinweis unverändert aus
// pakete/pause/inhalt/pause.json (dort bleibt Lumisch für Apps vor 0.7.0 stehen). Die App ab 0.7.0 nimmt Lumisch nur noch
// aus diesem Paket: Ist es aktiv, kommen die Lumisch-Happen weiter in Pause, und auf der Lumi-Seite steht sein Kästchen.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HIER = path.dirname(fileURLToPath(import.meta.url));
const pause = JSON.parse(await readFile(path.join(HIER, "..", "pause", "inhalt", "pause.json"), "utf8"));
const { plan, woerter, woerterbuch, hinweis } = pause.lumisch;
const aus = { format: 1, hinweis, plan, woerter, woerterbuch };
await writeFile(path.join(HIER, "inhalt", "lumisch.json"), JSON.stringify(aus, null, 1) + "\n");
console.log(`lumisch.json: Plan ${plan.length} Tage, ${woerter.length} Abfragewörter, Wörterbuch ${woerterbuch.length}`);
