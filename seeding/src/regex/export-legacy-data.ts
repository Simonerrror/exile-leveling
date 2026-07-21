import { readFile, realpath, rename, rm, stat, writeFile, mkdir, mkdtemp } from "node:fs/promises";
import { isAbsolute, join, resolve, sep } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { collectionSize, sha256, stableJson } from "./export-utils.js";
import {
  EXPECTED_SHARD_FILES,
  LEGACY_SOURCE_ALLOWLIST,
  REGEX_TOOL_IDS,
  type RegexDataLocale,
  type RegexToolId,
} from "./source-allowlist.js";
import { verifyGeneratedRegexData } from "./verify-generated-data.js";

const OUTPUT_DIRECTORY = resolve(fileURLToPath(
  new URL("../../../web/src/features/regex/data/generated/", import.meta.url),
));
const GEM_METADATA_FILE = fileURLToPath(new URL("../../../common/data/json/gems.json", import.meta.url));
const ECONOMY_SNAPSHOT_FILE = fileURLToPath(new URL("./data/poe1-economy.json", import.meta.url));
type LegacyModule = Record<string, unknown>;

interface CanonicalGem {
  id: string;
  name: string;
  primary_attribute: "strength" | "dexterity" | "intelligence" | "none";
  required_level: number;
  is_support: boolean;
}

interface LegacyGemToken {
  id: number;
  rawText: string;
  options: { c: "r" | "g" | "b" | "w"; support: boolean };
  [key: string]: unknown;
}

interface VendorGemMetadata {
  gameId: string;
  icon: string;
  requiredLevel: number;
}

const colorByAttribute = {
  strength: "r",
  dexterity: "g",
  intelligence: "b",
  none: "w",
} as const;

function gemIcon(gameId: string): string {
  const metadataName = gameId.slice("Metadata/Items/Gems/".length);
  const relative = metadataName.startsWith("SupportGem")
    ? `Support/${metadataName.slice("SupportGem".length)}`
    : metadataName.startsWith("SkillGem")
      ? metadataName.slice("SkillGem".length)
      : metadataName;
  return `https://web.poecdn.com/image/Art/2DItems/Gems/${relative}.png?scale=1`;
}

function vendorMetadataById(
  catalog: unknown,
  metadata: Record<string, CanonicalGem>,
): Map<number, VendorGemMetadata> {
  const tokens = (catalog as { tokens?: unknown }).tokens;
  if (!Array.isArray(tokens)) throw new TypeError("English vendor catalog has no tokens");
  const canonical = Object.values(metadata).filter(({ id }) => !id.includes("Royale"));
  const aliases: Record<string, string> = {
    "Lesser Multiple Projectiles Support": "Metadata/Items/Gems/SupportGemLesserMultipleProjectiles",
  };
  const archived: Record<string, { gameId: string; requiredLevel: number }> = {
    "Increased Duration Support": {
      gameId: "Metadata/Items/Gems/SupportGemIncreasedDuration",
      requiredLevel: 31,
    },
    Sweep: { gameId: "Metadata/Items/Gems/SkillGemSweep", requiredLevel: 12 },
  };
  return new Map(tokens.map((candidate) => {
    const token = candidate as LegacyGemToken;
    const alias = aliases[token.rawText];
    const matches = canonical.filter((gem) =>
      (alias ? gem.id === alias : gem.name === token.rawText) &&
      colorByAttribute[gem.primary_attribute] === token.options.c &&
      gem.is_support === token.options.support);
    const gem = matches[0] ?? archived[token.rawText];
    const requiredLevel = gem?.required_level ?? gem?.requiredLevel;
    const gameId = gem?.id ?? gem?.gameId;
    if (!Number.isSafeInteger(requiredLevel) || requiredLevel < 0 || typeof gameId !== "string") {
      throw new TypeError(`Missing canonical required level for vendor gem: ${token.rawText}`);
    }
    return [token.id, { gameId, icon: gemIcon(gameId), requiredLevel }] as const;
  }));
}

