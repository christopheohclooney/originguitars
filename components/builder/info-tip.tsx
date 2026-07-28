"use client";

import { useEffect, useId, useRef, useState } from "react";

/*
 * A one-line explanation behind a small info icon, for the terms the user flow
 * doc expects to trip people up — neck-thru, the fretboard timbers, the
 * locking tremolo. Used selectively; most options do not carry one.
 *
 * Click to toggle rather than hover to reveal, because hover does not exist on
 * a phone and this is precisely where a self-taught player is most likely to
 * be reading. Escape and an outside click both dismiss it.
 */
export function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapper = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <span ref={wrapper} className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`What does ${label} mean?`}
        onClick={(e) => {
          /* The tip sits inside a <label>; without this the click also
             toggles the radio it is nested in. */
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[0.75rem] font-bold leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
          open
            ? "border-ink bg-ink text-white"
            : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"
        }`}
      >
        i
      </button>

      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-[calc(100%+10px)] left-1/2 z-50 w-[min(19rem,70vw)] -translate-x-1/2 border border-line bg-white p-4 text-left text-[0.875rem] font-normal leading-[1.6] text-ink shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
        >
          {text}
        </span>
      )}
    </span>
  );
}
