# Useful Resources Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a polished, bilingual, accessible `/useful` page containing vetted PoE tools, the Heist companion order, the current-league map preset, and three expandable cheat sheets.

**Architecture:** Keep resource and cheat-sheet metadata in a typed, render-independent module; render it through one lazy page container plus a focused gallery component. Reuse the existing i18n layer, router, `react-modal`, icon package, and CSS-module conventions, with repository-owned static images and no new dependency.

**Tech Stack:** TypeScript 7, React 19, React Router 7, Jotai-backed i18n, react-modal 3, React Icons 5, CSS Modules, Vite 8, Node test runner through the existing `tsx` workspace dependency.

---

## File map

### New files

- `web/src/containers/Useful/resources.ts` — typed resource catalog, Heist branches, and cheat-sheet metadata.
- `seeding/src/localization/useful-resources.test.ts` — data integrity, link safety, locale-copy, and asset checks.
- `web/src/containers/Useful/CheatSheetGallery.tsx` — accessible preview figures and full-size modal.
- `web/src/containers/Useful/index.tsx` — page composition, quick navigation, resource sections, and Heist lists.
- `web/src/containers/Useful/styles.module.css` — responsive layout, cards, branches, gallery, modal, and reduced-motion rules.
- `web/public/useful/essence-visual-reference.png` — supplied Essence reference.
- `web/public/useful/sanctum-room-reference.png` — supplied Sanctum reference.
- `web/public/useful/vendor-recipes-reference.png` — supplied vendor recipe reference.

### Modified files

- `web/src/i18n/messages/en.json` — complete English page and accessibility copy.
- `web/src/i18n/messages/ru.json` — complete Russian page and accessibility copy.
- `web/src/components/Navbar/index.tsx` — localized `Useful` navigation item.
- `web/src/components/Modal/index.tsx` — accept an image-oriented modal size.
- `web/src/components/Modal/styles.module.css` — viewport-safe image modal dimensions.
- `web/src/containers/index.tsx` — lazy `/useful` route and localized document title.
- `seeding/package.json` — include the new dependency-free test in `test:i18n`.

## Fixed implementation choices

- The map preset URL for the current release is `https://ru.pathofexile.com/trade/search/Mirage/mkJBkBQeT6`.
- Resource names and Heist companion names remain canonical English names in both locales.
- Descriptions, headings, notes, button labels, alt text, and accessibility announcements are localized.
- Every external link opens a new tab with `target="_blank"` and `rel="noopener noreferrer"`.
- Images are served from `${import.meta.env.BASE_URL}useful/<filename>` so both Vite preview and `/exile-leveling/` GitHub Pages work.
- `react-modal` supplies focus containment, Escape handling, and trigger-focus restoration; the gallery supplies a visible close button, localized `contentLabel`, and direct native-resolution link.

---

### Task 1: Add the typed resource catalog under test

**Files:**
- Create: `seeding/src/localization/useful-resources.test.ts`
- Create: `web/src/containers/Useful/resources.ts`
- Modify: `seeding/package.json`

- [ ] **Step 1: Write the failing catalog test**

Create `resources.test.ts` with these assertions:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import en from "../../../web/src/i18n/messages/en.json" with { type: "json" };
import ru from "../../../web/src/i18n/messages/ru.json" with { type: "json" };
import {
  cheatSheets,
  heistBranches,
  resourceCategories,
  resources,
} from "../../../web/src/containers/Useful/resources.js";

test("the useful catalog has stable unique ids and safe URLs", () => {
  assert.equal(resources.length, 16);
  assert.equal(new Set(resources.map(({ id }) => id)).size, resources.length);
  for (const resource of resources) {
    const url = new URL(resource.url);
    assert.equal(url.protocol, "https:");
    assert.equal(resource.domain, url.hostname);
  }
});

test("the current league map preset preserves the supplied query", () => {
  assert.equal(
    resources.find(({ id }) => id === "map-preset")?.url,
    "https://ru.pathofexile.com/trade/search/Mirage/mkJBkBQeT6",
  );
});

test("resource categories contain every resource exactly once", () => {
  assert.deepEqual(
    resourceCategories.flatMap(({ resourceIds }) => resourceIds).sort(),
    resources.map(({ id }) => id).sort(),
  );
});

