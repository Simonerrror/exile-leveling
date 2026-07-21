import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const viteConfig = readFileSync(
  new URL("../../../web/vite.config.ts", import.meta.url),
  "utf8",
);

const shardFamilies = [
  "vendor",
  "maps",
  "items",
  "mapnames",
  "expedition",
  "heist",
  "flasks",
  "beast",
  "tattoos",
  "runegrafts",
  "scarabs",
  "jewels",
];

test("PWA precache excludes lazy regex workspaces and every data shard family", () => {
  assert.match(viteConfig, /workbox\s*:/);
  assert.match(viteConfig, /globIgnores\s*:/);
  assert.match(viteConfig, /RegexWorkspace-\*\.js/);
  assert.match(viteConfig, /RegexWorkspace-\*\.css/);
  assert.match(viteConfig, /RegexCatalog-\*\.js/);
  assert.match(viteConfig, /RegexCatalog-\*\.css/);

  for (const family of shardFamilies) {
    assert.match(viteConfig, new RegExp(`\\*\\*/${family}\\.\\*\\.js`), family);
  }
});

test("bundle checker audits initial reachability, precache, and shard sizes", () => {
  const budget = readFileSync(
    new URL("../../../scripts/check-bundle-budget.mjs", import.meta.url),
    "utf8",
  );

  assert.match(budget, /REGEX_SHARD_FAMILIES/);
  assert.match(budget, /RegexWorkspace/);
  assert.match(budget, /sw\.js/);
  assert.match(budget, /precache/i);
  assert.match(budget, /REGEX_TOTAL_BUDGET/);
  assert.match(budget, /REGEX_ITEM_SHARD_BUDGET/);
});

test("the app recovers once from stale lazy chunks after a Pages deployment", () => {
  const main = readFileSync(
    new URL("../../../web/src/main.tsx", import.meta.url),
    "utf8",
  );
  assert.match(main, /vite:preloadError/);
  assert.match(main, /sessionStorage/);
  assert.match(main, /location\.reload/);
});

test("the Pages workflow gates deployment on the complete verification suite", () => {
  const workflow = readFileSync(
    new URL("../../../.github/workflows/build-and-deploy.yml", import.meta.url),
    "utf8",
  );
  const verifyAt = workflow.indexOf("npm run verify");
  const deployAt = workflow.indexOf("name: Deploy");
  assert.ok(verifyAt >= 0, "missing npm run verify");
  assert.ok(deployAt > verifyAt, "deployment must run after verification");
  assert.match(workflow, /npm ci --ignore-scripts/);
});
