"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";

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
 * Stage 3a — the builder shell, following the Mod Shop layout.
 *
 * Full-bleed canvas with the instrument shown large and horizontal, option
 * controls in a tray underneath, price bar pinned below that. The guitar is
 * the subject of the screen; the controls sit under it rather than competing
 * for width beside it.
 *
 * State lives entirely in React and the price is derived on every render, per
 * the build spec: the builder runs client-side with no backend call until
 * submission. Only the handedness step is defined; the tray is built to take
 * the remaining ten without changing shape.
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
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas disabled:cursor-not-allowed disabled:text-ink-disabled disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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

export function BuilderShell({ image }: { image: StaticImageData }) {
  const [selections, setSelections] = useState<Selections>(defaultSelections);
  const [stepIndex, setStepIndex] = useState(0);

  const step = builderSteps[stepIndex];
  const chosen = selectedOption(step, selections);
  const totalPence = calculateTotalPence(builderSteps, selections);

  /*
   * Fixed height from the lg breakpoint up, so canvas + tray + bar resolve to
   * a single screen the way Mod Shop's configurator does. `min-h` alone let
   * main grow past the viewport, which pushed the option pills behind the
   * price bar. Below lg the page flows and scrolls normally.
   */
  return (
    <main className="flex min-h-[calc(100svh-72px)] flex-col lg:h-[calc(100svh-72px)] lg:min-h-0">
      {/*
        Full bleed, edge to edge. Deliberately outside the page gutter — the
        instrument is the screen, not a picture sitting in a box on it.
      */}
      <div className="flex min-h-0 flex-1 items-center justify-center bg-canvas px-4 py-6 md:px-10 md:py-8">
        {/*
          The supplied photo is a portrait shot on a white ground, rotated and
          trimmed to a wide band at build time. Multiply drops the remaining
          white out against the near-white canvas. Replace with a real cut-out
          when one exists — that would also allow a cast shadow.
        */}
        <Image
          src={image}
          alt="The Origin Element, shown as currently specified"
          priority
          placeholder="blur"
          sizes="100vw"
          className="max-h-full w-auto max-w-[1500px] object-contain mix-blend-multiply"
        />
      </div>

      {/* Option tray */}
      <div className="border-t border-line bg-white">
        <div className={`${shell} py-8 md:py-10`}>
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <StepArrow
              direction="prev"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
            />
            <h1 className="flex min-w-0 items-baseline gap-3 text-center">
              <span className="truncate text-[1.375rem] font-semibold tracking-[-0.015em]">
                {step.title}
              </span>
              <span className="shrink-0 font-mono text-[0.8125rem] text-ink-muted">
                {String(stepIndex + 1).padStart(2, "0")}
                <span
                  aria-hidden
                  className="mx-2 inline-block h-3 w-px translate-y-[1px] bg-line-strong"
                  style={slant}
                />
                {String(PLANNED_STEP_COUNT).padStart(2, "0")}
              </span>
            </h1>
            <StepArrow
              direction="next"
              onClick={() =>
                setStepIndex((i) => Math.min(builderSteps.length - 1, i + 1))
              }
              disabled={stepIndex >= builderSteps.length - 1}
            />
          </div>

          {step.intro && (
            <p className="mx-auto mt-4 max-w-[58ch] text-center text-[0.9375rem] leading-[1.6] text-ink-muted">
              {step.intro}
            </p>
          )}

          <fieldset className="mt-8">
            <legend className="sr-only">{step.title}</legend>
            <div className="flex flex-wrap justify-center gap-3">
              {step.options.map((option) => {
                const isSelected = selections[step.id] === option.id;
                return (
                  <label
                    key={option.id}
                    data-option-tile
                    className={`flex cursor-pointer items-center gap-4 rounded-full border px-7 py-3.5 transition-colors ${
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
                    <span className="text-[0.9375rem] font-medium">
                      {option.label}
                    </span>
                    <span className="font-mono text-[0.8125rem] text-ink-muted">
                      {formatDelta(option.priceDeltaPence)}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
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