test("Heist branches match the supplied unlock order", () => {
  assert.deepEqual(heistBranches, [
    ["Tibbs", "Tullina", "Nenet"],
    ["Karst", "Huck", "Niles", "Vinderi", "Gianna"],
  ]);
});

test("cheat sheets have unique asset names and bilingual copy", () => {
  assert.equal(cheatSheets.length, 3);
  assert.equal(
    new Set(cheatSheets.map(({ filename }) => filename)).size,
    cheatSheets.length,
  );
  for (const sheet of cheatSheets) {
    for (const suffix of ["title", "description", "alt", "attribution"]) {
      const key = `useful.sheet.${sheet.id}.${suffix}`;
      assert.equal(typeof en[key as keyof typeof en], "string");
      assert.equal(typeof ru[key as keyof typeof ru], "string");
    }
  }
});
```

- [ ] **Step 2: Register and run the failing test**

Append `src/localization/useful-resources.test.ts` to the existing `test:i18n` command in `seeding/package.json`.

Run:

```bash
npm run test:i18n
```

Expected: FAIL because `resources.ts` does not exist.

- [ ] **Step 3: Implement the typed catalog**

Create `resources.ts` with literal unions inferred from the data:

```ts
export const resources = [
  { id: "blight-oils", category: "calculators", name: "Blight Oils Calculator", url: "https://blight.raelys.com/", domain: "blight.raelys.com" },
  { id: "chromatic", category: "calculators", name: "Chromatic Calculator", url: "https://siveran.github.io/calc.html", domain: "siveran.github.io" },
  { id: "timeless-jewel", category: "calculators", name: "Timeless Jewel Viewer", url: "https://vilsol.github.io/timeless-jewels/", domain: "vilsol.github.io" },
  { id: "cluster-jewel", category: "calculators", name: "Cluster Jewel Calculator", url: "https://theodorejbieber.github.io/PoEClusterJewelCalculator/", domain: "theodorejbieber.github.io" },
  { id: "craft-of-exile", category: "calculators", name: "Craft of Exile", url: "https://www.craftofexile.com/", domain: "www.craftofexile.com" },
  { id: "filterblade", category: "planning", name: "FilterBlade", url: "https://www.filterblade.xyz/", domain: "www.filterblade.xyz" },
  { id: "poe-re", category: "planning", name: "PoE.re", url: "https://poe.re/", domain: "poe.re" },
  { id: "poe-planner", category: "planning", name: "PoE Planner", url: "https://poeplanner.com/", domain: "poeplanner.com" },
  { id: "tft-bulk", category: "trade", name: "TFT Bulk Selling Tool", url: "https://the-forbidden-trove.github.io/bulk-selling-tool/", domain: "the-forbidden-trove.github.io" },
  { id: "trade-extension", category: "trade", name: "PoE Trade Extension", url: "https://chromewebstore.google.com/detail/poe-trade-extension/bikeebdigkompjnpcljicocidefgbhgl", domain: "chromewebstore.google.com" },
  { id: "awakened-trade", category: "trade", name: "Awakened PoE Trade", url: "https://github.com/SnosMe/awakened-poe-trade", domain: "github.com" },
  { id: "wealthy-exile", category: "analytics", name: "Wealthy Exile", url: "https://wealthyexile.com/", domain: "wealthyexile.com" },
  { id: "poe-ninja", category: "analytics", name: "poe.ninja", url: "https://poe.ninja/", domain: "poe.ninja" },
  { id: "poe-leveling", category: "other", name: "PoE-leveling", url: "https://poe-leveling.com/", domain: "poe-leveling.com" },
  { id: "merchant-tabs", category: "other", name: "Merchant Tabs", url: "https://www.pathofexile.com/my-account/merchants-tabs", domain: "www.pathofexile.com", note: "login" },
  { id: "map-preset", category: "other", name: "Current-league map preset", url: "https://ru.pathofexile.com/trade/search/Mirage/mkJBkBQeT6", domain: "ru.pathofexile.com", note: "featured" },
] as const;

export type Resource = (typeof resources)[number];
export type ResourceId = Resource["id"];
export type ResourceCategoryId = Resource["category"];

