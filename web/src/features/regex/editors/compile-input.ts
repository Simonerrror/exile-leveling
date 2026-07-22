import type { ItemCompileSettings } from "../core/items.js";
import { createDefaultMapSettings, type MapRegexSettings } from "../core/maps.js";
import type { ItemRegexData, JewelRegexData } from "../data/types.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const strings = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((entry): entry is string => typeof entry === "string") : [];
const numbers = (value: unknown): number[] => Array.isArray(value)
  ? value.filter((entry): entry is number => Number.isSafeInteger(entry)) : [];

export function normalizeMapEditorSettings(value: unknown): MapRegexSettings {
  const defaults = createDefaultMapSettings();
  if (!isRecord(value)) return defaults;
  const boolean = (key: keyof MapRegexSettings, fallback: boolean) =>
    typeof value[key] === "boolean" ? value[key] as boolean : fallback;
  const text = (key: keyof MapRegexSettings, fallback = "") =>
    typeof value[key] === "string" ? String(value[key]).slice(0, 250) : fallback;
  const group = <T extends Record<string, boolean>>(key: string, fallback: T): T => {
    const candidate = isRecord(value[key]) ? value[key] : {};
    return Object.fromEntries(Object.entries(fallback).map(([name, defaultValue]) =>
      [name, typeof candidate[name] === "boolean" ? candidate[name] : defaultValue])) as T;
  };
  const textGroup = <T extends Record<string, string>>(key: string, fallback: T): T => {
    const candidate = isRecord(value[key]) ? value[key] : {};
    return Object.fromEntries(Object.entries(fallback).map(([name, defaultValue]) =>
      [name, typeof candidate[name] === "string" ? String(candidate[name]).slice(0, 20) : defaultValue])) as T;
  };
  const custom = isRecord(value.customText) ? value.customText : {};
  return {
    ...defaults,
    badIds: numbers(value.badIds),
    goodIds: numbers(value.goodIds),
    allGoodMods: boolean("allGoodMods", defaults.allGoodMods),
    quantity: text("quantity"),
    packsize: text("packsize"),
    itemRarity: text("itemRarity"),
    mapDropChance: text("mapDropChance"),
    optimizeQuant: boolean("optimizeQuant", defaults.optimizeQuant),
    optimizePacksize: boolean("optimizePacksize", defaults.optimizePacksize),
    optimizeQuality: boolean("optimizeQuality", defaults.optimizeQuality),
    displayNightmareMods: boolean("displayNightmareMods", defaults.displayNightmareMods),
    rarity: group("rarity", defaults.rarity),
    corrupted: group("corrupted", defaults.corrupted),
    unidentified: group("unidentified", defaults.unidentified),
    quality: textGroup("quality", defaults.quality),
    anyQuality: boolean("anyQuality", defaults.anyQuality),
    customText: {
      value: typeof custom.value === "string" ? custom.value.slice(0, 250) : "",
      enabled: typeof custom.enabled === "boolean" ? custom.enabled : true,
    },
  };
}

export interface ItemEditorMod {
  id: string;
  pattern: string;
  kind: "prefix" | "suffix";
  label?: string;
}
export interface ItemEditorSettings {
  baseCategory: string;
  baseName: string;
  selectedMods: ItemEditorMod[];
  mode: ItemCompileSettings["mode"];
  matchOpenAffix: boolean;
}

export function normalizeItemEditorSettings(value: unknown): ItemEditorSettings {
  const source = isRecord(value) ? value : {};
  const selectedMods = Array.isArray(source.selectedMods) ? source.selectedMods.flatMap((candidate) => {
    if (!isRecord(candidate) || typeof candidate.id !== "string" || typeof candidate.pattern !== "string") return [];
    return [{
      id: candidate.id.slice(0, 200),
      pattern: candidate.pattern.slice(0, 250),
      kind: candidate.kind === "suffix" ? "suffix" as const : "prefix" as const,
      label: typeof candidate.label === "string" ? candidate.label.slice(0, 500) : undefined,
    }];
  }) : [];
  return {
    baseCategory: typeof source.baseCategory === "string" ? source.baseCategory.slice(0, 100) : "",
    baseName: typeof source.baseName === "string" ? source.baseName.slice(0, 200) : "",
    selectedMods,
    mode: source.mode === "all" || source.mode === "prefix-and-suffix" ? source.mode : "any",
    matchOpenAffix: source.matchOpenAffix === true,
  };
}

export function itemCompileInput(settings: ItemEditorSettings): ItemCompileSettings {
  return {
    baseName: settings.baseName,
    selected: settings.selectedMods.map(({ pattern, kind }) => ({ pattern, kind })),
    mode: settings.mode,
    matchOpenAffix: settings.matchOpenAffix,
  };
}

