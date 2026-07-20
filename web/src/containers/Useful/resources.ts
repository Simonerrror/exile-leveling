export type ResourceCategoryId =
  "calculators" | "planning" | "trade" | "analytics" | "other";

export type Resource = Readonly<{
  id: string;
  category: ResourceCategoryId;
  title: string;
  url: string;
  domain: string;
  note?: "login" | "featured";
}>;

export const resources = [
  {
    id: "blight-oils",
    category: "calculators",
    title: "Blight Oils Calculator",
    url: "https://blight.raelys.com/",
    domain: "blight.raelys.com",
  },
  {
    id: "chromatic",
    category: "calculators",
    title: "Chromatic Calculator",
    url: "https://siveran.github.io/calc.html",
    domain: "siveran.github.io",
  },
  {
    id: "timeless-jewel",
    category: "calculators",
    title: "Timeless Jewel Viewer",
    url: "https://vilsol.github.io/timeless-jewels/",
    domain: "vilsol.github.io",
  },
  {
    id: "cluster-jewel",
    category: "calculators",
    title: "Cluster Jewel Calculator",
    url: "https://theodorejbieber.github.io/PoEClusterJewelCalculator/",
    domain: "theodorejbieber.github.io",
  },
  {
    id: "craft-of-exile",
    category: "calculators",
    title: "Craft of Exile",
    url: "https://www.craftofexile.com/",
    domain: "www.craftofexile.com",
  },
  {
    id: "filterblade",
    category: "planning",
    title: "FilterBlade",
    url: "https://www.filterblade.xyz/",
    domain: "www.filterblade.xyz",
  },
  {
    id: "poe-re",
    category: "planning",
    title: "PoE.re",
    url: "https://poe.re/",
    domain: "poe.re",
  },
  {
    id: "poe-planner",
    category: "planning",
    title: "PoE Planner",
    url: "https://poeplanner.com/",
    domain: "poeplanner.com",
  },
  {
    id: "tft-bulk",
    category: "trade",
    title: "TFT Bulk Selling Tool",
    url: "https://the-forbidden-trove.github.io/bulk-selling-tool/",
    domain: "the-forbidden-trove.github.io",
  },
  {
    id: "trade-extension",
    category: "trade",
    title: "PoE Trade Extension",
    url: "https://chromewebstore.google.com/detail/poe-trade-extension/bikeebdigkompjnpcljicocidefgbhgl",
    domain: "chromewebstore.google.com",
  },
  {
    id: "awakened-trade",
    category: "trade",
    title: "Awakened PoE Trade",
    url: "https://github.com/SnosMe/awakened-poe-trade",
    domain: "github.com",
  },
  {
    id: "wealthy-exile",
    category: "analytics",
    title: "Wealthy Exile",
    url: "https://wealthyexile.com/",
    domain: "wealthyexile.com",
  },
  {
    id: "poe-ninja",
    category: "analytics",
    title: "poe.ninja",
    url: "https://poe.ninja/",
    domain: "poe.ninja",
  },
  {
    id: "poe-leveling",
    category: "other",
    title: "PoE-leveling",
    url: "https://poe-leveling.com/",
    domain: "poe-leveling.com",
  },
  {
    id: "merchant-tabs",
    category: "other",
    title: "Merchant Tabs",
    url: "https://www.pathofexile.com/my-account/merchants-tabs",
    domain: "www.pathofexile.com",
    note: "login",
  },
  {
    id: "map-preset",
    category: "other",
    title: "Current-league map preset",
    url: "https://ru.pathofexile.com/trade/search/Mirage/mkJBkBQeT6",
    domain: "ru.pathofexile.com",
    note: "featured",
  },
] as const satisfies readonly Resource[];

export type ResourceId = (typeof resources)[number]["id"];

export const resourceCategories = [
  {
    id: "calculators",
    resourceIds: [
      "blight-oils",
      "chromatic",
      "timeless-jewel",
      "cluster-jewel",
      "craft-of-exile",
    ],
  },
  {
    id: "planning",
    resourceIds: ["filterblade", "poe-re", "poe-planner"],
  },
  {
    id: "trade",
    resourceIds: ["tft-bulk", "trade-extension", "awakened-trade"],
  },
  {
    id: "analytics",
    resourceIds: ["wealthy-exile", "poe-ninja"],
  },
  {
    id: "other",
    resourceIds: ["poe-leveling", "merchant-tabs", "map-preset"],
  },
] as const satisfies readonly Readonly<{
  id: ResourceCategoryId;
  resourceIds: readonly ResourceId[];
}>[];

export const heistBranches = [
  ["Tibbs", "Tullina", "Nenet"],
  ["Karst", "Huck", "Niles", "Vinderi", "Gianna"],
] as const;

export type CheatSheet = Readonly<{
  id: string;
  filename: string;
}>;

export const cheatSheets = [
  { id: "essence", filename: "essence-visual-reference.png" },
  { id: "sanctum", filename: "sanctum-room-reference.png" },
  { id: "vendor-recipes", filename: "vendor-recipes-reference.png" },
] as const satisfies readonly CheatSheet[];
