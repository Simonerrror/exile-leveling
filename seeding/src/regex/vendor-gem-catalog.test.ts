import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  groupVendorGems,
  matchBuildGems,
} from "../../../web/src/features/regex/vendor-gem-catalog.js";
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
  gameId: `Metadata/Items/Gems/SkillGem${id}`,
  icon: `https://web.poecdn.com/image/Art/2DItems/Gems/${id}.png?scale=1`,
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

test("vendor catalog exposes stable build matching and official gem art", () => {
  const source = readFileSync(
    new URL("../../../web/src/features/regex/vendor-gem-catalog.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /export function matchBuildGems/);
  for (const locale of ["en", "ru"]) {
    const shard = JSON.parse(readFileSync(
      new URL(`../../../web/src/features/regex/data/generated/vendor.${locale}.json`, import.meta.url),
      "utf8",
    )) as { gems: { tokens: Array<{ gameId?: unknown; icon?: unknown }> } };
    assert.ok(shard.gems.tokens.every(({ gameId }) =>
      typeof gameId === "string" && gameId.startsWith("Metadata/Items/")));
    const icons = shard.gems.tokens.flatMap(({ icon }) => typeof icon === "string" ? [icon] : []);
    assert.ok(icons.length >= 500);
    assert.ok(icons.every((icon) => icon.startsWith("https://web.poecdn.com/gen/image/")));
  }
});

test("build gem matching preserves manual choices and reports misses", () => {
  const available = token(7, "Smite", "r", false, 1);
  available.gameId = "Metadata/Items/Gems/SkillGemSmite";
  assert.deepEqual(matchBuildGems([
    { id: "Metadata/Items/Gems/SkillGemSmite" },
    { id: "Metadata/Items/Gems/SkillGemUnavailable" },
    { id: "broken" },
  ], [available], [12]), {
    alreadySelectedTokenIds: [],
    selectedTokenIds: [7, 12],
    unavailableGameIds: ["Metadata/Items/Gems/SkillGemUnavailable"],
    unknownGameIds: ["broken"],
  });
});