export const resourceCategories: readonly {
  id: ResourceCategoryId;
  resourceIds: readonly ResourceId[];
}[] = [
  { id: "calculators", resourceIds: ["blight-oils", "chromatic", "timeless-jewel", "cluster-jewel", "craft-of-exile"] },
  { id: "planning", resourceIds: ["filterblade", "poe-re", "poe-planner"] },
  { id: "trade", resourceIds: ["tft-bulk", "trade-extension", "awakened-trade"] },
  { id: "analytics", resourceIds: ["wealthy-exile", "poe-ninja"] },
  { id: "other", resourceIds: ["poe-leveling", "merchant-tabs", "map-preset"] },
];

export const heistBranches = [
  ["Tibbs", "Tullina", "Nenet"],
  ["Karst", "Huck", "Niles", "Vinderi", "Gianna"],
] as const;

export const cheatSheets = [
  { id: "essence", filename: "essence-visual-reference.png" },
  { id: "sanctum", filename: "sanctum-room-reference.png" },
  { id: "vendor-recipes", filename: "vendor-recipes-reference.png" },
] as const;

export type CheatSheet = (typeof cheatSheets)[number];
```

- [ ] **Step 4: Run the focused test**

Run:

```bash
npm run test:i18n
```

Expected: FAIL only because the new `useful.*` message keys are not present yet.

- [ ] **Step 5: Commit the red test and catalog**

```bash
git add seeding/package.json seeding/src/localization/useful-resources.test.ts web/src/containers/Useful/resources.ts
git commit -m "test: define useful resource catalog"
```

---

### Task 2: Add complete bilingual copy

**Files:**
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`

- [ ] **Step 1: Add page-level translation assertions**

Extend `resources.test.ts`:

```ts
test("the useful page exposes complete bilingual navigation copy", () => {
  for (const key of [
    "app.usefulTitle",
    "nav.useful",
    "useful.title",
    "useful.intro",
    "useful.jumpLabel",
    "useful.tools.title",
    "useful.heist.title",
    "useful.sheets.title",
    "useful.externalLink",
    "useful.openFullSize",
    "useful.closePreview",
  ]) {
    assert.equal(typeof en[key as keyof typeof en], "string");
    assert.equal(typeof ru[key as keyof typeof ru], "string");
  }
});
```

Run `npm run test:i18n`.

Expected: FAIL with missing `useful.*` values.

- [ ] **Step 2: Add exact English and Russian message families**

Add these exact English entries to `en.json`:

