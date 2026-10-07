# Rückmeldung: Startreife – was technisch bis zu den Stores fehlt

**Von:** Code (lokale Session) · **Datum:** 2026-10-07 · **Auftrag:** Liste „Startreife“ (Bill, 07.10., über Mik; Nr. 18) · Stand: 0.7.1

Es geht nur um Technik, nicht um Inhalte. Jede Zeile sagt, was fehlt und wer es tun muss:
- **Mik:** Konten, Verträge, Geld, Firmendaten.
- **Code:** Bauen, Einstellen, Testen.
- **Entscheiden:** eine Frage an Mik und Bill.

Store-Regeln stehen hier so, wie ich sie kenne. Vor jeder Einreichung prüfe ich sie gegen die aktuellen Richtlinien, denn die Stores ändern sie jedes Jahr.

## Kurz
- **Mac und Windows:** Die App läuft und baut sich bei jedem Tag selbst.
  - Es fehlen die **Signaturen**. Ohne sie warnen beide Systeme beim Öffnen.
  - Für den Start als Download reicht das: Signatur, Notarisierung, Impressum.
  - In die Stores (Mac App Store, Microsoft Store) muss man nicht; das ist eine eigene Entscheidung, siehe unten.
- **iPhone und Android:** Es gibt noch **keinen Build**. Die Handy-Version ist beschlossen, aber nicht angefangen.
  - Der größte Brocken ist Wikipedia und Wikivoyage: Am Handy darf `kiwix-serve` nicht als eigenes Programm laufen.
  - Bis dahin läuft die Web-Version im Browser am iPhone und am Android-Handy, auch offline.
- **Für alle Stores gilt:** Impressum und Datenschutz brauchen Anschrift und Kontakt. Die Beschreibung verspricht noch „lokale KI“. Vor dem Bezahlen (Pro, Schließfach) muss entschieden sein, wie in den Stores bezahlt wird.

## Für alle Plattformen
| Was | Stand | Wer |
|---|---|---|
| **Impressum** (E-Commerce-Gesetz § 5, Mediengesetz § 25) | fehlt auf der Webseite | Mik: Daten; Code: Seite |
| **Datenschutz:** Anschrift und Kontakt-E-Mail | Platzhalter „werden ergänzt“ in `web/datenschutz.html` | Mik: Daten; Code: einsetzen |
| **Support-Adresse** (alle Stores verlangen eine Adresse oder Webseite) | fehlt | Mik |
| **Beschreibung ehrlich:** `longDescription` in `tauri.conf.json` verspricht „lokale KI“; die gibt es nicht. Stores lehnen Versprechen ohne Funktion ab. | falsch | Code (nach Bills Wortlaut) |
| **Hilfetext „Lizenzschlüssel bei Pro“** (`web/hilfe.js`, Datenschutz): Pro gibt es noch nicht, die App sendet keinen Schlüssel | stimmt nicht | Code; Wortlaut Bill |
| **Bezahlen** (Pro, Pro+, Schließfach, Kauf von Modulen): In `web/app.js` steht „Kauf oder Abo (offen)“. Am iPhone und bei Google gilt für digitale Inhalte der Kauf über den Store (15–30 %) oder in der EU ein Alternativweg nach dem Digital Markets Act (DMA), mit eigenen Gebühren. | nicht gebaut | **Entscheiden:** Start gratis ohne Kauf, oder mit Store-Kauf |
| **Altersfreigabe:** Fragebögen in jedem Store. `lumi-philosophie` hat `alter_ab: 18` und ist in der App ladbar. Entweder gilt die Freigabe der ganzen App, oder die App sperrt das Paket nach Alter. | offen | **Entscheiden**; Code baut die Sperre |
| **Medizinische Inhalte:** Notfall und Erste Hilfe brauchen in den Stores Quellen und einen Hinweis „ersetzt keinen Arzt“. Google verlangt dafür eine Erklärung zu Gesundheits-Apps. | Quellen da, Hinweis prüfen | Code |
| **Interner Kanal:** Ein Freischalt-Link, der versteckte Inhalte öffnet, gilt bei Apple als verborgene Funktion und wird abgelehnt. Die Store-Builds bauen den Kanal deshalb nicht ein; er bleibt im Direkt-Download. | im Code überall drin | Code: Schalter beim Bauen |
| **Eigener Updater:** Store-Apps dürfen sich nicht selbst aktualisieren. | Updater immer an | Code: Store-Build ohne Updater (Schalter `tls` gibt es schon) |
| **Datenschutz-Angaben im Store** (Apple: App-Datenschutz, Google: Datensicherheit) | noch nicht ausgefüllt | Code: Entwurf; Mik: einreichen |
| **Server-Protokolle:** Auch ohne Telemetrie sieht der Paket-Server IP-Adressen. Für die Angabe „keine Daten gesammelt“ muss klar sein, ob Hetzner die Zugriffe protokolliert und wie lange. | ungeklärt | Code prüft den Bucket, Mik bestätigt |
| **Verschlüsselung** (Exportangabe bei Apple, Frage bei Google): Der Tresor nutzt Argon2 und ChaCha20-Poly1305, die Pakete Ed25519. Das sind Standardverfahren und damit meist befreit; die Angabe muss trotzdem gemacht werden. | offen | Code: Eintrag `ITSAppUsesNonExemptEncryption`; Mik: Angabe |
| **Händlerstatus in der EU** (Digital Services Act, DSA): Apple und Google zeigen von Firmen öffentlich Anschrift, Telefon und E-Mail. | offen | Mik |
| **Gigabyte-Test am Mac** (Gesamtkonzept: „ausstehend“): große ZIM-Pakete laden, einspielen, abbrechen, wieder aufnehmen | offen | Code |

