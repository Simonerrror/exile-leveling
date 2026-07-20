# Exile Leveling

Path of Exile campaign guide with Path of Building integration and an
English/Russian interface.

## Language behavior

On the first visit, browser language `ru` or a language tag beginning with
`ru-` selects Russian. A manual `EN/RU` choice is saved for later visits.
Missing, unsupported, or invalid locale values fall back to English.

The built-in campaign routes switch with the interface language. Custom or
imported routes are user content and are not translated automatically. Passive
tree node tooltips remain English because the official skill-tree export used
by the project does not include localized tooltip text.

Russian game names use official client exports where those exports are
available and client-style terminology from audited sources elsewhere.
Intentional English values and unavailable official translations are recorded
as explicit fallbacks in the checked-in audit data; the project does not
present guessed translations as official.

## Development and verification

Use the committed lockfile for a deterministic install:

```sh
npm ci --ignore-scripts
```

Run the development server with `npm run dev -w web`. The release gates are:

```sh
npm run test:i18n
npm run validate:i18n
npm run build -w web
```

The passive tree can be refreshed with `npm run seed tree -w seeding`. For the
other canonical game data, see the required DAT files in
`seeding/src/data/index.ts`, export them with
[exile-export](https://github.com/HeartofPhos/exile-export), then run
`npm run seed data -w seeding`.

## Russian display-data maintenance

To reapply the reviewed route literals to the current checked-in Russian data,
run this merge mode from the repository root:

```sh
npm run generate:ru-display-data -w seeding -- \
  --merge-route-literals true \
  --canonical ../common/data/json \
  --route-literal-audit-report data/localization/ru-route-literal-audit.json \
  --audit-manifest data/localization/ru-audit-manifest.json \
  --output ../common/data/i18n/ru.json \
  --audit-output data/localization/ru-output-audit.json
```

For a full rebuild from official Russian DAT exports, first obtain and audit an
external export directory containing `BaseItemTypes`, `WorldAreas`, `MapPins`,
`Quest`, `QuestRewardOffers`, `NPCTalk`, `NPCs`, `Characters`, `SkillGems`, and
`RecipeUnlockDisplay` as `.datc64.json` files. Update the matching source
metadata and SHA-256 values in the manifest, then run:

```sh
npm run generate:ru-display-data -w seeding -- \
  --exports /absolute/path/to/audited-russian-dat-exports \
  --canonical ../common/data/json \
  --route-literal-audit-report data/localization/ru-route-literal-audit.json \
  --audit-manifest data/localization/ru-audit-manifest.json \
  --output ../common/data/i18n/ru.json \
  --audit-output data/localization/ru-output-audit.json
```

The external DAT exports are not committed. The maintained provenance
sidecars are:

- `seeding/data/localization/ru-audit-manifest.json` — source revisions,
  retrieval dates, and input hashes;
- `seeding/data/localization/ru-display-audit.json` — reviewed NPC, class, and
  non-Russian gem records;
- `seeding/data/localization/ru-route-literal-audit.json` — reviewed route
  literal mappings and source metadata;
- `seeding/data/localization/ru-output-audit.json` — generated coverage and
  intentional fallback reasons paired with `common/data/i18n/ru.json`.

Keep runtime data and these sidecars in the same commit. Both localization
gates verify coverage and provenance before a production build.

## Syncing upstream

Keep localization work on `codex/russian-localization` and merge upstream into
that branch without rewriting its history:

```sh
git remote add upstream https://github.com/HeartofPhos/exile-leveling.git
git fetch upstream
git switch codex/russian-localization
git merge upstream/main
npm ci --ignore-scripts
npm run test:i18n
npm run validate:i18n
npm run build -w web
git push origin codex/russian-localization
```

If `upstream` already exists, verify it with `git remote -v` instead of adding
it again. Resolve merge conflicts in both locale route trees and rerun every
gate before pushing; no force push is required.

## Route policy

The base route follows current speed-running strategies. Use the
[Edit Route tab](https://heartofphos.github.io/exile-leveling/#/edit-route) in
the deployed app to adapt it to a preferred playstyle.
