# PoE Tools Regex Core and Data Implementation Plan

> **Execution:** Use `superpowers:executing-plans` and `superpowers:test-driven-development`. Keep every production change behind a failing test and commit only green increments.

**Goal:** Move the reusable RU/EN regex behavior, profile state, compatibility fixtures, and generated runtime data from `poe-regex-ru` into the canonical PoE Tools repository without importing the CRA shell or its static 39 MB TypeScript payload.

**Architecture:** Put pure compilers and schemas under `web/src/features/regex`, tests and deterministic export tooling under `seeding/src/regex`, and committed runtime data under `web/src/features/regex/data/generated`. Every tool receives its own locale-specific JSON shard through a dynamic loader. Only English and Russian ship. The old repository remains a read-only extraction source until cutover.

**Measured shell baseline:** `npm run verify` reports 179,060 bytes gzip for the static entry graph, zero production sourcemaps, and 111 passing tests. This baseline must not rise by more than 5 KB before any regex route is visited.

---

## Final file map

- `web/src/features/regex/core/types.ts` — shared locale, token, result, diagnostics, and 250-character policy types.
- `web/src/features/regex/core/search-expression.ts` — parser and matcher ported from legacy `SearchExpression.ts`.
- `web/src/features/regex/core/bounded-alternation.ts` — safe bounded alternation compiler.
- `web/src/features/regex/core/safe-cover.ts` — exact-cover optimizer with deterministic greedy fallback.
- `web/src/features/regex/core/two-pass.ts` — generic 250-character A/B splitter and diagnostics.
- `web/src/features/regex/core/vendor.ts` — vendor regex compiler with link-count filters limited to 4/5/6.
- `web/src/features/regex/core/maps.ts` — map regex compiler using the generic A/B splitter.
- `web/src/features/regex/core/content.ts` — pure helpers for map names, Heist, Expedition, Bestiary, Scarabs, Tattoos, Runegrafts, and Jewels.
- `web/src/features/regex/core/flasks.ts` — pure flask output compiler.
- `web/src/features/regex/core/items.ts` — pure item output compiler.
- `web/src/features/regex/profile/schema.ts` — versioned, serializable profile schema without colored socket-link fields.
- `web/src/features/regex/profile/migration.ts` — idempotent legacy `profiles` migration.
- `web/src/features/regex/profile/storage.ts` — safe load/save/import/export for `poe-tools.regex.profiles`.
- `web/src/features/regex/data/types.ts` — JSON-shard structural types.
- `web/src/features/regex/data/loaders.ts` — explicit dynamic imports per tool and locale.
- `web/src/features/regex/data/generated/*.json` — committed route-level EN/RU runtime shards.
- `web/src/features/regex/data/generated/manifest.json` — source hashes, output hashes, counts, and generator version.
- `seeding/src/regex/export-legacy-data.ts` — deterministic extractor accepting `--source <legacy-repo>`.
- `seeding/src/regex/verify-generated-data.ts` — source-independent verifier for committed shards and manifest hashes.
- `seeding/src/regex/fixtures/legacy-parity.json` — audited RU/EN input/output fixtures for all twelve tools.
- `seeding/src/regex/*.test.ts` — Node tests for primitives, compilers, migration, data manifest, lazy isolation, and parity.
- `seeding/package.json` — explicit regex test list and extraction command.
- `package.json` — `test:regex` and `regex:data:verify` root scripts included in `verify`.

## Source allowlist

The extractor may read only these legacy runtime sources and their type-only dependencies:

- `src/generated/gems/Generated.Gems.English.ts`
- `src/generated/gems/Generated.Gems.Russian.ts`
- `src/generated/mapmods/Generated.MapModsV3.ENGLISH.ts`
- `src/generated/mapmods/Generated.MapModsV3.RUSSIAN.ts`
- `src/generated/GeneratedItemMods.ts`
- `src/generated/GeneratedItemBases.ts`
- `src/generated/repoe/GeneratedRussianItems.ts`
- `src/generated/GeneratedFlaskMods.ts`
- `src/generated/repoe/GeneratedRussianFlaskMods.ts`
- `src/generated/GeneratedExpedition.ts`
- `src/generated/GeneratedHeist.ts`
- `src/generated/GeneratedBeastRegex.ts`
- `src/generated/GeneratedScarabs.ts`
- `src/generated/GeneratedTattoo.ts`
- `src/generated/GeneratedRunegraft.ts`
- `src/generated/GeneratedJewel.ts`
- `src/generated/GeneratedMapNames.ts`
- `src/generated/repoe/GeneratedRussianContent.ts`
- `src/generated/mapmods/trade/TradeStatIdMatching.json`

