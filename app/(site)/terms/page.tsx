import type { Metadata } from "next";

import { LegalDocument, type LegalSection } from "@/components/ui/legal-document";
import { PageHero } from "@/components/ui/page-hero";
import { shell } from "@/lib/style";

export const metadata: Metadata = {
  title: "Terms and conditions — Origin Guitars",
  description:
    "How ordering works, what can still change once you've paid, lead times, and the law these terms are governed by.",
};

/*
 * Draft, and the second of the footer's two legal routes. Same shape as the
 * Privacy Policy by construction — both are LegalDocument with different words
 * in them, which is the whole reason that component exists.
 *
 * Every word of the sections below is Larry's, carried over verbatim rather
 * than paraphrased. On this page tightening the prose is a change to the terms
 * rather than to the writing, and the cancellation section in particular
 * states numbers the FAQ also quotes — the two have to agree exactly, so this
 * one is not reworded to fit the measure.
 *
 * The hero's subheading is the exception: framing rather than terms, written
 * to match the FAQ's voice. It deliberately names only what the sections
 * actually cover — warranty is unwritten, so it is not advertised up here.
 */

const sections: LegalSection[] = [
  {
    heading: "Orders",
    body: [
      "All guitars are made to order, built to the specification you confirm at checkout. Full payment is taken at the time of order.",
    ],
  },
  {
    heading: "Changes and cancellations",
    body: [
      "You can request spec changes or a full refund any time before your order is submitted to the build queue. Once submitted, no further spec changes can be made, and a refund at that point is capped at 50% of your order value.",
    ],
  },
  {
    heading: "Lead times",
    body: [
      "Builds typically take up to six months, depending on complexity. If your build will take longer, or is ready sooner, we'll contact you directly.",
    ],
  },
  {
    heading: "Product accuracy",
    body: [
      "Product images are a guide. Your finished guitar may vary slightly from the on-screen preview, given the handmade nature of each build.",
    ],
  },
  {
    heading: "Warranty",
    /*
     * Left as a marked gap rather than filled in. Warranty terms are a
     * commitment about what Origin will repair or replace and for how long —
     * the one section here that cannot be reasoned out from how the rest of
     * the site works, and the one where a plausible guess would be a promise
     * nobody has agreed to make.
     */
    todo: "Warranty terms are still to be confirmed with Larry — what is covered, and for how long.",
  },
  {
    heading: "Governing law",
    body: ["These terms are governed by the laws of England and Wales."],
  },
];

export default function TermsPage() {
  return (
    <main>
      {/*
        20ch rather than the default 16ch.

        In sentence case the title measures 15.84ch set in Archivo, so it now
        clears the default on its own — but by 1%, and 1% is not a margin. It
        was the title-case version, at 16.21ch, that overflowed and split the
        label across two lines; dropping one capital moved it just inside.

        A cap that clears its text by a rounding error is one rendering
        difference away from wrapping again, and the fallback face shown while
        Archivo is still loading is exactly that difference. So the measure
        stays widened here rather than resting on the coincidence.

        Still a cap and not `nowrap`: a phone narrower than about 480px has
        less room than the title needs and breaks it after "and", which is the
        sensible break and the one it should have.
      */}
      <PageHero
        title="Terms and conditions"
        titleMeasure="20ch"
        intro="How ordering works, what can still change once you've paid, and how long a build takes."
      />

      {/*
        No rule under the hero and no closing CTA, matching the Privacy Policy
        and the FAQ before it — see the note on the Privacy Policy page for the
        reasoning on both.
      */}
      <section className="pb-24 md:pb-32">
        <div className={shell}>
          <LegalDocument
            updated={{ iso: "2026-08-11", label: "11 August 2026" }}
            draftNotice="These terms are a draft and have not yet been through legal review. They describe how we intend to handle orders, but they are not final."
            sections={sections}
          />
        </div>
      </section>
    </main>
  );
}
