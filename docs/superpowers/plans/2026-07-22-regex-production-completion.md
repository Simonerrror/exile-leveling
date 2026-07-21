# Regex Production Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver eleven complete, current, icon-aware PoE regex tools with PoB vendor integration, recipe-aware Bestiary price checking, restored descriptions, and a verified public GitHub Pages deployment.

**Architecture:** Keep the existing lazy route shell and compiler core, but move each tool’s state/render/compile adapter into a focused editor module. Generate and validate rich static league shards at seeding time; use prepared live trade links for price checks so the static site has no runtime backend dependency.

**Tech Stack:** React 19, TypeScript, Jotai persisted state, Node test runner through `tsx`, Vite 8, static JSON shards, GitHub Pages.

---

### Task 1: Remove map-name regex and migrate profiles

**Files:**
- Modify: `web/src/containers/index.tsx`
- Modify: `web/src/containers/RegexCatalog/index.tsx`
- Modify: `web/src/containers/RegexWorkspace/index.tsx`
- Modify: `web/src/features/regex/data/types.ts`
- Modify: `web/src/features/regex/data/loaders.ts`
- Modify: `web/src/features/regex/profile/schema.ts`
- Modify: `web/src/features/regex/profile/migration.ts`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Modify: `seeding/src/regex/export-legacy-data.ts`
- Modify: `seeding/src/regex/source-allowlist.ts`
- Modify: `scripts/check-bundle-budget.mjs`
- Delete: `web/src/features/regex/data/generated/mapnames.en.json`
- Delete: `web/src/features/regex/data/generated/mapnames.ru.json`
- Test: `seeding/src/regex/regex-ui.test.ts`
- Test: `seeding/src/regex/profile-migration.test.ts`
- Test: `seeding/src/regex/data-contract.test.ts`
- Test: `seeding/src/regex/bundle-isolation.test.ts`

- [ ] **Step 1: Write failing route, shard, and migration tests**

```ts
test("exposes eleven regex routes without the obsolete map-name tool", () => {
  assert.equal(regexToolIds.length, 11);
  assert.ok(!regexToolIds.includes("mapnames"));
  assert.doesNotMatch(routeSource, /regex\/mapnames/);
});

test("profile migration drops mapnames and preserves retained tools", () => {
  const migrated = migrateLegacyProfile({ tools: { mapnames: { selected: ["x"] }, maps: { quantity: 80 } } });
  assert.equal("mapnames" in migrated.tools, false);
  assert.equal(migrated.tools.maps.quantity, 80);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:regex -w seeding`

Expected: failures report twelve routes/shards and retained `mapnames` profile data.

- [ ] **Step 3: Remove the route, catalog card, loader cell, type union member, messages, export branch, allowlist member, budget entry, and generated shards**

```ts
export type RegexDataToolId =
  | "vendor" | "maps" | "items" | "flasks" | "heist"
  | "expedition" | "beast" | "scarabs" | "tattoos" | "runegrafts" | "jewels";
```

- [ ] **Step 4: Bump the profile schema and explicitly discard only the removed tool during migration**

```ts
export const PROFILE_SCHEMA_VERSION = 3 as const;

const { mapnames: _removedMapNames, ...retainedTools } = legacyTools;
return normalizeTools(retainedTools);
```

- [ ] **Step 5: Regenerate the manifest, run focused tests, and verify GREEN**

Run: `env COREPACK_ENABLE_PROJECT_SPEC=0 npm run regex:data:export -w seeding -- --source /Users/sergio/Documents/30_HOBBY_AI/projects/poe/poe-regex-ru`

Run: `env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:regex -w seeding`

Expected: 11 tool families, 22 shards, zero failures.

- [ ] **Step 6: Commit the removal**

```bash
git add scripts seeding web
git commit -m "refactor(regex): remove obsolete map names tool"
```

### Task 2: Extract typed editor boundaries

