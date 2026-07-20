# Russian Localization Design

## Summary

Add a built-in English/Russian language switch to Exile Leveling while keeping English as the canonical language and fallback. The Russian experience targets players using the official Russian Path of Exile client: UI text, campaign instructions, gems, areas, quests, NPCs, rewards, and generated hints use official Russian game terminology.

The implementation must remain easy to synchronize with `HeartofPhos/exile-leveling`. It will not replace canonical identifiers or duplicate application logic by language.

## Goals

- Provide an `EN / RU` selector in the expanded navigation menu.
- Detect `ru-*` browser locales on first visit and otherwise default to English.
- Persist an explicit language choice across reloads.
- Translate the application UI and the ten default campaign routes.
- Display official Russian names for supported game entities.
- Preserve imported PoB data, route progress, collapsed sections, and settings when the language changes.
- Fall back to English for any missing Russian string or unknown locale value.
- Keep the existing GitHub Pages deployment and `/exile-leveling/` base path.
- Add localization validation without introducing a runtime or development dependency.

## Non-goals

- Russian passive-tree node names and stat tooltips. The official `skilltree-export` used by the project is English-only; tree rendering and tooltips continue to use the English data.
- Automatic translation of user-authored routes.
- Runtime machine translation.
- Languages other than English and Russian.
- Changes to campaign routing strategy or PoB import behavior.

## Architecture

### Locale state

Introduce a `Locale` union with `en` and `ru`. A Jotai storage atom owns the selected locale.

On first use:

1. Read a previously persisted valid locale.
2. If none exists, use `ru` when `navigator.language` starts with `ru`.
3. Otherwise use `en`.

Invalid stored values resolve to `en`. Changing the locale updates presentation data only and must not clear any existing build or progress atoms.

### UI translations

Use a small in-repository, typed translation layer rather than adding `react-i18next`.

- English defines the complete key shape.
- Russian must satisfy the same key shape at compile time.
- A `t(key)` accessor returns the selected translation and falls back to English.
- Component-visible strings, labels, aria labels, toast messages, validation messages, and PWA-facing copy in scope move into the dictionaries.

This keeps the dependency surface unchanged and makes missing keys visible during TypeScript compilation.

### Route translations

Store default routes in parallel locale directories:

```text
common/data/routes/en/act-1.txt ... act-10.txt
common/data/routes/ru/act-1.txt ... act-10.txt
```

English remains canonical. Russian files retain the same sections, steps, indentation, conditional directives, and fragment markup as their English counterparts. Only user-visible prose and literal display values are translated.

Stable fragments such as `{enter|2_10_town}`, `{quest|a8q7}`, `{waypoint}`, and `{dir|270}` are not translated. This preserves route evaluation and generated gem steps.

Default route selection follows the active locale. Switching between localized defaults preserves progress because the structural step sequence is required to match. User-authored/custom route content remains unchanged when the locale changes; resetting a route loads the default for the active locale.

### Localized game data

Canonical game objects continue to use existing stable IDs. Russian display-name maps are stored separately and keyed by those IDs. The maps cover the entities presented by this application:

- gems;
- areas and map labels;
- quests and reward offers;
- characters/classes where displayed;
- NPC and literal entity names required by generated route fragments.

The initial maps are generated offline from data extracted from an official Russian Path of Exile client through the project's existing export/seeding workflow, then checked into the repository. Generation is not a runtime or CI requirement. English mechanics and non-display fields remain canonical.

When a Russian display value is absent, rendering uses the English value for the same ID. Internal lookups, PoB import, quest reward generation, gem acquisition logic, and waypoint logic never depend on translated names.

### Passive tree

The tree graph, highlighting, navigation, and PoB snapshots remain unchanged. Node titles and stat tooltips use the existing English `skilltree-export` data in both locales. This limitation is stated in project documentation.

## User experience

- The expanded navigation menu contains a compact `EN / RU` selector.
- Selection applies immediately without a page reload.
- Route headings, navigation labels, generated instructions, gem panels, search-panel UI, build-import UI, and errors switch together.
- Official Russian client names are used without repeating English aliases.
- Campaign prose is short and imperative, for example: “Убей”, “Возьми путевую точку”, and “Выйди в меню выбора персонажа”.
- Imported PoB content and all completed-step state remain intact during repeated language switches.

## Compatibility and migration

- Existing English behavior remains the default for non-Russian browsers.
- Existing PoB and progress storage keys remain valid.
- Locale storage is additive.
- Existing custom route text is not rewritten or translated.
- Third-party export continues to export the active route representation and the existing PoB payload format.
- English route files remain usable by downstream tools with no semantic changes.

## Failure handling

- Unknown or corrupted locale values use English.
- Missing Russian UI keys are prevented by typing and validation.
- Missing Russian game-entity values fall back to their English value.
- A malformed localized route fails validation and must not be deployed.
- Runtime translation lookup must not throw when a fallback exists.

## Validation and testing

Add a dependency-free `validate:i18n` command that checks:

- identical English and Russian UI key sets;
- ten route files per locale;
- matching section and step structure for every route pair;
- matching directive and fragment structure for every paired step;
- no untranslated English UI values accidentally present in the Russian dictionary;
- coverage of Russian names for game entities referenced by the default routes and imported build presentation;
- successful fallback for intentionally missing optional entity names.

Verification before release:

1. Install from the committed lockfile without adding dependencies.
2. Run localization validation.
3. Run the existing TypeScript and Vite production build.
4. Perform browser smoke tests for:
   - first-visit locale detection;
   - manual `EN ↔ RU` switching;
   - persisted selection after reload;
   - PoB import in both locales;
   - preserved route progress after switching;
   - Russian route, gem, quest, area, and reward display;
   - English fallback;
   - custom route stability;
   - passive-tree rendering and English tooltip fallback.

## Repository and delivery

- GitHub fork: `Simonerrror/exile-leveling`.
- Upstream remote: `HeartofPhos/exile-leveling`.
- Feature branch: `codex/russian-localization`.
- Local checkout: `/Users/sergio/Documents/30_HOBBY_AI/projects/exile-leveling`.
- Preserve the existing GitHub Pages workflow and `/exile-leveling/` Vite base.
- Push the feature branch only after validation.
- Merge to the fork's `main` and deploy only after user review.

## Maintenance

Upstream synchronization should update English data first. Localization validation then identifies new UI keys, changed route structure, and missing Russian game entities. Russian route edits stay isolated in locale files, minimizing merge conflicts with English application logic.

No new package is introduced for localization. If the upstream project later adopts an i18n framework, reassess this custom layer rather than maintaining two competing systems.
