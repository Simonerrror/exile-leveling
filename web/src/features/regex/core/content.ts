import type {
  EntriesRegexData,
  ExpeditionRegexData,
  HeistRegexData,
  JewelRegexData,
} from "../data/types.js";
import { splitRegexIntoTwoPasses } from "./two-pass.js";
import type { RegexCompileResult } from "./types.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, key: string): string | undefined {
  return isRecord(value) && typeof value[key] === "string" ? value[key] : undefined;
}

function localizedRegex(
  entry: unknown,
  translations: Record<string, unknown>,
  name: string,
  affix = false,
): string | undefined {
  const translation = translations[name];
  return text(translation, affix ? "regexAffix" : "regex")
    ?? text(entry, affix ? "regexAffix" : "regex")
    ?? text(entry, "matchSafe");
}

function compilePatterns(
  patterns: Array<string | undefined>,
  quoted = true,
  maxLength = 250,
): RegexCompileResult {
  const unique = Array.from(new Set(patterns.filter((value): value is string => Boolean(value))))
    .map((value) => value.replaceAll('"', ""));
  const body = unique.join("|");
  return splitRegexIntoTwoPasses(body && quoted ? `"${body}"` : body, maxLength);
}

export function compileExpeditionRegex(
  selected: string[],
  fillers: string[],
  data: ExpeditionRegexData,
): RegexCompileResult {
  const translations = isRecord(data.translations.bases) ? data.translations.bases : {};
  return compilePatterns([...selected, ...fillers].map((name) =>
    localizedRegex(data.baseTypeRegex[name], translations, name),
  ));
}

export interface HeistContractSelection { name: string; start: number; end: number }

function levelPattern(startValue: number, endValue: number): string {
  const start = startValue === 0 ? 1 : Math.max(1, Math.min(5, Math.trunc(startValue)));
  const end = endValue === 0 ? 5 : Math.max(start, Math.min(5, Math.trunc(endValue)));
  if (start <= 1 && end >= 5) return "";
  if (start === end) return `.*${start}`;
  if (end - start === 1) return `.*[${start}${end}]`;
  return `.*[${start}-${end}]`;
}

export function compileHeistRegex(
  contracts: HeistContractSelection[],
  targetValue: number,
  requireBoth: boolean,
  data: HeistRegexData,
): RegexCompileResult {
  const contractTranslations = isRecord(data.translations.contractTypes)
    ? data.translations.contractTypes : {};
  const contractPattern = contracts
    .filter(({ start, end }) => start > 0 || end > 0)
    .map(({ name, start, end }) =>
      `${localizedRegex(data.contractTypes[name], contractTranslations, name) ?? ""}${levelPattern(start, end)}`,
    ).filter(Boolean).join("|");

  const targetTranslations = isRecord(data.translations.targetValues)
    ? data.translations.targetValues : {};
  const targetPatterns = targetValue <= 0 ? [] : Object.entries(data.targetValues)
    .filter(([, entry]) => isRecord(entry) && typeof entry.coinValue === "number" && entry.coinValue > targetValue)
    .map(([name, entry]) => localizedRegex(entry, targetTranslations, name));
  const targetPattern = targetPatterns.length > 0 ? `t:.*(${targetPatterns.join("|")})` : "";
  const expression = requireBoth
    ? [contractPattern, targetPattern].filter(Boolean).join(" ")
    : [contractPattern, targetPattern].filter(Boolean).join("|");
  return splitRegexIntoTwoPasses(expression);
}

export interface PricedBeastEntry extends UnknownRecord { chaosValue?: number }
export interface BeastFilter {
  includeHarvest: boolean;
  redOnly: boolean;
  minValue?: number;
  maxValue?: number;
  menagerieLimit?: boolean;
}

export function compilePricedBeastRegex(
  entries: PricedBeastEntry[],
  filter: BeastFilter,
  translations: Record<string, unknown> = {},
): RegexCompileResult {
  return compilePatterns(entries
    .filter(({ chaosValue }) => filter.minValue === undefined || (chaosValue !== undefined && chaosValue >= filter.minValue))
    .filter(({ chaosValue }) => filter.maxValue === undefined || (chaosValue !== undefined && chaosValue <= filter.maxValue))
    .filter((entry) => !filter.redOnly || entry.red === true || entry.redBeast === true)
    .filter((entry) => filter.includeHarvest || entry.harvest !== true)
    .map((entry) => {
      const name = text(entry, "beast") ?? text(entry, "name") ?? "";
      return localizedRegex(entry, translations, name);
    }), false, filter.menagerieLimit ? 100 : 250);
}