**Files:**
- Create: `web/src/features/regex/editors/types.ts`
- Create: `web/src/features/regex/editors/index.ts`
- Create: `web/src/features/regex/editors/shared/EntityImage.tsx`
- Create: `web/src/features/regex/editors/shared/MarketStamp.tsx`
- Create: `web/src/features/regex/editors/shared/styles.module.css`
- Modify: `web/src/containers/RegexWorkspace/index.tsx`
- Modify: `web/src/features/regex/profile/schema.ts`
- Test: `seeding/src/regex/regex-ui.test.ts`
- Test: `seeding/src/regex/profile-migration.test.ts`

- [ ] **Step 1: Write a failing source-contract test for editor registration and image fallback**

```ts
test("registers one typed editor for every current regex tool", () => {
  assert.deepEqual(Object.keys(editorRegistry).sort(), regexToolIds.slice().sort());
  assert.match(entityImageSource, /loading="lazy"/);
  assert.match(entityImageSource, /onError/);
});
```

- [ ] **Step 2: Run the test and verify RED because the registry does not exist**

Run: `env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:regex -w seeding`

- [ ] **Step 3: Define the editor contract and shared image component**

```ts
export interface RegexEditorProps<Data, Settings> {
  data: Data;
  locale: RegexLocale;
  settings: Settings;
  onSettingsChange(settings: Settings): void;
}

export interface EntityImageProps {
  src?: string;
  alt: string;
  fallback: ReactNode;
  size?: number;
}
```

- [ ] **Step 4: Replace generic JSON settings at editor boundaries with named settings interfaces for maps, items, heist, expedition, beasts, tattoos, runegrafts, scarabs, and jewels**

```ts
export interface HeistProfileSettings {
  contractLevels: Record<string, { start: number; end: number }>;
  targetValue: number;
  requireCoinValue: boolean;
}
```

- [ ] **Step 5: Keep the workspace responsible only for loading, profile selection, result rendering, and editor dispatch**

Run: `env COREPACK_ENABLE_PROJECT_SPEC=0 npm run build -w web`

Expected: TypeScript succeeds and `RegexWorkspace` no longer contains tool-specific card markup.

- [ ] **Step 6: Run focused tests and commit**

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:regex -w seeding
git add web/src/features/regex/editors web/src/containers/RegexWorkspace web/src/features/regex/profile seeding/src/regex
git commit -m "refactor(regex): extract typed tool editors"
```

### Task 3: Add gem art and PoB-to-vendor selection

**Files:**
- Create: `web/src/features/regex/editors/VendorEditor.tsx`
- Create: `web/src/features/regex/vendor-build-gems.ts`
- Modify: `web/src/features/regex/data/types.ts`
- Modify: `web/src/features/regex/vendor-gem-catalog.ts`
- Modify: `seeding/src/regex/export-legacy-data.ts`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Test: `seeding/src/regex/vendor-gem-catalog.test.ts`
- Test: `seeding/src/regex/vendor-parity.test.ts`
- Test: `seeding/src/regex/regex-ui.test.ts`

- [ ] **Step 1: Write failing tests for stable ids, icons, grouping, and build matching**

```ts
test("matches imported build gems by game id and reports misses", () => {
  const result = matchBuildGems(
    [{ id: "Metadata/Items/Gems/SkillGemSmite", note: "", count: 1 }],
    [{ id: 7, gameId: "Metadata/Items/Gems/SkillGemSmite", icon: "https://web.poecdn.com/smite.png" }],
  );
  assert.deepEqual(result.selectedTokenIds, [7]);
  assert.deepEqual(result.unknownGameIds, []);
});
```

- [ ] **Step 2: Run vendor tests and verify RED**

Run: `env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:regex -w seeding`

- [ ] **Step 3: Enrich vendor tokens without name-based joins**

```ts
export interface VendorRegexToken extends Omit<RegexToken, "options"> {
  gameId: string;
  icon?: string;
  requiredLevel: number;
  options: { c: VendorGemColor; support: boolean } & Record<string, unknown>;
}
```

- [ ] **Step 4: Implement pure matching that preserves manual selections and returns recognized, already-selected, unavailable, and unknown groups**

```ts
export interface BuildGemMatch {
  selectedTokenIds: number[];
  alreadySelectedTokenIds: number[];
  unavailableGameIds: string[];
  unknownGameIds: string[];
}
```

- [ ] **Step 5: Render 28–32 px lazy gem art in existing color/type/level order and add the localized “Select build gems” report**

Run: `env COREPACK_ENABLE_PROJECT_SPEC=0 npm run build -w web`

- [ ] **Step 6: Run vendor tests and commit**

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:regex -w seeding
git add web seeding
git commit -m "feat(regex): import build gems into vendor search"
```

