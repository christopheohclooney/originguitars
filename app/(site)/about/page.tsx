import type { Metadata } from "next";
import Link from "next/link";

import aboutHero from "@/public/about-hero-image.png";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { Reveal, Stagger, StaggerItem, WordReveal } from "@/components/motion/reveal";
import { buttonClasses } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { shell, slant } from "@/lib/style";

export const metadata: Metadata = {
  title: "About — Origin Guitars",
  description:
    "Why Origin exists, how the instruments are built, and who builds them.",
};

/*
 * Structure and rhythm only — every paragraph here is placeholder written to
 * realistic length so the measure and vertical spacing can be judged. Real
 * copy replaces it wholesale.
 *
 * Editorial rather than product: asymmetric two-column sections with the
 * heading held in the margin, a full-measure lede, a pull quote, and the
 * two-image grid the build spec flagged as worth exploring.
 */
export default function AboutPage() {
  return (
    <main>
      {/*
        The opening photograph is the hero's, not a section of its own — the
        reference runs it straight on from the subheading, so the placeholder
        that used to sit below in its own measured band is gone.
      */}
      <PageHero
        title="The origin story"
        intro="Origin didn't start in a boardroom. It started with self-taught players wanting something no one else had."
        image={aboutHero}
        imageAlt="A guitar neck held at the bench, being worked by hand"
      />

      {/*
        Editorial section — heading held in the margin against a single
        column of prose. No rule above it: the full-bleed hairline is the
        builder's device for dividing chrome from stage, and on a content
        page it cuts the vertical run.
      */}
      <section className="py-20 md:py-28">
        <div className={shell}>
          <div className="grid gap-12 md:grid-cols-[24rem_1fr] md:gap-20">
            {/*
              `justify-between` is what pins the drawing to the foot of the
              column: the row's height comes from the prose beside it, so the
              heading holds the top and the diagram drops to the bottom
              without either being given a height.
            */}
            <div className="flex flex-col justify-between gap-12">
              <h2 className="font-display text-[clamp(1.875rem,2.6vw,2.375rem)] font-normal leading-[1.1] tracking-[-0.02em]">
                <WordReveal text="Why it all started" />
              </h2>

              <Reveal delay={0.15}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/neck-side-view.svg"
                  alt=""
                  aria-hidden
                  width={245}
                  height={141}
                  className="h-auto w-[15.3rem] max-w-full"
                />
              </Reveal>
            </div>

            {/*
              Measure caps the line length rather than the column doing it,
              so the prose stays readable if the grid ever widens.

              Staggered by paragraph rather than by word — at this length a
              word-by-word reveal is something to sit through rather than
              read.
            */}
            <Stagger className="max-w-[58ch]">
              <StaggerItem as="div">
                <p className="text-[1.0625rem] leading-[1.75] md:text-[1.125rem]">
                  Larry had already seen how the guitar industry worked from
                  the inside, factories in India and China turning out
                  excellent instruments for brands charging a serious premium
                  once a logo got attached. What was missing was something in
                  between: not a mass-produced stock model, not a five-figure
                  custom build with a two-year wait, just a guitar built
                  properly, to your spec, at a price that made sense for
                  someone starting out.
                </p>
              </StaggerItem>
              <StaggerItem as="div">
                <p className="mt-7 text-[1.0625rem] leading-[1.75] md:text-[1.125rem]">
                  That&apos;s the gap Origin fills. Semi-custom, not fully
                  custom, you choose the parts that matter (shape, colour,
                  hardware, pickups) from a considered set of options, not an
                  infinite one, which keeps the build honest and the price
                  fair. Made to order, so nothing sits unsold in a warehouse.
                  Assembled and inspected in the UK, so the last hands on your
                  guitar before it reaches you are ones you can actually reach
                  back out to.
                </p>
              </StaggerItem>
              <StaggerItem as="div">
                <p className="mt-7 text-[1.0625rem] leading-[1.75] md:text-[1.125rem]">
                  It&apos;s not trying to be everything. It&apos;s trying to be
                  the guitar that wasn&apos;t there before.
                </p>
              </StaggerItem>
            </Stagger>
          </div>
        </div>
      </section>

      {/*
        Two-photo grid. The second is dropped against the first rather than
        set beside it — the reference offsets them, which is what stops a
        pair of portraits reading as a contact sheet. The offset is margin
        rather than a transform, so the section's height accounts for it and
        nothing below has to be nudged to compensate.

        No rule above it, and no technical drawing in it: the Side View sits
        one section up, where it answers the prose. A second one here would
        turn a device into a motif, and these two frames are the whole point
        of the section.
      */}
      <section className="py-20 md:py-28">
        <div className={shell}>
          <Stagger className="grid gap-6 md:grid-cols-2 md:gap-8">
            <StaggerItem>
              <ImagePlaceholder
                className="aspect-[4/5] w-full"
                label="Detail shot"
              />
            </StaggerItem>
            <StaggerItem className="md:mt-40">
              <ImagePlaceholder
                className="aspect-[4/5] w-full"
                label="Detail shot"
              />
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Pull quote */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <Reveal>
            {/*
              The measure lives on the <p>, not the <blockquote>: `ch` resolves
              against the element's own font-size, so on the wrapper it would
              be computed at 16px body text and collapse the quote to a sliver.
            */}
            <blockquote>
              <p className="max-w-[20ch] text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.12] tracking-[-0.025em]">
                &ldquo;Placeholder pull quote — the one line that should stop
                somebody scrolling.&rdquo;
              </p>
              <footer className="mt-8 flex items-center gap-4">
                <div
                  aria-hidden
                  className="h-[5px] w-11 bg-ink"
                  style={slant}
                />
                <span className="text-[0.9375rem] text-ink-muted">
                  Attribution to follow
                </span>
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* Second editorial section */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <Reveal>
            <div className="grid gap-10 md:grid-cols-[16rem_1fr] md:gap-16">
              <div>
                <div
                  aria-hidden
                  className="mb-6 h-[5px] w-11 bg-ink"
                  style={slant}
                />
                <h2 className="text-[1.375rem] font-semibold leading-[1.2] tracking-[-0.015em]">
                  How they are built
                </h2>
              </div>
              <div className="max-w-[64ch]">
                <p className="text-[1.0625rem] leading-[1.7]">
                  Placeholder. Every instrument is built to the specification
                  set in the builder, by hand, and inspected by the same team
                  before it is allowed to leave.
                </p>
                <p className="mt-6 text-[1.0625rem] leading-[1.7]">
                  Placeholder. This section should carry the detail that earns
                  trust — timbers, hardware, the parts of the process worth
                  being specific about. Length here is indicative.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <Reveal>
            <h2 className="max-w-[20ch] text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
              Start with the Element
            </h2>
            <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
              One shape available today, two more in development. Work through
              the options and watch the price as you go — nothing is committed
              until you are ready.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/builder"
                className={`${buttonClasses({ size: "lg" })} w-full sm:w-auto`}
              >
                Build your own
              </Link>
              <Link
                href="/models"
                className={`${buttonClasses({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
              >
                See the models
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
