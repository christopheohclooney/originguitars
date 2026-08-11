"use client";

import Image, { type StaticImageData } from "next/image";
import { m, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/*
 * A photograph that arrives rather than appears.
 *
 * Built for the builder canvas and written to be reusable, because the same
 * clunk is waiting on every other large photograph on the site.
 *
 * Three things happen here, and the first is the one that mattered.
 *
 * No `placeholder="blur"`. The canvas instrument is a cut-out with a real
 * alpha channel, and the blurDataURL Next generates for it is opaque — the
 * alpha does not survive being flattened into a 8px JPEG. So the placeholder
 * rendered as a hard-edged grey rectangle, the loaded photograph's own
 * transparency let it show straight through, and when Next dropped it the
 * whole rectangle disappeared in a single frame. That pop was the problem;
 * a spinner over the top would have left it exactly where it was.
 *
 * The image fades up instead. Opacity only — it is composited, so it costs
 * nothing, and the instrument resolves out of the canvas glow rather than
 * being stamped onto it.
 *
 * And a loading indicator, held back behind a delay. On a normal connection
 * this photograph is 39KB and lands in well under the delay, so the indicator
 * never renders at all — which is the point. An indicator that flashes on
 * every fast load is worse than none, because it turns an instant page into
 * one that visibly waited.
 */

/*
 * Long enough that a fast connection never sees it, short enough that a slow
 * one is not left staring at an empty canvas wondering whether it is broken.
 */
const INDICATOR_DELAY_MS = 350;

/*
 * Three states, and the first exists purely so the fade can never hide the
 * photograph.
 *
 * "initial" is what the server renders and what a browser that has not run
 * the JavaScript yet keeps: fully opaque, no transition, an ordinary image
 * element that appears when it arrives. The first pass here started at
 * opacity 0 instead, which meant the instrument stayed invisible until React
 * hydrated — and on the slow connection this is all for, the JavaScript is
 * the slow part. Measured on a throttled load it left the canvas empty for
 * 2.5s after the photograph had already downloaded.
 *
 * The switch to "waiting" happens in a layout effect, before paint, and only
 * if the image has not already finished. An image element that has not loaded
 * paints nothing, so dropping it to opacity 0 at that moment takes nothing
 * off the screen — it just arms the fade.
 */
type LoadState = "initial" | "waiting" | "loaded";

/*
 * useLayoutEffect warns when it runs on the server. The component is only
 * ever rendered inside a client boundary, but Next still renders that
 * boundary to HTML on the server, so this picks the effect that is safe in
 * whichever environment it finds itself in.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function LoadingImage({
  src,
  alt,
  sizes,
  preload,
  className = "",
  wrapperClassName = "",
}: {
  src: StaticImageData;
  alt: string;
  sizes?: string;
  preload?: boolean;
  className?: string;
  wrapperClassName?: string;
}) {
  const [state, setState] = useState<LoadState>("initial");
  const [showIndicator, setShowIndicator] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const reduced = useReducedMotion();

  /*
   * A cached image is already complete before React hydrates, so `onLoad`
   * fires before this component is listening and never fires again. Reading
   * `complete` here is what covers the second visit, where the photograph is
   * in the browser cache and there is nothing left to wait for.
   */
  useIsomorphicLayoutEffect(() => {
    setState(ref.current?.complete ? "loaded" : "waiting");
  }, []);

  useEffect(() => {
    if (state !== "waiting") return;
    const timer = setTimeout(() => setShowIndicator(true), INDICATOR_DELAY_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const settle = () => setState("loaded");

  return (
    <div
      className={`relative flex h-full min-h-0 w-full items-center justify-center ${wrapperClassName}`}
    >
      {/*
        The indicator sits under the photograph rather than over it, so the
        two never overlap as the image arrives — by the time there is anything
        to see, this has already gone.

        Out of the accessibility tree. The image carries its own alt text and
        nothing here is blocked while it loads, so announcing a progress state
        would be noise rather than help.
      */}
      {state === "waiting" && showIndicator && <Indicator reduced={reduced} />}

      {/*
        `onLoad` rather than `onLoadingComplete`, which Next 16 removed.
        `onError` settles too: a photograph that will never arrive should
        leave the canvas as it is, not hold a loading state open forever.

        The transition is only attached once the fade is armed. In "initial"
        the element carries no opacity class at all, so a browser that never
        runs this JavaScript renders a plain, fully visible photograph.
      */}
      <Image
        ref={ref}
        src={src}
        alt={alt}
        sizes={sizes}
        preload={preload}
        onLoad={settle}
        onError={settle}
        className={`${className} ${
          state === "initial"
            ? ""
            : `transition-opacity ease-out ${
                reduced ? "duration-0" : "duration-[600ms]"
              } ${state === "loaded" ? "opacity-100" : "opacity-0"}`
        }`}
      />
    </div>
  );
}

/*
 * A hairline with a light travelling along it.
 *
 * Not a spinner. The site's whole vocabulary of dividers is the 1px rule —
 * the FAQ list, the footer, the option tray — and a rotating arc would be the
 * one element on the page borrowing from somewhere else. This is the rule the
 * site already uses, lit.
 *
 * Sized to a fraction of the canvas and centred, so it reads as an object
 * settling into the space the instrument is about to occupy rather than as
 * page chrome.
 */
function Indicator({ reduced }: { reduced: boolean | null }) {
  return (
    <div
      aria-hidden
      data-image-indicator
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {/*
        The rule is drawn on --color-line-strong rather than --color-line.
        Measured against the canvas, --color-line is a 1px difference of about
        16 levels — at this thickness it is invisible rather than subtle, and
        an indicator nobody can see is not an indicator.

        The travelling light runs to --color-ink and covers half the rule, so
        there is always a lit section somewhere on it. The first pass used a
        third of the width in --color-ink-muted with a pause between passes,
        which left frames where the rule sat there dark and looked like a
        stray divider.
      */}
      <div className="relative h-px w-[min(20rem,48%)] overflow-hidden bg-line-strong">
        {reduced ? (
          /*
            Reduced motion gets the rule at rest. Still visible, still says
            something is coming, without a light sweeping back and forth in
            the middle of the screen.
          */
          <div className="absolute inset-0 bg-ink-muted" />
        ) : (
          <m.div
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-ink to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}
