import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /*
       * The spec sheet posts its PDF with the submission, so the customer's
       * confirmation can carry it. A sheet is ~300KB; the default 1MB cap
       * would be reached by a long set of workshop notes rendering the page
       * taller. The action itself refuses a PDF over 2.5MB.
       */
      bodySizeLimit: "3mb",
    },
  },
  images: {
    /*
     * Next 16 requires an allowlist here and ships with only [75]. The
     * default is too aggressive for the photography on About: the artist
     * frame is full-bleed black and white with heavy film grain, and at 75
     * the encoder spends its budget smoothing that grain into blocks — a
     * 3840px frame came out at 132KB, which is the "crusty" look rather than
     * anything wrong with the source file.
     *
     * 75 stays for everything that does not ask for better.
     */
    qualities: [75, 90],
  },
};

export default nextConfig;