### Task 4: Restore Heist contract controls

**Files:**
- Create: `web/src/features/regex/editors/HeistEditor.tsx`
- Modify: `web/src/features/regex/heist-contract-labels.ts`
- Modify: `web/src/features/regex/profile/schema.ts`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Test: `seeding/src/regex/content-parity.test.ts`
- Test: `seeding/src/regex/regex-ui.test.ts`

- [ ] **Step 1: Write failing adapter tests for per-contract ranges, target value, and AND/OR mode**

```ts
test("passes visible Heist controls to the compiler", () => {
  const settings = { contractLevels: { Deception: { start: 2, end: 5 } }, targetValue: 1200, requireCoinValue: true };
  const input = heistCompileInput(settings);
  assert.deepEqual(input.contracts, [{ type: "Deception", start: 2, end: 5 }]);
  assert.equal(input.targetValue, 1200);
  assert.equal(input.requireBoth, true);
});
```

- [ ] **Step 2: Run the focused test and verify RED against the current hardcoded `1–1`, `0`, and `false` values**

- [ ] **Step 3: Implement normalized 1–5 ranges, bilingual labels, profession icons, target input, mode toggle, and Gianna presets**

```ts
const normalizeContractLevel = (value: number) => Math.max(1, Math.min(5, Math.trunc(value)));
```

- [ ] **Step 4: Run content/UI tests and commit**

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:regex -w seeding
git add web seeding
git commit -m "feat(regex): restore heist contract levels"
```

### Task 5: Restore maps, items, and jewel compiler parity

**Files:**
- Create: `web/src/features/regex/editors/MapsEditor.tsx`
- Create: `web/src/features/regex/editors/ItemsEditor.tsx`
- Create: `web/src/features/regex/editors/JewelsEditor.tsx`
- Create: `web/src/features/regex/editors/compile-input.ts`
- Modify: `web/src/features/regex/profile/schema.ts`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Test: `seeding/src/regex/map-parity.test.ts`
- Test: `seeding/src/regex/items-flasks-parity.test.ts`
- Test: `seeding/src/regex/content-parity.test.ts`

- [ ] **Step 1: Write failing pure-adapter tests that assert every supported UI field reaches its compiler input**

```ts
test("does not reinterpret item bases as modifiers", () => {
  const input = itemCompileInput({ itembase: "Hubris Circlet", selectedRareMods: ["life"], selectedMagicMods: [] });
  assert.equal(input.baseName, "Hubris Circlet");
  assert.deepEqual(input.rarePatterns, ["life"]);
});
```

- [ ] **Step 2: Verify RED for current generic selection adapters**

- [ ] **Step 3: Implement map bad/good, any/all, numeric, quality, rarity, corruption, identification, and advanced controls**

- [ ] **Step 4: Implement independent item base/rare/magic search plus mode/open-affix controls**

- [ ] **Step 5: Implement regular/abyss jewel modes, any/all, magic-only, prefix/suffix, and open-affix controls**

- [ ] **Step 6: Run parity tests and commit**

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:regex -w seeding
git add web seeding
git commit -m "feat(regex): restore map item and jewel controls"
```

### Task 6: Show valuable Expedition outcomes

