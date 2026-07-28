"use client";

import { useState } from "react";

import { ImagePlaceholder } from "@/components/image-placeholder";
import { PriceBar } from "@/components/ui/price-bar";
import { builderSteps, PLANNED_STEP_COUNT } from "@/data/options";
import {
  calculateTotalPence,
  formatDelta,
  formatPrice,
  selectedOption,
  type Selections,
} from "@/lib/pricing";
import { shell, slant } from "@/lib/style";

/*
 * Stage 3a — the builder shell.
 *
 * State lives entirely in React and the price is derived on every render, per
 * the build spec: the builder runs client-side with no backend call until
 * submission. Only the handedness step is defined; the layout below is built
 * to take the remaining ten without changing shape.
 */

function defaultSelections(): Selections {
  return Object.fromEntries(
    builderSteps.map((step) => [step.id, step.defaultOptionId]),
  );
}

function StepArrow({
  direction,
  onClick,
  disabled,
}: {
  direction: "prev" | "next";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Previous step" : "Next step"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-strong text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:border-line disabled:text-ink-disabled disabled:hover:border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          d={direction === "prev" ? "M10 3 5 8l5 5" : "M6 3l5 5-5 5"}
          strokeLinecap="square"
        />
      </svg>
    </button>
  );
}

export function BuilderShell({ imageSrc }: { imageSrc: string | null }) {
  const [selections, setSelections] = useState<Selections>(defaultSelections);
  const [stepIndex, setStepIndex] = useState(0);

  const step = builderSteps[stepIndex];
  const chosen = selectedOption(step, selections);
  const totalPence = calculateTotalPence(builderSteps, selections);

  return (
    <main className="flex min-h-[calc(100svh-72px)] flex-col">
      <div className="flex-1">
        <div className={`${shell} py-8 md:py-12`}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:gap-16">
            {/*
              The guitar stays in view across every step, per the Mod Shop
              benchmark. Sticky on large screens so it holds position as the
              option list grows in 3b.
            */}
            <div className="lg:sticky lg:top-[104px] lg:self-start">
              <div className="flex items-center justify-center bg-canvas p-6 md:p-10">
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageSrc}
                    alt="The Origin Element, right-handed, as currently specified"
                    className="max-h-[46vh] w-auto object-contain lg:max-h-[calc(100svh-280px)]"
                  />
                ) : (
                  <ImagePlaceholder
                    className="aspect-[3/4] w-full max-w-[22rem]"
                    label="Element photography to follow"
                  />
                )}
              </div>
            </div>

            {/* Step panel */}
            <div>
              <div className="flex items-center justify-between gap-6">
                <p className="font-mono text-[0.8125rem] text-ink-muted">
                  Step {String(stepIndex + 1).padStart(2, "0")}
                  <span
                    aria-hidden
                    className="mx-2.5 inline-block h-3 w-px translate-y-[1px] bg-line-strong"
                    style={slant}
                  />
                  {String(PLANNED_STEP_COUNT).padStart(2, "0")}
                </p>
                <div className="flex items-center gap-2">
                  <StepArrow
                    direction="prev"
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    disabled={stepIndex === 0}
                  />
                  <StepArrow
                    direction="next"
                    onClick={() =>
                      setStepIndex((i) =>
                        Math.min(builderSteps.length - 1, i + 1),
                      )
                    }
                    disabled={stepIndex >= builderSteps.length - 1}
                  />
                </div>
              </div>

              <div
                aria-hidden
                className="mt-8 h-[5px] w-11 bg-black"
                style={slant}
              />
              <h1 className="mt-6 text-[clamp(2rem,4.5vw,2.75rem)] font-bold leading-[1.06] tracking-[-0.025em]">
                {step.title}
              </h1>
              {step.intro && (
                <p className="mt-4 max-w-[52ch] text-[1.0625rem] leading-[1.6] text-ink-muted">
                  {step.intro}
                </p>
              )}

              <fieldset className="mt-10">
                <legend className="sr-only">{step.title}</legend>
                <div className="flex flex-col gap-3">
                  {step.options.map((option) => {
                    const isSelected = selections[step.id] === option.id;
                    return (
                      <label
                        key={option.id}
                        data-option-tile
                        className={`flex cursor-pointer items-start justify-between gap-6 border px-6 py-5 transition-colors ${
                          isSelected
                            ? "border-ink ring-1 ring-ink"
                            : "border-line-strong hover:border-ink"
                        }`}
                      >
                        <input
                          type="radio"
                          name={step.id}
                          value={option.id}
                          checked={isSelected}
                          onChange={() =>
                            setSelections((prev) => ({
                              ...prev,
                              [step.id]: option.id,
                            }))
                          }
                          className="sr-only"
                        />
                        <span className="min-w-0">
                          <span className="block text-[1.0625rem] font-medium">
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="mt-1 block text-[0.875rem] leading-[1.5] text-ink-muted">
                              {option.description}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 pt-0.5 font-mono text-[0.8125rem] text-ink-muted">
                          {formatDelta(option.priceDeltaPence)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </div>

      <PriceBar
        variant="sticky"
        stepLabel={step.shortLabel}
        selectionLabel={chosen?.label ?? "Not selected"}
        stepCurrent={stepIndex + 1}
        stepTotal={PLANNED_STEP_COUNT}
        priceLabel={formatPrice(totalPence)}
        // Review opens a modal in Stage 4 — nothing to wire it to yet.
      />
    </main>
  );
}
