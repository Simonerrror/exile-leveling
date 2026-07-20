import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Data } from "common";
import { initializeRouteState } from "../../../common/src/route-processing/index.js";
import { parseFragments } from "../../../common/src/route-processing/fragment/index.js";
import { ScopedLogger } from "../../../common/src/route-processing/scoped-logger.js";
import * as validation from "./validate.js";
import {
  assertMessageDictionary,
  assertMessageParity,
  assertRouteParity,
  routeSignature,
} from "./validate.js";
import {
  buildVendorSearchString,
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
  };
}

function localizedAuditFixture() {
  const sourceKinds = [
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
  ];
  return {
    schemaVersion: 1,
    kind: "russian-game-data-audit",
    sourceMetadata: {
      schemaVersion: 1,
      sources: sourceKinds.map((kind) => ({
        kind,
        source: `https://example.test/${kind}`,
        revision: "fixture-v1",
        retrievedAt: "2026-07-20",
        sha256: "0".repeat(64),
      })),
    },
    intentionalEnglishFallbacks: {
      gems: {},
      classes: {},
      areaNames: {},
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
      literals: {},
    },
  };
}

function assertLocalizedFixture(
  localized = localizedGameFixture(),
  audit = localizedAuditFixture(),
  canonical = canonicalGameFixture(),
): void {
  validation.assertLocalizedGameData(localized, audit, canonical);
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
  const pobCommit = "696d36aabaffb88f9c75ee424a1b4433b3233597";
  const provenance = (name: string) => {
    if (["pobGems", "pobReport", "classSource"].includes(name)) {
      return {
        source: `https://gitverse.ru/pathofbuilding/PathOfBuilding/content/${pobCommit}/${name}`,
        revision: pobCommit,
      };
    }
    if (
      ["poedbGemsReport", "areasReport", "questsReport", "npcsReport"].includes(
        name,
      )
    ) {
      return {
        source: `https://poedb.tw/ru/${name}`,
        revision: "retrieved-2026-07-20",
      };
    }
    if (name === "displayAuditReport" || name === "routeLiteralAuditReport") {
      return {
        source: `https://github.com/Simonerrror/exile-leveling/blob/codex/russian-localization/seeding/data/localization/${name}.json`,
        revision: "fixture-v1",
      };
    }
    return {
      source: `https://example.test/${name}`,
      revision: "fixture-v1",
    };
  };
  await writeJson(path, {
    schemaVersion: 1,
    kind: "russian-display-audit-manifest",
    inputs: Object.fromEntries(
      await Promise.all(
        Object.entries(inputs).map(async ([name, input]) => [
          name,
          {
            ...provenance(name),
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

function routeLiteralAuditFixture(
  classes: Record<string, string> = { Witch: "Ведьма" },
) {
  const auditedLiteral = (display: string) => ({
    display,
    officialNominative: display,
    status: "verified-fixture",
    grammaticalContext: "fixture display",
    source: {
      kind: "fixture",
      path: "fixture",
      revision: "fixture-v1",
      contentSha256: "3".repeat(64),
    },
  });
  return {
    schemaVersion: 1,
    kind: "russian-route-kill-and-build-info-literal-audit",
    sourceMetadata: {
      canonicalizedBase: {
        runtime: { sha256: "4".repeat(64) },
        audit: { sha256: "5".repeat(64) },
      },
    },
    coverage: {
      uniqueRouteKillLiterals: 0,
      killMappings: 0,
      killRussianDisplayValues: 0,
      killEnglishFallbacks: 0,
      buildInfoBandits: 3,
      buildInfoClasses: Object.keys(classes).length,
    },
    mappings: {
      killLiterals: {},
      buildInfoBandits: {
        Alira: auditedLiteral("Алира"),
        Kraityn: auditedLiteral("Крайтин"),
        Oak: auditedLiteral("Дуб"),
      },
      buildInfoClasses: Object.fromEntries(
        Object.entries(classes).map(([id, display]) => [
          id,
          auditedLiteral(display),
        ]),
      ),
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

test("route literal audits reject non-Russian runtime display values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-literal-audit-"));
  const report = join(directory, "literal-audit.json");
  const audit = JSON.parse(
    await readFile(
      new URL(
        "../../data/localization/ru-route-literal-audit.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  audit.mappings.killLiterals.Hillock.display = "Hillock";
  await writeJson(report, audit);

  try {
    await assert.rejects(
      () => generator.loadRouteLiteralAuditReport(report),
      /non-Russian audited route literal: Hillock/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("canonical literal base hashes cover every non-literal runtime and audit field", async () => {
  const runtime = structuredClone(Data.Localized.ru);
  const audit = JSON.parse(
    await readFile(
      new URL("../../data/localization/ru-output-audit.json", import.meta.url),
      "utf8",
    ),
  );

  assert.deepEqual(generator.canonicalizedLiteralBaseHashes(runtime, audit), {
    runtime: "a825926eb53148d4a2af00725d57f4a789c81101c5fbeb20a0daa8b2d6cb3d6a",
    audit: "0b0d2cc89f47d5de9215277493afcca021f595258d9f80ef0e83dd1460e0446c",
  });
});

test("literal application rejects tampered runtime and audit bases", async () => {
  const report = await generator.loadRouteLiteralAuditReport(
    new URL(
      "../../data/localization/ru-route-literal-audit.json",
      import.meta.url,
    ).pathname,
  );
  const runtime = structuredClone(Data.Localized.ru);
  const audit = JSON.parse(
    await readFile(
      new URL("../../data/localization/ru-output-audit.json", import.meta.url),
      "utf8",
    ),
  );
  const metadata = audit.sourceMetadata.sources.find(
    (source: { kind: string }) => source.kind === "routeLiteralAuditReport",
  );

  const tamperedRuntime = structuredClone(runtime);
  tamperedRuntime.gems[Object.keys(tamperedRuntime.gems)[0]] = "Подмена";
  assert.throws(
    () =>
      generator.applyRouteLiteralAudit(
        tamperedRuntime,
        audit,
        report,
        metadata,
        true,
      ),
    /localized literal base runtime hash mismatch/,
  );

  const tamperedAudit = structuredClone(audit);
  tamperedAudit.sourceMetadata.sources[0].revision = "tampered";
  assert.throws(
    () =>
      generator.applyRouteLiteralAudit(
        runtime,
        tamperedAudit,
        report,
        metadata,
        true,
      ),
    /localized literal base audit hash mismatch/,
  );
});

test("literal merge rejects non-literal tampering without writing", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-literal-merge-"));
  const canonicalDirectory = new URL(
    "../../../common/data/json/",
    import.meta.url,
  ).pathname;
  const routeLiteralAuditReport = new URL(
    "../../data/localization/ru-route-literal-audit.json",
    import.meta.url,
  ).pathname;
  const auditManifest = new URL(
    "../../data/localization/ru-audit-manifest.json",
    import.meta.url,
  ).pathname;
  const runtimeSource = JSON.parse(
    await readFile(
      new URL("../../../common/data/i18n/ru.json", import.meta.url),
      "utf8",
    ),
  );
  const auditSource = JSON.parse(
    await readFile(
      new URL("../../data/localization/ru-output-audit.json", import.meta.url),
      "utf8",
    ),
  );

  try {
    for (const [name, mutate] of [
      [
        "gem",
        (runtime: typeof runtimeSource) => {
          runtime.gems[Object.keys(runtime.gems)[0]] = "Подмена";
        },
      ],
      [
        "area",
        (runtime: typeof runtimeSource) => {
          runtime.areas[Object.keys(runtime.areas)[0]].name = "Подмена";
        },
      ],
      [
        "audit",
        (_runtime: typeof runtimeSource, audit: typeof auditSource) => {
          audit.sourceMetadata.sources[0].revision = "tampered";
        },
      ],
    ] as const) {
      const output = join(directory, `${name}-runtime.json`);
      const auditOutput = join(directory, `${name}-audit.json`);
      const runtime = structuredClone(runtimeSource);
      const audit = structuredClone(auditSource);
      mutate(runtime, audit);
      await writeJson(output, runtime);
      await writeJson(auditOutput, audit);
      const beforeRuntime = await readFile(output);
      const beforeAudit = await readFile(auditOutput);

      await assert.rejects(
        () =>
          generator.mergeRouteLiteralAudit({
            canonicalDirectory,
            routeLiteralAuditReport,
            auditManifest,
            output,
            auditOutput,
          }),
        /localized literal base (?:runtime|audit) hash mismatch/,
      );
      assert.deepEqual(await readFile(output), beforeRuntime);
      assert.deepEqual(await readFile(auditOutput), beforeAudit);
    }

    const output = join(directory, "literal-runtime.json");
    const auditOutput = join(directory, "literal-audit.json");
    const runtime = structuredClone(runtimeSource);
    runtime.literals.Hillock = "literal-only tamper";
    await writeJson(output, runtime);
    await writeJson(auditOutput, auditSource);
    const options = {
      canonicalDirectory,
      routeLiteralAuditReport,
      auditManifest,
      output,
      auditOutput,
    };
    await generator.mergeRouteLiteralAudit(options);
    const firstRuntime = await readFile(output);
    const firstAudit = await readFile(auditOutput);
    await generator.mergeRouteLiteralAudit(options);
    assert.deepEqual(await readFile(output), firstRuntime);
    assert.deepEqual(await readFile(auditOutput), firstAudit);
    assert.equal(
      JSON.parse(firstRuntime.toString()).literals.Hillock,
      "Хиллока",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("checked-in literals equal every audited display value", async () => {
  const rawAudit = JSON.parse(
    await readFile(
      new URL(
        "../../data/localization/ru-route-literal-audit.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const expected = Object.fromEntries(
    [
      ...Object.entries(rawAudit.mappings.killLiterals),
      ...Object.entries(rawAudit.mappings.buildInfoBandits),
    ].map(([english, entry]) => [
      english,
      (entry as { display: string }).display,
    ]),
  );

  assert.deepEqual(Data.Localized.ru.literals, expected);
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

test("audited provenance returns the exact verified input bytes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-display-manifest-"));
  const input = join(directory, "display-report.json");
  const manifest = join(directory, "manifest.json");
  await writeFile(input, "verified bytes\n");
  await writeAuditManifest(manifest, { displayReport: input });

  try {
    const verified = await generator.validateAuditManifest(manifest, {
      displayReport: input,
    });
    await writeFile(input, "replacement bytes\n");
    assert.equal(
      verified.inputs.displayReport.toString("utf8"),
      "verified bytes\n",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a manifest-verified incremental input ignores unrelated source entries", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-display-manifest-"));
  const routeLiteralAuditReport = join(directory, "route-literals.json");
  const unrelated = join(directory, "unrelated.json");
  const manifest = join(directory, "manifest.json");
  await writeFile(routeLiteralAuditReport, "literal bytes\n");
  await writeFile(unrelated, "unrelated bytes\n");
  await writeAuditManifest(manifest, { routeLiteralAuditReport, unrelated });

  try {
    const verified = await generator.validateAuditManifestInput(
      manifest,
      "routeLiteralAuditReport",
      routeLiteralAuditReport,
    );
    assert.equal(verified.bytes.toString("utf8"), "literal bytes\n");
    assert.equal(verified.metadata.kind, "routeLiteralAuditReport");
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

test("atomic localization writes leave no temporary artifact", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-display-atomic-"));
  const output = join(directory, "ru.json");

  try {
    await generator.writeAtomicFile(output, "complete\n");
    assert.equal(await readFile(output, "utf8"), "complete\n");
    assert.deepEqual(await readdir(directory), ["ru.json"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("failed atomic localization writes clean their temporary artifact", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-display-atomic-"));
  const output = join(directory, "existing-destination");
  await mkdir(output);
  await writeFile(join(output, "sentinel"), "unchanged\n");

  try {
    await assert.rejects(() =>
      generator.writeAtomicFile(output, "replacement"),
    );
    assert.equal(
      await readFile(join(output, "sentinel"), "utf8"),
      "unchanged\n",
    );
    assert.deepEqual(await readdir(directory), ["existing-destination"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("paired localization output rolls back when the runtime publish fails", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-display-pair-"));
  const output = join(directory, "runtime-destination");
  const auditOutput = join(directory, "audit.json");
  await mkdir(output);
  await writeFile(join(output, "sentinel"), "runtime unchanged\n");
  await writeFile(auditOutput, "audit unchanged\n");

  try {
    await assert.rejects(() =>
      generator.writeValidatedData(
        localizedGameFixture(),
        localizedAuditFixture(),
        canonicalGameFixture(),
        output,
        auditOutput,
      ),
    );
    assert.equal(await readFile(auditOutput, "utf8"), "audit unchanged\n");
    assert.equal(
      await readFile(join(output, "sentinel"), "utf8"),
      "runtime unchanged\n",
    );
    assert.deepEqual((await readdir(directory)).sort(), [
      "audit.json",
      "runtime-destination",
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
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
  const auditOutput = join(directory, "ru-output-audit.json");
  await writeFile(output, "unchanged\n");
  await writeFile(auditOutput, "unchanged audit\n");
  const localized = localizedGameFixture();
  delete (localized.gems as Record<string, string>).gem;
  const writeValidatedData = (
    generator as typeof generator & {
      writeValidatedData: (
        value: unknown,
        audit: unknown,
        canonical: ReturnType<typeof canonicalGameFixture>,
        output: string,
        auditOutput: string,
      ) => Promise<void>;
    }
  ).writeValidatedData;

  try {
    await assert.rejects(
      () =>
        writeValidatedData(
          localized,
          localizedAuditFixture(),
          canonicalGameFixture(),
          output,
          auditOutput,
        ),
      /gem coverage invalid: missing IDs: gem/,
    );
    assert.equal(await readFile(output, "utf8"), "unchanged\n");
    assert.equal(await readFile(auditOutput, "utf8"), "unchanged audit\n");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("official export mode resolves NPCs and classes through canonical references", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-official-exports-"));
  const canonicalDirectory = join(directory, "canonical");
  const exportsDirectory = join(directory, "exports");
  const output = join(directory, "ru.json");
  const auditOutput = join(directory, "ru-output-audit.json");
  const auditManifest = join(directory, "manifest.json");
  const routeLiteralAuditReport = join(directory, "route-literal-audit.json");
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
    await writeJson(routeLiteralAuditReport, routeLiteralAuditFixture());
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
    await writeAuditManifest(auditManifest, {
      ...manifestInputs,
      routeLiteralAuditReport,
    });

    await generator.generateFromOfficialExports({
      canonicalDirectory,
      exportsDirectory,
      routeLiteralAuditReport,
      auditManifest,
      output,
      auditOutput,
    });

    const result = JSON.parse(await readFile(output, "utf8"));
    const resultAudit = JSON.parse(await readFile(auditOutput, "utf8"));
    assert.equal(result.classes.Witch, "Ведьма");
    assert.equal(result.quests.quest.rewardNpcs.offer, "Несса");
    assert.equal(result.quests.quest.vendorNpcs.offer.gem, "Несса");
    assert.equal(result.literals.Oak, "Дуб");
    assert.equal(
      resultAudit.sourceMetadata.sources.at(-1).kind,
      "routeLiteralAuditReport",
    );
    assert.equal(resultAudit.kind, "russian-game-data-audit");
    assert.equal(Object.hasOwn(result, "sourceMetadata"), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("audited source mode regenerates a compact fixture deterministically", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-audited-sources-"));
  const canonicalDirectory = join(directory, "canonical");
  const sourcesDirectory = join(directory, "sources");
  await mkdir(canonicalDirectory);
  await mkdir(sourcesDirectory);
  const source = (name: string) => join(sourcesDirectory, name);
  const pobGems = source("Gems.lua");
  const pobReport = source("pob-report.json");
  const poedbGemsReport = source("poedb-gems-report.json");
  const areasReport = source("areas-report.json");
  const questsReport = source("quests-report.json");
  const npcsReport = source("npcs-report.json");
  const classSource = source("tree_ru.lua");
  const displayAuditReport = source("display-audit.json");
  const routeLiteralAuditReport = source("route-literal-audit.json");
  const auditManifest = source("manifest.json");
  const outputOne = join(directory, "ru-one.json");
  const auditOutputOne = join(directory, "audit-one.json");
  const outputTwo = join(directory, "ru-two.json");
  const auditOutputTwo = join(directory, "audit-two.json");

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

    const pobText = [
      '["gem"] = {',
      '  name = "Огненный шар",',
      '  gameId = "gem",',
      "}",
      "",
    ].join("\n");
    await writeFile(pobGems, pobText);
    await writeJson(pobReport, {
      snapshot: {
        commit: "696d36aabaffb88f9c75ee424a1b4433b3233597",
        tag: "v2.62.0",
      },
      decodedFiles: [
        {
          sourcePath: "src/Data/Gems.lua",
          sha256: createHash("sha256").update(pobText).digest("hex"),
          exactGitObjectMatch: true,
        },
      ],
    });
    await writeJson(poedbGemsReport, {
      poedbExactMissingRecords: [],
      royaleAliasNames: [],
    });
    await writeJson(areasReport, {
      kind: "areas",
      missingCount: 0,
      coveredCount: 1,
      covered: [{ id: "area", localized: "Побережье" }],
    });
    await writeJson(questsReport, {
      kind: "quests",
      coveredCount: 1,
      covered: [{ id: "quest", localized: "Враг у ворот" }],
    });
    await writeJson(npcsReport, {
      results: [{ english: "Nessa" }],
    });
    await writeFile(classSource, "audited class source\n");
    await writeJson(displayAuditReport, {
      schemaVersion: 1,
      kind: "russian-display-audit",
      npcs: [
        {
          english: "Nessa",
          localized: "Несса",
          url: "https://poedb.tw/ru/Nessa",
          retrievedAt: "2026-07-20",
          contentSha256: "1".repeat(64),
        },
      ],
      classes: [
        {
          english: "Witch",
          localized: "Ведьма",
          url: "https://poedb.tw/ru/Witch",
          retrievedAt: "2026-07-20",
          contentSha256: "2".repeat(64),
        },
      ],
      nonRussianGems: [],
    });
    await writeJson(routeLiteralAuditReport, routeLiteralAuditFixture());
    await writeAuditManifest(auditManifest, {
      pobGems,
      pobReport,
      poedbGemsReport,
      areasReport,
      questsReport,
      npcsReport,
      classSource,
      displayAuditReport,
      routeLiteralAuditReport,
    });
    const options = {
      canonicalDirectory,
      pobGems,
      pobReport,
      poedbGemsReport,
      areasReport,
      questsReport,
      npcsReport,
      classSource,
      displayAuditReport,
      routeLiteralAuditReport,
      auditManifest,
    };

    await generator.generateFromAuditedSources({
      ...options,
      output: outputOne,
      auditOutput: auditOutputOne,
    });
    await generator.generateFromAuditedSources({
      ...options,
      output: outputTwo,
      auditOutput: auditOutputTwo,
    });

    assert.equal(
      await readFile(outputOne, "utf8"),
      await readFile(outputTwo, "utf8"),
    );
    assert.equal(
      await readFile(auditOutputOne, "utf8"),
      await readFile(auditOutputTwo, "utf8"),
    );
    const result = JSON.parse(await readFile(outputOne, "utf8"));
    const resultAudit = JSON.parse(await readFile(auditOutputOne, "utf8"));
    assert.equal(result.gems.gem, "Огненный шар");
    assert.equal(result.areas.area.name, "Побережье");
    assert.equal(result.quests.quest.name, "Враг у ворот");
    assert.equal(result.classes.Witch, "Ведьма");
    assert.equal(result.literals.Oak, "Дуб");
    assert.equal(
      resultAudit.sourceMetadata.sources.at(-1).kind,
      "routeLiteralAuditReport",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("both generator modes reject invalid provenance before writing", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ru-generator-no-write-"));
  const output = join(directory, "ru.json");
  const auditOutput = join(directory, "ru-output-audit.json");
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
          auditOutput,
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
          auditOutput,
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

test("crafting fragments preserve the canonical area ID", () => {
  const fragments = parseFragments(
    "{crafting|1_Labyrinth_boss_3}",
    initializeRouteState(),
    new ScopedLogger(),
  );

  assert.deepEqual(fragments, [
    {
      type: "crafting",
      areaId: "1_Labyrinth_boss_3",
      crafting_recipes: ["All Resistances - Rank 1"],
    },
  ]);
});

test("crafting display uses Russian recipes and reviewed canonical fallback", () => {
  const canonical = canonicalGameFixture();
  const localized = localizedGameFixture();
  const russian = gameData.createGameData("ru", canonical, localized) as {
    craftingRecipes: (areaId: string) => string[];
  };
  const english = gameData.createGameData("en", canonical, localized) as {
    craftingRecipes: (areaId: string) => string[];
  };

  assert.deepEqual(russian.craftingRecipes("area"), ["Fire Damage - Rank 1"]);
  localized.areas.area.craftingRecipes = ["Урон от огня — ранг 1"];
  assert.deepEqual(
    gameData.createGameData("ru", canonical, localized).craftingRecipes("area"),
    ["Урон от огня — ранг 1"],
  );
  assert.deepEqual(english.craftingRecipes("area"), ["Fire Damage - Rank 1"]);
  assert.deepEqual(russian.craftingRecipes("unknown"), []);
});

test("vendor gem search expressions follow the active client language", () => {
  const fireballId = "Metadata/Items/Gems/SkillGemFireball";
  const buildGemSearchString = (
    gameData as typeof gameData & {
      buildGemSearchString: (
        locale: "en" | "ru",
        gemIds: readonly string[],
      ) => string;
    }
  ).buildGemSearchString;

  assert.equal(buildGemSearchString("en", [fireballId]), '"Fireball"');
  assert.equal(buildGemSearchString("ru", [fireballId]), '"Огненный шар"');
  assert.equal(buildGemSearchString("ru", []), "");
  assert.equal(
    buildGemSearchString("en", ["missing"]),
    '"missing"',
    "unknown metadata IDs use the safe ID fallback",
  );
});

test("vendor gem search escapes each localized display name before alternation", () => {
  assert.equal(buildVendorSearchString(["..."]), '"\\.\\.\\."');
  assert.equal(buildVendorSearchString(["[DNT] Blood"]), '"\\[DNT\\] Blood"');
  assert.equal(
    buildVendorSearchString([String.raw`Path\Name`]),
    '"Path\\\\Name"',
  );
  assert.equal(buildVendorSearchString(["Огненный шар"]), '"Огненный шар"');
  assert.equal(
    buildVendorSearchString(["...", "[DNT] Blood", "Огненный шар"]),
    '"\\.\\.\\.|\\[DNT\\] Blood|Огненный шар"',
  );
  assert.equal(buildVendorSearchString([]), "");
});

test("built-in literal keys are every unique kill payload plus bandit label", () => {
  const collectBuiltInLiteralKeys = (
    validation as typeof validation & {
      collectBuiltInLiteralKeys: (routes: readonly string[]) => string[];
    }
  ).collectBuiltInLiteralKeys;

  assert.deepEqual(
    collectBuiltInLiteralKeys([
      "Kill {kill|Hillock} then {kill|Hillock}",
      "Help {kill|Oak, Skullbreaker}",
    ]),
    ["Alira", "Hillock", "Kraityn", "Oak", "Oak, Skullbreaker"],
  );
});

test("built-in literal coverage rejects missing and stale mappings", () => {
  const assertBuiltInLiteralCoverage = (
    validation as typeof validation & {
      assertBuiltInLiteralCoverage: (
        routes: readonly string[],
        literals: Record<string, string>,
      ) => void;
    }
  ).assertBuiltInLiteralCoverage;

  assert.throws(
    () =>
      assertBuiltInLiteralCoverage(["{kill|Hillock}"], {
        Alira: "Алира",
        Kraityn: "Крайтин",
        Oak: "Дуб",
        stale: "Устаревшее",
      }),
    /built-in literal coverage invalid: missing IDs: Hillock; unknown\/stale IDs: stale/,
  );
});

test("game display name lookups do not enumerate localized collections", () => {
  const canonical = canonicalGameFixture();
  const localized = localizedGameFixture();
  let areaEnumerations = 0;
  let questEnumerations = 0;
  localized.areas = new Proxy(localized.areas, {
    ownKeys(target) {
      areaEnumerations += 1;
      return Reflect.ownKeys(target);
    },
  });
  localized.quests = new Proxy(localized.quests, {
    ownKeys(target) {
      questEnumerations += 1;
      return Reflect.ownKeys(target);
    },
  });

  const russian = gameData.createGameData("ru", canonical, localized);
  assert.equal(russian.areaName("area"), "Побережье");
  assert.equal(russian.areaName("unknown"), "unknown");
  assert.equal(russian.questName("quest"), "Враг у ворот");
  assert.equal(russian.questName("unknown"), "unknown");

  assert.deepEqual(
    { areaEnumerations, questEnumerations },
    { areaEnumerations: 0, questEnumerations: 0 },
  );
});

test("game data helpers are cached by locale", () => {
  assert.strictEqual(
    gameData.gameDataForLocale("en"),
    gameData.gameDataForLocale("en"),
  );
  assert.strictEqual(
    gameData.gameDataForLocale("ru"),
    gameData.gameDataForLocale("ru"),
  );
  assert.notStrictEqual(
    gameData.gameDataForLocale("en"),
    gameData.gameDataForLocale("ru"),
  );
});

test("localized game data accepts a complete canonical fixture", () => {
  assert.doesNotThrow(() => assertLocalizedFixture());
});

test("localized audit rejects malformed or unexpected source metadata", () => {
  const malformed = localizedAuditFixture();
  malformed.sourceMetadata.sources[0].sha256 = "not-a-hash";
  assert.throws(
    () => assertLocalizedFixture(localizedGameFixture(), malformed),
    /invalid localized audit: sourceMetadata\.sources\.0\.sha256/,
  );

  const unexpected = localizedAuditFixture();
  unexpected.sourceMetadata.sources[0].kind = "UnexpectedSource";
  assert.throws(
    () => assertLocalizedFixture(localizedGameFixture(), unexpected),
    /source metadata kind coverage invalid/,
  );
});

test("non-Russian class, area, map, quest, recipe, and literal values require review", () => {
  const cases: {
    mutate: (localized: ReturnType<typeof localizedGameFixture>) => void;
    mutateAudit?: (audit: ReturnType<typeof localizedAuditFixture>) => void;
    error: RegExp;
  }[] = [
    {
      mutate: (localized) => {
        localized.classes.Marauder = "Marauder";
      },
      error: /English class fallback is not reviewed: Marauder/,
    },
    {
      mutate: (localized) => {
        localized.areas.area.name = "The Coast";
      },
      error: /English area name fallback is not reviewed: area/,
    },
    {
      mutate: (localized) => {
        localized.areas.area.mapName = "The Coast";
      },
      error: /English map name fallback is not reviewed: area/,
    },
    {
      mutate: (localized) => {
        localized.quests.quest.name = "Enemy at the Gate";
      },
      error: /English quest name fallback is not reviewed: quest/,
    },
    {
      mutate: (localized) => {
        localized.areas.area.craftingRecipes = ["Fire Damage - Rank 1"];
      },
      mutateAudit: (audit) => {
        delete (
          audit.intentionalEnglishFallbacks.craftingRecipes as Record<
            string,
            unknown
          >
        ).area;
      },
      error: /English crafting recipe fallback is not reviewed: area/,
    },
    {
      mutate: (localized) => {
        (localized.literals as Record<string, string>).Brutus = "Brutus";
      },
      error: /English literal fallback is not reviewed: Brutus/,
    },
  ];

  for (const { mutate, mutateAudit, error } of cases) {
    const localized = localizedGameFixture();
    const audit = localizedAuditFixture();
    mutate(localized);
    mutateAudit?.(audit);
    assert.throws(() => assertLocalizedFixture(localized, audit), error);
  }
});

test("localized game data rejects empty required display values", () => {
  const localized = localizedGameFixture();
  localized.gems.gem = "";

  assert.throws(
    () => assertLocalizedFixture(localized),
    /invalid localized game data: gems\.gem must be a non-empty string/,
  );
});

test("English display values require an explicit reviewed fallback", () => {
  const localized = localizedGameFixture();
  localized.gems.gem = "Fireball";

  assert.throws(
    () => assertLocalizedFixture(localized),
    /English gem fallback is not reviewed: gem/,
  );
});

test("reviewed fallback allowlists reject stale IDs", () => {
  const audit = localizedAuditFixture();
  (
    audit.intentionalEnglishFallbacks.gems as Record<
      string,
      { reason: string; source: string }
    >
  ).stale = { reason: "old", source: "old source" };

  assert.throws(
    () => assertLocalizedFixture(localizedGameFixture(), audit),
    /unknown\/stale reviewed gem fallback: stale/,
  );
});

test("reviewed fallback allowlists reject unnecessary entries", () => {
  const audit = localizedAuditFixture();
  (
    audit.intentionalEnglishFallbacks.gems as Record<
      string,
      { reason: string; source: string }
    >
  ).gem = {
    reason: "not needed",
    source: "fixture",
  };

  assert.throws(
    () => assertLocalizedFixture(localizedGameFixture(), audit),
    /unnecessary reviewed gem fallback: gem/,
  );
});

test("localized game data requires map names when canonical MapPins have one", () => {
  const localized = localizedGameFixture();
  localized.areas.area.mapName = null as unknown as string;

  assert.throws(
    () => assertLocalizedFixture(localized),
    /invalid localized game data: areas\.area\.mapName must be a non-empty string/,
  );
});

test("null canonical map names reject unnecessary fallback reviews", () => {
  const canonical = canonicalGameFixture();
  canonical.Areas.area.map_name = null;
  const localized = localizedGameFixture();
  localized.areas.area.mapName = null;
  const audit = localizedAuditFixture();
  (
    audit.intentionalEnglishFallbacks.areaMapNames as Record<
      string,
      { reason: string; source: string }
    >
  ).area = { reason: "not needed", source: "fixture" };

  assert.throws(
    () => assertLocalizedFixture(localized, audit, canonical),
    /unnecessary reviewed map name fallback: area/,
  );
});

test("crafting recipe omissions require an explicit reviewed fallback", () => {
  const audit = localizedAuditFixture();
  delete (
    audit.intentionalEnglishFallbacks.craftingRecipes as Record<string, unknown>
  ).area;

  assert.throws(
    () => assertLocalizedFixture(localizedGameFixture(), audit),
    /crafting recipe fallback is not reviewed: area/,
  );
});

test("every canonical quest reward NPC path must resolve", () => {
  const localized = localizedGameFixture();
  delete (localized.quests.quest.rewardNpcs as Record<string, string>).offer;

  assert.throws(
    () => assertLocalizedFixture(localized),
    /missing localized reward NPC path: quest\/offer/,
  );
});

test("every canonical vendor NPC gem path must resolve", () => {
  const localized = localizedGameFixture();
  delete (localized.quests.quest.vendorNpcs.offer as Record<string, string>)
    .gem;

  assert.throws(
    () => assertLocalizedFixture(localized),
    /missing localized vendor NPC path: quest\/offer\/gem/,
  );
});

test("quest NPC maps reject stale offer and vendor gem paths", () => {
  const rewardOffer = localizedGameFixture();
  (rewardOffer.quests.quest.rewardNpcs as Record<string, string>).stale =
    "Лишний";
  assert.throws(
    () => assertLocalizedFixture(rewardOffer),
    /unknown\/stale localized reward NPC path: quest\/stale/,
  );

  const vendorOffer = localizedGameFixture();
  (
    vendorOffer.quests.quest.vendorNpcs as Record<
      string,
      Record<string, string>
    >
  ).stale = {};
  assert.throws(
    () => assertLocalizedFixture(vendorOffer),
    /unknown\/stale localized vendor offer path: quest\/stale/,
  );

  const vendorGem = localizedGameFixture();
  (vendorGem.quests.quest.vendorNpcs.offer as Record<string, string>).stale =
    "Лишний";
  assert.throws(
    () => assertLocalizedFixture(vendorGem),
    /unknown\/stale localized vendor NPC path: quest\/offer\/stale/,
  );
});

test("localized reward NPCs reject unnecessary fallback reviews", () => {
  const audit = localizedAuditFixture();
  (
    audit.intentionalEnglishFallbacks.rewardNpcs as Record<
      string,
      { reason: string; source: string }
    >
  )["quest/offer"] = {
    reason: "not needed",
    source: "fixture",
  };

  assert.throws(
    () => assertLocalizedFixture(localizedGameFixture(), audit),
    /unnecessary reviewed reward NPC fallback: quest\/offer/,
  );
});

test("localized vendor NPCs reject unnecessary fallback reviews", () => {
  const audit = localizedAuditFixture();
  (
    audit.intentionalEnglishFallbacks.vendorNpcs as Record<
      string,
      { reason: string; source: string }
    >
  )["quest/offer/gem"] = {
    reason: "not needed",
    source: "fixture",
  };

  assert.throws(
    () => assertLocalizedFixture(localizedGameFixture(), audit),
    /unnecessary reviewed vendor NPC fallback: quest\/offer\/gem/,
  );
});

test("checked-in Russian game data has exact canonical coverage", async () => {
  const audit = JSON.parse(
    await readFile(
      new URL("../../data/localization/ru-output-audit.json", import.meta.url),
      "utf8",
    ),
  );
  assert.doesNotThrow(() =>
    validation.assertLocalizedGameData(Data.Localized.ru, audit, Data),
  );
  assert.equal(Object.hasOwn(Data.Localized.ru, "sourceMetadata"), false);
  assert.equal(
    Object.hasOwn(Data.Localized.ru, "intentionalEnglishFallbacks"),
    false,
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

test("checked-in Russian literals exactly cover built-in kills and bandits", async () => {
  const routeDirectory = new URL(
    "../../../common/data/routes/en/",
    import.meta.url,
  );
  const routes = await Promise.all(
    (await readdir(routeDirectory))
      .filter((name) => name.endsWith(".txt"))
      .map((name) => readFile(new URL(name, routeDirectory), "utf8")),
  );

  validation.assertBuiltInLiteralCoverage(routes, Data.Localized.ru.literals);
  assert.equal(Object.keys(Data.Localized.ru.literals).length, 63);
});

test("checked-in Russian data reviews the exact non-Russian gem set", async () => {
  const audit = JSON.parse(
    await readFile(
      new URL("../../data/localization/ru-output-audit.json", import.meta.url),
      "utf8",
    ),
  );
  const expected = Object.entries(Data.Localized.ru.gems)
    .filter(([, name]) => !/[А-Яа-яЁё]/.test(name))
    .map(([id]) => id)
    .sort();
  const reviewed = Object.keys(audit.intentionalEnglishFallbacks.gems).sort();

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

test("route parity distinguishes prose-only steps from empty lines", () => {
  assert.throws(
    () => assertRouteParity("Talk to Tarkleigh", "", "act-1"),
    /route structure differs: act-1 line 1/,
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
