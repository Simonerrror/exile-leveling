import { mkdir, writeFile } from "node:fs/promises";
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
  links?: unknown;
  name?: unknown;
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
      if (attempt < 3) await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1_000));
    }
  }
  throw lastError;
}

async function main(): Promise<void> {
  const leagues = await getJson(`${API}/leagues`) as Array<{ id?: unknown }>;
  const league = leagues.find(({ id }) => typeof id === "string")?.id;
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
  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, stableJson({
    generatedAt: new Date().toISOString(),
    league,
    prices: Object.fromEntries([...prices].sort(([left], [right]) => left.localeCompare(right))),
    schemaVersion: 1,
  }), "utf8");
  process.stdout.write(`Saved ${prices.size} unique prices for ${league}.\n`);
}

await main();
