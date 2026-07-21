import assert from "node:assert/strict";
import test from "node:test";
import { loadRegexData } from "../../../web/src/features/regex/data/loaders.js";
import { compileFlaskRegex } from "../../../web/src/features/regex/core/flasks.js";
import { compileItemRegex } from "../../../web/src/features/regex/core/items.js";

for (const locale of ["en", "ru"] as const) {
  test(`${locale} flask compiles empty and selected prefix/suffix scenarios`, async () => {
    const data = await loadRegexData("flasks", locale);
    const defaults = {
      selectedPrefix: [], selectedSuffix: [], itemLevel: 85,
      onlyMaxPrefix: false, onlyMaxSuffix: false,
      requireBoth: true, matchOpenAffix: true, ignoreEffectTiers: false,
    };
    assert.equal(compileFlaskRegex(defaults, data, locale).primary, "");

    const prefix = (locale === "ru" && Array.isArray(data.translations.prefix)
      ? data.translations.prefix[0]
      : data.prefix[0]) as { description?: string } | undefined;
    const suffix = (locale === "ru" && Array.isArray(data.translations.suffix)
      ? data.translations.suffix[0]
      : data.suffix[0]) as { description?: string } | undefined;
    assert.ok(prefix?.description && suffix?.description);
    const result = compileFlaskRegex({
      ...defaults,
      selectedPrefix: [prefix.description],
      selectedSuffix: [suffix.description],
    }, data, locale);
    assert.notEqual(result.primary, "");
    assert.equal(result.length, result.primary.length);
  });
}

test("items compile empty, any, all, and prefix/suffix modes through the shared limit", () => {
  assert.equal(compileItemRegex({ baseName: "", selected: [], mode: "any", matchOpenAffix: false }).primary, "");
  const selected = [
    { pattern: "maximum life", kind: "prefix" as const },
    { pattern: "fire resistance", kind: "suffix" as const },
  ];
  const any = compileItemRegex({ baseName: "Hubris Circlet", selected, mode: "any", matchOpenAffix: false });
  assert.equal(any.primary, '"maximum life|fire resistance"');
  const all = compileItemRegex({ baseName: "Hubris Circlet", selected, mode: "all", matchOpenAffix: false });
  assert.equal(all.primary, '"maximum life" "fire resistance"');
  const both = compileItemRegex({ baseName: "Hubris Circlet", selected, mode: "prefix-and-suffix", matchOpenAffix: true });
  assert.match(both.primary, /Hubris Circlet/);
  assert.equal(both.length, both.primary.length);
});

test("items report A/B or a blocking diagnostic above 250 characters", () => {
  const selected = Array.from({ length: 30 }, (_, index) => ({
    pattern: `modifier-pattern-${String(index).padStart(2, "0")}`,
    kind: "prefix" as const,
  }));
  const result = compileItemRegex({ baseName: "Item", selected, mode: "any", matchOpenAffix: false });
  assert.ok(result.secondary !== undefined || result.diagnostics.some(({ severity }) => severity === "blocking"));
});

for (const locale of ["en", "ru"] as const) {
  test(`${locale} flask restores Mageblood tier matching and minimum item level`, async () => {
    const data = await loadRegexData("flasks", locale);
    const prefixGroups = (locale === "ru" ? data.translations.prefix : data.prefix) as Array<{
      description: string;
      displayDescription?: string;
      regex: string;
      mods: Array<{ level: number; regex: string }>;
    }>;
    const effect = prefixGroups.find(({ description }) => description.includes("reduced Duration"));
    assert.ok(effect);
    if (locale === "ru") assert.match(effect.displayDescription ?? "", /усиление эффекта/i);

    const base = {
      selectedPrefix: [effect.description], selectedSuffix: [], itemLevel: 85,
      onlyMaxPrefix: true, onlyMaxSuffix: false,
      requireBoth: true, matchOpenAffix: true,
    };
    const tiered = compileFlaskRegex({ ...base, ignoreEffectTiers: false }, data, locale);
    const mageblood = compileFlaskRegex({ ...base, ignoreEffectTiers: true }, data, locale);
    const highestTier = [...effect.mods].sort((left, right) => right.level - left.level)[0];
    assert.ok(highestTier);
    assert.match(tiered.primary, new RegExp(highestTier.regex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(mageblood.primary, new RegExp(effect.regex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.notEqual(mageblood.primary, tiered.primary);
    assert.ok(mageblood.diagnostics.some(({ code, message }) =>
      code === "minimum-item-level" && /\d+/.test(message)));
  });
}
