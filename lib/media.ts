import { existsSync, openSync, readSync, closeSync } from "node:fs";
import { join } from "node:path";

/*
 * Resolve a photograph in /public by name, whatever it was exported as, and
 * read its real pixel dimensions off the file.
 *
 * Server-only — it touches the filesystem, so it must be called from a server
 * component. It runs at build time for a static page and costs nothing per
 * request.
 *
 * Three things this exists for.
 *
 * The photographs are dropped in by hand as they are chosen, so they cannot be
 * statically imported: a static import of a file that is not there yet fails
 * the build. Referenced by path instead, a missing file has to be handled
 * rather than assumed, and an <Image> pointed at one leaves a broken-image
 * glyph in the corner of the page. Returning null lets a section decide for
 * itself — the hero drops to its own ground, a two-column section stands its
 * placeholder panel in the gap so the layout does not collapse.
 *
 * The extension is not worth a round trip. The hero shipped pointing at .jpg
 * and the supplied file was .png; the section below it shipped expecting .png
 * and the supplied file was .jpg. Whatever the export dialog was left on, it
 * resolves.
 *
 * And the dimensions have to come from the file. Without them an <Image> needs
 * `fill`, which needs a frame with an aspect set on it, which means guessing
 * the shot's proportion and cropping whatever does not match — the first pass
 * here guessed 11:12 against a 4:5 photograph and quietly cut 12.7% off its
 * height. Read from the header instead, a section can lay the picture out at
 * its own proportion and crop nothing.
 */

/* Ordered by what the exports actually arrive as, not by preference. */
const EXTENSIONS = ["png", "jpg", "jpeg", "webp", "avif"] as const;

export type PublicPhoto = {
  src: string;
  /* Null for a format whose header is not parsed here — see readSize. */
  width: number | null;
  height: number | null;
};

/*
 * Enough of the PNG and JPEG headers to get width and height, rather than a
 * dependency. Both are a few bytes at a known place, and these two are what
 * the exports arrive as.
 *
 * PNG: fixed layout. The IHDR chunk always leads, so width and height are
 * big-endian uint32s at bytes 16 and 20.
 *
 * JPEG: a walk. The file is a chain of marker segments and the size lives in
 * whichever SOF (start-of-frame) segment this particular encoder wrote —
 * baseline, progressive and the arithmetic-coded variants all differ, hence
 * the range check rather than a single constant. DNL (0xC4), DHT (0xC8) and
 * DAC (0xCC) sit inside that numeric range without being frames, so they are
 * excluded by name.
 *
 * Anything else returns nulls and the caller falls back to a framed `fill`.
 */
function readSize(path: string): { width: number | null; height: number | null } {
  const none = { width: null, height: null };
  let fd: number | undefined;

  try {
    fd = openSync(path, "r");
    const head = Buffer.alloc(65_536);
    const read = readSync(fd, head, 0, head.length, 0);

    /* PNG: \x89PNG\r\n\x1a\n */
    if (read > 24 && head.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
      return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
    }

    /* JPEG: SOI is ffd8 */
    if (read > 4 && head[0] === 0xff && head[1] === 0xd8) {
      let i = 2;
      while (i + 9 < read) {
        if (head[i] !== 0xff) {
          i++;
          continue;
        }
        const marker = head[i + 1];
        const isFrame =
          marker >= 0xc0 &&
          marker <= 0xcf &&
          marker !== 0xc4 &&
          marker !== 0xc8 &&
          marker !== 0xcc;

        if (isFrame) {
          return { height: head.readUInt16BE(i + 5), width: head.readUInt16BE(i + 7) };
        }

        /* Padding and standalone markers carry no length field to skip by. */
        if (marker === 0xff || (marker >= 0xd0 && marker <= 0xd9)) {
          i += 2;
          continue;
        }

        i += 2 + head.readUInt16BE(i + 2);
      }
    }

    return none;
  } catch {
    /* An unreadable file is the same problem as a missing one to a caller. */
    return none;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

export function publicPhoto(basename: string): PublicPhoto | null {
  for (const extension of EXTENSIONS) {
    const src = `/${basename}.${extension}`;
    const path = join(process.cwd(), "public", src);
    if (existsSync(path)) return { src, ...readSize(path) };
  }
  return null;
}
