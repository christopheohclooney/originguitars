"use client";

import { domAnimation, LazyMotion } from "motion/react";
import type { ReactNode } from "react";

/*
 * Loads only the DOM animation feature set (~15kb) rather than the full motion
 * bundle, and `strict` makes `motion.*` throw so nothing can quietly pull the
 * heavy build back in — everything downstream must use `m.*`.
 *
 * Children stay server-rendered: this is a client component, but it only wraps
 * the tree, it does not own it.
 *
 * The noscript rule matters. Reveals render their hidden state server-side, so
 * with JavaScript off every below-fold section would stay invisible forever.
 * This forces them visible in that case, at zero runtime cost.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <noscript>
        <style
          dangerouslySetInnerHTML={{
            __html:
              "[data-reveal]{opacity:1!important;transform:none!important}",
          }}
        />
      </noscript>
      {children}
    </LazyMotion>
  );
}