function enrichVendorCatalog(catalog: unknown, metadata: Map<number, VendorGemMetadata>): unknown {
  const value = catalog as Record<string, unknown> & { tokens?: unknown[] };
  if (!Array.isArray(value.tokens)) throw new TypeError("Vendor catalog has no tokens");
  return {
    ...value,
    tokens: value.tokens.map((candidate) => {
      const token = candidate as LegacyGemToken;
      const gem = metadata.get(token.id);
      if (gem === undefined) throw new TypeError(`Missing vendor metadata id: ${token.id}`);
      return { ...token, ...gem };
    }),
  };
}

function expeditionPrices(
  source: Record<string, unknown>,
  snapshot: unknown,
): Record<string, number> {
  const economy = snapshot as { prices?: Record<string, unknown> };
  if (typeof economy !== "object" || economy === null || typeof economy.prices !== "object" || economy.prices === null) {
    throw new TypeError("Economy snapshot has no prices");
  }
  const baseTypes = objectValue(source, "baseTypeRegex") as Record<string, { items?: Array<{ name?: string }> }>;
  const obtainable = new Set(Object.values(baseTypes).flatMap(({ items = [] }) =>
    items.flatMap(({ name }) => typeof name === "string" ? [name] : [])));
  return Object.fromEntries(Object.entries(economy.prices)
    .filter(([name, value]) => obtainable.has(name) && typeof value === "number" && Number.isFinite(value) && value >= 0)
    .sort(([left], [right]) => left.localeCompare(right)));
}

function sourceArgument(argv: string[]): string {
  const index = argv.indexOf("--source");
  const value = index >= 0 ? argv[index + 1] : undefined;
  if (value === undefined || !isAbsolute(value) || argv.length !== 2) {
    throw new Error("Usage: npm run regex:data:export -w seeding -- --source /absolute/legacy/repo");
  }
  return value;
}

async function requireProjectMarker(path: string): Promise<void> {
  try {
    await stat(path);
  } catch {
    throw new Error(`Missing legacy project marker: ${path}`);
  }
}

async function validateSources(source: string): Promise<{
  files: Map<string, string>;
  inputs: Array<{ path: string; sha256: string }>;
}> {
  await requireProjectMarker(join(source, ".git"));
  await requireProjectMarker(join(source, "package.json"));
  const root = await realpath(source);
  const files = new Map<string, string>();
  const inputs: Array<{ path: string; sha256: string }> = [];

  for (const relativePath of LEGACY_SOURCE_ALLOWLIST) {
    const candidate = resolve(root, relativePath);
    const actual = await realpath(candidate).catch(() => {
      throw new Error(`Missing allowlisted legacy source: ${relativePath}`);
    });
    if (!actual.startsWith(`${root}${sep}`)) {
      throw new Error(`Allowlisted source escapes the legacy repository: ${relativePath}`);
    }
    const contents = await readFile(actual);
    files.set(relativePath, actual);
    inputs.push({ path: relativePath, sha256: sha256(contents) });
  }
  return { files, inputs };
}

async function importLegacy(path: string): Promise<LegacyModule> {
  const imported = await import(pathToFileURL(path).href) as LegacyModule & { default?: LegacyModule };
  return imported.default ?? imported;
}

function moduleAt(modules: Map<string, LegacyModule>, path: string): LegacyModule {
  const value = modules.get(path);
  if (value === undefined) throw new Error(`Legacy module was not loaded: ${path}`);
  return value;
}

function objectValue(module: LegacyModule, key: string): unknown {
  const value = module[key];
  if (value === undefined) throw new Error(`Missing legacy export: ${key}`);
  return value;
}

