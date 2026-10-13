// OFFLINE – PNG lesen, schreiben und vergleichen, ohne Abhängigkeit (nur node:zlib). Für den Bildvergleich (Auftrag Nr. 21).
// Gelesen werden die PNGs, die Chrome schreibt: 8 Bit je Kanal, Graustufen, RGB oder RGBA, ohne Zeilensprung.

import { inflateSync, deflateSync } from "node:zlib";

const SIGNATUR = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/** PNG → { breite, hoehe, pixel (RGBA, Uint8Array) } */
export function pngLesen(buf) {
  if (!buf.subarray(0, 8).equals(SIGNATUR)) throw new Error("kein PNG");
  let pos = 8, breite = 0, hoehe = 0, tiefe = 0, farbe = 0, zeilensprung = 0;
  const daten = [];
  while (pos < buf.length) {
    const laenge = buf.readUInt32BE(pos), typ = buf.toString("latin1", pos + 4, pos + 8), inhalt = buf.subarray(pos + 8, pos + 8 + laenge);
    if (typ === "IHDR") { breite = inhalt.readUInt32BE(0); hoehe = inhalt.readUInt32BE(4); tiefe = inhalt[8]; farbe = inhalt[9]; zeilensprung = inhalt[12]; }
    else if (typ === "IDAT") daten.push(inhalt);
    else if (typ === "IEND") break;
    pos += 12 + laenge;
  }
  const kanaele = { 0: 1, 2: 3, 4: 2, 6: 4 }[farbe];
  if (tiefe !== 8 || !kanaele || zeilensprung) throw new Error(`PNG-Format nicht unterstützt (Tiefe ${tiefe}, Farbe ${farbe}, Zeilensprung ${zeilensprung})`);
  const roh = inflateSync(Buffer.concat(daten)), zeile = breite * kanaele, aus = new Uint8Array(breite * hoehe * 4);
  let vorher = new Uint8Array(zeile);
  for (let y = 0; y < hoehe; y++) {
    const filter = roh[y * (zeile + 1)], z = new Uint8Array(roh.subarray(y * (zeile + 1) + 1, (y + 1) * (zeile + 1)));
    for (let i = 0; i < zeile; i++) {
      const a = i >= kanaele ? z[i - kanaele] : 0, b = vorher[i], c = i >= kanaele ? vorher[i - kanaele] : 0;
      let p = 0;
      if (filter === 1) p = a; else if (filter === 2) p = b; else if (filter === 3) p = (a + b) >> 1;
      else if (filter === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      z[i] = (z[i] + p) & 255;
    }
    for (let x = 0; x < breite; x++) {
      const o = (y * breite + x) * 4, q = x * kanaele;
      if (kanaele === 1 || kanaele === 2) { aus[o] = aus[o + 1] = aus[o + 2] = z[q]; aus[o + 3] = kanaele === 2 ? z[q + 1] : 255; }
      else { aus[o] = z[q]; aus[o + 1] = z[q + 1]; aus[o + 2] = z[q + 2]; aus[o + 3] = kanaele === 4 ? z[q + 3] : 255; }
    }
    vorher = z;
  }
  return { breite, hoehe, pixel: aus };
}

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const block = (typ, inhalt) => {
  const kopf = Buffer.alloc(8); kopf.writeUInt32BE(inhalt.length, 0); kopf.write(typ, 4, "latin1");
  const pruef = Buffer.alloc(4); pruef.writeUInt32BE(crc32(Buffer.concat([kopf.subarray(4), inhalt])), 0);
  return Buffer.concat([kopf, inhalt, pruef]);
};

/** { breite, hoehe, pixel (RGBA) } → PNG */
export function pngSchreiben({ breite, hoehe, pixel }) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(breite, 0); ihdr.writeUInt32BE(hoehe, 4); ihdr[8] = 8; ihdr[9] = 6;
  const roh = Buffer.alloc(hoehe * (breite * 4 + 1));
  for (let y = 0; y < hoehe; y++) Buffer.from(pixel.buffer, pixel.byteOffset + y * breite * 4, breite * 4).copy(roh, y * (breite * 4 + 1) + 1);
  return Buffer.concat([SIGNATUR, block("IHDR", ihdr), block("IDAT", deflateSync(roh, { level: 9 })), block("IEND", Buffer.alloc(0))]);
}

/**
 * Vergleicht zwei Bilder. Ein Pixel zählt als abweichend, wenn ein Farbkanal um mehr als `schwelle` (0–255) abweicht.
 * Ergebnis: Anteil abweichender Pixel, Rahmen der Abweichung und ein Differenzbild (Referenz blass, Abweichung rot).
 * Unterschiedliche Größe ist immer eine Abweichung (eine verschobene Zeile ändert die Seitenhöhe).
 */
export function vergleichen(ref, neu, { schwelle = 16 } = {}) {
  const breite = Math.max(ref.breite, neu.breite), hoehe = Math.max(ref.hoehe, neu.hoehe);
  const diff = new Uint8Array(breite * hoehe * 4);
  let anders = 0, x0 = breite, y0 = hoehe, x1 = -1, y1 = -1;
  const px = (b, x, y) => (x < b.breite && y < b.hoehe ? (y * b.breite + x) * 4 : -1);
  for (let y = 0; y < hoehe; y++) for (let x = 0; x < breite; x++) {
    const a = px(ref, x, y), b = px(neu, x, y), o = (y * breite + x) * 4;
    let abw = a < 0 || b < 0;
    if (!abw) for (let k = 0; k < 4; k++) if (Math.abs(ref.pixel[a + k] - neu.pixel[b + k]) > schwelle) { abw = true; break; }
    if (abw) { anders++; diff[o] = 230; diff[o + 1] = 0; diff[o + 2] = 40; diff[o + 3] = 255; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    else { const g = Math.round((ref.pixel[a] + ref.pixel[a + 1] + ref.pixel[a + 2]) / 3); diff[o] = diff[o + 1] = diff[o + 2] = 200 + Math.round(g / 5); diff[o + 3] = 255; }
  }
  return {
    gleicheGroesse: ref.breite === neu.breite && ref.hoehe === neu.hoehe,
    anders, anteil: anders / (breite * hoehe),
    rahmen: anders ? { x: x0, y: y0, breite: x1 - x0 + 1, hoehe: y1 - y0 + 1 } : null,
    differenz: { breite, hoehe, pixel: diff },
  };
}
