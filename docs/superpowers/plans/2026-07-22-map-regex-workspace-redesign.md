# Map Regex Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the map regex workspace with the approved semantic-block layout while preserving profiles and making every generated request exact under PoE 1's 250-character limit.

**Architecture:** Keep `MapRegexSettings` and `compileMapRegex` as the state and compiler contracts. Move map-specific view logic from the shared workspace into a focused `MapEditor` component, keep state transitions in pure helpers, and harden the shared A/B splitter so every secondary result declares a provably correct `union` or `intersection` composition.

**Tech Stack:** React 19, TypeScript, CSS Modules, Node test runner with `tsx`, Vite 8, existing i18n/profile/regex infrastructure.

---

## File Structure

- Create `web/src/features/regex/editors/map-editor-state.ts`: pure transformations between UI modes and `MapRegexSettings`.
- Create `web/src/features/regex/editors/MapEditor.tsx`: approved variant A controls and modifier grid.
- Create `web/src/features/regex/editors/MapEditor.module.css`: map-only responsive layout and state colours.
- Modify `web/src/features/regex/core/types.ts`: declare A/B composition on compile results.
- Modify `web/src/features/regex/core/two-pass.ts`: split only when union/intersection semantics are provable.
- Modify `web/src/features/regex/core/maps.ts`: preserve exact thresholds and use the hardened split result.
- Modify `web/src/features/regex/editors/compile-input.ts`: normalize conflicting legacy map selections deterministically.
- Modify `web/src/containers/RegexWorkspace/index.tsx`: delegate map rendering and present composition-aware output.
- Modify `web/src/containers/RegexWorkspace/styles.module.css`: keep shared output first and remove obsolete map styles.
- Modify `web/src/i18n/messages/en.json` and `web/src/i18n/messages/ru.json`: exact labels and A/B instructions.
- Modify `seeding/src/regex/core-contract.test.ts`: semantic splitter regression coverage.
- Modify `seeding/src/regex/map-parity.test.ts`: exact map compiler and quality behaviour.
- Modify `seeding/src/regex/profile-migration.test.ts`: old-profile round trip.
- Modify `seeding/src/regex/regex-ui.test.ts`: source/UI/i18n structure contract.

### Task 1: Make A/B composition semantically explicit

**Files:**
- Modify: `web/src/features/regex/core/types.ts`
- Modify: `web/src/features/regex/core/two-pass.ts`
- Test: `seeding/src/regex/core-contract.test.ts`

- [ ] **Step 1: Write failing tests for union, intersection, and unsafe mixed splits**

Add cases that require the returned composition and reject splitting a positive OR clause across an AND expression:

```ts
test("declares union for a split positive alternation", () => {
  const result = splitRegexIntoTwoPasses('"alpha|beta|gamma"', 13);
  assert.equal(result.composition, "union");
  assert.ok(result.secondary);
});

test("declares intersection for negated alternatives and whole AND clauses", () => {
  assert.equal(
    splitRegexIntoTwoPasses('"!alpha|beta|gamma"', 13).composition,
    "intersection",
  );
  assert.equal(
    splitRegexIntoTwoPasses('"alpha|beta" gamma', 13).composition,
    "intersection",
  );
});

test("blocks a mixed split that would change boolean semantics", () => {
  const result = splitRegexIntoTwoPasses('"alpha|beta|gamma" delta', 13);
  assert.equal(result.secondary, undefined);
  assert.equal(result.diagnostics[0]?.code, "unsafe-composition");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 node --import tsx --test seeding/src/regex/core-contract.test.ts
```

Expected: FAIL because `composition` and `unsafe-composition` do not exist and the current splitter divides all alternatives indiscriminately.

- [ ] **Step 3: Add composition types**

Extend the compile contract:

```ts
export type RegexPassComposition = "union" | "intersection";

export interface RegexCompileResult {
  primary: string;
  secondary?: string;
  composition?: RegexPassComposition;
  length: number;
  diagnostics: RegexDiagnostic[];
}
```

Add `"unsafe-composition"` to `RegexDiagnosticCode`.

- [ ] **Step 4: Replace atom-only splitting with clause-aware units**

