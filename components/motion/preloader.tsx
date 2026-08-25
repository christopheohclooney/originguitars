"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

/*
 * The preloader — six strings falling, tuning to one note.
 *
 * A first impression for a cold arrival on Home, and nothing else: six
 * vertical hairlines fall against the page ground, come to rest, converge
 * on the centre and resolve into a single bright line that opens vertically
 * as the ground fades off the hero. Six on purpose — the instrument has six
 * strings, and the count is the one thing here that must not be "tidied" to
 * a rounder number.
 *
 * It plays once per session, on the first page load, on Home only. The
 * decision is made before first paint by the inline script in
 * components/session-gate.tsx, which stamps data-preloader-play on <html>;
 * the stylesheet hides [data-preloader] unless that attribute is present.
 * This component renders the same markup on the server and every client —
 * whether anything is *seen* is CSS, driven by the script, which is what
 * keeps sessionStorage out of render and hydration honest. The rule the
 * rest of the motion system follows for reduced motion — hooks pick
 * transition values, never which elements exist — is the same rule at a
 * larger scale.
 *
 * Mounted in (site)/layout.tsx rather than in Home for two reasons that are
 * both about stacking. The layout's content wrapper is `relative z-10`, a
 * stacking context nothing inside Home can escape — the lightbox already
 * hit this and had to portal. And the header pill is a backdrop-filter that
 * samples whatever paints behind it; an overlay under z-50 would be blurred
 * *into* the glass rather than covering it. As a sibling of the header at
 * z-[200] it simply wins. It must also sit after <SmoothScroll /> in the
 * layout: sibling effects run in render order, and the scroll lock below
 * only works if Lenis's MutationObserver is watching before the lock lands.
 *
 * The timeline is fixed at 1.34s plus a 0.24s exit — deliberately not gated
 * on the network or the hero photograph. A preloader that lingers is a tax,
 * and this one's whole budget is under two seconds. The hero is not gated
 * either: HeroPhoto's 1.8s settle runs underneath from hydration, so by the
 * time the ground fades the photograph is still and the reveal shows a
 * finished frame. Gating it would double the authored moment and hold the
 * LCP element behind an animation, which is the one thing that component
 * exists to not do.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const SWIFT = [0.32, 0.72, 0, 1] as const;
const INSTANT = { duration: 0 } as const;

/*
 * The whole animation is one shared duration with per-element `times`
 * arrays, rather than phases sequenced through state or staggerChildren.
 * Stagger can only shift start times, and the fall wants staggered speeds —
 * everything leaves together and arrives apart. With one clock, every
 * boundary below is a literal second you can read off the source, and there
 * is nothing to orchestrate and nothing to race.
 */
const TIMELINE = 1.34;
/* The lightbox's overlay fade, exactly — one "a full screen goes away"
   duration on the site, not two that nearly agree. */
const EXIT = 0.24;

/*
 * Where each string rests, as an x transform off dead centre. All six sit
 * at left-1/2 in layout and are *placed* by transform, which is what makes
 * the convergence a single `x: 0` per line — no layout property is ever
 * animated, only transform and opacity, per the site rule.
 *
 * vmin rather than vw: on an ultrawide, vw blows the spread into six
 * unrelated lines; bound to the scarce axis it stays a set. The gaps are
 * even, like a nut's.
 */
const SPREAD = [
  "-24vmin",
  "-14.4vmin",
  "-4.8vmin",
  "4.8vmin",
  "14.4vmin",
  "24vmin",
];

/*
 * Arrival times. Monotonic left to right, not symmetric: on the instrument
 * the low E is the heaviest string and the slowest to speak, so the slowest
 * fall belongs to the leftmost line — and the rake it produces reads better
 * than a symmetric closing gesture at this size anyway.
 */
const FALL = [0.72, 0.68, 0.64, 0.6, 0.56, 0.52];

/*
 * The rest, then the merge. Convergence opens 0.06s after the last string
 * lands — without that beat the fall and the slide blur into one continuous
 * movement and the "six strings" reading is lost. The eye needs a frame of
 * six things at rest before they become one.
 */
const REST = 0.78;
const MERGED = 1.18;

/*
 * A segment, not a full-height rule — a line that already spans the screen
 * cannot visibly fall. 38vh tall, coming to rest with its middle on the
 * viewport's centre (31 + 38/2 = 50). The start height leaves the bottom
 * 8vh hanging in frame: the animation cannot begin until hydration, so on a
 * slow connection this first keyframe *is* the page for a moment, and six
 * faint hairlines at the top of a dark screen is a composed frame where
 * fully off-screen lines would be a black void.
 */
