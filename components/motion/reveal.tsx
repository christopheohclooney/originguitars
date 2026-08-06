"use client";

import { m, useReducedMotion } from "motion/react";
import { Fragment, type ReactNode } from "react";
import type { Variants } from "motion/react";

/*
 * Scroll reveals for Home, About and Models.
 *
 * Deliberately narrow: opacity and y only, both GPU-composited, both cheap.
 * Tween rather than spring, per the rule that springs belong to interaction
 * and tweens to scroll entrances. `once: true` so nothing re-animates on the
 * way back up — this is a marketing page, not a toy.
 *
 * Nothing above the fold uses these. Heroes render at full opacity so the LCP
 * element never waits on hydration.
 *
 * `useReducedMotion` returns null on the server and a boolean after mount, so
 * it must never decide which elements exist — that renders different markup on
 * each side and throws a hydration mismatch (React #418). It only selects
 * transition values; the DOM is identical either way, and the
 * prefers-reduced-motion rule in globals.css is what actually guarantees the
 * content is visible.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 0.6;
const INSTANT = { duration: 0 } as const;

const MOTION_TAGS = {
  div: m.div,
  section: m.section,
  ol: m.ol,
  ul: m.ul,
  li: m.li,
} as const;

type MotionTag = keyof typeof MOTION_TAGS;

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION, ease: EASE },
  },
};

const itemVariantsReduced: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: INSTANT },
};

/** A single block that fades and rises once, when it first scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: MotionTag;
}) {
  const reduced = useReducedMotion();
  const Tag = MOTION_TAGS[as];

  return (
    <Tag
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={reduced ? INSTANT : { duration: DURATION, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/** Parent for a set of items that should arrive one after another. */
export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: MotionTag;
}) {
  const reduced = useReducedMotion();
  const Tag = MOTION_TAGS[as];

  return (
    <Tag
      className={className}
      variants={
        reduced
          ? { hidden: {}, show: { transition: { staggerChildren: 0 } } }
          : containerVariants
      }
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </Tag>
  );
}

/*
 * A heading that arrives a word at a time.
 *
 * Reserved for headings. Splitting a paragraph this way would put hundreds
 * of animated boxes on the page for an effect nobody can follow at that
 * length — prose gets `Stagger` at the paragraph level instead.
 *
 * The words are separated by real space text nodes rather than margins, so
 * the string a screen reader announces and the string you copy out are both
 * still the sentence. `inline-block` is what makes the transform apply at
 * all, and it lets the line wrap between words as normal.
 */
const wordContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

const wordVariants: Variants = {
  /* A share of the word's own line box, so the rise scales with the type. */
  hidden: { opacity: 0, y: "45%" },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

const wordVariantsReduced: Variants = {
  hidden: { opacity: 0, y: 0 },
  show: { opacity: 1, y: 0, transition: INSTANT },
};

export function WordReveal({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  return (
    <m.span
      className={className}
      variants={
        reduced
          ? { hidden: {}, show: { transition: { staggerChildren: 0 } } }
          : wordContainerVariants
      }
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <m.span
            data-reveal
            className="inline-block"
            variants={reduced ? wordVariantsReduced : wordVariants}
          >
            {word}
          </m.span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </m.span>
  );
}

/** A child of `Stagger`. Inherits its timing from the parent's variants. */
export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: MotionTag;
}) {
  const reduced = useReducedMotion();
  const Tag = MOTION_TAGS[as];

  return (
    <Tag
      data-reveal
      className={className}
      variants={reduced ? itemVariantsReduced : itemVariants}
    >
      {children}
    </Tag>
  );
}
