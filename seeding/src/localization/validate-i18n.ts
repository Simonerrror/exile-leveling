import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
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

  const routes = resolve(root, "common/data/routes");
  const englishRoutes = resolve(routes, "en");
  const russianRoutes = resolve(routes, "ru");
  const englishRouteFiles = await routeFiles(englishRoutes);
  const russianRouteFiles = await routeFiles(russianRoutes);

  for (const file of englishRouteFiles) {
    if (!russianRouteFiles.includes(file))
      throw new Error(`missing Russian route file: ${file}`);
    assertRouteParity(
      await readText(resolve(englishRoutes, file)),
      await readText(resolve(russianRoutes, file)),
      file.replace(/\.txt$/, ""),
    );
  }
  for (const file of russianRouteFiles) {
    if (!englishRouteFiles.includes(file))
      throw new Error(`unknown Russian route file: ${file}`);
  }

  for (const file of [
    "areas.json",
    "characters.json",
    "gems.json",
    "quests.json",
  ]) {
    await readJson(resolve(root, "common/data/json", file));
  }
  await readJson(resolve(root, "common/data/i18n/ru.json"));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
