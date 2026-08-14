"use client";

import Image from "next/image";
import { m, useInView, useScroll } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ImagePlaceholder } from "@/components/image-placeholder";
import { Reveal } from "@/components/motion/reveal";
import type { PublicPhoto } from "@/lib/media";

/*
 * The sticky-scroll process — the client half of Home's "How it works".
 *
 * Only the parts that need hooks live here: the progress rail, which is
 * driven by useScroll, and the step blocks, which report their own
 * visibility so the rail's dots and the step chrome can light as each one
 * crosses the middle of the viewport. The section's copy, CTAs and the
 * sticky left column stay in page.tsx like every other section's — the
 * same split HeroPhoto makes for the hero.
 *
 * Both exports are grid items, not a wrapped section: the rail and the
 * steps list are returned as siblings so page.tsx can place them into its
 * own three-track grid (copy · rail · steps). A wrapper div here would
 * take them out of the grid.
 */

export type ProcessStepData = {
  /** The pill's text — "Step 1". */
  label: string;
  title: string;
  body: string;
  photo: PublicPhoto | null;
  alt: string;
};

export function ProcessSteps({ steps }: { steps: ProcessStepData[] }) {
  const trackRef = useRef<HTMLOListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const handleActive = useCallback((i: number) => setActiveIndex(i), []);

  /*
   * Each dot sits level with its step's label, so the positions are read
   * off the list rather than assumed: evenly-divided percentages put the
   * last dot at the foot of the last photograph instead of beside its
   * heading, and the step heights stop being equal the moment real
   * photographs land at their own proportions. Measured against the list's
   * top, which is also the rail's top — both sit on the same grid row.
   * Null until mounted; the rail is decorative, so arriving a frame late
   * costs nothing.
   */
  const [dotTops, setDotTops] = useState<number[] | null>(null);
  useEffect(() => {
    const list = trackRef.current;
    if (!list) return;

    /*
     * offsetTop rather than getBoundingClientRect: the Reveal entrance
     * holds each step 24px low until it plays, and a rect measured then
     * bakes that offset into the dot. offsetTop is the layout position —
     * transforms never touch it. The list is `relative` so it is the
     * offsetParent these values are measured against.
     */
    const measure = () => {
      setDotTops(
        Array.from(list.children, (li) => {
          const label = li.querySelector<HTMLElement>("[data-step-label]");
          if (!label) return 0;
          /*
           * Accumulated up the offsetParent chain rather than read once:
           * a transformed element is an offsetParent, so while a step's
           * entrance transform is live its label measures against the li,
           * and after Motion clears it, against the list.
           */
          let top = label.offsetTop + label.offsetHeight / 2;
          let parent = label.offsetParent as HTMLElement | null;
          while (parent && parent !== list && list.contains(parent)) {
            top += parent.offsetTop;
            parent = parent.offsetParent as HTMLElement | null;
          }
          return top;
        }),
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  /*
   * Progress = 0 when the top of the steps stack crosses the middle of the
   * viewport, 1 when the bottom does — the same reference point the steps
   * use to decide which of them is active, so the fill and the dots always
   * agree about where the reader is.
   */
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start center", "end center"],
  });

  return (
    <>
      {/*
        The rail. Decorative in full — the list's own numbering and each
        step's visible label already say what the dots say, so none of it
        needs announcing twice.

        The fill is scaleY off a MotionValue rather than an animated
        height: height is a layout property and would re-layout the page
        every scroll frame, where a transform stays on the compositor. No
        reduced-motion gate on it either — it is a mechanical link to the
        scroll position, not an animation with easing to suppress. The dot
        colours are plain CSS transitions, so those take motion-reduce.
      */}
      {/*
        self-stretch matters: the parent grid is items-start, and this item's
        own content is all absolutely positioned — left to self-start it
        collapses to zero height and the rail vanishes. Stretched, it takes
        the row's height, which is the steps column's.
      */}
      <div aria-hidden className="relative hidden lg:block lg:self-stretch">
        {/*
          Everything hangs from the first dot rather than the row's top edge:
          started at zero the line showed a stub above the first marker, and
          the dot should be the first thing the rail presents. Rendered only
          once measured, so that stub never flashes before the offsets land.
        */}
        {dotTops && (
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ top: dotTops[0] }}
          >
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line" />
            <m.div
              className="absolute top-0 left-1/2 h-full w-px origin-top -translate-x-1/2 bg-ink"
              style={{ scaleY: scrollYProgress }}
            />
            {dotTops.map((top, i) => (
              <span
                key={i}
                className={`absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                  activeIndex >= i
                    ? "border-ink bg-ink"
                    : "border-line-strong bg-surface"
                }`}
                style={{ top: top - dotTops[0] }}
              />
            ))}
          </div>
        )}
      </div>

      <ol
        ref={trackRef}
        className="relative flex flex-col gap-20 lg:col-start-3 lg:gap-32"
      >
        {steps.map((step, i) => (
          <StepBlock
            key={step.title}
            step={step}
            index={i}
            active={activeIndex === i}
            onActive={handleActive}
          />
        ))}
      </ol>
    </>
  );
}

function StepBlock({
  step,
  index,
  active,
  onActive,
}: {
  step: ProcessStepData;
  index: number;
  active: boolean;
  onActive: (i: number) => void;
}) {
  /*
   * "Active" means this block sits across the middle of the viewport — the
   * negative margins shrink the observed band to the centre 10%. A hook
   * rather than whileInView because the answer drives another element (the
   * rail's dots), not this one.
   */
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <Reveal as="li">
      <div ref={ref}>
        {/* The catalogue badge's bordered idiom — see model-badge.tsx. */}
        <span
          data-step-label
          className={`inline-flex rounded-full border px-4 py-1.5 font-mono text-[0.75rem] uppercase tracking-[0.08em] backdrop-blur-sm transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
            active
              ? "border-ink-muted bg-surface/70 text-ink"
              : "border-line-strong bg-surface/70 text-ink-muted"
          }`}
        >
          {step.label}
        </span>
        <h3
          className={`mt-6 text-[1.375rem] font-medium leading-[1.2] tracking-[-0.015em] transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
            active ? "text-ink" : "text-ink-muted"
          }`}
        >
          {step.title}
        </h3>
        <p className="mt-3 max-w-[42ch] text-[0.9375rem] leading-[1.6] text-ink-muted">
          {step.body}
        </p>
        <div className="mt-8">
          {step.photo?.width && step.photo.height ? (
            <Image
              src={step.photo.src}
              width={step.photo.width}
              height={step.photo.height}
              alt={step.alt}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="h-auto w-full rounded-2xl"
            />
          ) : (
            <ImagePlaceholder className="aspect-square w-full rounded-2xl" />
          )}
        </div>
      </div>
    </Reveal>
  );
}
