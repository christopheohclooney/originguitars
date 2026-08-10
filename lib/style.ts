import type { CSSProperties } from "react";

/*
 * The page gutter. Every section measures from this, so it stays in one place.
 * The width itself is --shell in globals.css, where the header pill and the
 * full-bleed frames can read the same number.
 */
export const shell = "mx-auto w-full max-w-[var(--shell)] px-6 md:px-10";

/*
 * The logo's 12° lean, for brand devices only — accent rules, badge cuts,
 * dividers. Never applied to type. `unslant` counter-rotates content inside a
 * slanted box so the text itself stays upright.
 */
export const slant: CSSProperties = {
  transform: "skewX(calc(-1 * var(--slant)))",
};

export const unslant: CSSProperties = { transform: "skewX(var(--slant))" };
