import type { RegexLocale } from "../core/types.js";

export const PROFILE_SCHEMA_VERSION = 2 as const;

export type LinkCount = 4 | 5 | 6;
export type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;
export interface JsonObject { [key: string]: JsonValue }

export interface VendorProfileSettings {
  linkCounts: LinkCount[];
  movement: { ten: boolean; fifteen: boolean };
  plusGems: {
    lightning: boolean;
    fire: boolean;
    cold: boolean;
    phys: boolean;
    chaos: boolean;
    any: boolean;
  };
  damage: {
    phys: boolean;
    firemult: boolean;
    coldmult: boolean;
    chaosmult: boolean;
  };
  weapon: {
    sceptre: boolean;
    mace: boolean;
    axe: boolean;
    sword: boolean;
    bow: boolean;
    claw: boolean;
    dagger: boolean;
    staff: boolean;
    wand: boolean;
    shield: boolean;
  };
  gems: number[];
}

export interface RegexToolProfileSettings {
  vendor: VendorProfileSettings;
  maps: JsonObject;
  items: JsonObject;
  mapnames: JsonObject;
  expedition: JsonObject;
  heist: JsonObject;
  flasks: JsonObject;
  beast: JsonObject;
  tattoos: JsonObject;
  runegrafts: JsonObject;
  scarabs: JsonObject;
  jewels: JsonObject;
}

export interface RegexProfile {
  name: string;
  locale: RegexLocale;
  tools: RegexToolProfileSettings;
}

export interface RegexProfileStore {
  version: typeof PROFILE_SCHEMA_VERSION;
  selectedProfile: string;
  profiles: RegexProfile[];
}

const booleanRecord = <Keys extends readonly string[]>(keys: Keys) =>
  Object.fromEntries(keys.map((key) => [key, false])) as Record<Keys[number], boolean>;

const defaultVendor = (): VendorProfileSettings => ({
  linkCounts: [],
  movement: booleanRecord(["ten", "fifteen"] as const),
  plusGems: booleanRecord(["lightning", "fire", "cold", "phys", "chaos", "any"] as const),
  damage: booleanRecord(["phys", "firemult", "coldmult", "chaosmult"] as const),
  weapon: booleanRecord([
    "sceptre", "mace", "axe", "sword", "bow", "claw", "dagger", "staff", "wand", "shield",
  ] as const),
  gems: [],
});

export const createDefaultToolSettings = (): RegexToolProfileSettings => ({
  vendor: defaultVendor(),
  maps: {},
  items: {},
  mapnames: {},
  expedition: {},
  heist: {},
  flasks: {},
  beast: {},
  tattoos: {},
  runegrafts: {},
  scarabs: {},
  jewels: {},
});

