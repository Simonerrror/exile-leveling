import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { normalizeLocale, type Locale } from "../i18n/core";

const storedLocaleAtom = atomWithStorage<unknown>("locale", null);

export const localeAtom = atom(
  (get): Locale => {
    const stored = get(storedLocaleAtom);
    if (stored !== null) return normalizeLocale(stored);

    const browserLanguage =
      typeof navigator === "undefined" ? null : navigator.language;
    return normalizeLocale(browserLanguage);
  },
  (_get, set, locale: Locale) => set(storedLocaleAtom, locale),
);
