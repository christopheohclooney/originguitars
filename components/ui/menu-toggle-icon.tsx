"use client";

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/*
 * Menu toggle — the hamburger that draws itself into a close mark.
 *
 * From 21st.dev (@sshahaider/menu-toggle-icon). Two paths, not three bars: the
 * lower one is a single continuous stroke that runs the top rule, curls
 * through the middle and ends on the bottom rule. Closed, `stroke-dasharray`
 * shows only the 12-unit head of it, so it reads as an ordinary top bar. Open,
 * the dash grows to 20 and the offset walks the visible window along the path
 * into the curl, and the whole svg rotates -45° — so the bar appears to travel
 * around the corner and land as the other half of an ✕ rather than snapping to
 * a new shape. The straight middle path never moves; the rotation alone turns
 * it into the first half.
 *
 * Local change from the published source: `motion-reduce:transition-none` on
 * both animated elements. Everything that moves on this site carries it, and
 * the dash morph is the part a reduced-motion visitor would most notice — the
 * icon still swaps between the two states, it just arrives there instantly.
 */

type MenuToggleProps = ComponentProps<"svg"> & {
  open: boolean;
  duration?: number;
};

export function MenuToggleIcon({
  open,
  className,
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 2.5,
  strokeLinecap = "round",
  strokeLinejoin = "round",
  duration = 500,
  ...props
}: MenuToggleProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      className={cn(
        "transition-transform ease-in-out motion-reduce:transition-none",
        open && "-rotate-45",
        className,
      )}
      style={{ transitionDuration: `${duration}ms` }}
      {...props}
    >
      <path
        className={cn(
          "transition-all ease-in-out motion-reduce:transition-none",
          open
            ? "[stroke-dasharray:20_300] [stroke-dashoffset:-32.42px]"
            : "[stroke-dasharray:12_63]",
        )}
        style={{ transitionDuration: `${duration}ms` }}
        d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
      />
      <path d="M7 16 27 16" />
    </svg>
  );
}
