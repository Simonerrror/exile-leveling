import type { RegexToken, RegexTokenCatalog } from "../data/types.js";
import { optimizeSafeCover } from "./safe-cover.js";
import { splitRegexIntoTwoPasses } from "./two-pass.js";
import type { RegexCompileResult, RegexLocale } from "./types.js";

interface MapOptimizationCandidate { ids: number[]; regex: string }
export interface MapRegexCatalog extends RegexTokenCatalog {
  optimizationTable?: Record<string, MapOptimizationCandidate>;
}

export interface MapRegexSettings {
  badIds: number[];
  goodIds: number[];
  allGoodMods: boolean;
  quantity: string;
  packsize: string;
  itemRarity: string;
  mapDropChance: string;
  optimizeQuant: boolean;
  optimizePacksize: boolean;
  optimizeQuality: boolean;
  displayNightmareMods: boolean;
  rarity: { normal: boolean; magic: boolean; rare: boolean; include: boolean };
  corrupted: { enabled: boolean; include: boolean };
  unidentified: { enabled: boolean; include: boolean };
  quality: {
    regular: string; currency: string; divination: string;
    rarity: string; packSize: string; scarab: string;
  };
  anyQuality: boolean;
  customText: { value: string; enabled: boolean };
}

export interface MapCompileResult extends RegexCompileResult {
  matchedIds: number[];
  locale: RegexLocale;
}

export function createDefaultMapSettings(): MapRegexSettings {
  return {
    badIds: [], goodIds: [], allGoodMods: true,
    quantity: "", packsize: "", itemRarity: "", mapDropChance: "",
    optimizeQuant: false, optimizePacksize: false, optimizeQuality: false,
    displayNightmareMods: true,
    rarity: { normal: true, magic: true, rare: true, include: true },
    corrupted: { enabled: false, include: true },
    unidentified: { enabled: false, include: false },
    quality: { regular: "", currency: "", divination: "", rarity: "", packSize: "", scarab: "" },
    anyQuality: true,
    customText: { value: "", enabled: true },
  };
}

const staticRegex = {
  en: {
    quantity: "m q.*", packsize: "iz.*", mapdrop: "re maps.*", itemrarity: "m rar.*",
    qualityRegular: "ty \\(Quantity\\):.*", qualityCurrency: "urr.*", qualityDivination: "div.*",
    qualityRarity: "ty\\).*", qualityPacksize: "ze\\).*", qualityScarab: "sca.*",
    rarityPrefix: "y: ", rarityNormal: "n", rarityMagic: "m", rarityRare: "r",
    corrupted: "pte", unidentified: "tified",
  },
  ru: {
    quantity: "Количество.*", packsize: "монстров.*", mapdrop: "ьше карт.*", itemrarity: "Редкость.*",
    qualityRegular: "во:.*", qualityCurrency: "люта\\)*", qualityDivination: "гадальных.*",
    qualityRarity: "сть\\).*", qualityPacksize: "ппы\\).*", qualityScarab: "беи\\).*",
    rarityPrefix: "Редкость: ", rarityNormal: "Обычный", rarityMagic: "Волшебный", rarityRare: "Редкий",
    corrupted: "оскв", unidentified: "неоп",
  },
} as const;

function generateNumberRegex(number: string, optimize: boolean): string {
  const digits = number.match(/\d/g);
  if (digits === null) return "";
  const quantity = optimize
    ? Math.floor(Number(digits.join("")) / 10) * 10
    : Number(digits.join(""));
  if (!Number.isFinite(quantity) || quantity === 0) return optimize && digits.length === 1 ? "." : "";
  if (quantity >= 100) {
    const value = String(quantity).padStart(3, "0");
    const hundreds = Number(value[0]);
    return hundreds >= 9 ? `${value[0]}..` : `[${value[0]}-9]..`;
  }
  if (quantity > 9) {
    const tens = Number(String(quantity)[0]);
    const ones = String(quantity)[1];
    if (ones === "0") return `([${tens}-9].|\\d..)`;
    if (tens === 9) return `(9[${ones}-9]|\\d..)`;
    return `(${tens}[${ones}-9]|[${tens + 1}-9].|\\d..)`;
  }
  return `([${quantity}-9]|\\d..?)`;
}

function tokenById(catalog: MapRegexCatalog, id: number): RegexToken | undefined {
  return catalog.tokens.find((token) => token.id === id);
}

function availableIds(settings: MapRegexSettings, ids: number[], catalog: MapRegexCatalog): number[] {
  return Array.from(new Set(ids))
    .filter((id) => {
      const token = tokenById(catalog, id);
      return token !== undefined && (settings.displayNightmareMods || token.options.nm !== true);
    })
    .sort((left, right) => left - right);
}

