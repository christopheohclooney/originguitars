"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { NavGlow, useNavGlide } from "@/components/motion/nav-glow";
import { buttonClasses } from "@/components/ui/button";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { primaryNav } from "@/lib/nav";
import { glassPill } from "@/lib/style";

/*
 * Floating pill header.
 *
 * The <header> stays in flow (sticky, not fixed) but is itself transparent —
 * only the pill inside it paints. That keeps the page's own top spacing
 * intact, so content is never slid underneath the chrome, while it still
 * passes behind the glass on scroll.
 *
 * The pill is a true glass tint — white at 6% over whatever is behind it —
 * rather than a near-opaque slab. It carried 85% opacity while the site was
 * still light in places, purely so white type could not land on white; with
 * the ground uniformly dark that compromise is gone.
 */

/*
 * A link is lit on its own page and on any page beneath it — /models/element
 * should light "Models". Exact match alone was fine until the site grew its
 * first child route; the trailing slash in the prefix test is what keeps
 * "/faq" from ever lighting on "/faq-something".
 */
function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

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
  /*
   * The lit link, or null on a page the nav does not cover (/contact, legal).
   * Resolved once here and reused, so "which link is lit" and "where the glow
   * should be" can never answer differently.
   */
  const activeHref =
    primaryNav.find((link) => isActive(pathname, link.href))?.href ?? null;
  const { navRef, entrance } = useNavGlide(activeHref);

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
      <div
        className={`${glassPill} pointer-events-auto mx-auto flex h-16 w-full max-w-[var(--shell)] items-center justify-between gap-8 overflow-hidden px-5 md:px-6`}
      >
        <Link
          href="/"
          className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Origin Guitars — home"
        >
          <Wordmark className="h-[18px] w-auto" />
        </Link>

        {/* Desktop */}
        <nav aria-label="Primary" className="hidden md:block">
          <ul ref={navRef} className="flex items-center gap-9">
            {primaryNav.map((link) => {
              const active = link.href === activeHref;
              return (
                <li
                  key={link.href}
                  data-nav-item={link.href}
                  className="relative"
                >
                  {/*
                    The active marker, and the light that travels between
                    items — see components/motion/nav-glow.tsx for both the
                    treatment and the movement.
                  */}
                  {active && <NavGlow entrance={entrance} />}
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    /*
                      The label lights on the glide's clock and dims on its
                      own, so the arriving label brightens with its light
                      rather than 300ms ahead of it, while a hover — which
                      shares this transition — stays crisp.

                      One duration class per branch rather than a base and an
                      override: Tailwind resolves same-property conflicts by
                      stylesheet order, not by the order they are written
                      here, which is the trap the wrapper below already
                      documents.
                    */
                    className={`relative text-[0.9375rem] transition-colors ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none ${
                      active
                        ? "font-medium text-white duration-[450ms]"
                        : "text-white/60 duration-150"
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
            className={buttonClasses({ size: "sm" })}
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
          {/*
            The three-bar stack this replaced crossed its bars in place, which
            is the same gesture every site makes. This one draws the top bar
            around a curl into the second stroke of the ✕ — see
            components/ui/menu-toggle-icon.tsx. 400ms rather than the
            component's 500: the panel underneath opens on a click, so the mark
            should be finished about when the eye has finished moving to it.
          */}
          <MenuToggleIcon aria-hidden open={open} className="size-8" duration={400} />
        </button>
      </div>

      {/* Mobile panel — a card under the pill, on the same gutter. */}
      {open && (
        /* data-lenis-prevent: a wheel inside the panel must not reach the page. */
        <div
          id="mobile-nav"
          data-lenis-prevent
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
                    aria-current={
                      isActive(pathname, link.href) ? "page" : undefined
                    }
                    className={`block py-5 text-[1.375rem] font-semibold tracking-[-0.015em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      isActive(pathname, link.href)
                        ? "text-white"
                        : "text-white/60"
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
              className={`${buttonClasses({ size: "lg" })} my-6 w-full`}
            >
              Build yours
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
