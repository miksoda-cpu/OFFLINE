// App-Befehle stehen unter der Berechtigungsliste von Tauri (App-Manifest): Erlaubt sind sie nur über
// capabilities/default.json, also im Fenster „main“ bei lokaler Herkunft (tauri://localhost, http(s)://tauri.localhost).
// Der Modulserver (http://127.0.0.1:…) ist für Tauri eine fremde Adresse und bekommt keinen einzigen Befehl
// (SICHERHEIT.md, Module, dritte Sicherung). Neue Befehle hier und in permissions/app.toml eintragen; der Test
// `berechtigungen::befehlsliste_vollstaendig` prüft, dass die Listen zu generate_handler! passen.
const BEFEHLE: &[&str] = &[
        "datenordner", "installierte", "paket_lesen", "einspielen_ordner", "einspielen_bytes", "entfernen",
        "stick_suchen", "aufraeumen_start", "abo_lesen", "abo_schreiben", "verbindung_melden", "speicherort_setzen",
        "katalog_laden", "paket_laden", "download_abbrechen", "updates_jetzt", "abo_status", "lokal_url", "kiwix_url",
        "fenster_oeffnen", "alles_loeschen", "app_info", "downloads_offen", "tresor_status", "tresor_anlegen",
        "tresor_oeffnen", "tresor_oeffnen_code", "tresor_sperren", "tresor_sperre_setzen", "tresor_notizen",
        "tresor_notiz_schreiben", "tresor_notiz_loeschen", "tresor_notfallmappe", "tresor_anhang_aus_datei",
        "tresor_anhang_lesen", "tresor_anhang_loeschen", "tresor_passwort_aendern", "tresor_code_erneuern",
        "tresor_sichern", "tresor_zurueckspielen", "tresor_anhang_bytes", "notiz_anhang_aus_datei",
        "notiz_anhang_bytes", "notiz_anhang_lesen", "notiz_anhang_loeschen", "app_update_pruefen",
        "app_update_installieren", "app_neustart", "modul_oeffnen", "modul_schliessen", "modul_speicher_lesen",
        "modul_speicher_schreiben", "module_stand", "modul_aktiv_setzen", "modul_loeschen", "modul_test_oeffnen",
        "drucken", "vorschau_katalog", "vorschau_ordner", "vorschau_installiert", "lokale_pakete", "skin_stand",
        "skin_aktivieren", "skin_css",
];

fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(BEFEHLE)))
        .expect("tauri-build");
}