const allowedToolKeys: Record<Exclude<keyof RegexToolProfileSettings, "vendor">, readonly string[]> = {
  maps: [
    "selected",
    "badIds", "goodIds", "allGoodMods", "quantity", "packsize", "itemRarity",
    "optimizeQuant", "optimizePacksize", "optimizeQuality", "displayNightmareMods",
    "displayAffixBadges", "groupByAffix", "tradeEightModOnly", "tradeExcludeValdo",
    "tradeExcludeShaperElder", "rarity", "corrupted", "unidentified", "quality",
    "anyQuality", "customText", "mapDropChance",
  ],
  items: [
    "selected",
    "itembase", "selectedRareMods", "selectedMagicMods", "rareSettings",
    "magicSettings", "customText",
  ],
  mapnames: ["selected", "mapTabSearch"],
  expedition: ["selected", "selectedBaseTypes", "league", "addFillerItems", "minValueToDisplay", "minAddValue"],
  heist: ["selected", "targetValue", "requireCoinValue", "contractLevels"],
  flasks: [
    "selected",
    "selectedPrefix", "selectedSuffix", "ilevel", "onlyMaxPrefixTierMod",
    "onlyMaxSuffixTierMod", "matchBothPrefixAndSuffix", "ignoreEffectTiers",
    "matchOpenPrefixSuffix",
  ],
  beast: ["selected", "includeHarvest", "minChaosValue", "maxChaosValue", "menagerieLimit", "redBeastsOnly"],
  tattoos: ["selected", "minValue", "maxValue"],
  runegrafts: ["selected", "minValue", "maxValue"],
  scarabs: ["selected", "maxPrice", "minPrice"],
  jewels: [
    "selected",
    "allMatch", "magicOnly", "abyssJewel", "selectedRegular", "selectedAbyss",
    "matchBothPrefixAndSuffix", "matchOpenPrefixSuffix",
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const forbiddenKeys = new Set(["__proto__", "prototype", "constructor"]);

function sanitizeJson(value: unknown, depth = 0): JsonValue | undefined {
  if (depth > 8) return undefined;
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return value.slice(0, 10_000);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return undefined;
    return Math.max(-1_000_000, Math.min(1_000_000, value));
  }
  if (Array.isArray(value)) {
    return value.slice(0, 1_000).flatMap((entry) => {
      const sanitized = sanitizeJson(entry, depth + 1);
      return sanitized === undefined ? [] : [sanitized];
    });
  }
  if (!isRecord(value)) return undefined;

  const result: JsonObject = {};
  for (const key of Object.keys(value).sort()) {
    if (forbiddenKeys.has(key)) continue;
    const sanitized = sanitizeJson(value[key], depth + 1);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  return result;
}

function sanitizeToolSettings(
  value: unknown,
  keys: readonly string[],
): JsonObject {
  if (!isRecord(value)) return {};
  const result: JsonObject = {};
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) continue;
    const sanitized = sanitizeJson(value[key]);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  return result;
}

function sanitizeBooleanGroup<Keys extends readonly string[]>(
  value: unknown,
  keys: Keys,
): Record<Keys[number], boolean> {
  const record = isRecord(value) ? value : {};
  return Object.fromEntries(
    keys.map((key) => [key, record[key] === true]),
  ) as Record<Keys[number], boolean>;
}

export function normalizeVendorSettings(value: unknown): VendorProfileSettings {
  const record = isRecord(value) ? value : {};
  const linkCounts = Array.isArray(record.linkCounts)
    ? Array.from(new Set(record.linkCounts.filter(
        (count): count is LinkCount => count === 4 || count === 5 || count === 6,
      ))).sort((left, right) => left - right)
    : [];
  const gems = Array.isArray(record.gems)
    ? Array.from(new Set(record.gems.filter(
        (id): id is number => Number.isSafeInteger(id)
          && id >= -2_147_483_648
          && id <= 2_147_483_647,
      ))).sort((left, right) => left - right).slice(0, 1_000)
    : [];

  return {
    linkCounts,
    movement: sanitizeBooleanGroup(record.movement, ["ten", "fifteen"] as const),
    plusGems: sanitizeBooleanGroup(
      record.plusGems,
      ["lightning", "fire", "cold", "phys", "chaos", "any"] as const,
    ),
    damage: sanitizeBooleanGroup(
      record.damage,
      ["phys", "firemult", "coldmult", "chaosmult"] as const,
    ),
    weapon: sanitizeBooleanGroup(
      record.weapon,
      ["sceptre", "mace", "axe", "sword", "bow", "claw", "dagger", "staff", "wand", "shield"] as const,
    ),
    gems,
  };
}

function normalizeTools(value: unknown): RegexToolProfileSettings {
  const record = isRecord(value) ? value : {};
  const defaults = createDefaultToolSettings();
  defaults.vendor = normalizeVendorSettings(record.vendor);
  for (const tool of Object.keys(allowedToolKeys) as Array<keyof typeof allowedToolKeys>) {
    defaults[tool] = sanitizeToolSettings(record[tool], allowedToolKeys[tool]);
  }
  return defaults;
}

function normalizeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().slice(0, 64);
  return name.length === 0 ? null : name;
}

export function normalizeProfileStore(value: unknown): RegexProfileStore {
  if (!isRecord(value) || value.version !== PROFILE_SCHEMA_VERSION || !Array.isArray(value.profiles)) {
    throw new TypeError("Invalid profile store");
  }

  const byName = new Map<string, RegexProfile>();
  for (const candidate of value.profiles) {
    if (!isRecord(candidate)) continue;
    const name = normalizeName(candidate.name);
    if (name === null) continue;
    byName.set(name, {
      name,
      locale: candidate.locale === "ru" ? "ru" : "en",
      tools: normalizeTools(candidate.tools),
    });
  }
  const profiles = Array.from(byName.values()).sort((left, right) =>
    left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
  );
  if (profiles.length === 0) {
    return createDefaultProfileStore();
  }
  const requested = normalizeName(value.selectedProfile);
  const selectedProfile = profiles.some(({ name }) => name === requested)
    ? requested as string
    : profiles[0].name;
  return { version: PROFILE_SCHEMA_VERSION, selectedProfile, profiles };
}

export function createDefaultProfileStore(): RegexProfileStore {
  return {
    version: PROFILE_SCHEMA_VERSION,
    selectedProfile: "default",
    profiles: [{ name: "default", locale: "ru", tools: createDefaultToolSettings() }],
  };
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

export const DEFAULT_PROFILE_STORE = deepFreeze(createDefaultProfileStore());
