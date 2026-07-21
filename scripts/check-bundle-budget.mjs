import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST_DIR = "web/dist";
const MANIFEST_PATH = "web/dist/.vite/manifest.json";
const REGEX_MANIFEST_PATH =
  "web/src/features/regex/data/generated/manifest.json";
const SERVICE_WORKER_PATH = "web/dist/sw.js";
const INITIAL_JS_BUDGET = 250 * 1024;
const REGEX_TOTAL_BUDGET = 20 * 1024 * 1024;
const REGEX_ITEM_SHARD_BUDGET = 10 * 1024 * 1024;
const REGEX_OTHER_SHARD_BUDGET = 500 * 1024;
const REGEX_SHARD_FAMILIES = [
  "vendor",
  "maps",
  "items",
  "expedition",
  "heist",
  "flasks",
  "beast",
  "tattoos",
  "runegrafts",
  "scarabs",
  "jewels",
];

function listFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

if (!existsSync(MANIFEST_PATH)) {
  throw new Error(`Missing ${MANIFEST_PATH}; run npm run build:web first.`);
}

const sourcemaps = listFiles(DIST_DIR).filter((path) => path.endsWith(".map"));
if (sourcemaps.length > 0) {
  throw new Error(`Production sourcemaps are forbidden:\n${sourcemaps.join("\n")}`);
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry);
if (entryKey === undefined) {
  throw new Error(`No entry chunk found in ${MANIFEST_PATH}.`);
}

const visitedKeys = new Set();
const visitedFiles = new Set();

function visit(key) {
  if (visitedKeys.has(key)) return;
  visitedKeys.add(key);
  const chunk = manifest[key];
  if (!chunk) throw new Error(`Missing manifest import: ${key}`);
  if (chunk.file?.endsWith(".js")) visitedFiles.add(chunk.file);
  for (const dependency of chunk.imports ?? []) visit(dependency);
}

visit(entryKey);

const forbiddenInitialKeys = [...visitedKeys].filter(
  (key) =>
    key.includes("src/containers/Regex") ||
    key.includes("src/features/regex/data/generated"),
);
if (forbiddenInitialKeys.length > 0) {
  throw new Error(
    `Lazy regex modules are reachable from the initial entry:\n${forbiddenInitialKeys.join("\n")}`,
  );
}

let rawBytes = 0;
let gzipBytes = 0;
for (const file of [...visitedFiles].sort()) {
  const contents = readFileSync(join(DIST_DIR, file));
  rawBytes += contents.byteLength;
  gzipBytes += gzipSync(contents).byteLength;
}

console.log(`Initial JS chunks: ${[...visitedFiles].sort().join(", ")}`);
console.log(`Initial JS raw: ${rawBytes} bytes`);
console.log(`Initial JS gzip: ${gzipBytes} / ${INITIAL_JS_BUDGET} bytes`);

if (gzipBytes > INITIAL_JS_BUDGET) {
  throw new Error(
    `Initial JavaScript exceeds the 250 KB gzip budget by ${gzipBytes - INITIAL_JS_BUDGET} bytes.`,
  );
}

const regexManifest = JSON.parse(readFileSync(REGEX_MANIFEST_PATH, "utf8"));
const expectedShardNames = new Set(
  REGEX_SHARD_FAMILIES.flatMap((family) => [
    `${family}.en.json`,
    `${family}.ru.json`,
  ]),
);
const actualShardNames = new Set(regexManifest.shards.map((shard) => shard.file));
if (
  actualShardNames.size !== expectedShardNames.size ||
  [...expectedShardNames].some((name) => !actualShardNames.has(name))
) {
  throw new Error("Regex manifest must contain exactly twelve EN/RU shard pairs.");
}

let regexTotalBytes = 0;
const regexAssetFiles = [];
for (const shard of regexManifest.shards) {
  const sourceKey = `src/features/regex/data/generated/${shard.file}`;
  const built = manifest[sourceKey];
  if (!built?.file) throw new Error(`Missing built regex shard: ${sourceKey}`);

  const limit =
    shard.tool === "items"
      ? REGEX_ITEM_SHARD_BUDGET
      : REGEX_OTHER_SHARD_BUDGET;
  if (shard.bytes > limit) {
    throw new Error(
      `${shard.file} exceeds its raw shard budget by ${shard.bytes - limit} bytes.`,
    );
  }

  const builtContents = readFileSync(join(DIST_DIR, built.file));
  regexTotalBytes += shard.bytes;
  regexAssetFiles.push(built.file);
  console.log(
    `Regex shard ${shard.file}: ${shard.bytes} raw bytes, ${gzipSync(builtContents).byteLength} built gzip bytes`,
  );
}

console.log(
  `Regex data total: ${regexTotalBytes} / ${REGEX_TOTAL_BUDGET} raw bytes`,
);
if (regexTotalBytes > REGEX_TOTAL_BUDGET) {
  throw new Error(
    `Regex data exceeds its total budget by ${regexTotalBytes - REGEX_TOTAL_BUDGET} bytes.`,
  );
}

const lazyRegexEntries = [
  "src/containers/RegexCatalog/index.tsx",
  "src/containers/RegexWorkspace/index.tsx",
];
for (const key of lazyRegexEntries) {
  const entry = manifest[key];
  if (!entry?.isDynamicEntry) throw new Error(`${key} is not a lazy route entry.`);
  const contents = readFileSync(join(DIST_DIR, entry.file));
  console.log(
    `Regex route ${key}: ${contents.byteLength} raw bytes, ${gzipSync(contents).byteLength} gzip bytes`,
  );
  regexAssetFiles.push(entry.file, ...(entry.css ?? []));
}

if (!existsSync(SERVICE_WORKER_PATH)) {
  throw new Error(`Missing ${SERVICE_WORKER_PATH}; PWA output was not generated.`);
}
const serviceWorker = readFileSync(SERVICE_WORKER_PATH, "utf8");
const precachedRegexAssets = regexAssetFiles.filter((file) =>
  serviceWorker.includes(file),
);
if (precachedRegexAssets.length > 0) {
  throw new Error(
    `Regex assets must not be in the PWA precache:\n${precachedRegexAssets.join("\n")}`,
  );
}
console.log("Regex lazy-route and PWA precache isolation: verified");
