import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { assertEntityCoverage, assertLocalizedGameData } from "./validate.js";

export interface DatExport {
  columns: unknown[];
  data: Record<string, unknown>[];
}

export async function loadDatExport(
  directory: string,
  name: string,
): Promise<DatExport> {
  const path = join(directory, `${name}.datc64.json`);
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`missing localization source: ${path}`);
    }
    throw error;
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`invalid localization source JSON: ${path}`);
  }
  if (
    typeof value !== "object" ||
    value === null ||
    !("columns" in value) ||
    !Array.isArray(value.columns) ||
    !("data" in value) ||
    !Array.isArray(value.data) ||
    value.data.some(
      (row) => typeof row !== "object" || row === null || Array.isArray(row),
    )
  ) {
    throw new Error(`invalid localization source schema: ${path}`);
  }
  return value as DatExport;
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, child]) => [key, sortJson(child)]),
  );
}

export function serializeDeterministic(value: unknown): string {
  return `${JSON.stringify(sortJson(value), null, 2)}\n`;
}

export async function writeValidatedData(
  value: unknown,
  canonical: Parameters<typeof assertLocalizedGameData>[1],
  output: string,
): Promise<void> {
  assertLocalizedGameData(value, canonical);
  const serialized = serializeDeterministic(value);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, serialized);
}

const RUSSIAN_POB_COMMIT = "696d36aabaffb88f9c75ee424a1b4433b3233597";

interface CanonicalFiles {
  Gems: Record<string, { id: string; name: string }>;
  Areas: Record<
    string,
    {
      id: string;
      name: string;
      map_name: string | null;
      crafting_recipes: string[];
    }
  >;
  Quests: Record<
    string,
    {
      id: string;
      name: string;
      reward_offers: Partial<
        Record<
          string,
          {
            quest_npc: string;
            vendor: Partial<Record<string, { npc: string }>>;
          }
        >
      >;
    }
  >;
  Characters: Record<string, unknown>;
}

interface AuditOptions {
  canonicalDirectory: string;
  pobGems: string;
  pobReport: string;
  poedbGemsReport: string;
  areasReport: string;
  questsReport: string;
  npcsReport: string;
  classSource: string;
  displayAuditReport: string;
  auditManifest: string;
  output: string;
}

interface OfficialExportOptions {
  canonicalDirectory: string;
  exportsDirectory: string;
  auditManifest: string;
  output: string;
}

interface AuditedNameRecord {
  english: string;
  localized: string;
  url: string;
  retrievedAt: string;
  contentSha256: string;
}

interface AuditedGemFallbackRecord {
  id: string;
  reason: string;
  source: string;
  retrievedAt: string;
  contentSha256: string;
}

interface DisplayAuditReport {
  schemaVersion: 1;
  kind: "russian-display-audit";
  npcs: AuditedNameRecord[];
  classes: AuditedNameRecord[];
  nonRussianGems: AuditedGemFallbackRecord[];
}

interface AuditSourceMetadata {
  kind: string;
  source: string;
  revision: string;
  retrievedAt: string;
  sha256: string;
}

async function readJson(path: string): Promise<unknown> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`missing localization source: ${path}`);
    }
    throw error;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`invalid localization source JSON: ${path}`);
  }
}

function provenanceString(
  value: Record<string, unknown>,
  key: string,
  path: string,
  pattern?: RegExp,
): string {
  const field = value[key];
  if (
    typeof field !== "string" ||
    field.length === 0 ||
    (pattern && !pattern.test(field))
  ) {
    throw new Error(`invalid audited provenance: ${path}.${key}`);
  }
  return field;
}

