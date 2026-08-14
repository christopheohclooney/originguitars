"use client";

import { m, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

/*
 * The header's active-page marker, and the movement that carries it between
 * links.
 *
 * The marker itself is ambient light rather than a rule: an ellipse sat low
 * behind the label and blurred past its own bounds, so there is no edge
 * anywhere — what shows is the bloom, and the pill's overflow clips the rest.
 *
 * It used to cut. The glow is rendered inside the active <li>, so a route
 * change unmounted one and mounted another somewhere else, and the light
 * appeared in its new place rather than travelling there. Now the arriving one
 * starts at the offset of the one that just left and animates that offset
 * away, so what you see is a single light crossing the nav.
 *
 * Not `layoutId`, which is what this would otherwise be written as. Layout
 * projection ships only in Motion's `domMax` bundle and MotionProvider loads
 * `domAnimation` (see the note there) — under which a `layoutId` is accepted,
 * does nothing, and logs nothing. Buying the projection engine to animate one
 * ellipse costs +13kB gzipped, roughly doubling the motion payload, so this is
 * the same movement expressed as a transform, which `domAnimation` does carry.
 *
 * The glow stays inside the <li> rather than becoming one shared element in
 * the <ul>, because that is what keeps it in the server HTML: a single
 * indicator would have to be positioned from a measurement, and measurement
 * needs the client, which would leave the top of every page unmarked until
 * hydration.
 */

/* The site's answer-to-a-click curve — see components/ui/disclosure.tsx. */
const SWIFT = [0.32, 0.72, 0, 1] as const;
const INSTANT = { duration: 0 } as const;

/*
 * Long enough to read as a sweep across the nav rather than a snap, and a
 * number the site already uses: the disclosure panel's items arrive on it.
 * Fixed rather than scaled to the distance, so the header keeps one rhythm
 * whichever link you took.
 */
const GLIDE = { duration: 0.45, ease: SWIFT } as const;

/*
 * Shaped as Motion's `initial` prop, so what the hook returns is what the
 * component takes with nothing in between:
 *   false          — be where you belong, without animating (first paint)
 *   { x }          — start this far away and slide home
 *   { opacity: 0 } — no previous position to come from, so fade up in place
 */
export type NavGlowEntrance = false | { x: number } | { opacity: number };

/**
 * Tracks where the light was, so the next one knows where to come from.
 *
 * Takes the resolved active href rather than the pathname, which is what
 * makes the edge cases disappear rather than need handling: /models/element
 * resolves to the same href as /models so nothing moves, clicking the link
 * for the page you are on resolves unchanged, back and forward are just
 * another change of href, and a page the nav does not cover is null.
 */
type Centres = ReadonlyMap<string, number>;

/* Stable identity, so the first render and an empty measurement agree. */
const NO_CENTRES: Centres = new Map();

function same(a: Centres, b: Centres): boolean {
  if (a.size !== b.size) return false;
  for (const [href, centre] of a) if (b.get(href) !== centre) return false;
  return true;
}

export function useNavGlide(activeHref: string | null) {
  const navRef = useRef<HTMLUListElement>(null);
  /*
   * Item centres by href, measured in one pass so a shared origin cancels.
   *
   * State rather than a ref, even though it is measurement data: the entrance
   * has to be derived while rendering, and a ref read during render is both
   * impure and — correctly — a lint error. It re-renders only when the row's
   * geometry actually moves, which is a resize, a font swap or a navigation.
   */
  const [centres, setCentres] = useState<Centres>(NO_CENTRES);

  const measure = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;

    const next = new Map<string, number>();
    for (const item of nav.querySelectorAll<HTMLElement>("[data-nav-item]")) {
      const href = item.dataset.navItem;
      if (!href) continue;
      /*
       * The <li>'s centre is the glow's centre — the glow is left-1/2 and
       * pulled back by half its own width, so it is centred on this box.
       *
       * getBoundingClientRect rather than offsetLeft: offsetLeft rounds to
       * whole pixels and is measured from whichever ancestor happens to be
       * positioned, which today is the sticky <header> and would silently
       * become the pill the moment anyone gave it `relative`. A rect has
       * neither problem, and being viewport-relative does not matter because
       * only the difference between two centres from the same pass is ever
       * used — any common offset cancels.
       */
      const rect = item.getBoundingClientRect();
      next.set(href, rect.left + rect.width / 2);
    }

    /* Bail on an unchanged measurement, so this cannot feed itself. */
    setCentres((current) => (same(current, next) ? current : next));
  }, []);

  /*
   * Re-measure when the lit item changes. The active label is font-medium and
   * the others are not, so every navigation reflows the row from the inside —
   * and that is the change a ResizeObserver on the <ul> can miss, since one
   * label thickening as another thins can leave the row's own box where it
   * was while every centre inside it has moved.
   */
  useEffect(measure, [measure, activeHref]);

  /*
   * And when the row itself changes shape: the viewport resizing, the nav
   * appearing at the md breakpoint, or Archivo swapping in after first paint
   * and changing every label's width. Fires once on observe, which seeds the
   * table for free.
   */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [measure]);

  /*
   * The entrance has to be known while rendering, because `initial` is read
   * when the glow mounts and the mount is the navigation. So the link we came
   * from is held in state and compared here — React's "adjust state when a
   * prop changes": the update is queued during render, React discards this
   * pass and immediately re-runs before committing, and what commits carries
   * the offset.
   *
   * Deliberately not a ref read during render. That is the shorter version of
   * this and it is impure — it would survive a router transition being thrown
   * away only by accident, and the lint rule that forbids it is right.
   *
   * Seeded with the current href, so first paint compares equal and animates
   * nothing: the glow is already in the server HTML, and on the page you load
   * into it should simply be there.
   */
  const [glide, setGlide] = useState<{
    href: string | null;
    entrance: NavGlowEntrance;
  }>({ href: activeHref, entrance: false });

  let entrance = glide.entrance;

  if (glide.href !== activeHref) {
    const from = glide.href !== null ? centres.get(glide.href) : undefined;
    const to = activeHref !== null ? centres.get(activeHref) : undefined;

    entrance =
      from !== undefined && to !== undefined
        ? { x: from - to }
        : /* Nowhere to travel from — a page the nav does not cover. */
          { opacity: 0 };

    setGlide({ href: activeHref, entrance });
  }

  return { navRef, entrance };
}

