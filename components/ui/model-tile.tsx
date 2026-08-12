import Image from "next/image";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/image-placeholder";
import { ModelBadge } from "@/components/ui/model-badge";
import { modelHref, type Model } from "@/data/models";
import type { PublicPhoto } from "@/lib/media";
import { formatFromPrice } from "@/lib/pricing";
import { frameRadius } from "@/lib/style";

/*
 * The catalogue tile — /models' card, one per shape.
 *
 * A photograph with a caption under it rather than a panel with type inside
 * it, which is what separates this from Home's square ModelCard. The two are
 * deliberately not the same component: Home's card is a tile in a marketing
 * grid, with the name and price set over the artwork and a watermark drawing
 * behind them; this is the catalogue itself, where the instrument gets the
 * whole frame and the words sit below it on the page ground, the way a
 * product listing reads. What they do share — the badge, the frame's corner,
 * the pool of light behind a near-black cut-out, the "from" figure's format —
 * is shared as code rather than as a matching pair of literals.
 *
 * The frame is the model gallery's frame: the lifted tone inside a hairline
 * at the tight product-photography corner, with [data-frame-glow] behind the
 * instrument. Without that pool of light a black guitar on a near-black card
 * loses its silhouette, which is the whole reason the treatment exists.
 */

/*
 * The two states, and they are a real difference rather than a shade.
 *
 * An orderable model is shown as photographed. One that is not is pulled back
 * to something the eye reads as "not yet" before it reaches the badge:
 * desaturated nearly to grey and dimmed, with the page ground laid partly
 * back over the top of it. Both together rather than either alone — grey on
 * its own still reads as a lit photograph, and dimming on its own reads as a
 * badly exposed one.
 *
 * The weight is carried by the desaturation rather than the dimming, and
 * that split is the whole tuning. This instrument is already near-black on a
 * near-black ground, so brightness is the expensive axis: the first pass ran
 * 0.62 under a 45% scrim and took the lower half of the body with it — the
 * card stopped saying "not yet" and started saying "no picture". Saturation
 * is nearly free by comparison, because the one warm thing in the frame is
 * the rosewood board, and greying it is instantly legible as a state without
 * costing a single edge of the silhouette.
 *
 * The deemphasis is on the picture only. The caption under it keeps full
 * contrast: the state is communicated by the frame and stated in words by
 * the badge, so there is nothing to gain from making the model's name and
 * price harder to read — that would only make the card worse for anyone
 * trying to find out what is coming.
 */
const comingSoonMedia = "grayscale-[0.95] brightness-[0.8]";

export function ModelTile({
  model,
  photo,
  photoAlt,
  headingLevel = 2,
}: {
  model: Model;
  /* Null while there is no photography — see lib/media.ts · modelCardPhoto. */
  photo: PublicPhoto | null;
  photoAlt: string;
  /*
   * Where this row sits in the page's outline, which is not the same question
   * on the two pages that draw it. On /models the grid follows the page's h1
   * with nothing between them, so the names are the second level. On Home it
   * sits under the section heading "Latest models", which makes them the
   * third. A card cannot know that about itself, and a page that guesses
   * leaves a hole in its own heading outline.
   */
  headingLevel?: 2 | 3;
}) {
  const href = modelHref(model);
  const available = model.status === "available";
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article className="group relative flex flex-col">
      <div
        data-frame-glow
        className={`relative aspect-[5/7] w-full overflow-hidden ${frameRadius} border border-line bg-canvas transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          href ? "group-hover:border-line-strong" : ""
        }`}
      >
        {photo ? (
          /*
            `contain` with padding rather than a crop. The frame's proportion
            is the grid's decision and the photograph's is the shoot's, and a
            cover crop on a full-length instrument takes the headstock or the
            strap button off whichever way it lands. Nothing here is worth
            cropping to fill a corner.
          */
          <Image
            src={photo.src}
            alt={photoAlt}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className={`object-contain p-6 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none md:p-8 ${
              available ? "" : comingSoonMedia
            } ${href ? "group-hover:scale-[1.03] motion-reduce:group-hover:scale-100" : ""}`}
          />
        ) : (
          <ImagePlaceholder
            className="absolute inset-0"
            label={`${model.name} photography to follow`}
          />
        )}

        {/*
          The ground laid partly back over the picture — the second half of
          the coming-soon treatment. A tone of the page rather than flat
          black, so the frame reads as receding into the page rather than as a
          photograph with a grey card on it.
        */}
        {!available && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-surface/25"
          />
        )}

        <div className="absolute right-5 top-5">
          <ModelBadge status={model.status} />
        </div>
      </div>

      {/*
        The caption. `items-end` sits the price and the chevron on the name's
        line rather than the eyebrow's, so the row reads left to right as one
        line however the name wraps.
      */}
      <div className="mt-5 flex items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-ink-muted">
            {model.category}
          </p>

          <Heading className="mt-2.5 font-display text-[1.5rem] font-medium leading-[1.2] tracking-[-0.015em]">
            {href ? (
              /*
                The stretched link, the pattern Home's card and Contact's
                method cards already use: the name is the anchor and its
                ::after covers the whole tile, so the photograph is the
                target while there is exactly one link in the tab order with
                one accessible name. Wrapping the tile in an anchor instead
                would read the badge, the category, the name and the price
                out as a single run-on link.
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
          </Heading>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <p
            className={`font-mono text-[0.9375rem] tabular-nums text-ink-muted transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              href ? "group-hover:text-ink" : ""
            }`}
          >
            From {formatFromPrice(model.fromPricePence)}
          </p>

          {/*
            The chevron. Decoration in both states rather than a control:
            where the tile is a link, the whole tile is already the link and
            a second focusable copy of it would put the same destination in
            the tab order twice; where it is not, there is nowhere for it to
            go. It is the affordance, not the mechanism — hence aria-hidden,
            and hence the muted ring on a model you cannot open yet, so it
            does not offer a way in that is not there.
          */}
          <span
            aria-hidden
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              href
                ? "border-line-strong text-ink group-hover:border-ink group-hover:bg-white/[0.06]"
                : "border-line text-ink-disabled"
            }`}
          >
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M6 3l5 5-5 5" strokeLinecap="square" />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
}
