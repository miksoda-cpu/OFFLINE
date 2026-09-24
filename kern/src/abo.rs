//! Update-Abo: Wann ist eine Prüfung fällig? Reine Logik, ohne Netz und ohne Uhr – die App reicht die Zeit herein.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Intervall {
    Taeglich,
    Woechentlich,
    Monatlich,
    Manuell,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Einstellungen {
    pub aktiv: bool,
    pub intervall: Intervall,
    /// keine Downloads über getaktete Verbindungen (Hotspot, Mobilfunk)
    pub nur_wlan: bool,
    /// nur innerhalb eines Zeitfensters (lokale Zeit, "HH:MM")
    pub fenster: bool,
    pub von: String,
    pub bis: String,
    /// Katalog-URL des Update-Servers
    pub katalog_url: String,
}

impl Default for Einstellungen {
    fn default() -> Self {
        Self {
            aktiv: true,
            intervall: Intervall::Woechentlich,
            nur_wlan: true,
            fenster: true,
            von: "02:00".into(),
            bis: "05:00".into(),
            katalog_url: "https://offline-pakete.fsn1.your-objectstorage.com/katalog/katalog.json".into(),
        }
    }
}

/// Zustand des Abos zwischen zwei Prüfungen (wird als abo.json gespeichert).
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, Eq)]
pub struct Zustand {
    /// Unix-Sekunden der letzten erfolgreichen Prüfung
    pub letzte_pruefung: Option<i64>,
    /// `erstellt` des zuletzt akzeptierten Katalogs – Rollback-Schutz
    pub katalog_erstellt: Option<String>,
    pub letzter_fehler: Option<String>,
}

/// Was die App über die Verbindung weiß. `getaktet: None` = unbekannt (macOS/Linux ohne Auskunft).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Verbindung {
    pub online: bool,
    pub getaktet: Option<bool>,
}

fn minuten(hhmm: &str) -> Option<u32> {
    let (h, m) = hhmm.split_once(':')?;
    let (h, m): (u32, u32) = (h.parse().ok()?, m.parse().ok()?);
    (h < 24 && m < 60).then_some(h * 60 + m)
}

/// Liegt `jetzt_hhmm` im Fenster von..bis? Ein Fenster darf über Mitternacht gehen (22:00–05:00).
pub fn im_fenster(von: &str, bis: &str, jetzt_hhmm: &str) -> bool {
    let (Some(v), Some(b), Some(j)) = (minuten(von), minuten(bis), minuten(jetzt_hhmm)) else { return true };
    if v == b {
        return true;
    }
    if v < b { v <= j && j < b } else { j >= v || j < b }
}

pub fn abstand_sekunden(i: &Intervall) -> Option<i64> {
    match i {
        Intervall::Taeglich => Some(24 * 3600),
        Intervall::Woechentlich => Some(7 * 24 * 3600),
        Intervall::Monatlich => Some(30 * 24 * 3600),
        Intervall::Manuell => None,
    }
}

/// Warum gerade nicht geprüft wird – als Klartext für die Oberfläche; `None` heißt: jetzt prüfen.
pub fn warum_nicht(e: &Einstellungen, z: &Zustand, v: Verbindung, jetzt_unix: i64, jetzt_hhmm: &str) -> Option<&'static str> {
    if !e.aktiv {
        return Some("Abo pausiert");
    }
    let Some(abstand) = abstand_sekunden(&e.intervall) else { return Some("nur manuell") };
    if let Some(l) = z.letzte_pruefung {
        if jetzt_unix - l < abstand {
            return Some("noch nicht fällig");
        }
    }
    if !v.online {
        return Some("offline");
    }
    if e.nur_wlan && v.getaktet == Some(true) {
        return Some("getaktete Verbindung");
    }
    if e.fenster && !im_fenster(&e.von, &e.bis, jetzt_hhmm) {
        return Some("außerhalb des Zeitfensters");
    }
    None
}

pub fn faellig(e: &Einstellungen, z: &Zustand, v: Verbindung, jetzt_unix: i64, jetzt_hhmm: &str) -> bool {
    warum_nicht(e, z, v, jetzt_unix, jetzt_hhmm).is_none()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fenster_auch_ueber_mitternacht() {
        assert!(im_fenster("02:00", "05:00", "03:30"));
        assert!(!im_fenster("02:00", "05:00", "05:00"));
        assert!(!im_fenster("02:00", "05:00", "12:00"));
        assert!(im_fenster("22:00", "05:00", "23:59"));
        assert!(im_fenster("22:00", "05:00", "00:10"));
        assert!(!im_fenster("22:00", "05:00", "12:00"));
        assert!(im_fenster("x", "y", "12:00"), "kaputte Eingabe blockiert nicht");
    }

    #[test]
    fn faelligkeit() {
        let mut e = Einstellungen { fenster: false, ..Default::default() };
        let on = Verbindung { online: true, getaktet: Some(false) };
        let z = Zustand::default();
        assert_eq!(warum_nicht(&e, &z, on, 1_000_000, "12:00"), None, "nie geprüft → fällig");
        let z2 = Zustand { letzte_pruefung: Some(1_000_000), ..Default::default() };
        assert_eq!(warum_nicht(&e, &z2, on, 1_000_000 + 3 * 86_400, "12:00"), Some("noch nicht fällig"));
        assert_eq!(warum_nicht(&e, &z2, on, 1_000_000 + 8 * 86_400, "12:00"), None);
        assert_eq!(warum_nicht(&e, &z, Verbindung { online: false, getaktet: None }, 0, "12:00"), Some("offline"));
        assert_eq!(warum_nicht(&e, &z, Verbindung { online: true, getaktet: Some(true) }, 0, "12:00"), Some("getaktete Verbindung"));
        assert_eq!(warum_nicht(&e, &z, Verbindung { online: true, getaktet: None }, 0, "12:00"), None, "unbekannt zählt nicht als getaktet");
        e.fenster = true;
        assert_eq!(warum_nicht(&e, &z, on, 0, "12:00"), Some("außerhalb des Zeitfensters"));
        assert_eq!(warum_nicht(&e, &z, on, 0, "03:00"), None);
        e.intervall = Intervall::Manuell;
        assert_eq!(warum_nicht(&e, &z, on, 0, "03:00"), Some("nur manuell"));
        e.aktiv = false;
        assert_eq!(warum_nicht(&e, &z, on, 0, "03:00"), Some("Abo pausiert"));
    }
}
