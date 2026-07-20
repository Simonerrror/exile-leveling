const SINGLE_DISPLAY_FRAGMENTS = new Set([
  "arena",
  "quest_text",
  "generic",
  "reward_quest",
]);

export function assertEntityCoverage(
  kind: string,
  canonical: Record<string, unknown>,
  localized: Record<string, unknown>,
): void {
  const missing = Object.keys(canonical)
    .filter((id) => !Object.hasOwn(localized, id))
    .sort();
  const unknown = Object.keys(localized)
    .filter((id) => !Object.hasOwn(canonical, id))
    .sort();
  if (missing.length === 0 && unknown.length === 0) return;

  const details = [
    missing.length > 0 ? `missing IDs: ${missing.join(", ")}` : "",
    unknown.length > 0 ? `unknown/stale IDs: ${unknown.join(", ")}` : "",
  ].filter(Boolean);
  throw new Error(`${kind} coverage invalid: ${details.join("; ")}`);
}

function assertRecord(
  value: unknown,
  path: string,
): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`invalid localized game data: ${path} must be an object`);
  }
}

function assertNonEmptyString(
  value: unknown,
  path: string,
): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      `invalid localized game data: ${path} must be a non-empty string`,
    );
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (
    actual.length !== sortedExpected.length ||
    actual.some((key, index) => key !== sortedExpected[index])
  ) {
    throw new Error(
      `invalid localized audit schema: ${path} keys must be ${sortedExpected.join(", ")}`,
    );
  }
}

interface CanonicalGameData {
  Gems: Record<string, { name?: unknown }>;
  Areas: Record<
    string,
    { name?: unknown; map_name?: unknown; crafting_recipes?: unknown }
  >;
  Quests: Record<string, { name?: unknown; reward_offers?: unknown }>;
  Characters: Record<string, unknown>;
}

const CYRILLIC = /[А-Яа-яЁё]/;
const POB_COMMIT = "696d36aabaffb88f9c75ee424a1b4433b3233597";
const AUDITED_SOURCE_KINDS = new Set([
  "pobGems",
  "pobReport",
  "poedbGemsReport",
  "areasReport",
  "questsReport",
  "npcsReport",
  "classSource",
  "displayAuditReport",
]);
const OFFICIAL_SOURCE_KINDS = new Set([
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
]);

function assertAuditSourceMetadata(value: unknown): void {
  assertRecord(value, "sourceMetadata");
  assertExactKeys(value, ["schemaVersion", "sources"], "sourceMetadata");
  if (value.schemaVersion !== 1 || !Array.isArray(value.sources)) {
    throw new Error(
      "invalid localized audit: sourceMetadata.schemaVersion or sources",
    );
  }
  const kinds: Record<string, unknown> = {};
  value.sources.forEach((source, index) => {
    const path = `sourceMetadata.sources.${index}`;
    assertRecord(source, path);
    assertExactKeys(
      source,
      ["kind", "source", "revision", "retrievedAt", "sha256"],
      path,
    );
    for (const field of [
      "kind",
      "source",
      "revision",
      "retrievedAt",
      "sha256",
    ]) {
      assertNonEmptyString(source[field], `${path}.${field}`);
    }
    if (!/^https:\/\/\S+$/.test(source.source as string)) {
      throw new Error(`invalid localized audit: ${path}.source`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.retrievedAt as string)) {
      throw new Error(`invalid localized audit: ${path}.retrievedAt`);
    }
    if (!/^[a-f0-9]{64}$/.test(source.sha256 as string)) {
      throw new Error(`invalid localized audit: ${path}.sha256`);
    }
    if (Object.hasOwn(kinds, source.kind as string)) {
      throw new Error(`duplicate localized audit source kind: ${source.kind}`);
    }
    kinds[source.kind as string] = source;
  });

  const actualKinds = new Set(Object.keys(kinds));
  const expectedKinds =
    actualKinds.size === AUDITED_SOURCE_KINDS.size &&
    [...actualKinds].every((kind) => AUDITED_SOURCE_KINDS.has(kind))
      ? AUDITED_SOURCE_KINDS
      : OFFICIAL_SOURCE_KINDS;
  assertEntityCoverage(
    "source metadata kind",
    Object.fromEntries([...expectedKinds].map((kind) => [kind, true])),
    kinds,
  );

  if (expectedKinds === AUDITED_SOURCE_KINDS) {
    for (const kind of ["pobGems", "pobReport", "classSource"]) {
      const source = kinds[kind] as Record<string, unknown>;
      if (
        source.revision !== POB_COMMIT ||
        !(source.source as string).includes(POB_COMMIT) ||
        !(source.source as string).startsWith(
          "https://gitverse.ru/pathofbuilding/PathOfBuilding/",
        )
      ) {
        throw new Error(`invalid localized audit source provenance: ${kind}`);
      }
    }
    for (const kind of [
      "poedbGemsReport",
      "areasReport",
      "questsReport",
      "npcsReport",
    ]) {
      if (
        !((kinds[kind] as Record<string, unknown>).source as string).startsWith(
          "https://poedb.tw/",
        )
      ) {
        throw new Error(`invalid localized audit source provenance: ${kind}`);
      }
    }
    const displaySource = (kinds.displayAuditReport as Record<string, unknown>)
      .source as string;
    if (
      !displaySource.startsWith(
        "https://github.com/Simonerrror/exile-leveling/",
      )
    ) {
      throw new Error(
        "invalid localized audit source provenance: displayAuditReport",
      );
    }
  }
}