export interface PricedTattooEntry extends UnknownRecord { chaosValue?: number }

export function compilePricedTattooRegex(
  entries: PricedTattooEntry[],
  minValue: number | undefined,
  maxValue: number | undefined,
  translations: Record<string, unknown> = {},
): RegexCompileResult {
  return compilePatterns(entries
    .filter(({ chaosValue }) => minValue === undefined || (chaosValue !== undefined && chaosValue >= minValue))
    .filter(({ chaosValue }) => maxValue === undefined || (chaosValue !== undefined && chaosValue <= maxValue))
    .map((entry) => {
      const name = text(entry, "tattoo") ?? text(entry, "name") ?? "";
      return localizedRegex(entry, translations, name);
    }));
}

export function compileScarabRegex(
  selected: string[],
  data: EntriesRegexData,
): RegexCompileResult {
  const entries = isRecord(data.entries) ? data.entries : {};
  return compilePatterns(selected.map((name) =>
    localizedRegex(entries[name], data.translations, name),
  ));
}

export function compileRunegraftRegex(
  selected: string[],
  data: EntriesRegexData,
): RegexCompileResult {
  const entries = Array.isArray(data.entries) ? data.entries : [];
  const byName = new Map(entries.flatMap((entry) => {
    const name = text(entry, "runegraft") ?? text(entry, "name");
    return name === undefined ? [] : [[name, entry] as const];
  }));
  return compilePatterns(selected.map((name) =>
    localizedRegex(byName.get(name), data.translations, name),
  ));
}

export interface JewelCompileSettings {
  selected: string[];
  abyss: boolean;
  allMatch: boolean;
  magicOnly?: boolean;
  requireBoth?: boolean;
  matchOpenAffix?: boolean;
}

export function compileJewelRegex(
  settings: JewelCompileSettings,
  data: JewelRegexData,
  locale: "en" | "ru" = "en",
): RegexCompileResult {
  const entries = settings.abyss ? data.abyss : data.regular;
  const byMod = new Map<string, UnknownRecord>(entries.flatMap((entry) => {
    const mod = text(entry, "mod");
    return mod === undefined || !isRecord(entry) ? [] : [[mod, entry] as const];
  }));
  if (settings.magicOnly) {
    const selectedEntries = settings.selected.flatMap((mod) => {
      const entry = byMod.get(mod);
      const pattern = localizedRegex(entry, data.translations, mod, true);
      return entry && pattern ? [{ entry, pattern }] : [];
    });
    const prefixes = selectedEntries.filter(({ entry }) => entry.isPrefix === true).map(({ pattern }) => pattern);
    const suffixes = selectedEntries.filter(({ entry }) => entry.isPrefix !== true).map(({ pattern }) => pattern);
    if (settings.requireBoth && prefixes.length > 0 && suffixes.length > 0) {
      const openPrefix = locale === "ru"
        ? (settings.abyss ? "^([а-яё]+ ){2}с" : "^[а-яё]+ с")
        : (settings.abyss ? "^([a-z]+ ){2}J" : "^[a-z]+ J");
      const openSuffix = locale === "ru" ? "оцвет$" : "wel$";
      const prefixGroup = settings.matchOpenAffix ? [openPrefix, ...prefixes] : prefixes;
      const suffixGroup = settings.matchOpenAffix ? [openSuffix, ...suffixes] : suffixes;
      return splitRegexIntoTwoPasses(`"${prefixGroup.join("|")}" "${suffixGroup.join("|")}"`);
    }
    if (settings.allMatch) {
      return splitRegexIntoTwoPasses([...prefixes, ...suffixes].map((pattern) => `"${pattern}"`).join(" "));
    }
    return compilePatterns([...prefixes, ...suffixes]);
  }
  const patterns = settings.selected.map((mod) => localizedRegex(byMod.get(mod), data.translations, mod));
  if (settings.allMatch) {
    const expression = patterns.filter(Boolean).map((pattern) => `"${pattern}"`).join(" ");
    return splitRegexIntoTwoPasses(expression);
  }
  return compilePatterns(patterns);
}
