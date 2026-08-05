import Link from "next/link";

import { FooterWordmark } from "@/components/motion/footer-wordmark";
import { footerNav, primaryNav } from "@/lib/nav";
import { shell } from "@/lib/style";

/*
 * The footer sits on the canvas ground, not the deeper chrome ground — it
 * reads as a continuation of the page rather than a bar attached to the
 * bottom of it, so on the builder it runs straight on from the canvas with
 * no seam.
 */
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-canvas">
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

        <div className="mt-24 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.875rem] text-white/40">
            © {new Date().getFullYear()} Origin Guitars. All rights reserved.
          </p>
          <p className="text-[0.875rem] text-white/40">
            Built to order in the United Kingdom.
          </p>
        </div>

        {/*
          Oversized wordmark. Set to the same content column as the rest of
          the footer rather than the viewport — the reference has it bleeding
          off the bottom edge but stopping at the column's left and right
          edges, not the page's. The negative bottom margin cancels the
          shell's own bottom padding so it still bleeds to the footer's edge;
          the asset's own fill is already a near-black ghost gradient and its
          viewBox is already cropped to the intended height, so no further
          fade or crop is added on top.
        */}
        <FooterWordmark className="pointer-events-none relative z-0 mt-10 -mb-16 w-full select-none md:mt-14 md:-mb-20" />
      </div>
    </footer>
  );
}
