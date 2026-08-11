import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonClasses } from "@/components/ui/button";
import { PageHero } from "@/components/ui/page-hero";
import { proseLink, shell } from "@/lib/style";

export const metadata: Metadata = {
  title: "Contact — Origin Guitars",
  description:
    "One address, read by the UK team that builds the instruments — plus what to send with the first message, and what is still to be confirmed.",
};

/*
 * Contact.
 *
 * Built on the FAQ: the same hero, the same centred 51.5rem column, the same
 * hairline-separated list underneath it. What is deliberately not carried over
 * is the disclosure — the FAQ hides its answers because seven long ones would
 * otherwise be a wall, and there is nothing here worth making somebody click to
 * read. That also means no client boundary and no JavaScript on the route, the
 * same trade legal-document.tsx made for the same reason.
 *
 * There is no form, and not for want of markup. A form needs somewhere to post
 * to, and this site has no route handler, no mail transport and no spam
 * defence — a form that silently drops what people type is worse than no form,
 * and one wired to a `mailto:` action is a worse mail client than the one they
 * already have. The address is the interface until there is a backend behind
 * it.
 */

/*
 * hello@originguitars.com is the only contact detail on the site that has been
 * used in anger — it is already on the FAQ and in the privacy policy's "Your
 * rights" section, so it is carried here rather than invented. Everything else
 * a contact page would normally carry (a phone number, a postal address, the
 * social channels, a stated reply time) is genuinely unconfirmed, and is marked
 * as such at the foot of the list instead of being made up. Same habit as the
 * privacy policy's cookie section.
 */
const EMAIL = "hello@originguitars.com";

type ContactEntry = {
  heading: string;
  /*
   * One entry per paragraph, and ReactNode rather than string because two of
   * these have to point somewhere — the builder and the FAQ are where half of
   * the answers already live, and sending somebody to "the FAQ" without a link
   * to it is the sort of thing that generates the email it was meant to save.
   */
  body: ReactNode[];
};

const entries: ContactEntry[] = [
  {
    heading: "What to send",
    body: [
      <>
        For a build you have not ordered yet: the model you are looking at, and
        anything you have already settled on — shape, finish, hardware, pickups.
        The{" "}
        <Link href="/builder" className={proseLink}>
          builder
        </Link>{" "}
        prices a full specification as you go, so the quickest thing to send is
        usually the options you landed on there.
      </>,
      <>
        For an order already placed: the email address you ordered with. That is
        what your build is filed under, and leading with it saves the first
        reply being a request for it.
      </>,
    ],
  },
  {
    heading: "Changing or cancelling",
    body: [
      <>
        There is a real window. Nothing is fixed until your order is submitted
        to the build queue, which is a separate step from payment — so say what
        you would like changed and the team can confirm what is still open.
      </>,
      <>
        The{" "}
        <Link href="/faq" className={proseLink}>
          FAQ
        </Link>{" "}
        carries the exact terms, including how a refund works once the timbers
        have been selected and the work has started.
      </>,
    ],
  },
  {
    heading: "Where we are",
    body: [
      <>
        The United Kingdom. The people reading this address are the ones who
        inspect and finish every instrument before it ships, which is why there
        is no support desk in front of them and nobody to be passed along to.
      </>,
    ],
  },
  {
    heading: "Still to be confirmed",
    body: [
      <>
        A phone number, a postal address, the social channels and a stated reply
        time are all still to be agreed. Rather than print a number nobody has
        committed to, this page carries the one route that is real — and this
        section goes as each of the others lands.
      </>,
    ],
  },
];

