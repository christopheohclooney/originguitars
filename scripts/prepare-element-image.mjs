/*
 * Turns a portrait product shot into the wide, transparent cut-out the hero
 * and the builder canvas want.
 *
 *   node scripts/prepare-element-image.mjs
 *
 * Rotates clockwise (headstock to the right, body to the left, matching the
 * Mod Shop orientation), trims the surrounding white, keys that white out to
 * real transparency, and re-pads with a small even margin so the instrument is
 * not flush against the edge.
 *
 * The keying step is what the dark palette needs. The previous version wrote a
 * JPEG on a white ground and dropped the ground out with `mix-blend-multiply`,
 * which only works while the page behind it is near-white — on a near-black
 * page multiply drives the whole frame to black. A PNG carrying a real alpha
 * channel composites correctly on any ground, so it survives the next palette
 * change too.
 *
 * Re-run this when a new photo lands. If the replacement is already landscape,
 * drop the `.rotate(90)`. If it arrives as a cut-out with its own alpha, set
 * KEY_WHITE to false to pass it straight through.
 */

import sharp from "sharp";

const SOURCE = "public/models/element/element-full.jpg";
const OUTPUT = "public/models/element/element-side.png";
const MARGIN = 40;
const KEY_WHITE = true;

/*
 * Luminance either side of the ground. At or above CLEAR the pixel is
 * background and goes fully transparent; at or below KEEP it is instrument and
 * stays opaque. The band between the two is what gives the edge a soft ramp
 * rather than the aliased staircase a single threshold produces.
 */
const CLEAR = 250;
const KEEP = 228;

const { data, info } = await sharp(SOURCE)
  .rotate(90)
  .trim({ threshold: 12 })
  .toBuffer({ resolveWithObject: true });

console.log(`trimmed to ${info.width}×${info.height}`);

const padded = await sharp(data)
  .extend({
    top: MARGIN,
    bottom: MARGIN,
    left: MARGIN,
    right: MARGIN,
    background: { r: 255, g: 255, b: 255 },
  })
  .toBuffer();

async function keyOutWhite(buffer) {
  const { data: rgba, info: meta } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = meta;
  const count = width * height;

  const luminance = (i) => {
    const p = i * channels;
    return 0.2126 * rgba[p] + 0.7152 * rgba[p + 1] + 0.0722 * rgba[p + 2];
  };

  /*
   * Flood fill inward from the border rather than thresholding every pixel, so
   * the white *inside* the instrument — chrome, the headstock logo, the pickup
   * highlights — is never punched through. Only ground actually connected to
   * the edge of the frame can be cleared.
   */
  const outside = new Uint8Array(count);
  const stack = [];

  const push = (i) => {
    if (outside[i] || luminance(i) < KEEP) return;
    outside[i] = 1;
    stack.push(i);
  };

  for (let x = 0; x < width; x += 1) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (stack.length) {
    const i = stack.pop();
    const x = i % width;
    const y = (i / width) | 0;
    if (x > 0) push(i - 1);
    if (x < width - 1) push(i + 1);
    if (y > 0) push(i - width);
    if (y < height - 1) push(i + width);
  }

  /*
   * Alpha ramps down across the KEEP→CLEAR band. Anything brighter than CLEAR
   * is ground and goes to zero; the partial values in between are the
   * anti-aliased rim, which is exactly where a hard cut would leave a white
   * fringe once the image sits on a near-black page.
   */
  let cleared = 0;
  for (let i = 0; i < count; i += 1) {
    if (!outside[i]) continue;
    const l = luminance(i);
    const alpha =
      l >= CLEAR ? 0 : Math.round((255 * (CLEAR - l)) / (CLEAR - KEEP));
    rgba[i * channels + 3] = Math.min(255, alpha);
    if (alpha === 0) cleared += 1;
  }

  console.log(
    `keyed ${((cleared / count) * 100).toFixed(1)}% of the frame to transparent`,
  );

  return sharp(rgba, { raw: { width, height, channels } });
}

const pipeline = KEY_WHITE
  ? await keyOutWhite(padded)
  : sharp(padded).ensureAlpha();

const result = await pipeline
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT);

console.log(
  `wrote ${OUTPUT} — ${result.width}×${result.height}, ` +
    `${Math.round(result.size / 1024)}KB, ratio ${(result.width / result.height).toFixed(2)}`,
);
