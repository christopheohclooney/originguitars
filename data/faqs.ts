import type { FaqEntry } from "@/components/ui/faq-accordion";

/*
 * The FAQ, in one place.
 *
 * Lifted out of the FAQ page once Contact grew a three-question preview of it.
 * The alternative was three questions and their answers copied into a second
 * file, which is the arrangement where a policy gets corrected on one page and
 * quietly contradicts itself on the other — and the refund and lead-time
 * answers here are exactly the ones that must never say two different things
 * in two places.
 *
 * The answers are drawn from the user flow doc's stated policy rather than
 * invented, which is why they are worth protecting this way.
 */

/*
 * `id` is what a preview selects by. Selecting by position would mean
 * reordering the FAQ silently reorders what Contact shows; selecting by the
 * question text would mean rewording a question silently breaks it. An id does
 * neither, and `pickFaqs` below turns a missing one into a failed build rather
 * than a gap on the page.
 */
export type Faq = FaqEntry & { id: string };

export const faqs: Faq[] = [
  {
    id: "lead-time",
    q: "How long will my guitar take to arrive?",
    a: [
      "Up to six months, depending on how complex the build is. A straightforward spec moves faster than one with binding, an inlay and a custom finish.",
      "If yours is going to run longer than that, we tell you directly rather than letting the date slide. More often it comes in sooner than the estimate.",
    ],
  },
  {
    id: "changes",
    q: "Can I make changes after I've ordered?",
    a: [
      "Yes, at any point before your order is submitted to the build queue. That is a separate step from payment, so there is a genuine window after you have paid.",
      "Once it has been submitted to the queue the specification is fixed, because the timbers have been selected and the work has started.",
    ],
  },
  {
    id: "cancelling",
    q: "What if I need to cancel?",
    a: [
      "A full refund is available any time before your order goes into the build queue.",
      "After that point a refund is capped at 50% of the order value. The instrument is built to your specification and cannot simply be sold to the next person.",
    ],
  },
  {
    id: "where-made",
    q: "Where are Origin guitars made?",
    a: [
      "In the United Kingdom, by hand. Every instrument is inspected by the same team that built it before it is allowed to ship.",
    ],
  },
  {
    id: "payment",
    q: "Do I need to pay a deposit, or the full amount upfront?",
    a: [
      "The full amount, at the point of ordering. There is no deposit option and no balance to settle before shipping, so there is nothing to chase later.",
      "Payment is handled by Stripe. Card details never touch our own systems.",
    ],
  },
  {
    id: "made-to-order",
    q: "What does made to order actually mean?",
    a: [
      "Nothing is built until you order it. There is no warehouse of finished guitars waiting for somebody to pick one — your instrument is started after your order is placed, to the exact specification you set in the builder.",
      "That is why the option list is as long as it is, and why the lead time is what it is.",
    ],
  },
  {
    /*
     * A marked placeholder until /contact existed. It now answers with the two
     * routes that page carries rather than with an apology.
     */
    id: "mid-build-question",
    q: "What if I have a question part-way through a build?",
    a: [
      "Email hello@originguitars.com, or call the UK team on (+44) 7883 066880 during business hours. Either way you reach the people building it — reaching them directly is meant to be easy at every stage, not something you have to hunt for.",
      "Both are on the contact page, linked in the footer of every page.",
    ],
  },
];

/*
 * Pick a few by id, in the order asked for.
 *
 * Throws rather than skipping. This runs while a page is being prerendered, so
 * an id that no longer exists stops the build with the id in the message —
 * which is the moment somebody deleting a question finds out that a preview
 * pointed at it. Filtering the miss away instead would ship a section quietly
 * one question short.
 */
export function pickFaqs(...ids: string[]): Faq[] {
  return ids.map((id) => {
    const found = faqs.find((faq) => faq.id === id);
    if (!found) {
      throw new Error(
        `pickFaqs: no FAQ with id "${id}". It was renamed or removed in data/faqs.ts.`,
      );
    }
    return found;
  });
}
