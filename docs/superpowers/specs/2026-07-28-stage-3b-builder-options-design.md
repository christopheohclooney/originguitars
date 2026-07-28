# Stage 3b — The full option sequence

Date: 2026-07-28
Status: built, awaiting review
Route: `/builder`

## Scope

The nine remaining option steps, inline tooltips, and the two conditional
rules. Review is Stage 4 and remains unwired.

## The step count is now ten, not eleven

`TOTAL_STEPS` is derived from `builderSteps.length` rather than hardcoded. With
handedness plus the nine specified here, there are exactly ten. Eleven was
carried through Stage 3a on the assumption that model selection counted as step
one — but the builder opens pre-set to the Element and never asks, so a counter
reading `01 / 11` would never have reached eleven.

## Data model

A step now owns one or more **option groups**, because several steps carry
sub-options: colour has family and colour, headstock has finish and logo
colour, inlay has style and inlay colour. Selections are keyed by group id.

Groups support three predicates, which is what the conditional logic is built
from:

| Predicate | Effect |
|---|---|
| `visibleWhen` | Hides the whole group. Inlay colour disappears when inlay is None. |
| `optionVisible` | Hides individual options. Filters colours to the chosen family. |
| `optionAvailable` | Renders an option disabled rather than hiding it. |

A hidden group contributes no price. Verified: setting inlay to None removes
the inlay-colour delta from the total rather than charging for something that
is no longer on screen.

## Conditional logic

Both rules live in `lib/builder-rules.ts`, applied by `applyRules` after every
change. Running one corrective pass over the whole selection map means an
impossible combination can never be held in state even briefly — rather than
each control policing itself and hoping the others agree.

1. **A transparent body finish defaults the headstock to black.** This is a
   *default*, so it is suppressed once the person sets the headstock
   themselves. A `touched` set tracks which groups have been deliberately
   chosen. Without it, the rule would keep overwriting a considered decision
   every time the body colour changed.
2. **A black logo is unavailable on a black or transparent headstock.** The
   option renders disabled with the reason stated beneath, and anyone already
   holding it is moved to silver.

Selections and `touched` are held in a single state object. They must update
together, and nesting one `setState` inside another updater is unsafe — React
is free to run updaters twice.

## Tooltips

Six, on the terms the user flow doc expects to trip people up: the three
construction types, the three fretboard timbers, and the double-locking
tremolo. Deliberately not on every option.

Click to toggle rather than hover to reveal, because hover does not exist on a
phone and that is exactly where a self-taught player is most likely to be
reading. Escape and an outside click both dismiss. The trigger calls
`stopPropagation` — it sits inside a `<label>`, so without that, opening a
tooltip would also select the option it explains.

## Defects found in review

1. **The colour family filter did not filter.** All twenty swatches rendered
   regardless of family. The rule keeping the *selection* inside the family was
   written, but nothing filtered what was *displayed*. Fixed with
   `optionVisible`. Verified: 6 / 5 / 5 / 4 swatches per family.
2. **The builder opened at £1,959, not the £1,899 base**, because the default
   headstock finish carried a £60 delta. Any default with a price makes the
   advertised "from" figure a number the builder never actually opens at. The
   default is now Black at £0, and the untouched configuration sums exactly to
   the base price.

## Known gaps

- **Every option name and price is invented.** The docs specify the step order
  and nothing else. `data/options.ts` carries the warning.
- **The canvas image does not respond to selections.** It is the manufacturer's
  reference instrument, unchanged across all ten steps. Per-configuration
  imagery needs the real photography.
- On mobile the colour step needs one scroll to reach the swatches — it has the
  most content of any step. Nothing is trapped: the bar releases at the end of
  the tray, verified zero covered tiles once scrolled.

## Verification

- `npm run build` and `npm run lint` pass.
- Opening total is exactly £1,899.00; all ten steps walk forwards and back.
- Rule 1: transparent → headstock black. Override to Natural persists through
  a later transparent re-selection.
- Rule 2: black logo disabled and selection moved to silver; re-enabled when
  the finish changes.
- Tooltip opens, does not select the option it sits in, closes on Escape.
- No horizontal overflow at 1440 or 390. No page errors.
- Impeccable mechanical detector returns no findings.
