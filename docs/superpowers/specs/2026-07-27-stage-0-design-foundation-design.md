# Stage 0 — Design foundation

Date: 2026-07-27
Status: built, awaiting Larry's sign-off
Route: `/style-guide`

## Scope

One page. Colour, type scale, buttons, the sticky price bar pattern, and the
slant device. Nothing else in the build spec is in scope — no nav, no footer,
no home, no other routes. Stage 1 is gated on sign-off of this page.

## Decisions

### Two blacks

`--color-ink` `#141414` sets every heading, every line of body copy and the
wordmark. `--color-black` `#000000` is spent only on primary button fills.

The effect is a hierarchy that needs no colour: a primary action is always the
darkest element on screen, and it gets there without competing with a headline.
The gap is nearly imperceptible side by side, which is the point.

This inverts the first proposal (near-black UI, pure black logo). Larry's
direction — white theme, near-black logo and text, black buttons for contrast,
guitars doing the colour work — is what shipped. Checking it against the Mod
Shop reference confirmed the call: that sticky bar is white with a black pill,
not a black slab, so the original concern about large black fills did not
apply.

### Palette

| Token | Value | Use |
|---|---|---|
| `ink` | `#141414` | Headings, body copy, the wordmark |
| `ink-muted` | `#737373` | Secondary copy, spec labels, helper text |
| `ink-disabled` | `#A3A3A3` | Disabled control labels only |
| `black` | `#000000` | Primary CTA fills, never text |
| `white` | `#FFFFFF` | Page base |
| `surface` | `#FAFAFA` | Alternating section bands |
| `canvas` | `#F4F4F4` | Guitar image backdrop, swatch tiles |
| `line` | `#E8E8E8` | Hairlines, dividers, price bar top edge |
| `line-strong` | `#D4D4D4` | Input borders, unselected swatch rings |
| `danger` | `#B42318` | Validation only, never decorative |

Strictly monochrome plus one functional red. No brand accent colour: across
twelve builder steps an accent would compete with the guitar finishes, which
are the only colour the site needs.

`ink-muted` on white measures 4.74:1, clearing 4.5:1 for body text.
`danger` on white measures 6.57:1. `ink-disabled` sits at 2.52:1, which is
acceptable only because WCAG 1.4.3 exempts disabled controls — it is therefore
restricted to disabled labels, and the "coming soon" badge uses `ink-muted`
instead so it stays readable.

Light only. There is deliberately no dark theme.

### Typography

Geist and Geist Mono, as placeholders until Christy sources the real
typefaces. Both are Swiss-influenced grotesks, so the scale, weights and
tracking below survive the swap — only the family name changes. Geist also
ships with the Next.js scaffold, so there is nothing to self-host and nothing
to remove later.

| Step | Size | Line height | Tracking | Weight |
|---|---|---|---|---|
| Display | 44–64px | 1.02 | -0.03em | 700 |
| H1 | 32–44px | 1.06 | -0.025em | 700 |
| H2 | 32px | 1.1 | -0.02em | 700 |
| H3 | 22px | 1.2 | -0.015em | 600 |
| Body large | 18px | 1.55 | — | 400 |
| Body | 16px | 1.6 | — | 400 |
| Small | 14px | 1.5 | — | 400 |
| Label | 12px | 1.4 | 0.08em, uppercase | 500 |
| Mono | 16px | 1.4 | tabular | 500 |

Display and H1 use `clamp()` so they scale down on narrow viewports without a
breakpoint. Prose is capped at 68–72ch.

Mono is reserved for figures — prices, price deltas, spec values, step counts —
where digits need to align in a column. It is not used as decoration.

The logo pairs a heavy primary with a lighter secondary of the same family.
That relationship carries into the page as a 700 heading over a 400 supporting
line. The letterforms themselves stay an asset and never become live text.

### Buttons

Pills, following the Mod Shop benchmark. Three variants (primary, secondary,
tertiary) at three sizes (56 / 48 / 40px), with default, hover, active,
focus-visible and disabled documented.

Disabled carries more weight here than usual: the builder locks options that
are still coming soon, and those must read as unavailable rather than broken.
Disabled renders as `canvas` fill with `ink-disabled` text and no border.

Focus is a 2px `ink` outline at 2px offset, never removed.

### Slant device

The logo leans forward at approximately 12°, stored as `--slant`. Applied to
accent rules, badge cuts, the step-counter divider and the divider inside the
price pill. Badges skew the box and counter-skew the text so the type stays
upright.

It stops there. Buttons, cards, inputs and swatches stay square — twelve
consecutive builder steps of cut corners would be exhausting. The resulting
system is deliberate: soft geometry for controls, angular for brand marks.

### Sticky price bar

White with a hairline top edge, not a black slab. Left is orientation
(uppercase step label, selected value, truncating rather than wrapping).
Middle is progress (step count in mono, hidden below `sm` to protect the
pill). Right is the action — running total in tabular mono, slanted divider,
then Review — and it is the only black on the bar.

Below `sm` the pill drops from 56px to 48px and sheds horizontal padding, and
the step count is hidden. Without this the left block collapses to an unusable
truncation at 390px.

It is rendered live and fixed on the style guide, not as a flat specimen, so
the scroll behaviour can be felt. An inline copy above the anatomy notes lets
the parts be inspected without scrolling.

## Values taken from the logo file

`Origin - Standard (Black).svg` arrived mid-build, so both assumed values were
checked against the source rather than read off a rendering.

- **Fill:** every path is `fill="black"` — `#000000`. Confirmed. There is no
  rich black, spot colour or tint in the file.
- **Lean:** measured off the parallelogram `I` glyphs, whose left edges run
  `dx 18.884` over `dy 89.157`. That is **11.959°** from vertical, identical on
  both glyphs. Rounded to `12°` as `--slant`; the 0.04° difference is not
  perceivable and a round number is easier to reason about.

The asset is served from `public/origin-wordmark-black.svg` and displayed at
the top of the style guide, since it is what the rest of the system derives
from. The original upload remains at the repo root; Stage 1 should consolidate
the two.

## Known gaps

- Typefaces are placeholders pending Christy's sourcing.
- `app/page.tsx` is a Stage 0 stub linking to the style guide, so the root
  route is not create-next-app boilerplate. Stage 1 replaces it.
- Buttons and the price bar live inside the style guide page file. Lifting them
  into `/components` is the first move of Stage 1, once the builder exists to
  define a real API.

## Verification

- `npm run build` passes; all routes prerender static.
- Rendered at 1440×900 and 390×844. No horizontal overflow at either, no
  console errors, no failed requests.
- Impeccable mechanical detector returns no findings.
