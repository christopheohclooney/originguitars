"use client";

import { m, useReducedMotion } from "motion/react";

/*
 * The footer's oversized wordmark, easing up into place on scroll — the one
 * authored moment in the footer, same treatment as the Home hero in
 * hero-entrance.tsx. Only opacity and y move, both GPU-composited, both
 * cheap, and both already visible-by-default so nothing depends on
 * hydration finishing before the mark can be seen.
 *
 * `useReducedMotion` returns null on the server and a boolean after mount,
 * so it only ever selects the transition, never which elements exist — the
 * DOM is identical either way, and the prefers-reduced-motion rule in
 * globals.css is what actually guarantees the mark stays visible if this
 * hook is skipped entirely (JS disabled).
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const INSTANT = { duration: 0 } as const;

export function FooterWordmark({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <m.img
      data-reveal
      src="/origin-wordmark-footer.svg"
      alt=""
      aria-hidden
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={reduced ? INSTANT : { duration: 0.9, ease: EASE }}
    />
  );
}
