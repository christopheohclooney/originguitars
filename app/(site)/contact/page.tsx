import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { buttonClasses } from "@/components/ui/button";
import { ContactForm } from "@/components/ui/contact-form";
import { PageHero } from "@/components/ui/page-hero";
import { CONTACT_INBOX, PHONE_DISPLAY, PHONE_HREF } from "@/lib/contact";
import { shell } from "@/lib/style";

export const metadata: Metadata = {
  title: "Contact — Origin Guitars",
  description:
    "Reach the UK team that builds the instruments — by email at hello@originguitars.com, or by phone on (+44) 7883 066880.",
};

/*
 * Contact.
 *
 * The FAQ's page furniture — the same hero, the same measure, the same closing
 * beat — with the two contact routes given as cards rather than as a list. What
 * is deliberately not carried over is the disclosure: the FAQ hides its answers
 * because seven long ones would otherwise be a wall, and there is nothing here
 * worth making somebody click to read. That also means no client boundary and
 * no JavaScript on the route, the same trade legal-document.tsx made for the
 * same reason.
 *
 * There is no form, and not for want of markup. A form needs somewhere to post
 * to, and this site has no route handler, no mail transport and no spam
 * defence — a form that silently drops what people type is worse than no form,
 * and one wired to a `mailto:` action is a worse mail client than the one they
 * already have. Until there is a backend, the address and the number are the
 * interface, and both are one tap on the device most people will read this on.
 */

/*
 * Two icons, drawn here rather than pulled from a set. The site has no icon
 * dependency and these are the only two it needs — an envelope and a handset,
 * both at the hairline weight the builder's chevrons already use, so they sit
 * with the rest of the drawing on the site rather than arriving from somewhere
 * else. `currentColor` throughout, so the card's hover carries them with it.
 */
function MailIcon() {
  return (
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
  );
}

function PhoneIcon() {
  return (
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
      <path d="M8.1 3.4H5.3a1.8 1.8 0 0 0-1.8 2 17.2 17.2 0 0 0 15.1 15.1 1.8 1.8 0 0 0 2-1.8v-2.6l-4-1.5-1.8 1.8a13.9 13.9 0 0 1-5.3-5.3l1.8-1.8z" />
    </svg>
  );
}

type ContactMethod = {
  icon: ReactNode;
  heading: string;
  body: string;
  /* What the link says. The address and the number are the labels — a control
   * that reads "Email us" hides the one thing somebody came here to copy. */
  label: string;
  href: string;
};

const methods: ContactMethod[] = [
  {
    icon: <MailIcon />,
    heading: "Send an email",
    body: "For detailed enquiries or support, email us and we will come back to you.",
    label: CONTACT_INBOX,
    href: `mailto:${CONTACT_INBOX}`,
  },
  {
    icon: <PhoneIcon />,
    heading: "Give us a call",
    body: "Our UK team is available by phone during business hours.",
    label: PHONE_DISPLAY,
    href: PHONE_HREF,
  },
];

export default function ContactPage() {
  return (
    <main>
      <PageHero
        title="Contact us"
        intro="We're eager to hear from you. Whether you have questions, feedback, or need support, our team is ready to provide assistance now."
        introMeasure="66ch"
      />

      {/*
        No rule under the hero, following the FAQ and the legal pages: the
        full-bleed hairline is the builder canvas's device for dividing its
        chrome from its stage, and on a content page it interrupts the vertical
        run. The cards' own edges are enough to start the section.
      */}
      <section className="pb-16 md:pb-20">
        <div className={shell}>
          {/*
            The FAQ's column, which is also the proportion the reference draws
            the pair at — its cards run to roughly 70% of the content column,
            and 51.5rem is what that comes to at the width the designs were
            drawn at. Keeping the number the FAQ already uses means the page has
            one spine from here to the last button rather than a measure of its
            own invented for two cards.
          */}
          <div className="mx-auto grid max-w-[51.5rem] gap-6 md:grid-cols-2 md:gap-8">
            {methods.map((method) => (
              /*
                Home's model card, at rest and on hover: the lifted tone inside
                a hairline, the border warming as you approach, everything on
                the same 500ms curve the rest of the site eases with.

                `group` and the stretched link together are what make the whole
                card the target while there is still exactly one thing in the
                tab order and one accessible name to announce. The <a> is a real
                link around the address, and its ::after covers the card —
                rather than wrapping the whole card in an anchor, which would
                read the heading, the body and the address out as a single
                run-on link.
              */
              <article
                key={method.heading}
                className="group relative flex flex-col items-center rounded-2xl border border-line bg-canvas px-8 py-10 text-center transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-line-strong md:px-10 md:py-12"
              >
                {/*
                  The chip is white alpha rather than a third solid tone, the
                  same device as the card's hover lift and the builder's canvas
                  glow: it raises whatever is behind it instead of restating a
                  value that would have to be re-derived every time --color-
                  canvas moves.
                */}
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/[0.045] text-ink transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/[0.08]">
                  {method.icon}
                </span>

                <h2 className="mt-7 font-display text-[1.5rem] font-medium leading-[1.2] tracking-[-0.015em]">
                  {method.heading}
                </h2>

                <p className="mt-4 max-w-[34ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
                  {method.body}
                </p>

                {/*
                  `mt-auto` sits the address on the card's floor, so the pair
                  keeps a common baseline however the body copy wraps — the
                  same reason Home's cards float their name and price down.

                  The focus ring is on the link and offset, not on the card:
                  `after:` is what covers the card, and an outline on a
                  zero-height ::after box would draw a line through the middle
                  of it.
                */}
                <a
                  href={method.href}
                  className="mt-9 inline-flex items-center gap-2 rounded-sm text-[1.0625rem] font-medium text-ink after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  {method.label}
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
            ))}
          </div>
        </div>
      </section>

      {/*
        The form.

        Third of three routes rather than the first: the cards above are two
        taps for somebody who would rather use their own mail client or their
        phone, and this is for everybody who would rather not leave the page.
        It sits at the cards' measure so the two read as one column.

        The heading is centred, as the reference draws it, and it is the one
        place on this page where a section heading sits over its content rather
        than beside it — a form is a single object, so there is no margin
        column for a heading to hang in.
      */}
      <section className="pb-4 md:pb-8">
        <div className={shell}>
          <div className="mx-auto max-w-[51.5rem]">
            <h2 className="text-center font-display text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em]">
              Send a message
            </h2>

            <div className="mt-10 md:mt-14">
              <ContactForm />
            </div>
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

        Which is also why this block holds the cards' measure rather than
        opening out to the shell the way the FAQ's and About's closings do.
        Their drawing spans the full column and resets the measure on its way
        past; with nothing bridging it, the same widening would just start the
        last heading on the page a hundred pixels to the left of everything
        above it.
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
