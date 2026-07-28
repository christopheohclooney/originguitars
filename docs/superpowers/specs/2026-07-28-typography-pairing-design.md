# Typography — the finalised pairing

Date: 2026-07-28
Status: built, awaiting review
Scope: every page already built. Typography only — no colour, spacing or
component changes.

## The pairing

**Archivo Black** for display: headlines, page titles, section titles, the
running total in the sticky bar and the grand total in the review modal.
**TeX Gyre Heros** for everything else: body copy, UI text, labels, figures,
and anything load-bearing at a small size.

Geist and Geist Mono are gone, and so is the mono role. There is no third
family: Heros carries the figures, whose digits are uniform width in the
Helvetica model, so prices and step counters still set as a column under
`tabular-nums`.

## Two weights, no medium

Heros ships 400 and 700 and nothing between. A 500 or 600 request does not
round up — CSS resolves it *down* to 400 — so every `font-medium` and
`font-semibold` in the codebase would have quietly become book weight. This
was the single largest change: everywhere emphasis is load-bearing is now 700
(buttons, option labels, selected values, uppercase labels, H3s), and
everywhere it was decorative is 400.

Archivo Black is one weight, 400, and is already black. Nothing wearing it may
also ask for `font-bold` — the browser would synthesise a second layer of
weight on top and close the counters. Every display usage sets `font-normal`
explicitly rather than relying on an inherited value.

## Scale

| Role | Family | Size | Leading | Tracking | Weight |
|---|---|---|---|---|---|
| Display | Archivo Black | 40–68px | 0.98 | -0.03em | 400 |
| H1 | Archivo Black | 36–52px | 1.02 | -0.025em | 400 |
| H2 | Archivo Black | 28–36px | 1.08 | -0.02em | 400 |
| H3 | Heros | 20px | 1.3 | -0.005em | 700 |
| Body large | Heros | 18px | 1.6 | — | 400 |
| Body | Heros | 16px | 1.65 | — | 400 |
| Small | Heros | 15px | 1.55 | — | 400 |
| Label | Heros | 12px | 1.4 | 0.1em | 700, uppercase |
| Figure | Heros | 14–15px | — | 0.01em | 400, tabular |
| Price | Archivo Black | 17–22px | — | 0.005em | 400, tabular |

Display sizes came *down* from the previous scale — the hero from 88px to
68px, H1 from 64px to 52px. Archivo Black at the old sizes carried far more
mass than the face it replaced and swamped everything under it.

H3 is the line where the pairing crosses over: section titles are display,
subheads are Heros Bold. Below 20px, Archivo Black's counters start to fill
in, which is exactly the "load-bearing at smaller sizes" case the brief
assigns to Heros.

## Small sizes and dense areas

Heros carries a smaller x-height than Geist, so anything that was 13px in a
dense area is now 14px: the builder's price deltas, the step counter, the
tooltips, the review modal's spec list. 15px is the floor for prose, which
lifted the review modal's policy paragraphs and checkbox label from 14px.
Uppercase labels went from 0.08em to 0.1em of tracking — Helvetica capitals
need the air, and they are the smallest type that ships.

## Contrast

Measured, not assumed. The palette did not move.

| Pair | Ratio | |
|---|---|---|
| ink / white | 18.42:1 | AA |
| ink / canvas | 16.75:1 | AA |
| ink-muted / white | 4.74:1 | AA |
| ink-muted / surface | 4.54:1 | AA |
| ink-muted / canvas | **4.31:1** | fails AA at small sizes |
| white / black (CTA) | 21.00:1 | AA |

Two fixes came out of that last row: the coming-soon badge and the photography
placeholders sit on canvas and now set their labels in `ink` rather than
`ink-muted`. One deliberate non-fix: `ink-disabled` on white is 2.52:1, which
is below AA and stays — it is only ever used on disabled controls, which WCAG
exempts, and the review modal's "Included" rows were moved off it during
Stage 4 for exactly this reason.

## The Heros files are not in the repository

TeX Gyre Heros is published by GUST on CTAN. It is not on npm, not on Google
Fonts, and CTAN was unreachable from the build environment (the network policy
refused the connection). Rather than ship a different typeface under the Heros
name, the family is declared first in the token stack with Helvetica-metric
fallbacks behind it — Nimbus Sans, Helvetica, Liberation Sans, Arial.

Heros is itself a Helvetica clone, so every fallback sets to the same widths:
no line break moves, and anyone who already has Heros installed sees the real
thing today. `public/fonts/tex-gyre-heros/README.md` has the two filenames to
add and the conversion command; adding them and uncommenting the two
`@font-face` blocks in `globals.css` is the entire switch-over.

**The screenshots therefore show the metric stand-in, not Heros itself.**

Archivo Black is real and self-hosted — SIL OFL, one 18KB woff2 in
`app/fonts/`, loaded through `next/font/local` with the licence kept beside it.

## Defect found in review

`font-display` compiled to nothing on the first pass. `next/font` sets the CSS
variable on `<html>`, but Tailwind only generates the utility from a
`--font-display` entry in `@theme` — without it the class did not exist, and
every display element silently fell back to body text. Caught by probing
`getComputedStyle` in the browser rather than by eye, since the fallback was
plausible-looking. The font variable is now named `--font-archivo-black` and
`@theme` maps `--font-display` onto it.

## Verification

- `npm run build` and `npm run lint` pass. `geist` removed from dependencies.
- Rendered families confirmed via `getComputedStyle` on every page: display
  elements resolve to the Archivo Black face at weight 400, body to the Heros
  stack.
- No horizontal overflow at 1440 on Home, Models, FAQ, Builder or the style
  guide. No page errors.
- Review modal spec rows measured at 15px label / 14px figure as specified.
