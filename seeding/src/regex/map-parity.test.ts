import assert from "node:assert/strict";
import test from "node:test";
import { loadRegexData } from "../../../web/src/features/regex/data/loaders.js";
import {
  compileMapRegex,
  createDefaultMapSettings,
} from "../../../web/src/features/regex/core/maps.js";
import { matchesSearchExpression } from "../../../web/src/features/regex/core/search-expression.js";
import { normalizeMapEditorSettings } from "../../../web/src/features/regex/editors/compile-input.js";
import {
  applyMapFlagMode,
  mapFlagMode,
  setMapModMode,
  toggleMapRarity,
} from "../../../web/src/features/regex/editors/map-editor-state.js";

const fixtures = [
  [-2050206104, "Players have 40% less Recovery Rate of Life and Energy Shield", "Скорость восстановления здоровья и энергетического щита игроков на 40% меньше"],
  [-477049138, "Players have -10% to all maximum Resistances", "-10% к максимуму всех сопротивлений игроков"],
  [-235013251, "Monsters reflect 15% of Physical Damage", "Монстры отражают 15% физического урона"],
  [1078205993, "Monsters reflect 15% of Elemental Damage", "Монстры отражают 15% урона от стихий"],
  [17483843, "25% increased Monster Attack Speed", "25% повышение скорости атаки монстров"],
  [-1344829253, "Monsters have 250% increased Critical Strike Chance\n+35% to Monster Critical Strike Multiplier", "Монстры имеют 250% повышение шанса критического удара\n+35% к множителю критического удара монстров"],
  [-1772662453, "Monsters have 50% chance to Avoid Elemental Ailments", "Монстры с 50% шансом могут избежать стихийных состояний"],
  [-539026720, "40% less effect of Curses on Monsters", "Эффект от проклятий на монстрах на 40% меньше"],
  [-26777606, "Monsters deal 80% extra Physical Damage as Fire", "Монстры наносят 80% дополнительного физического урона в виде урона от огня"],
  [339937661, "Players are Cursed with Enfeeble", "Игроки прокляты Слабостью"],
] as const;

test("map exclusions preserve EN/RU semantics for audited legacy fixtures", async () => {
  const ids = [-235013251, 1078205993];
  for (const locale of ["en", "ru"] as const) {
    const data = await loadRegexData("maps", locale);
    const settings = createDefaultMapSettings();
    settings.badIds = ids;
    const result = compileMapRegex(settings, data.mods, locale);
    assert.deepEqual(result.matchedIds, ids.slice().sort((a, b) => a - b));
    for (const fixture of fixtures.filter(([id]) => ids.includes(id))) {
      const text = locale === "en" ? fixture[1] : fixture[2];
      assert.equal(matchesSearchExpression(result.primary, text), false, `${locale}:${fixture[0]}`);
    }
  }
});

test("map good-mod OR groups preserve selected corpus matches", async () => {
  const ids = [-2050206104, 339937661];
  for (const locale of ["en", "ru"] as const) {
    const data = await loadRegexData("maps", locale);
    const settings = createDefaultMapSettings();
    settings.goodIds = ids;
    settings.allGoodMods = false;
    const result = compileMapRegex(settings, data.mods, locale);
    for (const fixture of fixtures.filter(([id]) => ids.includes(id))) {
      assert.equal(
        matchesSearchExpression(result.primary, locale === "en" ? fixture[1] : fixture[2]),
        true,
        `${locale}:${fixture[0]}`,
      );
    }
  }
});

test("map numeric and Russian rarity clauses retain legacy behavior", async () => {
  const data = await loadRegexData("maps", "ru");
  const quantity = createDefaultMapSettings();
  quantity.quantity = "80";
  const quantityResult = compileMapRegex(quantity, data.mods, "ru");
  assert.equal(matchesSearchExpression(quantityResult.primary, "Количество предметов: +85%"), true);
  assert.equal(matchesSearchExpression(quantityResult.primary, "Количество предметов: +75%"), false);

  const rarity = createDefaultMapSettings();
  rarity.rarity = { normal: false, magic: true, rare: false, include: true };
  const rarityResult = compileMapRegex(rarity, data.mods, "ru");
  assert.equal(matchesSearchExpression(rarityResult.primary, "Редкость: Волшебный"), true);
  assert.equal(matchesSearchExpression(rarityResult.primary, "Rarity: Magic"), false);
});

