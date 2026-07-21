import type {
  RegexDataByTool,
  RegexDataLocale,
  RegexDataToolId,
  RegexToken,
  RegexTokenCatalog,
} from "./types.js";

type JsonModule = Promise<{ default: unknown }>;
type JsonImporter = () => JsonModule;

const importers: Record<RegexDataToolId, Record<RegexDataLocale, JsonImporter>> = {
  vendor: {
    en: () => import("./generated/vendor.en.json"),
    ru: () => import("./generated/vendor.ru.json"),
  },
  maps: {
    en: () => import("./generated/maps.en.json"),
    ru: () => import("./generated/maps.ru.json"),
  },
  items: {
    en: () => import("./generated/items.en.json"),
    ru: () => import("./generated/items.ru.json"),
  },
  mapnames: {
    en: () => import("./generated/mapnames.en.json"),
    ru: () => import("./generated/mapnames.ru.json"),
  },
  flasks: {
    en: () => import("./generated/flasks.en.json"),
    ru: () => import("./generated/flasks.ru.json"),
  },
  heist: {
    en: () => import("./generated/heist.en.json"),
    ru: () => import("./generated/heist.ru.json"),
  },
  expedition: {
    en: () => import("./generated/expedition.en.json"),
    ru: () => import("./generated/expedition.ru.json"),
  },
  beast: {
    en: () => import("./generated/beast.en.json"),
    ru: () => import("./generated/beast.ru.json"),
  },
  scarabs: {
    en: () => import("./generated/scarabs.en.json"),
    ru: () => import("./generated/scarabs.ru.json"),
  },
  tattoos: {
    en: () => import("./generated/tattoos.en.json"),
    ru: () => import("./generated/tattoos.ru.json"),
  },
  runegrafts: {
    en: () => import("./generated/runegrafts.en.json"),
    ru: () => import("./generated/runegrafts.ru.json"),
  },
  jewels: {
    en: () => import("./generated/jewels.en.json"),
    ru: () => import("./generated/jewels.ru.json"),
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  return value;
}

function requireTokenCatalog(value: unknown, label: string): RegexTokenCatalog {
  const catalog = requireRecord(value, label);
  const tokens = requireArray(catalog.tokens, `${label}.tokens`);
  for (const [index, candidate] of tokens.entries()) {
    const token = requireRecord(candidate, `${label}.tokens[${index}]`);
    if (
      typeof token.id !== "number" || !Number.isSafeInteger(token.id) ||
      typeof token.rawText !== "string" || typeof token.generalizedText !== "string" ||
      typeof token.regex !== "string" || !isRecord(token.options)
    ) {
      throw new TypeError(`${label}.tokens[${index}] has an invalid shape`);
    }
  }
  return catalog as RegexTokenCatalog;
}

function requireVendorCatalog(value: unknown): void {
  const catalog = requireTokenCatalog(value, "vendor.gems");
  for (const [index, token] of catalog.tokens.entries()) {
    const requiredLevel = (token as RegexToken & { requiredLevel?: unknown }).requiredLevel;
    if (
      !Number.isSafeInteger(requiredLevel) || Number(requiredLevel) < 0 ||
      !["r", "g", "b", "w"].includes(String(token.options.c)) ||
      typeof token.options.support !== "boolean"
    ) throw new TypeError(`vendor.gems.tokens[${index}] has invalid gem metadata`);
  }
}

function validateRegexData<T extends RegexDataToolId>(
  tool: T,
  value: unknown,
): RegexDataByTool[T] {
  const data = requireRecord(value, `${tool} data`);
  switch (tool) {
    case "vendor":
      requireVendorCatalog(data.gems);
      break;
    case "maps":
      requireTokenCatalog(data.mods, "maps.mods");
      requireRecord(data.tradeStatIdMatching, "maps.tradeStatIdMatching");
      break;
    case "items":
      requireArray(data.bases, "items.bases");
      requireRecord(data.mods, "items.mods");
      requireRecord(data.translations, "items.translations");
      break;
    case "mapnames":
      requireRecord(data.entries, "mapnames.entries");
      requireRecord(data.translations, "mapnames.translations");
      break;
    case "flasks":
      requireArray(data.prefix, "flasks.prefix");
      requireArray(data.suffix, "flasks.suffix");
      requireRecord(data.translations, "flasks.translations");
      break;
    case "heist":
      requireRecord(data.contractTypes, "heist.contractTypes");
      requireRecord(data.modifiers, "heist.modifiers");
      requireRecord(data.targetValues, "heist.targetValues");
      requireRecord(data.translations, "heist.translations");
      break;
    case "expedition":
      requireRecord(data.baseTypeRegex, "expedition.baseTypeRegex");
      requireRecord(data.fallbackPrices, "expedition.fallbackPrices");
      requireArray(data.uniquesSeen, "expedition.uniquesSeen");
      requireRecord(data.translations, "expedition.translations");
      if (
        typeof data.numberOfUniques !== "number" || typeof data.obtainableItems !== "number" ||
        typeof data.priceLeague !== "string" || typeof data.priceUpdatedAt !== "string"
      ) {
        throw new TypeError("expedition metadata has an invalid shape");
      }
      break;
    case "beast":
    case "tattoos":
      if (!Array.isArray(data.entries) && !isRecord(data.entries)) {
        throw new TypeError(`${tool}.entries must be an array or object`);
      }
      requireRecord(data.translations, `${tool}.translations`);
      break;
    case "scarabs":
    case "runegrafts":
      if (!Array.isArray(data.entries) && !isRecord(data.entries)) {
        throw new TypeError(`${tool}.entries must be an array or object`);
      }
      requireRecord(data.translations, `${tool}.translations`);
      if (typeof data.priceLeague !== "string" || typeof data.priceUpdatedAt !== "string") {
        throw new TypeError(`${tool} economy metadata has an invalid shape`);
      }
      break;
    case "jewels":
      requireArray(data.abyss, "jewels.abyss");
      requireArray(data.regular, "jewels.regular");
      requireRecord(data.translations, "jewels.translations");
      break;
  }
  return data as unknown as RegexDataByTool[T];
}

const cache = new Map<string, Promise<unknown>>();

export function loadRegexData<T extends RegexDataToolId>(
  tool: T,
  locale: RegexDataLocale,
): Promise<RegexDataByTool[T]> {
  if (!Object.hasOwn(importers, tool) || (locale !== "en" && locale !== "ru")) {
    return Promise.reject(new TypeError(`Unknown regex data request: ${tool}.${locale}`));
  }
  const key = `${tool}.${locale}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached as Promise<RegexDataByTool[T]>;

  const promise = importers[tool][locale]()
    .then(({ default: value }) => validateRegexData(tool, value))
    .catch((error: unknown) => {
      cache.delete(key);
      throw error;
    });
  cache.set(key, promise);
  return promise;
}

export function resetRegexDataCacheForTests(): void {
  cache.clear();
}
