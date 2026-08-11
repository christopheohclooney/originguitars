import type { CSSProperties } from "react";

/*
 * The page gutter. Every section measures from this, so it stays in one place.
 * The width itself is --shell in globals.css, where the header pill and the
 * full-bleed frames can read the same number.
 */
export const shell = "mx-auto w-full max-w-[var(--shell)] px-6 md:px-10";

/*
 * A link inside a sentence. The tertiary button's underline without the box —
 * not `buttonClasses({ variant: "tertiary" })`, which carries a height and
 * `inline-flex` and would knock a word out of its line box.
 *
 * Lifted out of legal-document.tsx, which owned it while the policy pages were
 * the only prose with links in them. Contact needs the same treatment, and a
 * link in a sentence is not a legal-page device — the alternative was a contact
 * page importing something called `legalLinkClasses`.
 */
export const proseLink =
  "text-ink underline underline-offset-[4px] decoration-line-strong transition-colors hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/*
 * The logo's 12° lean, for brand devices only — accent rules, badge cuts,
 * dividers. Never applied to type. `unslant` counter-rotates content inside a
 * slanted box so the text itself stays upright.
 */
export const slant: CSSProperties = {
  transform: "skewX(calc(-1 * var(--slant)))",
};

export const unslant: CSSProperties = { transform: "skewX(var(--slant))" };
