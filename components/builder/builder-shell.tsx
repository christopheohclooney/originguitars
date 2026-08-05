"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useMemo, useState } from "react";

import { InfoTip } from "@/components/builder/info-tip";
import { PriceBar } from "@/components/ui/price-bar";
import {
  builderSteps,
  TOTAL_STEPS,
  type BuilderOption,
  type OptionGroup,
} from "@/data/options";
import { applyRules, defaultSelections } from "@/lib/builder-rules";
import {
  calculateTotalPence,
  formatDelta,
  formatPrice,
  selectedOption,
  summaryLabel,
  visibleGroups,
  type Selections,
} from "@/lib/pricing";
import { shell, slant } from "@/lib/style";

/*
 * Stage 3b — the full option sequence, following the Mod Shop layout.
 *
 * Full-bleed canvas with the instrument large and horizontal, option controls
 * in a tray underneath, price bar pinned below that.
 *
 * Every change goes through `applyRules`, so an impossible combination can
 * never be held in state even briefly. See lib/builder-rules.ts.
 */

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

function OptionControl({
  group,
  option,
  isSelected,
  isAvailable,
  onSelect,
}: {
  group: OptionGroup;
  option: BuilderOption;
  isSelected: boolean;
  isAvailable: boolean;
  onSelect: () => void;
}) {
  const input = (
    <input
      type="radio"
      name={group.id}
      value={option.id}
      checked={isSelected}
      disabled={!isAvailable}
      onChange={onSelect}
      className="sr-only"
    />
  );

  /* Colours read as swatches; everything else reads as a labelled pill. */
  if (option.swatch) {
    return (
      <label
        data-option-tile
        title={`${option.label} · ${formatDelta(option.priceDeltaPence)}`}
        className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full transition-shadow ${
          isAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-40"
        } ${
          isSelected
            ? "ring-1 ring-ink ring-offset-4 ring-offset-surface"
            : "hover:ring-1 hover:ring-line-strong hover:ring-offset-4 hover:ring-offset-surface"
        }`}
      >
        {input}
        <span
          aria-hidden
          className="h-full w-full rounded-full border border-line-strong"
          style={{ backgroundColor: option.swatch }}
        />
        <span className="sr-only">
          {option.label}, {formatDelta(option.priceDeltaPence)}
          {isAvailable ? "" : " — unavailable"}
        </span>
      </label>
    );
  }

  return (
    <label
      data-option-tile
      className={`flex items-center gap-3 rounded-full border px-6 py-3.5 transition-colors ${
        isAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-45"
      } ${
        isSelected
          ? "border-ink ring-1 ring-ink"
          : isAvailable
            ? "border-line-strong hover:border-ink"
            : "border-line"
      }`}
    >
      {input}
      <span className="text-[0.9375rem] font-medium">{option.label}</span>
      {option.tooltip && (
        <InfoTip text={option.tooltip} label={option.label} />
      )}
      <span className="font-mono text-[0.8125rem] text-ink-muted">
        {formatDelta(option.priceDeltaPence)}
      </span>
    </label>
  );
}

export function BuilderShell({ image }: { image: StaticImageData }) {
  /*
   * Selections and the touched set move together — the transparent-headstock
   * rule needs both to decide. Holding them in one atomic update avoids a
   * setState nested inside another updater, which React is free to run twice.
   */
  const [{ selections }, setState] = useState<{
    selections: Selections;
    touched: ReadonlySet<string>;
  }>(() => ({
    selections: applyRules(defaultSelections(), new Set()),
    touched: new Set<string>(),
  }));
  const [stepIndex, setStepIndex] = useState(0);

  const step = builderSteps[stepIndex];
  const groups = useMemo(
    () => visibleGroups(step, selections),
    [step, selections],
  );
  const totalPence = useMemo(
    () => calculateTotalPence(selections),
    [selections],
  );

  const choose = useCallback((groupId: string, optionId: string) => {
    setState((prev) => {
      const touched = new Set(prev.touched).add(groupId);
      return {
        touched,
        selections: applyRules(
          { ...prev.selections, [groupId]: optionId },
          touched,
        ),
      };
    });
  }, []);

  /*
   * Fixed height from the lg breakpoint up, so canvas + tray + bar resolve to
   * a single screen the way Mod Shop's configurator does. Below lg the page
   * flows and scrolls normally.
   */
  return (
    <main className="flex min-h-[calc(100svh-var(--header-h))] flex-col lg:h-[calc(100svh-var(--header-h))] lg:min-h-0">
      <div
        data-canvas
        className="flex min-h-0 flex-1 items-center justify-center px-4 py-6 md:px-10 md:py-8"
      >
        {/*
          The supplied photo is a cut-out with a real alpha channel, rotated
          and trimmed to a wide band at build time — no blend mode needed to
          drop a background, because there isn't one. It shows the
          manufacturer's reference instrument, not the current specification
          — per-option imagery arrives with the real photography.
        */}
        <Image
          src={image}
          alt="The Origin Element"
          priority
          placeholder="blur"
          sizes="100vw"
          className="max-h-full w-auto max-w-[1500px] object-contain"
        />
      </div>

      {/* Option tray */}
      <div className="border-t border-line bg-surface">
        <div className={`${shell} py-6 md:py-8`}>
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
                {String(TOTAL_STEPS).padStart(2, "0")}
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
            <p className="mx-auto mt-3 max-w-[62ch] text-center text-[0.9375rem] leading-[1.55] text-ink-muted">
              {step.intro}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-5">
            {groups.map((group) => {
              const shownOptions = group.options.filter(
                (o) => group.optionVisible?.(o, selections) ?? true,
              );
              const hasUnavailable = shownOptions.some(
                (o) => !(group.optionAvailable?.(o, selections) ?? true),
              );

              return (
                <fieldset key={group.id}>
                  <legend className="sr-only">
                    {group.label ?? step.title}
                  </legend>

                  {groups.length > 1 && group.label && (
                    <p
                      aria-hidden
                      className="mb-3 text-center text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted"
                    >
                      {group.label}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {shownOptions.map((option) => {
                      const available =
                        group.optionAvailable?.(option, selections) ?? true;
                      return (
                        <OptionControl
                          key={option.id}
                          group={group}
                          option={option}
                          isSelected={selections[group.id] === option.id}
                          isAvailable={available}
                          onSelect={() => choose(group.id, option.id)}
                        />
                      );
                    })}
                  </div>

                  {/* Name the swatch, which cannot carry its own label. */}
                  {shownOptions.some((o) => o.swatch) && (
                    <p className="mt-3 text-center text-[0.875rem] text-ink-muted">
                      <span className="font-medium text-ink">
                        {selectedOption(group, selections)?.label}
                      </span>
                      <span className="mx-2 text-line-strong">·</span>
                      <span className="font-mono text-[0.8125rem]">
                        {formatDelta(
                          selectedOption(group, selections)?.priceDeltaPence ??
                            0,
                        )}
                      </span>
                    </p>
                  )}

                  {hasUnavailable && group.unavailableNote && (
                    <p className="mx-auto mt-3 max-w-[56ch] text-center text-[0.8125rem] leading-[1.5] text-ink-muted">
                      {group.unavailableNote}
                    </p>
                  )}
                </fieldset>
              );
            })}
          </div>
        </div>
      </div>

      <PriceBar
        variant="sticky"
        stepLabel={step.shortLabel}
        selectionLabel={summaryLabel(step, selections)}
        stepCurrent={stepIndex + 1}
        stepTotal={TOTAL_STEPS}
        priceLabel={formatPrice(totalPence)}
        // Review opens a modal in Stage 4 — nothing to wire it to yet.
      />
    </main>
  );
}
