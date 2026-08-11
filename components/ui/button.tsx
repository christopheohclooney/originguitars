import type { ReactNode } from "react";

/*
 * Button — locked to the style guide.
 *
 * Pills, following the Mod Shop benchmark. Primary is the only element in the
 * system allowed pure white, which is what makes an action read as the action
 * without needing a colour.
 *
 * Exported as classes as well as a component so `next/link` can wear the same
 * styling without a polymorphic wrapper.
 */

export const buttonBase =
  "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

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

/*
 * Primary is white on the dark ground. The `inverse` variant that existed
 * while the site was light is gone — it was primary-flipped-for-dark-chrome,
 * and now that the whole site is dark it and primary are the same button.
 */
export const buttonVariants = {
  primary: "bg-cta text-ink-inverse hover:bg-cta-hover active:bg-cta",
  secondary:
    "border border-line-strong bg-transparent text-ink hover:border-ink active:bg-surface",
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

/*
 * Exported alongside the classes for the same reason they are: a <button
 * type="submit"> cannot use the component below — it renders type="button" —
 * and the contact form's send button should not go dim in a way of its own.
 */
export const buttonDisabledClasses =
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
      className={`${buttonClasses({ variant, size })} ${buttonDisabledClasses} ${className}`}
    >
      {children}
    </button>
  );
}
