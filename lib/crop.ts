/*
 * Where object-position has to sit for an image's focal row to land in the
 * *centre* of its box. Not the focal percentage itself: a percentage
 * object-position aligns the image's p% with the box's p%, so feeding the
 * focal point straight in parks it at its own percentage of the frame.
 *
 * Cover on a portrait image in a landscape box is width-limited, so the
 * displayed height is boxWidth / imageRatio and the box holds boxWidth /
 * boxRatio of it. Solving "focal row at box centre" for the object-position
 * fraction q gives the expression below; clamped because a focal point near
 * an edge cannot be centred without showing past the image.
 *
 * Shared by the model gallery's frames and the lightbox's slides and
 * thumbnails — one crop, computed one way, wherever it is drawn.
 */
export function centeringPosition(
  focalY: number,
  imageRatio: number,
  boxRatio: number,
): number {
  const displayed = 1 / imageRatio;
  const box = 1 / boxRatio;
  const q = ((focalY / 100) * displayed - box / 2) / (displayed - box);
  return Math.min(100, Math.max(0, q * 100));
}
