# Russian Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent English/Russian language switch, Russian campaign routes, and official Russian client terminology without changing canonical game identifiers or adding dependencies.

**Architecture:** Keep English game data and route identifiers canonical. Add a typed JSON-backed UI message layer, a Jotai locale atom, separate locale route directories, and Russian display-name maps keyed by existing IDs. Validate dictionaries and route structure with the already-installed `tsx` runner, and fall back to English for missing display values.

**Tech Stack:** TypeScript 7, React 19, Jotai 2, Vite 8, Node built-in test runner through the existing `tsx` dependency, JSON locale data, GitHub Pages.

---

## File map

### New files

- `web/src/i18n/core.ts` — locale normalization, message formatting, and dependency-free translation primitives.
- `web/src/i18n/index.ts` — React/Jotai-facing `useI18n` hook.
- `web/src/i18n/messages/en.json` — canonical UI message dictionary.
- `web/src/i18n/messages/ru.json` — Russian UI message dictionary.
- `web/src/i18n/game-data.ts` — localized gem, area, quest, NPC, class, and crafting-recipe display helpers.
- `web/src/state/locale.ts` — persisted locale state and first-visit browser-language detection.
- `common/data/i18n/ru.json` — checked-in Russian display names keyed by canonical IDs.
- `common/data/routes/en/act-1.txt` through `act-10.txt` — canonical English routes moved from the current route directory.
- `common/data/routes/ru/act-1.txt` through `act-10.txt` — structurally identical Russian routes.
- `seeding/src/localization/validate.ts` — dictionary, entity coverage, and route-parity validation functions.
- `seeding/src/localization/validate.test.ts` — focused validation tests.
- `seeding/src/localization/validate-i18n.ts` — validation CLI.
- `seeding/src/localization/generate-ru-display-data.ts` — offline generator for checked-in Russian display data.

### Modified files

- `package.json`, `seeding/package.json` — expose `test:i18n` and `validate:i18n`.
- `common/src/types.d.ts`, `common/src/data.ts` — type and export localized display data.
- `web/src/state/route-files.ts` — load default routes for the active locale.
- `web/src/state/route.ts` — generate vendor search strings with localized gem names.
- `web/src/components/SectionHolder/index.tsx` and `web/src/containers/Routes/index.tsx` — use locale-independent section IDs so collapsed state survives switching.
- `web/src/components/Navbar/index.tsx` and `styles.module.css` — language selector and translated navigation.
- `web/src/containers/index.tsx` — localized page titles.
- UI components containing hard-coded English strings:
  - `web/src/components/BuildImportForm/index.tsx`
  - `web/src/components/BuildInfoForm/index.tsx`
  - `web/src/components/ConfigForm/index.tsx`
  - `web/src/components/CopyToClipboard/index.tsx`
  - `web/src/components/ErrorFallback/index.tsx`
  - `web/src/components/FragmentStep/Fragment/index.tsx`
  - `web/src/components/GemLinkViewer/index.tsx`
  - `web/src/components/ItemReward/index.tsx`
  - `web/src/components/RouteEditor/index.tsx`
  - `web/src/components/SearchStrings/index.tsx`
  - `web/src/components/SearchStringsEditor/index.tsx`
  - `web/src/components/Sidebar/index.tsx`
- `.github/workflows/build-and-deploy.yml` — run localization validation before building.
- `web/index.html`, `web/vite.config.ts` — set document language and bilingual install metadata while preserving the existing base path.
- `README.md` — language behavior, Russian-data maintenance, and passive-tree limitation.

## Translation conventions

- Use official Russian client names for gems, zones, quests, NPCs, classes, rewards, and crafting recipes.
- Use short imperative prose in routes: `Убей`, `Возьми`, `Поговори`, `Выйди в меню выбора персонажа`.
- Do not append English aliases.
- Never translate canonical metadata IDs, quest IDs, area IDs, preprocessor definitions, or structural fragment names.
- Preserve every route line, indentation level, conditional directive, and structural fragment position.