function buildPayload(
  tool: RegexToolId,
  locale: RegexDataLocale,
  modules: Map<string, LegacyModule>,
  trade: unknown,
  vendorLevels: Map<number, number>,
  fallbackPrices: Record<string, number>,
  priceLeague: string,
  priceUpdatedAt: string,
): unknown {
  const russianContent = objectValue(
    moduleAt(modules, "src/generated/repoe/GeneratedRussianContent.ts"),
    "russianContentCatalog",
  ) as Record<string, unknown>;
  const translations = (key: string) => locale === "ru" ? russianContent[key] ?? {} : {};

  switch (tool) {
    case "vendor": {
      const path = locale === "ru"
        ? "src/generated/gems/Generated.Gems.Russian.ts"
        : "src/generated/gems/Generated.Gems.English.ts";
      const catalog = objectValue(moduleAt(modules, path), locale === "ru" ? "regexGemsRussian" : "regexGems");
      return { gems: enrichVendorCatalog(catalog, vendorLevels) };
    }
    case "maps": {
      const path = locale === "ru"
        ? "src/generated/mapmods/Generated.MapModsV3.RUSSIAN.ts"
        : "src/generated/mapmods/Generated.MapModsV3.ENGLISH.ts";
      return {
        mods: objectValue(moduleAt(modules, path), locale === "ru" ? "regexMapModsRUSSIAN" : "regexMapModsENGLISH"),
        tradeStatIdMatching: trade,
      };
    }
    case "items": {
      const russianItems = moduleAt(modules, "src/generated/repoe/GeneratedRussianItems.ts");
      return {
        bases: objectValue(moduleAt(modules, "src/generated/GeneratedItemBases.ts"), "basetypes"),
        mods: objectValue(moduleAt(modules, "src/generated/GeneratedItemMods.ts"), "itemRegex"),
        translations: locale === "ru" ? {
          bases: objectValue(russianItems, "russianItemBases"),
          diagnostics: objectValue(russianItems, "russianItemDiagnostics"),
          mods: objectValue(russianItems, "russianItemMods"),
        } : {},
      };
    }
    case "flasks": {
      const english = moduleAt(modules, "src/generated/GeneratedFlaskMods.ts");
      const russian = moduleAt(modules, "src/generated/repoe/GeneratedRussianFlaskMods.ts");
      return {
        prefix: objectValue(english, "flaskPrefix"),
        suffix: objectValue(english, "flaskSuffix"),
        translations: locale === "ru" ? {
          prefix: objectValue(russian, "russianFlaskPrefix"),
          suffix: objectValue(russian, "russianFlaskSuffix"),
        } : {},
      };
    }
    case "heist": {
      const source = moduleAt(modules, "src/generated/GeneratedHeist.ts");
      return {
        contractTypes: objectValue(source, "heistContractTypes"),
        modifiers: objectValue(source, "heistModifiers"),
        targetValues: objectValue(source, "heistTargetValues"),
        translations: locale === "ru" ? {
          contractTypes: translations("heistContractTypes"),
          targetValues: translations("heistTargetValues"),
        } : {},
      };
    }
    case "expedition": {
      const source = moduleAt(modules, "src/generated/GeneratedExpedition.ts");
      return {
        baseTypeRegex: objectValue(source, "baseTypeRegex"),
        numberOfUniques: objectValue(source, "numberOfUniques"),
        obtainableItems: objectValue(source, "obtainableItems"),
        uniquesSeen: objectValue(source, "uniquesSeen"),
        fallbackPrices,
        priceLeague,
        priceUpdatedAt,
        translations: locale === "ru" ? {
          bases: translations("expeditionBases"),
          items: translations("expeditionItems"),
        } : {},
      };
    }
    case "beast":
      return {
        entries: objectValue(moduleAt(modules, "src/generated/GeneratedBeastRegex.ts"), "beastRegex"),
        translations: translations("beasts"),
      };
    case "scarabs":
      return {
        entries: objectValue(moduleAt(modules, "src/generated/GeneratedScarabs.ts"), "scarabs"),
        translations: translations("scarabs"),
      };
    case "tattoos":
      return {
        entries: objectValue(moduleAt(modules, "src/generated/GeneratedTattoo.ts"), "tattooRegex"),
        translations: translations("tattoos"),
      };
    case "runegrafts":
      return {
        entries: objectValue(moduleAt(modules, "src/generated/GeneratedRunegraft.ts"), "runegraftRegex"),
        translations: translations("runegrafts"),
      };
    case "jewels":
      return {
        abyss: objectValue(moduleAt(modules, "src/generated/GeneratedJewel.ts"), "jewelAbyss"),
        regular: objectValue(moduleAt(modules, "src/generated/GeneratedJewel.ts"), "jewelRegular"),
        translations: translations("jewels"),
      };
  }
}

