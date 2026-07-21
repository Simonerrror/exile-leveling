import type { VendorGemColor, VendorRegexToken } from "./data/types.js";

export interface VendorGemSection {
  color: VendorGemColor;
  support: boolean;
  tokens: VendorRegexToken[];
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
