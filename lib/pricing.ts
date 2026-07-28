import { BASE_PRICE_PENCE, type BuilderStep } from "@/data/options";

/** A map of step id to the option id chosen for it. */
export type Selections = Record<string, string>;

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

/** Pence to a display string: 189900 → "£1,899.00". */
export function formatPrice(pence: number): string {
  return gbp.format(pence / 100);
}

/** A delta as it should read on an option: 0 → "Included", 12000 → "+£120.00". */
export function formatDelta(pence: number): string {
  if (pence === 0) return "Included";
  const sign = pence > 0 ? "+" : "−";
  return `${sign}${gbp.format(Math.abs(pence) / 100)}`;
}

/** The delta a single step contributes, given what is currently selected. */
export function stepDeltaPence(
  step: BuilderStep,
  selections: Selections,
): number {
  const chosen = step.options.find((o) => o.id === selections[step.id]);
  return chosen?.priceDeltaPence ?? 0;
}

/**
 * Base price plus every selected option's delta.
 *
 * Runs entirely client-side — the build spec is explicit that no backend call
 * happens until submission.
 */
export function calculateTotalPence(
  steps: BuilderStep[],
  selections: Selections,
): number {
  return steps.reduce(
    (total, step) => total + stepDeltaPence(step, selections),
    BASE_PRICE_PENCE,
  );
}

/** The option object currently chosen for a step, if any. */
export function selectedOption(step: BuilderStep, selections: Selections) {
  return step.options.find((o) => o.id === selections[step.id]);
}
