import { compileExpeditionRegex } from "./core/content.js";
import type { ExpeditionRegexData } from "./data/types.js";

interface TranslationEntry { displayName?: unknown }

export interface ExpeditionCatalogUnique {
  name: string;
  label: string;
  chaosValue: number;
  icon?: string;
}

export interface ExpeditionCatalogBase {
  id: string;
  label: string;
  maxChaosValue: number;
  searchText: string;
  uniques: ExpeditionCatalogUnique[];
}

export interface ExpeditionSettings {
  addFillerItems: boolean;
  minAddValue: number;
  minValueToDisplay: number;
}

export const defaultExpeditionSettings = (): ExpeditionSettings => ({
  addFillerItems: true,
  minAddValue: 100,
  minValueToDisplay: 25,
});

export function normalizeExpeditionSettings(value: unknown): ExpeditionSettings {
  const defaults = defaultExpeditionSettings();
  if (typeof value !== "object" || value === null || Array.isArray(value)) return defaults;
  const candidate = value as Record<string, unknown>;
  const numberValue = (key: "minAddValue" | "minValueToDisplay", fallback: number) =>
    typeof candidate[key] === "number" && Number.isFinite(candidate[key])
      ? Math.max(0, Math.min(1_000_000, candidate[key]))
      : fallback;
  return {
    addFillerItems: typeof candidate.addFillerItems === "boolean" ? candidate.addFillerItems : defaults.addFillerItems,
    minAddValue: numberValue("minAddValue", defaults.minAddValue),
    minValueToDisplay: numberValue("minValueToDisplay", defaults.minValueToDisplay),
  };
}

function localizedName(
  id: string,
  translations: Record<string, unknown>,
): string {
  const entry = translations[id] as TranslationEntry | undefined;
  return typeof entry?.displayName === "string" && entry.displayName !== ""
    ? entry.displayName
    : id;
}

export function expeditionCatalog(data: ExpeditionRegexData): ExpeditionCatalogBase[] {
  const baseTranslations = data.translations.bases as Record<string, unknown> | undefined ?? {};
  const itemTranslations = data.translations.items as Record<string, unknown> | undefined ?? {};

  return Object.entries(data.baseTypeRegex).map(([id, entry]) => {
    const uniques = entry.items.map(({ icon, name }) => ({
      name,
      label: localizedName(name, itemTranslations),
      chaosValue: data.fallbackPrices[name] ?? 0,
      icon,
    })).sort((left, right) => right.chaosValue - left.chaosValue || left.label.localeCompare(right.label));
    const label = localizedName(id, baseTranslations);
    return {
      id,
      label,
      maxChaosValue: uniques[0]?.chaosValue ?? 0,
      searchText: `${label} ${id} ${uniques.flatMap(({ label: uniqueLabel, name }) => [uniqueLabel, name]).join(" ")}`.toLocaleLowerCase(),
      uniques,
    };
  }).sort((left, right) => right.maxChaosValue - left.maxChaosValue || left.label.localeCompare(right.label));
}

export function visibleExpeditionOutcomes(
  base: ExpeditionCatalogBase,
  minimumChaosValue: number,
): Array<ExpeditionCatalogUnique & { icon: string }> {
  return base.uniques.filter((outcome): outcome is ExpeditionCatalogUnique & { icon: string } =>
    outcome.chaosValue >= minimumChaosValue &&
    typeof outcome.icon === "string" && /^https:\/\//.test(outcome.icon));
}

export function valuableExpeditionFillers(
  selected: string[],
  minimumChaosValue: number,
  data: ExpeditionRegexData,
): string[] {
  const selectedSet = new Set(selected);
  const fillers: string[] = [];
  for (const candidate of expeditionCatalog(data)) {
    if (candidate.maxChaosValue < minimumChaosValue || selectedSet.has(candidate.id)) continue;
    const result = compileExpeditionRegex(selected, [...fillers, candidate.id], data);
    if (result.secondary || result.diagnostics.some(({ severity }) => severity === "blocking")) break;
    fillers.push(candidate.id);
  }
  return fillers;
}

export function formatChaosValue(value: number, locale: "en" | "ru"): string {
  const displayValue = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    notation: value >= 1_000 ? "compact" : "standard",
  }).format(displayValue)}c`;
}
