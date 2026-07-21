# PoE Tools Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Exile Leveling web shell into PoE Tools with Useful as the root catalog, Leveling at `/leveling`, compact internal-tool discovery, persisted recent tools, and a progress-aware continuation card while preserving every existing leveling feature.

**Architecture:** Keep the Vite/React/Jotai workspaces and existing lazy route boundaries. Add a typed internal-tool catalog beside Useful, expose route-progress keys from the existing toggle-state primitive, and derive a pure continuation summary from the parsed route. The root catalog renders internal and external resources with existing palette tokens; regex links initially point at a lazy placeholder catalog so the shell can ship independently of the later regex migration.

**Tech Stack:** React 19, React Router 7 HashRouter, Jotai 2, CSS modules, TypeScript 7, Vite 8, Node `node:test` through `tsx`.

---

## File map

- `web/src/containers/index.tsx` — canonical route table and page titles.
- `web/src/components/Navbar/index.tsx` — global PoE Tools navigation.
- `web/src/components/Sidebar/index.tsx` — honor direct `?view=tree|gems` links from the catalog.
- `web/src/containers/Useful/tools.ts` — typed internal-tool catalog and search helpers.
- `web/src/containers/Useful/progress.ts` — pure continuation-summary calculation.
- `web/src/containers/Useful/index.tsx` — root catalog UI.
- `web/src/containers/Useful/styles.module.css` — Linear-like catalog layout in Exile Leveling tokens.
- `web/src/containers/RegexCatalog/index.tsx` — lazy placeholder/catalog boundary for the later regex UI plan.
- `web/src/containers/RegexCatalog/styles.module.css` — compact regex catalog styling.
- `web/src/state/recent-tools.ts` — validated localStorage-backed recent internal tools.
- `web/src/state/toggle-state.ts` — expose a read-only keys atom from existing toggle families.
- `web/src/state/route-progress.ts` — export route-progress keys through the family contract.
- `web/src/i18n/messages/en.json` — canonical English product/catalog strings.
- `web/src/i18n/messages/ru.json` — Russian parity strings.
- `web/vite.config.ts` — PoE Tools PWA metadata and explicit sourcemap policy.
- `seeding/src/localization/poe-tools-shell.test.ts` — route/catalog/state/metadata contract tests.
- `seeding/package.json` — include the new shell test in the existing deterministic test command.

### Task 1: Add shell contract tests

**Files:**
- Create: `seeding/src/localization/poe-tools-shell.test.ts`
- Modify: `seeding/package.json`

- [ ] **Step 1: Add the new test file to the explicit test command**

Change `seeding/package.json` so `test:i18n` includes `src/localization/poe-tools-shell.test.ts` after `locale-state.test.ts`.

- [ ] **Step 2: Write failing route, metadata, and catalog tests**

Create the test with these contracts:

```ts
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
  normalizeRecentToolIds,
  pushRecentToolId,
} from "../../../web/src/state/recent-tools.js";

const readSource = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

test("defines unique internal tools with safe hash routes", () => {
  assert.equal(new Set(internalTools.map(({ id }) => id)).size, internalTools.length);
  assert.ok(internalTools.every(({ href }) => href.startsWith("/")));
  assert.deepEqual(internalToolCategories.map(({ id }) => id), [
    "continue",
    "tools",
    "reference",
  ]);
});

test("matches localized tool search text case-insensitively", () => {
  const regex = internalTools.find(({ id }) => id === "regex");
  assert.ok(regex);
  assert.equal(matchesToolQuery(regex!, "REGEX", en), true);
  assert.equal(matchesToolQuery(regex!, "регуляр", ru), true);
  assert.equal(matchesToolQuery(regex!, "unrelated", ru), false);
});

test("normalizes recent tools to known unique bounded ids", () => {
  assert.deepEqual(normalizeRecentToolIds(["regex", "regex", "unknown", "leveling"]), [
    "regex",
    "leveling",
  ]);
  assert.deepEqual(pushRecentToolId(["leveling", "regex"], "leveling"), [
    "leveling",
    "regex",
  ]);
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
});
```

- [ ] **Step 3: Run the new test and verify it fails for missing modules/contracts**

Run: `npm run test:i18n`

Expected: FAIL because `Useful/tools.ts`, `recent-tools.ts`, new routes, and PoE Tools metadata do not exist yet.

### Task 2: Add the typed internal-tool catalog

**Files:**
- Create: `web/src/containers/Useful/tools.ts`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`

- [ ] **Step 1: Define catalog types and entries**

Create `tools.ts` with `leveling`, `regex`, `build`, `tree`, and `gems`. Keep labels and descriptions as message keys and keep category membership explicit:

```ts
import type { MessageKey } from "../../i18n/core";

