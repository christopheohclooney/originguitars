import type { Metadata } from "next";
import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { shell } from "@/lib/style";

export const metadata: Metadata = {
  title: "FAQ — Origin Guitars",
  description:
    "What made to order means, how long a build takes, and what happens if you change your mind.",
};

/*
 * Native <details>/<summary>. Keyboard accessible and expandable with no
 * JavaScript at all, which is the right trade for a page whose entire job is
 * answering questions before somebody drops out of a build.
 *
 * Answers below are drawn from the user flow doc's stated policy. Anything
 * marked placeholder still needs Larry's wording.
 */

type Faq = {
  q: string;
  a: string[];
};

const faqs: Faq[] = [
  {
    q: "What does made to order actually mean?",
    a: [
      "Nothing is built until you order it. There is no warehouse of finished guitars waiting for somebody to pick one — your instrument is started after your order is placed, to the exact specification you set in the builder.",
      "That is why the option list is as long as it is, and why the lead time is what it is.",
    ],
  },
  {
    q: "How long will my guitar take?",
    a: [
      "Up to six months, depending on how complex the build is. A straightforward spec moves faster than one with binding, an inlay and a custom finish.",
      "If yours is going to run longer than that, we tell you directly rather than letting the date slide. More often it comes in sooner than the estimate.",
    ],
  },
  {
    q: "Can I change my spec after I have ordered?",
    a: [
      "Yes, at any point before your order is submitted to the build queue. That is a separate step from payment, so there is a genuine window after you have paid.",
      "Once it has been submitted to the queue the specification is fixed, because the timbers have been selected and the work has started.",
    ],
  },
  {
    q: "What is the refund policy?",
    a: [
      "A full refund is available any time before your order goes into the build queue.",
      "After that point a refund is capped at 50% of the order value. The instrument is built to your specification and cannot simply be sold to the next person.",
    ],
  },
  {
    q: "Do I pay a deposit or the full amount?",
    a: [
      "The full amount, at the point of ordering. There is no deposit option and no balance to settle before shipping, so there is nothing to chase later.",
      "Payment is handled by Stripe. Card details never touch our own systems.",
    ],
  },
  {
    q: "Where are the guitars built?",
    a: [
      "In the United Kingdom, by hand. Every instrument is inspected by the same team that built it before it is allowed to ship.",
    ],
  },
  {
    q: "What if I have a question part-way through a build?",
    a: [
      "Placeholder — contact details to be confirmed. Reaching the UK team directly is meant to be easy at every stage, not something you have to hunt for, and the contact link sits in the footer of every page.",
    ],
  },
];

export default function FaqPage() {
  return (
    <main>
      <PageHero
        title="Answered before you spend anything"
        intro="The questions worth having settled before you start a build. If yours is not here, the UK team is one email away."
      />

      <section className="border-t border-line py-12 md:py-16">
        <div className={shell}>
          <div className="max-w-[76ch]">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group border-b border-line first:border-t"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-8 py-6 text-[1.0625rem] font-medium leading-[1.5] transition-colors hover:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span
                    aria-hidden
                    className="relative mt-2 h-3 w-3 shrink-0"
                  >
                    <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-ink" />
                    {/* Collapse rule lives in globals.css — see note there. */}
                    <span
                      data-accordion-bar
                      className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-ink"
                    />
                  </span>
                </summary>
                <div className="pb-7 pr-8">
                  {faq.a.map((para, i) => (
                    <p
                      key={i}
                      className={`max-w-[66ch] text-[1rem] leading-[1.7] text-ink-muted ${i > 0 ? "mt-4" : ""}`}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <h2 className="max-w-[22ch] text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
            Still deciding?
          </h2>
          <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
            You can work all the way through the builder and see the final price
            without committing to anything.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/builder"
              className={`${buttonClasses({ size: "lg" })} w-full sm:w-auto`}
            >
              Start your build
            </Link>
            <Link
              href="/models"
              className={`${buttonClasses({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
            >
              See the models
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
