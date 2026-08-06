import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
