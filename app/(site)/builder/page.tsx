import type { Metadata } from "next";

import elementSide from "@/public/models/element/element-side.png";
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
 *
 * `element-side.png` is the manufacturer's portrait shot rotated clockwise and
 * trimmed to a wide band, then keyed off its white ground to real transparency
 * (see scripts/prepare-element-image.mjs). The original is kept alongside it as
 * the source of truth.
 */
export default function BuilderPage() {
  return <BuilderShell image={elementSide} />;
}
