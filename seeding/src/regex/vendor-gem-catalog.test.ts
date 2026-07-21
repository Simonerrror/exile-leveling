import assert from "node:assert/strict";
import test from "node:test";
import { groupVendorGems } from "../../../web/src/features/regex/vendor-gem-catalog.js";
import type { VendorRegexToken } from "../../../web/src/features/regex/data/types.js";

const token = (
  id: number,
  rawText: string,
  color: "r" | "g" | "b" | "w",
  support: boolean,
  requiredLevel: number,
): VendorRegexToken => ({
  id,
  rawText,
  generalizedText: rawText.toLowerCase(),
  regex: rawText.slice(0, 3),
  requiredLevel,
  options: { c: color, support },
});

test("vendor gems use fixed colour/type sections and level/name sorting", () => {
  const sections = groupVendorGems([
    token(1, "Zulu", "b", true, 8),
    token(2, "Beta", "r", false, 12),
    token(3, "Alpha", "r", false, 12),
    token(4, "First", "r", false, 1),
    token(5, "White", "w", false, 1),
    token(6, "Green support", "g", true, 4),
  ]);
  assert.deepEqual(sections.map(({ color, support }) => [color, support]), [
    ["r", false],
    ["g", true],
    ["b", true],
    ["w", false],
  ]);
  assert.deepEqual(sections[0]?.tokens.map(({ rawText }) => rawText), ["First", "Alpha", "Beta"]);
});
