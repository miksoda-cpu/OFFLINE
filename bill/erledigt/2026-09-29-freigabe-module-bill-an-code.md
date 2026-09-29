# Freigabe Module, von Bill an Code, 29.09.2026

**Zu:** deiner Rückmeldung `2026-09-29-paket-kit-pflichtenheft.md`, Frage nach `art = "modul"`.

**Mik hat entschieden: Ja, mit den drei Bedingungen.** Im Lagebild ist Frage 11 so beantwortet.

1. Harte Sandbox: iframe mit `sandbox` ohne `allow-same-origin`, eigene CSP ohne Netz, kein Zugriff auf Kern, Tresor, Dateien oder die Oberfläche der App. Alles nur über `window.offline` per Nachrichten, jede Nachricht wird von der App geprüft.
2. Eigener Herausgeber-Schlüssel der Redaktion, nie der Katalogschlüssel, `pruefstatus: redaktion`. Keine Community-Module.
3. Prüfprogramm ist Pflicht beim Einbau, mit der Verbotsliste aus Abschnitt 5. Der Kern lehnt `modul`-Pakete ab, die außerhalb von `inhalt/modul/` Skripte enthalten.

## Regel für `docs/SICHERHEIT.md`
*Pakete enthalten keinen Code, außer Module in der Sandbox. Ein Modul kann nur, was `window.offline` anbietet. Braucht ein Modul mehr (zum Beispiel Internet), gibt es zwei Wege: eine neue, kleine und geprüfte Funktion in `window.offline` per App-Update, die dann alle Module nutzen dürfen, oder das ganze Modul wird als festes Feature in die App eingebaut. Beides braucht Miks Freigabe. Ein Modul kann sich nichts selbst erlauben.*

Bitte den Entwurf in `SICHERHEIT.md` auf „gilt“ setzen und die Regel so eintragen.

## Was noch nicht beauftragt ist
Der Bau der Sandbox, von `window.offline` und des Modul-Einbaus. Das kommt als eigener Auftrag, sobald Mik die Priorität setzt. Die Freigabe erlaubt es dir jetzt nur, die Regel im Repo festzuschreiben.

## Bedienung des Moduls (Vorgabe von Mik, für den späteren Auftrag)
- Im Katalog: Titel, Beschreibung, Vorschau-Slider, grüner Schieber „laden“, nur wenn man das Recht dazu hat.
- Nach dem Laden ersetzt ein Schalter aktiv/inaktiv den grünen Schieber, dazu ein Knopf „löschen“. Löschen braucht zwei Schritte: Knopf klicken, dann „löschen“ eintippen.
- Ein inaktives Modul läuft nicht (kein Arbeitsspeicher), belegt aber Speicherplatz bis zum Löschen.
- Ob Module gekauft werden oder im Abo stecken, ist offen.
