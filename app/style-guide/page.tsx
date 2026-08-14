import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ImagePlaceholder } from "@/components/image-placeholder";
import { MotionProvider } from "@/components/motion/motion-provider";
import { NavGlow } from "@/components/motion/nav-glow";
import {
  Button,
  buttonBase,
  buttonSizes,
  buttonVariants,
} from "@/components/ui/button";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { ModelBadge } from "@/components/ui/model-badge";
import { ModelTile } from "@/components/ui/model-tile";
import { Overline, OriginMark } from "@/components/ui/overline";
import { PageHero } from "@/components/ui/page-hero";
import { PriceBar as SharedPriceBar } from "@/components/ui/price-bar";
import { pickFaqs } from "@/data/faqs";
import { models } from "@/data/models";
import { modelCardPhoto } from "@/lib/media";
import {
  cardSurface,
  fieldControl,
  fieldLabel,
  glassPill,
  shell,
  slant,
  unslant,
} from "@/lib/style";

/*
 * The reference sheet.
 *
 * Rewritten against the built site rather than maintained alongside it. The
 * first version of this page was the Stage 0 artefact — white ground, #141414
 * ink, pure black CTAs, Geist at 700 — and every one of those decisions has
 * since been replaced. A style guide describing a site that no longer exists
 * is worse than none, because it is the thing people check.
 *
 * Two rules hold it to the site from here.
 *
 * Anything that can be rendered is rendered from the real thing: the buttons
 * are the Button component, the price bar is the builder's price bar, the
 * accordion is the FAQ's accordion holding real FAQ entries, the fields are
 * the contact form's fields, the swatches are filled from the live custom
 * properties rather than from hexes typed in here. When one of those moves,
 * this page moves with it.
 *
 * Anything that cannot — a ratio, a curve, a breakpoint — is written down as
 * a figure with the file that owns it named beside it, so there is somewhere
 * to go and check.
 *
 * It sits outside the (site) route group and so carries no header or footer of
 * its own. It documents both, and a page that showed the real chrome above a
 * specimen of the same chrome would be reading itself twice; the fixed price
 * bar at the foot would also land on top of the footer.
 */

export const metadata: Metadata = {
  title: "Design system — Origin Guitars",
  description:
    "The live reference sheet: ground, colour, type, components, motion and layout as the site currently ships them.",
};

/* The overline's treatment without the mark — the same one legal pages use. */
const labelClasses =
  "font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-ink-muted";

const noteClasses = "font-mono text-[0.75rem] leading-[1.6] text-ink-muted";

const proseClasses = "text-[1.0625rem] leading-[1.7] text-ink-muted";

function Section({
  index,
  title,
  intro,
  children,
}: {
  index: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line py-20 md:py-28">
      <div className={shell}>
        <p className={labelClasses}>{index}</p>
        <h2 className="mt-5 font-display text-[clamp(1.875rem,2.6vw,2.375rem)] font-medium leading-[1.15] tracking-[-0.02em]">
          {title}
        </h2>
        <div className={`mt-6 max-w-[62ch] ${proseClasses}`}>{intro}</div>
        <div className="mt-14">{children}</div>
      </div>
    </section>
  );
}

