import type { HeistContractSelection } from "./core/content.js";
import type { JsonObject } from "./profile/schema.js";

export interface HeistContractRange extends JsonObject {
  start: number;
  end: number;
}

export interface HeistProfileSettings extends JsonObject {
  contractLevels: Record<string, HeistContractRange>;
  targetValue: number;
  requireCoinValue: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const level = (value: unknown, fallback: number) => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.max(1, Math.min(5, Math.trunc(numeric))) : fallback;
};

export function normalizeHeistSettings(value: unknown): HeistProfileSettings {
  const source = isRecord(value) ? value : {};
  const rawLevels = isRecord(source.contractLevels) ? source.contractLevels : {};
  const contractLevels: Record<string, HeistContractRange> = {};
  for (const name of Object.keys(rawLevels).sort()) {
    const range = rawLevels[name];
    if (!isRecord(range)) continue;
    const rawStart = Number(range.start);
    const rawEnd = Number(range.end);
    if ((!Number.isFinite(rawStart) || rawStart <= 0) && (!Number.isFinite(rawEnd) || rawEnd <= 0)) continue;
    const start = level(range.start, 1);
    const end = Math.max(start, level(range.end, 5));
    contractLevels[name] = { start, end };
  }
  const rawTarget = Number(source.targetValue);
  return {
    contractLevels,
    targetValue: Number.isFinite(rawTarget) ? Math.max(0, Math.min(100_000, Math.trunc(rawTarget))) : 0,
    requireCoinValue: source.requireCoinValue === true,
  };
}

export function heistCompileInput(settings: HeistProfileSettings): {
  contracts: HeistContractSelection[];
  targetValue: number;
  requireBoth: boolean;
} {
  return {
    contracts: Object.entries(settings.contractLevels).map(([name, range]) => ({ name, ...range })),
    targetValue: settings.targetValue,
    requireBoth: settings.requireCoinValue,
  };
}
