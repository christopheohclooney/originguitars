import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { buttonClasses } from "@/components/ui/button";
import { Disclosure, DisclosureItem } from "@/components/ui/disclosure";
import { ModelBadge } from "@/components/ui/model-badge";
import { ModelTile } from "@/components/ui/model-tile";
import {
  ModelDetailFrames,
  ModelGalleryProvider,
  ModelLeadFrame,
} from "@/components/ui/model-gallery";
import { Overline } from "@/components/ui/overline";
import { modelMedia } from "@/data/model-media";
import { availableModels, models } from "@/data/models";
import { formatFromPrice } from "@/lib/pricing";
import { modelCardPhoto } from "@/lib/media";
import { shell } from "@/lib/style";

/*
 * The model detail page — the step between the catalogue and the builder
 * that did not exist: what the instrument is, what it is made of, and what
 * it looks like up close, before anyone commits to thirteen builder steps.
 *
 * The layout is a product page's: the image column scrolls on the left while
 * a pinned panel on the right holds the name, the price and the way into the
 * builder; below both, the descriptive copy and a Specs/Features accordion.
 * The structure is borrowed — everything painted onto it is the site's own
 * system.
 *
 * Prerendered for available models only, and only those. A model earns a
 * detail page by being orderable, which is also what guarantees it has real
 * content — nothing is invented for Lance or the bass to fill a template
 * with. `dynamicParams = false` turns that rule into a 404 rather than a
 * page of gaps.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return availableModels.map((model) => ({ slug: model.slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = models.find((m) => m.slug === slug);
  if (!model) return {};

  return {
    title: `${model.name} — Origin Guitars`,
    description: `The ${model.name}, from ${formatFromPrice(model.fromPricePence)}. ${model.subtitle} — full specification, features, and the builder to make it yours.`,
  };
}

/*
 * The pinned panel's at-a-glance rows — the three specs somebody comparing
 * instruments checks first. Picked by label from the model's own list rather
 * than restated, so the summary can never disagree with the specification
 * it summarises.
 */
const SUMMARY_SPECS = ["Body", "Pickups", "Scale length"];

