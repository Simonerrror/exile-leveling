import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stableJson } from "./export-utils.js";

const OUTPUT = resolve(fileURLToPath(new URL("./data/poe1-economy.json", import.meta.url)));
const API = "https://poe.ninja/poe1/api/economy";
const USER_AGENT = "poe-tools-regex/1.0 (github.com/Simonerrror/exile-leveling)";
const CATEGORIES = ["UniqueAccessory", "UniqueArmour", "UniqueJewel", "UniqueWeapon"] as const;

interface EconomyLine {
  chaosValue?: unknown;
  corrupted?: unknown;
  detailsId?: unknown;
  id?: unknown;
  links?: unknown;
  name?: unknown;
  primaryValue?: unknown;
}

interface EconomyItem {
  id?: unknown;
  image?: unknown;
  name?: unknown;
}

interface MarketEntry { chaosValue: number; icon: string }
interface MarketSnapshot {
  entries: Record<string, MarketEntry>;
  generatedAt: string;
  league: string;
}

async function getJson(url: string): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!response.ok) throw new Error(`poe.ninja ${response.status}: ${url}`);
      return response.json();
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message.includes("poe.ninja 404")) throw error;
      if (attempt < 3) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1_000));
    }
  }
  throw lastError;
}

async function marketEntries(league: string, type: "Scarab" | "Runegraft"): Promise<Record<string, MarketEntry>> {
  const payload = await getJson(
    `${API}/stash/current/item/overview?league=${encodeURIComponent(league)}&type=${type}`,
  ) as { core?: { primary?: unknown }; items?: EconomyItem[]; lines?: EconomyLine[] };
  if (!Array.isArray(payload.items) || !Array.isArray(payload.lines) || payload.core?.primary !== "chaos") {
    throw new Error(`poe.ninja returned invalid ${type} market data`);
  }
  const items = new Map(payload.items.flatMap((item) =>
    typeof item.id === "string" ? [[item.id, item] as const] : []));
  const entries = new Map<string, MarketEntry>();
  for (const line of payload.lines) {
    const item = typeof line.id === "string" ? items.get(line.id) : undefined;
    const value = typeof line.primaryValue === "number" ? line.primaryValue : line.chaosValue;
    const image = typeof item?.image === "string" ? item.image : "";
    const icon = image.startsWith("/gen/image/")
      ? `https://web.poecdn.com${image}`
      : image.startsWith("https://web.poecdn.com/") ? image : "";
    if (
      typeof item?.name !== "string" || typeof value !== "number" ||
      !Number.isFinite(value) || value < 0 || icon === ""
    ) continue;
    entries.set(item.name, { chaosValue: value, icon });
  }
  const minimum = type === "Scarab" ? 80 : 10;
  if (entries.size < minimum) throw new Error(`${type} market snapshot is unexpectedly small: ${entries.size}`);
  return Object.fromEntries([...entries].sort(([left], [right]) => left.localeCompare(right)));
}

function previousMarket(value: unknown, key: "scarabs" | "runegrafts"): MarketSnapshot | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const snapshot = value as Record<string, unknown>;
  const markets = snapshot.markets;
  if (typeof markets !== "object" || markets === null || Array.isArray(markets)) return undefined;
  const market = (markets as Record<string, unknown>)[key];
  if (typeof market !== "object" || market === null || Array.isArray(market)) return undefined;
  const record = market as Record<string, unknown>;
  const entries = typeof record.entries === "object" && record.entries !== null ? record.entries : market;
  const generatedAt = typeof record.generatedAt === "string" ? record.generatedAt : snapshot.generatedAt;
  const league = typeof record.league === "string" ? record.league : snapshot.league;
  return typeof generatedAt === "string" && typeof league === "string"
    ? { entries: entries as Record<string, MarketEntry>, generatedAt, league }
    : undefined;
}

async function currentMarket(
  league: string,
  type: "Scarab" | "Runegraft",
  fallback: MarketSnapshot | undefined,
): Promise<MarketSnapshot> {
  try {
    return { entries: await marketEntries(league, type), generatedAt: new Date().toISOString(), league };
  } catch (error) {
    if (error instanceof Error && error.message.includes("poe.ninja 404") && fallback) return fallback;
    throw error;
  }
}

async function main(): Promise<void> {
  let previousSnapshot: unknown;
  try {
    previousSnapshot = JSON.parse(await readFile(OUTPUT, "utf8"));
  } catch {
    previousSnapshot = undefined;
  }
  const leagues = await getJson(`${API}/leagues`) as Array<{ id?: unknown }>;
  const permanentLeagues = new Set(["Standard", "Hardcore", "Ruthless", "Hardcore Ruthless"]);
  const tradeLeagues = leagues.flatMap(({ id }) =>
    typeof id === "string" && !id.startsWith("Hardcore ") ? [id] : []);
  const league = tradeLeagues.find((id) => !permanentLeagues.has(id)) ?? tradeLeagues[0];
  if (typeof league !== "string" || league === "") throw new Error("poe.ninja returned no economy league");

  const prices = new Map<string, number>();
  for (const category of CATEGORIES) {
    const payload = await getJson(
      `${API}/stash/current/item/overview?league=${encodeURIComponent(league)}&type=${category}`,
    ) as { lines?: EconomyLine[] };
    if (!Array.isArray(payload.lines)) throw new Error(`poe.ninja returned no lines for ${category}`);
    for (const entry of payload.lines) {
      const detailsId = typeof entry.detailsId === "string" ? entry.detailsId : "";
      if (
        typeof entry.name !== "string" || typeof entry.chaosValue !== "number" ||
        !Number.isFinite(entry.chaosValue) || entry.chaosValue < 0 ||
        entry.links !== undefined || entry.corrupted === true ||
        detailsId.includes("foulborn") || detailsId.endsWith("relic")
      ) continue;
      prices.set(entry.name, Math.max(prices.get(entry.name) ?? 0, entry.chaosValue));
    }
  }

  if (prices.size < 500) throw new Error(`Economy snapshot is unexpectedly small: ${prices.size}`);
  const markets = {
    runegrafts: await currentMarket(league, "Runegraft", previousMarket(previousSnapshot, "runegrafts")),
    scarabs: await currentMarket(league, "Scarab", previousMarket(previousSnapshot, "scarabs")),
  };
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, stableJson({
    generatedAt: new Date().toISOString(),
    league,
    markets,
    prices: Object.fromEntries([...prices].sort(([left], [right]) => left.localeCompare(right))),
    schemaVersion: 3,
  }), "utf8");
  process.stdout.write(
    `Saved ${prices.size} uniques, ${Object.keys(markets.scarabs.entries).length} scarabs, and ` +
    `${Object.keys(markets.runegrafts.entries).length} runegrafts for ${league}.\n`,
  );
}

await main();
