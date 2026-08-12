import Link from "next/link";

import { formatPrice } from "@/lib/pricing";
import { cardSurface } from "@/lib/style";
import { modelHref, type Model } from "@/data/models";

/*
 * The model card — Home's catalogue tile, lifted out once the detail page
 * grew an "other models" strip that wanted the identical card. One component,
 * so the grid on Home and the strip on a model page cannot drift apart.
 *
 * The link comes from modelHref rather than a prop: which models are
 * reachable is a fact about the catalogue, decided once in data/models.ts,
 * not something each caller should be able to answer differently. A model
 * with no detail page renders as a plain card and lights up the day its
 * status flips — no caller changes.
 */
export function ModelCard({ model }: { model: Model }) {
  const href = modelHref(model);

  return (
    <article
      className={`${cardSurface} group relative flex aspect-square flex-col overflow-hidden`}
    >
      {/*
        The drawing is the Lance front elevation already in the project, the
        same file the About page closes on — one asset, referenced wherever a
        placeholder is needed, rather than copies of one.

        Rotated rather than re-exported. It is drawn lying down at 1133x396
        because that is how About uses it; a quarter turn stands it up without
        a second file to keep in sync. The rotation happens about the
        element's centre, so the width set here becomes the drawing's *height*
        on screen and its width is that times 396/1133.

        Held at low opacity and cropped by the card. It is standing in for
        photography that has not been shot, so it should read as a watermark
        behind the name rather than as the product.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/lance-skeleton-front.svg"
          alt=""
          width={1133}
          height={396}
          className="absolute left-1/2 top-[44%] w-[185%] max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-90 opacity-50 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-95 motion-reduce:transition-none"
        />
      </div>

      {/*
        The hover lift. White alpha rather than a second solid tone, so it
        raises whatever is underneath — card, drawing and all — instead of
        repainting a value that would have to be re-derived every time
        --color-canvas moves.

        Tailwind's hover variant is already wrapped in (hover: hover) in v4,
        so none of this fires on a touchscreen, where a hover state is either
        invisible or sticks after a tap.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-white/[0.035] opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 motion-reduce:transition-none"
      />

      {/* Lifts the head of the card, darkens under the type. */}
      <div
        aria-hidden
        data-model-scrim
        className="pointer-events-none absolute inset-0"
      />

      {/*
        Badge treatment follows the system rather than colour. The palette
        reserves colour for the instrument, so the two states are told apart
        by weight instead: available is a solid light chip, still to come is
        a bordered dark one. Mono uppercase at the same size and tracking as
        every other label on the site.
      */}
      <div className="relative flex justify-end p-5 md:p-6">
        {model.status === "available" ? (
          <span className="rounded-full bg-ink px-4 py-1.5 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-inverse">
            New
          </span>
        ) : (
          <span className="rounded-full border border-line-strong bg-surface/70 px-4 py-1.5 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-ink-muted backdrop-blur-sm">
            Coming soon
          </span>
        )}
      </div>

      {/*
        `mt-auto` sits the name and price on the card's floor, so the row
        keeps a common baseline however tall the drawing above it ends up.
      */}
      <div className="relative mt-auto p-5 md:p-6">
        <h3 className="text-[1.5rem] font-medium leading-[1.2] tracking-[-0.015em]">
          {href ? (
            /*
              The stretched link — Contact's method cards' pattern. The name
              is the anchor and its ::after covers the card, so the whole
              tile is the target while there is exactly one link in the tab
              order with one accessible name. Wrapping the card in an anchor
              instead would read the badge, name and price out as a single
              run-on link.
            */
            <Link
              href={href}
              className="rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              {model.name}
            </Link>
          ) : (
            model.name
          )}
        </h3>
        <p className="mt-2 font-mono text-[0.9375rem] tabular-nums text-ink-muted transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-ink">
          From {formatPrice(model.fromPricePence)}
        </p>
      </div>
    </article>
  );
}
