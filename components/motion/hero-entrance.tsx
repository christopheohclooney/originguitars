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
        The crop sits high of centre on desktop.
        `object-position` picks which slice of an over-tall image survives the
        cover crop, and moving it *up* the source shows more of what is above
        the subject — which pushes the subject itself down the frame. Centred
        left the fretboard riding the top edge with dead space beneath it.

        Only from md. A portrait frame crops the sides rather than the top and
        bottom, so there is little vertical slack to redistribute, and the
        centre is already where the contrast work landed.
      */}
      <Image
        src={src}
        alt={alt}
        fill
        preload
        sizes="100vw"
        className="object-cover object-center md:object-[50%_28%]"
      />
    </m.div>
  );
}