export async function loadDisplayAuditReport(
  path: string,
): Promise<DisplayAuditReport> {
  const value = record(await readJson(path), path);
  if (value.schemaVersion !== 1 || value.kind !== "russian-display-audit") {
    throw new Error(`invalid audited provenance: ${path}.schemaVersion`);
  }
  const auditedNames = (key: "npcs" | "classes") =>
    rows(value, key, path).map((row, index) => {
      const itemPath = `${key}.${index}`;
      return {
        english: provenanceString(row, "english", itemPath),
        localized: provenanceString(row, "localized", itemPath),
        url: provenanceString(row, "url", itemPath, /^https:\/\/\S+$/),
        retrievedAt: provenanceString(
          row,
          "retrievedAt",
          itemPath,
          /^\d{4}-\d{2}-\d{2}$/,
        ),
        contentSha256: provenanceString(
          row,
          "contentSha256",
          itemPath,
          /^[a-f0-9]{64}$/,
        ),
      };
    });
  const nonRussianGems = rows(value, "nonRussianGems", path).map(
    (row, index) => {
      const itemPath = `nonRussianGems.${index}`;
      return {
        id: provenanceString(row, "id", itemPath),
        reason: provenanceString(row, "reason", itemPath),
        source: provenanceString(row, "source", itemPath, /^https:\/\/\S+$/),
        retrievedAt: provenanceString(
          row,
          "retrievedAt",
          itemPath,
          /^\d{4}-\d{2}-\d{2}$/,
        ),
        contentSha256: provenanceString(
          row,
          "contentSha256",
          itemPath,
          /^[a-f0-9]{64}$/,
        ),
      };
    },
  );
  const report = {
    schemaVersion: 1,
    kind: "russian-display-audit" as const,
    npcs: auditedNames("npcs"),
    classes: auditedNames("classes"),
    nonRussianGems,
  };
  for (const [kind, records] of [
    ["NPC", report.npcs],
    ["class", report.classes],
    ["non-Russian gem", report.nonRussianGems],
  ] as const) {
    const keys = records.map((item) =>
      "english" in item ? item.english : item.id,
    );
    if (new Set(keys).size !== keys.length) {
      throw new Error(`duplicate audited ${kind} record`);
    }
  }
  return report;
}

export async function validateAuditManifest(
  path: string,
  inputs: Record<string, string>,
): Promise<AuditSourceMetadata[]> {
  const manifest = record(await readJson(path), path);
  if (
    manifest.schemaVersion !== 1 ||
    manifest.kind !== "russian-display-audit-manifest"
  ) {
    throw new Error(`invalid audited provenance: ${path}.schemaVersion`);
  }
  const manifestInputs = record(manifest.inputs, `${path}.inputs`);
  assertEntityCoverage("audited provenance input", inputs, manifestInputs);
  const sources: AuditSourceMetadata[] = [];
  for (const [name, inputPath] of Object.entries(inputs)) {
    const metadata = record(manifestInputs[name], `${path}.inputs.${name}`);
    const source = provenanceString(
      metadata,
      "source",
      `${path}.inputs.${name}`,
      /^https:\/\/\S+$/,
    );
    const revision = provenanceString(
      metadata,
      "revision",
      `${path}.inputs.${name}`,
    );
    const retrievedAt = provenanceString(
      metadata,
      "retrievedAt",
      `${path}.inputs.${name}`,
      /^\d{4}-\d{2}-\d{2}$/,
    );
    const expected = provenanceString(
      metadata,
      "sha256",
      `${path}.inputs.${name}`,
      /^[a-f0-9]{64}$/,
    );
    const actual = createHash("sha256")
      .update(await readFile(inputPath))
      .digest("hex");
    if (actual !== expected) {
      throw new Error(`audited provenance hash mismatch: ${name}`);
    }
    sources.push({
      kind: name,
      source,
      revision,
      retrievedAt,
      sha256: expected,
    });
  }
  return sources;
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`invalid localization source schema: ${path}`);
  }
  return value as Record<string, unknown>;
}

function rows(
  value: unknown,
  key: string,
  path: string,
): Record<string, unknown>[] {
  const root = record(value, path);
  if (!Array.isArray(root[key])) {
    throw new Error(`invalid localization source schema: ${path}.${key}`);
  }
  return root[key].map((value, index) =>
    record(value, `${path}.${key}.${index}`),
  );
}

function stringField(
  value: Record<string, unknown>,
  key: string,
  path: string,
): string {
  if (typeof value[key] !== "string" || value[key].length === 0) {
    throw new Error(`invalid localization source schema: ${path}.${key}`);
  }
  return value[key];
}

