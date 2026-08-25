/*
 * The session gate — one inline script, run synchronously while the browser
 * is still parsing the HTML, before anything has painted.
 *
 * It answers a question React cannot: "has this session loaded a page
 * before?" sessionStorage does not exist on the server, so any component
 * that reads it during render disagrees with its own server HTML and throws
 * a hydration mismatch — and reading it in an effect answers after first
 * paint, which for a full-screen preloader is a flash of the wrong answer.
 * An inline script is the one place the value can be read before the first
 * frame exists. This is the pattern Next's own guide on preventing flash
 * before hydration reaches for (node_modules/next/dist/docs/01-app/02-guides/
 * preventing-flash-before-hydration.md), and the same family as every
 * theme-flash script.
 *
 * The contract with components/motion/preloader.tsx and globals.css:
 *
 *   - [data-preloader] is display:none by default in the stylesheet.
 *   - This script adds data-preloader-play to <html> ONLY when the session
 *     is new and the path is Home.
 *
 * The polarity is deliberate, and it is the inverse of the [data-reveal]
 * safety net. A reveal must fail visible, because a broken reveal hides a
 * section. A preloader must fail absent, because a broken preloader hides
 * the site — so a blocked inline script, a script error, JavaScript off and
 * an unavailable sessionStorage all resolve the same way: no overlay.
 *
 * The flag is written unconditionally, on every route — that is what makes
 * it mean "this session has loaded a page" rather than "this session has
 * seen the preloader". Someone landing on /about and navigating to Home
 * afterwards has already met the site, and a full-screen overlay
 * mid-browse is an interruption rather than an entrance. It also means
 * /style-guide sets the flag, which is intended, not a leak: the sheet is a
 * page load like any other.
 *
 * Consequences worth knowing rather than discovering: a refresh
 * mid-animation does not replay it (the flag is written on load, and
 * replaying on every refresh is exactly the annoyance the brief guards
 * against); a newly opened tab is a new browsing context, so it plays —
 * which is the right reading of "per session", a new tab is a new arrival;
 * a restore from the back/forward cache runs no script and replays nothing.
 */

const SCRIPT = `(function () {
  try {
    var seen = sessionStorage.getItem("originguitars:visited");
    sessionStorage.setItem("originguitars:visited", "1");
    if (!seen && location.pathname === "/") {
      document.documentElement.setAttribute("data-preloader-play", "");
    }
  } catch (e) {
    /* Storage blocked outright (some private modes throw rather than
       return null). Fail closed: no attribute, no overlay. */
  }
})()`;

/*
 * Rendered as the first child of <body> in app/layout.tsx. React renders
 * inline scripts in place (only src scripts are hoisted), and the browser
 * executes it before parsing anything that follows — which is everything
 * visible. The attribute it may set is one React never renders, so <html>
 * carries suppressHydrationWarning in the root layout; see the note there.
 */
export function SessionGate() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