## Mac
**Stand:** Builds für Apple-Chip und Intel als `.dmg`. Ad-hoc signiert; das reicht nur zum Testen. Updater signiert, `latest.json` auf Hetzner.

**Für den Download von der Webseite:**
1. **Apple Developer Program** als Firma (99 $ im Jahr; für die digitalworld Academy OG mit D-U-N-S-Nummer, die Vergabe dauert Tage bis Wochen). Mik.
2. **Zertifikat „Developer ID Application“** und ein App-spezifisches Passwort. Als Secrets `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`. Das Eintragen übernimmt Mik; ich tippe keine Schlüssel.
3. **Workflow umstellen** von ad-hoc auf echte Signatur mit Hardened Runtime und Notarisierung. `kiwix-serve` wird mitsigniert. Code.
4. **Rechte prüfen:** Hardened Runtime braucht für die Module die Berechtigung für JIT und WebAssembly. Ich teste das mit der Spiele-Probe am signierten Build. Code.
5. **Kamera-Hinweis entfernen:** `Info.plist` erklärt die Kamera, die App nutzt sie nicht. Mikrofon (Diktat) bleibt. Code.
6. **Universal-Build** (ein `.dmg` für beide Chips) statt zwei. Nicht nötig, aber einfacher für Nutzer. Code.
7. **Mindestversion von macOS** festlegen und testen. Heute ist nichts eingetragen, es gilt die Vorgabe von Tauri. Code.

**Zusätzlich für den Mac App Store**, falls gewünscht:
- **Sandbox:**
  - `kiwix-serve` muss mit geerbter Sandbox signiert sein.
  - Der lokale Server braucht das Recht `network.server`.
  - „Datenträger durchsuchen“ (`/Volumes`) geht in der Sandbox nicht; es bleibt nur „Ordner wählen“ mit gemerkter Freigabe.
- **Kein eigener Updater**, siehe oben.
- **Zertifikate „Mac App Distribution“ und „Installer“**, Eintrag in App Store Connect, Bildschirmfotos.
- **Meine Empfehlung:** zuerst nur der Download, der App Store später.

## Windows
**Stand:** Installer `.exe` und `.msi` (x64). Updater signiert. Die Windows-Probe ist grün: 49 von 49 Angriffen blockiert.

1. **Code-Signing-Zertifikat:** Am günstigsten ist für eine Firma in der EU Azure Trusted Signing (Konto bei Microsoft, Firmenprüfung). Sonst ein OV-Zertifikat. Ohne Zertifikat warnt SmartScreen mit „Unbekannter Herausgeber“. Mik: Konto; Code: Workflow.
2. **WebView2 ohne Netz:** Heute lädt der Installer WebView2 aus dem Netz nach, wenn es fehlt. Windows 11 hat es, ältere Windows 10 oft nicht. Für eine App, die ohne Netz funktionieren soll, braucht es einen Installer, der WebView2 mitbringt (rund 130 MB mehr). Ein Vorschlag wäre ein zweiter Installer „für Rechner ohne Netz“. **Entscheiden;** Code baut.
3. **Windows auf ARM** (Surface, neue Notebooks): Heute gibt es keinen Build dafür. Er läuft über Emulation, aber langsam. Code, wenn gewünscht.
4. **Microsoft Store**, falls gewünscht:
   - Entwicklerkonto (für Firmen einmalig, Gebühr laut Microsoft).
   - Entweder den signierten `.msi` einreichen oder ein MSIX-Paket bauen; dann aktualisiert der Store und der eigene Updater ist aus.
   - Mik: Konto; Code: Paket.

## iPhone (und iPad)
**Stand:** Kein nativer Build. Tauri kann iOS bauen, aber `tauri ios init` ist nicht gemacht. Die Web-Version läuft heute in Safari und lässt sich zum Home-Bildschirm hinzufügen, auch offline.

