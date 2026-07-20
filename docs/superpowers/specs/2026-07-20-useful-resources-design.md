# Useful Resources Page Design

## Summary

Add a dedicated `/useful` page to Exile Leveling and expose it through the main navigation. The page gathers reliable Path of Exile tools, the supplied Heist companion unlock order, an up-to-date map trade preset, and three visual cheat sheets in one responsive, accessible reference.

The page follows the existing dark interface, supports the built-in English/Russian locale switch, and introduces no new package dependency.

## Goals

- Make frequently used Path of Exile resources easy to scan and open.
- Add a clear `Полезное` / `Useful` item to the expanded navigation.
- Organize links by player task rather than as one undifferentiated list.
- Show the two Heist companion unlock branches as readable sequences.
- Present supplied cheat sheets as responsive previews that can be enlarged.
- Keep Russian as the primary authored experience while providing complete English UI copy.
- Meet keyboard, screen-reader, contrast, focus, responsive-layout, and reduced-motion expectations.
- Preserve the existing Vite base path and GitHub Pages deployment.

## Non-goals

- Reimplementing third-party calculators or trade tools.
- Automatically monitoring every external service at runtime.
- Hosting editable community submissions or user accounts.
- Translating text embedded inside the supplied raster cheat sheets.
- Adding a general-purpose content-management system.

## Information Architecture

The page uses one semantic main heading and four primary sections:

1. **Quick navigation** — compact anchor links to the page sections.
2. **Tools and links** — task-oriented resource cards grouped as:
   - Calculators;
   - Planning and filters;
   - Trade;
   - Analytics and profit;
   - Other useful resources.
3. **Heist companions** — two explicit unlock branches.
4. **Cheat sheets** — Essence, Sanctum, and vendor-recipe visual references.

On wide screens, resource cards use a restrained multi-column grid. On narrow screens they become a single column without horizontal page scrolling. The quick navigation wraps naturally and remains part of normal document flow rather than becoming a permanent sticky overlay.

## Navigation and Routing

- Add a lazily loaded `Useful` container at `/useful`.
- Add localized document titles for the route.
- Add a `Useful` navigation item using an existing icon package.
- Selecting the item closes the expanded navigation and navigates internally without a page reload.
- Existing routes, progress, imported build data, and locale state are unaffected.

## Resource Data

Resource metadata lives in a small typed data module rather than being embedded in JSX. Every entry contains:

- a stable identifier;
- category;
- canonical service name;
- URL;
- localized description key;
- optional localized note or badge.

The initial catalog contains:

### Calculators

- Blight Oils Calculator — `https://blight.raelys.com/`
- Chromatic Calculator — `https://siveran.github.io/calc.html`
- Timeless Jewel Viewer — `https://vilsol.github.io/timeless-jewels/`
- Cluster Jewel Calculator — `https://theodorejbieber.github.io/PoEClusterJewelCalculator/`
- Craft of Exile — `https://www.craftofexile.com/`

### Planning and filters

- FilterBlade — `https://www.filterblade.xyz/`
- PoE.re — `https://poe.re/`
- PoE Planner — `https://poeplanner.com/`

### Trade

- TFT Bulk Selling Tool — `https://the-forbidden-trove.github.io/bulk-selling-tool/`
- PoE Trade Extension — `https://chromewebstore.google.com/detail/poe-trade-extension/bikeebdigkompjnpcljicocidefgbhgl`
- Awakened PoE Trade — `https://github.com/SnosMe/awakened-poe-trade`

### Analytics and profit

- Wealthy Exile — `https://wealthyexile.com/`
- poe.ninja — `https://poe.ninja/`

### Other useful resources

- PoE-leveling — `https://poe-leveling.com/`
- Merchant tabs — `https://www.pathofexile.com/my-account/merchants-tabs`
- Current-league map preset — `https://ru.pathofexile.com/trade/search/Mirage/mkJBkBQeT6`

The map preset is described as a search for high-pack-size maps with safe modifiers using the “two prefixes, no suffixes” scarab strategy. It is labeled as the current-league preset, not as permanently tied to Mirage. During a league refresh, maintainers update only its league URL segment while retaining the saved query identifier when Path of Exile accepts it.

Merchant tabs receive a visible “login required” note. The Chromatic Calculator may be described as a classic focused tool, but the page does not imply that old update dates make its calculation invalid.

