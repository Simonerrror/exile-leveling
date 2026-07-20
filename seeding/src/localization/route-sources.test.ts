import assert from "node:assert/strict";
import test from "node:test";
import {
  selectRouteSources,
  type RouteSourceLookup,
} from "../../../web/src/state/route-sources.js";

function completeLookup(): RouteSourceLookup {
  return Object.fromEntries(
    (["en", "ru"] as const).flatMap((locale) =>
      Array.from({ length: 10 }, (_, index) => [
        `${locale}/act-${index + 1}`,
        Promise.resolve(`${locale}-${index + 1}`),
      ]),
    ),
  );
}

test("selects all ten route files for the active locale in act order", async () => {
  assert.deepEqual(
    await selectRouteSources(completeLookup(), "ru"),
    Array.from({ length: 10 }, (_, index) => `ru-${index + 1}`),
  );
  assert.deepEqual(
    await selectRouteSources(completeLookup(), "en"),
    Array.from({ length: 10 }, (_, index) => `en-${index + 1}`),
  );
});

test("falls back to the canonical English route for a missing localized act", async () => {
  const lookup = completeLookup();
  delete lookup["ru/act-4"];

  const sources = await selectRouteSources(lookup, "ru");

  assert.equal(sources[3], "en-4");
  assert.equal(sources[2], "ru-3");
  assert.equal(sources[4], "ru-5");
});

test("reports an actionable error when a route and its English fallback are absent", async () => {
  const lookup = completeLookup();
  delete lookup["ru/act-7"];
  delete lookup["en/act-7"];

  await assert.rejects(
    () => selectRouteSources(lookup, "ru"),
    /missing route source: ru\/act-7; English fallback en\/act-7 is also missing/,
  );
});
