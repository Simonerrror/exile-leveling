import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compileVendorRegex } from "../../../web/src/features/regex/core/vendor.js";
import { createDefaultToolSettings } from "../../../web/src/features/regex/profile/schema.js";
import { loadRegexData } from "../../../web/src/features/regex/data/loaders.js";
import { matchesSearchExpression } from "../../../web/src/features/regex/core/search-expression.js";

test("vendor emits 2–6 link-count patterns plus retained filters", async () => {
  const data = await loadRegexData("vendor", "en");
  const firstGem = data.gems.tokens[0];
  assert.ok(firstGem);
  const settings = createDefaultToolSettings().vendor;
  settings.linkCounts = [2, 3, 4, 6];
  settings.movement.ten = true;
  settings.weapon.wand = true;
  settings.damage.phys = true;
  settings.gems = [firstGem.id];

  const result = compileVendorRegex(settings, data.gems, "en");
  assert.match(result.primary, /\(-\\w\)\{1\}/);
  assert.match(result.primary, /\(-\\w\)\{2\}/);
  assert.match(result.primary, /\(-\\w\)\{3\}/);
  assert.match(result.primary, /\(-\\w\)\{5\}/);
  assert.match(result.primary, /Runn/);
  assert.match(result.primary, /s:\.\+wa/);
  assert.ok(result.matchedIds.includes(firstGem.id));
  assert.equal(result.length, result.primary.length);
});

test("vendor source and output contain no color-link or six-socket paths", async () => {
  const source = readFileSync(
    new URL("../../../web/src/features/regex/core/vendor.ts", import.meta.url),
    "utf8",
  );
  for (const forbidden of [
    "anyTwoColorLink", "anyThreeColorLink",
    "anyFourColorLink", "anyFiveColorLink", "anySixColorLink", "anySixSocket",
    "specLink", "specLinkColors", "[rgb]", "r-r", "c-c",
  ]) assert.equal(source.includes(forbidden), false, forbidden);

  const data = await loadRegexData("vendor", "ru");
  const settings = createDefaultToolSettings().vendor;
  settings.linkCounts = [5];
  settings.movement.fifteen = true;
  const result = compileVendorRegex(settings, data.gems, "ru");
  assert.equal(matchesSearchExpression(result.primary, "Резкие сапоги"), true);
  assert.equal(result.primary.includes("[rgb]"), false);
});
