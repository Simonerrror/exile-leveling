export const REGEX_TOOL_IDS = [
  "vendor", "maps", "items", "flasks", "heist",
  "expedition", "beast", "scarabs", "tattoos", "runegrafts", "jewels",
] as const;

export type RegexToolId = (typeof REGEX_TOOL_IDS)[number];
export type RegexDataLocale = "en" | "ru";

export const LEGACY_SOURCE_ALLOWLIST = [
  "src/generated/gems/Generated.Gems.English.ts",
  "src/generated/gems/Generated.Gems.Russian.ts",
  "src/generated/mapmods/Generated.MapModsV3.ENGLISH.ts",
  "src/generated/mapmods/Generated.MapModsV3.RUSSIAN.ts",
  "src/generated/GeneratedItemMods.ts",
  "src/generated/GeneratedItemBases.ts",
  "src/generated/repoe/GeneratedRussianItems.ts",
  "src/generated/GeneratedFlaskMods.ts",
  "src/generated/repoe/GeneratedRussianFlaskMods.ts",
  "src/generated/GeneratedExpedition.ts",
  "src/generated/GeneratedHeist.ts",
  "src/generated/GeneratedBeastRegex.ts",
  "src/generated/GeneratedScarabs.ts",
  "src/generated/GeneratedTattoo.ts",
  "src/generated/GeneratedRunegraft.ts",
  "src/generated/GeneratedJewel.ts",
  "src/generated/repoe/GeneratedRussianContent.ts",
  "src/generated/mapmods/trade/TradeStatIdMatching.json",
] as const;

export const EXPECTED_SHARD_FILES = REGEX_TOOL_IDS.flatMap((tool) =>
  (["en", "ru"] as const).map((locale) => `${tool}.${locale}.json`),
).sort();
