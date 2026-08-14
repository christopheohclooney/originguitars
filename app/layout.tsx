import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import localFont from "next/font/local";
import "./globals.css";

/*
 * Archivo — the primary face, for headings and display type.
 *
 * The variable woff2 is vendored into app/fonts rather than pulled from
 * next/font/google, for the same reason Geist is: a build-time fetch to
 * Google Fonts fails on any network that filters it, and next parses the
 * resulting HTML error page as CSS. The file is the latin subset of the
 * wght axis from @fontsource-variable/archivo, OFL-1.1, licence alongside
 * it.
 *
 * Declared as one variable font rather than per-weight faces, so any weight
 * in 100-900 is available without shipping a file for each.
 */
const archivo = localFont({
  src: "./fonts/archivo-variable-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-archivo",
  fallback: ["system-ui", "sans-serif"],
});

/*
 * Fonts are self-hosted via the `geist` package rather than fetched through
 * next/font/google.
 *
 * next/font/google downloads the font files server-side at dev and build time.
 * On any network that blocks or intercepts Google Fonts — VPN, corporate
 * proxy, DNS filter — Next receives an HTML error page instead of CSS and
 * fails parsing it, which surfaces as a SyntaxError from Node's vm on every
 * page rather than as a network error.
 *
 * The package ships the same typeface as local files and exposes the same
 * --font-geist-sans / --font-geist-mono variables the tokens in globals.css
 * expect, so this is identical visually with no build-time network dependency.
 */
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
  return (
    /*
      No height on <html>, deliberately.

      It carried h-full, and body's floor was min-h-full measured against it.
      That is load-bearing for Lenis: it observes <html> with a ResizeObserver
      to know when the page got taller, and an element pinned to height:100%
      has a box that is always exactly the viewport — it never resizes when
      content grows. So Lenis kept whatever page height it measured at init,
      and anything that landed after that (photographs finishing, fonts
      swapping) was below a scroll limit that never moved. Measured: content
      grown by 3000px after init left exactly 3000px unreachable.

      min-h-screen is the same floor measured against the viewport instead of
      the parent, so the footer still sits at the bottom of a short page and
      <html> is free to be as tall as its content. This is what Lenis's own
      `html.lenis { height: auto }` rule exists to force; done here, it needs
      no override.
    */
    <html
      lang="en-GB"
      className={`${archivo.variable} ${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      {/* `relative` is the containing block for the light leak in (site)/layout. */}
      <body className="relative min-h-screen flex flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
