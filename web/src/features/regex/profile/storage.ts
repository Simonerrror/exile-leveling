import { migrateLegacyProfiles } from "./migration.js";
import {
  DEFAULT_PROFILE_STORE,
  normalizeProfileStore,
  type RegexProfileStore,
} from "./schema.js";

export const PROFILE_STORAGE_KEY = "poe-tools.regex.profiles";

export interface ProfileStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function exportProfileStore(store: RegexProfileStore): string {
  return JSON.stringify(normalizeProfileStore(store));
}

export function importProfileStore(serialized: string): RegexProfileStore {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new TypeError("Invalid profile store JSON");
  }
  return normalizeProfileStore(parsed);
}

export function saveProfileStore(
  storage: ProfileStorage,
  store: RegexProfileStore,
): RegexProfileStore {
  const normalized = normalizeProfileStore(store);
  storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function loadProfileStore(storage: ProfileStorage): RegexProfileStore {
  const current = storage.getItem(PROFILE_STORAGE_KEY);
  if (current !== null) {
    try {
      return importProfileStore(current);
    } catch {
      return DEFAULT_PROFILE_STORE;
    }
  }

  let legacyProfiles: unknown = {};
  const serializedLegacy = storage.getItem("profiles");
  if (serializedLegacy !== null) {
    try {
      legacyProfiles = JSON.parse(serializedLegacy);
    } catch {
      legacyProfiles = {};
    }
  }
  const migrated = migrateLegacyProfiles(
    legacyProfiles,
    storage.getItem("selectedProfile"),
  );
  try {
    storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(migrated));
  } catch {
    // The validated in-memory migration remains usable; legacy keys stay untouched.
  }
  return migrated;
}
