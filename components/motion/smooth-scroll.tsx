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

    const start = () => {
      if (lenis) return;

      /*
       * anchors: true makes in-page anchors scroll instead of jump — the
       * catalogue's "See the models" is the one on the site today. No
       * offset is passed: Lenis reads scroll-margin off the target itself,
       * so the scroll-mt the catalogue already carries for native jumps is
       * honoured here too, from the one place it is written. (Verified
       * against dist — an offset here would be applied on top of it.)
       */
      lenis = new Lenis({ lerp: 0.12, anchors: true });

      const loop = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);

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
