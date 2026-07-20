import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeDatFixture(
  directory: string,
  name: string,
  data: Record<string, unknown>[],
): Promise<void> {
  await writeJson(join(directory, `${name}.datc64.json`), {
    columns: [],
    data,
  });
}

async function writeAuditManifest(
  path: string,
  inputs: Record<string, string>,
): Promise<void> {
  await writeJson(path, {
    schemaVersion: 1,
    kind: "russian-display-audit-manifest",
    inputs: Object.fromEntries(
      await Promise.all(
        Object.entries(inputs).map(async ([name, input]) => [
          name,
          {
            source: `https://example.test/${name}`,
            revision: "fixture-v1",
            retrievedAt: "2026-07-20",
            sha256: createHash("sha256")
              .update(await readFile(input))
              .digest("hex"),
          },
        ]),
      ),
    ),
  });
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

test("audited display reports require versioned per-record provenance", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-display-audit-"));
  const report = join(directory, "display-report.json");
  await writeJson(report, {
    schemaVersion: 1,
    kind: "russian-display-audit",
    npcs: [
      {
        english: "Nessa",
        localized: "Несса",
        url: "",
        retrievedAt: "",
        contentSha256: "",
      },
    ],
    classes: [],
    nonRussianGems: [],
  });
  const loadDisplayAuditReport = (
    generator as typeof generator & {
      loadDisplayAuditReport: (path: string) => Promise<unknown>;
    }
  ).loadDisplayAuditReport;

  try {
    await assert.rejects(
      () => loadDisplayAuditReport(report),
      /invalid audited provenance: npcs\.0\.url/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("audited provenance manifests verify every input hash", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-display-manifest-"));
  const input = join(directory, "display-report.json");
  const manifest = join(directory, "manifest.json");
  await writeFile(input, "audited input\n");
  await writeJson(manifest, {
    schemaVersion: 1,
    kind: "russian-display-audit-manifest",
    inputs: {
      displayReport: {
        source: "https://example.test/display-report",
        revision: "fixture-v1",
        retrievedAt: "2026-07-20",
        sha256: "0".repeat(64),
      },
    },
  });
  const validateAuditManifest = (
    generator as typeof generator & {
      validateAuditManifest: (
        path: string,
        inputs: Record<string, string>,
      ) => Promise<void>;
    }
  ).validateAuditManifest;

  try {
    await assert.rejects(
      () => validateAuditManifest(manifest, { displayReport: input }),
      /audited provenance hash mismatch: displayReport/,
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

test("deterministic localization JSON uses locale-independent code-unit order", () => {
  assert.equal(
    serializeDeterministic({ Я: 4, a: 3, A: 1, я: 5, Z: 2 }),
    '{\n  "A": 1,\n  "Z": 2,\n  "a": 3,\n  "Я": 4,\n  "я": 5\n}\n',
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

test("official export mode resolves NPCs and classes through canonical references", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-official-exports-"));
  const canonicalDirectory = join(directory, "canonical");
  const exportsDirectory = join(directory, "exports");
  const output = join(directory, "ru.json");
  const auditManifest = join(directory, "manifest.json");
  await mkdir(canonicalDirectory);
  await mkdir(exportsDirectory);
  try {
    await writeJson(join(canonicalDirectory, "gems.json"), {
      gem: { id: "gem", name: "Fireball" },
    });
    await writeJson(join(canonicalDirectory, "areas.json"), {
      area: {
        id: "area",
        name: "The Coast",
        map_name: "The Coast",
        crafting_recipes: [],
      },
    });
    await writeJson(join(canonicalDirectory, "quests.json"), {
      quest: {
        id: "quest",
        name: "Enemy at the Gate",
        reward_offers: {
          offer: {
            quest_npc: "Nessa",
            quest: { gem: { classes: ["Witch"] } },
            vendor: { gem: { classes: ["Witch"], npc: "Nessa" } },
          },
        },
      },
    });
    await writeJson(join(canonicalDirectory, "characters.json"), {
      Witch: { start_gem_id: "gem", chest_gem_id: "gem" },
    });
    await writeDatFixture(exportsDirectory, "BaseItemTypes", [
      { Id: "gem", Name: "Огненный шар" },
    ]);
    await writeDatFixture(exportsDirectory, "WorldAreas", [
      { Id: "area", Name: "Побережье" },
    ]);
    await writeDatFixture(exportsDirectory, "MapPins", [
      { Name: "Побережье", Waypoint_WorldAreasKey: 0 },
    ]);
    await writeDatFixture(exportsDirectory, "Quest", [
      { Id: "quest", Name: "Враг у ворот" },
    ]);
    await writeDatFixture(exportsDirectory, "QuestRewardOffers", [
      { Id: "offer", QuestKey: 0 },
    ]);
    await writeDatFixture(exportsDirectory, "NPCs", [{ Name: "Несса" }]);
    await writeDatFixture(exportsDirectory, "NPCTalk", [
      { NPCKey: 0, QuestRewardOffersKey: 0 },
    ]);
    await writeDatFixture(exportsDirectory, "Characters", [
      { Name: "Ведьма", StartSkillGem: 0 },
    ]);
    await writeDatFixture(exportsDirectory, "SkillGems", [
      { BaseItemTypesKey: 0 },
    ]);
    await writeDatFixture(exportsDirectory, "RecipeUnlockDisplay", []);
    const manifestInputs = Object.fromEntries(
      [
        "BaseItemTypes",
        "WorldAreas",
        "MapPins",
        "Quest",
        "QuestRewardOffers",
        "NPCTalk",
        "NPCs",
        "Characters",
        "SkillGems",
        "RecipeUnlockDisplay",
      ].map((name) => [name, join(exportsDirectory, `${name}.datc64.json`)]),
    );
    await writeAuditManifest(auditManifest, manifestInputs);

    await generator.generateFromOfficialExports({
      canonicalDirectory,
      exportsDirectory,
      auditManifest,
      output,
    });

    const result = JSON.parse(await readFile(output, "utf8"));
    assert.equal(result.classes.Witch, "Ведьма");
    assert.equal(result.quests.quest.rewardNpcs.offer, "Несса");
    assert.equal(result.quests.quest.vendorNpcs.offer.gem, "Несса");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("both generator modes reject invalid provenance before writing", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-generator-no-write-"));
  const output = join(directory, "ru.json");
  const invalidManifest = join(directory, "manifest.json");
  await writeFile(output, "unchanged\n");
  await writeJson(invalidManifest, {
    schemaVersion: 1,
    kind: "russian-display-audit-manifest",
    inputs: {},
  });

  try {
    await assert.rejects(
      () =>
        generator.generateFromOfficialExports({
          canonicalDirectory: join(directory, "missing-canonical"),
          exportsDirectory: join(directory, "missing-exports"),
          auditManifest: invalidManifest,
          output,
        } as never),
      /audited provenance input coverage invalid/,
    );
    assert.equal(await readFile(output, "utf8"), "unchanged\n");

    await assert.rejects(
      () =>
        generator.generateFromAuditedSources({
          canonicalDirectory: join(directory, "missing-canonical"),
          pobGems: join(directory, "missing-gems"),
          pobReport: join(directory, "missing-pob-report"),
          poedbGemsReport: join(directory, "missing-poedb-report"),
          areasReport: join(directory, "missing-areas-report"),
          questsReport: join(directory, "missing-quests-report"),
          npcsReport: join(directory, "missing-npcs-report"),
          classSource: join(directory, "missing-class-source"),
          displayAuditReport: join(directory, "missing-display-audit"),
          auditManifest: invalidManifest,
          output,
        } as never),
      /audited provenance input coverage invalid/,
    );
    assert.equal(await readFile(output, "utf8"), "unchanged\n");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("localized names use Russian data then safe English and ID fallbacks", () => {
  const names: LocalizedNameMap = { blank: "", known: "Известное имя" };

  assert.equal(localizedName("known", "Known name", names), "Известное имя");
  assert.equal(localizedName("blank", "English name", names), "");
  assert.equal(localizedName("missing", "English name", names), "English name");
  assert.equal(localizedName("unknown", undefined, names), "unknown");
});

test("quest display helpers preserve canonical blank synthetic names", () => {
  const canonical = canonicalGameFixture();
  const localized = localizedGameFixture();
  canonical.Quests.quest.name = "";
  localized.quests.quest.name = "";

  assert.equal(
    gameData.createGameData("ru", canonical, localized).questName("quest"),
    "",
  );
  assert.equal(
    gameData.createGameData("en", canonical, localized).questName("quest"),
    "",
  );
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

test("reviewed fallback allowlists reject unnecessary entries", () => {
  const localized = localizedGameFixture();
  localized.intentionalEnglishFallbacks.gems.gem = {
    reason: "not needed",
    source: "fixture",
  };

  assert.throws(
    () => validation.assertLocalizedGameData(localized, canonicalGameFixture()),
    /unnecessary reviewed gem fallback: gem/,
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

test("quest NPC maps reject stale offer and vendor gem paths", () => {
  const rewardOffer = localizedGameFixture();
  rewardOffer.quests.quest.rewardNpcs.stale = "Лишний";
  assert.throws(
    () =>
      validation.assertLocalizedGameData(rewardOffer, canonicalGameFixture()),
    /unknown\/stale localized reward NPC path: quest\/stale/,
  );

  const vendorOffer = localizedGameFixture();
  vendorOffer.quests.quest.vendorNpcs.stale = {};
  assert.throws(
    () =>
      validation.assertLocalizedGameData(vendorOffer, canonicalGameFixture()),
    /unknown\/stale localized vendor offer path: quest\/stale/,
  );

  const vendorGem = localizedGameFixture();
  vendorGem.quests.quest.vendorNpcs.offer.stale = "Лишний";
  assert.throws(
    () => validation.assertLocalizedGameData(vendorGem, canonicalGameFixture()),
    /unknown\/stale localized vendor NPC path: quest\/offer\/stale/,
  );
});

test("localized reward NPCs reject unnecessary fallback reviews", () => {
  const localized = localizedGameFixture();
  localized.intentionalEnglishFallbacks.rewardNpcs["quest/offer"] = {
    reason: "not needed",
    source: "fixture",
  };

  assert.throws(
    () => validation.assertLocalizedGameData(localized, canonicalGameFixture()),
    /unnecessary reviewed reward NPC fallback: quest\/offer/,
  );
});

test("localized vendor NPCs reject unnecessary fallback reviews", () => {
  const localized = localizedGameFixture();
  localized.intentionalEnglishFallbacks.vendorNpcs["quest/offer/gem"] = {
    reason: "not needed",
    source: "fixture",
  };

  assert.throws(
    () => validation.assertLocalizedGameData(localized, canonicalGameFixture()),
    /unnecessary reviewed vendor NPC fallback: quest\/offer\/gem/,
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

test("checked-in Russian quest paths have exact canonical cardinality", () => {
  let rewardCount = 0;
  let vendorCount = 0;
  for (const quest of Object.values(Data.Localized.ru.quests)) {
    rewardCount += Object.keys(quest.rewardNpcs).length;
    for (const offer of Object.values(quest.vendorNpcs)) {
      vendorCount += Object.keys(offer).length;
    }
  }
  assert.equal(rewardCount, 80);
  assert.equal(vendorCount, 1231);
});

test("checked-in Russian data reviews the exact non-Russian gem set", () => {
  const expected = Object.entries(Data.Localized.ru.gems)
    .filter(([, name]) => !/[А-Яа-яЁё]/.test(name))
    .map(([id]) => id)
    .sort();
  const reviewed = Object.keys(
    Data.Localized.ru.intentionalEnglishFallbacks.gems,
  ).sort();

  assert.equal(expected.length, 18);
  assert.deepEqual(reviewed, expected);
  assert(expected.includes("Metadata/Items/Gems/SkillGemBlitz"));
  assert(expected.includes("Metadata/Items/Gems/SkillGemBloodWhirl"));
  assert(
    expected.includes("Metadata/Items/Gems/SupportGemCastLinkedCursesOnCurse"),
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