```json
{
  "app.usefulTitle": "Exile Leveling - Useful Resources",
  "nav.useful": "Useful",
  "useful.title": "Useful Path of Exile resources",
  "useful.intro": "Calculators, planning tools, trade helpers and compact references worth keeping close.",
  "useful.jumpLabel": "Jump to a useful resources section",
  "useful.tools.title": "Tools and links",
  "useful.tools.description": "Open a trusted tool for the job you are doing now.",
  "useful.heist.title": "Heist companion unlock order",
  "useful.heist.description": "Run contracts with these companions in order to unlock both branches.",
  "useful.heist.branch1": "Branch 1",
  "useful.heist.branch2": "Branch 2",
  "useful.sheets.title": "Cheat sheets",
  "useful.sheets.description": "Open any reference at full size when you need the details.",
  "useful.category.calculators": "Calculators",
  "useful.category.planning": "Planning and filters",
  "useful.category.trade": "Trade",
  "useful.category.analytics": "Analytics and profit",
  "useful.category.other": "Other useful resources",
  "useful.resource.blight-oils.description": "Pick oils for amulet, ring and Blighted map anointments.",
  "useful.resource.chromatic.description": "Estimate the cheapest way to colour item sockets.",
  "useful.resource.timeless-jewel.description": "Preview Timeless Jewel changes on the passive tree.",
  "useful.resource.cluster-jewel.description": "Check notable positions on Cluster Jewels.",
  "useful.resource.craft-of-exile.description": "Simulate crafting, mod weights and outcome chances.",
  "useful.resource.filterblade.description": "Create and tune a NeverSink item filter.",
  "useful.resource.poe-re.description": "Generate regex searches for vendors, maps and items.",
  "useful.resource.poe-planner.description": "Plan passive trees, clusters, items and jewels.",
  "useful.resource.tft-bulk.description": "Prepare bulk listings for TFT trading.",
  "useful.resource.trade-extension.description": "Add folders, tracking and trade utilities to the browser.",
  "useful.resource.awakened-trade.description": "Price-check items and inspect modifiers without leaving the game.",
  "useful.resource.wealthy-exile.description": "Track stash value, profit, drops and strategy ROI.",
  "useful.resource.poe-ninja.description": "Compare league prices, builds and the current meta.",
  "useful.resource.poe-leveling.description": "Plan campaign progression and character requirements.",
  "useful.resource.merchant-tabs.description": "Buy merchant tabs for Faustus and instant-buy trading.",
  "useful.resource.map-preset.description": "High-pack-size maps with safe modifiers for the “two prefixes, no suffixes” scarab setup.",
  "useful.note.login": "Path of Exile login required",
  "useful.note.featured": "Current league preset",
  "useful.externalLink": "Opens an external site in a new tab",
  "useful.openFullSize": "Open full-size preview",
  "useful.openOriginal": "Open original image",
  "useful.closePreview": "Close image preview",
  "useful.sheet.essence.title": "Essence visual reference",
  "useful.sheet.essence.description": "Essence tiers, modifiers, level requirements and corruption outcomes.",
  "useful.sheet.essence.alt": "Visual table of Path of Exile Essence tiers and modifier families.",
  "useful.sheet.essence.attribution": "Created by /u/Conan-The-Librarian; attribution printed on the source image.",
  "useful.sheet.sanctum.title": "Sanctum room reference",
  "useful.sheet.sanctum.description": "Room objectives, bosses, rewards and fountains across four floors.",
  "useful.sheet.sanctum.alt": "Four-floor Path of Exile Sanctum room and reward reference.",
  "useful.sheet.sanctum.attribution": "Path of Exile community on Reddit; attribution printed on the supplied capture.",
  "useful.sheet.vendor-recipes.title": "Vendor recipe reference",
  "useful.sheet.vendor-recipes.description": "Common socket, quality, crafting, unique, utility and flask recipes.",
  "useful.sheet.vendor-recipes.alt": "Path of Exile vendor recipe cheat sheet arranged by item category.",
  "useful.sheet.vendor-recipes.attribution": "Made by Sherberoot, inspired by Naviaux; information sourced from poewiki.net."
}
```

Add these exact Russian entries to `ru.json`:

```json
{
  "app.usefulTitle": "Exile Leveling — Полезное",
  "nav.useful": "Полезное",
  "useful.title": "Полезное для Path of Exile",
  "useful.intro": "Калькуляторы, планировщики, трейд-инструменты и шпаргалки, которые удобно держать под рукой.",
  "useful.jumpLabel": "Перейти к разделу полезных материалов",
  "useful.tools.title": "Инструменты и ссылки",
  "useful.tools.description": "Выбери проверенный инструмент под текущую задачу.",
  "useful.heist.title": "Порядок открытия компаньонов Heist",
  "useful.heist.description": "Проходи контракты с компаньонами по порядку, чтобы открыть обе ветки.",
  "useful.heist.branch1": "Ветка 1",
  "useful.heist.branch2": "Ветка 2",
  "useful.sheets.title": "Шпаргалки",
  "useful.sheets.description": "Открой нужную схему крупно, когда понадобятся детали.",
  "useful.category.calculators": "Калькуляторы",
  "useful.category.planning": "Планирование и фильтры",
  "useful.category.trade": "Продажа и трейд",
  "useful.category.analytics": "Аналитика и профит",
  "useful.category.other": "Прочее полезное",
  "useful.resource.blight-oils.description": "Подбор масел для зачарований амулетов, колец и заражённых карт.",
  "useful.resource.chromatic.description": "Расчёт самого дешёвого способа покрасить гнёзда предмета.",
  "useful.resource.timeless-jewel.description": "Просмотр изменений таймлесс-самоцветов на дереве пассивов.",
  "useful.resource.cluster-jewel.description": "Проверка расположения значимых пассивок в кластерах.",
  "useful.resource.craft-of-exile.description": "Симулятор крафта, весов модов и вероятностей результата.",
  "useful.resource.filterblade.description": "Создание и настройка лутфильтра NeverSink.",
  "useful.resource.poe-re.description": "Генератор regex для торговцев, карт и поиска предметов.",
  "useful.resource.poe-planner.description": "Планирование дерева, кластеров, предметов и самоцветов.",
  "useful.resource.tft-bulk.description": "Подготовка массовых лотов для торговли через TFT.",
  "useful.resource.trade-extension.description": "Папки, отслеживание и трейд-инструменты прямо в браузере.",
  "useful.resource.awakened-trade.description": "Оценка предметов и модов без выхода из игры.",
  "useful.resource.wealthy-exile.description": "Учёт стоимости тайников, профита, дропа и окупаемости стратегий.",
  "useful.resource.poe-ninja.description": "Цены лиги, сборки и текущая мета.",
  "useful.resource.poe-leveling.description": "Планирование прохождения кампании и требований персонажа.",
  "useful.resource.merchant-tabs.description": "Покупка торговых вкладок для Фауста и мгновенных сделок.",
  "useful.resource.map-preset.description": "Карты с высоким размером групп и безопасными модами: скараб «2 префикса, без суффиксов».",
  "useful.note.login": "Требуется вход в Path of Exile",
  "useful.note.featured": "Пресет текущей лиги",
  "useful.externalLink": "Откроется внешний сайт в новой вкладке",
  "useful.openFullSize": "Открыть крупное изображение",
  "useful.openOriginal": "Открыть оригинал",
  "useful.closePreview": "Закрыть изображение",
  "useful.sheet.essence.title": "Визуальная шпаргалка по сущностям",
  "useful.sheet.essence.description": "Уровни сущностей, свойства, требования и результаты осквернения.",
  "useful.sheet.essence.alt": "Таблица уровней и групп свойств сущностей Path of Exile.",
  "useful.sheet.essence.attribution": "Автор: /u/Conan-The-Librarian; подпись сохранена с исходного изображения.",
  "useful.sheet.sanctum.title": "Комнаты Запретного святилища",
  "useful.sheet.sanctum.description": "Цели комнат, боссы, награды и фонтаны на четырёх этажах.",
  "useful.sheet.sanctum.alt": "Шпаргалка по комнатам и наградам четырёх этажей Запретного святилища.",
  "useful.sheet.sanctum.attribution": "Сообщество Path of Exile на Reddit; подпись сохранена с присланного изображения.",
  "useful.sheet.vendor-recipes.title": "Рецепты торговцев",
  "useful.sheet.vendor-recipes.description": "Рецепты для гнёзд, качества, крафта, уникальных предметов, флаконов и прочего.",
  "useful.sheet.vendor-recipes.alt": "Шпаргалка по рецептам торговцев Path of Exile, разбитая по категориям.",
  "useful.sheet.vendor-recipes.attribution": "Автор: Sherberoot, по мотивам Naviaux; источник данных — poewiki.net."
}
```

- [ ] **Step 3: Run validation and build**

Run:

```bash
npm run test:i18n
npm run validate:i18n
npm run build -w web
```

Expected: tests and validation PASS; TypeScript/Vite build succeeds.

- [ ] **Step 4: Commit the bilingual copy**

```bash
git add web/src/i18n/messages/en.json web/src/i18n/messages/ru.json seeding/src/localization/useful-resources.test.ts
git commit -m "feat: add useful page copy"
```

---

### Task 3: Add and verify the supplied cheat-sheet assets

**Files:**
- Modify: `seeding/src/localization/useful-resources.test.ts`
- Create: `web/public/useful/essence-visual-reference.png`
- Create: `web/public/useful/sanctum-room-reference.png`
- Create: `web/public/useful/vendor-recipes-reference.png`

- [ ] **Step 1: Add a failing PNG asset test**

Append:

```ts
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

test("every cheat-sheet asset is a checked-in PNG", async () => {
  const publicDirectory = fileURLToPath(
    new URL("../../../web/public/useful/", import.meta.url),
  );
  for (const sheet of cheatSheets) {
    const bytes = await readFile(`${publicDirectory}${sheet.filename}`);
    assert.deepEqual(
      [...bytes.subarray(0, 8)],
      [137, 80, 78, 71, 13, 10, 26, 10],
    );
    assert.ok(bytes.length > 100_000);
  }
});
```

Run `npm run test:i18n`.

Expected: FAIL with `ENOENT`.

- [ ] **Step 2: Copy the exact supplied files**

Create `web/public/useful/` and copy:

```text
/var/folders/2m/0qpnvbkx5js18dwv91js6ng80000gn/T/codex-clipboard-c763a6b2-cfdc-475d-8e2b-04a0ff1e69de.png
  -> web/public/useful/essence-visual-reference.png
/var/folders/2m/0qpnvbkx5js18dwv91js6ng80000gn/T/codex-clipboard-b9c5f9f0-fe5b-4ab0-b574-3bc404ab1f2e.png
  -> web/public/useful/sanctum-room-reference.png
/var/folders/2m/0qpnvbkx5js18dwv91js6ng80000gn/T/codex-clipboard-8818c5b9-f0bc-4a53-be80-3cb4787a7583.png
  -> web/public/useful/vendor-recipes-reference.png
```

Do not recompress, crop, recolor, or strip attribution from the supplied images.

- [ ] **Step 3: Run the asset test**

Run:

```bash
npm run test:i18n
```

Expected: all tests PASS.

- [ ] **Step 4: Commit the owned assets**

```bash
git add web/public/useful seeding/src/localization/useful-resources.test.ts
git commit -m "assets: add Path of Exile reference sheets"
```

---

### Task 4: Build the accessible cheat-sheet gallery

**Files:**
- Create: `web/src/containers/Useful/CheatSheetGallery.tsx`
- Create: `web/src/containers/Useful/styles.module.css`
- Modify: `web/src/components/Modal/index.tsx`
- Modify: `web/src/components/Modal/styles.module.css`

- [ ] **Step 1: Extend the existing modal size contract**

Change:

```ts
interface ModalSizeProps {
  size: "small" | "large" | "image";
}
```

Add:

```css
.image {
  max-height: calc(100vh - 2rem);
  max-width: calc(100vw - 2rem);
}
```

The shared modal continues to use `react-modal`; do not replace or fork its focus management.

- [ ] **Step 2: Implement the gallery**

`CheatSheetGallery` must:

- keep `selectedSheet` in React state;
- render each preview inside `<figure>`;
- use `<button type="button">` as the preview trigger;
- build image URLs with `${import.meta.env.BASE_URL}useful/${sheet.filename}`;
- translate title, description, alt, and attribution with `useI18n`;
- render `<Modal size="image">` with `contentLabel`, `onRequestClose`, and `shouldReturnFocusAfterClose={true}`;
- provide a visible close button with `autoFocus`, a direct original-image anchor, and the full-size image;
- mark decorative `FaExpand`, `FaExternalLinkAlt`, and `FaTimes` icons `aria-hidden`.

Use this state boundary:

```tsx
const [selectedSheet, setSelectedSheet] = useState<CheatSheet | null>(null);
const closePreview = () => setSelectedSheet(null);
const imageUrl = (sheet: CheatSheet) =>
  `${import.meta.env.BASE_URL}useful/${sheet.filename}`;
```

Use translated dynamic keys through one narrow helper:

```tsx
const sheetText = (
  sheet: CheatSheet,
  field: "title" | "description" | "alt" | "attribution",
) => t(`useful.sheet.${sheet.id}.${field}` as MessageKey);
```

- [ ] **Step 3: Add gallery and modal styling**

Implement:

- `gallery` as an auto-fit grid with a minimum card width that collapses below `30rem`;
- `sheetCard`, `sheetTrigger`, `sheetPreview`, `sheetCaption`, and `attribution`;
- `previewBody`, `previewToolbar`, `previewImage`, `closeButton`, and `originalLink`;
- `object-fit: contain` for modal imagery;
- minimum `2.75rem` interactive targets;
- no hover-only content;
- `@media (prefers-reduced-motion: reduce)` disabling any card/overlay transition.

- [ ] **Step 4: Verify TypeScript and asset bundling**

Run:

```bash
npm run build -w web
find web/dist -path "*/useful/*.png" -type f -print
```

Expected: build succeeds and all three PNGs are present under `web/dist/useful/`.

- [ ] **Step 5: Commit the gallery**

```bash
git add web/src/components/Modal web/src/containers/Useful/CheatSheetGallery.tsx web/src/containers/Useful/styles.module.css
git commit -m "feat: add accessible reference gallery"
```

---

### Task 5: Compose the responsive Useful page

