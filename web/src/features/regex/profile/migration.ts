import {
  PROFILE_SCHEMA_VERSION,
  createDefaultToolSettings,
  normalizeProfileStore,
  normalizeVendorSettings,
  type RegexProfile,
  type RegexProfileStore,
} from "./schema.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const legacyToolNames = {
  map: "maps",
  itemCrafting: "items",
  mapNames: "mapnames",
  expedition: "expedition",
  heist: "heist",
  flask: "flasks",
  beast: "beast",
  tattoo: "tattoos",
  runegraft: "runegrafts",
  scarab: "scarabs",
  jewel: "jewels",
} as const;

function legacyVendor(value: unknown): ReturnType<typeof normalizeVendorSettings> {
  const record = isRecord(value) ? value : {};
  return normalizeVendorSettings({
    linkCounts: [
      ...(record.anyFourLink === true ? [4] : []),
      ...(record.anyFiveLink === true ? [5] : []),
      ...(record.anySixLink === true ? [6] : []),
    ],
    movement: record.movement,
    plusGems: record.plusGems,
    damage: record.damage,
    weapon: record.weapon,
    gems: record.gems,
  });
}

export function migrateLegacyProfiles(
  value: unknown,
  selectedProfile: unknown,
): RegexProfileStore {
  const legacyProfiles = isRecord(value) ? value : {};
  const profiles: RegexProfile[] = [];

  for (const name of Object.keys(legacyProfiles).sort()) {
    if (name === "__proto__" || name === "prototype" || name === "constructor") continue;
    const legacy = legacyProfiles[name];
    if (!isRecord(legacy) || name.trim().length === 0) continue;
    const tools = createDefaultToolSettings();
    tools.vendor = legacyVendor(legacy.vendor);
    for (const [legacyName, toolName] of Object.entries(legacyToolNames)) {
      const source = legacy[legacyName];
      if (isRecord(source)) tools[toolName] = source as never;
    }
    profiles.push({
      name,
      locale: legacy.language === "ENGLISH" || legacy.language === "en" ? "en" : "ru",
      tools,
    });
  }

  return normalizeProfileStore({
    version: PROFILE_SCHEMA_VERSION,
    selectedProfile,
    profiles,
  });
}
