import Link from "next/link";

import { footerNav, primaryNav } from "@/lib/nav";
import { shell } from "@/lib/style";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className={`${shell} py-16 md:py-20`}>
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/origin-wordmark-black.svg"
              alt="Origin Guitars"
              width={574}
              height={120}
              className="h-[20px] w-auto"
            />
            <p className="mt-6 max-w-[34ch] text-[0.9375rem] leading-[1.6] text-ink-muted">
              Made-to-order electric guitars, built by hand in the UK.
            </p>
          </div>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-20">
            <nav aria-label="Footer">
              <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
                Explore
              </h2>
              <ul className="mt-5 flex flex-col gap-3.5">
                {primaryNav.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.9375rem] text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Legal and contact">
              <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-muted">
                Company
              </h2>
              <ul className="mt-5 flex flex-col gap-3.5">
                {footerNav.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[0.9375rem] text-ink-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.875rem] text-ink-muted">
            © {new Date().getFullYear()} Origin Guitars. All rights reserved.
          </p>
          <p className="text-[0.875rem] text-ink-muted">
            Built to order in the United Kingdom.
          </p>
        </div>
      </div>
    </footer>
  );
}
