import type { Locale } from "../i18n/core";

export type RouteSourceLookup = Record<string, PromiseLike<string> | undefined>;

const ACT_COUNT = 10;

export async function selectRouteSources(
  lookup: RouteSourceLookup,
  locale: Locale,
): Promise<string[]> {
  const sources = Array.from({ length: ACT_COUNT }, (_, index) => {
    const act = `act-${index + 1}`;
    const localizedKey = `${locale}/${act}`;
    const englishKey = `en/${act}`;
    const source = lookup[localizedKey] ?? lookup[englishKey];

    if (source === undefined) {
      throw new Error(
        `missing route source: ${localizedKey}; English fallback ${englishKey} is also missing`,
      );
    }

    return source;
  });

  return Promise.all(sources);
}
