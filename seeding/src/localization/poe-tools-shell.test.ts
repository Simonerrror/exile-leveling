import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import en from "../../../web/src/i18n/messages/en.json" with { type: "json" };
import ru from "../../../web/src/i18n/messages/ru.json" with { type: "json" };
import {
  internalToolCategories,
  internalTools,
  matchesToolQuery,
} from "../../../web/src/containers/Useful/tools.js";
import {
  normalizeRecentToolIds,
  pushRecentToolId,
} from "../../../web/src/state/recent-tools.js";
import { summarizeLevelingProgress } from "../../../web/src/containers/Useful/progress.js";

const readSource = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

test("defines unique internal tools with safe hash routes", () => {
  assert.equal(
    new Set(internalTools.map(({ id }) => id)).size,
    internalTools.length,
  );
  assert.ok(internalTools.every(({ href }) => href.startsWith("/")));
  assert.deepEqual(
    internalToolCategories.map(({ id }) => id),
    ["continue", "tools", "reference"],
  );
});

test("matches localized tool search text case-insensitively", () => {
  const regex = internalTools.find(({ id }) => id === "regex");
  assert.ok(regex);
  assert.equal(matchesToolQuery(regex, "REGEX", en), true);
  assert.equal(matchesToolQuery(regex, "регуляр", ru), true);
  assert.equal(matchesToolQuery(regex, "unrelated", ru), false);
});

test("normalizes recent tools to known unique bounded ids", () => {
  assert.deepEqual(
    normalizeRecentToolIds(["regex", "regex", "unknown", "leveling"]),
    ["regex", "leveling"],
  );
  assert.deepEqual(pushRecentToolId(["leveling", "regex"], "leveling"), [
    "leveling",
    "regex",
  ]);
});

test("continues at the first incomplete route fragment", () => {
  const route = [
    {
      steps: [
        { type: "fragment_step" },
        { type: "fragment_step" },
        { type: "gem_step" },
      ],
    },
    { steps: [{ type: "fragment_step" }] },
  ];

  assert.deepEqual(summarizeLevelingProgress(route, ["0,0", "0,1"]), {
    sectionIndex: 1,
    stepIndex: 0,
    completed: 2,
    total: 3,
    done: false,
  });
});

test("reports a fully completed leveling route", () => {
  const route = [
    { steps: [{ type: "fragment_step" }] },
    { steps: [{ type: "fragment_step" }] },
  ];

  assert.deepEqual(summarizeLevelingProgress(route, ["0,0", "1,0"]), {
    sectionIndex: 1,
    stepIndex: 0,
    completed: 2,
    total: 2,
    done: true,
  });
});

test("routes Useful to root and Leveling to a stable route", () => {
  const routes = readSource("../../../web/src/containers/index.tsx");
  assert.match(routes, /path="\/"[\s\S]*UsefulContainer/);
  assert.match(routes, /path="\/leveling"[\s\S]*RoutesContainer/);
  assert.match(routes, /path="\/useful"[\s\S]*Navigate/);
  assert.match(routes, /path="\/regex"[\s\S]*RegexCatalog/);
});

test("uses PoE Tools product metadata and disables production sourcemaps", () => {
  const vite = readSource("../../../web/vite.config.ts");
  assert.match(vite, /name:\s*"PoE Tools"/);
  assert.match(vite, /short_name:\s*"PoE Tools"/);
  assert.match(vite, /sourcemap:\s*false/);
  assert.equal(en["app.title"], "PoE Tools");
  assert.equal(ru["app.title"], "PoE Tools");
});

test("orders the primary PoE Tools navigation and uses the canonical repository", () => {
  const navbar = readSource("../../../web/src/components/Navbar/index.tsx");
  assert.match(
    navbar,
    /nav\.home[\s\S]*nav\.leveling[\s\S]*nav\.regex[\s\S]*nav\.build/,
  );
  assert.match(
    navbar,
    /https:\/\/github\.com\/Simonerrror\/exile-leveling/,
  );
});
