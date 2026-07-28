# Typography — the finalised pairing

Date: 2026-07-28
Status: built, awaiting review
Scope: every page already built. Typography only — no colour, spacing or
component changes.

## The pairing

**Archivo Bold (700)** for display: headlines, page titles, section titles,
the running total in the sticky bar and the grand total in the review modal.
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

Only the 700 cut of Archivo is loaded, because 700 is the only weight of it
the site uses. It is declared at its real weight, so every display usage asks
for `font-bold` and gets the drawn bold rather than a synthesised one. Nothing
may ask it for anything heavier — there is no 800 or 900 file, and the browser
would have to fake it.

*(This started as Archivo Black, a separate single-weight family at 400. The
swap to Archivo 700 changed the face and the weight; the display sizes were
then taken back up in a second pass — see the scale below. Tracking, leading
and every role assignment are unchanged.)*

## Scale

| Role | Family | Size | Leading | Tracking | Weight |
|---|---|---|---|---|---|
| Display | Archivo Bold | 46–80px | 0.98 | -0.03em | 700 |
| H1 | Archivo Bold | 40–60px | 1.02 | -0.025em | 700 |
| H2 | Archivo Bold | 30–40px | 1.08 | -0.02em | 700 |
| H3 | Heros | 20px | 1.3 | -0.005em | 700 |
| Body large | Heros | 18px | 1.6 | — | 400 |
| Body | Heros | 16px | 1.65 | — | 400 |
| Small | Heros | 15px | 1.55 | — | 400 |
| Label | Heros | 12px | 1.4 | 0.1em | 700, uppercase |
| Figure | Heros | 14–15px | — | 0.01em | 400, tabular |
| Price | Archivo Bold | 17–22px | — | 0.005em | 700, tabular |

Display sizes went down and then most of the way back up. They were cut
against Archivo Black — hero 88px to 68px, H1 64px to 52px — because Black
carried far more mass at any given size than the face it replaced. Archivo
Bold is lighter, so the headroom came back and the sizes were restored to
just under the original scale: hero 80px, H1 60px, H2 40px.

They stop just short of where they were rather than landing exactly on it,
because Archivo Bold is still heavier than the Geist Bold those numbers were
drawn for. Everything below H2 is unchanged — the crossover to Heros at H3,
the body sizes, and the compact display type inside the builder and the review
modal, which is bounded by the sticky bar and the panel rather than by the
page.

H3 is the line where the pairing crosses over: section titles are display,
subheads are Heros Bold. That line was drawn for Archivo Black, whose counters
fill in below 20px; Archivo Bold holds up better at a small size, but the
crossover stays where it is — it is a role boundary, not a legibility one.

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

## Both faces are self-hosted

**Archivo** — SIL OFL, one 14KB woff2 in `app/fonts/`, loaded through
`next/font/local` with the licence beside it.

**TeX Gyre Heros** — GUST Font Licence, two woff2 cuts of ~34KB in
`public/fonts/tex-gyre-heros/`, subset from the CTAN OTFs, which are kept
alongside as the source of truth. Heros arrived late: it is not on npm or
Google Fonts, and CTAN was unreachable from the build environment, so the
files came from Larry directly as OTFs and were converted here.

The subset is the Google latin range plus **U+2192**. That range carries ↑ and
↓ but not →, which the style guide sets in the wordmark lean figure. Coverage
was checked against every character the site can render rather than assumed.

The stack still lists Helvetica-metric fallbacks behind Heros — Nimbus Sans,
Helvetica, Liberation Sans, Arial — so a failed font load costs letterforms
and not a single line break. That is also the hazard: a broken woff2 falls
back to something that looks very nearly right. `document.fonts` is the check,
and the README says so.

## Defect found in review

`font-display` compiled to nothing on the first pass. `next/font` sets the CSS
variable on `<html>`, but Tailwind only generates the utility from a
`--font-display` entry in `@theme` — without it the class did not exist, and
every display element silently fell back to body text. Caught by probing
`getComputedStyle` in the browser rather than by eye, since the fallback was
plausible-looking. The font variable is now named `--font-archivo` and
`@theme` maps `--font-display` onto it.

## Verification

- `npm run build` and `npm run lint` pass. `geist` removed from dependencies.
- Rendered families confirmed via `getComputedStyle` on every page: display
  elements resolve to the Archivo face at weight 700, body to the Heros stack.
- `document.fonts` reports three loaded faces on every page — `archivo 700`,
  `TeX Gyre Heros 400`, `TeX Gyre Heros 700` — so nothing is synthesised and
  nothing is falling back.
- Heros is genuinely rasterising rather than a metric twin standing in: the
  same 64px string measures 825.34px in Heros against 825.47px in Liberation
  Sans (near-identical, as metric twins should be) and 735.94px in serif as a
  control. Distinct values mean distinct rasterisation.
- Headline wrapping and overflow checked at 1440, 1024, 768 and 390 across
  Home, About, Models, FAQ and the style guide after the sizes went up: no
  horizontal overflow at any width, the hero holds two lines everywhere, and
  only the FAQ title takes a third line at 390. No page errors.
- Review modal spec rows measured at 15px label / 14px figure as specified.
