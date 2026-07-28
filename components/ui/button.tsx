import type { ReactNode } from "react";

/*
 * Button — locked to the Stage 0 style guide.
 *
 * Pills, following the Mod Shop benchmark. Primary is the only element in the
 * system allowed pure black, which is what makes an action read as the action
 * without needing a colour.
 *
 * Exported as classes as well as a component so `next/link` can wear the same
 * styling without a polymorphic wrapper.
 */

/*
 * Bold, not medium. Heros ships 400 and 700 and nothing between, so a 500
 * request resolves down to regular — which left every button set in book
 * weight. Bold is the deliberate choice the two-weight family allows.
 */
export const buttonBase =
  "inline-flex items-center justify-center rounded-full font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export const buttonSizes = {
  lg: "h-14 px-9 text-[1.0625rem]",
  md: "h-12 px-7 text-[0.9375rem]",
  sm: "h-10 px-5 text-[0.875rem]",
} as const;

/*
 * Tertiary is a text link, so it carries no horizontal padding and must align
 * flush with the prose above it. This is a separate map rather than a `px-0`
 * override because Tailwind resolves conflicts by stylesheet order, not by the
 * order classes appear in the string — `px-0` after `px-7` does not win.
 */
const tertiarySizes = {
  lg: "h-14 text-[1.0625rem]",
  md: "h-12 text-[0.9375rem]",
  sm: "h-10 text-[0.875rem]",
} as const;

export const buttonVariants = {
  primary: "bg-black text-white hover:bg-cta-hover active:bg-black",
  secondary:
    "border border-line-strong bg-white text-ink hover:border-ink active:bg-surface",
  tertiary:
    "text-ink underline underline-offset-[6px] decoration-line-strong hover:decoration-ink",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  const sizes = variant === "tertiary" ? tertiarySizes : buttonSizes;
  return `${buttonBase} ${sizes[size]} ${buttonVariants[variant]} ${className}`;
}

const disabledClasses =
  "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-canvas disabled:text-ink-disabled disabled:no-underline disabled:hover:bg-canvas";

export function Button({
  variant = "primary",
  size = "md",
  disabled,
  className = "",
  children,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`${buttonClasses({ variant, size })} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}
