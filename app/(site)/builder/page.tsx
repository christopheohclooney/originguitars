import type { Metadata } from "next";

import elementFull from "@/public/models/element/element-full.jpg";
import { BuilderShell } from "@/components/builder/builder-shell";

export const metadata: Metadata = {
  title: "Build your Element — Origin Guitars",
  description:
    "Specify your Element option by option, with the price updating as you go.",
};

/*
 * Statically imported rather than referenced by URL string, so Next reads the
 * real dimensions at build time and can generate a blur placeholder and
 * responsive sizes. A missing file fails the build loudly, which is what we
 * want for an asset that appears on every builder step.
 */
export default function BuilderPage() {
  return <BuilderShell image={elementFull} />;
}
