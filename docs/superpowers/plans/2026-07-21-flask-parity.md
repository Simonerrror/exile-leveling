# Flask Generator Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore all legacy flask controls, localized affix lists, Mageblood tier handling, and saved settings.

**Architecture:** Keep regex construction in `core/flasks.ts`, add a typed normalized flask profile, and give `RegexWorkspace` a flask-specific settings panel and two affix collections. Canonical English descriptions remain selection IDs while localized descriptions are display-only.

**Tech Stack:** React 19, TypeScript, CSS Modules, Node test runner, Vite.

---

### Task 1: Lock core parity with failing tests

**Files:**
- Modify: `seeding/src/regex/items-flasks-parity.test.ts`
- Modify: `web/src/features/regex/core/types.ts`
- Modify: `web/src/features/regex/core/flasks.ts`

- [ ] **Step 1: Add failing assertions** for Russian `displayDescription`, suffix selection, max-tier item-level diagnostics, and `ignoreEffectTiers` producing the group regex instead of one tier regex.
- [ ] **Step 2: Run `npm run test:i18n -w seeding -- --test-name-pattern=flask`** and confirm the new Mageblood and diagnostic assertions fail.
- [ ] **Step 3: Implement minimal core helpers**: select eligible groups, choose the maximum tier without mutating shard arrays, replace the increased-effect tier with the all-tier group regex, and append an informational minimum-level diagnostic.
- [ ] **Step 4: Re-run the targeted tests** and expect all flask cases to pass.

### Task 2: Normalize and persist complete flask settings

**Files:**
- Modify: `web/src/features/regex/profile/schema.ts`
- Modify: `seeding/src/regex/profile-migration.test.ts`

- [ ] **Step 1: Add a failing profile test** expecting defaults equivalent to `{ selectedPrefix: [], selectedSuffix: [], itemLevel: 85, onlyMaxPrefix: false, onlyMaxSuffix: false, requireBoth: true, matchOpenAffix: true, ignoreEffectTiers: false }` and normalization of legacy key names.
- [ ] **Step 2: Run the profile test** and confirm the typed defaults are missing.
- [ ] **Step 3: Add `FlaskProfileSettings` and `normalizeFlaskSettings`**, accepting both current names and legacy `ilevel`, `onlyMaxPrefixTierMod`, `onlyMaxSuffixTierMod`, `matchBothPrefixAndSuffix`, and `matchOpenPrefixSuffix`.
- [ ] **Step 4: Re-run the profile tests** and expect pass.

### Task 3: Restore the full flask UI

**Files:**
- Modify: `web/src/containers/RegexWorkspace/index.tsx`
- Modify: `web/src/containers/RegexWorkspace/styles.module.css`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Modify: `seeding/src/regex/regex-ui.test.ts`

- [ ] **Step 1: Add failing UI contract assertions** for prefix/suffix labels, item level, both/open-affix, max-tier controls, Mageblood wording, and `displayDescription` use.
- [ ] **Step 2: Run `npm run test:i18n -w seeding`** and confirm the new message/contract assertions fail.
- [ ] **Step 3: Implement two canonical affix option sets**, rendering localized labels but encoding IDs as `prefix:<canonical description>` and `suffix:<canonical description>`.
- [ ] **Step 4: Add the settings fieldset and two responsive option columns**, wire every control through `normalizeFlaskSettings`, and persist it through the existing profile store.
- [ ] **Step 5: Re-run UI and flask tests** and expect pass.

### Task 4: Verify and commit

**Files:** all files above plus `docs/superpowers/specs/2026-07-21-flask-parity-design.md` and this plan.

- [ ] **Step 1: Run `npm run verify`** and expect all tests, data verification, build, and bundle budget to pass.
- [ ] **Step 2: Manually smoke-test `/regex/flasks`** in Russian and English at desktop and mobile widths; select one prefix and one suffix, toggle Mageblood mode, and reload to confirm persistence.
- [ ] **Step 3: Commit only flask parity files** with `feat(flasks): restore full generator parity`.

