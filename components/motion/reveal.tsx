"use client";

import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
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
