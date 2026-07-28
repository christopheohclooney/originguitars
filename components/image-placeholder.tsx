import { slant } from "@/lib/style";

/*
 * Stands in wherever photography will go, until the photography vs WebGL
 * direction is settled with Larry (Stage 8). Deliberately not a stock guitar
 * shot — a quiet, obviously-empty panel is more honest than a placeholder that
 * could be mistaken for the real thing.
 */
export function ImagePlaceholder({
  label = "Photography to follow",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center bg-canvas ${className}`}>
      <div className="px-6 text-center">
        <div
          aria-hidden
          className="mx-auto h-[5px] w-11 bg-ink-disabled"
          style={slant}
        />
        <p className="mt-5 text-[0.75rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
          {label}
        </p>
      </div>
    </div>
  );
}