test("map numeric thresholds stay exact even for legacy optimized profiles", async () => {
  const data = await loadRegexData("maps", "en");
  const settings = createDefaultMapSettings();
  settings.quantity = "85";
  settings.optimizeQuant = true;

  const result = compileMapRegex(settings, data.mods, "en");
  assert.equal(matchesSearchExpression(result.primary, "Item Quantity: +84%"), false);
  assert.equal(matchesSearchExpression(result.primary, "Item Quantity: +85%"), true);
});

test("quality reward thresholds switch cleanly between any and all", async () => {
  const data = await loadRegexData("maps", "en");
  const settings = createDefaultMapSettings();
  settings.quality.currency = "20";
  settings.quality.divination = "30";

  settings.anyQuality = true;
  const anyResult = compileMapRegex(settings, data.mods, "en");
  assert.equal(matchesSearchExpression(anyResult.primary, "Quality (Currency): +20%"), true);
  assert.equal(matchesSearchExpression(anyResult.primary, "Quality (Divination Cards): +30%"), true);

  settings.anyQuality = false;
  const allResult = compileMapRegex(settings, data.mods, "en");
  assert.equal(matchesSearchExpression(allResult.primary, "Quality (Currency): +20%"), false);
  assert.equal(matchesSearchExpression(
    allResult.primary,
    "Quality (Currency): +20%\nQuality (Divination Cards): +30%",
  ), true);
});

test("map compiler uses the common A/B limit and stable diagnostics", async () => {
  const data = await loadRegexData("maps", "en");
  const settings = createDefaultMapSettings();
  settings.badIds = fixtures.map(([id]) => id);
  const first = compileMapRegex(settings, data.mods, "en", { maxLength: 40 });
  const second = compileMapRegex(settings, data.mods, "en", { maxLength: 40 });
  assert.deepEqual(first, second);
  assert.ok(first.secondary !== undefined || first.diagnostics.some(({ severity }) => severity === "blocking"));
});

test("hidden Nightmare mods are excluded from the compiled map selection", async () => {
  const data = await loadRegexData("maps", "en");
  const nightmare = data.mods.tokens.find(({ options }) => options.nm === true);
  assert.ok(nightmare);

  const settings = createDefaultMapSettings();
  settings.badIds = [nightmare.id];
  settings.displayNightmareMods = false;

  const result = compileMapRegex(settings, data.mods, "en");
  assert.equal(result.primary, "");
  assert.deepEqual(result.matchedIds, []);
});

test("map editor exposes exact tri-state flag modes", () => {
  const defaults = createDefaultMapSettings();
  assert.equal(mapFlagMode(defaults.corrupted), "any");
  assert.deepEqual(applyMapFlagMode(defaults.corrupted, "only"), {
    enabled: true,
    include: true,
  });
  assert.deepEqual(applyMapFlagMode(defaults.corrupted, "exclude"), {
    enabled: true,
    include: false,
  });
});

test("map editor never leaves zero rarities or conflicting mod ids", () => {
  const defaults = createDefaultMapSettings();
  const rareOnly = { normal: false, magic: false, rare: true, include: true };
  assert.deepEqual(toggleMapRarity(rareOnly, "rare"), rareOnly);

  const required = setMapModMode(
    { ...defaults, badIds: [10], goodIds: [] },
    10,
    "require",
  );
  assert.deepEqual(required.badIds, []);
  assert.deepEqual(required.goodIds, [10]);

  const normalized = normalizeMapEditorSettings({ badIds: [10, 20], goodIds: [10] });
  assert.deepEqual(normalized.badIds, [20]);
  assert.deepEqual(normalized.goodIds, [10]);
});
