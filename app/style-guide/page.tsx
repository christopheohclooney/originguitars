import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";

import {
  Button,
  buttonBase,
  buttonSizes as btnSize,
  buttonVariants as btnVariant,
} from "@/components/ui/button";

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
        <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
          {title}
        </h2>
        <p className="mt-4 max-w-[68ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
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
      <p className="mt-3 text-[0.9375rem] font-medium">{name}</p>
      <p className="font-mono text-[0.8125rem] uppercase text-ink-muted">
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
      <h3 className="mb-5 text-[1.375rem] font-semibold tracking-[-0.015em]">
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
      <p className="font-mono text-[0.75rem] leading-[1.6] text-ink-muted">
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
    <p className="mt-3 font-mono text-[0.75rem] text-ink-muted">{children}</p>
  );
}

/* ------------------------------------------------------------ price bar */

function PriceBar({ fixed }: { fixed?: boolean }) {
  return (
    <div
      className={
        fixed
          ? "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white"
          : "border border-line bg-white"
      }
    >
      <div
        className={`flex items-center justify-between gap-4 py-3 sm:gap-6 sm:py-4 ${
          fixed ? shell : "px-6"
        }`}
      >
        <div className="min-w-0">
          <p className="whitespace-nowrap text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
            Body colour
          </p>
          <p className="mt-1 truncate text-[0.875rem] font-medium sm:text-[0.9375rem]">
            Alder — Skyburst Metallic
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-5">
          <p className="hidden font-mono text-[0.8125rem] text-ink-muted sm:block">
            03 / 13
          </p>
          <button
            type="button"
            className={`${btnBase} ${btnVariant.primary} h-12 gap-4 px-6 text-[0.9375rem] sm:h-14 sm:gap-5 sm:px-9 sm:text-[1.0625rem]`}
          >
            <span className="font-mono tabular-nums">£1,949.00</span>
            <span
              aria-hidden
              className="h-5 w-px bg-white/35"
              style={slant}
            />
            <span>Review</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export default function StyleGuidePage() {
  return (
    <main className="pb-40">
      {/* Page head */}
      <header className="py-24 md:py-32">
        <div className={shell}>
          <p className="font-mono text-[0.8125rem] text-ink-muted">
            Origin Guitars · Stage 0
          </p>
          <h1 className="mt-6 max-w-[16ch] text-[clamp(2.75rem,6vw,4rem)] font-bold leading-[1.02] tracking-[-0.03em]">
            Design foundation
          </h1>
          <p className="mt-7 max-w-[68ch] text-[1.125rem] leading-[1.55] text-ink-muted">
            The colour, type, button and price-bar decisions everything else is
            built on. White page, near-black ink, pure black reserved for the
            primary action — so the guitars carry all the colour on the site.
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
            <p className="text-[0.9375rem] font-medium">Fill</p>
            <p className="mt-1.5 font-mono text-[0.8125rem] text-ink-muted">
              #000000
            </p>
            <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
              Sampled from the source SVG, not the rendering.
            </p>
          </div>
          <div>
            <p className="text-[0.9375rem] font-medium">Lean</p>
            <p className="mt-1.5 font-mono text-[0.8125rem] text-ink-muted">
              11.959° → 12°
            </p>
            <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
              Stored as --slant, applied to brand devices only.
            </p>
          </div>
          <div>
            <p className="text-[0.9375rem] font-medium">Never as type</p>
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
        intro="Geist and Geist Mono, standing in until the sourced typefaces land. Both are Swiss-influenced grotesks, so the scale, weights and tracking below will survive the swap — only the family name changes. Mono is reserved for figures: prices, deltas and spec values that need to align in a column."
      >
        <TypeRow spec="Display · 44–64px · 1.02 · -0.03em · 700">
          <p className="text-[clamp(2.75rem,6vw,4rem)] font-bold leading-[1.02] tracking-[-0.03em]">
            Built to order in the UK
          </p>
        </TypeRow>
        <TypeRow spec="H1 · 32–44px · 1.06 · -0.025em · 700">
          <p className="text-[clamp(2rem,4.5vw,2.75rem)] font-bold leading-[1.06] tracking-[-0.025em]">
            The Element
          </p>
        </TypeRow>
        <TypeRow spec="H2 · 32px · 1.1 · -0.02em · 700">
          <p className="text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
            How it works
          </p>
        </TypeRow>
        <TypeRow spec="H3 · 22px · 1.2 · -0.015em · 600">
          <p className="text-[1.375rem] font-semibold leading-[1.2] tracking-[-0.015em]">
            Neck &amp; construction
          </p>
        </TypeRow>
        <TypeRow spec="Body large · 18px · 1.55 · 400">
          <p className="max-w-[68ch] text-[1.125rem] leading-[1.55]">
            Every Origin is built to the spec you set, by hand, in the UK. Pick
            the shape, the timber, the hardware and the finish, and we build
            that guitar and no other.
          </p>
        </TypeRow>
        <TypeRow spec="Body · 16px · 1.6 · 400">
          <p className="max-w-[70ch] text-base leading-[1.6]">
            Build times run up to six months depending on complexity. If yours
            is going to take longer we will tell you directly, and more often
            than not it arrives sooner.
          </p>
        </TypeRow>
        <TypeRow spec="Small · 14px · 1.5 · 400">
          <p className="max-w-[72ch] text-[0.875rem] leading-[1.5] text-ink-muted">
            The finished guitar may vary slightly from the on-screen preview.
          </p>
        </TypeRow>
        <TypeRow spec="Label · 12px · 1.4 · 0.08em · 500 · uppercase">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
            Fretboard
          </p>
        </TypeRow>
        <TypeRow spec="Mono · 16px · 1.4 · 500 · tabular">
          <p className="font-mono text-base font-medium tabular-nums">
            £1,949.00
          </p>
        </TypeRow>

        <div className="mt-16 border-t border-line pt-12">
          <h3 className="text-[1.375rem] font-semibold tracking-[-0.015em]">
            The wordmark relationship
          </h3>
          <p className="mt-4 max-w-[68ch] text-base leading-[1.6] text-ink-muted">
            The logo pairs a heavy primary with a lighter secondary of the same
            family. That relationship carries into the page as a 700 heading
            over a 400 supporting line — not as a reproduction of the
            letterforms, which stay an asset and never become live text.
          </p>
          <div className="mt-8 border border-line bg-surface px-8 py-12">
            <p className="text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
              Specified by you
            </p>
            <p className="mt-2 text-[1.125rem] font-normal leading-[1.5] tracking-[0.02em] text-ink-muted">
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
          <h3 className="mb-6 text-[1.375rem] font-semibold tracking-[-0.015em]">
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
          <h3 className="mb-6 text-[1.375rem] font-semibold tracking-[-0.015em]">
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
          <h3 className="mb-6 text-[1.375rem] font-semibold tracking-[-0.015em]">
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
                  className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted"
                  style={unslant}
                >
                  Coming soon
                </span>
              </span>
              <span className="inline-flex bg-black px-4 py-1.5" style={slant}>
                <span
                  className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-white"
                  style={unslant}
                >
                  New
                </span>
              </span>
            </div>
            <StateNote>badges — box cut, text upright</StateNote>
          </div>

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
            <p className="text-[0.9375rem] font-medium">Left — orientation</p>
            <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
              Uppercase label for the current step, selected value beneath.
              Truncates rather than wraps.
            </p>
          </div>
          <div>
            <p className="text-[0.9375rem] font-medium">Middle — progress</p>
            <p className="mt-1.5 max-w-[40ch] text-[0.875rem] leading-[1.5] text-ink-muted">
              Step count in mono. Hidden below the small breakpoint to protect
              the pill.
            </p>
          </div>
          <div>
            <p className="text-[0.9375rem] font-medium">Right — the action</p>
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
