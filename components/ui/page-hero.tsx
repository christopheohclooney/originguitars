import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

import { shell } from "@/lib/style";

/*
 * The centred page hero, shared by the content pages — FAQ first, About next.
 *
 * It carries no light treatment of its own. The raking leak in
 * (site)/layout.tsx already covers the top ~72vh of every page, which is
 * exactly where a hero sits, and a hero-scoped copy of it measured +3 on a
 * ground of 30 — two systems doing one job, one of them invisible. The
 * builder's --canvas-glow is deliberately not reused here either: that is a
 * centred pool for lighting an object's silhouette, and a hero has no object
 * in it.
 *
 * The heading carries the metallic fill and is set in the display face at
 * regular. That is the rule from the designs: metallic hero type is regular,
 * section headings are medium. It also happens to be what the treatment
 * needs — at this size the gradient does the work weight would otherwise do,
 * and going heavier closes the counters the light has to pass through.
 */

/*
 * The image and its alt travel together or not at all. A hero without one is
 * the FAQ's case and stays exactly as it was; a hero with one cannot be
 * written without deciding what it says, which is the whole point of making
 * this a union rather than two loose optionals — `alt=""` is a valid answer
 * for a decorative image, but it has to be given.
 */
type PageHeroProps = {
  title: string;
  /*
   * The heading's measure. 16ch by default, which is what stops a long title
   * running the full width of the column and gives it a sensible break.
   *
   * Widened per page rather than raised for everyone, because the default is
   * doing real work: "The origin story" and "Common questions" both want the
   * break 16ch gives them. "Terms and conditions" is 20 characters that read
   * as one phrase, and splitting it across two lines makes a two-word label
   * look like two headings.
   *
   * A cap rather than `whitespace-nowrap`. If the title outgrows its measure
   * — a longer one, a narrow screen, or the fallback face while Archivo is
   * still loading — a cap wraps it, and nowrap would run it off the page.
   */
  titleMeasure?: string;
  /* Optional so a page can lead straight into its content. */
  intro?: ReactNode;
} & (
  | { image?: undefined; imageAlt?: never }
  | { image: StaticImageData; imageAlt: string }
);

export function PageHero(props: PageHeroProps) {
  const { title, titleMeasure = "16ch", intro } = props;

  return (
    <section className="pt-16 pb-16 md:pt-24 md:pb-20">
      <div className={shell}>
        {/*
          The measure is an inline style rather than a Tailwind class because
          it varies per page. Tailwind reads arbitrary values out of the source
          text, so `max-w-[${titleMeasure}]` would compile to a class no
          stylesheet ever generates — the cap would silently vanish.
        */}
        <h1
          data-metal
          style={{ maxWidth: titleMeasure }}
          className="mx-auto text-center font-display text-[clamp(2.75rem,7vw,4.75rem)] font-normal leading-[1.04] tracking-[-0.02em]"
        >
          {title}
        </h1>

        {intro && (
          <p className="mx-auto mt-6 max-w-[54ch] text-center text-[1.0625rem] leading-[1.6] text-ink-muted md:text-[1.125rem]">
            {intro}
          </p>
        )}
      </div>

      {/*
        Full bleed, outside the shell — the copy measures to the content
        column, the photograph does not. It runs the width of the viewport
        and is dissolved into the ground at its edges, so it ends by fading
        out rather than on a rectangle.

        Statically imported by the page, so Next has the real dimensions at
        build time and reserves the space before the file arrives — nothing
        below it shifts as it loads. Preloaded because a hero this high on
        the page is the likely LCP element — `preload` rather than
        `priority`, which Next 16 deprecated in favour of it.
      */}
      {props.image && (
        <div data-hero-media className="mt-14 md:mt-16">
          <Image
            src={props.image}
            alt={props.imageAlt}
            preload
            placeholder="blur"
            sizes="100vw"
            className="h-auto w-full"
          />
        </div>
      )}
    </section>
  );
}
