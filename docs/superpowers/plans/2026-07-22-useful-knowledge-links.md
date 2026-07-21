# Useful Knowledge Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать с главной дубли сценария прокачки, добавить компактные PoELab-ссылки и Path of Exile Wiki и унифицировать RU-термины «билд» и «дерево умений».

**Architecture:** Четыре PoELab URL и соответствующие area ID живут в одном независимом модуле данных, который используют и Ascend-фрагмент маршрута, и главная. Главная сохраняет существующую модель внутренних и внешних карточек: во внутренних остаются два самостоятельных сценария, Wiki добавляется в новую внешнюю категорию, а четыре однотипные ссылки Лабиринта выводятся отдельной компактной сеткой.

**Tech Stack:** React 19, TypeScript, React Router, CSS Modules, react-icons, Node test runner через `tsx`, Vite/PWA.

---

## File map

- Create: `web/src/features/labyrinth-links.ts` — единственный источник PoELab URL, difficulty ID и area ID.
- Modify: `web/src/components/FragmentStep/Fragment/index.tsx` — использовать общий реестр вместо локального `ASCEND_LOOKUP`.
- Modify: `web/src/containers/Useful/tools.ts` — оставить только `leveling` и `regex`, убрать внутреннюю категорию `reference`.
- Modify: `web/src/containers/Useful/resources.ts` — добавить категорию `knowledge` и карточку Path of Exile Wiki.
- Modify: `web/src/containers/Useful/index.tsx` — рендерить категории из данных и добавить компактный блок Лабиринта.
- Modify: `web/src/containers/Useful/styles.module.css` — стили четырёх PoELab-кнопок и акцент базы знаний.
- Modify: `web/src/i18n/messages/en.json` — Labyrinth/Knowledge/Wiki строки и удаление неиспользуемых tool-card строк.
- Modify: `web/src/i18n/messages/ru.json` — те же строки плюс глобальная терминология «билд»/«дерево умений».
- Modify: `seeding/src/localization/poe-tools-shell.test.ts` — контракт внутренней иерархии и общего реестра PoELab.
- Modify: `seeding/src/localization/useful-resources.test.ts` — контракт Wiki, категорий, Labyrinth UI и RU-терминологии.

### Task 1: Shared PoELab registry

**Files:**
- Create: `web/src/features/labyrinth-links.ts`
- Modify: `web/src/components/FragmentStep/Fragment/index.tsx:1-20,224-266`
- Test: `seeding/src/localization/poe-tools-shell.test.ts`

- [ ] **Step 1: Write the failing registry test**

Import `labyrinthLinks` and `labyrinthLinksById`, then add:

```ts
test("shares four canonical PoELab daily-layout links", () => {
  assert.deepEqual(
    labyrinthLinks.map(({ id }) => id),
    ["normal", "cruel", "merciless", "eternal"],
  );
  assert.equal(new Set(labyrinthLinks.map(({ url }) => url)).size, 4);
  for (const link of labyrinthLinks) {
    assert.equal(new URL(link.url).protocol, "https:");
    assert.equal(new URL(link.url).hostname, "www.poelab.com");
    assert.equal(labyrinthLinksById[link.id], link);
  }

  const fragment = readSource(
    "../../../web/src/components/FragmentStep/Fragment/index.tsx",
  );
  assert.match(fragment, /labyrinthLinksById/);
  assert.doesNotMatch(fragment, /const ASCEND_LOOKUP/);
  assert.doesNotMatch(fragment, /https:\/\/www\.poelab\.com/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:i18n -w seeding
```

Expected: FAIL because `web/src/features/labyrinth-links.ts` does not exist.

- [ ] **Step 3: Create the minimal shared registry**

Create `web/src/features/labyrinth-links.ts`:

```ts
export type LabyrinthId = "normal" | "cruel" | "merciless" | "eternal";

export type LabyrinthLink = Readonly<{
  id: LabyrinthId;
  url: string;
  areaId: string;
}>;

export const labyrinthLinks = [
  { id: "normal", url: "https://www.poelab.com/gtgax", areaId: "1_Labyrinth_boss_3" },
  { id: "cruel", url: "https://www.poelab.com/r8aws", areaId: "2_Labyrinth_boss_3" },
  { id: "merciless", url: "https://www.poelab.com/riikv", areaId: "3_Labyrinth_boss_3" },
  { id: "eternal", url: "https://www.poelab.com/wfbra", areaId: "EndGame_Labyrinth_boss_3" },
] as const satisfies readonly LabyrinthLink[];

export const labyrinthLinksById = Object.fromEntries(
  labyrinthLinks.map((link) => [link.id, link]),
) as Readonly<Record<LabyrinthId, LabyrinthLink>>;
```

In `Fragment/index.tsx`, import `labyrinthLinksById`, delete `ASCEND_LOOKUP`, and replace:

```ts
const { url, areaId } = labyrinthLinksById[version];
```

- [ ] **Step 4: Run the test and verify GREEN**

Run the same `test:i18n` command. Expected: all localization/shell tests PASS.

- [ ] **Step 5: Commit Task 1**

Stage only the three Task 1 files and commit with subject:

```text
refactor(leveling): share PoELab link registry
```

### Task 2: Correct homepage hierarchy and add PoE Wiki

**Files:**
- Modify: `web/src/containers/Useful/tools.ts`
- Modify: `web/src/containers/Useful/resources.ts`
- Modify: `web/src/containers/Useful/index.tsx`
- Modify: `web/src/containers/Useful/styles.module.css`
- Modify: `web/src/i18n/messages/en.json`
- Modify: `web/src/i18n/messages/ru.json`
- Test: `seeding/src/localization/poe-tools-shell.test.ts`
- Test: `seeding/src/localization/useful-resources.test.ts`

- [ ] **Step 1: Write failing hierarchy and Wiki tests**

Change the internal-tools contract to:

```ts
assert.deepEqual(internalTools.map(({ id }) => id), ["leveling", "regex"]);
assert.deepEqual(internalToolCategories.map(({ id }) => id), ["tools"]);
```

Change the resource expectations to 13 entries, append `"Path of Exile Wiki"`, and add:

```ts
const wiki = resources.find(({ id }) => id === "poe-wiki");
assert.ok(wiki);
assert.equal(wiki.category, "knowledge");
assert.equal(wiki.url, "https://www.poewiki.net/wiki/Path_of_Exile_Wiki");
assert.equal(wiki.domain, "www.poewiki.net");
assert.match(wiki.icon, /^https:\/\/www\.poewiki\.net\//);
assert.deepEqual(resourceCategories.map(({ id }) => id), [
  "calculators",
  "planning",
  "trade",
  "analytics",
  "knowledge",
]);
```

Add source assertions that `Useful/index.tsx` contains `labyrinthLinks`, `useful-labyrinth`, `FaKey`, and does not contain a literal `(["tools", "reference"]` category loop.

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:i18n -w seeding
```

Expected: FAIL because three duplicate internal cards remain, Wiki/knowledge do not exist, and Labyrinth UI is absent.

- [ ] **Step 3: Reduce internal tools to independent scenarios**

In `tools.ts`:

- reduce `InternalToolId` to `"leveling" | "regex"`;
- reduce `InternalToolCategoryId` to `"tools"`;
- remove crafting/jewel/vendor icon constants and the `build`, `tree`, `gems` entries;
- keep `internalToolCategories` as:

```ts
export const internalToolCategories = [
  { id: "tools", titleKey: "tools.category.tools" },
] as const;
```

In `Useful/index.tsx`, iterate `internalToolCategories` directly instead of a hard-coded tuple:

```tsx
{internalToolCategories.map((category) => {
  const tools = visibleInternalTools.filter(
    (tool) => tool.category === category.id,
  );
  if (tools.length === 0) return null;
  return (
    <section id={`catalog-${category.id}`} className={styles.catalogSection} key={category.id}>
      <h2>{t(category.titleKey)}</h2>
      <div className={styles.internalGrid}>
        {tools.map((tool) => <InternalToolCard key={tool.id} tool={tool} />)}
      </div>
    </section>
  );
})}
```

- [ ] **Step 4: Add the Wiki resource and knowledge category**

Extend `ResourceCategoryId` with `"knowledge"` and append:

```ts
{
  id: "poe-wiki",
  category: "knowledge",
  name: "Path of Exile Wiki",
  url: "https://www.poewiki.net/wiki/Path_of_Exile_Wiki",
  domain: "www.poewiki.net",
  icon: "https://www.poewiki.net/favicon.ico",
},
```

Append the category:

```ts
{ id: "knowledge", resourceIds: ["poe-wiki"] },
```

Add `useful.category.knowledge` and `useful.resource.poe-wiki.description` in EN/RU. Use `Knowledge base` / `База знаний` and descriptions that identify the wiki as the community-maintained reference hosted by GGG.

- [ ] **Step 5: Add the compact Labyrinth block**

Import `labyrinthLinks`, `FaKey`, and the existing `trial.png` via a static `new URL(..., import.meta.url).href`. Add a rail link to `#useful-labyrinth`, then render before external resources:

