import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";
import { shell } from "@/lib/style";

/*
 * The closing block — a page's last word before the footer.
 *
 * The Lance across the top of the column, then the heading and its copy on
 * the left with the ways out on the right, sat on one baseline from md up.
 * About has closed this way since the redesign; the catalogue now closes the
 * same way, and the two were within a few characters of being the same
 * markup — same drawing, same measures, same button pair, and as it happens
 * the same copy. Two hand-kept copies of that is how one of them ends up with
 * a heading a size out from the other, which is a thing this codebase has
 * already caught itself doing.
 *
 * The actions are a slot rather than a pair of href props. Every page that
 * closes this way sends you somewhere slightly different — the catalogue's
 * "See the models" cannot be a link to the page you are already on — and a
 * component that tried to describe every one of those in props would be a
 * worse way of writing two buttons than two buttons.
 */
export function ClosingCta({
  heading,
  body,
  actions,
}: {
  heading: string;
  body: ReactNode;
  actions: ReactNode;
}) {
  return (
    <section className="py-20 md:py-28">
      <div className={shell}>
        {/*
          The Lance face-on, measured to the content column like the side view
          on the FAQ. Decorative — the heading below already says what this is
          — so no alt text and out of the accessibility tree.

          Held back below md: the detail that makes it worth having (bridge,
          tuners, frets) stops being legible at phone width and turns into
          noise.

          The fade down into the copy is a mask rather than part of the
          export, so it stays a single flat drawing that can be reused at any
          size and the falloff is tunable without a re-export.
        */}
        <Reveal>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-blueprint
            src="/lance-skeleton-front.svg"
            alt=""
            aria-hidden
            width={1133}
            height={396}
            className="hidden h-auto w-full md:block"
          />
        </Reveal>

        {/*
          Copy left, the ways forward right, on one baseline from md up and
          stacked below it. `items-end` aligns the buttons to the foot of the
          paragraph rather than its top.
        */}
        <div className="flex flex-col gap-10 md:mt-2 md:flex-row md:items-end md:justify-between md:gap-16">
          <Reveal>
            {/*
              Archivo at medium — heavier than the section headings it
              follows, because this is the page's last word, but not back to
              the pre-redesign bold. Tracking eased off with the weight:
              Archivo needs less negative than Geist at this size, and
              -0.025em closed the counters the lighter weight is there to
              open.
            */}
            <h2 className="max-w-[18ch] font-display text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.02em]">
              {heading}
            </h2>
            <p className="mt-5 max-w-[40ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
              {body}
            </p>
          </Reveal>

          {/*
            The primary belongs last in the source, which puts it at the
            right-hand end of the row — the far end of the reading direction,
            and the position the designs give it.
          */}
          <Reveal
            delay={0.12}
            className="flex shrink-0 flex-col gap-4 sm:flex-row"
          >
            {actions}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
