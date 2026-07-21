import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { collectionSize, sha256, stableJson } from "./export-utils.js";
import { verifyGeneratedRegexData } from "./verify-generated-data.js";

const GENERATED = resolve(fileURLToPath(
  new URL("../../../web/src/features/regex/data/generated/", import.meta.url),
));
const SNAPSHOT = fileURLToPath(new URL("./data/poe1-economy.json", import.meta.url));
const SNAPSHOT_INPUT = "seeding/src/regex/data/poe1-economy.json";

interface EconomySnapshot {
  generatedAt: string;
  league: string;
  markets: {
    runegrafts: Record<string, MarketEntry>;
    scarabs: Record<string, MarketEntry>;
  };
  prices: Record<string, number>;
  schemaVersion: number;
}

interface MarketEntry { chaosValue: number; icon: string }

interface ExpeditionPayload {
  baseTypeRegex: Record<string, { items?: Array<{ name?: string }> }>;
  fallbackPrices: Record<string, number>;
  priceLeague: string;
  priceUpdatedAt: string;
  uniquesSeen: unknown[];
}

interface PricedEntriesPayload {
  entries: unknown[] | Record<string, unknown>;
  priceLeague?: string;
  priceUpdatedAt?: string;
  translations: Record<string, unknown>;
}

interface Manifest {
  inputs: Array<{ path: string; sha256: string }>;
  shards: Array<{
    bytes: number; file: string; locale: string; records: number; sha256: string; tool: string;
  }>;
}

async function main(): Promise<void> {
  const snapshotContents = await readFile(SNAPSHOT);
  const snapshot = JSON.parse(snapshotContents.toString("utf8")) as EconomySnapshot;
  if (
    snapshot.schemaVersion !== 2 || typeof snapshot.generatedAt !== "string" ||
    typeof snapshot.league !== "string" || typeof snapshot.prices !== "object" || snapshot.prices === null ||
    typeof snapshot.markets !== "object" || snapshot.markets === null ||
    typeof snapshot.markets.scarabs !== "object" || typeof snapshot.markets.runegrafts !== "object"
  ) throw new TypeError("Economy snapshot has an invalid shape");

  const manifestPath = resolve(GENERATED, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
  const input = manifest.inputs.find(({ path }) => path === SNAPSHOT_INPUT);
  if (!input) throw new Error(`Manifest has no ${SNAPSHOT_INPUT} input`);
  input.sha256 = sha256(snapshotContents);

  for (const locale of ["en", "ru"] as const) {
    const file = `expedition.${locale}.json`;
    const path = resolve(GENERATED, file);
    const payload = JSON.parse(await readFile(path, "utf8")) as ExpeditionPayload;
    const obtainable = new Set(Object.values(payload.baseTypeRegex).flatMap(({ items = [] }) =>
      items.flatMap(({ name }) => typeof name === "string" ? [name] : [])));
    payload.fallbackPrices = Object.fromEntries(Object.entries(snapshot.prices)
      .filter(([name, value]) => obtainable.has(name) && typeof value === "number" && Number.isFinite(value) && value >= 0)
      .sort(([left], [right]) => left.localeCompare(right)));
    payload.priceLeague = snapshot.league;
    payload.priceUpdatedAt = snapshot.generatedAt;
    const serialized = stableJson(payload);
    await writeFile(path, serialized, "utf8");
    const shard = manifest.shards.find((candidate) => candidate.file === file);
    if (!shard) throw new Error(`Manifest has no ${file} shard`);
    shard.bytes = Buffer.byteLength(serialized);
    shard.records = collectionSize(payload.baseTypeRegex) + collectionSize(payload.uniquesSeen);
    shard.sha256 = sha256(serialized);
  }

  for (const locale of ["en", "ru"] as const) {
    for (const [tool, market] of [
      ["scarabs", snapshot.markets.scarabs],
      ["runegrafts", snapshot.markets.runegrafts],
    ] as const) {
      const file = `${tool}.${locale}.json`;
      const path = resolve(GENERATED, file);
      const payload = JSON.parse(await readFile(path, "utf8")) as PricedEntriesPayload;
      const applyPrice = (entry: unknown, fallbackName: string): unknown => {
        if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return entry;
        const record = entry as Record<string, unknown>;
        const name = typeof record.name === "string"
          ? record.name
          : typeof record.runegraft === "string" ? record.runegraft : fallbackName;
        const priced = market[name];
        return priced ? { ...record, chaosValue: priced.chaosValue, icon: priced.icon } : record;
      };
      payload.entries = Array.isArray(payload.entries)
        ? payload.entries.map((entry) => applyPrice(entry, ""))
        : Object.fromEntries(Object.entries(payload.entries).map(([name, entry]) => [name, applyPrice(entry, name)]));
      payload.priceLeague = snapshot.league;
      payload.priceUpdatedAt = snapshot.generatedAt;
      const serialized = stableJson(payload);
      await writeFile(path, serialized, "utf8");
      const shard = manifest.shards.find((candidate) => candidate.file === file);
      if (!shard) throw new Error(`Manifest has no ${file} shard`);
      shard.bytes = Buffer.byteLength(serialized);
      shard.records = collectionSize(payload.entries);
      shard.sha256 = sha256(serialized);
    }
  }

  await writeFile(manifestPath, stableJson(manifest), "utf8");
  verifyGeneratedRegexData(GENERATED);
  process.stdout.write(`Applied ${snapshot.league} economy snapshot to Expedition and market item shards.\n`);
}

await main();
