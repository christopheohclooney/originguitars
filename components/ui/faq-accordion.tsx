"use client";

import { m, useReducedMotion } from "motion/react";
import { useId, useState } from "react";

/*
 * The FAQ disclosure list.
 *
 * This replaces a native <details>/<summary>, which could not be animated:
 * the element reveals its content in one frame, so there was nothing for a
 * transition to attach to. The trade is that the reveal now needs JavaScript.
 * The answers are still rendered into the HTML rather than mounted on open,
 * so they remain in the document for crawlers and for anyone reading with
 * JavaScript off — they are just clipped to zero height and marked `inert`,
 * which is what keeps them out of the tab order and the accessibility tree
 * while they are closed.
 *
 * `m.*` rather than `motion.*` throughout: MotionProvider runs LazyMotion in
 * strict mode, which throws on `motion.*` precisely so nothing can quietly
 * pull the full bundle back in.
 *
 * Height is the one layout property animated here. An accordion cannot avoid
 * it — revealing content in flow *is* a reflow, and the usual alternatives
 * (grid-template-rows, max-height) are layout properties too, just less
 * honest about it. Everything that carries the character of the movement —
 * the content's rise, the indicator's turn — is transform and opacity.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const INSTANT = { duration: 0 } as const;

export type FaqEntry = {
  q: string;
  a: string[];
};

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  return (
    <div>
      {items.map((item) => (
        <FaqRow key={item.q} item={item} />
      ))}
    </div>
  );
}

function FaqRow({ item }: { item: FaqEntry }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  const id = useId();
  const panelId = `${id}-panel`;
  const labelId = `${id}-label`;

  /*
   * The box opens slightly slower than the content settles, and the content
   * waits a beat on the way in. That ordering is the whole effect: the space
   * appears first and the answer arrives into it, rather than the text being
   * stretched open along with the box.
   */
  const boxTransition = reduced ? INSTANT : { duration: 0.45, ease: EASE };
  const contentTransition = reduced
    ? INSTANT
    : { duration: 0.4, ease: EASE, delay: open ? 0.08 : 0 };

  return (
    <div className="border-b border-line first:border-t">
      <h3>
        <button
          id={labelId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="group flex w-full cursor-pointer items-center justify-between gap-8 py-7 text-left text-[clamp(1.0625rem,1.7vw,1.6875rem)] font-medium leading-[1.3] tracking-[-0.015em] transition-colors md:py-12 lg:py-[4.6rem] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {item.q}
          <Indicator open={open} reduced={reduced} />
        </button>
      </h3>

      <m.div
        id={panelId}
        aria-labelledby={labelId}
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={boxTransition}
        style={{ overflow: "hidden" }}
      >
        <m.div
          initial={false}
          animate={{ opacity: open ? 1 : 0, y: open ? 0 : -10 }}
          transition={contentTransition}
          inert={!open}
          className="pb-9 md:pb-12"
        >
          {item.a.map((para, i) => (
            <p
              key={i}
              className={`max-w-[62ch] text-[1.0625rem] leading-[1.7] text-ink-muted ${
                i > 0 ? "mt-4" : ""
              }`}
            >
              {para}
            </p>
          ))}
        </m.div>
      </m.div>
    </div>
  );
}

/*
 * The plus turns a half-circle as its upright collapses, so it resolves into
 * the minus having travelled rather than by simply losing a stroke. A spring
 * rather than a tween — this one is answering a click, and springs are what
 * make a direct manipulation feel answered.
 */
function Indicator({ open, reduced }: { open: boolean; reduced: boolean | null }) {
  const transition = reduced
    ? INSTANT
    : { type: "spring" as const, stiffness: 340, damping: 26 };

  return (
    <m.span
      aria-hidden
      animate={{ rotate: open ? 180 : 0 }}
      transition={transition}
      className="relative h-5 w-5 shrink-0 opacity-70 transition-opacity group-hover:opacity-100 md:h-6 md:w-6"
    >
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-ink" />
      {/*
        Centred with a margin, not -translate-x-1/2: Motion writes scaleY into
        `transform`, which would overwrite a Tailwind translate on the same
        element. Same reason the hero rule keeps its skew on a wrapper.
      */}
      <m.span
        animate={{ scaleY: open ? 0 : 1 }}
        transition={transition}
        className="absolute left-1/2 top-0 -ml-px h-full w-px bg-ink"
      />
    </m.span>
  );
}
