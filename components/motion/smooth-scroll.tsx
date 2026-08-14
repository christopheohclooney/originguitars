"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/*
 * Lenis smooth scrolling, site-wide.
 *
 * Lenis rather than CSS scroll-behavior because the two do different jobs:
 * scroll-behavior smooths programmatic jumps only, while Lenis eases the
 * wheel itself — the page keeps a touch of momentum after the finger stops,
 * which is what makes the scroll reveals read as sections arriving rather
 * than sections popping in wherever the wheel happened to land.
 *
 * The tuning is deliberately restrained. lerp 0.12 settles in roughly a
 * third of a second — enough inertia to feel machined, not enough to feel
 * like the page is swimming after the wheel. Touch is left native: Lenis
 * only virtualizes wheel input by default, and a phone's own physics are
 * already the best version of this.
 *
 * Reduced motion gets no Lenis at all — not a gentler lerp, none. The
 * instance is never constructed, so scrolling is the browser's own, and the
 * media query is watched live so flipping the OS setting mid-session takes
 * effect without a reload.
 *
 * Two parts of the site lock scrolling by setting overflow:hidden on the
 * body — the mobile nav and the model lightbox. Lenis has to stop while
 * they hold the lock: it accumulates wheel input into a scroll target, and
 * a wheel turned over a locked page would bank distance that lurches the
 * page the moment the lock lifts. Watching the body's style attribute keeps
 * that decoupled — neither component knows Lenis exists, and any future
 * lock gets the same handling for free.
 */
export function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    let frame = 0;
    let lock: MutationObserver | null = null;
    let growth: ResizeObserver | null = null;

    const start = () => {
      if (lenis) return;

      /*
       * Anchors are left to the browser.
       *
       * Lenis can glide to them, and it was doing so, but it derives the
       * target from its own animated scroll position rather than the real
       * one — and those two separate whenever the page has been jumped or
       * over-scrolled, which is exactly the state you are in when you reach
       * a closing block and click "See the models". Measured on a phone:
       * the catalogue landed 545px past itself, from a target that was
       * wrong before the animation started, while the browser's own jump
       * put it correctly under the header.
       *
       * Native handling reads scroll-margin off the target, so the
       * catalogue's scroll-mt does the work from the one place it is
       * written, and it cannot drift. The jump is instant — which is what
       * this anchor did before any of this smoothing existed, so nothing
       * regresses; a wrong landing would have.
       */
      lenis = new Lenis({ lerp: 0.12 });

      const loop = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);

      /*
       * Re-measure whenever the page's own height changes.
       *
       * Lenis watches <html> for this, and <html> is now free to grow with
       * its content (see app/layout.tsx) — so this is a belt to that
       * braces rather than the fix. It is here because the failure mode is
       * bad out of proportion to the cost: a stale height does not degrade
       * the scroll, it puts a floor under it, and the bottom of the page
       * simply cannot be reached. One observer on the element whose box is
       * the content is worth that.
       *
       * body rather than <html>: it is min-h-screen and otherwise auto, so
       * its box height *is* the page height. resize() only reads layout, so
       * this cannot feed itself.
       */
      growth = new ResizeObserver(() => lenis?.resize());
      growth.observe(document.body);

      lock = new MutationObserver(() => {
        if (!lenis) return;
        if (document.body.style.overflow === "hidden") lenis.stop();
        else lenis.start();
      });
      lock.observe(document.body, {
        attributes: true,
        attributeFilter: ["style"],
      });
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      growth?.disconnect();
      growth = null;
      lock?.disconnect();
      lock = null;
      lenis?.destroy();
      lenis = null;
    };

    const update = () => (media.matches ? stop() : start());
    update();
    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
      stop();
    };
  }, []);

  return null;
}
