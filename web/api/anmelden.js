// Anmeldung für das Gratis-Paket.
// Leitet an Ghosts öffentliche Mitglieder-Schnittstelle weiter (dieselbe, die Ghost Portal nutzt).
// Ghost verschickt die Bestätigungsmail (Double-Opt-In); erst nach dem Klick ist man Mitglied
// und sieht die Download-Seite. Kein geheimer Schlüssel nötig.

const GHOST_URL = (process.env.GHOST_URL || "https://digioneer.pro").replace(/\/$/, "");
const NEWSLETTER = process.env.OFFLINE_NEWSLETTER || "OFFLINE";
const DOWNLOAD_URL = process.env.OFFLINE_DOWNLOAD_URL || `${GHOST_URL}/offline-download/`;
const LABEL = "offline";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function antwort(status, body) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request) {
  let d;
  try { d = await request.json(); } catch { return antwort(400, { fehler: "Ungültige Anfrage." }); }

  // Honeypot: Menschen sehen das Feld nicht, Bots füllen es aus.
  if (d.website) return antwort(200, { ok: true });

  const vorname = String(d.vorname || "").trim().slice(0, 80);
  const nachname = String(d.nachname || "").trim().slice(0, 80);
  const email = String(d.email || "").trim().toLowerCase().slice(0, 200);
  const newsletter = d.newsletter === true;

  if (vorname.length < 2 || nachname.length < 2) return antwort(400, { fehler: "Bitte gib deinen Vor- und Nachnamen an." });
  if (!EMAIL.test(email)) return antwort(400, { fehler: "Diese E-Mail-Adresse sieht nicht richtig aus." });

  const kopf = {
    "content-type": "application/json",
    "referer": DOWNLOAD_URL,
    "origin": GHOST_URL,
    "user-agent": "OFFLINE-Anmeldung/1.0",
  };
  const ip = request.headers.get("x-forwarded-for");
  if (ip) kopf["x-forwarded-for"] = ip.split(",")[0].trim();

  // Neuere Ghost-Versionen verlangen ein Integritäts-Token gegen Spam.
  let integrityToken;
  try {
    const t = await fetch(`${GHOST_URL}/members/api/integrity-token/`, { headers: { "user-agent": kopf["user-agent"] } });
    if (t.ok) integrityToken = (await t.text()).trim();
  } catch { /* ältere Ghost-Version: ohne Token weiter */ }

  const body = {
    email,
    name: `${vorname} ${nachname}`,
    emailType: "signup",
    labels: [LABEL],
    // Newsletter nur mit ausdrücklicher Zustimmung (§ 174 TKG, Art. 7 DSGVO)
    newsletters: newsletter ? [{ name: NEWSLETTER }] : [],
    redirect: DOWNLOAD_URL,
    ...(integrityToken ? { integrityToken } : {}),
  };

  let res;
  try {
    res = await fetch(`${GHOST_URL}/members/api/send-magic-link/`, { method: "POST", headers: kopf, body: JSON.stringify(body) });
  } catch {
    return antwort(502, { fehler: "Der Anmeldedienst ist gerade nicht erreichbar. Bitte versuch es später noch einmal." });
  }

  if (res.ok) return antwort(200, { ok: true });

  const text = await res.text().catch(() => "");
  console.error("Ghost send-magic-link", res.status, text.slice(0, 500));
  if (res.status === 429) return antwort(429, { fehler: "Zu viele Anmeldungen in kurzer Zeit. Bitte versuch es in ein paar Minuten noch einmal." });
  if (/newsletter/i.test(text)) return antwort(502, { fehler: "Der Newsletter ist noch nicht eingerichtet. Bitte melde dich ohne Newsletter an oder versuch es später." });
  return antwort(502, { fehler: "Die Anmeldung hat nicht geklappt. Bitte versuch es später noch einmal." });
}

export function GET() {
  return antwort(405, { fehler: "Nur POST." });
}