Explicitly reject `GeneratedBilingualStats.ts`, `GeneratedBilingualDirect.ts`, every non-EN/RU map language, `GeneratedMagicItem.ts`, image assets, CRA entrypoints, React components, CSS, and sourcemaps.

### Task 1: Establish regex test and fixture contracts

**Files:**
- Create: `seeding/src/regex/core-contract.test.ts`
- Create: `seeding/src/regex/profile-migration.test.ts`
- Create: `seeding/src/regex/data-contract.test.ts`
- Modify: `seeding/package.json`
- Modify: `package.json`

- [ ] Add a separate `test:regex` script in `seeding` with an explicit `tsx --test` file list; do not add regex tests to `test:i18n`, and do not introduce Jest or Testing Library.
- [ ] Add root passthrough scripts `test:regex` and `regex:data:verify`, and include both in `verify` before `build:web`.
- [ ] In `core-contract.test.ts`, define red contracts for a 250-character default limit, deterministic A/B output, invalid-regex rejection, exact EN/RU fixture matching, and stable diagnostics.
- [ ] In `profile-migration.test.ts`, define red contracts showing that legacy colored-link booleans, two/three-link booleans, six-socket, and custom color-link fields disappear; only selected 4/5/6 link counts survive.
- [ ] In `data-contract.test.ts`, define red contracts for the exact 24 JSON shards (12 tools × 2 locales), manifest hash validation, safe relative paths, and absence of forbidden source names.
- [ ] Run `npm run test:regex`; confirm failure because target modules and fixtures are absent.

### Task 2: Port the pure regex primitives

**Files:**
- Create: `web/src/features/regex/core/types.ts`
- Create: `web/src/features/regex/core/search-expression.ts`
- Create: `web/src/features/regex/core/bounded-alternation.ts`
- Create: `web/src/features/regex/core/safe-cover.ts`
- Modify: `seeding/src/regex/core-contract.test.ts`

- [ ] Port behavior, not formatting, from legacy `SearchExpression.ts`, `BoundedAlternation.ts`, and `SafeCoverOptimizer.ts`.
- [ ] Replace legacy generated-type imports with local structural types.
- [ ] Add edge cases for escaped quotes, brackets, parentheses, duplicate ids, missing corpus ids, invalid candidates, and the deterministic >20-item greedy path.
- [ ] Run `npm run test:regex`; all primitive tests pass while compiler tests remain red.
- [ ] Commit:

```bash
git add seeding/src/regex/core-contract.test.ts seeding/package.json package.json web/src/features/regex/core
git commit -m "feat(regex): port safe regex primitives"
```

### Task 3: Add the shared 250-character A/B policy

**Files:**
- Create: `web/src/features/regex/core/two-pass.ts`
- Modify: `web/src/features/regex/core/types.ts`
- Modify: `seeding/src/regex/core-contract.test.ts`

- [ ] Define `REGEX_CHARACTER_LIMIT = 250` and `RegexCompileResult { primary, secondary?, length, diagnostics }`.
- [ ] Move the top-level alternative parser and bin packing out of legacy `MapRegexCompiler.ts` into a generic pure function.
- [ ] Preserve clause negation and quoted alternatives; never split inside escaped text, brackets, or parentheses.
- [ ] If one atomic clause exceeds 250, return the unsplit expression plus a blocking diagnostic rather than silently truncating.
- [ ] If two bins cannot fit, return the original expression and a blocking diagnostic.
- [ ] Run `npm run test:regex`; verify exact A/B fixtures and deterministic ordering.
- [ ] Commit:

```bash
git add web/src/features/regex/core/two-pass.ts web/src/features/regex/core/types.ts seeding/src/regex/core-contract.test.ts
git commit -m "feat(regex): enforce two-pass character limit"
```

### Task 4: Define and migrate the profile schema

**Files:**
- Create: `web/src/features/regex/profile/schema.ts`
- Create: `web/src/features/regex/profile/migration.ts`
- Create: `web/src/features/regex/profile/storage.ts`
- Modify: `seeding/src/regex/profile-migration.test.ts`