export type InternalToolId = "leveling" | "regex" | "build" | "tree" | "gems";
export type InternalToolCategoryId = "continue" | "tools" | "reference";

export type InternalTool = Readonly<{
  id: InternalToolId;
  href: string;
  category: Exclude<InternalToolCategoryId, "continue">;
  accent: "planning" | "regex" | "reference";
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  keywordsKey: MessageKey;
}>;

export const internalTools = [
  {
    id: "leveling",
    href: "/leveling",
    category: "tools",
    accent: "planning",
    titleKey: "tools.leveling.title",
    descriptionKey: "tools.leveling.description",
    keywordsKey: "tools.leveling.keywords",
  },
  {
    id: "regex",
    href: "/regex",
    category: "tools",
    accent: "regex",
    titleKey: "tools.regex.title",
    descriptionKey: "tools.regex.description",
    keywordsKey: "tools.regex.keywords",
  },
  {
    id: "build",
    href: "/build",
    category: "reference",
    accent: "reference",
    titleKey: "tools.build.title",
    descriptionKey: "tools.build.description",
    keywordsKey: "tools.build.keywords",
  },
  {
    id: "tree",
    href: "/leveling?view=tree",
    category: "reference",
    accent: "reference",
    titleKey: "tools.tree.title",
    descriptionKey: "tools.tree.description",
    keywordsKey: "tools.tree.keywords",
  },
  {
    id: "gems",
    href: "/leveling?view=gems",
    category: "reference",
    accent: "reference",
    titleKey: "tools.gems.title",
    descriptionKey: "tools.gems.description",
    keywordsKey: "tools.gems.keywords",
  },
] as const satisfies readonly InternalTool[];

export const internalToolCategories = [
  { id: "continue", titleKey: "tools.category.continue" },
  { id: "tools", titleKey: "tools.category.tools" },
  { id: "reference", titleKey: "tools.category.reference" },
] as const;

type Messages = Readonly<Record<string, string>>;

export function matchesToolQuery(
  tool: InternalTool,
  query: string,
  messages: Messages,
): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (needle === "") return true;
  return [tool.titleKey, tool.descriptionKey, tool.keywordsKey]
    .map((key) => messages[key] ?? "")
    .join(" ")
    .toLocaleLowerCase()
    .includes(needle);
}
```

- [ ] **Step 2: Add complete EN/RU message parity**

Add messages for product titles, search, categories, recent tools, and each tool's title/description/keywords. English and Russian files must have identical keys. Required examples:

```json
"tools.search": "Search tools and resources",
"tools.regex.title": "Regex generators",
"tools.regex.description": "Build safe searches for maps, items, vendors and league mechanics.",
"tools.regex.keywords": "regex regular expression maps items vendors trade"
```

```json
"tools.search": "Поиск инструментов и ресурсов",
"tools.regex.title": "Regex-генераторы",
"tools.regex.description": "Безопасный поиск карт, предметов, покупок у торговцев и механик лиги.",
"tools.regex.keywords": "regex регулярные выражения карты предметы торговцы трейд"
```

- [ ] **Step 3: Run message validation and the catalog tests**

Run: `npm run test:i18n && npm run validate:i18n`

Expected: catalog/search tests pass; route and metadata tests remain red.

- [ ] **Step 4: Commit the catalog**

```bash
git add seeding/package.json seeding/src/localization/poe-tools-shell.test.ts web/src/containers/Useful/tools.ts web/src/i18n/messages/en.json web/src/i18n/messages/ru.json
git commit -m "feat(shell): add internal tool catalog"
```

### Task 3: Persist and validate recent internal tools

**Files:**
- Create: `web/src/state/recent-tools.ts`

- [ ] **Step 1: Implement bounded recent-tool normalization**

```ts
import { atomWithStorage } from "jotai/utils";
import { versionedStorage } from ".";
import { internalTools, type InternalToolId } from "../containers/Useful/tools";

const RECENT_TOOLS_VERSION = 0;
const MAX_RECENT_TOOLS = 4;
const knownIds = new Set<InternalToolId>(internalTools.map(({ id }) => id));

export function normalizeRecentToolIds(value: unknown): InternalToolId[] {
  if (!Array.isArray(value)) return [];
  const result: InternalToolId[] = [];
  for (const id of value) {
    if (typeof id !== "string" || !knownIds.has(id as InternalToolId)) continue;
    if (!result.includes(id as InternalToolId)) result.push(id as InternalToolId);
  }
  return result.slice(0, MAX_RECENT_TOOLS);
}

