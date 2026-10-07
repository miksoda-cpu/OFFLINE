// Rätsel zum Knobeln (Auftrag 2026-10-07-14): Steuerung im Modul. Läuft in der Sandbox der App, ohne Netz, und spricht nur
// über window.offline mit ihr. Die App setzt in der Adresse: spiel, stufe (1–3), datum (JJJJ-MM-TT), n (das wievielte Spiel
// heute) und f (Farben aus dem Skin). Tagesrätsel: Der Startwert setzt sich aus Datum, Spiel, Stufe und n zusammen; alle
// Geräte bekommen damit dasselbe Rätsel, auch ohne Netz. Am Ende meldet das Modul das Ergebnis über offline.spiel.melden.
// Tatham-Rätsel: eigener Build aus Simon Tathams Quelltext (tatham/, Bau: pakete/spiele-1/tatham-bauen.sh), WebAssembly liegt
// im Paket (tatham/<name>.wasm.js), nie aus dem Netz. 2048: Logik von Gabriele Cirulli (2048/), Aussehen und Eingabe hier.
(function () {
  "use strict";

  var SPIELE = {
    lichter: { titel: "Lichter", tatham: "lightup", stufen: ["7x7b20s4d0", "7x7b20s4d1", "7x7b20s4d2"], groesse: ["7 × 7, leicht", "7 × 7, mittel", "7 × 7, schwer"],
      taste: "Punkt setzen", bedienung: "Tippen stellt eine Lampe. Mit „Punkt setzen“ markierst du Felder ohne Lampe." },
    netz: { titel: "Netz", tatham: "net", stufen: ["5x5", "7x7", "9x9"], groesse: ["5 × 5", "7 × 7", "9 × 9"],
      taste: "Rechtsherum", bedienung: "Tippen dreht ein Teil nach links, mit „Rechtsherum“ nach rechts." },
    muster: { titel: "Muster", tatham: "pattern", stufen: ["5x5", "10x10", "15x15"], groesse: ["5 × 5", "10 × 10", "15 × 15"],
      taste: "Leer markieren", bedienung: "Tippen oder ziehen färbt Felder. Mit „Leer markieren“ setzt du Punkte." },
    bruecken: { titel: "Brücken", tatham: "bridges", stufen: ["7x7i30e10m2d0", "7x7i30e10m2d1", "7x7i30e10m2d2"], groesse: ["7 × 7, leicht", "7 × 7, mittel", "7 × 7, schwer"],
      bedienung: "Zieh von Insel zu Insel. Noch einmal ziehen gibt eine zweite Brücke, ein drittes Mal nimmt sie weg." },
    minen: { titel: "Minen", tatham: "mines", stufen: ["9x9n10", "9x9n35", "16x16n40"], groesse: ["9 × 9, 10 Minen", "9 × 9, 35 Minen", "16 × 16, 40 Minen"],
      taste: "Fahne setzen", aufgeben: true, bedienung: "Tippen deckt auf. Mit „Fahne setzen“ markierst du eine Mine." },
    sudoku: { titel: "Sudoku", tatham: "solo", stufen: ["3x3db", "3x3di", "3x3da"], groesse: ["leicht", "mittel", "schwer"], ziffern: true,
      bedienung: "Tipp ein Feld an, dann die Ziffer darunter." },
    "2048": { titel: "2048", ziel: [512, 1024, 2048], groesse: ["bis 512", "bis 1024", "bis 2048"], aufgeben: true,
      bedienung: "Wisch oder nimm die Pfeiltasten. Die Punkte zählen nur in dieser Runde." },
  };
  var REIHE = ["lichter", "netz", "muster", "bruecken", "minen", "sudoku", "2048"];

  var $ = function (id) { return document.getElementById(id); };
  var par = new URLSearchParams(location.hash.slice(1));
  var heute = (function () { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })();
  var datum = /^\d{4}-\d{2}-\d{2}$/.test(par.get("datum") || "") ? par.get("datum") : heute;
  var n = Math.max(1, Math.min(99, parseInt(par.get("n"), 10) || 1));
  var imHappen = par.has("spiel"); // von Pause geöffnet: die App zeichnet den Rahmen und schließt nach der Meldung
  // Probe (werkzeug/spiele-probe.mjs): das erzeugte Rätsel über die Brücke melden, damit zwei Geräte verglichen werden können
  var probe = par.get("probe") === "1";
  var probeMelden = function (wert) { if (probe && window.offline) { probe = false; window.offline.speicher.schreiben("probe", wert); } };

  // ---------- Farben aus dem Skin (die App gibt sie in der Adresse mit; ohne Angabe die hellen Werte der App) ----------
  var F = { grund: "#eef3f6", text: "#1c1b19", leise: "#5f5b53", ink: "#3e5866", strich: "#c7d1d6", ruhig: "#e3ebf0", karte: "#ffffff",
    haupt: "#fbe6e9", hauptInk: "#c8102e", warn: "#c8102e", licht: "#8a5a00", lichtZart: "#f1e6c9", dunkel: false };
  try { var f = JSON.parse(par.get("f") || "{}"); for (var k in F) if (typeof f[k] === typeof F[k] && (typeof f[k] !== "string" || /^#[0-9a-f]{6}$/i.test(f[k]))) F[k] = f[k]; } catch (e) {}
  var rgb = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); };
  var hex = function (c) { return "#" + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"); }).join(""); };
  var mische = function (a, b, t) { var x = rgb(a), y = rgb(b); return hex(x.map(function (v, i) { return v + (y[i] - v) * t; })); };
  var hell = function (h) { var c = rgb(h); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; };
  var wurzel = document.documentElement.style;
  wurzel.setProperty("color-scheme", F.dunkel ? "dark" : "light");
  [["--grund", F.grund], ["--text", F.text], ["--leise", F.leise], ["--ink", F.ink], ["--strich", F.strich], ["--ruhig", F.ruhig], ["--karte", F.karte],
    ["--haupt", F.haupt], ["--haupt-ink", F.hauptInk], ["--licht", F.licht], ["--licht-zart", F.lichtZart]].forEach(function (p) { wurzel.setProperty(p[0], p[1]); });
  // 2048: leere Felder klar abgesetzt (im Dunkeln dunkler als das Brett), Zahlen vom Eis-Ton zum warmen Licht, höhere Zahlen abgestuft
  (function () {
    var leer = F.dunkel ? mische(F.grund, "#000000", 0.35) : mische(F.grund, F.ink, 0.08);
    var basis = F.dunkel ? mische(F.karte, F.ink, 0.42) : F.karte;
    var kalt = F.dunkel ? mische(F.karte, F.ink, 0.62) : mische(F.karte, F.ink, 0.28);
    var warm0 = F.dunkel ? mische(F.lichtZart, F.licht, 0.35) : F.lichtZart, warm1 = F.dunkel ? mische(F.licht, "#ffffff", 0.15) : F.licht;
    wurzel.setProperty("--leer", leer);
    wurzel.setProperty("--strich", F.dunkel ? mische(F.grund, "#000000", 0.6) : mische(F.grund, F.ink, 0.22));
    var stufen = { k2: basis, k4: mische(basis, kalt, 0.33), k8: mische(basis, kalt, 0.66), k16: kalt };
    ["k32", "k64", "k128", "k256", "k512", "k1024", "k2048"].forEach(function (k, i) { stufen[k] = mische(warm0, warm1, i / 6); });
    for (var s in stufen) wurzel.setProperty("--" + s, stufen[s]);
    wurzel.setProperty("--warm-ink", hell(warm1) < 0.55 ? "#ffffff" : "#1c1b19");
  })();
  // Tatham: Hintergrund und Palette aus dem Skin, die Formen bleiben. Grautöne laufen von Text (dunkel) zur Fläche (hell) –
  // im dunklen Skin kehren sie sich damit um –, Rot wird zur Warnfarbe, Gelb und Türkis zum Licht, reines Blau zum Eis-Ton; andere Farben bleiben, im Dunkeln heller.
  window.offlineFarbe = function (nr, s) {
    if (nr === 0) return F.grund;
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(String(s));
    if (!m) return s;
    var r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, sat = mx - mn;
    if (sat < 0.12) return l > 0.97 ? F.karte : mische(F.text, F.grund, Math.min(1, l / 0.92));
    if (r > 0.6 && g < 0.45 && b < 0.45) return F.warn;
    if (r < 0.4 && g > 0.6 && b > 0.6) return F.licht;            // Türkis (Netz: Leitung mit Strom) wird zum Licht
    if (b > 0.8 && r < 0.3 && g < 0.3) return F.ink;              // reines Blau (Netz: Endpunkte, Minen: die 1) wird zum Eis-Ton
    if (r > 0.6 && g > 0.6 && b < 0.75) return F.lichtZart;      // Gelb (Lichter: beleuchtete Felder) wird zum zarten Licht
    if (F.dunkel && l < 0.5) return mische(s.slice(0, 7), "#ffffff", 0.45);
    return s;
  };

  // ---------- Zufall des Tages (für 2048; die Tatham-Rätsel nehmen den Startwert als Text) ----------
  var startwert = function (spiel, stufe) { return datum + "-" + spiel + "-s" + stufe + (n > 1 ? "-" + n : ""); };
  var zufall = function (text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    var s = h >>> 0;
    return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };

  // ---------- Knöpfe und Ende ----------
  var knoepfe = $("knoepfe"), aufl = $("aufloesung");
  var knopf = function (text, art, klick) { var b = document.createElement("button"); b.type = "button"; b.className = art; b.textContent = text; b.onclick = klick; knoepfe.appendChild(b); return b; };
  var beginn = Date.now(), vorbei = false;
  /** Ergebnis zeigen, dann auf „Weiter“ melden. geloest: selbst gelöst; aufgeloest: Lösung gezeigt. */
  function ende(spiel, stufe, geloest, satz) {
    if (vorbei) return;
    vorbei = true;
    clearInterval(waechter);
    knoepfe.innerHTML = ""; $("ziffern").hidden = true;
    aufl.innerHTML = "<strong></strong>";
    aufl.firstChild.textContent = satz;
    var weiter = knopf("Weiter", "haupt", function () {
      weiter.disabled = true;
      var meldung = { id: spiel, art: spiel === "2048" ? ["beweglichkeit"] : ["beweglichkeit", "ausdauer"], ergebnis: { treffer: geloest ? 1 : 0, von: 1, stufe: stufe, geloest: geloest }, dauer: Math.round((Date.now() - beginn) / 1000) };
      var fertig = function () { if (!imHappen) { location.hash = ""; location.reload(); } };
      if (window.offline && window.offline.spiel) window.offline.spiel.melden(meldung).then(fertig, fertig); else fertig();
    });
    setTimeout(function () { weiter.focus(); }, 30);
  }
  var waechter = null;

  // ---------- Tatham-Rätsel ----------
  function tatham(spiel, stufe) {
    var s = SPIELE[spiel], aufgeloest = false, taste = false;
    $("puzzle").hidden = false;
    window.offlineTaste = function () { return taste ? 2 : 0; };
    knopf("Zurück", "neben", function () { $("undo").click(); });
    knopf("Von vorn", "neben", function () { $("restart").click(); });
    if (s.taste) { var u = knopf(s.taste, "umschalter", function () { taste = !taste; u.setAttribute("aria-pressed", String(taste)); }); u.setAttribute("aria-pressed", "false"); }
    if (s.aufgeben) knopf("Aufhören", "neben rechts", function () { ende(spiel, stufe, false, "Für heute gut. Morgen gibt es ein neues."); });
    else knopf("Auflösen", "neben rechts", function () { aufgeloest = true; $("solve").click(); });
    if (s.ziffern) {
      var z = $("ziffern");
      z.hidden = false;
      for (var i = 1; i <= 9; i++) (function (d) { var b = document.createElement("button"); b.type = "button"; b.textContent = String(d); b.setAttribute("aria-label", "Ziffer " + d); b.onclick = function () { if (window.offlineSpiel) window.offlineSpiel.key(48 + d, String(d), String(d), 0, 0, 0); }; z.appendChild(b); })(i);
      var weg = document.createElement("button"); weg.type = "button"; weg.textContent = "⌫"; weg.setAttribute("aria-label", "Ziffer löschen");
      weg.onclick = function () { if (window.offlineSpiel) window.offlineSpiel.key(8, "Backspace", "", 0, 0, 0); };
      z.appendChild(weg);
    }
    // Startwert statt Zufall: „#Parameter#Startwert“ wie ein Link aufs Rätsel; WebAssembly aus dem Paket
    window.offlineSpielId = "#" + s.stufen[stufe - 1] + "#" + startwert(spiel, stufe);
    window.offlineKeinNetz = function () { return Promise.reject(new Error("Kein Netz im Modul")); };
    var laden = function (src, dann) { var e = document.createElement("script"); e.src = src; e.onload = dann; e.onerror = function () { aufl.textContent = "Das Rätsel ließ sich nicht laden."; }; document.body.appendChild(e); };
    laden("tatham/" + s.tatham + ".wasm.js", function () {
      var b = atob(window.offlineWasmDaten), a = new Uint8Array(b.length);
      for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
      window.offlineWasm = a; window.offlineWasmDaten = null;
      laden("tatham/" + s.tatham + ".js", function () {});
      // Das Programm misst den Behälter beim Start; danach bei jeder Größenänderung (es hört selbst auf „resize“)
      var nachmessen = function () { window.dispatchEvent(new Event("resize")); };
      setTimeout(nachmessen, 300); setTimeout(nachmessen, 1200);
    });
    // Gelöst (Status +1) oder verloren (−1, Minen): Das Programm meldet es nicht von sich aus, also nachsehen
    if (probe) setTimeout(function () { probeMelden({ spiel: spiel, fehler: "Das Rätsel ist nicht gestartet." }); }, 10000);
    waechter = setInterval(function () {
      if (!window.offlineSpiel || vorbei) return;
      // Probe: die Beschreibung des erzeugten Rätsels (wie im Link „by game ID“ des Programms)
      if (probe) probeMelden({ spiel: spiel, id: window.offlineSpielId, raetsel: ($("permalink-desc").getAttribute("href") || "").replace(/^#/, "") });
      var st = window.offlineSpiel.status();
      if (st > 0) ende(spiel, stufe, !aufgeloest, aufgeloest ? "Schau, so geht es." : "Gelöst.");
      else if (st < 0) ende(spiel, stufe, false, "Schau, so war's: Dort lagen die Minen.");
    }, 350);
  }

  // ---------- 2048 (Logik: 2048/game_manager.js, grid.js, tile.js von Gabriele Cirulli) ----------
  function zweitausend(stufe) {
    var s = SPIELE["2048"], ziel = s.ziel[stufe - 1], feld = $("brett-feld"), hoechste = 0;
    $("brett").hidden = false;
    feld.tabIndex = 0;
    // Größe: die Breite nutzen, höchstens 80 px je Feld, und Platz für die Knöpfe lassen
    var platz = Math.min(window.innerWidth, window.innerHeight - 150), luecke = 8, zelle = Math.max(44, Math.min(80, Math.floor((platz - 5 * luecke) / 4)));
    wurzel.setProperty("--zelle", zelle + "px");
    var pos = function (x, y) { return { left: (luecke + x * (zelle + luecke)) + "px", top: (luecke + y * (zelle + luecke)) + "px" }; };
    for (var y = 0; y < 4; y++) for (var x = 0; x < 4; x++) { var c = document.createElement("div"); c.className = "zelle"; Object.assign(c.style, pos(x, y)); feld.appendChild(c); }
    var schicht = document.createElement("div"); feld.appendChild(schicht);
    var hoerer = {};
    function Eingabe() { this.on = function (ereignis, f) { hoerer[ereignis] = f; }; }
    function Anzeige() {
      this.continueGame = function () {};
      this.actuate = function (grid, meta) {
        schicht.innerHTML = ""; hoechste = 0;
        var namen = [];
        grid.cells.forEach(function (spalte) { spalte.forEach(function (t) {
          if (!t) return;
          hoechste = Math.max(hoechste, t.value);
          var k = document.createElement("div"); k.className = "kachel" + (t.value > 2048 ? " gross" : ""); k.dataset.wert = String(t.value); k.textContent = String(t.value);
          Object.assign(k.style, pos(t.x, t.y)); schicht.appendChild(k); namen.push(t.value);
        }); });
        $("punkte").textContent = String(meta.score); // sichtbar, aber nicht gespeichert und nicht verglichen (Bill zur Probe)
        feld.setAttribute("aria-label", "Spielfeld 4 mal 4, höchste Zahl " + hoechste);
        if (hoechste >= ziel) ende("2048", stufe, true, "Die " + ziel + " steht.");
        else if (meta.over) ende("2048", stufe, false, "Keine Züge mehr. Deine höchste Zahl: " + hoechste + ".");
      };
    }
    function Speicher() { // nichts wird gespeichert, auch kein Bestwert
      this.getGameState = function () { return null; }; this.setGameState = function () {}; this.clearGameState = function () {};
      this.getBestScore = function () { return 0; }; this.setBestScore = function () {};
    }
    var reihe = function () { Math.random = zufall(startwert("2048", stufe)); };
    reihe();
    var spiel = new window.GameManager(4, Eingabe, Anzeige, Speicher);
    if (probe) { // Probe: Anfang und Stand nach zwölf festen Zügen
      var bild = function () { return spiel.grid.cells.map(function (s) { return s.map(function (t) { return t ? t.value : 0; }).join(","); }).join("|"); };
      var anfang = bild();
      for (var z = 0; z < 12; z++) hoerer.move([3, 2, 1, 2][z % 4]);
      probeMelden({ spiel: "2048", id: startwert("2048", stufe), raetsel: anfang + " → " + bild() });
    }
    var zug = function (r) { if (!vorbei && hoerer.move) hoerer.move(r); };
    document.addEventListener("keydown", function (e) {
      var r = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }[e.key];
      if (r !== undefined) { e.preventDefault(); zug(r); }
    });
    // Wischen mit Finger, Stift oder Maus
    var start = null;
    feld.addEventListener("pointerdown", function (e) { start = [e.clientX, e.clientY]; try { feld.setPointerCapture(e.pointerId); } catch (x) {} });
    feld.addEventListener("pointerup", function (e) {
      if (!start) return;
      var dx = e.clientX - start[0], dy = e.clientY - start[1]; start = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      zug(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    });
    feld.addEventListener("pointercancel", function () { start = null; });
    knopf("Von vorn", "neben", function () { if (vorbei) return; reihe(); spiel.restart(); feld.focus(); });
    knopf("Aufhören", "neben rechts", function () { ende("2048", stufe, false, "Für heute gut. Deine höchste Zahl: " + hoechste + "."); });
    setTimeout(function () { feld.focus(); }, 50);
  }

  // ---------- Start ----------
  function starten(spiel, stufe) {
    var s = SPIELE[spiel];
    $("spiel").hidden = false;
    $("stand").textContent = (n > 1 ? "Noch eins für heute" : "Rätsel des Tages") + " · Stufe " + stufe + " von 3 · " + s.groesse[stufe - 1];
    aufl.innerHTML = "<span class=\"leise\"></span>";
    aufl.firstChild.textContent = s.bedienung;
    if (spiel !== "2048") return tatham(spiel, stufe);
    var dateien = ["2048/grid.js", "2048/tile.js", "2048/game_manager.js"], weiter = function () {
      if (!dateien.length) return zweitausend(stufe);
      var e = document.createElement("script"); e.src = dateien.shift(); e.onload = weiter; document.body.appendChild(e);
    };
    weiter();
  }
  var spiel = par.get("spiel"), stufe = Math.max(1, Math.min(3, parseInt(par.get("stufe"), 10) || 2));
  if (spiel && SPIELE.hasOwnProperty(spiel)) starten(spiel, stufe);
  else {
    // Ohne Angabe (aus der Bibliothek geöffnet): Auswahl, Stufe 2, Rätsel des Tages
    $("auswahl").hidden = false;
    REIHE.forEach(function (id) {
      var li = document.createElement("li"), b = document.createElement("button"), u = document.createElement("span");
      b.type = "button"; b.textContent = SPIELE[id].titel; u.textContent = SPIELE[id].groesse[1]; b.appendChild(u);
      b.onclick = function () { $("auswahl").hidden = true; starten(id, 2); };
      li.appendChild(b); $("auswahl-liste").appendChild(li);
    });
  }
})();
