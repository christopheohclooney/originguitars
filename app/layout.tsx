import type { Metadata } from "next";
import localFont from "next/font/local";
import { preload } from "react-dom";
import "./globals.css";

/*
 * The finalised pairing: Archivo Bold for display, TeX Gyre Heros for
 * everything else. Both free and open — Archivo under the SIL OFL (licence
 * kept beside the file), TeX Gyre Heros under the GUST Font Licence.
 *
 * Archivo is self-hosted through next/font/local rather than fetched from
 * Google Fonts. next/font/google downloads the font files server-side at dev
 * and build time, and on any network that blocks or intercepts Google Fonts —
 * VPN, corporate proxy, DNS filter — Next receives an HTML error page instead
 * of CSS and fails parsing it, which surfaces as a SyntaxError on every page
 * rather than as a network error. A local file has no build-time network
 * dependency at all.
 *
 * Only the 700 cut is loaded, because 700 is the only weight of it the site
 * uses. It is declared here at its real weight, so display type asks for
 * font-bold and gets the drawn bold rather than a synthesised one — and
 * nothing may ask it for anything heavier than 700, which the browser would
 * have to fake.
 *
 * TeX Gyre Heros is declared as a family in `@font-face` rules in globals.css
 * rather than loaded here, because next/font/local only manages fonts it
 * loads itself. That declaration alone does not get it preloaded: a plain
 * `@font-face` is only discovered once the browser finishes CSSOM and style
 * computation and determines an element actually needs the family, which is
 * measurably later than Archivo's next/font-managed preload — this file gets
 * a `<link rel="preload">` in `<head>` before any component has rendered.
 * That gap is what widened the FOUT window on first paint and made the
 * button labels (which set in Heros) visibly resettle. `preload()` closes it
 * the same way next/font does for Archivo, without pulling Heros under
 * next/font/local, which only accepts a single font file per call and would
 * need two separate declarations fighting over one `font-family` name.
 */
const archivo = localFont({
  src: "./fonts/archivo-latin-700.woff2",
  weight: "700",
  style: "normal",
  display: "swap",
  variable: "--font-archivo",
  /* What the display type is set in for the swap frame, at the same weight. */
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Origin Guitars",
  description:
    "UK-built, made-to-order electric guitars. Specified by you, built by us.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
   * Fonts are always fetched in anonymous CORS mode per the HTML spec, even
   * when same-origin — omitting crossOrigin here makes the preload a wasted
   * request that does not match the one the @font-face rule actually issues,
   * which is silently useless rather than an error.
   */
  preload("/fonts/tex-gyre-heros/texgyreheros-regular.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });
  preload("/fonts/tex-gyre-heros/texgyreheros-bold.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    <html lang="en-GB" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-ink">
        {children}
      </body>
    </html>
  );
}
