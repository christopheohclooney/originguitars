import Image from "next/image";
import Link from "next/link";

import { HeroPhoto } from "@/components/motion/hero-entrance";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { buttonClasses } from "@/components/ui/button";
import { Overline } from "@/components/ui/overline";
import { FROM_PRICE_PENCE } from "@/data/options";
import { publicPhoto } from "@/lib/media";
import { formatPrice } from "@/lib/pricing";
import { shell, slant } from "@/lib/style";

/*
 * Photographs, resolved off disk at build. Drop a file in at these names and
 * it appears — see lib/media.ts for why they are not statically imported.
 */
const heroPhoto = publicPhoto("home-hero");
const precisionPhoto = publicPhoto("home-precision");

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
      {/*
        A full viewport, and only a floor — `min-h`, so a narrow screen whose
        copy needs more than that still grows rather than clipping.

        It was capped at 54rem on desktop, which is where it went wrong: on
        any display taller than 864px the hero stopped short of the fold and
        read as a shallow band rather than a screen. The cap was there to stop
        the copy stranding at the foot of a very tall window, but `justify-end`
        already handles that — the block sits against the bottom padding
        wherever the bottom is.

        svh rather than vh: on a phone, vh is the height with the browser
        chrome *collapsed*, so a 100vh hero is taller than what you can
        actually see until you scroll. svh is the visible height, which is
        what "one screen" is supposed to mean.
      */}
      <section className="relative mt-[calc(var(--header-h)*-1)] flex min-h-[100svh] flex-col justify-end overflow-hidden bg-white/[0.02] pt-[var(--header-h)]">
        {heroPhoto && <HeroPhoto src={heroPhoto.src} />}

        {/* Lays the ground back in under the copy — see globals.css. */}
        <div aria-hidden data-hero-scrim className="absolute inset-0" />

        <div className={`${shell} relative pb-16 md:pb-24`}>
          {/*
            Explicit gradient id. The mark's fill is a real gradient, and an
            SVG gradient id is document-global — two marks on one page under
            the default id is a duplicate id, where the second definition is
            dropped and both paths quietly reference the first. It renders
            identically today because the gradients are identical, which is
            exactly why it would go unnoticed until one of them changed.
          */}
          <Overline gradientId="hero-mark">Semi-custom guitars</Overline>

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
            className="mt-7 max-w-[16ch] font-display text-[clamp(2.75rem,7.4vw,5rem)] font-normal leading-[1.04] tracking-[-0.02em]"
          >
            Time to play by your own rules.
          </h1>

          {/*
            Copy left, the price and the way out right, sat on one baseline
            from md up — the same closing pattern About and the FAQ use, which
            is where it came from.
          */}
          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-16">
            {/*
              One sentence per line, as the reference sets it. Left to wrap on
              its own the pair broke mid-clause — "No waiting list or" rode up
              onto the first line — which loses the deliberate pairing of the
              two statements.

              Block spans rather than a break element or two paragraphs: it
              stays one paragraph, so what a screen reader announces and what
              you copy out are both still the whole sentence pair, and each
              line still wraps normally on a narrow screen instead of forcing
              a measure nothing fits.

              The measure holds the longer of the two sentences at 74
              characters. Wide for body copy, but this is two lines under a
              hero rather than a passage to read.
            */}
            <p className="max-w-[76ch] text-[1.0625rem] leading-[1.6] text-ink-muted md:text-[1.125rem]">
              <span className="block">
                We make custom builds for self-driven players in any music
                scene.
              </span>
              <span className="block">
                No waiting list or signature-artist price tag, to get what you
                really want.
              </span>
            </p>

            <div className="flex shrink-0 flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
              {/*
                Read off a constant rather than typed in — see the warning
                beside it in data/options.ts, where it contradicts the
                builder's own base price. Mono, like every other numeral on
                the site.
              */}
              <p className="font-mono text-[0.9375rem] tabular-nums text-ink-muted">
                From {formatPrice(FROM_PRICE_PENCE)}
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
        Photograph left, copy right, the photograph running off the left edge
        of the page. `overflow-hidden` on the section is what allows that: the
        frame is pushed past the content column to the viewport's edge and the
        section clips it rather than the page growing a horizontal scrollbar.

        The mirror of About's "Forged in the underground scene", down to the
        calculation that finds the edge — see the note on the frame below.
        Same device, opposite hand, which is the point: two sections that read
        as one system rather than two solutions to the same problem.
      */}
      <section className="overflow-hidden py-20 md:py-28">
        <div className={shell}>
          <div className="grid items-center gap-12 md:grid-cols-[1fr_minmax(0,26rem)] md:gap-16">
            {/*
              Pushed past the content column to the viewport's edge, so it
              lands there at any width rather than at one guessed breakpoint.
              The calculation runs off the shell's *outer* width (73.75rem)
              plus its padding, not the inner measure — the inner is already
              one padding short. The max() floor covers viewports narrower
              than the shell, where the first term goes negative.

              No colour treatment on the frame. The photography is placeholder
              until the real shoot lands, so a grade tuned to a stand-in would
              be tuning to something that is about to be replaced — and none
              of the photographs anywhere on the site carry a filter. What
              About's equivalent frame does carry is [data-lens-media], a
              radial dissolve of the rectangle's edges, and that is a mask
              rather than a grade: it follows the shape of the lens instead of
              ending the picture on a corner. Kept here for the same reason,
              and it is what the reference's soft round edge is.

              Laid out at the photograph's own proportion, read off the file
              by publicPhoto. No aspect is forced on it: the first pass framed
              it at 11:12 against a 4:5 shot and cropped 12.7% off the height,
              which took the top of the player's head and the bottom of the
              glow with it. The placeholder panel keeps 4:5 only because it
              has no picture to measure.
            */}
            <Reveal className="md:-ml-[max(1.5rem,calc((100vw-73.75rem)/2+2.5rem))]">
              {precisionPhoto?.width && precisionPhoto.height ? (
                <Image
                  data-lens-media
                  src={precisionPhoto.src}
                  width={precisionPhoto.width}
                  height={precisionPhoto.height}
                  alt="A bass player mid-performance, shot from below"
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className="h-auto w-full"
                />
              ) : (
                <ImagePlaceholder className="aspect-[4/5] w-full" />
              )}
            </Reveal>

            <Stagger>
              <StaggerItem as="div">
                <Overline gradientId="precision-mark">Build your own</Overline>
              </StaggerItem>

              <StaggerItem as="div">
                {/*
                  Section heading, so Archivo at medium and no metallic fill —
                  the rule from the designs is that the treatment belongs to
                  hero type and headings below it are set plain. Same ramp and
                  tracking as About's section headings.
                */}
                <h2 className="mt-7 max-w-[16ch] font-display text-[clamp(1.875rem,2.6vw,2.375rem)] font-medium leading-[1.15] tracking-[-0.02em]">
                  Where precision meets your spec
                </h2>
              </StaggerItem>

              <StaggerItem as="div">
                <p className="mt-7 max-w-[46ch] text-[1.0625rem] leading-[1.7] text-ink-muted">
                  Every build starts with the same exacting process, mahogany
                  body, hard maple neck, assembled and inspected in the UK then
                  it&apos;s shaped entirely around the choices you make.
                </p>
              </StaggerItem>

              <StaggerItem as="div">
                <Link
                  href="/builder"
                  className={`${buttonClasses({ size: "md" })} mt-9`}
                >
                  Build yours
                </Link>
              </StaggerItem>
            </Stagger>
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
