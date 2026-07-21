import type { FlaskRegexData } from "../data/types.js";
import { splitRegexIntoTwoPasses } from "./two-pass.js";
import type { RegexCompileResult, RegexLocale } from "./types.js";

interface FlaskMod { level: number; regex: string }
interface FlaskGroup { description: string; minLevel: number; regex: string; mods: FlaskMod[] }
export interface FlaskCompileSettings {
  selectedPrefix: string[];
  selectedSuffix: string[];
  itemLevel: number;
  onlyMaxPrefix: boolean;
  onlyMaxSuffix: boolean;
  requireBoth: boolean;
  matchOpenAffix: boolean;
  ignoreEffectTiers: boolean;
}

function groups(value: unknown): FlaskGroup[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is FlaskGroup =>
    typeof entry === "object" && entry !== null &&
    typeof (entry as FlaskGroup).description === "string" &&
    typeof (entry as FlaskGroup).minLevel === "number" &&
    typeof (entry as FlaskGroup).regex === "string" &&
    Array.isArray((entry as FlaskGroup).mods),
  );
}

function selectedRegex(
  selected: string[],
  available: FlaskGroup[],
  itemLevel: number,
  onlyMax: boolean,
): string {
  return selected.flatMap((description) => {
    const group = available.find((candidate) => candidate.description === description);
    if (group === undefined) return [];
    const possible = group.mods.filter(({ level }) => level <= itemLevel);
    if (onlyMax) {
      const best = possible.sort((left, right) => right.level - left.level)[0];
      return best === undefined ? [] : [best.regex];
    }
    return group.minLevel <= itemLevel ? [group.regex] : [];
  }).join("|");
}

export function compileFlaskRegex(
  settings: FlaskCompileSettings,
  data: FlaskRegexData,
  locale: RegexLocale,
): RegexCompileResult {
  const localizedPrefix = locale === "ru" ? groups(data.translations.prefix) : [];
  const localizedSuffix = locale === "ru" ? groups(data.translations.suffix) : [];
  const prefixGroups = localizedPrefix.length > 0 ? localizedPrefix : groups(data.prefix);
  const suffixGroups = localizedSuffix.length > 0 ? localizedSuffix : groups(data.suffix);
  const level = Number.isFinite(settings.itemLevel) ? settings.itemLevel : 85;
  const prefix = selectedRegex(settings.selectedPrefix, prefixGroups, level, settings.onlyMaxPrefix);
  const suffix = selectedRegex(settings.selectedSuffix, suffixGroups, level, settings.onlyMaxSuffix);
  const open = locale === "ru"
    ? { prefix: "^\\S+ флакон", suffix: "(?:флакон|здоровья|маны)$" }
    : { prefix: "^[a-z]+ F", suffix: "ask$" };

  let expression = "";
  if (prefix && suffix) {
    if (settings.requireBoth) {
      expression = settings.matchOpenAffix
        ? `"${open.prefix}|${prefix}" "${open.suffix}|${suffix}"`
        : `"${prefix}" "${suffix}"`;
    } else expression = `"${prefix}|${suffix}"`;
  } else if (prefix) expression = `"${prefix}"`;
  else if (suffix) expression = `"${suffix}"`;
  return splitRegexIntoTwoPasses(expression);
}
