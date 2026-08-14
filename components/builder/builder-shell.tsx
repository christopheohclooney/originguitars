"use client";

import { type StaticImageData } from "next/image";
import { m, useReducedMotion } from "motion/react";
import { useCallback, useMemo, useState } from "react";

import { InfoTip } from "@/components/builder/info-tip";
import { LoadingImage } from "@/components/ui/loading-image";
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

/*
 * The step change's movement: the incoming step slides a few pixels in from
 * the direction of travel as it fades up — next enters from the right, prev
 * from the left — so paging reads as moving along the sequence rather than
 * the tray's contents being swapped in place.
 *
 * Entrance only, no AnimatePresence: the old step leaves in the same frame
 * the click lands, which is the configurator answering immediately, and the
 * new one arrives over 300ms. An exit staged before the entrance would put
 * a wait between a click and its result thirteen times per build.
 *
 * SWIFT is the disclosure rows' curve, for the same reason it is theirs:
 * this answers a click, so it leaves quickly and settles rather than easing
 * in. The travel is 14px — enough to carry direction, not enough to read as
 * a carousel.
 */
const SWIFT = [0.32, 0.72, 0, 1] as const;
const STEP_TRAVEL = 14;

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
  /*
   * The index and the direction of the last move, together: the entrance
   * reads the direction, and holding them apart would let one update land
   * without the other. `dir: 0` is the mount state — nothing has been
   * navigated, so nothing should animate, and the server-rendered tray is
   * fully visible before hydration for the same reason the Reveals above
   * the fold are (see components/ui/loading-image.tsx on why that matters
   * on the connections it matters for).
   */
  const [{ stepIndex, dir }, setStep] = useState<{
    stepIndex: number;
    dir: -1 | 0 | 1;
  }>({ stepIndex: 0, dir: 0 });
  const reduced = useReducedMotion();

  const goTo = useCallback((index: number, direction: -1 | 1) => {
    setStep({
      stepIndex: Math.min(Math.max(index, 0), builderSteps.length - 1),
      dir: direction,
    });
  }, []);

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
        className="flex min-h-0 flex-1 items-center justify-center py-6 md:py-8"
      >
        {/*
          The instrument measures to the same column as everything else on the
          page — the option tray below it and the footer's wordmark — rather
          than to the viewport. The glow behind it stays full-bleed, so the
          light is the thing that runs edge to edge and the object sits on the
          grid.

          The supplied photo is a cut-out with a real alpha channel, rotated
          and trimmed to a wide band at build time — no blend mode needed to
          drop a background, because there isn't one. It shows the
          manufacturer's reference instrument, not the current specification
          — per-option imagery arrives with the real photography.
        */}
        <div className={`${shell} flex h-full min-h-0 items-center justify-center`}>
          {/*
            No blur placeholder on this one, deliberately — see
            components/ui/loading-image.tsx. The cut-out's alpha does not
            survive into Next's blurDataURL, so the placeholder drew an opaque
            rectangle behind an instrument that is mostly transparent, and
            then removed it in one frame.
          */}
          <LoadingImage
            src={image}
            alt="The Origin Element"
            preload
            sizes="(min-width: 1180px) 1100px, 100vw"
            className="max-h-full w-auto max-w-full object-contain"
          />
        </div>
      </div>

      {/* Option tray */}
      <div className="border-t border-line bg-surface">
        <div className={`${shell} py-6 md:py-8`}>
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <StepArrow
              direction="prev"
              onClick={() => goTo(stepIndex - 1, -1)}
              disabled={stepIndex === 0}
            />
            {/*
              The arrows stay still — they are the machine's chrome — and
              the title travels between them, keyed so each step's label is
              a fresh element making the same move as the tray below it.
              `initial={false}` covers mount and reduced motion alike:
              nothing animates, the content is simply there.
            */}
            <h1 className="flex min-w-0 justify-center text-center">
              <m.span
                key={step.id}
                initial={
                  dir === 0 || reduced
                    ? false
                    : { opacity: 0, x: STEP_TRAVEL * dir }
                }
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: SWIFT }}
                className="flex min-w-0 items-baseline gap-3"
              >
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
              </m.span>
            </h1>
            <StepArrow
              direction="next"
              onClick={() => goTo(stepIndex + 1, 1)}
              disabled={stepIndex >= builderSteps.length - 1}
            />
          </div>

          {/*
            The tray's content makes the same move as the title, on the same
            key and the same clock, so the step arrives as one thing rather
            than a heading followed by its controls.
          */}
          <m.div
            key={step.id}
            initial={
              dir === 0 || reduced
                ? false
                : { opacity: 0, x: STEP_TRAVEL * dir }
            }
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: SWIFT }}
          >
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
          </m.div>
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
