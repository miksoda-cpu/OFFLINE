// OFFLINE – Brücke im Modul. Die App fügt diese Datei als erstes Skript in inhalt/modul/index.html ein
// (kern/src/modulserver.rs) und setzt vorher den Platzhalter unten auf {"version": "…", "alter": null}.
// Das Modul läuft in einer Sandbox ohne Netz und ohne eigene Herkunft; es erreicht die App nur über postMessage.
// Was die App davon annimmt, entscheidet allein die Gegenseite (web/modul-host.js). Umfang: PAKET-KIT.md Abschnitt 5.
(function () {
  "use strict";
  var info = __OFFLINE_INFO__;

  // WebRTC geht an der Content-Security-Policy vorbei (STUN/TURN über UDP ins Internet). Module brauchen es nicht:
  // weg damit, bevor das Modul läuft. Unterrahmen sind in der Sandbox fremd, von dort holt es niemand zurück
  // (geprüft mit werkzeug/testmodule/boese). Dazu CSP „webrtc 'block'“ im Modulserver, wo die Engine sie kennt.
  // Windows (WebView2) schleust Tauris IPC und den WebView2-Kanal auch in Unterrahmen ein. Aufrufe von hier bleiben
  // wirkungslos (Windows-Probe 29.09.), trotzdem vor dem Modulcode abräumen.
  ["__TAURI_INTERNALS__", "__TAURI__", "__TAURI_IPC__", "__TAURI_METADATA__", "ipc"].forEach(function (n) {
    try { delete window[n]; } catch (e) {}
    try { Object.defineProperty(window, n, { value: undefined, writable: false, configurable: false }); } catch (e) {}
  });
  try { if (window.chrome && window.chrome.webview) { try { delete window.chrome.webview; } catch (e) {} if (window.chrome.webview) Object.defineProperty(window.chrome, "webview", { value: undefined, writable: false, configurable: false }); } } catch (e) {}
  try { if (window.chrome && window.chrome.webview) Object.defineProperty(window, "chrome", { value: undefined, writable: false, configurable: false }); } catch (e) {}
  ["RTCPeerConnection", "webkitRTCPeerConnection", "mozRTCPeerConnection"].forEach(function (n) {
    try { delete window[n]; } catch (e) {}
    try { Object.defineProperty(window, n, { value: undefined, writable: false, configurable: false }); } catch (e) {}
  });
  var eltern = window.parent;
  var warten = new Map();
  var n = 0;

  window.addEventListener("message", function (e) {
    if (e.source !== eltern) return;
    var m = e.data;
    if (!m || m.offline !== 1 || typeof m.id !== "number" || !warten.has(m.id)) return;
    var w = warten.get(m.id);
    warten.delete(m.id);
    if (m.ok) w[0](m.wert === undefined ? null : m.wert);
    else w[1](new Error(String(m.fehler || "Aufruf abgelehnt")));
  });

  function rufe(aufruf, daten) {
    return new Promise(function (ja, nein) {
      var id = ++n;
      warten.set(id, [ja, nein]);
      eltern.postMessage({ offline: 1, id: id, aufruf: aufruf, daten: daten }, "*");
    });
  }

  var api = {
    version: String(info.version),
    alter: function () { return info.alter; },
    speicher: Object.freeze({
      lesen: function (schluessel) { return rufe("speicher.lesen", { schluessel: schluessel }); },
      schreiben: function (schluessel, wert) { return rufe("speicher.schreiben", { schluessel: schluessel, wert: wert }); },
    }),
    vorlesen: function (text) { return rufe("vorlesen", { text: String(text) }); },
    drucken: function (html) { return rufe("drucken", { html: String(html) }); },
    wesen: Object.freeze({ sagen: function (text) { return rufe("wesen.sagen", { text: String(text) }); } }),
    // Ab App 0.4.0: Ergebnisse ins Spiel-Log am Gerät (Pause). Nur eigene Einträge sind lesbar.
    spiel: Object.freeze({
      melden: function (m) { return rufe("spiel.melden", m); },
      liste: function () { return rufe("spiel.liste"); },
    }),
  };
  Object.defineProperty(window, "offline", { value: Object.freeze(api), writable: false, configurable: false, enumerable: true });
})();
