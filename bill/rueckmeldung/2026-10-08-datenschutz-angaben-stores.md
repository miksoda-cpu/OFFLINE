# Entwurf: Datenschutz-Angaben für App Store und Google Play

**Von:** Code · **Datum:** 2026-10-08 · **Auftrag:** Nr. 19, Teil B 6 · **Stand:** App 0.7.2, Store-Build (ohne eigenen Updater, ohne internen Kanal)

Die Angaben gelten für den Store-Build. Mik reicht sie ein, sobald die Konten da sind. Die Wortwahl der Formulare ändert sich gelegentlich, deshalb prüfe ich sie vor dem Einreichen noch einmal gegen das aktuelle Formular.

## 1. Was die App wirklich überträgt
Geprüft im Code von 0.7.2 (`web/`, `kern/`, `app/src-tauri/`) und in den erlaubten Adressen der App.

| Wohin | Wann | Was geht mit | Wer betreibt es |
|---|---|---|---|
| `offline-pakete.fsn1.your-objectstorage.com` (Paket-Speicher) | Katalog prüfen, Pakete und Vorschaubilder laden, sobald Netz da ist | Anfrage mit IP-Adresse, Uhrzeit und Kennung „OFFLINE/0.7.2“. Keine Gerätekennung, kein Konto, keine Inhalte. | Hetzner Online GmbH, Rechenzentrum Falkenstein (Deutschland) |
| `basemap.at` und `mapsneu.wien.gv.at` (Kartenkacheln) | nur auf der Seite „Karte“, nur online und nur, solange kein Kartenpaket geladen ist | Anfrage mit IP-Adresse und dem gezeigten Kartenausschnitt | basemap.at (Verwaltungsgrundkarte Österreich, eine Kooperation der Bundesländer), ausgeliefert über Server der Stadt Wien |
| nichts sonst | – | – | – |

- **Nicht mehr dabei seit 0.7.2:** Die Online-Karte holte ihr Programm (Leaflet) bei jedem Start von cdnjs (Cloudflare). Jetzt liegt es in der App.
- **Nicht im Store-Build:**
  - der App-Updater (`latest.json`),
  - der interne Kanal.
- **Bleibt auf dem Gerät:**
  - Notizen, Tresor, Heft, Vorhaben, Spiel-Log,
  - Antworten auf Fragen (Alter für Pakete ab 18, Mein Tag),
  - Diktat-Aufnahmen mit dem Mikrofon.
- **Vorlesen und Anhören** nutzen die Stimme des Systems. Ob das System dafür ins Netz geht, entscheidet das Betriebssystem, nicht die App. Auf dem Mac und unter iOS sind die deutschen Stimmen lokal; unter Windows und Android prüfe ich das mit dem Build.
- **Werbung, Analyse, Absturzberichte, Konten, Anmeldung in der App:** gibt es nicht.

## 2. Protokolle bei Hetzner (geprüft am 08.10.2026)
- **Was ich geprüft habe:** Workflow „Bucket prüfen“ (`.github/workflows/bucket-pruefen.yml`, ändert nichts), Lauf 37694403225.
- **Protokollierung der Zugriffe:** Hetzner antwortet „not implemented“. Der Speicher kann keine Zugriffsprotokolle schreiben, wir haben also keine.
- **Ordner im Bucket:** Es gibt nur `app/`, `intern/`, `katalog/` und `pakete/`, keinen Protokoll-Ordner. Mit diesen Zugangsdaten gibt es keinen zweiten Bucket, in den Protokolle laufen könnten.
- **Lebenszyklus und CORS:** nichts eingestellt.
- **Freigabe:** nur öffentliches Lesen der Dateien.
- **Offen, nicht von hier prüfbar:**
  - ob und wie lange Hetzner selbst Betriebsprotokolle (etwa IP-Adressen gegen Angriffe) aufhebt.
  - Steht das nicht in Hetzners Datenschutzerklärung, fragt Mik beim Support. Zusätzlich braucht es mit Hetzner einen Vertrag zur Auftragsverarbeitung; der lässt sich in der Hetzner-Konsole abschließen.
