import assert from "node:assert/strict";
import test from "node:test";
import { createStore } from "jotai/vanilla";
import {
  createSafeJSONStorage,
  type StringStorage,
} from "../../../web/src/state/locale-storage.js";

function createMemoryStorage(): StringStorage {
  const entries = new Map<string, string>();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
}

function replaceGlobal(name: string, value: unknown): () => void {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value,
    writable: true,
  });

  return () => {
    if (original === undefined) {
      Reflect.deleteProperty(globalThis, name);
    } else {
      Object.defineProperty(globalThis, name, original);
    }
  };
}

test("safe JSON storage round-trips values", () => {
  const backing = createMemoryStorage();
  const storage = createSafeJSONStorage<string>(() => backing);

  storage.setItem("locale", "ru");

  assert.equal(backing.getItem("locale"), '"ru"');
  assert.equal(storage.getItem("locale", "en"), "ru");
  storage.removeItem("locale");
  assert.equal(storage.getItem("locale", "en"), "en");
});

test("safe JSON storage returns the initial value when absent", () => {
  const storage = createSafeJSONStorage<string>(() => undefined);

  assert.equal(storage.getItem("locale", "en"), "en");
  assert.doesNotThrow(() => storage.setItem("locale", "ru"));
  assert.doesNotThrow(() => storage.removeItem("locale"));
});

test("safe JSON storage contains underlying failures", () => {
  const throwingStorage: StringStorage = {
    getItem: () => {
      throw new Error("read failed");
    },
    setItem: () => {
      throw new Error("write failed");
    },
    removeItem: () => {
      throw new Error("remove failed");
    },
  };
  const storage = createSafeJSONStorage<string>(() => throwingStorage);
  const inaccessibleStorage = createSafeJSONStorage<string>(() => {
    throw new Error("storage unavailable");
  });

  assert.equal(storage.getItem("locale", "en"), "en");
  assert.doesNotThrow(() => storage.setItem("locale", "ru"));
  assert.doesNotThrow(() => storage.removeItem("locale"));
  assert.equal(inaccessibleStorage.getItem("locale", "en"), "en");
  assert.doesNotThrow(() => inaccessibleStorage.setItem("locale", "ru"));
  assert.doesNotThrow(() => inaccessibleStorage.removeItem("locale"));
});

test("safe JSON storage rejects invalid JSON", () => {
  const backing = createMemoryStorage();
  backing.setItem("locale", "{invalid");
  const storage = createSafeJSONStorage<string>(() => backing);

  assert.equal(storage.getItem("locale", "en"), "en");
});

test("persisted locale wins on initial read and failed writes stay in memory", async () => {
  const backing: StringStorage = {
    getItem: () => '"en"',
    setItem: () => {
      throw new Error("write failed");
    },
    removeItem: () => {
      throw new Error("remove failed");
    },
  };
  const restoreLocalStorage = replaceGlobal("localStorage", backing);
  const restoreWindow = replaceGlobal("window", { localStorage: backing });
  const restoreNavigator = replaceGlobal("navigator", { language: "ru-RU" });

  try {
    const { localeAtom } = await import("../../../web/src/state/locale.js");
    const store = createStore();

    assert.equal(store.get(localeAtom), "en");
    assert.doesNotThrow(() => store.set(localeAtom, "ru"));
    assert.equal(store.get(localeAtom), "ru");
  } finally {
    restoreNavigator();
    restoreWindow();
    restoreLocalStorage();
  }
});
