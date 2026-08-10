import type { ReactNode } from "react";

/*
 * The section overline — the Origin mark followed by a short mono label.
 *
 * Lifted out of About, which had it inline, now that Home's hero opens with
 * the same device. Two pages hand-rolling six utility classes each is how the
 * pair quietly drifts apart, which is exactly what this pass was for.
 */

/*
 * The four-point mark, in the lit-metal fill it ships with.
 *
 * Not a monochrome icon — the fill runs grey to white and back, the same
 * treatment the display headings carry — so it is never recoloured to
 * currentColor. That would flatten the thing worth having.
 *
 * Inlined rather than served from /public because at 16px a request costs
 * more than this markup, and an image element could not carry the gradient
 * without baking it into the file anyway.
 *
 * The gradient id is document-global. One instance per page today; a second
 * on the same page has to be given a distinct `gradientId`.
 *
 * Width is set explicitly because the artwork is 35x32, not square — a square
 * box squashes it by 9%.
 */
export function OriginMark({
  className = "h-4 w-[1.094rem]",
  gradientId = "origin-mark",
}: {
  className?: string;
  gradientId?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 35 32"
      className={`${className} shrink-0`}
      fill="none"
    >
      <path
        d="M34.4731 29.6146L21.3024 20.7601C20.6346 20.3114 20.0655 19.7485 19.61 19.1106L28.0358 13.4458L18.8945 17.8429C18.6133 17.1821 18.4357 16.474 18.3814 15.743L17.2367 0L16.092 15.743C16.0393 16.4756 15.86 17.1821 15.5788 17.8445L6.43758 13.4474L14.8634 19.1122C14.4062 19.7485 13.8387 20.3114 13.171 20.7601L0.000197299 29.6146L14.3157 22.7278C15.0163 22.3917 15.7597 22.1828 16.5163 22.1029L17.2367 32L17.9571 22.1029C18.712 22.1845 19.457 22.3917 20.1577 22.7278L34.4731 29.6146Z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="36.5875"
          y1="32"
          x2="-6.97281"
          y2="29.2378"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8F8F8F" />
          <stop offset="0.405" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#999999" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Mark plus label, on the mono face at the tracking the designs specify. */
export function Overline({
  children,
  className = "",
  gradientId,
}: {
  children: ReactNode;
  className?: string;
  gradientId?: string;
}) {
  return (
    <p
      className={`flex items-center gap-3 font-mono text-[0.8125rem] uppercase tracking-[0.14em] text-ink-muted ${className}`}
    >
      <OriginMark gradientId={gradientId} />
      {children}
    </p>
  );
}
