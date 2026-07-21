import type { VendorGemColor, VendorRegexToken } from "./data/types.js";

export interface VendorGemSection {
  color: VendorGemColor;
  support: boolean;
  tokens: VendorRegexToken[];
}

export interface BuildGemMatch {
  alreadySelectedTokenIds: number[];
  selectedTokenIds: number[];
  unavailableGameIds: string[];
  unknownGameIds: string[];
}

const sectionOrder = [
  ["r", false], ["r", true],
  ["g", false], ["g", true],
  ["b", false], ["b", true],
  ["w", false], ["w", true],
] as const;

function compareNames(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function groupVendorGems(tokens: VendorRegexToken[]): VendorGemSection[] {
  return sectionOrder.flatMap(([color, support]) => {
    const sectionTokens = tokens
      .filter((token) => token.options.c === color && token.options.support === support)
      .sort((left, right) =>
        left.requiredLevel - right.requiredLevel || compareNames(left.rawText, right.rawText));
    return sectionTokens.length > 0 ? [{ color, support, tokens: sectionTokens }] : [];
  });
}

export function matchBuildGems(
  requiredGems: ReadonlyArray<{ id: string }>,
  tokens: readonly VendorRegexToken[],
  selectedTokenIds: readonly number[] = [],
): BuildGemMatch {
  const tokenByGameId = new Map(tokens.map((token) => [token.gameId, token]));
  const selected = new Set(selectedTokenIds);
  const alreadySelectedTokenIds = new Set<number>();
  const unavailableGameIds = new Set<string>();
  const unknownGameIds = new Set<string>();

  for (const gem of requiredGems) {
    if (!gem.id.startsWith("Metadata/Items/Gems/")) {
      unknownGameIds.add(gem.id);
      continue;
    }
    const token = tokenByGameId.get(gem.id);
    if (!token) {
      unavailableGameIds.add(gem.id);
      continue;
    }
    if (selected.has(token.id)) alreadySelectedTokenIds.add(token.id);
    selected.add(token.id);
  }

  return {
    alreadySelectedTokenIds: [...alreadySelectedTokenIds].sort((left, right) => left - right),
    selectedTokenIds: [...selected].sort((left, right) => left - right),
    unavailableGameIds: [...unavailableGameIds].sort(),
    unknownGameIds: [...unknownGameIds].sort(),
  };
}