**Files:**
- Create: `web/src/features/regex/editors/ExpeditionEditor.tsx`
- Modify: `web/src/features/regex/expedition-catalog.ts`
- Modify: `web/src/features/regex/data/types.ts`
- Test: `seeding/src/regex/content-parity.test.ts`
- Test: `seeding/src/regex/regex-ui.test.ts`

- [ ] **Step 1: Write a failing catalog test for thumbnail eligibility**

```ts
test("shows art only for outcomes meeting the display threshold", () => {
  const outcomes = visibleExpeditionOutcomes(base, prices, 100);
  assert.ok(outcomes.every(({ chaosValue, icon }) => chaosValue >= 100 && icon?.startsWith("https://")));
});
```

- [ ] **Step 2: Verify RED, implement thresholded outcomes, compact cheap names, lazy images, price stamps, and automatic valuable-base selection**

- [ ] **Step 3: Run tests and commit**

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:regex -w seeding
git add web seeding
git commit -m "feat(regex): show valuable expedition outcomes"
```

### Task 7: Build the recipe-aware Bestiary catalog and price check

**Files:**
- Create: `web/src/features/regex/editors/BeastEditor.tsx`
- Create: `web/src/features/regex/bestiary-catalog.ts`
- Create: `web/src/features/regex/trade-links.ts`
- Create: `seeding/src/regex/build-bestiary-data.ts`
- Modify: `seeding/src/regex/export-legacy-data.ts`
- Modify: `seeding/src/regex/verify-generated-data.ts`
- Modify: `web/src/features/regex/data/types.ts`
- Modify: `web/src/features/regex/core/content.ts`
- Modify: `web/src/features/regex/profile/schema.ts`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Test: `seeding/src/regex/bestiary-data.test.ts`
- Test: `seeding/src/regex/content-parity.test.ts`
- Test: `seeding/src/regex/regex-ui.test.ts`

- [ ] **Step 1: Write failing data-contract tests for current recipes, descriptions, absent-price handling, freshness, and safe links**

```ts
test("rejects the obsolete 30 percent map-quality recipe", () => {
  assert.ok(beasts.every(({ recipe }) => !/30% base Quality/i.test(recipe.effectEn)));
});

test("never invents a beast price", () => {
  assert.ok(beasts.every(({ chaosValue }) => chaosValue === undefined || chaosValue >= 0));
});
```

- [ ] **Step 2: Run the new test and verify RED against the legacy shard**

- [ ] **Step 3: Define recipe-oriented data with source and market provenance**

```ts
export interface BeastRecipeEntry {
  beastId: string;
  name: string;
  icon?: string;
  regex: string;
  red: boolean;
  harvest: boolean;
  recipe: { effect: string; effectEn: string; fillers: number; requiredBeastIds: string[] };
  chaosValue?: number;
  resultChaosValue?: number;
}
```

- [ ] **Step 4: Generate deterministic RU/EN entries from audited current recipe data and a pinned market snapshot; include league, source URL, and timestamp**

- [ ] **Step 5: Implement estimated input cost and spread as pure functions; return `null` when any mandatory price is absent**

```ts
export const estimatedSpread = (recipe: BeastRecipeEntry, fillerPrice: number): number | null => {
  if (recipe.chaosValue === undefined || recipe.resultChaosValue === undefined) return null;
  return recipe.resultChaosValue - recipe.chaosValue - recipe.recipe.fillers * fillerPrice;
};
```

- [ ] **Step 6: Implement safe official trade/Wiki links and bounded merchant-tab regex aggregation**

- [ ] **Step 7: Render recipe effect, components, price source/time, separate gold note, spread warning, price-check buttons, and retained Harvest/red/value/menagerie controls**

- [ ] **Step 8: Run data, content, UI, and URL tests and commit**

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:regex -w seeding
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run regex:data:verify -w seeding
git add web seeding
git commit -m "feat(regex): add bestiary recipes and price checks"
```

### Task 8: Restore tattoo effects and market controls

