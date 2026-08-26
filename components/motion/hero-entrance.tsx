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

        90%, not 100%. The interest is all on the right — the neck rakes to
        the top-right corner with the headstock and tuners just inside it —
        but the shot carries dead ground beyond them: measured off a column
        luminance profile, the last column holding any subject brightness is
        x 891 of 974, so a slice pinned hard right spends its final 83px on
        empty background. That is a quarter of everything a phone can see,
        given the window is only ~325 source px wide.

        90% lands the slice's right edge at x 909 — the headstock kept whole
        with about 18px to spare — and spends the 65px it reclaims on more
        neck and upper bout instead. The margin holds across the sub-md
        range: the window barely moves between 360 and 430 wide (317–325px,
        modern phone aspects being what they are) and only grows past that,
        so the headstock cannot clip before md takes over.

        No vertical term to tune: scaling to the height means the height fits
        exactly, so there is no vertical slack to redistribute and the Y value
        is inert on a phone whatever it is set to.

        From md the value is left exactly where it was. The viewport is wider
        than the source's 1.384 there, so `cover` scales to the width and it
        is the top and bottom that go — at 1440x900 about 141px of vertical
        slack, which 28% versus centred moves by roughly 31px. Small, and on
        desktop this frame is only the poster the video fades up from, so it
        is on screen for the length of a load and no longer.

        28% was originally derived against the 0.959 portrait source, so
        there is an argument for re-deriving it now the shot is landscape.
        Not taken: desktop is signed off as it stands, and a poster that
        briefly disagrees with the clip's first frame by 31px is not worth
        reopening it. If the video is ever re-cut, re-derive both together.
      */}
      <Image
        src={src}
        alt={alt}
        fill
        preload
        sizes="100vw"
        className="object-cover object-[90%_50%] md:object-[50%_28%]"
      />
    </m.div>
  );
}
