#!/usr/bin/env python3
"""Sirenen zum Anhören (0.8.0, Auftrag Nr. 20): die drei Signale und die Probe als kurze Tondateien, selbst erzeugt.
Nachgebildet, nicht aufgenommen: Grundton mit zwei Obertönen; Alarm schwillt zwischen 300 und 470 Hz auf und ab.
Aufruf (macOS, braucht afconvert): python3 werkzeug/sirenen-ton.py pakete/at-basis/inhalt/sirenen
Gekürzt: Warnung und Entwarnung je 15 s, Alarm 20 s; die Probe hat ihre echte Länge (15 s)."""
import math, os, struct, subprocess, sys, tempfile, wave

RATE = 16000
ziel = sys.argv[1]
os.makedirs(ziel, exist_ok=True)

def klang(phase):
    return math.sin(phase) + 0.3 * math.sin(2 * phase) + 0.15 * math.sin(3 * phase)

def signal(sekunden, frequenz):
    n, phase, aus = int(sekunden * RATE), 0.0, []
    for i in range(n):
        t = i / RATE
        phase += 2 * math.pi * frequenz(t) / RATE
        huelle = min(1.0, t / 1.0, (sekunden - t) / 1.5)  # weich an und aus, wie eine anlaufende Sirene
        aus.append(0.42 * huelle * klang(phase))
    return aus

def schreiben(name, werte):
    with tempfile.TemporaryDirectory() as tmp:
        w = os.path.join(tmp, name + ".wav")
        with wave.open(w, "wb") as f:
            f.setnchannels(1); f.setsampwidth(2); f.setframerate(RATE)
            f.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, x)) * 32767)) for x in werte))
        ziel_datei = os.path.join(ziel, name + ".m4a")
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "32000", w, ziel_datei], check=True)
        print(ziel_datei, os.path.getsize(ziel_datei), "Bytes")

dauer = lambda t: 420.0
heulen = lambda t: 385.0 - 85.0 * math.cos(2 * math.pi * t / 4.0)  # 300–470 Hz, alle 4 Sekunden einmal auf und ab
schreiben("warnung", signal(15, dauer))
schreiben("alarm", signal(20, heulen))
schreiben("entwarnung", signal(15, dauer))
schreiben("probe", signal(15, dauer))
