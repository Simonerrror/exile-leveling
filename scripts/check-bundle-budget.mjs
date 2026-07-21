import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const DIST_DIR = "web/dist";
const MANIFEST_PATH = "web/dist/.vite/manifest.json";
const INITIAL_JS_BUDGET = 250 * 1024;

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
