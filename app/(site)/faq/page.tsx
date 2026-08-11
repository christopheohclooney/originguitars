import type { Metadata } from "next";

import { buttonClasses } from "@/components/ui/button";
import { FaqAccordion, type FaqEntry } from "@/components/ui/faq-accordion";
import { PageHero } from "@/components/ui/page-hero";
import { shell } from "@/lib/style";

export const metadata: Metadata = {
  title: "FAQ — Origin Guitars",
  description:
    "What made to order means, how long a build takes, and what happens if you change your mind.",
};

/*
 * Answers below are drawn from the user flow doc's stated policy.
 *
 * The last one was a marked placeholder until /contact existed. It now answers
 * with the two routes that page carries — the address this page already prints
 * in its own closing CTA, and the number — rather than with an apology.
 */

const faqs: FaqEntry[] = [
  {
    q: "How long will my guitar take to arrive?",
    a: [
      "Up to six months, depending on how complex the build is. A straightforward spec moves faster than one with binding, an inlay and a custom finish.",
      "If yours is going to run longer than that, we tell you directly rather than letting the date slide. More often it comes in sooner than the estimate.",
    ],
  },
  {
    q: "Can I make changes after I've ordered?",
    a: [
      "Yes, at any point before your order is submitted to the build queue. That is a separate step from payment, so there is a genuine window after you have paid.",
      "Once it has been submitted to the queue the specification is fixed, because the timbers have been selected and the work has started.",
    ],
  },
  {
    q: "What if I need to cancel?",
    a: [
      "A full refund is available any time before your order goes into the build queue.",
      "After that point a refund is capped at 50% of the order value. The instrument is built to your specification and cannot simply be sold to the next person.",
    ],
  },
  {
    q: "Where are Origin guitars made?",
    a: [
      "In the United Kingdom, by hand. Every instrument is inspected by the same team that built it before it is allowed to ship.",
    ],
  },
  {
    q: "Do I need to pay a deposit, or the full amount upfront?",
    a: [
      "The full amount, at the point of ordering. There is no deposit option and no balance to settle before shipping, so there is nothing to chase later.",
      "Payment is handled by Stripe. Card details never touch our own systems.",
    ],
  },
  {
    q: "What does made to order actually mean?",
    a: [
      "Nothing is built until you order it. There is no warehouse of finished guitars waiting for somebody to pick one — your instrument is started after your order is placed, to the exact specification you set in the builder.",
      "That is why the option list is as long as it is, and why the lead time is what it is.",
    ],
  },
  {
    q: "What if I have a question part-way through a build?",
    a: [
      "Email hello@originguitars.com, or call the UK team on (+44) 7883 066880 during business hours. Either way you reach the people building it — reaching them directly is meant to be easy at every stage, not something you have to hunt for.",
      "Both are on the contact page, linked in the footer of every page.",
    ],
  },
];

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
          <div className="mx-auto max-w-[51.5rem]">
            <FaqAccordion items={faqs} />
          </div>
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lance-skeleton-side.svg"
            alt=""
            aria-hidden
            width={1133}
            height={73}
            className="hidden h-auto w-full md:block"
          />

          {/*
            Copy left, the way out right — the two sit on one baseline from md
            up and stack on narrow screens. The address is the button rather
            than a label on one, so what you read is what you get when you tap
            it.
          */}
          <div className="flex flex-col gap-10 md:mt-20 md:flex-row md:items-end md:justify-between md:gap-16">
            <div>
              <h2 className="max-w-[22ch] font-display text-[2rem] font-medium leading-[1.1] tracking-[-0.02em]">
                Got another question?
              </h2>
              <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
                Every build&apos;s a bit different, so not every question will
                be here. Send it over and the UK team will get back to you
                directly.
              </p>
            </div>

            <a
              href="mailto:hello@originguitars.com"
              className={`${buttonClasses({ size: "lg" })} w-full shrink-0 md:w-auto`}
            >
              hello@originguitars.com
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
