import type { Metadata } from "next";

import {
  LegalDocument,
  legalLinkClasses,
  type LegalSection,
} from "@/components/ui/legal-document";
import { PageHero } from "@/components/ui/page-hero";
import { shell } from "@/lib/style";

export const metadata: Metadata = {
  title: "Privacy Policy — Origin Guitars",
  description:
    "What we collect when you order, what we do with it, how long we keep it, and how to have it corrected or removed.",
};

/*
 * Draft. Every word of the sections below is Larry's, carried over verbatim
 * and not paraphrased — this is the one kind of page where tightening the
 * prose is a change to the policy rather than to the writing. It has not been
 * through legal review, which is what the notice on the page says.
 *
 * The hero's subheading is the exception: it is framing rather than policy,
 * written here to match the FAQ's voice, and it makes no claim the sections do
 * not already make.
 */

const sections: LegalSection[] = [
  {
    heading: "What we collect",
    body: [
      "When you place an order, we collect your name, email address, and delivery address via Stripe. We don't store your payment card details — Stripe processes and holds that directly.",
    ],
  },
  {
    heading: "How we use it",
    body: [
      "To process your order, keep you updated on your build, and contact you if we need to. We don't sell or share your data with third parties for marketing.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "For as long as needed to fulfil your order and meet our legal and accounting obligations.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      <>
        You can ask us what data we hold on you, ask us to correct it, or ask us
        to delete it, subject to our legal obligations to keep certain records.
        Contact us at{" "}
        <a href="mailto:hello@originguitars.com" className={legalLinkClasses}>
          hello@originguitars.com
        </a>
        .
      </>,
    ],
  },
  {
    heading: "Cookies",
    /*
     * Left as a marked gap rather than filled in. What belongs here depends on
     * the analytics and tracking actually running on the site, which is not
     * settled — and a cookie notice that describes the wrong cookies is worse
     * than one that admits it is not written.
     */
    todo: "Depends on the analytics and tracking actually in use — to be confirmed with Larry.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main>
      <PageHero
        title="Privacy Policy"
        intro="What we collect when you order, what we do with it, and how to have it corrected or removed."
      />

      {/*
        No rule under the hero and no closing CTA, following the FAQ. The rule
        is the builder canvas's device for dividing chrome from stage; on a
        content page it interrupts the vertical run, and the document's own
        first hairline starts the list anyway.

        The CTA is left off for a different reason: the FAQ ends on a way to
        reach the team because its whole subject is questions that might not be
        answered there. Here the way to reach the team is the policy — it sits
        under "Your rights", where it is a right rather than an offer, and
        repeating it 300px lower as a button would make the two read as
        different routes.
      */}
      <section className="pb-24 md:pb-32">
        <div className={shell}>
          <LegalDocument
            updated={{ iso: "2026-08-11", label: "11 August 2026" }}
            draftNotice="This policy is a draft and has not yet been through legal review. It describes how we intend to handle your data, but it is not final."
            sections={sections}
          />
        </div>
      </section>
    </main>
  );
}
