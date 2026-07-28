import {
  BASE_PRICE_PENCE,
  builderSteps,
  type BuilderStep,
  type OptionGroup,
} from "@/data/options";

/** A map of option-group id to the option id chosen for it. */
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

/**
 * Groups that currently apply. A hidden group contributes nothing — an inlay
 * colour must not be charged for once the inlay itself is set to none.
 */
export function visibleGroups(
  step: BuilderStep,
  selections: Selections,
): OptionGroup[] {
  return step.groups.filter((g) => g.visibleWhen?.(selections) ?? true);
}

/** The option currently chosen in a group, if any. */
export function selectedOption(group: OptionGroup, selections: Selections) {
  return group.options.find((o) => o.id === selections[group.id]);
}

/**
 * Base price plus every selected option's delta, across every visible group.
 *
 * Derived on each call rather than held in state, so the displayed total can
 * never drift from the selections. Runs entirely client-side — the build spec
 * is explicit that no backend call happens until submission.
 */
export function calculateTotalPence(selections: Selections): number {
  return builderSteps.reduce((total, step) => {
    return (
      total +
      visibleGroups(step, selections).reduce((stepTotal, group) => {
        return stepTotal + (selectedOption(group, selections)?.priceDeltaPence ?? 0);
      }, 0)
    );
  }, BASE_PRICE_PENCE);
}

/** What the sticky bar shows for a step. */
export function summaryLabel(
  step: BuilderStep,
  selections: Selections,
): string {
  const groups = visibleGroups(step, selections);
  const target =
    groups.find((g) => g.id === step.summaryGroupId) ?? groups[0];
  return target ? (selectedOption(target, selections)?.label ?? "Not selected") : "—";
}