**Files:**
- Create: `web/src/containers/Useful/index.tsx`
- Modify: `web/src/containers/Useful/styles.module.css`
- Modify: `web/src/components/Navbar/index.tsx`
- Modify: `web/src/containers/index.tsx`

- [ ] **Step 1: Register the lazy route and navigation item**

In `web/src/containers/index.tsx`, add:

```tsx
const UsefulContainer = withBlank(lazy(() => import("./Useful")));
```

and inside `<Routes>`:

```tsx
<Route
  path="/useful"
  element={
    <Page
      title={t("app.usefulTitle")}
      component={<UsefulContainer />}
    />
  }
/>
```

Import `FaBookOpen` in `web/src/components/Navbar/index.tsx`. Insert after the Build item:

```tsx
<NavbarItem
  label={t("nav.useful")}
  expand={navExpand}
  icon={<FaBookOpen aria-hidden={true} className="inlineIcon" />}
  onClick={() => {
    navigate("/useful");
    setNavExpand(false);
  }}
/>
```

- [ ] **Step 2: Implement semantic page composition**

The component must render:

```tsx
<main className={styles.page}>
  <header className={styles.hero}>
    <h1>{t("useful.title")}</h1>
    <p>{t("useful.intro")}</p>
  </header>
  <nav aria-label={t("useful.jumpLabel")} className={styles.jumpNav}>
    <a href="#useful-tools">{t("useful.tools.title")}</a>
    <a href="#useful-heist">{t("useful.heist.title")}</a>
    <a href="#useful-sheets">{t("useful.sheets.title")}</a>
  </nav>
  <section id="useful-tools" aria-labelledby="useful-tools-title">
    <h2 id="useful-tools-title">{t("useful.tools.title")}</h2>
    <p>{t("useful.tools.description")}</p>
    {resourceSections}
  </section>
  <section id="useful-heist" aria-labelledby="useful-heist-title">
    <h2 id="useful-heist-title">{t("useful.heist.title")}</h2>
    <p>{t("useful.heist.description")}</p>
    {heistLists}
  </section>
  <section id="useful-sheets" aria-labelledby="useful-sheets-title">
    <h2 id="useful-sheets-title">{t("useful.sheets.title")}</h2>
    <p>{t("useful.sheets.description")}</p>
    <CheatSheetGallery />
  </section>
</main>
```

Implementation requirements:

- one `<h1>` and one `<h2>` per primary section;
- quick links to `#useful-tools`, `#useful-heist`, and `#useful-sheets`;
- one `<h3>` and card grid per `resourceCategories` item;
- resource lookup through a `Map<ResourceId, Resource>`;
- each card as a single descriptive external anchor with title, description, domain, visible external icon, and optional note badge;
- the `map-preset` card receives `styles.featuredCard`;
- Heist branches render as two `<ol>` elements, each with localized branch heading and decorative arrow connectors;
- `<CheatSheetGallery />` renders inside the final section.

Dynamic message helpers must narrow casts to `MessageKey`:

```tsx
const categoryText = (id: ResourceCategoryId) =>
  t(`useful.category.${id}` as MessageKey);
const resourceText = (id: ResourceId) =>
  t(`useful.resource.${id}.description` as MessageKey);
```

External anchors must use:

```tsx
target="_blank"
rel="noopener noreferrer"
aria-label={`${resource.name}. ${t("useful.externalLink")}`}
```

- [ ] **Step 3: Complete the page styling**

Implement the agreed presentation:

- readable hero with maximum text width;
- wrapping quick-nav pills;
- section spacing and visible section dividers;
- resource grid with `repeat(auto-fit, minmax(min(100%, 16rem), 1fr))`;
- cards with persistent border, clear focus-visible state, restrained lift on pointer hover, and no layout shift;
- featured map card with a warm Path of Exile-style accent that retains WCAG-readable text;
- Heist ordered lists displayed horizontally with CSS counters/arrows on wide screens and vertically below `40rem`;
- user-select enabled for descriptions and companion names;
- no horizontal page overflow at `320px`;
- reduced-motion override for transforms/transitions.

- [ ] **Step 4: Run all automated checks**

Run:

```bash
npm run test:i18n
npm run validate:i18n
npm run build -w web
git diff --check
```

Expected: all tests PASS, localization validation PASS, TypeScript/Vite build succeeds, and `git diff --check` prints nothing.