**Files:**
- Create: `web/src/features/regex/editors/TattooEditor.tsx`
- Create: `web/src/features/regex/editors/RunegraftEditor.tsx`
- Create: `web/src/features/regex/editors/ScarabEditor.tsx`
- Modify: `seeding/src/regex/export-legacy-data.ts`
- Modify: `web/src/features/regex/data/types.ts`
- Modify: `web/src/features/regex/profile/schema.ts`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Test: `seeding/src/regex/content-parity.test.ts`
- Test: `seeding/src/regex/data-contract.test.ts`

- [ ] **Step 1: Write failing tests requiring a non-empty localized tattoo effect and real optional prices**

```ts
test("every tattoo explains its effect", () => {
  assert.ok(tattoos.entries.every(({ description }) => typeof description === "string" && description.trim().length > 0));
});
```

- [ ] **Step 2: Verify RED, enrich tattoo data, and implement effect rows plus min/max filters**

- [ ] **Step 3: Restore min/max controls and bulk selection for runegrafts and scarabs without changing their existing art/description ordering**

- [ ] **Step 4: Run tests and commit**

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:regex -w seeding
git add web seeding
git commit -m "feat(regex): restore tattoo and market details"
```

### Task 9: Audit flasks, localization, accessibility, and responsive layout

**Files:**
- Create: `web/src/features/regex/editors/FlaskEditor.tsx`
- Modify: `web/src/containers/RegexWorkspace/styles.module.css`
- Modify: `web/src/features/regex/editors/shared/styles.module.css`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Test: `seeding/src/regex/items-flasks-parity.test.ts`
- Test: `seeding/src/regex/regex-ui.test.ts`

- [ ] **Step 1: Add failing source/behavior tests for all flask fields, image fallback, visible focus, explicit dimensions, and 390 px rules**

- [ ] **Step 2: Verify RED and move the existing complete flask behavior into its typed editor without changing compiler semantics**

- [ ] **Step 3: Audit RU/EN message parity, “рунограммы”, recipe/effect terminology, labels, and alt text**

- [ ] **Step 4: Build at 390, 500, and desktop widths; fix overflow with the existing responsive grid**

Run: `env COREPACK_ENABLE_PROJECT_SPEC=0 npm run build -w web`

- [ ] **Step 5: Run regex and i18n tests and commit**

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:i18n -w seeding
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:regex -w seeding
git add web seeding
git commit -m "fix(regex): finish localization and responsive polish"
```

### Task 10: Full verification, review, and public deployment

**Files:**
- Modify only files required by verified review findings.

- [ ] **Step 1: Review the complete diff for correctness, simplicity, project conventions, and test gaps**

Run: `git diff main...HEAD --check`

Run: `git diff --stat main...HEAD`

- [ ] **Step 2: Run the complete verification suite from a clean worktree**

Run: `env COREPACK_ENABLE_PROJECT_SPEC=0 npm run verify`

Expected: all i18n and regex tests pass, 22 current shards verify, production build succeeds, and bundle budgets pass.

- [ ] **Step 3: Run browser smoke checks**

Verify manually at desktop and 390 px:

```text
/regex/vendor      PoB selection report, gem art, A/B copy
/regex/heist       per-contract ranges and target mode
/regex/expedition  expensive unique thumbnails only
/regex/beast       recipe, components, prices, trade links, merchant regex
/regex/tattoo      localized effects
/regex/maps        restored numeric and good/bad controls
/regex/items       independent bases and mods
/regex/jewels      regular/abyss modes
```

- [ ] **Step 4: Fix only reproducible findings with a new failing test first, then rerun `npm run verify`**

- [ ] **Step 5: Commit final verified fixes**

```bash
git add web seeding scripts docs
git commit -m "test(regex): verify production tool parity"
```

- [ ] **Step 6: Merge to main, push, wait for the Pages workflow, and smoke-test the deployed URL with the deployment SHA query parameter**

Expected: GitHub Actions succeeds and all eleven public routes load without stale-chunk recovery or console errors.
