import type { Metadata } from "next";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/image-placeholder";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { buttonClasses } from "@/components/ui/button";
import { availableModels, comingSoonModels, modelHref } from "@/data/models";
import { shell, slant, unslant } from "@/lib/style";

export const metadata: Metadata = {
  title: "Models — Origin Guitars",
  description:
    "The Element, available to build now. Lance and Element Bass in development.",
};

function ComingSoonBadge() {
  return (
    <span className="inline-flex bg-canvas px-4 py-1.5" style={slant}>
      <span
        className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted"
        style={unslant}
      >
        Coming soon
      </span>
    </span>
  );
}

export default function ModelsPage() {
  return (
    <main>
      {/* Header */}
      <section className={`${shell} pt-16 pb-16 md:pt-24 md:pb-20`}>
        <p className="font-mono text-[0.8125rem] text-ink-muted">Models</p>
        <h1 className="mt-6 max-w-[18ch] text-[clamp(2.75rem,6vw,4rem)] font-bold leading-[1.02] tracking-[-0.03em]">
          One shape now, more on the bench
        </h1>
        <p className="mt-8 max-w-[62ch] text-[1.125rem] leading-[1.55] text-ink-muted">
          Every Origin starts from a base specification and goes wherever you
          take it. The Element is buildable today. Two more are in development,
          and they will appear here the moment they are ready to order.
        </p>
      </section>

      {/* Available models */}
      {availableModels.map((model) => (
        <section key={model.slug} className="border-t border-line py-16 md:py-24">
          <div className={shell}>
            <Reveal>
              {/*
                minmax(0,…) and items-center are both load-bearing. As a
                stretched grid item the image fills the row height, and
                aspect-ratio then derives its *width* from that height — which
                blew the column out to 947px and left the spec column at 178px.
              */}
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
                <ImagePlaceholder
                  className="aspect-[4/3] w-full"
                  label={`${model.name} photography to follow`}
                />

                <div className="flex flex-col justify-center">
                  <div
                    aria-hidden
                    className="h-[5px] w-11 bg-ink"
                    style={slant}
                  />
                  <h2 className="mt-6 text-[clamp(2rem,4.5vw,2.75rem)] font-bold leading-[1.06] tracking-[-0.025em]">
                    {model.name}
                  </h2>
                  <p className="mt-2 text-[1.0625rem] text-ink-muted">
                    {model.subtitle}
                  </p>

                  <p className="mt-7 max-w-[54ch] text-[1.0625rem] leading-[1.65]">
                    {model.description}
                  </p>

                  <dl className="mt-9 border-t border-line">
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

                  {/*
                    Primary into the builder, secondary through to the
                    model's own page — added when /models/[slug] landed, and
                    deliberately the only change here: this page's overhaul
                    is its own pass. The link comes from modelHref so this
                    section cannot point at a page that does not exist.
                  */}
                  <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:self-start">
                    <Link
                      href="/builder"
                      className={`${buttonClasses({ size: "lg" })} w-full sm:w-auto`}
                    >
                      Build your own
                    </Link>
                    {modelHref(model) && (
                      <Link
                        href={modelHref(model)!}
                        className={`${buttonClasses({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
                      >
                        View the {model.name}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ))}

      {/* Coming soon */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <Reveal>
            <div
              aria-hidden
              className="mb-6 h-[5px] w-11 bg-ink"
              style={slant}
            />
            <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
              In development
            </h2>
            <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
              Not orderable yet. No date to promise you — they go live here when
              they are genuinely ready, not before.
            </p>
          </Reveal>

          <Stagger className="mt-14 grid gap-12 md:grid-cols-2 md:gap-10">
            {comingSoonModels.map((model) => (
              <StaggerItem key={model.slug}>
                <ImagePlaceholder
                  className="aspect-[4/3] w-full"
                  label="In development"
                />
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <h3 className="text-[1.375rem] font-semibold leading-[1.2] tracking-[-0.015em]">
                    {model.name}
                  </h3>
                  <ComingSoonBadge />
                </div>
                <p className="mt-1.5 text-[0.9375rem] text-ink-muted">
                  {model.subtitle}
                </p>
                <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-[1.6] text-ink-muted">
                  {model.description}
                </p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <Reveal>
            <h2 className="max-w-[22ch] text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
              Not sure where to start?
            </h2>
            <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
              The builder explains each option as you go, and nothing is
              committed until you reach the review step.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/builder"
                className={`${buttonClasses({ size: "lg" })} w-full sm:w-auto`}
              >
                Start your build
              </Link>
              <Link
                href="/faq"
                className={`${buttonClasses({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
              >
                Read the FAQ
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
