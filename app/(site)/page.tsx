import Link from "next/link";

import { HeroGuitar, HeroRule } from "@/components/motion/hero-entrance";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { buttonClasses } from "@/components/ui/button";
import { shell, slant } from "@/lib/style";
import elementSide from "@/public/models/element/element-side.jpg";

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
        The hero is the page's peak, and it borrows the builder's own device:
        a full-bleed canvas band with the instrument at scale. The previous
        version boxed a grey placeholder inside the gutter while the builder,
        one route away, already did this properly — the page was opting out of
        its own strongest move.
      */}
      <section className="relative overflow-hidden bg-canvas">
        <div className={`${shell} pt-16 md:pt-24`}>
          <HeroRule />
          <h1 className="mt-8 max-w-[13ch] text-[clamp(3rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.04em]">
            No one else will have this one
          </h1>
          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-16">
            <p className="max-w-[52ch] text-[1.125rem] leading-[1.55] text-ink-muted">
              Made-to-order electric guitars, built by hand in the UK. You set
              the spec — shape, timber, hardware, finish — and we build that
              guitar and no other.
            </p>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
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
          </div>
        </div>

        {/* Bleeds past the gutter deliberately. */}
        <div className="mt-10 md:mt-14">
          <HeroGuitar image={elementSide} />
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