/**
 * The light itself.
 *
 * `x` only, no width morph. The glow is 130% of its label but floored at
 * min-w-[4rem], and at this type size three of the four items sit on that
 * floor — the widest scale factor in play is about 1.06, on something blurred
 * by 20px. If that floor is ever removed, this is the decision to revisit.
 *
 * No exit animation, deliberately. `exit` is captured from the leaving
 * element's last render, which happened before we knew whether a replacement
 * was arriving — so giving every item one would show a ghost fading at the old
 * position while the new light slides away from it. Two lights is worse than a
 * clean handover.
 */
export function NavGlow({
  entrance = false,
}: {
  entrance?: NavGlowEntrance;
}) {
  const reduced = useReducedMotion();

  return (
    <m.span
      aria-hidden
      /*
       * Reduced motion drops the offset as well as the duration. A zero-length
       * tween still resolves on the next frame, which is one visible frame
       * spent at the old position — the travel has to not exist, not merely be
       * instant.
       *
       * This does not break the rule that useReducedMotion must never decide
       * which elements render: it only picks a value here, and on first paint
       * `entrance` is false for everyone regardless, so the server HTML and the
       * hydration render are identical whatever the hook returns.
       */
      initial={reduced ? false : entrance}
      animate={{ x: 0, opacity: 1 }}
      transition={reduced ? INSTANT : GLIDE}
      /*
       * The centring stays a Tailwind class alongside Motion's transform,
       * which is safe here where it often would not be: v4 compiles
       * -translate-x-1/2 to the standalone `translate` property rather than to
       * `transform`, so the two compose instead of overwriting one another.
       * blur-[20px] compiles to `filter`, likewise untouched.
       */
      className="pointer-events-none absolute left-1/2 top-[1.6rem] h-7 w-[130%] min-w-[4rem] -translate-x-1/2 rounded-[50%] bg-white/45 blur-[20px]"
    />
  );
}
