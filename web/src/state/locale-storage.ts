export interface StringStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

type StringStorageGetter = () => StringStorage | undefined;

function getLocalStorage(): StringStorage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function createSafeJSONStorage<Value>(
  getStringStorage: StringStorageGetter = getLocalStorage,
) {
  return {
    getItem(key: string, initialValue: Value): Value {
      try {
        const storedValue = getStringStorage()?.getItem(key);
        return storedValue === null || storedValue === undefined
          ? initialValue
          : (JSON.parse(storedValue) as Value);
      } catch {
        return initialValue;
      }
    },
    setItem(key: string, newValue: Value): void {
      try {
        const storedValue = JSON.stringify(newValue);
        if (storedValue !== undefined) {
          getStringStorage()?.setItem(key, storedValue);
        }
      } catch {
        // Keep the atom's in-memory value when persistence is unavailable.
      }
    },
    removeItem(key: string): void {
      try {
        getStringStorage()?.removeItem(key);
      } catch {
        // Keep the atom usable when persistence is unavailable.
      }
    },
  };
}
