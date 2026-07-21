# PoE Tools Regex UI Implementation Plan

> Execute with test-driven-development and verify each route in a real browser before release.

**Goal:** Replace the regex catalog placeholder with twelve compact, accessible EN/RU generators that use the migrated core/data/profile layer and never expose socket-color link filters.

**Architecture:** Keep `RegexCatalog` as the lazy route boundary. Route `#/regex/:toolId` to a shared `RegexWorkspace` shell; load each tool editor and its locale shard only after the route resolves. Use a two-column desktop layout (controls + sticky result), one column on mobile, and native controls with visible labels.

## Task 1: Route and catalog contracts

- Add `regex-ui.test.ts` asserting links for all twelve ids, stable `/regex/:id` routes, redirect for unknown ids, lazy workspace imports, and localized metadata.
- Change catalog cards from “migration in progress” blocks to links with concise descriptions and semantic accent colors.
- Verify keyboard focus, current-page state, and mobile one-column catalog.

## Task 2: Shared workspace and output

- Add `RegexWorkspace`, `RegexResult`, `RegexFieldset`, and compact CSS modules.
- Provide copy A/copy B buttons, live lengths, blocking/info diagnostics, reset, search inside option lists, loading and empty states.
- Persist the active profile through `poe-tools.regex.profiles`; import legacy profiles once without mutating old keys.
- Use orange for warnings/elite-value content, blue for portal/reference content, green for valid copied output, and neutral borders for ordinary cards.

## Task 3: Vendor and maps editors

- Vendor: only 4, 5, 6 link-count checkboxes plus movement, gem type, weapon, damage, and gem selectors. No color/link/socket UI or data fields.
- Maps: searchable good/bad mod selection, all/any good mode, quantity/pack/rarity/corrupted/unidentified fields, and selected-count summary.
- Load `vendor.<locale>` or `maps.<locale>` only after their editor mounts.

## Task 4: Remaining ten editors

- Items: base/mod search, any/all/prefix+suffix modes, open-affix toggle.
- Map names, Expedition, Scarabs, Runegrafts, Jewels: searchable checkbox lists backed by their own shard.
- Flasks: prefix/suffix selection, item level, maximum tier, both/any and open-affix controls.
- Heist: contract level ranges, target coin value, both/any behavior.
- Bestiary and Tattoos: deterministic static selections plus optional pasted price values; no automatic economy polling in the first cutover.
- Every editor must have a useful default/empty state and produce output through the shared 250/A-B result contract.

## Task 5: Accessibility, responsive layout, and profile checks

- Add accessible names, fieldset legends, status live region, 44px mobile targets, visible focus, and no horizontal page overflow at 390px.
- Keep result sticky only above 860px; on mobile result precedes long option lists after the first interaction.
- Test RU/EN switch without losing selected profile values.
- Browser-smoke catalog plus all twelve routes, copy buttons, 4/5/6 migration, unknown route, back navigation, and reload.

## Task 6: UI completion audit

- Run `npm run verify` and the route smoke test.
- Search runtime UI for every removed color-link/six-socket key and require zero hits outside migration/tests.
- Record route chunks and initial gzip for release plan.