export function pushRecentToolId(
  current: readonly InternalToolId[],
  id: InternalToolId,
): InternalToolId[] {
  return [id, ...current.filter((candidate) => candidate !== id)].slice(
    0,
    MAX_RECENT_TOOLS,
  );
}

export const recentToolsAtom = atomWithStorage<InternalToolId[]>(
  "recent-tools",
  [],
  versionedStorage(RECENT_TOOLS_VERSION),
);
```

- [ ] **Step 2: Run recent-tool tests**

Run: `npm run test:i18n`

Expected: normalization and reorder tests pass.

- [ ] **Step 3: Commit recent state**

```bash
git add web/src/state/recent-tools.ts
git commit -m "feat(shell): remember recent tools"
```

### Task 4: Expose route progress and derive continuation state

**Files:**
- Modify: `web/src/state/toggle-state.ts`
- Create: `web/src/containers/Useful/progress.ts`
- Modify: `seeding/src/localization/poe-tools-shell.test.ts`

- [ ] **Step 1: Add failing pure continuation tests**

Extend the shell test with a small two-act route fixture. Assert that completed keys `0,0` and `0,1` produce `{ sectionIndex: 1, stepIndex: 0, completed: 2, total: 3 }`, and a fully complete route returns the final step with `done: true`.

- [ ] **Step 2: Expose a reactive keys atom from toggle-state**

Extend `ClearableAtomFamily` with `keys: Atom<readonly string[]>`. Build it from `refreshAtom` and `toggleState`:

```ts
const keysAtom = atom((get) => {
  get(refreshAtom);
  return [...toggleState];
});

return Object.assign(toggleFamily, { clear: clearAtom, keys: keysAtom });
```

- [ ] **Step 3: Implement pure progress summarization**

Create `progress.ts` with a `RouteLike` structural type. Count fragment steps in display order and return the first key not present in the completed set. Ignore gem steps because their completion uses a separate identifier family.

```ts
export interface LevelingProgressSummary {
  sectionIndex: number;
  stepIndex: number;
  completed: number;
  total: number;
  done: boolean;
}

export function summarizeLevelingProgress(
  route: readonly { steps: readonly { type: string }[] }[],
  completedKeys: readonly string[],
): LevelingProgressSummary | null {
  const completed = new Set(completedKeys);
  const fragmentSteps = route.flatMap((section, sectionIndex) =>
    section.steps.flatMap((step, stepIndex) =>
      step.type === "fragment_step" ? [{ sectionIndex, stepIndex }] : [],
    ),
  );
  if (fragmentSteps.length === 0) return null;
  const next = fragmentSteps.find(
    ({ sectionIndex, stepIndex }) => !completed.has(`${sectionIndex},${stepIndex}`),
  );
  const target = next ?? fragmentSteps[fragmentSteps.length - 1];
  return {
    ...target,
    completed: next ? fragmentSteps.indexOf(next) : fragmentSteps.length,
    total: fragmentSteps.length,
    done: next === undefined,
  };
}
```

- [ ] **Step 4: Run all tests**

Run: `npm run test:i18n`

Expected: progress tests pass and the existing toggle-state migration tests remain green.

- [ ] **Step 5: Commit progress support**

```bash
git add web/src/state/toggle-state.ts web/src/containers/Useful/progress.ts seeding/src/localization/poe-tools-shell.test.ts
git commit -m "feat(shell): expose leveling continuation"
```

### Task 5: Make Useful the root and add the lazy regex boundary

**Files:**
- Modify: `web/src/containers/index.tsx`
- Create: `web/src/containers/RegexCatalog/index.tsx`
- Create: `web/src/containers/RegexCatalog/styles.module.css`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`

- [ ] **Step 1: Add the lazy regex catalog boundary**

Create a small catalog page listing the twelve approved regex tool names as disabled/upcoming rows. It must not import any regex domain or data module. Include a link back to `/` and localized title/description.

- [ ] **Step 2: Change the route table**

Use these lazy boundaries:

```ts
const LevelingContainer = pipe(
  withBlank,
  withScrollRestoration,
)(lazy(() => import("./Routes")));
const UsefulContainer = withBlank(lazy(() => import("./Useful")));
const RegexCatalog = withBlank(lazy(() => import("./RegexCatalog")));
```

Set `/` to `UsefulContainer`, `/leveling` to `LevelingContainer`, `/useful` to `<Navigate to="/" replace />`, and `/regex` to `RegexCatalog`. Keep `/build` and `/edit-route` unchanged.

