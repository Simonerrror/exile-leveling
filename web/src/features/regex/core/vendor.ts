import type { RegexTokenCatalog } from "../data/types.js";
import type { VendorProfileSettings } from "../profile/schema.js";
import { splitRegexIntoTwoPasses } from "./two-pass.js";
import type { RegexCompileResult, RegexLocale } from "./types.js";

export interface VendorCompileResult extends RegexCompileResult {
  matchedIds: number[];
  warnings: string[];
}

const locales = {
  en: {
    movement: { ten: "Runn", fifteen: "rint" },
    plusGems: { any: "ll g", fire: "me Sh", cold: "singe", lightning: "derha", chaos: "Lord", phys: "Litho" },
    damage: { phys: "Glint|Heav", firemult: "Earn", coldmult: "Incl", chaosmult: "Wani" },
    weaponClassPrefix: "s:.+",
    weapon: { sceptre: "sc", mace: "mac", axe: "ax", sword: "sw", bow: "bow", claw: "cl", dagger: "da", staff: "stave", wand: "wa", shield: "sh" },
  },
  ru: {
    movement: { ten: "Быстр", fifteen: "Резк" },
    plusGems: { any: "(Лавов|Поющ|Рокоч|Сумасшедш|Камнемант)", fire: "Лавов", cold: "Поющ", lightning: "Рокоч", chaos: "Сумасшедш", phys: "Камнемант" },
    damage: { phys: "Рассекающ|Увесист", firemult: "Горяч", coldmult: "Суров", chaosmult: "Слаб" },
    weaponClassPrefix: "с предмета:.+",
    weapon: { sceptre: "скип", mace: "булав", axe: "топор", sword: "меч", bow: "лук", claw: "когт", dagger: "кинжал", staff: "посох", wand: "жезл", shield: "щит" },
  },
} as const;

function selectedBooleanPatterns<T extends Record<string, boolean>>(
  settings: T,
  patterns: Record<keyof T, string>,
): string[] {
  return (Object.keys(patterns) as Array<keyof T>)
    .filter((key) => settings[key])
    .map((key) => patterns[key]);
}

export function compileVendorRegex(
  settings: VendorProfileSettings,
  gemCatalog: RegexTokenCatalog,
  locale: RegexLocale,
  options: { maxLength?: number } = {},
): VendorCompileResult {
  const language = locales[locale];
  const patterns = settings.linkCounts.map((count) => `(-\\w){${count - 1}}`);
  patterns.push(...selectedBooleanPatterns(settings.movement, language.movement));

  const allGemTypes = Object.values(settings.plusGems).every(Boolean);
  if (settings.plusGems.any || allGemTypes) {
    patterns.push(language.plusGems.any);
  } else {
    patterns.push(...selectedBooleanPatterns(settings.plusGems, language.plusGems));
  }
  patterns.push(...selectedBooleanPatterns(settings.damage, language.damage));

  const weaponPatterns = selectedBooleanPatterns(settings.weapon, language.weapon);
  if (weaponPatterns.length > 0) {
    patterns.push(
      weaponPatterns.length === 1
        ? `${language.weaponClassPrefix}${weaponPatterns[0]}`
        : `${language.weaponClassPrefix}(${weaponPatterns.join("|")})`,
    );
  }

  const tokensById = new Map(gemCatalog.tokens.map((token) => [token.id, token.regex]));
  const matchedIds = Array.from(new Set(settings.gems))
    .filter((id) => tokensById.has(id))
    .sort((left, right) => left - right);
  patterns.push(...matchedIds.map((id) => tokensById.get(id)!).filter(Boolean));

  const expressionBody = Array.from(new Set(patterns.filter(Boolean)))
    .map((pattern) => pattern.replaceAll('"', ""))
    .join("|");
  const expression = /\||\s/.test(expressionBody) && expressionBody.length > 0
    ? `"${expressionBody}"`
    : expressionBody;
  const split = splitRegexIntoTwoPasses(expression, options.maxLength);
  const warnings: string[] = [];
  if (settings.plusGems.any && settings.weapon.wand) warnings.push("wand-gem-conflict");
  if (matchedIds.length > 0 && weaponPatterns.length > 0) warnings.push("gem-weapon-conflict");
  if (matchedIds.length > 0 && settings.damage.phys) warnings.push("gem-physical-conflict");
  return { ...split, matchedIds, warnings };
}