async function loadCanonical(directory: string): Promise<CanonicalFiles> {
  return {
    Gems: (await readJson(
      join(directory, "gems.json"),
    )) as CanonicalFiles["Gems"],
    Areas: (await readJson(
      join(directory, "areas.json"),
    )) as CanonicalFiles["Areas"],
    Quests: (await readJson(
      join(directory, "quests.json"),
    )) as CanonicalFiles["Quests"],
    Characters: (await readJson(
      join(directory, "characters.json"),
    )) as CanonicalFiles["Characters"],
  };
}

function luaUnquote(raw: string): string {
  return raw.replace(
    /\\(?:([0-9]{1,3})|([abfnrtv\\"']))/g,
    (_whole, decimal: string | undefined, escaped: string | undefined) => {
      if (decimal !== undefined) {
        return String.fromCharCode(Number.parseInt(decimal, 10));
      }
      const escapes: Record<string, string> = {
        a: "\x07",
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
        v: "\v",
        "\\": "\\",
        '"': '"',
        "'": "'",
      };
      return escapes[escaped ?? ""] ?? "";
    },
  );
}

function luaField(block: string, field: string): string | null {
  const match = block.match(
    new RegExp(`^\\s*${field}\\s*=\\s*"((?:\\\\.|[^"\\\\])*)"`, "m"),
  );
  return match ? luaUnquote(match[1]) : null;
}

function parsePobGems(text: string): Record<string, string> {
  const starts = [
    ...text.matchAll(/^\s*\["((?:\\.|[^"\\])*)"\]\s*=\s*\{\s*$/gm),
  ];
  const parsed = starts.map((match, index) => {
    const block = text.slice(
      match.index,
      starts[index + 1]?.index ?? text.length,
    );
    return {
      key: luaUnquote(match[1]),
      name: luaField(block, "name"),
      gameId: luaField(block, "gameId"),
    };
  });
  const groups = new Map<string, typeof parsed>();
  for (const row of parsed) {
    if (!row.gameId || !row.name) continue;
    const group = groups.get(row.gameId) ?? [];
    group.push(row);
    groups.set(row.gameId, group);
  }

  const selected: Record<string, string> = {};
  for (const [gameId, group] of groups) {
    const exact = group.filter((row) => row.key === gameId);
    const nonAlternate = group.filter((row) => !/Alt[A-Z]$/.test(row.key));
    const choice =
      exact.length === 1
        ? exact[0]
        : nonAlternate.length === 1
          ? nonAlternate[0]
          : undefined;
    if (!choice?.name) {
      throw new Error(`ambiguous Russian PoB gem rows: ${gameId}`);
    }
    selected[gameId] = choice.name;
  }
  return selected;
}

function oneLocalizedName(
  value: Record<string, unknown>,
  field: string,
  path: string,
): string {
  const values = value[field];
  if (
    !Array.isArray(values) ||
    values.length !== 1 ||
    typeof values[0] !== "string" ||
    values[0].length === 0
  ) {
    throw new Error(`invalid localization source schema: ${path}.${field}`);
  }
  return values[0];
}

function review(reason: string, source: string) {
  return { reason, source };
}

export async function generateFromAuditedSources(
  options: AuditOptions,
): Promise<void> {
  const sourceMetadata = await validateAuditManifest(options.auditManifest, {
    pobGems: options.pobGems,
    pobReport: options.pobReport,
    poedbGemsReport: options.poedbGemsReport,
    areasReport: options.areasReport,
    questsReport: options.questsReport,
    npcsReport: options.npcsReport,
    classSource: options.classSource,
    displayAuditReport: options.displayAuditReport,
  });
  const displayAudit = await loadDisplayAuditReport(options.displayAuditReport);
  const canonical = await loadCanonical(options.canonicalDirectory);
  const [
    pobText,
    pobReportValue,
    gemReportValue,
    areaReportValue,
    questReportValue,
    npcReportValue,
  ] = await Promise.all([
    readFile(options.pobGems, "utf8"),
    readJson(options.pobReport),
    readJson(options.poedbGemsReport),
    readJson(options.areasReport),
    readJson(options.questsReport),
    readJson(options.npcsReport),
  ]);

  const pobReport = record(pobReportValue, options.pobReport);
  const snapshot = record(pobReport.snapshot, `${options.pobReport}.snapshot`);
  if (snapshot.commit !== RUSSIAN_POB_COMMIT || snapshot.tag !== "v2.62.0") {
    throw new Error(
      `unexpected Russian PoB source revision: ${options.pobReport}`,
    );
  }
  const decodedFiles = rows(pobReport, "decodedFiles", options.pobReport);
  const gemsFile = decodedFiles.find(
    (file) => file.sourcePath === "src/Data/Gems.lua",
  );
  if (
    !gemsFile ||
    gemsFile.sha256 !== createHash("sha256").update(pobText).digest("hex") ||
    gemsFile.exactGitObjectMatch !== true
  ) {
    throw new Error(
      `Russian PoB gem source integrity mismatch: ${options.pobGems}`,
    );
  }

  const gems = parsePobGems(pobText);
  const gemReport = record(gemReportValue, options.poedbGemsReport);
  const exactGemRows = rows(
    gemReport,
    "poedbExactMissingRecords",
    options.poedbGemsReport,
  );
  for (const row of exactGemRows) {
    const id = stringField(row, "id", options.poedbGemsReport);
    gems[id] = oneLocalizedName(
      row,
      "russianNames",
      `${options.poedbGemsReport}.${id}`,
    );
  }
  const royaleRows = rows(
    gemReport,
    "royaleAliasNames",
    options.poedbGemsReport,
  );
  for (const row of royaleRows) {
    const id = stringField(row, "id", options.poedbGemsReport);
    gems[id] = oneLocalizedName(
      row,
      "localizedNames",
      `${options.poedbGemsReport}.${id}`,
    );
  }

  const auditedGemFallbacks = Object.fromEntries(
    displayAudit.nonRussianGems.map((item) => [item.id, item]),
  );
  for (const id of Object.keys(auditedGemFallbacks)) {
    if (Object.hasOwn(gems, id)) continue;
    const gem = canonical.Gems[id];
    if (!gem) throw new Error(`stale reviewed gem fallback: ${id}`);
    gems[id] = gem.name;
  }
  assertEntityCoverage("gem", canonical.Gems, gems);

  const nonRussianGems = Object.fromEntries(
    Object.entries(gems).filter(
      ([, localized]) => !/[А-Яа-яЁё]/.test(localized),
    ),
  );
  assertEntityCoverage(
    "reviewed non-Russian gem",
    nonRussianGems,
    auditedGemFallbacks,
  );
  const gemFallbacks = Object.fromEntries(
    Object.entries(auditedGemFallbacks).map(([id, item]) => [
      id,
      review(item.reason, item.source),
    ]),
  );

  const areaReport = record(areaReportValue, options.areasReport);
  if (
    areaReport.kind !== "areas" ||
    areaReport.missingCount !== 0 ||
    areaReport.coveredCount !== Object.keys(canonical.Areas).length
  ) {
    throw new Error(`incomplete audited area report: ${options.areasReport}`);
  }
  const localizedAreaNames = Object.fromEntries(
    rows(areaReport, "covered", options.areasReport).map((area) => [
      stringField(area, "id", options.areasReport),
      stringField(area, "localized", options.areasReport),
    ]),
  );
  assertEntityCoverage("area audit", canonical.Areas, localizedAreaNames);
  const areaIdsByName = new Map<string, string[]>();
  for (const area of Object.values(canonical.Areas)) {
    const ids = areaIdsByName.get(area.name) ?? [];
    ids.push(area.id);
    areaIdsByName.set(area.name, ids);
  }

  const areas: Record<
    string,
    { name: string; mapName: string | null; craftingRecipes: string[] }
  > = {};
  const areaMapNameFallbacks: Record<string, ReturnType<typeof review>> = {};
  const craftingFallbacks: Record<string, ReturnType<typeof review>> = {};
  for (const area of Object.values(canonical.Areas)) {
    let mapName: string | null = null;
    if (area.map_name !== null) {
      const sourceIds =
        area.map_name === area.name
          ? [area.id]
          : (areaIdsByName.get(area.map_name) ?? []);
      const candidates = [
        ...new Set(sourceIds.map((id) => localizedAreaNames[id])),
      ];
      if (candidates.length === 1) {
        mapName = candidates[0];
      } else {
        mapName = area.map_name;
        areaMapNameFallbacks[area.id] = review(
          "No audited Russian MapPins export or exact WorldArea name match is available.",
          "canonical English MapPins fallback",
        );
      }
    }
    areas[area.id] = {
      name: localizedAreaNames[area.id],
      mapName,
      craftingRecipes: [],
    };
    if (area.crafting_recipes.length > 0) {
      craftingFallbacks[area.id] = review(
        "No audited Russian RecipeUnlockDisplay export is available.",
        "canonical English RecipeUnlockDisplay fallback",
      );
    }
  }

  const questReport = record(questReportValue, options.questsReport);
  if (
    questReport.kind !== "quests" ||
    questReport.coveredCount !==
      Object.values(canonical.Quests).filter((quest) => quest.name !== "")
        .length
  ) {
    throw new Error(`incomplete audited quest report: ${options.questsReport}`);
  }
  const localizedQuestNames = Object.fromEntries(
    rows(questReport, "covered", options.questsReport).map((quest) => [
      stringField(quest, "id", options.questsReport),
      stringField(quest, "localized", options.questsReport),
    ]),
  );

  const npcReport = record(npcReportValue, options.npcsReport);
  const auditedNpcNames = new Set(
    rows(npcReport, "results", options.npcsReport).map((npc) =>
      stringField(npc, "english", options.npcsReport),
    ),
  );
  const reviewedNpcNames = Object.fromEntries(
    displayAudit.npcs.map((npc) => [npc.english, npc.localized]),
  );
  assertEntityCoverage(
    "reviewed NPC",
    Object.fromEntries([...auditedNpcNames].map((name) => [name, true])),
    reviewedNpcNames,
  );

  const quests: Record<
    string,
    {
      name: string;
      rewardNpcs: Record<string, string>;
      vendorNpcs: Record<string, Record<string, string>>;
    }
  > = {};
  const questNameFallbacks: Record<string, ReturnType<typeof review>> = {};
  const rewardNpcFallbacks: Record<string, ReturnType<typeof review>> = {};
  const vendorNpcFallbacks: Record<string, ReturnType<typeof review>> = {};
  const syntheticNpcNames = new Set(["Chest 1", "Chest 2", "Tutorial NPC"]);
  for (const quest of Object.values(canonical.Quests)) {
    const name = quest.name === "" ? "" : localizedQuestNames[quest.id];
    if (quest.name === "") {
      questNameFallbacks[quest.id] = review(
        "Canonical synthetic quest bucket intentionally has no display name.",
        "canonical quest data",
      );
    }
    const rewardNpcs: Record<string, string> = {};
    const vendorNpcs: Record<string, Record<string, string>> = {};
    for (const [offerId, offer] of Object.entries(quest.reward_offers)) {
      if (!offer) continue;
      const rewardPath = `${quest.id}/${offerId}`;
      rewardNpcs[offerId] =
        reviewedNpcNames[offer.quest_npc] ?? offer.quest_npc;
      if (syntheticNpcNames.has(offer.quest_npc)) {
        rewardNpcFallbacks[rewardPath] = review(
          "Synthetic route label intentionally remains canonical English.",
          "canonical quest data",
        );
      } else if (!reviewedNpcNames[offer.quest_npc]) {
        throw new Error(`missing reviewed NPC name: ${offer.quest_npc}`);
      }
      vendorNpcs[offerId] = {};
      for (const [gemId, vendor] of Object.entries(offer.vendor)) {
        if (!vendor) continue;
        const path = `${quest.id}/${offerId}/${gemId}`;
        vendorNpcs[offerId][gemId] = reviewedNpcNames[vendor.npc] ?? vendor.npc;
        if (syntheticNpcNames.has(vendor.npc)) {
          vendorNpcFallbacks[path] = review(
            "Synthetic route label intentionally remains canonical English.",
            "canonical quest data",
          );
        } else if (!reviewedNpcNames[vendor.npc]) {
          throw new Error(`missing reviewed vendor NPC name: ${vendor.npc}`);
        }
      }
    }
    quests[quest.id] = { name, rewardNpcs, vendorNpcs };
  }

  const reviewedClassNames = Object.fromEntries(
    displayAudit.classes.map((characterClass) => [
      characterClass.english,
      characterClass.localized,
    ]),
  );
  assertEntityCoverage("class", canonical.Characters, reviewedClassNames);
  const value = {
    sourceMetadata: {
      schemaVersion: 1,
      sources: sourceMetadata,
    },
    gems,
    areas,
    quests,
    classes: reviewedClassNames,
    literals: {},
    intentionalEnglishFallbacks: {
      gems: gemFallbacks,
      areaMapNames: areaMapNameFallbacks,
      craftingRecipes: craftingFallbacks,
      questNames: questNameFallbacks,
      rewardNpcs: rewardNpcFallbacks,
      vendorNpcs: vendorNpcFallbacks,
    },
  };
  await writeValidatedData(value, canonical, options.output);
}

export async function generateFromOfficialExports(
  options: OfficialExportOptions,
): Promise<void> {
  const exportNames = [
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
  const sourceMetadata = await validateAuditManifest(
    options.auditManifest,
    Object.fromEntries(
      exportNames.map((name) => [
        name,
        join(options.exportsDirectory, `${name}.datc64.json`),
      ]),
    ),
  );
  const canonical = await loadCanonical(options.canonicalDirectory);
  const [
    baseItemTypes,
    worldAreas,
    mapPins,
    questsExport,
    questRewardOffers,
    npcTalk,
    npcs,
    characters,
    skillGems,
    recipeUnlockDisplay,
  ] = await Promise.all(
    exportNames.map((name) => loadDatExport(options.exportsDirectory, name)),
  );

  const byId = (table: DatExport) =>
    new Map(
      table.data
        .filter((row) => typeof row.Id === "string")
        .map((row) => [row.Id as string, row]),
    );
  const baseItemsById = byId(baseItemTypes);
  const worldAreasById = byId(worldAreas);
  const questsById = byId(questsExport);
  const npcNamesByOfferId = new Map<string, string>();
  for (const row of npcTalk.data) {
    if (
      typeof row.QuestRewardOffersKey !== "number" ||
      typeof row.NPCKey !== "number"
    ) {
      continue;
    }
    const offer = questRewardOffers.data[row.QuestRewardOffersKey];
    const npc = npcs.data[row.NPCKey];
    if (
      typeof offer?.Id === "string" &&
      typeof npc?.Name === "string" &&
      npc.Name.length > 0
    ) {
      npcNamesByOfferId.set(offer.Id, npc.Name);
    }
  }
  const npcNames = new Map<string, string>();
  for (const quest of Object.values(canonical.Quests)) {
    for (const [offerId, offer] of Object.entries(quest.reward_offers)) {
      if (!offer) continue;
      const localized = npcNamesByOfferId.get(offerId);
      if (!localized) continue;
      const existing = npcNames.get(offer.quest_npc);
      if (existing && existing !== localized) {
        throw new Error(
          `conflicting official NPC translations: ${offer.quest_npc}`,
        );
      }
      npcNames.set(offer.quest_npc, localized);
    }
  }

  const fallbackSource = `official Russian DAT export: ${options.exportsDirectory}`;
  const gemFallbacks: Record<string, ReturnType<typeof review>> = {};
  const gems: Record<string, string> = {};
  for (const gem of Object.values(canonical.Gems)) {
    const name = baseItemsById.get(gem.id)?.Name;
    if (typeof name !== "string" || name.length === 0) continue;
    gems[gem.id] = name;
    if (!/[А-Яа-яЁё]/.test(name)) {
      gemFallbacks[gem.id] = review(
        "The official Russian export retains this English technical/DNT value.",
        fallbackSource,
      );
    }
  }

  const mapPinNames = new Map<string, string>();
  for (const pin of mapPins.data) {
    const areaId =
      typeof pin.WaypointWorldAreaId === "string"
        ? pin.WaypointWorldAreaId
        : typeof pin.Waypoint_WorldAreasKey === "number"
          ? (worldAreas.data[pin.Waypoint_WorldAreasKey]?.Id as
              string | undefined)
          : undefined;
    if (areaId && typeof pin.Name === "string" && pin.Name.length > 0) {
      mapPinNames.set(areaId, pin.Name);
    }
  }
  const recipesByArea = new Map<string, string[]>();
  for (const recipe of recipeUnlockDisplay.data) {
    const areaId =
      typeof recipe.UnlockAreaId === "string"
        ? recipe.UnlockAreaId
        : typeof recipe.UnlockArea === "number"
          ? (worldAreas.data[recipe.UnlockArea]?.Id as string | undefined)
          : undefined;
    if (
      areaId &&
      typeof recipe.Description === "string" &&
      recipe.Description.length > 0
    ) {
      const descriptions = recipesByArea.get(areaId) ?? [];
      descriptions.push(recipe.Description);
      recipesByArea.set(areaId, descriptions);
    }
  }
  const areaMapNameFallbacks: Record<string, ReturnType<typeof review>> = {};
  const craftingFallbacks: Record<string, ReturnType<typeof review>> = {};
  const areas: Record<
    string,
    { name: string; mapName: string | null; craftingRecipes: string[] }
  > = {};
  for (const area of Object.values(canonical.Areas)) {
    const localized = worldAreasById.get(area.id);
    if (!localized || typeof localized.Name !== "string") continue;
    const mapName =
      area.map_name === null ? null : (mapPinNames.get(area.id) ?? "");
    if (mapName === area.map_name) {
      areaMapNameFallbacks[area.id] = review(
        "The official Russian MapPins export retains this English value.",
        fallbackSource,
      );
    }
    const craftingRecipes = recipesByArea.get(area.id) ?? [];
    if (
      craftingRecipes.length === area.crafting_recipes.length &&
      craftingRecipes.some(
        (description, index) => description === area.crafting_recipes[index],
      )
    ) {
      craftingFallbacks[area.id] = review(
        "The official Russian RecipeUnlockDisplay export retains an English value.",
        fallbackSource,
      );
    }
    areas[area.id] = {
      name: localized.Name,
      mapName,
      craftingRecipes,
    };
  }

  const questNameFallbacks: Record<string, ReturnType<typeof review>> = {};
  const rewardNpcFallbacks: Record<string, ReturnType<typeof review>> = {};
  const vendorNpcFallbacks: Record<string, ReturnType<typeof review>> = {};
  const syntheticNpcNames = new Set(["Chest 1", "Chest 2", "Tutorial NPC"]);
  const localizedQuests: Record<
    string,
    {
      name: string;
      rewardNpcs: Record<string, string>;
      vendorNpcs: Record<string, Record<string, string>>;
    }
  > = {};
  for (const quest of Object.values(canonical.Quests)) {
    const localizedQuest = questsById.get(quest.id);
    if (
      quest.name !== "" &&
      (!localizedQuest || typeof localizedQuest.Name !== "string")
    ) {
      continue;
    }
    if (quest.name === "") {
      questNameFallbacks[quest.id] = review(
        "Canonical synthetic quest bucket intentionally has no display name.",
        "canonical quest data",
      );
    }
    const rewardNpcs: Record<string, string> = {};
    const vendorNpcs: Record<string, Record<string, string>> = {};
    for (const [offerId, offer] of Object.entries(quest.reward_offers)) {
      if (!offer) continue;
      const rewardPath = `${quest.id}/${offerId}`;
      rewardNpcs[offerId] =
        npcNames.get(offer.quest_npc) ??
        (syntheticNpcNames.has(offer.quest_npc) ? offer.quest_npc : "");
      if (syntheticNpcNames.has(offer.quest_npc)) {
        rewardNpcFallbacks[rewardPath] = review(
          "Synthetic route label intentionally remains canonical English.",
          "canonical quest data",
        );
      }
      vendorNpcs[offerId] = {};
      for (const [gemId, vendor] of Object.entries(offer.vendor)) {
        if (!vendor) continue;
        const path = `${quest.id}/${offerId}/${gemId}`;
        vendorNpcs[offerId][gemId] =
          npcNames.get(vendor.npc) ??
          (syntheticNpcNames.has(vendor.npc) ? vendor.npc : "");
        if (syntheticNpcNames.has(vendor.npc)) {
          vendorNpcFallbacks[path] = review(
            "Synthetic route label intentionally remains canonical English.",
            "canonical quest data",
          );
        }
      }
    }
    localizedQuests[quest.id] = {
      name: quest.name === "" ? "" : (localizedQuest?.Name as string),
      rewardNpcs,
      vendorNpcs,
    };
  }

  const classes: Record<string, string> = {};
  const canonicalClassByStartGem = new Map(
    Object.entries(canonical.Characters).map(([english, character]) => [
      (character as { start_gem_id?: unknown }).start_gem_id,
      english,
    ]),
  );
  for (const character of characters.data) {
    if (typeof character.StartSkillGem !== "number") continue;
    const skillGem = skillGems.data[character.StartSkillGem];
    const baseItem =
      typeof skillGem?.BaseItemTypesKey === "number"
        ? baseItemTypes.data[skillGem.BaseItemTypesKey]
        : undefined;
    const english =
      typeof baseItem?.Id === "string"
        ? canonicalClassByStartGem.get(baseItem.Id)
        : undefined;
    if (
      english &&
      typeof character.Name === "string" &&
      character.Name.length > 0
    ) {
      classes[english] = character.Name;
    }
  }

  await writeValidatedData(
    {
      sourceMetadata: {
        schemaVersion: 1,
        sources: sourceMetadata,
      },
      gems,
      areas,
      quests: localizedQuests,
      classes,
      literals: {},
      intentionalEnglishFallbacks: {
        gems: gemFallbacks,
        areaMapNames: areaMapNameFallbacks,
        craftingRecipes: craftingFallbacks,
        questNames: questNameFallbacks,
        rewardNpcs: rewardNpcFallbacks,
        vendorNpcs: vendorNpcFallbacks,
      },
    },
    canonical,
    options.output,
  );
}

function argumentMap(args: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!key?.startsWith("--") || !value) {
      throw new Error(`invalid generator argument: ${key ?? ""}`);
    }
    parsed[key.slice(2)] = value;
  }
  return parsed;
}

async function main(): Promise<void> {
  const args = argumentMap(process.argv.slice(2));
  if (args.exports) {
    for (const key of ["canonical", "audit-manifest", "output"]) {
      if (!args[key]) throw new Error(`missing generator argument: --${key}`);
    }
    await generateFromOfficialExports({
      canonicalDirectory: resolve(args.canonical),
      exportsDirectory: resolve(args.exports),
      auditManifest: resolve(args["audit-manifest"]),
      output: resolve(args.output),
    });
    return;
  }
  const required = [
    "canonical",
    "pob-gems",
    "pob-report",
    "poedb-gems-report",
    "areas-report",
    "quests-report",
    "npcs-report",
    "class-source",
    "display-audit-report",
    "audit-manifest",
    "output",
  ];
  for (const key of required) {
    if (!args[key]) throw new Error(`missing generator argument: --${key}`);
  }
  await generateFromAuditedSources({
    canonicalDirectory: resolve(args.canonical),
    pobGems: resolve(args["pob-gems"]),
    pobReport: resolve(args["pob-report"]),
    poedbGemsReport: resolve(args["poedb-gems-report"]),
    areasReport: resolve(args["areas-report"]),
    questsReport: resolve(args["quests-report"]),
    npcsReport: resolve(args["npcs-report"]),
    classSource: resolve(args["class-source"]),
    displayAuditReport: resolve(args["display-audit-report"]),
    auditManifest: resolve(args["audit-manifest"]),
    output: resolve(args.output),
  });
}

if (
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
