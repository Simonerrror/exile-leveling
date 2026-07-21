# Flask Generator Parity Design

## Goal

Restore the complete legacy flask workflow in the unified regex workspace, including Russian modifier names and Mageblood rolling behaviour.

## Behaviour

The flask screen has separate prefix and suffix columns. Both use localized `displayDescription` labels in Russian and canonical descriptions in English. Search filters both columns without losing their identity.

The settings panel restores:

- flask item level;
- require both a prefix and suffix;
- allow an open prefix or suffix;
- ignore the tier of the `25% increased effect` prefix for Mageblood rolling;
- highest available prefix tier only;
- highest available suffix tier only.

Selections are persisted separately as canonical prefix and suffix descriptions. Russian display text is never used as the stored identity, so switching languages preserves the selection. When highest-tier matching is enabled, the result reports the minimum required item level for the selected highest tiers.

## Core logic

`compileFlaskRegex` remains responsible for locale-specific patterns and the 250-character two-pass limit. The ignored-effect-tier option replaces the selected tier regex for the reduced-duration/increased-effect prefix with the group's all-tier regex, matching the legacy implementation. UI code only supplies normalized settings and selected canonical descriptions.

## Verification

- Core tests cover prefix-only, suffix-only, both/any, open-affix, item-level, max-tier, minimum-level diagnostic, and Mageblood tier replacement for EN and RU.
- UI contract tests prove both affix lists and localized labels are rendered from the correct fields.
- Profile tests prove legacy flask keys normalize to typed defaults and survive persistence.
- Full production verification and public Pages smoke testing are required.

