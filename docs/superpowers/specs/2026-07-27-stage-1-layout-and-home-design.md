# Stage 1 — Global layout and Home

Date: 2026-07-27
Status: built, awaiting review
Routes: `/` plus the shared header and footer

Stage 0's style guide is the source of truth for colour, type, spacing and
component patterns. Nothing here introduces a new token or a new type step.

## Scope

Global layout (nav, footer) and the Home page. No other page is built —
About, Models, FAQ are Stage 2, the Builder is Stage 3, and the footer's legal
pages are Stage 8.

## Decisions

### Route group keeps the style guide chrome-free

Site pages live in `app/(site)/` with a layout that adds the header and footer.
`/style-guide` sits outside that group, so it renders exactly as signed off
rather than gaining nav and footer it was not reviewed with. The root layout
still owns `html`, `body` and the fonts.

### Shared primitives, so the two cannot drift

`Button` moved from inside the style guide page into `components/ui/button.tsx`
and is now imported by both. It exports `buttonClasses()` alongside the
component so `next/link` can wear the same styling without a polymorphic
wrapper.

Navigation is defined once in `lib/nav.ts`. Routes that do not exist yet are
listed there now so the layout is complete and each link lights up as its stage
lands, rather than the nav being rebuilt four times.

### Two Tailwind conflicts found in review

Both were cases of assuming a later class in the string beats an earlier one.
Tailwind resolves same-property conflicts by stylesheet order, so it does not.

- The header's desktop CTA carried `hidden md:inline-flex`, but `inline-flex`
  from `buttonBase` won, and the button appeared in the mobile header beside
  the hamburger. The breakpoint now lives on a wrapper `div`.
- The tertiary variant carried `px-0` to cancel the size's `px-7`, and lost.
  "Read our story" rendered indented from the paragraph above it. Tertiary now
  draws from its own padding-free size map. Verified: both left edges compute
  to 170px.

The second fix changes the style guide's tertiary button very slightly — it now
sits flush, which is what the `px-0` was always trying to express.

### Nav order

Listed as About, Builder, Models, FAQ, matching the Stage 1 brief verbatim.
Worth a second look: a funnel order (Models → Builder → About → FAQ) puts the
product before the configurator and matches the exit-point order in the user
flow doc. Easy change if wanted.

### Home structure

1. **Hero** — centred, following the Mod Shop benchmark. Headline, the factual
   pitch beneath, primary into the Builder and secondary into Models, then the
   image.
2. **Brand statement** — left-aligned editorial at 28px, narrow measure, with a
   tertiary link into About.
3. **How it works** — the four steps from the brief, as a numbered sequence
   with the slant accent rather than four cards. Numbers are justified here
   because the order genuinely is the information. Closes with a Builder CTA.
4. **FAQ prompt** — heading, short copy, secondary CTA into the FAQ.

All four required destinations are reached from body content, not only the nav.

### Hero image

A `canvas` panel at 16:10 on mobile and 16:7 on desktop, carrying a slant rule
and a quiet label. Deliberately not a stock guitar photo — the photography vs
WebGL direction is an open question for Larry and is listed as Stage 8.

## Known gaps

- **Nav and footer links 404 until their stage lands.** Next also prefetches
  them, so a browser console on Home shows four failed `?_rsc=` requests. Both
  resolve as the routes are built; no workaround was added, since disabling
  prefetch would be temporary cruft to unpick later.
- Typefaces remain the Stage 0 placeholders.
- The logo upload at the repo root is still duplicated by
  `public/origin-wordmark-black.svg`; worth consolidating.

## Verification

- `npm run build` and `npm run lint` both pass.
- Rendered at 1440×900 and 390×844. No horizontal overflow at either.
- Mobile menu: opens, sets `aria-expanded`, closes on Escape, closes on link
  click, locks background scroll while open.
- `/style-guide` confirmed to render without site nav.
- Impeccable mechanical detector returns no findings.
