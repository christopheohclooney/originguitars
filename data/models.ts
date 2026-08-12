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

/*
 * The Element's base build — the price of the instrument with every default
 * option taken and nothing added.
 *
 * Named and exported rather than written into the model entry below, because
 * two things have to be this same number: the catalogue's "from £799" and the
 * total the builder opens at. They used to be separate literals — £799 here
 * and £1,899 in data/options.ts — so a visitor read one figure on Home and
 * watched the builder open at another. Derived from one constant, they cannot
 * disagree again, whatever the real number turns out to be.
 */
export const ELEMENT_BASE_PENCE = 79_900;

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
  /*
   * The "from" price — the base build with nothing added. Lives here rather
   * than on the page that shows it, because Home's card grid and the hero's
   * headline figure are the same number and must not be able to disagree.
   */
  fromPricePence: number;
  description: string;
  specs: ModelSpec[];
  /*
   * The detail page's fields, optional because a coming-soon model has none
   * of them — and deliberately so. Nothing is invented for Lance or the bass:
   * a model earns a detail page by having real content to fill one, and
   * modelHref below is what expresses that as a rule rather than a habit.
   */
  /** The line under the name in the detail page's pinned panel. */
  tagline?: string;
  /*
   * The Details section's descriptive copy — what the instrument is, not the
   * card blurb. Separate from `description`, which stays the one-paragraph
   * catalogue entry: the two read at different lengths in different places
   * and sharing a field would force one page to carry the other's copy.
   */
  overview?: string[];
  /** The Features accordion panel, one line each. */
  features?: string[];
};

export const models: Model[] = [
  {
    slug: "element",
    name: "Element",
    subtitle: "Super strat",
    status: "available",
    fromPricePence: ELEMENT_BASE_PENCE,
    description:
      "The shape Origin started with. A contemporary double-cut built for players who want reach and comfort without the instrument announcing itself. Every option in the builder starts from this base spec — change what matters to you and leave the rest.",
    tagline: "Super strat — the shape Origin started with",
    overview: [
      "The Element is a contemporary double-cut built for players who want reach and comfort without the instrument announcing itself. The body is contoured where your arm and ribs actually land, the heel is carved away so the top frets are somewhere you play rather than somewhere you visit, and the whole geometry is tuned for a player who moves.",
      "It is also the base every build starts from. Everything listed below is the standard specification — the guitar you get if you change nothing — and every line of it is a decision the builder lets you take back. Swap the timbers, the construction, the pickups, the finish; the Element stays the Element.",
      "Made to order in every case. Nothing is built until you order it, which is why the option list runs as deep as it does and why the lead time is honest rather than optimistic.",
    ],
    features: [
      "Contoured double-cut body with a sculpted heel for upper-fret access",
      "Bolt-on construction as standard, with set-neck and neck-through options in the builder",
      "Two humbuckers, wired for clarity at high gain",
      "Hardtail bridge with through-body stringing",
      "Locking tuners at an 18:1 ratio",
      "Assembled and inspected by hand in the UK before it ships",
    ],
    specs: [
      { label: "Shape", value: "Double-cut, contoured" },
      { label: "Body", value: "Alder" },
      { label: "Neck", value: "Maple, bolt-on" },
      { label: "Neck profile", value: "Slim C" },
      { label: "Scale length", value: "25.5\"" },
      { label: "Fretboard", value: "Rosewood" },
      { label: "Radius", value: "12\"–16\" compound" },
      { label: "Frets", value: "24, jumbo stainless" },
      { label: "Nut", value: "Graphite, 42mm" },
      { label: "Pickups", value: "Humbucker / humbucker" },
      { label: "Controls", value: "Volume, tone, 3-way" },
      { label: "Bridge", value: "Hardtail, string-through" },
      { label: "Tuners", value: "Locking, 18:1" },
      { label: "Hardware finish", value: "Black" },
    ],
  },
  {
    slug: "lance",
    name: "Lance",
    subtitle: "V shape",
    status: "coming-soon",
    fromPricePence: 89_900,
    description:
      "A V built to the same brief as the Element: made to order, no signature-artist premium. In development now.",
    specs: [],
  },
  {
    slug: "element-bass",
    name: "Element (Bass)",
    subtitle: "Four string",
    status: "coming-soon",
    fromPricePence: 89_900,
    description:
      "The Element geometry carried across to a bass, with its own option set. In development now.",
    specs: [],
  },
];

export const availableModels = models.filter((m) => m.status === "available");

/*
 * Where a model's detail page lives, or null if it has none to link to.
 *
 * One place decides which models are reachable, so Home's cards, the
 * catalogue and the detail page's own "other models" strip cannot disagree.
 * Keyed off status rather than a hand-kept list: a model earns a detail page
 * by being orderable, which is also what guarantees it has real content —
 * /models/[slug] prerenders exactly the available set and 404s the rest.
 */
export function modelHref(model: Model): string | null {
  return model.status === "available" ? `/models/${model.slug}` : null;
}
export const comingSoonModels = models.filter(
  (m) => m.status === "coming-soon",
);

/*
 * The cheapest thing you can actually order, for the "from" figure on Home.
 * Derived rather than typed in: a catalogue where the headline price is not
 * the lowest one in the grid is a catalogue that has drifted.
 */
export const fromPricePence = Math.min(...models.map((m) => m.fromPricePence));