function badMods(settings: MapRegexSettings, catalog: MapRegexCatalog): string {
  const ids = availableIds(settings, settings.badIds, catalog);
  if (ids.length === 0) return "";
  let patterns: string[];
  try {
    patterns = optimizeSafeCover({
      selectedIds: ids,
      corpus: catalog.tokens.map((token) => ({ id: token.id, pattern: token.regex, text: token.rawText })),
      candidates: Object.values(catalog.optimizationTable ?? {}).map(({ ids, regex }) => ({ ids, pattern: regex })),
    }).patterns;
  } catch {
    patterns = ids.map((id) => tokenById(catalog, id)?.regex).filter((value): value is string => value !== undefined);
  }
  return `"!${patterns.join("|")}"`;
}

function goodMods(settings: MapRegexSettings, catalog: MapRegexCatalog): string {
  const patterns = availableIds(settings, settings.goodIds, catalog)
    .map((id) => tokenById(catalog, id)?.regex)
    .filter((value): value is string => value !== undefined);
  if (patterns.length === 0) return "";
  return settings.allGoodMods
    ? patterns.map((pattern) => pattern.includes(" ") ? `"${pattern}"` : pattern).join(" ")
    : `"${Array.from(new Set(patterns)).join("|")}"`;
}

function addQuantifier(prefix: string, value: string): string {
  return value === "" ? "" : `"${prefix}${value}%"`;
}

function rarityClause(settings: MapRegexSettings, locale: RegexLocale): string {
  const stat = staticRegex[locale];
  const values = [
    settings.rarity.normal ? stat.rarityNormal : "",
    settings.rarity.magic ? stat.rarityMagic : "",
    settings.rarity.rare ? stat.rarityRare : "",
  ].filter(Boolean);
  if (values.length === 3 && settings.rarity.include) return "";
  if (values.length === 0) return "";
  const pattern = values.length === 1 ? values[0] : `(${values.join("|")})`;
  return `"${settings.rarity.include ? "" : "!"}${stat.rarityPrefix}${pattern}"`;
}

function qualityClause(settings: MapRegexSettings, locale: RegexLocale): string {
  const stat = staticRegex[locale];
  const entries = [
    addQuantifier(stat.qualityRegular, generateNumberRegex(settings.quality.regular, settings.optimizeQuality)),
    addQuantifier(stat.qualityCurrency, generateNumberRegex(settings.quality.currency, settings.optimizeQuality)),
    addQuantifier(stat.qualityDivination, generateNumberRegex(settings.quality.divination, settings.optimizeQuality)),
    addQuantifier(stat.qualityRarity, generateNumberRegex(settings.quality.rarity, settings.optimizeQuality)),
    addQuantifier(stat.qualityPacksize, generateNumberRegex(settings.quality.packSize, settings.optimizeQuality)),
    addQuantifier(stat.qualityScarab, generateNumberRegex(settings.quality.scarab, settings.optimizeQuality)),
  ].filter(Boolean);
  if (!settings.anyQuality) return entries.join(" ");
  return entries.length === 0 ? "" : `"${entries.map((entry) => entry.slice(1, -1)).join("|")}"`;
}

export function compileMapRegex(
  settings: MapRegexSettings,
  catalog: MapRegexCatalog,
  locale: RegexLocale,
  options: { maxLength?: number } = {},
): MapCompileResult {
  const stat = staticRegex[locale];
  const expression = [
    badMods(settings, catalog),
    goodMods(settings, catalog),
    addQuantifier(stat.quantity, generateNumberRegex(settings.quantity, settings.optimizeQuant)),
    addQuantifier(stat.packsize, generateNumberRegex(settings.packsize, settings.optimizePacksize)),
    addQuantifier(stat.itemrarity, generateNumberRegex(settings.itemRarity, settings.optimizeQuant)),
    qualityClause(settings, locale),
    rarityClause(settings, locale),
    addQuantifier(stat.mapdrop, generateNumberRegex(settings.mapDropChance, settings.optimizeQuant)),
    settings.corrupted.enabled ? (settings.corrupted.include ? stat.corrupted : `!${stat.corrupted}`) : "",
    settings.unidentified.enabled ? (settings.unidentified.include ? stat.unidentified : `!${stat.unidentified}`) : "",
    settings.customText.enabled ? settings.customText.value.trim() : "",
  ].filter(Boolean).join(" ").replaceAll(/\s{2,}/g, " ").replaceAll(`"!"`, "");
  const split = splitRegexIntoTwoPasses(expression, options.maxLength);
  const matchedIds = availableIds(settings, [...settings.badIds, ...settings.goodIds], catalog);
  return { ...split, matchedIds, locale };
}
