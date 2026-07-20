import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Data } from "common";
import * as validation from "./validate.js";
import {
  assertMessageDictionary,
  assertMessageParity,
  assertRouteParity,
  routeSignature,
} from "./validate.js";
import {
  localizedName,
  type LocalizedNameMap,
} from "../../../web/src/i18n/game-data.js";
import * as gameData from "../../../web/src/i18n/game-data.js";
import {
  loadDatExport,
  serializeDeterministic,
} from "./generate-ru-display-data.js";
import * as generator from "./generate-ru-display-data.js";

function canonicalGameFixture() {
  return {
    Gems: {
      gem: { id: "gem", name: "Fireball" },
    },
    Areas: {
      area: {
        id: "area",
        name: "The Coast",
        map_name: "The Coast",
        crafting_recipes: ["Fire Damage - Rank 1"],
      },
    },
    Quests: {
      quest: {
        id: "quest",
        name: "Enemy at the Gate",
        reward_offers: {
          offer: {
            quest_npc: "Tarkleigh",
            quest: { gem: { classes: [] } },
            vendor: { gem: { classes: [], npc: "Nessa" } },
          },
        },
      },
    },
    Characters: { Marauder: {} },
  };
}

function localizedGameFixture() {
  return {
    gems: { gem: "Огненный шар" },
    areas: {
      area: {
        name: "Побережье",
        mapName: "Побережье",
        craftingRecipes: [] as string[],
      },
    },
    quests: {
      quest: {
        name: "Враг у ворот",
        rewardNpcs: { offer: "Таркли" },
        vendorNpcs: { offer: { gem: "Несса" } },
      },
    },
    classes: { Marauder: "Дикарь" },
    literals: {},
    intentionalEnglishFallbacks: {
      gems: {},
      areaMapNames: {},
      craftingRecipes: {
        area: {
          reason: "No audited RecipeUnlockDisplay export is available.",
          source: "canonical English fallback",
        },
      },
      questNames: {},
      rewardNpcs: {},
      vendorNpcs: {},
    },
  };
}

test("entity coverage reports missing and unknown IDs", () => {
  const assertEntityCoverage = (
    validation as typeof validation & {
      assertEntityCoverage: (
        kind: string,
        canonical: Record<string, unknown>,
        localized: Record<string, unknown>,
      ) => void;
    }
  ).assertEntityCoverage;

  assert.throws(
    () =>
      assertEntityCoverage(
        "gem",
        { canonical: {}, missing: {} },
        { canonical: {}, stale: {} },
      ),
    /gem coverage invalid: missing IDs: missing; unknown\/stale IDs: stale/,
  );
});

