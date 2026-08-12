import type { Metadata } from "next";
import Link from "next/link";

import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { buttonClasses } from "@/components/ui/button";
import { ModelTile } from "@/components/ui/model-tile";
import { PageHero } from "@/components/ui/page-hero";
import { models } from "@/data/models";
import { modelCardPhoto } from "@/lib/media";
import { shell } from "@/lib/style";

export const metadata: Metadata = {
  title: "Models — Origin Guitars",
  description:
    "The Element, available to build now. Lance and Element Bass in development.",
};

/*
 * The catalogue.
 *
 * One row of three, the whole page above the closing block: the hero says
 * what this is, the tiles say what there is. The old version of this page
 * gave the Element a full-width section with its specification laid out in
 * it, which was written before /models/[slug] existed and now duplicates it —
 * the tile's job is to get you to that page, not to be it.
 *
 * This is also the /models overhaul the style guide has been flagging. The
 * page was the last one still on the pre-redesign system: a Geist 700 h1
 * where every other page opens on the metallic PageHero, slanted accent rules
 * standing in for the overline, skewed badges, and full-bleed hairlines
 * between its sections. All four are gone, which leaves the 12° slant on the
 * price pill and the builder's step counter — brand devices — rather than
 * doing structural work on a content page.
 */

export default function ModelsPage() {
  return (
    <main>
      <PageHero
        title="Models"
        /*
          One sentence per line, as the reference sets it — the same device
          Home's hero uses for the same reason. Left to wrap against a measure
          the pair breaks mid-clause, which loses the pairing of the two
          statements.

          Block spans rather than two paragraphs or a break element: it stays
          one sentence pair, so what a screen reader announces and what you
          copy out are both still the whole thing, and each line still wraps
          normally on a narrow screen instead of forcing a measure nothing
          fits.
        */
        intro={
          <>
            <span className="block">
              Our flagship shapes. Designed with intent, built by craftsmen.
            </span>
            <span className="block">This is where every Origin starts.</span>
          </>
        }
        /*
          Widened from the 54ch default, which is narrower than the longer of
          the two sentences and would break it again inside its own span.
        */
        introMeasure="64ch"
      />

      {/*
        The row. Three across from md, which is what the reference draws and
        what the catalogue is — three equal things, so they get equal columns
        rather than a lead card and two followers.

        Stacked below md rather than paired: at phone width a two-up row puts
        a full-length instrument in a frame about 150px wide, which is a
        photograph of nothing in particular.

        The column gap is tighter than the card grids elsewhere on the site
        and deliberately so — these are three views of one catalogue, and the
        close seam is what makes them read as a set rather than as three
        separate offers that happen to be next to each other. It is the same
        call the detail page's gallery makes at gap-3. The stacked gap stays
        wider, because on a phone the run is vertical and the space between
        one card's price and the next card's photograph is the only thing
        separating them.
      */}
      <section className="pb-24 md:pb-32">
        <div className={shell}>
          <Stagger as="ul" className="grid gap-12 md:grid-cols-3 md:gap-5">
            {models.map((model) => (
              <StaggerItem as="li" key={model.slug}>
                <ModelTile model={model} {...modelCardPhoto(model.slug, model.name)} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/*
        Closing block, and the page's last word before the footer. Carried
        over from the previous version of this page with its copy unchanged
        and its treatment brought onto the current system — Archivo at medium
        rather than Geist at bold, and no hairline above it, following every
        other content page.
      */}
      <section className="pb-24 md:pb-32">
        <div className={shell}>
          <Stagger>
            <StaggerItem as="div">
              <h2 className="max-w-[22ch] font-display text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em]">
                Not sure where to start?
              </h2>
            </StaggerItem>

            <StaggerItem as="div">
              <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
                The builder explains each option as you go, and nothing is
                committed until you reach the review step.
              </p>
            </StaggerItem>

            <StaggerItem as="div">
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/builder"
                  className={`${buttonClasses({ size: "lg" })} w-full sm:w-auto`}
                >
                  Start your build
                </Link>
                <Link
                  href="/faq"
                  className={`${buttonClasses({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
                >
                  Read the FAQ
                </Link>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>
    </main>
  );
}
