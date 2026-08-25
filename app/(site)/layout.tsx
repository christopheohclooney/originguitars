import { MotionProvider } from "@/components/motion/motion-provider";
import { Preloader } from "@/components/motion/preloader";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/*
 * Chrome for the real site pages. /style-guide sits outside this group on
 * purpose: it documents the header and the footer, and a sheet carrying the
 * real chrome above its own specimen of that chrome would be reading itself
 * twice — its fixed price bar would also land on top of the footer.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionProvider>
      {/* Renders nothing — wires Lenis to the window. See the component. */}
      <SmoothScroll />
      {/*
        Stacking is explicit rather than left to z-index: -1. A negative layer
        would depend on body's background propagating to the canvas to stay
        visible, which is true today and quietly stops being true the moment
        anything sets a background on <html>. Positioning the content above
        the leak instead keeps it below the chrome — including the header,
        whose backdrop-filter samples it — without that dependency.
      */}
      <div aria-hidden data-light-leak />
      <SiteHeader />
      {/*
        After SmoothScroll, and the ordering is load-bearing: sibling effects
        run in render order, and the preloader's scroll lock only registers
        if Lenis's MutationObserver is already watching the body when the
        lock lands. A sibling of the header rather than a child of the
        content wrapper below, whose `relative z-10` is a stacking context
        nothing inside it can escape — the same trap the lightbox documents.
      */}
      <Preloader />
      <div className="relative z-10 flex-1">{children}</div>
      <SiteFooter />
    </MotionProvider>
  );
}
