"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { centeringPosition } from "@/lib/crop";
import { frameRadius, slant } from "@/lib/style";
import type { ModelMedia } from "@/data/model-media";

/*
 * The full-screen image viewer, opened by clicking any gallery frame.
 *
 * Structurally the reference PDP's lightbox — counter top-left, close
 * top-right, arrows at the sides, thumbnail strip along the foot — drawn
 * entirely in the site's own system: the counter is the builder's step
 * counter with its slanted divider, the buttons are the hairline circles the
 * site draws its icons in, and every slide is the same cut-out cropped by
 * the same maths the page frames use.
 *
 * Every slide is mounted and stacked, crossfaded rather than swapped — the
 * artist carousel's pattern, and here it is even cheaper: the five slides
 * are five crops of one file, so the browser fetches one image and the
 * "gallery" costs nothing more to page through. Inactive slides are `inert`,
 * which keeps them out of the way of clicks and the accessibility tree.
 *
 * The viewer is a dialog: focus moves to the close button when it opens,
 * returns to the frame that opened it when it closes (the provider owns
 * that), Escape closes, the arrow keys page, and the page behind cannot
 * scroll while it is up — the same body lock the mobile nav uses.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const INSTANT = { duration: 0 } as const;

/*
 * The stage's slide box: a fixed aspect that fits the space the chrome
 * leaves. Width is the limit on a narrow screen, height on a wide one —
 * min() picks whichever bites, and the 14rem is the counter row, the
 * thumbnail row and the stage's own breathing room.
 */
function slideBoxStyle(ratio: { w: number; h: number }) {
  const r = ratio.w / ratio.h;
  return {
    aspectRatio: `${ratio.w} / ${ratio.h}`,
    width: `min(100%, calc((100dvh - 14rem) * ${r}))`,
  };
}

type Slide = {
  ratio: { w: number; h: number };
  alt: string;
  /** Absent on the lead slide, which shows the whole instrument contained. */
  crop?: { focus: { x: number; y: number }; zoom: number };
};

/*
 * The lead frame's 4/5 proportion, restated from the gallery — the slide
 * list has to agree with the frames that open it, index for index.
 */
export function slidesFor(media: ModelMedia): Slide[] {
  return [
    { ratio: { w: 4, h: 5 }, alt: media.leadAlt },
    ...media.frames.map((f) => ({
      ratio: f.ratio,
      alt: f.alt,
      crop: { focus: f.focus, zoom: f.zoom },
    })),
  ];
}

function cropStyles(
  slide: Slide,
  imageRatio: number,
  boxRatio: number,
): React.CSSProperties | undefined {
  if (!slide.crop) return undefined;
  const y = centeringPosition(slide.crop.focus.y, imageRatio, boxRatio);
  return {
    objectPosition: `50% ${y}%`,
    transformOrigin: `${slide.crop.focus.x}% 50%`,
    transform: `scale(${slide.crop.zoom})`,
  };
}

/* Whether we are past the server render — see the note at its use below. */
const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;