- [ ] Define schema version 2 with `locale: "en" | "ru"`, named profiles, and serializable settings for all twelve tools.
- [ ] Define vendor `linkCounts: Array<4 | 5 | 6>`; do not define any colored-link, socket-color, two-link, three-link, custom-link, or six-socket property.
- [ ] Convert old `anyFourLink`, `anyFiveLink`, and `anySixLink` booleans to sorted unique `linkCounts`.
- [ ] Preserve unrelated recognized settings, drop unknown/non-serializable values, clamp numeric ranges, and use immutable defaults.
- [ ] Read legacy keys `profiles` and `selectedProfile` only when the new key is absent. Write `poe-tools.regex.profiles` only after complete validation.
- [ ] Make migration idempotent: applying it twice produces byte-identical JSON and never reintroduces removed fields.
- [ ] Keep legacy storage untouched until a successful new write, allowing rollback during the pre-cutover period.
- [ ] Test malformed JSON, null roots, prototype keys, duplicate profile names, invalid locale, invalid link counts, and partial profiles.
- [ ] Run `npm run test:regex` and commit:

```bash
git add web/src/features/regex/profile seeding/src/regex/profile-migration.test.ts
git commit -m "feat(regex): migrate profiles without colored links"
```

### Task 5: Build the deterministic legacy data extractor

**Files:**
- Create: `seeding/src/regex/export-legacy-data.ts`
- Create: `seeding/src/regex/verify-generated-data.ts`
- Create: `seeding/src/regex/export-utils.ts`
- Create: `seeding/src/regex/source-allowlist.ts`
- Modify: `seeding/src/regex/data-contract.test.ts`
- Modify: `seeding/package.json`

- [ ] Require an explicit absolute `--source` directory and reject missing `.git`, `package.json`, or allowlisted files.
- [ ] Resolve and hash every allowlisted input before importing it. Reject symlinks escaping the source root.
- [ ] Import TypeScript with the existing trusted `tsx` loader; do not install a parser or generator dependency.
- [ ] Serialize only runtime exports needed by the twelve tools. Use stable code-unit key ordering and a final newline.
- [ ] Emit exactly these base names for both `.en.json` and `.ru.json`: `vendor`, `maps`, `items`, `mapnames`, `flasks`, `heist`, `expedition`, `beast`, `scarabs`, `tattoos`, `runegrafts`, `jewels`.
- [ ] Split the large items payload internally into `bases`, `mods`, and `translations` properties so the later UI can defer detailed mod tables after the route shell.
- [ ] Write through a temporary directory and rename only after every shard and hash validates; a failed export must leave checked-in data untouched.
- [ ] Emit `manifest.json` with generator version, input SHA-256, output SHA-256, byte size, record count, locale, and tool id. Do not embed timestamps.
- [ ] Make `verify-generated-data.ts` validate the checked-in manifest, shard hashes, sizes, counts, filenames, and forbidden names without reading the legacy repository.
- [ ] Wire `regex:data:verify` to that source-independent verifier; keep regeneration as a separate explicit command requiring `--source`.
- [ ] Run the exporter against `/Users/sergio/Documents/30_HOBBY_AI/projects/poe/poe-regex-ru`, then rerun and verify a zero diff.
- [ ] Run `npm run test:regex` and commit extractor plus generated JSON in one reviewed commit:

```bash
git add seeding/src/regex web/src/features/regex/data/generated
git commit -m "data(regex): export deterministic EN RU shards"
```

### Task 6: Add typed dynamic data loaders

**Files:**
- Create: `web/src/features/regex/data/types.ts`
- Create: `web/src/features/regex/data/loaders.ts`
- Modify: `seeding/src/regex/data-contract.test.ts`

- [ ] Define structural validation for every shard at the boundary; never trust parsed JSON solely because TypeScript inferred it.
- [ ] Implement an explicit loader table where every cell is a literal dynamic import, for example `maps.en -> import("./generated/maps.en.json")`.
- [ ] Cache validated promises per `tool.locale`, reject unknown tool/locale values, and expose a test-only cache reset.
- [ ] Ensure `loadRegexData("maps", "ru")` cannot import items, English, or unrelated content shards.
- [ ] Test representative record counts and stable sentinel ids/names from the manifest.
- [ ] Commit:

```bash
git add web/src/features/regex/data seeding/src/regex/data-contract.test.ts
git commit -m "feat(regex): load route-level data shards"
```

### Task 7: Port vendor and map compilers

**Files:**
- Create: `web/src/features/regex/core/vendor.ts`
- Create: `web/src/features/regex/core/maps.ts`
- Create: `seeding/src/regex/vendor-parity.test.ts`
- Create: `seeding/src/regex/map-parity.test.ts`
- Modify: `seeding/package.json`

