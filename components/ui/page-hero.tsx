import type { ReactNode } from "react";

import { shell } from "@/lib/style";

/*
 * The centred page hero, shared by the content pages — FAQ first, About next.
 *
 * It carries no light treatment of its own. The raking leak in
 * (site)/layout.tsx already covers the top ~72vh of every page, which is
 * exactly where a hero sits, and a hero-scoped copy of it measured +3 on a
 * ground of 30 — two systems doing one job, one of them invisible. The
 * builder's --canvas-glow is deliberately not reused here either: that is a
 * centred pool for lighting an object's silhouette, and a hero has no object
 * in it.
 *
 * The heading carries the metallic fill and is set in the display face at a
 * light weight: at this size the gradient does the work that weight would
 * otherwise do, and bold would close the counters the light has to pass
 * through.
 */
export function PageHero({
  title,
  intro,
  media,
}: {
  title: string;
  /* Optional so a page can lead straight into its content. */
  intro?: ReactNode;
  /* Sits under the copy, inside the same column as everything else. */
  media?: ReactNode;
}) {
  return (
    <section className="pt-16 pb-16 md:pt-24 md:pb-20">
      <div className={shell}>
        <h1
          data-metal
          className="mx-auto max-w-[16ch] text-center font-display text-[clamp(2.75rem,7vw,4.75rem)] font-light leading-[1.04] tracking-[-0.02em]"
        >
          {title}
        </h1>

        {intro && (
          <p className="mx-auto mt-6 max-w-[54ch] text-center text-[1.0625rem] leading-[1.6] text-ink-muted md:text-[1.125rem]">
            {intro}
          </p>
        )}

        {media && <div className="mt-14 md:mt-16">{media}</div>}
      </div>
    </section>
  );
}
