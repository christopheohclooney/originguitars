"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { buttonBase, buttonVariants } from "@/components/ui/button";
import {
  ORDER_POLICY_HEADING,
  orderPolicy,
  POLICY_CONFIRMATION,
} from "@/data/policy";
import {
  buildSpecSummary,
  formatDelta,
  formatPrice,
  type Selections,
} from "@/lib/pricing";

/*
 * Stage 4 — Review.
 *
 * A modal over the builder rather than a separate route, following the Mod
 * Shop pattern: the specification stays live behind it, so closing is a return
 * and not a navigation. Nothing about the configuration is held here — the
 * whole panel is derived from `selections` on every open, so it cannot show a
 * spec the builder no longer holds.
 *
 * The order of the panel is the order of the decision: what it looks like,
 * what is in it, what it costs, what you are agreeing to, then the action.
 */

function CloseIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="m3 3 10 10M13 3 3 13" strokeLinecap="square" />
    </svg>
  );
}

/** Everything focusable inside the panel, in DOM order. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/*
 * Mounted only while open, by the builder. That is what resets the policy
 * checkbox: the confirmation belongs to the order on screen, not to the person
 * — reopening after an edit has to ask again, and unmounting gets that for
 * free rather than by an effect that fights its own state.
 */
export function ReviewModal({
  onClose,
  onEdit,
  image,
  selections,
}: {
  onClose: () => void;
  /** Closes the modal and returns the builder to its first step. */
  onEdit: () => void;
  image: StaticImageData;
  selections: Selections;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [accepted, setAccepted] = useState(false);
  const titleId = useId();
  const checkboxId = useId();
  const ctaHintId = useId();

  /*
   * Escape closes, Tab cycles inside the panel, and the page behind does not
   * scroll. The trap is written by hand rather than pulled in as a dependency
   * — one panel, one predictable set of controls.
   */
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const items = panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!items?.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const { lines, basePence, upgradesPence, totalPence } =
    buildSpecSummary(selections);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      {/*
        Scrim. Clicking it is the same as Close — a div rather than a button
        because the keyboard route out is Escape, and a focusable element
        marked aria-hidden is a genuine a11y fault rather than a lint quibble.
      */}
      <div
        aria-hidden
        onClick={onClose}
        data-review-scrim
        className="absolute inset-0 bg-ink/45"
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-review-panel
        className="relative flex max-h-[92svh] w-full max-w-[640px] flex-col border border-line bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] focus:outline-none"
      >
        {/* Head */}
        <div className="flex items-start justify-between gap-6 border-b border-line px-6 py-5 md:px-8">
          <div>
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
              Review
            </p>
            <h2
              id={titleId}
              className="mt-1.5 font-display text-[1.375rem] font-bold leading-[1.2] tracking-[-0.01em]"
            >
              Your Element
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <span className="sr-only">Close review</span>
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/*
            Same reference photograph as the builder canvas — it shows the
            manufacturer's instrument, not this specification. Per-option
            imagery arrives with the real photography.
          */}
          <div className="flex items-center justify-center bg-canvas px-6 py-6 md:px-8">
            <Image
              src={image}
              alt="The Origin Element"
              placeholder="blur"
              sizes="(min-width: 640px) 620px, 100vw"
              /*
               * Capped rather than run to the panel's full width: the photo
               * is here to confirm what is being bought, and every pixel it
               * takes is a line of the policy pushed under the fold.
               */
              className="h-auto max-h-[190px] w-full object-contain mix-blend-multiply"
            />
          </div>

          {/*
            Details is closed on open: the price and the terms are what the
            decision turns on, and thirteen rows of spec between the photo and
            the total would bury both. Native <details> for the same reason as
            the FAQ — it opens with no JavaScript and is keyboard accessible
            without any of it being reimplemented.
          */}
          <details className="group border-b border-line px-6 md:px-8">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">
              <span className="text-[1.0625rem] font-bold">Details</span>
              <span className="flex items-center gap-4">
                <span className="text-[0.875rem] tabular-nums text-ink-muted">
                  {lines.length} options
                </span>
                <span aria-hidden className="relative h-3 w-3 shrink-0">
                  <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-ink" />
                  {/* Collapse rule lives in globals.css — see note there. */}
                  <span
                    data-accordion-bar
                    className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-ink"
                  />
                </span>
              </span>
            </summary>

            <dl className="pb-6">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-baseline justify-between gap-6 border-t border-line py-3"
                >
                  <dt className="text-[0.9375rem] text-ink-muted">
                    {line.label}
                  </dt>
                  <dd className="flex items-baseline gap-4 text-right">
                    <span className="text-[0.9375rem] font-bold">
                      {line.value}
                    </span>
                    {/*
                      Fixed-width mono column so the deltas line up as a
                      column rather than ragging off the value. Muted, not
                      disabled-grey — "Included" is information, and
                      ink-disabled does not carry AA on white at this size.
                    */}
                    <span className="w-[5.75rem] shrink-0 text-[0.875rem] tabular-nums tracking-[0.01em] text-ink-muted">
                      {formatDelta(line.deltaPence)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </details>

          {/* Price breakdown */}
          <div className="border-b border-line px-6 py-6 md:px-8">
            <div className="flex items-baseline justify-between gap-6">
              <p className="text-[0.9375rem] text-ink-muted">Base price</p>
              <p className="text-[0.9375rem] tabular-nums tracking-[0.01em]">
                {formatPrice(basePence)}
              </p>
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-6">
              <p className="text-[0.9375rem] text-ink-muted">Upgrades</p>
              <p className="text-[0.9375rem] tabular-nums tracking-[0.01em]">
                {upgradesPence === 0 ? "—" : formatDelta(upgradesPence)}
              </p>
            </div>
            <div className="mt-5 flex items-baseline justify-between gap-6 border-t border-line pt-5">
              <p className="text-[1.0625rem] font-bold">Total</p>
              <p className="font-display text-[1.375rem] font-bold tabular-nums tracking-[0.005em]">
                {formatPrice(totalPence)}
              </p>
            </div>
          </div>

          {/* Policy */}
          <div className="px-6 py-6 md:px-8">
            <h3 className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
              {ORDER_POLICY_HEADING}
            </h3>
            {orderPolicy.map((para, i) => (
              <p
                key={i}
                className="mt-3 max-w-[66ch] text-[0.9375rem] leading-[1.65] text-ink-muted"
              >
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* Foot — the gate and the action */}
        <div className="border-t border-line bg-white px-6 py-5 md:px-8">
          <label
            htmlFor={checkboxId}
            className="flex cursor-pointer items-start gap-3"
          >
            <input
              id={checkboxId}
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 accent-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
            <span className="text-[0.9375rem] leading-[1.5]">
              {POLICY_CONFIRMATION}
            </span>
          </label>

          <div className="mt-5 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onEdit}
              className={`${buttonBase} ${buttonVariants.tertiary} h-12 text-[0.9375rem]`}
            >
              Edit specification
            </button>

            <button
              type="button"
              disabled={!accepted}
              aria-describedby={accepted ? undefined : ctaHintId}
              /*
               * Inert until Stage 5. The cart and the Stripe handoff are the
               * next stage; this button exists here to be gated, not to do
               * anything yet.
               */
              className={`${buttonBase} ${buttonVariants.primary} h-14 gap-4 px-9 text-[1.0625rem] disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-disabled disabled:hover:bg-canvas`}
            >
              <span>Add to cart</span>
              <span className="tabular-nums tracking-[0.01em]">
                {formatPrice(totalPence)}
              </span>
            </button>
          </div>

          {!accepted && (
            <p
              id={ctaHintId}
              className="mt-3 text-[0.875rem] leading-[1.5] text-ink-muted sm:text-right"
            >
              Confirm you have read the policy to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
