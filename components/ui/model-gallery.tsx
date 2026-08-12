"use client";

import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ImagePlaceholder } from "@/components/image-placeholder";
import { Reveal } from "@/components/motion/reveal";
import { ModelLightbox } from "@/components/ui/model-lightbox";
import { centeringPosition } from "@/lib/crop";
import type { ModelMedia } from "@/data/model-media";

/*
 * The detail page's image frames: one full-length lead frame, then a grid of
 * detail crops, every one of them a way into the full-screen viewer. Each
 * frame is the same cut-out, cropped in CSS — see the note in
 * data/model-media.ts for why there are no per-frame exports.
 *
 * Two components rather than one gallery block, because the page's grid
 * needs them as separate items: on desktop the pinned panel sits beside the
 * whole run, but on a phone the panel belongs *between* the lead frame and
 * the details — name, price and the way into the builder within the first
 * screen or two, not below five full-height photographs. Splitting here is
 * what lets the page express that with grid placement instead of duplicated
 * DOM.
 *
 * The provider is what lets the split survive the lightbox: the two frame
 * components sit in different grid cells with the panel between them, so
 * the open-a-slide call reaches them through context rather than through
 * props threaded around the aside. It also owns the focus contract — the
 * viewer opens from a click and closes back to the frame that opened it.
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
  "relative w-full overflow-hidden rounded-2xl border border-line bg-canvas transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:border-line-strong";

/*
 * The button each frame sits in. cursor-zoom-in is the affordance — the
 * frames carry no caption or icon, and the cursor is what says "this
 * opens" without decorating the photography.
 */
const frameButtonClasses =
  "group block w-full cursor-zoom-in rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const OpenLightboxContext = createContext<(index: number) => void>(() => {});

/*
 * Wraps the detail page's showcase grid. Renders the viewer alongside the
 * children rather than inside either frame component, so one dialog serves
 * the lead frame and the detail grid alike — and so the aside between them
 * stays a plain server-rendered grid item.
 */
export function ModelGalleryProvider({
  media,
  modelName,
  children,
}: {
  media: ModelMedia | null;
  modelName: string;
  children: ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  /*
   * The focus contract: remember what opened the viewer, put focus back on
   * it when the viewer closes. Without this, closing drops keyboard focus
   * at the top of the document and the reader has to walk back down.
   */
  const open = useCallback((i: number) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setIndex(i);
  }, []);

  const close = useCallback(() => {
    setIndex(null);
    openerRef.current?.focus();
  }, []);

  return (
    <OpenLightboxContext.Provider value={open}>
      {children}
      {media && (
        <ModelLightbox
          media={media}
          modelName={modelName}
          index={index}
          onNavigate={setIndex}
          onClose={close}
        />
      )}
    </OpenLightboxContext.Provider>
  );
}

export function ModelLeadFrame({
  media,
  modelName,
}: {
  media: ModelMedia | null;
  modelName: string;
}) {
  const open = useContext(OpenLightboxContext);

  /*
   * No photography yet — the layout stands anyway, on the same honest-empty
   * panel /models uses, in the frame the photograph will occupy. Not a
   * button: an empty panel has nothing to open.
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
    <button
      type="button"
      onClick={() => open(0)}
      aria-label={`View image 1 of ${media.frames.length + 1} full screen: ${media.leadAlt}`}
      className={frameButtonClasses}
    >
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
    </button>
  );
}

export function ModelDetailFrames({ media }: { media: ModelMedia | null }) {
  const open = useContext(OpenLightboxContext);

  if (!media) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <ImagePlaceholder className="aspect-[4/3] w-full rounded-2xl" />
        <ImagePlaceholder className="aspect-[4/3] w-full rounded-2xl" />
      </div>
    );
  }

  const imageRatio = media.image.width / media.image.height;
  const count = media.frames.length + 1;

  /*
   * The detail crops, below the fold, arriving on the site's standard
   * reveal. The crop centres the focal row (lib/crop.ts), then the zoom
   * scales about the box's centre, so the subject stays put while the frame
   * tightens around it. The transform-origin's x is the one part left to
   * the frame: before the zoom there is no horizontal overflow to position,
   * and after it the origin is what chooses which side survives — the horn
   * crop biases left because that is where the horn is.
   *
   * gap-3 rather than the card grids' gap-6: these are five views of one
   * instrument, and the tight seam is what makes them read as a set — the
   * page grid's lg row gap matches it for the same reason.
   */
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {media.frames.map((frame, i) => {
        const boxRatio = frame.ratio.w / frame.ratio.h;
        const y = centeringPosition(frame.focus.y, imageRatio, boxRatio);

        return (
          <Reveal key={frame.alt}>
            <button
              type="button"
              onClick={() => open(i + 1)}
              aria-label={`View image ${i + 2} of ${count} full screen: ${frame.alt}`}
              className={frameButtonClasses}
            >
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
            </button>
          </Reveal>
        );
      })}
    </div>
  );
}
