import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/*
 * The finalised pairing: Archivo Black for display, TeX Gyre Heros for
 * everything else. Both free and open — Archivo Black under the SIL OFL
 * (licence kept beside the file), TeX Gyre Heros under the GUST Font Licence.
 *
 * Archivo Black is self-hosted through next/font/local rather than fetched
 * from Google Fonts. next/font/google downloads the font files server-side at
 * dev and build time, and on any network that blocks or intercepts Google
 * Fonts — VPN, corporate proxy, DNS filter — Next receives an HTML error page
 * instead of CSS and fails parsing it, which surfaces as a SyntaxError on
 * every page rather than as a network error. A local file has no build-time
 * network dependency at all.
 *
 * Archivo Black ships one weight, 400, and that is the entire family — it is
 * already black. Nothing wearing it may also ask for font-bold, or the browser
 * synthesises a second layer of weight on top and smears the counters shut.
 *
 * TeX Gyre Heros is declared as a family in the token stack in globals.css
 * rather than loaded here. See the note there for why, and for the single step
 * that switches it on.
 */
const archivoBlack = localFont({
  src: "./fonts/archivo-black-latin-400.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-archivo-black",
  /*
   * What the display type is set in for the swap frame. Arial Black is the
   * only near-black grotesque that can be assumed present on a stock machine.
   */
  fallback: ["Arial Black", "Helvetica", "sans-serif"],
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
    <html lang="en-GB" className={`${archivoBlack.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-ink">
        {children}
      </body>
    </html>
  );
}
