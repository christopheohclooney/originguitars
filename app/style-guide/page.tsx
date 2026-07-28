import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";

import {
  Button,
  buttonBase,
  buttonSizes as btnSize,
} from "@/components/ui/button";
import { PriceBar as SharedPriceBar } from "@/components/ui/price-bar";

export const metadata: Metadata = {
  title: "Design foundation — Origin Guitars",
  description:
    "Stage 0 style guide: colour, type scale, buttons and the sticky price bar pattern.",
};

/* The logo's forward lean, applied to brand devices only — never to type. */
const slant: CSSProperties = { transform: "skewX(calc(-1 * var(--slant)))" };
const unslant: CSSProperties = { transform: "skewX(var(--slant))" };

const shell = "mx-auto w-full max-w-[1180px] px-6 md:px-10";

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line py-20 md:py-28">
      <div className={shell}>
        <div aria-hidden className="mb-6 h-[5px] w-11 bg-black" style={slant} />
        <h2 className="font-display text-[clamp(1.75rem,3.5vw,2.25rem)] font-bold leading-[1.08] tracking-[-0.02em]">
          {title}
        </h2>
        <p className="mt-4 max-w-[68ch] text-[1.0625rem] leading-[1.65] text-ink-muted">
          {intro}
        </p>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- colour */

type SwatchProps = {
  name: string;
  hex: string;
  use: string;
  /* Pale chips need a hairline or they vanish against the page. */
  outline?: boolean;
};