---

### Task 1: Add the dependency-free localization validation harness

**Files:**
- Create: `seeding/src/localization/validate.ts`
- Create: `seeding/src/localization/validate.test.ts`
- Create: `seeding/src/localization/validate-i18n.ts`
- Modify: `seeding/package.json`
- Modify: `package.json`

- [ ] **Step 1: Write failing validation tests**

Create tests using `node:test` and `node:assert/strict`. Cover missing message keys, route-line mismatch, structural-fragment mismatch, and a valid translated pair.

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  assertMessageParity,
  assertRouteParity,
  routeSignature,
} from "./validate.js";

test("message dictionaries require identical keys", () => {
  assert.throws(
    () => assertMessageParity({ route: "Route" }, {}),
    /missing Russian message key: route/,
  );
});

test("route signatures ignore translated prose", () => {
  assert.deepEqual(
    routeSignature("Kill {kill|Hillock} ➞ {enter|1_1_2}"),
    routeSignature("Убей {kill|Хиллок} ➞ {enter|1_1_2}"),
  );
});

test("route signatures preserve structural ids", () => {
  assert.throws(
    () =>
      assertRouteParity(
        "Talk ➞ {enter|1_1_2}",
        "Иди ➞ {enter|1_1_3}",
        "act-1",
      ),
    /route structure differs: act-1 line 1/,
  );
});

