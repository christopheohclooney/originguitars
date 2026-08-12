import type { ModelStatus } from "@/data/models";

/*
 * The catalogue badge — the chip that says whether a model can be ordered.
 *
 * Lifted out once the catalogue grew a second card that needed it. Home's
 * model card, the /models tiles and the detail page's pinned panel all show
 * this same chip, and three copies of it is how one of them quietly ends up
 * a different size the first time the padding moves.
 *
 * Badge treatment follows the system rather than colour. The palette reserves
 * colour for the instrument, so the two states are told apart by weight
 * instead: available is a solid light chip — the same relationship the
 * primary button has to the page — and still-to-come is a bordered dark one
 * that sits back into the card it is on. Mono uppercase at the same size and
 * tracking as every other label on the site.
 *
 * The word is derived from the status rather than passed in. What the chip
 * says about a model is a fact about the catalogue, decided in
 * data/models.ts, not something each caller should be able to answer
 * differently — the same rule `modelHref` already expresses for links.
 */
export function ModelBadge({ status }: { status: ModelStatus }) {
  const base =
    "inline-flex rounded-full px-4 py-1.5 font-mono text-[0.75rem] uppercase tracking-[0.08em]";

  if (status === "available") {
    return <span className={`${base} bg-ink text-ink-inverse`}>New</span>;
  }

  /*
   * Translucent over a blur rather than a solid tone: the chip sits on a
   * photograph, and a flat panel there reads as a sticker laid on top of the
   * picture instead of a label belonging to it.
   */
  return (
    <span
      className={`${base} border border-line-strong bg-surface/70 text-ink-muted backdrop-blur-sm`}
    >
      Coming soon
    </span>
  );
}
