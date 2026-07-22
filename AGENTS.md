# AGENTS.md

This file is the working contract for coding agents in this repository. It
describes the current product decisions and engineering invariants. Follow it
unless the user explicitly changes a decision. For feature-specific detail,
read the relevant design and plan in `docs/superpowers/` before changing code.

## Product

PoE Tools is a compact English/Russian Path of Exile 1 toolkit hosted on
GitHub Pages. It combines:

- the campaign-leveling application inherited from Exile Leveling;
- Path of Building import, gem and skill-tree support;
- a curated useful-resources home page and small knowledge references;
- eleven current regex tools: vendor, maps, items, expedition, heist, flasks,
  beasts, tattoos, runegrafts, scarabs, and jewels.

The useful-resources page is the home page. Do not restore dashboard sections
such as “Continue” or “Recently opened”. Leveling-specific build import, gems,
and skill-tree actions belong to the leveling flow, not duplicated cards on
the home page.

The UI follows the restrained Exile Leveling palette but should be lighter,
denser, and easier to scan than the inherited interface. Prefer meaningful
PoE item art and service logos over generic icon libraries. Color may enrich
the hierarchy, but must never be the only indication of state.

## Repository map

- `common/` — canonical campaign, passive-tree, and shared game data.
- `seeding/` — deterministic data generation, localization auditing, economy
  snapshot tooling, and the main Node test suites.
- `web/` — the React/Vite application.
- `web/src/features/regex/core/` — pure regex compilers and shared splitting.
- `web/src/features/regex/editors/` — typed UI adapters and tool editors.
- `web/src/features/regex/profile/` — persisted schema, migration, and storage.
- `web/src/features/regex/data/generated/` — generated EN/RU route shards.
- `web/src/containers/RegexWorkspace/` — shared regex route and result shell.
- `docs/superpowers/specs/` — accepted product/design decisions.
- `docs/superpowers/plans/` — implementation plans and verification criteria.
- `docs/research/` — non-production research and candidate knowledge sources.

Keep tool-specific logic in a typed feature module when practical. Do not add
more unrelated behavior to `RegexWorkspace` merely because it already routes
all tools. Reuse the shared result, persistence, image, and market components.

## Core regex contract

The generated string is an in-game search expression, not merely a JavaScript
regular expression. Preserve the boolean meaning of Path of Exile search:

- separate search clauses are AND conditions;
- alternatives inside one positive clause are OR conditions;
- negated clauses must retain their exclusion semantics;
- never truncate, silently discard terms, or silently weaken a threshold.

`REGEX_CHARACTER_LIMIT` in `core/two-pass.ts` is the single source of truth for
the current 250-character in-game limit. Do not copy a numeric `250` into UI or
compiler code.

When an expression is too long:

- return one result when it fits;
- return A/B only when the compiler can prove the split preserves semantics;
- label the composition as `union` or `intersection` and explain its use;
- return a blocking diagnostic when safe splitting is impossible;
- disable copying when any blocking diagnostic exists;
- keep the original expression available for diagnosis, never as a supposedly
  valid copy target.

Numeric thresholds are exact minimums for every supported integer, including
values above 100. Legacy optimization flags must not introduce implicit
rounding. Add boundary tests for the value below, the value itself, and a value
above whenever threshold generation changes.

## Accepted tool behavior

### Vendor

- Socket filters are linked-socket counts only: 2L through 6L.
- Do not restore colored-link combinations or a separate six-socket filter.
- Gems are grouped red active/support, blue active/support, green
  active/support, white active/support, then sorted by required level and
  localized name.
- Gem selection and PoB matching use stable game IDs, never translated labels.
- PoB import may select recognized build gems while retaining manual choices
  and reporting unavailable or unknown gems.

### Maps

- Output remains at the top; it is primarily a copy target.
- Keep separate panels for map thresholds and quality rewards.
- Quality reward thresholds are numeric and have explicit Any/OR versus
  All/AND behavior.
- Rarity always has at least one visible selection.
- Corrupted and unidentified are tri-state: any, only, or exclude.
- A modifier is exactly one of ignore, exclude, or require.
- Hidden Nightmare modifiers are neither compiled nor counted, but their saved
  selection is retained for later restoration.
- Map names are no longer a separate tool. Do not restore `mapnames` shards or
  routes; current map workflows use the retained map controls and tiers.

### Other regex tools

- Flasks preserve item level, prefix/suffix modes, open affixes, highest tiers,
  AND/OR behavior, and Mageblood 25% increased-effect handling.
- Heist contracts expose concise Russian and English names, contract levels,
  target coin value, AND/OR behavior, and supported Gianna presets.
- Expedition searches bases that can become valuable uniques; show valuable
  outcomes with art and price, while cheap outcomes may remain compact text.
- Bestiary is recipe-oriented. Show recipe effects, requirements, freshness,
  and price-check/trade actions; never present estimated spread as guaranteed
  profit.
- Tattoos retain localized effect descriptions.
- Scarabs and runegrafts retain item art, descriptions, prices, and market
  controls. The Russian term is always “рунограммы”.
- Item and jewel base selection must stay separate from modifier selection and
  preserve their any/all, prefix/suffix, magic, and open-affix modes.

If a compiler exposes a supported option, the editor and profile adapter must
either expose it or document why it is intentionally unavailable. Add a parity
test so compiler functionality cannot silently disappear from the UI.

