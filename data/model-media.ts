import type { StaticImageData } from "next/image";

import elementFull from "@/public/models/element/element-full.png";

/*
 * Photography for the model detail pages, keyed by slug.
 *
 * Separate from data/models.ts on purpose: that file is pure copy with no
 * imports, and a static image import belongs beside the asset it names. A
 * model with no entry here still gets a detail page — the gallery stands
 * ImagePlaceholder panels in the gaps, the same way /models does.
 *
 * Every Element frame is the same cut-out, cropped in CSS rather than
 * exported five times. Same call the codebase already documents for
 * [data-blueprint] and [data-lens-media]: the framing stays tunable here
 * instead of in an export dialog, and one asset stays one asset. The crops
 * are placeholder framing over placeholder photography — when the real shoot
 * lands, each frame becomes its own file and `zoom` retires.
 *
 * The OEM's headstock branding is visible on this cut-out and is left as it
 * is: the photography is a stand-in, and retouching a stand-in is effort
 * spent on something about to be replaced.
 */

export type ModelFrame = {
  /*
   * The crop. `focus` is a percentage point on the source image — the thing
   * the frame is about — which the gallery centres in the box and then
   * zooms around. Centring is computed there rather than fed straight to
   * object-position, because a percentage object-position aligns the
   * image's p% with the *box's* p%, which is not "put p% in the middle".
   */
  focus: { x: number; y: number };
  zoom: number;
  /** The box's proportion, used for both its aspect and the crop maths. */
  ratio: { w: number; h: number };
  /** Frames are real content, not decoration — each says what it shows. */
  alt: string;
};

export type ModelMedia = {
  image: StaticImageData;
  /** The full-length lead frame's alt. */
  leadAlt: string;
  frames: ModelFrame[];
};

const media: Record<string, ModelMedia> = {
  element: {
    image: elementFull,
    leadAlt: "The Origin Element, full length — a contoured double-cut in black",
    /*
     * Read off the cut-out's own geometry (1398×4096): headstock in the top
     * tenth, nut near 20%, neck to about 55%, pickups 70–82%, bridge and
     * controls in the mid 80s. Zoom values are tuned to what each detail
     * needs to read, not matched to each other.
     */
    frames: [
      {
        focus: { x: 50, y: 76 },
        zoom: 1.9,
        ratio: { w: 4, h: 3 },
        alt: "The Element's two humbuckers, mounted straight into the body",
      },
      {
        focus: { x: 52, y: 84 },
        zoom: 2.2,
        ratio: { w: 4, h: 3 },
        alt: "The hardtail bridge and control knobs",
      },
      {
        focus: { x: 50, y: 10 },
        zoom: 1.6,
        ratio: { w: 4, h: 3 },
        alt: "The headstock and tuners",
      },
      {
        focus: { x: 35, y: 57 },
        zoom: 1.5,
        ratio: { w: 4, h: 3 },
        alt: "The upper horn and neck joint",
      },
    ],
  },
};

export function modelMedia(slug: string): ModelMedia | null {
  return media[slug] ?? null;
}
