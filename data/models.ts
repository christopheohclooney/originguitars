/*
 * ⚠️  PLACEHOLDER SPECIFICATIONS — NOT CONFIRMED BY LARRY.
 *
 * The build spec and user flow doc describe which fields a model listing needs
 * (shape, scale length, body/neck materials, pickup, description) but give no
 * actual values. Everything below is invented so the layout can be judged at
 * realistic content lengths. Every `value` string here needs replacing with
 * Larry's real figures before this page goes anywhere near production.
 *
 * Tempest and Cleaver are deliberately absent — on hold per the user flow doc,
 * held back until there is revenue to justify the design cost and to stop
 * people delaying an Element order to wait for a shape that is far off.
 */

export type ModelStatus = "available" | "coming-soon";

export type ModelSpec = {
  label: string;
  value: string;
};

export type Model = {
  slug: string;
  name: string;
  subtitle: string;
  status: ModelStatus;
  description: string;
  specs: ModelSpec[];
};

export const models: Model[] = [
  {
    slug: "element",
    name: "Element",
    subtitle: "Super strat",
    status: "available",
    description:
      "The shape Origin started with. A contemporary double-cut built for players who want reach and comfort without the instrument announcing itself. Every option in the builder starts from this base spec — change what matters to you and leave the rest.",
    specs: [
      { label: "Shape", value: "Double-cut, contoured" },
      { label: "Scale length", value: "25.5\"" },
      { label: "Body", value: "Alder" },
      { label: "Neck", value: "Maple, bolt-on" },
      { label: "Fretboard", value: "Rosewood, 24 frets" },
      { label: "Pickups", value: "Humbucker / humbucker" },
    ],
  },
  {
    slug: "lance",
    name: "Lance",
    subtitle: "V shape",
    status: "coming-soon",
    description:
      "A V built to the same brief as the Element: made to order, no signature-artist premium. In development now.",
    specs: [],
  },
  {
    slug: "element-bass",
    name: "Element Bass",
    subtitle: "Four string",
    status: "coming-soon",
    description:
      "The Element geometry carried across to a bass, with its own option set. In development now.",
    specs: [],
  },
];

export const availableModels = models.filter((m) => m.status === "available");
export const comingSoonModels = models.filter(
  (m) => m.status === "coming-soon",
);
