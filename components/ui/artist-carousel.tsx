"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import Image, { type StaticImageData } from "next/image";
import { useId, useState } from "react";

import { shell } from "@/lib/style";

/*
 * The artist carousel.
 *
 * Every slide is mounted, stacked, and crossfaded rather than swapped in and
 * out, so all three artists' names and descriptions are in the HTML for a
 * crawler and for anyone reading with JavaScript off. The inactive ones are
 * `inert`, which is what keeps them out of the tab order and the
 * accessibility tree while they are invisible — without it a keyboard user
 * tabs through three copies of the same thing.
 *
 * The copy sits on the photograph, so the photograph cannot be trusted to be
 * dark where the words land. Both scrims below are unconditional for that
 * reason: they cost nothing on an already-dark frame and are the difference
 * between legible and not on a bright one.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const INSTANT = { duration: 0 } as const;

export type Artist = {
  /* Name and location as one line, per the design — "Hellbound, Scotland". */
  name: string;
  blurb: string;
  image: StaticImageData;
  imageAlt: string;
};

export function ArtistCarousel({
  heading,
  intro,
  artists,
}: {
  heading: string;
  intro: string;
  artists: Artist[];
}) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const id = useId();

  const fade = reduced ? INSTANT : { duration: 0.5, ease: EASE };
  const current = artists[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={heading}
      className="py-20 md:py-28"
    >
      {/*
        The frame's height. From sm it is an aspect of the viewport's width,
        which is what the design draws. Below sm it is the viewport's height
        instead — one screen, less the header. At 3:4 of a phone's width the
        band came to ~520px, of which the overlaid heading and intro at the
        top and the name and blurb at the bottom consumed ~400: the section
        read as two blocks of copy with a sliver of photograph between them.
        svh rather than vh for the reason Home's hero documents — on a phone,
        vh is the height with the browser chrome collapsed.
      */}
      <div className="relative h-[calc(100svh-var(--header-h))] w-full overflow-hidden sm:h-auto sm:aspect-[16/10] lg:aspect-[15/8]">
        {artists.map((artist, i) => (
          <m.div
            key={artist.name + i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${artists.length}`}
            inert={i !== index}
            initial={false}
            animate={{ opacity: i === index ? 1 : 0 }}
            transition={fade}
            className="absolute inset-0"
          >
            {/*
              Above the default 75. This frame is full-bleed grainy black and
              white, which is the worst case for a lossy encoder — at 75 the
              grain is quantised into blocks rather than preserved, and the
              photograph reads as compression rather than film.
            */}
            <Image
              src={artist.image}
              alt={artist.imageAlt}
              fill
              sizes="100vw"
              quality={90}
              placeholder="blur"
              className="object-cover"
            />
          </m.div>
        ))}

        {/*
          Top and bottom only — a full-frame scrim would flatten the middle of
          the photograph, which is the part worth seeing.

          Three stops rather than two. A straight fade is already halfway to
          transparent by the time it reaches the second line of text, which
          measured 1.48:1 on a bright frame; holding it near full strength
          through the band where words sit is what makes the type independent
          of whatever photograph is behind it.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-black/85 via-black/65 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-black/90 via-black/70 to-transparent"
        />

        {/* Section heading — fixed, it belongs to the section not the slide. */}
        <div className={`${shell} absolute inset-x-0 top-0 pt-8 md:pt-12`}>
          <h2 className="mx-auto max-w-[20ch] text-center font-display text-[clamp(1.75rem,3.4vw,3rem)] font-medium leading-[1.1] tracking-[-0.02em]">
            {heading}
          </h2>
          <p className="mx-auto mt-4 max-w-[44ch] text-center text-[0.9375rem] leading-[1.55] text-white/85 md:text-[1.0625rem]">
            {intro}
          </p>
        </div>

        {/* Slide caption — crossfades with the frame behind it. */}
        <div
          className={`${shell} absolute inset-x-0 bottom-0 pb-8 md:pb-12`}
          aria-live="polite"
        >
          <AnimatePresence initial={false} mode="wait">
            <m.div
              key={index}
              initial={{ opacity: 0, y: reduced ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduced ? 0 : -8 }}
              transition={reduced ? INSTANT : { duration: 0.32, ease: EASE }}
            >
              <h3 className="text-center font-display text-[clamp(1.25rem,2.2vw,1.875rem)] font-medium leading-[1.2] tracking-[-0.015em]">
                {current.name}
              </h3>
              <p className="mx-auto mt-3 max-w-[52ch] text-center text-[0.9375rem] leading-[1.6] text-white/85 md:text-[1rem]">
                {current.blurb}
              </p>
            </m.div>
          </AnimatePresence>
        </div>
      </div>

      {/*
        Buttons, not dots with click handlers — they are the only way to move
        the carousel, so they have to be reachable and operable from the
        keyboard.

        The hit area is taller than it is wide, 40x24, which is what lets the
        marks sit close together the way the reference has them while each
        button still clears the 24px minimum worth tapping. A square 44px
        target would space them at 48px apart — twice the reference — for no
        gain, since the height is doing the work on a phone anyway.
      */}
      <div className="mt-8 flex items-center justify-center">
        {artists.map((artist, i) => (
          <button
            key={artist.name + i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show ${artist.name}`}
            aria-current={i === index}
            aria-controls={id}
            className="group inline-flex h-10 w-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <span
              aria-hidden
              className={`h-2 w-2 rounded-full transition-colors ${
                i === index
                  ? "bg-ink"
                  : "bg-ink/30 group-hover:bg-ink/60"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
