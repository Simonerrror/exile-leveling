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

export type VendorGemColor = "r" | "g" | "b" | "w";
export interface VendorRegexToken extends Omit<RegexToken, "options"> {
  requiredLevel: number;
  options: { c: VendorGemColor; support: boolean } & Record<string, unknown>;
}
export interface VendorRegexData {
  gems: Omit<RegexTokenCatalog, "tokens"> & { tokens: VendorRegexToken[] };
}
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
  baseTypeRegex: Record<string, {
    baseType: string;
    regex: string;
    items: Array<{ baseType: string; icon?: string; id?: string; name: string }>;
  }>;
  fallbackPrices: Record<string, number>;
  priceLeague: string;
  priceUpdatedAt: string;
  numberOfUniques: number;
  obtainableItems: number;
  uniquesSeen: unknown[];
  translations: Record<string, unknown>;
}
export interface EntriesRegexData {
  entries: unknown[] | Record<string, unknown>;
  translations: Record<string, unknown>;
}
export interface PricedEntriesRegexData extends EntriesRegexData {
  priceLeague: string;
  priceUpdatedAt: string;
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
  scarabs: PricedEntriesRegexData;
  tattoos: EntriesRegexData;
  runegrafts: PricedEntriesRegexData;
  jewels: JewelRegexData;
}
