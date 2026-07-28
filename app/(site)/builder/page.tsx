import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";

import { BuilderShell } from "@/components/builder/builder-shell";

export const metadata: Metadata = {
  title: "Build your Element — Origin Guitars",
  description:
    "Specify your Element option by option, with the price updating as you go.",
};

/*
 * Resolved at build time rather than hardcoded, so dropping the manufacturer's
 * photo into public/models/element/ is all that is needed — no code change.
 * Any of the extensions below will be picked up; the placeholder shows until
 * one exists.
 */
const IMAGE_DIR = "models/element";
const IMAGE_BASENAME = "element-full";
const EXTENSIONS = ["png", "jpg", "jpeg", "webp", "avif"] as const;

function resolveElementImage(): string | null {
  for (const ext of EXTENSIONS) {
    const relative = `${IMAGE_DIR}/${IMAGE_BASENAME}.${ext}`;
    if (existsSync(path.join(process.cwd(), "public", relative))) {
      return `/${relative}`;
    }
  }
  return null;
}

export default function BuilderPage() {
  return <BuilderShell imageSrc={resolveElementImage()} />;
}
