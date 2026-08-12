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

/*
 * A catalogue card's photograph, and what to call it.
 *
 * Lives here rather than on a page because two pages draw the same row of
 * cards — the catalogue and Home — and a model that shows its own shot on one
 * of them and the stand-in on the other would be the same bug twice. It
 * cannot live in data/model-media.ts, which is imported by the gallery's
 * client component and so can carry no filesystem access.
 *
 * Two locations, in order. A model's own shot lives at
 * public/models/<slug>/card.<ext> — the folder the detail page's photography
 * already uses — and is picked up the moment it lands, with no change here.
 * Until then every card falls back to one shared stand-in: the Element
 * cut-out the detail page's lead frame and the builder both already show,
 * referenced where it sits rather than copied to a placeholder name. One
 * asset, three references, which is the same call the Lance drawing gets
 * wherever it stands in for photography.
 *
 * It is also the right shape for the job — a full-length instrument on a real
 * alpha channel, so a card's own pool of light reads behind it instead of a
 * photograph's grey studio ground sitting in a hole in the frame.
 *
 * With neither present the caller is handed null and stands an
 * ImagePlaceholder in the frame, so the row still holds its shape.
 */
const CARD_STAND_IN = publicPhoto("models/element/element-full");

export function modelCardPhoto(
  slug: string,
  name: string,
): { photo: PublicPhoto | null; photoAlt: string } {
  const own = publicPhoto(`models/${slug}/card`);

  /*
   * Alt describes what is in the frame, so it follows the file rather than
   * the card. The stand-in is the Element, which makes it true on the
   * Element's card and a borrowed picture on the other two — calling it the
   * Lance would be writing a caption that is wrong for two cards out of
   * three. Empty and out of the accessibility tree in that case; the
   * category, name and price directly below carry the card either way, and
   * the alt arrives with the real shot.
   */
  const depictsThisModel = Boolean(own) || slug === "element";

  return {
    photo: own ?? CARD_STAND_IN,
    photoAlt: depictsThisModel ? `The Origin ${name}, full length` : "",
  };
}
