/*
 * The option list, prices, defaults and rules — "Flow 1", the final list.
 *
 * One source for both the builder and the spec sheet, so the two cannot
 * disagree about what can be ordered or what it costs.
 *
 * Money is stored in pence as integers, never pounds as floats. Stripe expects
 * the smallest currency unit, and integer arithmetic avoids the rounding drift
 * that bites price calculators built on floating point.
 */

import { ELEMENT_BASE_PENCE } from "@/data/models";
import type { Selections } from "@/lib/pricing";

export type BuilderOption = {
  id: string;
  label: string;
  /*
   * A label that depends on other choices — the EMG 81 reads "EMG 81-7" on a
   * seven-string. Read through `optionLabel` in lib/pricing.ts, never
   * directly, so the option, the summary and the PDF all agree.
   */
  labelWhen?: (selections: Selections) => string | undefined;
  description?: string;
  priceDeltaPence: number;
  /** Hex value — presence switches this option to swatch rendering. */
  swatch?: string;
  /*
   * A CSS background drawn in place of the flat hex, for finishes a single
   * colour misrepresents: bursts, figured maple, crackle, metallic sheen. The
   * hex above stays the finish's reference colour.
   */
  swatchFill?: string;
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

/*
 * The builder's starting total, read from the catalogue rather than restated.
 *
 * The builder opens pre-set to the Element and never asks which model, so the
 * Element's base build *is* the builder's base price. Every default option
 * below is zero-delta, which is what makes the opening total exactly this
 * figure rather than this figure plus whatever the defaults happen to cost.
 */
export const BASE_PRICE_PENCE = ELEMENT_BASE_PENCE;

/* --------------------------------------------------------------- colours */

const COLOUR_FAMILIES = {
  solid: "solid",
  metallic: "metallic",
  transparent: "transparent",
  crackle: "crackle",
} as const;

/*
 * Finish families that put the headstock on black by default and rule out a
 * black logo. Shared by the logo group below and lib/builder-rules.ts.
 */
export const BLACK_HEADSTOCK_FAMILIES: readonly string[] = [
  COLOUR_FAMILIES.transparent,
  COLOUR_FAMILIES.crackle,
];

/* A centre-lit sheen, so a metallic reads as metal rather than as a solid. */
const sheen = (light: string, base: string, dark: string) =>
  `radial-gradient(circle at 35% 30%, ${light} 0%, ${base} 55%, ${dark} 100%)`;

/* A burst: the light centre falling to a dark edge, as on the body. */
const burst = (centre: string, mid: string, edge: string) =>
  `radial-gradient(circle at 50% 45%, ${centre} 0%, ${mid} 55%, ${edge} 100%)`;

/* Figure laid over the burst: flame as fine bands, quilt as soft pools. */
const flame = (centre: string, mid: string, edge: string) =>
  `repeating-linear-gradient(100deg, rgba(255,255,255,0.1) 0 1.5px, rgba(255,255,255,0) 1.5px 5px), ${burst(centre, mid, edge)}`;
const QUILT_BILLOW =
  "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,255,255,0.13), rgba(255,255,255,0) 75%)";
const quilt = (centre: string, mid: string, edge: string) =>
  `${QUILT_BILLOW} 0 0 / 15px 12px, ${QUILT_BILLOW} 7.5px 6px / 15px 12px, ${burst(centre, mid, edge)}`;

/* Crackle: the colour broken by black fissures. */
const CRACK = "#121212";
const crackle = (base: string) =>
  [
    `linear-gradient(32deg, transparent 0 44%, ${CRACK} 44% 47%, transparent 47%)`,
    `linear-gradient(-58deg, transparent 0 58%, ${CRACK} 58% 61%, transparent 61%)`,
    `linear-gradient(80deg, transparent 0 24%, ${CRACK} 24% 26.5%, transparent 26.5%)`,
    base,
  ].join(", ");

/* Colour prices sit on the family; every colour inside one is included. */
const colours: BuilderOption[] = [
  // Solid
  { id: "black", label: "Black", swatch: "#0E0E0E", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "white", label: "White", swatch: "#F2F1EC", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "ruby-red", label: "Ruby Red", swatch: "#9B111E", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "vintage-cream", label: "Vintage Cream", swatch: "#EFE3C2", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "seafoam-green", label: "Seafoam Green", swatch: "#9FD3BF", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "bumblebee-yellow", label: "Bumblebee Yellow", swatch: "#F4C20D", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "british-racing-green", label: "British Racing Green", swatch: "#004225", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "neon-green", label: "Neon Green", swatch: "#39FF14", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "aubergine-purple", label: "Aubergine Purple", swatch: "#3B0A3D", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "orange", label: "Orange", swatch: "#E8601C", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "shell-pink", label: "Shell Pink", swatch: "#F1C3BE", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "olive", label: "Olive", swatch: "#5E6232", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },
  { id: "royal-blue", label: "Royal Blue", swatch: "#23419B", priceDeltaPence: 0, family: COLOUR_FAMILIES.solid },

  // Metallic
  { id: "metallic-grey", label: "Grey", swatch: "#7C7F84", swatchFill: sheen("#B5B8BC", "#7C7F84", "#4A4D51"), priceDeltaPence: 0, family: COLOUR_FAMILIES.metallic },
  { id: "metallic-red", label: "Red", swatch: "#A3141F", swatchFill: sheen("#E0505A", "#A3141F", "#5E0A11"), priceDeltaPence: 0, family: COLOUR_FAMILIES.metallic },
  { id: "metallic-blue", label: "Blue", swatch: "#1F4FA3", swatchFill: sheen("#6A93DA", "#1F4FA3", "#0F2A5C"), priceDeltaPence: 0, family: COLOUR_FAMILIES.metallic },

  // Transparent — figured maple under a tinted finish
  { id: "flame-maple-black", label: "Flame Maple Black", swatch: "#1C1C1C", swatchFill: flame("#3C3C3C", "#1C1C1C", "#070707"), priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "flame-maple-honey-burst", label: "Flame Maple Honey Burst", swatch: "#D48A2C", swatchFill: flame("#F2C46B", "#D48A2C", "#6E3A10"), priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "flame-maple-tobacco-sunburst", label: "Flame Maple Tobacco Sunburst", swatch: "#8A4F1C", swatchFill: flame("#E3A93F", "#8A4F1C", "#1E0F08"), priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "flame-maple-red-burst", label: "Flame Maple Red Burst", swatch: "#B3202A", swatchFill: flame("#F06A4E", "#B3202A", "#3E070C"), priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "flame-maple-blue-burst", label: "Flame Maple Blue Burst", swatch: "#2A63B0", swatchFill: flame("#7FB4E8", "#2A63B0", "#0B1E45"), priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "quilted-maple-amber-burst", label: "Quilted Maple Amber Burst", swatch: "#D9851F", swatchFill: quilt("#F7C25C", "#D9851F", "#7A3E0C"), priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "quilted-maple-tobacco-sunburst", label: "Quilted Maple Tobacco Sunburst", swatch: "#94551E", swatchFill: quilt("#E8B04A", "#94551E", "#22110A"), priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "quilted-maple-red-burst", label: "Quilted Maple Red Burst", swatch: "#BA2530", swatchFill: quilt("#F27458", "#BA2530", "#440910"), priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "quilted-maple-blue-burst", label: "Quilted Maple Blue Burst", swatch: "#2F6BB8", swatchFill: quilt("#86BCEC", "#2F6BB8", "#0D2149"), priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },
  { id: "quilted-maple-black", label: "Quilted Maple Black", swatch: "#1E1E1E", swatchFill: quilt("#424242", "#1E1E1E", "#080808"), priceDeltaPence: 0, family: COLOUR_FAMILIES.transparent },

  // Crackle
  { id: "yellow-crackle", label: "Yellow Crackle", swatch: "#F2C200", swatchFill: crackle("#F2C200"), priceDeltaPence: 0, family: COLOUR_FAMILIES.crackle },
  { id: "white-crackle", label: "White Crackle", swatch: "#EDEDE8", swatchFill: crackle("#EDEDE8"), priceDeltaPence: 0, family: COLOUR_FAMILIES.crackle },
  { id: "red-crackle", label: "Red Crackle", swatch: "#C4161C", swatchFill: crackle("#C4161C"), priceDeltaPence: 0, family: COLOUR_FAMILIES.crackle },
  { id: "blue-crackle", label: "Blue Crackle", swatch: "#1F57B8", swatchFill: crackle("#1F57B8"), priceDeltaPence: 0, family: COLOUR_FAMILIES.crackle },
];

/* ----------------------------------------------------------------- steps */

export const builderSteps: BuilderStep[] = [
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
            id: "neck-thru",
            label: "Neck-thru",
            priceDeltaPence: 20_000,
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
          { id: "six", label: "6-string", priceDeltaPence: 0 },
          { id: "seven", label: "7-string", priceDeltaPence: 10_000 },
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
          { id: COLOUR_FAMILIES.metallic, label: "Metallic", priceDeltaPence: 5_000 },
          { id: COLOUR_FAMILIES.transparent, label: "Transparent", priceDeltaPence: 10_000 },
          { id: COLOUR_FAMILIES.crackle, label: "Crackle", priceDeltaPence: 10_000 },
        ],
      },
      {
        id: "colour",
        label: "Colour",
        defaultOptionId: "black",
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
        defaultOptionId: "ebony",
        options: [
          {
            id: "ebony",
            label: "Ebony",
            priceDeltaPence: 0,
            tooltip: "Near-black and very dense. Slick under the fingers, with a fast, snappy response.",
          },
          {
            id: "maple",
            label: "Maple",
            priceDeltaPence: 0,
            tooltip: "Pale and dense, with a bright, tight attack. Usually finished rather than left bare.",
          },
          {
            id: "rosewood",
            label: "Rosewood",
            priceDeltaPence: 0,
            tooltip: "Mid-brown and open-grained. Warmer than maple, with a softer attack.",
          },
        ],
      },
    ],
  },

  {
    id: "inlay",
    title: "Inlays",
    shortLabel: "Inlays",
    intro: "The position markers set into the fretboard.",
    summaryGroupId: "inlay",
    groups: [
      {
        id: "inlay",
        label: "Inlays",
        defaultOptionId: "none",
        options: [
          { id: "none", label: "None", priceDeltaPence: 0 },
          { id: "dots", label: "Dots", priceDeltaPence: 2_000 },
          { id: "sharkfin", label: "Sharkfin", priceDeltaPence: 3_000 },
        ],
      },
      {
        id: "inlayColour",
        label: "Inlay colour",
        defaultOptionId: "black",
        /* No inlay, no colour — and nothing charged for one. */
        visibleWhen: (s) => s.inlay !== "none",
        options: [
          { id: "black", label: "Black", swatch: "#141414", priceDeltaPence: 0 },
          {
            id: "pearloid",
            label: "Pearloid",
            swatch: "#EAE6DC",
            swatchFill:
              "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #EAE6DC 45%, #C9C2B2 100%)",
            priceDeltaPence: 0,
          },
        ],
      },
    ],
  },

  {
    id: "binding",
    title: "Fretboard binding",
    shortLabel: "Binding",
    groups: [
      {
        id: "binding",
        defaultOptionId: "none",
        options: [
          { id: "none", label: "None", priceDeltaPence: 0 },
          { id: "single-black", label: "Single Black", priceDeltaPence: 5_000 },
          { id: "single-white", label: "Single White", priceDeltaPence: 5_000 },
        ],
      },
    ],
  },

  {
    id: "headstock",
    title: "Headstock",
    shortLabel: "Headstock",
    intro: "Which way the headstock faces. Reversed puts the low string's tuner furthest from the nut.",
    groups: [
      {
        id: "headstock",
        defaultOptionId: "normal",
        options: [
          { id: "normal", label: "Normal", priceDeltaPence: 0 },
          { id: "reversed", label: "Reversed", priceDeltaPence: 0 },
        ],
      },
    ],
  },

  {
    id: "headstockFinish",
    title: "Headstock finish",
    shortLabel: "Headstock finish",
    groups: [
      {
        id: "headstockFinish",
        defaultOptionId: "black",
        options: [
          { id: "black", label: "Black", priceDeltaPence: 0 },
          { id: "matching", label: "Matching body", priceDeltaPence: 2_000 },
        ],
      },
    ],
  },

  {
    id: "logoColour",
    title: "Origin logo colour",
    shortLabel: "Logo",
    groups: [
      {
        id: "logoColour",
        defaultOptionId: "white",
        options: [
          { id: "black", label: "Black", swatch: "#141414", priceDeltaPence: 0 },
          { id: "white", label: "White", swatch: "#F2F2F2", priceDeltaPence: 0 },
          { id: "silver", label: "Silver", swatch: "#C6C9CC", priceDeltaPence: 0 },
          { id: "gold", label: "Gold", swatch: "#B99A4E", priceDeltaPence: 0 },
        ],
        /* A black logo disappears on a black headstock, and on the finishes that force one. */
        optionAvailable: (option, s) =>
          option.id !== "black" ||
          (s.headstockFinish !== "black" &&
            !BLACK_HEADSTOCK_FAMILIES.includes(s.colourFamily)),
        unavailableNote:
          "A black logo isn't available on a black headstock or on transparent and crackle finishes.",
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
        defaultOptionId: "tom-fixed",
        options: [
          {
            id: "tom-fixed",
            label: "String-thru TOM-style fixed bridge",
            priceDeltaPence: 0,
            tooltip: "A fixed bridge. No vibrato, but the most stable tuning and the simplest string changes.",
          },
          {
            id: "floyd-rose-1000",
            label: "Floyd Rose 1000",
            priceDeltaPence: 10_000,
            tooltip:
              "Locks the strings at both the nut and the bridge. Holds tuning through heavy vibrato use, at the cost of slower string changes.",
          },
        ],
      },
    ],
  },

  {
    id: "tuners",
    title: "Tuners",
    shortLabel: "Tuners",
    intro: "Locking tuners clamp the string at the post, for faster string changes and steadier tuning.",
    groups: [
      {
        id: "tuners",
        defaultOptionId: "standard",
        options: [
          { id: "standard", label: "Standard", priceDeltaPence: 0 },
          { id: "locking", label: "Locking", priceDeltaPence: 4_000 },
        ],
      },
    ],
  },

  {
    id: "hardware",
    title: "Hardware colour",
    shortLabel: "Hardware",
    intro: "The finish on the bridge, tuners and control knobs.",
    groups: [
      {
        id: "hardware",
        defaultOptionId: "black",
        options: [
          { id: "black", label: "Black", swatch: "#1A1A1A", priceDeltaPence: 0 },
          { id: "chrome", label: "Chrome", swatch: "#C6C9CC", priceDeltaPence: 0 },
          { id: "gold", label: "Gold", swatch: "#B99A4E", priceDeltaPence: 3_000 },
        ],
      },
    ],
  },

  {
    id: "pickup",
    title: "Pickup",
    shortLabel: "Pickup",
    intro: "The stock Origin humbucker is passive. The EMG 81 is active, built for clarity at high gain.",
    groups: [
      {
        id: "pickup",
        defaultOptionId: "stock",
        options: [
          { id: "stock", label: "Stock passive", priceDeltaPence: 0 },
          {
            id: "emg-81",
            label: "EMG 81",
            /* The seven-string version is its own part. */
            labelWhen: (s) => (s.strings === "seven" ? "EMG 81-7" : undefined),
            priceDeltaPence: 9_000,
          },
        ],
      },
    ],
  },
];

/* Derived rather than hardcoded, so the counter always reaches the end. */
export const TOTAL_STEPS = builderSteps.length;
