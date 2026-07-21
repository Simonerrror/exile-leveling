# Regex Production Completion Design

## Goal

Bring the PoE Tools regex workspace to production parity with its compilers and current Path of Exile 3.28 workflows. The result must be fast on GitHub Pages, useful in Russian and English, and explicit about price freshness.

## Product decisions

- Keep eleven current tools: vendor, maps, items, expedition, heist, flasks, beasts, tattoos, runegrafts, scarabs, and jewels.
- Remove the map-name tool and route. Current map workflows use tiers rather than a separate map-name regex page.
- Keep regex output at the top. It is a copy target, not a reading sidebar.
- Use semantic images: concrete gems, contracts, beasts, uniques, scarabs, and runegrafts get art; abstract affixes and map modifiers do not get decorative row images.
- Use lazy external PoE CDN images with a local text/icon fallback. Do not bulk-copy game art into the repository.
- Do not add a UI framework, runtime backend, or new dependency.

## Architecture

`RegexWorkspace` currently owns routing, tool state, rendering, persistence, and compilation in one large component. Split tool-specific behavior into typed editor modules while retaining the current route-level lazy data loaders and shared result/profile shell.

Each editor exposes normalized settings and a compile adapter. Tests exercise the public adapter so a supported compiler option cannot silently disappear from the UI again. Generated shards remain static build artifacts with league and timestamp metadata; live market buttons open prepared official trade searches rather than making GitHub Pages depend on an untrusted runtime service.

## Tool behavior

### Vendor

- Preserve 2–6 link counts and current item filters.
- Group gems red active/support, blue active/support, green active/support, white active/support; sort by required level then localized name.
- Add a 28–32 px gem icon and stable game id to each generated token.
- Read the existing persisted `requiredGems` produced by the Path of Building import.
- “Select build gems” selects every recognized gem, keeps manual choices, and reports recognized, unavailable, unknown, and already-selected counts.
- Use stable game ids for matching; never localized display names.
- Preserve safe A/B splitting when the in-game regex limit is exceeded.

### Maps

- Restore bad and good modifier selection, any/all good mode, quantity, pack size, rarity, quality, corruption, identification, and the existing advanced compiler flags.
- Keep modifier rows textual and dense.
- Map tiers belong in this tool where relevant; there is no separate map-name workspace.

### Items

- Restore independent item-base, rare-mod, and magic-mod selection.
- Restore any/all and prefix/suffix modes plus open-affix matching.
- Stop treating selected bases as modifier patterns.

### Heist

- Show profession icon and concise RU/EN contract names.
- Restore a per-profession minimum/maximum contract level.
- Restore target coin value and AND/OR behavior.
- Preserve Gianna presets where supported by the compiler.

### Expedition

- Rank bases by valuable unique outcomes.
- Show thumbnails and prices only for outcomes above the visible-value threshold.
- Keep cheap outcomes as compact text.
- Preserve automatic selection of valuable bases and price timestamp/league.

### Flasks

- Retain item level, prefix/suffix filters, highest tiers, open-affix matching, AND/OR behavior, and the Mageblood 25% increased-effect tier handling.
- Audit every visible RU/EN modifier label.

### Bestiary

- Replace the flat beast-name list with a recipe-oriented catalog.
- Every useful row shows beast name, recipe effect, required special beasts, filler count, red/Harvest flags, and league freshness.
- Restore recipe descriptions in RU and EN. Reject stale recipes during data verification; the old “30% map quality” recipe is not valid for 3.28.
- Add component prices, result price where measurable, and an explicitly labelled estimated spread. Never label spread as guaranteed profit.
- Show price source and timestamp. Gold fee is separate from chaos/divine cost.
- Provide prepared live price-check/trade links for inputs and outputs.
- Aggregate selected beast names into a bounded regex for searching large asynchronous merchant tabs.
- Keep menagerie limit, Harvest inclusion, red-only, and min/max value controls.

### Tattoos

- Restore the localized effect description for every tattoo.
- Show current price and min/max value controls when the shard contains market data.
- Keep compact rows with item art only when a reliable icon is available.

### Runegrafts and scarabs

- Preserve item art, descriptions, current-league prices, and descending price sorting.
- Restore min/max price controls and bulk selection.
- Use “рунограммы” consistently in Russian.

### Jewels

- Restore regular/abyss selection, any/all mode, magic-only, both-prefix-and-suffix, and open-affix settings.
- Use representative regular/abyss art only for mode controls; modifier rows remain textual.

## Data and freshness

- Enrich generated data at seeding time, not during page render.
- Every market shard carries league, source, and `updatedAt`.
- Every referenced icon is a validated HTTPS URL or an existing local asset.
- Prices may be absent; UI must show “price unavailable” rather than inventing `1 chaos`.
- Data verification rejects forbidden fields, malformed URLs, missing required descriptions, stale map-name shards, and inconsistent locale structure.
- Remove both map-name generated shards and their loader/manifest entries.

## Profiles and migration

- Bump the profile schema once.
- Migrate existing settings for retained tools.
- Drop `mapnames` without invalidating the whole profile.
- Add typed settings for every restored editor instead of storing unchecked generic JSON at render boundaries.

## Accessibility and performance

- All cards remain usable by keyboard and at 390 px width.
- Images use explicit dimensions, lazy decoding/loading, useful alt text, and failure fallback.
- Tool data remains lazy by route and excluded from initial PWA precache.
- Initial JS stays under the existing 256 kB gzip budget; total regex data stays under the existing 20 MiB raw budget.

## Verification

- TDD for each settings adapter and migration.
- EN/RU data contract tests for icons, descriptions, recipes, prices, and removed map-name shards.
- Compiler parity tests for every restored setting.
- Browser smoke tests for vendor PoB selection, Heist levels, Expedition valuable art, Bestiary recipe/trade actions, tattoo effects, and mobile layout.
- Full `npm run verify`, public deploy, GitHub Actions success, and a fresh Pages smoke test before completion.

## Repository hygiene

- Remove the accidental uncommitted root `packageManager` field; keep the existing lockfile unchanged.
- Do not run automated dependency upgrades as part of this feature.
- Track the pre-existing npm audit finding separately.