function assertAuditManifestMatches(
  sourceMetadata: unknown,
  expectedManifest: unknown,
): void {
  assertRecord(sourceMetadata, "sourceMetadata");
  assertRecord(expectedManifest, "auditManifest");
  if (
    expectedManifest.schemaVersion !== 1 ||
    expectedManifest.kind !== "russian-display-audit-manifest"
  ) {
    throw new Error("invalid localized audit manifest schema");
  }
  assertRecord(expectedManifest.inputs, "auditManifest.inputs");
  if (!Array.isArray(sourceMetadata.sources)) {
    throw new Error("invalid localized audit: sourceMetadata.sources");
  }
  const sources = Object.fromEntries(
    sourceMetadata.sources.map((source, index) => {
      assertRecord(source, `sourceMetadata.sources.${index}`);
      return [source.kind, source];
    }),
  );
  assertEntityCoverage(
    "audit manifest source",
    expectedManifest.inputs,
    sources,
  );
  for (const [kind, expected] of Object.entries(expectedManifest.inputs)) {
    assertRecord(expected, `auditManifest.inputs.${kind}`);
    const actual = sources[kind] as Record<string, unknown>;
    for (const field of ["source", "revision", "retrievedAt", "sha256"]) {
      if (actual[field] !== expected[field]) {
        throw new Error(
          `localized audit does not match manifest: ${kind}.${field}`,
        );
      }
    }
  }
}

