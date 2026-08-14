import Image from "next/image";
import Link from "next/link";

import { HeroPhoto } from "@/components/motion/hero-entrance";
import {
  ProcessSteps,
  type ProcessStepData,
} from "@/components/motion/process-scroll";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { buttonClasses } from "@/components/ui/button";
import { ModelTile } from "@/components/ui/model-tile";
import { Overline } from "@/components/ui/overline";
import { fromPricePence, models } from "@/data/models";
import { modelCardPhoto, publicPhoto } from "@/lib/media";
import { formatFromPrice } from "@/lib/pricing";
import { shell } from "@/lib/style";

/*
 * Photographs, resolved off disk at build. Drop a file in at these names and
 * it appears — see lib/media.ts for why they are not statically imported.
 */
const heroPhoto = publicPhoto("home-hero");
const precisionPhoto = publicPhoto("home-precision");

/*
 * The four process steps. Photos land at public/home-step-<n> and appear
 * without a code change; until then each slot stands the placeholder.
 * Alt text is written when a photograph exists to describe — the same rule
 * modelCardPhoto follows: alt follows the file, not the slot.
 */
const processSteps: ProcessStepData[] = [
  {
    label: "Step 1",
    title: "Build it",
    body: "Work through construction, timber, finish and hardware one step at a time, with the price updating as you go.",
    photo: publicPhoto("home-step-1"),
    alt: "",
  },
  {
    label: "Step 2",
    title: "Place your order",
    body: "Confirm the spec and pay in full. Your order number comes straight back by email.",
    photo: publicPhoto("home-step-2"),
    alt: "",
  },
  {
    label: "Step 3",
    title: "We build it",
    body: "Built by hand in the UK, then inspected by the same team before it leaves the bench.",
    photo: publicPhoto("home-step-3"),
    alt: "",
  },
  {
    label: "Step 4",
    title: "Fulfilment",
    body: "Up to six months depending on complexity. If yours runs longer we tell you directly.",
    photo: publicPhoto("home-step-4"),
    alt: "",
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
      {/*
        The screen-filling box is the inner wrapper rather than the section,
        so the mobile price strip below it can live inside the hero — same
        photograph, same scrim — while sitting past the fold. On desktop the
        strip does not render and the wrapper is the whole section, so the
        geometry is exactly what it was when the section carried these
        classes itself.
      */}
      <section className="relative mt-[calc(var(--header-h)*-1)] overflow-hidden bg-white/[0.02]">
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

        <div className="flex min-h-[100svh] flex-col justify-end pt-[var(--header-h)]">
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
              One sentence per line from sm up, as the reference sets it. Left
              to wrap on its own the pair broke mid-clause — "No waiting list
              or" rode up onto the first line — which loses the deliberate
              pairing of the two statements.

              Block spans rather than a break element or two paragraphs: it
              stays one paragraph, so what a screen reader announces and what
              you copy out are both still the whole sentence pair.

              Below sm the spans go back to inline and the pair wraps as one
              run of prose. The reference's device needs a measure that holds
              a sentence to a line; a phone has no such measure, so there the
              blocks were just mid-paragraph breaks landing wherever the
              sentences happened to end — four ragged lines instead of prose.
              The literal space between the spans is what keeps the two
              sentences separated when they are inline; JSX drops the
              newline-only whitespace between the tags.

              The measure holds the longer of the two sentences at 74
              characters. Wide for body copy, but this is two lines under a
              hero rather than a passage to read.
            */}
            <p className="max-w-[76ch] text-[1.0625rem] leading-[1.6] text-ink-muted md:text-[1.125rem]">
              <span className="sm:block">
                We make custom builds for self-driven players in any music
                scene.
              </span>{" "}
              <span className="sm:block">
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

                From sm only. On a phone this line sat alone between the copy
                and the button, too small to be the price and too close to be
                a caption — the price strip below the fold carries the figure
                there, at a size that reads as one.
              */}
              <p className="hidden font-mono text-[0.9375rem] tabular-nums text-ink-muted sm:block">
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
        </div>

        {/*
          The price, on a phone — one small scroll past the button, since the
          screen-filling wrapper above ends exactly at the fold. The figure
          at this size replaces the mono caption hidden above: down there it
          was a line nobody could read as the price; here it is the first
          thing the first scroll reveals.

          The treatment is the detail page's price row — the uppercase FROM
          label against the mono figure — so the number reads the same way
          wherever the site states it. Still inside the section, so it sits
          on the same photograph and scrim as the copy above it.
        */}
        <div className={`${shell} relative pb-14 sm:hidden`}>
          {/*
            Centred, because what it sits under is a full-width button. Left
            aligned it hung off the button's left edge with the rest of the
            row empty — the copy above has a left edge to line up with, but
            the CTA spans the column, so the price belongs on its centre.
          */}
          <p className="flex items-baseline justify-center gap-3">
            <span className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
              Prices start from
            </span>
            <span className="font-mono text-[1.5rem] tabular-nums">
              {formatFromPrice(fromPricePence)}
            </span>
          </p>
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
                {/*
                  Full-width below sm, like every other primary CTA on the
                  site while its row is stacked — this was the one standalone
                  primary still sitting at label width on a phone.
                */}
                <Link
                  href="/builder"
                  className={`${buttonClasses({ size: "md" })} mt-9 w-full sm:w-auto`}
                >
                  Build yours
                </Link>
              </StaggerItem>
            </Stagger>
          </div>
        </div>
      </section>

      {/*
        How it works — a sticky-scroll process, per the supplied reference.

        Three grid tracks from lg: the copy column, pinned below the header
        pill while the steps scroll past; a 24px track for the progress rail;
        and the steps themselves. The sticky column follows the model detail
        page's recipe exactly — sticky, self-start and the parent's
        items-start are all required together, and no ancestor may carry a
        transform, which is why the sticky wrapper is outside the Reveal
        rather than inside it.

        Below lg the grid has no columns, so everything stacks in source
        order — copy, then the four steps — and the rail stays hidden.
      */}
      <section className="py-20 md:py-28">
        <div className={shell}>
          {/*
            The two fr tracks are equal on purpose: with the same gap either
            side of the 24px rail track, equal columns are what put the line
            down the exact centre of the shell rather than wherever a fixed
            copy column happens to leave it.
          */}
          <div className="grid gap-y-14 lg:grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] lg:items-start lg:gap-x-12">
            <div className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:self-start">
              <Reveal>
                <Overline gradientId="steps-mark">How it works</Overline>
                <h2 className="mt-7 max-w-[16ch] font-display text-[clamp(1.875rem,2.6vw,2.375rem)] font-medium leading-[1.15] tracking-[-0.02em]">
                  How your Origin build comes together
                </h2>
                <p className="mt-5 max-w-[34ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
                  Four steps, start to finish. Design, order, build and
                  delivery — carried through by the same team, one build at a
                  time.
                </p>

                {/*
                  The two ways out the old band carried, kept: this is Home's
                  only body-content route into the catalogue index and the
                  FAQ, and the Stage 1 brief requires all four destinations
                  be reachable from body content, not only the nav.
                */}
                {/*
                  A grid rather than a flex row so the pair always share one
                  width: stacked they fill the single column, side by side
                  from sm they split the container in half, and from lg the
                  stack shrink-wraps to the wider label — the cells keep them
                  equal in every case, where auto-width pills sized each to
                  its own text.
                */}
                <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:w-fit lg:grid-cols-1">
                  <Link
                    href="/models"
                    className={`${buttonClasses({ variant: "secondary" })} w-full`}
                  >
                    See the models
                  </Link>
                  <Link
                    href="/faq"
                    className={`${buttonClasses()} w-full`}
                  >
                    Common Questions
                  </Link>
                </div>
              </Reveal>
            </div>

            <ProcessSteps steps={processSteps} />
          </div>
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
            {/*
              Left on a phone, centred from sm — the site-wide rule for
              reading content. Centring is a device for a block that has a
              symmetrical field around it; a phone column has no such field,
              so a centred heading and its copy just lose the left edge every
              other line of type on the screen is hung from, and a ragged
              left is harder to read down.

              `sm:mx-auto` moves with the alignment. Left-aligned text inside
              a centred narrow box would sit the block in from the gutter
              while its own text ran left — a second, invisible margin.
            */}
            <h2 className="max-w-[18ch] font-display text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em] sm:mx-auto sm:text-center">
              Latest models
            </h2>
            <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-[1.6] text-ink-muted sm:mx-auto sm:text-center md:text-[1.125rem]">
              Made to order, one shape at a time. More on the way as we grow.
            </p>
          </Reveal>

          {/*
            The catalogue's own row, rendered here rather than restated: same
            component, same photography, same two states, so Home and /models
            cannot show a visitor two different versions of the same three
            instruments. What stays behind on /models is the page's heading —
            this section keeps its own.

            Three columns rather than the two this section used to run. Two
            left the third card alone on its own row, which was defensible
            while the cards were squares and the empty cell read as "more are
            coming"; with the catalogue's proportions it reads as a row that
            did not finish loading. The tighter column gap is the catalogue's
            too, and for the same reason — three views of one range, seamed
            close enough to read as a set.
          */}
          <Stagger
            as="ul"
            className="mt-14 grid gap-12 md:mt-20 md:grid-cols-3 md:gap-5"
          >
            {models.map((model) => (
              <StaggerItem as="li" key={model.slug}>
                {/*
                  h3, not the h2 the catalogue's own page gives these: here
                  they sit under "Latest models", so they are a level further
                  down the outline.
                */}
                <ModelTile
                  model={model}
                  headingLevel={3}
                  {...modelCardPhoto(model.slug, model.name)}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </main>
  );
}
