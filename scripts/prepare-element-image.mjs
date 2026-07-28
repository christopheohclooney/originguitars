/*
 * Turns a portrait product shot into the wide band the builder canvas wants.
 *
 *   node scripts/prepare-element-image.mjs
 *
 * Rotates clockwise (headstock to the right, body to the left, matching the
 * Mod Shop orientation), trims the surrounding white, and re-pads with a small
 * even margin so the instrument is not flush against the edge.
 *
 * Re-run this when a new photo lands. If the replacement is already landscape,
 * drop the `.rotate(90)`. If it arrives as a cut-out with real transparency,
 * write a PNG instead and remove `mix-blend-multiply` from the builder.
 */

import sharp from "sharp";

const SOURCE = "public/models/element/element-full.jpg";
const OUTPUT = "public/models/element/element-side.jpg";
const MARGIN = 40;

const { data, info } = await sharp(SOURCE)
  .rotate(90)
  .trim({ threshold: 12 })
  .toBuffer({ resolveWithObject: true });

console.log(`trimmed to ${info.width}×${info.height}`);

const result = await sharp(data)
  .extend({
    top: MARGIN,
    bottom: MARGIN,
    left: MARGIN,
    right: MARGIN,
    background: { r: 255, g: 255, b: 255 },
  })
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(OUTPUT);

console.log(
  `wrote ${OUTPUT} — ${result.width}×${result.height}, ` +
    `${Math.round(result.size / 1024)}KB, ratio ${(result.width / result.height).toFixed(2)}`,
);
