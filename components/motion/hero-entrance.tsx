"use client";

import Image from "next/image";
import { m, useReducedMotion } from "motion/react";

/*
 * The page's one authored moment.
 *
 * Everything else on Home either arrives with a plain scroll reveal or does not
 * animate at all — an identical entrance on every section reads as a template,
 * not a decision.
 *
 * It animates from an already-visible default: opacity stays at 1 throughout,
 * so nothing is held behind hydration and the photograph can still be the LCP
 * element. Only scale moves, which is GPU-composited.
 *
 * `useReducedMotion` returns null on the server and a boolean after mount, so
 * it must never decide which elements exist — that renders different markup on
 * each side and throws a hydration mismatch. It only ever selects transition
 * values here; the DOM is identical either way.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const INSTANT = { duration: 0 } as const;

/**
 * The hero photograph, settling rather than appearing.
 *
 * `fill` rather than a static import: the file is dropped in by hand at
 * public/home-hero.jpg, and a static import of a file that is not there yet
 * fails the build. Referenced by path, a missing file simply leaves the
 * section on its own ground until the photograph lands — which is what we
 * want while the shot is still being chosen.
 *
 * The trade that comes with it: no build-time dimensions and no blur
 * placeholder. Neither matters for a full-bleed cover image, which has no
 * intrinsic space to reserve, and `preload` still puts it in the document
 * head as the likely LCP element.
 */
export function HeroPhoto({ src, alt = "" }: { src: string; alt?: string }) {
  const reduced = useReducedMotion();

  return (
    <m.div
      data-reveal
      aria-hidden={alt === "" ? true : undefined}
      className="absolute inset-0"
      initial={{ scale: 1.06 }}
      animate={{ scale: 1 }}
      transition={reduced ? INSTANT : { duration: 1.8, ease: EASE }}
    >
      {/*
        The frame is landscape now — 974×704, from the same set as the scrub
        clip — which inverts the crop problem the portrait shot had.

        On a phone the viewport is portrait and the source is wide, so `cover`
        scales to the height and the *sides* are what get discarded: at 390×844
        the picture lands 1168 wide against a 390 slot, so two thirds of the
        source is off-screen and the only question is which third survives.
        Centred, that third is the middle of the body — the least characterful
        part of the shot, and it cuts the neck and headstock off entirely.

        100% pins the slice to the right edge, which is where the picture's
        interest is: the neck rakes up to the top-right corner and the
        headstock and tuners sit just inside it, with the upper bout and the
        knobs below. Anything short of 100% starts clipping the headstock tip
        at the right before it gains anything on the left — the tuners run to
        roughly x 900 of 974, so the margin is about 7% of the source and not
        worth spending.

        No vertical term to tune: scaling to the height means the height fits
        exactly, so there is no vertical slack to redistribute and the Y value
        is inert on a phone whatever it is set to.

        From md the viewport is wider than the source's 1.384, so `cover`
        scales to the width instead and it is the top and bottom that go —
        very little of either. Centred, because this is the poster the video
        fades up from and it should sit where the clip's own first frame does;
        the old 28% was tuned against a 0.959 source that no longer exists.
      */}
      <Image
        src={src}
        alt={alt}
        fill
        preload
        sizes="100vw"
        className="object-cover object-[100%_50%] md:object-[50%_50%]"
      />
    </m.div>
  );
}