Implement these exact rules in `splitRegexIntoTwoPasses`:

```ts
const clauseAlternatives = clauses.map((clause, clauseIndex) => ({
  clause,
  clauseIndex,
  alternatives: splitTopLevelAlternatives(clause.pattern),
}));

const oneClause = clauseAlternatives.length === 1;
const composition = oneClause && !clauses[0].negated ? "union" : "intersection";

if (!oneClause) {
  const oversizedPositiveOr = clauseAlternatives.find(({ clause, alternatives }) =>
    !clause.negated && alternatives.length > 1 &&
    serializeAtoms(alternatives.map((pattern) => ({
      clauseIndex: 0,
      negated: false,
      pattern,
    }))).length > maxLength,
  );
  if (oversizedPositiveOr) {
    return {
      primary: expression,
      length: expression.length,
      diagnostics: blocking(
        "unsafe-composition",
        "Expression mixes AND with an oversized OR clause and cannot be split without changing its meaning.",
      ),
    };
  }
}
```

For multiple clauses, keep every positive clause as one unit and allow negated alternatives to become independent intersection units. Return `composition` only when `secondary` exists.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the Task 1 command. Expected: all core-contract tests PASS with deterministic A/B output.

- [ ] **Step 6: Commit Task 1**

Commit subject:

```text
fix(regex): preserve semantics across A/B passes
```

### Task 2: Add pure map-editor state transitions and legacy normalization

**Files:**
- Create: `web/src/features/regex/editors/map-editor-state.ts`
- Modify: `web/src/features/regex/editors/compile-input.ts`
- Test: `seeding/src/regex/profile-migration.test.ts`
- Test: `seeding/src/regex/map-parity.test.ts`

- [ ] **Step 1: Write failing tests for tri-state flags, rarity floor, and mod exclusivity**

Import the new helpers and add:

```ts
test("map editor exposes exact tri-state flag modes", () => {
  const defaults = createDefaultMapSettings();
  assert.equal(mapFlagMode(defaults.corrupted), "any");
  assert.deepEqual(applyMapFlagMode(defaults.corrupted, "only"), {
    enabled: true,
    include: true,
  });
  assert.deepEqual(applyMapFlagMode(defaults.corrupted, "exclude"), {
    enabled: true,
    include: false,
  });
});

test("map editor never leaves zero rarities or conflicting mod ids", () => {
  const defaults = createDefaultMapSettings();
  const rareOnly = { normal: false, magic: false, rare: true, include: true };
  assert.deepEqual(toggleMapRarity(rareOnly, "rare"), rareOnly);

  const required = setMapModMode(
    { ...defaults, badIds: [10], goodIds: [] },
    10,
    "require",
  );
  assert.deepEqual(required.badIds, []);
  assert.deepEqual(required.goodIds, [10]);
});
```

Add a normalization test with the same signed ID in `badIds` and `goodIds`; expected policy is that `goodIds` wins and the ID is removed from `badIds`.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 node --import tsx --test seeding/src/regex/profile-migration.test.ts seeding/src/regex/map-parity.test.ts
```

Expected: FAIL because the state module does not exist and conflicting IDs are currently preserved.

- [ ] **Step 3: Implement pure state helpers**

Create:

```ts
import type { MapRegexSettings } from "../core/maps.js";

export type MapFlagMode = "any" | "only" | "exclude";
export type MapModMode = "ignore" | "exclude" | "require";

export function mapFlagMode(value: { enabled: boolean; include: boolean }): MapFlagMode {
  return !value.enabled ? "any" : value.include ? "only" : "exclude";
}

export function applyMapFlagMode(
  value: { enabled: boolean; include: boolean },
  mode: MapFlagMode,
) {
  return mode === "any"
    ? { ...value, enabled: false }
    : { enabled: true, include: mode === "only" };
}

export function toggleMapRarity(
  rarity: MapRegexSettings["rarity"],
  key: "normal" | "magic" | "rare",
) {
  const next = { ...rarity, [key]: !rarity[key] };
  return next.normal || next.magic || next.rare ? next : rarity;
}