function payloadRecords(tool: RegexToolId, payload: unknown): number {
  const value = payload as Record<string, any>;
  switch (tool) {
    case "vendor": return collectionSize(value.gems?.tokens);
    case "maps": return collectionSize(value.mods?.tokens);
    case "items": return collectionSize(value.bases) + collectionSize(value.mods) + collectionSize(value.translations?.mods);
    case "flasks": return collectionSize(value.prefix) + collectionSize(value.suffix);
    case "heist": return collectionSize(value.contractTypes) + collectionSize(value.modifiers) + collectionSize(value.targetValues);
    case "expedition": return collectionSize(value.baseTypeRegex) + collectionSize(value.uniquesSeen);
    case "beast":
    case "scarabs":
    case "tattoos":
    case "runegrafts": return collectionSize(value.entries);
    case "jewels": return collectionSize(value.regular) + collectionSize(value.abyss);
  }
}

async function publishDirectory(temporary: string, target: string): Promise<void> {
  const backup = `${target}.backup-${process.pid}`;
  await rm(backup, { recursive: true, force: true });
  let movedExisting = false;
  try {
    await rename(target, backup);
    movedExisting = true;
    await rename(temporary, target);
    await rm(backup, { recursive: true, force: true });
  } catch (error) {
    if (movedExisting) {
      await rm(target, { recursive: true, force: true });
      await rename(backup, target);
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const source = sourceArgument(process.argv.slice(2));
  const validated = await validateSources(source);
  const modules = new Map<string, LegacyModule>();
  for (const relativePath of LEGACY_SOURCE_ALLOWLIST.filter((path) => path.endsWith(".ts"))) {
    modules.set(relativePath, await importLegacy(validated.files.get(relativePath)!));
  }
  const tradePath = "src/generated/mapmods/trade/TradeStatIdMatching.json";
  const trade = JSON.parse(await readFile(validated.files.get(tradePath)!, "utf8"));
  const gemMetadataContents = await readFile(GEM_METADATA_FILE);
  const gemMetadata = JSON.parse(gemMetadataContents.toString("utf8")) as Record<string, CanonicalGem>;
  const englishVendor = objectValue(
    moduleAt(modules, "src/generated/gems/Generated.Gems.English.ts"),
    "regexGems",
  );
  const vendorLevels = vendorMetadataById(englishVendor, gemMetadata);
  validated.inputs.push({ path: "common/data/json/gems.json", sha256: sha256(gemMetadataContents) });
  const expeditionSource = moduleAt(modules, "src/generated/GeneratedExpedition.ts");
  const economyContents = await readFile(ECONOMY_SNAPSHOT_FILE);
  const economy = JSON.parse(economyContents.toString("utf8")) as {
    generatedAt?: unknown; league?: unknown; schemaVersion?: unknown;
  };
  if (
    economy.schemaVersion !== 3 || typeof economy.generatedAt !== "string" ||
    typeof economy.league !== "string"
  ) throw new TypeError("Economy snapshot metadata has an invalid shape");
  validated.inputs.push({ path: "seeding/src/regex/data/poe1-economy.json", sha256: sha256(economyContents) });
  const fallbackPrices = expeditionPrices(expeditionSource, economy);

  const parent = resolve(OUTPUT_DIRECTORY, "..");
  await mkdir(parent, { recursive: true });
  const temporary = await mkdtemp(join(parent, ".regex-generated-"));
  try {
    const shards: Array<{
      file: string;
      tool: RegexToolId;
      locale: RegexDataLocale;
      bytes: number;
      records: number;
      sha256: string;
    }> = [];
    for (const file of EXPECTED_SHARD_FILES) {
      const [tool, locale] = file.split(".") as [RegexToolId, RegexDataLocale];
      if (!REGEX_TOOL_IDS.includes(tool)) throw new Error(`Unexpected tool id: ${tool}`);
      const payload = buildPayload(
        tool,
        locale,
        modules,
        trade,
        vendorLevels,
        fallbackPrices,
        economy.league,
        economy.generatedAt,
      );
      const serialized = stableJson(payload);
      await writeFile(join(temporary, file), serialized, "utf8");
      shards.push({
        file, tool, locale,
        bytes: Buffer.byteLength(serialized),
        records: payloadRecords(tool, payload),
        sha256: sha256(serialized),
      });
    }
    await writeFile(join(temporary, "manifest.json"), stableJson({
      generatorVersion: 3,
      inputs: validated.inputs,
      shards,
    }), "utf8");
    verifyGeneratedRegexData(temporary);
    await publishDirectory(temporary, OUTPUT_DIRECTORY);
    process.stdout.write(`Exported ${shards.length} deterministic regex shards.\n`);
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
}

await main();