export default function ContactPage() {
  return (
    <main>
      <PageHero
        title="Get in touch"
        intro="One address, read by the people who build the guitars. Whether you are still choosing a specification or halfway through a build, it reaches the same UK team."
      />

      {/*
        No rule under the hero, following the FAQ and the legal pages: the
        full-bleed hairline is the builder canvas's device for dividing its
        chrome from its stage, and on a content page it interrupts the vertical
        run. The list's own first rule is enough to start it.

        The address leads rather than closing, which is the one structural
        inversion of the FAQ. There the mailto is the last resort after seven
        answers; here it is the entire point of the route, and burying the
        thing somebody navigated here for beneath four paragraphs about how to
        use it would be a strange way to answer them.
      */}
      <section className="pb-12 md:pb-16">
        <div className={shell}>
          <div className="mx-auto max-w-[51.5rem]">
            {/*
              The address is the button rather than a label on one, so what you
              read is what you get when you tap it — the FAQ's closing does the
              same, and the two are the same control in two places.
            */}
            <a
              href={`mailto:${EMAIL}`}
              className={`${buttonClasses({ size: "lg" })} w-full sm:w-auto`}
            >
              {EMAIL}
            </a>

            <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-[1.7] text-ink-muted">
              No form, no ticket number, no account to make first. A sentence
              about what you are after is enough to start — everything below is
              what saves a round trip, not what is required.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-4 md:pb-8">
        <div className={shell}>
          {/*
            The same column the FAQ sets its list in, for the same reason: wide
            enough that the headings read as headings, narrow enough that the
            eye is not tracking a full page width across a hairline.

            Inside it the row splits from md — the heading held in a margin
            column with the prose beside it, which is About's editorial device
            rather than the FAQ's stacked one. The FAQ stacks because its
            heading is a control the whole row width belongs to; these headings
            are labels on a paragraph, and set full width they read as four
            more questions nobody asked.
          */}
          <div className="mx-auto max-w-[51.5rem]">
            {entries.map((entry) => (
              <div
                key={entry.heading}
                className="border-b border-line py-9 first:border-t md:grid md:grid-cols-[15rem_1fr] md:gap-10 md:py-12"
              >
                {/*
                  Medium, and a step below About's section headings — the same
                  size the legal pages use, and for the same reason: there are
                  four of these inside one column, so they mark structure
                  rather than announce it.
                */}
                <h2 className="font-display text-[clamp(1.375rem,1.9vw,1.625rem)] font-medium leading-[1.25] tracking-[-0.02em]">
                  {entry.heading}
                </h2>

                <div className="mt-4 md:mt-0">
                  {entry.body.map((paragraph, i) => (
                    <p
                      key={i}
                      className={`max-w-[62ch] text-[1.0625rem] leading-[1.75] text-ink-muted ${
                        i > 0 ? "mt-4" : ""
                      }`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*
        The closing beat, following About's: copy left, the ways forward right,
        on one baseline from md up and stacked below it. Primary sits last in
        the source, which puts it at the right-hand end of the row — the far end
        of the reading direction, and the position the designs give it.

        No technical drawing across the top of it, which is the one part of the
        FAQ's closing left behind. That page ends by handing you this one, and
        this one ends by handing you back — running the same elevation across
        both would make the two ends of a single loop look like the same page
        twice. The drawings stay where they answer something: the side view on
        the FAQ, the front elevation on About.

        Which is why this block stays inside the 51.5rem column rather than
        opening out to the shell the way the FAQ's and About's closings do.
        Their drawing spans the full column and resets the measure on its way
        past; with nothing bridging it, the same widening would just start the
        last heading on the page a hundred pixels to the left of everything
        above it. One spine from the first hairline to the last button.
      */}
      <section className="py-20 md:py-28">
        <div className={shell}>
          <div className="mx-auto flex max-w-[51.5rem] flex-col gap-10 md:flex-row md:items-end md:justify-between md:gap-16">
            <div>
              <h2 className="max-w-[18ch] font-display text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.02em]">
                Already answered?
              </h2>
              <p className="mt-5 max-w-[44ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
                Lead times, payment, changes to a specification and refunds are
                all written down. If yours is one of those, the answer is there
                now rather than waiting on a reply.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-4 sm:flex-row">
              <Link
                href="/faq"
                className={`${buttonClasses({ variant: "secondary" })} w-full sm:w-auto`}
              >
                Read the FAQ
              </Link>
              <Link
                href="/builder"
                className={`${buttonClasses()} w-full sm:w-auto`}
              >
                Build your own
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