```tsx
<section id="useful-labyrinth" className={styles.catalogSection}>
  <div className={styles.sectionHeading}>
    <h2>{t("useful.labyrinth.title")}</h2>
    <p>{t("useful.labyrinth.description")}</p>
  </div>
  <div className={styles.labyrinthGrid}>
    {labyrinthLinks.map((link) => (
      <a
        className={styles.labyrinthLink}
        data-labyrinth={link.id}
        href={link.url}
        key={link.id}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t(`useful.labyrinth.${link.id}` as MessageKey)}. ${t("useful.externalLink")}`}
      >
        <span className={styles.labyrinthIcon} aria-hidden={true}>
          {link.id === "eternal" ? <img src={trialIcon} alt="" /> : <FaKey />}
        </span>
        <strong>{t(`useful.labyrinth.${link.id}` as MessageKey)}</strong>
      </a>
    ))}
  </div>
</section>
```

Add EN labels `Normal Lab`, `Cruel Lab`, `Merciless Lab`, `Uber Lab`; RU labels `Обычная лаба`, `Жестокая лаба`, `Безжалостная лаба`, `Убер-лаба`. Style a four-column compact grid, bronze/silver/gold key colors, green Uber icon, hover/focus border, and `repeat(2, minmax(0, 1fr))` below 48rem.

- [ ] **Step 6: Run tests and verify GREEN**

Run `test:i18n` and `validate:i18n`. Expected: both PASS.

- [ ] **Step 7: Commit Task 2**

Stage only Task 2 files and commit with subject:

```text
feat(useful): add PoELab and wiki references
```

### Task 3: Global Russian terminology

**Files:**
- Modify: `web/src/i18n/messages/ru.json`
- Test: `seeding/src/localization/useful-resources.test.ts`

- [ ] **Step 1: Write the failing terminology test**

Add:

```ts
test("uses build and skill-tree terminology throughout the Russian UI", () => {
  const messages = Object.values(ru as Record<string, string>).join("\n");
  assert.doesNotMatch(messages, /сборк/iu);
  assert.doesNotMatch(messages, /дерев[ео] пассив/iu);
  assert.equal(ru["nav.build"], "Билд");
  assert.equal(ru["build.importSuccess"], "Билд импортирован");
  assert.match(ru["useful.resource.timeless-jewel.description"], /дереве умений/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run `test:i18n`. Expected: FAIL listing current «Сборка», «сборку», «дереве пассивов» strings.

- [ ] **Step 3: Replace active RU terminology**

Use these exact replacements in `ru.json`:

```text
app.buildTitle: PoE Tools — Билд
nav.build: Билд
build.reset: Сбросить билд
build.import: Импортировать билд
build.importing: Импорт билда
build.importSuccess: Билд импортирован
build.importFailed: Не удалось импортировать билд
useful.resource.timeless-jewel.description: Просмотр изменений таймлесс-самоцветов на дереве умений.
useful.resource.poe-ninja.description: Цены лиги, билды и текущая мета.
```

Delete the now-unused `tools.build.*`, `tools.tree.*`, `tools.gems.*`, and `tools.category.reference` keys from both locales so exact key parity remains intact.

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run test:i18n -w seeding
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run validate:i18n
```

Expected: all tests PASS and locale parity validation exits 0.

- [ ] **Step 5: Commit Task 3**

Stage the RU/EN dictionaries and terminology test; commit with subject:

```text
fix(i18n): use build and skill tree terms
```

### Task 4: Release verification and visual QA

**Files:**
- Verify all files changed by Tasks 1-3.

- [ ] **Step 1: Run formatting/diff checks**

```bash
git diff --check
git status --short --branch
```

Expected: no whitespace errors; only intended files and pre-existing user-owned `package.json` are present.

- [ ] **Step 2: Run the complete release suite**

```bash
env COREPACK_ENABLE_PROJECT_SPEC=0 npm run verify
```

Expected: i18n tests, regex tests, data verification, TypeScript/Vite build, and bundle budget all PASS.

- [ ] **Step 3: Perform production visual QA**

Build/serve `web/dist` on a fresh localhost port and inspect:

- desktop 1440px: two internal cards, compact four-button Labyrinth grid, Wiki under Knowledge base;
- portrait 500px: no page overflow, two-column Labyrinth grid, visible icons and complete labels;
- RU locale: no «Сборка» or «Дерево пассивов» in active UI;
- search: `wiki` reveals the Wiki card; removed internal cards never appear.

- [ ] **Step 4: Review the final diff**

Check correctness, duplication, accessibility, responsive CSS, no new dependency, and verify the only PoELab URL literals are in `web/src/features/labyrinth-links.ts` plus tests/spec/docs.

- [ ] **Step 5: Commit any QA-only fixes**

If visual QA required corrections, commit only those corrections with an appropriate conventional subject and the repository-required RU body/trailers. If no corrections were required, do not create an empty commit.

- [ ] **Step 6: Merge, push, deploy, and smoke-test**

Fast-forward the verified branch into `main` without staging or overwriting the user-owned `package.json`, push `main`, run/watch `build-and-deploy.yml`, and verify the public Useful and PoELab artifacts from GitHub Pages.
