import type { ReactNode } from "react";

import { Reveal } from "@/components/motion/reveal";

/*
 * The long-form legal document — Privacy policy first, Terms and conditions
 * next.
 *
 * Shared rather than written twice. The two pages are the same artefact with
 * different words in it, and a second hand-rolled copy is how the pair quietly
 * drifts apart — the same reasoning that lifted Overline out of About.
 *
 * Structurally this is the FAQ's list with the disclosure taken off: the same
 * hairline between entries, the same heading-then-body rhythm. What changes is
 * that nothing is hidden. A policy you have to expand to read is a policy
 * nobody reads, and there is no reason to spend JavaScript on concealing text
 * people arrive here specifically to find — the FAQ's accordion is the one
 * thing from that page deliberately not carried over.
 *
 * Each section does now arrive on scroll, which is the only motion here and is
 * the same primitive Home and About use. It is a reveal, not a disclosure: the
 * text is in the document either way, and the two guards in globals.css and
 * MotionProvider mean a reader with reduced motion or no JavaScript gets it
 * outright rather than waiting on an animation that will never run. Nothing on
 * a page like this may depend on script to become readable.
 *
 * Measure rather than column. The FAQ sets its list to 51.5rem and then caps
 * its answers at 62ch inside it, because there the question is a heading and
 * only the answer is prose. Here everything is prose, so the measure is the
 * column: 62ch, the same one the FAQ's answers already use, centred. Set to
 * the FAQ's full 51.5rem the body would run near 97 characters a line, which
 * is a page you skim rather than one you read.
 */

export type LegalSection = {
  heading: string;
  /*
   * One entry per paragraph. ReactNode rather than string because a policy has
   * to be able to point somewhere — the contact address under "Your rights" is
   * a mailto, not a word.
   */
  body?: ReactNode[];
  /*
   * Copy that is not written yet, flagged where it will eventually sit rather
   * than left out. A missing section reads as a policy that does not cover the
   * thing; a marked one reads as a policy still being written, which is the
   * true state of it. Same habit as the FAQ's placeholder answer.
   */
  todo?: ReactNode;
};

/* The mono, tracked label — the overline's treatment, without the mark. */
const labelClasses =
  "font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-ink-muted";

export function LegalDocument({
  sections,
  updated,
  draftNotice,
}: {
  sections: LegalSection[];
  /*
   * The date and its machine-readable form travel together, the same way
   * PageHero's image and its alt do — a <time> without a `dateTime` is just a
   * string, and one whose two halves disagree is worse than neither.
   *
   * A literal rather than a computed date. The footer's copyright year can be
   * generated because it is always now; "last updated" is a claim about when
   * the words themselves last changed, and generating it would restate today
   * on every deploy whether or not a syllable moved.
   */
  updated: { iso: string; label: string };
  /*
   * Shown, not buried in a comment. An unreviewed policy that looks finished
   * is the failure mode worth designing against, so the page says what it is
   * until it is signed off. Removing this prop is a one-line change.
   */
  draftNotice?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[62ch]">
      <Reveal>
        <p className={labelClasses}>
          Last updated <time dateTime={updated.iso}>{updated.label}</time>
        </p>
      </Reveal>

      {draftNotice && (
        <Reveal
          delay={0.1}
          className="mt-8 border border-line-strong bg-canvas p-5 md:p-6"
        >
          <p className={labelClasses}>Draft</p>
          <p className="mt-3 text-[0.9375rem] leading-[1.6] text-ink">
            {draftNotice}
          </p>
        </Reveal>
      )}

      {/*
        One reveal per section rather than one around the document. A single
        container would enter the viewport with its first section and fire the
        whole policy at once, including the four screens of it nobody has
        scrolled to yet — which is a page-load animation wearing a scroll
        animation's clothes. Per section, each arrives as you reach it.
      */}
      {sections.map((section) => (
        <Reveal
          as="section"
          key={section.heading}
          className="mt-10 border-t border-line pt-10 md:mt-14 md:pt-14"
        >
          {/*
            Medium, per the rule the designs set: metallic hero type is
            regular, section headings are medium. Smaller than About's section
            headings on purpose — there are five or six of these on one page
            rather than one per screen, so they mark structure instead of
            announcing it.
          */}
          <h2 className="font-display text-[clamp(1.375rem,1.9vw,1.625rem)] font-medium leading-[1.25] tracking-[-0.02em]">
            {section.heading}
          </h2>

          {section.body?.map((paragraph, i) => (
            <p
              key={i}
              className={`text-[1.0625rem] leading-[1.75] text-ink-muted ${
                i === 0 ? "mt-5" : "mt-4"
              }`}
            >
              {paragraph}
            </p>
          ))}

          {section.todo && (
            <div className="mt-5 border-l border-line-strong pl-5">
              <p className={labelClasses}>To be confirmed</p>
              <p className="mt-2.5 text-[1.0625rem] leading-[1.75] text-ink-muted">
                {section.todo}
              </p>
            </div>
          )}
        </Reveal>
      ))}
    </div>
  );
}
