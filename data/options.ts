/*
 * ⚠️  PLACEHOLDER PRICING — NOT CONFIRMED BY LARRY.
 *
 * Neither the build spec nor the user flow doc contains a base price or any
 * option deltas. The figures below are invented so the live price calculation
 * can be demonstrated and reviewed. Every one needs replacing before this goes
 * anywhere near Stripe.
 *
 * Money is stored in pence as integers, never pounds as floats. Stripe expects
 * the smallest currency unit, and integer arithmetic avoids the rounding drift
 * that bites price calculators built on floating point.
 */

export const BASE_PRICE_PENCE = 189_900; // £1,899.00 — PLACEHOLDER

/*
 * The full sequence from the user flow doc:
 *   handedness, construction, strings, colour, fretboard, inlay, binding,
 *   headstock, bridge, hardware
 *
 * That is ten option steps, not eleven. Eleven is used here because it was
 * specified for the step indicator — it presumably counts model selection as
 * step one. Worth confirming, since the number is visible to the customer on
 * every screen.
 *
 * Once every step is defined this should become `builderSteps.length`.
 */
export const PLANNED_STEP_COUNT = 11;

export type BuilderOption = {
  id: string;
  label: string;
  /** Shown under the label. Keep to one line. */
  description?: string;
  /** Difference from the base price, in pence. */
  priceDeltaPence: number;
  comingSoon?: boolean;
};

export type BuilderStep = {
  id: string;
  /** Shown in the step heading. */
  title: string;
  /** Shown in the sticky bar's uppercase label. */
  shortLabel: string;
  intro?: string;
  options: BuilderOption[];
  /** Pre-selected option id. */
  defaultOptionId: string;
};

export const handednessStep: BuilderStep = {
  id: "handedness",
  title: "Handedness",
  shortLabel: "Handedness",
  intro:
    "Which way round the instrument is built. This affects the body contours, the nut and the bridge, so it is settled first.",
  defaultOptionId: "right",
  options: [
    {
      id: "right",
      label: "Right-handed",
      description: "The standard build.",
      priceDeltaPence: 0,
    },
    {
      id: "left",
      label: "Left-handed",
      description: "Mirrored body, nut and bridge.",
      priceDeltaPence: 12_000, // £120.00 — PLACEHOLDER
    },
  ],
};

/* Stage 3a defines the first step only. The rest arrive in 3b. */
export const builderSteps: BuilderStep[] = [handednessStep];
