# Expedition economy design

## Goal

Make the Expedition generator answer the actual Gwennen decision: which base is worth buying because it can become a valuable unique.

## Behaviour

- A base card shows its localized base name, canonical English name, and up to three priced unique outcomes.
- Cards are sorted by the most valuable obtainable unique and can be filtered by minimum chaos value.
- Search matches both localized and English base and unique names.
- Optional filler selection greedily adds valuable bases until adding another base would require a second regex or exceed the safe 250-character output.
- The stored user selection remains separate from automatically added filler bases.

## Data and freshness

- The browser consumes a compact checked-in price map, never the multi-megabyte raw economy responses.
- `regex:economy:refresh` reads the supported poe.ninja PoE 1 economy endpoints, rejects corrupted, linked, relic, and Foulborn variants, and records the active economy league and timestamp.
- Scheduled Pages builds refresh the snapshot daily. Push builds use the checked-in snapshot so a third-party outage cannot block a normal release.
- Generated shards and the economy snapshot are covered by the deterministic manifest and runtime shape validation.

## Verification

- Contract tests cover localized outcomes, price ordering, compact display, and the one-pass filler limit.
- Production build verifies shard isolation and bundle size.
- Browser QA covers RU/EN text, copy output, dense desktop cards, and mobile fallback.