- [ ] **Step 3: Run shell tests and build**

Run: `npm run test:i18n && npm run validate:i18n && npm run build -w web`

Expected: all tests pass; Vite output includes separate `Useful`, `Routes`, and `RegexCatalog` chunks.

- [ ] **Step 4: Commit routing**

```bash
git add web/src/containers/index.tsx web/src/containers/RegexCatalog web/src/i18n/messages/en.json web/src/i18n/messages/ru.json
git commit -m "feat(shell): route PoE Tools catalog"
```

### Task 6: Redesign the Navbar for PoE Tools

**Files:**
- Modify: `web/src/components/Navbar/index.tsx`
- Modify: `web/src/components/Navbar/styles.module.css`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Modify: `seeding/src/localization/poe-tools-shell.test.ts`

- [ ] **Step 1: Add failing Navbar order tests**

Assert source order `nav.home`, `nav.leveling`, `nav.regex`, then `nav.build`, and assert the canonical GitHub URL is `https://github.com/Simonerrror/exile-leveling`.

- [ ] **Step 2: Implement the common product navigation**

Add a compact `PoE Tools` brand link/button, then Home, Leveling, Regex, and Build as the always-visible primary set. Keep Sections, Edit Route, Reset Progress, Export, GitHub, and locale inside the expanded menu. Use `navigate("/")`, `navigate("/leveling")`, and `navigate("/regex")`.

- [ ] **Step 3: Preserve accessibility and compact breakpoints**

Keep the existing menu `aria-label`, button semantics, focus outline, and mobile expansion. Do not add icon images; reuse `react-icons` already present in the lockfile.

- [ ] **Step 4: Run tests and build**

Run: `npm run test:i18n && npm run validate:i18n && npm run build -w web`

Expected: all checks pass.

- [ ] **Step 5: Commit Navbar changes**

```bash
git add web/src/components/Navbar web/src/i18n/messages/en.json web/src/i18n/messages/ru.json seeding/src/localization/poe-tools-shell.test.ts
git commit -m "feat(shell): add PoE Tools navigation"
```

### Task 7: Build the root tool catalog UI

**Files:**
- Modify: `web/src/containers/Useful/index.tsx`
- Modify: `web/src/containers/Useful/styles.module.css`
- Modify: `web/src/containers/Useful/resources.ts`
- Modify: `web/src/components/Sidebar/index.tsx`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Modify: `seeding/src/localization/useful-resources.test.ts`
- Modify: `seeding/src/localization/poe-tools-shell.test.ts`

- [ ] **Step 1: Add failing structural catalog assertions**

Assert the source contains a search input, `internalTools`, `recentToolsAtom`, `routeProgressFamily.keys`, a category rail, internal `Link` cards, and external anchors with `target="_blank"`. Remove the old assertion that PoE.re is necessarily external once it becomes the internal regex entry.

- [ ] **Step 2: Add search and internal card rendering**

Use `useState("")`, `useI18n`, `Link`, and `useAtom`. A clicked internal card updates `recentToolsAtom` via `pushRecentToolId`. Filter internal tools and external resources against localized title/description/name/domain.

- [ ] **Step 3: Add the progress-aware continuation card**

Read `routeSelector` and `routeProgressFamily.keys`, call `summarizeLevelingProgress`, and link to `/leveling#section-{sectionIndex}`. Render localized act/step/progress text. Hide the continuation block only when no route steps exist.

- [ ] **Step 4: Make Tree and Gems cards open the requested sidebar view**

Give each computed sidebar section a stable `id` (`tree`, `gems`, or `search`). Read `view` with React Router's `useSearchParams`, derive the active tab from the current section ids, and fall back to the first available section when the query is missing or unavailable. The catalog links remain `/leveling?view=tree` and `/leveling?view=gems`; verify both select the matching tab without changing the stored route.

- [ ] **Step 5: Add category rail and dense two-column layout**

Use a page grid with a sticky category rail at desktop widths and horizontal overflow chips below 48rem. Cards use `minmax(min(100%, 18rem), 1fr)`, two-line descriptions, 1px borders, 4–6px radii, and only semantic left-border/text accents. Remove the featured gradient from internal cards.

- [ ] **Step 6: Keep Heist and cheat sheets below the catalog**

Do not remove existing Heist branches, attribution, gallery modal, or external resource validation.

- [ ] **Step 7: Run all checks**

Run: `npm run test:i18n && npm run validate:i18n && npm run build -w web`

Expected: all checks pass and Useful remains a separate lazy chunk.

- [ ] **Step 8: Commit the root catalog**

