import type { MapRegexSettings } from "../core/maps.js";

export type MapFlagMode = "any" | "only" | "exclude";
export type MapModMode = "ignore" | "exclude" | "require";

type MapFlag = MapRegexSettings["corrupted"];
type MapRarity = MapRegexSettings["rarity"];
type MapRarityKey = "normal" | "magic" | "rare";

export function mapFlagMode(flag: MapFlag): MapFlagMode {
  if (!flag.enabled) return "any";
  return flag.include ? "only" : "exclude";
}

export function applyMapFlagMode(flag: MapFlag, mode: MapFlagMode): MapFlag {
  if (mode === "any") return { ...flag, enabled: false };
  return { enabled: true, include: mode === "only" };
}

export function toggleMapRarity(rarity: MapRarity, key: MapRarityKey): MapRarity {
  const enabledCount = [rarity.normal, rarity.magic, rarity.rare].filter(Boolean).length;
  if (rarity[key] && enabledCount === 1) return rarity;
  return { ...rarity, [key]: !rarity[key], include: true };
}

export function mapModMode(settings: MapRegexSettings, id: number): MapModMode {
  if (settings.goodIds.includes(id)) return "require";
  if (settings.badIds.includes(id)) return "exclude";
  return "ignore";
}

export function setMapModMode(
  settings: MapRegexSettings,
  id: number,
  mode: MapModMode,
): MapRegexSettings {
  const badIds = settings.badIds.filter((candidate) => candidate !== id);
  const goodIds = settings.goodIds.filter((candidate) => candidate !== id);
  if (mode === "exclude") badIds.push(id);
  if (mode === "require") goodIds.push(id);
  return {
    ...settings,
    badIds: Array.from(new Set(badIds)).sort((left, right) => left - right),
    goodIds: Array.from(new Set(goodIds)).sort((left, right) => left - right),
  };
}
