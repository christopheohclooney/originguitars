import type { Metadata } from "next";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/image-placeholder";
import { Reveal } from "@/components/motion/reveal";
import { buttonClasses } from "@/components/ui/button";
import { shell, slant } from "@/lib/style";

export const metadata: Metadata = {
  title: "About — Origin Guitars",
  description:
    "Why Origin exists, how the instruments are built, and who builds them.",
};

/*
 * Structure and rhythm only — every paragraph here is placeholder written to
 * realistic length so the measure and vertical spacing can be judged. Real
 * copy replaces it wholesale.
 *
 * Editorial rather than product: asymmetric two-column sections with the
 * heading held in the margin, a full-measure lede, a pull quote, and the
 * two-image grid the build spec flagged as worth exploring.
 */
export default function AboutPage() {
  return (
    <main>
      {/* Opening */}
      <section className={`${shell} pt-16 pb-16 md:pt-24 md:pb-20`}>
        <p className="font-mono text-[0.8125rem] text-ink-muted">About</p>
        <h1 className="mt-6 max-w-[18ch] text-[clamp(2.75rem,6vw,4rem)] font-bold leading-[1.02] tracking-[-0.03em]">
          A guitar should be worth the wait
        </h1>
        <p className="mt-8 max-w-[62ch] text-[1.25rem] leading-[1.5] text-ink-muted md:text-[1.5rem]">
          Origin builds made-to-order electric guitars in the United Kingdom.
          One bench, one instrument at a time, to whatever specification the
          player actually wants rather than whatever a distributor decided to
          stock.
        </p>
      </section>

      {/* Opening image, full measure */}
      <section className={`${shell} pb-20 md:pb-28`}>
        <Reveal>
          <ImagePlaceholder
            className="aspect-[16/10] w-full md:aspect-[16/7]"
            label="Workshop photography to follow"
          />
        </Reveal>
      </section>

      {/* Editorial section — heading in the margin */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <Reveal>
            <div className="grid gap-10 md:grid-cols-[16rem_1fr] md:gap-16">
              <div>
                <div
                  aria-hidden
                  className="mb-6 h-[5px] w-11 bg-black"
                  style={slant}
                />
                <h2 className="text-[1.375rem] font-semibold leading-[1.2] tracking-[-0.015em]">
                  Why we started
                </h2>
              </div>
              <div className="max-w-[64ch]">
                <p className="text-[1.0625rem] leading-[1.7]">
                  Placeholder. There is a gap between an off-the-shelf
                  instrument and a boutique commission, and almost nothing sits
                  in it. On one side, a shortlist of finishes somebody else
                  chose. On the other, a two-year waiting list and a price that
                  reflects the name rather than the work.
                </p>
                <p className="mt-6 text-[1.0625rem] leading-[1.7]">
                  Placeholder. Origin was set up to build in that gap — properly
                  specified instruments, made to order, at a price that reflects
                  the hours and the materials. Nothing about that requires a
                  waiting list measured in years.
                </p>
                <p className="mt-6 text-[1.0625rem] leading-[1.7]">
                  Placeholder. Copy for this section still to be written with
                  Larry. The paragraph lengths here are set to roughly what the
                  final text should run to, so the column and the rhythm can be
                  judged now.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Two-image grid */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <Reveal>
            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              <ImagePlaceholder
                className="aspect-[4/5] w-full"
                label="Detail shot"
              />
              <ImagePlaceholder
                className="aspect-[4/5] w-full"
                label="Detail shot"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pull quote */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <Reveal>
            {/*
              The measure lives on the <p>, not the <blockquote>: `ch` resolves
              against the element's own font-size, so on the wrapper it would
              be computed at 16px body text and collapse the quote to a sliver.
            */}
            <blockquote>
              <p className="max-w-[20ch] text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.12] tracking-[-0.025em]">
                &ldquo;Placeholder pull quote — the one line that should stop
                somebody scrolling.&rdquo;
              </p>
              <footer className="mt-8 flex items-center gap-4">
                <div
                  aria-hidden
                  className="h-[5px] w-11 bg-black"
                  style={slant}
                />
                <span className="text-[0.9375rem] text-ink-muted">
                  Attribution to follow
                </span>
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* Second editorial section */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <Reveal>
            <div className="grid gap-10 md:grid-cols-[16rem_1fr] md:gap-16">
              <div>
                <div
                  aria-hidden
                  className="mb-6 h-[5px] w-11 bg-black"
                  style={slant}
                />
                <h2 className="text-[1.375rem] font-semibold leading-[1.2] tracking-[-0.015em]">
                  How they are built
                </h2>
              </div>
              <div className="max-w-[64ch]">
                <p className="text-[1.0625rem] leading-[1.7]">
                  Placeholder. Every instrument is built to the specification
                  set in the builder, by hand, and inspected by the same team
                  before it is allowed to leave.
                </p>
                <p className="mt-6 text-[1.0625rem] leading-[1.7]">
                  Placeholder. This section should carry the detail that earns
                  trust — timbers, hardware, the parts of the process worth
                  being specific about. Length here is indicative.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-line py-20 md:py-28">
        <div className={shell}>
          <Reveal>
            <h2 className="max-w-[20ch] text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
              Start with the Element
            </h2>
            <p className="mt-4 max-w-[60ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
              One shape available today, two more in development. Work through
              the options and watch the price as you go — nothing is committed
              until you are ready.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/builder"
                className={`${buttonClasses({ size: "lg" })} w-full sm:w-auto`}
              >
                Build your own
              </Link>
              <Link
                href="/models"
                className={`${buttonClasses({ variant: "secondary", size: "lg" })} w-full sm:w-auto`}
              >
                See the models
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
