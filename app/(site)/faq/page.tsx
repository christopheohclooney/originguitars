import type { Metadata } from "next";

import { Reveal } from "@/components/motion/reveal";
import { buttonClasses } from "@/components/ui/button";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { PageHero } from "@/components/ui/page-hero";
import { faqs } from "@/data/faqs";
import { CONTACT_INBOX } from "@/lib/contact";
import { shell } from "@/lib/style";

export const metadata: Metadata = {
  title: "FAQ — Origin Guitars",
  description:
    "What made to order means, how long a build takes, and what happens if you change your mind.",
};

export default function FaqPage() {
  return (
    <main>
      <PageHero
        title="Common questions"
        intro="The questions worth having settled before you start a build. If yours is not here, the UK team is one email away."
      />

      {/*
        No rule under the hero. The hairline is the builder canvas's device
        for dividing its chrome from its stage; on a content page it just
        interrupts the vertical run. The list's own first rule is enough to
        start it.
      */}
      <section className="py-12 md:py-16">
        <div className={shell}>
          {/*
            The list sits inside the content column rather than filling it —
            roughly three quarters of it, centred, which is where the rules
            land in the reference artboard. Wide enough that the questions
            read as headings, narrow enough that the eye is not tracking a
            full page width to reach the indicator.
          */}
          {/*
            One Reveal for the whole list rather than a stagger by row. The
            rows are hairline-ruled, and rows arriving one after another
            would draw each rule twice — once as it lands, once as its
            neighbour does. The list is one object; it arrives as one. This
            was the last page whose sections did not arrive on scroll.
          */}
          <Reveal className="mx-auto max-w-[51.5rem]">
            <FaqAccordion items={faqs} />
          </Reveal>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className={shell}>
          {/*
            The Lance in outline, measured to the content column like every
            other element on the page. Decorative — the section's heading
            already says what this is, so it carries no alt text and stays out
            of the accessibility tree.

            Held back below md. The drawing is 15.5:1, so on a phone it
            resolves to about 22px tall and its detail — bridge, tuners,
            frets — stops being legible and starts being noise. Better absent
            than illegible, and nothing is lost since it carries no meaning.

            Its strokes are 0.27 units against a 1133-unit viewBox, so at this
            width they land near a single device pixel. That thinness is the
            drawing; scaling it up would thicken them.
          */}
          {/* The drawing arrives first, as ClosingCta's does — same beat. */}
          <Reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/lance-skeleton-side.svg"
              alt=""
              aria-hidden
              width={1133}
              height={73}
              className="hidden h-auto w-full md:block"
            />
          </Reveal>

          {/*
            Copy left, the way out right — the two sit on one baseline from md
            up and stack on narrow screens. The address is the button rather
            than a label on one, so what you read is what you get when you tap
            it.
          */}
          {/*
            Copy first, the way out a beat behind — the same order and the
            same 0.12s ClosingCta stages its pair with, so the two closing
            blocks on the site move as one system.
          */}
          <div className="flex flex-col gap-10 md:mt-20 md:flex-row md:items-end md:justify-between md:gap-16">
            <Reveal>
              <h2 className="max-w-[22ch] font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.02em]">
                Got another question?
              </h2>
              <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
                Every build&apos;s a bit different, so not every question will
                be here. Send it over and the UK team will get back to you
                directly.
              </p>
            </Reveal>

            {/* The address itself, from the one place it is written down. */}
            <Reveal delay={0.12} className="w-full shrink-0 md:w-auto">
              <a
                href={`mailto:${CONTACT_INBOX}`}
                className={`${buttonClasses({ size: "lg" })} w-full`}
              >
                {CONTACT_INBOX}
              </a>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
