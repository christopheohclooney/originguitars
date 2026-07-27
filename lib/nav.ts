/*
 * Single source of truth for site navigation.
 *
 * Several of these routes do not exist yet — Models/About/FAQ are Stage 2, the
 * Builder is Stage 3, and the footer's legal pages are Stage 8. They are listed
 * here now so the layout is complete and the links light up as each stage
 * lands, rather than the nav being rebuilt every time.
 */

export type NavLink = {
  href: string;
  label: string;
};

export const primaryNav: NavLink[] = [
  { href: "/about", label: "About" },
  { href: "/builder", label: "Builder" },
  { href: "/models", label: "Models" },
  { href: "/faq", label: "FAQ" },
];

export const footerNav: NavLink[] = [
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms and Conditions" },
];
