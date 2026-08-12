import Image from "next/image";

import { ImagePlaceholder } from "@/components/image-placeholder";
import { Reveal } from "@/components/motion/reveal";
import type { ModelMedia } from "@/data/model-media";

/*
 * The detail page's image frames: one full-length lead frame, then a grid of
 * detail crops. Every frame is the same cut-out, cropped in CSS — see the
 * note in data/model-media.ts for why there are no per-frame exports.
 *
 * Two components rather than one gallery block, because the page's grid
 * needs them as separate items: on desktop the pinned panel sits beside the
 * whole run, but on a phone the panel belongs *between* the lead frame and
 * the details — name, price and the way into the builder within the first
 * screen or two, not below five full-height photographs. Splitting here is
 * what lets the page express that with grid placement instead of duplicated
 * DOM.
 *
 * One `sizes` string across every frame, deliberately. Same src plus same
 * sizes means the browser resolves one optimised variant and serves it to
 * all five frames from cache instead of fetching five widths of the same
 * picture. It is set off the lead frame, the widest layout the image
 * reaches, which also keeps the zoomed crops sharp: Next sizes off layout
 * width, not transformed width, so a sizes string tuned to a detail frame's
 * box would ship a variant the 2.3× zoom then enlarges past its pixels.
 */
const SIZES = "(min-width: 1024px) 60vw, 100vw";

/*
 * The frame itself: the lifted tone inside a hairline, with the builder's
 * pool of light behind the instrument. The cut-out has a real alpha channel,
 * so the frame supplies the ground — and without the glow a near-black
 * instrument on a near-black card loses its silhouette. [data-frame-glow] is
 * that pool without [data-canvas]'s page-wide side effect.
 */
const frameClasses =
  "relative w-full overflow-hidden rounded-2xl border border-line bg-canvas";

export function ModelLeadFrame({
  media,
  modelName,
}: {
  media: ModelMedia | null;
  modelName: string;
}) {
  /*
   * No photography yet — the layout stands anyway, on the same honest-empty
   * panel /models uses, in the frame the photograph will occupy.
   */
  if (!media) {
    return (
      <ImagePlaceholder
        className="aspect-[4/5] w-full rounded-2xl"
        label={`${modelName} photography to follow`}
      />
    );
  }

  /*
   * Above the fold and the likely LCP element, so it renders at full opacity
   * with no reveal wrapper and asks for preload — the site's standing rule
   * that nothing above the fold waits on hydration.
   *
   * `contain` rather than a crop: this is the one frame whose job is the
   * whole instrument.
   */
  return (
    <div data-frame-glow className={`${frameClasses} aspect-[4/5]`}>
      <Image
        src={media.image}
        alt={media.leadAlt}
        fill
        preload
        sizes={SIZES}
        className="object-contain p-8 md:p-12"
      />
    </div>
  );
}

/*
 * Where object-position has to sit for the image's focal row to land in the
 * *centre* of the box. Not the focal percentage itself: a percentage
 * object-position aligns the image's p% with the box's p%, so feeding the
 * focal point straight in parks it at its own percentage of the frame —
 * which is how the first pass put every crop's subject in the wrong place.
 *
 * Cover on a portrait image in a landscape box is width-limited, so the
 * displayed height is boxWidth / imageRatio and the box holds boxWidth /
 * boxRatio of it. Solving "focal row at box centre" for the object-position
 * fraction q gives the expression below; clamped because a focal point near
 * an edge cannot be centred without showing past the image.
 */
function centeringPosition(
  focalY: number,
  imageRatio: number,
  boxRatio: number,
): number {
  const displayed = 1 / imageRatio;
  const box = 1 / boxRatio;
  const q = ((focalY / 100) * displayed - box / 2) / (displayed - box);
  return Math.min(100, Math.max(0, q * 100));
}

export function ModelDetailFrames({ media }: { media: ModelMedia | null }) {
  if (!media) {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        <ImagePlaceholder className="aspect-[4/3] w-full rounded-2xl" />
        <ImagePlaceholder className="aspect-[4/3] w-full rounded-2xl" />
      </div>
    );
  }

  const imageRatio = media.image.width / media.image.height;

  /*
   * The detail crops, below the fold, arriving on the site's standard
   * reveal. The crop centres the focal row, then the zoom scales about the
   * box's centre, so the subject stays put while the frame tightens around
   * it. The transform-origin's x is the one part left to the frame: before
   * the zoom there is no horizontal overflow to position, and after it the
   * origin is what chooses which side survives — the horn crop biases left
   * because that is where the horn is.
   */
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {media.frames.map((frame) => {
        const boxRatio = frame.ratio.w / frame.ratio.h;
        const y = centeringPosition(frame.focus.y, imageRatio, boxRatio);

        return (
          <Reveal key={frame.alt}>
            <div
              data-frame-glow
              className={frameClasses}
              style={{ aspectRatio: `${frame.ratio.w} / ${frame.ratio.h}` }}
            >
              <Image
                src={media.image}
                alt={frame.alt}
                fill
                sizes={SIZES}
                className="object-cover"
                style={{
                  objectPosition: `50% ${y}%`,
                  transformOrigin: `${frame.focus.x}% 50%`,
                  transform: `scale(${frame.zoom})`,
                }}
              />
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
