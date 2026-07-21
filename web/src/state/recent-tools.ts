import { atomWithStorage } from "jotai/utils";
import { internalTools, type InternalToolId } from "../containers/Useful/tools";
import { versionedStorage } from ".";

const RECENT_TOOLS_VERSION = 0;
const MAX_RECENT_TOOLS = 4;
const knownIds = new Set<InternalToolId>(internalTools.map(({ id }) => id));

export function normalizeRecentToolIds(value: unknown): InternalToolId[] {
  if (!Array.isArray(value)) return [];
  const result: InternalToolId[] = [];
  for (const id of value) {
    if (typeof id !== "string" || !knownIds.has(id as InternalToolId)) continue;
    if (!result.includes(id as InternalToolId)) result.push(id as InternalToolId);
  }
  return result.slice(0, MAX_RECENT_TOOLS);
}

export function pushRecentToolId(
  current: readonly InternalToolId[],
  id: InternalToolId,
): InternalToolId[] {
  return [id, ...current.filter((candidate) => candidate !== id)].slice(
    0,
    MAX_RECENT_TOOLS,
  );
}

export const recentToolsAtom = atomWithStorage<InternalToolId[]>(
  "recent-tools",
  [],
  versionedStorage(RECENT_TOOLS_VERSION),
);
