# Stage 3a — Builder shell

Date: 2026-07-28
Status: built, awaiting review
Route: `/builder`

## Scope

The shell only: step layout, step indicator, persistent guitar image, sticky
price bar, and the handedness step with live pricing wired to it. No other
option steps. Review is Stage 4.

## Decisions

### Money in pence, as integers

`BASE_PRICE_PENCE = 189_900`, deltas in pence. Never pounds as floats. Stripe
expects the smallest currency unit at Stage 5, and integer arithmetic avoids
the rounding drift that eventually bites any price calculator built on floats.
Formatting happens once, at the display edge, via `Intl.NumberFormat`.

### Pricing is derived, not stored

`calculateTotalPence` reduces over the steps on every render. There is no
running total held in state that could fall out of sync with the selections.
Entirely client-side, per the build spec — no backend call until submission.

### Native radios under custom tiles

Each option tile wraps a visually-hidden `<input type="radio">`. That buys
correct semantics and arrow-key navigation between options for free, rather
than reimplementing roving focus on `<div role="radio">`. Verified: pressing
ArrowDown moves the selection and the price updates.

Selected styling is driven from React state rather than a `peer-checked:`
variant, and the focus ring is one explicit `:has()` rule in `globals.css` —
same reason as the FAQ accordion in Stage 2, where the Tailwind variants
compiled to nothing.

### The price bar is now one shared component

`components/ui/price-bar.tsx`, used by both the builder and the style guide's
specimen. The style guide passes demo props and renders byte-identically to
before — verified: same price, label, height and pinned position.

This matters more than the usual DRY argument. The bar is the one pattern that
appears on every builder step and in the reference sheet, so two copies would
have drifted at exactly the point where consistency is most visible.

### Sticky, not fixed

`position: sticky; bottom: 0` as the last child of `<main>`, which is
`min-h-[calc(100svh-72px)]`. The bar pins to the viewport bottom while the
builder is in view and releases at the footer, so it never permanently covers
the footer the way a `fixed` bar would. Verified on mobile: with the options
scrolled into view the bar sits below them, covering nothing.

### The guitar stays in view

Sticky on large screens so it holds position as the option list grows in 3b,
which is the Mod Shop behaviour the brief asks for.

The image path is resolved at build time with `existsSync`, checking
`public/models/element/element-full.{png,jpg,jpeg,webp,avif}`. Dropping the
manufacturer's photo in at that path is all that is needed — no code change.
Until then the standard placeholder shows.

## Open questions

**The step count is eleven here because that is what was specified, but the
user flow doc lists ten option steps:** handedness, construction, strings,
colour, fretboard, inlay, binding, headstock, bridge, hardware. Eleven
presumably counts model selection as step one. Worth confirming — the number is
visible to the customer on every screen, and `01 / 11` that never reaches
eleven would be noticed.

**Review is present and styled but inert.** It opens a modal in Stage 4 and
there is nothing to wire it to yet. It is rendered enabled rather than disabled
so the bar reviews as the real pattern.

## Placeholders needing Larry

- `BASE_PRICE_PENCE` — £1,899.00 is invented.
- Left-handed delta — £120.00 is invented. It is non-zero specifically so the
  live calculation is visibly demonstrable.

Both are in `data/options.ts` under a warning header.

## Verification

- `npm run build` and `npm run lint` pass. Seven static routes.
- Price: £1,899.00 default → £2,019.00 on left-handed → £1,899.00 back.
- Keyboard: ArrowDown moves selection, price follows.
- Step arrows correctly disabled at both ends with one step defined.
- No horizontal overflow at 1440 or 390. No page errors.
- Style guide price bar unchanged after the refactor.
- Impeccable mechanical detector returns no findings.
