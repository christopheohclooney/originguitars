"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

/*
 * The preloader — light falling down six strings, tuning to one note.
 *
 * A first impression for a cold arrival on Home, and nothing else: six
 * ghosted rails stand against the page ground with a bright streak of light
 * running down each at its own pace, then the six converge on the centre
 * and resolve into a single lit line that opens vertically as the ground
 * fades off the hero. Six on purpose — the instrument has six strings, and
 * the count is the one thing here that must not be "tidied" to a rounder
 * number.
 *
 * Rail-and-streak rather than lines that are themselves the falling
 * objects, which is what the first pass did: a line that drops once and
 * stops reads as "lines appear, then wrap into one", with no ongoing sense
 * of falling. Splitting the string from the light that travels it gives the
 * field a persistent structure and continuous motion at six different
 * speeds — and it is truer to the object: a string does not fall, what
 * falls is what is played down it.
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
 * The timeline is fixed at 3.6s plus a 0.24s exit — deliberately not gated
 * on the network or the hero photograph. It opened at 1.34s under a
 * two-second ceiling and has been lengthened twice on review, to three and
 * then to just under four: at the short lengths the rain never established
 * itself before the merge took over, and the review kept asking for the
 * fall to breathe — slower passes, more air between the beats. Four
 * seconds is the ceiling now, not the target to grow toward; it plays once
 * per session, and any input skips it, which together are what buy it the
 * length at all. The hero is not gated either: HeroPhoto's 1.8s settle
 * runs underneath from hydration, so by the time the ground fades the
 * photograph is long still and the reveal shows a finished frame. Gating
 * it would stack the two moments and hold the LCP element behind an
 * animation, which is the one thing that component exists to not do.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const INSTANT = { duration: 0 } as const;

/*
 * The whole animation is one shared duration with per-element `times`
 * arrays, rather than phases sequenced through state or staggerChildren.
 * Stagger can only shift start times, and the fall wants staggered speeds —
 * everything leaves together and arrives apart. With one clock, every
 * boundary below is a literal second you can read off the source, and there
 * is nothing to orchestrate and nothing to race.
 */
const TIMELINE = 3.6;
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
 *
 * 8.6vmin between them, tightened from 9.6 on review: at the wider spacing
 * the six read as distant marks that happen to share a screen rather than
 * as one instrument's strings, and grouping is what makes them a set. It
 * also shortens what the convergence has to travel, so the merge lands as
 * a gathering rather than a long journey to the middle — which is the
 * subtler resolve the wider spacing was working against.
 */
const SPREAD = [
  "-21.5vmin",
  "-12.9vmin",
  "-4.3vmin",
  "4.3vmin",
  "12.9vmin",
  "21.5vmin",
];

/*
 * The moment the strings hold as six, and the moment they have become one.
 * Convergence opens at 2.6 — a full rain phase first, long enough that the
 * six paces register as six before the field starts to move — and the merge
 * takes 0.6s, so the travel reads as gathering rather than snapping shut.
 * Done by 3.2, leaving the last 0.4s to the note.
 */
const REST = 2.6;
const MERGED = 3.2;

/* When the note and its bloom arrive — a beat after the merge lands. */
const FLARE = 3.38;

/*
 * The comets' choreography — where each streak starts, when it leaves, and
 * how long its pass takes. Scrambled by hand rather than generated: the
 * server renders the first frame, so the values must be the same on every
 * run, and Math.random would hand back a different overlay per request. The
 * scrambling is the point — six comets at six unrelated heights and speeds
 * is what makes the field read as rain rather than a squadron. Starts vary
 * between already-in-frame and well above it, so the pre-hydration frame (a
 * slow connection holds it for a moment) already shows light on the strings
 * rather than an empty ground, and the falling reads from the first tick.
 * One pass each, no loop: the passes are long enough to span the rain
 * phase on their own, and a comet restarting mid-screen reads as a glitch.
 *
 * The passes are spread across the whole timeline, not front-loaded. The
 * first cut had every comet clear the frame by ~1s, which left the merge
 * playing out over rails alone — and the merge is exactly where the rain
 * has to be, because rain landing on the one remaining string is the beat
 * that reads as six becoming one. The late comets finish between 3.2 and
 * 3.85, so light is still falling through the flare itself. One constraint
 * ties starts to delays: a comet that waits must start above the frame
 * (below -24vh, its own tail height), because a streak sitting motionless
 * mid-screen while its delay runs is a hang, not a rest.
 *
 * The durations put the fall at roughly 55vh per second — a third of the
 * 1.34s cut's speed, which is where the review's "slower, more natural"
 * landed after two rounds: fast enough to still be falling, slow enough to
 * be watched rather than registered.
 */
