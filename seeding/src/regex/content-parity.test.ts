import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadRegexData } from "../../../web/src/features/regex/data/loaders.js";
import {
  compileExpeditionRegex,
  compileHeistRegex,
  compileJewelRegex,
  compilePricedBeastRegex,
  compilePricedTattooRegex,
  compileRunegraftRegex,
  compileScarabRegex,
} from "../../../web/src/features/regex/core/content.js";
import { heistContractLabels } from "../../../web/src/features/regex/heist-contract-labels.js";
import {
  bestiaryCatalog,
  beastTradeUrl,
  beastWikiUrl,
} from "../../../web/src/features/regex/bestiary-catalog.js";
import {
  heistCompileInput,
  normalizeHeistSettings,
} from "../../../web/src/features/regex/heist-settings.js";
import {
  expeditionCatalog,
  formatChaosValue,
  visibleExpeditionOutcomes,
  valuableExpeditionFillers,
} from "../../../web/src/features/regex/expedition-catalog.js";

const assertResult = (result: { primary: string; length: number; diagnostics: unknown[] }) => {
  assert.equal(result.length, result.primary.length);
  assert.ok(result.primary.length <= 250 || result.diagnostics.length > 0);
};

for (const locale of ["en", "ru"] as const) {
  test(`${locale} expedition compiles empty and selected scenarios`, async () => {
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
    const scarabEntry = (scarabs.entries as Record<string, unknown>)[scarabName] as Record<string, unknown>;
    assert.equal(typeof scarabEntry.chaosValue, "number");
    assert.match(String(scarabEntry.icon), /^https:\/\/web\.poecdn\.com\//);
    assert.ok(scarabs.priceLeague);
    assert.ok(scarabs.priceUpdatedAt);
    assertResult(compileScarabRegex([scarabName], scarabs));

    const runegrafts = await loadRegexData("runegrafts", locale);
    assert.equal(compileRunegraftRegex([], runegrafts).primary, "");
    const runegraftEntry = Array.isArray(runegrafts.entries) ? runegrafts.entries[0] : undefined;
    assert.ok(runegraftEntry && typeof runegraftEntry === "object" && "runegraft" in runegraftEntry);
    assert.equal(typeof runegraftEntry.chaosValue, "number");
    assert.match(String(runegraftEntry.icon), /^https:\/\/web\.poecdn\.com\//);
    assert.ok(Array.isArray(runegrafts.entries));
    assert.ok(runegrafts.entries.every((entry) =>
      typeof entry === "object" && entry !== null &&
      "icon" in entry && /^https:\/\/web\.poecdn\.com\//.test(String(entry.icon))));
    assert.ok(runegrafts.priceLeague);
    assert.ok(runegrafts.priceUpdatedAt);
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

test("Heist settings preserve per-contract levels, target value, and AND mode", () => {
  const settings = normalizeHeistSettings({
    contractLevels: {
      Deception: { start: 2, end: 5 },
      Agility: { start: -4, end: 99 },
      Missing: { start: 0, end: 0 },
    },
    targetValue: 1200,
    requireCoinValue: true,
  });
  assert.deepEqual(heistCompileInput(settings), {
    contracts: [
      { name: "Agility", start: 1, end: 5 },
      { name: "Deception", start: 2, end: 5 },
    ],
    targetValue: 1200,
    requireBoth: true,
  });
});

test("Market shards preserve their own economy league and timestamp", async () => {
  const snapshot = JSON.parse(readFileSync(new URL("./data/poe1-economy.json", import.meta.url), "utf8")) as {
    markets: Record<string, { generatedAt: string; league: string }>;
    schemaVersion: number;
  };
  assert.equal(snapshot.schemaVersion, 3);
  for (const tool of ["scarabs", "runegrafts"] as const) {
    const data = await loadRegexData(tool, "ru");
    assert.equal(data.priceLeague, snapshot.markets[tool].league);
    assert.equal(data.priceUpdatedAt, snapshot.markets[tool].generatedAt);
  }
});

test("Expedition catalog ranks bases by valuable unique outcomes", async () => {
  const data = await loadRegexData("expedition", "ru");
  const catalog = expeditionCatalog(data);
  const heavyBelt = catalog.find(({ id }) => id === "Heavy Belt");
  assert.ok(Object.keys(data.fallbackPrices).length > 500);
  assert.ok(heavyBelt);
  assert.ok(heavyBelt.maxChaosValue > 0);
  assert.ok(heavyBelt.uniques.some(({ name, label }) => name === "Mageblood" && label === "Волшебная кровь"));
  assert.ok(catalog.every((entry, index) => index === 0 || catalog[index - 1].maxChaosValue >= entry.maxChaosValue));
});

test("Expedition thumbnails are limited to valuable outcomes with real art", async () => {
  const data = await loadRegexData("expedition", "en");
  const outcomes = expeditionCatalog(data).flatMap((entry) => visibleExpeditionOutcomes(entry, 100));
  assert.ok(outcomes.length > 0);
  assert.ok(outcomes.every(({ chaosValue, icon }) => chaosValue >= 100 && /^https:\/\//.test(icon)));
});

test("Bestiary recipes reflect the current league changes", async () => {
  const data = await loadRegexData("beast", "en");
  const entries = Array.isArray(data.entries) ? data.entries as Array<{ recipe?: string }> : [];
  const recipes = entries.map(({ recipe }) => recipe ?? "").join("\n");
  assert.doesNotMatch(recipes, /30% base Quality|Five Kirac Missions|Map Crafting Option|Orbs of Horizons/i);
  assert.match(recipes, /Implicit Modifier|Nightmare Map|valuable Scarab|Orbs of Unmaking/i);
  const russian = bestiaryCatalog(await loadRegexData("beast", "ru"), "ru");
  assert.ok(russian.some(({ recipe }) => recipe?.includes("карта кошмара")));
  assert.ok(russian.filter(({ recipe }) => recipe).every(({ recipe }) => recipe?.trim()));
  assert.match(beastTradeUrl("Craicic Chimeral"), /^https:\/\/www\.pathofexile\.com\/trade\/search\/Mirage\?q=/);
  assert.equal(beastWikiUrl("Craicic Chimeral"), "https://www.poewiki.net/wiki/Craicic_Chimeral");
});

test("Every tattoo exposes a real localized effect", async () => {
  for (const locale of ["en", "ru"] as const) {
    const data = await loadRegexData("tattoos", locale);
    const entries = Array.isArray(data.entries) ? data.entries as Array<{ tattoo?: string; description?: string }> : [];
    assert.ok(entries.every((entry) => {
      const translated = entry.tattoo && data.translations[entry.tattoo] as { displayDescription?: unknown } | undefined;
      const description = typeof translated?.displayDescription === "string"
        ? translated.displayDescription : entry.description;
      return typeof description === "string" && description.trim() !== "" &&
        !description.startsWith("Описание отсутствует");
    }));
  }
});

test("Expedition valuable fillers stay within a single copyable regex", async () => {
  const data = await loadRegexData("expedition", "en");
  const selected = ["Heavy Belt"];
  const fillers = valuableExpeditionFillers(selected, 100, data);
  assert.ok(fillers.length > 0);
  assert.ok(!fillers.includes("Heavy Belt"));
  assert.ok(fillers.every((id) => expeditionCatalog(data).find((entry) => entry.id === id)!.maxChaosValue >= 100));
  const result = compileExpeditionRegex(selected, fillers, data);
  assert.equal(result.secondary, undefined);
  assert.ok(result.primary.length <= 250);
});

test("Expedition prices stay compact in dense cards", () => {
  assert.equal(formatChaosValue(6_686_190, "en"), "6.7Mc");
  assert.match(formatChaosValue(6_686_190, "ru"), /^6,7\s*млнc$/);
  assert.equal(formatChaosValue(99, "ru"), "99c");
  assert.equal(formatChaosValue(0.3, "en"), "0.3c");
});
