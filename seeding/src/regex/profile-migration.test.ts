import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PROFILE_STORE,
  normalizeFlaskSettings,
  normalizeProfileStore,
  normalizeVendorSettings,
} from "../../../web/src/features/regex/profile/schema.js";
import { migrateLegacyProfiles } from "../../../web/src/features/regex/profile/migration.js";
import {
  PROFILE_STORAGE_KEY,
  exportProfileStore,
  importProfileStore,
  loadProfileStore,
  saveProfileStore,
} from "../../../web/src/features/regex/profile/storage.js";

const forbiddenVendorKeys = [
  "anyTwoColorLink",
  "anyThreeColorLink",
  "anyFourColorLink",
  "anyFiveColorLink",
  "anySixColorLink",
  "anySixSocket",
  "colors",
  "specLink",
  "specLinkColors",
];

test("profile normalization preserves 2–6 links and signed catalog gem ids", () => {
  assert.deepEqual(
    normalizeVendorSettings({ linkCounts: [6, 2, 3, 2, 1, 7] }).linkCounts,
    [2, 3, 6],
  );
  assert.deepEqual(
    normalizeVendorSettings({ gems: [-2137186526, 12, -2137186526, "bad"] }).gems,
    [-2137186526, 12],
  );
});

test("flask settings restore typed defaults and normalize legacy field names", () => {
  assert.deepEqual(normalizeFlaskSettings({}), {
    selectedPrefix: [],
    selectedSuffix: [],
    itemLevel: 85,
    onlyMaxPrefix: false,
    onlyMaxSuffix: false,
    requireBoth: true,
    matchOpenAffix: true,
    ignoreEffectTiers: false,
  });
  assert.deepEqual(normalizeFlaskSettings({
    selectedPrefix: ["prefix", 7],
    selectedSuffix: ["suffix"],
    ilevel: "82",
    onlyMaxPrefixTierMod: true,
    onlyMaxSuffixTierMod: true,
    matchBothPrefixAndSuffix: false,
    matchOpenPrefixSuffix: false,
    ignoreEffectTiers: true,
  }), {
    selectedPrefix: ["prefix"],
    selectedSuffix: ["suffix"],
    itemLevel: 82,
    onlyMaxPrefix: true,
    onlyMaxSuffix: true,
    requireBoth: false,
    matchOpenAffix: false,
    ignoreEffectTiers: true,
  });
});

test("migrates selected 2–6 link counts and recognized vendor settings", () => {
  const legacy = {
    default: {
      name: "ignored legacy name",
      language: "RUSSIAN",
      vendor: {
        anyTwoLink: true,
        anyThreeLink: true,
        anyFourLink: true,
        anyFiveLink: false,
        anySixLink: true,
        anyTwoColorLink: true,
        anyThreeColorLink: true,
        anyFourColorLink: true,
        anyFiveColorLink: true,
        anySixColorLink: true,
        anySixSocket: true,
        colors: {
          rgb: true,
          specLink: true,
          specLinkColors: { r: 4, g: 1, b: 1 },
        },
        movement: { ten: true, fifteen: false },
        plusGems: { fire: true, cold: false },
        damage: { phys: true },
        weapon: { wand: true },
        gems: [12, 12, -1, "bad"],
        unknown: true,
      },
      map: { badIds: [3, 1], goodIds: [2], unknown: true },
    },
  };

  const migrated = migrateLegacyProfiles(legacy, "default");
  assert.equal(migrated.version, 2);
  assert.equal(migrated.selectedProfile, "default");
  assert.equal(migrated.profiles[0]?.locale, "ru");
  assert.deepEqual(migrated.profiles[0]?.tools.vendor, {
    linkCounts: [2, 3, 4, 6],
    movement: { ten: true, fifteen: false },
    plusGems: {
      lightning: false,
      fire: true,
      cold: false,
      phys: false,
      chaos: false,
      any: false,
    },
    damage: {
      phys: true,
      firemult: false,
      coldmult: false,
      chaosmult: false,
    },
    weapon: {
      sceptre: false,
      mace: false,
      axe: false,
      sword: false,
      bow: false,
      claw: false,
      dagger: false,
      staff: false,
      wand: true,
      shield: false,
    },
    gems: [-1, 12],
  });
  assert.deepEqual(migrated.profiles[0]?.tools.maps, {
    badIds: [3, 1],
    goodIds: [2],
  });

  const serialized = JSON.stringify(migrated);
  for (const key of forbiddenVendorKeys) assert.doesNotMatch(serialized, new RegExp(key));
});

test("normalization is idempotent, deterministic, and rejects unsafe values", () => {
  const unsafe = JSON.parse(`{
    "version": 2,
    "selectedProfile": "missing",
    "profiles": [
      {"name":" same ","locale":"xx","tools":{"vendor":{"linkCounts":[6,4,6,3],"gems":[2,1]},"beast":{"minChaosValue":999999999},"__proto__":{"polluted":true}}},
      {"name":"same","locale":"en","tools":{}},
      {"name":"","locale":"ru","tools":{}}
    ],
    "__proto__":{"polluted":true}
  }`);

  const normalized = normalizeProfileStore(unsafe);
  assert.deepEqual(normalized.profiles.map(({ name }) => name), ["same"]);
  assert.equal(normalized.selectedProfile, "same");
  assert.equal(normalized.profiles[0]?.locale, "en");
  assert.deepEqual(normalized.profiles[0]?.tools.vendor.linkCounts, []);
  assert.equal(Object.hasOwn(normalized, "__proto__"), false);
  assert.equal(JSON.stringify(normalizeProfileStore(normalized)), JSON.stringify(normalized));
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
  assert.throws(() => normalizeProfileStore(null), /profile store/i);
});

class MemoryStorage {
  readonly values = new Map<string, string>();
  failWrites = false;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error("quota");
    this.values.set(key, value);
  }
}

test("storage migrates once without mutating legacy keys and round-trips safely", () => {
  const storage = new MemoryStorage();
  const legacyProfiles = JSON.stringify({
    alpha: { language: "ENGLISH", vendor: { anyFiveLink: true } },
  });
  storage.values.set("profiles", legacyProfiles);
  storage.values.set("selectedProfile", "alpha");

  const migrated = loadProfileStore(storage);
  assert.deepEqual(migrated.profiles[0]?.tools.vendor.linkCounts, [5]);
  assert.equal(storage.getItem("profiles"), legacyProfiles);
  assert.equal(storage.getItem("selectedProfile"), "alpha");
  assert.equal(storage.getItem(PROFILE_STORAGE_KEY), exportProfileStore(migrated));

  const imported = importProfileStore(exportProfileStore(migrated));
  assert.deepEqual(imported, migrated);
  assert.deepEqual(saveProfileStore(storage, imported), imported);
});

test("malformed storage falls back safely and failed writes do not corrupt legacy data", () => {
  const storage = new MemoryStorage();
  storage.values.set("profiles", "{");
  storage.values.set("selectedProfile", "default");
  storage.failWrites = true;

  assert.deepEqual(loadProfileStore(storage), DEFAULT_PROFILE_STORE);
  assert.equal(storage.getItem("profiles"), "{");
  assert.equal(storage.getItem(PROFILE_STORAGE_KEY), null);
  assert.throws(() => importProfileStore("null"), /profile store/i);
});
