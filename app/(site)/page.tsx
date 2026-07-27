import Link from "next/link";
import type { CSSProperties } from "react";

import { buttonClasses } from "@/components/ui/button";

const shell = "mx-auto w-full max-w-[1180px] px-6 md:px-10";
const slant: CSSProperties = { transform: "skewX(calc(-1 * var(--slant)))" };

const steps = [
  {
    n: "01",
    title: "Build it",
    body: "Pick your shape, then work through construction, timber, finish and hardware one step at a time. The price updates as you go, so there is never a number waiting at the end.",
  },
  {
    n: "02",
    title: "Place your order",
    body: "Review the full spec, pay in full, and your order number comes straight back to you by email. No deposit, no invoice to chase later.",
  },
  {
    n: "03",
    title: "We build it",
    body: "Your guitar is built by hand in the UK to the spec you set, then inspected by the same team before it is allowed to leave the bench.",
  },
  {
    n: "04",
    title: "We ship it",
    body: "Up to six months depending on complexity. If yours is going to run longer we tell you directly — more often than not it arrives sooner.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className={`${shell} pt-16 pb-20 text-center md:pt-24 md:pb-28`}>
        <h1 className="mx-auto max-w-[15ch] text-[clamp(2.75rem,6vw,4rem)] font-bold leading-[1.02] tracking-[-0.03em]">
          No one else will have this one
        </h1>
        <p className="mx-auto mt-7 max-w-[56ch] text-[1.125rem] leading-[1.55] text-ink-muted">
          Made-to-order electric guitars, built by hand in the UK. You set the
          spec — shape, timber, hardware, finish — and we build that guitar and
          no other.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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

        {/* Placeholder until the photography direction is settled (Stage 8). */}
        <div className="mt-16 flex aspect-[16/10] w-full items-center justify-center bg-canvas md:mt-20 md:aspect-[16/7]">
          <div className="text-center">
            <div
              aria-hidden
              className="mx-auto h-[5px] w-11 bg-ink-disabled"
              style={slant}
            />
            <p className="mt-5 text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
              Hero photography to follow
            </p>
          </div>
        </div>
      </section>

      {/* Brand statement */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <p className="max-w-[60ch] text-[1.375rem] leading-[1.45] tracking-[-0.015em] md:text-[1.75rem]">
            Origin exists because a guitar built to your spec should not mean
            signature-artist money or a two-year wait. We build semi-custom
            instruments to order, in the UK, at a price that reflects the work
            rather than the name on the headstock.
          </p>
          <Link
            href="/about"
            className={`${buttonClasses({ variant: "tertiary", size: "md" })} mt-10`}
          >
            Read our story
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <div aria-hidden className="mb-6 h-[5px] w-11 bg-black" style={slant} />
          <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
            How it works
          </h2>
          <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
            Four steps from the first option to a guitar in a case. Nothing is
            renegotiated after you order, and nothing is a surprise.
          </p>

          <ol className="mt-14 grid gap-12 md:grid-cols-4 md:gap-8">
            {steps.map((step) => (
              <li key={step.n}>
                <p className="font-mono text-[0.8125rem] text-ink-muted">
                  {step.n}
                </p>
                <div
                  aria-hidden
                  className="mt-4 h-[5px] w-11 bg-black"
                  style={slant}
                />
                <h3 className="mt-5 text-[1.375rem] font-semibold leading-[1.2] tracking-[-0.015em]">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[42ch] text-[0.9375rem] leading-[1.6] text-ink-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <Link
            href="/builder"
            className={`${buttonClasses({ size: "lg" })} mt-14`}
          >
            Start your build
          </Link>
        </div>
      </section>

      {/* FAQ prompt */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <h2 className="max-w-[20ch] text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
            Questions before you start?
          </h2>
          <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
            What made to order actually means, how long a build takes, what
            happens if you change your mind — answered plainly, before you spend
            anything.
          </p>
          <Link
            href="/faq"
            className={`${buttonClasses({ variant: "secondary", size: "lg" })} mt-10`}
          >
            Read the FAQ
          </Link>
        </div>
      </section>
    </main>
  );
}
