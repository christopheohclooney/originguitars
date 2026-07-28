import {
  buttonBase,
  buttonVariants,
} from "@/components/ui/button";
import { shell, slant } from "@/lib/style";

/*
 * The persistent builder bar: where you are, what it costs, and the way out to
 * Review. White with a hairline top edge rather than a black slab — the black
 * belongs to the pill.
 *
 * Shared between the builder and the style guide so the specimen and the real
 * thing cannot drift.
 */

export type PriceBarVariant =
  /** Pinned to the viewport bottom, releases at the end of its container. */
  | "sticky"
  /** Always over the viewport bottom. */
  | "fixed"
  /** In flow, for the style guide's anatomy specimen. */
  | "static";

const wrapperFor: Record<PriceBarVariant, string> = {
  sticky: "sticky bottom-0 z-40 border-t border-line bg-white",
  fixed: "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white",
  static: "border border-line bg-white",
};

export function PriceBar({
  stepLabel,
  selectionLabel,
  stepCurrent,
  stepTotal,
  priceLabel,
  onReview,
  reviewDisabled = false,
  variant = "sticky",
}: {
  stepLabel: string;
  selectionLabel: string;
  stepCurrent: number;
  stepTotal: number;
  priceLabel: string;
  onReview?: () => void;
  reviewDisabled?: boolean;
  variant?: PriceBarVariant;
}) {
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={wrapperFor[variant]}>
      <div
        className={`flex items-center justify-between gap-4 py-3 sm:gap-6 sm:py-4 ${
          variant === "static" ? "px-6" : shell
        }`}
      >
        <div className="min-w-0">
          <p className="whitespace-nowrap text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
            {stepLabel}
          </p>
          <p className="mt-1 truncate text-[0.875rem] font-medium sm:text-[0.9375rem]">
            {selectionLabel}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-5">
          <p className="hidden font-mono text-[0.8125rem] text-ink-muted sm:block">
            {pad(stepCurrent)} / {pad(stepTotal)}
          </p>
          <button
            type="button"
            onClick={onReview}
            disabled={reviewDisabled}
            className={`${buttonBase} ${buttonVariants.primary} h-12 gap-4 px-6 text-[0.9375rem] disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-disabled disabled:hover:bg-canvas sm:h-14 sm:gap-5 sm:px-9 sm:text-[1.0625rem]`}
          >
            <span className="font-mono tabular-nums">{priceLabel}</span>
            <span
              aria-hidden
              className="h-5 w-px bg-white/35"
              style={slant}
            />
            <span>Review</span>
          </button>
        </div>
      </div>
    </div>
  );
}