export function assertLocalizedGameData(
  value: unknown,
  audit: unknown,
  canonical: CanonicalGameData,
  expectedManifest?: unknown,
): void {
  assertRecord(value, "root");
  const runtimeKeys = ["gems", "areas", "quests", "classes", "literals"];
  const actualRuntimeKeys = Object.keys(value).sort();
  if (
    actualRuntimeKeys.length !== runtimeKeys.length ||
    actualRuntimeKeys.some(
      (key, index) => key !== [...runtimeKeys].sort()[index],
    )
  ) {
    throw new Error(
      "invalid localized game data: runtime root must contain only display maps",
    );
  }
  for (const buildOnlyField of [
    "sourceMetadata",
    "intentionalEnglishFallbacks",
  ]) {
    if (Object.hasOwn(value, buildOnlyField)) {
      throw new Error(
        `invalid localized game data: runtime root contains build-only ${buildOnlyField}`,
      );
    }
  }
  assertRecord(audit, "audit");
  assertExactKeys(
    audit,
    ["schemaVersion", "kind", "sourceMetadata", "intentionalEnglishFallbacks"],
    "audit",
  );
  if (audit.schemaVersion !== 1 || audit.kind !== "russian-game-data-audit") {
    throw new Error("invalid localized audit: root schemaVersion or kind");
  }
  assertAuditSourceMetadata(audit.sourceMetadata);
  if (expectedManifest !== undefined) {
    assertAuditManifestMatches(audit.sourceMetadata, expectedManifest);
  }
  const gems = value.gems;
  const areas = value.areas;
  const quests = value.quests;
  const classes = value.classes;
  const literals = value.literals;
  const fallbacks = audit.intentionalEnglishFallbacks;
  assertRecord(gems, "gems");
  assertRecord(areas, "areas");
  assertRecord(quests, "quests");
  assertRecord(classes, "classes");
  assertRecord(literals, "literals");
  assertRecord(fallbacks, "intentionalEnglishFallbacks");
  assertExactKeys(
    fallbacks,
    [
      "gems",
      "classes",
      "areaNames",
      "areaMapNames",
      "craftingRecipes",
      "questNames",
      "rewardNpcs",
      "vendorNpcs",
      "literals",
    ],
    "intentionalEnglishFallbacks",
  );

  assertEntityCoverage("gem", canonical.Gems, gems);
  assertEntityCoverage("area", canonical.Areas, areas);
  assertEntityCoverage("quest", canonical.Quests, quests);
  assertEntityCoverage("class", canonical.Characters, classes);
  const gemFallbacks = fallbacks.gems;
  const classFallbacks = fallbacks.classes;
  const areaNameFallbacks = fallbacks.areaNames;
  const mapNameFallbacks = fallbacks.areaMapNames;
  const craftingFallbacks = fallbacks.craftingRecipes;
  const questNameFallbacks = fallbacks.questNames;
  const rewardNpcFallbacks = fallbacks.rewardNpcs;
  const vendorNpcFallbacks = fallbacks.vendorNpcs;
  const literalFallbacks = fallbacks.literals;
  assertRecord(gemFallbacks, "intentionalEnglishFallbacks.gems");
  assertRecord(classFallbacks, "intentionalEnglishFallbacks.classes");
  assertRecord(areaNameFallbacks, "intentionalEnglishFallbacks.areaNames");
  assertRecord(mapNameFallbacks, "intentionalEnglishFallbacks.areaMapNames");
  assertRecord(
    craftingFallbacks,
    "intentionalEnglishFallbacks.craftingRecipes",
  );
  assertRecord(questNameFallbacks, "intentionalEnglishFallbacks.questNames");
  assertRecord(rewardNpcFallbacks, "intentionalEnglishFallbacks.rewardNpcs");
  assertRecord(vendorNpcFallbacks, "intentionalEnglishFallbacks.vendorNpcs");
  assertRecord(literalFallbacks, "intentionalEnglishFallbacks.literals");
  const fallbackGroups = {
    gems: gemFallbacks,
    classes: classFallbacks,
    areaNames: areaNameFallbacks,
    areaMapNames: mapNameFallbacks,
    craftingRecipes: craftingFallbacks,
    questNames: questNameFallbacks,
    rewardNpcs: rewardNpcFallbacks,
    vendorNpcs: vendorNpcFallbacks,
    literals: literalFallbacks,
  };
  for (const [group, groupValue] of Object.entries(fallbackGroups)) {
    for (const [id, review] of Object.entries(groupValue)) {
      assertRecord(review, `intentionalEnglishFallbacks.${group}.${id}`);
      assertExactKeys(
        review,
        ["reason", "source"],
        `intentionalEnglishFallbacks.${group}.${id}`,
      );
      assertNonEmptyString(
        review.reason,
        `intentionalEnglishFallbacks.${group}.${id}.reason`,
      );
      assertNonEmptyString(
        review.source,
        `intentionalEnglishFallbacks.${group}.${id}.source`,
      );
    }
  }
  const assertReviewedIds = (
    kind: string,
    reviews: Record<string, unknown>,
    validIds: Set<string>,
  ) => {
    for (const id of Object.keys(reviews)) {
      if (!validIds.has(id)) {
        throw new Error(`unknown/stale reviewed ${kind} fallback: ${id}`);
      }
    }
  };
  assertReviewedIds("gem", gemFallbacks, new Set(Object.keys(canonical.Gems)));
  assertReviewedIds(
    "class",
    classFallbacks,
    new Set(Object.keys(canonical.Characters)),
  );
  const areaIds = new Set(Object.keys(canonical.Areas));
  assertReviewedIds("area name", areaNameFallbacks, areaIds);
  assertReviewedIds("map name", mapNameFallbacks, areaIds);
  assertReviewedIds("crafting recipe", craftingFallbacks, areaIds);
  assertReviewedIds(
    "quest name",
    questNameFallbacks,
    new Set(Object.keys(canonical.Quests)),
  );
  const rewardPaths = new Set<string>();
  const vendorPaths = new Set<string>();
  for (const [questId, quest] of Object.entries(canonical.Quests)) {
    if (
      typeof quest.reward_offers !== "object" ||
      quest.reward_offers === null ||
      Array.isArray(quest.reward_offers)
    ) {
      continue;
    }
    for (const [offerId, offer] of Object.entries(quest.reward_offers)) {
      rewardPaths.add(`${questId}/${offerId}`);
      if (
        typeof offer !== "object" ||
        offer === null ||
        Array.isArray(offer) ||
        typeof offer.vendor !== "object" ||
        offer.vendor === null ||
        Array.isArray(offer.vendor)
      ) {
        continue;
      }
      for (const gemId of Object.keys(offer.vendor)) {
        vendorPaths.add(`${questId}/${offerId}/${gemId}`);
      }
    }
  }
  assertReviewedIds("reward NPC", rewardNpcFallbacks, rewardPaths);
  assertReviewedIds("vendor NPC", vendorNpcFallbacks, vendorPaths);
  assertReviewedIds(
    "literal",
    literalFallbacks,
    new Set(Object.keys(literals)),
  );

  for (const [id, name] of Object.entries(gems)) {
    assertNonEmptyString(name, `gems.${id}`);
    const requiresReviewedFallback =
      name === canonical.Gems[id].name || !/[А-Яа-яЁё]/.test(name);
    const hasReviewedFallback = Object.hasOwn(fallbackGroups.gems, id);
    if (requiresReviewedFallback && !hasReviewedFallback) {
      throw new Error(`English gem fallback is not reviewed: ${id}`);
    }
    if (!requiresReviewedFallback && hasReviewedFallback) {
      throw new Error(`unnecessary reviewed gem fallback: ${id}`);
    }
  }
  for (const [id, name] of Object.entries(classes)) {
    assertNonEmptyString(name, `classes.${id}`);
    const requiresFallback = name === id || !CYRILLIC.test(name);
    const hasFallback = Object.hasOwn(classFallbacks, id);
    if (requiresFallback && !hasFallback) {
      throw new Error(`English class fallback is not reviewed: ${id}`);
    }
    if (!requiresFallback && hasFallback) {
      throw new Error(`unnecessary reviewed class fallback: ${id}`);
    }
  }
  for (const [id, canonicalArea] of Object.entries(canonical.Areas)) {
    const area = areas[id];
    assertRecord(area, `areas.${id}`);
    assertNonEmptyString(area.name, `areas.${id}.name`);
    const areaNameRequiresFallback =
      area.name === canonicalArea.name || !CYRILLIC.test(area.name);
    const hasAreaNameFallback = Object.hasOwn(areaNameFallbacks, id);
    if (areaNameRequiresFallback && !hasAreaNameFallback) {
      throw new Error(`English area name fallback is not reviewed: ${id}`);
    }
    if (!areaNameRequiresFallback && hasAreaNameFallback) {
      throw new Error(`unnecessary reviewed area name fallback: ${id}`);
    }
    if (canonicalArea.map_name === null) {
      if (area.mapName !== null) {
        throw new Error(
          `invalid localized game data: areas.${id}.mapName must be null`,
        );
      }
      if (Object.hasOwn(mapNameFallbacks, id)) {
        throw new Error(`unnecessary reviewed map name fallback: ${id}`);
      }
    } else {
      assertNonEmptyString(area.mapName, `areas.${id}.mapName`);
      const mapNameRequiresFallback =
        area.mapName === canonicalArea.map_name || !CYRILLIC.test(area.mapName);
      const hasMapNameFallback = Object.hasOwn(mapNameFallbacks, id);
      if (mapNameRequiresFallback && !hasMapNameFallback) {
        throw new Error(`English map name fallback is not reviewed: ${id}`);
      }
      if (!mapNameRequiresFallback && hasMapNameFallback) {
        throw new Error(`unnecessary reviewed map name fallback: ${id}`);
      }
    }
    if (!Array.isArray(area.craftingRecipes)) {
      throw new Error(
        `invalid localized game data: areas.${id}.craftingRecipes must be an array`,
      );
    }
    const canonicalRecipes = canonicalArea.crafting_recipes;
    if (!Array.isArray(canonicalRecipes)) {
      throw new Error(
        `invalid canonical game data: Areas.${id}.crafting_recipes`,
      );
    }
    if (area.craftingRecipes.length === 0 && canonicalRecipes.length > 0) {
      if (!Object.hasOwn(fallbackGroups.craftingRecipes, id)) {
        throw new Error(`crafting recipe fallback is not reviewed: ${id}`);
      }
    } else {
      if (area.craftingRecipes.length !== canonicalRecipes.length) {
        throw new Error(`crafting recipe cardinality differs: ${id}`);
      }
      area.craftingRecipes.forEach((recipe, index) => {
        assertNonEmptyString(recipe, `areas.${id}.craftingRecipes.${index}`);
      });
      const requiresCraftingFallback = area.craftingRecipes.some(
        (recipe) => !CYRILLIC.test(recipe),
      );
      const hasCraftingFallback = Object.hasOwn(craftingFallbacks, id);
      if (requiresCraftingFallback && !hasCraftingFallback) {
        throw new Error(
          `English crafting recipe fallback is not reviewed: ${id}`,
        );
      }
      if (!requiresCraftingFallback && hasCraftingFallback) {
        throw new Error(`unnecessary reviewed crafting recipe fallback: ${id}`);
      }
    }
  }
  for (const [literal, translation] of Object.entries(literals)) {
    assertNonEmptyString(translation, `literals.${literal}`);
    const requiresFallback =
      translation === literal || !CYRILLIC.test(translation);
    const hasFallback = Object.hasOwn(literalFallbacks, literal);
    if (requiresFallback && !hasFallback) {
      throw new Error(`English literal fallback is not reviewed: ${literal}`);
    }
    if (!requiresFallback && hasFallback) {
      throw new Error(`unnecessary reviewed literal fallback: ${literal}`);
    }
  }

  for (const [questId, canonicalQuest] of Object.entries(canonical.Quests)) {
    const quest = quests[questId];
    assertRecord(quest, `quests.${questId}`);
    const canonicalName = canonicalQuest.name;
    if (canonicalName === "") {
      if (quest.name !== "") {
        throw new Error(
          `invalid localized game data: quests.${questId}.name must preserve the canonical blank synthetic name`,
        );
      }
      if (!Object.hasOwn(fallbackGroups.questNames, questId)) {
        throw new Error(`blank quest fallback is not reviewed: ${questId}`);
      }
    } else {
      assertNonEmptyString(quest.name, `quests.${questId}.name`);
      const requiresFallback =
        quest.name === canonicalName || !CYRILLIC.test(quest.name);
      const hasFallback = Object.hasOwn(questNameFallbacks, questId);
      if (requiresFallback && !hasFallback) {
        throw new Error(
          `English quest name fallback is not reviewed: ${questId}`,
        );
      }
      if (!requiresFallback && hasFallback) {
        throw new Error(`unnecessary reviewed quest name fallback: ${questId}`);
      }
    }
    assertRecord(quest.rewardNpcs, `quests.${questId}.rewardNpcs`);
    assertRecord(quest.vendorNpcs, `quests.${questId}.vendorNpcs`);
    const rewardOffers = canonicalQuest.reward_offers;
    assertRecord(rewardOffers, `canonical.Quests.${questId}.reward_offers`);
    for (const offerId of Object.keys(quest.rewardNpcs)) {
      if (!Object.hasOwn(rewardOffers, offerId)) {
        throw new Error(
          `unknown/stale localized reward NPC path: ${questId}/${offerId}`,
        );
      }
    }
    for (const offerId of Object.keys(quest.vendorNpcs)) {
      if (!Object.hasOwn(rewardOffers, offerId)) {
        throw new Error(
          `unknown/stale localized vendor offer path: ${questId}/${offerId}`,
        );
      }
    }
    for (const [offerId, offerValue] of Object.entries(rewardOffers)) {
      assertRecord(
        offerValue,
        `canonical.Quests.${questId}.reward_offers.${offerId}`,
      );
      if (!Object.hasOwn(quest.rewardNpcs, offerId)) {
        throw new Error(
          `missing localized reward NPC path: ${questId}/${offerId}`,
        );
      }
      assertNonEmptyString(
        quest.rewardNpcs[offerId],
        `quests.${questId}.rewardNpcs.${offerId}`,
      );
      const rewardPath = `${questId}/${offerId}`;
      const rewardRequiresFallback =
        quest.rewardNpcs[offerId] === offerValue.quest_npc ||
        !/[А-Яа-яЁё]/.test(quest.rewardNpcs[offerId]);
      const hasRewardFallback = Object.hasOwn(
        fallbackGroups.rewardNpcs,
        rewardPath,
      );
      if (rewardRequiresFallback && !hasRewardFallback) {
        throw new Error(
          `English reward NPC fallback is not reviewed: ${rewardPath}`,
        );
      }
      if (!rewardRequiresFallback && hasRewardFallback) {
        throw new Error(
          `unnecessary reviewed reward NPC fallback: ${rewardPath}`,
        );
      }
      const localizedVendors = quest.vendorNpcs[offerId];
      assertRecord(localizedVendors, `quests.${questId}.vendorNpcs.${offerId}`);
      assertRecord(
        offerValue.vendor,
        `canonical.Quests.${questId}.reward_offers.${offerId}.vendor`,
      );
      for (const gemId of Object.keys(localizedVendors)) {
        if (!Object.hasOwn(offerValue.vendor, gemId)) {
          throw new Error(
            `unknown/stale localized vendor NPC path: ${questId}/${offerId}/${gemId}`,
          );
        }
      }
      for (const gemId of Object.keys(offerValue.vendor)) {
        if (!Object.hasOwn(localizedVendors, gemId)) {
          throw new Error(
            `missing localized vendor NPC path: ${questId}/${offerId}/${gemId}`,
          );
        }
        assertNonEmptyString(
          localizedVendors[gemId],
          `quests.${questId}.vendorNpcs.${offerId}.${gemId}`,
        );
        const vendor = offerValue.vendor[gemId];
        assertRecord(
          vendor,
          `canonical.Quests.${questId}.reward_offers.${offerId}.vendor.${gemId}`,
        );
        const vendorPath = `${questId}/${offerId}/${gemId}`;
        const vendorRequiresFallback =
          localizedVendors[gemId] === vendor.npc ||
          !/[А-Яа-яЁё]/.test(localizedVendors[gemId]);
        const hasVendorFallback = Object.hasOwn(
          fallbackGroups.vendorNpcs,
          vendorPath,
        );
        if (vendorRequiresFallback && !hasVendorFallback) {
          throw new Error(
            `English vendor NPC fallback is not reviewed: ${vendorPath}`,
          );
        }
        if (!vendorRequiresFallback && hasVendorFallback) {
          throw new Error(
            `unnecessary reviewed vendor NPC fallback: ${vendorPath}`,
          );
        }
      }
    }
  }
}

