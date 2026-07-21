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
  labyrinthLinks,
  labyrinthLinksById,
} from "../../../web/src/features/labyrinth-links.js";

const readSource = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

test("defines unique internal tools with safe hash routes", () => {
  assert.equal(
    new Set(internalTools.map(({ id }) => id)).size,
    internalTools.length,
  );
  assert.ok(internalTools.every(({ href }) => href.startsWith("/")));
  assert.deepEqual(
    internalTools.map(({ id }) => id),
    ["leveling", "regex"],
  );
  assert.deepEqual(
    internalToolCategories.map(({ id }) => id),
    ["tools"],
  );
});

test("matches localized tool search text case-insensitively", () => {
  const regex = internalTools.find(({ id }) => id === "regex");
  assert.ok(regex);
  assert.equal(matchesToolQuery(regex, "REGEX", en), true);
  assert.equal(matchesToolQuery(regex, "регуляр", ru), true);
  assert.equal(matchesToolQuery(regex, "unrelated", ru), false);
});

test("shares four canonical PoELab daily-layout links", () => {
  assert.deepEqual(
    labyrinthLinks.map(({ id }) => id),
    ["normal", "cruel", "merciless", "eternal"],
  );
  assert.equal(new Set(labyrinthLinks.map(({ url }) => url)).size, 4);

  for (const link of labyrinthLinks) {
    const url = new URL(link.url);
    assert.equal(url.protocol, "https:");
    assert.equal(url.hostname, "www.poelab.com");
    assert.equal(labyrinthLinksById[link.id], link);
  }

  const fragment = readSource(
    "../../../web/src/components/FragmentStep/Fragment/index.tsx",
  );
  assert.match(fragment, /labyrinthLinksById/);
  assert.doesNotMatch(fragment, /ASCEND_LOOKUP/);
  assert.doesNotMatch(fragment, /https:\/\/www\.poelab\.com/);
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
  for (const messages of [en, ru]) {
    assert.match(messages["app.buildTitle"], /^PoE Tools/);
    assert.match(messages["app.editRouteTitle"], /^PoE Tools/);
    assert.match(messages["app.usefulTitle"], /^PoE Tools/);
  }
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

test("homepage exposes search, the tool catalog, and safe links", () => {
  const useful = readSource("../../../web/src/containers/Useful/index.tsx");
  assert.match(useful, /type="search"/);
  assert.match(useful, /internalTools/);
  assert.doesNotMatch(useful, /ContinuationCard/);
  assert.doesNotMatch(useful, /recentToolsAtom/);
  assert.doesNotMatch(useful, /catalog-continue/);
  assert.doesNotMatch(useful, /tools\.recent/);
  assert.match(useful, /categoryRail/);
  assert.match(useful, /<Link/);
  assert.match(useful, /target="_blank"/);
});

test("enforces the initial JavaScript budget without sourcemaps", () => {
  const packageJson = JSON.parse(readSource("../../../package.json")) as {
    scripts?: Record<string, string>;
  };
  assert.equal(packageJson.scripts?.["build:web"], "npm run build -w web");
  assert.equal(
    packageJson.scripts?.["check:bundle"],
    "node scripts/check-bundle-budget.mjs",
  );
  assert.match(packageJson.scripts?.verify ?? "", /check:bundle/);

  const budget = readSource("../../../scripts/check-bundle-budget.mjs");
  assert.match(budget, /250\s*\*\s*1024/);
  assert.match(budget, /\.map/);
  assert.match(budget, /web\/dist\/\.vite\/manifest\.json/);
});
