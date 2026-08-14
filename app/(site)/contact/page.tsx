import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { buttonClasses } from "@/components/ui/button";
import { ContactForm } from "@/components/ui/contact-form";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { PageHero } from "@/components/ui/page-hero";
import { pickFaqs } from "@/data/faqs";
import { CONTACT_INBOX, PHONE_DISPLAY, PHONE_HREF } from "@/lib/contact";
import { cardSurface, shell } from "@/lib/style";

export const metadata: Metadata = {
  title: "Contact — Origin Guitars",
  description:
    "Reach the UK team that builds the instruments — by email at hello@originguitars.com, or by phone on (+44) 7883 066880.",
};

/*
 * Contact.
 *
 * The FAQ's page furniture — the same hero, the same measure — with the two
 * contact routes given as cards rather than as a list, and the FAQ's own
 * accordion reused at the foot for the three questions most likely to be the
 * reason somebody is here.
 *
 * The page is still prerendered static. Two client islands sit in it — the
 * form and the accordion — and neither is on the critical path: the address,
 * the number and all three answers are in the HTML before any of it runs.
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

/*
 * The three the page previews, by id — the lead time, the window for changing
 * a specification, and what a cancellation costs. The three things somebody
 * about to write in is most likely to be writing in about, which is the whole
 * point of putting them above the form's own section rather than below it.
 *
 * By id rather than by position, so reordering the FAQ cannot silently
 * reorder this, and by `pickFaqs` rather than by hand, so deleting one of them
 * fails the build instead of shipping a section two questions long.
 */
const previewFaqs = pickFaqs("lead-time", "changes", "cancelling");

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
      {/*
        Section rhythm on this page: every block owns the space beneath it, and
        the numbers are the same one — pb-24 md:pb-32 — so the gaps between the
        cards, the form and the FAQ are identical rather than each being
        whatever the section above happened to leave.

        The small top padding here is the exception, and it is doing the same
        job: PageHero owns its own bottom space and is shared with four other
        pages, so rather than change what every hero does, this makes up the
        difference locally and brings the hero-to-cards gap in line with the
        rest.
      */}
      <section className="pt-2 pb-24 md:pt-10 md:pb-32">
        <div className={shell}>
          {/*
            The FAQ's column, which is also the proportion the reference draws
            the pair at — its cards run to roughly 70% of the content column,
            and 51.5rem is what that comes to at the width the designs were
            drawn at. Keeping the number the FAQ already uses means the page has
            one spine from here to the last button rather than a measure of its
            own invented for two cards.
          */}
          {/*
            The pair arrives one after the other rather than together — see the
            note on the page's motion at the top of this file. `h-full` on the
            card is what the stagger costs: the grid stretches its own children,
            and its children are now the StaggerItem wrappers, so the card has
            to be told to fill one. Without it the two cards size to their own
            copy and stop matching.
          */}
          <Stagger className="mx-auto grid max-w-[51.5rem] gap-6 md:grid-cols-2 md:gap-8">
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
              <StaggerItem key={method.heading}>
                <article
                  className={`${cardSurface} group relative flex h-full flex-col items-center px-8 py-10 text-center md:px-10 md:py-12`}
                >
                  {/*
                    The chip is white alpha rather than a third solid tone, the
                    same device as the card's hover lift and the builder's
                    canvas glow: it raises whatever is behind it instead of
                    restating a value that would have to be re-derived every
                    time --color-canvas moves.
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
                    zero-height ::after box would draw a line through the
                    middle of it.
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
                      <path
                        d="M2.5 8h11M9 3.5 13.5 8 9 12.5"
                        strokeLinecap="square"
                      />
                    </svg>
                  </a>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
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
      {/*
        Rendered whether or not this deployment can send.

        It was briefly conditional on a Resend key being present, on the
        reasoning that a form which cannot send should not be offered. That is
        the right instinct for a launched site and the wrong one for this one:
        the section is part of the design being reviewed, and having it appear
        and disappear with an environment variable makes the page harder to
        judge than a form that says plainly what happened.

        With no key the send is still refused rather than swallowed — the
        visitor gets the address, and keeps what they typed. See actions.ts.
      */}
      <section className="pb-24 md:pb-32">
        <div className={shell}>
          <Stagger className="mx-auto max-w-[51.5rem]">
            <StaggerItem>
              <h2 className="text-center font-display text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em]">
                Send a message
              </h2>
            </StaggerItem>

            <StaggerItem className="mt-10 md:mt-14">
              <ContactForm />
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/*
        The FAQ, three questions deep, and the page's last word before the
        footer.

        The three are pulled from data/faqs.ts by id rather than restated here
        — same questions, same answers, one source. A visitor who opens
        "What if I need to cancel?" on this page and again on the FAQ gets the
        same refund terms, permanently, because there is only one copy of them
        to maintain.

        The same accordion as the FAQ page, not a lighter-weight cousin: a
        preview that behaves differently from the thing it previews is a second
        component to keep in step, and this one already handles the reveal, the
        indicator and the reduced-motion case.

        It replaces the "Already answered?" block that used to sit here, which
        pointed at the FAQ in prose. Three questions that open where they stand
        do that job better — the answer arrives without the page changing.
      */}
      {/*
        No top padding: the form's own bottom space above is the gap, so the
        two are not stacked and doubled. The bottom is the page's last measure
        before the footer band.
      */}
      <section className="pb-24 md:pb-32">
        <div className={shell}>
          <Stagger className="mx-auto max-w-[51.5rem]">
            <StaggerItem>
              <h2 className="text-center font-display text-[clamp(2rem,3.4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em]">
                Have a question?
              </h2>
            </StaggerItem>

            <StaggerItem className="mt-12 md:mt-16">
              <FaqAccordion items={previewFaqs} />
            </StaggerItem>

            {/*
              Centred under the list, which is the one place a button belongs
              on a page whose last section has no left edge to hang from — the
              same reasoning as Home's centred model grid.
            */}
            <StaggerItem className="mt-12 flex justify-center md:mt-14">
              {/* Full-width below sm, per the site-wide rule for primary CTAs. */}
              <Link
                href="/faq"
                className={`${buttonClasses({ size: "lg" })} w-full sm:w-auto`}
              >
                Read more FAQs
              </Link>
            </StaggerItem>
          </Stagger>
        </div>
      </section>
    </main>
  );
}