function assertFragmentArity(
  type: string,
  count: number,
  minimum: number,
  maximum?: number,
): void {
  if (count >= minimum && (maximum === undefined || count <= maximum)) return;

  const expected =
    maximum === undefined
      ? `at least ${minimum}`
      : minimum === maximum
        ? String(minimum)
        : `${minimum}-${maximum}`;
  throw new Error(
    `invalid route fragment arity: ${type} expected ${expected}, received ${count}`,
  );
}

function displayFragmentSignature(
  type: string,
  parameters: string[],
): string | undefined {
  if (SINGLE_DISPLAY_FRAGMENTS.has(type)) {
    assertFragmentArity(type, parameters.length, 1, 1);
    return `{${type}|display}`;
  }
  if (type === "reward_vendor") {
    assertFragmentArity(type, parameters.length, 1, 2);
    const cost = parameters[1] === undefined ? "" : `|${parameters[1]}`;
    return `{${type}|display${cost}}`;
  }
  if (type === "copy") {
    assertFragmentArity(type, parameters.length, 1);
    return `{${type}|display}`;
  }
}

export function routeSignature(line: string): string {
  const indent = line.match(/^\s*/)?.[0].length ?? 0;
  const content = line.slice(indent);
  const translatedDirective = content.match(/^#(section|sub)(?:\s|$)/)?.[1];
  const directive = content.startsWith("#")
    ? translatedDirective
      ? `#${translatedDirective}`
      : content
    : "";
  const fragments = [...line.matchAll(/\{([^{}]+)\}/g)].map((match) => {
    const [type, ...parameters] = match[1].split("|");
    const displaySignature = displayFragmentSignature(type, parameters);
    if (displaySignature !== undefined) return displaySignature;
    return `{${[type, ...parameters].join("|")}}`;
  });

  return JSON.stringify({ indent, directive, fragments });
}

export function assertMessageDictionary(
  value: unknown,
  path: string,
): asserts value is Record<string, string> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(
      `invalid message dictionary root: ${path} must be a plain object`,
    );
  }

  for (const [key, message] of Object.entries(value)) {
    if (typeof message !== "string") {
      throw new Error(
        `invalid message dictionary value: ${path} key ${key} must be a string`,
      );
    }
  }
}

export function assertMessageParity(
  english: Record<string, string>,
  russian: Record<string, string>,
): void {
  for (const key of Object.keys(english)) {
    if (!Object.hasOwn(russian, key))
      throw new Error(`missing Russian message key: ${key}`);
  }
  for (const key of Object.keys(russian)) {
    if (!Object.hasOwn(english, key))
      throw new Error(`unknown Russian message key: ${key}`);
  }
}

export function assertRouteParity(
  english: string,
  russian: string,
  name: string,
): void {
  const enLines = english.replaceAll("\r\n", "\n").split("\n");
  const ruLines = russian.replaceAll("\r\n", "\n").split("\n");
  if (enLines.length !== ruLines.length)
    throw new Error(`route line count differs: ${name}`);

  enLines.forEach((line, index) => {
    let englishSignature: string;
    let russianSignature: string;
    try {
      englishSignature = routeSignature(line);
      russianSignature = routeSignature(ruLines[index]);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("invalid route fragment arity:")
      ) {
        throw new Error(
          `route structure differs: ${name} line ${index + 1}: ${error.message}`,
          { cause: error },
        );
      }
      throw error;
    }

    if (englishSignature !== russianSignature)
      throw new Error(`route structure differs: ${name} line ${index + 1}`);
  });
}