export function itemModCatalog(data: ItemRegexData, category: string): ItemEditorMod[] {
  const group = isRecord(data.mods[category]) ? data.mods[category] : {};
  const categories = Array.isArray(group.categoryRegex) ? group.categoryRegex : [];
  return categories.flatMap((categoryEntry, categoryIndex) => {
    if (!isRecord(categoryEntry) || !Array.isArray(categoryEntry.modifiers)) return [];
    const sourceCategory = typeof categoryEntry.category === "string" ? categoryEntry.category : "";
    return categoryEntry.modifiers.flatMap((modifier, modifierIndex) => {
      if (!isRecord(modifier) || typeof modifier.regex !== "string") return [];
      const sourceDescription = typeof modifier.desc === "string" ? modifier.desc : modifier.regex;
      const translationKey = `${category}\u001f${sourceCategory}\u001f${sourceDescription}`;
      const rawTranslation = data.translations.mods;
      const translations = isRecord(rawTranslation) ? rawTranslation : {};
      const translation = isRecord(translations[translationKey]) ? translations[translationKey] as Record<string, unknown> : {};
      const label = typeof translation.displayDesc === "string" ? translation.displayDesc : sourceDescription;
      const pattern = typeof translation.regex === "string" ? translation.regex : modifier.regex;
      return [{
        id: `${categoryIndex}:${modifierIndex}:${pattern}`,
        label,
        pattern,
        kind: modifier.affixtype === "SUFFIX" ? "suffix" as const : "prefix" as const,
      }];
    });
  });
}

export function itemBaseOptions(data: ItemRegexData, category: string): string[] {
  const group = data.bases.find((candidate) => isRecord(candidate) && candidate.name === category);
  const items = isRecord(group) && Array.isArray(group.items) ? strings(group.items) : [];
  const translations = isRecord(data.translations.bases) ? data.translations.bases : {};
  return items.map((name) => typeof translations[name] === "string" ? translations[name] as string : name);
}

export interface JewelEditorSettings {
  abyss: boolean;
  allMatch: boolean;
  magicOnly: boolean;
  requireBoth: boolean;
  matchOpenAffix: boolean;
  selected: string[];
}

export function normalizeJewelEditorSettings(value: unknown): JewelEditorSettings {
  const source = isRecord(value) ? value : {};
  return {
    abyss: source.abyss === true || source.abyssJewel === true,
    allMatch: source.allMatch === true,
    magicOnly: source.magicOnly === true,
    requireBoth: source.requireBoth === true || source.matchBothPrefixAndSuffix === true,
    matchOpenAffix: source.matchOpenAffix === true || source.matchOpenPrefixSuffix === true,
    selected: strings(source.selected ?? (source.abyssJewel ? source.selectedAbyss : source.selectedRegular)),
  };
}

export function jewelOptions(data: JewelRegexData, settings: JewelEditorSettings): Array<{ id: string; label: string }> {
  const entries = settings.abyss ? data.abyss : data.regular;
  return entries.flatMap((candidate) => {
    if (!isRecord(candidate) || typeof candidate.mod !== "string") return [];
    const rawTranslation = data.translations[candidate.mod];
    const translation: Record<string, unknown> = isRecord(rawTranslation) ? rawTranslation : {};
    return [{ id: candidate.mod, label: typeof translation.displayDescription === "string"
      ? translation.displayDescription : candidate.mod }];
  });
}

export interface ValueFilterSettings {
  minValue?: number;
  maxValue?: number;
}

function optionalNonNegativeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function normalizeValueFilterSettings(value: unknown): ValueFilterSettings {
  const source = isRecord(value) ? value : {};
  return {
    minValue: optionalNonNegativeNumber(source.minValue ?? source.minPrice),
    maxValue: optionalNonNegativeNumber(source.maxValue ?? source.maxPrice),
  };
}

export function valueFilterMatches(
  chaosValue: number | undefined,
  settings: ValueFilterSettings,
): boolean {
  if (settings.minValue === undefined && settings.maxValue === undefined) return true;
  if (chaosValue === undefined) return false;
  return (settings.minValue === undefined || chaosValue >= settings.minValue) &&
    (settings.maxValue === undefined || chaosValue <= settings.maxValue);
}

export interface BeastEditorSettings extends ValueFilterSettings {
  includeHarvest: boolean;
  menagerieLimit: boolean;
  redOnly: boolean;
}

export function normalizeBeastEditorSettings(value: unknown): BeastEditorSettings {
  const source = isRecord(value) ? value : {};
  const range = normalizeValueFilterSettings({
    minValue: source.minChaosValue,
    maxValue: source.maxChaosValue,
  });
  return {
    ...range,
    includeHarvest: source.includeHarvest !== false,
    menagerieLimit: source.menagerieLimit === true,
    redOnly: source.redOnly === true || source.redBeastsOnly === true,
  };
}
