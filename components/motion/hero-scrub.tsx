"use client";

import { useScroll } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/*
 * The scroll-scrubbed hero — the section shell and the video layer, and
 * nothing else. The photograph, the light leak, the scrim, the copy and the
 * mobile price strip all stay in page.tsx and arrive here as props, the same
 * split ProcessSteps makes: only the parts that need hooks live in the
 * client file.
 *
 * The mechanic: the section is three viewports tall and its first child is
 * sticky at the top of the screen, so the hero pins while two viewports of
 * scroll pass underneath — and that scroll is the timeline. Progress across
 * it maps straight onto the clip's currentTime, so the video runs forward
 * exactly as fast as the reader scrolls, backwards when they do, and hands
 * over to the rest of Home the moment the clip's end and the pin's release
 * arrive together.
 *
 * Who gets it is decided twice, and the two gates must agree.
 *
 * The CSS gate — lg:pointer-fine:motion-safe: on the pin classes — is what
 * makes the section tall and sticky, and only for a wide viewport with a
 * mouse and no reduced-motion preference. Coarse pointers are excluded as a
 * class rather than sniffed for: scrubbing performs poorly on phones, and
 * iOS Safari has a long history of fighting programmatic seeks, so touch
 * gets the photograph hero it already had rather than a degraded version of
 * this one. Media queries rather than JS so the fallback costs nothing and
 * shifts nothing: the markup is the same server-side and client-side, and a
 * phone never sees a layout change.
 *
 * The JS gate mirrors it with matchMedia and decides whether the <video>
 * exists at all. Mounted only once the gate passes, the clip is never
 * downloaded by a phone — 3.2MB it would pay for and never play — and a
 * desktop that fails the gate later (a window dragged narrow) simply drops
 * the element and stands on the photograph again.
 *
 * The binding is an rAF loop, not a scroll listener doing work. Motion's
 * useScroll hands over a MotionValue; changes to it schedule one rAF, and
 * the seek happens inside that frame — so however many scroll events Lenis
 * and the compositor fire, at most one seek is issued per painted frame,
 * and an idle page runs no loop at all. A seek already in flight defers to
 * the next frame rather than queueing behind itself.
 *
 * The clip itself is part of the mechanism: it is encoded all-intra (every
 * frame a keyframe), so a seek to any time decodes exactly one frame. A
 * default export with its single keyframe would decode from frame one on
 * every scroll tick, and no amount of care up here survives that.
 */

/* Half a frame at the clip's 24fps: seeks closer than this are the frame
 * already showing, so issuing them is decode work for no pixel change. */
const HALF_FRAME = 1 / 48;

/*
 * The one query the CSS pin variants express, restated for matchMedia —
 * including reduced motion, so the two gates cannot drift. Not
 * useReducedMotion here: that hook is null for a first frame, and a frame
 * of "not reduced" on a desktop is a frame in which the <video> mounts and
 * preload="auto" starts a download the visitor asked not to have. One
 * query answers all three conditions at once, and watching it live means a
 * window dragged narrow or an OS setting flipped mid-session drops the
 * player without a reload.
 */
const SCRUB_MEDIA =
  "(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/*
 * useSyncExternalStore rather than state set from an effect: the gate is a
 * subscription to something external, which is exactly what the hook is
 * for. The server snapshot is false, so SSR and hydration both render the
 * photograph hero and the video arrives in the first client update — no
 * mismatch, and a phone never reaches the render that mounts it.
 */
function subscribeScrubMedia(onChange: () => void) {
  const query = window.matchMedia(SCRUB_MEDIA);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readScrubMedia() {
  return window.matchMedia(SCRUB_MEDIA).matches;
}

function readScrubMediaServer() {
  return false;
}

const PIN_SECTION =
  "lg:pointer-fine:motion-safe:h-[300vh]";
const PIN_STICKY =
  "lg:pointer-fine:motion-safe:sticky lg:pointer-fine:motion-safe:top-0 lg:pointer-fine:motion-safe:h-[100svh]";

export function HeroScrub({
  videoSrc,
  media,
  children,
}: {
  /* Null when the clip has not landed: the shell renders without the pin
   * classes and the section is exactly the photograph hero it replaces —
   * the same degrade publicPhoto's null buys everywhere else. */
  videoSrc: string | null;
  /* The photograph layer. Always rendered: it is the mobile hero, the
   * reduced-motion hero, the poster the video fades up from, and the ground
   * that holds if the clip fails to load. */
  media: ReactNode;
  children: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  const scrubMedia = useSyncExternalStore(
    subscribeScrubMedia,
    readScrubMedia,
    readScrubMediaServer,
  );
  const scrub = Boolean(videoSrc) && scrubMedia;

  /*
   * 0 at the top of the page, 1 as the section's foot meets the viewport's —
   * which is the frame the pin releases on, so the clip's last frame and the
   * unpin land together by construction rather than by tuning.
   */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    if (!scrub) return;
    const video = videoRef.current;
    if (!video) return;

    let raf = 0;

    const apply = () => {
      raf = 0;
      const duration = video.duration;
      /* NaN until loadedmetadata — which schedules another pass below. */
      if (!Number.isFinite(duration) || duration <= 0) return;
      if (video.seeking) {
        /* Backpressure: let the in-flight seek land, try next frame. */
        raf = requestAnimationFrame(apply);
        return;
      }
      /* Clamped half a frame short of the end — a seek to duration exactly
       * is the one position some decoders resolve to an empty frame. */
      const t = Math.min(
        scrollYProgress.get() * duration,
        duration - HALF_FRAME,
      );
      if (Math.abs(video.currentTime - t) > HALF_FRAME) {
        video.currentTime = t;
      }
    };

    /* Coalesce: however many change events fire, one seek per frame. */
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    /* Land on the right frame immediately — the page may already be
     * mid-scroll when this mounts (a reload partway down). */
    schedule();
    video.addEventListener("loadedmetadata", schedule);
    const unsubscribe = scrollYProgress.on("change", schedule);

    return () => {
      cancelAnimationFrame(raf);
      video.removeEventListener("loadedmetadata", schedule);
      unsubscribe();
    };
  }, [scrub, scrollYProgress]);

  return (
    <section
      ref={sectionRef}
      className={`relative mt-[calc(var(--header-h)*-1)] ${videoSrc ? PIN_SECTION : ""}`}
    >
      {/*
        The hero itself, unchanged from the section it used to be: the 2%
        white ground, the overflow clip, everything page.tsx layers inside.
        The pin classes make it the sticky viewport-filling frame the scroll
        passes behind; where they do not apply it is an inert wrapper and
        the section reads exactly as before.
      */}
      <div
        className={`relative overflow-hidden bg-white/[0.02] ${videoSrc ? PIN_STICKY : ""}`}
      >
        {media}

        {/*
          Above the photograph, below the leak and the scrim — so the copy's
          measured contrast holds over whatever frame the scroll lands on,
          the same reasoning the hero's own light leak documents.

          Fades up only once a frame is decodable, on the site's default
          curve; until then the photograph underneath is the hero, so a slow
          connection sees the site it already had rather than a black frame.
          A plain element, not m.video: strict mode's rule is that animated
          elements are m.* components, and Motion animates nothing here —
          the fade is the same CSS transition the rail's dots use, and
          currentTime is driven by hand in the effect above.
        */}
        {scrub && videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            playsInline
            preload="auto"
            aria-hidden
            tabIndex={-1}
            onLoadedData={() => setReady(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              ready ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* No fallback prose: the photograph beneath is the fallback. */}
          </video>
        )}

        {children}
      </div>
    </section>
  );
}
