import { MotionProvider } from "@/components/motion/motion-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/*
 * Chrome for the real site pages. /style-guide sits outside this group on
 * purpose — it is a specimen sheet, and wrapping it in nav and footer would
 * change the artifact that was signed off in Stage 0.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionProvider>
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </MotionProvider>
  );
}