- **Web-Version** (nicht Teil der Store-Apps): Sie liegt bei Vercel. Vercel hebt Anfrage-Protokolle je nach Tarif kurz auf. Das gehört in die Datenschutzerklärung der Webseite, nicht in die Store-Angaben.

## 3. Apple: App-Datenschutz (App Store Connect)
- **Frage „Erheben Sie oder Ihre Partner Daten von dieser App?“:** **Nein, keine Daten erhoben.**
  - Begründung: Apple zählt Daten als erhoben, wenn sie das Gerät verlassen und länger aufgehoben werden, als für die Anfrage nötig ist.
  - Die IP-Adresse beim Laden eines Pakets dient nur der Antwort, und der Speicher protokolliert nicht (Abschnitt 2).
  - Die Kartenkacheln kommen von einem öffentlichen Dienst der Verwaltung ohne Konto und ohne Kennung.
- **Tracking:** Nein.
- **Bedingung:** Bestätigt Hetzner längere Betriebsprotokolle mit IP-Adresse, ändert sich die Angabe. Dann gilt: „Kennungen → nicht mit dir verknüpft, nicht für Tracking, Zweck App-Funktion“.
- **Exportangabe** (Verschlüsselung):
  - Tresor (Argon2, ChaCha20-Poly1305), Signaturen (Ed25519), HTTPS.
  - Das sind Standardverfahren, also befreit.
  - In der `Info.plist` kommt `ITSAppUsesNonExemptEncryption` = `false` dazu, wenn es den iOS-Build gibt. Für den Mac-Store-Build setze ich es mit dem ersten Store-Build.
- **Zugriffe mit Begründung:**
  - nur das Mikrofon: „Für Sprachnotizen (Diktat) in Notizen und Tresor. Aufnahmen bleiben auf diesem Gerät.“
  - Den Kamera-Hinweis gibt es seit 0.7.2 nicht mehr.
- **Datenschutz-Adresse:** `…/datenschutz.html`. Dort fehlen noch Anschrift und Kontakt (Startreife-Liste, Mik).

## 4. Google Play: Datensicherheit (Play Console)
- **Erhebt oder teilt die App Nutzerdaten der verlangten Arten?** **Nein.**
  - Daten, die nur kurz im Speicher verarbeitet werden, um eine Anfrage zu beantworten, zählen bei Google nicht als erhoben.
  - Die Bedingung aus Abschnitt 3 gilt auch hier.
- **Verschlüsselung bei der Übertragung:** Ja, alles läuft über HTTPS.
- **Daten löschen lassen:** entfällt, es gibt kein Konto und keine Daten bei uns. In der App löscht „Alles löschen“ alles auf dem Gerät.
- **Werbung:** Nein. **Zielgruppe:** ab 14, wie Pause; die Altersfreigabe der ganzen App muss noch entschieden werden (Startreife-Liste).
- **Gesundheits-Apps:** Notfall und Erste Hilfe sind Informationen, keine Medizinprodukt-Funktion. Das wird in der Erklärung zu Gesundheits-Apps angegeben. Die Naturheilkunde ist nicht im Store-Build.

## 5. Was vor dem Einreichen noch fehlt
1. Anschrift und Kontakt im Impressum und in der Datenschutzerklärung (Mik).
2. Antwort von Hetzner zu Betriebsprotokollen, Vertrag zur Auftragsverarbeitung (Mik).
3. Datenschutzerklärung der Webseite ergänzen:
   - „Die App selbst“ mit den zwei Zielen aus Abschnitt 1.
   - Hinweis auf die Karte von basemap.at.
   - Ich schreibe das, sobald die Anschrift da ist.
