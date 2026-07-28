# Stage 2 — Static content pages and the motion pass

Date: 2026-07-27
Status: built, awaiting review
Routes: `/about`, `/models`, `/faq`, plus scroll motion on `/`, `/about`,
`/models`

Stage 0's style guide remains the source of truth. No new token, type step or
component pattern was introduced.

## Scope

The three static pages, and the scroll-linked motion pass across Home, About
and Models. The Builder is untouched.

## Pages

### About

Structure and rhythm only. Every paragraph is placeholder, written to roughly
the length the real text should run to so the measure and vertical spacing can
be judged now — lorem would have made the rhythm impossible to read at these
sizes.

Editorial rather than product: a full-measure lede, asymmetric two-column
sections with the heading held in a 16rem margin column, a pull quote, and the
two-image grid the build spec flagged as worth exploring. Sections are
separated by hairlines rather than boxed into cards.

### Models

Model data lives in `data/models.ts` rather than in the page, so the
specifications are findable and replaceable in one place.

**The specification values are invented.** The build spec and user flow doc
name the fields a listing needs — shape, scale length, body and neck
materials, pickups, description — but give no values. Everything in that file
is placeholder so the layout could be judged at realistic content lengths, and
every one needs replacing with Larry's real figures before this goes near
production. The file carries the same warning at the top.

Element is presented as available, with the spec table and a Build your own
CTA. Lance and Element Bass appear under "In development" with the slant badge
from the style guide. Tempest and Cleaver are absent entirely, per the user
flow doc.

### FAQ

Native `<details>`/`<summary>`. Keyboard accessible and fully functional with
no JavaScript, which is the right trade for a page whose whole job is
answering objections before somebody abandons a build.

Seven questions. The answers on lead time, spec changes, the refund cap and
payment are taken from the stated policy in the user flow doc, so they are
accurate rather than invented. The contact answer is marked placeholder
pending Larry's details.

## Motion

`LazyMotion` with only the `domAnimation` feature set, and `strict` so
`motion.*` throws — nothing can quietly pull the full bundle back in. All
reveals use `m.*`.

Three primitives in `components/motion/reveal.tsx`: `Reveal` for a single
block, `Stagger`/`StaggerItem` for sequences. Opacity and y only, both
GPU-composited. Tween rather than spring, per the rule that springs belong to
interaction and tweens to scroll entrances. `once: true`, so nothing
re-animates on the way back up.

**Heroes are deliberately not animated.** The hero is the LCP element on every
page, and starting it at `opacity: 0` would hold the largest paint behind
hydration.

### Not letting content get trapped behind an animation

Reveals render their hidden state server-side, so anything that stops the
animation running leaves content permanently invisible. Two independent guards:

- A `<noscript>` rule forcing `[data-reveal]` visible, for JavaScript-off.
- A `prefers-reduced-motion` rule in `globals.css` doing the same.

The second one is load-bearing, not belt-and-braces. Testing under emulated
reduced motion found **eight elements stuck at `opacity: 0`** with the motion
wrappers still mounted — `useReducedMotion()` was not returning true, so the
hook alone would have shipped blank sections to exactly the users who most
need the page to work. The CSS guard does not depend on it. Verified: zero
invisible elements on all three pages under reduced motion.

## Defects found in review

Four, all caught by measuring rather than by looking.

1. **Models grid collapsed to 947px / 178px.** As a stretched grid item the
   image filled the row height, and `aspect-[4/3]` then derived its *width*
   from that height — starving the spec column until values wrapped and the
   CTA broke across two lines. Fixed with `minmax(0,…)` and `items-center`.
   Now 543 / 493.
2. **The About pull quote collapsed to a ~190px column.** `max-w-[24ch]` sat
   on the `<blockquote>`, so `ch` resolved against 16px body text rather than
   the 44px display size. Moved onto the `<p>`. Now 610px across three lines.
3. **The FAQ plus never became a minus.** Neither `group-open:` nor an
   arbitrary `[[open]_&]:` variant compiled to any rule — both silently
   produced nothing. The collapse is now one explicit rule in `globals.css`.
4. **Reduced motion, above.**

The first scroll test was also wrong and worth recording: jumping straight to
the bottom of the page means elements scrolled *past* never intersect, so it
reported failures that were artifacts of the test. Re-run with gradual
scrolling, all reveals fire.

## Known gaps

- Model specifications are placeholders. See above.
- About copy is placeholder throughout.
- The FAQ contact answer needs Larry's real contact route.
- Builder and the footer's legal pages still 404; Stages 3 and 8.
- Typefaces remain the Stage 0 placeholders.

## Verification

- `npm run build` and `npm run lint` pass. Six static routes.
- 1440×900 and 390×844 on all three pages. No horizontal overflow.
- Reveals: 8 on Home, 6 on About, 5 on Models — all hidden at load, all
  revealed after a gradual scroll, no page errors.
- Reduced motion: zero invisible elements on all three pages.
- FAQ accordion opens on click and on Enter, indicator toggles.
- Impeccable mechanical detector returns no findings.