const COMET_START = ["-2vh", "-30vh", "8vh", "-34vh", "-26vh", "-38vh"];
const COMET_DELAY = [0, 1.15, 0.2, 1.6, 0.6, 1.95];
const COMET_DURATION = [2.7, 2.3, 2.9, 2.1, 2.6, 1.9];

/*
 * The group: left-1/2 puts the hairline's left edge on centre; the
 * half-pixel margin puts its middle there. Invisible at this width, but it
 * is the difference between six strings converging on the centre and six
 * converging half a pixel to the right of it.
 */
const groupClasses =
  "absolute left-1/2 top-0 -ml-[0.5px] h-full w-px will-change-transform";

/*
 * The rail — the string itself, a ghosted full-height hairline. White alpha
 * rather than the line tokens, because it stands over the light leak and
 * the glow, and everything over a variable ground in this system composites
 * as alpha rather than restating a solid. 7% is quiet enough to be
 * structure rather than content, and it is doing double duty: where the six
 * rails coincide at the merge, translucent layers stack to ~35% — the
 * merged string brightens by compositing, not by an animation timed to
 * pretend it did.
 */
const railClasses = "absolute inset-y-0 left-0 w-px bg-white/[0.07]";

/*
 * The comet — the light running down the string. A streak with a bright
 * leading edge and a fading tail, which is what makes direction legible on
 * a one-pixel column. Light, not paint: white alpha like the bloom, the
 * leak and --canvas-glow, which is how a near-white element squares with
 * the rule that pure white belongs to primary CTAs — that rule governs
 * surfaces and type.
 */
const cometClasses =
  "absolute left-0 top-0 h-[22vh] w-px bg-[linear-gradient(to_bottom,transparent,rgba(255,255,255,0.9))] will-change-transform";

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
    const belt = window.setTimeout(skip, 5600);

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
          {/*
            The light leak, the same rule every page carries — reused here
            for the reason Home's hero reuses it over its photograph: the
            overlay is a page for 1.6 seconds, and a page on this site is
            not a flat black rectangle. The rule brings its own SVG-noise
            dither, so the falloff does not band, and the overlay's
            overflow-hidden clips it exactly as a section would.
          */}
          <div aria-hidden data-light-leak />

          {/*
            The canvas glow, pooled behind the strings — the same light the
            builder stands the instrument in and the model gallery lifts its
            cut-outs with. Here it is what gives six ghosted rails a ground
            to stand against; on flat black their feet and heads dissolve
            and the field reads as floating marks rather than strings. A
            static gradient, like the leak: nothing here repaints.
          */}
          <div aria-hidden data-frame-glow className="absolute inset-0" />

          {SPREAD.map((offset, i) => (
            /*
              Each string is a group carrying the x offset, so the
              convergence is one `x: 0` per group while the light inside
              keeps falling on its own clock — during the merge the rain
              visibly lands on the one remaining string, which is the beat
              that makes the resolve read as six becoming one rather than
              five vanishing. Four keyframes: hold, hold, merge, yield. The
              merge is EASE because it is an arrival — six things landing as
              one, sold by the decelerating settle; the holds are written
              "linear" to say they are rests, not movements.
            */
            <m.div
              key={offset}
              className={groupClasses}
              /*
                The initial matches the first keyframe exactly. It is not
                redundant: Motion renders `initial` as inline style on the
                server, and that style is the composed frame a slow
                connection holds between first paint and hydration.
              */
              initial={{ x: offset, opacity: 1 }}
              animate={{
                x: [offset, offset, "0vmin", "0vmin"],
                opacity: [1, 1, 1, 0],
              }}
              transition={
                reduced
                  ? INSTANT
                  : {
                      duration: TIMELINE,
                      times: [0, REST / TIMELINE, MERGED / TIMELINE, 1],
                      ease: ["linear", EASE, EASE],
                    }
              }
            >
              {/*
                The rail arrives on a fast fade rather than standing in the
                server frame: the comets carry that frame alone, and the
                strings materialising under light already in motion is a
                better first tick than a fence that was simply there.
              */}
              <m.div
                className={railClasses}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={reduced ? INSTANT : { duration: 0.7, ease: EASE }}
              />
              {/*
                One pass, linear. A light streak at constant velocity is the
                pattern's read — eased travel would make it a UI element
                arriving somewhere, and rain does not arrive, it passes.
                112vh, so the tail fully clears the frame before the pass
                ends.
              */}
              <m.div
                className={cometClasses}
                initial={{ y: COMET_START[i] }}
                animate={{ y: "112vh" }}
                transition={
                  reduced
                    ? INSTANT
                    : {
                        duration: COMET_DURATION[i],
                        delay: COMET_DELAY[i],
                        ease: "linear",
                      }
                }
              />
            </m.div>
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
              the element's `transition` below — the full timeline with a
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
                    times: [0, MERGED / TIMELINE, FLARE / TIMELINE, 1],
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
                    times: [0, MERGED / TIMELINE, FLARE / TIMELINE, 1],
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