const DROP_FROM = "-30vh";
const REST_Y = "31vh";

/*
 * left-1/2 puts the line's left edge on centre; the half-pixel margin puts
 * its middle there. Invisible at this width, but it is the difference
 * between six lines converging on the centre and six converging half a
 * pixel to the right of it.
 */
const stringClasses =
  "absolute left-1/2 top-0 -ml-[0.5px] h-[38vh] w-px bg-ink-muted will-change-transform";

/*
 * "Should this play?" as an external-store read — the lightbox's
 * useSyncExternalStore pattern, extended from "are we mounted" to "did the
 * gate script opt this session in". The server snapshot says yes, which is
 * what the server HTML has to say: it cannot know, and rendering the
 * overlay is what lets it cover the page from first paint, with the
 * stylesheet deciding visibility. The client snapshot reads the attribute
 * the gate stamped — by the time React runs, the script has already
 * *written* the session flag, so the attribute is the only record of what
 * it found — plus the reduced-motion query, because a visitor who has asked
 * for stillness should not have an invisible animation run its course over
 * a locked page. Nothing ever changes after load, hence the empty
 * subscription; the hook is here for its server/client semantics, not for
 * updates. Both snapshots return primitives, so there is nothing to cache.
 */
const subscribeNever = () => () => {};
const playsOnClient = () =>
  document.documentElement.hasAttribute("data-preloader-play") &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const playsOnServer = () => true;

