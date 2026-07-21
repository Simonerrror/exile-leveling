import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyGeneratedRegexData } from "./verify-generated-data.js";
import {
  loadRegexData,
  resetRegexDataCacheForTests,
} from "../../../web/src/features/regex/data/loaders.js";

const generatedUrl = new URL(
  "../../../web/src/features/regex/data/generated/",
  import.meta.url,
);
const tools = [
  "vendor",
  "maps",
  "items",
  "mapnames",
  "flasks",
  "heist",
  "expedition",
  "beast",
  "scarabs",
  "tattoos",
  "runegrafts",
  "jewels",
] as const;
const expectedShards = tools.flatMap((tool) =>
  ["en", "ru"].map((locale) => `${tool}.${locale}.json`),
).sort();

test("commits exactly twelve EN/RU shards plus a deterministic manifest", () => {
  const files = readdirSync(generatedUrl).sort();
  assert.deepEqual(files, [...expectedShards, "manifest.json"].sort());

  const manifest = JSON.parse(
    readFileSync(new URL("manifest.json", generatedUrl), "utf8"),
  ) as {
    generatorVersion: number;
    inputs: Array<{ path: string; sha256: string }>;
    shards: Array<{
      file: string;
      locale: string;
      tool: string;
      bytes: number;
      records: number;
      sha256: string;
    }>;
  };
  assert.equal(manifest.generatorVersion, 3);
  assert.deepEqual(manifest.shards.map(({ file }) => file), expectedShards);
  assert.equal(manifest.inputs.length, 21);
  assert.ok(manifest.inputs.some(({ path }) => path === "common/data/json/gems.json"));

  for (const entry of manifest.shards) {
    assert.equal(entry.file, basename(entry.file));
    assert.ok(entry.records > 0);
    const contents = readFileSync(new URL(entry.file, generatedUrl));
    assert.equal(entry.bytes, contents.byteLength);
    assert.equal(entry.sha256, createHash("sha256").update(contents).digest("hex"));
  }
});

test("manifest verification is source-independent and rejects forbidden payloads", () => {
  const result = verifyGeneratedRegexData(fileURLToPath(generatedUrl));
  assert.equal(result.shards, 24);
  assert.ok(result.bytes > 0);

  const corpus = readdirSync(generatedUrl)
    .map((file) => readFileSync(new URL(file, generatedUrl), "utf8"))
    .join("\n");
  for (const forbidden of [
    "GeneratedBilingualStats",
    "GeneratedBilingualDirect",
    "GeneratedMagicItem",
    "react-scripts",
    "sourceMappingURL",
  ]) {
    assert.doesNotMatch(corpus, new RegExp(forbidden));
  }
});

test("loads and caches only the requested typed tool/locale shard", async () => {
  resetRegexDataCacheForTests();
  const first = loadRegexData("maps", "ru");
  const second = loadRegexData("maps", "ru");
  assert.equal(first, second);

  const maps = await first;
  assert.equal(maps.mods.tokens.length, 122);
  assert.equal(maps.mods.tokens[0]?.rawText, "Босса карты сопровождает босс Синтеза");

  const vendor = await loadRegexData("vendor", "en");
  assert.equal(vendor.gems.tokens.length, 610);
  assert.equal(vendor.gems.tokens[0]?.rawText, "Chain Hook");
  await assert.rejects(
    loadRegexData("unknown" as "maps", "en"),
    /unknown regex data request/i,
  );
});

test("uses an explicit literal import cell for every shard", () => {
  const source = readFileSync(
    new URL("../../../web/src/features/regex/data/loaders.ts", import.meta.url),
    "utf8",
  );
  for (const file of expectedShards) {
    assert.match(source, new RegExp(`generated/${file.replaceAll(".", "\\.")}`));
  }
  assert.doesNotMatch(source, /generated\/.*\$\{/);
});
