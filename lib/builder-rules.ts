import { BLACK_HEADSTOCK_FAMILIES, builderSteps } from "@/data/options";
import type { Selections } from "@/lib/pricing";

/*
 * Conditional logic for the builder, kept out of the component so the rules
 * can be read in one place and reasoned about as a set.
 *
 * Every rule is applied by `applyRules`, which takes a candidate selection map
 * and returns a corrected one. Running it after every change means an
 * impossible combination can never be held in state, even briefly — rather
 * than each control policing itself and hoping the others agree.
 */

/** Every group's default, for first render and for reset. */
export function defaultSelections(): Selections {
  const out: Selections = {};
  for (const step of builderSteps) {
    for (const group of step.groups) {
      out[group.id] = group.defaultOptionId;
    }
  }
  return out;
}

/**
 * Corrects a candidate selection map.
 *
 * `touched` carries the group ids the person has set themselves. It exists for
 * the transparent-headstock rule: that one is a *default*, so it must not keep
 * overwriting a deliberate choice every time the body colour changes.
 */
export function applyRules(
  candidate: Selections,
  touched: ReadonlySet<string>,
): Selections {
  const next = { ...candidate };

  // 1. The chosen colour has to belong to the chosen family.
  const colourGroup = builderSteps
    .find((s) => s.id === "colour")
    ?.groups.find((g) => g.id === "colour");

  if (colourGroup) {
    const current = colourGroup.options.find((o) => o.id === next.colour);
    if (!current || current.family !== next.colourFamily) {
      const firstInFamily = colourGroup.options.find(
        (o) => o.family === next.colourFamily,
      );
      if (firstInFamily) next.colour = firstInFamily.id;
    }
  }

  // 2. A transparent or crackle finish defaults the headstock to black. Only
  //    until the person sets the headstock themselves — after that it is theirs.
  if (
    BLACK_HEADSTOCK_FAMILIES.includes(next.colourFamily) &&
    !touched.has("headstockFinish")
  ) {
    next.headstockFinish = "black";
  }

  // 3. A black logo is lost on a black headstock, and is not offered on
  //    transparent or crackle finishes. The option renders disabled (see the
  //    logo group in data/options.ts), and anyone already holding it is moved
  //    to white. Nothing moves them back: when it becomes available again it
  //    is simply selectable.
  if (
    next.logoColour === "black" &&
    (next.headstockFinish === "black" ||
      BLACK_HEADSTOCK_FAMILIES.includes(next.colourFamily))
  ) {
    next.logoColour = "white";
  }

  return next;
}
