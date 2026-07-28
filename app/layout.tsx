import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

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
    <html
      lang="en-GB"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-ink">
        {children}
      </body>
    </html>
  );
}
