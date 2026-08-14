"use client";

import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/*
 * Scroll-linked drift.
 *
 * The element travels slower than the page it sits on, so it appears to hang
 * back as you scroll past. Give two neighbours different distances and the
 * space between them opens and closes, which is what stops a pair of static
 * frames sitting there like a contact sheet.
 *
 * Driven by a MotionValue rather than state: `useTransform` writes straight
 * to the DOM, so this costs no React renders on any of the frames it moves.
 * That matters here more than usual — this runs on every scroll event, not
 * once on entry.
 *
 * `y` only. The entrance animation belongs to a separate element inside this
 * one; both write to `transform`, so putting them on the same node would
 * have them overwrite each other.
 */
export function Parallax({
  children,
  distance = 60,
  className,
}: {
  children: ReactNode;
  /* Pixels of lag at each end of the travel. Larger reads as slower. */
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  /*
   * Desktop only. The device was built for neighbours sitting side by side,
   * where unmatched distances open and close the gap *between* the columns.
   * Below md those neighbours stack into one column, and the same unmatched
   * distances close the vertical gap instead — About's photo pair (40 against
   * 90) drifts through its own 24px gap and the frames collide mid-scroll.
   *
   * False on the server and until the first effect runs, same shape as
   * useReducedMotion's null first pass: the travel starts at 0 everywhere and
   * widens to `distance` on desktop after mount, so the server and client
   * trees match and a phone never sees the drift at all.
   */
  const [wideEnough, setWideEnough] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setWideEnough(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /*
   * Measured across the element's whole pass through the viewport — 0 as it
   * enters from the bottom, 1 as it leaves the top — so the drift is spent
   * over the full time it is on screen rather than in a burst.
   */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  /*
   * Negative to positive: the offset grows as the page scrolls down, which
   * subtracts from how far the element rises. That is the lag.
   *
   * Reduced motion flattens the range rather than dropping the wrapper, so
   * the tree is identical either way — the same rule the rest of the motion
   * here follows, since `useReducedMotion` is null on the server and would
   * otherwise render different markup on each side.
   */
  const travel = reduced || !wideEnough ? 0 : distance;
  const y = useTransform(scrollYProgress, [0, 1], [-travel, travel]);

  return (
    <div ref={ref} className={className}>
      <m.div data-parallax style={{ y }}>
        {children}
      </m.div>
    </div>
  );
}