export function setMapModMode(
  settings: MapRegexSettings,
  id: number,
  mode: MapModMode,
): MapRegexSettings {
  return {
    ...settings,
    badIds: mode === "exclude"
      ? [...settings.badIds.filter((value) => value !== id), id]
      : settings.badIds.filter((value) => value !== id),
    goodIds: mode === "require"
      ? [...settings.goodIds.filter((value) => value !== id), id]
      : settings.goodIds.filter((value) => value !== id),
  };
}
```

- [ ] **Step 4: Normalize conflicting persisted IDs**

In `normalizeMapEditorSettings`, deduplicate both arrays and remove every `goodId` from `badIds` before returning. Keep all other legacy fields, including the old optimization flags, so saved profiles remain readable even though those flags leave the main UI.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the Task 2 command. Expected: all selected tests PASS.

- [ ] **Step 6: Commit Task 2**

Commit subject:

```text
refactor(regex): model map editor states explicitly
```

### Task 3: Preserve exact map thresholds and quality semantics

**Files:**
- Modify: `web/src/features/regex/core/maps.ts`
- Test: `seeding/src/regex/map-parity.test.ts`

- [ ] **Step 1: Write failing exactness and quality-composition tests**

Add tests proving the new UI contract:

```ts
test("map thresholds stay exact when legacy optimization flags are present", async () => {
  const data = await loadRegexData("maps", "en");
  const settings = createDefaultMapSettings();
  settings.quantity = "85";
  settings.optimizeQuant = true;
  const result = compileMapRegex(settings, data.mods, "en");
  assert.equal(matchesSearchExpression(result.primary, "Item Quantity: +84%"), false);
  assert.equal(matchesSearchExpression(result.primary, "Item Quantity: +85%"), true);
});

test("quality reward mode applies OR or AND only to populated fields", async () => {
  const data = await loadRegexData("maps", "en");
  const settings = createDefaultMapSettings();
  settings.quality.currency = "20";
  settings.quality.divination = "30";
  settings.anyQuality = true;
  const either = compileMapRegex(settings, data.mods, "en");
  assert.equal(matchesSearchExpression(either.primary, "Currency: +25%"), true);
  settings.anyQuality = false;
  const both = compileMapRegex(settings, data.mods, "en");
  assert.equal(matchesSearchExpression(both.primary, "Currency: +25%"), false);
});
```

- [ ] **Step 2: Run map tests and verify RED**

Run the map-parity test command. Expected: the exactness case FAILS because `optimizeQuant` rounds 85 down to 80.

- [ ] **Step 3: Remove implicit rounding from compilation**

Keep the persisted fields for compatibility, but call `generateNumberRegex` with `false` for quantity, pack size, item rarity, map drop chance, and every quality reward. Do not delete old profile keys in this task.

- [ ] **Step 4: Run map tests and verify GREEN**

Run the Task 3 test. Expected: exact threshold and OR/AND tests PASS in EN and existing RU tests remain green.

- [ ] **Step 5: Commit Task 3**

Commit subject:

```text
fix(regex): keep map thresholds exact
```

### Task 4: Build the approved map editor component

**Files:**
- Create: `web/src/features/regex/editors/MapEditor.tsx`
- Create: `web/src/features/regex/editors/MapEditor.module.css`
- Modify: `web/src/containers/RegexWorkspace/index.tsx`
- Modify: `web/src/containers/RegexWorkspace/styles.module.css`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Test: `seeding/src/regex/regex-ui.test.ts`

- [ ] **Step 1: Write a failing UI source contract**

Extend `regex-ui.test.ts` to require the focused component and forbid the old ambiguous labels in its map branch:

```ts
test("map workspace uses semantic sections and exclusive controls", () => {
  const editor = readFileSync(
    resolve(webRoot, "src/features/regex/editors/MapEditor.tsx"),
    "utf8",
  );
  assert.match(editor, /mapThresholds/);
  assert.match(editor, /qualityRewards/);
  assert.match(editor, /MapFlagMode/);
  assert.match(editor, /setMapModMode/);
  assert.doesNotMatch(editor, /optimizeQuant|optimizePacksize|optimizeQuality/);
});
```

- [ ] **Step 2: Run the UI test and verify RED**

Run:

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 node --import tsx --test seeding/src/regex/regex-ui.test.ts
```