## Data, prices, and images

Generated regex shards are build artifacts. Do not hand-edit files under
`web/src/features/regex/data/generated/`. Change the exporter, audited source,
or checked-in snapshot, regenerate, and verify the manifest.

Keep EN and RU tool data in separate lazy route shards. They must remain out of
the initial JavaScript graph and PWA precache. Current budgets are enforced by
`scripts/check-bundle-budget.mjs`:

- initial JavaScript: at most 256 KiB gzip;
- total raw regex data: at most 20 MiB.

Do expensive enrichment at seeding/build time, not during React render. Static
GitHub Pages must not depend on an untrusted runtime service. Market shards
carry their league, source, and update timestamp. Missing prices remain
missing and the UI says “price unavailable”; never invent a fallback price.

The Pages workflow refreshes economy data for scheduled and manually
dispatched runs. A normal push deploy uses the committed snapshot. Keep this
distinction deliberate when changing `.github/workflows/build-and-deploy.yml`.

Use semantic images:

- gems, contracts, beasts, uniques, scarabs, runegrafts, tattoos, and concrete
  bases may use their real art;
- abstract affix and map-modifier rows should remain dense text;
- external art must be an allowlisted, validated HTTPS URL;
- use explicit dimensions, lazy loading/decoding, useful alt text where the
  image conveys meaning, and a local/text fallback on failure;
- do not bulk-copy CDN game art into the repository.

## Localization

EN/RU message dictionaries require exact key parity. Any user-visible text
added to the application must be translated in the same change. Do not build
translation keys from arbitrary data unless every resulting key is validated.

Russian terminology used by this product:

- build — “билд”, not “сборка” in build-planning UI;
- passive tree — “дерево умений”;
- runegrafts — “рунограммы”;
- Heist professions may show concise RU and EN together when that improves
  recognition.

Prefer official Russian client exports. Intentional English fallbacks require
the checked-in audit/provenance records described in `README.md`. Never present
a guessed translation as official. Keep runtime localization data and its
audit sidecars in the same commit.

## Profiles and persistence

`web/src/features/regex/profile/schema.ts` is the persisted schema boundary.
Normalize untrusted or legacy values before rendering or compiling them.

- Preserve retained user choices during migration.
- Resolve impossible states deterministically, such as one modifier in both
  `badIds` and `goodIds`, or all map rarities disabled.
- Remove obsolete fields without invalidating the rest of a profile.
- Do not use translated labels as persisted identifiers.
- Storage failures must leave the application usable in memory.

Schema changes require migration and round-trip tests. Avoid bumping the schema
for a visual-only representation of fields that already exist.

## UI and accessibility

- Keep the regex result first on desktop and mobile; do not restore a sticky
  side panel.
- Prefer compact semantic sections and real controls. Do not present design
  descriptions as fake selectable cards in production UI.
- Every interactive state must be understandable without color alone.
- Use native controls or correct keyboard and ARIA semantics.
- Preserve visible focus and a no-horizontal-scroll layout at 390 px.
- Keep cards dense for large catalogs, but provide search, useful grouping,
  counts, and bulk controls where appropriate.
- External resource cards use the service's own logo or relevant PoE art when
  a reliable asset exists.

## Change workflow

Before editing:

1. Read the closest accepted spec and inspect the current implementation.
2. State any assumption that changes user-visible semantics, stored data,
   network behavior, or deployment.
3. Prefer a surgical change over a framework, generic abstraction, or new
   dependency.

For behavior changes and bug fixes:

1. Reproduce the behavior.
2. Add a focused failing test and confirm the expected failure.
3. Implement the smallest fix at the source of the problem.
4. Run the focused suite, then the complete release gate.

Do not reformat or refactor unrelated files. Preserve user-owned untracked and
modified files. Generated-file churn must be attributable to the requested
source change.

## Dependencies

Use the committed lockfile and deterministic installs:

```sh
npm ci --ignore-scripts
```

Do not add a UI framework, runtime backend, or package for functionality that
the platform or current code already provides. Do not install floating
versions such as `latest`. Any new dependency requires an exact reviewed
version, lockfile update, provenance/maintainer review, and an explanation of
why existing code cannot solve the problem more simply.

## Verification

Useful focused commands from the repository root:

```sh
npm run test:i18n
npm run validate:i18n
npm run test:regex
npm run regex:data:verify
npm run build:web
npm run check:bundle
```

The mandatory release gate is:

```sh
npm run verify
```

It must pass after the final change, not only before it. For layout or browser
behavior, also smoke-test the affected route at desktop and 390 px, confirm no
horizontal overflow or console errors, and exercise the actual control rather
than only inspecting its source.

## Git and deployment

- Use short-lived `codex/` feature branches for non-trivial work.
- Keep commits scoped and explain the user-visible outcome.
- Do not rewrite published history or force-push `main`.
- Merge only after tests and review; preserve unrelated working-tree changes.
- Public deployment is performed by `.github/workflows/build-and-deploy.yml`.
- A release is complete only when the workflow succeeds for the expected SHA
  and the public route is checked with a cache-busting query parameter.
- GitHub Pages and its service worker may briefly serve the previous index
  after deploy. Reload and confirm the loaded asset hash before diagnosing a
  fresh build as broken.

Public application:
`https://simonerrror.github.io/exile-leveling/`

