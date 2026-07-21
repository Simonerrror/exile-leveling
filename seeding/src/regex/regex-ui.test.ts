import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import en from "../../../web/src/i18n/messages/en.json" with { type: "json" };
import ru from "../../../web/src/i18n/messages/ru.json" with { type: "json" };

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const toolIds = [
  "vendor", "maps", "items", "mapnames", "expedition", "heist",
  "flasks", "beast", "tattoo", "runegraft", "scarabs", "jewels",
];

test("routes the catalog and twelve stable regex workspaces lazily", () => {
  const routes = read("../../../web/src/containers/index.tsx");
  assert.match(routes, /lazy\(\(\) => import\("\.\/RegexWorkspace"\)\)/);
  assert.match(routes, /path="\/regex\/:toolId"/);
  assert.match(routes, /RegexWorkspace/);

  const catalog = read("../../../web/src/containers/RegexCatalog/index.tsx");
  for (const id of toolIds) assert.match(catalog, new RegExp(`to=\\{?\`?/regex/.*${id}|${id}`));
  assert.match(catalog, /<Link/);
  assert.doesNotMatch(catalog, /upcoming/);
});

test("workspace loads route-level data and exposes accessible A/B output", () => {
  const workspace = read("../../../web/src/containers/RegexWorkspace/index.tsx");
  assert.match(workspace, /loadRegexData/);
  assert.match(workspace, /loaded\.tool === tool/);
  assert.match(workspace, /loaded\.locale === locale/);
  assert.match(workspace, /compileVendorRegex/);
  assert.match(workspace, /compileMapRegex/);
  assert.match(workspace, /aria-live="polite"/);
  assert.match(workspace, /navigator\.clipboard\.writeText/);
  assert.match(workspace, /loadProfileStore/);
  assert.match(workspace, /saveProfileStore/);
  assert.match(workspace, /vendorGroups/);
  assert.match(workspace, /movement/);
  assert.match(workspace, /plusGems/);
  assert.match(workspace, /damage/);
  assert.match(workspace, /weapon/);
  assert.match(workspace, /linkCounts/);
  assert.match(workspace, /\[4, 5, 6\]/);
  for (const forbidden of [
    "anyTwoLink", "anyThreeLink", "ColorLink", "SixSocket", "specLink", "socket color",
  ]) assert.equal(workspace.includes(forbidden), false, forbidden);
});

test("regex UI messages have exact EN/RU parity and no migration placeholder", () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ru).sort());
  for (const messages of [en, ru]) {
    for (const key of [
      "regex.catalog.description", "regex.workspace.search", "regex.workspace.copyA",
      "regex.workspace.copyB", "regex.workspace.empty", "regex.workspace.links",
      "regex.workspace.vendor.movement", "regex.workspace.vendor.plusGems",
      "regex.workspace.vendor.damage", "regex.workspace.vendor.weapon",
    ]) assert.equal(typeof messages[key as keyof typeof messages], "string", key);
    assert.doesNotMatch(messages["regex.catalog.description"], /moving|переезжа/i);
  }
});

test("workspace layout has visible focus, sticky desktop output, and mobile fallback", () => {
  const styles = read("../../../web/src/containers/RegexWorkspace/styles.module.css");
  assert.match(styles, /position:\s*sticky/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /@media\s*\(max-width:\s*54rem\)/);
  assert.match(styles, /grid-template-columns:\s*1fr/);
  assert.doesNotMatch(styles, /min-width:\s*[4-9]\d\dpx/);
});
