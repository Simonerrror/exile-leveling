export type ResourceCategoryId =
  "calculators" | "planning" | "trade" | "analytics";

export type Resource = Readonly<{
  id: string;
  category: ResourceCategoryId;
  name: string;
  url: string;
  domain: string;
  icon: string;
}>;

export const resources = [
  {
    id: "blight-oils",
    category: "calculators",
    name: "Blight Oils Calculator",
    url: "https://blight.raelys.com/",
    domain: "blight.raelys.com",
    icon: "https://web.poecdn.com/image/Art/2DItems/Currency/Oils/GoldenOil.png?scale=1",
  },
  {
    id: "chromatic",
    category: "calculators",
    name: "Chromatic Calculator",
    url: "https://siveran.github.io/calc.html",
    domain: "siveran.github.io",
    icon: "https://web.poecdn.com/image/Art/2DItems/Currency/CurrencyRerollSocketColours.png?scale=1",
  },
  {
    id: "timeless-jewel",
    category: "calculators",
    name: "Timeless Jewel Viewer",
    url: "https://vilsol.github.io/timeless-jewels/",
    domain: "vilsol.github.io",
    icon: "https://web.poecdn.com/image/Art/2DItems/Jewels/Timeless.png?scale=1",
  },
  {
    id: "cluster-jewel",
    category: "calculators",
    name: "Cluster Jewel Calculator",
    url: "https://theodorejbieber.github.io/PoEClusterJewelCalculator/",
    domain: "theodorejbieber.github.io",
    icon: "https://web.poecdn.com/image/Art/2DItems/Jewels/NewGemBase3.png?scale=1",
  },
  {
    id: "craft-of-exile",
    category: "calculators",
    name: "Craft of Exile",
    url: "https://www.craftofexile.com/",
    domain: "www.craftofexile.com",
    icon: "https://www.google.com/s2/favicons?domain=craftofexile.com&sz=128",
  },
  {
    id: "filterblade",
    category: "planning",
    name: "FilterBlade",
    url: "https://www.filterblade.xyz/",
    domain: "www.filterblade.xyz",
    icon: "https://www.filterblade.xyz/favicon.ico",
  },
  {
    id: "poe-planner",
    category: "planning",
    name: "PoE Planner",
    url: "https://poeplanner.com/",
    domain: "poeplanner.com",
    icon: "https://poeplanner.com/favicon.ico",
  },
  {
    id: "tft-bulk",
    category: "trade",
    name: "TFT Bulk Selling Tool",
    url: "https://the-forbidden-trove.github.io/bulk-selling-tool/",
    domain: "the-forbidden-trove.github.io",
    icon: "https://raw.githubusercontent.com/The-Forbidden-Trove/bulk-selling-tool/main/public/favicon.ico",
  },
  {
    id: "trade-extension",
    category: "trade",
    name: "PoE Trade Extension",
    url: "https://chromewebstore.google.com/detail/poe-trade-extension/bikeebdigkompjnpcljicocidefgbhgl",
    domain: "chromewebstore.google.com",
    icon: "https://lh3.googleusercontent.com/dYrkBNAwwO0fLyH2CBq0xHM0Wav5rxss8JPKmoIDOHSY9SGvKcrAPSzO-fKow7XndM_aZ4AbSYiNBJDCOAIwFWpm=s128-rj-sc0x00ffffff",
  },
  {
    id: "awakened-trade",
    category: "trade",
    name: "Awakened PoE Trade",
    url: "https://github.com/SnosMe/awakened-poe-trade",
    domain: "github.com",
    icon: "https://raw.githubusercontent.com/SnosMe/awakened-poe-trade/master/main/build/icons/64x64.png",
  },
  {
    id: "wealthy-exile",
    category: "analytics",
    name: "Wealthy Exile",
    url: "https://wealthyexile.com/",
    domain: "wealthyexile.com",
    icon: "https://wealthyexile.com/favicon.ico",
  },
  {
    id: "poe-ninja",
    category: "analytics",
    name: "poe.ninja",
    url: "https://poe.ninja/",
    domain: "poe.ninja",
    icon: "https://poe.ninja/favicons/favicon-96x96.png",
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
    resourceIds: ["filterblade", "poe-planner"],
  },
  {
    id: "trade",
    resourceIds: ["tft-bulk", "trade-extension", "awakened-trade"],
  },
  {
    id: "analytics",
    resourceIds: ["wealthy-exile", "poe-ninja"],
  },
] as const satisfies readonly Readonly<{
  id: ResourceCategoryId;
  resourceIds: readonly ResourceId[];
}>[];

export const heistBranches = [
  ["tibbs", "tullina", "nenet"],
  ["karst", "huck", "niles", "vinderi", "gianna"],
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
