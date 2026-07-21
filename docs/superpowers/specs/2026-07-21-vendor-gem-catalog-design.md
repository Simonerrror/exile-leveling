# Vendor Gem Catalog Design

## Goal

Replace the unsorted vendor-gem checkbox wall with a PoE-like catalog that is easy to scan without adding runtime dependencies or downloading another dataset.

## Accepted layout

The catalog is a vertical sequence of eight sections, not tabs:

1. Strength active gems
2. Strength support gems
3. Dexterity active gems
4. Dexterity support gems
5. Intelligence active gems
6. Intelligence support gems
7. White active gems
8. White support gems

Each section uses the matching PoE gem colour. Within every section, cards are sorted by the gem's required level ascending and then by localized name. Each card shows the localized gem name and required-level badge. Search filters across all sections; empty sections disappear. Existing selection, profile persistence, regex generation, and the global reset remain unchanged.

## Data

The committed vendor shards remain the only route-loaded data. During deterministic export, each token is enriched with `requiredLevel` from `common/data/json/gems.json`. Normal game entries are preferred over `Royale` variants. English names provide the canonical join and Russian tokens reuse the same stable IDs. The legacy `Lesser Multiple Projectiles Support` name is explicitly aliased to `Metadata/Items/Gems/SupportGemLesserMultipleProjectiles`. The removed non-Royale gems `Increased Duration Support` and `Sweep` use reviewed historical levels 31 and 12 instead of the surviving Royale level 4.

Colour and active/support type continue to come from the legacy token options (`c` and `support`) so the existing regex identity and selection IDs do not change. The loader rejects vendor tokens without a valid colour, boolean support flag, or non-negative integer required level.

## Verification

- Export tests prove full EN/RU metadata coverage and reject Royale levels.
- Catalog unit tests prove section order and level/name sorting.
- UI/i18n tests prove Russian and English section labels exist.
- Production verification must stay within the existing initial bundle budget; vendor data remains route-split.
