import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { stableJson } from "./export-utils.js";

const SOURCE = "https://api.poe.watch/compact?league=Standard";
const OUTPUT = fileURLToPath(new URL("./data/gem-icons.json", import.meta.url));
const GEMS = fileURLToPath(new URL("../../../common/data/json/gems.json", import.meta.url));

interface PoeWatchGem {
  category?: unknown;
  gemIsCorrupted?: unknown;
  gemLevel?: unknown;
  gemQuality?: unknown;
  icon?: unknown;
  id?: unknown;
  name?: unknown;
}

function score(entry: PoeWatchGem): number {
  return (entry.gemIsCorrupted === false ? 1_000_000 : 0) +
    (entry.gemQuality === 0 ? 100_000 : 0) -
    (typeof entry.gemLevel === "number" ? entry.gemLevel * 100 : 99_000) -
    (typeof entry.id === "number" ? entry.id / 1_000_000 : 0);
}

const response = await fetch(SOURCE, { headers: { "User-Agent": "poe-tools-data-refresh/1.0" } });
if (!response.ok) throw new Error(`Gem icon source returned ${response.status}`);
const payload = await response.json() as { items?: unknown };
if (!Array.isArray(payload.items)) throw new TypeError("Gem icon source has no items array");
const canonical = JSON.parse(await readFile(GEMS, "utf8")) as Record<string, { id?: unknown; name?: unknown }>;
const requiredNames = new Set(Object.values(canonical).flatMap(({ id, name }) =>
  typeof id === "string" && !id.includes("Royale") && typeof name === "string" ? [name] : []));
requiredNames.add("Increased Duration Support");
requiredNames.add("Sweep");

const best = new Map<string, PoeWatchGem>();
for (const candidate of payload.items as PoeWatchGem[]) {
  if (
    candidate.category !== "gem" || typeof candidate.name !== "string" ||
    !requiredNames.has(candidate.name) || typeof candidate.icon !== "string" ||
    !candidate.icon.startsWith("https://web.poecdn.com/")
  ) continue;
  const current = best.get(candidate.name);
  if (!current || score(candidate) > score(current)) best.set(candidate.name, candidate);
}

const icons = Object.fromEntries(Array.from(best).sort(([left], [right]) => left.localeCompare(right))
  .map(([name, entry]) => [name, entry.icon]));
if (Object.keys(icons).length < 500) throw new Error(`Gem icon snapshot is unexpectedly small: ${Object.keys(icons).length}`);

await writeFile(OUTPUT, stableJson({
  league: "Standard",
  schemaVersion: 1,
  source: SOURCE,
  icons,
}));
console.log(`Wrote ${Object.keys(icons).length} canonical gem icons.`);
