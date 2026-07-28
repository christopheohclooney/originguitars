# Stage 4 — The Review modal

Date: 2026-07-28
Status: built, awaiting review
Route: `/builder` (no route of its own)

## Scope

Review as a modal over the builder: the guitar, a collapsible full spec list,
the price broken into base and upgrades, the spec-change and refund terms, a
confirmation checkbox gating the primary action, and an Edit link back to step
one. The cart and the Stripe handoff are Stage 5 and stay unwired.

## A modal, not a route

Following Mod Shop. The builder stays mounted behind the panel, which is what
makes Close a return rather than a navigation and Edit a step change rather
than a page load — no state to serialise into a URL, no configuration to
rebuild on the way back, and no chance of the review showing a spec the
builder no longer holds.

The panel is mounted only while open rather than rendered hidden. That is what
resets the policy checkbox: the confirmation belongs to the order on screen,
not to the person, so reopening after an edit has to ask again. Unmounting
gets that for free, where an effect watching an `open` prop would be a
setState inside an effect — which the project's lint config rejects, correctly.

## Order of the panel

What it looks like, what is in it, what it costs, what you are agreeing to,
then the action. Details is **closed** on open: the price and the terms are
what the decision turns on, and thirteen rows of spec between the photo and
the total would bury both.

The spec list is derived by `buildSpecSummary` in `lib/pricing.ts`, which
walks the same steps and the same `visibleGroups` the builder renders. A group
hidden by a conditional — inlay colour, once the inlay is None — is absent
from the list for exactly the reason it is absent from the price. Nothing
about the configuration is stored in the modal.

Groups gained an optional `reviewLabel`. Read out of the context of its step,
"Finish" is ambiguous — it belongs to both the body colour and the headstock —
so those two, plus Inlay and Body colour, name themselves for the flat list.

Deltas sit in a fixed-width mono column so they read as a column rather than
ragging off the value, and zero-delta rows say "Included" in `ink-muted`, not
`ink-disabled`: that grey does not carry AA on white at 13px, and "Included"
is information rather than a disabled control.

## The gate

The primary action is disabled until the checkbox is ticked, with the reason
stated beneath it and wired as `aria-describedby` so it is not
colour-and-position-only. Ticking it removes the hint and the button goes
black — the state change is the affordance.

`Add to cart` is deliberately inert. It exists at this stage to be gated.

## Policy copy

`data/policy.ts`, carrying the same terms as the /faq answers: changes or a
full refund at any point before the order is submitted to the build queue,
nothing after it, and a refund capped at 50% from that point on. **Placeholder
wording** — it is not legal copy and needs checking before anything is sold
against it.

## Accessibility

`role="dialog"`, `aria-modal`, labelled by the heading. Focus moves to the
panel on open and returns to the Review button on close. Escape closes, the
scrim closes, the body does not scroll behind it, and Tab cycles inside the
panel — a hand-written trap rather than a dependency, for one panel with a
predictable set of controls.

The scrim is a div, not a button: the keyboard route out is Escape, and a
focusable element marked `aria-hidden` is a real fault rather than a lint
quibble.

Details is a native `<details>`, as on the FAQ, reusing the same plus/minus
indicator and the collapse rule already in `globals.css`.

## Motion

One CSS keyframe: 180ms scrim fade, 220ms panel fade and 12px rise on the same
easing as the scroll reveals. CSS rather than Motion because the panel mounts
and unmounts on a state flag with no exit animation to coordinate. Both are
disabled under `prefers-reduced-motion`.

## Known gaps

- **The photo is still the manufacturer's reference instrument**, unchanged by
  the specification, exactly as on the builder canvas. It needs the real
  per-configuration photography.
- Policy wording, option names and prices all remain placeholders.
- No cart. `Add to cart` does nothing — Stage 5.

## Verification

- `npm run build` and `npm run lint` pass.
- Driven in Chromium at 1440×900 and 390×844: modal opens from the sticky bar,
  Details expands to all thirteen rows, base + upgrades sum to the total shown
  on the bar (£1,899.00 + £670.00 = £2,569.00 on the tested spec).
- CTA disabled before the checkbox, enabled after, at both widths.
- Edit closes the panel and returns the builder to step one (Handedness).
- Escape closes and focus lands back on the Review button; `body.overflow` is
  restored, not left locked.
- No horizontal overflow at either width. No page errors.
