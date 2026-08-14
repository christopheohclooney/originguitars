"use client";

import { m, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import type { ReactNode } from "react";
import type { Variants } from "motion/react";

/*
 * The disclosure row — the FAQ accordion's shell and motion recipe, lifted
 * out once the model detail page needed the same movement for its Specs and
 * Features rows. One component, so a second accordion cannot drift from the
 * first in feel; the FAQ keeps its exact rendering by being a thin map onto
 * this at `size="faq"`.
 *
 * Everything below the exports is the FAQ accordion's original reasoning,
 * unchanged, because the extraction changed where the code lives and not
 * what it does.
 *
 * This replaces a native <details>/<summary>, which could not be animated:
 * the element reveals its content in one frame, so there was nothing for a
 * transition to attach to. The trade is that the reveal now needs JavaScript.
 * The panel content is still rendered into the HTML rather than mounted on
 * open, so it remains in the document for crawlers and for anyone reading
 * with JavaScript off — it is just clipped to zero height and marked
 * `inert`, which is what keeps it out of the tab order and the accessibility
 * tree while it is closed.
 *
 * `m.*` rather than `motion.*` throughout: MotionProvider runs LazyMotion in
 * strict mode, which throws on `motion.*` precisely so nothing can quietly
 * pull the full bundle back in.
 *
 * Height is the one layout property animated here. An accordion cannot avoid
 * it — revealing content in flow *is* a reflow, and the usual alternatives
 * (grid-template-rows, max-height) are layout properties too, just less
 * honest about it. Everything that carries the character of the movement —
 * the items' rise, the indicator's turn — is transform and opacity.
 */

/*
 * Two curves, because the row does two different jobs.
 *
 * SWIFT has real travel through its middle: it leaves quickly, keeps moving,
 * and settles. It is what the box opens on.
 *
 * EASE is easeOutExpo, which is 75% finished in the first eighth of its
 * duration. Excellent for something arriving from off-screen, wrong for a box
 * opening under your cursor — the panel was at full height before the eye
 * registered it moving, then spent 300ms creeping the last few pixels, which
 * reads as a snap followed by nothing. It stays for the small stuff, where
 * that front-loading is the point.
 */
const SWIFT = [0.32, 0.72, 0, 1] as const;
const EASE = [0.16, 1, 0.3, 1] as const;
const INSTANT = { duration: 0 } as const;

/*
 * Two scales of the same row.
 *
 * "faq" is the original: question-length labels with the generous rhythm the
 * FAQ list was designed at. "compact" is for a row whose label is one word —
 * Specs, Features — where 4.6rem of vertical air around the word "Specs"
 * would read as a mistake rather than as calm.
 */
const sizes = {
  faq: {
    button:
      "py-7 text-[clamp(1.0625rem,1.7vw,1.6875rem)] md:py-12 lg:py-[4.6rem]",
    indicator: "h-5 w-5 md:h-6 md:w-6",
    panel: "pb-9 md:pb-12",
  },
  compact: {
    button: "py-6 text-[1.0625rem] md:py-7 md:text-[1.1875rem]",
    indicator: "h-5 w-5",
    panel: "pb-8 md:pb-10",
  },
} as const;

export type DisclosureSize = keyof typeof sizes;

/*
 * The panel's items arrive one after another rather than as a block.
 *
 * This is the difference between a panel that changes size and a panel that
 * opens: the box makes the room, then the content drops into it in the order
 * you would read it. Orchestration only on the container — it carries no
 * visual properties of its own, so the fade is not applied twice.
 *
 * Closing runs the stagger backwards and faster. An exit that takes as long
 * as its entrance feels like the interface is reluctant, and the last item
 * leaving first is the same order in reverse rather than a new movement.
 */
const contentVariants: Variants = {
  hidden: { transition: { staggerChildren: 0.035, staggerDirection: -1 } },
  show: { transition: { delayChildren: 0.09, staggerChildren: 0.075 } },
};

const itemVariants: Variants = {
  /*
   * Negative y, so the item comes down out from behind the row's label
   * rather than up off the row below it — it is being revealed by the box
   * above it, and that is the direction that reads as revealed.
   */
  hidden: { opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE } },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: SWIFT } },
};