function Sub({
  title,
  children,
  className = "mb-16 last:mb-0",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="mb-6 font-display text-[1.5rem] font-medium leading-[1.2] tracking-[-0.015em]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className={`mt-3 ${noteClasses}`}>{children}</p>;
}

/* ------------------------------------------------------------------ specs */

type SpecRow = {
  name: string;
  value: string;
  note: string;
};

function SpecTable({ rows }: { rows: SpecRow[] }) {
  return (
    <dl className="border-t border-line">
      {rows.map((row) => (
        <div
          key={row.name}
          className="grid gap-1.5 border-b border-line py-4 md:grid-cols-[15rem_11rem_1fr] md:items-baseline md:gap-8"
        >
          <dt className="font-mono text-[0.8125rem] text-ink">{row.name}</dt>
          <dd className="font-mono text-[0.8125rem] text-ink-muted">
            {row.value}
          </dd>
          <dd className="text-[0.875rem] leading-[1.55] text-ink-muted">
            {row.note}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------------------------------------------------------------- colour */

type SwatchProps = {
  /* The token name, which is also how the chip is filled — see below. */
  token: string;
  hex: string;
  use: string;
  /* Measured against the page ground unless the entry says otherwise. */
  contrast?: string;
};

/*
 * The chip is filled from the live custom property rather than from the hex
 * beside it, so a token that moves in globals.css moves here and the label
 * next to it is the thing that then reads as wrong. The inverse — filling from
 * the hex — is a swatch that can never disagree with itself and never agrees
 * with the site.
 *
 * Every chip carries a hairline. On the old light sheet only the pale ones
 * needed it; on a near-black ground it is the dark ones that dissolve into the
 * page without one, which is most of the palette.
 */
function Swatch({ token, hex, use, contrast }: SwatchProps) {
  return (
    <div>
      <div
        className="h-24 w-full rounded-lg border border-line-strong"
        style={{ backgroundColor: `var(--color-${token})` }}
      />
      <p className="mt-3 text-[0.9375rem] font-medium">{token}</p>
      <p className="font-mono text-[0.8125rem] uppercase text-ink-muted">
        {hex}
      </p>
      <p className="mt-1.5 text-[0.8125rem] leading-[1.5] text-ink-muted">
        {use}
      </p>
      {contrast && (
        <p className="mt-1.5 font-mono text-[0.75rem] text-ink-muted">
          {contrast}
        </p>
      )}
    </div>
  );
}

function SwatchGroup({
  label,
  swatches,
}: {
  label: string;
  swatches: SwatchProps[];
}) {
  return (
    <div className="mb-14 last:mb-0">
      <h3 className="mb-5 font-display text-[1.5rem] font-medium leading-[1.2] tracking-[-0.015em]">
        {label}
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {swatches.map((s) => (
          <Swatch key={s.token} {...s} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ type */

function TypeRow({ spec, children }: { spec: string; children: ReactNode }) {
  return (
    <div className="grid gap-4 border-b border-line py-8 last:border-b-0 md:grid-cols-[15rem_1fr] md:gap-10">
      <p className="font-mono text-[0.75rem] leading-[1.6] text-ink-muted">
        {spec}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------ price bar */

/*
 * The specimen renders the shared component the builder uses, with demo props,
 * so the reference sheet and the live bar cannot drift apart.
 */
function PriceBar({ fixed }: { fixed?: boolean }) {
  return (
    <SharedPriceBar
      variant={fixed ? "fixed" : "static"}
      stepLabel="Body colour"
      selectionLabel="Alder — Skyburst Metallic"
      stepCurrent={3}
      stepTotal={13}
      priceLabel="£1,949.00"
    />
  );
}

/*
 * One of each state, from the real catalogue — so the specimen shows the two
 * treatments against each other rather than one card twice.
 */
const specimenModels = [
  models.find((m) => m.status === "available")!,
  models.find((m) => m.status === "coming-soon")!,
];

/* Two real entries, so the specimen carries the site's own words. */
const specimenFaqs = pickFaqs("lead-time", "changes");

export default function StyleGuidePage() {
  return (
    <MotionProvider>
      <main className="pb-40">
        <PageHero
          title="Design system"
          intro="Everything below is what the built site does today — read off Home, About, Builder, FAQ and Contact, and rendered here from the same tokens and components those pages use."
          introMeasure="62ch"
        />

        <div className={`${shell} pb-16 md:pb-20`}>
          <div className="max-w-[62ch]">
            <Overline gradientId="guide-mark">How to read this sheet</Overline>
            <p className={`mt-6 ${proseClasses}`}>
              Anything that can be rendered is rendered from the real thing: the
              buttons are the Button component, the price bar is the builder
              bar, the accordion is the FAQ accordion holding real FAQ entries,
              the fields are the contact form fields, and every colour chip is
              filled from the live custom property rather than from a hex typed
              in here. Anything that cannot — a ratio, a curve, a breakpoint —
              is written down as a figure with the file that owns it named
              beside it.
            </p>
            <p className={`mt-5 ${proseClasses}`}>
              Where two pages disagree about what ought to be one pattern, this
              sheet says so and leaves it open rather than picking a winner.
              Those are collected at the foot of the page.
            </p>
          </div>
        </div>

        <Section
          index="01"
          title="Ground and light"
          intro={
            <>
              <p>
                Dark only. There is deliberately no light theme: the instrument
                is the only thing on screen that should carry colour, and a
                near-black ground is what lets a black guitar read as an object
                rather than a hole.
              </p>
              <p className="mt-5">
                Two grounds, and the deeper one is the page. Everything above
                them is white alpha rather than a third and fourth solid tone —
                an alpha lift composites over whatever it lands on, so it
                survives a photograph, the light leak and a change to the
                grounds themselves without being re-derived.
              </p>
            </>
          }
        >
          <Sub title="The two grounds">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-surface px-6 py-10">
                <p className="font-mono text-[0.8125rem] uppercase text-ink">
                  #0A0A0A
                </p>
                <p className="mt-2 text-[0.9375rem] font-medium">surface</p>
                <p className="mt-2 max-w-[36ch] text-[0.875rem] leading-[1.55] text-ink-muted">
                  The page. Every content page and the builder&apos;s chrome sit
                  on it.
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-canvas px-6 py-10">
                <p className="font-mono text-[0.8125rem] uppercase text-ink">
                  #0F0F0F
                </p>
                <p className="mt-2 text-[0.9375rem] font-medium">canvas</p>
                <p className="mt-2 max-w-[36ch] text-[0.875rem] leading-[1.55] text-ink-muted">
                  The lifted tone: the footer band, every card, and the
                  builder&apos;s stage.
                </p>
              </div>
            </div>
            <Note>
              body is set on surface; body:has([data-canvas]) switches the whole
              page to canvas so the builder&apos;s header band does not step —
              globals.css
            </Note>
          </Sub>

          <Sub title="The alpha ladder">
            <div className="rounded-2xl border border-line bg-canvas p-6 md:p-8">
              <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
                <div className="h-20 rounded-lg border border-line bg-white/[0.02]" />
                <div className="h-20 rounded-lg border border-line bg-white/[0.025]" />
                <div className="h-20 rounded-lg border border-line bg-white/[0.035]" />
                <div className="h-20 rounded-lg border border-line bg-white/[0.045]" />
                <div className="h-20 rounded-lg border border-line bg-white/[0.06]" />
                <div className="h-20 rounded-lg border border-line bg-white/[0.1125]" />
              </div>
            </div>
            <div className="mt-8">
              <SpecTable
                rows={[
                  {
                    name: "white 2%",
                    value: "→ #0F0F0F",
                    note: "The home hero band's ground, over surface. Alpha rather than an opaque canvas so the light leak still rakes through while the photograph is missing.",
                  },
                  {
                    name: "white 2.5%",
                    value: "→ #151515",
                    note: "Form field fill, over the card it sits in. A field set on surface reads as a hole cut through the panel.",
                  },
                  {
                    name: "white 3.5%",
                    value: "→ #171717",
                    note: "The model card's hover lift, over canvas. It raises the card and the drawing inside it together.",
                  },
                  {
                    name: "white 4.5%",
                    value: "→ #1A1A1A",
                    note: "The icon chip inside a contact method card. Goes to 8% on hover.",
                  },
                  {
                    name: "white 6%",
                    value: "→ #191919",
                    note: "The header pill's glass, over whatever is behind it. A tint, not a slab — the blur is what gives it a ground.",
                  },
                  {
                    name: "white 11.25%",
                    value: "→ #2A2A2A",
                    note: "--canvas-glow at its centre, over canvas. Light, not paint: an opaque centre would block the leak wherever the two overlap.",
                  },
                ]}
              />
            </div>
          </Sub>

          <Sub title="The light leak">
            <p className={`mb-6 max-w-[62ch] ${proseClasses}`}>
              Soft streaks raking in from the top right, over the top ~72vh of
              every page. Built from static gradients rather than an image or a
              shader because it sits directly under the header pill, and the
              pill is a backdrop-filter: anything repainting here forces that
              blur to recompute over its whole radius, every frame. The specimen
              below is the real rule, clipped to a box.
            </p>
            <div className="relative h-72 overflow-hidden rounded-2xl border border-line bg-surface">
              <div aria-hidden data-light-leak />
            </div>
            <Note>
              three bands off --leak-angle: 130deg, plus an SVG-noise dither at
              3.5% — eight-bit colour cannot express the falloff without it
            </Note>
          </Sub>

          <Sub title="Light and mask treatments" className="mb-0">
            <p className={`mb-8 max-w-[62ch] ${proseClasses}`}>
              Each is a data attribute in globals.css rather than a utility
              class, because each is a gradient stack tuned by eye against a
              specific photograph and measured for contrast where copy sits on
              it.
            </p>
            <SpecTable
              rows={[
                {
                  name: "[data-light-leak]",
                  value: "layout, home hero",
                  note: "The rake. Home carries a second copy above its photograph, since the layout's sits below the content layer and would be painted out.",
                },
                {
                  name: "[data-canvas]",
                  value: "builder",
                  note: "--canvas-glow: a pool of light behind the instrument, so a near-black cut-out keeps its silhouette.",
                },
                {
                  name: "[data-hero-scrim]",
                  value: "home hero",
                  note: "Lays the ground back under the copy, weighted bottom-left. Far heavier below md, where the portrait crop puts the subject directly behind the words.",
                },
                {
                  name: "[data-steps-scrim]",
                  value: "home, how it works",
                  note: "Weighted to both ends with the middle left clear — copy sits above and below one photograph.",
                },
                {
                  name: "[data-model-scrim]",
                  value: "home, model cards",
                  note: "Lifts the head of the card and darkens under the name and price.",
                },
                {
                  name: "[data-hero-media]",
                  value: "page hero",
                  note: "Dissolves the photograph's four edges so it ends by fading out rather than on a rectangle.",
                },
                {
                  name: "[data-lens-media]",
                  value: "about",
                  note: "Radial dissolve that follows the shape of the lens rather than the shape of the box.",
                },
                {
                  name: '[data-lens-media="soft"]',
                  value: "home",
                  note: "The same, let go of earlier, so the lit pool reads smaller than its frame without the frame moving in the grid.",
                },
                {
                  name: "[data-blueprint]",
                  value: "about closing",
                  note: "Hides the V's bottom spike into the copy below it, without taking the bridge and pickups down with it.",
                },
                {
                  name: "[data-metal]",
                  value: "hero type",
                  note: "Grey → white → grey, clipped to the glyphs. Falls back to CanvasText under forced colours.",
                },
                {
                  name: "[data-reveal]",
                  value: "everywhere",
                  note: "Marks anything whose hidden state is server-rendered, so CSS can force it visible under reduced motion or with JavaScript off.",
                },
                {
                  name: "[data-option-tile]",
                  value: "builder",
                  note: "Lifts the focus ring off the visually-hidden radio onto the tile you can actually see.",
                },
              ]}
            />
          </Sub>
        </Section>

        <Section
          index="02"
          title="Colour"
          intro={
            <>
              <p>
                The light palette inverted, and one rule drives it:
                --color-cta is reserved for primary actions and is the only pure
                white on the page. Every other white is --color-ink, a touch
                darker, so a button is always the brightest element on any
                screen without needing a colour to announce itself.
              </p>
              <p className="mt-5">
                Strictly monochrome plus one functional red. No brand accent:
                across thirteen builder steps an accent would compete with the
                guitar finishes, which are the only colour the site needs.
                Ratios below are measured against --color-surface.
              </p>
            </>
          }
        >
          <SwatchGroup
            label="Ink"
            swatches={[
              {
                token: "ink",
                hex: "#F2F2F2",
                use: "Headings, body copy, numerals, hairline marks.",
                contrast: "17.7:1",
              },
              {
                token: "ink-muted",
                hex: "#8C8C8C",
                use: "Secondary copy, intros, labels, helper text.",
                contrast: "5.9:1 — clears 4.5:1 for body",
              },
              {
                token: "ink-disabled",
                hex: "#545454",
                use: "Disabled control labels only.",
                contrast: "2.6:1 — WCAG 1.4.3 exempts disabled controls",
              },
              {
                token: "ink-inverse",
                hex: "#0F0F0F",
                use: "Type sat on a light surface: the primary CTA, badge chips.",
                contrast: "19.2:1 on --color-cta",
              },
            ]}
          />
          <SwatchGroup
            label="Action"
            swatches={[
              {
                token: "cta",
                hex: "#FFFFFF",
                use: "Primary button fills. The only pure white, never body text.",
                contrast: "19.8:1",
              },
              {
                token: "cta-hover",
                hex: "#DEDEDE",
                use: "Primary hover. Active returns to cta.",
              },
            ]}
          />
          <SwatchGroup
            label="Surfaces"
            swatches={[
              {
                token: "surface",
                hex: "#0A0A0A",
                use: "The page ground, and the builder's chrome.",
              },
              {
                token: "canvas",
                hex: "#0F0F0F",
                use: "Footer band, cards, builder stage, disabled fills.",
              },
            ]}
          />
          <SwatchGroup
            label="Lines"
            swatches={[
              {
                token: "line",
                hex: "#1F1F1F",
                use: "Hairlines, dividers, card edges, price bar top edge.",
                contrast: "1.2:1 — decorative only",
              },
              {
                token: "line-strong",
                hex: "#333333",
                use: "Field borders, secondary button edge, unselected swatch rings.",
                contrast: "1.6:1 — decorative only",
              },
            ]}
          />
          <SwatchGroup
            label="Functional"
            swatches={[
              {
                token: "danger",
                hex: "#F97066",
                use: "Validation messages, invalid field borders, the required asterisk. Never decorative.",
                contrast: "7.1:1",
              },
            ]}
          />

          <div className="mt-4 max-w-[62ch]">
            <p className={proseClasses}>
              Both line tones sit under 3:1 by design — they are hairlines, not
              boundaries you have to see to operate anything. Nothing on the
              site depends on a line alone to carry meaning: selection is a ring
              plus a label, an error is red text plus a border plus
              aria-invalid.
            </p>
          </div>
        </Section>

        <Section
          index="03"
          title="Typography"
          intro={
            <>
              <p>
                Two families in the build, both self-hosted — a build-time fetch
                to Google Fonts fails on any network that filters it, and Next
                parses the resulting error page as CSS. Archivo is the display
                face, vendored as one variable file covering 100–900. Geist is
                the body face and holds --font-sans, so it is what everything
                inherits; Geist Mono carries every numeral and every tracked
                label.
              </p>
              <p className="mt-5">
                The weight rule the built pages follow: metallic hero type is
                the display face at regular, section headings are the display
                face at medium. At hero size the gradient does the work weight
                would otherwise do, and going heavier closes the counters the
                light has to pass through.
              </p>
            </>
          }
        >
          <Sub title="The faces">
            <div className="grid gap-6 md:grid-cols-3">
              <div className={`${cardSurface} px-6 py-8`}>
                <p className={labelClasses}>Display</p>
                <p className="mt-4 font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.02em]">
                  Archivo
                </p>
                <p className="mt-3 text-[0.875rem] leading-[1.55] text-ink-muted">
                  Headings and hero type. Variable, latin subset, OFL-1.1,
                  vendored at app/fonts.
                </p>
                <p className={`mt-3 ${noteClasses}`}>--font-display</p>
              </div>
              <div className={`${cardSurface} px-6 py-8`}>
                <p className={labelClasses}>Body</p>
                <p className="mt-4 text-[2rem] font-medium leading-[1.1] tracking-[-0.02em]">
                  Geist
                </p>
                <p className="mt-3 text-[0.875rem] leading-[1.55] text-ink-muted">
                  Prose, UI, buttons, accordion questions. The default, because
                  prose is most of the type on the site.
                </p>
                <p className={`mt-3 ${noteClasses}`}>--font-sans</p>
              </div>
              <div className={`${cardSurface} px-6 py-8`}>
                <p className={labelClasses}>Figures</p>
                <p className="mt-4 font-mono text-[2rem] leading-[1.1] tracking-[-0.02em]">
                  Geist Mono
                </p>
                <p className="mt-3 text-[0.875rem] leading-[1.55] text-ink-muted">
                  Prices, deltas, step counts, spec values, overlines. Tabular
                  wherever digits have to align.
                </p>
                <p className={`mt-3 ${noteClasses}`}>--font-mono</p>
              </div>
            </div>

            <p className={`mt-8 max-w-[62ch] ${proseClasses}`}>
              Two weights carry the whole display face: 400 for the metallic
              heroes, 500 for every heading below them. Nothing on Home, About,
              FAQ or Contact is set bold — 700 was taken off those pages
              deliberately, because at hero size it closed the counters the
              metallic gradient has to pass light through, and a section heading
              at 700 read as a different site&apos;s heading to the hero above
              it. Buttons, accordion questions and the builder&apos;s chrome are
              Geist at 500. The one place 700 survives is /models, until its
              overhaul lands — see the flags at the foot of this page.
            </p>
          </Sub>

          {/*
            Given a subsection of its own rather than left as a line in the
            ramp. It is the site's single loudest typographic decision and the
            one most easily spread by accident — a section heading given the
            fill costs nothing to write and quietly ends the hierarchy, because
            once two things are lit neither is the brightest.
          */}
          <Sub title="The metallic h1">
            <p className={`max-w-[62ch] ${proseClasses}`}>
              One per page, and it is always the h1. The fill is bright through
              the middle of the line and falls to a dim grey at both ends,
              clipped to the letterforms so it is the glyphs that are lit rather
              than a panel behind them — the same chrome the hardware on the
              instrument carries.
            </p>
            <p className={`mt-5 max-w-[62ch] ${proseClasses}`}>
              It never appears below the h1. Every heading under it is the
              display face at medium with no fill, which is what keeps one
              element on a page reading as the loudest. The rule is enforced by
              where the attribute lives rather than by discipline: PageHero puts
              it on its own heading, so About, FAQ, Contact and the legal pages
              get it without opting in, and Home&apos;s hero is the only
              hand-rolled instance on the site.
            </p>
            <div className="mt-10 rounded-2xl border border-line bg-surface px-6 py-14 md:px-10 md:py-20">
              <p
                data-metal
                className="mx-auto max-w-[16ch] text-center font-display text-[clamp(2.75rem,7vw,4.75rem)] font-normal leading-[1.04] tracking-[-0.02em]"
              >
                Common questions
              </p>
              <p className="mx-auto mt-6 max-w-[54ch] text-center text-[1.0625rem] leading-[1.6] text-ink-muted md:text-[1.125rem]">
                The centred form, from PageHero — heading, then a muted
                standfirst at 54ch. Home takes the same fill left-aligned
                against a photograph, one step up the ramp.
              </p>
            </div>
            <Note>
              [data-metal] · #5A5A5A → #9A9A9A at 18% → #FFFFFF at 50% → #5A5A5A
              · background-clip: text · h1 only
            </Note>
            <p className={`mt-8 max-w-[62ch] ${proseClasses}`}>
              Two things travel with it. The weight is regular, not bold — at
              this size the gradient does the work weight would otherwise do,
              and heavier closes the counters the light has to pass through. And
              forced-colours modes drop background images, which would leave
              transparent text on a solid ground: globals.css puts the colour
              back as CanvasText, so the heading degrades to a plain one rather
              than to nothing.
            </p>
          </Sub>

          <Sub title="The ramp" className="mb-0">
            <TypeRow spec="Hero display · Archivo 400 · clamp(2.75rem, 7.4vw, 5rem) → min(5.56vw, 6.75rem) ≥1440 · 1.04 · -0.02em · [data-metal] · home">
              <p
                data-metal
                className="max-w-[16ch] font-display text-[clamp(2.75rem,7.4vw,5rem)] font-normal leading-[1.04] tracking-[-0.02em]"
              >
                Time to play by your&nbsp;own rules.
              </p>
            </TypeRow>
            <TypeRow spec="Page hero · Archivo 400 · clamp(2.75rem, 7vw, 4.75rem) · 1.04 · -0.02em · [data-metal] · centred · about, faq, contact, legal">
              <p
                data-metal
                className="font-display text-[clamp(2.75rem,7vw,4.75rem)] font-normal leading-[1.04] tracking-[-0.02em]"
              >
                Common questions
              </p>
            </TypeRow>
            <TypeRow spec="Statement · Archivo 500 · clamp(2rem, 3.4vw, 2.75rem) · 1.1 · -0.02em · closing sections">
              <p className="max-w-[18ch] font-display text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em]">
                Ready to build yours?
              </p>
            </TypeRow>
            <TypeRow spec="Section · Archivo 500 · clamp(1.875rem, 2.6vw, 2.375rem) · 1.15 · -0.02em">
              <p className="max-w-[16ch] font-display text-[clamp(1.875rem,2.6vw,2.375rem)] font-medium leading-[1.15] tracking-[-0.02em]">
                Where precision meets your spec
              </p>
            </TypeRow>
            <TypeRow spec="Card · Archivo 500 · 1.5rem · 1.2 · -0.015em">
              <p className="font-display text-[1.5rem] font-medium leading-[1.2] tracking-[-0.015em]">
                Send an email
              </p>
            </TypeRow>
            <TypeRow spec="Document section · Archivo 500 · clamp(1.375rem, 1.9vw, 1.625rem) · 1.25 · -0.02em · legal pages">
              <p className="font-display text-[clamp(1.375rem,1.9vw,1.625rem)] font-medium leading-[1.25] tracking-[-0.02em]">
                What we collect
              </p>
            </TypeRow>
            <TypeRow spec="Question · Geist 500 · clamp(1.0625rem, 1.7vw, 1.6875rem) · 1.3 · -0.015em · accordion rows">
              <p className="text-[clamp(1.0625rem,1.7vw,1.6875rem)] font-medium leading-[1.3] tracking-[-0.015em]">
                How long will my guitar take to arrive?
              </p>
            </TypeRow>
            <TypeRow spec="Body large · Geist 400 · 17px → 18px md · 1.6 · ink-muted · hero intros, lead paragraphs">
              <p className="max-w-[62ch] text-[1.0625rem] leading-[1.6] text-ink-muted md:text-[1.125rem]">
                We make custom builds for self-driven players in any music
                scene. No waiting list or signature-artist price tag, to get
                what you really want.
              </p>
            </TypeRow>
            <TypeRow spec="Prose · Geist 400 · 17px · 1.7 – 1.75 · 58–62ch">
              <p className="max-w-[62ch] text-[1.0625rem] leading-[1.75]">
                Semi-custom, not fully custom: you choose the parts that matter
                from a considered set of options, not an infinite one, which
                keeps the build honest and the price fair. Made to order, so
                nothing sits unsold in a warehouse.
              </p>
            </TypeRow>
            <TypeRow spec="Body · Geist 400 · 15px · 1.6 · ink-muted · card copy, step copy">
              <p className="max-w-[34ch] text-[0.9375rem] leading-[1.6] text-ink-muted">
                Built by hand in the UK, then inspected by the same team before
                it leaves the bench.
              </p>
            </TypeRow>
            <TypeRow spec="Small · Geist 400 · 14px · 1.5 · ink-muted">
              <p className="text-[0.875rem] leading-[1.5] text-ink-muted">
                The finished guitar may vary slightly from the on-screen
                preview.
              </p>
            </TypeRow>
            <TypeRow spec="Overline · Geist Mono · 13px · uppercase · 0.14em · ink-muted · with the mark">
              <Overline gradientId="type-overline">Build your own</Overline>
            </TypeRow>
            <TypeRow spec="Label · Geist 500 · 12px · uppercase · 0.08em · ink-muted · price bar, option groups, spec lists">
              <p className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
                Fretboard
              </p>
            </TypeRow>
            <TypeRow spec="Figures · Geist Mono · tabular · prices, deltas, counts">
              <div className="flex flex-wrap items-baseline gap-8">
                <p className="font-mono text-[1.0625rem] tabular-nums">
                  £1,949.00
                </p>
                <p className="font-mono text-[0.9375rem] tabular-nums text-ink-muted">
                  From £799.00
                </p>
                <p className="font-mono text-[0.8125rem] text-ink-muted">
                  +£120.00
                </p>
              </div>
            </TypeRow>
            <TypeRow spec="Step numeral · Geist Mono 400 · 3.5rem · 1 · -0.03em · home, how it works">
              <p className="font-mono text-[3.5rem] font-normal leading-none tracking-[-0.03em] text-ink">
                01
                <span aria-hidden className="text-ink-muted">
                  /
                </span>
              </p>
            </TypeRow>
          </Sub>
        </Section>

        <Section
          index="04"
          title="Brand devices"
          intro={
            <>
              <p>
                Four marks, and only the first two appear on the rebuilt pages.
                The wordmark is an asset and stays one — its letterforms are
                hand-adjusted outlines, not a font file, and setting UI text in
                them would dilute the one mark that has to carry.
              </p>
            </>
          }
        >
          <Sub title="The wordmark">
            <div className="rounded-2xl border border-line bg-canvas px-8 py-16 md:px-16 md:py-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Origin - Standard (White).svg"
                alt="Origin Guitars"
                width={574}
                height={120}
                className="h-auto w-full max-w-[460px]"
              />
            </div>
            <div className="mt-8 grid gap-8 sm:grid-cols-3">
              <div>
                <p className="text-[0.9375rem] font-medium">Three files</p>
                <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
                  White for the header and footer lock-ups, a near-black ghost
                  gradient for the footer&apos;s oversized mark, and a black one
                  kept for light contexts off the site — invoices, receipts,
                  print. Nothing on the site is light enough to use it.
                </p>
              </div>
              <div>
                <p className="text-[0.9375rem] font-medium">Lean</p>
                <p className="mt-1.5 font-mono text-[0.8125rem] text-ink-muted">
                  11.959° → 12°
                </p>
                <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
                  Measured off the parallelogram I glyphs, stored as --slant,
                  applied to brand devices only.
                </p>
              </div>
              <div>
                <p className="text-[0.9375rem] font-medium">Never as type</p>
                <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
                  The 12° lean is never applied to a letterform either. Devices
                  skew; type stays upright.
                </p>
              </div>
            </div>
          </Sub>

          <Sub title="The mark and the overline">
            <div className="flex flex-wrap items-center gap-12">
              <OriginMark className="h-10 w-[2.734rem]" gradientId="mark-lg" />
              <Overline gradientId="mark-overline">Origin story</Overline>
            </div>
            <Note>
              the four-point mark ships in a lit-metal fill and is never
              recoloured to currentColor · gradient ids are document-global, so
              a second instance on a page needs its own
            </Note>
            <p className={`mt-6 max-w-[62ch] ${proseClasses}`}>
              This is the device that opens a section on the rebuilt pages —
              mark, then a short mono label, then the heading. It replaced the
              slanted accent rule that Stage 0 specified.
            </p>
          </Sub>

          <Sub title="Metallic display type">
            <p
              data-metal
              className="font-display text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1.04] tracking-[-0.02em]"
            >
              Specified by you, built by us
            </p>
            <Note>
              [data-metal] · #5A5A5A → #FFFFFF at 50% → #5A5A5A, clipped to the
              glyphs · hero headings only, never a section heading
            </Note>
          </Sub>

          <Sub title="The slant, at 12°" className="mb-0">
            <div className="grid gap-12 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-3 font-mono text-[0.875rem]">
                  <span className="font-medium">03</span>
                  <span
                    aria-hidden
                    className="h-4 w-px bg-line-strong"
                    style={slant}
                  />
                  <span className="text-ink-muted">13</span>
                </div>
                <Note>builder step counter — slanted divider</Note>
              </div>

              <div>
                <div className="flex items-center gap-4">
                  <span
                    className="inline-flex bg-canvas px-4 py-1.5"
                    style={slant}
                  >
                    <span
                      className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted"
                      style={unslant}
                    >
                      Coming soon
                    </span>
                  </span>
                </div>
                <Note>
                  badge — box cut, text upright — being retired with the
                  /models overhaul; the rounded chip under Cards is the badge
                </Note>
              </div>

              <div>
                <div aria-hidden className="h-[5px] w-11 bg-ink" style={slant} />
                <Note>
                  accent rule — /models and the image placeholder only,
                  superseded by the overline
                </Note>
              </div>

              <div>
                <div className="flex h-12 items-center gap-4 rounded-full bg-cta px-6 text-ink-inverse">
                  <span className="font-mono text-[0.9375rem] tabular-nums">
                    £1,949.00
                  </span>
                  <span
                    aria-hidden
                    className="h-5 w-px bg-ink-inverse/30"
                    style={slant}
                  />
                  <span className="text-[0.9375rem] font-medium">Review</span>
                </div>
                <Note>price pill divider — ink on the white CTA, not white</Note>
              </div>
            </div>

            <p className={`mt-10 max-w-[62ch] ${proseClasses}`}>
              It stops there. Buttons are pills, cards are rounded-2xl, fields
              rounded-xl — thirteen consecutive builder steps of cut corners
              would be exhausting, so the geometry is soft for controls and
              angular for brand marks.
            </p>
          </Sub>
        </Section>

        <Section
          index="05"
          title="Photography"
          intro={
            <>
              <p>
                Placeholder throughout, and treated as such. No colour grade is
                applied to any frame on the site: a grade tuned to a stand-in is
                tuning to something about to be replaced, and a filter on one
                section and not the next is the fastest way to make two
                photographs look like two different shoots.
              </p>
              <p className="mt-5">
                The confirmed direction for the real shoot is a{" "}
                <strong className="text-ink">cold, icy-blue grade</strong>,
                applied once the photography is shot. It is not in the code
                anywhere yet — when it lands it belongs in one place, the way
                the masks below do, rather than per page.
              </p>
            </>
          }
        >
          <Sub title="What the frames do carry">
            <p className={`mb-8 max-w-[62ch] ${proseClasses}`}>
              Edge treatment, not colour. Every photograph on the site is
              dissolved into the ground rather than ending on a rectangle, and
              anything with copy over it carries a scrim measured for contrast
              against that copy. Both are listed under Ground and light.
            </p>
            <SpecTable
              rows={[
                {
                  name: "no filter",
                  value: "all frames",
                  note: "No grade, no duotone, no opacity knock-back. The icy-blue direction replaces this once real photography exists.",
                },
                {
                  name: "publicPhoto()",
                  value: "lib/media.ts",
                  note: "Home's photographs are resolved off disk at build with their real dimensions read from the file header, so a missing shot degrades to a placeholder instead of failing the build, and nothing is cropped to a guessed aspect.",
                },
                {
                  name: "quality={90}",
                  value: "artist carousel",
                  note: "Above the default 75: grainy black and white is the worst case for a lossy encoder, and at 75 the grain quantises into blocks.",
                },
                {
                  name: "preload",
                  value: "hero images",
                  note: "The hero is the likely LCP element. `preload` rather than `priority`, which Next 16 deprecated.",
                },
              ]}
            />
          </Sub>

          <Sub title="The placeholder" className="mb-0">
            <ImagePlaceholder className="aspect-[16/7] w-full rounded-2xl" />
            <Note>
              components/image-placeholder.tsx — deliberately an obviously-empty
              panel rather than a stock guitar shot
            </Note>
          </Sub>
        </Section>

        <Section
          index="06"
          title="Buttons"
          intro={
            <>
              <p>
                Pills. Primary is the only element in the system allowed pure
                white, which is what makes an action read as the action without
                a colour. The classes are exported alongside the component so a
                next/link can wear the same styling without a polymorphic
                wrapper — most buttons on the site are links.
              </p>
              <p className="mt-5">
                Disabled carries more weight here than usual: the builder locks
                options that are still coming, and those have to read as
                unavailable rather than broken.
              </p>
            </>
          }
        >
          <Sub title="Variants">
            <div className="flex flex-wrap items-center gap-5">
              <Button variant="primary">Build yours</Button>
              <Button variant="secondary">See the models</Button>
              <Button variant="tertiary">How it works</Button>
            </div>
            <Note>
              primary: bg-cta / text-ink-inverse · secondary: border-line-strong
              on transparent, border warms to ink · tertiary: underlined text,
              no box
            </Note>
            <p className={`mt-6 max-w-[62ch] ${proseClasses}`}>
              The `inverse` variant that existed while the site was light is
              gone — it was primary flipped for dark chrome, and with the whole
              site dark it and primary are the same button.
            </p>
          </Sub>

          <Sub title="Sizes">
            <div className="flex flex-wrap items-center gap-5">
              <Button size="lg">Review</Button>
              <Button size="md">Continue</Button>
              <Button size="sm">Build yours</Button>
            </div>
            <Note>
              lg 56px / px-9 / 17px · md 48px / px-7 / 15px · sm 40px / px-5 /
              14px — sm is the header pill&apos;s CTA, lg closes a page
            </Note>
          </Sub>

          <Sub title="States" className="mb-0">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Button>Continue</Button>
                <Note>default</Note>
              </div>
              <div>
                <span
                  className={`${buttonBase} ${buttonSizes.md} bg-cta-hover text-ink-inverse`}
                >
                  Continue
                </span>
                <Note>hover</Note>
              </div>
              <div>
                <span
                  className={`${buttonBase} ${buttonSizes.md} ${buttonVariants.primary} outline-2 outline-offset-2 outline-ink`}
                >
                  Continue
                </span>
                <Note>focus-visible — 2px ink, 2px offset, never removed</Note>
              </div>
              <div>
                <Button disabled>Coming soon</Button>
                <Note>disabled — canvas fill, ink-disabled label, no border</Note>
              </div>
            </div>
          </Sub>
        </Section>

        <Section
          index="07"
          title="Form fields"
          intro={
            <>
              <p>
                One control shell, shared by every input and the textarea, and
                by this specimen. Fields sit inside a card, so the fill is white
                at 2.5% over that card rather than a token — a field set on the
                page ground reads as a hole cut through the panel it is in.
              </p>
              <p className="mt-5">
                Placeholders are set in the mono face. It makes 000-000-000 read
                as a format rather than as somebody&apos;s actual order number,
                and it tells an empty field from a filled one at a glance, since
                anything typed comes back in the body face.
              </p>
            </>
          }
        >
          <div className={`${cardSurface} p-6 sm:p-8 md:p-12`}>
            <div className="grid gap-6 md:grid-cols-2 md:gap-x-8 md:gap-y-7">
              <div>
                <span className={fieldLabel}>
                  Full name
                  <span aria-hidden className="ml-1 text-danger">
                    *
                  </span>
                </span>
                <div className="mt-2.5">
                  <input
                    readOnly
                    aria-label="Full name specimen"
                    placeholder="John Carter"
                    className={`${fieldControl} h-14`}
                  />
                </div>
              </div>

              <div>
                <span className={fieldLabel}>
                  Email address
                  <span aria-hidden className="ml-1 text-danger">
                    *
                  </span>
                </span>
                <div className="mt-2.5">
                  <input
                    readOnly
                    aria-label="Email address specimen"
                    aria-invalid
                    defaultValue="john@"
                    className={`${fieldControl} h-14`}
                  />
                </div>
                <p className="mt-2 text-[0.875rem] leading-[1.5] text-danger">
                  That does not look like an email address.
                </p>
              </div>

              <div className="md:col-span-2">
                <span className={fieldLabel}>Message</span>
                <div className="mt-2.5">
                  <textarea
                    readOnly
                    rows={4}
                    aria-label="Message specimen"
                    placeholder="Write your message here..."
                    className={`${fieldControl} min-h-[10rem] resize-y py-3.5 leading-[1.6]`}
                  />
                </div>
              </div>
            </div>
          </div>

          <Note>
            rounded-xl · h-14 · border-line, warming to line-strong on hover and
            focus · outline 2px ink at 2px offset · aria-invalid switches the
            border to danger
          </Note>

          <p className={`mt-8 max-w-[62ch] ${proseClasses}`}>
            The asterisk is the one decorative-looking use --color-danger is
            actually for: it is the validation system speaking before anything
            has gone wrong. It is aria-hidden, because `required` on the control
            already says the same thing and &ldquo;asterisk&rdquo; read aloud
            after every label is noise.
          </p>
        </Section>

        <Section
          index="08"
          title="Cards"
          intro={
            <>
              <p>
                One surface: the lifted tone inside a hairline, the border
                warming as you approach, on the 500ms curve the rest of the site
                eases with. Contact&apos;s method cards and the contact
                form&apos;s own panel are that recipe at different sizes.
              </p>
              <p className="mt-5">
                The catalogue card is its own thing and is rendered here from
                the component itself — a photograph at the tight
                product-photography corner with the caption underneath, shown
                at the size every caller draws it. /models, Home&apos;s Latest
                models and the detail page&apos;s Other models strip are all
                this one component, so a model cannot look like two different
                products depending on where you meet it.
              </p>
            </>
          }
        >
          <Sub title="The catalogue card">
            {/*
              The real component, both states side by side, in the three-column
              grid every page draws it in — so the specimen is the card that
              ships rather than a replica that stops matching it.
            */}
            <div className="grid gap-12 md:grid-cols-3 md:gap-5">
              {specimenModels.map((model) => (
                <ModelTile
                  key={model.slug}
                  model={model}
                  headingLevel={3}
                  {...modelCardPhoto(model.slug, model.name)}
                />
              ))}
            </div>
            <Note>
              components/ui/model-tile.tsx — 5:7 frame, rounded-sm,
              [data-frame-glow], gap-5 between columns
            </Note>
          </Sub>

          <Sub title="The panel surface">
            <div className="grid gap-6 md:grid-cols-2">
              <article
                className={`${cardSurface} group relative flex h-full flex-col items-center px-8 py-10 text-center md:px-10 md:py-12`}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/[0.045] text-ink transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/[0.08]">
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2.75" y="5" width="18.5" height="14" rx="1.75" />
                    <path d="m3.5 6.75 7.4 5.28a1.9 1.9 0 0 0 2.2 0l7.4-5.28" />
                  </svg>
                </span>
                <h4 className="mt-7 font-display text-[1.5rem] font-medium leading-[1.2] tracking-[-0.015em]">
                  Send an email
                </h4>
                <p className="mt-4 max-w-[34ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
                  For detailed enquiries or support, email us and we will come
                  back to you.
                </p>
                <a
                  href="mailto:hello@originguitars.com"
                  className="mt-9 inline-flex items-center gap-2 rounded-sm text-[1.0625rem] font-medium text-ink after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  hello@originguitars.com
                  <svg
                    aria-hidden
                    viewBox="0 0 16 16"
                    className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" strokeLinecap="square" />
                  </svg>
                </a>
              </article>
            </div>
            <Note>
              lib/style.ts · cardSurface — rounded-2xl, border-line, bg-canvas,
              hover:border-line-strong, 500ms cubic-bezier(0.16, 1, 0.3, 1)
            </Note>
          </Sub>

          <Sub title="Badges, price and hover" className="mb-0">
            <div className="flex flex-wrap items-center gap-5">
              <ModelBadge status="available" />
              <ModelBadge status="coming-soon" />
            </div>
            <Note>
              status by weight, not colour — a solid light chip against a
              bordered dark one
            </Note>

            <div className="mt-10">
              <SpecTable
                rows={[
                  {
                    name: "border",
                    value: "line → line-strong",
                    note: "The card's own edge warms on approach. 500ms.",
                  },
                  {
                    name: "photograph",
                    value: "scale 1.03",
                    note: "700ms, inside the frame's own overflow, cancelled under motion-reduce.",
                  },
                  {
                    name: "coming soon",
                    value: "grayscale .95 · brightness .8",
                    note: "Plus surface at 25% over the frame. The weight is on the saturation: the instrument is near-black on a near-black card, so dimming is the axis that costs the silhouette.",
                  },
                  {
                    name: "chevron",
                    value: "line-strong → ink",
                    note: "Decoration, not a control — the whole tile is already the link, and on a coming-soon card there is nowhere to go.",
                  },
                  {
                    name: "price",
                    value: "ink-muted → ink",
                    note: "The figure comes up with the card. Mono, tabular, always.",
                  },
                  {
                    name: "stretched link",
                    value: "after:inset-0",
                    note: "One link in the tab order, one accessible name. Wrapping the card in an anchor would read heading, body and address as a single run-on link.",
                  },
                ]}
              />
            </div>
            <p className={`mt-8 max-w-[62ch] ${proseClasses}`}>
              Tailwind wraps its hover variant in (hover: hover) in v4, so none
              of this fires on a touchscreen, where a hover state is either
              invisible or sticks after a tap.
            </p>
          </Sub>
        </Section>

        <Section
          index="09"
          title="Chrome"
          intro={
            <>
              <p>
                The header is a floating glass pill and the footer is a band of
                the lifted tone with the wordmark bleeding off its bottom edge.
                Both are full-width devices that belong to the shell rather than
                to any page.
              </p>
            </>
          }
        >
          <Sub title="The floating pill">
            <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-4 md:p-6">
              <div aria-hidden data-light-leak />
              <div
                className={`${glassPill} relative flex h-16 items-center justify-between gap-8 overflow-hidden px-5 md:px-6`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/Origin - Standard (White).svg"
                  alt="Origin Guitars"
                  width={574}
                  height={120}
                  className="h-[18px] w-auto shrink-0"
                />
                <ul className="hidden items-center gap-9 text-[0.9375rem] md:flex">
                  {/*
                    The shipping component, not a copy of it — the same reason
                    glassPill is a shared string. This specimen used to hold a
                    hand-written duplicate of the glow's classes, which is how
                    the sheet and the site quietly stop matching.
                  */}
                  <li className="relative">
                    <NavGlow />
                    <span className="relative font-medium text-white">
                      About
                    </span>
                  </li>
                  <li className="text-white/60">Builder</li>
                  <li className="text-white/60">Models</li>
                  <li className="text-white/60">FAQ</li>
                </ul>
                <span className={`${buttonBase} ${buttonSizes.sm} ${buttonVariants.primary}`}>
                  Build yours
                </span>
              </div>
            </div>
            <Note>
              lib/style.ts · glassPill — white 6% inside a white 10% hairline,
              backdrop-blur-xl, 0 8px 32px rgba(0,0,0,0.4) · h-16 inside a
              px-4/py-4 header, so --header-h resolves to 96px, 104px from md
            </Note>
            <p className={`mt-6 max-w-[62ch] ${proseClasses}`}>
              The header stays in flow and is itself transparent — only the pill
              paints. That keeps a page&apos;s own top spacing intact so content
              is never slid under the chrome, while the page still passes behind
              the glass on scroll. The active link is marked by ambient light
              rather than a rule: an ellipse sat low behind the label and
              blurred past its own bounds, with the pill&apos;s overflow
              clipping the rest. It slides to the newly lit label when a page
              commits rather than when its link is clicked, so it confirms
              where you have arrived instead of predicting it. Nav labels are
              set in white alphas rather than the ink tokens, because the pill
              is transparent and its ground is whatever photograph is behind
              it.
            </p>
          </Sub>

          <Sub title="The footer" className="mb-0">
            <SpecTable
              rows={[
                {
                  name: "band",
                  value: "bg-canvas, border-t line",
                  note: "A shade above the page it closes, so it reads as its own band rather than a continuation.",
                },
                {
                  name: "rhythm",
                  value: "py-16 md:py-20",
                  note: "Wordmark and blurb left, two navs right, legal line 24 down from them.",
                },
                {
                  name: "bleed wordmark",
                  value: "-mb-16 md:-mb-20",
                  note: "Oversized, set to the content column rather than the viewport, cancelling the shell's bottom padding so it bleeds off the footer's edge. The asset is already a ghost gradient cropped to height — no extra fade is added.",
                },
                {
                  name: "entrance",
                  value: "0.9s, y 32 → 0",
                  note: "The footer's one authored moment, on the same curve as the hero photograph.",
                },
                {
                  name: "copy tones",
                  value: "white/70, /50, /40",
                  note: "Set in white alphas rather than the ink tokens. Over canvas, white/50 lands at #878787 against ink-muted's #8C8C8C — see the flags at the foot of this page.",
                },
              ]}
            />
          </Sub>
        </Section>

        <Section
          index="10"
          title="Disclosure"
          intro={
            <>
              <p>
                The FAQ list, shared by the FAQ page and Contact&apos;s
                three-question preview — one component, so the two cannot drift
                apart in feel. The specimen below is that component holding two
                real entries from data/faqs.ts.
              </p>
              <p className="mt-5">
                It replaced a native details/summary, which could not be
                animated: the element reveals its content in one frame, so there
                was nothing for a transition to attach to. The answers are still
                rendered into the HTML rather than mounted on open — they are
                clipped to zero height and marked inert, which keeps them out of
                the tab order while closed and in the document for crawlers and
                for anyone reading with JavaScript off.
              </p>
            </>
          }
        >
          <div className="mx-auto max-w-[51.5rem]">
            <FaqAccordion items={specimenFaqs} />
          </div>
          <div className="mt-10">
            <SpecTable
              rows={[
                {
                  name: "row",
                  value: "border-b line, first:border-t",
                  note: "py-7, md:py-12, lg:py-[4.6rem]. The hairline is the only structure.",
                },
                {
                  name: "box",
                  value: "0.5s open / 0.38s close",
                  note: "Opens slower than it closes. Height is the one layout property animated anywhere on the site — an accordion cannot avoid it.",
                },
                {
                  name: "paragraphs",
                  value: "0.09s delay, 0.075s stagger",
                  note: "The space appears first and the answer arrives into it. Closing runs the stagger backwards and faster.",
                },
                {
                  name: "indicator",
                  value: "spring 340 / 26",
                  note: "The plus turns a half-circle as its upright collapses, so it resolves into the minus having travelled.",
                },
                {
                  name: "hover",
                  value: "CSS, not Motion",
                  note: "The question leans 3px toward the cursor and the indicator grows to meet it. A hover should not wait on hydration.",
                },
              ]}
            />
          </div>
        </Section>

        <Section
          index="11"
          title="Sticky price bar"
          intro={
            <>
              <p>
                Persistent across every builder step: where you are, what it
                costs, and the way out to Review. It sits on the same deep
                ground as the option tray, divided from the canvas by a
                hairline — the one white slab on screen is the Review pill, so
                the way out is the brightest thing in the bar.
              </p>
              <p className="mt-5">
                The specimen is the real component with demo props. It is live
                at the foot of this page too, so scroll and it follows.
              </p>
            </>
          }
        >
          <PriceBar />
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div>
              <p className="text-[0.9375rem] font-medium">Left — orientation</p>
              <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
                Uppercase label for the current step, selected value beneath.
                Truncates rather than wraps.
              </p>
            </div>
            <div>
              <p className="text-[0.9375rem] font-medium">Middle — progress</p>
              <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
                Step count in mono, zero-padded. Hidden below sm to protect the
                pill.
              </p>
            </div>
            <div>
              <p className="text-[0.9375rem] font-medium">Right — the action</p>
              <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
                Running total in tabular mono, slanted divider, then Review. The
                pill drops from 56px to 48px below sm and sheds padding.
              </p>
            </div>
          </div>
          <Note>
            three variants — sticky (the builder), fixed (this page), static
            (this specimen) — one component, so the sheet and the bar cannot
            drift
          </Note>
        </Section>

        <Section
          index="12"
          title="Motion"
          intro={
            <>
              <p>
                Two curves and a short list of distances. Entrances are tweens
                and interactions are springs; nothing animates a layout property
                except the accordion, which cannot avoid it. Everything else is
                opacity and transform, both GPU-composited.
              </p>
              <p className="mt-5">
                Motion loads through LazyMotion in strict mode, so every
                animated element is an m.* component and nothing can quietly
                pull the full bundle back in.
              </p>
            </>
          }
        >
          <SpecTable
            rows={[
              {
                name: "EASE",
                value: "0.16, 1, 0.3, 1",
                note: "easeOutExpo. Entrances, hovers, crossfades, the hero settle. The site's default.",
              },
              {
                name: "SWIFT",
                value: "0.32, 0.72, 0, 1",
                note: "Real travel through the middle. The accordion box and the row's hover nudge — easeOutExpo under a cursor reads as a snap followed by nothing.",
              },
              {
                name: "Reveal",
                value: "0.6s · y 24 → 0",
                note: "once: true, amount 0.15. Nothing above the fold uses it — heroes render at full opacity so the LCP element never waits on hydration.",
              },
              {
                name: "Stagger",
                value: "0.08s · y 20 → 0",
                note: "Children arrive one after another. Prose is staggered by paragraph, never by word.",
              },
              {
                name: "WordReveal",
                value: "0.55s · 0.055s · y 45%",
                note: "Headings only. The rise is a share of the word's own line box, so it scales with the type.",
              },
              {
                name: "HeroPhoto",
                value: "1.8s · scale 1.06 → 1",
                note: "Home's one authored moment. Opacity stays at 1 throughout so the photograph can still be the LCP element.",
              },
              {
                name: "Parallax",
                value: "±40 / ±90px",
                note: "Scroll-linked drift on About's two frames. Deliberately unmatched: matching them would slide the pair as one block.",
              },
              {
                name: "Card hover",
                value: "500ms / 700ms",
                note: "Colour and opacity on 500, the drawing's scale on 700. All of it cancelled under motion-reduce.",
              },
              {
                name: "Indicator",
                value: "spring 340 / 26",
                note: "Springs answer direct manipulation. The accordion's plus and nothing else.",
              },
              {
                name: "Nav glide",
                value: "450ms SWIFT · x only",
                note: "The header's active light slides from the label it left to the one it lit, on commit rather than on click. A hand-written FLIP: layoutId needs the projection engine, which the domAnimation bundle does not carry, and it fails silently rather than loudly.",
              },
              {
                name: "LoadingImage",
                value: "350ms delay · 600ms fade",
                note: "The builder's indicator is held back long enough that a fast connection never sees it, and the photograph fades up rather than popping.",
              },
            ]}
          />

          <div className="mt-12 max-w-[62ch]">
            <h3 className="font-display text-[1.5rem] font-medium leading-[1.2] tracking-[-0.015em]">
              Reduced motion, and no motion at all
            </h3>
            <p className={`mt-5 ${proseClasses}`}>
              useReducedMotion returns null on the server and a boolean after
              mount, so it never decides which elements exist — that would
              render different markup on each side and throw a hydration
              mismatch. It only ever selects transition values, and the markup
              is identical either way.
            </p>
            <p className={`mt-5 ${proseClasses}`}>
              Two guards sit under that, because reveals render their hidden
              state server-side and anything that stops the animation running
              would otherwise leave content permanently invisible: a
              prefers-reduced-motion rule in globals.css that forces every
              [data-reveal] visible, and a noscript style in MotionProvider that
              does the same with JavaScript off. Neither depends on a hook.
            </p>
          </div>
        </Section>

        <Section
          index="13"
          title="Layout and rhythm"
          intro={
            <>
              <p>
                One content column, held in a custom property so the shell, the
                header pill and the full-bleed frames all measure from the same
                number. Above 1440 it tracks the viewport rather than stopping —
                held at a literal it took the layout to 61% of a 1920 screen,
                which is not the same design larger, it is a different one.
              </p>
            </>
          }
        >
          <SpecTable
            rows={[
              {
                name: "--shell",
                value: "73.75rem",
                note: "The content column to 1440, which is the width the designs were drawn at: copy at 11.8%, far edge at 88.2%.",
              },
              {
                name: "--shell ≥1440",
                value: "min(82vw, 1600px)",
                note: "82vw passes through 73.75rem at exactly 1440, so the switch is continuous rather than a step. The cap stops it running away on a very wide display.",
              },
              {
                name: "gutter",
                value: "px-4 md:px-10",
                note: "lib/style.ts · shell — every section measures from this one string.",
              },
              {
                name: "--header-h",
                value: "96px / 104px md",
                note: "The pill plus the gutter that makes it float. The builder measures a full screen against it and the mobile panel hangs off it.",
              },
              {
                name: "full-bleed escape",
                value: "max(2.5rem, (100vw - shell)/2 + 2.5rem)",
                note: "Pushes a frame past the column to the viewport edge at any width. Runs off the shell's outer width plus its padding — the inner measure is already one gutter short.",
              },
              {
                name: "section rhythm",
                value: "py-20 md:py-28",
                note: "The content default: Home's sections, About's, the FAQ's closing block.",
              },
              {
                name: "page hero",
                value: "pt-16 pb-16 md:pt-24 md:pb-20",
                note: "components/ui/page-hero.tsx. The hero owns its own bottom space.",
              },
              {
                name: "list column",
                value: "51.5rem",
                note: "The FAQ list and Contact's cards, form and preview. Roughly three quarters of the content column, centred.",
              },
              {
                name: "prose measure",
                value: "58–62ch",
                note: "Legal pages set the column itself to 62ch; the FAQ caps its answers at 62ch inside the wider list; About's prose runs to 58ch.",
              },
              {
                name: "hero measures",
                value: "16ch title / 54ch intro",
                note: "Defaults on PageHero, widened per page as a prop — Contact runs 66ch so its intro sets as two lines rather than three short ones.",
              },
            ]}
          />
        </Section>

        <Section
          index="14"
          title="Flagged for a decision"
          intro={
            <>
              <p>
                Places where two pages disagree about what ought to be one
                pattern. Listed rather than resolved: picking a winner inside a
                document whose only job is to report the system would settle a
                design question in the wrong place, and the losing page would
                keep shipping its own version regardless — with this sheet now
                quietly wrong about it.
              </p>
            </>
          }
        >
          <SpecTable
            rows={[
              {
                name: "/models",
                value: "resolved",
                note: "Rebuilt on the current system: the metallic PageHero every other page opens on, a row of three catalogue tiles, and no hairlines between its sections. The per-model spec section it used to carry is gone — /models/[slug] is that page now, and the tile's job is to get you there.",
              },
              {
                name: "badges",
                value: "resolved",
                note: "One component — components/ui/model-badge.tsx — for Home's cards, the catalogue tiles and the detail page's panel: solid ink for New, bordered for Coming soon. The 12° skewed box went with the /models overhaul, which leaves the slant device on the price pill and the builder's step counter.",
              },
              {
                name: "builder chrome",
                value: "Geist 600",
                note: "The builder's step title is Geist semibold at 1.375rem, not the display face — the builder's own chrome has not moved to Archivo. Same for the mobile nav's links.",
              },
              {
                name: "section rhythm",
                value: "py-20/28 vs pb-24/32",
                note: "Contact runs pb-24 md:pb-32 throughout with a documented reason (every block owns the space beneath it); everything else runs py-20 md:py-28, and the FAQ's list section runs py-12 md:py-16. Contact also adds pt-2 md:pt-10 locally to correct the hero-to-content gap, which means that gap differs between Contact and FAQ.",
              },
              {
                name: "closing headings",
                value: "clamp vs fixed",
                note: "About and /models close through one component — components/ui/closing-cta.tsx — whose heading scales at clamp(2rem, 3.4vw, 2.75rem), and Home's matches it. The FAQ's Got another question? is a flat 2rem and still hand-rolled, so at 1920 it is noticeably smaller than its equivalents.",
              },
              {
                name: "card hover",
                value: "lift vs no lift",
                note: "Home's model cards carry the white 3.5% hover lift; Contact's method cards use the same surface and border warm but no lift.",
              },
              {
                name: "form panel padding",
                value: "p-6/8/12 vs px-8 py-14",
                note: "The contact form's success panel does not match the padding of the form it replaces, so the block changes size on submit.",
              },
              {
                name: "footer tones",
                value: "white alphas",
                note: "The footer sets its copy in white/70, /50 and /40 rather than ink and ink-muted. Near-identical in value (white/50 over canvas is #878787 against #8C8C8C) but outside the token system, so a change to ink-muted will not reach it.",
              },
              {
                name: "from price",
                value: "resolved",
                note: "The catalogue's from figure and the builder's base price used to disagree — £799 on Home against £1,899 in the builder. Reconciled on the catalogue's figure, and BASE_PRICE_PENCE now imports it rather than restating it, so the two cannot drift apart again. Every from figure also formats through formatFromPrice, which drops the pence a round base price does not have; the builder's running total and option deltas keep them. The figure itself is still placeholder.",
              },
            ]}
          />
        </Section>

        <PriceBar fixed />
      </main>
    </MotionProvider>
  );
}
