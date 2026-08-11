/*
 * ⚠️  PLACEHOLDER OPTION LIST AND PRICING — NOT CONFIRMED BY LARRY.
 *
 * The build spec and user flow doc name the steps and their order but contain
 * no option lists, no colour names and no prices. Everything below is invented
 * so the builder is functional and reviewable. All of it needs replacing with
 * the real option list before this goes anywhere near Stripe.
 *
 * Money is stored in pence as integers, never pounds as floats. Stripe expects
 * the smallest currency unit, and integer arithmetic avoids the rounding drift
 * that bites price calculators built on floating point.
 */

import type { Selections } from "@/lib/pricing";

export type BuilderOption = {
  id: string;
  label: string;
  description?: string;
  priceDeltaPence: number;
  /** Hex value — presence switches this option to swatch rendering. */
  swatch?: string;
  /** One line, shown behind an info icon. Used selectively. */
  tooltip?: string;
  /** Colour family, used by the colour step's filter. */
  family?: string;
};

export type OptionGroup = {
  id: string;
  /** Shown above the options when a step has more than one group. */
  label?: string;
  options: BuilderOption[];
  defaultOptionId: string;
  /** Hidden entirely unless this returns true. */
  visibleWhen?: (selections: Selections) => boolean;
  /** Options failing this are not rendered at all — used to filter colours by family. */
  optionVisible?: (option: BuilderOption, selections: Selections) => boolean;
  /** Options failing this render disabled rather than disappearing. */
  optionAvailable?: (option: BuilderOption, selections: Selections) => boolean;
  /** Explains the disabled options when any are present. */
  unavailableNote?: string;
};

export type BuilderStep = {
  id: string;
  title: string;
  /** The sticky bar's uppercase label. */
  shortLabel: string;
  intro?: string;
  groups: OptionGroup[];
  /** Which group's selection the sticky bar shows. Defaults to the first. */
  summaryGroupId?: string;
};

export const BASE_PRICE_PENCE = 189_900; // £1,899.00 — PLACEHOLDER

/*
 * ⚠️  BASE_PRICE_PENCE and the catalogue disagree, and deliberately so rather
 * than by oversight. The Element's "from" figure lives in data/models.ts and
 * is £799.00, taken from the supplied designs; £1,899.00 above is invented,
 * like everything else in this file. Whichever turns out to be real, the two
 * need reconciling before launch — a visitor who reads "from £799" on the
 * doormat and then watches the builder open at £1,899 has been misled.
 */

/* --------------------------------------------------------------- colours */

const COLOUR_FAMILIES = {
  solid: "solid",
  metallic: "metallic",
  transparent: "transparent",
  burst: "burst",
} as const;

const colours: BuilderOption[] = [
  // Solid
  { id: "jet-black", label: "Jet Black", swatch: "#0E0E0E", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "arctic-white", label: "Arctic White", swatch: "#F1F1EF", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "racing-red", label: "Racing Red", swatch: "#B31217", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "ultramarine", label: "Ultramarine", swatch: "#22359B", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "sage", label: "Sage", swatch: "#93A187", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "bone", label: "Bone", swatch: "#D8CFBE", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },

  // Metallic
  { id: "gunmetal", label: "Gunmetal", swatch: "#5A5E63", priceDeltaPence: 0, family: COLOUR_FAMILIES.metallic },
  { id: "silver-flake", label: "Silver Flake", swatch: "#B9BDC2", priceDeltaPence: 0, family: COLOUR_FAMILIES.metallic },
  { id: "champagne", label: "Champagne", swatch: "#C9BFA6", priceDeltaPence: 0, family: COLOUR_FAMILIES.metallic },
  { id: "electric-blue", label: "Electric Blue", swatch: "#1F5FBF", priceDeltaPence: 0, family: COLOUR_FAMILIES.metallic },
  { id: "deep-bronze", label: "Deep Bronze", swatch: "#6B4F2A", priceDeltaPence: 0, family: COLOUR_FAMILIES.metallic },

  // Transparent
  { id: "trans-black", label: "Trans Black", swatch: "#262626", priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "trans-cherry", label: "Trans Cherry", swatch: "#7B1B24", priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "trans-blue", label: "Trans Blue", swatch: "#1E4E8C", priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "trans-green", label: "Trans Green", swatch: "#1F5C3A", priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "natural-oil", label: "Natural Oil", swatch: "#C2A277", priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },

  // Burst
  { id: "tobacco-burst", label: "Tobacco Burst", swatch: "#6E4423", priceDeltaPence: 0, family: COLOUR_FAMILIES.burst },
  { id: "cherry-burst", label: "Cherry Burst", swatch: "#8E2233", priceDeltaPence: 0, family: COLOUR_FAMILIES.burst },
  { id: "blue-burst", label: "Blue Burst", swatch: "#204A7A", priceDeltaPence: 0, family: COLOUR_FAMILIES.burst },
  { id: "silver-burst", label: "Silver Burst", swatch: "#8A8D91", priceDeltaPence: 0, family: COLOUR_FAMILIES.burst },
];

