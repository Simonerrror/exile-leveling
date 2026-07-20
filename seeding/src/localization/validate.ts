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

interface CanonicalGameData {
  Gems: Record<string, { name?: unknown }>;
  Areas: Record<
    string,
    { name?: unknown; map_name?: unknown; crafting_recipes?: unknown }
  >;
  Quests: Record<string, { name?: unknown; reward_offers?: unknown }>;
  Characters: Record<string, unknown>;
}

export function assertLocalizedGameData(
  value: unknown,
  canonical: CanonicalGameData,
): void {
  assertRecord(value, "root");
  const gems = value.gems;
  const areas = value.areas;
  const quests = value.quests;
  const classes = value.classes;
  const literals = value.literals;
  const fallbacks = value.intentionalEnglishFallbacks;
  assertRecord(gems, "gems");
  assertRecord(areas, "areas");
  assertRecord(quests, "quests");
  assertRecord(classes, "classes");
  assertRecord(literals, "literals");
  assertRecord(fallbacks, "intentionalEnglishFallbacks");

  assertEntityCoverage("gem", canonical.Gems, gems);
  assertEntityCoverage("area", canonical.Areas, areas);
  assertEntityCoverage("quest", canonical.Quests, quests);
  assertEntityCoverage("class", canonical.Characters, classes);
  const gemFallbacks = fallbacks.gems;
  const mapNameFallbacks = fallbacks.areaMapNames;
  const craftingFallbacks = fallbacks.craftingRecipes;
  const questNameFallbacks = fallbacks.questNames;
  const rewardNpcFallbacks = fallbacks.rewardNpcs;
  const vendorNpcFallbacks = fallbacks.vendorNpcs;
  assertRecord(gemFallbacks, "intentionalEnglishFallbacks.gems");
  assertRecord(mapNameFallbacks, "intentionalEnglishFallbacks.areaMapNames");
  assertRecord(
    craftingFallbacks,
    "intentionalEnglishFallbacks.craftingRecipes",
  );
  assertRecord(questNameFallbacks, "intentionalEnglishFallbacks.questNames");
  assertRecord(rewardNpcFallbacks, "intentionalEnglishFallbacks.rewardNpcs");
  assertRecord(vendorNpcFallbacks, "intentionalEnglishFallbacks.vendorNpcs");
  const fallbackGroups = {
    gems: gemFallbacks,
    areaMapNames: mapNameFallbacks,
    craftingRecipes: craftingFallbacks,
    questNames: questNameFallbacks,
    rewardNpcs: rewardNpcFallbacks,
    vendorNpcs: vendorNpcFallbacks,
  };
  for (const [group, groupValue] of Object.entries(fallbackGroups)) {
    for (const [id, review] of Object.entries(groupValue)) {
      assertRecord(review, `intentionalEnglishFallbacks.${group}.${id}`);
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
  const areaIds = new Set(Object.keys(canonical.Areas));
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

  for (const [id, name] of Object.entries(gems)) {
    assertNonEmptyString(name, `gems.${id}`);
    if (
      name === canonical.Gems[id].name &&
      !Object.hasOwn(fallbackGroups.gems, id)
    ) {
      throw new Error(`English gem fallback is not reviewed: ${id}`);
    }
  }
  for (const [id, name] of Object.entries(classes)) {
    assertNonEmptyString(name, `classes.${id}`);
  }
  for (const [id, canonicalArea] of Object.entries(canonical.Areas)) {
    const area = areas[id];
    assertRecord(area, `areas.${id}`);
    assertNonEmptyString(area.name, `areas.${id}.name`);
    if (canonicalArea.map_name === null) {
      if (area.mapName !== null) {
        throw new Error(
          `invalid localized game data: areas.${id}.mapName must be null`,
        );
      }
    } else {
      assertNonEmptyString(area.mapName, `areas.${id}.mapName`);
      if (
        area.mapName === canonicalArea.map_name &&
        !Object.hasOwn(fallbackGroups.areaMapNames, id)
      ) {
        throw new Error(`English map name fallback is not reviewed: ${id}`);
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
      area.craftingRecipes.forEach((recipe, index) =>
        assertNonEmptyString(recipe, `areas.${id}.craftingRecipes.${index}`),
      );
    }
  }
  for (const [literal, translation] of Object.entries(literals)) {
    assertNonEmptyString(translation, `literals.${literal}`);
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
    }
    assertRecord(quest.rewardNpcs, `quests.${questId}.rewardNpcs`);
    assertRecord(quest.vendorNpcs, `quests.${questId}.vendorNpcs`);
    const rewardOffers = canonicalQuest.reward_offers;
    assertRecord(rewardOffers, `canonical.Quests.${questId}.reward_offers`);
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
      if (
        quest.rewardNpcs[offerId] === offerValue.quest_npc &&
        !Object.hasOwn(fallbackGroups.rewardNpcs, rewardPath)
      ) {
        throw new Error(
          `English reward NPC fallback is not reviewed: ${rewardPath}`,
        );
      }
      const localizedVendors = quest.vendorNpcs[offerId];
      assertRecord(localizedVendors, `quests.${questId}.vendorNpcs.${offerId}`);
      assertRecord(
        offerValue.vendor,
        `canonical.Quests.${questId}.reward_offers.${offerId}.vendor`,
      );
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
        if (
          localizedVendors[gemId] === vendor.npc &&
          !Object.hasOwn(fallbackGroups.vendorNpcs, vendorPath)
        ) {
          throw new Error(
            `English vendor NPC fallback is not reviewed: ${vendorPath}`,
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
