import { specSheetModels, type SpecSheetModel } from "@/data/models";
import {
  BASE_PRICE_PENCE,
  builderSteps,
  type BuilderStep,
  type OptionGroup,
} from "@/data/options";
import { applyRules, defaultSelections } from "@/lib/builder-rules";
import {
  calculateTotalPence,
  optionLabel,
  selectedOption,
  visibleGroups,
  type Selections,
} from "@/lib/pricing";

/*
 * A build as a list of lines: what the spec sheet's summary, its PDF and the
 * submission emails all print.
 *
 * Pure and shared on purpose. The browser uses it to draw the summary, and
 * the submit action runs the same code over the raw selections it receives,
 * so the price in the confirmation email is worked out on the server rather
 * than taken from whatever the page posted.
 */

export type SpecLine = {
  /** The group id, or "base" for the model's base price. */
  key: string;
  stepId: string;
  label: string;
  value: string;
  pence: number;
};

/* The model a sheet opens on: the first one that can be ordered. */
export const defaultSpecModel: SpecSheetModel =
  specSheetModels.find((m) => m.status === "available") ?? specSheetModels[0];

/** An orderable model by slug, or null — a coming-soon model cannot be built. */
export function orderableModel(slug: unknown): SpecSheetModel | null {
  const model = specSheetModels.find((m) => m.slug === slug);
  return model && model.status === "available" ? model : null;
}

export const modelBasePence = (model: SpecSheetModel) =>
  model.basePricePence ?? BASE_PRICE_PENCE;

/*
 * The summary's row name for a group. A step with one group is named by the
 * step; a second group is named by its own label, prefixed with the step's
 * title when the label alone would be ambiguous ("Finish" means two things).
 * The title is matched without a plural "s", so "Inlay colour" under
 * "Inlays" reads as itself rather than as "Inlays inlay colour".
 */
function rowLabel(step: BuilderStep, group: OptionGroup) {
  if (step.groups.length < 2 || !group.label) return step.title;
  const label = group.label.toLowerCase();
  const title = step.title.toLowerCase();
  if (label === title || label.includes(title.replace(/s$/, ""))) return group.label;
  return `${step.title} ${label}`;
}

const ALL_GROUPS = builderSteps.flatMap((step) => step.groups);

/*
 * Untrusted selections — a saved draft, or a submission — read back through
 * the same rules as a click, and only for ids the builder still has. A stale
 * draft or a hand-made POST cannot put an unknown or impossible choice on the
 * sheet; anything unrecognised falls back to its default.
 */
export function restoreSelections(
  saved: unknown,
  touched: ReadonlySet<string>,
): Selections {
  const next = defaultSelections();
  if (saved && typeof saved === "object") {
    for (const group of ALL_GROUPS) {
      const id = (saved as Record<string, unknown>)[group.id];
      if (typeof id === "string" && group.options.some((o) => o.id === id)) {
        next[group.id] = id;
      }
    }
  }
  return applyRules(next, touched);
}

/** The base line followed by every visible group's choice, in builder order. */
export function specLines(
  selections: Selections,
  model: SpecSheetModel,
): SpecLine[] {
  const lines: SpecLine[] = [
    {
      key: "base",
      stepId: "base",
      label: "Base",
      value: model.name,
      pence: modelBasePence(model),
    },
  ];
  for (const step of builderSteps) {
    for (const group of visibleGroups(step, selections)) {
      const option = selectedOption(group, selections);
      if (!option) continue;
      lines.push({
        key: group.id,
        stepId: step.id,
        label: rowLabel(step, group),
        value: optionLabel(option, selections),
        pence: option.priceDeltaPence,
      });
    }
  }
  return lines;
}

/*
 * The builder's total, rebased onto the chosen model. Only orderable models
 * can be picked, and today that is the Element, whose base is the builder's
 * base — so this is calculateTotalPence exactly. Written as a rebase so a
 * second orderable model is priced from its own base rather than silently
 * from the Element's.
 */
export function specTotalPence(selections: Selections, model: SpecSheetModel) {
  return calculateTotalPence(selections) - BASE_PRICE_PENCE + modelBasePence(model);
}
