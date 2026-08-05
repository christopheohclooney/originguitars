"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { primaryNav } from "@/lib/nav";

/*
 * Floating pill header.
 *
 * The <header> stays in flow (sticky, not fixed) but is itself transparent —
 * only the pill inside it paints. That keeps the page's own top spacing
 * intact, so pages that have not been restyled yet are never slid underneath
 * the chrome, while content still passes behind the glass on scroll.
 *
 * The pill is 85% opaque rather than properly translucent. Fully glassy looks
 * right on a dark page and illegible on a light one, and this is a shared
 * component landing on pages that are still white — at 85% the white type
 * clears 9:1 against a white background and the pill still reads as glass
 * over dark.
 */

function Wordmark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/Origin - Standard (White).svg"
      alt="Origin Guitars"
      width={574}
      height={120}
      className={className}
    />
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /* Escape closes, and the page behind shouldn't scroll while it's open. */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className="pointer-events-none sticky top-0 z-50 px-4 py-4 md:px-6 md:py-5">
      {/*
        `overflow-hidden` is load-bearing: it clips the active-link glow to the
        pill's rounded edge, which is what stops it reading as a stray blob
        floating under the bar.
      */}
      <div className="pointer-events-auto mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between gap-8 overflow-hidden rounded-full border border-white/10 bg-[#141414]/85 px-5 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl md:px-6">
        <Link
          href="/"
          className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Origin Guitars — home"
        >
          <Wordmark className="h-[18px] w-auto" />
        </Link>

        {/* Desktop */}
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-9">
            {primaryNav.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href} className="relative">
                  {/*
                    The active marker: ambient light under the label rather
                    than a rule. An ellipse sat low behind the text and blurred
                    past its own bounds, so there is no edge anywhere — what
                    shows is the bloom, and the pill clips the rest.
                  */}
                  {active && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-[1.6rem] h-7 w-[130%] min-w-[4rem] -translate-x-1/2 rounded-[50%] bg-white/45 blur-[20px]"
                    />
                  )}
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative text-[0.9375rem] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      active ? "font-medium text-white" : "text-white/60"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/*
          The wrapper carries the breakpoint, not the link. `hidden` on the
          link itself loses to the button's own `inline-flex`, since Tailwind
          resolves same-property conflicts by stylesheet order.
        */}
        <div className="hidden md:block">
          <Link
            href="/builder"
            className={buttonClasses({ variant: "inverse", size: "sm" })}
          >
            Build yours
          </Link>
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="-mr-1 inline-flex h-11 w-11 items-center justify-center rounded-full text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="relative block h-4 w-6">
            <span
              className={`absolute left-0 block h-[2px] w-6 bg-white transition-transform duration-200 ${
                open ? "top-[7px] rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] block h-[2px] w-6 bg-white transition-opacity duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-[2px] w-6 bg-white transition-transform duration-200 ${
                open ? "top-[7px] -rotate-45" : "top-[14px]"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile panel — a card under the pill, on the same gutter. */}
      {open && (
        <div
          id="mobile-nav"
          className="pointer-events-auto fixed inset-x-4 top-[var(--header-h)] z-40 max-h-[calc(100svh-var(--header-h)-1rem)] overflow-y-auto rounded-3xl border border-white/10 bg-[#141414]/95 backdrop-blur-xl md:hidden"
        >
          <nav aria-label="Primary" className="px-6 py-4">
            <ul className="flex flex-col">
              {primaryNav.map((link) => (
                <li
                  key={link.href}
                  className="border-b border-white/10 last:border-b-0"
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className={`block py-5 text-[1.375rem] font-semibold tracking-[-0.015em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      pathname === link.href ? "text-white" : "text-white/60"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/builder"
              onClick={() => setOpen(false)}
              className={`${buttonClasses({ variant: "inverse", size: "lg" })} my-6 w-full`}
            >
              Build yours
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
