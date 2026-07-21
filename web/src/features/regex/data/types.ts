import type { RegexLocale } from "../core/types.js";

export type RegexDataToolId =
  | "vendor" | "maps" | "items" | "mapnames" | "flasks" | "heist"
  | "expedition" | "beast" | "scarabs" | "tattoos" | "runegrafts" | "jewels";

export type RegexDataLocale = RegexLocale;

export interface RegexToken {
  id: number;
  rawText: string;
  generalizedText: string;
  regex: string;
  options: Record<string, unknown>;
}

export interface RegexTokenCatalog {
  tokens: RegexToken[];
  [key: string]: unknown;
}

export interface VendorRegexData { gems: RegexTokenCatalog }
export interface MapRegexData {
  mods: RegexTokenCatalog;
  tradeStatIdMatching: Record<string, unknown>;
}
export interface ItemRegexData {
  bases: unknown[];
  mods: Record<string, unknown>;
  translations: Record<string, unknown>;
}
export interface MapNameRegexData {
  entries: Record<string, unknown>;
  translations: Record<string, unknown>;
}
export interface FlaskRegexData {
  prefix: unknown[];
  suffix: unknown[];
  translations: Record<string, unknown>;
}
export interface HeistRegexData {
  contractTypes: Record<string, unknown>;
  modifiers: Record<string, unknown>;
  targetValues: Record<string, unknown>;
  translations: Record<string, unknown>;
}
export interface ExpeditionRegexData {
  baseTypeRegex: Record<string, unknown>;
  numberOfUniques: number;
  obtainableItems: number;
  uniquesSeen: unknown[];
  translations: Record<string, unknown>;
}
export interface EntriesRegexData {
  entries: unknown[] | Record<string, unknown>;
  translations: Record<string, unknown>;
}
export interface JewelRegexData {
  abyss: unknown[];
  regular: unknown[];
  translations: Record<string, unknown>;
}

export interface RegexDataByTool {
  vendor: VendorRegexData;
  maps: MapRegexData;
  items: ItemRegexData;
  mapnames: MapNameRegexData;
  flasks: FlaskRegexData;
  heist: HeistRegexData;
  expedition: ExpeditionRegexData;
  beast: EntriesRegexData;
  scarabs: EntriesRegexData;
  tattoos: EntriesRegexData;
  runegrafts: EntriesRegexData;
  jewels: JewelRegexData;
}