Expected: FAIL because `MapEditor.tsx` does not exist.

- [ ] **Step 3: Create the component contract**

Use this prop boundary:

```ts
interface MapEditorProps {
  locale: "en" | "ru";
  options: Array<{ id: string; label: string; nightmare: boolean }>;
  query: string;
  setQuery(value: string): void;
  settings: MapRegexSettings;
  update(settings: MapRegexSettings): void;
  reset(): void;
}
```

Update `mapModOptions` so every option exposes `nightmare: token.options.nm === true` instead of discarding that data.

- [ ] **Step 4: Render the two approved semantic panels**

`MapEditor` renders:

```tsx
<div className={styles.thresholdGrid}>
  <fieldset className={styles.panel}>
    <legend>{t("regex.workspace.maps.mapThresholds")}</legend>
    {mapThresholdFields.map(({ key, label }) => (
      <label className={styles.numberField} key={key}>
        <span>{t(label)}</span>
        <input
          inputMode="numeric"
          value={settings[key]}
          onChange={(event) => update({ ...settings, [key]: event.target.value })}
        />
      </label>
    ))}
  </fieldset>
  <fieldset className={`${styles.panel} ${styles.qualityPanel}`}>
    <legend>{t("regex.workspace.maps.qualityRewards")}</legend>
    <div role="group" aria-label={t("regex.workspace.maps.qualityMode")}>
      <button aria-pressed={settings.anyQuality} type="button">{t("regex.workspace.maps.qualityAny")}</button>
      <button aria-pressed={!settings.anyQuality} type="button">{t("regex.workspace.maps.qualityAll")}</button>
    </div>
    <p>{t(settings.anyQuality
      ? "regex.workspace.maps.qualityAnyHelp"
      : "regex.workspace.maps.qualityAllHelp")}</p>
    {qualityFields}
  </fieldset>
</div>
```

Use actual mapped field arrays in the file; do not duplicate ten input handlers.

- [ ] **Step 5: Render map format as explicit modes**

Use native radio groups for `any`, `only`, and `exclude`. Render rarity as three pressed buttons and call `toggleMapRarity`, leaving the final selected rarity active.

- [ ] **Step 6: Render three-state modifier cards**

Each card uses a radio group with `ignore`, `exclude`, and `require`, calls `setMapModMode`, applies `data-mode`, and displays a visible Nightmare badge when `option.nightmare` is true. Keep hidden Nightmare selections in settings; filter only the displayed/compiled option set.

- [ ] **Step 7: Replace the inline maps branch**

Import `MapEditor` into `RegexWorkspace`, pass the current settings/update/query/reset dependencies, and delete the old map advanced-settings and `mapGrid` branches. Keep other tools byte-for-byte unchanged.

- [ ] **Step 8: Add exact RU/EN messages**

Add matching keys for:

```text
mapThresholds, qualityRewards, qualityMode, qualityAny, qualityAll,
qualityAnyHelp, qualityAllHelp, mapFormat, any, onlyCorrupted,
excludeCorrupted, onlyUnidentified, excludeUnidentified,
ignore, exclude, require, nightmareBadge, requiredModeAny, requiredModeAll
```

Russian labels use the approved wording from the design document; English labels are concise direct equivalents.

- [ ] **Step 9: Implement the approved CSS layout**

Use a two-column `.thresholdGrid`, a blue accent on `.qualityPanel`, compact `.formatGrid`, three-column `.modGrid`, and `data-mode="exclude"/"require"` red/green borders. At `max-width: 54rem`, collapse panels and cards without horizontal overflow. Do not add a sidebar.

- [ ] **Step 10: Run UI, i18n, and build checks**