/** The colour ids that count as transparent, for the headstock rule. */
export const TRANSPARENT_COLOUR_IDS = new Set(
  colours.filter((c) => c.family === COLOUR_FAMILIES.transparent).map((c) => c.id),
);

/* ----------------------------------------------------------------- steps */

export const builderSteps: BuilderStep[] = [
  {
    id: "handedness",
    title: "Handedness",
    shortLabel: "Handedness",
    intro:
      "Which way round the instrument is built. This affects the body contours, the nut and the bridge, so it is settled first.",
    groups: [
      {
        id: "handedness",
        defaultOptionId: "right",
        options: [
          { id: "right", label: "Right-handed", priceDeltaPence: 0 },
          { id: "left", label: "Left-handed", priceDeltaPence: 12_000 },
        ],
      },
    ],
  },

  {
    id: "construction",
    title: "Construction",
    shortLabel: "Construction",
    intro: "How the neck meets the body. This is the single biggest influence on sustain and upper-fret access.",
    groups: [
      {
        id: "construction",
        defaultOptionId: "bolt-on",
        options: [
          {
            id: "bolt-on",
            label: "Bolt-on",
            priceDeltaPence: 0,
            tooltip: "The neck is bolted to the body. Bright, punchy, and the easiest to service.",
          },
          {
            id: "set-neck",
            label: "Set neck",
            priceDeltaPence: 25_000,
            tooltip: "The neck is glued into the body. Warmer, with more sustain than a bolt-on.",
          },
          {
            id: "neck-thru",
            label: "Neck-thru",
            priceDeltaPence: 45_000,
            tooltip:
              "The neck runs the full length of the instrument, with the body wings glued either side. Maximum sustain and the cleanest upper-fret access.",
          },
        ],
      },
    ],
  },

  {
    id: "strings",
    title: "Strings",
    shortLabel: "Strings",
    intro: "How many strings the instrument is built for. This changes the neck width, the nut and the bridge spacing.",
    groups: [
      {
        id: "strings",
        defaultOptionId: "six",
        options: [
          { id: "six", label: "Six string", priceDeltaPence: 0 },
          { id: "seven", label: "Seven string", priceDeltaPence: 18_000 },
        ],
      },
    ],
  },

  {
    id: "colour",
    title: "Colour",
    shortLabel: "Colour",
    intro: "Pick a finish family first, then the colour. Transparent finishes show the grain of the timber underneath.",
    summaryGroupId: "colour",
    groups: [
      {
        id: "colourFamily",
        label: "Finish",
        defaultOptionId: COLOUR_FAMILIES.solid,
        options: [
          { id: COLOUR_FAMILIES.solid, label: "Solid", priceDeltaPence: 0 },
          { id: COLOUR_FAMILIES.metallic, label: "Metallic", priceDeltaPence: 9_000 },
          { id: COLOUR_FAMILIES.transparent, label: "Transparent", priceDeltaPence: 16_000 },
          { id: COLOUR_FAMILIES.burst, label: "Burst", priceDeltaPence: 22_000 },
        ],
      },
      {
        id: "colour",
        label: "Colour",
        defaultOptionId: "jet-black",
        options: colours,
        /* Only the chosen family's colours are shown, as on the Mod Shop. */
        optionVisible: (option, s) => option.family === s.colourFamily,
      },
    ],
  },

  {
    id: "fretboard",
    title: "Fretboard",
    shortLabel: "Fretboard",
    intro: "The timber under your fingers. It changes the feel as much as the sound.",
    groups: [
      {
        id: "fretboard",
        defaultOptionId: "maple",
        options: [
          {
            id: "maple",
            label: "Maple",
            priceDeltaPence: 0,
            tooltip: "Pale and dense, with a bright, tight attack. Usually finished rather than left bare.",
          },
          {
            id: "rosewood",
            label: "Rosewood",
            priceDeltaPence: 6_000,
            tooltip: "Mid-brown and open-grained. Warmer than maple, with a softer attack.",
          },
          {
            id: "ebony",
            label: "Ebony",
            priceDeltaPence: 14_000,
            tooltip: "Near-black and very dense. Slick under the fingers, with a fast, snappy response.",
          },
        ],
      },
    ],
  },

  {
    id: "inlay",
    title: "Inlay",
    shortLabel: "Inlay",
    intro: "The position markers set into the fretboard.",
    summaryGroupId: "inlay",
    groups: [
      {
        id: "inlay",
        label: "Style",
        defaultOptionId: "dots",
        options: [
          { id: "none", label: "None", priceDeltaPence: 0 },
          { id: "dots", label: "Dots", priceDeltaPence: 0 },
          { id: "offset-dots", label: "Offset dots", priceDeltaPence: 4_000 },
          { id: "blocks", label: "Blocks", priceDeltaPence: 18_000 },
        ],
      },
      {
        id: "inlayColour",
        label: "Inlay colour",
        defaultOptionId: "pearl",
        visibleWhen: (s) => s.inlay !== "none",
        options: [
          { id: "pearl", label: "Pearl", swatch: "#EDE9E0", priceDeltaPence: 0 },
          { id: "black-pearl", label: "Black Pearl", swatch: "#2B2E33", priceDeltaPence: 3_000 },
          { id: "abalone", label: "Abalone", swatch: "#3E7C8C", priceDeltaPence: 7_500 },
        ],
      },
    ],
  },

  {
    id: "binding",
    title: "Binding",
    shortLabel: "Binding",
    intro: "A trim run around the edge of the body and neck. Decorative, and it takes considerable hand work.",
    groups: [
      {
        id: "binding",
        defaultOptionId: "none",
        options: [
          { id: "none", label: "None", priceDeltaPence: 0 },
          { id: "cream", label: "Cream", swatch: "#E8DCC0", priceDeltaPence: 12_000 },
          { id: "black", label: "Black", swatch: "#141414", priceDeltaPence: 12_000 },
          { id: "natural", label: "Natural wood", swatch: "#C2A277", priceDeltaPence: 16_000 },
        ],
      },
    ],
  },

  {
    id: "headstock",
    title: "Headstock",
    shortLabel: "Headstock",
    intro: "How the headstock is finished, and the colour of the logo on it.",
    summaryGroupId: "headstockFinish",
    groups: [
      {
        id: "headstockFinish",
        label: "Finish",
        /*
         * Black rather than matched, so the untouched default configuration
         * sums exactly to BASE_PRICE_PENCE. Any default carrying a delta makes
         * the advertised "from" price a number the builder never actually
         * opens at.
         */
        defaultOptionId: "black",
        options: [
          { id: "matched", label: "Matched to body", priceDeltaPence: 6_000 },
          { id: "black", label: "Black", priceDeltaPence: 0 },
          { id: "natural", label: "Natural", priceDeltaPence: 0 },
          { id: "transparent", label: "Transparent", priceDeltaPence: 4_000 },
        ],
      },
      {
        id: "logoColour",
        label: "Logo colour",
        defaultOptionId: "silver",
        options: [
          { id: "silver", label: "Silver", swatch: "#C6C9CC", priceDeltaPence: 0 },
          { id: "gold", label: "Gold", swatch: "#B99A4E", priceDeltaPence: 3_500 },
          { id: "black", label: "Black", swatch: "#141414", priceDeltaPence: 0 },
        ],
        /* A black logo disappears on a black or transparent headstock. */
        optionAvailable: (option, s) =>
          option.id !== "black" ||
          !["black", "transparent"].includes(s.headstockFinish),
        unavailableNote:
          "A black logo is not available on a black or transparent headstock — it would not be visible.",
      },
    ],
  },

  {
    id: "bridge",
    title: "Bridge",
    shortLabel: "Bridge",
    intro: "Fixed or floating. This decides whether the instrument has a whammy bar, and how it holds tuning.",
    groups: [
      {
        id: "bridge",
        defaultOptionId: "hardtail",
        options: [
          {
            id: "hardtail",
            label: "Hardtail",
            priceDeltaPence: 0,
            tooltip: "A fixed bridge. No vibrato, but the most stable tuning and the simplest string changes.",
          },
          { id: "tremolo", label: "Two-point tremolo", priceDeltaPence: 18_000 },
          {
            id: "double-locking",
            label: "Double-locking tremolo",
            priceDeltaPence: 32_000,
            tooltip:
              "Locks the strings at both the nut and the bridge. Holds tuning through heavy vibrato use, at the cost of slower string changes.",
          },
        ],
      },
    ],
  },

  {
    id: "hardware",
    title: "Hardware",
    shortLabel: "Hardware",
    intro: "The finish on the bridge, tuners and control knobs.",
    groups: [
      {
        id: "hardware",
        defaultOptionId: "chrome",
        options: [
          { id: "chrome", label: "Chrome", swatch: "#C6C9CC", priceDeltaPence: 0 },
          { id: "black", label: "Black", swatch: "#1A1A1A", priceDeltaPence: 6_000 },
          { id: "gold", label: "Gold", swatch: "#B99A4E", priceDeltaPence: 9_000 },
        ],
      },
    ],
  },
];

/*
 * Derived rather than hardcoded. It was 11 in Stage 3a on the assumption that
 * model selection counted as step one, but the builder opens pre-set to the
 * Element and never asks — so a counter reading "01 / 11" would never have
 * reached eleven.
 */
export const TOTAL_STEPS = builderSteps.length;
