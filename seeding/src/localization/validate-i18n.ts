import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertBuiltInLiteralCoverage,
  assertLocalizedGameData,
  assertMessageDictionary,
  assertMessageParity,
  assertRouteParity,
} from "./validate.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function displayPath(path: string): string {
  return relative(root, path);
}

async function readText(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`missing localization file: ${displayPath(path)}`);
    }
    throw error;
  }
}

async function readJson(path: string): Promise<unknown> {
  const text = await readText(path);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`invalid localization JSON: ${displayPath(path)}`);
  }
}

async function routeFiles(path: string): Promise<string[]> {
  try {
    return (await readdir(path)).filter((file) => file.endsWith(".txt")).sort();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`missing localization directory: ${displayPath(path)}`);
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const messages = resolve(root, "web/src/i18n/messages");
  const englishMessagesPath = resolve(messages, "en.json");
  const russianMessagesPath = resolve(messages, "ru.json");
  const englishMessages = await readJson(englishMessagesPath);
  const russianMessages = await readJson(russianMessagesPath);
  assertMessageDictionary(englishMessages, displayPath(englishMessagesPath));
  assertMessageDictionary(russianMessages, displayPath(russianMessagesPath));
  assertMessageParity(englishMessages, russianMessages);

  const canonicalData = {
    Areas: await readJson(resolve(root, "common/data/json/areas.json")),
    Characters: await readJson(
      resolve(root, "common/data/json/characters.json"),
    ),
    Gems: await readJson(resolve(root, "common/data/json/gems.json")),
    Quests: await readJson(resolve(root, "common/data/json/quests.json")),
  };
  const russianGameData = await readJson(
    resolve(root, "common/data/i18n/ru.json"),
  );
  const russianGameDataAudit = await readJson(
    resolve(root, "seeding/data/localization/ru-output-audit.json"),
  );
  const russianAuditManifest = await readJson(
    resolve(root, "seeding/data/localization/ru-audit-manifest.json"),
  );
  assertLocalizedGameData(
    russianGameData,
    russianGameDataAudit,
    canonicalData as Parameters<typeof assertLocalizedGameData>[2],
    russianAuditManifest,
  );

  const routes = resolve(root, "common/data/routes");
  const englishRoutes = resolve(routes, "en");
  const russianRoutes = resolve(routes, "ru");
  const englishRouteFiles = await routeFiles(englishRoutes);
  const russianRouteFiles = await routeFiles(russianRoutes);
  const englishRouteSources = await Promise.all(
    englishRouteFiles.map((file) => readText(resolve(englishRoutes, file))),
  );
  assertBuiltInLiteralCoverage(
    englishRouteSources,
    (
      russianGameData as {
        literals: Record<string, unknown>;
      }
    ).literals,
  );

  for (const [index, file] of englishRouteFiles.entries()) {
    if (!russianRouteFiles.includes(file))
      throw new Error(`missing Russian route file: ${file}`);
    assertRouteParity(
      englishRouteSources[index],
      await readText(resolve(russianRoutes, file)),
      file.replace(/\.txt$/, ""),
    );
  }
  for (const file of russianRouteFiles) {
    if (!englishRouteFiles.includes(file))
      throw new Error(`unknown Russian route file: ${file}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