Run:

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 node --import tsx --test seeding/src/regex/regex-ui.test.ts
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:i18n
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run build -w web
```

Expected: all commands PASS.

- [ ] **Step 11: Commit Task 4**

Commit subject:

```text
feat(regex): redesign the map workspace
```

### Task 5: Make output composition and advanced input explicit

**Files:**
- Modify: `web/src/containers/RegexWorkspace/index.tsx`
- Modify: `web/src/containers/RegexWorkspace/styles.module.css`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Test: `seeding/src/regex/regex-ui.test.ts`

- [ ] **Step 1: Write failing tests for composition guidance and the advanced field**

Require localized keys and source branches for `result.composition === "union"` and `"intersection"`, plus a `<details>` control for the custom map expression.

- [ ] **Step 2: Run UI and i18n tests and verify RED**

Run the UI test and `npm run test:i18n`. Expected: FAIL on missing source branches/message keys.

- [ ] **Step 3: Render one or two result blocks with exact instructions**

When `secondary` exists, show both copy controls and one localized help line:

```tsx
{result.secondary && result.composition && (
  <p className={styles.notice}>
    {t(result.composition === "union"
      ? "regex.workspace.output.unionHelp"
      : "regex.workspace.output.intersectionHelp")}
  </p>
)}
```

Use `REGEX_CHARACTER_LIMIT` instead of a duplicated literal `250` for both length counters.

- [ ] **Step 4: Move custom map text into a collapsed advanced control**

Render only for maps:

```tsx
<details className={styles.customCondition} open={mapSettings.customText.value.length > 0}>
  <summary>{t("regex.workspace.maps.custom")}</summary>
  <label>
    <input
      type="checkbox"
      checked={mapSettings.customText.enabled}
      onChange={() => updateMaps({
        ...mapSettings,
        customText: { ...mapSettings.customText, enabled: !mapSettings.customText.enabled },
      })}
    />
    {t("regex.workspace.maps.customEnabled")}
  </label>
  <input
    value={mapSettings.customText.value}
    onChange={(event) => updateMaps({
      ...mapSettings,
      customText: { ...mapSettings.customText, value: event.target.value },
    })}
  />
</details>
```

- [ ] **Step 5: Run UI, i18n, and web build checks**

Expected: UI test, exact locale parity, TypeScript, and Vite build all PASS.

- [ ] **Step 6: Commit Task 5**

Commit subject:

```text
feat(regex): explain multi-pass map results
```

### Task 6: Complete regression, browser, and public release verification

**Files:**
- Modify only if a verification failure identifies an in-scope defect.

- [ ] **Step 1: Run the complete local release gate**

Run:

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run verify
```

Expected: 112 i18n tests plus the expanded regex suite PASS, 22 shards verify, production build succeeds, initial JS stays below 256000 gzip bytes, and regex data stays below 20 MiB raw.

- [ ] **Step 2: Start a production preview**

Run:

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run preview -w web -- --host 127.0.0.1 --port 4176
```

- [ ] **Step 3: Smoke-test desktop behaviour**

At `#/regex/maps`, verify with browser automation:

- quality fields switch between OR and AND output;
- Nightmare toggle changes 118 visible cards to 78 and restores them;
- each card has exactly one active state;
- corrupted/unidentified radio groups compile all three modes;
- no request exceeds 250 characters;
- A/B help matches `union` or `intersection`;
- reload restores the profile;
- console errors and broken resources are zero.

- [ ] **Step 4: Smoke-test mobile behaviour**

Resize to `390x844`; confirm one-column panels/cards, reachable copy controls, visible focus, and `scrollWidth === clientWidth`.

- [ ] **Step 5: Review the final diff**

Run:

```bash
git diff --check
git status --short --branch
git diff --stat
```

Expected: only planned files changed, no whitespace errors, no generated browser artifacts staged.

- [ ] **Step 6: Commit any verification-only correction**

Use a separate `fix(regex): ...` commit only if Step 1–4 exposed a real defect. Do not create an empty cleanup commit.

- [ ] **Step 7: Push and deploy**

Push the completed branch to `main` according to the established repository flow. If the push trigger does not enqueue `build-and-deploy.yml`, trigger it manually with `workflow_dispatch`.

- [ ] **Step 8: Verify GitHub Pages**

Open:

```text
https://simonerrror.github.io/exile-leveling/?deploy=<final-sha>#/regex/maps
```

Clear the previous service worker in the smoke-test browser, repeat the desktop toggle/output checks, and confirm the workflow head SHA equals the final commit.