test("route parity requires the same line count", () => {
  assert.throws(
    () => assertRouteParity("one\ntwo", "один", "act-1"),
    /route line count differs: act-1/,
  );
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```bash
npm exec -w seeding -- tsx --test src/localization/validate.test.ts
```

Expected: failure because `validate.ts` does not exist.

- [ ] **Step 3: Implement validation primitives**

`routeSignature` must keep exact payloads for structural fragments and erase only display payloads.

```ts
const DISPLAY_FRAGMENTS = new Set([
  "kill",
  "arena",
  "quest_text",
  "generic",
  "reward_quest",
  "reward_vendor",
  "copy",
]);

export function routeSignature(line: string): string {
  const indent = line.match(/^\s*/)?.[0].length ?? 0;
  const directive = line.trimStart().startsWith("#")
    ? line.trim().replace(/^#section\s+.+$/, "#section")
    : "";
  const fragments = [...line.matchAll(/\{([^{}]+)\}/g)].map((match) => {
    const [type, ...parameters] = match[1].split("|");
    if (DISPLAY_FRAGMENTS.has(type)) return `{${type}|display}`;
    return `{${[type, ...parameters].join("|")}}`;
  });

  return JSON.stringify({ indent, directive, fragments });
}

export function assertMessageParity(
  english: Record<string, string>,
  russian: Record<string, string>,
): void {
  for (const key of Object.keys(english)) {
    if (!(key in russian)) throw new Error(`missing Russian message key: ${key}`);
  }
  for (const key of Object.keys(russian)) {
    if (!(key in english)) throw new Error(`unknown Russian message key: ${key}`);
  }
}

export function assertRouteParity(
  english: string,
  russian: string,
  name: string,
): void {
  const enLines = english.replaceAll("\r\n", "\n").split("\n");
  const ruLines = russian.replaceAll("\r\n", "\n").split("\n");
  if (enLines.length !== ruLines.length)
    throw new Error(`route line count differs: ${name}`);

  enLines.forEach((line, index) => {
    if (routeSignature(line) !== routeSignature(ruLines[index]))
      throw new Error(`route structure differs: ${name} line ${index + 1}`);
  });
}
```

- [ ] **Step 4: Run the focused tests**

Run:

```bash
npm exec -w seeding -- tsx --test src/localization/validate.test.ts
```

Expected: four passing tests.

- [ ] **Step 5: Add the CLI and package scripts**

The CLI reads `web/src/i18n/messages/*.json`, `common/data/routes/{en,ru}`, canonical game JSON, and `common/data/i18n/ru.json`. It invokes the exported validators and exits non-zero on the first actionable error.

Add:

```json
{
  "scripts": {
    "test:i18n": "tsx --test src/localization/validate.test.ts",
    "validate:i18n": "tsx src/localization/validate-i18n.ts"
  }
}
```

to `seeding/package.json`, preserving existing scripts. Add root delegators:

```json
{
  "scripts": {
    "test:i18n": "npm run test:i18n -w seeding",
    "validate:i18n": "npm run validate:i18n -w seeding"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add package.json seeding/package.json seeding/src/localization
git commit -m "test: add localization validation"
```

---

### Task 2: Add locale primitives, dictionaries, and persisted locale state

**Files:**
- Create: `web/src/i18n/core.ts`
- Create: `web/src/i18n/index.ts`
- Create: `web/src/i18n/messages/en.json`
- Create: `web/src/i18n/messages/ru.json`
- Create: `web/src/state/locale.ts`
- Create: `seeding/src/localization/locale-core.test.ts`
- Modify: `seeding/package.json`

- [ ] **Step 1: Write failing locale-core tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { formatMessage, normalizeLocale } from "../../../web/src/i18n/core.js";

test("normalizes supported locales", () => {
  assert.equal(normalizeLocale("ru-RU"), "ru");
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("broken"), "en");
  assert.equal(normalizeLocale(null), "en");
});

test("formats named parameters", () => {
  assert.equal(
    formatMessage("Act {act}: {name}", { act: 2, name: "Лесной лагерь" }),
    "Act 2: Лесной лагерь",
  );
});
```

- [ ] **Step 2: Run and verify failure**

Run:

```bash
npm exec -w seeding -- tsx --test src/localization/locale-core.test.ts
```

Expected: failure because `web/src/i18n/core.ts` does not exist.

- [ ] **Step 3: Implement the pure locale core**

```ts
import en from "./messages/en.json";
import ru from "./messages/ru.json";

export type Locale = "en" | "ru";
export type MessageKey = keyof typeof en;
export type MessageParameters = Record<string, string | number>;

const messages: Record<Locale, Record<MessageKey, string>> = { en, ru };

export function normalizeLocale(value: unknown): Locale {
  return typeof value === "string" && value.toLowerCase().startsWith("ru")
    ? "ru"
    : "en";
}

export function formatMessage(
  message: string,
  parameters: MessageParameters = {},
): string {
  return message.replace(/\{(\w+)\}/g, (token, key) =>
    key in parameters ? String(parameters[key]) : token,
  );
}

export function translate(
  locale: Locale,
  key: MessageKey,
  parameters: MessageParameters = {},
): string {
  return formatMessage(messages[locale][key] ?? messages.en[key], parameters);
}
```

- [ ] **Step 4: Create complete EN/RU message dictionaries**

Both JSON files must contain exactly these keys:

```text
app.title
app.buildTitle
app.editRouteTitle
nav.menu
nav.route
nav.build
nav.sections
nav.editRoute
nav.resetProgress
nav.thirdPartyExport
nav.projectGithub
nav.language
toast.exported
toast.copied
config.gemsOnly
config.showAllHints
build.class
build.bandits
build.killAll
build.leagueStart
build.library
build.pobCode
build.reset
build.import
build.importing
build.importSuccess
build.importFailed
route.importTitle
route.importing
route.importSuccess
route.importFailed
route.export
route.import
route.reset
route.save
search.strings
sidebar.tree
sidebar.gems
sidebar.search
sidebar.all
fragment.waypoint
fragment.trial
fragment.logout
fragment.portal
fragment.crafting
fragment.ascend
fragment.dailyLayout
fragment.act
reward.take
reward.buy
reward.for
reward.missingGem
error.prefix
error.link
error.suffix
```

Use natural Russian values such as `Маршрут`, `Сборка`, `Сбросить прогресс`, `Купить`, `Взять`, `Портал`, `Точка перемещения`, and `Ежедневная раскладка`.

- [ ] **Step 5: Implement persisted locale state**

```ts
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { normalizeLocale, type Locale } from "../i18n/core";

const storedLocaleAtom = atomWithStorage<unknown>("locale", null);

export const localeAtom = atom(
  (get): Locale => {
    const stored = get(storedLocaleAtom);
    if (stored !== null) return normalizeLocale(stored);
    return normalizeLocale(navigator.language);
  },
  (_get, set, locale: Locale) => set(storedLocaleAtom, locale),
);
```

- [ ] **Step 6: Add the React hook**

```ts
import { useAtomValue } from "jotai";
import { useCallback } from "react";
import { localeAtom } from "../state/locale";
import {
  translate,
  type MessageKey,
  type MessageParameters,
} from "./core";

export function useI18n() {
  const locale = useAtomValue(localeAtom);
  const t = useCallback(
    (key: MessageKey, parameters?: MessageParameters) =>
      translate(locale, key, parameters),
    [locale],
  );
  return { locale, t };
}
```

- [ ] **Step 7: Run tests and build**

```bash
npm run test:i18n
npm run build -w web
```

Expected: locale and dictionary-parity tests pass, and TypeScript/Vite build succeeds. Full CLI validation starts after Russian display data and route files exist.

- [ ] **Step 8: Commit**

```bash
git add web/src/i18n web/src/state/locale.ts seeding/src/localization seeding/package.json
git commit -m "feat: add English and Russian locale state"
```

---

### Task 3: Add Russian game display data and lookup helpers

**Files:**
- Create: `common/data/i18n/ru.json`
- Create: `seeding/src/localization/generate-ru-display-data.ts`
- Create: `web/src/i18n/game-data.ts`
- Modify: `common/src/types.d.ts`
- Modify: `common/src/data.ts`
- Modify: `seeding/src/localization/validate.ts`
- Modify: `seeding/src/localization/validate.test.ts`

- [ ] **Step 1: Add failing entity fallback and coverage tests**

Test that:

- known Russian values replace English;
- an absent optional value falls back to English;
- every canonical gem, area, and quest ID has a Russian entry;
- quest reward NPCs resolve by `questId/rewardOfferId`;
- English logic objects are never mutated.

```ts
test("missing optional display names fall back to English", () => {
  assert.equal(
    localizedName("missing", "English fallback", {}),
    "English fallback",
  );
});

test("coverage rejects a missing canonical id", () => {
  assert.throws(
    () => assertEntityCoverage(["a", "b"], { a: "А" }, "gems"),
    /missing Russian gems id: b/,
  );
});
```

- [ ] **Step 2: Run and verify failure**

```bash
npm run test:i18n
```

Expected: failure because entity validation and game-data helpers do not exist.

- [ ] **Step 3: Define localized data types**

Add to `common/src/types.d.ts`:

```ts
export namespace LocalizedGameData {
  export interface QuestNames {
    name: string;
    rewardNpcs: Record<string, string>;
    vendorNpcs: Record<string, Record<string, string>>;
  }

  export interface AreaNames {
    name: string;
    mapName: string | null;
    craftingRecipes: string[];
  }

  export interface Data {
    gems: Record<string, string>;
    areas: Record<string, AreaNames>;
    quests: Record<string, QuestNames>;
    classes: Record<string, string>;
    literals: Record<string, string>;
  }
}
```

Import and expose `common/data/i18n/ru.json` from `common/src/data.ts` as `Data.Localized.ru`.

- [ ] **Step 4: Implement display helpers**

`web/src/i18n/game-data.ts` must provide pure functions and `useGameData()`:

```ts
import { Data } from "common";
import { useAtomValue } from "jotai";
import { localeAtom } from "../state/locale";

export function localizedName(
  id: string,
  english: string,
  russian: Record<string, string>,
): string {
  return russian[id] ?? english;
}

export function useGameData() {
  const locale = useAtomValue(localeAtom);
  const ru = Data.Localized.ru;
  const russian = locale === "ru";

  return {
    gemName: (id: string) =>
      russian ? ru.gems[id] ?? Data.Gems[id]?.name ?? id : Data.Gems[id]?.name ?? id,
    areaName: (id: string) =>
      russian ? ru.areas[id]?.name ?? Data.Areas[id].name : Data.Areas[id].name,
    areaMapName: (id: string) =>
      russian
        ? ru.areas[id]?.mapName ?? ru.areas[id]?.name ?? Data.Areas[id].map_name ?? Data.Areas[id].name
        : Data.Areas[id].map_name ?? Data.Areas[id].name,
    questName: (id: string) =>
      russian ? ru.quests[id]?.name ?? Data.Quests[id].name : Data.Quests[id].name,
    literal: (english: string) =>
      russian ? ru.literals[english] ?? english : english,
  };
}
```

Split helpers further if line length or responsibility becomes unclear; do not add component-specific rendering here.

- [ ] **Step 5: Generate and curate `ru.json`**

Run the existing export tooling against an official Russian Path of Exile client, point the generator at the resulting `.dat.json` directory, and write:

```bash
npm exec -w seeding -- tsx src/localization/generate-ru-display-data.ts \
  --exports /absolute/path/to/russian/exports \
  --output ../common/data/i18n/ru.json
```

The generator uses canonical IDs from the English JSON and Russian display fields from the export. Manually curate the small set of wiki-sourced vendor NPC values that the client export cannot supply. Do not translate IDs or logic fields.

- [ ] **Step 6: Validate complete entity coverage**

Extend `validate:i18n` to compare:

- `Object.keys(gems.json)` with `ru.gems`;
- `Object.keys(areas.json)` with `ru.areas`;
- `Object.keys(quests.json)` with `ru.quests`;
- all reward-offer NPC display points used by `quests.json`;
- all class keys used by build data.

Allow fallback only for explicitly optional `mapName`, crafting-recipe, and literal entries.

- [ ] **Step 7: Run tests and commit**

```bash
npm run test:i18n
npm run build -w web
git add common/data/i18n common/src web/src/i18n/game-data.ts seeding/src/localization
git commit -m "feat: add Russian game display data"
```

---

### Task 4: Make default routes locale-aware without resetting user state

**Files:**
- Move: `common/data/routes/act-1.txt` through `act-10.txt` to `common/data/routes/en/`
- Modify: `web/src/state/route-files.ts`
- Modify: `web/src/components/SectionHolder/index.tsx`
- Modify: `web/src/containers/Routes/index.tsx`
- Modify: `web/src/components/Navbar/index.tsx`
- Modify: `seeding/src/localization/validate.ts`
- Modify: `seeding/src/localization/validate.test.ts`

- [ ] **Step 1: Add a failing route-selection test**

Extract route source selection into a pure function and verify:

```ts
test("selects all ten route files for the active locale", async () => {
  const lookup = Object.fromEntries(
    ["en", "ru"].flatMap((locale) =>
      Array.from({ length: 10 }, (_, index) => [
        `${locale}/act-${index + 1}`,
        Promise.resolve(`${locale}-${index + 1}`),
      ]),
    ),
  );
  assert.deepEqual(
    await selectRouteSources(lookup, "ru"),
    Array.from({ length: 10 }, (_, index) => `ru-${index + 1}`),
  );
});
```

- [ ] **Step 2: Move English routes and verify the test/build fail**

After moving the files, run:

```bash
npm run test:i18n
npm run build -w web
```

Expected: route selection or Vite glob failure until `route-files.ts` is updated.

- [ ] **Step 3: Implement nested route loading**

Change the glob to:

```ts
import.meta.glob("/../common/data/routes/*/*.txt", {
  query: "?raw",
  import: "default",
})
```

Key entries as `${locale}/${file}` and select `act-1` through `act-10` using `get(localeAtom)`. Keep `routeFilesAtom` unchanged: `null` means localized default; a stored array means a custom route and is not translated.

- [ ] **Step 4: Verify locale switching does not touch progress atoms**

Confirm by code inspection and a focused state test that changing only `localeAtom` does not call:

- `routeProgressFamily.clear`;
- `gemProgressFamily.clear`;
- `sectionCollapseFamily.clear`;
- build reset actions.

- [ ] **Step 5: Make section state locale-independent**

Change `SectionHolder` to accept a stable ID separately from its translated label:

```tsx
interface SectionHolderProps {
  id: string;
  name: string;
  items: TaskListProps["items"];
}

export function SectionHolder({ id, name, items }: SectionHolderProps) {
  const sectionId = `section-${id}`;
  const [collapsed, setCollapsed] = useAtom(sectionCollapseFamily(sectionId));
  // existing rendering uses `name` only for visible text
}
```

Pass `id={String(sectionIndex)}` from `RoutesContainer`. Generate Navbar section links as `/#section-${i}` rather than from localized section names. This preserves collapsed state and anchor targets across EN/RU switches.

- [ ] **Step 6: Run tests and commit**

```bash
npm run test:i18n
npm run build -w web
git add common/data/routes/en web/src/state/route-files.ts web/src/components/SectionHolder web/src/containers/Routes web/src/components/Navbar seeding/src/localization
git commit -m "refactor: load campaign routes by locale"
```

---

### Task 5: Translate the ten default campaign routes

**Files:**
- Create: `common/data/routes/ru/act-1.txt`
- Create: `common/data/routes/ru/act-2.txt`
- Create: `common/data/routes/ru/act-3.txt`
- Create: `common/data/routes/ru/act-4.txt`
- Create: `common/data/routes/ru/act-5.txt`
- Create: `common/data/routes/ru/act-6.txt`
- Create: `common/data/routes/ru/act-7.txt`
- Create: `common/data/routes/ru/act-8.txt`
- Create: `common/data/routes/ru/act-9.txt`
- Create: `common/data/routes/ru/act-10.txt`

- [ ] **Step 1: Copy each English route as the structural baseline**

```bash
mkdir -p common/data/routes/ru
for file in common/data/routes/en/act-*.txt; do
  cp "$file" "common/data/routes/ru/$(basename "$file")"
done
```

- [ ] **Step 2: Translate Acts 1–3**

Translate visible prose and display-only fragment payloads. Keep structural tokens exact. Examples:

```text
#section Акт 1
Убей {kill|Хиллок} ➞ {enter|1_1_2}
Возьми {waypoint}
Выйди в меню выбора персонажа
```

Run:

```bash
npm run validate:i18n
```

Expected: route structure passes; untranslated-content coverage may still report Acts 4–10.

- [ ] **Step 3: Translate Acts 4–7**

Use official Russian client names and the agreed imperative style. Run validation after each act to catch a changed ID, missing line, or altered conditional directive immediately.

- [ ] **Step 4: Translate Acts 8–10**

Preserve bandit/library/league-start preprocessor branches exactly. Run:

```bash
npm run validate:i18n
```

Expected: all ten route pairs pass.

- [ ] **Step 5: Manually review high-risk route constructs**

Review every occurrence of:

```bash
rg -n '#if|#else|#endif|\\{quest\\||\\{enter\\||\\{waypoint\\||\\{portal\\||\\{ascend\\|' \
  common/data/routes/{en,ru}
```

Expected: paired EN/RU structural constructs match line-for-line.

- [ ] **Step 6: Commit routes separately**

```bash
git add common/data/routes/ru
git commit -m "feat: add Russian campaign routes"
```

---

### Task 6: Add the language selector and translate application chrome

**Files:**
- Modify: `web/src/components/Navbar/index.tsx`
- Modify: `web/src/components/Navbar/styles.module.css`
- Modify: `web/src/containers/index.tsx`
- Modify: all UI-string component files listed in the file map

- [ ] **Step 1: Add a failing compile reference for the selector**

Import a not-yet-created `LocaleSelector` into `Navbar` and run:

```bash
npm run build -w web
```

Expected: TypeScript failure for the missing component.

- [ ] **Step 2: Implement a compact selector**

Add a focused `LocaleSelector` inside the Navbar module or in
`web/src/components/LocaleSelector/index.tsx` if it exceeds roughly 40 lines:

```tsx
function LocaleSelector() {
  const [locale, setLocale] = useAtom(localeAtom);
  const { t } = useI18n();

  return (
    <div className={styles.localeSelector} aria-label={t("nav.language")}>
      {(["en", "ru"] as const).map((value) => (
        <button
          key={value}
          aria-pressed={locale === value}
          className={classNames({
            [interactiveStyles.activePrimary]: locale === value,
            [interactiveStyles.hoverPrimary]: locale !== value,
          })}
          onClick={() => setLocale(value)}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
```

Render it only in the expanded navigation panel near configuration/navigation controls.

- [ ] **Step 3: Replace Navbar and page-title literals**

Use `t()` for navigation labels, aria labels, export toast, and page titles. Do not translate the project name `Exile Leveling`. In `App`, set `document.documentElement.lang = locale` in an effect whenever the locale changes.

- [ ] **Step 4: Replace remaining hard-coded application strings**

Update every file listed in the file map. Use the exact audit:

```bash
rg -n '"[A-Z][A-Za-z0-9 ,:;.!?↔/()_-]{2,}"|>[A-Z][^<{]*<' \
  web/src --glob '*.{ts,tsx}'
```

Any remaining English result must be one of:

- a canonical PoB/game identifier;
- an external URL;
- a developer-only error/log;
- the documented passive-tree fallback.

- [ ] **Step 5: Build and commit**

```bash
npm run validate:i18n
npm run build -w web
git add web/src
git commit -m "feat: add English and Russian UI switch"
```

---

### Task 7: Localize generated fragments, gems, quests, and search strings

**Files:**
- Modify: `web/src/components/FragmentStep/Fragment/index.tsx`
- Modify: `web/src/components/GemLinkViewer/index.tsx`
- Modify: `web/src/components/ItemReward/index.tsx`
- Modify: `web/src/state/route.ts`
- Modify: `web/src/i18n/game-data.ts`
- Modify: `seeding/src/localization/validate.test.ts`

- [ ] **Step 1: Add failing pure display-helper tests**

Cover:

- Russian gem name by metadata ID;
- English fallback;
- localized area map name;
- localized quest reward NPC by quest/reward-offer ID;
- localized class name;
- localized search string.

- [ ] **Step 2: Run and verify failure**

```bash
npm run test:i18n
```

Expected: failing tests for missing display helper methods.

- [ ] **Step 3: Wire fragments to localized display helpers**

Change component helpers to accept the canonical ID rather than only an English string where possible. Examples:

```tsx
function AreaComponent(areaId: string, useMapName = false) {
  const area = Data.Areas[areaId];
  const game = useGameData();
  const name = useMapName ? game.areaMapName(areaId) : game.areaName(areaId);
  // existing rendering remains unchanged
}
```

Use `t()` for generic fragment labels (`Waypoint`, `Portal`, `Logout`, `Crafting`, `Ascend`, `Daily Layout`, and `Act {act}`).

- [ ] **Step 4: Localize gem and quest displays**

Use canonical IDs for:

- GemLinkViewer titles and tooltips;
- ItemReward gem names and clipboard text;
- quest names and reward NPCs;
- class/bandit display labels where an official Russian name exists.

Do not change IDs used by PoB import or reward matching.

- [ ] **Step 5: Localize generated vendor search strings**

In `web/src/state/route.ts`, read `localeAtom` and select gem names through a pure `getGemName(locale, id)` helper:

```ts
const locale = get(localeAtom);
const searchString = gemSteps
  .map((step) => getGemName(locale, step.requiredGem.id))
  .join("|");
```

The copied search expression must therefore match the active client language.

- [ ] **Step 6: Run tests, validation, build, and commit**

```bash
npm run test:i18n
npm run validate:i18n
npm run build -w web
git add web/src seeding/src/localization
git commit -m "feat: localize campaign game data"
```

---

### Task 8: Document, integrate CI validation, and preserve deployment

**Files:**
- Modify: `.github/workflows/build-and-deploy.yml`
- Modify: `README.md`
- Modify: `web/vite.config.ts`

- [ ] **Step 1: Add validation before the production build**

After deterministic workspace installation and before `npm -w web run build`, add:

```yaml
- name: Validate localization
  run: |
    npm run test:i18n
    npm run validate:i18n
```

Preserve `base: "/exile-leveling/"`, the existing deploy folder, and the GitHub Pages branch behavior.

- [ ] **Step 2: Keep install metadata understandable in both languages**

Keep the proper name `Exile Leveling` and change the single static manifest description to:

```ts
description:
  "Path of Exile leveling guide with PoB integration / Русский гайд по прокачке с интеграцией PoB",
```

Do not create locale-specific builds or alter `base: "/exile-leveling/"`.
Apply the same bilingual wording to the static `<meta name="description">` in
`web/index.html`; the runtime effect from Task 6 continues to update the
document's `lang` attribute.

- [ ] **Step 3: Document user-visible behavior**

README must state:

- browser-language detection and manual `EN/RU` switch;
- English fallback behavior;
- official Russian client terminology;
- custom routes are not auto-translated;
- passive-tree node tooltips remain English;
- commands for tests, validation, build, and Russian display-data regeneration;
- upstream sync procedure.

- [ ] **Step 4: Run the complete automated verification**

Use the committed lockfile. Do not update packages:

```bash
npm ci --ignore-scripts
npm run test:i18n
npm run validate:i18n
npm run build -w web
git diff --check
```

Expected: all commands exit zero and `web/dist/` is produced.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/build-and-deploy.yml README.md web/vite.config.ts web/index.html
git commit -m "docs: document Russian localization workflow"
```

---

### Task 9: Browser smoke test and release handoff

**Files:**
- No source changes unless a smoke test exposes a scoped defect.

- [ ] **Step 1: Start the built application locally**

```bash
npm run preview -w web -- --host 127.0.0.1
```

Expected: Vite reports a local preview URL under `/exile-leveling/`.

- [ ] **Step 2: Verify locale behavior**

In a fresh browser context:

1. Set browser language to Russian and confirm first render is Russian.
2. Switch to EN and reload; confirm EN persists.
3. Switch back to RU and reload; confirm RU persists.
4. Write an invalid locale value into the app's locale storage entry and reload; confirm EN fallback.

- [ ] **Step 3: Verify PoB and progress preservation**

1. Import a known PoB containing multiple tree snapshots and gem groups.
2. Mark campaign and gem steps complete.
3. Expand/collapse sections.
4. Switch EN → RU → EN.
5. Confirm PoB, marked steps, selected tree snapshot, and section state remain intact.

- [ ] **Step 4: Verify localized game content**

Confirm in Russian:

- all ten act headings;
- route prose and conditionally displayed league-start/library steps;
- zone, quest, NPC, gem, and reward names;
- copied vendor gem search strings;
- clipboard and import/export toasts;
- custom route content remains unchanged;
- passive tree renders and its tooltip text remains English.

- [ ] **Step 5: Final automated verification**

```bash
npm run test:i18n
npm run validate:i18n
npm run build -w web
git diff --check
git status --short
```

Expected: tests/build pass and the worktree is clean.

- [ ] **Step 6: Push the verified branch**

```bash
git push origin codex/russian-localization
```

Do not merge to `main` or deploy GitHub Pages until user review confirms the Russian wording and smoke-test screenshots.