- [ ] Derive vendor behavior from legacy `OutputString.ts`, but implement only link counts 4/5/6 plus retained movement, gem, damage, and weapon filters.
- [ ] Assert no output path emits `c-c`, colored socket patterns, two/three links, custom colored links, or six-socket-only clauses.
- [ ] Port map behavior from `MapRegexBuilder.ts` and `MapRegexCompiler.ts` into a UI-independent compiler using local types and the shared two-pass policy.
- [ ] Port the ten audited map fixtures and assert equivalent selection semantics for EN and RU.
- [ ] Verify expressions against representative positive and negative corpus rows with `matchesSearchExpression`, not string snapshots alone.
- [ ] Run `npm run test:regex` and commit:

```bash
git add web/src/features/regex/core/vendor.ts web/src/features/regex/core/maps.ts seeding/src/regex/vendor-parity.test.ts seeding/src/regex/map-parity.test.ts seeding/package.json
git commit -m "feat(regex): port vendor and map compilers"
```

### Task 8: Port the remaining ten tool compilers and parity fixtures

**Files:**
- Create: `web/src/features/regex/core/content.ts`
- Create: `web/src/features/regex/core/flasks.ts`
- Create: `web/src/features/regex/core/items.ts`
- Create: `seeding/src/regex/content-parity.test.ts`
- Create: `seeding/src/regex/items-flasks-parity.test.ts`
- Create: `seeding/src/regex/fixtures/legacy-parity.json`
- Modify: `seeding/package.json`

- [ ] Extract small pure functions from legacy `MapNameOutput.ts`, `FlaskOuput.ts`, `JewelOutput.ts`, `ScarabOutput.ts`, `ExpeditionUtils.ts`, and Heist generation logic.
- [ ] Keep all UI state, React imports, fetch-on-focus behavior, economy polling, and CSS out of the core.
- [ ] Create at least two audited EN/RU scenarios per tool: empty/default selection and a non-trivial selection.
- [ ] For each fixture assert exact output, length, diagnostics, matched ids, and corpus semantics where text fixtures exist.
- [ ] Route every result through the 250-character policy. Fixture cases above 250 must either produce valid A/B or an explicit blocking diagnostic.
- [ ] Run `npm run test:regex`; all twelve tool parity suites pass.
- [ ] Commit:

```bash
git add web/src/features/regex/core seeding/src/regex seeding/package.json
git commit -m "feat(regex): preserve twelve-tool parity"
```

### Task 9: Prove lazy isolation and size bounds

**Files:**
- Create: `seeding/src/regex/bundle-isolation.test.ts`
- Modify: `seeding/package.json`
- Modify: `scripts/check-bundle-budget.mjs`

- [ ] Add a static test rejecting generated JSON imports outside `web/src/features/regex/data/loaders.ts`.
- [ ] Add a manifest test proving none of the 24 JSON shards is reachable from the `index.html` static import graph.
- [ ] Extend budget output with per-regex-route data sizes, but keep the existing 250 KB initial JS limit unchanged.
- [ ] Add hard raw-size limits: vendor/maps/content shards ≤500 KB each, items shards ≤10 MB each, total committed regex JSON ≤20 MB, manifest excluded.
- [ ] Configure PWA generation so regex data/chunks are not eagerly precached by the root service worker; they must download only after a regex route transition.
- [ ] Run `npm run verify`; initial static JS must be no more than 184,180 bytes gzip (shell baseline + 5 KB), no sourcemaps, and no regex JSON in the entry graph or eager precache list.
- [ ] Commit:

```bash
git add seeding/src/regex/bundle-isolation.test.ts seeding/package.json scripts/check-bundle-budget.mjs web/vite.config.ts
git commit -m "ci(regex): enforce lazy data isolation"
```

### Task 10: Core completion audit

- [ ] Run `npm ci --ignore-scripts` in a disposable clone/worktree and then `npm run verify` to prove the checked-in lockfile is sufficient.
- [ ] Run the legacy exporter twice and confirm the second run has no git diff.
- [ ] Search final source for `anyTwoColorLink|anyThreeColorLink|anyFourColorLink|anyFiveColorLink|anySixColorLink|specLinkColors|GeneratedBilingualStats|GeneratedBilingualDirect|GeneratedMagicItem` and require zero runtime hits.
- [ ] Search generated output and build artifacts for `.map`; require zero hits.
- [ ] Record final initial gzip, each shard size, total JSON size, test count, and manifest hash in the regex UI plan.
- [ ] Do not delete or mutate the old repository. Its archive/redirect happens only after production cutover.
