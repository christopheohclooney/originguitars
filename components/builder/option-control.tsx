import { InfoTip } from "@/components/builder/info-tip";
import type { BuilderOption, OptionGroup } from "@/data/options";
import { formatDelta } from "@/lib/pricing";

/*
 * One option as the builder draws it: a swatch when the option carries a
 * colour, a labelled pill with its price otherwise.
 *
 * Lifted out of builder-shell.tsx so the spec sheet renders the same control
 * rather than a copy of it. The tile is a styled label around a visually
 * hidden radio, so arrow keys, focus and form semantics all come from the
 * browser; the focus ring is drawn by [data-option-tile] in globals.css.
 */
export function OptionControl({
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
