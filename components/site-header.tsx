"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { primaryNav } from "@/lib/nav";
import { shell } from "@/lib/style";

function Wordmark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/origin-wordmark-black.svg"
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
    <header className="sticky top-0 z-50 border-b border-line bg-white">
      <div className={`${shell} flex h-[72px] items-center justify-between gap-8`}>
        <Link
          href="/"
          className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
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
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`text-[0.9375rem] transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${
                      active ? "font-bold text-ink" : "text-ink-muted"
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
          <Link href="/builder" className={buttonClasses({ size: "sm" })}>
            Build yours
          </Link>
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="relative block h-4 w-6">
            <span
              className={`absolute left-0 block h-[2px] w-6 bg-ink transition-transform duration-200 ${
                open ? "top-[7px] rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-[7px] block h-[2px] w-6 bg-ink transition-opacity duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-[2px] w-6 bg-ink transition-transform duration-200 ${
                open ? "top-[7px] -rotate-45" : "top-[14px]"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div
          id="mobile-nav"
          className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-white md:hidden"
        >
          <nav aria-label="Primary" className={`${shell} py-8`}>
            <ul className="flex flex-col">
              {primaryNav.map((link) => (
                <li key={link.href} className="border-b border-line">
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="block py-5 text-[1.375rem] font-bold tracking-[-0.005em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/builder"
              onClick={() => setOpen(false)}
              className={`${buttonClasses({ size: "lg" })} mt-8 w-full`}
            >
              Build yours
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