1. **Apple Developer Program**, dasselbe Konto wie beim Mac. Mik.
2. **iOS-Projekt anlegen,** im Simulator und auf einem echten iPhone starten. Code.
3. **Wikipedia und Wikivoyage:**
   - Auf dem iPhone darf keine App ein zweites Programm starten, also läuft `kiwix-serve` dort nicht.
   - Es braucht die Kiwix-Bibliothek (libkiwix) direkt im Rust-Kern, oder ein eigenes Lesen der ZIM-Dateien in Rust.
   - Das ist der größte technische Brocken. Code; Aufwand schätze ich, wenn ich angefangen habe.
4. **Module mit Code** (Wichteln, Spiele):
   - Apple erlaubt Mini-Spiele und Mini-Apps in HTML5 unter Bedingungen: nachgeladener Code darf die App nicht grundlegend ändern; Mini-Apps brauchen ein Verzeichnis und eine Altersangabe.
   - Unsere Module passen dazu: Sie sind signiert, laufen in der Sandbox und kommen nur von uns.
   - In der Einreichung muss das erklärt sein. Code: Text; Mik: einreichen.
5. **Speicher:**
   - Große Pakete (Gigabyte) kommen nach der Installation über das Netz. Das ist erlaubt.
   - Auf dem Gerät müssen sie aus der iCloud-Sicherung ausgenommen sein, sonst lehnt Apple ab.
   - Code.
6. **USB-Stick:** Am iPhone geht das nur über die Dateien-App (Ordner wählen). Code.
7. **Bildschirmfotos** für die nötigen Gerätegrößen, **App-Symbol** in 1024 px (vorhanden sind 512 px), Datenschutz-Angaben, Exportangabe, Altersfreigabe. Code und Mik.
8. **Testflight** zum Testen vor dem Start. Mik lädt Tester ein.

## Android
**Stand:** Kein Build. Die Web-Version läuft in Chrome und lässt sich installieren.

1. **Google-Play-Konto** als Firma (einmalig 25 $, mit D-U-N-S-Nummer). Ein privates neues Konto müsste vor dem Start 14 Tage mit mindestens 12 Testern geschlossen testen. Mik.
2. **Android-Projekt anlegen** (`tauri android init`, Android-Werkzeuge im Workflow). Code.
3. **Pflichten von Google für native Teile:**
   - aktuelles Ziel-API: Google hebt es jedes Jahr an; 2026 voraussichtlich Android 16,
   - 16-KB-Speicherseiten für den Rust-Kern,
   - Format AAB.
   - Code.
4. **Wikipedia und Wikivoyage:** wie beim iPhone, libkiwix gibt es für Android. Wenn es für beide Handys gleich gebaut wird, ist es nur einmal Arbeit. Code.
5. **Signieren:** Upload-Schlüssel erzeugen; Google signiert die App („Play App Signing“). Den Schlüssel bewahrt Mik auf, im Workflow liegt er als Secret. Mik und Code.
6. **Formulare:** Datensicherheit, Altersfreigabe (IARC), Zielgruppe, Gesundheits-Apps, Werbung („keine“). Code: Entwurf; Mik: einreichen.
7. **Store-Bild** 1024 × 500, Bildschirmfotos, Symbol 512 px (vorhanden). Code.

## Offene Fehler
- **Bekannt und offen:** keine Absturz- oder Datenfehler. Tests auf drei Systemen und die Windows-Probe sind grün, der Rundgang zu 0.7.1 ist ohne Befund.
- **Offene Prüfungen:**
  - Sandbox-Probe in der App unter Linux.
  - Gigabyte-Test am Mac.
  - Signierter Mac-Build mit Hardened Runtime und WebAssembly; das kann erst mit dem Zertifikat geprüft werden.
- **Hinweis:** Die GitHub-Releases v0.7.0 und v0.7.1 stehen als Entwurf. Die App lädt ihre Updates von Hetzner, darum stört das nicht. Für Downloads von der Webseite sollte der Link auf Hetzner zeigen, nicht auf GitHub.

## Vorschlag für die Reihenfolge
1. **Mik:**
   - D-U-N-S-Nummer der Firma beantragen (dauert am längsten).
   - Damit das Apple Developer Program, das Google-Play-Konto und Azure Trusted Signing.
   - Dazu Anschrift und Kontakt für Impressum und Datenschutz.
2. **Code, sofort machbar ohne Konten:**
   - Beschreibung und Hilfetexte ehrlich machen.
   - Kamera-Hinweis entfernen.
   - Store-Build ohne Updater und ohne internen Kanal.
   - Sperre nach Alter für `alter_ab`.
   - Entwürfe für die Datenschutz-Angaben.
   - Gigabyte-Test am Mac.
3. **Mit den Konten:**
   - Mac und Windows signieren, als Download starten.
4. **Danach die Handys:**
   - Kiwix im Kern.
   - iOS- und Android-Projekt.
   - Testflight und geschlossener Test bei Google.
   - Einreichung.
5. **Entscheiden vor dem Handy-Start:**
   - gratis ohne Kauf oder mit Store-Kauf,
   - Altersfreigabe der ganzen App,
   - WebView2-Installer für Rechner ohne Netz,
   - Mac App Store und Microsoft Store ja oder nein.
