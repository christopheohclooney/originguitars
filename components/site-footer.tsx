import Link from "next/link";

import { footerNav, primaryNav } from "@/lib/nav";
import { shell } from "@/lib/style";

/*
 * Dark full-bleed treatment, scoped to this component rather than added to
 * the site's colour tokens — globals.css is deliberately light-only (see the
 * note at the top of that file), and this footer is the one fixed-dark
 * surface on an otherwise unstyled-elsewhere site.
 */
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#0a0a0a]">
      <div className={`${shell} relative z-10 py-16 md:py-20`}>
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Origin - Standard (White).svg"
              alt="Origin Guitars"
              width={574}
              height={120}
              className="h-[20px] w-auto"
            />
            <p className="mt-6 max-w-[34ch] text-[0.9375rem] leading-[1.6] text-white/50">
              Made-to-order electric guitars, built by hand in the UK.
            </p>
          </div>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-20">
            <nav aria-label="Footer">
              <h2 className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-white/40">
                Explore
              </h2>
              <ul className="mt-5 flex flex-col gap-3.5">
                {primaryNav.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.9375rem] text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Legal and contact">
              <h2 className="text-[0.75rem] font-medium uppercase tracking-[0.08em] text-white/40">
                Company
              </h2>
              <ul className="mt-5 flex flex-col gap-3.5">
                {footerNav.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.9375rem] text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.875rem] text-white/40">
            © {new Date().getFullYear()} Origin Guitars. All rights reserved.
          </p>
          <p className="text-[0.875rem] text-white/40">
            Built to order in the United Kingdom.
          </p>
        </div>
      </div>

      {/*
        Oversized wordmark, clipped by the footer's own bounds rather than
        scaled to fit — it should read as a mark bleeding off the section, not
        a resized logo. aria-hidden since "Origin Guitars" is already the
        accessible name of the logo above.
      */}
      <p
        aria-hidden
        className="pointer-events-none relative z-0 -mt-4 select-none whitespace-nowrap text-center font-sans leading-none font-black tracking-tighter text-white/[0.06] sm:-mt-6 md:-mt-8"
        style={{ fontSize: "clamp(5rem, 18vw, 15rem)" }}
      >
        ORIGIN
      </p>
    </footer>
  );
}
