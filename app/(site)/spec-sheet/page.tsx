import type { Metadata } from "next";

import { PageHero } from "@/components/ui/page-hero";
import { SpecSheet } from "@/components/spec-sheet/spec-sheet";
import { shell } from "@/lib/style";

/*
 * Interim: kept out of the nav (lib/nav.ts) and out of search results until
 * the builder's own review and checkout replace it. The link is shared with
 * customers directly.
 */
export const metadata: Metadata = {
  title: "Build spec sheet — Origin Guitars",
  description:
    "Choose every option for your Origin build, then download the sheet as a PDF to sign off.",
  robots: { index: false, follow: false },
};

export default function SpecSheetPage() {
  return (
    <main>
      <PageHero
        title="Specified by you, built by us."
        titleMeasure="15ch"
        intro="Choose every option for your Origin build. The price updates as you go. When you're done, download the sheet as a PDF so you and the workshop sign off on the same guitar."
        introMeasure="60ch"
      />
      <div className={shell}>
        <SpecSheet />
      </div>
    </main>
  );
}
