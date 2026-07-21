import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EXPECTED_SHARD_FILES } from "./source-allowlist.js";

interface ManifestShard {
  file: string;
  tool: string;
  locale: string;
  bytes: number;
  records: number;
  sha256: string;
}

interface RegexDataManifest {
  generatorVersion: number;
  inputs: Array<{ path: string; sha256: string }>;
  shards: ManifestShard[];
}

const forbiddenNames = [
  "GeneratedBilingualStats", "GeneratedBilingualDirect", "GeneratedMagicItem",
  "react-scripts", "sourceMappingURL",
];

export function verifyGeneratedRegexData(directory: string): { shards: number; bytes: number } {
  const files = readdirSync(directory).sort();
  const expectedFiles = [...EXPECTED_SHARD_FILES, "manifest.json"].sort();
  if (JSON.stringify(files) !== JSON.stringify(expectedFiles)) {
    throw new Error(`Unexpected regex data files: ${files.join(", ")}`);
  }

  const manifestText = readFileSync(resolve(directory, "manifest.json"), "utf8");
  const manifest = JSON.parse(manifestText) as RegexDataManifest;
  if (manifest.generatorVersion !== 2 || !Array.isArray(manifest.inputs) || !Array.isArray(manifest.shards)) {
    throw new Error("Invalid regex data manifest");
  }
  if (manifest.inputs.length !== 20) throw new Error("Regex manifest must contain 20 audited inputs");
  if (manifest.shards.length !== EXPECTED_SHARD_FILES.length) {
    throw new Error("Regex manifest must contain exactly 24 shards");
  }
  if (JSON.stringify(manifest.shards.map(({ file }) => file)) !== JSON.stringify(EXPECTED_SHARD_FILES)) {
    throw new Error("Regex manifest shard order or names are invalid");
  }

  let bytes = 0;
  const searchable = [manifestText];
  for (const shard of manifest.shards) {
    if (shard.file !== basename(shard.file) || !EXPECTED_SHARD_FILES.includes(shard.file)) {
      throw new Error(`Unsafe regex shard path: ${shard.file}`);
    }
    if (!Number.isSafeInteger(shard.records) || shard.records < 1) {
      throw new Error(`Invalid record count for ${shard.file}`);
    }
    const path = resolve(directory, shard.file);
    const contents = readFileSync(path);
    if (contents.byteLength !== shard.bytes || statSync(path).size !== shard.bytes) {
      throw new Error(`Byte size mismatch for ${shard.file}`);
    }
    const hash = createHash("sha256").update(contents).digest("hex");
    if (hash !== shard.sha256) throw new Error(`SHA-256 mismatch for ${shard.file}`);
    JSON.parse(contents.toString("utf8"));
    searchable.push(contents.toString("utf8"));
    bytes += contents.byteLength;
  }

  const corpus = searchable.join("\n");
  for (const forbidden of forbiddenNames) {
    if (corpus.includes(forbidden)) throw new Error(`Forbidden source name found: ${forbidden}`);
  }
  return { shards: manifest.shards.length, bytes };
}

const defaultDirectory = fileURLToPath(
  new URL("../../../web/src/features/regex/data/generated/", import.meta.url),
);
if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = verifyGeneratedRegexData(defaultDirectory);
  process.stdout.write(`Verified ${result.shards} regex shards (${result.bytes} bytes).\n`);
}