- [ ] **Step 5: Commit the complete page**

```bash
git add web/src/components/Navbar/index.tsx web/src/containers/index.tsx web/src/containers/Useful
git commit -m "feat: add useful Path of Exile resources page"
```

---

### Task 6: Browser accessibility and regression verification

**Files:**
- Modify only files implicated by a reproduced failure.

- [ ] **Step 1: Start the production preview**

Run:

```bash
npm run preview -w web -- --host 127.0.0.1
```

Expected: Vite reports a local URL containing `/exile-leveling/`.

- [ ] **Step 2: Verify desktop Russian behavior**

At a desktop viewport:

- select RU;
- open `/exile-leveling/useful`;
- confirm Russian title, navigation, descriptions, notes, Heist headings, and gallery controls;
- confirm all 16 cards and three images render;
- confirm the map card describes the `2 префикса, без суффиксов` strategy and points to Mirage query `mkJBkBQeT6`;
- open each cheat sheet and verify close button, Escape, backdrop close, direct original link, focus restoration, and uncropped fit.

- [ ] **Step 3: Verify keyboard and screen structure**

Using only Tab, Shift+Tab, Enter, and Escape:

- reach quick navigation, every resource card, each image trigger, and modal controls;
- confirm focus is always visible;
- confirm focus remains inside an open modal;
- confirm closing returns focus to the originating preview;
- inspect the accessibility tree for one `main`, one `h1`, ordered heading levels, labeled nav, two ordered Heist lists, descriptive figures, and labeled dialogs.

- [ ] **Step 4: Verify responsive layout**

At `320 × 720`, `768 × 1024`, and `1280 × 800`:

- no horizontal document scrollbar;
- no clipped resource names, branch names, captions, or modal controls;
- Heist branches become vertical at the narrow breakpoint;
- preview images preserve aspect ratio;
- touch targets remain at least `44 × 44` CSS pixels.

- [ ] **Step 5: Verify English and existing routes**

- switch to EN and confirm all page UI changes without reload;
- load `/`, `/build`, and `/edit-route`;
- confirm navigation, saved route progress, and imported build state remain intact;
- reload `/useful` and confirm the selected locale persists.

- [ ] **Step 6: Fix only reproduced issues and rerun verification**

For every browser failure, record the exact reproduction, make the smallest scoped correction, rerun the relevant check, then run:

```bash
npm run test:i18n
npm run validate:i18n
npm run build -w web
git diff --check
```

Expected: all checks PASS.

- [ ] **Step 7: Commit browser fixes if any**

```bash
git add web/src web/public/useful seeding/package.json
git commit -m "fix: polish useful page accessibility"
```

Skip this commit if the browser pass required no source change.

---

### Task 7: Final review, feature commit state, and local preview gate

**Files:**
- Modify only files required by review findings.

- [ ] **Step 1: Run final verification from a clean build**

Run:

```bash
npm run test:i18n
npm run validate:i18n
npm run build -w web
git diff --check
git status --short
```

Expected: tests PASS, validation PASS, build succeeds, no whitespace errors, and no uncommitted feature files.

- [ ] **Step 2: Review the branch diff**

Run:

```bash
git diff --stat bf575bb..HEAD
git diff --check bf575bb..HEAD
```

Confirm every changed line traces to the approved Useful-page spec and the three supplied images.

- [ ] **Step 3: Push the feature branch**

```bash
git push origin codex/russian-localization
```

Expected: origin advances to the verified local HEAD.

- [ ] **Step 4: Start and retain the local production preview**

Run:

```bash
npm run preview -w web -- --host 127.0.0.1
```

Keep the process alive and provide the exact `/exile-leveling/useful` URL to the user.

- [ ] **Step 5: Stop at the approval gate**

Do not merge `main` and do not trigger GitHub Pages. Wait for the user’s explicit approval of the local preview.

- [ ] **Step 6: Merge and deploy only after approval**

After approval:

1. update the canonical checkout from the verified branch without dropping unrelated user changes;
2. merge `codex/russian-localization` into the fork’s `main`;
3. push `main`;
4. wait for the existing GitHub Pages workflow;
5. verify the published `/exile-leveling/useful` page in RU and EN;
6. report the deployed URL and workflow result.
