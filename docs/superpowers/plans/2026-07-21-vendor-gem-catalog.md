# Vendor Gem Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present vendor gems as eight sequential PoE-coloured active/support sections sorted by required level.

**Architecture:** Enrich the existing route-split vendor shards during deterministic export, validate the metadata at load time, and isolate grouping/sorting in a pure catalog module consumed by `RegexWorkspace`. Existing token IDs and compilation remain unchanged.

**Tech Stack:** TypeScript, React 19, CSS Modules, Node test runner, committed JSON shards.

---

### Task 1: Enrich deterministic vendor data

**Files:**
- Modify: `seeding/src/regex/export-legacy-data.ts`
- Modify: `seeding/src/regex/vendor-parity.test.ts`
- Modify: `web/src/features/regex/data/generated/vendor.en.json`
- Modify: `web/src/features/regex/data/generated/vendor.ru.json`
- Modify: `web/src/features/regex/data/generated/manifest.json`

- [ ] **Step 1: Add failing tests** requiring every EN/RU vendor token to have a non-negative integer `requiredLevel`, matching known gems (`Chain Hook` level 12 and `Lesser Multiple Projectiles Support` level 8).
- [ ] **Step 2: Run the vendor test** and confirm `requiredLevel` is absent.
- [ ] **Step 3: Add export-time metadata joins** using `common/data/json/gems.json` and `common/data/i18n/ru.json`, rejecting unmatched tokens, preferring non-`Royale` entries, and applying the one legacy English alias.
- [ ] **Step 4: Run the existing deterministic exporter** against `/Users/sergio/Documents/30_HOBBY_AI/projects/poe/poe-regex-ru` and verify only vendor shards/manifest change materially.
- [ ] **Step 5: Re-run the vendor tests** and expect full metadata coverage.

### Task 2: Validate and group the catalog

**Files:**
- Modify: `web/src/features/regex/data/types.ts`
- Modify: `web/src/features/regex/data/loaders.ts`
- Create: `web/src/features/regex/vendor-gem-catalog.ts`
- Create: `seeding/src/regex/vendor-gem-catalog.test.ts`

- [ ] **Step 1: Add failing tests** for the exact section order `r active, r support, g active, g support, b active, b support, w active, w support`, then required-level and localized-name sorting.
- [ ] **Step 2: Run the new test** and confirm the catalog module is missing.
- [ ] **Step 3: Define typed vendor token options and required level validation**, then implement a pure `groupVendorGems(tokens)` function returning only non-empty ordered sections.
- [ ] **Step 4: Re-run catalog and data-contract tests** and expect pass.

### Task 3: Render the sequential coloured sections

**Files:**
- Modify: `web/src/containers/RegexWorkspace/index.tsx`
- Modify: `web/src/containers/RegexWorkspace/styles.module.css`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Modify: `seeding/src/regex/regex-ui.test.ts`

- [ ] **Step 1: Add failing i18n assertions** for Strength, Dexterity, Intelligence, White, Active gems, Support gems, and required-level labels.
- [ ] **Step 2: Run UI tests** and confirm the keys are missing.
- [ ] **Step 3: Render all non-empty sections in accepted order**, preserving checkbox IDs and showing colour accent, localized name, and `Ур. N`/`Lvl N` badge.
- [ ] **Step 4: Make search filter globally and remove the 160-item truncation for vendor gems**, while keeping the existing show-all behaviour for other tools.
- [ ] **Step 5: Re-run UI and catalog tests** and expect pass.

### Task 4: Verify, release, and smoke-test

**Files:** all files above plus `docs/superpowers/specs/2026-07-21-vendor-gem-catalog-design.md` and this plan.

- [ ] **Step 1: Run `npm run verify`** and expect the complete suite and initial gzip budget to pass.
- [ ] **Step 2: Smoke-test `/regex/vendor`** in RU and EN at desktop/mobile widths, including search, selection, reload persistence, and generated regex output.
- [ ] **Step 3: Commit with `feat(vendor): group gems by colour type and level`**, fast-forward `main`, push, manually dispatch Pages, and verify the public URL.

