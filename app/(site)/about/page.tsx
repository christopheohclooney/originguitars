import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import aboutBodyOne from "@/public/about-bodyimage-one.jpg";
import aboutBodyTwo from "@/public/about-bodyimage-two.jpg";
import aboutHero from "@/public/about-hero-image.jpg";
import aboutForged from "@/public/about-bodyimage-one.jpg";
import artistHellbound from "@/public/artist-hellbound.jpg";
import { Parallax } from "@/components/motion/parallax";
import { Reveal, Stagger, StaggerItem, WordReveal } from "@/components/motion/reveal";
import { buttonClasses } from "@/components/ui/button";
import { ArtistCarousel, type Artist } from "@/components/ui/artist-carousel";
import { PageHero } from "@/components/ui/page-hero";
import { shell } from "@/lib/style";

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
/*
 * Only Hellbound is real. The other two carry the same photograph and are
 * marked as unwritten rather than repeating Hellbound's copy — three
 * identical slides would leave no way to tell whether the paging works, and
 * a name invented to fill the gap is worse than an obvious blank.
 *
 * Swapping in a real artist is one entry: photograph, name, blurb, alt.
 */
const artists: Artist[] = [
  {
    name: "Hellbound, Scotland",
    blurb:
      "Aggressive Glasgow-based hardcore/metal band associated with the Northern Unrest scene. A raw blend of '90s-style Clevocore, thrash, and metallic hardcore.",
    image: artistHellbound,
    imageAlt: "Hellbound, photographed at night in a graveyard",
  },
  {
    name: "Second artist — to follow",
    blurb:
      "Placeholder. Artist name, location and description still to come, along with their photograph.",
    image: artistHellbound,
    imageAlt: "",
  },
  {
    name: "Third artist — to follow",
    blurb:
      "Placeholder. Artist name, location and description still to come, along with their photograph.",
    image: artistHellbound,
    imageAlt: "",
  },
];

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
        Copy left, photograph right, the photograph running off the right
        edge of the page. `overflow-hidden` on the section is what allows
        that: the frame is pushed past the content column by half the gutter
        either side, and the section clips it rather than the page growing a
        horizontal scrollbar.

        This covers the same ground as "Why it all started" above it — both
        open on Larry and turn on the same gap. Kept deliberately; flagged
        and confirmed rather than assumed.
      */}
      <section className="overflow-hidden py-20 md:py-28">
        <div className={shell}>
          <div className="grid items-center gap-12 md:grid-cols-[minmax(0,26rem)_1fr] md:gap-16">
            <Stagger>
              <StaggerItem as="div">
                <p className="flex items-center gap-3 font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-ink-muted">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="h-4 w-4 shrink-0"
                    fill="currentColor"
                  >
                    {/* Four-point sparkle: the brand's mark for a section label. */}
                    <path d="M12 0c.6 5.9 5.5 10.8 11.4 11.4v1.2C17.5 13.2 12.6 18.1 12 24c-.6-5.9-5.5-10.8-11.4-11.4v-1.2C6.5 10.8 11.4 5.9 12 0Z" />
                  </svg>
                  Origin story
                </p>
              </StaggerItem>

              <StaggerItem as="div">
                <h2 className="mt-7 font-display text-[clamp(1.875rem,2.6vw,2.375rem)] font-normal leading-[1.15] tracking-[-0.02em]">
                  Forged in the underground scene
                </h2>
              </StaggerItem>

              <StaggerItem as="div">
                <p className="mt-7 text-[1.0625rem] leading-[1.7] text-ink-muted">
                  Larry started Origin after years around UK hardcore and punk
                  shows, watching players make do with whatever they could
                  afford or wait years and pay a premium for anything genuinely
                  custom.
                </p>
              </StaggerItem>

              <StaggerItem as="div">
                <p className="mt-6 text-[1.0625rem] leading-[1.7] text-ink-muted">
                  Origin exists to close that gap: guitars built exactly to
                  spec, made in India, inspected and finished by hand in the
                  UK, at a price that means owning one is actually possible.
                </p>
              </StaggerItem>
            </Stagger>

            {/*
              Pushed past the content column to the viewport's edge, so it
              lands there at any width rather than at one guessed breakpoint.

              The calculation runs off the shell's *outer* width (73.75rem)
              plus its padding, not the inner measure — the inner is already
              one padding short, and using it overshot the edge by exactly
              that much. The max() floor covers viewports narrower than the
              shell, where the first term goes negative.
            */}
            <Reveal className="md:-mr-[max(2.5rem,calc((100vw-73.75rem)/2+2.5rem))]">
              <Image
                src={aboutForged}
                alt="A guitarist on stage, shot through a fisheye lens"
                sizes="(min-width: 768px) 60vw, 100vw"
                placeholder="blur"
                className="h-auto w-full"
              />
            </Reveal>
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
          {/*
            No aspect forced on the frames. Both photographs carry the
            reference's proportions rather than the 4:5 the placeholders were
            sitting in, so letting them size themselves shows them instead of
            cropping off the difference.

            Two layers of motion, on two elements. The outer one drifts with
            the scroll and the inner one handles the entrance; both write to
            `transform`, so on a single node they would overwrite each other.

            The distances differ deliberately — 40 against 90. Matching them
            would slide the pair as one block, which reads as a rendering
            quirk rather than movement. Unmatched, the gap between the frames
            opens and closes as they pass.
          */}
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <Parallax distance={40}>
              <Reveal>
                <Image
                  src={aboutBodyOne}
                  alt="A guitarist on stage, lit from behind in blue"
                  placeholder="blur"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="h-auto w-full"
                />
              </Reveal>
            </Parallax>

            <Parallax distance={90} className="md:mt-40">
              <Reveal delay={0.12}>
                <Image
                  src={aboutBodyTwo}
                  alt="A guitarist mid-performance, caught in motion blur"
                  placeholder="blur"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="h-auto w-full"
                />
              </Reveal>
            </Parallax>
          </div>
        </div>
      </section>

      <ArtistCarousel
        heading="Origin artist family"
        intro="Underground players who trust Origin with the sonic demands of their music and performances."
        artists={artists}
      />

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
