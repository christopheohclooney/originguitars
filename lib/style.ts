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
 * The glass pill — the floating header's own surface.
 *
 * White at 6% over whatever is behind it, not a near-opaque slab: the tint is
 * the treatment, and the blur is what turns the photograph or the light leak
 * underneath into the pill's own ground. Held here rather than inline in
 * site-header.tsx so the reference sheet can show the real surface instead of
 * a replica of it.
 */
export const glassPill =
  "rounded-full border border-white/10 bg-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl";

/*
 * The card — Home's model cards, Contact's two method cards, the contact
 * form's own panel.
 *
 * The lifted tone inside a hairline, the border warming as you approach, on
 * the 500ms curve the rest of the site eases with. One string rather than
 * three identical ones, for the reason every other shared value here exists:
 * three copies is how the set quietly stops matching.
 *
 * Layout, padding and radius-beyond-2xl stay with the card that needs them —
 * a square model card and a centred method card are the same surface at
 * different sizes, not the same box.
 */
export const cardSurface =
  "rounded-2xl border border-line bg-canvas transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-line-strong";

/*
 * The product photography's corner.
 *
 * Far tighter than the card's rounded-2xl, and deliberately a different
 * decision rather than a smaller version of the same one. A card is a panel —
 * a piece of interface, and the softer corner is what makes it read as one. A
 * photograph of the instrument is the thing being sold, and a generous radius
 * on it reads as a rounded sticker rather than as a print; the near-square
 * corner is what makes the frame read as a window onto the guitar instead.
 *
 * Shared by the gallery's frames and the lightbox's slides and thumbnails,
 * which show the same photographs and would be the obvious pair to drift.
 */
export const frameRadius = "rounded-sm";

/*
 * The form control's shell, and the label above it.
 *
 * Lifted out of contact-form.tsx for the same reason `proseLink` came out of
 * legal-document.tsx: the reference sheet has to render the control the site
 * actually ships rather than a copy of it, and a copy is what stops matching
 * the first time a border or a radius moves.
 *
 * The fill is white alpha rather than a token: the card a field sits in is
 * already the lifted tone, so a field set on --color-surface reads as a hole
 * cut through it, and there is no third ground in the palette to reach for.
 * 2.5% over the card is the reference's relationship — the field sits just
 * above the panel it is in. Same device as the method cards' icon chips.
 *
 * Placeholders are set in the mono face, which is the reference's one real
 * typographic decision here: it makes "000-000-000" read as a format rather
 * than as somebody's actual order number, and it tells an empty field from a
 * filled one at a glance, since anything typed comes back in the body face.
 */
export const fieldControl =
  "w-full rounded-xl border border-line bg-white/[0.025] px-4 text-[1.0625rem] text-ink transition-colors placeholder:font-mono placeholder:text-ink-muted hover:border-line-strong focus-visible:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-[invalid=true]:border-danger";

export const fieldLabel = "block text-[0.9375rem] font-medium text-ink";

/*
 * The logo's 12° lean, for brand devices only — accent rules, badge cuts,
 * dividers. Never applied to type. `unslant` counter-rotates content inside a
 * slanted box so the text itself stays upright.
 */
export const slant: CSSProperties = {
  transform: "skewX(calc(-1 * var(--slant)))",
};

export const unslant: CSSProperties = { transform: "skewX(var(--slant))" };