```bash
git add web/src/components/Sidebar/index.tsx web/src/containers/Useful web/src/i18n/messages/en.json web/src/i18n/messages/ru.json seeding/src/localization/useful-resources.test.ts seeding/src/localization/poe-tools-shell.test.ts
git commit -m "feat(useful): make PoE Tools catalog the homepage"
```

### Task 8: Update product/PWA metadata and lock production sourcemaps off

**Files:**
- Modify: `web/vite.config.ts`
- Modify: `web/index.html`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`

- [ ] **Step 1: Rename product metadata**

Set PWA `name` and `short_name` to `PoE Tools`, update the bilingual description to cover leveling and regex tools, and update HTML title/meta description without changing the Pages base path.

- [ ] **Step 2: Add an explicit production build policy**

Add:

```ts
build: {
  sourcemap: false,
},
```

Do not raise `chunkSizeWarningLimit`; warnings must remain visible.

- [ ] **Step 3: Run tests and a clean build**

Run: `npm run test:i18n && npm run validate:i18n && npm run build -w web`

Expected: all checks pass and `find web/dist -name '*.map'` prints nothing.

- [ ] **Step 4: Commit metadata**

```bash
git add web/vite.config.ts web/index.html web/src/i18n/messages/en.json web/src/i18n/messages/ru.json
git commit -m "chore(shell): rename app to PoE Tools"
```

### Task 9: Add and enforce the initial bundle budget

**Files:**
- Create: `scripts/check-bundle-budget.mjs`
- Modify: `package.json`
- Modify: `seeding/src/localization/poe-tools-shell.test.ts`

- [ ] **Step 1: Write the failing script contract test**

Assert root `package.json` defines `build:web`, `check:bundle`, and `verify`, and that the budget script contains `250 * 1024`, rejects `.map`, and inspects entry imports from `web/dist/.vite/manifest.json`.

- [ ] **Step 2: Implement manifest-based gzip accounting**

The script must:

1. read `web/dist/.vite/manifest.json`;
2. locate the `web/index.html` entry;
3. traverse only its static `imports` graph;
4. gzip each unique JS file with `node:zlib.gzipSync`;
5. fail above `250 * 1024` bytes;
6. fail if any `.map` exists under `web/dist`;
7. print raw and gzip totals plus visited chunk names.

Enable Vite `build.manifest: true` while keeping `sourcemap: false`.

- [ ] **Step 3: Add deterministic root scripts**

```json
"build:web": "npm run build -w web",
"check:bundle": "node scripts/check-bundle-budget.mjs",
"verify": "npm run test:i18n && npm run validate:i18n && npm run build:web && npm run check:bundle"
```

- [ ] **Step 4: Run the complete verification gate**

Run: `npm run verify`

Expected: 101+ tests pass, i18n validates, build succeeds, no sourcemaps exist, and initial JS is at or below 250 KB gzip.

- [ ] **Step 5: Commit the budget gate**

```bash
git add scripts/check-bundle-budget.mjs package.json web/vite.config.ts seeding/src/localization/poe-tools-shell.test.ts
git commit -m "ci(shell): enforce initial bundle budget"
```

### Task 10: Perform shell visual and regression verification

**Files:**
- Modify only if a verified defect is found in files already owned by Tasks 1–9.

- [ ] **Step 1: Run the full automated gate from the worktree root**

Run: `npm run verify`

Expected: exit 0, all tests green, initial JS <= 250 KB gzip, zero sourcemaps.

- [ ] **Step 2: Start the production preview**

Run: `npm run preview -w web -- --host 127.0.0.1`

Expected: Vite prints a local preview URL under `/exile-leveling/`.

- [ ] **Step 3: Verify desktop routes and interactions in a browser**

Check `#/`, `#/leveling`, `#/useful`, `#/regex`, `#/build`, and `#/edit-route`. Verify search, category navigation, continuation, recent tools, language switching, external target behavior, keyboard focus, and console errors.

- [ ] **Step 4: Verify mobile layout**

At a 390×844 viewport confirm one-column cards, horizontally scrollable category filters, usable menu, no horizontal page overflow, and no content hidden beneath sticky UI.

- [ ] **Step 5: Record the measured baseline for the next plans**

Add the shell build's initial gzip total and chunk names to the next regex-core plan. Do not weaken the 250 KB gate.

- [ ] **Step 6: Route any verified defect back to its owning task**

If smoke testing finds a defect, add a failing assertion to the relevant Task 1–9 test, make the smallest fix, rerun `npm run verify`, and amend that task's implementation with a separate `fix(shell): address catalog smoke findings` commit. If no defect is found, do not create an empty commit.
