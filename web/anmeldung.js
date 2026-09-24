const form = document.getElementById("anmeldung");
const msg = document.getElementById("anmeldung-msg");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(form);
  const daten = {
    vorname: f.get("vorname"), nachname: f.get("nachname"), email: f.get("email"),
    website: f.get("website"), newsletter: form.newsletter.checked,
  };
  if (!form.checkValidity()) { zeige("Bitte fülle Vorname, Nachname und E-Mail-Adresse aus.", false); return; }
  if (!navigator.onLine) { zeige("Du bist gerade offline. Für die Anmeldung brauchst du kurz Internet.", false); return; }

  const knopf = form.querySelector("button[type=submit]");
  knopf.disabled = true; knopf.textContent = "Wird gesendet …";
  try {
    const res = await fetch("/api/anmelden", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(daten) });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      form.querySelectorAll("input, button").forEach((el) => (el.disabled = true));
      knopf.textContent = "Angefordert";
      zeige(`Danke, ${daten.vorname}! Schau in dein Postfach (${daten.email}) und bestätige die Anmeldung. Keine Mail da? Sieh im Spam-Ordner nach.`, true);
    } else {
      zeige(d.fehler || "Das hat nicht geklappt. Bitte versuch es noch einmal.", false);
      knopf.disabled = false; knopf.textContent = "Gratis-Paket anfordern";
    }
  } catch {
    zeige("Keine Verbindung zum Server. Bitte versuch es noch einmal.", false);
    knopf.disabled = false; knopf.textContent = "Gratis-Paket anfordern";
  }
});

function zeige(text, ok) {
  msg.textContent = text;
  msg.className = "form-msg " + (ok ? "ok" : "err");
}
