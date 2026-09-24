//! Heutiges Datum als "JJJJ-MM-TT" ohne Zusatzbibliothek (für Gültigkeitsfenster der Schlüssel).

use std::time::{SystemTime, UNIX_EPOCH};

/// Kalendertag aus Tagen seit 1970-01-01 (Howard Hinnants Algorithmus).
fn ziviles_datum(tage: i64) -> (i64, u32, u32) {
    let z = tage + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    (if m <= 2 { y + 1 } else { y }, m, d)
}

pub fn heute() -> String {
    let s = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0);
    tag_aus_sekunden(s)
}

pub fn tag_aus_sekunden(sekunden: i64) -> String {
    let (j, m, t) = ziviles_datum(sekunden.div_euclid(86_400));
    format!("{j:04}-{m:02}-{t:02}")
}

/// Jetzt als ISO-8601 (UTC, Sekunden) – für den Vergleich mit `gueltig_bis` im Katalog.
pub fn jetzt_iso() -> String {
    let s = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0);
    let rest = s.rem_euclid(86_400);
    format!("{}T{:02}:{:02}:{:02}Z", tag_aus_sekunden(s), rest / 3600, (rest % 3600) / 60, rest % 60)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn bekannte_tage() {
        assert_eq!(tag_aus_sekunden(0), "1970-01-01");
        assert_eq!(tag_aus_sekunden(951_782_400), "2000-02-29");
        assert_eq!(tag_aus_sekunden(1_790_245_911), "2026-09-24");
    }
}
