# Redaktion: freigegebene Module

`freigegeben/` enthält fertig gebaute, mit dem Redaktionsschlüssel (`d9b62d1755ba3744`) signierte Module, die Mik für den öffentlichen Katalog freigegeben hat. Gebaut wird auf Miks Mac (`node werkzeug/paket.mjs bauen … ~/.offline/redaktion/pakete`), der private Schlüssel kommt nie hierher.

- Ein Ordner hier ist die Freigabe. Der Workflow „Inhaltspakete“ (Auswahl `redaktion`) prüft jeden Ordner und lädt ihn hoch, danach wird der Katalog neu gebaut.
- Die Windows-Probe lädt Wichteln von hier als lokale Quelle in die App.
- Nicht freigegebene Module und Skins (z. B. Flechte) bleiben in der lokalen Redaktionsablage.