/* The hairline circle every control in the viewer sits in. */
const controlClasses =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function ModelLightbox({
  media,
  modelName,
  index,
  onNavigate,
  onClose,
}: {
  media: ModelMedia;
  modelName: string;
  /** null while closed — the component stays mounted so exits can animate. */
  index: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  /*
   * The viewer portals to document.body. Rendered in place it sits inside
   * the site layout's z-10 content wrapper, which is a stacking context —
   * no z-index inside it can paint above the header's own z-50 context, so
   * the pill showed through the overlay. The portal has to wait for mount
   * because document does not exist during the server render.
   *
   * useSyncExternalStore rather than a flag set in an effect. It is the hook
   * built for exactly this question — it returns the server snapshot during
   * SSR and the client snapshot from the first client render — so the answer
   * arrives without a state write in an effect and without the extra render
   * pass that costs. `subscribe` is a no-op at module scope because the
   * answer never changes after mount; an inline one would be a new function
   * every render and resubscribe on each.
   */
  const mounted = useSyncExternalStore(subscribeNever, onClient, onServer);

  const slides = slidesFor(media);
  const count = slides.length;
  const open = index !== null;
  const imageRatio = media.image.width / media.image.height;

  const next = useCallback(
    () => onNavigate(index === null ? 0 : (index + 1) % count),
    [index, count, onNavigate],
  );
  const previous = useCallback(
    () => onNavigate(index === null ? 0 : (index + count - 1) % count),
    [index, count, onNavigate],
  );

  /*
   * Keys and the body lock, only while open. Wrap-around navigation — the
   * fifth image's "next" is the first, so paging never dead-ends.
   */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") previous();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, next, previous]);

  /* The dialog's first focus is the way out. */
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  const fade = reduced ? INSTANT : { duration: 0.32, ease: EASE };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {index !== null && (
        <m.div
          role="dialog"
          aria-modal="true"
          aria-label={`${modelName} photography`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduced ? INSTANT : { duration: 0.24, ease: EASE }}
          className="fixed inset-0 z-[100] flex flex-col bg-surface"
        >
          {/* Counter left, the way out right — the builder's own devices. */}
          <div className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5">
            <p className="flex items-center gap-3 font-mono text-[0.875rem] tabular-nums">
              <span className="font-medium">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span aria-hidden className="h-4 w-px bg-line-strong" style={slant} />
              <span className="text-ink-muted">
                {String(count).padStart(2, "0")}
              </span>
            </p>

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close image viewer"
              className={controlClasses}
            >
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="m3 3 10 10M13 3 3 13" strokeLinecap="square" />
              </svg>
            </button>
          </div>

          {/* The stage. Clicking the ground beside a slide also closes. */}
          <div className="relative min-h-0 flex-1">
            {slides.map((slide, i) => (
              <div
                key={slide.alt}
                inert={i !== index}
                onClick={(e) => {
                  if (e.target === e.currentTarget) onClose();
                }}
                className="absolute inset-0 flex items-center justify-center px-16 md:px-24"
              >
                <m.div
                  initial={false}
                  animate={{ opacity: i === index ? 1 : 0 }}
                  transition={fade}
                  data-frame-glow
                  className={`relative overflow-hidden ${frameRadius} border border-line bg-canvas`}
                  style={slideBoxStyle(slide.ratio)}
                >
                  <Image
                    src={media.image}
                    alt={slide.alt}
                    fill
                    sizes="100vw"
                    className={slide.crop ? "object-cover" : "object-contain p-6 md:p-10"}
                    style={cropStyles(slide, imageRatio, slide.ratio.w / slide.ratio.h)}
                  />
                </m.div>
              </div>
            ))}

            <button
              type="button"
              onClick={previous}
              aria-label="Previous image"
              className={`${controlClasses} absolute left-4 top-1/2 -translate-y-1/2 md:left-8`}
            >
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M10.5 3 5 8l5.5 5" strokeLinecap="square" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className={`${controlClasses} absolute right-4 top-1/2 -translate-y-1/2 md:right-8`}
            >
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5.5 3 11 8l-5.5 5" strokeLinecap="square" />
              </svg>
            </button>
          </div>

          {/*
            The thumbnails: the same crops at a glance, current one ringed in
            ink. Selection is a ring plus aria-current, never the ring alone.
          */}
          <div className="flex items-center justify-center gap-2 px-5 py-5 md:py-6">
            {slides.map((slide, i) => (
              <button
                key={slide.alt}
                type="button"
                onClick={() => onNavigate(i)}
                aria-label={`Show image ${i + 1} of ${count}: ${slide.alt}`}
                aria-current={i === index || undefined}
                className={`relative h-10 w-14 shrink-0 overflow-hidden ${frameRadius} border bg-canvas transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:h-12 md:w-16 ${
                  i === index
                    ? "border-ink"
                    : "border-line hover:border-line-strong"
                }`}
              >
                <Image
                  src={media.image}
                  alt=""
                  fill
                  sizes="64px"
                  className={slide.crop ? "object-cover" : "object-contain p-1"}
                  style={cropStyles(slide, imageRatio, slide.ratio.w / slide.ratio.h)}
                />
              </button>
            ))}
          </div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
