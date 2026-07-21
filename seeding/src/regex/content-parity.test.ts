import assert from "node:assert/strict";
import test from "node:test";
import { loadRegexData } from "../../../web/src/features/regex/data/loaders.js";
import {
  compileExpeditionRegex,
  compileHeistRegex,
  compileJewelRegex,
  compileMapNameRegex,
  compilePricedBeastRegex,
  compilePricedTattooRegex,
  compileRunegraftRegex,
  compileScarabRegex,
} from "../../../web/src/features/regex/core/content.js";
import { heistContractLabels } from "../../../web/src/features/regex/heist-contract-labels.js";

const assertResult = (result: { primary: string; length: number; diagnostics: unknown[] }) => {
  assert.equal(result.length, result.primary.length);
  assert.ok(result.primary.length <= 250 || result.diagnostics.length > 0);
};

for (const locale of ["en", "ru"] as const) {
  test(`${locale} map names and expedition compile empty and selected scenarios`, async () => {
    const mapnames = await loadRegexData("mapnames", locale);
    assert.equal(compileMapNameRegex([], false, mapnames).primary, "");
    const mapName = Object.keys(mapnames.entries)[0];
    assert.ok(mapName);
    const mapResult = compileMapNameRegex([mapName], false, mapnames);
    assertResult(mapResult);
    assert.notEqual(mapResult.primary, "");

    const expedition = await loadRegexData("expedition", locale);
    assert.equal(compileExpeditionRegex([], [], expedition).primary, "");
    const base = Object.keys(expedition.baseTypeRegex)[0];
    assert.ok(base);
    const expeditionResult = compileExpeditionRegex([base], [], expedition);
    assertResult(expeditionResult);
    assert.notEqual(expeditionResult.primary, "");
  });

  test(`${locale} heist compiles default and ranged contract scenarios`, async () => {
    const data = await loadRegexData("heist", locale);
    assert.equal(compileHeistRegex([], 0, false, data).primary, "");
    const name = Object.keys(data.contractTypes)[0];
    assert.ok(name);
    const result = compileHeistRegex([{ name, start: 1, end: 2 }], 0, false, data);
    assertResult(result);
    assert.match(result.primary, /\[12\]/);
  });

  test(`${locale} beast and tattoo price filters compile bounded selections`, async () => {
    const beasts = await loadRegexData("beast", locale);
    const beastEntry = Array.isArray(beasts.entries) ? beasts.entries[0] : undefined;
    assert.ok(beastEntry && typeof beastEntry === "object");
    assert.equal(compilePricedBeastRegex([], { includeHarvest: true, redOnly: false }).primary, "");
    const beastResult = compilePricedBeastRegex(
      [{ ...(beastEntry as object), chaosValue: 10 }],
      { includeHarvest: true, redOnly: false, minValue: 5, maxValue: 15 },
      beasts.translations,
    );
    assertResult(beastResult);
    assert.notEqual(beastResult.primary, "");

    const tattoos = await loadRegexData("tattoos", locale);
    const tattooEntry = Array.isArray(tattoos.entries) ? tattoos.entries[0] : undefined;
    assert.ok(tattooEntry && typeof tattooEntry === "object");
    assert.equal(compilePricedTattooRegex([], 0, 100, tattoos.translations).primary, "");
    const tattooResult = compilePricedTattooRegex(
      [{ ...(tattooEntry as object), chaosValue: 10 }], 5, 15, tattoos.translations,
    );
    assertResult(tattooResult);
    assert.notEqual(tattooResult.primary, "");
  });

  test(`${locale} scarab, runegraft, and jewel selections preserve shard semantics`, async () => {
    const scarabs = await loadRegexData("scarabs", locale);
    assert.equal(compileScarabRegex([], scarabs).primary, "");
    const scarabName = Object.keys(scarabs.entries)[0];
    assert.ok(scarabName);
    assertResult(compileScarabRegex([scarabName], scarabs));

    const runegrafts = await loadRegexData("runegrafts", locale);
    assert.equal(compileRunegraftRegex([], runegrafts).primary, "");
    const runegraftEntry = Array.isArray(runegrafts.entries) ? runegrafts.entries[0] : undefined;
    assert.ok(runegraftEntry && typeof runegraftEntry === "object" && "runegraft" in runegraftEntry);
    assertResult(compileRunegraftRegex([String(runegraftEntry.runegraft)], runegrafts));

    const jewels = await loadRegexData("jewels", locale);
    assert.equal(compileJewelRegex({ selected: [], abyss: false, allMatch: false }, jewels).primary, "");
    const jewel = jewels.regular[0] as { mod?: string } | undefined;
    assert.ok(jewel?.mod);
    assertResult(compileJewelRegex({ selected: [jewel.mod], abyss: false, allMatch: false }, jewels));
  });
}

test("Russian Heist contract labels are concise and bilingual", async () => {
  const data = await loadRegexData("heist", "ru");
  const labels = heistContractLabels(data);
  assert.equal(labels.length, 9);
  assert.deepEqual(labels.find(({ id }) => id === "Counter-Thaumaturgy"), {
    id: "Counter-Thaumaturgy",
    primary: "Контрмагия",
    secondary: "Counter-Thaumaturgy",
  });
  assert.ok(labels.every(({ primary, secondary }) => primary && secondary));
});