export default async function ModelPage({ params }: { params: Params }) {
  const { slug } = await params;
  const model = models.find((m) => m.slug === slug);

  /* Narrows Model | undefined — dynamicParams already 404s unknown slugs. */
  if (!model) notFound();

  const media = modelMedia(model.slug);
  const otherModels = models.filter((m) => m.slug !== model.slug);
  const summary = model.specs.filter((s) => SUMMARY_SPECS.includes(s.label));

  return (
    <main>
      <section className={`${shell} pt-8 pb-20 md:pt-12 md:pb-28`}>
        {/*
          Explicit grid placement rather than two column wrappers, so the
          markup order can serve the phone: lead image, then the panel with
          the price and the CTA, then the remaining frames. On desktop the
          same three items are placed as two columns, with the panel spanning
          both left-hand rows.

          The sticky panel depends on three things, each a way position:
          sticky silently fails: `self-start`, because a grid item stretched
          to its row's height has nothing to stick within; the row span,
          because sticky is constrained to the item's grid area and one row
          would release it at the foot of the lead frame; and no transform or
          overflow on any ancestor, which is why the panel and this grid
          carry no Reveal wrapper — above the fold, so the site's motion
          rules already wanted them still.

          minmax(0,…) on both tracks, per the lesson written into /models: a
          track's default minimum is its content, and a wide image will
          otherwise blow its column out.
        */}
        {/*
          The two gap axes are deliberately unalike from lg: the columns keep
          their 4rem of air between the photographs and the panel, but the
          rows tighten to the same 0.75rem the detail grid uses inside
          itself, so the five frames read as one run of photography rather
          than as separated sections. The base gap stays generous because on
          a phone the panel sits between the lead frame and the details —
          there it *is* a section break.
        */}
        {/*
          The provider is the frames' shared way into the full-screen viewer
          — clicking any of the five opens it at that slide. It wraps the
          grid rather than either frame component because the two sit in
          different cells with the panel between them, and one dialog has to
          serve both.
        */}
        <ModelGalleryProvider media={media} modelName={model.name}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-x-16 lg:gap-y-3">
          <div className="lg:col-start-1 lg:row-start-1">
            <ModelLeadFrame media={media} modelName={model.name} />
          </div>

          <aside className="lg:sticky lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:top-[calc(var(--header-h)+1rem)] lg:self-start">
            {/* The catalogue chip — see components/ui/model-badge.tsx. */}
            <ModelBadge status={model.status} />

            {/*
              The page's one metallic heading, and it is the h1 — the rule
              every page follows. Smaller than a hero's ramp: this line sits
              in a 24rem panel beside a photograph, not centred over a page.
            */}
            <h1
              data-metal
              className="mt-6 font-display text-[clamp(2.5rem,4.2vw,3.5rem)] font-normal leading-[1.04] tracking-[-0.02em]"
            >
              {model.name}
            </h1>

            <p className="mt-3 text-[1.0625rem] leading-[1.6] text-ink-muted">
              {model.tagline ?? model.subtitle}
            </p>

            <p className="mt-8 flex items-baseline gap-3">
              <span className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
                From
              </span>
              <span className="font-mono text-[1.5rem] tabular-nums">
                {formatFromPrice(model.fromPricePence)}
              </span>
            </p>

            {/* The at-a-glance rows, in the treatment /models draws specs in. */}
            {summary.length > 0 && (
              <dl className="mt-8 border-t border-line">
                {summary.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-baseline justify-between gap-6 border-b border-line py-3.5"
                  >
                    <dt className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
                      {spec.label}
                    </dt>
                    <dd className="text-right font-mono text-[0.875rem]">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {/*
              The way in — the panel's job, and the page's primary action.
              The builder opens pre-set to the Element, which is this model;
              when a second model becomes buildable the builder grows a way
              to choose, and this link learns to say which.
            */}
            <Link
              href="/builder"
              className={`${buttonClasses({ size: "lg" })} mt-9 w-full`}
            >
              Build your own
            </Link>

            <p className="mt-5 text-[0.875rem] leading-[1.5] text-ink-muted">
              Built to order in the UK. Up to six months depending on
              complexity — if yours runs longer, we tell you directly.
            </p>
          </aside>

          {/*
            The bottom padding is the pinned panel's overstay. Sticky releases
            when its grid area ends, and the area ends where this column does
            — so without the extra foot the panel starts scrolling away the
            moment the last photograph is reached, which read as the price
            and the CTA leaving early. Desktop only: on a phone nothing is
            pinned and the padding would just be a hole.
          */}
          <div className="lg:col-start-1 lg:row-start-2 lg:pb-64">
            <ModelDetailFrames media={media} />
          </div>
        </div>
        </ModelGalleryProvider>
      </section>

      {/*
        Details — the descriptive copy, then the specification.

        No rule above it, and none above the section below either. The
        hairline is the builder canvas's device for dividing its chrome from
        its stage; on a content page it interrupts the vertical run, which is
        the reasoning the FAQ already carries for not putting one under its
        hero. None of the rebuilt pages divide their sections with a rule —
        these two came in from the pre-redesign /models, and the section
        rhythm is what separates a section from the one above it.
      */}
      {(model.overview || model.specs.length > 0 || model.features) && (
        <section className="py-20 md:py-28">
          <div className={shell}>
            <Reveal>
              <Overline gradientId="model-details">Details</Overline>
              {/*
                A wider cap than the 16ch section headings elsewhere carry,
                for the reason PageHero's titleMeasure documents: 16ch is
                right for a heading that wants a break, and this one does
                not. "The Element, in detail" is 22 characters that read as
                one phrase, and splitting them made a single line look like
                two headings. The cap is kept rather than dropped so a longer
                model name still wraps somewhere sensible instead of running
                the width of the column.
              */}
              <h2 className="mt-7 max-w-[30ch] font-display text-[clamp(1.875rem,2.6vw,2.375rem)] font-medium leading-[1.15] tracking-[-0.02em]">
                The {model.name}, in detail
              </h2>
            </Reveal>

            {model.overview && (
              <Stagger className="mt-10 max-w-[62ch]">
                {model.overview.map((para, i) => (
                  <StaggerItem as="div" key={i}>
                    <p
                      className={`text-[1.0625rem] leading-[1.75] text-ink-muted md:text-[1.125rem] ${
                        i > 0 ? "mt-7" : ""
                      }`}
                    >
                      {para}
                    </p>
                  </StaggerItem>
                ))}
              </Stagger>
            )}

            {/*
              The accordion, at the compact scale — a row reading "Specs"
              does not want the FAQ's 4.6rem of air. Same shell, same motion,
              via the same component the FAQ renders through.
            */}
            <div className="mt-14 md:mt-16">
              {model.specs.length > 0 && (
                <Disclosure label="Specifications" size="compact">
                  {/*
                    One staged item rather than one per row: fourteen rows on
                    a 0.075s stagger is a second of waiting, and the
                    specification should arrive as a table, not a drum roll.
                  */}
                  <DisclosureItem>
                    <dl className="grid md:grid-cols-2 md:gap-x-12">
                      {model.specs.map((spec) => (
                        <div
                          key={spec.label}
                          className="flex items-baseline justify-between gap-6 border-b border-line py-3.5"
                        >
                          <dt className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
                            {spec.label}
                          </dt>
                          <dd className="text-right font-mono text-[0.875rem]">
                            {spec.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-6 max-w-[62ch] text-[0.875rem] leading-[1.5] text-ink-muted">
                      The standard specification — every line of it is a
                      choice the builder lets you take back.
                    </p>
                  </DisclosureItem>
                </Disclosure>
              )}

              {model.features && (
                <Disclosure label="Features" size="compact">
                  <ul className="max-w-[62ch]">
                    {model.features.map((feature, i) => (
                      <DisclosureItem
                        as="li"
                        key={feature}
                        className={`text-[1.0625rem] leading-[1.7] text-ink-muted ${
                          i > 0 ? "mt-3" : ""
                        }`}
                      >
                        {feature}
                      </DisclosureItem>
                    ))}
                  </ul>
                </Disclosure>
              )}
            </div>
          </div>
        </section>
      )}

      {/* The rest of the catalogue — Home's cards, minus the one you are on. */}
      {otherModels.length > 0 && (
        <section className="py-20 md:py-28">
          <div className={shell}>
            <Reveal>
              <Overline gradientId="model-others">More from Origin</Overline>
              <h2 className="mt-7 max-w-[16ch] font-display text-[clamp(1.875rem,2.6vw,2.375rem)] font-medium leading-[1.15] tracking-[-0.02em]">
                Other models
              </h2>
            </Reveal>

            {/*
              The catalogue's own tile, at the catalogue's own size. Three
              columns for two cards, rather than two columns that would blow
              each frame up to twice the size it is on /models and Home — the
              point of sharing the card is that a model looks the same
              wherever it is shown, and a card scaled to fill a wider column
              is not the same card. The unfilled third cell is the honest
              shape of a catalogue with three models in it, one of which is
              the page you are on; it fills itself as the range grows.
            */}
            <Stagger
              as="ul"
              className="mt-12 grid gap-12 md:mt-16 md:grid-cols-3 md:gap-5"
            >
              {otherModels.map((other) => (
                <StaggerItem as="li" key={other.slug}>
                  {/* h3 — these sit under this section's "Other models" h2. */}
                  <ModelTile
                    model={other}
                    headingLevel={3}
                    {...modelCardPhoto(other.slug, other.name)}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}
    </main>
  );
}
