import { existsSync } from "node:fs";
import { join } from "node:path";

import Link from "next/link";

import { HeroPhoto } from "@/components/motion/hero-entrance";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { buttonClasses } from "@/components/ui/button";
import { Overline } from "@/components/ui/overline";
import { BASE_PRICE_PENCE } from "@/data/options";
import { formatPrice } from "@/lib/pricing";
import { shell, slant } from "@/lib/style";

/*
 * The hero photograph.
 *
 * Drop the shot in at public/home-hero.jpg and it appears — no code change.
 * Referenced by path rather than statically imported because a static import
 * of a file that is not there yet fails the build, and the shot is still
 * being chosen. See HeroPhoto for what that trades away.
 *
 * Checked on disk rather than rendered blind. An <Image> pointed at a missing
 * file puts a broken-image glyph in the corner of the page, which is worse
 * than no photograph at all — without one the hero simply sits on its own
 * ground, which is a composition that stands up on its own. This is a server
 * component, so the check runs once at build and costs nothing per request.
 */
const HERO_PHOTO = "/home-hero.jpg";
const heroPhotoReady = existsSync(join(process.cwd(), "public", HERO_PHOTO));

const steps = [
  {
    n: "01",
    title: "Build it",
    body: "Work through construction, timber, finish and hardware one step at a time, with the price updating as you go.",
  },
  {
    n: "02",
    title: "Place your order",
    body: "Confirm the spec and pay in full. Your order number comes straight back by email.",
  },
  {
    n: "03",
    title: "We build it",
    body: "Built by hand in the UK, then inspected by the same team before it leaves the bench.",
  },
  {
    n: "04",
    title: "We ship it",
    body: "Up to six months depending on complexity. If yours runs longer we tell you directly.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/*
        The hero: a full-bleed photograph with the copy sat in the bottom-left
        corner of it, per the design reference.

        The band starts above the header rather than below it. The negative
        margin pulls its box up through the header's strip and the matching
        padding puts the content back, so nothing moves and no copy slides
        under the chrome. Two things depend on it: the photograph runs behind
        the floating pill, which is what gives the glass something to sample;
        and the band's top edge is no longer a hard tonal step landing exactly
        at the pill's bottom, across the one place that should read as a
        continuous field. globals.css documents that bug and fixes it for the
        builder — Home had the same one untreated.

        The 2% white is the ground under the photograph, not decoration. Over
        --color-surface it composites to exactly #0f0f0f, the canvas value the
        section used to paint opaquely, but as alpha — so [data-light-leak],
        which sits below this z-10 content layer, still rakes through while
        the photograph is missing. Same reasoning as --canvas-glow.

        `justify-end` is what puts the copy at the foot of the frame without
        giving anything a fixed height, so the hero can grow with its own
        content on a narrow screen and still bottom-align on a wide one.
      */}
      <section className="relative mt-[calc(var(--header-h)*-1)] flex min-h-[38rem] flex-col justify-end overflow-hidden bg-white/[0.02] pt-[var(--header-h)] md:min-h-[min(100svh,54rem)]">
        {heroPhotoReady && <HeroPhoto src={HERO_PHOTO} />}

        {/* Lays the ground back in under the copy — see globals.css. */}
        <div aria-hidden data-hero-scrim className="absolute inset-0" />

        <div className={`${shell} relative pb-16 md:pb-24`}>
          <Overline>Semi-custom guitars</Overline>

          {/*
            The display treatment the redesign settled on, and the rule the
            last commit on this branch applied everywhere else: metallic hero
            type is Archivo at regular. It was Geist at bold here — the one
            hero on the site still carrying the pre-redesign face, which is
            why it read as a different site's heading to About's and FAQ's.

            Regular is not merely lighter, it is what the treatment needs: at
            this size the gradient does the work weight would otherwise do,
            and going heavier closes the counters the light has to pass
            through. Tracking eases off with it for the same reason — Archivo
            needs less negative than Geist, and -0.04em closed what the
            lighter weight is there to open.

            One step above PageHero's ramp at the top end. Home is the site's
            peak and its heading is left-aligned against a photograph rather
            than centred in a column, so it carries the extra size without
            crowding its own measure.
          */}
          <h1
            data-metal
            className="mt-7 max-w-[15ch] font-display text-[clamp(2.75rem,7.4vw,5rem)] font-normal leading-[1.04] tracking-[-0.02em]"
          >
            No one else will have this one
          </h1>

          {/*
            Copy left, the price and the way out right, sat on one baseline
            from md up — the same closing pattern About and the FAQ use, which
            is where it came from.
          */}
          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-16">
            <p className="max-w-[52ch] text-[1.0625rem] leading-[1.6] text-ink-muted md:text-[1.125rem]">
              Made-to-order electric guitars, built by hand in the UK. You set
              the spec — shape, timber, hardware, finish — and we build that
              guitar and no other.
            </p>

            <div className="flex shrink-0 flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
              {/*
                Read off the builder's own constant rather than typed in, so
                the number on the doormat cannot drift from the one the
                builder opens at. Mono, like every other numeral on the site.
              */}
              <p className="font-mono text-[0.9375rem] tabular-nums text-ink-muted">
                From {formatPrice(BASE_PRICE_PENCE)}
              </p>
              <Link
                href="/builder"
                className={`${buttonClasses({ size: "lg" })} w-full sm:w-auto`}
              >
                Build yours
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/*
        A trough. No entrance animation and no devices — after the hero, the
        page should drop to a single held statement before it builds again.
      */}
      <section className="py-24 md:py-36">
        <div className={shell}>
          <p className="max-w-[24ch] text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.03em]">
            A guitar built to your spec should not mean signature-artist money
            or a two-year wait.
          </p>
          <p className="mt-8 max-w-[62ch] text-[1.0625rem] leading-[1.7] text-ink-muted">
            Origin builds semi-custom instruments to order, in the United
            Kingdom, at a price that reflects the work rather than the name on
            the headstock.
          </p>
          <Link
            href="/about"
            className={`${buttonClasses({ variant: "tertiary", size: "md" })} mt-8`}
          >
            Read our story
          </Link>
        </div>
      </section>

      {/*
        Second peak, carried by a tonal shift rather than more type. The
        numerals do the structural work; the slanted rules between them are the
        brand angle used as architecture rather than as a 44px tick.
      */}
      <section className="border-y border-line bg-surface py-24 md:py-32">
        <div className={shell}>
          <Reveal>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <h2 className="max-w-[14ch] text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.05] tracking-[-0.03em]">
                Four steps, no surprises
              </h2>
              <p className="max-w-[38ch] text-[1rem] leading-[1.6] text-ink-muted">
                Nothing is renegotiated after you order. The price you see as
                you build is the price you pay.
              </p>
            </div>
          </Reveal>

          <Stagger
            as="ol"
            className="mt-16 grid gap-14 md:mt-20 md:grid-cols-4 md:gap-10"
          >
            {steps.map((step, i) => (
              <StaggerItem as="li" key={step.n} className="relative">
                {/*
                  Set to the numeral's height, not the column's. A 12° lean
                  across a full-height rule travels ~42px horizontally, which
                  cannot fit a 40px column gap — at full height it collided
                  with the numeral beside it.
                */}
                {i > 0 && (
                  <span
                    aria-hidden
                    style={slant}
                    className="absolute -left-5 top-1 hidden h-14 w-px bg-line-strong md:block"
                  />
                )}
                <p className="font-mono text-[3.25rem] font-medium leading-none tracking-[-0.04em] text-line-strong">
                  {step.n}
                </p>
                <h3 className="mt-6 text-[1.375rem] font-semibold leading-[1.2] tracking-[-0.015em]">
                  {step.title}
                </h3>
                <p className="mt-3 text-[0.9375rem] leading-[1.6] text-ink-muted">
                  {step.body}
                </p>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal>
            <Link
              href="/builder"
              className={`${buttonClasses({ size: "lg" })} mt-16`}
            >
              Start your build
            </Link>
          </Reveal>
        </div>
      </section>

      {/* A fast, quiet close. One line and a way out. */}
      <section className="py-20 md:py-24">
        <div
          className={`${shell} flex flex-col gap-6 md:flex-row md:items-center md:justify-between`}
        >
          <p className="max-w-[34ch] text-[1.375rem] font-semibold leading-[1.25] tracking-[-0.02em]">
            Questions before you start?
          </p>
          <Link
            href="/faq"
            className={`${buttonClasses({ variant: "secondary", size: "lg" })} shrink-0`}
          >
            Read the FAQ
          </Link>
        </div>
      </section>
    </main>
  );
}
