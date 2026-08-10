import { existsSync } from "node:fs";
import { join } from "node:path";

/*
 * Resolve a photograph in /public by name, whatever it was exported as.
 *
 * Server-only — it touches the filesystem, so it must be called from a server
 * component. It runs at build time for a static page and costs nothing per
 * request.
 *
 * Two things this exists for.
 *
 * The photographs are dropped in by hand as they are chosen, so they cannot be
 * statically imported: a static import of a file that is not there yet fails
 * the build. Referenced by path instead, a missing file has to be handled
 * rather than assumed, and an <Image> pointed at one leaves a broken-image
 * glyph in the corner of the page. Returning null lets a section decide for
 * itself — the hero drops to its own ground, a two-column section stands its
 * placeholder panel in the gap so the layout does not collapse.
 *
 * And the extension is not worth a round trip. The hero shipped pointing at
 * .jpg and the supplied file was .png, which is a broken page for the sake of
 * three characters. Whatever the export dialog was left on, it resolves.
 *
 * The trade that comes with all of this: no build-time dimensions and no blur
 * placeholder, so callers size the frame themselves. Once a shot is settled,
 * moving it to a static import gets both back.
 */

/* Ordered by what the exports actually arrive as, not by preference. */
const EXTENSIONS = ["png", "jpg", "jpeg", "webp", "avif"] as const;

export function publicPhoto(basename: string): string | null {
  for (const extension of EXTENSIONS) {
    const path = `/${basename}.${extension}`;
    if (existsSync(join(process.cwd(), "public", path))) return path;
  }
  return null;
}