function Swatch({ name, hex, use, outline }: SwatchProps) {
  return (
    <div>
      <div
        className={`h-24 w-full ${outline ? "border border-line-strong" : ""}`}
        style={{ backgroundColor: hex }}
      />
      <p className="mt-3 text-[0.9375rem] font-bold">{name}</p>
      <p className="text-[0.875rem] uppercase tabular-nums tracking-[0.02em] text-ink-muted">
        {hex}
      </p>
      <p className="mt-1.5 text-[0.8125rem] leading-[1.5] text-ink-muted">
        {use}
      </p>
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
      <h3 className="mb-5 text-[1.25rem] font-bold tracking-[-0.005em]">
        {label}
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {swatches.map((s) => (
          <Swatch key={s.name} {...s} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ type */

function TypeRow({
  spec,
  children,
}: {
  spec: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-4 border-b border-line py-8 last:border-b-0 md:grid-cols-[13rem_1fr] md:gap-10">
      <p className="text-[0.8125rem] leading-[1.6] tracking-[0.01em] text-ink-muted">
        {spec}
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/* --------------------------------------------------------------- buttons */

const btnBase = buttonBase;

function StateNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 text-[0.8125rem] tracking-[0.01em] text-ink-muted">{children}</p>
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

/* ------------------------------------------------------------------ page */

export default function StyleGuidePage() {
  return (
    <main className="pb-40">
      {/* Page head */}
      <header className="py-24 md:py-32">
        <div className={shell}>
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
            Origin Guitars · Design foundation
          </p>
          <h1 className="mt-6 max-w-[16ch] font-display text-[clamp(2.25rem,5vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.025em]">
            Design foundation
          </h1>
          <p className="mt-7 max-w-[68ch] text-[1.125rem] leading-[1.55] text-ink-muted">
            The type, colour, button and price-bar decisions everything else is
            built on. Archivo Bold over TeX Gyre Heros, a white page, near-black
            ink, and pure black reserved for the primary action — so the guitars
            carry all the colour on the site.
          </p>
        </div>
      </header>

      <Section
        title="The wordmark"
        intro="Everything below is derived from this file. The lean measures 11.959° off vertical on both I glyphs, rounded to 12° as the working value, and every path fills pure black. The letterforms are an asset and stay one — they are never set as body or UI text, which is what keeps the wordmark the single loud element on a page."
      >
        <div className="border border-line bg-white px-8 py-16 md:px-16 md:py-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/origin-wordmark-black.svg"
            alt="Origin Guitars"
            width={574}
            height={120}
            className="h-auto w-full max-w-[460px]"
          />
        </div>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-[0.9375rem] font-bold">Fill</p>
            <p className="mt-1.5 text-[0.875rem] tabular-nums text-ink-muted">
              #000000
            </p>
            <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
              Sampled from the source SVG, not the rendering.
            </p>
          </div>
          <div>
            <p className="text-[0.9375rem] font-bold">Lean</p>
            <p className="mt-1.5 text-[0.875rem] tabular-nums text-ink-muted">
              11.959° → 12°
            </p>
            <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
              Stored as --slant, applied to brand devices only.
            </p>
          </div>
          <div>
            <p className="text-[0.9375rem] font-bold">Never as type</p>
            <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
              Hand-adjusted outlines, not a font file. Setting UI text in them
              would dilute the one mark that has to carry.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Colour"
        intro="Two blacks, deliberately. Ink sets every heading, every line of body copy and the wordmark. Pure black is spent only on primary buttons, which makes the action the single darkest thing on any screen without needing a colour to announce itself."
      >
        <SwatchGroup
          label="Ink"
          swatches={[
            {
              name: "ink",
              hex: "#141414",
              use: "Headings, body copy, the wordmark.",
            },
            {
              name: "ink-muted",
              hex: "#737373",
              use: "Secondary copy, spec labels, helper text.",
            },
            {
              name: "ink-disabled",
              hex: "#A3A3A3",
              use: "Disabled control labels only.",
            },
          ]}
        />
        <SwatchGroup
          label="Action"
          swatches={[
            {
              name: "black",
              hex: "#000000",
              use: "Primary CTA fills. Never used for text.",
            },
          ]}
        />
        <SwatchGroup
          label="Surfaces"
          swatches={[
            {
              name: "white",
              hex: "#FFFFFF",
              use: "Page base.",
              outline: true,
            },
            {
              name: "surface",
              hex: "#FAFAFA",
              use: "Alternating section bands.",
              outline: true,
            },
            {
              name: "canvas",
              hex: "#F4F4F4",
              use: "Guitar image backdrop, swatch tiles.",
              outline: true,
            },
          ]}
        />
        <SwatchGroup
          label="Lines"
          swatches={[
            {
              name: "line",
              hex: "#E8E8E8",
              use: "Hairlines, dividers, price bar top edge.",
              outline: true,
            },
            {
              name: "line-strong",
              hex: "#D4D4D4",
              use: "Input borders, unselected swatch rings.",
              outline: true,
            },
          ]}
        />
        <SwatchGroup
          label="Functional"
          swatches={[
            {
              name: "danger",
              hex: "#B42318",
              use: "Validation messages only. Never decorative.",
            },
          ]}
        />
      </Section>

      <Section
        title="Typography"
        intro="Archivo Bold for display, TeX Gyre Heros for everything else. Archivo at 700 is a grotesque with enough weight to answer the wordmark without imitating its letterforms, and enough room left in the counters to stay open at a headline size; Heros is a Helvetica in the Swiss line the wordmark comes out of, and it is the one doing the work — every label, every option, every line of policy. There is no third family. Figures set in Heros with tabular numerals, except the running total, which is a display moment and takes Archivo Bold."
      >
        <div className="mb-14 grid gap-8 border border-line p-8 sm:grid-cols-2 md:p-10">
          <div>
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
              Display
            </p>
            <p className="mt-4 font-display text-[2.5rem] font-bold leading-[1] tracking-[-0.025em]">
              Archivo Bold
            </p>
            <p className="mt-4 max-w-[38ch] text-[0.9375rem] leading-[1.6] text-ink-muted">
              One weight is loaded, 700, because 700 is the only cut of it
              the site uses. Headlines, section titles, page titles, the
              running total. Never asked for anything heavier — there is no
              800 or 900 file, and the browser would have to fake it.
            </p>
          </div>
          <div>
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
              Text
            </p>
            <p className="mt-4 text-[2.5rem] leading-[1] tracking-[-0.02em]">
              TeX Gyre Heros
            </p>
            <p className="mt-4 max-w-[38ch] text-[0.9375rem] leading-[1.6] text-ink-muted">
              Two weights, 400 and 700, with nothing in between. Body copy, UI
              text, labels, figures — anything load-bearing at a small size.
              Emphasis is bold or it is not emphasis.
            </p>
          </div>
        </div>

        <TypeRow spec="Display · Archivo Bold · 40–68px · 0.98 · -0.03em · 700">
          <p className="font-display text-[clamp(2.5rem,6.5vw,4.25rem)] font-bold leading-[0.98] tracking-[-0.03em]">
            Built to order in the UK
          </p>
        </TypeRow>
        <TypeRow spec="H1 · Archivo Bold · 36–52px · 1.02 · -0.025em · 700">
          <p className="font-display text-[clamp(2.25rem,5vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.025em]">
            The Element
          </p>
        </TypeRow>
        <TypeRow spec="H2 · Archivo Bold · 28–36px · 1.08 · -0.02em · 700">
          <p className="font-display text-[clamp(1.75rem,3.5vw,2.25rem)] font-bold leading-[1.08] tracking-[-0.02em]">
            How it works
          </p>
        </TypeRow>
        <TypeRow spec="H3 · Heros · 20px · 1.3 · -0.005em · 700">
          <p className="text-[1.25rem] font-bold leading-[1.3] tracking-[-0.005em]">
            Neck &amp; construction
          </p>
        </TypeRow>
        <TypeRow spec="Body large · Heros · 18px · 1.6 · 400">
          <p className="max-w-[68ch] text-[1.125rem] leading-[1.6]">
            Every Origin is built to the spec you set, by hand, in the UK. Pick
            the shape, the timber, the hardware and the finish, and we build
            that guitar and no other.
          </p>
        </TypeRow>
        <TypeRow spec="Body · Heros · 16px · 1.65 · 400">
          <p className="max-w-[70ch] text-base leading-[1.65]">
            Build times run up to six months depending on complexity. If yours
            is going to take longer we will tell you directly, and more often
            than not it arrives sooner.
          </p>
        </TypeRow>
        <TypeRow spec="Small · Heros · 15px · 1.55 · 400 — the floor for prose">
          <p className="max-w-[72ch] text-[0.9375rem] leading-[1.55] text-ink-muted">
            The finished guitar may vary slightly from the on-screen preview.
          </p>
        </TypeRow>
        <TypeRow spec="Label · Heros · 12px · 1.4 · 0.1em · 700 · uppercase">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
            Fretboard
          </p>
        </TypeRow>
        <TypeRow spec="Figure · Heros · 14–15px · tabular · 0.01em · 400">
          <p className="text-[0.9375rem] tabular-nums tracking-[0.01em]">
            +£450.00
          </p>
        </TypeRow>
        <TypeRow spec="Price · Archivo Bold · 17–22px · tabular · 0.005em · 700">
          <p className="font-display text-[1.375rem] font-bold tabular-nums tracking-[0.005em]">
            £1,949.00
          </p>
        </TypeRow>

        <div className="mt-16 border-t border-line pt-12">
          <h3 className="text-[1.25rem] font-bold tracking-[-0.005em]">
            Two weights, no medium
          </h3>
          <p className="mt-4 max-w-[68ch] text-base leading-[1.65] text-ink-muted">
            Heros ships 400 and 700 and nothing between them. A 500 or 600
            request does not round up — CSS resolves it down to 400, so every
            control that used to be set in medium would have quietly become
            book weight. Everywhere that emphasis is load-bearing is now 700:
            buttons, option labels, selected values, the uppercase labels.
            Everywhere it was decorative is 400.
          </p>
          <div className="mt-8 grid gap-6 border border-line p-8 sm:grid-cols-3">
            <div>
              <p className="text-[0.9375rem]">Neck-thru</p>
              <StateNote>400 — body, values, prose</StateNote>
            </div>
            <div>
              <p className="text-[0.9375rem] font-bold">Neck-thru</p>
              <StateNote>700 — labels, controls, emphasis</StateNote>
            </div>
            <div>
              <p className="font-display text-[0.9375rem] font-bold">
                Neck-thru
              </p>
              <StateNote>Archivo Bold — display only</StateNote>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-line pt-12">
          <h3 className="text-[1.25rem] font-bold tracking-[-0.005em]">
            Small sizes and dense areas
          </h3>
          <p className="mt-4 max-w-[68ch] text-base leading-[1.65] text-ink-muted">
            Heros carries a smaller x-height than the placeholder it replaced,
            so anything that was 13px in a dense area is now 14px: the price
            deltas in the builder, the step counter, the tooltips, and the spec
            list in the review modal. 15px is the floor for prose. Uppercase labels take 0.1em
            of tracking rather than 0.08em — Helvetica capitals need the air, and
            they are the smallest type that ships.
          </p>
          <div className="mt-8 grid gap-8 border border-line p-8 sm:grid-cols-2">
            <div>
              <div className="flex items-baseline justify-between gap-6 border-b border-line py-3">
                <span className="text-[0.9375rem] text-ink-muted">
                  Construction
                </span>
                <span className="flex items-baseline gap-4">
                  <span className="text-[0.9375rem] font-bold">Neck-thru</span>
                  <span className="w-[5.75rem] text-[0.875rem] tabular-nums tracking-[0.01em] text-ink-muted">
                    +£450.00
                  </span>
                </span>
              </div>
              <StateNote>review modal spec row — 15px / 14px figure</StateNote>
            </div>
            <div>
              <span className="inline-flex items-center gap-3 rounded-full border border-line-strong px-6 py-3.5">
                <span className="text-[0.9375rem] font-bold">Rosewood</span>
                <span className="text-[0.875rem] tabular-nums tracking-[0.01em] text-ink-muted">
                  +£60.00
                </span>
              </span>
              <StateNote>builder option tile — 15px label, 14px delta</StateNote>
            </div>
          </div>
          <p className="mt-8 max-w-[68ch] text-base leading-[1.65] text-ink-muted">
            Contrast is unchanged by any of this — the palette did not move. The
            two combinations that carry small text both clear AA: ink-muted on
            white at 4.74:1, and ink on canvas at 16.75:1. ink-muted on canvas
            is 4.31:1 and does not, which is why the coming-soon badge and the
            photography placeholders set their labels in ink instead.
          </p>
        </div>

        <div className="mt-16 border-t border-line pt-12">
          <h3 className="text-[1.25rem] font-bold tracking-[-0.005em]">
            The wordmark relationship
          </h3>
          <p className="mt-4 max-w-[68ch] text-base leading-[1.65] text-ink-muted">
            The logo pairs a heavy primary with a lighter secondary. That
            relationship is now carried by two families rather than two weights
            of one — Archivo Bold over Heros — and never by reproducing the
            letterforms, which stay an asset and never become live text.
          </p>
          <div className="mt-8 border border-line bg-surface px-8 py-12">
            <p className="font-display text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
              Specified by you
            </p>
            <p className="mt-3 text-[1.125rem] leading-[1.5] text-ink-muted">
              Built by us, in the UK
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="Buttons"
        intro="Pills, following the Mod Shop benchmark. Primary is the only element on the page allowed pure black. Disabled carries more weight here than usual — the builder locks options that are still coming soon, and those need to read as unavailable rather than broken."
      >
        <div className="mb-14">
          <h3 className="mb-6 text-[1.25rem] font-bold tracking-[-0.005em]">
            Variants
          </h3>
          <div className="flex flex-wrap items-center gap-5">
            <Button variant="primary">Build your own</Button>
            <Button variant="secondary">See the specs</Button>
            <Button variant="tertiary">How it works</Button>
          </div>
          <StateNote>primary · secondary · tertiary</StateNote>
        </div>

        <div className="mb-14">
          <h3 className="mb-6 text-[1.25rem] font-bold tracking-[-0.005em]">
            Sizes
          </h3>
          <div className="flex flex-wrap items-center gap-5">
            <Button size="lg">Review</Button>
            <Button size="md">Continue</Button>
            <Button size="sm">Edit</Button>
          </div>
          <StateNote>lg 56px · md 48px · sm 40px</StateNote>
        </div>

        <div>
          <h3 className="mb-6 text-[1.25rem] font-bold tracking-[-0.005em]">
            States
          </h3>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Button>Continue</Button>
              <StateNote>default</StateNote>
            </div>
            <div>
              <span
                className={`${btnBase} ${btnSize.md} bg-[#262626] text-white`}
              >
                Continue
              </span>
              <StateNote>hover</StateNote>
            </div>
            <div>
              <span
                className={`${btnBase} ${btnSize.md} bg-black text-white outline-2 outline-offset-2 outline-ink`}
              >
                Continue
              </span>
              <StateNote>focus-visible</StateNote>
            </div>
            <div>
              <Button disabled>Coming soon</Button>
              <StateNote>disabled</StateNote>
            </div>
          </div>

          <div className="mt-12 border-t border-line pt-10">
            <p className="text-[0.875rem] leading-[1.5] text-danger">
              Choose a fretboard to continue.
            </p>
            <StateNote>validation — the only place colour appears</StateNote>
          </div>
        </div>
      </Section>

      <Section
        title="Slant device"
        intro="The logo leans forward at roughly 12 degrees. That angle is reusable as a graphic mark — accent rules, badge cuts, the divider inside the price pill. It stops there: buttons, cards, inputs and swatches stay square, because twelve consecutive builder steps of cut corners would be exhausting."
      >
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <div aria-hidden className="h-[5px] w-11 bg-black" style={slant} />
            <StateNote>accent rule — opens every section</StateNote>
          </div>

          <div>
            <div className="flex items-center gap-4">
              <span
                className="inline-flex bg-canvas px-4 py-1.5"
                style={slant}
              >
                <span
                  className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink"
                  style={unslant}
                >
                  Coming soon
                </span>
              </span>
              <span className="inline-flex bg-black px-4 py-1.5" style={slant}>
                <span
                  className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-white"
                  style={unslant}
                >
                  New
                </span>
              </span>
            </div>
            <StateNote>badges — box cut, text upright</StateNote>
          </div>

          <div>
            <div className="flex items-center gap-3 text-[0.875rem] tabular-nums">
              <span className="font-bold">03</span>
              <span
                aria-hidden
                className="h-4 w-px bg-line-strong"
                style={slant}
              />
              <span className="text-ink-muted">13</span>
            </div>
            <StateNote>step counter — slanted divider</StateNote>
          </div>

          <div>
            <div className="relative h-px w-full bg-line">
              <span
                aria-hidden
                className="absolute left-0 top-[-2px] h-[5px] w-11 bg-black"
                style={slant}
              />
            </div>
            <StateNote>section divider — hairline with accent</StateNote>
          </div>
        </div>
      </Section>

      <Section
        title="Sticky price bar"
        intro="Persistent across every builder step: where you are, what it costs, and the way out to Review. It sits on white with a hairline top edge rather than as a black slab — the black belongs to the pill. It is live at the bottom of this page, so scroll and it follows."
      >
        <PriceBar />
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-[0.9375rem] font-bold">Left — orientation</p>
            <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
              Uppercase label for the current step, selected value beneath.
              Truncates rather than wraps.
            </p>
          </div>
          <div>
            <p className="text-[0.9375rem] font-bold">Middle — progress</p>
            <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
              Step count in mono. Hidden below the small breakpoint to protect
              the pill.
            </p>
          </div>
          <div>
            <p className="text-[0.9375rem] font-bold">Right — the action</p>
            <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
              Running total in tabular mono, slanted divider, then Review. The
              only black on the bar.
            </p>
          </div>
        </div>
      </Section>

      <PriceBar fixed />
    </main>
  );
}
