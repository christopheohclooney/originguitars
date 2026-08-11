import { MotionProvider } from "@/components/motion/motion-provider";
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
      <div className="relative z-10 flex-1">{children}</div>
      <SiteFooter />
    </MotionProvider>
  );
}
