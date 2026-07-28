"use client";

import Image, { type StaticImageData } from "next/image";
import { m, useReducedMotion } from "motion/react";

import { slant } from "@/lib/style";

/*
 * The page's one authored moment.
 *
 * Everything else on Home either arrives with a plain scroll reveal or does not
 * animate at all — an identical entrance on every section reads as a template,
 * not a decision.
 *
 * Both parts animate from an already-visible default: opacity stays at 1
 * throughout, so nothing is held behind hydration and the hero can still be the
 * LCP element. Only scale and scaleX move, both GPU-composited.
 *
 * `useReducedMotion` returns null on the server and a boolean after mount, so
 * it must never decide which elements exist — that renders different markup on
 * each side and throws a hydration mismatch. It only ever selects transition
 * values here; the DOM is identical either way.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const INSTANT = { duration: 0 } as const;

/** The brand angle, drawn on. Scaled up from the 44px tick used elsewhere. */
export function HeroRule() {
  const reduced = useReducedMotion();

  /* The skew lives on the wrapper — Motion writes scaleX to `transform`, which
     would otherwise overwrite it. */
  return (
    <div aria-hidden style={slant} className="h-2 w-44">
      <m.div
        data-reveal
        className="h-full w-full origin-left bg-black"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={
          reduced ? INSTANT : { duration: 0.9, ease: EASE, delay: 0.15 }
        }
      />
    </div>
  );
}

/** The instrument, settling rather than appearing. */
export function HeroGuitar({ image }: { image: StaticImageData }) {
  const reduced = useReducedMotion();

  return (
    <m.div
      data-reveal
      initial={{ scale: 1.05 }}
      animate={{ scale: 1 }}
      transition={reduced ? INSTANT : { duration: 1.6, ease: EASE }}
    >
      <Image
        src={image}
        alt="The Origin Element"
        priority
        placeholder="blur"
        sizes="100vw"
        className="h-auto w-full object-contain mix-blend-multiply"
      />
    </m.div>
  );
}