test("the generator rejects missing and malformed DAT exports", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-display-data-"));
  try {
    await assert.rejects(
      () => loadDatExport(directory, "WorldAreas"),
      /missing localization source: .*WorldAreas\.datc64\.json/,
    );
    await writeFile(
      join(directory, "WorldAreas.datc64.json"),
      JSON.stringify({ data: "wrong" }),
    );
    await assert.rejects(
      () => loadDatExport(directory, "WorldAreas"),
      /invalid localization source schema: .*WorldAreas\.datc64\.json/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("deterministic localization JSON sorts keys and ends with a newline", () => {
  assert.equal(
    serializeDeterministic({ z: { b: 2, a: 1 }, a: 0 }),
    '{\n  "a": 0,\n  "z": {\n    "a": 1,\n    "b": 2\n  }\n}\n',
  );
});

test("the generator validates complete canonical coverage before writing", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-display-data-"));
  const output = join(directory, "ru.json");
  await writeFile(output, "unchanged\n");
  const localized = localizedGameFixture();
  delete (localized.gems as Record<string, string>).gem;
  const writeValidatedData = (
    generator as typeof generator & {
      writeValidatedData: (
        value: unknown,
        canonical: ReturnType<typeof canonicalGameFixture>,
        output: string,
      ) => Promise<void>;
    }
  ).writeValidatedData;

  try {
    await assert.rejects(
      () => writeValidatedData(localized, canonicalGameFixture(), output),
      /gem coverage invalid: missing IDs: gem/,
    );
    assert.equal(await readFile(output, "utf8"), "unchanged\n");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("localized names use Russian data then safe English and ID fallbacks", () => {
  const names: LocalizedNameMap = { known: "Известное имя" };

  assert.equal(localizedName("known", "Known name", names), "Известное имя");
  assert.equal(localizedName("missing", "English name", names), "English name");
  assert.equal(localizedName("unknown", undefined, names), "unknown");
});

test("game display helpers localize without mutating canonical data", () => {
  const canonical = canonicalGameFixture();
  const localized = localizedGameFixture();
  (localized.literals as Record<string, string>).Brutus = "Брут";
  const before = structuredClone(canonical);
  const createGameData = (
    gameData as typeof gameData & {
      createGameData: (
        locale: "en" | "ru",
        canonical: ReturnType<typeof canonicalGameFixture>,
        localized: ReturnType<typeof localizedGameFixture>,
      ) => {
        gemName: (id: string) => string;
        areaName: (id: string) => string;
        areaMapName: (id: string) => string | null;
        questName: (id: string) => string;
        className: (id: string) => string;
        rewardNpc: (questId: string, offerId: string) => string;
        vendorNpc: (questId: string, offerId: string, gemId: string) => string;
        literal: (english: string) => string;
      };
    }
  ).createGameData;

  const russian = createGameData("ru", canonical, localized);
  assert.equal(russian.gemName("gem"), "Огненный шар");
  assert.equal(russian.areaName("area"), "Побережье");
  assert.equal(russian.areaMapName("area"), "Побережье");
  assert.equal(russian.questName("quest"), "Враг у ворот");
  assert.equal(russian.className("Marauder"), "Дикарь");
  assert.equal(russian.rewardNpc("quest", "offer"), "Таркли");
  assert.equal(russian.vendorNpc("quest", "offer", "gem"), "Несса");
  assert.equal(russian.literal("Brutus"), "Брут");
  assert.equal(russian.gemName("unknown"), "unknown");
  assert.equal(russian.rewardNpc("unknown", "offer"), "offer");

  const english = createGameData("en", canonical, localized);
  assert.equal(english.gemName("gem"), "Fireball");
  assert.equal(english.rewardNpc("quest", "offer"), "Tarkleigh");
  assert.deepEqual(canonical, before);
});

test("localized game data accepts a complete canonical fixture", () => {
  const assertLocalizedGameData = (
    validation as typeof validation & {
      assertLocalizedGameData: (
        localized: unknown,
        canonical: {
          Gems: Record<string, unknown>;
          Areas: Record<string, unknown>;
          Quests: Record<string, unknown>;
          Characters: Record<string, unknown>;
        },
      ) => void;
    }
  ).assertLocalizedGameData;

  assert.doesNotThrow(() =>
    assertLocalizedGameData(localizedGameFixture(), canonicalGameFixture()),
  );
});

test("localized game data rejects empty required display values", () => {
  const localized = localizedGameFixture();
  localized.gems.gem = "";

  assert.throws(
    () =>
      (
        validation as typeof validation & {
          assertLocalizedGameData: (
            localized: unknown,
            canonical: ReturnType<typeof canonicalGameFixture>,
          ) => void;
        }
      ).assertLocalizedGameData(localized, canonicalGameFixture()),
    /invalid localized game data: gems\.gem must be a non-empty string/,
  );
});

test("English display values require an explicit reviewed fallback", () => {
  const localized = localizedGameFixture();
  localized.gems.gem = "Fireball";

  assert.throws(
    () => validation.assertLocalizedGameData(localized, canonicalGameFixture()),
    /English gem fallback is not reviewed: gem/,
  );
});

test("reviewed fallback allowlists reject stale IDs", () => {
  const localized = localizedGameFixture();
  (
    localized.intentionalEnglishFallbacks.gems as Record<
      string,
      { reason: string; source: string }
    >
  ).stale = { reason: "old", source: "old source" };

  assert.throws(
    () => validation.assertLocalizedGameData(localized, canonicalGameFixture()),
    /unknown\/stale reviewed gem fallback: stale/,
  );
});

test("localized game data requires map names when canonical MapPins have one", () => {
  const localized = localizedGameFixture();
  localized.areas.area.mapName = null as unknown as string;

  assert.throws(
    () => validation.assertLocalizedGameData(localized, canonicalGameFixture()),
    /invalid localized game data: areas\.area\.mapName must be a non-empty string/,
  );
});

test("crafting recipe omissions require an explicit reviewed fallback", () => {
  const localized = localizedGameFixture();
  delete (
    localized.intentionalEnglishFallbacks.craftingRecipes as Record<
      string,
      unknown
    >
  ).area;

  assert.throws(
    () => validation.assertLocalizedGameData(localized, canonicalGameFixture()),
    /crafting recipe fallback is not reviewed: area/,
  );
});

test("every canonical quest reward NPC path must resolve", () => {
  const localized = localizedGameFixture();
  delete (localized.quests.quest.rewardNpcs as Record<string, string>).offer;

  assert.throws(
    () => validation.assertLocalizedGameData(localized, canonicalGameFixture()),
    /missing localized reward NPC path: quest\/offer/,
  );
});

test("every canonical vendor NPC gem path must resolve", () => {
  const localized = localizedGameFixture();
  delete (localized.quests.quest.vendorNpcs.offer as Record<string, string>)
    .gem;

  assert.throws(
    () => validation.assertLocalizedGameData(localized, canonicalGameFixture()),
    /missing localized vendor NPC path: quest\/offer\/gem/,
  );
});

test("checked-in Russian game data has exact canonical coverage", () => {
  assert.doesNotThrow(() =>
    validation.assertLocalizedGameData(Data.Localized.ru, Data),
  );
  assert.deepEqual(
    {
      gems: Object.keys(Data.Localized.ru.gems).length,
      areas: Object.keys(Data.Localized.ru.areas).length,
      quests: Object.keys(Data.Localized.ru.quests).length,
      classes: Object.keys(Data.Localized.ru.classes).length,
    },
    { gems: 839, areas: 163, quests: 93, classes: 7 },
  );
  assert.deepEqual(
    new Set(Object.values(Data.Localized.ru.quests.a3q8.vendorNpcs.a3q8)),
    new Set(["Кларисса", "Марамоа"]),
  );
});

test("message dictionaries require a plain object root", () => {
  assert.throws(
    () => assertMessageDictionary([], "web/src/i18n/messages/ru.json"),
    /invalid message dictionary root: web\/src\/i18n\/messages\/ru.json must be a plain object/,
  );
});

test("message dictionaries require string values", () => {
  assert.throws(
    () =>
      assertMessageDictionary({ route: 42 }, "web/src/i18n/messages/ru.json"),
    /invalid message dictionary value: web\/src\/i18n\/messages\/ru.json key route must be a string/,
  );
});

test("message dictionaries require identical keys", () => {
  assert.throws(
    () => assertMessageParity({ route: "Route" }, {}),
    /missing Russian message key: route/,
  );
});

test("message parity does not count inherited object properties", () => {
  assert.throws(
    () => assertMessageParity({ constructor: "Constructor" }, {}),
    /missing Russian message key: constructor/,
  );
});

test("route signatures ignore translated prose", () => {
  assert.deepEqual(
    routeSignature("Enter {arena|The Warden's Quarters} ➞ {enter|1_1_2}"),
    routeSignature("Войди {arena|Покои надзирателя} ➞ {enter|1_1_2}"),
  );
});

test("route signatures preserve structural ids", () => {
  assert.throws(
    () =>
      assertRouteParity("Talk ➞ {enter|1_1_2}", "Иди ➞ {enter|1_1_3}", "act-1"),
    /route structure differs: act-1 line 1/,
  );
});

test("kill names remain structural because they unlock waypoints", () => {
  assert.throws(
    () => assertRouteParity("Kill {kill|Brutus}", "Убей {kill|Брут}", "act-1"),
    /route structure differs: act-1 line 1/,
  );
});

test("route signatures ignore translated sub-step prose", () => {
  assert.doesNotThrow(() =>
    assertRouteParity(
      "    #sub Find {generic|Loose Candle}",
      "    #sub Найди {generic|Потайную свечу}",
      "act-3",
    ),
  );
});

test("route signatures preserve conditional macros", () => {
  assert.throws(
    () =>
      assertRouteParity("#ifdef LEAGUE_START", "#ifdef RUSSIAN_START", "act-1"),
    /route structure differs: act-1 line 1/,
  );
});

test("route signatures preserve conditional trailing whitespace", () => {
  assert.throws(
    () =>
      assertRouteParity("#ifdef LEAGUE_START", "#ifdef LEAGUE_START ", "act-1"),
    /route structure differs: act-1 line 1/,
  );
});

test("route signatures preserve vendor reward costs", () => {
  assert.throws(
    () =>
      assertRouteParity(
        "Buy {reward_vendor|Flame Dash|transmutation}",
        "Купи {reward_vendor|Огненный рывок|alteration}",
        "act-1",
      ),
    /route structure differs: act-1 line 1/,
  );
});

test("route signatures reject invalid display fragment arity", () => {
  assert.throws(
    () => routeSignature("Enter {arena}"),
    /invalid route fragment arity: arena/,
  );
});

test("route parity adds route and line context to arity errors", () => {
  assert.throws(
    () =>
      assertRouteParity(
        "one\nEnter {arena}",
        "один\nВойди {arena|Арена}",
        "act-2",
      ),
    /route structure differs: act-2 line 2: invalid route fragment arity: arena/,
  );
});

test("route parity requires the same line count", () => {
  assert.throws(
    () => assertRouteParity("one\ntwo", "один", "act-1"),
    /route line count differs: act-1/,
  );
});
