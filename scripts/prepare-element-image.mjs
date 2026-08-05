/*
 * Turns the portrait product shot into the wide band the builder canvas wants.
 *
 *   node scripts/prepare-element-image.mjs
 *
 * Rotates clockwise (headstock to the right, body to the left, matching the
 * Mod Shop orientation), trims the surrounding transparency, and re-pads with
 * a small even margin so the instrument is not flush against the edge.
 *
 * The source is a cut-out with a real alpha channel, so this stays PNG end to
 * end: trimming reads alpha rather than a colour threshold, and the padding is
 * transparent. Nothing downstream may composite it against white — that is
 * what lets the canvas take any background colour.
 *
 * Re-run this when a new photo lands. If a replacement arrives already
 * landscape, drop the `.rotate(90)`.
 */

import sharp from "sharp";

const SOURCE = "public/models/element/element-full.png";
const OUTPUT = "public/models/element/element-side.png";
const MARGIN = 40;

const { data, info } = await sharp(SOURCE)
  .rotate(90)
  .trim({ threshold: 10 })
  .toBuffer({ resolveWithObject: true });

console.log(`trimmed to ${info.width}×${info.height}`);

const result = await sharp(data)
  .extend({
    top: MARGIN,
    bottom: MARGIN,
    left: MARGIN,
    right: MARGIN,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT);

console.log(
  `wrote ${OUTPUT} — ${result.width}×${result.height}, ` +
    `${Math.round(result.size / 1024)}KB, ratio ${(result.width / result.height).toFixed(2)}`,
);