All external links open in a new tab, use `noopener noreferrer`, show their destination domain, include a visible external-link indicator, and communicate the new-tab behavior to assistive technology.

## Heist Companion Order

The Heist section presents two independent ordered lists:

- Tibbs → Tullina → Nenet
- Karst → Huck → Niles → Vinderi → Gianna

The desktop presentation may visually connect steps with arrows, but the underlying markup remains ordered lists. On narrow screens, each branch becomes a vertical sequence so names never shrink below a comfortable reading size. Decorative connectors are hidden from screen readers.

Canonical English companion names remain unchanged in both locales because they are recognizable search terms and match the supplied material. Headings, explanations, and accessibility labels are localized.

## Cheat-Sheet Gallery

Copy the supplied images into repository-owned static assets with descriptive filenames:

- `essence-visual-reference.png`
- `sanctum-room-reference.png`
- `vendor-recipes-reference.png`

Each figure contains:

- a localized title;
- a concise localized description of what the sheet helps with;
- a responsive preview;
- visible source/author attribution based on information present in the image;
- an explicit button or link for opening the full-size image.

The full-size view uses the existing modal pattern if it satisfies the requirements below; otherwise it receives the smallest targeted accessibility corrections needed:

- focus moves into the modal when opened;
- the close control has a localized accessible name;
- `Escape` closes the modal;
- keyboard focus cannot move behind the modal;
- closing restores focus to the trigger;
- clicking the backdrop may close the modal but is not the only exit;
- the image can fit within the viewport without being cropped and can be opened directly at native resolution.

Descriptive Russian and English `alt` text identifies the subject and purpose of each image. It does not attempt to reproduce every line of embedded reference text. Attribution remains visible:

- Essence reference: `/u/Conan-The-Librarian`, as printed on the source image;
- Sanctum reference: Path of Exile community on Reddit, as printed on the supplied capture;
- Vendor recipes: Sherberoot, inspired by Naviaux, with poewiki.net cited as the information source, as printed on the image.

## Visual Style

- Reuse existing colors, typography, borders, spacing rhythm, and interactive states.
- Use a clear page introduction and restrained accent colors to distinguish categories.
- Keep cards equal in visual weight; the map preset may receive a modest featured treatment because it is a user-curated workflow.
- Avoid dense emoji decoration, hover-only information, excessive animation, and layout shifts.
- Respect `prefers-reduced-motion`.
- Preserve readable line length and a minimum comfortable touch target for interactive controls.

## Localization

Add English and Russian message keys for:

- route and navigation labels;
- section headings and introductions;
- category names;
- resource descriptions, notes, and badges;
- Heist explanations;
- cheat-sheet titles, descriptions, attributions, alt text, and controls;
- external-link and modal accessibility text.

Service and product names remain canonical. Switching locale updates the page immediately and does not replace URLs or lose scroll-independent application state. English continues to be the fallback for an unavailable translation.

## Failure Handling

- The page renders from checked-in data and assets and requires no external API call.
- A third-party outage does not break page rendering; the link remains available for later use.
- Static assets use the project base path correctly under local development and GitHub Pages.
- If an image fails to load, its figure title, description, and alt text still communicate its purpose.
- Invalid resource entries are rejected by TypeScript and targeted validation tests.

## Testing and Verification

Automated checks cover:

- `/useful` route registration and localized document title;
- localized navigation and page message keys;
- resource categories, required URLs, and safe external-link attributes;
- the current-league map preset and its user-facing description;
- semantic ordered lists for both Heist branches;
- image metadata and full-size controls;
- modal keyboard behavior where practical in the existing test environment;
- production asset paths under the configured Vite base.

Release verification includes:

1. Run the existing localization validation and test suite.
2. Run the production build from the committed lockfile without adding dependencies.
3. Inspect the page at desktop and narrow mobile viewport widths.
4. Navigate the complete page using only the keyboard.
5. Confirm visible focus, sensible heading order, link destinations, locale switching, modal open/close/focus restoration, and direct full-size image access.
6. Confirm existing route, build, and route-editor screens still load.

## Delivery Gate

Delivery follows the user-approved sequence:

1. Implement and verify on `codex/russian-localization`.
2. Commit the finished feature.
3. Start a local preview and provide its URL for user review.
4. Wait for explicit user approval.
5. Merge the verified branch into the fork’s `main`.
6. Deploy through the existing GitHub Pages workflow and verify the published page.

No merge to `main` or production deployment occurs before the preview approval.
