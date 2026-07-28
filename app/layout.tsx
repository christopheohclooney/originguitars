import type { Metadata } from "next";
import localFont from "next/font/local";
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
 * TeX Gyre Heros is declared as a family in the token stack in globals.css
 * rather than loaded here. See the note there for why, and for the single step
 * that switches it on.
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
  return (
    <html lang="en-GB" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-ink">
        {children}
      </body>
    </html>
  );
}