const staticVariants: Variants = {
  hidden: { opacity: 0, y: 0, transition: INSTANT },
  show: { opacity: 1, y: 0, transition: INSTANT },
};

const MOTION_TAGS = {
  p: m.p,
  div: m.div,
  li: m.li,
} as const;

/*
 * A staged child of the panel. Anything wrapped in one inherits the stagger
 * from the panel's orchestration — a paragraph on the FAQ, a run of spec
 * rows on a model page — without carrying any timing of its own.
 */
export function DisclosureItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: keyof typeof MOTION_TAGS;
}) {
  const reduced = useReducedMotion();
  const Tag = MOTION_TAGS[as];

  return (
    <Tag variants={reduced ? staticVariants : itemVariants} className={className}>
      {children}
    </Tag>
  );
}

export function Disclosure({
  label,
  size = "faq",
  children,
}: {
  label: string;
  size?: DisclosureSize;
  /** The panel's content — stagger anything that should stage via DisclosureItem. */
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const s = sizes[size];

  const id = useId();
  const panelId = `${id}-panel`;
  const labelId = `${id}-label`;

  /*
   * The box opens a little slower than it closes, and the items wait a beat
   * on the way in. That ordering is the whole effect: the space appears
   * first and the content arrives into it, rather than the text being
   * stretched open along with the box.
   */
  const boxTransition = reduced
    ? INSTANT
    : { duration: open ? 0.5 : 0.38, ease: SWIFT };

  return (
    <div className="border-b border-line first:border-t">
      <h3>
        <button
          id={labelId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className={`group flex w-full cursor-pointer items-center justify-between gap-8 text-left font-medium leading-[1.3] tracking-[-0.015em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${s.button}`}
        >
          {/*
            The label leans toward the cursor on hover, and the indicator
            grows to meet it — the row answering before it is clicked, which
            is the interaction the hairline rows otherwise do not have.

            CSS rather than Motion for both. A hover is the one piece of
            motion on this row that should not wait for hydration — it is the
            first thing anybody does to it — and `group-hover` costs nothing
            after first paint where a gesture prop costs a subscription per
            row.

            Measured rather than assumed, since the neighbouring note warns
            about Motion overwriting Tailwind transforms: under Tailwind v4
            these compile to the `translate` and `scale` properties, not to
            `transform`, so they compose with whatever Motion writes instead
            of fighting it. Both are on elements Motion does not touch anyway.
          */}
          <span className="transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-[3px] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
            {label}
          </span>

          <span className="shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            <Indicator open={open} reduced={reduced} className={s.indicator} />
          </span>
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
          variants={reduced ? undefined : contentVariants}
          animate={open ? "show" : "hidden"}
          inert={!open}
          className={s.panel}
        >
          {children}
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
function Indicator({
  open,
  reduced,
  className,
}: {
  open: boolean;
  reduced: boolean | null;
  className: string;
}) {
  const transition = reduced
    ? INSTANT
    : { type: "spring" as const, stiffness: 340, damping: 26 };

  return (
    <m.span
      aria-hidden
      animate={{ rotate: open ? 180 : 0 }}
      transition={transition}
      className={`relative block opacity-70 transition-opacity group-hover:opacity-100 ${className}`}
    >
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-ink" />
      {/*
        Centred with a margin rather than -translate-x-1/2. Not because the two
        would collide — under Tailwind v4 they do not, as the note above on the
        hover nudge records and as the header's travelling glow relies on: the
        translate compiles to the standalone `translate` property and composes
        with whatever Motion writes into `transform`. A half-pixel margin on a
        1px rule is simply the plainer way to centre a hairline, and it stays.
      */}
      <m.span
        animate={{ scaleY: open ? 0 : 1 }}
        transition={transition}
        className="absolute left-1/2 top-0 -ml-px h-full w-px bg-ink"
      />
    </m.span>
  );
}
