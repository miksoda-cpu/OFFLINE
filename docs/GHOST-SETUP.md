> **Status: zurückgestellt** (24.09.2026) – Formular ist live abgeschaltet. Wiederaufnahme: siehe „Offene Punkte“ in KONZEPT.md.

# OFFLINE × Ghost – Einrichtung

Die Anmeldung für das Gratis-Paket läuft über die Mitglieder von The Digioneer (Ghost auf digioneer.pro).
Das Formular auf der OFFLINE-Seite schickt Name und E-Mail an Ghosts öffentliche Anmelde-Schnittstelle, die auch Ghost Portal nutzt – ohne geheimen Schlüssel.

## Ablauf

```
OFFLINE-Seite (Vercel)          Ghost (digioneer.pro)                 Person
─────────────────────           ─────────────────────                 ──────
Formular: Vorname, Nachname,
E-Mail, [ ] Newsletter
      │ POST /api/anmelden
      ▼
Vercel-Funktion ──────────────► /members/api/send-magic-link/
                                emailType: signup
                                labels: ["offline"]
                                newsletters: [OFFLINE] (nur mit Häkchen)
                                redirect: /offline-download/
                                      │
                                      └─ Bestätigungsmail ──────────► klickt Link
                                                                          │
                                Mitglied angelegt (Double-Opt-In) ◄──────┘
                                → landet auf /offline-download/ (nur für Mitglieder)
```

## Was du in Ghost einmal einstellen musst

1. **Settings → Membership → Portal / Access:** „Anyone can sign up“ (kostenlose Anmeldung erlauben).
2. **Settings → Newsletters → Add newsletter:** Name exakt **`OFFLINE`**.
   - „Subscribe new members on signup“ **aus** – sonst bekommen alle Mitglieder automatisch den OFFLINE-Newsletter, auch ohne Häkchen.
   - Absendername z. B. „OFFLINE · The Digioneer“.
   - Bei den bestehenden Newslettern von The Digioneer prüfen, ob „Subscribe new members on signup“ an ist. Wenn ja, bekommen OFFLINE-Anmeldungen auch den Digioneer-Newsletter – rechtlich nur zulässig, wenn das im Formular steht. Empfehlung: für Anmeldungen über OFFLINE vorerst aus lassen oder das Formular um ein zweites Häkchen „The Digioneer“ erweitern (sag Bescheid).
3. **Seite anlegen:** Pages → New page, URL-Slug **`offline-download`**, Sichtbarkeit **Members only**. Text-Vorschlag unten.
4. **Test:** Auf der OFFLINE-Seite mit einer eigenen Adresse anmelden → Mail kommt → Klick → landet auf der Download-Seite → im Ghost-Admin unter Members mit Label `offline`.

Andere Adressen oder Namen? In Vercel unter Settings → Environment Variables setzen:

| Variable | Standard |
|---|---|
| `GHOST_URL` | `https://digioneer.pro` |
| `OFFLINE_NEWSLETTER` | `OFFLINE` |
| `OFFLINE_DOWNLOAD_URL` | `https://digioneer.pro/offline-download/` |

## Text für die Download-Seite (Members only)

> **Titel:** Dein OFFLINE-Paket
>
> Servus und willkommen bei OFFLINE – schön, dass du dabei bist.
>
> OFFLINE bringt Wissen auf deinen Rechner, das auch dann da ist, wenn das Netz weg ist: Notrufe und Sirenensignale, Blackout-Vorsorge, die Karte von Österreich und Wikipedia auf Deutsch.
>
> **Stand heute:** Die Desktop-App für Windows, macOS und Linux ist in Arbeit. Du bekommst Bescheid, sobald der erste Download bereitsteht. Bis dahin kannst du den Prototyp im Browser ausprobieren – er funktioniert nach dem ersten Öffnen auch offline: [Prototyp öffnen](https://DEINE-VERCEL-ADRESSE/app.html)
>
> **Schon jetzt für dich:** Die Blackout-Checkliste im Prototyp. Druck sie aus und häng sie an den Kühlschrank.
>
> Du willst mehr? Mit **OFFLINE Pro** bekommst du das Update-Abo, das Österreich-Paket nach Bundesland und die Kurse der digitalworld Academy. (Kommt bald.)

## Später: OFFLINE Pro als bezahlte Stufe in Ghost

- **Settings → Membership → Tiers:** Stufe „OFFLINE Pro“, 4,90 €/Monat oder 45 €/Jahr (Stripe verbinden).
- Die Pro-Download-Seite bekommt Sichtbarkeit „Specific tiers → OFFLINE Pro“.
- Der Lizenzschlüssel für die App wird später aus dem Ghost-Mitgliedsstatus abgeleitet (Phase 5 im Konzept).
- **Umsatzsteuer beachten:** Digitale Leistungen an Privatpersonen in der EU – Steuersatz des Wohnsitzlandes (OSS-Verfahren). Mit Steuerberatung klären, ob Stripe Tax genügt oder ein Merchant of Record (z. B. Paddle) einfacher ist.