export function Preloader() {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  /*
   * Captured once, at mount. The component lives in the layout, so a soft
   * navigation from /about to / re-renders it with pathname "/" — and
   * without this it would play mid-browse, which is exactly what the
   * session flag exists to prevent. On the initial load the initializer
   * sees the landing route on server and client alike, so hydration
   * matches; afterwards it never moves.
   */
  const [eligible] = useState(() => pathname === "/");
  const [gone, setGone] = useState(false);
  const plays = useSyncExternalStore(
    subscribeNever,
    playsOnClient,
    playsOnServer,
  );

  /*
   * Everything behavioural — the scroll lock, the skip listeners, the
   * backstop — keyed on `gone` so that ending the overlay runs the cleanup.
   * The visual gate is CSS and the presence gate is `plays`; this effect is
   * only the part neither can do.
   */
  useEffect(() => {
    if (!eligible || !plays || gone) return;

    /*
     * The lock is the body style attribute, per the site convention — the
     * lightbox and the mobile nav do exactly this, and smooth-scroll.tsx
     * watches for it with a MutationObserver and stops Lenis while it
     * holds. Post-mount on purpose: the observer only fires on changes, and
     * only exists once Lenis does, so a lock set any earlier would never be
     * seen and a wheel turned over the overlay would bank distance that
     * lurches the page when the lock lifts.
     */
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /*
     * Any input ends it. The preloader is a courtesy, and the instant a
     * visitor does anything they have said they are ready — so a keypress,
     * a click and a wheel all skip to the same exit fade. The wheel matters
     * most: scroll is locked, and a wheel that does nothing at all is worse
     * than no preloader.
     */
    const skip = () => setGone(true);
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("wheel", skip);

    /*
     * Backstop. Motion runs on requestAnimationFrame, which a backgrounded
     * tab pauses — so a visitor who opens Home in a background tab could
     * come to it with the animation frozen mid-fall and no completion ever
     * firing. Well past the timeline so it can only fire when something
     * has genuinely stalled.
     */
    const belt = window.setTimeout(skip, 2600);

    return () => {
      window.clearTimeout(belt);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("wheel", skip);
      document.body.style.overflow = previousOverflow;
    };
  }, [eligible, plays, gone]);

  if (!eligible) return null;

  const exitTransition = reduced
    ? INSTANT
    : { duration: EXIT, ease: EASE };

  return (
    <AnimatePresence>
      {plays && !gone && (
        /*
          aria-hidden and nothing else — no role, no focus move, no inert on
          the page. This is the opposite of the lightbox on purpose: a modal
          traps you, so it owes you focus and a way out; a decorative
          overlay that removes itself owes you only its absence. A screen
          reader never perceives it, and stealing focus from someone already
          tabbing would be the one way to make it worse than nothing.
        */
        <m.div
          data-preloader
          aria-hidden
          className="fixed inset-0 z-[200] overflow-hidden bg-surface"
          exit={{ opacity: 0 }}
          transition={exitTransition}
        >
          {SPREAD.map((offset, i) => (
            /*
              Five keyframes per string: fall, land, rest, merge, yield.
              The fall is SWIFT, not EASE — across 61vh of travel,
              easeOutExpo covers nearly everything in the first frames and
              reads as the snap-then-nothing the style guide already warns
              about; SWIFT keeps the travel visible, and its firm arrival
              reads as a string plucked into place. The convergence is EASE,
              because it is an arrival: six things landing as one, sold by
              the decelerating settle. The hold between them is written
              "linear" to say it is a rest, not a movement.
            */
            <m.div
              key={offset}
              className={stringClasses}
              /*
                The initial matches the first keyframe exactly. It is not
                redundant: Motion renders `initial` as inline style on the
                server, and that style is the composed frame a slow
                connection holds between first paint and hydration.
              */
              initial={{ y: DROP_FROM, x: offset, opacity: 0.35 }}
              animate={{
                y: [DROP_FROM, REST_Y, REST_Y, REST_Y, REST_Y],
                x: [offset, offset, offset, "0vmin", "0vmin"],
                opacity: [0.35, 1, 1, 1, 0],
              }}
              transition={
                reduced
                  ? INSTANT
                  : {
                      duration: TIMELINE,
                      times: [
                        0,
                        FALL[i] / TIMELINE,
                        REST / TIMELINE,
                        MERGED / TIMELINE,
                        1,
                      ],
                      ease: [SWIFT, "linear", EASE, EASE],
                    }
              }
            />
          ))}

          {/*
            The bloom — light, not paint. The palette's rule that pure white
            belongs to CTAs governs surfaces and type; this is the same
            device as --canvas-glow and the light leak, white alpha
            compositing over the ground, and it uses their idiom for the
            same reason. It swells behind the note at the moment the strings
            meet, then hands the last of itself to the exit.
          */}
          <m.div
            className="absolute left-1/2 top-[31vh] -ml-[6vmin] h-[38vh] w-[12vmin] bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.22),transparent)] blur-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 0.4] }}
            /*
              The exit carries its own transition. Without one it inherits
              the element's `transition` below — a 1.34s duration with a
              four-stop `times` array meant for the entrance — so the exit
              ran for the length of the whole timeline and AnimatePresence
              held the overlay mounted until it finished. Measured: the
              overlay outstayed its animation by 1.14s.
            */
            exit={{
              scaleY: 2.6,
              opacity: 0,
              transition: { duration: EXIT, ease: EASE },
            }}
            transition={
              reduced
                ? INSTANT
                : {
                    duration: TIMELINE,
                    times: [0, MERGED / TIMELINE, 1.26 / TIMELINE, 1],
                    ease: ["linear", EASE, EASE],
                  }
            }
          />

          {/*
            The note. A seventh element rather than the six brightening,
            because six coincident hairlines at full opacity are exactly as
            bright as one — there is no stacking to be had. Instead the
            greys yield as this ink line arrives at the same coordinate, so
            the eye reads a merge rather than a substitution: six muted
            strings resolving into one lit one. Its exit opens it vertically
            through the centre while the ground fades, which is the reveal —
            the line parts, and the hero is behind it.

            onAnimationComplete lives here because this is the element whose
            timeline ends last in visual terms; it flips the state that
            AnimatePresence turns into the exit.
          */}
          <m.div
            className="absolute left-1/2 top-[31vh] -ml-[0.5px] h-[38vh] w-px bg-ink will-change-transform"
            initial={{ opacity: 0, scaleY: 0.6 }}
            animate={{
              opacity: [0, 0, 1, 1],
              scaleY: [0.6, 0.6, 1, 1.25],
            }}
            /* Its own transition, for the reason given on the bloom. */
            exit={{
              scaleY: 2.6,
              opacity: 0,
              transition: { duration: EXIT, ease: EASE },
            }}
            transition={
              reduced
                ? INSTANT
                : {
                    duration: TIMELINE,
                    times: [0, MERGED / TIMELINE, 1.26 / TIMELINE, 1],
                    ease: ["linear", EASE, EASE],
                  }
            }
            onAnimationComplete={() => setGone(true)}
          />
        </m.div>
      )}
    </AnimatePresence>
  );
}
