import Image from "next/image";
import Link from "next/link";

import { HeroPhoto } from "@/components/motion/hero-entrance";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { buttonClasses } from "@/components/ui/button";
import { ModelCard } from "@/components/ui/model-card";
import { Overline } from "@/components/ui/overline";
import { fromPricePence, models } from "@/data/models";
import { publicPhoto } from "@/lib/media";
import { formatFromPrice } from "@/lib/pricing";
import { shell } from "@/lib/style";

/*
 * Photographs, resolved off disk at build. Drop a file in at these names and
 * it appears — see lib/media.ts for why they are not statically imported.
 */
const heroPhoto = publicPhoto("home-hero");
const precisionPhoto = publicPhoto("home-precision");
const stepsPhoto = publicPhoto("home-how-it-works");

/* Titles and copy verbatim from the design reference. */
const steps = [
  {
    n: "01",
    title: "Design it",
    body: "Work through construction, timber, finish and hardware one step at a time, with the price updating as you go.",
  },
  {
    n: "02",
    title: "Place your order",
    body: "Confirm the spec and pay in full. Your order number comes straight back by email and our team handles the rest.",
  },
  {
    n: "03",
    title: "We build it",
    body: "Built by hand in the UK, then inspected by the same team before it leaves the bench.",
  },
  {
    n: "04",
    title: "Fulfillment",
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

        {/*
          The light leak, again, over the photograph.

          The one in (site)/layout.tsx sits below the z-10 content layer, which
          is right everywhere else — it is the page's ground catching light.
          Here the ground is an opaque photograph in that same layer, so the
          global leak is painted out across the whole of the hero and Home lost
          the rake that About, FAQ and the builder all have.

          Same rule, same stylesheet, applied where it now has to sit: above
          the picture rather than under it. Absolute with no z-index, so it is
          the section's own positioning context it anchors to and source order
          that stacks it — after the photograph, before the scrim.

          Before the scrim deliberately. The scrim is what the copy's contrast
          was measured against, and putting light *over* it would undo that
          silently. Any leak that reaches down to the copy gets damped by the
          same layer as everything else.

          Not duplication in the rendered page: the hero is a full viewport and
          the leak is min(72vh, 780px) from the top, so the layout's copy is
          wholly behind this section and never visible on Home.
        */}
        <div aria-hidden data-light-leak />

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

            The second ramp picks up where the first stops. clamp() tops out
            at 5rem from 1081px wide, so on a 1920 display the heading was the
            same 80px it is on a laptop while the column around it had grown —
            which reads as a smaller heading, not a wider one. 5.56vw passes
            through exactly 5rem at 1440, so the two ramps meet rather than
            step, and it then tracks the viewport like --shell does. The cap
            is where the line stops being a heading and starts being a poster.
          */}
          {/*
            "your own" is bound with a non-breaking space so the line breaks
            after "by" rather than after "your".

            A bound pair rather than a narrower measure or a hard <br>. The
            measure would have to be tuned to a width that happens to exclude
            one word, which is a number that stops being right the moment the
            type ramp or the copy moves; a <br> would need a breakpoint of its
            own to avoid forcing the break on a phone. This says the thing
            that is actually true — "your own" reads as one idea and should
            not be split — and it holds at every width on its own.
          */}
          <h1
            data-metal
            className="mt-7 max-w-[16ch] font-display text-[clamp(2.75rem,7.4vw,5rem)] font-normal leading-[1.04] tracking-[-0.02em] min-[1440px]:text-[min(5.56vw,6.75rem)]"
          >
            Time to play by your&nbsp;own rules.
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
                From {formatFromPrice(fromPricePence)}
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
          {/*
            Column ratio read off the reference rather than picked. It puts
            the frame's right edge at 54.5% of the viewport and the copy's
            left edge at 57%, which is where the reference has them; the
            previous 26rem copy column left the frame at 63.9% and pushed the
            copy out to 67.2%, so the picture dominated and the text was
            crowded into the last third.

            Fractions rather than a fixed rem for the copy column, so the two
            hold that ratio as the shell scales — a rem column keeps its width
            while the frame takes every pixel the viewport gains, which is the
            same mistake in slower motion. Checked at 1440 and 1920: 53.9/57.2
            and 54.5/57.0.

            minmax(0,…) on both because a grid track's default minimum is its
            content, and a long unbroken word or a wide image will otherwise
            push a column past its share.
          */}
          <div className="grid items-center gap-12 md:grid-cols-[minmax(0,1.36fr)_minmax(0,1fr)]">
            {/*
              Pushed past the content column to the viewport's edge, so it
              lands there at any width rather than at one guessed breakpoint.
              The calculation runs off the shell's *outer* width (--shell)
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
            <Reveal className="md:-ml-[max(1.5rem,calc((100vw-var(--shell))/2+2.5rem))]">
              {precisionPhoto?.width && precisionPhoto.height ? (
                <Image
                  data-lens-media="soft"
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
                {/*
                  Measured to hold the reference's four-line setting rather
                  than to fill the column. Left to the column it ran to 70
                  characters at 1920 and collapsed to three long lines — the
                  same words, but not the same block. 40ch reproduces the
                  reference's breaks exactly at 1440 and 1920 alike, and is a
                  better measure for prose than the column is.
                */}
                <p className="mt-7 max-w-[40ch] text-[1.0625rem] leading-[1.7] text-ink-muted">
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
        How it works — a full-bleed band with the workshop photograph running
        under the whole of it, per the design reference.

        The copy sits at both ends of the picture rather than on one side of
        it: heading and the two ways out at the top, the four steps along the
        bottom, and the shot showing between them. `justify-between` on the
        column is what holds that without either block being given a height,
        so the band keeps its shape as the copy reflows.

        The slanted rules between the numerals are gone. They were the brand
        angle used as architecture on a plain ground; over a photograph they
        are a second system competing with it, and the reference does not
        have them.
      */}
      <section
        className={`relative flex flex-col overflow-hidden py-20 md:py-24 ${
          stepsPhoto ? "min-h-[46rem] md:min-h-[52rem]" : ""
        }`}
      >
        {/*
          The same dissolve the precision frame carries, so the two sections
          let go of their photographs the same way — the band's far left and
          right fall off into the ground rather than ending on the viewport
          edge.
        */}
        {stepsPhoto && (
          <Image
            data-lens-media="soft"
            src={stepsPhoto.src}
            alt=""
            aria-hidden
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
        )}

        {/* Protects both ends and leaves the middle clear — see globals.css. */}
        <div aria-hidden data-steps-scrim className="absolute inset-0" />

        <div className={`${shell} relative flex flex-1 flex-col`}>
          <Reveal>
            <Overline gradientId="steps-mark">How it works</Overline>

            {/*
              Copy left, the two ways out right, on one baseline from md up.
              `items-start` rather than `items-end`: the heading runs to two
              lines and the buttons to one, and the reference hangs them from
              the same top edge rather than the same baseline.
            */}
            <div className="mt-7 flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-16">
              <h2 className="max-w-[16ch] font-display text-[clamp(1.875rem,2.6vw,2.375rem)] font-medium leading-[1.15] tracking-[-0.02em]">
                How your Origin build comes together
              </h2>

              {/*
                Secondary then primary, left to right, which is the order the
                reference has them and the same order About's closing pair
                uses — the primary sits at the far end of the reading
                direction.
              */}
              <div className="flex shrink-0 flex-col gap-4 sm:flex-row">
                <Link
                  href="/models"
                  className={`${buttonClasses({ variant: "secondary" })} w-full sm:w-auto`}
                >
                  See the models
                </Link>
                <Link
                  href="/faq"
                  className={`${buttonClasses()} w-full sm:w-auto`}
                >
                  Common Questions
                </Link>
              </div>
            </div>
          </Reveal>

          {/*
            `mt-auto` drops the steps to the foot of the band, and the padding
            is the floor under that — on a short viewport, or once the copy
            has reflowed into more lines, it is what stops them closing up
            against the heading.

            Both the band's height and that gap are conditional on the
            photograph. The height exists to give the picture room between the
            two blocks of copy; with no picture there it is just a hole, and
            the section should close up to the spacing any other section on
            the page would use.
          */}
          <Stagger
            as="ol"
            className={`mt-auto grid gap-14 md:grid-cols-4 md:gap-10 ${
              stepsPhoto ? "pt-24 md:pt-32" : "pt-16 md:pt-20"
            }`}
          >
            {steps.map((step) => (
              <StaggerItem as="li" key={step.n}>
                {/*
                  The numeral carries the slash, and the slash is the only
                  part of it that is decoration — the list is an <ol>, so the
                  ordering is already in the markup. Marked aria-hidden so it
                  is read as "01" rather than "01 slash", and split into its
                  own element so it can be toned without touching the figure.

                  Mono, like every numeral on the site, and at --color-ink
                  rather than the line tone the plain-ground version used:
                  over a photograph a #333 numeral disappears.
                */}
                <p className="font-mono text-[3.5rem] font-normal leading-none tracking-[-0.03em] text-ink">
                  {step.n}
                  <span aria-hidden className="text-ink-muted">
                    /
                  </span>
                </p>
                <h3 className="mt-6 text-[1.375rem] font-medium leading-[1.2] tracking-[-0.015em]">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[34ch] text-[0.9375rem] leading-[1.6] text-ink-muted">
                  {step.body}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/*
        The catalogue, and the page's last word before the footer.

        Centred, unlike every other section on Home — this one is a grid of
        equal things rather than a statement with a supporting column, so
        there is no left edge for the copy to hang from.
      */}
      <section className="pb-24 pt-4 md:pb-32">
        <div className={shell}>
          <Reveal>
            <h2 className="mx-auto max-w-[18ch] text-center font-display text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em]">
              Latest models
            </h2>
            <p className="mx-auto mt-5 max-w-[52ch] text-center text-[1.0625rem] leading-[1.6] text-ink-muted md:text-[1.125rem]">
              Made to order, one shape at a time. More on the way as we grow.
            </p>
          </Reveal>

          {/*
            Two columns from md, as the reference sets it, which leaves the
            third card alone on its own row. Deliberate rather than a gap to
            fill: the subheading says more are coming, and an empty cell beside
            the newest shape says it better than a filler card would.
          */}
          <Stagger
            as="ul"
            className="mt-14 grid gap-6 md:mt-20 md:grid-cols-2 md:gap-8"
          >
            {models.map((model) => (
              <StaggerItem as="li" key={model.slug}>
                {/*
                  Square, which is roughly the reference's proportion and
                  holds it at any column width — a fixed height would go
                  letterbox at 1920 and portrait at 1440. The card itself
                  lives in components/ui/model-card.tsx, shared with the
                  detail page's "other models" strip; a model with a detail
                  page renders as a stretched link, the rest as plain cards.
                */}
                <ModelCard model={model} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </main>
  );
}
